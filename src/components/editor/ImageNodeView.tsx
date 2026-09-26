import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Maximize2, RotateCcw, X, ImageOff, Pencil, Copy, Scissors, Trash2, ExternalLink, FolderOpen, Download, Link as LinkIcon, FileText, Folder } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  copyImageToClipboard,
  copyTextToClipboard,
  copyMediaPath,
  openMediaFileInSystemApp,
  revealMediaFileInFolder,
  downloadMediaFile,
} from "./mediaContextMenuUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { QrCodeDialog, type QrCodeData } from "@/components/QrCodeDialog";
import { detectQrCodeText } from "@/lib/qrCode";

// Global in-memory cache for resolved local image Data URLs to avoid repetitive disk reads and IPC calls
export const imageLocalCache = new Map<string, string>();

export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const parts = dataUrl.split(",");
    if (parts.length !== 2) return dataUrl;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mime });
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      return URL.createObjectURL(blob);
    }
    return dataUrl;
  } catch {
    return dataUrl;
  }
}

export async function asyncDataUrlToBlobUrl(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      return URL.createObjectURL(blob);
    }
    return dataUrl;
  } catch {
    return dataUrlToBlobUrl(dataUrl);
  }
}

const ImageNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
  getPos,
}) => {
  const { t } = useTranslation();
  const {
    src,
    alt,
    title,
    width,
    "data-relative-src": dataRelativeSrc,
    "data-qr-code": dataQrCode,
    "data-qr-text": dataQrText,
    "data-qr-color": dataQrColor,
    "data-qr-bg": dataQrBg,
    "data-qr-level": dataQrLevel,
  } = node.attrs;

  const isQrCode = Boolean(
    dataQrCode === "true" ||
    dataQrCode === true ||
    alt === "QR Code" ||
    alt?.toLowerCase()?.startsWith("qr code") ||
    title === "QR Code" ||
    (typeof src === "string" && src.includes("qrcode"))
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [hasError, setHasError] = useState(false);
  const [localResolvedSrc, setLocalResolvedSrc] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
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

  // Auto-detect QR text from image if missing (e.g. legacy notes, title attribute or external imports)
  useEffect(() => {
    if (isQrCode && !dataQrText) {
      if (title && title !== "QR Code" && !title.startsWith("data:")) {
        updateAttributes({
          "data-qr-code": "true",
          "data-qr-text": title,
        });
        return;
      }
      let isCancelled = false;
      const targetSrc = localResolvedSrc || src;
      if (targetSrc) {
        detectQrCodeText(targetSrc).then((detected) => {
          if (!isCancelled && detected) {
            updateAttributes({
              "data-qr-code": "true",
              "data-qr-text": detected,
            });
          }
        });
      }
      return () => {
        isCancelled = true;
      };
    }
  }, [isQrCode, dataQrText, title, localResolvedSrc, src, updateAttributes]);

  // Auto-migrate legacy in-file Base64 QR code to attachments/ file so Markdown stays clean and Obsidian can render it
  useEffect(() => {
    if (isQrCode && src && src.startsWith("data:image/") && !dataRelativeSrc) {
      let isCancelled = false;
      const migrateBase64Qr = async () => {
        try {
          const cleanSlug = (dataQrText || "qrcode")
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//i, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .slice(0, 30)
            .replace(/^_+|_+$/g, "") || "code";
          const timeTag = Date.now().toString().slice(-6);
          const targetFileName = `qrcode_${cleanSlug}_${timeTag}.png`;
          const targetRel = `attachments/${targetFileName}`;

          const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
          if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileBase64) {
            const saved = await electronAPI.getSavedWorkspace();
            const workspacePath = saved?.folderPath || saved?.path;
            if (workspacePath) {
              const fullAttachmentPath = `${workspacePath}/${targetRel}`;
              const rawBase64 = src.includes("base64,") ? src.split("base64,")[1] : src;
              if (rawBase64) {
                await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 });
              }
              const blobUrl = dataUrlToBlobUrl(src);
              imageLocalCache.set(targetRel, blobUrl);
              imageLocalCache.set(fullAttachmentPath, blobUrl);
              if (!isCancelled) {
                setLocalResolvedSrc(blobUrl);
                updateAttributes({
                  src: blobUrl,
                  "data-relative-src": targetRel,
                });
              }
              return;
            }
          }

          // Web File System Access API
          const globalRootDir = (window as any).__luno_rootDirHandle;
          if (globalRootDir && typeof globalRootDir.getDirectoryHandle === "function") {
            const attachmentsDir = await globalRootDir.getDirectoryHandle("attachments", { create: true });
            const fileHandle = await attachmentsDir.getFileHandle(targetFileName, { create: true });
            const writable = await fileHandle.createWritable();
            const res = await fetch(src);
            const blob = await res.blob();
            await writable.write(blob);
            await writable.close();

            const blobUrl = URL.createObjectURL(blob);
            imageLocalCache.set(targetRel, blobUrl);
            if (!isCancelled) {
              setLocalResolvedSrc(blobUrl);
              updateAttributes({
                src: blobUrl,
                "data-relative-src": targetRel,
              });
            }
          }
        } catch (err) {
          console.warn("Failed to auto-migrate base64 QR code:", err);
        }
      };
      void migrateBase64Qr();
      return () => {
        isCancelled = true;
      };
    }
  }, [isQrCode, src, dataRelativeSrc, dataQrText, updateAttributes]);

  // Automatically resolve relative attachment paths from disk (essential for packaged production app)
  useEffect(() => {
    let isCancelled = false;

    // If src is already a valid loaded image (blob:, data:, https:), no disk reading is needed!
    if (src && /^(https?:|data:|blob:)/i.test(src)) {
      setLocalResolvedSrc(null);
      return;
    }

    const effectiveSrc = (!/^(https?:|data:|blob:)/i.test(src) ? src : null) || dataRelativeSrc;

    if (!effectiveSrc || /^(https?:|data:)/i.test(effectiveSrc)) {
      setLocalResolvedSrc(null);
      return;
    }

    let cleanRel = decodeURIComponent(effectiveSrc);
    while (cleanRel.startsWith("../") || cleanRel.startsWith("./")) {
      cleanRel = cleanRel.replace(/^(\.\.\/|\.\/)/, "");
    }

    // Fast check in memory cache
    const cached = imageLocalCache.get(cleanRel);
    if (cached) {
      setLocalResolvedSrc(cached);
      setHasError(false);
      return;
    }

    const resolveLocal = async () => {
      try {
        const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
        if (electronAPI?.getSavedWorkspace && electronAPI?.readImageDataUrl) {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            const fullPath = `${saved.folderPath}/${cleanRel}`;
            const cachedByFull = imageLocalCache.get(fullPath);
            if (cachedByFull) {
              if (!isCancelled) {
                setLocalResolvedSrc(cachedByFull);
                setHasError(false);
              }
              return;
            }


            const dataUrl = await electronAPI.readImageDataUrl(fullPath);
            if (!isCancelled && dataUrl) {
              const blobUrl = dataUrlToBlobUrl(dataUrl);
              imageLocalCache.set(cleanRel, blobUrl);
              imageLocalCache.set(fullPath, blobUrl);
              setLocalResolvedSrc(blobUrl);
              setHasError(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to resolve local attachment in ImageNodeView:", err);
      }
    };

    resolveLocal();
    return () => {
      isCancelled = true;
    };
  }, [src, dataRelativeSrc]);

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
              <ImageOff className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <span className="truncate max-w-[280px]">
                {alt || title || t("editor.imageLoadError") || "Image could not be loaded"}
              </span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56 rounded-xl">
            <ContextMenuItem
              onClick={() => {
                const target = dataRelativeSrc || src;
                if (target) {
                  void copyTextToClipboard(target, t("editor.copiedImagePath") || "คัดลอกพาธรูปภาพแล้ว");
                }
              }}
              className="gap-2.5"
            >
              <LinkIcon className="h-4 w-4" />
              <span>{t("editor.copyImagePath") || "คัดลอกพาธรูปภาพ"}</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => deleteNode?.()}
              variant="destructive"
              className="gap-2.5 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("editor.deleteImage") || "ลบรูปภาพ"}</span>
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </NodeViewWrapper>
    );
  }

  const displaySrc = localResolvedSrc || src;

  return (
    <NodeViewWrapper
      as="div"
      className="my-3 block max-w-full clear-both select-none leading-none"
      contentEditable={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: "translateZ(0)",
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
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
            {(() => {
              const imgElement = (
                <img
                  ref={imgRef}
                  src={displaySrc}
                  alt={alt || ""}
                  data-relative-src={dataRelativeSrc || undefined}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setHasError(false)}
                  onError={() => {
                    const rel = dataRelativeSrc || (!/^(https?:|data:)/i.test(src) ? src : null);
                    if (rel) {
                      let cleanRel = decodeURIComponent(rel);
                      if (cleanRel.startsWith("luno-asset://")) {
                        cleanRel = decodeURIComponent(cleanRel.replace(/^luno-asset:\/\//, ""));
                        if (/^\/[a-zA-Z]:[\\/]/.test(cleanRel)) cleanRel = cleanRel.slice(1);
                      }
                      while (cleanRel.startsWith("../") || cleanRel.startsWith("./")) {
                        cleanRel = cleanRel.replace(/^(\.\.\/|\.\/)/, "");
                      }
                      imageLocalCache.delete(cleanRel);
                      if (displaySrc) imageLocalCache.delete(displaySrc);

                      const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
                      if (electronAPI?.getSavedWorkspace && electronAPI?.readImageDataUrl) {
                        void (async () => {
                          try {
                            const saved = await electronAPI.getSavedWorkspace();
                            const workspacePath = saved?.folderPath || saved?.path;
                            if (workspacePath) {
                              const isAbsolute = /^[a-zA-Z]:[\\/]/.test(cleanRel) || cleanRel.startsWith("/");
                              const fullPath = isAbsolute ? cleanRel : `${workspacePath}/${cleanRel}`;
                              imageLocalCache.delete(fullPath);

                              const dataUrl = await electronAPI.readImageDataUrl(fullPath);
                              if (dataUrl) {
                                const blobUrl = dataUrlToBlobUrl(dataUrl);
                                imageLocalCache.set(cleanRel, blobUrl);
                                imageLocalCache.set(fullPath, blobUrl);
                                setLocalResolvedSrc(blobUrl);
                                setHasError(false);
                                return;
                              }
                            }
                          } catch {}
                          setHasError(true);
                        })();
                        return;
                      }
                    }
                    setHasError(true);
                  }}
                  className="!m-0 !p-0 block h-auto max-w-full rounded-xl border border-border/80 object-contain shadow-2xs"
                  style={{
                    width: currentWidth ? `${currentWidth}px` : "auto",
                    maxWidth: "100%",
                  }}
                />
              );

              if (title) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{imgElement}</TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {title}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return imgElement;
            })()}

        {/* Floating Width Indicator while resizing */}
        {isResizing && currentWidth && (
          <div
            style={{ fontFamily: "var(--app-font-family, sans-serif)" }}
            className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/90 text-foreground border border-border text-[11px] font-semibold shadow-xs backdrop-blur-sm z-30 pointer-events-none"
          >
            {currentWidth}px
          </div>
        )}

        {/* Top-Right Control Buttons (Edit QR Code, View Full Image & Reset Size) */}
        {(isHovered || selected) && !isResizing && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30">
            {/* Edit QR Code Button */}
            {isQrCode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!dataQrText) {
                        const targetSrc = localResolvedSrc || src;
                        if (targetSrc) {
                          const detected = await detectQrCodeText(targetSrc);
                          if (detected) {
                            updateAttributes({
                              "data-qr-code": "true",
                              "data-qr-text": detected,
                            });
                          }
                        }
                      }
                      setIsQrDialogOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-background/90 text-muted-foreground hover:text-foreground border border-border/80 shadow-xs backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {t("editor.qrEdit") || "แก้ไขคิวอาร์โค้ด"}
                </TooltipContent>
              </Tooltip>
            )}

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

        {/* Resize Handle: Bottom Right with background matching video (Image 3) */}
        {(isHovered || selected || isResizing) && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onPointerDown={handlePointerDown}
                  onDoubleClick={handleResetSize}
                  className={`absolute bottom-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-background/90 text-muted-foreground hover:text-foreground border border-border shadow-xs cursor-nwse-resize z-30 backdrop-blur-sm transition-transform ${
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
                {t("editor.imageResizeTooltip") || "Resize image"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 rounded-xl">
        <ContextMenuItem onClick={() => setIsPreviewOpen(true)} className="gap-2.5">
          <Maximize2 className="h-4 w-4" />
          <span>{t("editor.imageViewFull") || "ดูรูปภาพขนาดเต็ม"}</span>
        </ContextMenuItem>

        {isQrCode && (
          <ContextMenuItem
            onClick={async () => {
              if (!dataQrText) {
                const targetSrc = localResolvedSrc || src;
                if (targetSrc) {
                  const detected = await detectQrCodeText(targetSrc);
                  if (detected) {
                    updateAttributes({
                      "data-qr-code": "true",
                      "data-qr-text": detected,
                    });
                  }
                }
              }
              setIsQrDialogOpen(true);
            }}
            className="gap-2.5"
          >
            <Pencil className="h-4 w-4" />
            <span>{t("editor.qrEdit") || "แก้ไขคิวอาร์โค้ด"}</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => void copyImageToClipboard(displaySrc, dataRelativeSrc)}
          className="gap-2.5"
        >
          <Copy className="h-4 w-4" />
          <span>{t("editor.copyImage") || "คัดลอกรูปภาพ"}</span>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2.5">
            <LinkIcon className="h-4 w-4" />
            <span>{t("editor.copyImagePath") || "คัดลอกพาธรูปภาพ"}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 rounded-xl">
            <ContextMenuItem
              onClick={() => {
                void copyMediaPath(displaySrc, dataRelativeSrc, "relative", {
                  title: t("editor.copiedRelativePath") || "คัดลอกพาธสัมพัทธ์แล้ว",
                });
              }}
              className="gap-2.5 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>{t("editor.copyRelativePath") || "คัดลอกพาธสัมพัทธ์"}</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                void copyMediaPath(displaySrc, dataRelativeSrc, "full", {
                  title: t("editor.copiedAbsolutePath") || "คัดลอกพาธแบบเต็มแล้ว",
                });
              }}
              className="gap-2.5 cursor-pointer"
            >
              <Folder className="h-4 w-4" />
              <span>{t("editor.copyAbsolutePath") || "คัดลอกพาธแบบเต็ม"}</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem
          onClick={() => void openMediaFileInSystemApp(displaySrc, dataRelativeSrc)}
          className="gap-2.5"
        >
          <ExternalLink className="h-4 w-4" />
          <span>{t("editor.openInDefaultApp") || "เปิดในโปรแกรมเริ่มต้น"}</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => void revealMediaFileInFolder(displaySrc, dataRelativeSrc)}
          className="gap-2.5"
        >
          <FolderOpen className="h-4 w-4" />
          <span>{t("editor.revealInFolder") || "แสดงในโฟลเดอร์"}</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => downloadMediaFile(displaySrc, alt || "image.png")}
          className="gap-2.5"
        >
          <Download className="h-4 w-4" />
          <span>{t("editor.saveImageAs") || "บันทึกรูปภาพเป็น..."}</span>
        </ContextMenuItem>

        {currentWidth && (
          <ContextMenuItem onClick={handleResetSize} className="gap-2.5">
            <RotateCcw className="h-4 w-4" />
            <span>{t("editor.imageResetSize") || "รีเซ็ตขนาดเดิม"}</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => {
            const targetRel = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
            const md = targetRel ? `![${alt || ""}](${targetRel})` : `![${alt || ""}](${src})`;
            void copyTextToClipboard(md, t("editor.copiedMarkdown") || "คัดลอก Markdown แล้ว");
            deleteNode?.();
          }}
          className="gap-2.5"
        >
          <Scissors className="h-4 w-4" />
          <span>{t("editor.cut") || "ตัด"}</span>
          <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {
            const targetRel = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
            const md = targetRel ? `![${alt || ""}](${targetRel})` : `![${alt || ""}](${src})`;
            void copyTextToClipboard(md, t("editor.copiedMarkdown") || "คัดลอก Markdown แล้ว");
          }}
          className="gap-2.5"
        >
          <Copy className="h-4 w-4" />
          <span>{t("editor.copyMarkdown") || "คัดลอก Markdown"}</span>
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => deleteNode?.()}
          variant="destructive"
          className="gap-2.5 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>{t("editor.deleteImage") || "ลบรูปภาพ"}</span>
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
      </ContextMenu>

      {/* QR Code Edit Dialog Modal */}
      {isQrCode && isQrDialogOpen && (
        <QrCodeDialog
          open={isQrDialogOpen}
          onOpenChange={setIsQrDialogOpen}
          mode="edit"
          initialText={dataQrText || ""}
          initialColor={dataQrColor || "#000000"}
          initialBgType={dataQrBg || "white"}
          initialLevel={dataQrLevel || "M"}
          onSaveQrCode={async (dataUrl, qrData) => {
            let targetRel = dataRelativeSrc;
            if (!targetRel) {
              const cleanSlug = (qrData?.text || "qrcode")
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//i, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "_")
                .slice(0, 30)
                .replace(/^_+|_+$/g, "") || "code";
              const timeTag = Date.now().toString().slice(-6);
              targetRel = `attachments/qrcode_${cleanSlug}_${timeTag}.png`;
            }

            const cleanFileName = targetRel.split("/").pop()?.split("\\").pop() || "qrcode.png";

            // Save to disk if Electron API is available
            const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
            if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileBase64) {
              try {
                const saved = await electronAPI.getSavedWorkspace();
                const workspacePath = saved?.folderPath || saved?.path;
                if (workspacePath) {
                  let cleanRel = decodeURIComponent(targetRel);
                  while (cleanRel.startsWith("../") || cleanRel.startsWith("./")) {
                    cleanRel = cleanRel.replace(/^(\.\.\/|\.\/)/, "");
                  }
                  const fullPath = `${workspacePath}/${cleanRel}`;
                  const rawBase64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
                  if (rawBase64) {
                    await electronAPI.writeFileBase64({ fullPath, base64: rawBase64 });
                  }
                }
              } catch (e) {
                console.warn("Failed to write updated QR file to disk:", e);
              }
            }

            // Web File System Access API
            const globalRootDir = (window as any).__luno_rootDirHandle;
            if (globalRootDir && typeof globalRootDir.getDirectoryHandle === "function") {
              try {
                const attachmentsDir = await globalRootDir.getDirectoryHandle("attachments", { create: true });
                const fileHandle = await attachmentsDir.getFileHandle(cleanFileName, { create: true });
                const writable = await fileHandle.createWritable();
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                await writable.write(blob);
                await writable.close();
              } catch (webErr) {
                console.warn("Web FileSystem write error on QR save:", webErr);
              }
            }

            const blobUrl = await asyncDataUrlToBlobUrl(dataUrl);
            imageLocalCache.set(targetRel, blobUrl);
            setLocalResolvedSrc(blobUrl);

            updateAttributes({
              src: blobUrl || dataUrl,
              alt: "QR Code",
              "data-relative-src": targetRel,
              "data-qr-code": "true",
              "data-qr-text": qrData?.text || "",
              "data-qr-color": qrData?.color || "#000000",
              "data-qr-bg": qrData?.bgType || "white",
              "data-qr-level": qrData?.level || "M",
              // Width attribute is completely preserved so image size remains identical!
            });
          }}
        />
      )}

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
                src={displaySrc}
                alt={alt || ""}
                className="max-w-full max-h-[88vh] object-contain rounded-lg md:rounded-xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200"
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
    prevProps.node.attrs["data-qr-code"] === nextProps.node.attrs["data-qr-code"] &&
    prevProps.node.attrs["data-qr-text"] === nextProps.node.attrs["data-qr-text"] &&
    prevProps.node.attrs["data-qr-color"] === nextProps.node.attrs["data-qr-color"] &&
    prevProps.node.attrs["data-qr-bg"] === nextProps.node.attrs["data-qr-bg"] &&
    prevProps.node.attrs["data-qr-level"] === nextProps.node.attrs["data-qr-level"] &&
    prevProps.node.attrs.alt === nextProps.node.attrs.alt &&
    prevProps.node.attrs.title === nextProps.node.attrs.title &&
    prevProps.selected === nextProps.selected
  );
});

export default ImageNodeView;
