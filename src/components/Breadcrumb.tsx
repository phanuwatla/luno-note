import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Home, Folder, FolderOpen, FileText, FileImage, FileCode, File, FolderArchive } from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BreadcrumbProps {
  note: Note | null;
  rootFolderName: string | null;
  notes?: Note[];
  onSelectNote?: (id: string) => void;
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

function getFileIcon(fileName?: string, fileType?: Note["fileType"], active = false) {
  const cls = `h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`;
  const name = fileName?.toLowerCase() || "";
  if (name.endsWith(".zip")) return <FolderArchive className={cls} />;
  if (fileType === "image" || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".svg") || name.endsWith(".gif") || name.endsWith(".webp")) {
    return <FileImage className={cls} />;
  }
  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".html") || name.endsWith(".htm") || name.endsWith(".json") || name.endsWith(".ts") || name.endsWith(".tsx")) {
    return <FileCode className={cls} />;
  }
  if (fileType === "binary") return <File className={cls} />;
  return <FileText className={cls} />;
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
  const tree = useMemo(() => buildTreeFromNotes(notes, baseFolderPath), [notes, baseFolderPath]);

  // Subfolders start collapsed by default
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNoteItem = (note: Note, depth: number) => {
    const fileName = note.fileName || note.title?.trim() || "Untitled";
    const isActive = activeNoteId === note.id;
    return (
      <button
        key={note.id}
        type="button"
        onClick={() => {
          onSelectNote?.(note.id);
        }}
        className={`flex w-full items-center gap-1.5 py-1.5 pr-3 text-left text-xs font-medium transition-colors cursor-pointer ${
          isActive
            ? "bg-sidebar-accent/70 text-primary font-semibold"
            : "text-foreground hover:bg-sidebar-accent/50"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {getFileIcon(note.fileName, note.fileType, isActive)}
        <span className="truncate flex-1">{fileName}</span>
      </button>
    );
  };

  const renderFolderItem = (node: TreeNode, depth: number): React.ReactNode => {
    const isOpen = openFolders.has(node.path);
    const hasContent = node.notes.length > 0 || node.children.length > 0;
    const totalCount = node.notes.length + node.children.length;

    return (
      <div key={node.path} className="group/tree-item relative w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFolder(node.path);
          }}
          className="flex w-full items-center gap-1.5 py-1.5 pr-3 text-left text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 cursor-pointer"
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
          {hasContent && (
            <span className="ml-auto shrink-0 text-[10px] opacity-50">{totalCount}</span>
          )}
        </button>
        {isOpen && (
          <div className="relative w-full">
            <div
              className="absolute top-0 bottom-0 border-l border-transparent transition-colors duration-150 group-hover/tree-item:border-sidebar-border hover:border-sidebar-foreground/40 pointer-events-none z-10"
              style={{ left: `${18 + depth * 14}px` }}
            />
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
        Empty folder
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

export default function Breadcrumb({ note, rootFolderName, notes = [], onSelectNote }: BreadcrumbProps) {
  if (!note) return null;

  const segmentItems: SegmentItem[] = [];
  const parts = note.folderPath ? note.folderPath.split("/").filter(Boolean) : [];

  if (rootFolderName) {
    segmentItems.push({ label: rootFolderName, path: "" });
  }

  let cumulativePath = "";
  parts.forEach((part) => {
    cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;
    segmentItems.push({ label: part, path: cumulativePath });
  });

  const fileName = note.fileName || note.title?.trim() || "Untitled";

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-background/80 px-3 h-7 text-[11px] leading-tight text-muted-foreground overflow-x-auto no-scrollbar select-none">
      {/* Home / Root Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center rounded p-0.5 hover:bg-accent/10 hover:text-foreground cursor-pointer transition-colors outline-none shrink-0"
            title={rootFolderName || "Root Folder"}
          >
            <Home className="h-3 w-3 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl max-h-80 overflow-y-auto z-50 bg-sidebar text-sidebar-foreground border border-sidebar-border">
          <BreadcrumbTreeView notes={notes} baseFolderPath="" activeNoteId={note.id} onSelectNote={onSelectNote} />
        </DropdownMenuContent>
      </DropdownMenu>

      {segmentItems.map((seg, i) => (
        <span key={seg.path || i} className="flex items-center gap-0.5 shrink-0">
          <ChevronRight className="h-3 w-3 opacity-60 shrink-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-0.5 rounded px-1 py-0 hover:bg-accent/10 hover:text-foreground cursor-pointer transition-colors outline-none font-medium leading-none"
              >
                <span>{seg.label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl max-h-80 overflow-y-auto z-50 bg-sidebar text-sidebar-foreground border border-sidebar-border">
              <BreadcrumbTreeView notes={notes} baseFolderPath={seg.path} activeNoteId={note.id} onSelectNote={onSelectNote} />
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ))}

      <ChevronRight className="h-3 w-3 opacity-60 shrink-0" />
      <span className="font-semibold text-foreground truncate px-0.5 leading-none">{fileName}</span>
    </div>
  );
}
