import React, { useEffect, useRef, useState, memo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { X, FileText, FileCode, Plus, FileImage, File, FolderArchive, Settings, Globe, Home } from "lucide-react";
import { SparklesIcon as Sparkles } from "@/components/icons/SparklesIcon";
import type { Note } from "@/hooks/useNotes";
import { Columns2Icon } from "@/components/icons/Columns2Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WindowControls from "@/components/WindowControls";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { useAppSettings } from "@/hooks/useAppSettings";

interface TabBarProps {
  tabs: Note[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onSplitTab?: (id: string) => void;
  onNewTab?: () => void;
  onReorderTabs?: (fromIndex: number, toIndex: number) => void;
}

function TabBarComponent({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onSplitTab,
  onNewTab,
  onReorderTabs,
}: TabBarProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const pack = settings?.iconPack || "lucide";

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function getFileType(note: Note): "txt" | "md" | "html" | "image" | "binary" | "zip" | "unknown" {
    if (note.fileType === "image") return "image";
    if (note.fileType === "binary") return "binary";
    const name = note.fileName?.toLowerCase() || "";
    if (name.endsWith(".txt")) return "txt";
    if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
    if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
    if (name.endsWith(".zip")) return "zip";
    return "unknown";
  }

  function WebFaviconIcon({ note, isActive }: { note: Note; isActive: boolean }) {
    const [imgFailed, setImgFailed] = useState(false);
    const cls = `h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/70"}`;

    const url = note.url || (note.id.startsWith("web:") ? note.id.replace(/^web:/, "") : "");
    let faviconUrl = note.faviconUrl;
    if (!faviconUrl && url) {
      try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        if (parsed.hostname) {
          faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=32`;
        }
      } catch {
        /* ignore */
      }
    }

    if (!imgFailed && faviconUrl) {
      return (
        <img
          src={faviconUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="h-3.5 w-3.5 shrink-0 rounded-xs object-contain"
        />
      );
    }

    return <Globe className={cls} />;
  }

  function NoteIcon({ note, isActive }: { note: Note; isActive: boolean }) {
    const cls = `h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/70"}`;
    const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
    const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);
    if (customIcon) {
      const custom = renderCustomIcon(customIcon, cls, { color: customColor });
      if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
    }
    if (note.id === "home" || note.fileType === "home") {
      const HomeIcon = getToolbarIcon("home", pack);
      return <HomeIcon className={cls} />;
    }
    if (note.id === "trash" || note.fileType === "trash") {
      const TrashIcon = getToolbarIcon("trash", pack);
      return <TrashIcon className={cls} />;
    }
    if (note.id === "settings" || note.fileType === "settings") {
      const SettingsIcon = getToolbarIcon("settings", pack);
      return <SettingsIcon className={cls} />;
    }
    if (note.id === "luno-ai" || note.fileType === "luno-ai") {
      const SparklesIconComp = getToolbarIcon("sparkles", pack);
      return <SparklesIconComp className={cls} />;
    }
    if (note.id === "templates" || note.fileType === "templates") {
      const TemplatesIcon = getToolbarIcon("templates", pack);
      return <TemplatesIcon className={cls} />;
    }
    if (note.id === "favorites" || note.fileType === "favorites") {
      const StarIcon = getToolbarIcon("star", pack);
      return <StarIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-amber-500 fill-amber-500" : "text-amber-500/70"}`} />;
    }
    if (note.id === "tags" || note.fileType === "tags") {
      const TagIcon = getToolbarIcon("tag", pack);
      return <TagIcon className={cls} />;
    }
    if (note.fileType === "web-viewer" || note.id.startsWith("web:")) return <WebFaviconIcon note={note} isActive={isActive} />;
    const type = getFileType(note);
    const name = note.fileName?.toLowerCase() || "";
    if (name.endsWith(".zip") || type === "zip") {
      const ZipIcon = getToolbarIcon("fileZip", pack);
      return <ZipIcon className={cls} />;
    }
    if (type === "image") {
      const ImgIcon = getToolbarIcon("fileImage", pack);
      return <ImgIcon className={cls} />;
    }
    if (type === "html" || type === "md") {
      const CodeIcon = getToolbarIcon("fileCode", pack);
      return <CodeIcon className={cls} />;
    }
    if (type === "txt") {
      const TextIcon = getToolbarIcon("fileText", pack);
      return <TextIcon className={cls} />;
    }
    const FileIcon = getToolbarIcon("file", pack);
    return <FileIcon className={cls} />;
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeTabId]);

  return (
    <TooltipProvider delayDuration={420}>
      <div
        className="flex items-center justify-between bg-sidebar-accent/50 h-10 select-none shrink-0 border-b border-border/30"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div
          ref={scrollRef}
          className="no-scrollbar flex items-end gap-0.5 overflow-x-auto px-2 pt-1 h-full flex-1 min-w-0"
        >
          {tabs.length === 0 ? (
            <div
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
              className="group flex flex-1 min-w-[38px] max-w-[190px] cursor-pointer items-center gap-2 rounded-t-xl px-3 py-2 text-xs transition-all duration-150 bg-background text-foreground shadow-xs border-t border-x border-border/40 font-semibold"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{(t as any)("editor.newTab") || "New tab"}</span>
            </div>
          ) : (
            tabs.map((note, index) => {
              const isActive = note.id === activeTabId;
              const isHome = note.id === "home" || note.fileType === "home";
              const isTrash = note.id === "trash" || note.fileType === "trash";
              const isSettings = note.id === "settings" || note.fileType === "settings";
              const isLunoAi = note.id === "luno-ai" || note.fileType === "luno-ai";
              const isTemplates = note.id === "templates" || note.fileType === "templates";
              const isFavorites = note.id === "favorites" || note.fileType === "favorites";
              const isTags = note.id === "tags" || note.fileType === "tags";
              const isWebViewer = note.fileType === "web-viewer" || note.id.startsWith("web:");
              const label = isHome
                ? (t("sidebar.home") || "Home")
                : isTrash
                ? (t("trash.title") || "Trash")
                : isSettings
                ? (t("settings.title") || "Settings")
                : isLunoAi
                ? "Luno AI"
                : isTemplates
                ? (t("sidebar.templates") || (settings?.language === "th" ? "เทมเพลต" : "Templates"))
                : isFavorites
                ? (t("sidebar.favorites") || (settings?.language === "th" ? "ที่ติดดาว" : "Favorites"))
                : isTags
                ? (t("sidebar.tags") || (settings?.language === "th" ? "แท็ก" : "Tags"))
                : isWebViewer
                ? (note.title || note.fileName || t("webViewer.title") || "Web Viewer")
                : (note.fileName || note.title?.trim() || t("editor.untitled"));
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={note.id}
                  ref={isActive ? activeTabRef : null}
                  draggable
                  style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
                  onDragStart={(e) => {
                    setDraggedIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(index));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (draggedIndex !== null && draggedIndex !== index) {
                      if (onReorderTabs) {
                        onReorderTabs(draggedIndex, index);
                      }
                      setDraggedIndex(index);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggedIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                  }}
                  className={`group flex flex-1 min-w-[38px] max-w-[190px] cursor-pointer items-center gap-1.5 rounded-t-xl px-2.5 py-2 text-xs transition-all duration-150 ${
                    isDragging ? "opacity-40 scale-[0.98] bg-muted/60" : ""
                  } ${
                    isActive
                      ? "bg-background text-foreground shadow-xs border-t border-x border-border/40 font-semibold"
                      : "text-muted-foreground/80 hover:text-foreground hover:bg-background/40 font-medium"
                  }`}
                  onClick={() => onSelectTab(note.id)}
                >
                  <NoteIcon note={note} isActive={isActive} />
                  <span className="min-w-0 flex-1 truncate">{label}</span>

                  {/* Action buttons (Split + Close right next to each other) */}
                  <div className="ml-auto flex items-center gap-0.5 shrink-0">
                    {onSplitTab && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSplitTab(note.id);
                            }}
                          >
                            <Columns2Icon className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.splitTab")}</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`rounded-md p-0.5 transition-colors ${
                            isActive
                              ? "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                              : "opacity-0 group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:bg-muted"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseTab(note.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.closeTab")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}

          {onNewTab && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onNewTab}
                  style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/80 hover:bg-background/60 hover:text-foreground transition-colors mb-0.5 ml-1"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("sidebar.newNote")}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Custom Windows Controls (-, □, ✕) */}
        <WindowControls />
      </div>
    </TooltipProvider>
  );
}

export default React.memo(TabBarComponent);
