import { useEffect, useRef } from "react";
import { X, FileText, FileCode } from "lucide-react";
import type { Note } from "@/hooks/useNotes";

interface TabBarProps {
  tabs: Note[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab }: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  return (
    <div ref={scrollRef} className="no-scrollbar flex items-end overflow-x-auto border-b border-border bg-background">
      {tabs.map((note) => {
        const isActive = note.id === activeTabId;
        const label =
          note.fileName ||
          note.title?.trim() ||
          "Untitled";
        const Icon = note.contentFormat === "markdown" || note.contentFormat === "html" ? FileCode : FileText;

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
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="min-w-0 truncate">{label}</span>
            <button
              type="button"
              className="ml-0.5 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100 data-[active=true]:opacity-60"
              data-active={isActive}
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(note.id);
              }}
              aria-label="Close tab"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
