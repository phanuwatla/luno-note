import React, { useState, useEffect, useCallback } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { AudioPlayer } from "./AudioPlayer";
import { asyncDataUrlToBlobUrl } from "./ImageNodeView";

export const audioLocalCache = new Map<string, string>();

export function getAudioMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "webm";
  if (ext === "mp3") return "audio/mp3";
  if (ext === "wav") return "audio/wav";
  if (ext === "ogg" || ext === "opus") return "audio/ogg";
  if (ext === "m4a" || ext === "aac") return "audio/mp4";
  if (ext === "flac") return "audio/flac";
  return "audio/webm";
}

export function sanitizeAudioRelPath(raw: string): string {
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

const AudioNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  deleteNode,
  selected,
}) => {
  const { src, title, "data-relative-src": dataRelativeSrc } = node.attrs;
  const fileName = (dataRelativeSrc || src || "").split("/").pop()?.split("\\").pop();
  const displayTitle = title || (fileName && !fileName.startsWith("blob:") && !fileName.startsWith("data:") ? decodeURIComponent(fileName) : undefined);

  const [localResolvedSrc, setLocalResolvedSrc] = useState<string | null>(null);

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

    const cleanRel = sanitizeAudioRelPath(rawCandidate);
    if (!cleanRel || /^(https?:|data:)/i.test(cleanRel)) {
      setLocalResolvedSrc(null);
      return;
    }

    const cached = audioLocalCache.get(cleanRel);
    if (cached && !cached.startsWith("luno-asset:")) {
      setLocalResolvedSrc(cached);
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

            const cachedByFull = audioLocalCache.get(fullPath);
            if (cachedByFull && !cachedByFull.startsWith("luno-asset:")) {
              if (!isCancelled) {
                setLocalResolvedSrc(cachedByFull);
              }
              return;
            }

            // 1. Preferred: High performance binary buffer directly to Blob URL
            if (electronAPI.readFileBuffer) {
              try {
                const buf = await electronAPI.readFileBuffer(fullPath);
                if (buf && buf.byteLength > 0) {
                  const mime = getAudioMimeType(cleanRel);
                  const blob = new Blob([buf], { type: mime });
                  const blobUrl = URL.createObjectURL(blob);
                  audioLocalCache.set(cleanRel, blobUrl);
                  audioLocalCache.set(fullPath, blobUrl);
                  if (!isCancelled) {
                    setLocalResolvedSrc(blobUrl);
                  }
                  return;
                }
              } catch (bufErr) {
                console.warn("electronAPI.readFileBuffer failed, trying fallback:", bufErr);
              }
            }

            // 2. Fallback: readImageDataUrl or readFileBase64
            let dataUrl = electronAPI.readImageDataUrl ? await electronAPI.readImageDataUrl(fullPath) : null;
            if (!dataUrl && electronAPI.readFileBase64) {
              const b64 = await electronAPI.readFileBase64(fullPath);
              if (b64) {
                const mime = getAudioMimeType(cleanRel);
                dataUrl = `data:${mime};base64,${b64}`;
              }
            }

            if (!isCancelled && dataUrl) {
              const blobUrl = await asyncDataUrlToBlobUrl(dataUrl);
              audioLocalCache.set(cleanRel, blobUrl);
              audioLocalCache.set(fullPath, blobUrl);
              setLocalResolvedSrc(blobUrl);
              return;
            }
          }
        }

        // Web File System Access API
        const globalRootDir = (window as any).__luno_rootDirHandle;
        if (globalRootDir && typeof globalRootDir.getDirectoryHandle === "function") {
          try {
            const parts = cleanRel.split(/[\\/]/).filter(Boolean);
            const targetFileName = parts.pop();
            if (targetFileName) {
              let currentDir = globalRootDir;
              for (const dirName of parts) {
                currentDir = await currentDir.getDirectoryHandle(dirName, { create: false });
              }
              const fileHandle = await currentDir.getFileHandle(targetFileName, { create: false });
              const file = await fileHandle.getFile();
              const blobUrl = URL.createObjectURL(file);
              audioLocalCache.set(cleanRel, blobUrl);
              if (!isCancelled) {
                setLocalResolvedSrc(blobUrl);
              }
              return;
            }
          } catch (webErr) {
            console.warn("Web FileSystem resolve failed for audio:", webErr);
          }
        }
      } catch (err) {
        console.warn("Failed to resolve local audio in AudioNodeView:", err);
      }
    };

    void resolveLocal();
    return () => {
      isCancelled = true;
    };
  }, [src, dataRelativeSrc]);

  const displaySrc = localResolvedSrc || src;

  const handlePlayerError = useCallback(async () => {
    console.warn("AudioPlayer error loading displaySrc:", displaySrc);
    const target = dataRelativeSrc || (!/^(https?:|data:)/i.test(src) ? src : null);
    if (target) {
      const cleanRel = sanitizeAudioRelPath(target);
      if (cleanRel) {
        audioLocalCache.delete(cleanRel);
        if (displaySrc) audioLocalCache.delete(displaySrc);

        const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
        if (electronAPI?.getSavedWorkspace && (electronAPI?.readFileBuffer || electronAPI?.readFileBase64)) {
          try {
            const saved = await electronAPI.getSavedWorkspace();
            const workspacePath = saved?.folderPath || saved?.path;
            if (workspacePath) {
              const isAbsolute = /^[a-zA-Z]:[\\/]/.test(cleanRel) || cleanRel.startsWith("/");
              const fullPath = isAbsolute ? cleanRel : `${workspacePath}/${cleanRel}`;
              audioLocalCache.delete(fullPath);

              let recoveredBlobUrl: string | null = null;
              if (electronAPI.readFileBuffer) {
                try {
                  const buf = await electronAPI.readFileBuffer(fullPath);
                  if (buf && buf.byteLength > 0) {
                    const mime = getAudioMimeType(cleanRel);
                    recoveredBlobUrl = URL.createObjectURL(new Blob([buf], { type: mime }));
                  }
                } catch {}
              }
              if (!recoveredBlobUrl && electronAPI.readFileBase64) {
                const b64 = await electronAPI.readFileBase64(fullPath);
                if (b64) {
                  const mime = getAudioMimeType(cleanRel);
                  recoveredBlobUrl = await asyncDataUrlToBlobUrl(`data:${mime};base64,${b64}`);
                }
              }

              if (recoveredBlobUrl) {
                audioLocalCache.set(cleanRel, recoveredBlobUrl);
                audioLocalCache.set(fullPath, recoveredBlobUrl);
                setLocalResolvedSrc(recoveredBlobUrl);
              }
            }
          } catch (recErr) {
            console.warn("Audio recovery failed:", recErr);
          }
        }
      }
    }
  }, [displaySrc, dataRelativeSrc, src]);

  return (
    <NodeViewWrapper className="audio-node-wrapper my-2.5 w-full">
      <AudioPlayer
        src={displaySrc}
        title={displayTitle}
        selected={selected}
        onDelete={deleteNode}
        onError={handlePlayerError}
        dataRelativeSrc={dataRelativeSrc}
      />
    </NodeViewWrapper>
  );
};

export const AudioNodeView = React.memo(AudioNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.src === nextProps.node.attrs.src &&
    prevProps.node.attrs.title === nextProps.node.attrs.title &&
    prevProps.node.attrs["data-relative-src"] === nextProps.node.attrs["data-relative-src"] &&
    prevProps.selected === nextProps.selected
  );
});

export default AudioNodeView;