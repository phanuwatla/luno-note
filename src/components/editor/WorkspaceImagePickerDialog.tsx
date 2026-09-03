import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Search,
  ImageOff,
  Check,
  Folder,
  FileImage,
  Loader2,
  Paperclip,
  Images,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Note } from "@/hooks/useNotes";
import { useTranslation } from "@/hooks/useTranslation";
import { getStoredFileHandle, requestPermissionIfAvailable } from "@/lib/fileHandles";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".avif",
]);

export interface ScannedImageItem {
  id: string;
  fileName: string;
  folderPath: string;
  relativePath: string;
  src?: string;
  fileHandle?: FileSystemFileHandle;
  isAttachment: boolean;
}

export function getRelativePathBetween(
  fromFolder: string | undefined,
  toFolder: string | undefined,
  fileName: string
): string {
  const fromParts = fromFolder ? fromFolder.split("/").filter(Boolean) : [];
  const toParts = toFolder ? toFolder.split("/").filter(Boolean) : [];

  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++;
  }

  const upCount = fromParts.length - common;
  const upPrefix = upCount > 0 ? "../".repeat(upCount) : "";
  const remainingTo = toParts.slice(common).join("/");

  const rawPath = remainingTo ? `${upPrefix}${remainingTo}/${fileName}` : `${upPrefix}${fileName}`;
  try {
    return encodeURI(decodeURI(rawPath));
  } catch {
    return rawPath.replace(/ /g, "%20");
  }
}

export function isImageNote(note: Note): boolean {
  if (note.fileType === "image") return true;
  const name = (note.fileName || note.title || "").toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i.test(name);
}

export function isAttachmentPath(folderPath: string, fileName?: string): boolean {
  const folder = (folderPath || "").replace(/\\/g, "/").toLowerCase();
  const name = (fileName || "").replace(/\\/g, "/").toLowerCase();
  return (
    folder === "attachments" ||
    folder.startsWith("attachments/") ||
    name.startsWith("attachments/")
  );
}

export function isAttachmentNote(note: Note): boolean {
  return isAttachmentPath(note.folderPath || "", note.fileName || note.title || "");
}

export function cacheBlobUrlInMap(
  map: Map<string, string> | undefined,
  path: string,
  url: string
): void {
  if (!map || !path || !url) return;
  map.set(path, url);
  map.set(url, path);
  try {
    const encoded = encodeURI(decodeURI(path));
    const decoded = decodeURIComponent(path);
    map.set(encoded, url);
    map.set(decoded, url);
  } catch {}
}

interface WorkspaceImagePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentNote: Note | null;
  rootDirHandle?: FileSystemDirectoryHandle | null;
  assetBlobUrlMap?: React.MutableRefObject<Map<string, string>>;
  onSelectImage: (targetNote: Note, relativePath: string, blobUrl?: string) => void;
}

export const WorkspaceImagePickerDialog: React.FC<WorkspaceImagePickerDialogProps> = ({
  isOpen,
  onClose,
  notes,
  currentNote,
  rootDirHandle,
  assetBlobUrlMap,
  onSelectImage,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"attachments" | "all">("attachments");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [scannedItems, setScannedItems] = useState<ScannedImageItem[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Scan attachments folder and workspace images whenever dialog opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedItemId(null);
      setSearchQuery("");
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const scanAllImages = async () => {
      const itemsMap = new Map<string, ScannedImageItem>();
      const previewsMap: Record<string, string> = {};

      const isImgFile = (name: string) => {
        const dot = name.lastIndexOf(".");
        if (dot < 0) return false;
        return IMAGE_EXTENSIONS.has(name.slice(dot).toLowerCase());
      };

      const IGNORED_SCAN_FOLDERS = new Set([
        ".luno",
        "node_modules",
        ".git",
        ".next",
        "dist",
        "dist-desktop",
        "build",
        ".output",
        ".cache",
        "vendor",
        "target",
        ".vscode",
        ".idea",
        "coverage",
      ]);

      // 1. Direct Web File System Access: Recursively scan entire workspace
      if (rootDirHandle) {
        try {
          const scanDir = async (dirHandle: FileSystemDirectoryHandle, folder: string) => {
            const entries =
              typeof (dirHandle as any).entries === "function"
                ? (dirHandle as any).entries()
                : (dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>);

            for await (const [name, handle] of entries) {
              if (isCancelled) break;
              if (name.startsWith(".")) continue;

              if (handle.kind === "directory") {
                if (IGNORED_SCAN_FOLDERS.has(name)) continue;
                const subPath = folder ? `${folder}/${name}` : name;
                try {
                  await scanDir(handle as FileSystemDirectoryHandle, subPath);
                } catch {
                  /* ignore subfolder read errors */
                }
              } else if (handle.kind === "file" && isImgFile(name)) {
                const fileHandle = handle as FileSystemFileHandle;
                const relPath = folder ? `${folder}/${name}` : name;
                const key = `fs_${relPath}`;

                try {
                  const file = await fileHandle.getFile();
                  const blobUrl = URL.createObjectURL(file);
                  previewsMap[key] = blobUrl;

                  cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, blobUrl);

                  itemsMap.set(key, {
                    id: key,
                    fileName: name,
                    folderPath: folder,
                    relativePath: relPath,
                    src: blobUrl,
                    fileHandle,
                    isAttachment: isAttachmentPath(folder, name),
                  });
                } catch (err) {
                  console.warn("Failed reading image file handle:", name, err);
                }
              }
            }
          };

          await scanDir(rootDirHandle, "");
        } catch (err) {
          console.warn("Failed scanning workspace folder:", err);
        }
      }

      // 2. Electron Desktop Workspace: Recursively scan workspace
      const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
      if (electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles && electronAPI?.readFileBase64) {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          const workspacePath = saved?.folderPath || saved?.path;
          if (workspacePath) {
            const scanElectronFolder = async (folder: string) => {
              const fullDir = folder ? `${workspacePath}/${folder}` : workspacePath;
              try {
                const files = await electronAPI.readDirectoryFiles(fullDir);
                if (Array.isArray(files)) {
                  for (const f of files) {
                    if (isCancelled) break;
                    if (f.name.startsWith(".")) continue;

                    if (f.isDirectory) {
                      if (!IGNORED_SCAN_FOLDERS.has(f.name)) {
                        const subPath = folder ? `${folder}/${f.name}` : f.name;
                        await scanElectronFolder(subPath);
                      }
                    } else if (isImgFile(f.name)) {
                      const relPath = folder ? `${folder}/${f.name}` : f.name;
                      const key = `el_${relPath}`;

                      if (!itemsMap.has(key)) {
                        try {
                          const base64 = await electronAPI.readFileBase64(f.fullPath);
                          if (base64) {
                            const ext = f.name.split(".").pop()?.toLowerCase() || "png";
                            const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
                            const dataUrl = `data:${mime};base64,${base64}`;
                            previewsMap[key] = dataUrl;

                            cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, dataUrl);

                            itemsMap.set(key, {
                              id: key,
                              fileName: f.name,
                              folderPath: folder,
                              relativePath: relPath,
                              src: dataUrl,
                              isAttachment: isAttachmentPath(folder, f.name),
                            });
                          }
                        } catch (err) {
                          console.warn("Failed reading electron image:", f.name, err);
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn("Failed scanning electron directory:", fullDir, err);
              }
            };

            await scanElectronFolder("");
          }
        } catch (err) {
          console.warn("Failed scanning electron attachments:", err);
        }
      }

      // 3. Fallback resolution for any note in notes array
      for (const n of notes) {
        if (isCancelled) break;
        if (!isImageNote(n)) continue;

        const fileName = n.fileName || n.title || "image.png";
        const folder = n.folderPath || "";
        const relPath = folder ? `${folder}/${fileName}` : fileName;
        const key = n.id;

        if (itemsMap.has(`fs_${relPath}`) || itemsMap.has(`el_${relPath}`) || itemsMap.has(key)) {
          continue;
        }

        let preview =
          n.content?.startsWith("data:image/") || n.content?.startsWith("blob:")
            ? n.content
            : undefined;

        if (!preview && assetBlobUrlMap?.current) {
          const encodedRel = encodeURI(relPath);
          preview = assetBlobUrlMap.current.get(relPath) || assetBlobUrlMap.current.get(encodedRel);
        }

        // Try resolving handle from rootDirHandle directly by path traversal
        if (!preview && rootDirHandle) {
          try {
            let targetDir = rootDirHandle;
            if (folder) {
              const segs = folder.split("/").filter(Boolean);
              for (const seg of segs) {
                targetDir = await targetDir.getDirectoryHandle(seg, { create: false });
              }
            }
            const fileHandle = await targetDir.getFileHandle(fileName, { create: false });
            const file = await fileHandle.getFile();
            preview = URL.createObjectURL(file);
            cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, preview);
          } catch {
            /* ignore traversal failure */
          }
        }

        // Try resolving handle from stored handle
        if (!preview) {
          try {
            const handle = await getStoredFileHandle(n.id);
            if (handle) {
              const perm = await requestPermissionIfAvailable(handle, "read");
              if (perm === "granted") {
                const file = await handle.getFile();
                preview = URL.createObjectURL(file);
                cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, preview);
              }
            }
          } catch {
            /* ignore handle preview fallback */
          }
        }

        // Try resolving from Electron
        if (!preview && electronAPI?.readFileBase64) {
          try {
            const saved = electronAPI.getSavedWorkspace
              ? await electronAPI.getSavedWorkspace()
              : null;
            const workspacePath = saved?.folderPath || saved?.path;
            if (workspacePath) {
              const fullPath = folder
                ? `${workspacePath}/${folder}/${fileName}`
                : `${workspacePath}/${fileName}`;
              const base64 = await electronAPI.readFileBase64(fullPath);
              if (base64) {
                const ext = fileName.split(".").pop()?.toLowerCase() || "png";
                const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
                preview = `data:${mime};base64,${base64}`;
                cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, preview);
              }
            }
          } catch {
            /* ignore electron resolution */
          }
        }

        if (preview) {
          previewsMap[key] = preview;
        }

        itemsMap.set(key, {
          id: key,
          fileName,
          folderPath: folder,
          relativePath: relPath,
          src: preview,
          isAttachment: isAttachmentNote(n),
        });
      }

      if (!isCancelled) {
        setScannedItems(Array.from(itemsMap.values()));
        setPreviewUrls((prev) => ({ ...prev, ...previewsMap }));
        setIsLoading(false);
      }
    };

    void scanAllImages();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, rootDirHandle, notes, assetBlobUrlMap]);

  const attachmentItems = useMemo(() => {
    return scannedItems.filter((i) => i.isAttachment);
  }, [scannedItems]);

  const workspaceOnlyItems = useMemo(() => {
    return scannedItems.filter((i) => !i.isAttachment);
  }, [scannedItems]);

  const displayedItems = useMemo(() => {
    const list = activeTab === "attachments" ? attachmentItems : workspaceOnlyItems;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((i) => {
      const name = i.fileName.toLowerCase();
      const folder = i.folderPath.toLowerCase();
      return name.includes(query) || folder.includes(query);
    });
  }, [activeTab, attachmentItems, workspaceOnlyItems, searchQuery]);

  const handleSelectAndInsert = useCallback(
    (item: ScannedImageItem) => {
      const relPath = getRelativePathBetween(
        currentNote?.folderPath,
        item.folderPath,
        item.fileName
      );
      const preview = item.src || previewUrls[item.id];

      const syntheticNote: Note = {
        id: item.id,
        title: item.fileName,
        fileName: item.fileName,
        folderPath: item.folderPath,
        fileType: "image",
        content: preview || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onSelectImage(syntheticNote, relPath, preview);
      onClose();
    },
    [currentNote?.folderPath, previewUrls, onSelectImage, onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md rounded-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("editor.workspaceImagesTitle")}</DialogTitle>
          <DialogDescription>{t("editor.workspaceImagesDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 min-w-0">
          {/* Search bar & View Mode Switcher */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("editor.searchImagesPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const target = displayedItems.find((i) => i.id === selectedItemId) || displayedItems[0];
                    if (target) handleSelectAndInsert(target);
                  }
                }}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors min-w-0"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode((prev) => (prev === "list" ? "grid" : "list"))}
                  className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                >
                  {viewMode === "list" ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {viewMode === "list"
                      ? t("launcher.gridView") || "Grid view"
                      : t("launcher.listView") || "List view"}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {viewMode === "list"
                  ? t("launcher.gridView") || "Grid view"
                  : t("launcher.listView") || "List view"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Segmented Pill Toggle Switcher */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold select-none border border-border/40 min-w-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("attachments");
                setSelectedItemId(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "attachments"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t("editor.tabAttachments")} ({attachmentItems.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedItemId(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Images className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t("editor.tabAllWorkspace")} ({workspaceOnlyItems.length})
              </span>
            </button>
          </div>

          {/* Image Grid / List Container */}
          <div className="max-h-[260px] min-h-[140px] overflow-y-auto rounded-xl border border-border bg-muted/10 p-2 min-w-0">
            {isLoading && scannedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                <p className="text-xs">{t("common.loading") || "Scanning..."}</p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-1.5">
                <ImageOff className="h-6 w-6 opacity-40" />
                <p className="text-xs">
                  {activeTab === "attachments"
                    ? t("editor.noAttachmentsFound")
                    : t("editor.noWorkspaceImagesFound")}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-2 min-w-0">
                {displayedItems.map((item) => {
                  const preview = item.src || previewUrls[item.id];
                  const isSelected = selectedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => handleSelectAndInsert(item)}
                      className={`group relative flex flex-col rounded-xl border p-1.5 text-left cursor-pointer transition-all duration-150 min-w-0 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted/30 border border-border/30 flex items-center justify-center">
                        {preview ? (
                          <img
                            src={preview}
                            alt={item.fileName}
                            className="h-full w-full object-contain select-none transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <FileImage className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="mt-1 space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors min-w-0">
                          {item.fileName}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate leading-none min-w-0">
                          <Folder className="h-2.5 w-2.5 shrink-0 opacity-70" />
                          <span className="truncate min-w-0">{item.folderPath || "/"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1 min-w-0">
                {displayedItems.map((item) => {
                  const preview = item.src || previewUrls[item.id];
                  const isSelected = selectedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => handleSelectAndInsert(item)}
                      className={`group flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all duration-150 cursor-pointer min-w-0 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                        {/* Thumbnail */}
                        <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted/30 border border-border/30 shrink-0 flex items-center justify-center">
                          {preview ? (
                            <img
                              src={preview}
                              alt={item.fileName}
                              className="h-full w-full object-contain select-none transition-transform duration-200 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <FileImage className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>

                        {/* Text */}
                        <div className="space-y-0.5 min-w-0 flex-1 pr-2 overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors min-w-0">
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate min-w-0">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border/60 min-w-0 truncate">
                              <Folder className="h-2.5 w-2.5 shrink-0 opacity-70" />
                              <span className="truncate min-w-0">{item.folderPath || "/"}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isSelected && (
                        <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {t("editor.insertImage") || "Select"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Standard Modal Footer */}
        <DialogFooter className="gap-2 sm:justify-end pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!selectedItemId}
            onClick={() => {
              const target = displayedItems.find((i) => i.id === selectedItemId);
              if (target) handleSelectAndInsert(target);
            }}
          >
            {t("editor.insertImage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};