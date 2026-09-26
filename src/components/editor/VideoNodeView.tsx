import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { VideoOff, Maximize2, RotateCcw, X, Trash2, Link as LinkIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { copyTextToClipboard } from "./mediaContextMenuUtils";
import { dataUrlToBlobUrl, asyncDataUrlToBlobUrl } from "./ImageNodeView";
import VideoPlayer from "./VideoPlayer";
import AudioPlayer from "./AudioPlayer";
import { isAudioMedia } from "@/lib/webmClassifier";
import { useActivePipVideo } from "@/lib/videoPipStore";

export const videoLocalCache = new Map<string, string>();

export function getVideoMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "ogg" || ext === "ogv") return "video/ogg";
  if (ext === "mkv") return "video/x-matroska";
  if (ext === "avi") return "video/x-msvideo";
  return "video/mp4";
}

export function sanitizeVideoRelPath(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  if (clean.startsWith("luno-asset://")) {
    clean = decodeURIComponent(clean.replace(/^luno-asset:\/\//, ""));
    if (/^\/[a-zA-Z]:[\\/]/.test(clean)) {
      clean = clean.slice(1);
    }
  }
  try {
    clean = decodeURIComponent(clean);
  } catch {}
  while (clean.startsWith("../") || clean.startsWith("./")) {
    clean = clean.replace(/^(\.\.\/|\.\/)/, "");
  }
  return clean;
}

const VideoNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
  getPos,
}) => {
  const { t } = useTranslation();
  const { src, title, width, textAlign, "data-relative-src": dataRelativeSrc } = node.attrs;
  const fileName = (dataRelativeSrc || src || "").split("/").pop()?.split("\\").pop();
  const displayTitle = title || (fileName && !fileName.startsWith("blob:") && !fileName.startsWith("data:") ? decodeURIComponent(fileName) : undefined);
  const currentTabId = typeof localStorage !== "undefined" ? localStorage.getItem("notes-app-active-tab") || undefined : undefined;
  const activePip = useActivePipVideo();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hasError, setHasError] = useState(false);
  const [localResolvedSrc, setLocalResolvedSrc] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number | null>(() => {
    if (typeof width === "number") return width;
    if (typeof width === "string") {
      const parsed = parseInt(width, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  useEffect(() => {
    setHasError(false);
  }, [src]);

  useEffect(() => {
    // If src is already a valid blob:, data:, or http(s): URL
    if (src && /^(https?:|data:|blob:)/i.test(src)) {
      setLocalResolvedSrc(null);
      return;
    }

    const rawCandidate = (!/^(https?:|data:|blob:)/i.test(src) ? src : null) || dataRelativeSrc;
    if (!rawCandidate) {
      setLocalResolvedSrc(null);
      return;
    }

    const cleanRel = sanitizeVideoRelPath(rawCandidate);
    if (!cleanRel || /^(https?:|data:)/i.test(cleanRel)) {
      setLocalResolvedSrc(null);
      return;
    }

    const cached = videoLocalCache.get(cleanRel);
    if (cached && !cached.startsWith("luno-asset:")) {
      setLocalResolvedSrc(cached);
      setHasError(false);
      return;
    }

    let isCancelled = false;
    const resolveLocal = async () => {
      try {
        const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
        if (electronAPI?.getSavedWorkspace && (electronAPI?.readFileBuffer || electronAPI?.readImageDataUrl || electronAPI?.readFileBase64)) {
          const saved = await electronAPI.getSavedWorkspace();
          const workspacePath = saved?.folderPath || saved?.path;
          if (workspacePath) {
            const isAbsolute = /^[a-zA-Z]:[\\/]/.test(cleanRel) || cleanRel.startsWith("/");
            const fullPath = isAbsolute ? cleanRel : `${workspacePath}/${cleanRel}`;

            const cachedByFull = videoLocalCache.get(fullPath);
            if (cachedByFull && !cachedByFull.startsWith("luno-asset:")) {
              if (!isCancelled) {
                setLocalResolvedSrc(cachedByFull);
                setHasError(false);
              }
              return;
            }

            // 1. Preferred: High performance binary buffer directly to Blob URL
            if (electronAPI.readFileBuffer) {
              try {
                const buf = await electronAPI.readFileBuffer(fullPath);
                if (buf && buf.byteLength > 0) {
                  const mime = getVideoMimeType(cleanRel);
                  const blob = new Blob([buf], { type: mime });
                  const blobUrl = URL.createObjectURL(blob);
                  videoLocalCache.set(cleanRel, blobUrl);
                  videoLocalCache.set(fullPath, blobUrl);
                  if (!isCancelled) {
                    setLocalResolvedSrc(blobUrl);
                    setHasError(false);
                  }
                  return;
                }
              } catch (bufErr) {
                console.warn("electronAPI.readFileBuffer failed, trying fallback:", bufErr);
              }
            }

            // 2. Fallback: readImageDataUrl
            let dataUrl = electronAPI.readImageDataUrl ? await electronAPI.readImageDataUrl(fullPath) : null;
            if (!dataUrl && electronAPI.readFileBase64) {
              const b64 = await electronAPI.readFileBase64(fullPath);
              if (b64) {
                const mime = getVideoMimeType(cleanRel);
                dataUrl = `data:${mime};base64,${b64}`;
              }
            }

            if (!isCancelled && dataUrl) {
              const blobUrl = await asyncDataUrlToBlobUrl(dataUrl);
              videoLocalCache.set(cleanRel, blobUrl);
              videoLocalCache.set(fullPath, blobUrl);
              setLocalResolvedSrc(blobUrl);
              setHasError(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to resolve local video in VideoNodeView:", err);
      }
      if (!isCancelled) {
        setHasError(true);
      }
    };

    void resolveLocal();
    return () => {
      isCancelled = true;
    };
  }, [src, dataRelativeSrc]);

  // Sync internal state when node width changes externally
  useEffect(() => {
    if (!isResizing) {
      if (typeof width === "number") {
        setCurrentWidth(width);
      } else if (typeof width === "string") {
        const parsed = parseInt(width, 10);
        setCurrentWidth(isNaN(parsed) ? null : parsed);
      } else {
        setCurrentWidth(null);
      }
    }
  }, [width, isResizing]);

  // Handle ESC key to close full-screen preview
  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const containerEl = containerRef.current;
      if (!containerEl) return;

      const startX = e.clientX;
      const initialWidth = containerEl.getBoundingClientRect().width;
      setIsResizing(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(160, Math.round(initialWidth + deltaX));
        setCurrentWidth(newWidth);
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        upEvent.preventDefault();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        setIsResizing(false);

        const deltaX = upEvent.clientX - startX;
        const finalWidth = Math.max(160, Math.round(initialWidth + deltaX));
        setCurrentWidth(finalWidth);
        updateAttributes({ width: finalWidth });
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [updateAttributes]
  );

  const handleResetSize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentWidth(null);
      updateAttributes({ width: null });
    },
    [updateAttributes]
  );

  const displaySrc = localResolvedSrc || src;
  const isThisVideoInPip = Boolean(activePip && activePip.src === (localResolvedSrc || src));

  const handlePlayerError = useCallback(async () => {
    console.warn("VideoPlayer error loading displaySrc:", displaySrc);
    const target = dataRelativeSrc || (!/^(https?:|data:)/i.test(src) ? src : null);
    if (target) {
      const cleanRel = sanitizeVideoRelPath(target);
      if (cleanRel) {
        videoLocalCache.delete(cleanRel);
        if (displaySrc) videoLocalCache.delete(displaySrc);

        const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
        if (electronAPI?.getSavedWorkspace && (electronAPI?.readFileBuffer || electronAPI?.readImageDataUrl || electronAPI?.readFileBase64)) {
          try {
            const saved = await electronAPI.getSavedWorkspace();
            const workspacePath = saved?.folderPath || saved?.path;
            if (workspacePath) {
              const isAbsolute = /^[a-zA-Z]:[\\/]/.test(cleanRel) || cleanRel.startsWith("/");
              const fullPath = isAbsolute ? cleanRel : `${workspacePath}/${cleanRel}`;
              videoLocalCache.delete(fullPath);

              let recoveredBlobUrl: string | null = null;
              if (electronAPI.readFileBuffer) {
                try {
                  const buf = await electronAPI.readFileBuffer(fullPath);
                  if (buf && buf.byteLength > 0) {
                    const mime = getVideoMimeType(cleanRel);
                    recoveredBlobUrl = URL.createObjectURL(new Blob([buf], { type: mime }));
                  }
                } catch {}
              }
              if (!recoveredBlobUrl && electronAPI.readImageDataUrl) {
                const dUrl = await electronAPI.readImageDataUrl(fullPath);
                if (dUrl) recoveredBlobUrl = await asyncDataUrlToBlobUrl(dUrl);
              }
              if (!recoveredBlobUrl && electronAPI.readFileBase64) {
                const b64 = await electronAPI.readFileBase64(fullPath);
                if (b64) {
                  const mime = getVideoMimeType(cleanRel);
                  recoveredBlobUrl = await asyncDataUrlToBlobUrl(`data:${mime};base64,${b64}`);
                }
              }

              if (recoveredBlobUrl) {
                videoLocalCache.set(cleanRel, recoveredBlobUrl);
                videoLocalCache.set(fullPath, recoveredBlobUrl);
                setLocalResolvedSrc(recoveredBlobUrl);
                setHasError(false);
                return;
              }
            }
          } catch (e) {
            console.warn("Player error recovery disk read failed:", e);
          }
        }
      }
    }

    setHasError(true);
  }, [dataRelativeSrc, src, displaySrc]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editor && typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") {
        editor.chain().setNodeSelection(pos).run();
      }
    }
  }, [editor, getPos]);

  if (hasError) {
    return (
      <NodeViewWrapper
        as="div"
        className="my-2 inline-flex max-w-full clear-both select-none align-middle"
        contentEditable={false}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-border/80 bg-muted/40 text-muted-foreground text-xs select-none max-w-full transition-all duration-150 ${
              selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
            }`}>
              <VideoOff className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <span className="truncate max-w-[280px]">
                {t("editor.videoLoadError") || "Video could not be loaded"}
              </span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56 rounded-xl">
            <ContextMenuItem
              onClick={() => {
                const target = dataRelativeSrc || src;
                if (target) {
                  void copyTextToClipboard(target, t("editor.copiedVideoPath") || "คัดลอกพาธวิดีโอแล้ว");
                }
              }}
              className="gap-2.5"
            >
              <LinkIcon className="h-4 w-4" />
              <span>{t("editor.copyVideoPath") || "คัดลอกพาธวิดีโอ"}</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => deleteNode?.()}
              variant="destructive"
              className="gap-2.5 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("editor.deleteVideo") || "ลบวิดีโอ"}</span>
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </NodeViewWrapper>
    );
  }

  if (isAudioMedia(dataRelativeSrc || src || "")) {
    return (
      <NodeViewWrapper
        as="div"
        className="my-3 block w-full max-w-full clear-both select-none leading-none group/audio"
        contentEditable={false}
        style={{ textAlign: textAlign || undefined }}
      >
        <div className="block w-full max-w-full" onContextMenu={handleContextMenu}>
          <AudioPlayer
            src={displaySrc}
            title={displayTitle}
            dataRelativeSrc={dataRelativeSrc}
            onDelete={deleteNode}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      className="my-3 block max-w-full clear-both select-none leading-none group/video"
      contentEditable={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: "translateZ(0)",
        textAlign: textAlign || undefined,
      }}
    >
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative inline-block max-w-full rounded-xl overflow-hidden align-middle transition-all duration-150 ${
          selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
        } ${isResizing ? "select-none" : ""}`}
        style={{
          width: currentWidth ? `${currentWidth}px` : "fit-content",
          maxWidth: "100%",
        }}
      >
        <VideoPlayer
          src={displaySrc}
          title={displayTitle}
          noteId={currentTabId}
          width={currentWidth}
          dataRelativeSrc={dataRelativeSrc}
          onDelete={deleteNode}
          onResetSize={handleResetSize}
          onViewFull={() => setIsPreviewOpen(true)}
          onError={handlePlayerError}
        />

        {/* Floating Width Indicator while resizing */}
        {isResizing && currentWidth && (
          <div
            style={{ fontFamily: "var(--app-font-family, sans-serif)" }}
            className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/90 text-foreground border border-border text-[11px] font-semibold shadow-xs backdrop-blur-sm z-40 pointer-events-none"
          >
            {currentWidth}px
          </div>
        )}

        {/* Hover Action Bar: Top Right */}
        {(isHovered || selected) && !isResizing && !isThisVideoInPip && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-40 animate-in fade-in-0 duration-150">
            {/* Fullscreen Lightbox Preview Button */}
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreviewOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-background/90 text-muted-foreground hover:text-foreground border border-border/80 shadow-xs backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {t("editor.videoViewFull") || "View full video"}
                </TooltipContent>
              </Tooltip>

              {/* Reset Size Button (Shown if resized) */}
              {currentWidth && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleResetSize}
                      className="p-1.5 rounded-lg bg-background/90 text-muted-foreground hover:text-foreground border border-border/80 shadow-xs backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {t("editor.videoResetSize") || "Reset video size"}
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        )}

        {/* Resize Handle: Bottom Right */}
        {(isHovered || selected || isResizing) && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onPointerDown={handlePointerDown}
                  className={`absolute bottom-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-background/90 text-muted-foreground hover:text-foreground border border-border shadow-xs cursor-nwse-resize z-40 backdrop-blur-sm transition-transform ${
                    isResizing ? "scale-110 text-primary border-primary" : "hover:scale-105"
                  }`}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M5 13h6a2 2 0 0 0 2-2V5" />
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t("editor.videoResizeTooltip") || "Resize video"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Full-Screen Video Lightbox Preview Modal */}
      {isPreviewOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in-0 duration-200"
            onClick={() => setIsPreviewOpen(false)}
          >
            {/* Top Bar with Close Button */}
            <div
              className="absolute top-4 right-4 z-50 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(false)}
                      className="p-2 rounded-xl bg-background/20 hover:bg-background/40 text-white border border-white/20 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("editor.videoCloseFull") || "Close"} (Esc)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Video Preview Container */}
            <div
              className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <VideoPlayer
                src={displaySrc}
                title={displayTitle}
                noteId={currentTabId}
                autoPlay
                className="max-w-full max-h-[88vh]"
                onError={handlePlayerError}
              />
            </div>
          </div>,
          document.body
        )}
    </NodeViewWrapper>
  );
};

export const VideoNodeView = React.memo(VideoNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.src === nextProps.node.attrs.src &&
    prevProps.node.attrs.title === nextProps.node.attrs.title &&
    prevProps.node.attrs.width === nextProps.node.attrs.width &&
    prevProps.node.attrs.textAlign === nextProps.node.attrs.textAlign &&
    prevProps.node.attrs["data-relative-src"] === nextProps.node.attrs["data-relative-src"] &&
    prevProps.selected === nextProps.selected
  );
});

export default VideoNodeView;
