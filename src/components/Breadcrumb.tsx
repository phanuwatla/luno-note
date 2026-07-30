import { ChevronRight, Home, Folder, FileText, FileImage, FileCode, File, FolderArchive } from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

function getFileIcon(fileName?: string, fileType?: Note["fileType"]) {
  if (fileType === "image") return <FileImage className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  if (fileType === "zip" || fileName?.toLowerCase().endsWith(".zip")) return <FolderArchive className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  if (fileType === "binary") return <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  if (fileName?.toLowerCase().endsWith(".json") || fileName?.toLowerCase().endsWith(".ts") || fileName?.toLowerCase().endsWith(".tsx")) {
    return <FileCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  }
  return <FileText className="h-3.5 w-3.5 text-primary/80 shrink-0" />;
}

interface FolderContents {
  subfolders: string[];
  files: Note[];
}

function getFolderContents(notes: Note[], folderPath: string): FolderContents {
  const normalizedTarget = folderPath.trim();
  const subfolderSet = new Set<string>();
  const files: Note[] = [];

  notes.forEach((n) => {
    const nPath = (n.folderPath || "").trim();

    if (normalizedTarget === "") {
      if (!nPath) {
        files.push(n);
      } else {
        const firstSeg = nPath.split("/")[0];
        if (firstSeg) subfolderSet.add(firstSeg);
      }
    } else {
      if (nPath === normalizedTarget) {
        files.push(n);
      } else if (nPath.startsWith(normalizedTarget + "/")) {
        const relative = nPath.slice(normalizedTarget.length + 1);
        const firstSeg = relative.split("/")[0];
        if (firstSeg) subfolderSet.add(firstSeg);
      }
    }
  });

  return {
    subfolders: Array.from(subfolderSet).sort((a, b) => a.localeCompare(b)),
    files: files.sort((a, b) => (a.fileName || a.title || "").localeCompare(b.fileName || b.title || "")),
  };
}

function FolderMenuItems({
  notes,
  folderPath,
  onSelectNote,
}: {
  notes: Note[];
  folderPath: string;
  onSelectNote?: (id: string) => void;
}) {
  const { subfolders, files } = getFolderContents(notes, folderPath);

  if (subfolders.length === 0 && files.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground opacity-70 italic select-none">
        Empty folder
      </div>
    );
  }

  return (
    <>
      {subfolders.map((subName) => {
        const subPath = folderPath ? `${folderPath}/${subName}` : subName;
        return (
          <DropdownMenuSub key={subPath}>
            <DropdownMenuSubTrigger className="gap-2 text-xs py-1.5 px-3 cursor-pointer">
              <Folder className="h-3.5 w-3.5 text-primary/80 shrink-0" />
              <span className="truncate flex-1">{subName}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={6} alignOffset={-4} className="w-52 rounded-xl p-1.5 shadow-xl max-h-72 overflow-y-auto">
              <FolderMenuItems notes={notes} folderPath={subPath} onSelectNote={onSelectNote} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      })}

      {subfolders.length > 0 && files.length > 0 && (
        <DropdownMenuSeparator className="my-1 border-border/40" />
      )}

      {files.map((file) => {
        const fileName = file.fileName || file.title?.trim() || "Untitled";
        return (
          <DropdownMenuItem
            key={file.id}
            onClick={() => onSelectNote?.(file.id)}
            className="gap-2 text-xs py-1.5 px-3 cursor-pointer rounded-lg hover:bg-accent/10"
          >
            {getFileIcon(file.fileName, file.fileType)}
            <span className="truncate flex-1 font-medium">{fileName}</span>
          </DropdownMenuItem>
        );
      })}
    </>
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
    <div className="flex items-center gap-1 border-b border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground overflow-x-auto no-scrollbar select-none">
      {/* Home / Root Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-1 hover:bg-accent/10 hover:text-foreground cursor-pointer transition-colors outline-none"
            title={rootFolderName || "Root Folder"}
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5 shadow-xl max-h-72 overflow-y-auto">
          <FolderMenuItems notes={notes} folderPath="" onSelectNote={onSelectNote} />
        </DropdownMenuContent>
      </DropdownMenu>

      {segmentItems.map((seg, i) => (
        <span key={seg.path || i} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3 w-3 opacity-60" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-accent/10 hover:text-foreground cursor-pointer transition-colors outline-none font-medium"
              >
                <span>{seg.label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5 shadow-xl max-h-72 overflow-y-auto">
              <FolderMenuItems notes={notes} folderPath={seg.path} onSelectNote={onSelectNote} />
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ))}

      <ChevronRight className="h-3 w-3 opacity-60 shrink-0" />
      <span className="font-semibold text-foreground truncate px-1">{fileName}</span>
    </div>
  );
}
