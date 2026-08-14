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
  RotateCcw,
} from "lucide-react";
import { SparklesIcon as Sparkles } from "@/components/icons/SparklesIcon";
import { WandSparklesIcon as Wand2 } from "@/components/icons/WandSparklesIcon";
import { PencilIcon as Pencil } from "@/components/icons/PencilIcon";
import { marked } from "marked";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { runGeminiPrompt, runGeminiAction, runGeminiChatHistory } from "@/lib/geminiApi";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { Note } from "@/hooks/useNotes";

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
    return typeof rawHtml === "string" ? rawHtml : markdownText;
  } catch (_) {
    return markdownText;
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
  onInsertToActiveNote?: (text: string) => void;
  onInsertToSelectedNote?: (noteId: string, text: string) => void;
  onCreateNewNote?: (fileName: string, content: string, folderPath?: string) => void;
  onOpenSettings?: (category?: string) => void;
}

const CHAT_SESSIONS_STORAGE_KEY = "luno-ai-chat-sessions-v2";
const LAST_ACTIVE_SESSION_STORAGE_KEY = "luno-ai-last-active-session-id";
const HISTORY_PANEL_OPEN_STORAGE_KEY = "luno-ai-history-panel-open";

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

function WorkspaceFolderTree({
  notes,
  searchQuery = "",
  activeNoteId,
  attachedFileNames = [],
  onSelectNote,
  actionType,
}: {
  notes: Note[];
  searchQuery?: string;
  activeNoteId?: string | null;
  attachedFileNames?: string[];
  onSelectNote: (note: Note) => void;
  actionType: "insert" | "attach";
}) {
  const { settings } = useAppSettings();
  const workspaceNotes = useMemo(() => notes.filter((n) => n.id !== "luno-ai" && n.id !== "settings"), [notes]);
  const tree = useMemo(() => buildWorkspaceFolderTree(workspaceNotes), [workspaceNotes]);

  const allFolderPaths = useMemo(() => {
    const paths = new Set<string>();
    const collect = (node: WorkspaceFolderNode) => {
      if (node.path) paths.add(node.path);
      node.children.forEach(collect);
    };
    collect(tree);
    return paths;
  }, [tree]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set(allFolderPaths));

  useEffect(() => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      allFolderPaths.forEach((p) => next.add(p));
      return next;
    });
  }, [allFolderPaths]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
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
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors" />
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
        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors rounded-lg group my-0.5 outline-none focus-visible:ring-0 ${
          actionType === "attach" && isAttached
            ? "bg-sidebar-accent/40 opacity-60 cursor-not-allowed"
            : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground cursor-pointer"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors" />
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
          {isOpen ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" /> : <Folder className="h-3.5 w-3.5 text-primary shrink-0" />}
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

export default function LunoAiView({
  notes = [],
  activeNote,
  onInsertToActiveNote,
  onInsertToSelectedNote,
  onCreateNewNote,
  onOpenSettings,
}: LunoAiViewProps) {
  const { t } = useTranslation();
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
      const savedSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      const parsed: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];

      if (lastId && parsed.some((s) => s.id === lastId)) {
        return lastId;
      }
      if (parsed.length > 0) {
        return parsed[0].id;
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    try {
      const lastId = localStorage.getItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
      const savedSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      const parsed: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];

      const targetSession = parsed.find((s) => s.id === lastId) || parsed[0];
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
        localStorage.removeItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
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
      localStorage.removeItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
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
            localStorage.removeItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
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
      localStorage.removeItem(LAST_ACTIVE_SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    toast({
      title: t("lunoAi.clearAllSuccessTitle") || "History cleared",
      description: t("lunoAi.clearAllSuccessDesc") || "All previous chat history has been deleted.",
    });
  };

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
    const textToSend = (customPrompt ?? prompt).trim();
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
          model
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
      if (!customPrompt) setPrompt("");
      setAttachedFiles([]);
      setIsGenerating(true);

      try {
        const { result, modelUsed } = await runGeminiChatHistory(
          settings.geminiApiKey,
          messages,
          textToSend,
          fileContexts,
          model
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
        model
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
    let templateText = "";
    if (actionKey === "summarize") {
      templateText = "Summarize: ";
    } else if (actionKey === "improve") {
      templateText = "Improve writing: ";
    } else if (actionKey === "brainstorm") {
      templateText = "Brainstorm: ";
    } else if (actionKey === "outline") {
      templateText = "Create an outline for: ";
    } else if (actionKey === "translate") {
      templateText = "Translate to English: ";
    }

    setPrompt(templateText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = templateText.length;
        textareaRef.current.setSelectionRange(len, len);
      }
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        const len = templateText.length;
        chatInputRef.current.setSelectionRange(len, len);
      }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachedFiles((prev) => [...prev, { name: file.name, content: text }]);
      };
      reader.readAsText(file);
    });

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
    <div className="w-full flex-1 flex h-full overflow-hidden bg-background text-foreground">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Bar */}
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

        {/* Upper Container / Messages Stream */}
        <div className="flex-1 overflow-y-auto w-full no-scrollbar flex flex-col justify-between">
          {messages.length === 0 ? (
            /* Centered Hero Content in Hero Mode */
            <div className="w-full max-w-3xl mx-auto px-4 py-6 flex-1 flex flex-col items-center justify-center my-auto space-y-6">
              {/* Hero Logo & Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center space-y-2 mb-2"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-krona">
                  Luno AI
                </h1>
                <p className="text-xs text-muted-foreground max-w-sm text-center">
                  {t("lunoAi.subtitle") || "Ask anything. Get ideas. Write better."}
                </p>
              </motion.div>

              {/* Main Input Box Card in Hero Mode */}
              <div className="w-full space-y-3">
                {editingUserMsgId && (
                  <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-2xs text-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{t("lunoAi.editingPrompt") || "Editing prompt"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserMsgId(null);
                        setPrompt("");
                      }}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                      title="Cancel edit"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium text-foreground transition-all shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="max-w-[180px] truncate text-xs font-medium text-foreground">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted cursor-pointer ml-0.5"
                          title="Remove attachment"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative w-full rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs focus-within:border-primary focus-within:ring-0 shadow-none transition-all space-y-2.5">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendPrompt();
                      }
                    }}
                    placeholder={t("lunoAi.inputPlaceholder") || "Ask me anything..."}
                    className="w-full bg-transparent text-xs sm:text-sm placeholder:text-muted-foreground outline-none resize-none min-h-[56px] max-h-[160px] leading-relaxed py-0.5"
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all border border-border/60 flex items-center gap-1.5 cursor-pointer"
                            title={t("lunoAi.attachFile") || "Attach file"}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{t("lunoAi.attachFile") || "Attach file"}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setSearchWorkspaceQuery("");
                              setIsWorkspacePickerOpen(true);
                            }}
                            className="gap-2 text-xs py-2 cursor-pointer"
                          >
                            <Folder className="h-4 w-4 text-primary" />
                            <span>{t("lunoAi.attachFromWorkspace") || "Attach note from workspace"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs py-2 cursor-pointer">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span>{t("lunoAi.uploadComputer") || "Upload from computer"}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-8 pl-3 pr-2.5 rounded-xl bg-background hover:bg-muted text-xs font-medium text-foreground transition-all border border-border/60 flex items-center gap-1.5 cursor-pointer outline-none"
                          >
                            <span>{modelLabels[model]}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 shadow-lg border border-border bg-popover text-popover-foreground z-50">
                          {(["smart", "fast", "creative"] as const).map((mKey) => {
                            const isSelected = model === mKey;
                            return (
                              <DropdownMenuItem
                                key={mKey}
                                onClick={() => setModel(mKey)}
                                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-foreground hover:bg-muted focus:bg-muted"
                                }`}
                              >
                                <span>{modelLabels[mKey]}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        type="button"
                        disabled={!prompt.trim() || isGenerating}
                        onClick={() => void handleSendPrompt()}
                        className="h-8 px-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <span>Send</span>
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5 Quick Action Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickAction("summarize")}
                    className="flex flex-col text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
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
                    <div className="h-6 w-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Wand2 className="h-3.5 w-3.5" />
                    </div>
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
                    <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Lightbulb className="h-3.5 w-3.5" />
                    </div>
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
                    <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <ListOrdered className="h-3.5 w-3.5" />
                    </div>
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
                    <div className="h-6 w-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Languages className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11.5px] font-semibold text-foreground transition-colors">
                      {t("lunoAi.translateTitle") || "Translate"}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                      {t("lunoAi.translateDesc") || "Translate to English"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Messages Stream View in Chat Mode */
            <div className="w-full max-w-3xl mx-auto px-4 py-6">
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
                                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
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
                                    setCreateNoteFileName(baseName || "untitled");
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
            <div className="w-full shrink-0 py-2.5 text-center flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground select-none">
              <Lock className="h-3 w-3 shrink-0 opacity-70" />
              <span>{t("lunoAi.disclaimer") || "Luno AI may make mistakes. Please check important info."}</span>
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
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserMsgId(null);
                      setPrompt("");
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                    title="Cancel edit"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium text-foreground transition-all shadow-2xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="max-w-[180px] truncate text-xs font-medium text-foreground">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted cursor-pointer ml-0.5"
                        title="Remove attachment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative w-full rounded-2xl border border-border/80 bg-card px-3.5 py-2 flex items-center gap-2 shadow-xs focus-within:border-primary focus-within:ring-0 shadow-none transition-all">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border/40 flex items-center justify-center shrink-0 cursor-pointer"
                      title={t("lunoAi.attachFile") || "Attach file"}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => {
                        setSearchWorkspaceQuery("");
                        setIsWorkspacePickerOpen(true);
                      }}
                      className="gap-2 text-xs py-2 cursor-pointer"
                    >
                      <Folder className="h-4 w-4 text-primary" />
                      <span>{t("lunoAi.attachFromWorkspace") || "Attach note from workspace"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs py-2 cursor-pointer">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span>{t("lunoAi.uploadComputer") || "Upload from computer"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={chatInputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSendPrompt();
                    }
                  }}
                  placeholder={t("lunoAi.inputPlaceholder") || "Ask me anything..."}
                  className="flex-1 bg-transparent text-xs sm:text-sm placeholder:text-muted-foreground outline-none py-1 px-1"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-8 pl-3 pr-2.5 rounded-xl bg-background hover:bg-muted text-xs font-medium text-foreground transition-all border border-border/60 flex items-center gap-1.5 cursor-pointer outline-none"
                      >
                        <span>{modelLabels[model]}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 shadow-lg border border-border bg-popover text-popover-foreground z-50">
                      {(["smart", "fast", "creative"] as const).map((mKey) => {
                        const isSelected = model === mKey;
                        return (
                          <DropdownMenuItem
                            key={mKey}
                            onClick={() => setModel(mKey)}
                            className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground hover:bg-muted focus:bg-muted"
                            }`}
                          >
                            <span>{modelLabels[mKey]}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    type="button"
                    disabled={!prompt.trim() || isGenerating}
                    onClick={() => void handleSendPrompt()}
                    className="h-8 w-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs flex items-center justify-center disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer in Chat Mode - Below Input Box */}
            <div className="w-full pt-1 text-center flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground select-none">
              <Lock className="h-3 w-3 shrink-0 opacity-70" />
              <span>{t("lunoAi.disclaimer") || "Luno AI may make mistakes. Please check important info."}</span>
            </div>
          </div>
        )}
      </div>

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
                      const cleanName = createNoteFileName.trim() || "untitled";
                      const baseName = cleanName.replace(/\.(md|html|txt)$/i, "");
                      const fullFileName = `${baseName}.${createNoteFileExt}`;
                      onCreateNewNote(fullFileName, createNoteContent);
                      setIsCreateNoteModalOpen(false);
                    }
                  }
                }}
                placeholder="untitled"
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
                  const cleanName = createNoteFileName.trim() || "untitled";
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
              onSelectNote={(n) => handleAttachWorkspaceNote(n)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Right Panel: Chat History Panel (Matches RightPanel.tsx 100%) */}
      <AnimatePresence>
        {isHistoryRightPanelOpen && (
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
                    const timeStr = new Date(session.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });

                    // Extract preview snippet from messages with all markdown syntax stripped
                    const lastMsgContent = [...(session.messages || [])].reverse().find((m) => (m?.content || "").trim())?.content || "";
                    const previewText = stripMarkdownSyntax(lastMsgContent) || "No messages";

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSelectSession(session)}
                        className={`w-full flex flex-col gap-1 px-3 py-2 text-left transition-colors rounded-lg cursor-pointer group relative my-0.5 border border-transparent outline-none focus-visible:ring-0 focus-visible:bg-sidebar-accent/60 ${
                          isActive
                            ? "bg-sidebar-accent font-semibold text-foreground"
                            : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare
                              className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                isActive ? "text-primary font-bold" : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`truncate text-xs transition-colors ${
                                isActive ? "font-semibold text-primary" : "font-medium text-foreground"
                              }`}
                            >
                              {session.title || "Luno AI Chat"}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground group-hover:opacity-0 transition-opacity">
                            {timeStr}
                          </span>
                        </div>

                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground pl-5.5">
                          {previewText}
                        </p>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="absolute right-1.5 top-1.5 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-md hover:bg-muted shrink-0 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("lunoAi.deleteChat") || "Delete chat"}</TooltipContent>
                        </Tooltip>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
