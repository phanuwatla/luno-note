import { useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { X, FileText, FileCode } from "lucide-react";
import { FileImage, File, FolderArchive } from "lucide-react";
import type { Note } from "@/hooks/useNotes";

import { Columns2Icon } from "@/components/icons/Columns2Icon";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TabBarProps {
  tabs: Note[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onSplitTab?: (id: string) => void;
}

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onSplitTab }: TabBarProps) {
  const { t } = useTranslation();
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
      const cls = `h-3.5 w-3.5 shrink-0 opacity-60 ${isActive ? "text-primary" : "text-muted-foreground"}`;
      const type = getFileType(note);
      const name = note.fileName?.toLowerCase() || "";
      if (name.endsWith(".zip")) return <FolderArchive className={cls} />;
      if (type === "md") return <FileCode className={cls} />;
      if (type === "html") return <FileCode className={cls} />;
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
      <div ref={scrollRef} className="no-scrollbar flex items-end overflow-x-auto border-b border-border bg-background">
        {tabs.map((note) => {
          const isActive = note.id === activeTabId;
          const label = note.fileName || note.title?.trim() || "Untitled";
          return (
            <div
              key={note.id}
              ref={isActive ? activeTabRef : null}
              className={`group flex min-w-0 max-w-[200px] shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-background text-foreground border-b-2 border-b-primary"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
              onClick={() => onSelectTab(note.id)}
            >
              <NoteIcon note={note} isActive={isActive} />
              <span className="min-w-0 truncate">{label}</span>
              {/* ปุ่มแยกแท็บ (Split) */}
              {onSplitTab && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="ml-0.5 rounded-sm p-1 opacity-70 transition-opacity hover:bg-primary/10 md:opacity-0 md:group-hover:opacity-100"
                      tabIndex={-1}
                      onClick={e => {
                        e.stopPropagation();
                        onSplitTab(note.id);
                      }}
                      aria-label={t("editor.splitTab")}
                    >
                      <Columns2Icon className="h-3 w-3 text-primary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("editor.splitTab")}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-0.5 rounded-sm p-1 opacity-70 transition-opacity hover:bg-foreground/10 md:opacity-0 md:group-hover:opacity-100 data-[active=true]:opacity-90"
                    data-active={isActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(note.id);
                    }}
                    aria-label={t("editor.closeTab")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.closeTab")}</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
