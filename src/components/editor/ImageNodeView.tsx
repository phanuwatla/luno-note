import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Maximize2, RotateCcw, X, ImageOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

const ImageNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { t } = useTranslation();
  const { src, alt, title, width, "data-relative-src": dataRelativeSrc } = node.attrs;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [hasError, setHasError] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number | null>(() => {
    if (typeof width === "number") return width;
    if (typeof width === "string") {
      const parsed = parseInt(width, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Sync internal state when node width changes externally (e.g. undo/redo)
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

      const imgEl = imgRef.current;
      if (!imgEl) return;

      const startX = e.clientX;
      const initialWidth = imgEl.getBoundingClientRect().width;
      setIsResizing(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(60, Math.round(initialWidth + deltaX));
        setCurrentWidth(newWidth);
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        upEvent.preventDefault();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        setIsResizing(false);

        const deltaX = upEvent.clientX - startX;
        const finalWidth = Math.max(60, Math.round(initialWidth + deltaX));
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

  if (hasError) {
    return (
      <NodeViewWrapper
        as="div"
        className="my-2 inline-flex max-w-full clear-both select-none align-middle"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-border/80 bg-muted/40 text-muted-foreground text-xs select-none max-w-full">
          <ImageOff className="w-3.5 h-3.5 opacity-60 shrink-0" />
          <span className="truncate max-w-[280px]">
            {alt || title || t("editor.imageLoadError") || "Image could not be loaded"}
          </span>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      className="my-3 block max-w-full clear-both select-none leading-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="relative inline-block max-w-full rounded-xl transition-all duration-150 overflow-visible align-middle"
        style={{
          width: currentWidth ? `${currentWidth}px` : "fit-content",
          maxWidth: "100%",
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          title={title || ""}
          data-relative-src={dataRelativeSrc || undefined}
          draggable={false}
          loading="lazy"
          decoding="async"
          onLoad={() => setHasError(false)}
          onError={() => setHasError(true)}
          className="!m-0 !p-0 block h-auto max-w-full rounded-xl border border-border/80 object-contain"
          style={{
            width: currentWidth ? `${currentWidth}px` : "auto",
            maxWidth: "100%",
          }}
        />

        {/* Floating Width Indicator while resizing */}
        {isResizing && currentWidth && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/90 text-foreground border border-border text-[11px] font-mono font-semibold shadow-xs backdrop-blur-sm z-30 pointer-events-none">
            {currentWidth}px
          </div>
        )}

        {/* Top-Right Control Buttons (View Full Image & Reset Size) */}
        {(isHovered || selected) && !isResizing && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30">
            {/* Fullscreen Preview Button */}
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
                {t("editor.imageViewFull")}
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
                  {t("editor.imageResetSize")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Bottom-Right Corner Resize Grip (⌟ corner angle locked to image corner, matches button background color) */}
        {(isHovered || selected) && !isResizing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onPointerDown={handlePointerDown}
                onDoubleClick={handleResetSize}
                className="absolute bottom-1 right-1 p-0.5 text-background/80 hover:text-background opacity-50 hover:opacity-100 active:opacity-100 cursor-nwse-resize z-30 flex items-center justify-center select-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] transition-all duration-150"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <path d="M5 13h6a2 2 0 0 0 2-2V5" />
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              {t("editor.imageResizeTooltip")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Full-Screen Image Lightbox Preview */}
      {isPreviewOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in-0 duration-200"
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
                    {t("editor.imageCloseFull")} (Esc)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Image Preview */}
            <div
              className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt || ""}
                title={title || ""}
                className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200"
              />
            </div>

            {/* Caption / Title if present */}
            {(alt || title) && (
              <div
                className="mt-3 px-3 py-1 rounded-md bg-black/60 border border-white/10 text-white/90 text-xs font-medium backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {alt || title}
              </div>
            )}
          </div>,
          document.body
        )}
    </NodeViewWrapper>
  );
};

export const ImageNodeView = React.memo(ImageNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.src === nextProps.node.attrs.src &&
    prevProps.node.attrs.width === nextProps.node.attrs.width &&
    prevProps.node.attrs["data-relative-src"] === nextProps.node.attrs["data-relative-src"] &&
    prevProps.node.attrs.alt === nextProps.node.attrs.alt &&
    prevProps.node.attrs.title === nextProps.node.attrs.title &&
    prevProps.selected === nextProps.selected
  );
});

export default ImageNodeView;
