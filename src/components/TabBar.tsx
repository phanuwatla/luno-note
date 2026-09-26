import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  X,
  FileText,
  FileCode,
  Plus,
  FileImage,
  File,
  FolderArchive,
  Settings,
  Globe,
  Home,
  RotateCw,
  Copy,
  ArrowRightToLine,
  Layers,
  Folder,
  Link as LinkIcon,
} from "lucide-react";
import { SparklesIcon as Sparkles } from "@/components/icons/SparklesIcon";
import type { Note } from "@/hooks/useNotes";
import { Columns2Icon } from "@/components/icons/Columns2Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import WindowControls from "@/components/WindowControls";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { getNoteDefaultIconKey } from "@/lib/fileIconUtils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/lib/appVersion";
import lunoLogo from "@/assets/luno-logo.png";
import { copyToClipboard } from "@/lib/clipboardUtils";

interface TabBarProps {
  tabs: Note[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs?: (keepId: string) => void;
  onCloseAllTabs?: () => void;
  onCloseTabsToRight?: (targetId: string) => void;
  onDuplicateTab?: (note: Note) => void;
  onReloadTab?: (id: string) => void;
  onSplitTab?: (id: string) => void;
  onNewTab?: () => void;
  onReorderTabs?: (fromIndex: number, toIndex: number) => void;
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

function NoteIcon({ note, isActive, pack, settings }: { note: Note; isActive: boolean; pack: any; settings: any }) {
  const cls = `h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/70"}`;
  if (note.id === "home" || note.id.startsWith("home:") || note.fileType === "home") {
    const HomeIcon = getToolbarIcon("home", pack);
    return <HomeIcon className={cls} />;
  }
  if (note.id === "trash" || note.id.startsWith("trash:") || note.fileType === "trash") {
    const TrashIcon = getToolbarIcon("trash", pack);
    return <TrashIcon className={cls} />;
  }
  if (note.id === "settings" || note.id.startsWith("settings:") || note.fileType === "settings") {
    const SettingsIcon = getToolbarIcon("settings", pack);
    return <SettingsIcon className={cls} />;
  }
  if (note.id === "help" || note.id.startsWith("help:") || note.fileType === "help") {
    const HelpIcon = getToolbarIcon("helpCircle", pack);
    return <HelpIcon className={cls} />;
  }
  if (note.id === "whats-new" || note.id.startsWith("whats-new:") || note.fileType === "whats-new") {
    return <img src={lunoLogo} alt="Luno" className="h-3.5 w-3.5 object-contain select-none shrink-0 luno-app-logo" />;
  }
  if (note.id === "luno-ai" || note.id.startsWith("luno-ai:") || note.fileType === "luno-ai") {
    const SparklesIconComp = getToolbarIcon("sparkles", pack);
    return <SparklesIconComp className={cls} />;
  }
  if (note.id === "templates" || note.id.startsWith("templates:") || note.fileType === "templates") {
    const TemplatesIcon = getToolbarIcon("templates", pack);
    return <TemplatesIcon className={cls} />;
  }
  if (note.id === "relations" || note.id.startsWith("relations:") || note.fileType === "relations") {
    const RelationsIcon = getToolbarIcon("relations", pack);
    return <RelationsIcon className={cls} />;
  }
  if (note.id === "favorites" || note.id.startsWith("favorites:") || note.fileType === "favorites") {
    const StarIcon = getToolbarIcon("star", pack);
    return <StarIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-amber-500 fill-amber-500" : "text-amber-500/70"}`} />;
  }
  if (note.id === "tags" || note.id.startsWith("tags:") || note.fileType === "tags") {
    const TagIcon = getToolbarIcon("tag", pack);
    return <TagIcon className={cls} />;
  }
  if (note.fileType === "web-viewer" || note.id.startsWith("web:")) return <WebFaviconIcon note={note} isActive={isActive} />;

  if (settings?.showFileIcons === false) {
    return null;
  }

  const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
  const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
  const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);
  if (customIcon) {
    const custom = renderCustomIcon(customIcon, cls, { color: customColor });
    if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
  }

  const defaultKey = getNoteDefaultIconKey(note);
  const IconComp = getToolbarIcon(defaultKey, pack);
  return <IconComp className={cls} />;
}

interface TabItemProps {
  note: Note;
  index: number;
  totalTabs: number;
  isActive: boolean;
  pack: any;
  settings: any;
  label: string;
  isDragging: boolean;
  activeTabRef: React.RefObject<HTMLDivElement | null> | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs?: (keepId: string) => void;
  onCloseAllTabs?: () => void;
  onCloseTabsToRight?: (targetId: string) => void;
  onDuplicateTab?: (note: Note) => void;
  onReloadTab?: (id: string) => void;
  onNewTab?: () => void;
  onSplitTab?: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  t: (key: string, ...args: any[]) => string;
}

const TabItem = React.memo(function TabItem({
  note,
  index,
  totalTabs,
  isActive,
  pack,
  settings,
  label,
  isDragging,
  activeTabRef,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  onCloseTabsToRight,
  onDuplicateTab,
  onReloadTab,
  onNewTab,
  onSplitTab,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  t,
}: TabItemProps) {
  const isWebViewer = note.fileType === "web-viewer" || note.id.startsWith("web:");
  const isSystemTab =
    note.id === "home" ||
    note.id.startsWith("home:") ||
    note.fileType === "home" ||
    note.id === "trash" ||
    note.id.startsWith("trash:") ||
    note.fileType === "trash" ||
    note.id === "settings" ||
    note.id.startsWith("settings:") ||
    note.fileType === "settings" ||
    note.id === "help" ||
    note.id.startsWith("help:") ||
    note.fileType === "help" ||
    note.id === "luno-ai" ||
    note.id.startsWith("luno-ai:") ||
    note.fileType === "luno-ai" ||
    note.id === "templates" ||
    note.id.startsWith("templates:") ||
    note.fileType === "templates" ||
    note.id === "relations" ||
    note.id.startsWith("relations:") ||
    note.fileType === "relations" ||
    note.id === "favorites" ||
    note.id.startsWith("favorites:") ||
    note.fileType === "favorites" ||
    note.id === "tags" ||
    note.id.startsWith("tags:") ||
    note.fileType === "tags" ||
    note.id === "whats-new" ||
    note.id.startsWith("whats-new:") ||
    note.fileType === "whats-new";

  const handleReload = useCallback(() => {
    window.dispatchEvent(new CustomEvent("luno:reload-web-tab", { detail: { tabId: note.id } }));
    onReloadTab?.(note.id);
  }, [note.id, onReloadTab]);

  const handleCopyUrl = useCallback(() => {
    const url = note.url || (note.id.startsWith("web:") ? note.id.replace(/^web:/, "") : "");
    if (url) {
      void copyToClipboard(url);
      toast({
        title: t("common.copied") || "Copied",
        description: url,
      });
    }
  }, [note, t]);

  const handleCopyRelativePath = useCallback(async () => {
    if (isSystemTab) return;
    const path = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    if (path) {
      await copyToClipboard(path);
      toast({
        title: t("editor.copiedRelativePath") || "คัดลอกพาธสัมพัทธ์แล้ว",
        description: path,
      });
    }
  }, [isSystemTab, note, t]);

  const handleCopyAbsolutePath = useCallback(async () => {
    if (isSystemTab) return;
    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    let ws = "";
    if (electronAPI?.getSavedWorkspace) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        ws = (saved?.folderPath || saved?.path || "") as string;
      } catch {}
    }
    const rel = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    const cleanWs = ws.replace(/[\\/]+$/, "");
    const full = cleanWs ? (rel ? `${cleanWs}/${rel.replace(/^[\\/]+/, "")}` : cleanWs) : rel;
    if (full) {
      await copyToClipboard(full);
      toast({
        title: t("editor.copiedAbsolutePath") || "คัดลอกพาธแบบเต็มแล้ว",
        description: full,
      });
    }
  }, [isSystemTab, note, t]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={isActive ? activeTabRef : null}
          draggable
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          onDragStart={(e) => onDragStart(e, index)}
          onDragOver={(e) => onDragOver(e, index)}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              onCloseTab(note.id);
            }
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
          <NoteIcon note={note} isActive={isActive} pack={pack} settings={settings} />
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
      </ContextMenuTrigger>

      <ContextMenuContent className="w-60 rounded-xl p-1.5 shadow-xl border border-border/80 bg-popover text-popover-foreground">
        {/* Section 1: New Tab / Reload / Duplicate / Split */}
        {onNewTab && (
          <ContextMenuItem
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={() => onNewTab()}
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.newTab") || "New tab"}</span>
            <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {isWebViewer && (
          <ContextMenuItem
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={handleReload}
          >
            <RotateCw className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.reloadTab") || "Reload"}</span>
            <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {!isSystemTab && onDuplicateTab && (
          <ContextMenuItem
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={() => onDuplicateTab(note)}
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.duplicateTab") || "Duplicate"}</span>
          </ContextMenuItem>
        )}

        {onSplitTab && (
          <ContextMenuItem
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={() => onSplitTab(note.id)}
          >
            <Columns2Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.splitTab") || "Split tab"}</span>
          </ContextMenuItem>
        )}

        {/* Section 2: Copy link / path */}
        {isWebViewer ? (
          <>
            <ContextMenuSeparator className="my-1 bg-border/60" />
            <ContextMenuItem
              className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
              onClick={handleCopyUrl}
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{t("editor.copyUrl") || "Copy URL"}</span>
            </ContextMenuItem>
          </>
        ) : (!isSystemTab && note.fileName) ? (
          <>
            <ContextMenuSeparator className="my-1 bg-border/60" />
            <ContextMenuSub>
              <ContextMenuSubTrigger className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{t("sidebar.copyPath") || "Copy Path"}</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48 rounded-xl">
                <ContextMenuItem
                  className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
                  onClick={handleCopyRelativePath}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{t("editor.copyRelativePath") || "Copy Relative Path"}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
                  onClick={() => void handleCopyAbsolutePath()}
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{t("editor.copyAbsolutePath") || "Copy Full Path"}</span>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        ) : null}

        {/* Section 3: Close actions (Non-destructive neutral styling) */}
        <ContextMenuSeparator className="my-1 bg-border/60" />

        <ContextMenuItem
          className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
          onClick={() => onCloseTab(note.id)}
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">{t("editor.closeTab") || "Close tab"}</span>
          <ContextMenuShortcut>Ctrl+W</ContextMenuShortcut>
        </ContextMenuItem>

        {onCloseOtherTabs && (
          <ContextMenuItem
            disabled={totalTabs <= 1}
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={() => onCloseOtherTabs(note.id)}
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.closeOtherTabs") || "Close other tabs"}</span>
          </ContextMenuItem>
        )}

        {onCloseTabsToRight && (
          <ContextMenuItem
            disabled={index >= totalTabs - 1}
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={() => onCloseTabsToRight(note.id)}
          >
            <ArrowRightToLine className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.closeTabsToRight") || "Close tabs to the right"}</span>
          </ContextMenuItem>
        )}

        {onCloseAllTabs && (
          <ContextMenuItem
            className="px-3 py-1.5 text-[13px] gap-2.5 rounded-lg cursor-pointer"
            onClick={() => onCloseAllTabs()}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{t("editor.closeAllTabs") || "Close all tabs"}</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

function TabBarComponent({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  onCloseTabsToRight,
  onDuplicateTab,
  onReloadTab,
  onSplitTab,
  onNewTab,
  onReorderTabs,
}: TabBarProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const pack = settings?.iconPack || "lucide";

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeTabId]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedIndex((prevDragged) => {
      if (prevDragged !== null && prevDragged !== index) {
        onReorderTabs?.(prevDragged, index);
        return index;
      }
      return prevDragged;
    });
  }, [onReorderTabs]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

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
              const isHome = note.id === "home" || note.id.startsWith("home:") || note.fileType === "home";
              const isTrash = note.id === "trash" || note.id.startsWith("trash:") || note.fileType === "trash";
              const isSettings = note.id === "settings" || note.id.startsWith("settings:") || note.fileType === "settings";
              const isHelp = note.id === "help" || note.id.startsWith("help:") || note.fileType === "help";
              const isLunoAi = note.id === "luno-ai" || note.id.startsWith("luno-ai:") || note.fileType === "luno-ai";
              const isTemplates = note.id === "templates" || note.id.startsWith("templates:") || note.fileType === "templates";
              const isRelations = note.id === "relations" || note.id.startsWith("relations:") || note.fileType === "relations";
              const isFavorites = note.id === "favorites" || note.id.startsWith("favorites:") || note.fileType === "favorites";
              const isTags = note.id === "tags" || note.id.startsWith("tags:") || note.fileType === "tags";
              const isWhatsNew = note.id === "whats-new" || note.id.startsWith("whats-new:") || note.fileType === "whats-new";
              const isWebViewer = note.fileType === "web-viewer" || note.id.startsWith("web:");
              const label = isHome
                ? (t("sidebar.home") || "Home")
                : isTrash
                ? (t("trash.title") || "Trash")
                : isSettings
                ? (t("settings.title") || "Settings")
                : isHelp
                ? (t("sidebar.help") || (settings?.language === "th" ? "ช่วยเหลือ" : "Help"))
                : isWhatsNew
                ? (note.title || note.fileName || `Luno Note v${APP_VERSION}`)
                : isLunoAi
                ? "Luno AI"
                : isTemplates
                ? (t("sidebar.templates") || (settings?.language === "th" ? "เทมเพลต" : "Templates"))
                : isRelations
                ? (t("relations.title") || (settings?.language === "th" ? "ความสัมพันธ์" : "Relations"))
                : isFavorites
                ? (t("sidebar.favorites") || (settings?.language === "th" ? "ที่ติดดาว" : "Favorites"))
                : isTags
                ? (t("sidebar.tags") || (settings?.language === "th" ? "แท็ก" : "Tags"))
                : isWebViewer
                ? (note.title || note.fileName || t("webViewer.title") || "Web Viewer")
                : (note.fileName || note.title?.trim() || t("editor.untitled"));
              const isDragging = draggedIndex === index;

              return (
                <TabItem
                  key={note.id}
                  note={note}
                  index={index}
                  totalTabs={tabs.length}
                  isActive={isActive}
                  pack={pack}
                  settings={settings}
                  label={label}
                  isDragging={isDragging}
                  activeTabRef={activeTabRef}
                  onSelectTab={onSelectTab}
                  onCloseTab={onCloseTab}
                  onCloseOtherTabs={onCloseOtherTabs}
                  onCloseAllTabs={onCloseAllTabs}
                  onCloseTabsToRight={onCloseTabsToRight}
                  onDuplicateTab={onDuplicateTab}
                  onReloadTab={onReloadTab}
                  onNewTab={onNewTab}
                  onSplitTab={onSplitTab}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  t={t}
                />
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
