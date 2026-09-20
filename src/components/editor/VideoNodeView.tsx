import React, { useState, useEffect } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { VideoOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { dataUrlToBlobUrl } from "./ImageNodeView";

const videoLocalCache = new Map<string, string>();

const VideoNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  selected,
}) => {
  const { t } = useTranslation();
  const { src, width, textAlign, "data-relative-src": dataRelativeSrc } = node.attrs;
  const [hasError, setHasError] = useState(false);
  const [localResolvedSrc, setLocalResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  useEffect(() => {
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
    const cached = videoLocalCache.get(cleanRel);
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
            const cachedByFull = videoLocalCache.get(fullPath);
            if (cachedByFull) {
              setLocalResolvedSrc(cachedByFull);
              setHasError(false);
              return;
            }
            const dataUrl = await electronAPI.readImageDataUrl(fullPath);
            if (dataUrl) {
              const blobUrl = dataUrlToBlobUrl(dataUrl);
              videoLocalCache.set(cleanRel, blobUrl);
              videoLocalCache.set(fullPath, blobUrl);
              setLocalResolvedSrc(blobUrl);
              setHasError(false);
              return;
            }
          }
        }
      } catch {}
      setHasError(true);
    };
    void resolveLocal();
  }, [src, dataRelativeSrc]);

  if (hasError) {
    return (
      <NodeViewWrapper
        as="div"
        className="my-2 inline-flex max-w-full clear-both select-none align-middle"
        contentEditable={false}
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-border/80 bg-muted/40 text-muted-foreground text-xs select-none max-w-full">
          <VideoOff className="w-3.5 h-3.5 opacity-60 shrink-0" />
          <span className="truncate max-w-[280px]">
            {t("editor.videoLoadError") || "Video could not be loaded"}
          </span>
        </div>
      </NodeViewWrapper>
    );
  }

  const displaySrc = localResolvedSrc || src;

  return (
    <NodeViewWrapper
      as="div"
      className="my-3 block w-full max-w-full clear-both select-none leading-none"
      contentEditable={false}
      style={{
        textAlign: textAlign || undefined,
      }}
    >
      <div
        className={`relative inline-block max-w-full rounded-xl overflow-hidden align-middle transition-all duration-150 ${
          selected ? "ring-2 ring-primary ring-offset-2" : "border border-border/80"
        }`}
        style={{
          width: width ? `${width}px` : "auto",
          maxWidth: "100%",
        }}
      >
        <video
          src={displaySrc}
          controls
          className="block max-w-full h-auto rounded-xl"
          style={{ maxWidth: "100%" }}
          onError={() => setHasError(true)}
        />
      </div>
    </NodeViewWrapper>
  );
};

export const VideoNodeView = React.memo(VideoNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.src === nextProps.node.attrs.src &&
    prevProps.node.attrs.width === nextProps.node.attrs.width &&
    prevProps.node.attrs.textAlign === nextProps.node.attrs.textAlign &&
    prevProps.node.attrs["data-relative-src"] === nextProps.node.attrs["data-relative-src"] &&
    prevProps.selected === nextProps.selected
  );
});

export default VideoNodeView;
