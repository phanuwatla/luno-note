import { useState, useRef, useEffect } from "react";
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
  X,
  FileCode,
  Folder,
  Search,
  Upload,
  History,
  Clock,
  Trash2,
  MessageSquare,
  FilePlus,
} from "lucide-react";
import { SparklesIcon as Sparkles } from "@/components/icons/SparklesIcon";
import { WandSparklesIcon as Wand2 } from "@/components/icons/WandSparklesIcon";
import { marked } from "marked";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { runGeminiPrompt, runGeminiAction } from "@/lib/geminiApi";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import type { Note } from "@/hooks/useNotes";

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

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  modelUsed?: string;
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
  onCreateNewNote?: (fileName: string, content: string, folderPath?: string) => void;
  onOpenSettings?: () => void;
}

const CHAT_SESSIONS_STORAGE_KEY = "luno-ai-chat-sessions-v2";

export default function LunoAiView({ notes = [], activeNote, onInsertToActiveNote, onCreateNewNote, onOpenSettings }: LunoAiViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"smart" | "fast" | "creative">("smart");

  const [createNoteContent, setCreateNoteContent] = useState("");
  const [createNoteFileName, setCreateNoteFileName] = useState("");
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ChatSession[]) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string }[]>([]);
  const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);
  const [isHistoryRightPanelOpen, setIsHistoryRightPanelOpen] = useState(false);
  const [searchWorkspaceQuery, setSearchWorkspaceQuery] = useState("");
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      /* ignore */
    }
  }, [sessions]);

  // Sync messages into active session or create new session when messages change
  useEffect(() => {
    if (messages.length === 0) return;

    setSessions((prevSessions) => {
      if (currentSessionId) {
        return prevSessions.map((s) => (s.id === currentSessionId ? { ...s, messages } : s));
      } else {
        const newId = Date.now().toString();
        const firstUserMsg = messages.find((m) => m.role === "user");
        const title = firstUserMsg ? firstUserMsg.content.slice(0, 45).trim() : "Luno AI Chat";
        const newSession: ChatSession = {
          id: newId,
          title,
          createdAt: Date.now(),
          messages,
        };
        setCurrentSessionId(newId);
        return [newSession, ...prevSessions];
      }
    });
  }, [messages, currentSessionId]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setAttachedFiles([]);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setAttachedFiles([]);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleClearAllHistory = () => {
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_SESSIONS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    toast({ title: t("lunoAi.clearAll") || "History cleared" });
  };

  const handleAttachWorkspaceNote = (note: Note) => {
    const fileName = note.fileName || note.title || "Untitled.md";
    setAttachedFiles((prev) => {
      if (prev.some((f) => f.name === fileName)) return prev;
      return [...prev, { name: fileName, content: note.content || "" }];
    });
    setIsWorkspacePickerOpen(false);
    toast({
      title: t("lunoAi.attachedSuccess", { name: fileName }) || `Attached ${fileName} to context`,
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
        title: "Gemini API Key Required",
        description: t("lunoAi.apiKeyRequired") || "Please set up your Gemini API key in Settings.",
      });
      onOpenSettings?.();
      return;
    }

    const userMsgId = Date.now().toString();
    const userMessage: MessageItem = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setPrompt("");
    setIsGenerating(true);

    try {
      // Include attached files ONLY if user explicitly attached them
      let fullContext = textToSend;
      if (attachedFiles.length > 0) {
        const fileContexts = attachedFiles.map((f) => `--- File: ${f.name} ---\n${f.content}`).join("\n\n");
        fullContext = `${textToSend}\n\nAttached Files:\n${fileContexts}`;
      }

      const { result, modelUsed } = await runGeminiPrompt(settings.geminiApiKey, fullContext, model);

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
        title: "AI Generation Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAction = (actionKey: "summarize" | "improve" | "brainstorm" | "outline" | "translate") => {
    let actionPrompt = "";
    if (actionKey === "summarize") {
      actionPrompt = "Summarize how to organize notes and ideas efficiently.";
    } else if (actionKey === "improve") {
      actionPrompt = "Give me best practices to improve my daily writing and note-taking.";
    } else if (actionKey === "brainstorm") {
      actionPrompt = "Brainstorm 5 productive habits for personal knowledge management.";
    } else if (actionKey === "outline") {
      actionPrompt = "Create an outline for a project planning document.";
    } else if (actionKey === "translate") {
      actionPrompt = "Translate: Hello! Welcome to Luno AI. How can I help you write better today?";
    }

    void handleSendPrompt(actionPrompt);
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: t("lunoAi.copied") || "Copied to clipboard!" });
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
            <button
              type="button"
              onClick={() => setIsHistoryRightPanelOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1 rounded-lg font-medium ${
                isHistoryRightPanelOpen
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={t("lunoAi.chatHistory") || "Chat history"}
            >
              <History className="h-3.5 w-3.5" />
              <span>{t("lunoAi.chatHistory") || "History"}</span>
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2.5 py-1 rounded-lg hover:bg-primary/10 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t("lunoAi.newChat") || "New chat"}</span>
              </button>
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
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-0.5">
                    {attachedFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-xs text-foreground shadow-2xs"
                      >
                        <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 transition-colors p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative w-full rounded-xl border border-border bg-card p-3 shadow-xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all space-y-2.5">
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
                            className="h-7 px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/50 flex items-center gap-1.5 cursor-pointer"
                            title={t("lunoAi.attachFile") || "Attach file"}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{t("lunoAi.attachFile") || "Attach"}</span>
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
                            className="h-7 pl-2.5 pr-2 rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-foreground transition-colors border border-border/40 flex items-center gap-1.5 cursor-pointer outline-none"
                          >
                            <span>{modelLabels[model]}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
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
                        className="h-7 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
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
                    <span className="text-[11.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
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
                    <span className="text-[11.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
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
                    <span className="text-[11.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
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
                    <span className="text-[11.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
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
                    <span className="text-[11.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
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
                      <div className="max-w-[85%] bg-primary/10 text-foreground font-medium px-4 py-2.5 rounded-xl border border-primary/15 text-xs sm:text-sm leading-relaxed shadow-2xs">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ) : (
                      /* AI Output */
                      <div className="w-full space-y-2 py-1">
                        <div
                          className="editor-markdown-content text-xs sm:text-sm leading-relaxed text-foreground"
                          dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(msg.content) }}
                        />

                        {/* Action Toolbar under AI Output */}
                        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground/80">
                          <span className="text-[10.5px] opacity-60">
                            {msg.modelUsed ? `Model: ${msg.modelUsed}` : "Luno AI"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedId === msg.id ? t("lunoAi.copied") || "Copied" : t("lunoAi.copyResponse") || "Copy response"}</span>
                          </button>
                          {onInsertToActiveNote && (
                            <button
                              type="button"
                              onClick={() => onInsertToActiveNote(msg.content)}
                              className="flex items-center gap-1 hover:text-primary transition-colors text-primary font-medium cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{t("lunoAi.insertToNote") || "Insert into note"}</span>
                            </button>
                          )}
                          {onCreateNewNote && (
                            <button
                              type="button"
                              onClick={() => {
                                setCreateNoteContent(msg.content);
                                setCreateNoteFileName(extractDefaultFileName(msg.content));
                                setIsCreateNoteModalOpen(true);
                              }}
                              className="flex items-center gap-1 hover:text-primary transition-colors text-primary font-medium cursor-pointer"
                            >
                              <FilePlus className="h-3.5 w-3.5" />
                              <span>{t("lunoAi.createAsNewNote") || "Create as new note"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isGenerating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <span className="animate-spin text-primary text-sm">⚡</span>
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
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {attachedFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-xs text-foreground shadow-2xs"
                    >
                      <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="hover:text-red-500 transition-colors p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative w-full rounded-xl border border-border bg-card px-3 py-1.5 flex items-center gap-2 shadow-2xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center shrink-0 cursor-pointer"
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
                        className="h-7 pl-2.5 pr-2 rounded-lg bg-muted/60 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border/40 flex items-center gap-1 cursor-pointer outline-none"
                      >
                        <span>{modelLabels[model]}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
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
                    className="h-7 w-7 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs flex items-center justify-center disabled:opacity-50 transition-all cursor-pointer"
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
        <DialogContent className="max-w-sm rounded-2xl p-4 gap-3">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-primary" />
              <span>{t("lunoAi.createFileModalTitle") || "Create New Note File"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("lunoAi.fileNameLabel") || "File Name"}
              </label>
              <input
                type="text"
                value={createNoteFileName}
                onChange={(e) => setCreateNoteFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (onCreateNewNote) {
                      onCreateNewNote(createNoteFileName, createNoteContent);
                      setIsCreateNoteModalOpen(false);
                    }
                  }
                }}
                placeholder="e.g. My_New_Note.md"
                className="w-full px-3 py-1.5 rounded-xl bg-muted/60 text-xs border border-border outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateNoteModalOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (onCreateNewNote) {
                    onCreateNewNote(createNoteFileName, createNoteContent);
                    setIsCreateNoteModalOpen(false);
                  }
                }}
                className="rounded-xl text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {t("lunoAi.createAndOpen") || "Create & Open"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Select Workspace Note to Attach */}
      <Dialog open={isWorkspacePickerOpen} onOpenChange={setIsWorkspacePickerOpen}>
        <DialogContent className="max-w-md rounded-2xl p-4 gap-3">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <span>{t("lunoAi.selectWorkspaceNotes") || "Select note to attach"}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchWorkspaceQuery}
              onChange={(e) => setSearchWorkspaceQuery(e.target.value)}
              placeholder={t("lunoAi.searchWorkspaceNotes") || "Search workspace notes..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-muted/60 text-xs border border-border/50 outline-none focus:border-primary/50"
            />
          </div>

          {/* Notes List */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 no-scrollbar py-1">
            {notes
              .filter((n) => n.id !== "luno-ai" && n.id !== "settings")
              .filter((n) => {
                if (!searchWorkspaceQuery.trim()) return true;
                const q = searchWorkspaceQuery.toLowerCase();
                const name = (n.fileName || n.title || "").toLowerCase();
                const path = (n.folderPath || "").toLowerCase();
                return name.includes(q) || path.includes(q);
              }).length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t("lunoAi.noWorkspaceNotes") || "No notes found in workspace"}
              </div>
            ) : (
              notes
                .filter((n) => n.id !== "luno-ai" && n.id !== "settings")
                .filter((n) => {
                  if (!searchWorkspaceQuery.trim()) return true;
                  const q = searchWorkspaceQuery.toLowerCase();
                  const name = (n.fileName || n.title || "").toLowerCase();
                  const path = (n.folderPath || "").toLowerCase();
                  return name.includes(q) || path.includes(q);
                })
                .map((n) => {
                  const fileName = n.fileName || n.title || "Untitled.md";
                  const isAttached = attachedFiles.some((f) => f.name === fileName);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      disabled={isAttached}
                      onClick={() => handleAttachWorkspaceNote(n)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isAttached
                          ? "bg-muted/40 opacity-50 cursor-not-allowed"
                          : "hover:bg-sidebar-accent/70 text-foreground cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{fileName}</span>
                          {n.folderPath && <span className="text-[10px] text-muted-foreground truncate">{n.folderPath}</span>}
                        </div>
                      </div>
                      {isAttached ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Attached</span>
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })
            )}
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
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors cursor-pointer"
                    title={t("lunoAi.clearAll") || "Clear all history"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryRightPanelOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Close panel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body (Matches RightPanel.tsx padding & typography) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs no-scrollbar">
              {/* Search History Filter (Matches Search Note UI) */}
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  placeholder="Search chat history..."
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
                  Recent Chats
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
                    const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-2.5 ${
                          isActive
                            ? "bg-primary/10 border-primary/40 text-foreground"
                            : "bg-card border-border/60 hover:border-primary/30 hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                            }`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-semibold text-foreground truncate leading-snug">
                              {session.title || "Luno AI Chat"}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground mt-0.5">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span>{session.messages.length} msgs</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-muted shrink-0 cursor-pointer"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
