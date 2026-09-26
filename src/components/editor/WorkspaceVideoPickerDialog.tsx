import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Search,
  VideoOff,
  Folder,
  Loader2,
  Paperclip,
  Film,
  Video,
  Play,
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
import {
  getRelativePathBetween,
  isAttachmentPath,
  cacheBlobUrlInMap,
  IMAGE_EXTENSIONS,
} from "./WorkspaceImagePickerDialog";
import { imageLocalCache, dataUrlToBlobUrl, asyncDataUrlToBlobUrl } from "./ImageNodeView";
import { videoLocalCache, getVideoMimeType } from "./VideoNodeView";
import { isVideoMedia, isAudioMedia } from "@/lib/webmClassifier";

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".mov",
  ".m4v",
  ".mkv",
  ".avi",
]);

export interface ScannedVideoItem {
  id: string;
  fileName: string;
  folderPath: string;
  relativePath: string;
  fullPath?: string;
  src?: string;
  fileHandle?: FileSystemFileHandle;
  isAttachment: boolean;
  posterSrc?: string;
  companionImageHandle?: FileSystemFileHandle;
  companionImageFullPath?: string;
}

export function isVideoNote(note: Note): boolean {
  if (note.fileType === "audio") return false;
  const name = (note.fileName || note.title || "").toLowerCase();
  if (name.endsWith(".webm")) {
    return isVideoMedia(name, note);
  }
  if (note.fileType === "binary") {
    const dot = name.lastIndexOf(".");
    if (dot >= 0 && VIDEO_EXTENSIONS.has(name.slice(dot))) return true;
  }
  return /\.(mp4|ogg|ogv|mov|m4v|mkv|avi)$/i.test(name);
}

interface WorkspaceVideoPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentNote: Note | null;
}

export const videoThumbnailCache = new Map<string, string>();

export async function captureVideoFrame(
  videoUrl: string,
  targetTime = 0.1
): Promise<string | null> {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    return null;
  }
  if (!videoUrl) return null;
  if (videoThumbnailCache.has(videoUrl)) {
    return videoThumbnailCache.get(videoUrl)!;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const cleanup = () => {
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    const finish = (result: string | null) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        if (result) {
          videoThumbnailCache.set(videoUrl, result);
        }
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish(null);
    }, 4000);

    video.onloadeddata = () => {
      try {
        const duration = video.duration || 1;
        const seek = Math.min(targetTime, Math.max(0.001, duration * 0.1));
        video.currentTime = seek;
      } catch {
        finish(null);
      }
    };

    video.onseeked = () => {
      try {
        clearTimeout(timer);
        const w = Math.min(video.videoWidth || 320, 320);
        const h = Math.min(video.videoHeight || 240, 240);
        if (w <= 0 || h <= 0) {
          finish(null);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        finish(dataUrl);
      } catch {
        finish(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };

    video.src = videoUrl;
  });
}

export const VideoItemThumbnail: React.FC<{
  item: ScannedVideoItem;
  previewUrl?: string;
  isListMode?: boolean;
  onResolved?: (id: string, url: string) => void;
}> = ({ item, previewUrl, isListMode, onResolved }) => {
  const [posterSrc, setPosterSrc] = useState<string | undefined>(() => {
    return (
      item.posterSrc ||
      videoThumbnailCache.get(item.relativePath) ||
      videoThumbnailCache.get(item.id) ||
      imageLocalCache.get(item.relativePath.replace(/\.[^.]+$/, ".png")) ||
      imageLocalCache.get(item.relativePath.replace(/\.[^.]+$/, ".jpg"))
    );
  });
  const [videoSrc, setVideoSrc] = useState<string | undefined>(() => {
    return (
      previewUrl ||
      item.src ||
      videoLocalCache.get(item.relativePath) ||
      (item.fullPath ? videoLocalCache.get(item.fullPath) : undefined)
    );
  });
  const [loading, setLoading] = useState(!posterSrc && !videoSrc);
  const [failed, setFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const resolveAll = async () => {
      try {
        let currentPoster = posterSrc;
        let currentVideo = videoSrc;

        // 1. Try resolving companion image if posterSrc is not already set
        if (!currentPoster) {
          if (item.companionImageHandle) {
            try {
              const file = await item.companionImageHandle.getFile();
              const blobUrl = URL.createObjectURL(file);
              imageLocalCache.set(item.relativePath.replace(/\.[^.]+$/, ""), blobUrl);
              if (!isCancelled) {
                currentPoster = blobUrl;
                setPosterSrc(blobUrl);
              }
            } catch {}
          } else if (item.companionImageFullPath) {
            const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
            if (electronAPI) {
              if (electronAPI.readFileBuffer) {
                try {
                  const buf = await electronAPI.readFileBuffer(item.companionImageFullPath);
                  if (buf && buf.byteLength > 0 && !isCancelled) {
                    const ext = item.companionImageFullPath.split(".").pop()?.toLowerCase() || "png";
                    const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
                    const blob = new Blob([buf], { type: mime });
                    const blobUrl = URL.createObjectURL(blob);
                    imageLocalCache.set(item.companionImageFullPath, blobUrl);
                    currentPoster = blobUrl;
                    setPosterSrc(blobUrl);
                  }
                } catch {}
              }
              if (!currentPoster && electronAPI.readImageDataUrl) {
                try {
                  const dataUrl = await electronAPI.readImageDataUrl(item.companionImageFullPath);
                  if (dataUrl && !isCancelled) {
                    const blobUrl = dataUrlToBlobUrl(dataUrl);
                    imageLocalCache.set(item.companionImageFullPath, blobUrl);
                    currentPoster = blobUrl;
                    setPosterSrc(blobUrl);
                  }
                } catch {}
              }
            }
          }
        }

        // 2. Resolve video source if not available
        if (!currentVideo) {
          const cached =
            videoLocalCache.get(item.relativePath) ||
            (item.fullPath ? videoLocalCache.get(item.fullPath) : undefined);
          if (cached) {
            currentVideo = cached;
            if (!isCancelled) {
              setVideoSrc(cached);
              onResolved?.(item.id, cached);
            }
          } else if (item.fileHandle) {
            try {
              const file = await item.fileHandle.getFile();
              const blobUrl = URL.createObjectURL(file);
              videoLocalCache.set(item.relativePath, blobUrl);
              currentVideo = blobUrl;
              if (!isCancelled) {
                setVideoSrc(blobUrl);
                onResolved?.(item.id, blobUrl);
              }
            } catch {}
          } else {
            const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
            if (electronAPI) {
              let fullPath = item.fullPath;
              if (!fullPath && electronAPI.getSavedWorkspace) {
                const saved = await electronAPI.getSavedWorkspace();
                const ws = saved?.folderPath || saved?.path;
                if (ws) fullPath = `${ws}/${item.relativePath}`;
              }

              if (fullPath) {
                if (electronAPI.readFileBuffer) {
                  try {
                    const buf = await electronAPI.readFileBuffer(fullPath);
                    if (buf && buf.byteLength > 0 && !isCancelled) {
                      const mime = getVideoMimeType(item.fileName);
                      const blob = new Blob([buf], { type: mime });
                      const blobUrl = URL.createObjectURL(blob);
                      videoLocalCache.set(item.relativePath, blobUrl);
                      videoLocalCache.set(fullPath, blobUrl);
                      currentVideo = blobUrl;
                      setVideoSrc(blobUrl);
                      onResolved?.(item.id, blobUrl);
                    }
                  } catch {}
                }

                if (!currentVideo && electronAPI.readImageDataUrl) {
                  try {
                    const dataUrl = await electronAPI.readImageDataUrl(fullPath);
                    if (dataUrl && !isCancelled) {
                      const blobUrl = await asyncDataUrlToBlobUrl(dataUrl);
                      videoLocalCache.set(item.relativePath, blobUrl);
                      videoLocalCache.set(fullPath, blobUrl);
                      currentVideo = blobUrl;
                      setVideoSrc(blobUrl);
                      onResolved?.(item.id, blobUrl);
                    }
                  } catch {}
                }
              }
            }
          }
        }

        // 3. Extract video frame thumbnail if still no poster
        if (!currentPoster && currentVideo) {
          const cachedFrame =
            videoThumbnailCache.get(item.relativePath) || videoThumbnailCache.get(currentVideo);
          if (cachedFrame) {
            if (!isCancelled) setPosterSrc(cachedFrame);
          } else {
            const frame = await captureVideoFrame(currentVideo, 0.1);
            if (frame && !isCancelled) {
              videoThumbnailCache.set(item.relativePath, frame);
              setPosterSrc(frame);
            }
          }
        }

        if (!isCancelled) {
          setLoading(false);
          if (!currentPoster && !currentVideo) {
            setFailed(true);
          }
        }
      } catch {
        if (!isCancelled) {
          setLoading(false);
          setFailed(true);
        }
      }
    };

    void resolveAll();
    return () => {
      isCancelled = true;
    };
  }, [item, posterSrc, videoSrc, onResolved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted/20">
        <Loader2 className={`${isListMode ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin text-muted-foreground/30`} />
      </div>
    );
  }

  if (failed || (!posterSrc && !videoSrc)) {
    return <Film className={`${isListMode ? "h-5 w-5" : "h-6 w-6"} text-muted-foreground/50`} />;
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onMouseEnter={() => {
        setIsHovered(true);
        if (videoRef.current && videoSrc) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      {/* 1. Poster or Extracted Video Frame Image */}
      {posterSrc ? (
        <img
          src={posterSrc}
          alt={item.fileName}
          className={`h-full w-full object-cover select-none transition-opacity duration-200 ${
            isHovered && videoSrc ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
        />
      ) : videoSrc ? (
        <video
          src={`${videoSrc}#t=0.001`}
          preload="metadata"
          muted
          playsInline
          className={`h-full w-full object-cover select-none transition-opacity duration-200 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}

      {/* 2. Interactive Video Element for Hover Live-Preview */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          muted
          playsInline
          loop
          className={`absolute inset-0 h-full w-full object-cover select-none pointer-events-none transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 3. Translucent Center Play Icon Badge */}
      <div
        className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-all ${
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100 group-hover:bg-black/10"
        }`}
      >
        <div
          className={`${
            isListMode ? "h-5 w-5" : "h-7 w-7"
          } rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform`}
        >
          <Play className={`${isListMode ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} fill-current ml-0.5`} />
        </div>
      </div>
    </div>
  );
};

export const WorkspaceVideoPickerDialog: React.FC<WorkspaceVideoPickerDialogProps> = ({
  isOpen,
  onClose,
  notes,
  currentNote,
  rootDirHandle,
  assetBlobUrlMap,
  onSelectVideo,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"attachments" | "all">("attachments");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [scannedItems, setScannedItems] = useState<ScannedVideoItem[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedItemId(null);
      setSearchQuery("");
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const scanAllVideos = async () => {
      const itemsMap = new Map<string, ScannedVideoItem>();
      const previewsMap: Record<string, string> = {};

      const isVidFile = (name: string) => {
        const dot = name.lastIndexOf(".");
        if (dot < 0) return false;
        const ext = name.slice(dot).toLowerCase();
        if (ext === ".webm") {
          return isVideoMedia(name);
        }
        return VIDEO_EXTENSIONS.has(ext);
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

      const companionImageHandlesMap = new Map<string, FileSystemFileHandle>();
      const companionImagePathsMap = new Map<string, string>();

      // 1. Direct Web File System Access
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
              } else if (handle.kind === "file") {
                const dot = name.lastIndexOf(".");
                const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
                if (IMAGE_EXTENSIONS.has(ext)) {
                  const base = name.slice(0, dot).toLowerCase();
                  const relBase = folder ? `${folder}/${base}`.toLowerCase() : base;
                  companionImageHandlesMap.set(relBase, handle as FileSystemFileHandle);
                  const cleanBase = base.replace(/[-_.](poster|thumb|thumbnail|cover)$/i, "");
                  companionImageHandlesMap.set(folder ? `${folder}/${cleanBase}`.toLowerCase() : cleanBase, handle as FileSystemFileHandle);
                } else if (isVidFile(name)) {
                  const fileHandle = handle as FileSystemFileHandle;
                  const relPath = folder ? `${folder}/${name}` : name;
                  const key = `fs_${relPath}`;

                  try {
                    const file = await fileHandle.getFile();
                    const blobUrl = URL.createObjectURL(file);
                    previewsMap[key] = blobUrl;

                    cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, blobUrl);
                    videoLocalCache.set(relPath, blobUrl);

                    const base = name.replace(/\.[^.]+$/, "").toLowerCase();
                    const searchKey = folder ? `${folder}/${base}`.toLowerCase() : base;
                    const companionHandle = companionImageHandlesMap.get(searchKey);

                    itemsMap.set(key, {
                      id: key,
                      fileName: name,
                      folderPath: folder,
                      relativePath: relPath,
                      src: blobUrl,
                      fileHandle,
                      isAttachment: isAttachmentPath(folder, name),
                      companionImageHandle: companionHandle,
                    });
                  } catch (err) {
                    console.warn("Failed reading video file handle:", name, err);
                  }
                }
              }
            }
          };

          await scanDir(rootDirHandle, "");
        } catch (err) {
          console.warn("Failed scanning workspace folder for videos:", err);
        }
      }

      // 2. Electron Desktop Workspace
      const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
      if (electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles) {
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
                    } else {
                      const dot = f.name.lastIndexOf(".");
                      const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : "";
                      if (IMAGE_EXTENSIONS.has(ext)) {
                        const base = f.name.slice(0, dot).toLowerCase();
                        const relBase = folder ? `${folder}/${base}`.toLowerCase() : base;
                        companionImagePathsMap.set(relBase, f.fullPath);
                        const cleanBase = base.replace(/[-_.](poster|thumb|thumbnail|cover)$/i, "");
                        companionImagePathsMap.set(folder ? `${folder}/${cleanBase}`.toLowerCase() : cleanBase, f.fullPath);
                      } else if (isVidFile(f.name)) {
                        const relPath = folder ? `${folder}/${f.name}` : f.name;
                        const key = `el_${relPath}`;

                        const preview =
                          videoLocalCache.get(relPath) ||
                          (f.fullPath ? videoLocalCache.get(f.fullPath) : undefined) ||
                          assetBlobUrlMap?.current?.get(relPath);

                        if (preview) {
                          previewsMap[key] = preview;
                        }

                        const base = f.name.replace(/\.[^.]+$/, "").toLowerCase();
                        const searchKey = folder ? `${folder}/${base}`.toLowerCase() : base;
                        const companionPath = companionImagePathsMap.get(searchKey);

                        if (!itemsMap.has(key)) {
                          itemsMap.set(key, {
                            id: key,
                            fileName: f.name,
                            folderPath: folder,
                            relativePath: relPath,
                            fullPath: f.fullPath,
                            src: preview,
                            isAttachment: isAttachmentPath(folder, f.name),
                            companionImageFullPath: companionPath,
                          });
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn("Failed scanning electron directory for videos:", fullDir, err);
              }
            };

            await scanElectronFolder("");

            for (const item of itemsMap.values()) {
              const base = item.fileName.replace(/\.[^.]+$/, "").toLowerCase();
              const searchKey = item.folderPath ? `${item.folderPath}/${base}`.toLowerCase() : base;
              if (!item.companionImageFullPath && companionImagePathsMap.has(searchKey)) {
                item.companionImageFullPath = companionImagePathsMap.get(searchKey);
              }
              if (!item.companionImageHandle && companionImageHandlesMap.has(searchKey)) {
                item.companionImageHandle = companionImageHandlesMap.get(searchKey);
              }
            }
          }
        } catch (err) {
          console.warn("Failed scanning electron workspace videos:", err);
        }
      }

      // 3. Fallback resolution for any note in notes array
      for (const n of notes) {
        if (isCancelled) break;
        if (!isVideoNote(n)) continue;

        const fileName = n.fileName || n.title || "video.mp4";
        const folder = n.folderPath || "";
        const relPath = folder ? `${folder}/${fileName}` : fileName;
        const key = n.id;

        if (itemsMap.has(`fs_${relPath}`) || itemsMap.has(`el_${relPath}`) || itemsMap.has(key)) {
          continue;
        }

        let preview =
          n.content?.startsWith("data:video/") || n.content?.startsWith("blob:")
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
                const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
                let mime = "video/mp4";
                if (ext === "webm") mime = "video/webm";
                else if (ext === "mov") mime = "video/quicktime";
                else if (ext === "ogg" || ext === "ogv") mime = "video/ogg";
                else if (ext === "mkv") mime = "video/x-matroska";
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
          isAttachment: isAttachmentPath(folder, fileName),
        });
      }

      if (!isCancelled) {
        setScannedItems(Array.from(itemsMap.values()));
        setPreviewUrls((prev) => ({ ...prev, ...previewsMap }));
        setIsLoading(false);
      }
    };

    void scanAllVideos();

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
    async (item: ScannedVideoItem) => {
      const relPath = getRelativePathBetween(
        currentNote?.folderPath,
        item.folderPath,
        item.fileName
      );
      let blobUrl = previewUrls[item.id] || item.src;
      if (blobUrl?.startsWith("luno-asset:")) blobUrl = undefined;

      if (!blobUrl && assetBlobUrlMap?.current) {
        blobUrl =
          assetBlobUrlMap.current.get(relPath) ||
          assetBlobUrlMap.current.get(item.relativePath) ||
          assetBlobUrlMap.current.get(encodeURI(relPath));
      }

      // If not yet converted to Blob URL, resolve this ONE video on-demand before inserting:
      if (!blobUrl) {
        if (item.fileHandle) {
          try {
            const file = await item.fileHandle.getFile();
            blobUrl = URL.createObjectURL(file);
          } catch (err) {
            console.warn("Failed reading video file handle:", err);
          }
        } else if (item.fullPath) {
          const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
          if (electronAPI) {
            if (electronAPI.readFileBuffer) {
              try {
                const buf = await electronAPI.readFileBuffer(item.fullPath);
                if (buf && buf.byteLength > 0) {
                  const mime = getVideoMimeType(item.fileName);
                  blobUrl = URL.createObjectURL(new Blob([buf], { type: mime }));
                }
              } catch (e) {
                console.warn("readFileBuffer in picker failed:", e);
              }
            }
            if (!blobUrl && electronAPI.readImageDataUrl) {
              try {
                const dataUrl = await electronAPI.readImageDataUrl(item.fullPath);
                if (dataUrl) blobUrl = await asyncDataUrlToBlobUrl(dataUrl);
              } catch (e) {
                console.warn("readImageDataUrl in picker failed:", e);
              }
            }
            if (!blobUrl && electronAPI.readFileBase64) {
              try {
                const b64 = await electronAPI.readFileBase64(item.fullPath);
                if (b64) {
                  const mime = getVideoMimeType(item.fileName);
                  blobUrl = await asyncDataUrlToBlobUrl(`data:${mime};base64,${b64}`);
                }
              } catch (e) {
                console.warn("readFileBase64 in picker failed:", e);
              }
            }
          }
        }
      }

      if (blobUrl) {
        cacheBlobUrlInMap(assetBlobUrlMap?.current, relPath, blobUrl);
        cacheBlobUrlInMap(assetBlobUrlMap?.current, item.relativePath, blobUrl);
        videoLocalCache.set(relPath, blobUrl);
        videoLocalCache.set(item.relativePath, blobUrl);
        if (item.fullPath) videoLocalCache.set(item.fullPath, blobUrl);
      }

      const syntheticNote: Note = {
        id: item.id,
        title: item.fileName,
        fileName: item.fileName,
        folderPath: item.folderPath,
        fileType: "binary",
        content: blobUrl || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onSelectVideo(syntheticNote, relPath, blobUrl);
      onClose();
    },
    [currentNote?.folderPath, previewUrls, assetBlobUrlMap, onSelectVideo, onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md rounded-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("editor.workspaceVideosTitle") || "Workspace Videos"}</DialogTitle>
          <DialogDescription>
            {t("editor.workspaceVideosDescription") ||
              "Select a video from attachments or workspace folders to insert into your note."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 min-w-0">
          {/* Search bar & View Mode Switcher */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("editor.searchVideosPlaceholder") || "Search videos by name or folder..."}
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
              <Video className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t("editor.tabAllWorkspaceVideos") || "All Workspace Videos"} ({workspaceOnlyItems.length})
              </span>
            </button>
          </div>

          {/* Video Grid / List Container */}
          <div className="max-h-[260px] min-h-[140px] overflow-y-auto rounded-xl border border-border bg-muted/10 p-2 min-w-0">
            {isLoading && scannedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                <p className="text-xs">{t("common.loading") || "Scanning..."}</p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-1.5">
                <VideoOff className="h-6 w-6 opacity-40" />
                <p className="text-xs">
                  {activeTab === "attachments"
                    ? t("editor.noAttachmentsVideosFound") || "No videos found in attachments folder."
                    : t("editor.noWorkspaceVideosFound") || "No videos found in workspace."}
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
                      {/* Video Thumbnail / Preview */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted/30 border border-border/30 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                        <VideoItemThumbnail
                          item={item}
                          previewUrl={item.src || previewUrls[item.id]}
                          onResolved={(id, url) => {
                            setPreviewUrls((prev) => (prev[id] === url ? prev : { ...prev, [id]: url }));
                          }}
                        />
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
                        <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted/30 border border-border/30 shrink-0 flex items-center justify-center relative">
                          <VideoItemThumbnail
                            item={item}
                            previewUrl={item.src || previewUrls[item.id]}
                            isListMode
                            onResolved={(id, url) => {
                              setPreviewUrls((prev) => (prev[id] === url ? prev : { ...prev, [id]: url }));
                            }}
                          />
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
                          {t("editor.insertVideo") || "Select"}
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
            {t("editor.insertVideo") || "Insert video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
