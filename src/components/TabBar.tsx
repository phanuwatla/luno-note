import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { X, FileText, FileCode, Plus, FileImage, File, FolderArchive } from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import { Columns2Icon } from "@/components/icons/Columns2Icon";
import { TooltipProvider } from "@/components/ui/tooltip";

interface TabBarProps {
  tabs: Note[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onSplitTab?: (id: string) => void;
  onNewTab?: () => void;
  onReorderTabs?: (fromIndex: number, toIndex: number) => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onSplitTab,
  onNewTab,
  onReorderTabs,
}: TabBarProps) {
  const { t } = useTranslation();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  function NoteIcon({ note, isActive }: { note: Note; isActive: boolean }) {
    const cls = `h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/70"}`;
    const type = getFileType(note);
    const name = note.fileName?.toLowerCase() || "";
    if (name.endsWith(".zip")) return <FolderArchive className={cls} />;
    if (type === "image") return <FileImage className={cls} />;
    if (type === "zip") return <FolderArchive className={cls} />;
    if (type === "binary") return <File className={cls} />;
    return <FileText className={cls} />;
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  return (
    <TooltipProvider delayDuration={420}>
      <div ref={scrollRef} className="no-scrollbar flex items-end gap-0.5 overflow-x-auto bg-sidebar-accent/50 px-2 pt-2 h-11 select-none">
        {tabs.map((note, index) => {
          const isActive = note.id === activeTabId;
          const label = note.fileName || note.title?.trim() || t("editor.untitled");
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={note.id}
              ref={isActive ? activeTabRef : null}
              draggable
              onDragStart={(e) => {
                setDraggedIndex(index);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (draggedIndex !== null && draggedIndex !== index) {
                  setDragOverIndex(index);
                }
              }}
              onDragLeave={() => {
                if (dragOverIndex === index) {
                  setDragOverIndex(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== index && onReorderTabs) {
                  onReorderTabs(draggedIndex, index);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`group flex min-w-0 max-w-[190px] shrink-0 cursor-pointer items-center gap-2 rounded-t-xl px-3 py-2 text-xs transition-all ${
                isDragging ? "opacity-40" : ""
              } ${
                isDragOver ? "border-l-2 border-l-primary bg-primary/10" : ""
              } ${
                isActive
                  ? "bg-background text-foreground shadow-xs border-t border-x border-border/40 font-semibold"
                  : "text-muted-foreground/80 hover:text-foreground hover:bg-background/40 font-medium"
              }`}
              onClick={() => onSelectTab(note.id)}
            >
              <NoteIcon note={note} isActive={isActive} />
              <span className="min-w-0 truncate">{label}</span>

              {/* Action buttons (Split + Close right next to each other) */}
              <div className="ml-auto flex items-center gap-0.5 shrink-0">
                {onSplitTab && (
                  <button
                    type="button"
                    className="rounded-md p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSplitTab(note.id);
                    }}
                    title={t("editor.splitTab")}
                  >
                    <Columns2Icon className="h-3 w-3" />
                  </button>
                )}

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
                  title={t("editor.closeTab")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}

        {onNewTab && (
          <button
            type="button"
            onClick={onNewTab}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/80 hover:bg-background/60 hover:text-foreground transition-colors mb-0.5 ml-1"
            title={t("sidebar.newNote")}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
