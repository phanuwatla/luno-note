import React, { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronDown, Home, Folder, FolderOpen, FileText, FileImage, FileCode, File, FolderArchive, CheckCircle2, Share2, Bell, History, MoreHorizontal, MoreVertical, Cloud, Globe, ArrowDown, Star } from "lucide-react";
import { GoogleDriveIcon } from "@/components/icons/GoogleDriveIcon";
import type { Note } from "@/hooks/useNotes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { getToolbarIcon, renderCustomIcon, IconPack } from "@/lib/iconPacks";
import { getDefaultFileIconKey } from "@/lib/fileIconUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface BreadcrumbProps {
  note: Note | null;
  rootFolderName: string | null;
  notes?: Note[];
  onSelectNote?: (id: string) => void;
  onOpenRightPanel?: () => void;
  paneId?: string;
  isCloudWorkspace?: boolean;
}

interface SegmentItem {
  label: string;
  path: string;
}

interface TreeNode {
  name: string;
  path: string;
  notes: Note[];
  children: TreeNode[];
}

function NoteIcon({ note, active = false }: { note: Note; active?: boolean }) {
  const { settings } = useAppSettings();
  const pack = settings?.iconPack || "lucide";
  const cls = `h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`;
  if (note.fileType === "web-viewer") return <Globe className={cls} />;
  const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
  const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
  const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);
  if (customIcon) {
    const custom = renderCustomIcon(customIcon, cls, { color: customColor });
    if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
  }
  if (note.isLocked) {
    const LockIcon = getToolbarIcon("lock", pack);
    return <LockIcon className={cls} />;
  }
  const defaultKey = getDefaultFileIconKey(note.fileName, note.fileType);
  const IconComp = getToolbarIcon(defaultKey, pack);
  return <IconComp className={cls} />;
}

function MarkdownIndicator({ active, className = "" }: { active: boolean; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-end gap-[1px] text-[10px] font-bold leading-none select-none cursor-default ${
        active ? "text-primary opacity-90" : "text-muted-foreground/70"
      } ${className}`}
      title="Markdown"
      aria-label="Markdown"
    >
      <span>M</span>
      <ArrowDown className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
    </span>
  );
}

function getFileIcon(fileName?: string, fileType?: Note["fileType"], active = false, pack: IconPack = "lucide") {
  const cls = `h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`;
  if (fileType === "web-viewer") return <Globe className={cls} />;
  const defaultKey = getDefaultFileIconKey(fileName, fileType);
  const IconComp = getToolbarIcon(defaultKey, pack);
  return <IconComp className={cls} />;
}

function buildTreeFromNotes(notes: Note[], baseFolderPath: string): TreeNode {
  const normBase = baseFolderPath.trim();

  const relevantNotes = notes.filter((n) => {
    const p = (n.folderPath || "").trim();
    if (normBase === "") return true;
    return p === normBase || p.startsWith(normBase + "/");
  });

  const rootNode: TreeNode = {
    name: normBase ? normBase.split("/").pop() || "" : "",
    path: normBase,
    notes: [],
    children: [],
  };

  const folderMap = new Map<string, TreeNode>();
  folderMap.set(normBase, rootNode);

  relevantNotes.forEach((note) => {
    const nPath = (note.folderPath || "").trim();
    let relPath = nPath;
    if (normBase !== "") {
      if (nPath === normBase) relPath = "";
      else if (nPath.startsWith(normBase + "/")) relPath = nPath.slice(normBase.length + 1);
      else return;
    }

    if (!relPath) {
      rootNode.notes.push(note);
    } else {
      const parts = relPath.split("/").filter(Boolean);
      let currentPath = normBase;
      let parentNode = rootNode;

      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        currentPath = currentPath ? `${currentPath}/${seg}` : seg;
        let folderNode = folderMap.get(currentPath);
        if (!folderNode) {
          folderNode = { name: seg, path: currentPath, notes: [], children: [] };
          folderMap.set(currentPath, folderNode);
          parentNode.children.push(folderNode);
        }
        parentNode = folderNode;
      }
      parentNode.notes.push(note);
    }
  });

  const sortTree = (node: TreeNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.notes.sort((a, b) => (a.fileName || a.title || "").localeCompare(b.fileName || b.title || ""));
    node.children.forEach(sortTree);
  };
  sortTree(rootNode);

  return rootNode;
}

function BreadcrumbTreeView({
  notes,
  baseFolderPath,
  activeNoteId,
  onSelectNote,
}: {
  notes: Note[];
  baseFolderPath: string;
  activeNoteId?: string | null;
  onSelectNote?: (id: string) => void;
}) {
  const { settings } = useAppSettings();
  const { t } = useTranslation();
  const tree = useMemo(() => buildTreeFromNotes(notes, baseFolderPath), [notes, baseFolderPath]);

  // Subfolders start collapsed by default
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set());

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNoteItem = (note: Note, depth: number) => {
    const fileName = note.fileName || note.title?.trim() || t("editor.untitled");
    const isActive = activeNoteId === note.id;
    const isMarkdownNote = note.fileName
      ? note.fileName.endsWith(".md") || note.fileName.endsWith(".markdown")
      : false;

    return (
      <button
        key={note.id}
        type="button"
        onClick={() => {
          onSelectNote?.(note.id);
        }}
        className={`relative flex w-full items-center gap-1.5 px-3 ${
          settings.sidebarDensity === "compact" ? "py-1 text-[12.5px]" : "py-1.5 text-[13px]"
        } text-left transition-colors rounded-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none cursor-pointer ${
          isActive
            ? "bg-sidebar-accent text-foreground font-semibold"
            : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        {settings.showGuideLines && Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 bottom-0 w-[1px] bg-sidebar-border/40 group-hover/tree-item:bg-sidebar-border/80 transition-colors pointer-events-none z-10"
            style={{ left: `${18 + i * 14}px` }}
          />
        ))}
        <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <NoteIcon note={note} active={isActive} />
        <span className={`truncate flex-1 ${isActive ? "font-semibold text-primary" : "font-normal"}`}>{fileName}</span>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {isMarkdownNote && <MarkdownIndicator active={isActive} />}
          {note.isFavorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
        </div>
      </button>
    );
  };

  const renderFolderItem = (node: TreeNode, depth: number): React.ReactNode => {
    const isOpen = openFolders.has(node.path);
    const hasContent = node.notes.length > 0 || node.children.length > 0;
    const totalCount = node.notes.length + node.children.length;
    const pack = settings.iconPack;
    const ChevDown = getToolbarIcon("chevronDown", pack);
    const ChevRight = getToolbarIcon("chevronRight", pack);
    const FolderOpenIcon = getToolbarIcon("folderOpen", pack);
    const FolderIcon = getToolbarIcon("folder", pack);
    const customFolderIcon = settings.folderIcons?.[node.path];

    return (
      <div key={node.path} className="group/tree-item relative w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFolder(node.path);
          }}
          className={`relative flex w-full items-center gap-1.5 px-3 ${
            settings.sidebarDensity === "compact" ? "py-1 text-[12.5px]" : "py-1.5 text-[13.5px]"
          } font-medium text-left transition-colors rounded-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none cursor-pointer text-foreground font-semibold hover:text-foreground hover:bg-sidebar-accent/40`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          {settings.showGuideLines && Array.from({ length: depth }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 bottom-0 w-[1px] bg-sidebar-border/40 group-hover/tree-item:bg-sidebar-border/80 transition-colors pointer-events-none z-10"
              style={{ left: `${18 + i * 14}px` }}
            />
          ))}
          {isOpen ? (
            <ChevDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          {customFolderIcon ? (
            renderCustomIcon(customFolderIcon.icon, "h-3.5 w-3.5 shrink-0", { color: customFolderIcon.color })
          ) : isOpen ? (
            <FolderOpenIcon className="h-3.5 w-3.5 shrink-0 text-primary/80" />
          ) : (
            <FolderIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate flex-1 text-left font-semibold text-foreground/90">{node.name}</span>
          {hasContent && (
            <span className="ml-auto shrink-0 text-[10px] opacity-50">{totalCount}</span>
          )}
        </button>
        {isOpen && (
          <div className="relative w-full">
            <div className="w-full">
              {node.notes.map((n) => renderNoteItem(n, depth + 1))}
              {node.children.map((child) => renderFolderItem(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const isEmpty = tree.notes.length === 0 && tree.children.length === 0;

  if (isEmpty) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground opacity-70 italic select-none">
        {t("sidebar.noNotes")}
      </div>
    );
  }

  return (
    <div className="w-full py-0.5 space-y-0.5">
      {tree.notes.map((n) => renderNoteItem(n, 0))}
      {tree.children.map((child) => renderFolderItem(child, 0))}
    </div>
  );
}

function BreadcrumbComponent({ note, rootFolderName, notes = [], onSelectNote, onOpenRightPanel, paneId = "main", isCloudWorkspace = false }: BreadcrumbProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("luno:breadcrumb-mounted", { detail: { paneId } }));
    return () => {
      window.dispatchEvent(new CustomEvent("luno:breadcrumb-unmounted", { detail: { paneId } }));
    };
  }, [paneId, note?.id]);

  if (!note) return null;

  const segmentItems: SegmentItem[] = [];
  const parts = note.folderPath ? note.folderPath.split("/").filter(Boolean) : [];

  let cumulativePath = "";
  parts.forEach((part) => {
    cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;
    segmentItems.push({ label: part, path: cumulativePath });
  });

  const fileName = note.fileName || note.title?.trim() || t("editor.untitled");

  const isSplitPane = paneId !== "main";

  return (
    <div className="flex items-center justify-between bg-background px-3.5 pt-2 pb-1.5 h-9 text-[12px] leading-tight text-muted-foreground select-none min-w-0 w-full gap-2 border-b border-border/40">
      <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden py-1">
        {isSplitPane ? (
          <span className="font-semibold text-foreground truncate min-w-0 px-0.5 leading-none flex items-center gap-1.5">
            <NoteIcon note={note} active={false} />
            <span className="truncate">{fileName}</span>
          </span>
        ) : (
          <>
            {/* Mobile / Small Screen: Show only file name */}
            <span className="font-semibold text-foreground truncate min-w-0 px-0.5 leading-none sm:hidden flex items-center gap-1.5">
              <NoteIcon note={note} active={false} />
              <span className="truncate">{fileName}</span>
            </span>

            {/* Desktop / Large Screen: Show full breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted hover:text-foreground cursor-pointer transition-colors outline-none shrink-0"
                      >
                        {isCloudWorkspace || rootFolderName === "Google Drive" ? (
                          <GoogleDriveIcon className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          (() => {
                            const HomeIcon = getToolbarIcon("home", settings.iconPack);
                            return <HomeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />;
                          })()
                        )}
                        {rootFolderName && <span className="text-muted-foreground/90 font-normal truncate max-w-[100px]">{rootFolderName}</span>}
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{rootFolderName || "Root Folder"}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl max-h-[28rem] overflow-y-auto z-50 bg-sidebar text-sidebar-foreground border border-sidebar-border">
                  <BreadcrumbTreeView notes={notes} baseFolderPath="" activeNoteId={note?.id ?? null} onSelectNote={onSelectNote} />
                </DropdownMenuContent>
              </DropdownMenu>

              {segmentItems.map((seg, i) => {
                const ChevRight = getToolbarIcon("chevronRight", settings.iconPack);
                return (
                  <span key={seg.path || i} className="flex items-center gap-1 shrink-0">
                    <ChevRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted hover:text-foreground cursor-pointer transition-colors outline-none text-muted-foreground/90 leading-none max-w-[120px] truncate"
                        >
                          <span className="truncate">{seg.label}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl max-h-[28rem] overflow-y-auto z-50 bg-sidebar text-sidebar-foreground border border-sidebar-border">
                        <BreadcrumbTreeView notes={notes} baseFolderPath={seg.path} activeNoteId={note?.id ?? null} onSelectNote={onSelectNote} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                );
              })}

              {(() => {
                const ChevRight = getToolbarIcon("chevronRight", settings.iconPack);
                return <ChevRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />;
              })()}
              <span className="flex items-center gap-1.5 min-w-[40px] px-0.5 leading-none shrink truncate font-semibold text-foreground">
                <NoteIcon note={note} active={false} />
                <span className="truncate">{fileName}</span>
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-[11.5px] pl-1">
        <div id={`breadcrumb-save-status-${paneId}`} className="flex items-center gap-1.5 shrink-0" />
        <div id={`breadcrumb-editor-actions-${paneId}`} className="flex items-center gap-1.5 shrink-0" />
        {onOpenRightPanel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onOpenRightPanel}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus-visible:ring-0 focus-visible:outline-none focus:outline-none"
              >
                {(() => {
                  const MoreIcon = getToolbarIcon("moreHorizontal", settings.iconPack);
                  return <MoreIcon className="h-3.5 w-3.5" />;
                })()}
                <span className="sr-only">{t("rightPanel.togglePanel") || "Toggle Right Panel"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end">{t("rightPanel.togglePanel") || "Toggle Right Panel"}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export default React.memo(BreadcrumbComponent);
