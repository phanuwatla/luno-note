import { ChevronRight, Home } from "lucide-react";
import type { Note } from "@/hooks/useNotes";

interface BreadcrumbProps {
  note: Note | null;
  rootFolderName: string | null;
}

export default function Breadcrumb({ note, rootFolderName }: BreadcrumbProps) {
  if (!note) return null;

  const segments: string[] = [];

  if (rootFolderName) segments.push(rootFolderName);

  if (note.folderPath) {
    note.folderPath.split("/").filter(Boolean).forEach((s) => segments.push(s));
  }

  if (segments.length === 0) return null;

  const fileName = note.fileName || note.title?.trim() || "Untitled";

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground overflow-x-auto no-scrollbar">
      <Home className="h-3 w-3 shrink-0" />
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3 w-3" />
          <span>{seg}</span>
        </span>
      ))}
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span className="font-medium text-foreground truncate">{fileName}</span>
    </div>
  );
}
