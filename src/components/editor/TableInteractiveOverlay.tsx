import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  Check,
  ChevronUp,
  ChevronDown,
  Plus,
  Eraser,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Table as TableIcon,
  Copy,
  ChevronRight,
  Columns,
  Layers,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteRowIcon } from "@/components/icons/DeleteRowIcon";
import { DeleteColumnIcon } from "@/components/icons/DeleteColumnIcon";
import { DeleteTableIcon } from "@/components/icons/DeleteTableIcon";

export function TableInteractiveOverlay({ editor }: { editor: TiptapEditor }) {
  const { t } = useTranslation();
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [cellRect, setCellRect] = useState<DOMRect | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [duplicateSubmenuOpen, setDuplicateSubmenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasScrollable = el.scrollHeight > el.clientHeight;
    setCanScrollUp(hasScrollable && el.scrollTop > 2);
    setCanScrollDown(hasScrollable && el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  const startAutoScroll = useCallback((direction: "up" | "down") => {
    stopAutoScroll();
    const step = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTop += direction === "up" ? -12 : 12;
      checkScroll();
    };
    step();
    scrollIntervalRef.current = setInterval(step, 30);
  }, [checkScroll, stopAutoScroll]);

  const scrollMenu = useCallback((direction: "up" | "down") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = direction === "up" ? -100 : 100;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(checkScroll, 150);
  }, [checkScroll]);

  useEffect(() => {
    if (menuOpen) {
      setTimeout(checkScroll, 50);
    } else {
      stopAutoScroll();
      setCanScrollUp(false);
      setCanScrollDown(false);
    }
  }, [menuOpen, duplicateSubmenuOpen, checkScroll, stopAutoScroll]);

  useEffect(() => {
    if (!menuOpen) {
      setDuplicateSubmenuOpen(false);
    }
  }, [menuOpen]);

  // Click / Tap outside to dismiss popover menu
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [menuOpen]);

  const updatePositions = useCallback(() => {
    if (!editor || editor.isDestroyed || !editor.isActive("table")) {
      setTableRect((prev) => (prev !== null ? null : prev));
      setCellRect((prev) => (prev !== null ? null : prev));
      return;
    }

    try {
      const { selection } = editor.state;
      const domAtPos = editor.view.domAtPos(selection.from);
      let node: Node | null = domAtPos.node;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      const tableEl = (node as HTMLElement)?.closest?.("table") as HTMLElement | null;

      if (!tableEl) {
        setCellRect((prev) => (prev !== null ? null : prev));
        setTableRect((prev) => (prev !== null ? null : prev));
        return;
      }

      setTableRect(tableEl.getBoundingClientRect());

      // Check if multiple cells are selected (.selectedCell)
      const selectedCells = tableEl.querySelectorAll("td.selectedCell, th.selectedCell");

      if (selectedCells.length > 0) {
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        selectedCells.forEach((cell) => {
          const r = cell.getBoundingClientRect();
          if (r.top < minTop) minTop = r.top;
          if (r.left < minLeft) minLeft = r.left;
          if (r.right > maxRight) maxRight = r.right;
          if (r.bottom > maxBottom) maxBottom = r.bottom;
        });

        setCellRect(new DOMRect(minLeft, minTop, maxRight - minLeft, maxBottom - minTop));
      } else {
        const cellEl = (node as HTMLElement)?.closest?.("td, th") as HTMLElement | null;
        if (cellEl) {
          setCellRect(cellEl.getBoundingClientRect());
        } else {
          setCellRect((prev) => (prev !== null ? null : prev));
        }
      }
    } catch {
      setCellRect((prev) => (prev !== null ? null : prev));
      setTableRect((prev) => (prev !== null ? null : prev));
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    updatePositions();

    const handleSelectionUpdate = () => updatePositions();
    const handleTransaction = () => {
      if (editor.isActive("table")) {
        updatePositions();
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleTransaction);
    window.addEventListener("scroll", handleSelectionUpdate, true);
    window.addEventListener("resize", handleSelectionUpdate);

    return () => {
      if (!editor.isDestroyed) {
        editor.off("selectionUpdate", handleSelectionUpdate);
        editor.off("transaction", handleTransaction);
      }
      window.removeEventListener("scroll", handleSelectionUpdate, true);
      window.removeEventListener("resize", handleSelectionUpdate);
    };
  }, [editor, updatePositions]);

  let isMultiSelection = false;
  try {
    if (editor && !editor.isDestroyed && tableRect) {
      const { selection } = editor.state;
      const domAtPos = editor.view.domAtPos(selection.from);
      let node: Node | null = domAtPos.node;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      const tableEl = (node as HTMLElement)?.closest?.("table") as HTMLElement | null;
      if (tableEl) {
        isMultiSelection = tableEl.querySelectorAll("td.selectedCell, th.selectedCell").length > 1;
      }
    }
  } catch {
    // fallback
  }

  const canMerge = editor?.can()?.mergeCells();
  const canSplit = editor?.can()?.splitCell();

  const items = useMemo(() => {
    if (!editor || editor.isDestroyed) return [];
    return [
      {
        id: "toggleHeaderRow",
        label: t("editor.toggleHeaderRow"),
        icon: <TableIcon className="h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().toggleHeaderRow().run(),
      },
      {
        id: "toggleHeaderColumn",
        label: t("editor.toggleHeaderColumn"),
        icon: <Columns className="h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().toggleHeaderColumn().run(),
      },
      ...(isMultiSelection || canMerge
        ? [
            {
              id: "mergeCells",
              label: t("editor.mergeCells"),
              icon: <Layers className="h-4 w-4 shrink-0" />,
              action: () => editor.chain().focus().mergeCells().run(),
            },
          ]
        : []),
      ...(canSplit
        ? [
            {
              id: "splitCell",
              label: t("editor.splitCell"),
              icon: <Layers className="h-4 w-4 shrink-0" />,
              action: () => editor.chain().focus().splitCell().run(),
            },
          ]
        : []),
      {
        id: "addColumnBefore",
        label: t("editor.addColumnLeft"),
        icon: <ArrowLeft className="h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addColumnBefore().run(),
      },
      {
        id: "addColumnAfter",
        label: t("editor.addColumnRight"),
        icon: <ArrowRight className="h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addColumnAfter().run(),
      },
      {
        id: "addRowBefore",
        label: t("editor.addRowAbove"),
        icon: <ArrowUp className="h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addRowBefore().run(),
      },
      {
        id: "addRowAfter",
        label: t("editor.addRowBelow"),
        icon: <ArrowDown className="h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addRowAfter().run(),
      },
      {
        id: "clearContents",
        label: t("editor.clearContents"),
        icon: <Eraser className="h-4 w-4 shrink-0" />,
        action: () => {
          const { state, view } = editor;
          if (!state.selection.empty) {
            editor.chain().focus().deleteSelection().run();
            return;
          }
          const $from = state.selection.$from;
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
              const start = $from.start(d);
              const end = $from.end(d);
              const paragraph = state.schema.nodes.paragraph?.create();
              if (paragraph) {
                view.dispatch(state.tr.replaceWith(start, end, paragraph));
                editor.commands.focus(start + 1);
              }
              return;
            }
          }
        },
      },
      {
        id: "deleteRow",
        label: t("editor.deleteRow"),
        icon: <DeleteRowIcon className="h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteRow().run(),
      },
      {
        id: "deleteColumn",
        label: t("editor.deleteColumn"),
        icon: <DeleteColumnIcon className="h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteColumn().run(),
      },
      {
        id: "deleteTable",
        label: t("editor.deleteTable"),
        icon: <DeleteTableIcon className="h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteTable().run(),
      },
    ];
  }, [editor, isMultiSelection, canMerge, canSplit, t]);

  const duplicateActiveRow = useCallback(() => {
    const { state, view } = editor;
    const $from = state.selection.$from;
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type.name === "tableRow") {
        const rowAfterPos = $from.after(d);
        const clonedRow = node.type.create(node.attrs, node.content, node.marks);
        view.dispatch(state.tr.insert(rowAfterPos, clonedRow));
        editor.commands.focus();
        return;
      }
    }
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const duplicateActiveColumn = useCallback(() => {
    const { state, view } = editor;
    const $from = state.selection.$from;
    let tableDepth = -1;
    let cellDepth = -1;
    for (let d = $from.depth; d > 0; d--) {
      const name = $from.node(d).type.name;
      if ((name === "tableCell" || name === "tableHeader") && cellDepth === -1) {
        cellDepth = d;
      }
      if (name === "table") {
        tableDepth = d;
        break;
      }
    }
    if (tableDepth > 0 && cellDepth > 0) {
      const rowDepth = cellDepth - 1;
      const colIndex = $from.index(rowDepth);
      const tableNode = $from.node(tableDepth);
      const tableStart = $from.start(tableDepth);
      let tr = state.tr;
      let offset = 0;
      tableNode.forEach((rowNode, rowOffset) => {
        if (rowNode.type.name === "tableRow" && colIndex < rowNode.childCount) {
          let cellPos = tableStart + rowOffset + 1;
          for (let i = 0; i <= colIndex; i++) {
            cellPos += rowNode.child(i).nodeSize;
          }
          const targetCell = rowNode.child(colIndex);
          const clonedCell = targetCell.type.create(targetCell.attrs, targetCell.content, targetCell.marks);
          tr = tr.insert(cellPos + offset, clonedCell);
          offset += clonedCell.nodeSize;
        }
      });
      if (tr.docChanged) {
        view.dispatch(tr);
        editor.commands.focus();
        return;
      }
    }
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const normalItems = useMemo(() => items.filter((item) => !item.danger), [items]);
  const dangerItems = useMemo(() => items.filter((item) => item.danger), [items]);

  const allFlatItems = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: React.ReactNode; danger?: boolean; action: () => void }> = [];
    normalItems.forEach((item) => list.push(item));
    list.push({
      id: "duplicate",
      label: t("editor.duplicate"),
      icon: <Copy className="h-4 w-4 shrink-0" />,
      action: () => setDuplicateSubmenuOpen((v) => !v),
    });
    if (duplicateSubmenuOpen) {
      list.push({
        id: "duplicateRow",
        label: t("editor.duplicateRow"),
        icon: <Copy className="h-4 w-4 shrink-0 opacity-70" />,
        action: () => {
          duplicateActiveRow();
          setMenuOpen(false);
          setDuplicateSubmenuOpen(false);
        },
      });
      list.push({
        id: "duplicateColumn",
        label: t("editor.duplicateColumn"),
        icon: <Copy className="h-4 w-4 shrink-0 opacity-70" />,
        action: () => {
          duplicateActiveColumn();
          setMenuOpen(false);
          setDuplicateSubmenuOpen(false);
        },
      });
    }
    dangerItems.forEach((item) => list.push(item));
    return list;
  }, [normalItems, duplicateSubmenuOpen, dangerItems, duplicateActiveRow, duplicateActiveColumn, t]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [menuOpen, duplicateSubmenuOpen]);

  // Arrow up/down & Enter/Escape keyboard navigation
  useEffect(() => {
    if (!menuOpen || allFlatItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % allFlatItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < 0 ? allFlatItems.length - 1 : (prev - 1 + allFlatItems.length) % allFlatItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = allFlatItems[selectedIndex];
          if (selected) {
            selected.action();
            if (selected.id !== "duplicate") {
              setMenuOpen(false);
            }
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [menuOpen, selectedIndex, allFlatItems]);

  useEffect(() => {
    if (!menuOpen || selectedIndex < 0 || !scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector(`[data-flat-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, menuOpen]);

  if (!editor || !editor.isEditable || editor.isDestroyed || !editor.isActive("table") || !tableRect || !cellRect) {
    return null;
  }

  let currentFlatIndex = 0;

  return (
    <>
      {/* Active Focused Cell Blue Outline */}
      <div
        className="fixed pointer-events-none z-30 border-2 border-primary rounded-[2px]"
        style={{
          top: `${cellRect.top}px`,
          left: `${cellRect.left}px`,
          width: `${cellRect.width}px`,
          height: `${cellRect.height}px`,
        }}
      />

      {/* Column Handle Bar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-40 cursor-pointer rounded-full bg-primary shadow-sm hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${cellRect.top + 1}px`,
              left: `${cellRect.left + cellRect.width / 2}px`,
              width: "20px",
              height: "6px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuPos({ top: cellRect.top + 10, left: cellRect.left + cellRect.width / 2 - 100 });
              setMenuOpen((v) => !v);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>{t("editor.tableOptions")}</TooltipContent>
      </Tooltip>

      {/* Right Margin Plus Button (+) to add Column */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-30 flex items-center justify-center rounded-lg border border-border/80 bg-popover/90 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10 cursor-pointer shadow-sm transition-all"
            style={{
              top: `${tableRect.top}px`,
              left: `${tableRect.right + 10}px`,
              width: "16px",
              height: `${tableRect.height}px`,
            }}
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              setTimeout(updatePositions, 50);
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("editor.addColumnRight")}</TooltipContent>
      </Tooltip>

      {/* Bottom Margin Plus Button (+) to add Row */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-30 flex items-center justify-center rounded-lg border border-border/80 bg-popover/90 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10 cursor-pointer shadow-sm transition-all"
            style={{
              top: `${tableRect.bottom + 10}px`,
              left: `${tableRect.left}px`,
              width: `${tableRect.width}px`,
              height: "16px",
            }}
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              setTimeout(updatePositions, 50);
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("editor.addRowBelow")}</TooltipContent>
      </Tooltip>

      {/* Floating Actions Popover Card (100% Identical to Slash Commands Menu with Chevron Scroll Indicators) */}
      {menuOpen && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-56 rounded-xl border border-border/80 bg-popover p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-80 overflow-hidden text-popover-foreground select-none"
          style={{
            top: `${Math.min(menuPos.top, window.innerHeight - 360)}px`,
            left: `${Math.min(menuPos.left, window.innerWidth - 240)}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
            {t("editor.tableOptions")}
          </div>

          {canScrollUp && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollMenu("up")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronUp className="h-4 w-4" />
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="overflow-y-auto no-scrollbar flex-1 py-1"
          >
            {normalItems.map((item) => {
              const flatIndex = currentFlatIndex++;
              const isSelected = flatIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-flat-index={flatIndex}
                  role="button"
                  tabIndex={0}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground ${
                    isSelected
                      ? "bg-primary/15 text-primary font-medium [&>svg]:text-primary hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                      : "text-foreground font-normal hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                  }`}
                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                  onClick={() => {
                    item.action();
                    setMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="truncate flex-1">{item.label}</span>
                </div>
              );
            })}

            {/* Duplicate Waterfall Submenu */}
            {(() => {
              const duplicateFlatIndex = currentFlatIndex++;
              const isDuplicateSelected = duplicateFlatIndex === selectedIndex;
              return (
                <>
                  <div
                    data-flat-index={duplicateFlatIndex}
                    role="button"
                    tabIndex={0}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground ${
                      isDuplicateSelected
                        ? "bg-primary/15 text-primary font-medium [&>svg]:text-primary hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                        : "text-foreground font-normal hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                    }`}
                    onMouseEnter={() => setSelectedIndex(duplicateFlatIndex)}
                    onClick={() => setDuplicateSubmenuOpen((v) => !v)}
                  >
                    <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{t("editor.duplicate")}</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 shrink-0 opacity-60 transition-transform ${
                        duplicateSubmenuOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {duplicateSubmenuOpen && (
                    <div className="my-0.5 space-y-0.5 animate-in fade-in-50 slide-in-from-top-1">
                      {(() => {
                        const dupRowIndex = currentFlatIndex++;
                        const isDupRowSelected = dupRowIndex === selectedIndex;
                        return (
                          <div
                            data-flat-index={dupRowIndex}
                            role="button"
                            tabIndex={0}
                            className={`ml-4 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none [&>svg]:text-muted-foreground ${
                              isDupRowSelected
                                ? "bg-primary/15 text-primary font-medium [&>svg]:text-primary hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                                : "text-foreground/90 font-normal hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                            }`}
                            onMouseEnter={() => setSelectedIndex(dupRowIndex)}
                            onClick={() => {
                              duplicateActiveRow();
                              setMenuOpen(false);
                              setDuplicateSubmenuOpen(false);
                            }}
                          >
                            <Copy className="h-4 w-4 shrink-0 opacity-70" />
                            <span className="truncate flex-1">{t("editor.duplicateRow")}</span>
                          </div>
                        );
                      })()}
                      {(() => {
                        const dupColIndex = currentFlatIndex++;
                        const isDupColSelected = dupColIndex === selectedIndex;
                        return (
                          <div
                            data-flat-index={dupColIndex}
                            role="button"
                            tabIndex={0}
                            className={`ml-4 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none [&>svg]:text-muted-foreground ${
                              isDupColSelected
                                ? "bg-primary/15 text-primary font-medium [&>svg]:text-primary hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                                : "text-foreground/90 font-normal hover:bg-primary/[0.08] hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary"
                            }`}
                            onMouseEnter={() => setSelectedIndex(dupColIndex)}
                            onClick={() => {
                              duplicateActiveColumn();
                              setMenuOpen(false);
                              setDuplicateSubmenuOpen(false);
                            }}
                          >
                            <Copy className="h-4 w-4 shrink-0 opacity-70" />
                            <span className="truncate flex-1">{t("editor.duplicateColumn")}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              );
            })()}

            {dangerItems.length > 0 && (
              <>
                <div className="-mx-1 my-1 h-px bg-border/60" />
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider shrink-0">
                  {t("editor.deleteActions")}
                </div>
                {dangerItems.map((item) => {
                  const flatIndex = currentFlatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      data-flat-index={flatIndex}
                      role="button"
                      tabIndex={0}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 ${
                        isSelected
                          ? "bg-destructive/10 text-destructive font-medium"
                          : "text-destructive font-normal hover:bg-destructive/10 hover:text-destructive"
                      }`}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      onClick={() => {
                        item.action();
                        setMenuOpen(false);
                      }}
                    >
                      {item.icon}
                      <span className="truncate flex-1">{item.label}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {canScrollDown && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollMenu("down")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default TableInteractiveOverlay;
