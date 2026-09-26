import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  GitFork,
  Search,
  ZoomIn,
  ZoomOut,
  Shuffle,
  Link,
  Unlink,
  Tag,
  TagX,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import { buildNoteGraph, wrapNodeText, getNodeBaseRadius, type GraphNode, type GraphEdge } from "@/lib/graphUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RelationsViewProps {
  notes: Note[];
  onSelectNote?: (id: string) => void;
  activeNoteId?: string | null;
  isMobile?: boolean;
}

/**
 * Force-directed physics step for graph simulation.
 */
function stepSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  visibleNodeMap: Map<string, boolean>,
  alpha: number,
  draggedNodeId: string | null = null
) {
  if (alpha <= 0.001 || nodes.length === 0) return;

  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 1. Repulsion between visible node pairs (Stronger for orphan nodes)
  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];
    if (visibleNodeMap.get(n1.id) === false) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      if (visibleNodeMap.get(n2.id) === false) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const distSq = Math.max(dx * dx + dy * dy, 350);
      const dist = Math.sqrt(distSq);

      const isOrphanPair = n1.degree === 0 || n2.degree === 0;
      const repFactor = isOrphanPair ? 2200 : 1350;
      const force = (alpha * repFactor) / distSq;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (draggedNodeId !== n1.id) {
        n1.vx -= fx;
        n1.vy -= fy;
      }
      if (draggedNodeId !== n2.id) {
        n2.vx += fx;
        n2.vy += fy;
      }
    }
  }

  // 2. Attraction along edges (Natural spring pull towards idealDist = 115px)
  const idealDist = 115;
  const springStrength = 0.06 * alpha;

  edges.forEach((edge) => {
    const n1 = nodeMap.get(edge.source);
    const n2 = nodeMap.get(edge.target);
    if (!n1 || !n2 || visibleNodeMap.get(n1.id) === false || visibleNodeMap.get(n2.id) === false) return;

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const displacement = dist - idealDist;
    const force = displacement * springStrength;

    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (draggedNodeId !== n1.id) {
      n1.vx += fx;
      n1.vy += fy;
    }
    if (draggedNodeId !== n2.id) {
      n2.vx -= fx;
      n2.vy -= fy;
    }
  });

  // 3. Push orphan nodes away from edge lines so they never intersect connection lines
  edges.forEach((edge) => {
    const n1 = nodeMap.get(edge.source);
    const n2 = nodeMap.get(edge.target);
    if (!n1 || !n2 || visibleNodeMap.get(n1.id) === false || visibleNodeMap.get(n2.id) === false) return;

    nodes.forEach((n) => {
      if (visibleNodeMap.get(n.id) === false || n.id === n1.id || n.id === n2.id || n.degree > 0) return;

      const segDx = n2.x - n1.x;
      const segDy = n2.y - n1.y;
      const l2 = segDx * segDx + segDy * segDy;
      if (l2 === 0) return;

      let t = ((n.x - n1.x) * segDx + (n.y - n1.y) * segDy) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = n1.x + t * segDx;
      const projY = n1.y + t * segDy;

      const dx = n.x - projX;
      const dy = n.y - projY;
      const distSq = Math.max(dx * dx + dy * dy, 150);
      if (distSq < 10000) {
        const dist = Math.sqrt(distSq);
        const lineForce = (alpha * 800) / distSq;
        const fx = (dx / dist) * lineForce;
        const fy = (dy / dist) * lineForce;

        if (draggedNodeId !== n.id) {
          n.vx += fx;
          n.vy += fy;
        }
      }
    });
  });

  // 4. Center Gravity & Damping (gentle inward pull)
  const gravity = 0.006 * alpha;
  nodes.forEach((n) => {
    if (visibleNodeMap.get(n.id) === false) return;

    if (draggedNodeId !== n.id) {
      n.vx -= n.x * gravity;
      n.vy -= n.y * gravity;

      // Friction
      n.vx *= 0.80;
      n.vy *= 0.80;

      n.x += n.vx;
      n.y += n.vy;
    } else {
      n.vx = 0;
      n.vy = 0;
    }
  });
}

export function RelationsView({
  notes,
  onSelectNote,
  activeNoteId,
  isMobile = false,
}: RelationsViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = settings?.language === "th";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showOrphans, setShowOrphans] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(activeNoteId || null);

  // Transform: Pan (x, y) and Zoom (k), with baseFitScale tracking 100% full fit scale
  const baseFitScaleRef = useRef<number>(1.0);
  const transformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1.0 });
  const targetTransformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1.0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const hasInitialCenteredRef = useRef(false);

  // Per-node hover progress for smooth hover animations
  const hoverProgressMap = useRef<Map<string, number>>(new Map());

  // Graph Simulation State
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const simAnimFrameRef = useRef<number | null>(null);
  const isDraggingCanvasRef = useRef(false);
  const isDraggingNodeRef = useRef<GraphNode | null>(null);
  const dragStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedSignificantlyRef = useRef(false);
  const simulationAlphaRef = useRef(1);

  // Animation flag from global app settings
  const enableAnimations = settings?.enableAnimations !== false;

  // Build raw graph data from notes
  const rawGraph = useMemo(() => buildNoteGraph(notes), [notes]);

  // Visible nodes filtered by orphan toggle
  const visibleNodeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    nodesRef.current.forEach((node) => {
      if (!showOrphans && node.degree === 0) {
        map.set(node.id, false);
        return;
      }
      map.set(node.id, true);
    });
    return map;
  }, [showOrphans, rawGraph]);

  const matchedNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const currentNodes = nodesRef.current.length > 0 ? nodesRef.current : rawGraph.nodes;
    return currentNodes.filter((node) => {
      if (visibleNodeMap.get(node.id) === false) return false;
      return (
        node.title.toLowerCase().includes(q) ||
        node.label.toLowerCase().includes(q) ||
        node.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, visibleNodeMap, rawGraph]);

  const searchMatchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return new Set(matchedNodes.map((n) => n.id));
  }, [searchQuery, matchedNodes]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

  useEffect(() => {
    setCurrentMatchIndex(matchedNodes.length > 0 ? 0 : -1);
  }, [searchQuery, matchedNodes.length]);

  const focusNode = useCallback(
    (nodeId: string) => {
      const currentNodes = nodesRef.current.length > 0 ? nodesRef.current : rawGraph.nodes;
      const targetNode = currentNodes.find((n) => n.id === nodeId);
      const container = containerRef.current;
      if (targetNode && container) {
        const { clientWidth, clientHeight } = container;
        const baseK = baseFitScaleRef.current > 0 ? baseFitScaleRef.current : 1.0;
        const currentK = Math.max(targetTransformRef.current.k, baseK * 1.5);
        targetTransformRef.current = {
          x: clientWidth / 2 - targetNode.x * currentK,
          y: clientHeight / 2 - targetNode.y * currentK,
          k: currentK,
        };
        if (!enableAnimations) {
          transformRef.current = { ...targetTransformRef.current };
        }
        setZoomLevel(currentK / baseK);
        setSelectedNodeId(nodeId);
      }
    },
    [enableAnimations, rawGraph.nodes]
  );

  const handleNextMatch = useCallback(() => {
    if (matchedNodes.length === 0) return;
    const nextIdx = currentMatchIndex < 0 ? 0 : (currentMatchIndex + 1) % matchedNodes.length;
    setCurrentMatchIndex(nextIdx);
    focusNode(matchedNodes[nextIdx].id);
  }, [matchedNodes, currentMatchIndex, focusNode]);

  const handlePrevMatch = useCallback(() => {
    if (matchedNodes.length === 0) return;
    const prevIdx = currentMatchIndex <= 0 ? matchedNodes.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIdx);
    focusNode(matchedNodes[prevIdx].id);
  }, [matchedNodes, currentMatchIndex, focusNode]);

  // Center Graph with automatic bounding-box fitting (100% fits entire graph neatly into viewport)
  const centerGraph = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { clientWidth, clientHeight } = container;
    if (clientWidth <= 10 || clientHeight <= 10) return;

    const currentNodes = nodesRef.current.length > 0 ? nodesRef.current : rawGraph.nodes;
    const visibleNodes = currentNodes.filter((n) => visibleNodeMap.get(n.id) !== false);

    if (visibleNodes.length === 0) {
      baseFitScaleRef.current = 1.0;
      targetTransformRef.current = { x: clientWidth / 2, y: clientHeight / 2, k: 1.0 };
      if (!enableAnimations) {
        transformRef.current = { x: clientWidth / 2, y: clientHeight / 2, k: 1.0 };
      }
      setZoomLevel(1);
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visibleNodes.forEach((n) => {
      if (isNaN(n.x) || isNaN(n.y)) return;
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      baseFitScaleRef.current = 1.0;
      targetTransformRef.current = { x: clientWidth / 2, y: clientHeight / 2, k: 1.0 };
      if (!enableAnimations) {
        transformRef.current = { x: clientWidth / 2, y: clientHeight / 2, k: 1.0 };
      }
      setZoomLevel(1);
      return;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const graphW = Math.max(maxX - minX, 100);
    const graphH = Math.max(maxY - minY, 100);

    // Padding around graph (e.g. 70px) so nodes on boundaries don't touch viewport edges
    const padding = 70;
    const availW = Math.max(clientWidth - padding * 2, 100);
    const availH = Math.max(clientHeight - padding * 2, 100);

    const fitScale = Math.min(availW / graphW, availH / graphH);
    const fitK = Math.max(0.1, Math.min(1.5, fitScale));

    baseFitScaleRef.current = fitK;

    targetTransformRef.current = {
      x: clientWidth / 2 - cx * fitK,
      y: clientHeight / 2 - cy * fitK,
      k: fitK,
    };

    if (!enableAnimations || transformRef.current.x === 0) {
      transformRef.current = { ...targetTransformRef.current };
    }
    setZoomLevel(1);
  }, [visibleNodeMap, rawGraph.nodes, enableAnimations]);

  // Sync / Initialize nodes and positions preserving existing coordinates
  useEffect(() => {
    const existingMap = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    nodesRef.current.forEach((n) => {
      if (!isNaN(n.x) && !isNaN(n.y)) {
        existingMap.set(n.id, { x: n.x, y: n.y, vx: n.vx || 0, vy: n.vy || 0 });
      }
    });

    const isInitial = existingMap.size === 0;

    const updatedNodes = rawGraph.nodes.map((n) => {
      const prev = existingMap.get(n.id);
      if (prev) {
        return { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy };
      }
      return { ...n };
    });

    nodesRef.current = updatedNodes;
    edgesRef.current = rawGraph.edges;

    if (isInitial) {
      const vMap = new Map<string, boolean>();
      updatedNodes.forEach((n) => vMap.set(n.id, true));

      if (enableAnimations) {
        for (let step = 0; step < 5; step++) {
          stepSimulation(updatedNodes, rawGraph.edges, vMap, 1.0);
        }
        simulationAlphaRef.current = 1.0;
      } else {
        // When animations disabled, stabilize instantly
        let warmupAlpha = 1.0;
        for (let step = 0; step < 100; step++) {
          stepSimulation(updatedNodes, rawGraph.edges, vMap, warmupAlpha);
          warmupAlpha *= 0.95;
        }
        simulationAlphaRef.current = 0;
      }
    } else {
      simulationAlphaRef.current = enableAnimations ? 0.6 : 0;
    }

    if (!hasInitialCenteredRef.current) {
      hasInitialCenteredRef.current = true;
      centerGraph();
      const timer = setTimeout(() => {
        centerGraph();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [rawGraph, centerGraph, enableAnimations]);

  // Auto-centering via ResizeObserver on initial mount once container size becomes valid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          if (!hasInitialCenteredRef.current) {
            hasInitialCenteredRef.current = true;
            centerGraph();
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [centerGraph]);

  // When activeNoteId changes, select node
  useEffect(() => {
    if (activeNoteId) {
      setSelectedNodeId(activeNoteId);
    }
  }, [activeNoteId]);

  // Keyboard shortcut (Ctrl+F, Cmd+F, Ctrl+K, Cmd+K) to open and focus search when in Relations view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const code = e.code;

      if (isCmdOrCtrl && !e.shiftKey && (key === "f" || key === "k" || key === "า" || key === "ด" || code === "KeyF" || code === "KeyK")) {
        const active = document.activeElement;
        const isEditing =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";

        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          setIsSearchOpen(true);
          setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
          }, 50);
        }
      }
    };

    const handleFocusSearchEvent = () => {
      setIsSearchOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("luno:focus-relations-search", handleFocusSearchEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("luno:focus-relations-search", handleFocusSearchEvent);
    };
  }, []);

  // Zoom controls
  const handleZoom = useCallback((factor: number) => {
    const container = containerRef.current;
    if (!container) return;
    const { clientWidth, clientHeight } = container;
    const cx = clientWidth / 2;
    const cy = clientHeight / 2;
    const current = targetTransformRef.current.k > 0 ? targetTransformRef.current : transformRef.current;
    const baseK = baseFitScaleRef.current > 0 ? baseFitScaleRef.current : 1.0;
    const minK = 0.08 * baseK;
    const maxK = 35.0 * baseK;
    const newK = Math.max(minK, Math.min(maxK, current.k * factor));

    const newX = cx - (cx - current.x) * (newK / current.k);
    const newY = cy - (cy - current.y) * (newK / current.k);

    targetTransformRef.current = { x: newX, y: newY, k: newK };
    if (!enableAnimations) {
      transformRef.current = { x: newX, y: newY, k: newK };
    }
    setZoomLevel(newK / baseK);
  }, [enableAnimations]);

  // Reheat physics simulation & rearrange layout
  const handleRearrange = useCallback(() => {
    simulationAlphaRef.current = 1.0;
    centerGraph();
  }, [centerGraph]);

  // Main Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width > 0 && height > 0) {
        const targetW = Math.round(width * dpr);
        const targetH = Math.round(height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }

      const ctx = canvas.getContext("2d");
      if (!ctx || width <= 0 || height <= 0) {
        simAnimFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Default transform fallback to screen center if at (0, 0)
      if (transformRef.current.x === 0 && transformRef.current.y === 0) {
        const baseK = baseFitScaleRef.current > 0 ? baseFitScaleRef.current : 1.0;
        transformRef.current = { x: width / 2, y: height / 2, k: baseK };
        targetTransformRef.current = { x: width / 2, y: height / 2, k: baseK };
      }

      // Smooth camera interpolation when animations enabled
      if (enableAnimations && !isDraggingCanvasRef.current && !isDraggingNodeRef.current) {
        const t = transformRef.current;
        const target = targetTransformRef.current;
        const dx = target.x - t.x;
        const dy = target.y - t.y;
        const dk = target.k - t.k;
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3 || Math.abs(dk) > 0.001) {
          t.x += dx * 0.16;
          t.y += dy * 0.16;
          t.k += dk * 0.16;
        } else {
          t.x = target.x;
          t.y = target.y;
          t.k = target.k;
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Physics Simulation Step
      if (simulationAlphaRef.current > 0.003) {
        stepSimulation(
          nodesRef.current,
          edgesRef.current,
          visibleNodeMap,
          simulationAlphaRef.current,
          isDraggingNodeRef.current?.id || null
        );
        simulationAlphaRef.current *= enableAnimations ? 0.982 : 0.92;
      }

      // Read Theme Accent Color dynamically from computed CSS variables
      // Read Theme Accent & Background Colors dynamically from computed CSS variables
      const isDark = document.documentElement.classList.contains("dark") || settings?.colorScheme === "dark";
      const rawPrimary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "174 62% 39%";
      const accentHsl = `hsl(${rawPrimary})`;
      const accentEdge = `hsla(${rawPrimary} / 0.85)`;
      const rawBg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
      const canvasBg = rawBg ? `hsl(${rawBg})` : isDark ? "#090d16" : "#ffffff";

      // Drawing Graph
      const { x: panX, y: panY, k } = transformRef.current;
      ctx.translate(panX, panY);
      ctx.scale(k, k);

      // Determine active highlight state
      const hoveredNode = hoveredNodeId ? nodesRef.current.find((n) => n.id === hoveredNodeId) : null;
      const hoveredNeighbors = hoveredNode ? hoveredNode.connectionIds : null;

      const currentNodes = nodesRef.current.length > 0 ? nodesRef.current : rawGraph.nodes;
      const visibleNodesCount = currentNodes.filter((n) => visibleNodeMap.get(n.id) !== false).length;
      const baseK = baseFitScaleRef.current > 0 ? baseFitScaleRef.current : 1.0;
      const currentZoomRatio = k / baseK;
      // Smooth sub-linear zoom growth factor so nodes stay sleek while scaling gracefully at deep zoom
      const zoomGrowthFactor = Math.max(0.85, Math.min(3.2, Math.pow(Math.max(0.2, currentZoomRatio), 0.25)));

      // Draw Edges (Trimmed to node borders so lines never pass inside node bodies)
      const nodeMap = new Map<string, GraphNode>();
      nodesRef.current.forEach((n) => nodeMap.set(n.id, n));

      edgesRef.current.forEach((edge) => {
        const n1 = nodeMap.get(edge.source);
        const n2 = nodeMap.get(edge.target);
        if (!n1 || !n2 || visibleNodeMap.get(n1.id) === false || visibleNodeMap.get(n2.id) === false) return;

        const isHighlighted =
          hoveredNode &&
          (edge.source === hoveredNode.id || edge.target === hoveredNode.id);

        const isDimmed = hoveredNode && !isHighlighted;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const r1 = (getNodeBaseRadius(n1.degree) * zoomGrowthFactor) / k;
        const r2 = (getNodeBaseRadius(n2.degree) * zoomGrowthFactor) / k;

        // Draw only the visible segment between the two node perimeters
        if (dist > r1 + r2) {
          const sx = n1.x + (dx / dist) * r1;
          const sy = n1.y + (dy / dist) * r1;
          const ex = n2.x - (dx / dist) * r2;
          const ey = n2.y - (dy / dist) * r2;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);

          if (isHighlighted) {
            ctx.strokeStyle = accentEdge;
            ctx.lineWidth = 0.85 / k;
          } else if (isDimmed) {
            ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)";
            ctx.lineWidth = 0.55 / k;
          } else {
            ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.09)";
            ctx.lineWidth = 0.75 / k;
          }
          ctx.stroke();
        }
      });

      // Draw Nodes
      // Obsidian-style zoom-based label visibility: hide labels on full graph zoom-out with many nodes, show when zoomed in
      const isZoomedInEnough = currentZoomRatio >= 1.35 || (visibleNodesCount <= 20 && currentZoomRatio >= 0.9);

      currentNodes.forEach((node) => {
        if (visibleNodeMap.get(node.id) === false) return;

        const isHovered = node.id === hoveredNodeId;
        const isNeighbor = hoveredNeighbors ? hoveredNeighbors.has(node.id) : false;
        const isSearchMatched = searchMatchedNodeIds ? searchMatchedNodeIds.has(node.id) : true;
        const isSelected = node.id === selectedNodeId;

        const isHighlighted = isHovered || isNeighbor;
        const isDimmed =
          !isHighlighted &&
          Boolean(
            (hoveredNode && node.id !== hoveredNode.id) ||
            (searchMatchedNodeIds && !isSearchMatched)
          );

        // Smooth per-node hover progress interpolation
        const targetProgress = isHovered ? 1.0 : 0.0;
        let currentProgress = hoverProgressMap.current.get(node.id) ?? 0.0;
        if (enableAnimations) {
          currentProgress += (targetProgress - currentProgress) * 0.22;
        } else {
          currentProgress = targetProgress;
        }
        hoverProgressMap.current.set(node.id, currentProgress);

        const rScreen = getNodeBaseRadius(node.degree) * zoomGrowthFactor;
        const radiusWorld = (rScreen * (1 + currentProgress * 0.35)) / k;

        // 1. Solid Background Mask (Prevents ANY background/connection lines from shining through)
        ctx.beginPath();
        ctx.arc(node.x, node.y, radiusWorld, 0, Math.PI * 2);
        ctx.fillStyle = canvasBg;
        ctx.fill();

        // 2. Main Node Circle (Clean borderless antialiased circle, pure Obsidian style)
        ctx.beginPath();
        ctx.arc(node.x, node.y, radiusWorld, 0, Math.PI * 2);

        if (isDimmed) {
          ctx.fillStyle = isDark ? "rgba(113, 113, 122, 0.2)" : "rgba(148, 163, 184, 0.2)";
        } else if (isHighlighted || isSelected) {
          ctx.fillStyle = accentHsl; // Dynamic Accent color on hover/selected
        } else {
          // Soft refined mineral graphite gray in light mode, clean light slate in dark mode
          ctx.fillStyle = isDark ? "#94a3b8" : "#5a606d";
        }
        ctx.fill();
        // Notice: No border/stroke outline on hover or normal, ensuring 100% borderless clean look

        // 3. Draw Labels (Clean typography, scales smoothly with zoom like Obsidian)
        const shouldShowLabel =
          isHighlighted ||
          isSelected ||
          (searchMatchedNodeIds && isSearchMatched) ||
          (showLabels && isZoomedInEnough);

        if (shouldShowLabel) {
          const screenFontSize = Math.min(26.0, Math.max(11.0, 11.0 + Math.log2(Math.max(1, currentZoomRatio)) * 2.6));
          const worldFontSize = screenFontSize / k;
          ctx.font = `400 ${worldFontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          // Smooth label gap expansion on hover & zoom
          const labelGapScreen = Math.min(14, 4.5 + Math.log2(Math.max(1, currentZoomRatio)) * 1.5 + currentProgress * 3.5);
          const labelGapWorld = labelGapScreen / k;
          const textY = node.y + radiusWorld + labelGapWorld;
          const maxLabelWidthScreen = Math.min(360, 140 + Math.log2(Math.max(1, currentZoomRatio)) * 36);
          const maxLabelWidthWorld = maxLabelWidthScreen / k;
          const lines = wrapNodeText(ctx, node.label, maxLabelWidthWorld, 2);
          const lineHeightWorld = worldFontSize * 1.24;

          if (isDimmed) {
            ctx.fillStyle = isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(100, 116, 139, 0.25)";
          } else if (isHighlighted || isSelected) {
            ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
          } else {
            ctx.fillStyle = isDark ? "rgba(241, 245, 249, 0.92)" : "#475569";
          }

          lines.forEach((line, idx) => {
            ctx.fillText(line, node.x, textY + idx * lineHeightWorld);
          });
        }
      });

      ctx.restore();

      simAnimFrameRef.current = requestAnimationFrame(render);
    };

    simAnimFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (simAnimFrameRef.current) {
        cancelAnimationFrame(simAnimFrameRef.current);
      }
    };
  }, [visibleNodeMap, hoveredNodeId, selectedNodeId, searchMatchedNodeIds, showLabels, settings?.colorScheme, rawGraph]);

  // Mouse / Pointer Event Handlers
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current || containerRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = screenX - rect.left;
    const py = screenY - rect.top;
    const { x, y, k } = transformRef.current;
    return {
      x: (px - x) / k,
      y: (py - y) / k,
    };
  }, []);

  const findNodeAtPosition = useCallback(
    (screenX: number, screenY: number): GraphNode | null => {
      const canvas = canvasRef.current || containerRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = screenX - rect.left;
      const py = screenY - rect.top;
      const { x: panX, y: panY, k } = transformRef.current;
      if (k <= 0) return null;

      const currentNodes = nodesRef.current.length > 0 ? nodesRef.current : rawGraph.nodes;
      const baseK = baseFitScaleRef.current > 0 ? baseFitScaleRef.current : 1.0;
      const currentZoomRatio = k / baseK;
      const zoomGrowthFactor = Math.max(0.85, Math.min(3.2, Math.pow(Math.max(0.2, currentZoomRatio), 0.25)));

      // Step 1: Check node circle hits directly in SCREEN PIXELS.
      // Pick the node whose circle center is closest to the cursor within its hit radius.
      let closestNode: GraphNode | null = null;
      let minCircleDist = Infinity;

      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        if (visibleNodeMap.get(node.id) === false) continue;

        const screenNodeX = node.x * k + panX;
        const screenNodeY = node.y * k + panY;
        const dist = Math.hypot(px - screenNodeX, py - screenNodeY);

        const rScreen = getNodeBaseRadius(node.degree) * zoomGrowthFactor;
        // Generous screen hit radius: node radius + 6px (minimum 13px for effortless targeting)
        const hitRadiusScreen = Math.max(rScreen + 6, 13);

        if (dist <= hitRadiusScreen && dist < minCircleDist) {
          minCircleDist = dist;
          closestNode = node;
        }
      }

      if (closestNode) {
        return closestNode;
      }

      // Step 2: Only if no node circle was hit, check if mouse is on a currently-visible text label
      const visibleNodesCount = currentNodes.filter((n) => visibleNodeMap.get(n.id) !== false).length;
      const isZoomedInEnough = currentZoomRatio >= 1.35 || (visibleNodesCount <= 20 && currentZoomRatio >= 0.9);

      let closestLabelNode: GraphNode | null = null;
      let minLabelDist = Infinity;

      const screenFontSize = Math.min(26.0, Math.max(11.0, 11.0 + Math.log2(Math.max(1, currentZoomRatio)) * 2.6));

      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        if (visibleNodeMap.get(node.id) === false) continue;

        const isLabelVisible =
          (searchMatchedNodeIds && searchMatchedNodeIds.has(node.id)) ||
          node.id === selectedNodeId ||
          (showLabels && isZoomedInEnough);

        if (!isLabelVisible) continue;

        const screenNodeX = node.x * k + panX;
        const screenNodeY = node.y * k + panY;
        const rScreen = getNodeBaseRadius(node.degree) * zoomGrowthFactor;

        // Label box in screen pixels
        const labelHalfWidthScreen = Math.min(180, (node.label.length * (screenFontSize * 0.6)) / 2 + 8);
        const labelTopScreen = screenNodeY + rScreen + 2;
        const labelBottomScreen = labelTopScreen + screenFontSize * 1.35;

        if (
          Math.abs(px - screenNodeX) <= labelHalfWidthScreen &&
          py >= labelTopScreen &&
          py <= labelBottomScreen
        ) {
          const dist = Math.hypot(px - screenNodeX, py - (labelTopScreen + screenFontSize * 0.5));
          if (dist < minLabelDist) {
            minLabelDist = dist;
            closestLabelNode = node;
          }
        }
      }

      return closestLabelNode;
    },
    [visibleNodeMap, rawGraph.nodes, showLabels, searchMatchedNodeIds, selectedNodeId]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return; // Only left click

      dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
      hasMovedSignificantlyRef.current = false;

      const hitNode = findNodeAtPosition(e.clientX, e.clientY);
      if (hitNode) {
        isDraggingNodeRef.current = hitNode;
        isDraggingCanvasRef.current = false;
        simulationAlphaRef.current = 0.8;
      } else {
        isDraggingNodeRef.current = null;
        isDraggingCanvasRef.current = true;
      }
    },
    [findNodeAtPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const dx = e.clientX - dragStartMouseRef.current.x;
      const dy = e.clientY - dragStartMouseRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedSignificantlyRef.current = true;
      }

      if (isDraggingNodeRef.current) {
        const { x: wx, y: wy } = screenToWorld(e.clientX, e.clientY);
        isDraggingNodeRef.current.x = wx;
        isDraggingNodeRef.current.y = wy;
        simulationAlphaRef.current = 0.5;
        return;
      }

      if (isDraggingCanvasRef.current) {
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        targetTransformRef.current.x = transformRef.current.x;
        targetTransformRef.current.y = transformRef.current.y;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Hover detection
      const hitNode = findNodeAtPosition(e.clientX, e.clientY);
      setHoveredNodeId(hitNode ? hitNode.id : null);
    },
    [screenToWorld, findNodeAtPosition]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!hasMovedSignificantlyRef.current && isDraggingNodeRef.current) {
        const clickedNode = isDraggingNodeRef.current;
        setSelectedNodeId(clickedNode.id);
        onSelectNote?.(clickedNode.id);
      }

      isDraggingNodeRef.current = null;
      isDraggingCanvasRef.current = false;
    },
    [onSelectNote]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const targetElement = canvasRef.current || containerRef.current;
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = Math.exp(-e.deltaY * 0.0015);
      const current = transformRef.current;
      const baseK = baseFitScaleRef.current > 0 ? baseFitScaleRef.current : 1.0;
      const minK = 0.08 * baseK;
      const maxK = 35.0 * baseK;
      const newK = Math.max(minK, Math.min(maxK, current.k * zoomFactor));

      const newX = mouseX - (mouseX - current.x) * (newK / current.k);
      const newY = mouseY - (mouseY - current.y) * (newK / current.k);

      transformRef.current = { x: newX, y: newY, k: newK };
      targetTransformRef.current = { x: newX, y: newY, k: newK };
      setZoomLevel(newK / baseK);
    },
    []
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex-1 w-full h-full min-h-0 min-w-0 bg-background overflow-hidden select-none flex flex-col">
        {/* Top Breadcrumb Toolbar (Matching Editor Breadcrumb Style) */}
        <div className="flex items-center justify-between bg-background px-3.5 h-[34px] text-[12px] leading-tight text-muted-foreground select-none min-w-0 w-full gap-2 border-b border-border/40 shrink-0">
          {/* Left: Breadcrumb Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden py-0.5">
            <span className="font-semibold text-foreground truncate min-w-0 px-0.5 leading-none flex items-center gap-1.5 text-xs">
              <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{t("relations.title") || (isTh ? "ความสัมพันธ์" : "Relations")}</span>
            </span>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search Button with Floating Popover Menu */}
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span className="sr-only">{t("sidebar.searchShortPlaceholder") || (isTh ? "ค้นหา" : "Search")}</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("sidebar.searchShortPlaceholder") || (isTh ? "ค้นหา" : "Search")}
                </TooltipContent>
              </Tooltip>

              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-64 sm:w-72 p-2 rounded-2xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md select-text"
              >
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 border border-border/60 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    data-relations-search="true"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handlePrevMatch();
                        } else {
                          handleNextMatch();
                        }
                      } else if (e.key === "Escape") {
                        if (searchQuery) {
                          setSearchQuery("");
                        } else {
                          setIsSearchOpen(false);
                        }
                      }
                    }}
                    placeholder={t("sidebar.searchPlaceholder") || (isTh ? "ค้นหาโน้ต..." : "Search notes...")}
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-normal"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {searchQuery.trim() && (
                  <div className="mt-2 px-1 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-1.5">
                    <span>
                      {matchedNodes.length > 0
                        ? isTh
                          ? `พบ ${matchedNodes.length} โน้ต${currentMatchIndex >= 0 ? ` (${currentMatchIndex + 1}/${matchedNodes.length})` : ""}`
                          : `Found ${matchedNodes.length} matching ${matchedNodes.length === 1 ? "note" : "notes"}${currentMatchIndex >= 0 ? ` (${currentMatchIndex + 1}/${matchedNodes.length})` : ""}`
                        : isTh
                        ? "ไม่พบโน้ตที่ตรงกัน"
                        : "No matching notes"}
                    </span>
                    {matchedNodes.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={handlePrevMatch}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                              <span className="sr-only">Previous note</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {isTh ? "โน้ตก่อนหน้า (Shift+Enter)" : "Previous match (Shift+Enter)"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={handleNextMatch}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span className="sr-only">Next note</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {isTh ? "โน้ตถัดไป (Enter)" : "Next match (Enter)"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <div className="h-3.5 w-[1px] bg-border/60 mx-0.5" />

            {/* Toggle Orphan Nodes (Link / Unlink) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOrphans((prev) => !prev)}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                >
                  {showOrphans ? (
                    <Unlink className="h-3.5 w-3.5" />
                  ) : (
                    <Link className="h-3.5 w-3.5" />
                  )}
                  <span className="sr-only">
                    {showOrphans
                      ? (t("relations.hideOrphans") || (isTh ? "ซ่อนโน้ตที่ไม่มีลิงก์" : "Hide unlinked notes"))
                      : (t("relations.showOrphans") || (isTh ? "แสดงโน้ตทั้งหมด" : "Show all notes"))}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showOrphans
                  ? (t("relations.hideOrphans") || (isTh ? "ซ่อนโน้ตที่ไม่มีลิงก์" : "Hide unlinked notes"))
                  : (t("relations.showOrphans") || (isTh ? "แสดงโน้ตทั้งหมด" : "Show all notes"))}
              </TooltipContent>
            </Tooltip>

            {/* Toggle Labels (Tag / TagX) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLabels((prev) => !prev)}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                >
                  {showLabels ? (
                    <TagX className="h-3.5 w-3.5" />
                  ) : (
                    <Tag className="h-3.5 w-3.5" />
                  )}
                  <span className="sr-only">
                    {showLabels
                      ? (t("relations.hideLabels") || (isTh ? "ซ่อนชื่อโน้ต" : "Hide labels"))
                      : (t("relations.showLabels") || (isTh ? "แสดงชื่อโน้ต" : "Show labels"))}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showLabels
                  ? (t("relations.hideLabels") || (isTh ? "ซ่อนชื่อโน้ต" : "Hide labels"))
                  : (t("relations.showLabels") || (isTh ? "แสดงชื่อโน้ต" : "Show labels"))}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Canvas Workspace Area */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full h-full min-h-0 min-w-0 bg-background overflow-hidden"
        >
          {/* Empty State when no notes */}
          {rawGraph.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground gap-2">
              <GitFork className="h-10 w-10 opacity-30 text-primary" />
              <p className="text-sm font-medium">{isTh ? "ยังไม่มีโน้ตในพื้นที่ทำงาน" : "No notes in workspace"}</p>
              <p className="text-xs text-muted-foreground/80 max-w-sm text-center">
                {isTh
                  ? "สร้างโน้ตและเชื่อมโยงด้วย [[ชื่อโน้ต]] เพื่อดูความสัมพันธ์"
                  : "Create notes and link them using [[Note Title]] to visualize relationships."}
              </p>
            </div>
          )}

          {/* Interactive Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onDoubleClick={centerGraph}
            className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
            style={{ touchAction: "none" }}
          />
        </div>

        {/* Bottom Status Bar (Matching Image Preview & Editor Bottom Bar) */}
        <div className="flex h-7 w-full min-w-0 shrink-0 items-center justify-between border-t border-border/60 bg-card/60 dark:bg-card/40 px-3 text-[11px] text-muted-foreground select-none overflow-hidden">
          {/* Left side: Notes count | Links count | Hint */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
              {rawGraph.nodes.length} {t("relations.notes") || (isTh ? "โน้ต" : "notes")}
            </span>

            <div className="h-3 w-[1px] bg-border/60" />

            <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
              {rawGraph.edges.length} {t("relations.connections") || (isTh ? "ความสัมพันธ์" : "links")}
            </span>

            <div className="h-3 w-[1px] bg-border/60 hidden sm:block" />

            <span className="hidden sm:inline text-muted-foreground/70">
              {isTh
                ? "เลื่อนเมาส์เพื่อซูม • ลากเพื่อเลื่อน • กดที่โน้ตเพื่อเปิด"
                : "Scroll to zoom • Drag to pan • Click node to open note"}
            </span>
          </div>

          {/* Right side: Zoom Out | % / Reset | Zoom In | Fit */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Zoom Out button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleZoom(0.8)}
                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                  <span className="sr-only">{isTh ? "ซูมออก" : "Zoom Out"}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{isTh ? "ซูมออก" : "Zoom out"}</TooltipContent>
            </Tooltip>

            {/* Zoom Level / Reset Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={centerGraph}
                  className="tabular-nums font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isTh ? "จัดกึ่งกลาง / รีเซ็ต (100%)" : "Reset Zoom & Center"}
              </TooltipContent>
            </Tooltip>

            {/* Zoom In button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleZoom(1.25)}
                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  <span className="sr-only">{isTh ? "ซูมเข้า" : "Zoom In"}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{isTh ? "ซูมเข้า" : "Zoom in"}</TooltipContent>
            </Tooltip>

            <div className="h-3 w-[1px] bg-border/60 mx-0.5" />

            {/* Rearrange / Re-simulate Physics button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleRearrange}
                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span className="sr-only">{isTh ? "จัดเรียงกราฟใหม่" : "Rearrange graph"}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{isTh ? "จัดเรียงกราฟใหม่" : "Rearrange graph"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default React.memo(RelationsView);


