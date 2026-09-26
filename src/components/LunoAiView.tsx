import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Send,
  FileText,
  Lightbulb,
  ListOrdered,
  Languages,
  Lock,
  Copy,
  Check,
  Plus,
  User,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  FileCode,
  Folder,
  FolderOpen,
  Search,
  Upload,
  History,
  Clock,
  Trash2,
  MessageSquare,
  FilePlus,
  Loader2,
  ArrowDown,
  ArrowRight,
  RotateCcw,
  Mic,
  MicOff,
  Zap,
  Palette,
  Brain,
  Minimize2,
  Maximize2,
  BookOpen,
  Briefcase,
  CheckCheck,
  Square,
} from "lucide-react";
import { SparklesIcon as Sparkles } from "@/components/icons/SparklesIcon";
import { WandSparklesIcon as Wand2 } from "@/components/icons/WandSparklesIcon";
import { PencilIcon as Pencil } from "@/components/icons/PencilIcon";
import { marked } from "marked";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { runGeminiPrompt, runGeminiAction, runGeminiChatHistory, transcribeAudioWithGemini, cleanVoiceTranscription } from "@/lib/geminiApi";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { Note } from "@/hooks/useNotes";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { getNoteDefaultIconKey, getDefaultFileIconKey } from "@/lib/fileIconUtils";

function stripMarkdownSyntax(text: string): string {
  if (!text) return "";
  let clean = text;
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean.replace(/^#{1,6}\s+/gm, "");
  clean = clean.replace(/^\s*>\s*/gm, "");
  clean = clean.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, "");
  clean = clean.replace(/^\s*[-*+]\s+/gm, "");
  clean = clean.replace(/^\s*\d+\.\s+/gm, "");
  clean = clean.replace(/```[\s\S]*?```/g, " ");
  clean = clean.replace(/`([^`]+)`/g, "$1");
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  clean = clean.replace(/(\*\*|__|[*_~]{1,2})/g, "");
  return clean.replace(/\s+/g, " ").trim();
}

function extractDefaultFileName(content: string): string {
  const firstHeading = content.match(/^#+\s+(.+)$/m);
  if (firstHeading && firstHeading[1]) {
    const clean = firstHeading[1].trim().replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F ]/g, "").slice(0, 30);
    if (clean) return `${clean.replace(/\s+/g, "_")}.md`;
  }
  const firstLine = content.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  if (firstLine) {
    const clean = firstLine.replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F ]/g, "").slice(0, 30);
    if (clean) return `${clean.replace(/\s+/g, "_")}.md`;
  }
  return `Luno_Note_${Date.now().toString().slice(-4)}.md`;
}

const renderMarkdownHtml = (markdownText: string): string => {
  if (!markdownText) return "";
  try {
    const rawHtml = marked.parse(markdownText, { gfm: true, breaks: true });
    const htmlString = typeof rawHtml === "string" ? rawHtml : markdownText;
    return sanitizeHtml(htmlString);
  } catch (_) {
    return sanitizeHtml(markdownText);
  }
};

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  modelUsed?: string;
  attachedFileNames?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: MessageItem[];
}

interface LunoAiViewProps {
  notes?: Note[];
  activeNote?: Note | null;
  openedFolderName?: string | null;
  onInsertToActiveNote?: (text: string) => void;
  onInsertToSelectedNote?: (noteId: string, text: string) => void;
  onCreateNewNote?: (fileName: string, content: string, folderPath?: string) => void;
  onOpenSettings?: (category?: string) => void;
  onOpenWebTab?: (url: string) => void;
  isSidebar?: boolean;
}

const CHAT_SESSIONS_STORAGE_KEY = "luno-ai-chat-sessions-v2";
const LAST_ACTIVE_SESSION_STORAGE_KEY = "luno-ai-last-active-session-id";
const HISTORY_PANEL_OPEN_STORAGE_KEY = "luno-ai-history-panel-open";
const OPEN_FOLDERS_STORAGE_PREFIX = "luno_open_folders_";
const LAST_WORKSPACE_STORAGE_KEY = "luno_last_workspace_name";

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore
  }
  return null;
}

function getInitialOpenFolders(openedFolderName?: string | null): Set<string> {
  const currentWs =
    openedFolderName ||
    (typeof window !== "undefined" ? getLocalStorage()?.getItem(LAST_WORKSPACE_STORAGE_KEY) : null) ||
    "default";
  try {
    const storage = getLocalStorage();
    if (storage) {
      const raw = storage.getItem(OPEN_FOLDERS_STORAGE_PREFIX + currentWs);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          return new Set(arr);
        }
      }
    }
  } catch {
    // Ignore
  }
  return new Set(["__opened_root__"]);
}

interface WorkspaceFolderNode {
  name: string;
  path: string;
  children: WorkspaceFolderNode[];
  notes: Note[];
}

function buildWorkspaceFolderTree(notes: Note[]): WorkspaceFolderNode {
  const root: WorkspaceFolderNode = { name: "", path: "", children: [], notes: [] };
  const folderMap = new Map<string, WorkspaceFolderNode>();
  folderMap.set("", root);

  const getOrCreateFolder = (path: string): WorkspaceFolderNode => {
    if (!path) return root;
    if (folderMap.has(path)) return folderMap.get(path)!;
    const lastSlash = path.lastIndexOf("/");
    const name = lastSlash === -1 ? path : path.slice(lastSlash + 1);
    const parentPath = lastSlash === -1 ? "" : path.slice(0, lastSlash);
    const parent = getOrCreateFolder(parentPath);
    const node: WorkspaceFolderNode = { name, path, children: [], notes: [] };
    parent.children.push(node);
    folderMap.set(path, node);
    return node;
  };

  for (const note of notes) {
    const path = note.folderPath || "";
    getOrCreateFolder(path).notes.push(note);
  }

  return root;
}

export function WorkspaceNoteIcon({
  note,
  className = "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors",
}: {
  note: Note;
  className?: string;
}) {
  const { settings } = useAppSettings();
  if (settings?.showFileIcons === false) {
    return null;
  }
  const pack = settings?.iconPack || "lucide";
  const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
  const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
  const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);

  if (customIcon) {
    const custom = renderCustomIcon(customIcon, className, { color: customColor });
    if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
  }

  if (note.isLocked) {
    const LockIcon = getToolbarIcon("lock", pack);
    return <LockIcon className={className} />;
  }

  const defaultKey = getNoteDefaultIconKey(note);
  const IconComp = getToolbarIcon(defaultKey, pack);
  return <IconComp className={className} />;
}

export function WorkspaceFolderIcon({
  path,
  isOpen,
  className = "h-3.5 w-3.5 text-primary shrink-0",
}: {
  path: string;
  isOpen: boolean;
  className?: string;
}) {
  const { settings } = useAppSettings();
  if (settings?.showFileIcons === false) {
    return null;
  }
  const customFolderIcon = settings?.folderIcons?.[path];

  if (customFolderIcon) {
    const custom = renderCustomIcon(customFolderIcon.icon, className, { color: customFolderIcon.color });
    if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
  }

  const FolderOpenIcon = getToolbarIcon("folderOpen", settings?.iconPack);
  const FolderIcon = getToolbarIcon("folder", settings?.iconPack);
  return isOpen ? <FolderOpenIcon className={className} /> : <FolderIcon className={className} />;
}

export function AttachedFileChipIcon({
  fileName,
  dataUrl,
  notes,
  className = "h-3.5 w-3.5 text-primary shrink-0",
}: {
  fileName: string;
  dataUrl?: string;
  notes: Note[];
  className?: string;
}) {
  const { settings } = useAppSettings();
  if (settings?.showFileIcons === false) {
    return null;
  }
  if (dataUrl) {
    return <img src={dataUrl} alt={fileName} className="h-4 w-4 rounded object-cover shrink-0" />;
  }
  const matchedNote = notes.find((n) => (n.fileName || n.title) === fileName);
  if (matchedNote) {
    return <WorkspaceNoteIcon note={matchedNote} className={className} />;
  }
  const defaultKey = getDefaultFileIconKey(fileName);
  const IconComp = getToolbarIcon(defaultKey, settings?.iconPack);
  return <IconComp className={className} />;
}

export function WorkspaceFolderTree({
  notes,
  searchQuery = "",
  activeNoteId,
  attachedFileNames = [],
  onSelectNote,
  actionType,
  openedFolderName,
}: {
  notes: Note[];
  searchQuery?: string;
  activeNoteId?: string | null;
  attachedFileNames?: string[];
  onSelectNote: (note: Note) => void;
  actionType: "insert" | "attach";
  openedFolderName?: string | null;
}) {
  const { settings } = useAppSettings();
  const workspaceNotes = useMemo(() => notes.filter((n) => n.id !== "luno-ai" && n.id !== "settings"), [notes]);
  const tree = useMemo(() => buildWorkspaceFolderTree(workspaceNotes), [workspaceNotes]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() =>
    getInitialOpenFolders(openedFolderName)
  );

  useEffect(() => {
    setOpenFolders(getInitialOpenFolders(openedFolderName));
  }, [openedFolderName]);

  useEffect(() => {
    const currentWs =
      openedFolderName ||
      (typeof window !== "undefined" ? getLocalStorage()?.getItem(LAST_WORKSPACE_STORAGE_KEY) : null) ||
      "default";

    const handleFoldersChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ workspace?: string; openFolders?: string[] }>;
      if (customEvent.detail?.workspace === currentWs && Array.isArray(customEvent.detail?.openFolders)) {
        const nextArray = customEvent.detail.openFolders;
        setOpenFolders((prev) => {
          if (prev.size === nextArray.length && nextArray.every((p) => prev.has(p))) {
            return prev;
          }
          return new Set(nextArray);
        });
      }
    };

    window.addEventListener("luno:open-folders-changed", handleFoldersChanged);
    return () => {
      window.removeEventListener("luno:open-folders-changed", handleFoldersChanged);
    };
  }, [openedFolderName]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);

      try {
        const storage = getLocalStorage();
        if (storage) {
          const currentWs =
            openedFolderName ||
            storage.getItem(LAST_WORKSPACE_STORAGE_KEY) ||
            "default";
          const serialized = JSON.stringify(Array.from(next));
          storage.setItem(OPEN_FOLDERS_STORAGE_PREFIX + currentWs, serialized);
          window.dispatchEvent(
            new CustomEvent("luno:open-folders-changed", {
              detail: { workspace: currentWs, openFolders: Array.from(next) },
            })
          );
        }
      } catch {
        // Ignore
      }

      return next;
    });
  };

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const filteredNotes = workspaceNotes.filter((n) => {
      const name = (n.fileName || n.title || "").toLowerCase();
      const path = (n.folderPath || "").toLowerCase();
      return name.includes(q) || path.includes(q);
    });

    if (filteredNotes.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No notes found
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {filteredNotes.map((note) => {
          const fileName = note.fileName || note.title || "Untitled.md";
          const isActive = activeNoteId === note.id;
          const isAttached = attachedFileNames.includes(fileName);
          const isMarkdownNote = Boolean(
            note.fileName?.toLowerCase().endsWith(".md") ||
            note.fileName?.toLowerCase().endsWith(".markdown") ||
            note.contentFormat === "markdown"
          );

          return (
            <button
              key={note.id}
              type="button"
              disabled={actionType === "attach" && isAttached}
              onClick={() => onSelectNote(note)}
              className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors rounded-lg group my-0.5 outline-none focus-visible:ring-0 ${
                actionType === "attach" && isAttached
                  ? "bg-sidebar-accent/40 opacity-60 cursor-not-allowed"
                  : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <WorkspaceNoteIcon note={note} className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs font-medium text-foreground">
                    {fileName}
                  </span>
                  {note.folderPath && (
                    <span className="text-[10px] text-muted-foreground truncate">{note.folderPath}</span>
                  )}
                </div>
                {isMarkdownNote && (
                  <span className="flex shrink-0 items-center gap-[1px] text-[10px] font-bold leading-none select-none text-muted-foreground/70">
                    <span>M</span>
                    <ArrowDown className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
                  </span>
                )}
              </div>
              {actionType === "attach" && (
                isAttached ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">Attached</span>
                ) : (
                  <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                )
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const renderFile = (note: Note, depth: number) => {
    const fileName = note.fileName || note.title || "Untitled.md";
    const isAttached = attachedFileNames.includes(fileName);
    const isMarkdownNote = Boolean(
      note.fileName?.toLowerCase().endsWith(".md") ||
      note.fileName?.toLowerCase().endsWith(".markdown") ||
      note.contentFormat === "markdown"
    );

    return (
      <button
        key={note.id}
        type="button"
        disabled={actionType === "attach" && isAttached}
        onClick={() => onSelectNote(note)}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors rounded-lg group my-0.5 outline-none focus-visible:ring-0 ${
          actionType === "attach" && isAttached
            ? "bg-sidebar-accent/40 opacity-60 cursor-not-allowed"
            : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground cursor-pointer"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <WorkspaceNoteIcon note={note} className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors" />
          <span className="truncate text-xs font-medium text-foreground">
            {fileName}
          </span>
          {isMarkdownNote && (
            <span className="flex shrink-0 items-center gap-[1px] text-[10px] font-bold leading-none select-none text-muted-foreground/70">
              <span>M</span>
              <ArrowDown className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
            </span>
          )}
        </div>
        {actionType === "attach" && (
          isAttached ? (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">Attached</span>
          ) : (
            <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          )
        )}
      </button>
    );
  };

  const renderNode = (node: WorkspaceFolderNode, depth = 0): React.ReactNode => {
    if (node.path === "" && !node.name) {
      return (
        <div key="root-node" className="space-y-0.5">
          {node.notes.map((note) => renderFile(note, depth))}
          {node.children.map((child) => renderNode(child, depth))}
        </div>
      );
    }

    const isOpen = openFolders.has(node.path);

    return (
      <div key={node.path} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleFolder(node.path)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs font-semibold text-foreground hover:bg-sidebar-accent/40 rounded-lg transition-colors cursor-pointer group my-0.5"
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-90 text-foreground" : ""}`} />
          <WorkspaceFolderIcon path={node.path} isOpen={isOpen} />
          <span className="truncate flex-1 font-semibold text-xs text-foreground">{node.name}</span>
          <span className="text-[10px] text-muted-foreground/70 shrink-0 font-normal">
            {node.notes.length + node.children.length}
          </span>
        </button>

        {isOpen && (
          <div className="relative space-y-0.5">
            {settings.showGuideLines && (
              <div
                className="absolute top-0 bottom-0 border-l border-border/50 dark:border-border/40 pointer-events-none z-10"
                style={{ left: `${18 + depth * 14}px` }}
              />
            )}
            {node.notes.map((note) => renderFile(note, depth + 1))}
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return <div className="space-y-0.5">{renderNode(tree)}</div>;
}

const renderModelIcon = (mKey: "smart" | "fast" | "creative") => {
  if (mKey === "smart") {
    return <Brain className="h-4 w-4 text-primary shrink-0" />;
  }
  if (mKey === "fast") {
    return <Zap className="h-4 w-4 text-primary shrink-0" />;
  }
  return <Palette className="h-4 w-4 text-primary shrink-0" />;
};

interface AiToolItem {
  id: string;
  icon: React.ReactNode;
  labelEn: string;
  labelTh: string;
  prefixEn: string;
  prefixTh: string;
}

const AI_TOOLS: AiToolItem[] = [
  {
    id: "improve",
    icon: <Wand2 className="h-4 w-4 shrink-0" />,
    labelEn: "Improve Writing",
    labelTh: "ปรับแต่งงานเขียน",
    prefixEn: "Improve writing: ",
    prefixTh: "ปรับแต่งข้อความ: ",
  },
  {
    id: "fix_grammar",
    icon: <CheckCheck className="h-4 w-4 shrink-0" />,
    labelEn: "Fix Grammar",
    labelTh: "แก้ไขไวยากรณ์และคำผิด",
    prefixEn: "Fix spelling and grammar: ",
    prefixTh: "แก้ไขไวยากรณ์และคำผิด: ",
  },
  {
    id: "make_shorter",
    icon: <Minimize2 className="h-4 w-4 shrink-0" />,
    labelEn: "Make Shorter",
    labelTh: "สรุปให้กระชับขึ้น",
    prefixEn: "Make shorter and concise: ",
    prefixTh: "กระชับข้อความให้สั้นลง: ",
  },
  {
    id: "make_longer",
    icon: <Maximize2 className="h-4 w-4 shrink-0" />,
    labelEn: "Make Longer",
    labelTh: "ขยายความเนื้อหา",
    prefixEn: "Make longer and elaborate: ",
    prefixTh: "ขยายความเนื้อหาให้ยาวขึ้น: ",
  },
  {
    id: "simplify",
    icon: <BookOpen className="h-4 w-4 shrink-0" />,
    labelEn: "Simplify",
    labelTh: "ปรับให้อ่านง่ายขึ้น",
    prefixEn: "Simplify and make easy to read: ",
    prefixTh: "ปรับข้อความให้อ่านง่ายขึ้น: ",
  },
  {
    id: "formalize",
    icon: <Briefcase className="h-4 w-4 shrink-0" />,
    labelEn: "Formalize",
    labelTh: "ปรับโทนให้เป็นทางการ",
    prefixEn: "Make tone formal and professional: ",
    prefixTh: "ปรับโทนเสียงให้เป็นทางการ: ",
  },
  {
    id: "make_casual",
    icon: <MessageSquare className="h-4 w-4 shrink-0" />,
    labelEn: "Make Casual",
    labelTh: "ปรับโทนให้เป็นกันเอง",
    prefixEn: "Make tone casual and friendly: ",
    prefixTh: "ปรับโทนเสียงให้เป็นกันเอง: ",
  },
  {
    id: "translate",
    icon: <Languages className="h-4 w-4 shrink-0" />,
    labelEn: "Translate",
    labelTh: "แปลภาษา",
    prefixEn: "Translate to English: ",
    prefixTh: "แปลเป็นภาษาไทย: ",
  },
  {
    id: "continue_writing",
    icon: <ArrowRight className="h-4 w-4 shrink-0" />,
    labelEn: "Continue Writing",
    labelTh: "เขียนเนื้อหาต่อ",
    prefixEn: "Continue writing: ",
    prefixTh: "เขียนเนื้อหาต่อจากเดิม: ",
  },
  {
    id: "rewrite",
    icon: <Pencil className="h-4 w-4 shrink-0" />,
    labelEn: "Rewrite",
    labelTh: "เรียบเรียงสำนวนใหม่",
    prefixEn: "Rewrite with fresh phrasing: ",
    prefixTh: "เรียบเรียงข้อความใหม่: ",
  },
];

export default function LunoAiView({
  notes = [],
  activeNote,
  openedFolderName,
  onInsertToActiveNote,
  onInsertToSelectedNote,
  onCreateNewNote,
  onOpenSettings,
  onOpenWebTab,
  isSidebar = false,
}: LunoAiViewProps) {
  const { t, language } = useTranslation();
  const lang = (language as "th" | "en") || "th";
  const { settings } = useAppSettings();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"smart" | "fast" | "creative">("smart");

  const [createNoteContent, setCreateNoteContent] = useState("");
  const [createNoteFileName, setCreateNoteFileName] = useState("");
  const [createNoteFileExt, setCreateNoteFileExt] = useState<"md" | "html" | "txt">("md");
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [insertTextContent, setInsertTextContent] = useState("");
  const [searchInsertNoteQuery, setSearchInsertNoteQuery] = useState("");

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ChatSession[]) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      const lastId = localStorage.getItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
      if (!lastId || lastId === "new") return null;
      const savedSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      const parsed: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];

      if (parsed.some((s) => s.id === lastId)) {
        return lastId;
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    try {
      const lastId = localStorage.getItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
      if (!lastId || lastId === "new") return [];
      const savedSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      const parsed: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];

      const targetSession = parsed.find((s) => s.id === lastId);
      if (targetSession && targetSession.messages) {
        return targetSession.messages;
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string }[]>([]);
  const [editingUserMsgId, setEditingUserMsgId] = useState<string | null>(null);
  const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);
  const [isHistoryRightPanelOpen, setIsHistoryRightPanelOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HISTORY_PANEL_OPEN_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [searchWorkspaceQuery, setSearchWorkspaceQuery] = useState("");
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");

  const QUICK_PREFIXES = useMemo(
    () => [
      "Translate to English: ",
      "Translate to Thai: ",
      "Summarize: ",
      "Improve writing: ",
      "Fix spelling and grammar: ",
      "Make shorter and concise: ",
      "Make longer and elaborate: ",
      "Simplify and make easy to read: ",
      "Make tone formal and professional: ",
      "Make tone casual and friendly: ",
      "Continue writing: ",
      "Rewrite with fresh phrasing: ",
      "Brainstorm: ",
      "Create an outline for: ",
      "Create outline: ",
      "แปลเป็นภาษาอังกฤษ: ",
      "แปลเป็นภาษาไทย: ",
      "สรุปเนื้อหา: ",
      "ปรับแต่งข้อความ: ",
      "แก้ไขไวยากรณ์และคำผิด: ",
      "กระชับข้อความให้สั้นลง: ",
      "ขยายความเนื้อหาให้ยาวขึ้น: ",
      "ปรับข้อความให้อ่านง่ายขึ้น: ",
      "ปรับโทนเสียงให้เป็นทางการ: ",
      "ปรับโทนเสียงให้เป็นกันเอง: ",
      "เขียนเนื้อหาต่อจากเดิม: ",
      "เรียบเรียงข้อความใหม่: ",
      "ระดมความคิด: ",
      "สร้างโครงร่างสำหรับ: ",
      "สร้างโครงร่าง: ",
    ],
    []
  );

  const [activePrefix, setActivePrefix] = useState<string | null>(null);
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [menuCoords, setMenuCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null);

  const slashMenuScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateSlashMenuCoords = () => {
    const activeEl = (textareaRef.current || chatInputRef.current) as HTMLElement | null;
    if (!activeEl) return;
    const rect = activeEl.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceAbove > 330 || spaceAbove > spaceBelow) {
      setMenuCoords({
        bottom: window.innerHeight - rect.top + 6,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 220)),
      });
    } else {
      setMenuCoords({
        top: rect.bottom + 6,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 220)),
      });
    }
  };

  const checkSlashMenuScroll = () => {
    const el = slashMenuScrollRef.current;
    if (!el) return;
    const hasMoreUp = el.scrollTop > 2;
    const hasMoreDown = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setCanScrollUp(hasMoreUp);
    setCanScrollDown(hasMoreDown);
  };

  useEffect(() => {
    if (isSlashMenuOpen) {
      updateSlashMenuCoords();
      setTimeout(checkSlashMenuScroll, 50);
      window.addEventListener("scroll", updateSlashMenuCoords, true);
      window.addEventListener("resize", updateSlashMenuCoords);
      return () => {
        window.removeEventListener("scroll", updateSlashMenuCoords, true);
        window.removeEventListener("resize", updateSlashMenuCoords);
      };
    }
  }, [isSlashMenuOpen, slashQuery]);

  useEffect(() => {
    if (isSlashMenuOpen && slashMenuScrollRef.current) {
      const selectedEl = slashMenuScrollRef.current.querySelector(
        `[data-slash-item="${selectedSlashIndex}"]`
      ) as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
        checkSlashMenuScroll();
      }
    }
  }, [selectedSlashIndex, isSlashMenuOpen]);

  const scrollSlashMenu = (direction: "up" | "down") => {
    const el = slashMenuScrollRef.current;
    if (!el) return;
    const delta = direction === "up" ? -45 : 45;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(checkSlashMenuScroll, 100);
  };

  const startAutoScroll = (direction: "up" | "down") => {
    stopAutoScroll();
    scrollSlashMenu(direction);
    autoScrollTimerRef.current = setInterval(() => {
      scrollSlashMenu(direction);
    }, 120);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const dynamicPlaceholder = useMemo(() => {
    if (!activePrefix) return t("lunoAi.inputPlaceholder") || "Ask anything or type / for commands";
    if (activePrefix.includes("Translate") || activePrefix.includes("แปล")) {
      return t("lunoAi.placeholderTranslate") || "Text to translate...";
    }
    if (activePrefix.includes("Summarize") || activePrefix.includes("สรุป")) {
      return t("lunoAi.placeholderSummarize") || "Text or topic to summarize...";
    }
    if (activePrefix.includes("Fix") || activePrefix.includes("ไวยากรณ์")) {
      return t("lunoAi.placeholderFixGrammar") || "Text to check spelling and grammar...";
    }
    if (activePrefix.includes("shorter") || activePrefix.includes("กระชับ")) {
      return t("lunoAi.placeholderMakeShorter") || "Text to make shorter and concise...";
    }
    if (activePrefix.includes("longer") || activePrefix.includes("ขยายความ")) {
      return t("lunoAi.placeholderMakeLonger") || "Text or topic to elaborate...";
    }
    if (activePrefix.includes("Simplify") || activePrefix.includes("อ่านง่าย")) {
      return t("lunoAi.placeholderSimplify") || "Text to simplify and make easy to read...";
    }
    if (activePrefix.includes("formal") || activePrefix.includes("ทางการ")) {
      return t("lunoAi.placeholderFormalize") || "Text to formalize into professional tone...";
    }
    if (activePrefix.includes("casual") || activePrefix.includes("เป็นกันเอง")) {
      return t("lunoAi.placeholderMakeCasual") || "Text to make casual and friendly...";
    }
    if (activePrefix.includes("Continue") || activePrefix.includes("เขียนเนื้อหาต่อ")) {
      return t("lunoAi.placeholderContinueWriting") || "Context or topic to continue writing...";
    }
    if (activePrefix.includes("Rewrite") || activePrefix.includes("เรียบเรียง")) {
      return t("lunoAi.placeholderRewrite") || "Text to rewrite with fresh phrasing...";
    }
    if (activePrefix.includes("Improve") || activePrefix.includes("ปรับแต่ง")) {
      return t("lunoAi.placeholderImprove") || "Text to improve or rewrite...";
    }
    if (activePrefix.includes("Brainstorm") || activePrefix.includes("ระดมความคิด")) {
      return t("lunoAi.placeholderBrainstorm") || "Topic to brainstorm ideas...";
    }
    if (activePrefix.includes("outline") || activePrefix.includes("Outline") || activePrefix.includes("โครงร่าง")) {
      return t("lunoAi.placeholderOutline") || "Topic to create outline...";
    }
    return t("lunoAi.inputPlaceholder") || "Ask anything or type / for commands";
  }, [activePrefix, t]);

  const filteredTools = useMemo(() => {
    if (!slashQuery.trim()) return AI_TOOLS;
    const q = slashQuery.toLowerCase();
    return AI_TOOLS.filter((tool) => {
      return (
        tool.id.includes(q) ||
        tool.labelEn.toLowerCase().includes(q) ||
        tool.labelTh.toLowerCase().includes(q)
      );
    });
  }, [slashQuery]);

  const applySlashTool = (tool: AiToolItem) => {
    const prefix = lang === "th" ? tool.prefixTh : tool.prefixEn;
    setActivePrefix(prefix);
    setPrompt("");
    setIsSlashMenuOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleInputChange = (val: string) => {
    const matched = QUICK_PREFIXES.find((p) => val.startsWith(p));
    if (matched) {
      setActivePrefix(matched);
      setPrompt(val.slice(matched.length));
      setIsSlashMenuOpen(false);
      return;
    }

    setPrompt(val);

    if (val.startsWith("/")) {
      setIsSlashMenuOpen(true);
      setSlashQuery(val.slice(1));
      setSelectedSlashIndex(0);
      setTimeout(updateSlashMenuCoords, 10);
    } else {
      setIsSlashMenuOpen(false);
    }
  };



  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnySpeechRef = useRef(false);
  const hasNewSpeechSinceLastTickRef = useRef(false);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingMimeTypeRef = useRef<string>("audio/webm");
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isRecordingActiveRef = useRef(false);
  const isTranscribingRef = useRef(false);
  const reqSeqRef = useRef(0);
  const initialPromptRef = useRef("");
  const activePrefixRef = useRef(activePrefix);
  activePrefixRef.current = activePrefix;
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  const getVoiceInstruction = () => {
    const currentP = (promptRef.current || "").toLowerCase();
    const currentPrefix = (activePrefixRef.current || "").toLowerCase();
    const isTranslate =
      currentPrefix.includes("translate") ||
      currentPrefix.includes("แปล") ||
      currentP.startsWith("translate") ||
      currentP.startsWith("แปล");

    if (isTranslate) {
      return lang === "th"
        ? "แปลสิ่งที่ผู้พูดพูดในคลิปเสียงนี้เป็นภาษาตามที่ต้องการโดยตรงอย่างถูกต้องและเป็นธรรมชาติ (หากพูดภาษาไทยให้แปลเป็นภาษาอังกฤษ หากพูดภาษาอื่นให้แปลเป็นภาษาไทย) ตอบเฉพาะผลลัพธ์ที่แปลได้เท่านั้น ห้ามตอบเป็นบทสนทนา ห้ามกล่าวขอโทษ ห้ามพูดว่าไม่ได้ยินหรือขอให้พูดใหม่ (ห้ามตอบ 'I'm sorry, I didn't catch that') ห้ามใส่ตัวเลขเวลา timestamp เช่น 00:00 ใดๆ ทั้งสิ้น หากไม่มีเสียงพูดให้ตอบเป็นข้อความว่าง"
        : "Translate this spoken audio directly into the requested target language (if Thai translate to English, if other translate to Thai). Output ONLY the translated text. Do NOT output conversational replies (NEVER apologize or say 'I didn't catch that'). Do not add quotes or timestamps. If no speech is detected, output an empty string.";
    }

    return lang === "th"
      ? "คุณคือระบบถอดความเสียงพูด (Speech-to-Text) โปรดถอดความสิ่งที่ผู้พูดพูดในคลิปเสียงนี้เป็นข้อความภาษาไทยหรือภาษาอังกฤษตามที่พูดจริงอย่างถูกต้อง ตอบเฉพาะข้อความที่ถอดความได้เท่านั้น ห้ามตอบเป็นบทสนทนา ห้ามกล่าวขอโทษ ห้ามพูดว่าไม่ได้ยินหรือขอให้พูดใหม่ (ห้ามตอบ 'I'm sorry, I didn't catch that') ห้ามใส่ตัวเลขเวลา timestamp หรือ timecode เช่น 00:00 ใดๆ ทั้งสิ้น หากไม่มีเสียงพูดหรือมีแต่เสียงเงียบ ให้ตอบเป็นข้อความว่างเท่านั้น"
      : "You are a speech-to-text transcriber. Accurately transcribe the spoken audio verbatim. Output ONLY the transcribed text. Do NOT output conversational replies (NEVER say 'I'm sorry, I didn't catch that', 'Please repeat', or apologize). Do not add quotes, commentary, markdown formatting, or timestamps/timecodes like 00:00. If there is no speech or only silence, output an empty string.";
  };

  const cleanupMediaResources = () => {
    isRecordingActiveRef.current = false;
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    if (audioMonitorIntervalRef.current) {
      clearInterval(audioMonitorIntervalRef.current);
      audioMonitorIntervalRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      mediaRecorderRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        /* ignore */
      }
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    setIsTranscribing(false);
    isTranscribingRef.current = false;
    hasAnySpeechRef.current = false;
    hasNewSpeechSinceLastTickRef.current = false;
  };

  useEffect(() => {
    return () => {
      cleanupMediaResources();
    };
  }, []);

  const stopVoiceRecording = async () => {
    if (!isRecordingActiveRef.current && !isListening) return;

    isRecordingActiveRef.current = false;
    setIsListening(false);

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    if (audioMonitorIntervalRef.current) {
      clearInterval(audioMonitorIntervalRef.current);
      audioMonitorIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.requestData();
      } catch {}

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    // If no speech was ever detected during the recording, do not call Gemini
    if (!hasAnySpeechRef.current) {
      setIsTranscribing(false);
      isTranscribingRef.current = false;
      return;
    }

    setIsTranscribing(true);
    isTranscribingRef.current = true;

    const finalChunks = [...recordedChunksRef.current];
    const mimeType = recordingMimeTypeRef.current || "audio/webm";

    if (finalChunks.length > 0) {
      const finalBlob = new Blob(finalChunks, { type: mimeType });
      if (finalBlob.size >= 800) {
        const mySeq = ++reqSeqRef.current;
        try {
          const instruction = getVoiceInstruction();
          const finalText = await transcribeAudioWithGemini(
            settings.geminiApiKey,
            finalBlob,
            lang,
            instruction
          );
          const cleanedText = cleanVoiceTranscription(finalText);

          if (mySeq === reqSeqRef.current && cleanedText) {
            const base = initialPromptRef.current;
            const newPromptVal = base ? `${base} ${cleanedText}` : cleanedText;
            setPrompt(newPromptVal);

            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
              } else if (chatInputRef.current) {
                chatInputRef.current.focus();
              }
            }, 30);
          }
        } catch (err: any) {
          console.error("Final voice transcription error:", err);
          toast({
            title: t("lunoAi.voiceErrorTitle") || "เกิดข้อผิดพลาดในการแปลงเสียง",
            description:
              err?.message || (t("lunoAi.voiceErrorDesc") || "ไม่สามารถแปลงเสียงเป็นข้อความได้"),
          });
        }
      }
    }

    setIsTranscribing(false);
    isTranscribingRef.current = false;
  };

  const startVoiceRecording = async () => {
    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      toast({
        title: t("lunoAi.apiKeyRequiredTitle") || "Gemini API Key Required",
        description:
          t("lunoAi.voiceApiKeyRequired") ||
          "Gemini API Key is required for voice input. Please set it in Settings.",
      });
      if (onOpenSettings) {
        onOpenSettings();
      }
      return;
    }

    try {
      cleanupMediaResources();
      recordedChunksRef.current = [];
      initialPromptRef.current = (promptRef.current || "").trim();
      hasAnySpeechRef.current = false;
      hasNewSpeechSinceLastTickRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Web Audio Analyser for voice energy detection
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);
          analyserRef.current = analyser;

          // Check voice frequency band every 100ms
          audioMonitorIntervalRef.current = setInterval(() => {
            if (!isRecordingActiveRef.current || !analyserRef.current) return;
            const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(freqData);
            let voicePeak = 0;
            // Bins 1 to 24 correspond to ~150Hz - 4000Hz (human voice spectrum)
            const maxBin = Math.min(25, freqData.length);
            for (let i = 1; i < maxBin; i++) {
              if (freqData[i] > voicePeak) voicePeak = freqData[i];
            }
            if (voicePeak > 18) {
              hasAnySpeechRef.current = true;
              hasNewSpeechSinceLastTickRef.current = true;
            }
          }, 100);
        }
      } catch (audioCtxErr) {
        console.warn("Could not create AudioContext for speech detection:", audioCtxErr);
        hasAnySpeechRef.current = true;
        hasNewSpeechSinceLastTickRef.current = true;
      }

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }
      recordingMimeTypeRef.current = mimeType;

      isRecordingActiveRef.current = true;
      setIsListening(true);
      setIsTranscribing(false);
      isTranscribingRef.current = false;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(250);

      let lastSentSize = 0;

      liveIntervalRef.current = setInterval(async () => {
        if (!isRecordingActiveRef.current) return;
        if (isTranscribingRef.current) return;
        if (recordedChunksRef.current.length < 5) return;

        // Skip sending if no speech was detected in this interval (prevents hallucinating on silence)
        if (!hasNewSpeechSinceLastTickRef.current) return;

        const currentBlob = new Blob(recordedChunksRef.current, {
          type: recordingMimeTypeRef.current,
        });
        if (currentBlob.size < 1200) return;
        if (currentBlob.size === lastSentSize) return;

        lastSentSize = currentBlob.size;
        hasNewSpeechSinceLastTickRef.current = false;
        isTranscribingRef.current = true;
        setIsTranscribing(true);
        const mySeq = ++reqSeqRef.current;

        try {
          const instruction = getVoiceInstruction();
          const text = await transcribeAudioWithGemini(
            settings.geminiApiKey,
            currentBlob,
            lang,
            instruction
          );

          const cleanedText = cleanVoiceTranscription(text);

          if (mySeq === reqSeqRef.current && isRecordingActiveRef.current && cleanedText) {
            const base = initialPromptRef.current;
            const newPromptVal = base ? `${base} ${cleanedText}` : cleanedText;
            setPrompt(newPromptVal);

            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
              }
            }, 20);
          }
        } catch (liveErr) {
          console.warn("Live transcription interval error:", liveErr);
        } finally {
          isTranscribingRef.current = false;
          if (isRecordingActiveRef.current) {
            setIsTranscribing(false);
          }
        }
      }, 2500);

      recordingTimeoutRef.current = setTimeout(() => {
        stopVoiceRecording();
      }, 120000);

      toast({
        title: t("lunoAi.voiceListeningTitle") || "กำลังฟังเสียง...",
        description:
          t("lunoAi.voiceListeningDesc") ||
          "พูดคำสั่งเสียงได้เลย ข้อความจะขึ้นในกล่องทันทีขณะพูด",
      });
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setIsListening(false);
      setIsTranscribing(false);
      isRecordingActiveRef.current = false;
      const isDenied =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      toast({
        title: t("lunoAi.voiceErrorTitle") || "เกิดข้อผิดพลาดจากไมโครโฟน",
        description: isDenied
          ? t("lunoAi.voiceNotAllowed") ||
            "ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาตสิทธิ์การเข้าถึงไมโครโฟน"
          : err?.message ||
            (t("lunoAi.voiceErrorDesc") || "ไม่สามารถเปิดไมโครโฟนได้"),
      });
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      /* ignore */
    }
  }, [sessions]);

  // Sync current active session ID to localStorage
  useEffect(() => {
    try {
      if (currentSessionId) {
        localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, currentSessionId);
      } else {
        localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, "new");
      }
    } catch {
      /* ignore */
    }
  }, [currentSessionId]);

  // Sync history right panel open state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_PANEL_OPEN_STORAGE_KEY, String(isHistoryRightPanelOpen));
    } catch {
      /* ignore */
    }
  }, [isHistoryRightPanelOpen]);

  // Focus history search input when search shortcut is pressed and history is open
  useEffect(() => {
    if (!isHistoryRightPanelOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();
      if (isCmdOrCtrl && (key === "k" || key === "f" || key === "า" || key === "ด")) {
        const historyInput = document.querySelector<HTMLInputElement>('input[data-luno-ai-history-search="true"]');
        if (historyInput && (historyInput.offsetParent !== null || historyInput.getBoundingClientRect().width > 0)) {
          e.preventDefault();
          e.stopPropagation();
          historyInput.focus();
          historyInput.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistoryRightPanelOpen]);

  // Sync messages into active session or create new session when messages change
  useEffect(() => {
    if (messages.length === 0) return;

    setSessions((prevSessions) => {
      if (currentSessionId) {
        return prevSessions.map((s) => (s.id === currentSessionId ? { ...s, messages } : s));
      } else {
        const newId = Date.now().toString();
        const firstUserMsg = (messages || []).find((m) => m?.role === "user");
        const title = firstUserMsg && firstUserMsg.content ? firstUserMsg.content.slice(0, 45).trim() : "Luno AI Chat";
        const newSession: ChatSession = {
          id: newId,
          title,
          createdAt: Date.now(),
          messages,
        };
        setCurrentSessionId(newId);
        try {
          localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, newId);
        } catch {
          /* ignore */
        }
        return [newSession, ...prevSessions];
      }
    });
  }, [messages, currentSessionId]);

  const handleNewChat = () => {
    setEditingUserMsgId(null);
    setCurrentSessionId(null);
    setMessages([]);
    setAttachedFiles([]);
    try {
      localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, "new");
    } catch {
      /* ignore */
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setEditingUserMsgId(null);
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setAttachedFiles([]);
    try {
      localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, session.id);
    } catch {
      /* ignore */
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      if (currentSessionId === sessionId) {
        if (next.length > 0) {
          setCurrentSessionId(next[0].id);
          setMessages(next[0].messages);
          try {
            localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, next[0].id);
          } catch {
            /* ignore */
          }
        } else {
          setCurrentSessionId(null);
          setMessages([]);
          try {
            localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, "new");
          } catch {
            /* ignore */
          }
        }
      }
      return next;
    });
  };

  const handleClearAllHistory = () => {
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_SESSIONS_STORAGE_KEY);
      localStorage.setItem(LAST_ACTIVE_SESSION_STORAGE_KEY, "new");
    } catch {
      /* ignore */
    }
    toast({
      title: t("lunoAi.clearAllSuccessTitle") || "History cleared",
      description: t("lunoAi.clearAllSuccessDesc") || "All previous chat history has been deleted.",
    });
  };

  useEffect(() => {
    const handleNewChatEvent = () => {
      handleNewChat();
      setIsHistoryRightPanelOpen(false);
    };
    const handleToggleHistoryEvent = () => {
      setIsHistoryRightPanelOpen((prev) => !prev);
    };
    const handleClearHistoryEvent = () => {
      handleClearAllHistory();
    };
    window.addEventListener("luno-ai:new-chat", handleNewChatEvent);
    window.addEventListener("luno-ai:toggle-history", handleToggleHistoryEvent);
    window.addEventListener("luno-ai:clear-history", handleClearHistoryEvent);
    return () => {
      window.removeEventListener("luno-ai:new-chat", handleNewChatEvent);
      window.removeEventListener("luno-ai:toggle-history", handleToggleHistoryEvent);
      window.removeEventListener("luno-ai:clear-history", handleClearHistoryEvent);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("luno-ai:history-state-changed", {
        detail: { isOpen: isHistoryRightPanelOpen },
      })
    );
  }, [isHistoryRightPanelOpen]);

  const handleAttachWorkspaceNote = (note: Note) => {
    const fileName = note.fileName || note.title || "Untitled.md";
    setAttachedFiles((prev) => {
      if (prev.some((f) => f.name === fileName)) return prev;
      return [...prev, { name: fileName, content: note.content || "" }];
    });
    setIsWorkspacePickerOpen(false);
    toast({
      title: t("lunoAi.attachedTitle") || "Note Attached",
      description: t("lunoAi.attachedSuccess", { name: fileName }) || `Attached ${fileName} to context`,
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating]);

  const handleSendPrompt = async (customPrompt?: string) => {
    if (isListening) {
      stopVoiceRecording();
    }
    const rawText = customPrompt ?? (activePrefix ? `${activePrefix}${prompt}` : prompt);
    const textToSend = rawText.trim();
    if (!textToSend || isGenerating) return;

    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      toast({
        title: t("lunoAi.apiKeyRequiredTitle") || "Gemini API Key Required",
        description: t("lunoAi.apiKeyRequired") || "Please set up your Gemini API key in Settings.",
      });
      onOpenSettings?.("ai");
      return;
    }

    const currentAttachedFiles = [...attachedFiles];
    const attachedFileNames = currentAttachedFiles.length > 0 ? currentAttachedFiles.map((f) => f.name) : undefined;
    const fileContexts = currentAttachedFiles.length > 0
      ? currentAttachedFiles.map((f) => `--- File: ${f.name} ---\n${f.content}`).join("\n\n")
      : undefined;

    const editIdx = editingUserMsgId ? messages.findIndex((m) => m.id === editingUserMsgId) : -1;

    if (editIdx !== -1) {
      // In-place Replace Mode: Truncate messages after editIdx, replace user prompt, generate new AI response
      const historyForApi = messages.slice(0, editIdx);
      const updatedUserMessage: MessageItem = {
        id: editingUserMsgId!,
        role: "user",
        content: textToSend,
        timestamp: Date.now(),
        attachedFileNames,
      };

      setMessages([...historyForApi, updatedUserMessage]);
      if (!customPrompt) setPrompt("");
      setAttachedFiles([]);
      setEditingUserMsgId(null);
      setIsGenerating(true);

      try {
        const { result, modelUsed } = await runGeminiChatHistory(
          settings.geminiApiKey,
          historyForApi,
          textToSend,
          fileContexts,
          model,
          lang,
          settings.aiModel
        );

        const assistantMsg: MessageItem = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result,
          timestamp: Date.now(),
          modelUsed,
        };

        setMessages([...historyForApi, updatedUserMessage, assistantMsg]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to generate AI response";
        toast({
          title: t("lunoAi.generationErrorTitle") || "AI Generation Error",
          description: errorMsg,
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Normal Mode: Append new prompt at bottom
      const userMsgId = Date.now().toString();
      const userMessage: MessageItem = {
        id: userMsgId,
        role: "user",
        content: textToSend,
        timestamp: Date.now(),
        attachedFileNames,
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!customPrompt) {
        setPrompt("");
        setActivePrefix(null);
      }
      setAttachedFiles([]);
      setIsGenerating(true);

      try {
        const { result, modelUsed } = await runGeminiChatHistory(
          settings.geminiApiKey,
          messages,
          textToSend,
          fileContexts,
          model,
          lang,
          settings.aiModel
        );

        const assistantMsg: MessageItem = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result,
          timestamp: Date.now(),
          modelUsed,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to generate AI response";
        toast({
          title: t("lunoAi.generationErrorTitle") || "AI Generation Error",
          description: errorMsg,
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleEditUserPrompt = (userMsgId: string, text: string = "") => {
    const safeText = text || "";
    setEditingUserMsgId(userMsgId);
    setPrompt(safeText);
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = safeText.length;
      textareaRef.current?.setSelectionRange(len, len);
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        chatInputRef.current.setSelectionRange(len, len);
      }
    }, 50);
    toast({
      title: t("lunoAi.editPromptTitle") || "Edit prompt",
      description: t("lunoAi.editPromptDesc") || "Prompt loaded into input box for editing.",
    });
  };

  const handleRegenerateResponse = async (assistantMsgId: string) => {
    if (isGenerating) return;
    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      toast({
        title: t("lunoAi.apiKeyRequiredTitle") || "Gemini API Key Required",
        description: t("lunoAi.apiKeyRequired") || "Please set up your Gemini API key in Settings.",
      });
      onOpenSettings?.("ai");
      return;
    }

    const msgIndex = messages.findIndex((m) => m.id === assistantMsgId);
    if (msgIndex === -1) return;

    let userMsgIndex = -1;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMsgIndex = i;
        break;
      }
    }

    if (userMsgIndex === -1) return;

    const targetUserMsg = messages[userMsgIndex];
    const historyForApi = messages.slice(0, userMsgIndex);

    setMessages((prev) => prev.slice(0, userMsgIndex + 1));
    setIsGenerating(true);

    try {
      const { result, modelUsed } = await runGeminiChatHistory(
        settings.geminiApiKey,
        historyForApi,
        targetUserMsg.content,
        undefined,
        model,
        lang,
        settings.aiModel
      );

      const newAssistantMsg: MessageItem = {
        id: Date.now().toString(),
        role: "assistant",
        content: result,
        timestamp: Date.now(),
        modelUsed,
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      toast({
        title: t("lunoAi.regenerateSuccessTitle") || "Response Regenerated",
        description: t("lunoAi.regenerateSuccessDesc") || "AI response has been updated.",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to regenerate AI response";
      toast({
        title: t("lunoAi.generationErrorTitle") || "AI Generation Error",
        description: errorMsg,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAction = (actionKey: "summarize" | "improve" | "brainstorm" | "outline" | "translate") => {
    let prefixText = "";
    if (lang === "th") {
      if (actionKey === "summarize") {
        prefixText = "สรุปเนื้อหา: ";
      } else if (actionKey === "improve") {
        prefixText = "ปรับแต่งข้อความ: ";
      } else if (actionKey === "brainstorm") {
        prefixText = "ระดมความคิด: ";
      } else if (actionKey === "outline") {
        prefixText = "สร้างโครงร่าง: ";
      } else if (actionKey === "translate") {
        prefixText = "แปลเป็นภาษาไทย: ";
      }
    } else {
      if (actionKey === "summarize") {
        prefixText = "Summarize: ";
      } else if (actionKey === "improve") {
        prefixText = "Improve writing: ";
      } else if (actionKey === "brainstorm") {
        prefixText = "Brainstorm: ";
      } else if (actionKey === "outline") {
        prefixText = "Create outline: ";
      } else if (actionKey === "translate") {
        prefixText = "Translate to English: ";
      }
    }

    setActivePrefix(prefixText);
    setTimeout(() => {
      textareaRef.current?.focus();
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: t("lunoAi.copyTitle") || "Copied to Clipboard",
      description: t("lunoAi.copyDesc") || "Response content copied successfully.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleProcessFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, content: `[Attached Image: ${file.name}]`, dataUrl },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setAttachedFiles((prev) => [...prev, { name: file.name, content: text }]);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) handleProcessFiles(files);
    e.target.value = "";
  };

  const modelLabels = {
    smart: t("lunoAi.modelSmart") || "Smart",
    fast: t("lunoAi.modelFast") || "Fast",
    creative: t("lunoAi.modelCreative") || "Creative",
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchHistoryQuery.trim()) return true;
    const q = searchHistoryQuery.toLowerCase();
    const title = (s.title || "").toLowerCase();
    const contentText = s.messages.map((m) => m.content).join(" ").toLowerCase();
    return title.includes(q) || contentText.includes(q);
  });

  return (
    <div data-luno-ai-view="true" className="w-full flex-1 flex h-full overflow-hidden bg-background text-foreground">
      {/* If in sidebar mode and history is open, render history view inside panel */}
      {isSidebar && isHistoryRightPanelOpen ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {/* Search History Filter */}
          <div className="px-3 py-1 space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-2.5 py-1.5 border border-sidebar-border/40 focus-within:border-primary focus-within:ring-0 shadow-none transition-all">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                data-luno-ai-history-search="true"
                type="text"
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                placeholder={t("lunoAi.searchHistory") || "Search chat history..."}
                className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searchHistoryQuery && (
                <button
                  type="button"
                  onClick={() => setSearchHistoryQuery("")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {sessions.length > 0 && (
              <div className="flex items-center justify-between px-0.5 pt-0.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                <span>{t("lunoAi.recentChats") || "Recent Chats"}</span>
              </div>
            )}
          </div>

          {/* History List */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-1.5 pb-4 space-y-1.5">
            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Clock className="h-6 w-6 opacity-40 text-muted-foreground" />
                <span>{t("lunoAi.noHistory") || "No chat history yet"}</span>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === currentSessionId;
                const timeStr = formatRelativeDateTime(
                  session.createdAt || (session as any).updatedAt || Date.now(),
                  settings.dateFormat,
                  settings.timeFormat,
                  settings.language
                );
                const lastMsgContent = [...(session.messages || [])].reverse().find((m) => (m?.content || "").trim())?.content || "";
                const previewText = stripMarkdownSyntax(lastMsgContent) || "No messages";

                return (
                  <div
                    key={session.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectSession(session);
                        setIsHistoryRightPanelOpen(false);
                      }
                    }}
                    onClick={() => {
                      handleSelectSession(session);
                      setIsHistoryRightPanelOpen(false);
                    }}
                    className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer select-none outline-none ${
                      isActive
                        ? "bg-primary/10 border-primary/40 text-primary shadow-2xs"
                        : "border-border/40 hover:border-primary/40 hover:bg-sidebar-accent/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <MessageSquare
                          className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                            isActive ? "text-primary font-semibold" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`truncate text-xs ${
                            isActive ? "font-bold text-primary" : "font-semibold text-foreground"
                          }`}
                        >
                          {session.title || "Luno AI Chat"}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeStr}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground flex-1">
                        {previewText}
                      </p>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id, e);
                            }}
                            className="h-5 w-5 shrink-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer [&_svg]:size-3"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("lunoAi.deleteChat") || "Delete chat"}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Main Chat Area */
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* Top Header Bar (Only in full tab mode) */}
          {!isSidebar && (
            <div className="w-full h-11 shrink-0 px-4 bg-background flex items-center justify-between z-10">
              <div className="flex items-center gap-2 min-w-0">
                {messages.length > 0 && (
                  <span className="text-xs font-bold text-foreground truncate">
                    {messages.find((m) => m.role === "user")?.content.slice(0, 45) || "Luno AI Chat"}
                  </span>
                )}
                {attachedFiles.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium truncate max-w-[180px]">
                    <FileCode className="h-3 w-3 shrink-0" />
                    <span className="truncate">{attachedFiles.map((f) => f.name).join(", ")}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsHistoryRightPanelOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer ${
                        isHistoryRightPanelOpen
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>{t("lunoAi.chatHistory") || "History"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("lunoAi.chatHistory") || "Chat History"}</TooltipContent>
                </Tooltip>

                {messages.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleNewChat}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t("lunoAi.newChat") || "New chat"}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("lunoAi.newChat") || "New Chat"}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {/* Upper Container / Messages Stream */}
          <div className="flex-1 overflow-y-auto w-full no-scrollbar flex flex-col justify-between">
            {messages.length === 0 ? (
              /* Hero Content in Hero Mode */
              <div className={`w-full max-w-3xl mx-auto ${isSidebar ? "px-2 py-2 h-full flex-1 flex flex-col justify-between" : "px-4 py-8 -mt-8 sm:-mt-12 space-y-6 flex-1 flex flex-col items-center justify-center"}`}>
                {/* Hero Logo & Header - Centered */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col items-center text-center ${isSidebar ? "flex-1 justify-center space-y-1.5" : "space-y-2.5 mb-6 sm:mb-8"}`}
                >
                  <Sparkles className={`${isSidebar ? "h-6 w-6" : "h-7 w-7"} text-primary mb-1 shrink-0`} />
                  <h1 className={`${isSidebar ? "text-base" : "text-xl sm:text-2xl"} font-bold tracking-tight text-foreground font-krona`}>
                    Luno AI
                  </h1>
                  <p className="text-xs text-muted-foreground max-w-sm text-center px-2">
                    {t("lunoAi.subtitle") || "Ask anything. Get ideas. Write better."}
                  </p>
                </motion.div>

                {/* Main Input Box Card in Hero Mode - Bottom Docked */}
                <div className={`w-full ${isSidebar ? "shrink-0 space-y-2" : "space-y-3"}`}>
                  {editingUserMsgId && (
                    <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-2xs text-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground">{t("lunoAi.editingPrompt") || "Editing prompt"}</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserMsgId(null);
                              setPrompt("");
                            }}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          Cancel edit
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                      {attachedFiles.map((file, idx) => (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium text-foreground transition-all shadow-2xs">
                              <AttachedFileChipIcon fileName={file.name} dataUrl={(file as any).dataUrl} notes={notes} />
                              <span className="max-w-[180px] truncate text-xs font-medium text-foreground">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted cursor-pointer ml-0.5"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{file.name}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  )}

                  <div className={`relative w-full rounded-2xl border border-border/80 bg-card ${isSidebar ? "p-2.5 space-y-2" : "p-3.5 space-y-2.5"} shadow-xs focus-within:border-primary focus-within:ring-0 shadow-none transition-all`}>
                    <div className="flex flex-wrap items-baseline gap-1 min-h-[44px] max-h-[160px]">
                      {activePrefix && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              onClick={() => setActivePrefix(null)}
                              className="text-primary font-bold text-xs sm:text-sm select-none cursor-pointer hover:opacity-80 shrink-0"
                              aria-label="Click or Backspace to remove"
                            >
                              {activePrefix}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4}>
                            Click or Backspace to remove
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (isSlashMenuOpen && filteredTools.length > 0) {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setSelectedSlashIndex((prev) => (prev + 1) % filteredTools.length);
                              return;
                            }
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setSelectedSlashIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
                              return;
                            }
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applySlashTool(filteredTools[selectedSlashIndex]);
                              return;
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setIsSlashMenuOpen(false);
                              return;
                            }
                          }

                          if (e.key === "Backspace" && activePrefix) {
                            const target = e.currentTarget as HTMLTextAreaElement;
                            if (!prompt || target.selectionStart === 0) {
                              e.preventDefault();
                              setActivePrefix(null);
                            }
                          } else if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSendPrompt();
                          }
                        }}
                        placeholder={dynamicPlaceholder}
                        className={`flex-1 min-w-[140px] bg-transparent text-xs sm:text-sm text-foreground font-normal placeholder:text-muted-foreground border-0 border-none outline-none ring-0 shadow-none focus:border-0 focus:border-none focus:outline-none focus:ring-0 focus:shadow-none resize-none ${isSidebar ? "min-h-[44px] max-h-[120px]" : "min-h-[56px] max-h-[160px]"} leading-relaxed py-0.5`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                        <DropdownMenu>
                          <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={`h-8 ${isSidebar ? "w-8 px-0 justify-center" : "px-3"} rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all border border-border/60 flex items-center gap-1.5 cursor-pointer`}
                              >
                                <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                                {!isSidebar && <span>{t("lunoAi.attachFile") || "Attach file"}</span>}
                              </button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>{t("lunoAi.attachFile") || "Attach file"}</TooltipContent>
                        </Tooltip>
                          <DropdownMenuContent align="start" className="w-auto min-w-[240px]">
                            <DropdownMenuItem
                              onClick={() => {
                                setSearchWorkspaceQuery("");
                                setIsWorkspacePickerOpen(true);
                              }}
                              className="whitespace-nowrap"
                            >
                              <Folder className="h-4 w-4 text-primary shrink-0" />
                              <span className="whitespace-nowrap">{t("lunoAi.attachFromWorkspace") || "Attach note from workspace"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap">
                              <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="whitespace-nowrap">{t("lunoAi.uploadComputer") || "Upload from computer"}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={handleToggleVoiceInput}
                              disabled={!isListening && isTranscribing}
                              className={`h-8 ${isSidebar ? "w-8 px-0 justify-center" : "px-3"} rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer ${
                                isListening
                                  ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse font-semibold"
                                  : isTranscribing
                                  ? "bg-primary/10 text-primary border-primary/30 cursor-wait"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border/60"
                              }`}
                            >
                              {isListening ? (
                                <Square className="h-3 w-3 text-red-500 fill-red-500 shrink-0" />
                              ) : isTranscribing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                              ) : (
                                <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                              {!isSidebar && (
                                <span>
                                  {isListening
                                    ? (t("lunoAi.stopListening") || "Stop listening")
                                    : isTranscribing
                                    ? (t("lunoAi.voiceTranscribing") || "Transcribing...")
                                    : (t("lunoAi.voiceInput") || "Voice input")}
                                </span>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isListening
                              ? (t("lunoAi.stopListening") || "Stop listening")
                              : isTranscribing
                              ? (t("lunoAi.voiceTranscribing") || "Transcribing...")
                              : (t("lunoAi.voiceInput") || "Voice input")}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={`h-8 ${isSidebar ? "px-2" : "pl-2.5 pr-2"} rounded-xl bg-background hover:bg-muted text-xs font-medium text-foreground transition-all border border-border/60 flex items-center gap-1 cursor-pointer outline-none shadow-2xs`}
                            >
                              {renderModelIcon(model)}
                              {!isSidebar && <span>{modelLabels[model]}</span>}
                              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border border-border bg-popover text-popover-foreground z-50">
                            {(["smart", "fast", "creative"] as const).map((mKey) => {
                              const isSelected = model === mKey;
                              return (
                                <DropdownMenuItem
                                  key={mKey}
                                  onClick={() => setModel(mKey)}
                                  className={`flex items-center justify-between text-[13px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18"
                                      : "text-foreground hover:bg-primary/8 hover:text-primary focus:bg-primary/8 focus:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {renderModelIcon(mKey)}
                                    <span>{modelLabels[mKey]}</span>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1.5" />}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled={!prompt.trim() || isGenerating}
                              onClick={() => void handleSendPrompt()}
                              className={`h-8 ${isSidebar ? "px-2.5" : "px-3.5"} rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all cursor-pointer`}
                            >
                              {!isSidebar && <span>{t("lunoAi.send") || "Send"}</span>}
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("lunoAi.send") || "Send"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* 5 Quick Action Cards Grid (Only in full tab mode, hidden in sidebar mode) */}
                  {!isSidebar && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full pt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAction("summarize")}
                        className="flex flex-col text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11.5px] font-semibold text-foreground transition-colors">
                          {t("lunoAi.summarizeTitle") || "Summarize"}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                          {t("lunoAi.summarizeDesc") || "Summarize this note"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction("improve")}
                        className="flex flex-col text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer"
                      >
                        <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1.5 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11.5px] font-semibold text-foreground transition-colors">
                          {t("lunoAi.improveTitle") || "Improve writing"}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                          {t("lunoAi.improveDesc") || "Make this better"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction("brainstorm")}
                        className="flex flex-col text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer"
                      >
                        <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-1.5 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11.5px] font-semibold text-foreground transition-colors">
                          {t("lunoAi.brainstormTitle") || "Brainstorm"}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                          {t("lunoAi.brainstormDesc") || "Give me ideas"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction("outline")}
                        className="flex flex-col text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer"
                      >
                        <ListOrdered className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1.5 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11.5px] font-semibold text-foreground transition-colors">
                          {t("lunoAi.outlineTitle") || "Create outline"}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                          {t("lunoAi.outlineDesc") || "Make an outline"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction("translate")}
                        className="flex flex-col text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer"
                      >
                        <Languages className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1.5 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11.5px] font-semibold text-foreground transition-colors">
                          {t("lunoAi.translateTitle") || "Translate"}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                          {t("lunoAi.translateDesc") || "Translate to English"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Messages Stream View in Chat Mode */
              <div className={`w-full max-w-3xl mx-auto ${isSidebar ? "px-2 py-3" : "px-4 py-6"}`}>
                <div className="w-full space-y-6 mb-4 pt-2">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "user" ? (
                      /* User Prompt Bubble */
                      <div className="max-w-[85%] ml-auto flex flex-col items-end gap-1.5 group/user-turn">
                        {msg.attachedFileNames && msg.attachedFileNames.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            {msg.attachedFileNames.map((name, i) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-foreground font-medium text-xs shadow-2xs"
                              >
                                <AttachedFileChipIcon fileName={name} notes={notes} />
                                <span className="truncate max-w-[200px] text-xs font-medium text-foreground">{name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text Prompt Bubble */}
                        <div className="bg-primary/10 text-foreground font-medium px-4 py-2.5 rounded-2xl border border-primary/15 text-xs sm:text-sm leading-relaxed shadow-2xs">
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>

                        {/* Action Buttons under the text bubble (Icon-only with Tooltips) */}
                        <div className="opacity-0 group-hover/user-turn:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 pt-1 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center cursor-pointer"
                              >
                                {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{copiedId === msg.id ? (t("lunoAi.copied") || "Copied!") : (t("common.copy") || "Copy")}</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleEditUserPrompt(msg.id, msg.content)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t("common.edit") || "Edit"}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      /* AI Output */
                      <div className="w-full space-y-2 py-1">
                        <div
                          className="editor-markdown-content text-xs sm:text-sm leading-relaxed text-foreground"
                          onClick={(e) => {
                            const target = (e.target as HTMLElement).closest("a");
                            if (target) {
                              const href = target.getAttribute("href");
                              if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                                e.preventDefault();
                                if (onOpenWebTab) onOpenWebTab(href);
                                else window.open(href, "_blank", "noopener,noreferrer");
                              }
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(msg.content) }}
                        />

                        {/* Action Toolbar under AI Output (Icon-only with Tooltips) */}
                        <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                          <span className="text-[10.5px] opacity-60 mr-1">
                            {msg.modelUsed ? `Model: ${msg.modelUsed}` : "Luno AI"}
                          </span>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() => handleRegenerateResponse(msg.id)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t("lunoAi.regenerate") || "Regenerate"}</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center cursor-pointer"
                              >
                                {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{copiedId === msg.id ? (t("lunoAi.copied") || "Copied!") : (t("lunoAi.copyResponse") || "Copy response")}</TooltipContent>
                          </Tooltip>

                          {(onInsertToSelectedNote || onInsertToActiveNote) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInsertTextContent(msg.content);
                                    setSearchInsertNoteQuery("");
                                    setIsInsertModalOpen(true);
                                  }}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{t("lunoAi.insertToNote") || "Insert into note"}</TooltipContent>
                            </Tooltip>
                          )}

                          {onCreateNewNote && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fullDefaultName = extractDefaultFileName(msg.content);
                                    const baseName = fullDefaultName.replace(/\.(md|html|txt)$/i, "");
                                    setCreateNoteContent(msg.content);
                                    setCreateNoteFileName(baseName || "Untitled");
                                    setCreateNoteFileExt("md");
                                    setIsCreateNoteModalOpen(true);
                                  }}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer"
                                >
                                  <FilePlus className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{t("lunoAi.createAsNewNote") || "Create as new note"}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 py-2 text-xs text-muted-foreground/70 font-medium"
                  >
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/70" />
                    <span>{t("lunoAi.thinking") || "Thinking..."}</span>
                  </motion.div>
                )}

                <div ref={chatBottomRef} />
              </div>
            </div>
          )}

          {/* Footer Disclaimer in Hero Mode */}
          {messages.length === 0 && (
            <div className={`w-full shrink-0 ${isSidebar ? "px-2 py-1 text-[10px]" : "py-2.5 text-[10.5px]"} text-center flex items-center justify-center gap-1.5 text-muted-foreground select-none overflow-hidden`}>
              <Lock className={`${isSidebar ? "h-2.5 w-2.5" : "h-3 w-3"} shrink-0 opacity-70`} />
              <span className={isSidebar ? "truncate" : ""}>{t("lunoAi.disclaimer") || "Luno AI may make mistakes. Please check important info."}</span>
            </div>
          )}
        </div>

        {/* Docked Bottom Input Bar in Chat Mode */}
        {messages.length > 0 && (
          <div className="w-full shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-md p-3 pb-2 space-y-2">
            <div className="w-full max-w-3xl mx-auto space-y-2">
              {editingUserMsgId && (
                <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-2xs text-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-foreground">{t("lunoAi.editingPrompt") || "Editing prompt"}</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserMsgId(null);
                          setPrompt("");
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                        aria-label="Cancel edit"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                      Cancel edit
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                  {attachedFiles.map((file, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium text-foreground transition-all shadow-2xs">
                          <AttachedFileChipIcon fileName={file.name} dataUrl={(file as any).dataUrl} notes={notes} />
                          <span className="max-w-[180px] truncate text-xs font-medium text-foreground">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted cursor-pointer ml-0.5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{file.name}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}

              <div className={`relative w-full rounded-2xl border border-border/80 bg-card ${isSidebar ? "p-2.5 space-y-2" : "p-3.5 space-y-2.5"} shadow-xs focus-within:border-primary focus-within:ring-0 shadow-none transition-all`}>
                <div className="flex flex-wrap items-baseline gap-1 min-h-[44px] max-h-[160px]">
                  {activePrefix && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          onClick={() => setActivePrefix(null)}
                          className="text-primary font-bold text-xs sm:text-sm select-none cursor-pointer hover:opacity-80 shrink-0"
                          aria-label="Click or Backspace to remove"
                        >
                          {activePrefix}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4}>
                        Click or Backspace to remove
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <textarea
                    ref={chatInputRef}
                    value={prompt}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (isSlashMenuOpen && filteredTools.length > 0) {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setSelectedSlashIndex((prev) => (prev + 1) % filteredTools.length);
                          return;
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSelectedSlashIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
                          return;
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applySlashTool(filteredTools[selectedSlashIndex]);
                          return;
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setIsSlashMenuOpen(false);
                          return;
                        }
                      }

                      if (e.key === "Backspace" && activePrefix) {
                        const target = e.currentTarget as HTMLTextAreaElement;
                        if (!prompt || target.selectionStart === 0) {
                          e.preventDefault();
                          setActivePrefix(null);
                        }
                      } else if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendPrompt();
                      }
                    }}
                    placeholder={dynamicPlaceholder}
                    className={`flex-1 min-w-[140px] bg-transparent text-xs sm:text-sm text-foreground font-normal placeholder:text-muted-foreground border-0 border-none outline-none ring-0 shadow-none focus:border-0 focus:border-none focus:outline-none focus:ring-0 focus:shadow-none resize-none ${isSidebar ? "min-h-[44px] max-h-[120px]" : "min-h-[56px] max-h-[160px]"} leading-relaxed py-0.5`}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={`h-8 ${isSidebar ? "w-8 px-0 justify-center" : "px-3"} rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all border border-border/60 flex items-center gap-1.5 cursor-pointer`}
                            >
                              <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                              {!isSidebar && <span>{t("lunoAi.attachFile") || "Attach file"}</span>}
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("lunoAi.attachFile") || "Attach file"}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-auto min-w-[240px]">
                        <DropdownMenuItem
                          onClick={() => {
                            setSearchWorkspaceQuery("");
                            setIsWorkspacePickerOpen(true);
                          }}
                          className="whitespace-nowrap"
                        >
                          <Folder className="h-4 w-4 text-primary shrink-0" />
                          <span className="whitespace-nowrap">{t("lunoAi.attachFromWorkspace") || "Attach note from workspace"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap">
                          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="whitespace-nowrap">{t("lunoAi.uploadComputer") || "Upload from computer"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleToggleVoiceInput}
                          disabled={!isListening && isTranscribing}
                          className={`h-8 ${isSidebar ? "w-8 px-0 justify-center" : "px-3"} rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isListening
                              ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse font-semibold"
                              : isTranscribing
                              ? "bg-primary/10 text-primary border-primary/30 cursor-wait"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border/60"
                          }`}
                        >
                          {isListening ? (
                            <Square className="h-3 w-3 text-red-500 fill-red-500 shrink-0" />
                          ) : isTranscribing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                          ) : (
                            <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                          {!isSidebar && (
                            <span>
                              {isListening
                                ? (t("lunoAi.stopListening") || "Stop listening")
                                : isTranscribing
                                ? (t("lunoAi.voiceTranscribing") || "Transcribing...")
                                : (t("lunoAi.voiceInput") || "Voice input")}
                            </span>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isListening
                          ? (t("lunoAi.stopListening") || "Stop listening")
                          : isTranscribing
                          ? (t("lunoAi.voiceTranscribing") || "Transcribing...")
                          : (t("lunoAi.voiceInput") || "Voice input")}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={`h-8 ${isSidebar ? "px-2" : "pl-2.5 pr-2"} rounded-xl bg-background hover:bg-muted text-xs font-medium text-foreground transition-all border border-border/60 flex items-center gap-1 cursor-pointer outline-none shadow-2xs`}
                        >
                          {renderModelIcon(model)}
                          {!isSidebar && <span>{modelLabels[model]}</span>}
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border border-border bg-popover text-popover-foreground z-50">
                        {(["smart", "fast", "creative"] as const).map((mKey) => {
                          const isSelected = model === mKey;
                          return (
                            <DropdownMenuItem
                              key={mKey}
                              onClick={() => setModel(mKey)}
                              className={`flex items-center justify-between text-[13px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18"
                                  : "text-foreground hover:bg-primary/8 hover:text-primary focus:bg-primary/8 focus:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {renderModelIcon(mKey)}
                                <span>{modelLabels[mKey]}</span>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1.5" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={!prompt.trim() || isGenerating}
                          onClick={() => void handleSendPrompt()}
                          className={`h-8 ${isSidebar ? "px-2.5" : "px-3.5"} rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all cursor-pointer`}
                        >
                          {!isSidebar && <span>{t("lunoAi.send") || "Send"}</span>}
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("lunoAi.send") || "Send"}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer in Chat Mode - Below Input Box */}
            <div className={`w-full pt-1 text-center flex items-center justify-center gap-1.5 ${isSidebar ? "px-2 text-[10px]" : "text-[10.5px]"} text-muted-foreground select-none overflow-hidden`}>
              <Lock className={`${isSidebar ? "h-2.5 w-2.5" : "h-3 w-3"} shrink-0 opacity-70`} />
              <span className={isSidebar ? "truncate" : ""}>{t("lunoAi.disclaimer") || "Luno AI may make mistakes. Please check important info."}</span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modal Dialog: Create New Note File from Luno AI */}
      <Dialog open={isCreateNoteModalOpen} onOpenChange={setIsCreateNoteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("sidebar.createFileTitle") || "Create new file"}</DialogTitle>
            <DialogDescription>
              {t("sidebar.createFileDescription") || "Set file name and extension before creating."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="luno-create-file-name" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.fileNameLabel") || "File name"}
              </label>
              <input
                id="luno-create-file-name"
                type="text"
                value={createNoteFileName}
                onChange={(e) => setCreateNoteFileName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (onCreateNewNote) {
                      const cleanName = createNoteFileName.trim() || "Untitled";
                      const baseName = cleanName.replace(/\.(md|html|txt)$/i, "");
                      const fullFileName = `${baseName}.${createNoteFileExt}`;
                      onCreateNewNote(fullFileName, createNoteContent);
                      setIsCreateNoteModalOpen(false);
                    }
                  }
                }}
                placeholder="Untitled"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="luno-create-file-ext" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.fileTypeLabel") || "File type"}
              </label>
              <Select value={createNoteFileExt} onValueChange={(v) => setCreateNoteFileExt(v as "md" | "html" | "txt")}>
                <SelectTrigger id="luno-create-file-ext" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">{t("sidebar.fileTypeTxt") || "Text (.txt)"}</SelectItem>
                  <SelectItem value="md">{t("sidebar.fileTypeMd") || "Markdown (.md)"}</SelectItem>
                  <SelectItem value="html">{t("sidebar.fileTypeHtml") || "HTML (.html)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateNoteModalOpen(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (onCreateNewNote) {
                  const cleanName = createNoteFileName.trim() || "Untitled";
                  const baseName = cleanName.replace(/\.(md|html|txt)$/i, "");
                  const fullFileName = `${baseName}.${createNoteFileExt}`;
                  onCreateNewNote(fullFileName, createNoteContent);
                  setIsCreateNoteModalOpen(false);
                }
              }}
            >
              {t("sidebar.createFileAction") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Select Note to Insert AI Content */}
      <Dialog open={isInsertModalOpen} onOpenChange={setIsInsertModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("lunoAi.selectNoteToInsert") || "Select Note to Insert Content"}
            </DialogTitle>
            <DialogDescription>
              {t("lunoAi.selectNoteToInsertDesc") || "Choose a note document to append this AI response."}
            </DialogDescription>
          </DialogHeader>

          {/* Search Box */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 border border-border/50 focus-within:border-primary focus-within:ring-0 shadow-none transition-all my-1">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={searchInsertNoteQuery}
              onChange={(e) => setSearchInsertNoteQuery(e.target.value)}
              placeholder={t("lunoAi.searchWorkspaceNotes") || "Search workspace notes..."}
              className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchInsertNoteQuery && (
              <button
                type="button"
                onClick={() => setSearchInsertNoteQuery("")}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Notes Folder Tree */}
          <div className="max-h-64 overflow-y-auto pr-1 no-scrollbar py-1">
            <WorkspaceFolderTree
              notes={notes}
              searchQuery={searchInsertNoteQuery}
              activeNoteId={activeNote?.id}
              actionType="insert"
              openedFolderName={openedFolderName}
              onSelectNote={(n) => {
                if (onInsertToSelectedNote) {
                  onInsertToSelectedNote(n.id, insertTextContent);
                } else if (onInsertToActiveNote) {
                  onInsertToActiveNote(insertTextContent);
                }
                setIsInsertModalOpen(false);
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsInsertModalOpen(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Select Workspace Note to Attach */}
      <Dialog open={isWorkspacePickerOpen} onOpenChange={setIsWorkspacePickerOpen}>
        <DialogContent className="max-w-md rounded-2xl p-4 gap-3">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base font-bold">
              {t("lunoAi.selectWorkspaceNotes") || "Select note to attach"}
            </DialogTitle>
          </DialogHeader>

          {/* Search Box */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 border border-border/50 focus-within:border-primary focus-within:ring-0 shadow-none transition-all">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={searchWorkspaceQuery}
              onChange={(e) => setSearchWorkspaceQuery(e.target.value)}
              placeholder={t("lunoAi.searchWorkspaceNotes") || "Search workspace notes..."}
              className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchWorkspaceQuery && (
              <button
                type="button"
                onClick={() => setSearchWorkspaceQuery("")}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Notes Folder Tree */}
          <div className="max-h-60 overflow-y-auto pr-1 no-scrollbar py-1">
            <WorkspaceFolderTree
              notes={notes}
              searchQuery={searchWorkspaceQuery}
              attachedFileNames={attachedFiles.map((f) => f.name)}
              actionType="attach"
              openedFolderName={openedFolderName}
              onSelectNote={(n) => handleAttachWorkspaceNote(n)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Right Panel: Chat History Panel (Matches RightPanel.tsx 100%) */}
      <AnimatePresence>
        {!isSidebar && isHistoryRightPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full w-[280px] shrink-0 border-l border-border bg-background flex flex-col select-none overflow-hidden"
          >
            {/* Header Tabs (Matches RightPanel.tsx) */}
            <div className="flex h-11 items-center justify-between border-b border-border/50 px-4 pt-2 shrink-0">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  className="relative pb-2.5 text-foreground font-bold transition-colors cursor-pointer"
                >
                  {t("lunoAi.chatHistory") || "History"}
                  <motion.div layoutId="rightPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleClearAllHistory}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("lunoAi.clearAll") || "Clear all history"}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsHistoryRightPanelOpen(false)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("lunoAi.closePanel") || "Close panel"}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Scrollable Content Body (Matches RightPanel.tsx padding & typography) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs no-scrollbar">
              {/* Search History Filter (Matches Search Note UI) */}
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 border border-border/50 focus-within:border-primary focus-within:ring-0 shadow-none transition-all">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  data-luno-ai-history-search="true"
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  placeholder={t("lunoAi.searchHistory") || "Search chat history..."}
                  className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchHistoryQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchHistoryQuery("")}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Section Title */}
              {sessions.length > 0 && (
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-1">
                  {t("lunoAi.recentChats") || "Recent Chats"}
                </div>
              )}

              {/* Chat Sessions List */}
              <div className="space-y-2">
                {filteredSessions.length === 0 ? (
                  <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Clock className="h-7 w-7 opacity-40 text-muted-foreground" />
                    <span>{t("lunoAi.noHistory") || "No chat history yet"}</span>
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    const timeStr = formatRelativeDateTime(
                      session.createdAt || session.updatedAt || Date.now(),
                      settings.dateFormat,
                      settings.timeFormat,
                      settings.language
                    );

                    // Extract preview snippet from messages with all markdown syntax stripped
                    const lastMsgContent = [...(session.messages || [])].reverse().find((m) => (m?.content || "").trim())?.content || "";
                    const previewText = stripMarkdownSyntax(lastMsgContent) || "No messages";

                    return (
                      <div
                        key={session.id}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectSession(session);
                          }
                        }}
                        onClick={() => handleSelectSession(session)}
                        className={`group relative rounded-xl border-[1.5px] p-2.5 transition-all cursor-pointer select-none outline-none ${
                          isActive
                            ? "bg-primary/10 border-primary/50 text-primary shadow-2xs"
                            : "border-border/40 hover:border-primary/60 focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 hover:bg-muted/50 text-foreground/90"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <MessageSquare
                              className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                isActive ? "text-primary font-semibold" : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`truncate text-xs ${
                                isActive ? "font-bold text-primary" : "font-semibold text-foreground"
                              }`}
                            >
                              {session.title || "Luno AI Chat"}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground font-medium">
                            {timeStr}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground flex-1">
                            {previewText}
                          </p>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id, e);
                                }}
                                className="h-6 w-6 shrink-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer [&_svg]:size-3.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("lunoAi.deleteChat") || "Delete chat"}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating Slash Commands Menu (100% Identical to Editor UI) */}
      {isSlashMenuOpen && filteredTools.length > 0 && menuCoords && (
        <div
          role="menu"
          data-slash-menu="true"
          className="fixed z-[9999] w-56 rounded-xl border border-border/80 bg-popover p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-72 overflow-hidden text-popover-foreground select-none"
          style={{
            ...(menuCoords.bottom !== undefined ? { bottom: `${menuCoords.bottom}px` } : { top: `${menuCoords.top}px` }),
            left: `${menuCoords.left}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
            {t("editor.slashMenuTitle") || (lang === "th" ? "คำสั่ง" : "Commands")}
          </div>

          {canScrollUp && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollSlashMenu("up")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none hover:text-foreground transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </div>
          )}

          <div
            ref={slashMenuScrollRef}
            onScroll={checkSlashMenuScroll}
            className="overflow-y-auto no-scrollbar flex-1 py-1"
          >
            {filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedSlashIndex;
              return (
                <div
                  key={tool.id}
                  role="menuitem"
                  tabIndex={0}
                  data-slash-item={idx}
                  data-selected={isSelected ? "true" : undefined}
                  onClick={() => applySlashTool(tool)}
                  onMouseEnter={() => setSelectedSlashIndex(idx)}
                  className={`flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none gap-2.5 [&>span>svg]:h-4 [&>span>svg]:w-4 [&>span>svg]:shrink-0 [&>span>svg]:text-muted-foreground ${
                    isSelected
                      ? "bg-primary/15 text-primary font-medium [&>span>svg]:text-primary hover:bg-primary/8 hover:text-primary hover:[&>span>svg]:text-primary hover:[&_svg]:text-primary"
                      : "text-foreground font-normal hover:bg-primary/8 hover:text-primary hover:[&>span>svg]:text-primary hover:[&_svg]:text-primary"
                  }`}
                >
                  <span className="shrink-0">{tool.icon}</span>
                  <span className="flex-1 truncate">
                    {lang === "th" ? tool.labelTh : tool.labelEn}
                  </span>
                </div>
              );
            })}
          </div>

          {canScrollDown && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollSlashMenu("down")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
