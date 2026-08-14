import HtmlCodeEditor from "@/components/HtmlCodeEditor";
import RightPanel from "@/components/RightPanel";
import { AnimatePresence } from "framer-motion";
import { Note, extractBaseTitleFromFileName, isSystemGeneratedUntitledName } from "@/hooks/useNotes";
import {
  Bold,
  Check,
  CheckCircle2,
  Circle,
  Code,
  Eye,
  Download,
  ExternalLink,
  File,
  FileCode,
  Code2,
  FileText,
  FileImage,
  FolderArchive,
  ImagePlus,
  Italic,
  Wrench,
  Link2,
  List,
  ListOrdered,
  ChevronsDownUp,
  ChevronUp,
  ChevronDown,
  Keyboard,
  Monitor,
  Moon,
  MoreHorizontal,
  ClipboardList,
  Plus,
  FolderPlus,
  Undo2,
  Redo2,
  Strikethrough,
  Quote,
  Smile,
  Upload,
  Trash2,
  Trash,
  Eraser,
  Minus,
  Settings,
  Sun,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  XCircle,
  Loader2,
  AlertTriangle,
  Save,
  Table as TableIcon,
  Copy,
  ChevronRight,
  Columns,
  Layers,
  X,
  Wand,
  Scissors,
  Maximize2,
  Minimize2,
  BookOpen,
  MessageCircle,
  Languages,
  Key,
  Calculator,
  Clock,
  Share2,
  History
} from "lucide-react";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { WandSparklesIcon } from "@/components/icons/WandSparklesIcon";
import { SpellCheckIcon } from "@/components/icons/SpellCheckIcon";
import { BriefcaseBusinessIcon } from "@/components/icons/BriefcaseBusinessIcon";
import { PenLineIcon } from "@/components/icons/PenLineIcon";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import FloatingCalculator from "@/components/FloatingCalculator";
import FloatingClock from "@/components/FloatingClock";
import { createPortal } from "react-dom";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_THEMES, useAppSettings } from "@/hooks/useAppSettings";
import { SettingsBody } from "@/components/SettingsBody";
import { docxToHtml } from "@/lib/docxUtils";
import { parseFrontmatterAndTags, updateFrontmatterTags } from "@/lib/frontmatter";
import { uploadDriveAttachmentFile } from "@/lib/googleDriveApi";
import { getStoredTokenInfo, isGoogleDriveConnected } from "@/lib/googleDriveAuth";
import { syncEngine } from "@/lib/googleDriveSync";
import { getTagColorClass } from "@/lib/tagColors";
import { runGeminiAction, type AiActionType } from "@/lib/geminiApi";
import { EditorContent, ReactNodeViewRenderer, useEditor, Editor as TiptapEditor } from "@tiptap/react";
import { Extension, mergeAttributes, Node as TiptapNode } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { marked } from "marked";
import TurndownService from "turndown";
import ToggleNodeView from "@/components/ToggleNodeView";
import { canUseNativeFileSystem, getStoredFileHandle, removeStoredFileHandle, setStoredFileHandle, requestPermissionIfAvailable, isNoteDeleted, isRelativePathDeleted, type CreateNoteOptions, type OpenFolderPending } from "@/lib/fileHandles";
import { rewriteHtmlForPreview } from "@/lib/htmlPreview";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heading1Icon } from "@/components/icons/Heading1Icon";
import { Heading2Icon } from "@/components/icons/Heading2Icon";
import { CircleDotDashedIcon } from "@/components/icons/CircleDotDashedIcon";
import { CircleEllipsisIcon } from "@/components/icons/CircleEllipsisIcon";
import { PanelRightCloseIcon } from "./icons/PanelRightCloseIcon";
import { DeleteRowIcon } from "@/components/icons/DeleteRowIcon";
import { DeleteColumnIcon } from "@/components/icons/DeleteColumnIcon";
import { DeleteTableIcon } from "@/components/icons/DeleteTableIcon";

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😜", "🤪",
  "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔",
  "😟", "😕", "🥺", "😢", "😭", "😤", "😠", "😡", "🤯", "😳",
  "🥵", "🥶", "😱", "😨", "🤔", "🤗", "🤫", "🤥", "😶", "😬",
  "🙄", "😯", "😮", "😴", "👍", "👎", "👏", "🙌", "👐", "🤲",
  "🤝", "🙏", "✍️", "💪", "👊", "✊", "🤛", "🤜", "👋", "🖐️",
  "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
  "👈", "👉", "👆", "👇", "☝️", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗",
  "💖", "💘", "💝", "✨", "🌟", "⭐", "💫", "🔥", "💥", "⚡",
  "🌈", "☀️", "🌙", "☁️", "❄️", "🎉", "🎊", "🏆", "🎯", "💯",
  "✅", "❌", "⚠️", "📌", "📍", "🚩", "🔔", "💡", "📝", "📄",
  "📁", "📂", "📅", "📆", "📊", "📈", "📉", "🔍", "🔎", "🔒",
  "🔓", "🔑", "📦", "✉️", "📧", "💼", "📱", "💻", "⌨️", "🖥️",
  "📷", "🎥", "🎬", "🎨", "🚀", "🛸", "⏰", "⏱️", "☕", "🍺"
];

const EN_TO_TH_KEYMAP: Record<string, string> = {
  "`": "_",
  "1": "ๅ",
  "2": "/",
  "3": "-",
  "4": "ภ",
  "5": "ถ",
  "6": "ุ",
  "7": "ึ",
  "8": "ค",
  "9": "ต",
  "0": "จ",
  "-": "ข",
  "=": "ช",
  "q": "ๆ",
  "w": "ไ",
  "e": "ำ",
  "r": "พ",
  "t": "ะ",
  "y": "ั",
  "u": "ี",
  "i": "ร",
  "o": "น",
  "p": "ย",
  "[": "บ",
  "]": "ล",
  "\\": "ฃ",
  "a": "ฟ",
  "s": "ห",
  "d": "ก",
  "f": "ด",
  "g": "เ",
  "h": "้",
  "j": "่",
  "k": "า",
  "l": "ส",
  ";": "ว",
  "'": "ง",
  "z": "ผ",
  "x": "ป",
  "c": "แ",
  "v": "อ",
  "b": "ิ",
  "n": "ื",
  "m": "ท",
  ",": "ม",
  ".": "ใ",
  "/": "ฝ",
  "~": "%",
  "!": "+",
  "@": "\"",
  "#": "/",
  "$": ",",
  "%": "?",
  "^": "ู",
  "&": "_",
  "*": ".",
  "(": "(",
  ")": ")",
  "_": "-",
  "+": "ภ",
  "Q": "๐",
  "W": "\"",
  "E": "ฎ",
  "R": "ฑ",
  "T": "ธ",
  "Y": "ํ",
  "U": "๊",
  "I": "ณ",
  "O": "ฯ",
  "P": "ญ",
  "{": "ฐ",
  "}": ",",
  "|": "ฅ",
  "A": "ฤ",
  "S": "ฆ",
  "D": "ฏ",
  "F": "โ",
  "G": "ฌ",
  "H": "็",
  "J": "๋",
  "K": "ษ",
  "L": "ศ",
  ":": "ซ",
  "\"": ".",
  "Z": "(",
  "X": ")",
  "C": "ฉ",
  "V": "ฮ",
  "B": "ฺ",
  "N": "์",
  "M": "?",
  "<": "ฒ",
  ">": "ฬ",
  "?": "ฦ",
};

const TH_TO_EN_KEYMAP: Record<string, string> = Object.entries(EN_TO_TH_KEYMAP).reduce(
  (acc, [en, th]) => {
    if (!(th in acc)) {
      acc[th] = en;
    }
    return acc;
  },
  {} as Record<string, string>,
);

export function getToggleButtonMode(selection: { empty: boolean }): "wrap" | "insert" {
  return selection.empty ? "insert" : "wrap";
}

export function handleToggleClick(editor: TiptapEditor | null) {
  if (!editor) return;
  const { from, to, empty } = editor.state.selection;
  const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ", " ").trim();

  if (selectedText) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "toggle",
        attrs: { title: selectedText },
        content: [{ type: "paragraph" }],
      })
      .run();
  } else {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "toggle",
        attrs: { title: "" },
        content: [{ type: "paragraph" }],
      })
      .run();
  }
}

export const Toggle = TiptapNode.create({
  name: "toggle",
  group: "block",
  content: "block+",
  defining: true,
  draggable: false,
  addAttributes() {
    return {
      title: {
        default: "",
      },
      open: {
        default: false,
        parseHTML: (element) => Boolean((element as HTMLDetailsElement).open),
        renderHTML: (attributes) => (attributes.open ? { open: "" } : {}),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "details",
        getAttrs: (element) => {
          const summary = (element as HTMLElement).querySelector("summary");
          return {
            title: summary?.textContent?.trim() || "",
            open: Boolean((element as HTMLDetailsElement).open),
          };
        },
        contentElement: "div",
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const sanitizedAttributes = { ...HTMLAttributes };
    delete sanitizedAttributes.open;

    return [
      "details",
      node.attrs.open ? mergeAttributes(sanitizedAttributes, { open: "" }) : mergeAttributes(sanitizedAttributes),
      ["summary", node.attrs.title],
      ["div", 0],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleNodeView);
  },
});

export type SlashMenuItem = {
  id: string;
  titleKey: string;
  icon: React.ReactNode;
  keywords: string[];
  action: (
    editor: TiptapEditor,
    helpers: {
      openLinkDialog: () => void;
      openImageDialog: () => void;
      triggerImageUpload: () => void;
      handleFixLanguage: () => void;
    }
  ) => void;
};

export const slashMenuStateRef = {
  current: {
    open: false,
    query: "",
    slashRange: null as { from: number; to: number } | null,
    coords: null as { top: number; left: number } | null,
    selectedIndex: 0,
    filteredItems: [] as SlashMenuItem[],
    onSelect: null as ((item: SlashMenuItem) => void) | null,
    notify: null as (() => void) | null,
  },
};

export const slashMenuScrollRef = {
  current: null as HTMLDivElement | null,
};

export const SLASH_ITEMS: SlashMenuItem[] = [
  {
    id: "h1",
    titleKey: "editor.heading1",
    icon: <Heading1Icon className="mr-2 h-4 w-4" />,
    keywords: ["h1", "heading1", "header1", "หัวข้อ1", "หัวข้อ 1"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    titleKey: "editor.heading2",
    icon: <Heading2Icon className="mr-2 h-4 w-4" />,
    keywords: ["h2", "heading2", "header2", "หัวข้อ2", "หัวข้อ 2"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "bold",
    titleKey: "editor.bold",
    icon: <Bold className="mr-2 h-4 w-4" />,
    keywords: ["bold", "b", "ตัวหนา"],
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    titleKey: "editor.italic",
    icon: <Italic className="mr-2 h-4 w-4" />,
    keywords: ["italic", "i", "ตัวเอียง"],
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "strike",
    titleKey: "editor.strikethrough",
    icon: <Strikethrough className="mr-2 h-4 w-4" />,
    keywords: ["strike", "strikethrough", "s", "ขีดฆ่า"],
    action: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "bulletList",
    titleKey: "editor.bulletList",
    icon: <List className="mr-2 h-4 w-4" />,
    keywords: ["bullet", "list", "ul", "รายการ", "จุด"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    titleKey: "editor.numberedList",
    icon: <ListOrdered className="mr-2 h-4 w-4" />,
    keywords: ["number", "ordered", "ol", "เลข", "ลำดับ"],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    titleKey: "editor.checkbox",
    icon: <ListTodoIcon className="mr-2 h-4 w-4" />,
    keywords: ["todo", "task", "check", "checkbox", "กล่อง", "เช็ค"],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: "toggle",
    titleKey: "editor.toggle",
    icon: <ChevronsDownUp className="mr-2 h-4 w-4" />,
    keywords: ["toggle", "collapse", "details", "พับ", "ย่อย"],
    action: (editor) => handleToggleClick(editor),
  },
  {
    id: "code",
    titleKey: "editor.inlineCode",
    icon: <Code className="mr-2 h-4 w-4" />,
    keywords: ["code", "inline", "โค้ด"],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: "codeBlock",
    titleKey: "editor.codeBlock",
    icon: <Code2 className="mr-2 h-4 w-4" />,
    keywords: ["codeblock", "code", "block", "โค้ด", "บล็อกโค้ด"],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "blockquote",
    titleKey: "editor.blockquote",
    icon: <Quote className="mr-2 h-4 w-4" />,
    keywords: ["quote", "blockquote", "คำพูด", "อ้างอิง"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "horizontalRule",
    titleKey: "editor.horizontalRule",
    icon: <Minus className="mr-2 h-4 w-4" />,
    keywords: ["hr", "horizontal", "rule", "line", "divider", "เส้นแบ่ง", "เส้น"],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "emoji",
    titleKey: "editor.insertEmoji",
    icon: <Smile className="mr-2 h-4 w-4" />,
    keywords: ["emoji", "smile", "อิโมจิ"],
    action: (editor) => editor.chain().focus().insertContent("😊").run(),
  },
  {
    id: "link",
    titleKey: "editor.link",
    icon: <Link2 className="mr-2 h-4 w-4" />,
    keywords: ["link", "url", "ลิงก์"],
    action: (_editor, helpers) => helpers.openLinkDialog(),
  },
  {
    id: "imageUrl",
    titleKey: "editor.insertImageByUrl",
    icon: <ImagePlus className="mr-2 h-4 w-4" />,
    keywords: ["image", "img", "photo", "pic", "รูป", "ภาพ", "url"],
    action: (_editor, helpers) => helpers.openImageDialog(),
  },
  {
    id: "imageUpload",
    titleKey: "editor.uploadImage",
    icon: <Upload className="mr-2 h-4 w-4" />,
    keywords: ["upload", "file", "image", "img", "อัปโหลด", "อัพโหลด", "รูป", "ไฟล์"],
    action: (_editor, helpers) => helpers.triggerImageUpload(),
  },
  {
    id: "table",
    titleKey: "editor.insertTable",
    icon: <TableIcon className="mr-2 h-4 w-4" />,
    keywords: ["table", "grid", "ตาราง", "แถว", "คอลัมน์"],
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: "fixLanguage",
    titleKey: "editor.fixLanguage",
    icon: <Wrench className="mr-2 h-4 w-4" />,
    keywords: ["fix", "lang", "language", "th", "en", "ซ่อม", "ภาษา"],
    action: (_editor, helpers) => helpers.handleFixLanguage(),
  },
];

const IndentKeymap = Extension.create({
  name: "indentKeymap",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.can().sinkListItem("listItem") && editor.chain().focus().sinkListItem("listItem").run()) {
          return true;
        }
        if (editor.can().sinkListItem("taskItem") && editor.chain().focus().sinkListItem("taskItem").run()) {
          return true;
        }
        return editor.chain().focus().insertContent("  ").run();
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.can().liftListItem("listItem") && editor.chain().focus().liftListItem("listItem").run()) {
          return true;
        }
        if (editor.can().liftListItem("taskItem") && editor.chain().focus().liftListItem("taskItem").run()) {
          return true;
        }
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const lineText = $from.nodeBefore ? $from.nodeBefore.text || "" : "";
        if (lineText.endsWith("  ")) {
          return editor.chain().focus().deleteRange({ from: $from.pos - 2, to: $from.pos }).run();
        }
        return false;
      },
      "Mod-Shift-t": ({ editor }) => {
        handleToggleClick(editor);
        return true;
      },
      ArrowDown: () => {
        if (slashMenuStateRef.current.open && slashMenuStateRef.current.filteredItems.length > 0) {
          const len = slashMenuStateRef.current.filteredItems.length;
          const curr = slashMenuStateRef.current.selectedIndex;
          const next = curr === -1 ? 0 : (curr + 1) % len;
          slashMenuStateRef.current.selectedIndex = next;
          slashMenuStateRef.current.notify?.();
          const target = slashMenuScrollRef.current?.querySelector(`[data-slash-item="${next}"]`);
          target?.scrollIntoView({ block: "nearest" });
          return true;
        }
        return false;
      },
      ArrowUp: () => {
        if (slashMenuStateRef.current.open && slashMenuStateRef.current.filteredItems.length > 0) {
          const len = slashMenuStateRef.current.filteredItems.length;
          const curr = slashMenuStateRef.current.selectedIndex;
          const next = curr <= 0 ? len - 1 : curr - 1;
          slashMenuStateRef.current.selectedIndex = next;
          slashMenuStateRef.current.notify?.();
          const target = slashMenuScrollRef.current?.querySelector(`[data-slash-item="${next}"]`);
          target?.scrollIntoView({ block: "nearest" });
          return true;
        }
        return false;
      },
      Enter: ({ editor }) => {
        if (slashMenuStateRef.current.open && slashMenuStateRef.current.filteredItems.length > 0) {
          const curr = slashMenuStateRef.current.selectedIndex;
          const idx = curr >= 0 ? curr : 0;
          const item = slashMenuStateRef.current.filteredItems[idx];
          if (item && slashMenuStateRef.current.onSelect) {
            slashMenuStateRef.current.onSelect(item);
            return true;
          }
        }
        return false;
      },
      Escape: () => {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          slashMenuStateRef.current.notify?.();
          return true;
        }
        return false;
      },
    };
  },
});

export interface EditorProps {
  note: Note | null;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onCreate?: (folderPath?: string, opts?: CreateNoteOptions) => Note | void | Promise<Note | void>;
  onCreateFolder?: (folderPath?: string, folderName?: string) => void | Promise<void>;
  onOpenFolder?: (pending?: OpenFolderPending) => void | Promise<void>;
  onRenameFile?: (note: Note, nextName: string) => void | Promise<void>;
  openedFolderName?: string | null;
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
  editorFontSize?: number;
  isMobile?: boolean;
  notes?: Note[];
  rootDirHandle?: FileSystemDirectoryHandle | null;
  onCloseSplit?: () => void;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  rightPanelOpen?: boolean;
  onCloseRightPanel?: () => void;
}

interface SaveSnapshot {
  ext: "md" | "txt" | "html";
  content: string;
}

function TableInteractiveOverlay({ editor }: { editor: TiptapEditor }) {
  const { t } = useTranslation();
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [cellRect, setCellRect] = useState<DOMRect | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [duplicateSubmenuOpen, setDuplicateSubmenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasScrollable = el.scrollHeight > el.clientHeight;
    setCanScrollUp(hasScrollable && el.scrollTop > 2);
    setCanScrollDown(hasScrollable && el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  const startAutoScroll = useCallback((direction: "up" | "down") => {
    stopAutoScroll();
    const step = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTop += direction === "up" ? -12 : 12;
      checkScroll();
    };
    step();
    scrollIntervalRef.current = setInterval(step, 30);
  }, [checkScroll, stopAutoScroll]);

  const scrollMenu = useCallback((direction: "up" | "down") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = direction === "up" ? -100 : 100;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(checkScroll, 150);
  }, [checkScroll]);

  useEffect(() => {
    if (menuOpen) {
      setTimeout(checkScroll, 50);
    } else {
      stopAutoScroll();
      setCanScrollUp(false);
      setCanScrollDown(false);
    }
  }, [menuOpen, duplicateSubmenuOpen, checkScroll, stopAutoScroll]);

  useEffect(() => {
    if (!menuOpen) {
      setDuplicateSubmenuOpen(false);
    }
  }, [menuOpen]);

  // Click / Tap outside to dismiss popover menu
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [menuOpen]);

  const updatePositions = useCallback(() => {
    if (!editor || editor.isDestroyed || !editor.isActive("table")) {
      setTableRect(null);
      setCellRect(null);
      return;
    }

    try {
      const { selection } = editor.state;
      const domAtPos = editor.view.domAtPos(selection.from);
      let node: Node | null = domAtPos.node;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      const tableEl = (node as HTMLElement)?.closest?.("table") as HTMLElement | null;

      if (!tableEl) {
        setCellRect(null);
        setTableRect(null);
        return;
      }

      setTableRect(tableEl.getBoundingClientRect());

      // Check if multiple cells are selected (.selectedCell)
      const selectedCells = tableEl.querySelectorAll("td.selectedCell, th.selectedCell");

      if (selectedCells.length > 0) {
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        selectedCells.forEach((cell) => {
          const r = cell.getBoundingClientRect();
          if (r.top < minTop) minTop = r.top;
          if (r.left < minLeft) minLeft = r.left;
          if (r.right > maxRight) maxRight = r.right;
          if (r.bottom > maxBottom) maxBottom = r.bottom;
        });

        setCellRect(new DOMRect(minLeft, minTop, maxRight - minLeft, maxBottom - minTop));
      } else {
        const cellEl = (node as HTMLElement)?.closest?.("td, th") as HTMLElement | null;
        if (cellEl) {
          setCellRect(cellEl.getBoundingClientRect());
        } else {
          setCellRect(null);
        }
      }
    } catch {
      setCellRect(null);
      setTableRect(null);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    updatePositions();

    const handleUpdate = () => updatePositions();

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      if (!editor.isDestroyed) {
        editor.off("selectionUpdate", handleUpdate);
        editor.off("transaction", handleUpdate);
      }
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [editor, updatePositions]);

  let isMultiSelection = false;
  try {
    if (editor && !editor.isDestroyed && tableRect) {
      const { selection } = editor.state;
      const domAtPos = editor.view.domAtPos(selection.from);
      let node: Node | null = domAtPos.node;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      const tableEl = (node as HTMLElement)?.closest?.("table") as HTMLElement | null;
      if (tableEl) {
        isMultiSelection = tableEl.querySelectorAll("td.selectedCell, th.selectedCell").length > 1;
      }
    }
  } catch {
    // fallback
  }

  const canMerge = editor?.can()?.mergeCells();
  const canSplit = editor?.can()?.splitCell();

  const items = useMemo(() => {
    if (!editor || editor.isDestroyed) return [];
    return [
      {
        id: "toggleHeaderRow",
        label: t("editor.toggleHeaderRow"),
        icon: <TableIcon className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().toggleHeaderRow().run(),
      },
      {
        id: "toggleHeaderColumn",
        label: t("editor.toggleHeaderColumn"),
        icon: <Columns className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().toggleHeaderColumn().run(),
      },
      ...(isMultiSelection || canMerge
        ? [
            {
              id: "mergeCells",
              label: t("editor.mergeCells"),
              icon: <Layers className="mr-2 h-4 w-4 shrink-0" />,
              action: () => editor.chain().focus().mergeCells().run(),
            },
          ]
        : []),
      ...(canSplit
        ? [
            {
              id: "splitCell",
              label: t("editor.splitCell"),
              icon: <Layers className="mr-2 h-4 w-4 shrink-0" />,
              action: () => editor.chain().focus().splitCell().run(),
            },
          ]
        : []),
      {
        id: "addColumnBefore",
        label: t("editor.addColumnLeft"),
        icon: <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addColumnBefore().run(),
      },
      {
        id: "addColumnAfter",
        label: t("editor.addColumnRight"),
        icon: <ArrowRight className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addColumnAfter().run(),
      },
      {
        id: "addRowBefore",
        label: t("editor.addRowAbove"),
        icon: <ArrowUp className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addRowBefore().run(),
      },
      {
        id: "addRowAfter",
        label: t("editor.addRowBelow"),
        icon: <ArrowDown className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addRowAfter().run(),
      },
      {
        id: "clearContents",
        label: t("editor.clearContents"),
        icon: <Eraser className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().deleteSelection().run(),
      },
      {
        id: "deleteRow",
        label: t("editor.deleteRow"),
        icon: <DeleteRowIcon className="mr-2 h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteRow().run(),
      },
      {
        id: "deleteColumn",
        label: t("editor.deleteColumn"),
        icon: <DeleteColumnIcon className="mr-2 h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteColumn().run(),
      },
      {
        id: "deleteTable",
        label: t("editor.deleteTable"),
        icon: <DeleteTableIcon className="mr-2 h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteTable().run(),
      },
    ];
  }, [editor, isMultiSelection, canMerge, canSplit, t]);

  const normalItems = useMemo(() => items.filter((item) => !item.danger), [items]);
  const dangerItems = useMemo(() => items.filter((item) => item.danger), [items]);

  const allFlatItems = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: React.ReactNode; danger?: boolean; action: () => void }> = [];
    normalItems.forEach((item) => list.push(item));
    list.push({
      id: "duplicate",
      label: t("editor.duplicate"),
      icon: <Copy className="mr-2 h-4 w-4 shrink-0" />,
      action: () => setDuplicateSubmenuOpen((v) => !v),
    });
    if (duplicateSubmenuOpen) {
      list.push({
        id: "duplicateRow",
        label: t("editor.duplicateRow"),
        icon: <DeleteRowIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />,
        action: () => {
          editor.chain().focus().addRowAfter().run();
          setMenuOpen(false);
          setDuplicateSubmenuOpen(false);
        },
      });
      list.push({
        id: "duplicateColumn",
        label: t("editor.duplicateColumn"),
        icon: <DeleteColumnIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />,
        action: () => {
          editor.chain().focus().addColumnAfter().run();
          setMenuOpen(false);
          setDuplicateSubmenuOpen(false);
        },
      });
    }
    dangerItems.forEach((item) => list.push(item));
    return list;
  }, [normalItems, duplicateSubmenuOpen, dangerItems, editor, t]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [menuOpen, duplicateSubmenuOpen]);

  // Arrow up/down & Enter/Escape keyboard navigation
  useEffect(() => {
    if (!menuOpen || allFlatItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % allFlatItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < 0 ? allFlatItems.length - 1 : (prev - 1 + allFlatItems.length) % allFlatItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = allFlatItems[selectedIndex];
          if (selected) {
            selected.action();
            if (selected.id !== "duplicate") {
              setMenuOpen(false);
            }
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [menuOpen, selectedIndex, allFlatItems]);

  useEffect(() => {
    if (!menuOpen || selectedIndex < 0 || !scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector(`[data-flat-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, menuOpen]);

  if (!editor || editor.isDestroyed || !editor.isActive("table") || !tableRect || !cellRect) {
    return null;
  }

  let currentFlatIndex = 0;

  return (
    <>
      {/* Active Focused Cell Blue Outline */}
      <div
        className="fixed pointer-events-none z-30 border-2 border-primary rounded-[2px]"
        style={{
          top: `${cellRect.top}px`,
          left: `${cellRect.left}px`,
          width: `${cellRect.width}px`,
          height: `${cellRect.height}px`,
        }}
      />

      {/* Column Handle Bar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-40 cursor-pointer rounded-full bg-primary shadow-sm hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${cellRect.top + 1}px`,
              left: `${cellRect.left + cellRect.width / 2}px`,
              width: "20px",
              height: "6px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuPos({ top: cellRect.top + 10, left: cellRect.left + cellRect.width / 2 - 100 });
              setMenuOpen((v) => !v);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>{t("editor.tableOptions")}</TooltipContent>
      </Tooltip>

      {/* Right Margin Plus Button (+) to add Column */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-30 flex items-center justify-center rounded-lg border border-border/80 bg-popover/90 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10 cursor-pointer shadow-sm transition-all"
            style={{
              top: `${tableRect.top}px`,
              left: `${tableRect.right + 10}px`,
              width: "16px",
              height: `${tableRect.height}px`,
            }}
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              setTimeout(updatePositions, 50);
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("editor.addColumnRight")}</TooltipContent>
      </Tooltip>

      {/* Bottom Margin Plus Button (+) to add Row */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-30 flex items-center justify-center rounded-lg border border-border/80 bg-popover/90 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10 cursor-pointer shadow-sm transition-all"
            style={{
              top: `${tableRect.bottom + 10}px`,
              left: `${tableRect.left}px`,
              width: `${tableRect.width}px`,
              height: "16px",
            }}
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              setTimeout(updatePositions, 50);
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("editor.addRowBelow")}</TooltipContent>
      </Tooltip>

      {/* Floating Actions Popover Card (100% Identical to Slash Commands Menu with Chevron Scroll Indicators) */}
      {menuOpen && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-56 rounded-xl border border-border bg-popover px-0 py-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-80 overflow-hidden text-popover-foreground select-none"
          style={{
            top: `${Math.min(menuPos.top, window.innerHeight - 360)}px`,
            left: `${Math.min(menuPos.left, window.innerWidth - 240)}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
            {t("editor.tableOptions")}
          </div>

          {canScrollUp && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollMenu("up")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronUp className="h-4 w-4" />
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="overflow-y-auto no-scrollbar flex-1 py-1 pb-3"
          >
            {normalItems.map((item) => {
              const flatIndex = currentFlatIndex++;
              const isSelected = flatIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-flat-index={flatIndex}
                  role="button"
                  tabIndex={0}
                  className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                    isSelected
                      ? "bg-accent/5 text-primary font-semibold"
                      : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                  }`}
                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                  onClick={() => {
                    item.action();
                    setMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="truncate flex-1">{item.label}</span>
                </div>
              );
            })}

            {/* Duplicate Waterfall Submenu */}
            {(() => {
              const duplicateFlatIndex = currentFlatIndex++;
              const isDuplicateSelected = duplicateFlatIndex === selectedIndex;
              return (
                <>
                  <div
                    data-flat-index={duplicateFlatIndex}
                    role="button"
                    tabIndex={0}
                    className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                      isDuplicateSelected
                        ? "bg-accent/5 text-primary font-semibold"
                        : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                    }`}
                    onMouseEnter={() => setSelectedIndex(duplicateFlatIndex)}
                    onClick={() => setDuplicateSubmenuOpen((v) => !v)}
                  >
                    <Copy className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{t("editor.duplicate")}</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 shrink-0 opacity-60 transition-transform ${
                        duplicateSubmenuOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {duplicateSubmenuOpen && (
                    <div className="my-0.5 space-y-0.5 animate-in fade-in-50 slide-in-from-top-1">
                      {(() => {
                        const dupRowIndex = currentFlatIndex++;
                        const isDupRowSelected = dupRowIndex === selectedIndex;
                        return (
                          <div
                            data-flat-index={dupRowIndex}
                            role="button"
                            tabIndex={0}
                            className={`mx-1 ml-6 flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs transition-colors select-none ${
                              isDupRowSelected
                                ? "bg-accent/5 text-primary font-semibold"
                                : "text-foreground/90 font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                            }`}
                            onMouseEnter={() => setSelectedIndex(dupRowIndex)}
                            onClick={() => {
                              editor.chain().focus().addRowAfter().run();
                              setMenuOpen(false);
                              setDuplicateSubmenuOpen(false);
                            }}
                          >
                            <DeleteRowIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate flex-1">{t("editor.duplicateRow")}</span>
                          </div>
                        );
                      })()}
                      {(() => {
                        const dupColIndex = currentFlatIndex++;
                        const isDupColSelected = dupColIndex === selectedIndex;
                        return (
                          <div
                            data-flat-index={dupColIndex}
                            role="button"
                            tabIndex={0}
                            className={`mx-1 ml-6 flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs transition-colors select-none ${
                              isDupColSelected
                                ? "bg-accent/5 text-primary font-semibold"
                                : "text-foreground/90 font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                            }`}
                            onMouseEnter={() => setSelectedIndex(dupColIndex)}
                            onClick={() => {
                              editor.chain().focus().addColumnAfter().run();
                              setMenuOpen(false);
                              setDuplicateSubmenuOpen(false);
                            }}
                          >
                            <DeleteColumnIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate flex-1">{t("editor.duplicateColumn")}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              );
            })()}

            {dangerItems.length > 0 && (
              <>
                <div className="my-1 border-t border-border/40" />
                <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider shrink-0">
                  {t("editor.deleteActions")}
                </div>
                {dangerItems.map((item) => {
                  const flatIndex = currentFlatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      data-flat-index={flatIndex}
                      role="button"
                      tabIndex={0}
                      className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                        isSelected
                          ? "bg-accent/5 text-primary font-semibold"
                          : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                      }`}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      onClick={() => {
                        item.action();
                        setMenuOpen(false);
                      }}
                    >
                      {item.icon}
                      <span className="truncate flex-1">{item.label}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {canScrollDown && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollMenu("down")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function Editor(props: EditorProps & { notes?: Note[] }) {
  const { note, onUpdate, onDelete, onCreate, onCreateFolder, onOpenFolder, onRenameFile, openedFolderName, onOpenSidebar, isSidebarOpen = false, editorFontSize = 15, isMobile = false, notes, rootDirHandle, onCloseSplit, settingsOpen: propSettingsOpen, onSettingsOpenChange, rightPanelOpen = false, onCloseRightPanel } = props;

  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileExt, setNewFileExt] = useState<"txt" | "md" | "html">("txt");
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingCreate, setPendingCreate] = useState<null | { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html"; folderName?: string }>(null);

  // Complete pending creation when a folder gets opened
  useEffect(() => {
    if (!pendingCreate) return;
    if (!openedFolderName) return;

    if (pendingCreate.kind === "file") {
      const defaultExt = settings.defaultExtension || "md";
      const defaultFormat = defaultExt === "html" ? "html" as const : defaultExt === "txt" ? "plain" as const : "markdown" as const;
      const fileName = pendingCreate.fileName ?? `Untitled.${defaultExt}`;
      const contentFormat = pendingCreate.contentFormat ?? defaultFormat;
      if (onCreate) onCreate(undefined, { fileName, contentFormat });
    } else if (pendingCreate.kind === "folder") {
      if (onCreateFolder) onCreateFolder(undefined, pendingCreate.folderName ?? "untitled-folder");
    }

    setPendingCreate(null);
  }, [openedFolderName, pendingCreate, onCreate, onCreateFolder]);

  const handleOpenCreateFileDialog = () => {
    setNewFileName("");
    setNewFileExt("txt");
    setCreateFileDialogOpen(true);
  };

  const handleOpenCreateFolderDialog = () => {
    setNewFolderName("");
    setCreateFolderDialogOpen(true);
  };

  const handleCreateFileFromDialog = () => {
    const baseName = (newFileName || "").trim();
    const contentFormat = newFileExt === "md" ? "markdown" : newFileExt === "html" ? "html" : "plain";
    const fileName = baseName ? `${baseName}.${newFileExt}` : `untitled.${newFileExt}`;

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "file", fileName, contentFormat });
      setCreateFileDialogOpen(false);
      setNewFileName("");
      setNewFileExt("txt");
      onOpenFolder({ kind: "file", fileName, contentFormat });
      return;
    }

    if (onCreate) {
      onCreate(undefined, { fileName, contentFormat });
    }
    setCreateFileDialogOpen(false);
    setNewFileName("");
    setNewFileExt("txt");
  };

  const handleCreateFolderFromDialog = () => {
    const safeFolderName = (newFolderName || "").trim().replace(/[\\/:*?"<>|]/g, "_");
    const folderName = safeFolderName || "untitled-folder";

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "folder", folderName });
      setCreateFolderDialogOpen(false);
      setNewFolderName("");
      onOpenFolder({ kind: "folder", folderName });
      return;
    }

    if (onCreateFolder) {
      onCreateFolder(undefined, folderName);
    }
    setCreateFolderDialogOpen(false);
    setNewFolderName("");
  };
    const [importDocxDialogOpen, setImportDocxDialogOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const docxInputRef = useRef<HTMLInputElement>(null);
    // Handle docx import
    const handleImportDocx = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const html = await docxToHtml(file);
        let updated = false;
        // กรณี note ปัจจุบัน
        if (note) {
          onUpdate(note.id, { content: html, contentFormat: "html", fileType: undefined });
          updated = true;
        }
        // กรณีสร้าง note ใหม่
        else if (onCreate) {
          const result = onCreate();
          const newNote = result instanceof Promise ? await result : result;
          if (newNote && "id" in newNote) {
            onUpdate(newNote.id, { content: html, contentFormat: "html", fileType: undefined });
            updated = true;
          }
        }
        // กรณี openfolder หรือ note ถูกสร้างจากไฟล์ในระบบ: ค้นหา note ที่ fileName ตรงกับไฟล์ docx แล้ว update ซ้ำ
        if (!updated && file.name) {
          // ลองค้นหา notes จาก props (ถ้ามี)
          if (typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;
            let notesArr: Note[] = [];
            if (Array.isArray(win.notesPlusNotes)) {
              notesArr = win.notesPlusNotes as Note[];
            } else if (Array.isArray(win.notes)) {
              notesArr = win.notes as Note[];
            } else if (typeof win.getNotes === 'function') {
              notesArr = (win.getNotes as () => Note[])();
            }
            const found = notesArr.find((n: Note) => n.fileName === file.name);
            if (found) {
              onUpdate(found.id, { content: html, contentFormat: "html", fileType: undefined });
              updated = true;
            }
          }
        }
        // fallback: ถ้า notes ถูกส่งมาทาง props
        if (!updated && Array.isArray(notes)) {
          const found = notes.find((n: Note) => n.fileName === file.name);
          if (found) {
            onUpdate(found.id, { content: html, contentFormat: "html", fileType: undefined });
          }
        }
      } catch (e) {
        setAlertMessage("นำเข้า docx ไม่สำเร็จ: " + (e as Error).message);
      }
      setImportDocxDialogOpen(false);
      event.target.value = "";
    };
  const autoSaveDiskTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRenameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRenameRef = useRef<{ note: Note; firstH1Text: string; newFileName: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileToolbarAreaRef = useRef<HTMLDivElement>(null);
  const syncingFromNote = useRef(false);
  const editorActiveNoteIdRef = useRef<string | null>(null);
  const fileHandleByNoteIdRef = useRef<Record<string, FileSystemFileHandle>>({});
  const deletedNoteIdsRef = useRef<Set<string>>(new Set());
  const editorSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [savedSnapshotByNoteId, setSavedSnapshotByNoteId] = useState<Record<string, SaveSnapshot>>({});
  const [pendingSaveAction, setPendingSaveAction] = useState<"save" | "saveas" | null>(null);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const settingsOpen = propSettingsOpen !== undefined ? propSettingsOpen : internalSettingsOpen;
  const setSettingsOpen = (open: boolean) => {
    if (onSettingsOpenChange) {
      onSettingsOpenChange(open);
    } else {
      setInternalSettingsOpen(open);
    }
  };
  const [mobileToolbarWidth, setMobileToolbarWidth] = useState(0);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [calculatorZIndex, setCalculatorZIndex] = useState<number>(50);
  const [clockZIndex, setClockZIndex] = useState<number>(50);
  const nextWindowZIndexRef = useRef<number>(51);

  const bringCalculatorToFront = useCallback(() => {
    setCalculatorZIndex(nextWindowZIndexRef.current++);
  }, []);

  const bringClockToFront = useCallback(() => {
    setClockZIndex(nextWindowZIndexRef.current++);
  }, []);

  const toggleCalculator = useCallback(() => {
    setCalculatorOpen((prev) => {
      const next = !prev;
      if (next) bringCalculatorToFront();
      return next;
    });
  }, [bringCalculatorToFront]);

  const toggleClock = useCallback(() => {
    setClockOpen((prev) => {
      const next = !prev;
      if (next) bringClockToFront();
      return next;
    });
  }, [bringClockToFront]);
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (note) {
      const rawName = note.fileName || note.title || "";
      const baseName = extractBaseTitleFromFileName(rawName) || rawName || "Untitled";
      document.title = baseName;
    } else {
      document.title = "Luno Note";
    }
  }, [note?.fileName, note?.title, note?.id]);
  const { t, language: lang } = useTranslation();

  const MOBILE_FULL_TOOLBAR_MIN_WIDTH = 340;

  const turndown = useMemo(() => {
    const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

    // Convert HTML tables back into clean GFM Markdown tables unless originally HTML or using merged cells
    td.addRule("table", {
      filter: "table",
      replacement: (_content, node) => {
        const table = node as HTMLElement;

        const hasSpans = Boolean(table.querySelector('[colspan]:not([colspan="1"]), [rowspan]:not([rowspan="1"])'));
        const isOriginalHtmlTable = table.getAttribute("data-original-html-table") === "true";

        if (isOriginalHtmlTable || hasSpans) {
          const clone = table.cloneNode(true) as HTMLElement;
          clone.removeAttribute("data-original-html-table");
          return `\n\n${clone.outerHTML}\n\n`;
        }

        const rows = Array.from(table.querySelectorAll("tr"));
        if (rows.length === 0) return "";

        const matrix: string[][] = [];
        let maxCols = 0;

        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("th, td"));
          const rowData = cells.map((cell) => {
            const text = td.turndown(cell.innerHTML).replace(/\n+/g, " ").trim();
            return text;
          });
          if (rowData.length > maxCols) maxCols = rowData.length;
          matrix.push(rowData);
        });

        if (matrix.length === 0 || maxCols === 0) return "";

        const header = matrix[0];
        while (header.length < maxCols) header.push("");
        const headerLine = `| ${header.join(" | ")} |`;
        const separatorLine = `| ${Array(maxCols).fill("---").join(" | ")} |`;

        const bodyLines = matrix.slice(1).map((row) => {
          while (row.length < maxCols) row.push("");
          return `| ${row.join(" | ")} |`;
        });

        const lines = [headerLine, separatorLine, ...bodyLines];
        return `\n\n${lines.join("\n")}\n\n`;
      },
    });

    // Suppress individual taskItem processing – handled wholesale by taskList rule below
    td.addRule("taskItem", {
      filter: (node: HTMLElement) =>
        node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem",
      replacement: () => "",
    });

    // Convert Tiptap's <ul data-type="taskList"> to markdown checkboxes
    td.addRule("taskList", {
      filter: (node: HTMLElement) =>
        node.nodeName === "UL" && node.getAttribute("data-type") === "taskList",
      replacement: (_content: string, node: TurndownService.Node) => {
        const ul = node as HTMLElement;
        const items = Array.from(ul.querySelectorAll('li[data-type="taskItem"]')).map((li) => {
          const checked = (li as HTMLElement).getAttribute("data-checked") === "true" ? "x" : " ";
          const contentDiv = li.querySelector("div");
          const text = contentDiv ? contentDiv.textContent?.trim() ?? "" : "";
          return `- [${checked}] ${text}`;
        });
        return "\n\n" + items.join("\n") + "\n\n";
      },
    });

    // Preserve Tiptap <details><summary>title</summary>...<details> in markdown
    td.addRule("toggle", {
      filter: (node: HTMLElement) => node.nodeName === "DETAILS",
      replacement: (_content: string, node: TurndownService.Node) => {
        const el = node as HTMLElement;
        const summary = el.querySelector("summary");
        const title = summary?.textContent?.trim() || "";
        const isOpen = el.hasAttribute("open");

        const div = el.querySelector("div");
        let innerHtml = "";
        if (div) {
          innerHtml = div.innerHTML;
        } else {
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelector("summary")?.remove();
          innerHtml = clone.innerHTML;
        }

        const innerMarkdown = td.turndown(innerHtml).trim();
        const bodyContent = innerMarkdown || "<p></p>";

        return `\n\n<details${isOpen ? " open" : ""}><summary>${title}</summary><div>\n\n${bodyContent}\n\n</div></details>\n\n`;
      },
    });

    return td;
  }, []);

  const isLikelyHtml = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text);
  
  const getContentFormat = (): "plain" | "markdown" | "html" => {
    if (note?.contentFormat) return note.contentFormat;
    return "markdown";
  };

  const isTxtFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.fileName?.toLowerCase().endsWith(".txt")) return true;
    if (targetNote.contentFormat === "plain") return true;
    return false;
  }, []);

  const getBaseTitle = useCallback((targetNote: Note | null): string => {
    if (!targetNote || isTxtFile(targetNote)) return "";
    if (targetNote.title === "") {
      return "";
    }
    let rawName = "";
    if (targetNote.title && targetNote.title.trim()) {
      rawName = targetNote.title.trim();
    } else if (targetNote.fileName) {
      const name = targetNote.fileName.trim();
      const lastDot = name.lastIndexOf(".");
      rawName = lastDot > 0 ? name.slice(0, lastDot) : name;
    }
    if (isSystemGeneratedUntitledName(rawName)) {
      return "";
    }
    return rawName;
  }, [isTxtFile]);

  const flushPendingRename = useCallback(() => {
    if (debounceRenameTimeoutRef.current) {
      clearTimeout(debounceRenameTimeoutRef.current);
      debounceRenameTimeoutRef.current = null;
    }
    if (pendingRenameRef.current) {
      const { note: targetNote, firstH1Text, newFileName } = pendingRenameRef.current;
      pendingRenameRef.current = null;
      if (firstH1Text === "") {
        onUpdate(targetNote.id, { title: "" });
      } else if (newFileName && onRenameFile) {
        onUpdate(targetNote.id, { title: firstH1Text });
        void onRenameFile(targetNote, newFileName);
      } else if (newFileName) {
        onUpdate(targetNote.id, { fileName: newFileName, title: firstH1Text });
      } else if (firstH1Text) {
        onUpdate(targetNote.id, { title: firstH1Text });
      }
    }
  }, [onUpdate, onRenameFile]);

  const escHtml = (s: string): string => {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  /** Detect if a string is a Tiptap JSON document */
  const isTiptapJson = (text: string) => typeof text === "string" && (text.trimStart().startsWith('{"type":"doc"') || text.includes('{"type":"doc"'));

  /** Return content in the format that editor.setContent() / useEditor({ content }) accepts */
  const parseEditorContent = (text: unknown, baseTitle: string = "", isTxt: boolean = false): string | Record<string, unknown> => {
    if (typeof text !== "string" || !text.trim()) {
      if (isTxt) return "<p></p>";
      return baseTitle ? `<h1>${escHtml(baseTitle)}</h1>` : "<h1></h1>";
    }

    let cleanText = text;

    // Auto-recover if JSON string is embedded after Frontmatter
    if (isTiptapJson(cleanText)) {
      const jsonStart = cleanText.indexOf('{"type":"doc"');
      if (jsonStart >= 0) {
        try {
          const jsonStr = cleanText.slice(jsonStart);
          const json = JSON.parse(jsonStr);
          if (json && Array.isArray(json.content)) {
            const textContent = extractTextFromTiptapJson(json).trim();
            if (!textContent) {
              return isTxt ? "<p></p>" : (baseTitle ? `<h1>${escHtml(baseTitle)}</h1><p></p>` : "<h1></h1><p></p>");
            }
            if (!isTxt) {
              const firstNode = json.content[0];
              if (!firstNode || firstNode.type !== "heading" || firstNode.attrs?.level !== 1) {
                const h1Node: Record<string, unknown> = {
                  type: "heading",
                  attrs: { level: 1 },
                };
                if (baseTitle) {
                  h1Node.content = [{ type: "text", text: baseTitle }];
                }
                json.content = [h1Node, ...json.content];
              } else if (baseTitle && (!firstNode.content || firstNode.content.length === 0)) {
                firstNode.content = [{ type: "text", text: baseTitle }];
              }
            } else {
              if (json.content.length > 0 && json.content[0]?.type === "heading") {
                json.content.shift();
              }
            }
            return json;
          }
        } catch { /* fall through */ }
      }
    }

    // Strip Frontmatter block for Markdown view
    const parsedFm = parseFrontmatterAndTags(cleanText);
    if (parsedFm.hasFrontmatter) {
      cleanText = parsedFm.bodyContent;
    }

    if (isTxt) {
      if (!cleanText.trim()) return "<p></p>";
      return toEditorHtml(cleanText, true);
    }

    const titleH1Html = baseTitle ? `<h1>${escHtml(baseTitle)}</h1>` : "<h1></h1>";
    const editorHtml = toEditorHtml(cleanText, false);

    if (!/^\s*<h1[^>]*>/i.test(editorHtml)) {
      return titleH1Html + editorHtml;
    }
    return editorHtml;
  };

  /** Convert one task-list line/element to a Tiptap taskItem <li> string */
  const toTaskItemHtml = (isChecked: boolean, text: string) =>
    `<li data-type="taskItem" data-checked="${isChecked}">` +
    `<label contenteditable="false"><input type="checkbox"${isChecked ? " checked" : ""}><span></span></label>` +
    `<div><p>${text}</p></div>` +
    `</li>`;

  /** Convert a DOM tree's GFM / legacy task list items to Tiptap's native format */
  const migrateDomTaskLists = (root: HTMLElement) => {
    // Handle legacy HTML saved before this fix (<li class="task-list-item">)
    root.querySelectorAll("li.task-list-item").forEach((li) => {
      const checkbox = li.querySelector('input[type="checkbox"]');
      const isChecked = checkbox ? (checkbox as HTMLInputElement).checked : false;
      checkbox?.remove();
      const contentSpan = li.querySelector(".task-list-item-content");
      const inner = contentSpan
        ? ((contentSpan as HTMLElement).innerHTML || "").trim()
        : ((li as HTMLElement).innerHTML || "").trim();
      const tpl = document.createElement("template");
      tpl.innerHTML = toTaskItemHtml(isChecked, inner);
      li.replaceWith(tpl.content.firstChild!);
    });

    // Handle marked GFM output (<li> with <input type="checkbox"> child)
    root.querySelectorAll("li").forEach((li) => {
      const checkbox = li.querySelector('input[type="checkbox"]');
      if (!checkbox || li.getAttribute("data-type") === "taskItem") return;
      const isChecked = (checkbox as HTMLInputElement).checked;
      checkbox.remove();
      const inner = ((li as HTMLElement).innerHTML || "").trim();
      const tpl = document.createElement("template");
      tpl.innerHTML = toTaskItemHtml(isChecked, inner || "<p></p>");
      li.replaceWith(tpl.content.firstChild!);
    });

    // Re-tag any <ul> that now contains taskItems
    root.querySelectorAll("ul").forEach((ul) => {
      if (ul.querySelector('li[data-type="taskItem"]')) {
        ul.setAttribute("data-type", "taskList");
        ul.removeAttribute("class");
      }
    });
  };

  const prepareDomForEditor = (root: HTMLElement) => {
    migrateDomTaskLists(root);

    root.querySelectorAll("details").forEach((details) => {
      const summary = details.querySelector("summary");
      const title = summary?.textContent?.trim() || "";
      summary?.remove();

      let div = details.querySelector(":scope > div");
      if (!div) {
        div = document.createElement("div");
        while (details.firstChild) {
          div.appendChild(details.firstChild);
        }
        details.appendChild(div);
      }

      const newSummary = document.createElement("summary");
      newSummary.textContent = title;
      details.insertBefore(newSummary, details.firstChild);
    });
  };

  const toEditorHtml = (text: string, isTxt: boolean = false): string => {
    if (!text.trim()) return isTxt ? "<p></p>" : "<h1></h1><p></p>";

    const temp = document.createElement("div");
    const format = isTxt ? "plain" : (note?.contentFormat ?? "markdown");

    if (format === "html") {
      temp.innerHTML = text;
    } else if (format === "plain") {
      const lines = text.split("\n");
      temp.innerHTML = lines.map((l) => `<p>${l ? l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "<br>"}</p>`).join("");
    } else {
      try {
        const textWithTableAttr = text.replace(/<table([\s>])/gi, '<table data-original-html-table="true"$1');
        const parsed = marked.parse(textWithTableAttr, { async: false, gfm: true, breaks: true });
        temp.innerHTML = typeof parsed === "string" ? parsed : text;
      } catch {
        temp.innerHTML = text;
      }
    }

    prepareDomForEditor(temp);
    // Cleanup any legacy/corrupted <hr><p>tags:</p>... inserted at the top of temp
    const cleanHtml = temp.innerHTML.replace(/^\s*(?:<hr\s*\/?>\s*)?<p>\s*tags:\s*<\/p>\s*(?:<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>|\s*)*/i, "");
    return cleanHtml;
  };

  const EDITOR_CLASSES =
    "w-full max-w-full break-words [overflow-wrap:anywhere] outline-none leading-7 text-foreground [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1:first-child]:text-2xl [&>h1:first-child]:font-semibold [&>h1:first-child]:leading-tight [&>h1:first-child]:md:text-3xl [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[hsl(var(--accent))] [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_p]:leading-7 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_details]:my-0 [&_details]:py-0 [&_details_summary]:my-0 [&_details_summary]:py-0" +
    " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-0 [&_ul[data-type='taskList']_li_label]:w-6 [&_ul[data-type='taskList']_li_label]:h-7 [&_ul[data-type='taskList']_li_label]:shrink-0 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:justify-center [&_ul[data-type='taskList']_li_label_input]:h-[14px] [&_ul[data-type='taskList']_li_label_input]:w-[14px] [&_ul[data-type='taskList']_li_label_input]:bg-transparent [&_ul[data-type='taskList']_li_label_input]:rounded-[3px] [&_ul[data-type='taskList']_li_label_input]:border [&_ul[data-type='taskList']_li_label_input]:border-muted-foreground/50 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0 [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:text-muted-foreground/90" +
    " [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:my-4 [&_table]:my-0 [&_table]:w-[70%] max-md:[&_table]:w-full [&_td]:border [&_td]:border-border/60 [&_td]:py-2 [&_td]:px-3 [&_td]:relative [&_th]:border [&_th]:border-border/60 [&_th]:py-2 [&_th]:px-3 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left [&_td_p]:my-0 [&_td_p]:leading-normal [&_th_p]:my-0 [&_th_p]:leading-normal";

  const scheduleAutoSaveDiskRef = useRef<(() => void) | null>(null);

  const [slashMenuState, setSlashMenuState] = useState<{
    open: boolean;
    query: string;
    slashRange: { from: number; to: number } | null;
    coords: { top: number; left: number } | null;
    selectedIndex: number;
    filteredItems: SlashMenuItem[];
  }>({
    open: false,
    query: "",
    slashRange: null,
    coords: null,
    selectedIndex: -1,
    filteredItems: [],
  });

  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const checkSlashMenuScroll = useCallback(() => {
    const el = slashMenuScrollRef.current;
    if (!el) return;
    const hasScrollable = el.scrollHeight > el.clientHeight;
    setCanScrollUp(hasScrollable && el.scrollTop > 2);
    setCanScrollDown(hasScrollable && el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  const startAutoScroll = useCallback((direction: "up" | "down") => {
    stopAutoScroll();
    const step = () => {
      const el = slashMenuScrollRef.current;
      if (!el) return;
      el.scrollTop += direction === "up" ? -12 : 12;
      checkSlashMenuScroll();
    };
    step();
    scrollIntervalRef.current = setInterval(step, 30);
  }, [checkSlashMenuScroll, stopAutoScroll]);

  const scrollSlashMenu = useCallback((direction: "up" | "down") => {
    const el = slashMenuScrollRef.current;
    if (!el) return;
    const delta = direction === "up" ? -80 : 80;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(checkSlashMenuScroll, 150);
  }, [checkSlashMenuScroll]);

  useEffect(() => {
    if (slashMenuState.open) {
      setTimeout(checkSlashMenuScroll, 50);
    } else {
      stopAutoScroll();
      setCanScrollUp(false);
      setCanScrollDown(false);
    }
  }, [slashMenuState.open, slashMenuState.filteredItems, checkSlashMenuScroll, stopAutoScroll]);

  const openLinkDialogRef = useRef<(() => void) | null>(null);
  const openImageDialogRef = useRef<(() => void) | null>(null);
  const triggerImageUploadRef = useRef<(() => void) | null>(null);
  const handleFixLanguageRef = useRef<(() => void) | null>(null);
  const tRef = useRef(t);
  const isMobileRef = useRef(isMobile);
  const noteRef = useRef(note);

  useEffect(() => {
    tRef.current = t;
    isMobileRef.current = isMobile;
    noteRef.current = note;
  }, [t, isMobile, note]);

  const executeSlashCommand = useCallback(
    (editorInstance: TiptapEditor, item: SlashMenuItem) => {
      if (slashMenuStateRef.current.slashRange) {
        const { from, to } = slashMenuStateRef.current.slashRange;
        editorInstance.chain().focus().deleteRange({ from, to }).run();
      }
      slashMenuStateRef.current.open = false;
      setSlashMenuState((prev) => ({ ...prev, open: false }));
      item.action(editorInstance, {
        openLinkDialog: () => openLinkDialogRef.current?.(),
        openImageDialog: () => openImageDialogRef.current?.(),
        triggerImageUpload: () => triggerImageUploadRef.current?.(),
        handleFixLanguage: () => handleFixLanguageRef.current?.(),
      });
    },
    [],
  );

  const checkSlashCommand = useCallback(
    (editorInstance: TiptapEditor) => {
      const { selection } = editorInstance.state;
      if (!selection.empty) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const { $from } = selection;
      const textBefore = $from.parent.textBetween(0, $from.parentOffset, " ", " ");
      const slashIdx = textBefore.lastIndexOf("/");

      if (slashIdx === -1) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const charBeforeSlash = slashIdx > 0 ? textBefore[slashIdx - 1] : "";
      if (slashIdx > 0 && !/\s/.test(charBeforeSlash)) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const query = textBefore.slice(slashIdx + 1).toLowerCase();
      if (query.includes(" ")) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const startPos = $from.start() + slashIdx;
      const endPos = $from.pos;
      const coords = editorInstance.view.coordsAtPos($from.pos);

      const filtered = SLASH_ITEMS.filter((item) => {
        if (!query) return true;
        const titleStr = t(item.titleKey).toLowerCase();
        return (
          titleStr.includes(query) ||
          item.keywords.some((kw) => kw.toLowerCase().includes(query))
        );
      });

      const newState = {
        open: true,
        query,
        slashRange: { from: startPos, to: endPos },
        coords: { top: coords.bottom + window.scrollY, left: coords.left + window.scrollX },
        selectedIndex: -1,
        filteredItems: filtered,
      };

      slashMenuStateRef.current = {
        ...newState,
        onSelect: (item) => executeSlashCommand(editorInstance, item),
        notify: () => {
          setSlashMenuState((prev) => ({
            ...prev,
            selectedIndex: slashMenuStateRef.current.selectedIndex,
            open: slashMenuStateRef.current.open,
          }));
        },
      };

      setSlashMenuState(newState);
    },
    [t, executeSlashCommand],
  );

  const [editorTick, setEditorTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Toggle,
      TaskList,
      TaskItem,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      IndentKeymap,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "my-4 h-auto max-w-full rounded-xl border border-border",
        },
      }),
      Placeholder.configure({
        placeholder: ({ node, pos, editor: ed, hasAnchor }) => {
          if (node.type.name === "heading" && node.attrs?.level === 1 && pos === 0) {
            if (noteRef.current?.fileName) {
              const baseTitle = extractBaseTitleFromFileName(noteRef.current.fileName);
              if (baseTitle) return baseTitle;
            }
            const pattern = settingsRef.current?.newFilePattern;
            const dateStr = new Date().toISOString().slice(0, 10);
            if (pattern === "date") return `Note_${dateStr}`;
            if (pattern === "daily") return `Daily-${dateStr}`;
            return tRef.current("editor.untitled");
          }

          const doc = ed.state.doc;
          const firstChild = doc.firstChild;
          const isTopH1Empty =
            firstChild &&
            firstChild.type.name === "heading" &&
            firstChild.attrs?.level === 1 &&
            (firstChild.textContent || "").trim() === "";

          // Check if this node is the paragraph directly under an empty top H1
          const isSecondChildAfterTopH1 =
            isTopH1Empty &&
            doc.childCount >= 2 &&
            doc.child(1) === node;

          const isH1OrH2 =
            node.type.name === "heading" &&
            (node.attrs?.level === 1 || node.attrs?.level === 2);

          // Only show placeholder for H1, H2, currently focused line, OR line 2 under empty H1
          if (!hasAnchor && !isH1OrH2 && !isSecondChildAfterTopH1) {
            return "";
          }

          // If slash was typed in focused line, show "Type to search..."
          const text = node.textContent;
          if (hasAnchor && text.startsWith("/")) {
            return tRef.current("editor.typeToSearch");
          }

          return isMobileRef.current
            ? tRef.current("editor.startWritingMobile")
            : tRef.current("editor.startWriting");
        },
        showOnlyCurrent: false,
        includeChildren: false,
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
      }),
    ],
    content: parseEditorContent(note?.content ?? "", getBaseTitle(note), isTxtFile(note)),
    editorProps: {
      attributes: {
        style: `font-size:${editorFontSize}px;line-height:${settings.lineHeight};`,
        class: EDITOR_CLASSES,
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter") {
          const { selection } = view.state;
          if (selection.from <= (view.state.doc.firstChild?.nodeSize ?? 0)) {
            flushPendingRename();
          }
        }
        if (settingsRef.current.autoPairBrackets && !event.ctrlKey && !event.altKey && !event.metaKey) {
          const pairs: Record<string, string> = {
            "(": ")",
            "[": "]",
            "{": "}",
            '"': '"',
            "'": "'",
            "`": "`",
          };
          const closing = pairs[event.key];
          if (closing) {
            const { selection, tr } = view.state;
            const { from, to, empty } = selection;
            if (!empty) {
              tr.insertText(closing, to);
              tr.insertText(event.key, from);
              view.dispatch(tr);
              return true;
            } else {
              tr.insertText(event.key + closing, from);
              view.dispatch(tr);
              const resolved = view.state.doc.resolve(from + 1);
              view.dispatch(view.state.tr.setSelection(TextSelection.near(resolved)));
              return true;
            }
          }
        }
        return false;
      },
    },
    onBlur: () => {
      flushPendingRename();
    },
    onSelectionUpdate: ({ editor: instance }) => {
      checkSlashCommand(instance);
      setEditorTick((v) => v + 1);
      const { from } = instance.state.selection;
      if (from > (instance.state.doc.firstChild?.nodeSize ?? 0)) {
        flushPendingRename();
      }
    },
    onUpdate: ({ editor: instance }) => {
      checkSlashCommand(instance);
      setEditorTick((v) => v + 1);
      setLastEditedTime(Date.now());
      if (!note || syncingFromNote.current || isNoteDeleted(note.id)) return;
      if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) return;
      if (note.fileType === "image" || note.fileType === "binary") return;

      if (!isTxtFile(note)) {
        const doc = instance.state.doc;
        const firstChild = doc.firstChild;
        let firstH1Text = "";
        if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
          firstH1Text = (firstChild.textContent || "").trim();
        }

        const currentBaseTitle = getBaseTitle(note);
        if (firstH1Text !== currentBaseTitle) {
          if (firstH1Text === "") {
            pendingRenameRef.current = { note, firstH1Text: "", newFileName: "" };
          } else if (note.fileName) {
            const lastDot = note.fileName.lastIndexOf(".");
            const ext = lastDot > 0 ? note.fileName.slice(lastDot) : ".md";
            const safeName = firstH1Text.replace(/[\\/:*?"<>|]/g, "_").trim();
            if (safeName && !isSystemGeneratedUntitledName(safeName)) {
              const newFileName = `${safeName}${ext}`;
              if (newFileName !== note.fileName) {
                // Queue pending title update & disk rename - runs ONLY when user finishes typing (on Blur/Enter)
                pendingRenameRef.current = { note, firstH1Text, newFileName };
              }
            } else {
              pendingRenameRef.current = { note, firstH1Text, newFileName: "" };
            }
          } else {
            pendingRenameRef.current = { note, firstH1Text, newFileName: "" };
          }
        }
      }

      let savedContent = "";
      if (isTxtFile(note)) {
        savedContent = getPlainTextFromHtml(instance.getHTML());
      } else if (note.contentFormat === "html") {
        savedContent = instance.getHTML();
      } else {
        const html = instance.getHTML();
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const firstChild = temp.firstElementChild;
        if (firstChild && firstChild.tagName.toLowerCase() === "h1") {
          firstChild.remove();
        }
        savedContent = turndown.turndown(temp.innerHTML).trim();
      }
      onUpdate(note.id, { content: savedContent });
      if (!settings.autoSave) {
        setSaveStatus("unsaved");
        return;
      }
      setSaveStatus("auto_saving");
      scheduleAutoSaveDiskRef.current?.();
    },
  });

  const editorStats = useMemo(() => {
    if (!editor) {
      const charCount = note?.content ? note.content.length : 0;
      const wordCount = note?.content?.trim() ? note.content.trim().split(/\s+/).length : 0;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      let syntaxLabel = t("editor.syntaxMarkdown");
      const fileName = note?.fileName?.toLowerCase() ?? "";
      if (fileName.endsWith(".html") || note?.contentFormat === "html") {
        syntaxLabel = t("editor.syntaxHtml");
      } else if (fileName.endsWith(".txt")) {
        syntaxLabel = t("editor.syntaxText");
      }
      return {
        line: 1,
        col: 1,
        charCount,
        wordCount,
        readingTime,
        syntaxLabel,
        zoom: Math.round((editorFontSize / 15) * 100),
        lineEnding: "Windows (CRLF)",
      };
    }

    const { selection, doc } = editor.state;
    const pos = selection.$from.pos;
    const textBefore = doc.textBetween(0, pos, "\n", "\n");
    const lines = textBefore.split("\n");
    const line = lines.length;
    const col = (lines[lines.length - 1]?.length ?? 0) + 1;
    const textContent = doc?.textContent || "";
    const charCount = textContent.length;
    const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    let syntaxLabel = t("editor.syntaxMarkdown");
    const fileName = note?.fileName?.toLowerCase() ?? "";
    if (fileName.endsWith(".html") || note?.contentFormat === "html") {
      syntaxLabel = t("editor.syntaxHtml");
    } else if (fileName.endsWith(".txt")) {
      syntaxLabel = t("editor.syntaxText");
    }

    const zoom = Math.round((editorFontSize / 15) * 100);
    const lineEnding = "Windows (CRLF)";

    return {
      line,
      col,
      charCount,
      wordCount,
      readingTime,
      syntaxLabel,
      zoom,
      lineEnding,
    };
  }, [editor, editorTick, note, editorFontSize, t]);

  const getFreshFileHandle = useCallback(async (targetNote: Note, allowCreate = false): Promise<FileSystemFileHandle | null> => {
    if (!targetNote || isNoteDeleted(targetNote.id) || deletedNoteIdsRef.current.has(targetNote.id)) {
      return null;
    }
    const relPath = targetNote.fileName ? (targetNote.folderPath ? `${targetNote.folderPath}/${targetNote.fileName}` : targetNote.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      return null;
    }

    if (rootDirHandle && targetNote.fileName) {
      try {
        let targetDir = rootDirHandle;
        const segments = (targetNote.folderPath ?? "").split("/").filter(Boolean);
        for (const segment of segments) {
          targetDir = await targetDir.getDirectoryHandle(segment, { create: allowCreate });
        }
        const handle = await targetDir.getFileHandle(targetNote.fileName, { create: allowCreate });
        fileHandleByNoteIdRef.current[targetNote.id] = handle;
        return handle;
      } catch {
        const cached = fileHandleByNoteIdRef.current[targetNote.id] ?? (await getStoredFileHandle(targetNote.id));
        if (cached) {
          fileHandleByNoteIdRef.current[targetNote.id] = cached;
          return cached;
        }
        return null;
      }
    }

    const cachedHandle = fileHandleByNoteIdRef.current[targetNote.id] ?? (await getStoredFileHandle(targetNote.id));
    if (cachedHandle) {
      fileHandleByNoteIdRef.current[targetNote.id] = cachedHandle;
      return cachedHandle;
    }
    return null;
  }, [rootDirHandle]);

  const saveLinkedFileToDisk = useCallback(async () => {
    if (!note || !editor || !settings.autoSave) return;
    if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) return;
    if (note.fileType === "image" || note.fileType === "binary") return;
    if (deletedNoteIdsRef.current.has(note.id) || isNoteDeleted(note.id)) return;
    if (Array.isArray(notes) && !notes.some((n) => n.id === note.id)) return;

    const opId = ++saveOpIdRef.current;
    setSaveStatus("auto_saving");

    const freshHandle = await getFreshFileHandle(note);
    if (!freshHandle?.createWritable) {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("auto_saved");
      }
      return;
    }

    const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("auto_saved");
      }
      return;
    }

    try {
      const ext = getPreferredExtension() as "md" | "txt" | "html";
      const content = getContentToSave(ext);
      await performSave(content, ext, true);
      if (saveOpIdRef.current === opId) {
        setSaveStatus("auto_saved");
      }
    } catch {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("failed");
      }
    }
  }, [note, editor, settings.autoSave, notes, getFreshFileHandle]);

  const scheduleAutoSaveDisk = useCallback(() => {
    if (autoSaveDiskTimeoutRef.current) {
      clearTimeout(autoSaveDiskTimeoutRef.current);
    }
    autoSaveDiskTimeoutRef.current = setTimeout(() => {
      void saveLinkedFileToDisk();
    }, 400);
  }, [saveLinkedFileToDisk]);

  useEffect(() => {
    scheduleAutoSaveDiskRef.current = scheduleAutoSaveDisk;
  }, [scheduleAutoSaveDisk]);

  const prevTagsStrRef = useRef<string>("");
  useEffect(() => {
    if (!note) return;
    const currentTagsStr = JSON.stringify(note.tags || []);
    if (prevTagsStrRef.current && prevTagsStrRef.current !== currentTagsStr) {
      scheduleAutoSaveDiskRef.current?.();
    }
    prevTagsStrRef.current = currentTagsStr;
  }, [note?.tags]);

  useEffect(() => {
    return () => {
      flushPendingRename();
    };
  }, [note?.id, flushPendingRename]);

  useEffect(() => {
    if (!editor || !settings.showCodeLineNumbers) return;
    const dom = editor.view.dom;
    const preElements = dom.querySelectorAll("pre");
    preElements.forEach((pre) => {
      const code = pre.querySelector("code");
      const text = code ? code.textContent || "" : pre.textContent || "";
      const lineCount = Math.max(1, text.split("\n").length);
      const lineNumbersStr = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
      if (pre.getAttribute("data-line-numbers") !== lineNumbersStr) {
        pre.setAttribute("data-line-numbers", lineNumbersStr);
      }
    });
  }, [editor, editorTick, settings.showCodeLineNumbers, note?.content]);

  useEffect(() => {
    return () => {
      if (autoSaveDiskTimeoutRef.current) {
        clearTimeout(autoSaveDiskTimeoutRef.current);
      }
    };
  }, [note?.id]);

  type SaveStatus =
    | "saved"
    | "auto_saved"
    | "manually_saved"
    | "saving"
    | "auto_saving"
    | "unsaved"
    | "failed"
    | "unavailable";

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastEditedTime, setLastEditedTime] = useState<number | null>(null);
  const saveOpIdRef = useRef(0);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [statusPortalTarget, setStatusPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (onCloseSplit) return;

    const findTargets = () => {
      const target = document.getElementById("breadcrumb-editor-actions");
      if (target) {
        setPortalTarget((prev) => (prev !== target ? target : prev));
      }
      const statusTarget = document.getElementById("breadcrumb-save-status");
      if (statusTarget) {
        setStatusPortalTarget((prev) => (prev !== statusTarget ? statusTarget : prev));
      }
    };

    findTargets();
    const interval = setInterval(findTargets, 100);

    const observer = new MutationObserver(findTargets);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [onCloseSplit]);

  useEffect(() => {
    if (!note) return;
    const savedSnapshot = savedSnapshotByNoteId[note.id];
    const currentContent = getContentToSave(savedSnapshot?.ext ?? "md");
    const currentlySaved = Boolean(savedSnapshot && currentContent === savedSnapshot.content);

    setSaveStatus((prev) => {
      if (prev === "saving" || prev === "auto_saving" || prev === "auto_saved") return prev;
      return currentlySaved ? "saved" : "unsaved";
    });
  }, [note?.id, editorTick, note?.content]);

  useEffect(() => {
    if (saveStatus === "auto_saved") {
      const timer = setTimeout(() => {
        setSaveStatus("saved");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    if (!editor || !note) return;

    // If editor is already showing content for this exact active note, do not re-set content or disrupt selection cursor!
    if (editorActiveNoteIdRef.current === note.id) {
      return;
    }

    const noteContent = note.content ?? "";
    const baseTitle = getBaseTitle(note);
    const parsed = parseEditorContent(noteContent, baseTitle, isTxtFile(note));

    syncingFromNote.current = true;
    editorActiveNoteIdRef.current = note.id;
    editor.commands.setContent(parsed as string);
    // Reset undo/redo history so that undoing does not bring back content
    // from a previously opened note.
    editor.view.updateState(
      EditorState.create({
        doc: editor.state.doc,
        plugins: editor.state.plugins,
      })
    );

    if (!isTxtFile(note)) {
      const firstChild = editor.state.doc.firstChild;
      if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
        if (!(firstChild.textContent || "").trim() && baseTitle) {
          const tr = editor.state.tr;
          tr.insertText(baseTitle, 1, 1);
          editor.view.dispatch(tr);
        }
      }
    }

    setEditorTick((v) => v + 1);
    syncingFromNote.current = false;
  }, [editor, note?.id, note?.content, note?.fileName, note?.title, getBaseTitle]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          style: `font-size:${editorFontSize}px;`,
          class: EDITOR_CLASSES,
        },
      },
    });
  }, [editor, editorFontSize]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr);
  }, [editor, settings.language, t]);

  useEffect(() => {
    const updateWidth = () => {
      setMobileToolbarWidth(mobileToolbarAreaRef.current?.clientWidth ?? 0);
    };

    updateWidth();

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => updateWidth())
      : null;

    if (observer && mobileToolbarAreaRef.current) {
      observer.observe(mobileToolbarAreaRef.current);
    }

    window.addEventListener("resize", updateWidth);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const shouldUseMobileOverflow = mobileToolbarWidth > 0 && mobileToolbarWidth < MOBILE_FULL_TOOLBAR_MIN_WIDTH;
  // Custom events for calculator and clock toggle
  useEffect(() => {
    const handleToggleCalc = () => {
      setCalculatorOpen((prev) => {
        if (!prev) bringCalculatorToFront();
        return !prev;
      });
    };
    const handleToggleClock = () => {
      setClockOpen((prev) => {
        if (!prev) bringClockToFront();
        return !prev;
      });
    };

    window.addEventListener("app:toggle-calculator", handleToggleCalc);
    window.addEventListener("app:toggle-clock", handleToggleClock);
    return () => {
      window.removeEventListener("app:toggle-calculator", handleToggleCalc);
      window.removeEventListener("app:toggle-clock", handleToggleClock);
    };
  }, [bringCalculatorToFront, bringClockToFront]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const key = e.key.toLowerCase();

      // Ctrl + S (Save Note)
      if (key === "s" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSaveFile();
        return;
      }

      // Ctrl + Shift + C (Toggle Calculator)
      if (e.shiftKey && key === "c") {
        e.preventDefault();
        e.stopPropagation();
        setCalculatorOpen((prev) => {
          if (!prev) bringCalculatorToFront();
          return !prev;
        });
        return;
      }

      // Ctrl + Shift + T (Toggle Clock)
      if (e.shiftKey && key === "t") {
        e.preventDefault();
        e.stopPropagation();
        setClockOpen((prev) => {
          if (!prev) bringClockToFront();
          return !prev;
        });
        return;
      }

      // Ctrl + B (Bold Text)
      if (key === "b" && !e.shiftKey && !e.altKey) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleBold().run();
        }
        return;
      }

      // Ctrl + I (Italic Text)
      if (key === "i" && !e.shiftKey && !e.altKey) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleItalic().run();
        }
        return;
      }

      if (e.shiftKey && e.key === "L") {
        e.preventDefault();
        handleFixLanguage();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [note, editor, bringCalculatorToFront, bringClockToFront]);
  const showUiAlert = (message: string) => setAlertMessage(message);
  const countMappable = (text: string, map: Record<string, string>) => [...text].reduce((count, ch) => count + (map[ch] ? 1 : 0), 0);
  const convertWithMap = (text: string, map: Record<string, string>) => [...text].map((ch) => map[ch] ?? ch).join("");

  const rememberSelection = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editorSelectionRef.current = { from, to };
  };

  const getFocusedChain = () => {
    if (!editor) return null;

    let chain = editor.chain().focus();
    if (editorSelectionRef.current) {
      chain = chain.setTextSelection(editorSelectionRef.current);
    }

    return chain;
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:|data:|\/)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleFixLanguage = () => {
    if (!editor) return;
    const {
      from,
      to,
      empty,
    } = editor.state.selection;

    if (empty) {
      showUiAlert(t("editor.selectTextToFix"));
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, "\n", "\n");
    if (!selectedText.trim()) {
      showUiAlert(t("editor.selectTextToFix"));
      return;
    }

    const enToThScore = countMappable(selectedText, EN_TO_TH_KEYMAP);
    const thToEnScore = countMappable(selectedText, TH_TO_EN_KEYMAP);
    const map = enToThScore >= thToEnScore ? EN_TO_TH_KEYMAP : TH_TO_EN_KEYMAP;
    const convertedText = convertWithMap(selectedText, map);

    if (convertedText === selectedText) return;

    const tr = editor.state.tr.insertText(convertedText, from, to);
    editor.view.dispatch(tr);
    editor.chain().focus().setTextSelection({ from, to: from + convertedText.length }).run();
  };

  // AI Assistant states & handlers
  const [aiApiKeyModalOpen, setAiApiKeyModalOpen] = useState(false);
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOutputText, setAiOutputText] = useState("");
  const [aiActionPending, setAiActionPending] = useState<AiActionType | null>(null);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const [aiKeyInputValue, setAiKeyInputValue] = useState("");
  interface AiDiffState {
    from: number;
    to: number;
    originalText: string;
    proposedText: string;
    action: AiActionType;
  }

  const [aiDiffState, setAiDiffState] = useState<AiDiffState | null>(null);

  useEffect(() => {
    setAiDiffState(null);
  }, [note?.id]);

  const handleAcceptDiff = useCallback(() => {
    if (!editor || !aiDiffState) return;
    const { from, to, proposedText } = aiDiffState;
    editor.chain().focus().insertContentAt({ from, to }, proposedText).run();
    setAiDiffState(null);
  }, [editor, aiDiffState]);

  const handleRejectDiff = useCallback(() => {
    setAiDiffState(null);
  }, []);

  const handleInsertBelowDiff = useCallback(() => {
    if (!editor || !aiDiffState) return;
    const { to, proposedText } = aiDiffState;
    editor.chain().focus().insertContentAt(to, `\n\n${proposedText}`).run();
    setAiDiffState(null);
  }, [editor, aiDiffState]);

  const handleAiAction = async (action: AiActionType) => {
    if (!editor) return;

    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      setAiActionPending(action);
      setAiKeyInputValue("");
      setAiErrorMsg("");
      setAiApiKeyModalOpen(true);
      return;
    }

    const { from, to } = editor.state.selection;
    let targetText = "";
    let selectionFrom = from;
    let selectionTo = to;

    if (from !== to) {
      targetText = editor.state.doc.textBetween(from, to, " ");
    } else {
      const currentNode = editor.state.selection.$from.parent;
      const nodeText = currentNode?.textContent || "";
      if (currentNode && nodeText.trim()) {
        targetText = nodeText.trim();
        selectionFrom = editor.state.selection.$from.start();
        selectionTo = editor.state.selection.$from.end();
      } else {
        targetText = (editor.getText() || "").trim();
        selectionFrom = 0;
        selectionTo = editor.state.doc.content.size;
      }
    }

    const trimmedTargetText = targetText.trim();

    if (!trimmedTargetText) {
      showUiAlert("โปรดเลือกหรือพิมพ์ข้อความที่ต้องการให้ผู้ช่วย AI ดำเนินการ");
      return;
    }

    setAiGenerating(true);
    setAiErrorMsg("");

    try {
      const { result, modelUsed } = await runGeminiAction(settings.geminiApiKey, action, trimmedTargetText, lang);
      const cleanResult = result.trim();
      setAiOutputText(cleanResult);

      setAiDiffState({
        from: selectionFrom,
        to: selectionTo,
        originalText: trimmedTargetText,
        proposedText: cleanResult,
        action: action,
        modelUsed: modelUsed,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Gemini API Key") || msg.includes("API key")) {
        setAiActionPending(action);
        setAiErrorMsg(msg);
        setAiKeyInputValue(settings.geminiApiKey);
        setAiApiKeyModalOpen(true);
      } else {
        showUiAlert(`เกิดข้อผิดพลาด AI: ${msg}`);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveApiKeyFromModal = () => {
    const trimmed = aiKeyInputValue.trim();
    if (!trimmed) return;
    updateSetting("geminiApiKey", trimmed);
    setAiApiKeyModalOpen(false);
    if (aiActionPending) {
      const actionToRun = aiActionPending;
      setAiActionPending(null);
      setTimeout(() => {
        handleAiAction(actionToRun);
      }, 100);
    }
  };

  const openLinkDialog = () => {
    if (!editor) return;
    rememberSelection();
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    if (!editor) return;

    const nextUrl = normalizeUrl(linkUrl);
    if (!nextUrl) {
      const chain = getFocusedChain();
      if (!chain) return;
      chain.extendMarkRange("link").unsetLink().run();
      setLinkDialogOpen(false);
      setLinkUrl("");
      return;
    }

    try {
      new URL(nextUrl, window.location.origin);
    } catch {
      showUiAlert(t("editor.invalidLinkUrl"));
      return;
    }

    const chain = getFocusedChain();
    if (!chain) return;
    chain.extendMarkRange("link").setLink({ href: nextUrl }).run();
    setLinkDialogOpen(false);
    setLinkUrl("");
  };

  const handleRemoveLink = () => {
    const chain = getFocusedChain();
    if (!chain) return;
    chain.extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
    setLinkUrl("");
  };

  const openImageDialog = () => {
    rememberSelection();
    setImageUrl("");
    setImageDialogOpen(true);
  };

  const triggerImageUpload = useCallback(() => {
    rememberSelection();
    imageInputRef.current?.click();
  }, [rememberSelection]);

  useEffect(() => {
    openLinkDialogRef.current = openLinkDialog;
    openImageDialogRef.current = openImageDialog;
    triggerImageUploadRef.current = triggerImageUpload;
    handleFixLanguageRef.current = handleFixLanguage;
  });

  const handleApplyImageUrl = () => {
    const nextUrl = normalizeUrl(imageUrl);
    if (!nextUrl) {
      showUiAlert(t("editor.invalidImageUrl"));
      return;
    }

    try {
      new URL(nextUrl, window.location.origin);
    } catch {
      showUiAlert(t("editor.invalidImageUrl"));
      return;
    }

    const chain = getFocusedChain();
    if (!chain) return;
    chain.setImage({ src: nextUrl, alt: "" }).run();
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showUiAlert(t("editor.invalidImageFile"));
      event.target.value = "";
      return;
    }

    if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      try {
        const tokenInfo = getStoredTokenInfo();
        const structure = await syncEngine.initializeSync();
        if (tokenInfo && structure) {
          const uploaded = await uploadDriveAttachmentFile(
            tokenInfo.access_token,
            structure.attachmentsId,
            file,
            file.name
          );
          const driveImgUrl = uploaded.webContentLink || `https://drive.google.com/uc?export=view&id=${uploaded.id}`;
          const chain = getFocusedChain();
          if (chain) chain.setImage({ src: driveImgUrl, alt: file.name }).run();
          event.target.value = "";
          return;
        }
      } catch (err) {
        console.warn("Failed to upload image to Google Drive attachments:", err);
      }
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
      reader.readAsDataURL(file);
    }).catch(() => "");

    if (!dataUrl) {
      showUiAlert(t("editor.invalidImageFile"));
      event.target.value = "";
      return;
    }

    const chain = getFocusedChain();
    if (!chain) return;
    chain.setImage({ src: dataUrl, alt: file.name }).run();
    event.target.value = "";
  };

  const parseAndSetContent = (text: string, format?: "plain" | "markdown") => {
    if (!note) return;
    const parsedFm = parseFrontmatterAndTags(text);
    const cleanText = parsedFm.hasFrontmatter ? parsedFm.bodyContent : text;
    const content = format === "plain" ? cleanText : (marked.parse(cleanText, { async: false, gfm: true, breaks: true }) as string);
    const tags = Array.from(new Set([...(note.tags || []), ...parsedFm.allTags]));
    onUpdate(note.id, { content, contentFormat: format, tags });
  };

  const canUseNativeFs = canUseNativeFileSystem;

  const [selectedExtension, setSelectedExtension] = useState<"md" | "txt" | "html" | null>(null);

  const getPreferredExtension = () => {
    if (selectedExtension) return selectedExtension;
    const currentFileName = note?.fileName?.toLowerCase() ?? "";
    if (currentFileName.endsWith(".txt")) return "txt";
    if (currentFileName.endsWith(".md") || currentFileName.endsWith(".markdown")) return "md";
    if (currentFileName.endsWith(".html") || currentFileName.endsWith(".htm")) return "html";
    return "txt";
  };

  const getSuggestedFileName = () => {
    const safeTitle = (note?.title || "note").trim().replace(/[\\/:*?"<>|]/g, "_") || "note";
    const ext = selectedExtension || getPreferredExtension();
    return `${safeTitle}.${ext}`;
  };

  const getMarkdownFromHtml = (html: string): string => {
    return turndown.turndown(html);
  };

  const getPlainTextFromHtml = (html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const blockTags = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre", "tr"]);

    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === "br") return "\n";
      const inner = Array.from(el.childNodes).map(walk).join("");
      return blockTags.has(tag) ? inner + "\n" : inner;
    };

    return Array.from(temp.childNodes)
      .map(walk)
      .join("")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd();
  };

  const resolveAssetPath = (baseFolderPath: string, assetPath: string) => {
    const trimmed = assetPath.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("/")) return trimmed.replace(/^\/+/, "");

    const segments = `${baseFolderPath}/${trimmed}`.split("/").filter(Boolean);
    const stack: string[] = [];

    for (const segment of segments) {
      if (segment === ".") continue;
      if (segment === "..") {
        if (stack.length > 0) stack.pop();
        continue;
      }
      stack.push(segment);
    }

    return stack.join("/");
  };

  const resolveAssetHandle = async (assetPath: string) => {
    if (!rootDirHandle || !note) return null;

    const resolvedPath = resolveAssetPath(note.folderPath || "", assetPath);
    if (!resolvedPath) return null;

    const segments = resolvedPath.split("/").filter(Boolean);
    let current: FileSystemDirectoryHandle | FileSystemFileHandle | null = rootDirHandle;

    for (const segment of segments) {
      if (!current || !("getDirectoryHandle" in current)) return null;
      try {
        current = await current.getDirectoryHandle(segment, { create: false });
      } catch {
        try {
          current = await current.getFileHandle(segment, { create: false });
        } catch {
          return null;
        }
      }
    }

    if (!current || !("getFile" in current)) return null;
    return current as FileSystemFileHandle;
  };

  const fileToDataUrl = async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file as data URL"));
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadPreviewHtml = async () => {
      if (!note || note.contentFormat !== "html" || !note.content) {
        if (!cancelled) setPreviewHtml("");
        return;
      }

      const rewritten = await rewriteHtmlForPreview(note.content, async (assetPath) => {
        const handle = await resolveAssetHandle(assetPath);
        if (!handle || typeof handle.getFile !== "function") return null;
        const file = await handle.getFile();
        return await fileToDataUrl(file);
      });

      if (!cancelled) setPreviewHtml(rewritten);
    };

    void loadPreviewHtml();
    return () => {
      cancelled = true;
    };
  }, [note?.id, note?.content, note?.contentFormat, note?.folderPath, rootDirHandle]);

  const openHtmlPreviewInNewTab = () => {
    if (!note) return;

    const contentToOpen = note.contentFormat === "html" ? (previewHtml || note.content) : (editor?.getHTML() ?? note.content);
    if (!contentToOpen) return;

    const blob = new Blob([contentToOpen], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (popup) {
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      URL.revokeObjectURL(url);
    }
  };

  const extractTextFromTiptapJson = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && typeof n.text === "string") return n.text;
    if (Array.isArray(n.content)) {
      return n.content.map(extractTextFromTiptapJson).filter(Boolean).join("\n");
    }
    return "";
  };

  const stripTopH1FromHtml = (html: string): string => {
    if (!html) return "";
    return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");
  };

  const getContentToSave = (targetExt?: "md" | "txt" | "html"): string => {
    if (!note) return "";
    const format = targetExt === "html" ? "html" : targetExt ? (targetExt === "txt" ? "plain" : "markdown") : getContentFormat();

    let rawHtml = "";
    if (editor && !editor.isDestroyed) {
      rawHtml = editor.getHTML();
    }

    let htmlContent = (!note || isTxtFile(note)) ? rawHtml : stripTopH1FromHtml(rawHtml);

    const isBlank = !htmlContent || htmlContent.trim() === "<p></p>" || htmlContent.trim() === "<h1></h1><p></p>";
    if (isBlank && note.content && note.content.trim() !== "<p></p>") {
      if (isTiptapJson(note.content)) {
        try {
          const parsed = JSON.parse(note.content);
          const extracted = extractTextFromTiptapJson(parsed);
          htmlContent = extracted ? `<p>${extracted}</p>` : note.content;
        } catch {
          htmlContent = note.content;
        }
      } else {
        htmlContent = note.content;
      }
    }

    if (!htmlContent) return "";

    if (format === "html") {
      return isLikelyHtml(htmlContent) ? htmlContent : `<p>${htmlContent}</p>`;
    } else if (format === "plain") {
      if (isLikelyHtml(htmlContent)) return getPlainTextFromHtml(htmlContent);
      const stripped = htmlContent
        .replace(/^#{1,6}\s+/gm, "")       // headings
        .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
        .replace(/\*(.+?)\*/g, "$1")       // italic
        .replace(/^[-*+]\s+/gm, "")        // list markers
        .replace(/`([^`]+)`/g, "$1")       // inline code
        .replace(/~~(.+?)~~/g, "$1")       // strikethrough
        .replace(/\[(.+?)\]\(.+?\)/g, "$1"); // links
      return stripped;
    } else {
      // For markdown, convert HTML back to markdown using turndown rules
      let mdText = isLikelyHtml(htmlContent) ? getMarkdownFromHtml(htmlContent) : htmlContent;
      mdText = updateFrontmatterTags(mdText, note.tags || []);
      return mdText;
    }
  };

  const setSavedSnapshot = (noteId: string, ext: "md" | "txt" | "html", content: string) => {
    setSavedSnapshotByNoteId((prev) => ({
      ...prev,
      [noteId]: { ext, content },
    }));
  };

  const clearSavedSnapshot = (noteId: string) => {
    setSavedSnapshotByNoteId((prev) => {
      if (!(noteId in prev)) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  const updateLinkedMetadata = (noteId: string, fileName: string) => {
    onUpdate(noteId, {
      fileName,
      isLinkedFile: true,
    });
  };

  const clearLinkedMetadata = async () => {
    if (!note) return;
    fileHandleByNoteIdRef.current[note.id] = undefined;
    await removeStoredFileHandle(note.id);
    clearSavedSnapshot(note.id);
    onUpdate(note.id, {
      fileName: undefined,
      isLinkedFile: false,
    });
  };

  const downloadMarkdown = (markdown: string, ext: "md" | "txt" | "html" = "txt") => {
    if (!note) return;

    const blobType = ext === "txt" ? "text/plain;charset=utf-8" : ext === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8";
    const blob = new Blob([markdown], { type: blobType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = (note?.title || "note").trim().replace(/[\\/:*?"<>|]/g, "_") || "note";

    anchor.href = url;
    anchor.download = `${safeTitle}.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast({
      title: t("editor.saveToastTitle"),
      description: t("editor.saveToastDownloaded", { file: anchor.download }),
    });

    setSavedSnapshot(note.id, ext, markdown);
  };

  const performSave = async (content: string, ext: "md" | "txt" | "html", isSilent = false) => {
    if (!note || isNoteDeleted(note.id) || deletedNoteIdsRef.current.has(note.id)) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const currentOpId = ++saveOpIdRef.current;
    if (!isSilent) setSaveStatus("saving");

    const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
      return;
    }

    const existingHandle = await getFreshFileHandle(note, true);
    if (!existingHandle?.createWritable) {
      if (saveOpIdRef.current === currentOpId) setSaveStatus("unavailable");
      return;
    }

    let writable: FileSystemWritableFileStream | null = null;
    try {
      if (!isSilent) {
        const permission = await requestPermissionIfAvailable(existingHandle, "readwrite");
        if (permission !== "granted") {
          downloadMarkdown(content, ext);
          if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
          return;
        }
      }

      writable = await existingHandle.createWritable();
      await writable.write(content);
      await writable.close();
      writable = null;
      await setStoredFileHandle(note.id, existingHandle);
      const savedFile = await existingHandle.getFile();
      updateLinkedMetadata(note.id, savedFile.name);
      if (!isSilent) {
        toast({
          title: t("editor.saveToastTitle"),
          description: t("editor.saveToastSuccess", { file: savedFile.name }),
        });
      }
      setSavedSnapshot(note.id, ext, content);
      if (saveOpIdRef.current === currentOpId) {
        setSaveStatus(isSilent ? "auto_saved" : "manually_saved");
      }
    } catch (error) {
      if (writable) {
        try {
          await (writable as unknown as { abort?: () => Promise<void> }).abort?.();
        } catch {
          /* ignore abort error */
        }
      }
      console.error("Save to existing file failed", error);
      if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
      if ((error as Error)?.name === "NotFoundError" || (error as Error)?.name === "NotAllowedError") {
        await clearLinkedMetadata();
      }
      if (!isSilent) downloadMarkdown(content, ext);
    }
  };

  const performSaveAs = async (content: string, ext: "md" | "txt" | "html") => {
    if (!note || isNoteDeleted(note.id)) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const currentOpId = ++saveOpIdRef.current;
    setSaveStatus("saving");

    if (!canUseNativeFs()) {
      downloadMarkdown(content, ext);
      if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
      return;
    }

    try {
      const w = window as unknown as { showSaveFilePicker: (options?: unknown) => Promise<FileSystemFileHandle> };
      const extDesc = ext === "md" ? "Markdown" : ext === "html" ? "HTML" : "Text";
      const extAccept = ext === "md" ? ".md" : ext === "html" ? ".html" : ".txt";
      const mimeType = ext === "md" ? "text/markdown" : ext === "html" ? "text/html" : "text/plain";
      const handle = await w.showSaveFilePicker({
        suggestedName: getSuggestedFileName().replace(/\.(md|txt|html)$/, `.${ext}`),
        types: [
          {
            description: `${extDesc} files`,
            accept: { [mimeType]: [extAccept] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      let targetNoteId = note.id;

      // Save As on a linked note should create a new note entry, keeping the original linked file.
      if (note.isLinkedFile && onCreate) {
        const result = onCreate(note.folderPath ?? undefined);
        const createdNote = result instanceof Promise ? await result : result;
        if (createdNote && "id" in createdNote) {
          targetNoteId = createdNote.id;
          onUpdate(targetNoteId, {
            content: ext === "txt" ? content : note.content,
            contentFormat: ext === "txt" ? "plain" : ext === "html" ? "html" : "markdown",
            isLinkedFile: false,
            fileName: undefined,
          });
        }
      }

      fileHandleByNoteIdRef.current[targetNoteId] = handle;
      await setStoredFileHandle(targetNoteId, handle);
      const savedFile = await handle.getFile();
      updateLinkedMetadata(targetNoteId, savedFile.name);
      toast({
        title: t("editor.saveToastTitle"),
        description: t("editor.saveToastSuccess", { file: savedFile.name }),
      });
      setSavedSnapshot(targetNoteId, ext, content);
      if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Save file failed", error);
        if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
      }
      downloadMarkdown(content, ext);
    }
  };



  useEffect(() => {
    if (!note || !canUseNativeFs()) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    const hydrateHandle = async () => {
      let storedHandle = await getStoredFileHandle(note.id);
      if (!storedHandle && rootDirHandle && note.fileName) {
        try {
          let targetDir = rootDirHandle;
          const segments = (note.folderPath ?? "").split("/").filter(Boolean);
          for (const segment of segments) {
            targetDir = await targetDir.getDirectoryHandle(segment, { create: false });
          }
          storedHandle = await targetDir.getFileHandle(note.fileName, { create: false });
          await setStoredFileHandle(note.id, storedHandle);
        } catch {
          /* ignore handle fallback error */
        }
      }
      if (cancelled || !storedHandle) return;

      fileHandleByNoteIdRef.current[note.id] = storedHandle;

      try {
        const permission = await requestPermissionIfAvailable(storedHandle, "read");
        if (permission !== "granted") return;

        const file = await storedHandle.getFile();

        if (note.fileType === "image") {
          objectUrl = URL.createObjectURL(file);
          if (!cancelled) setImageBlobUrl(objectUrl);
          return;
        }

        if (note.fileType === "binary") return;

        const text = await file.text();
        const fname = file.name.toLowerCase();
        let format: "plain" | "markdown" | "html" = "markdown";
        if (fname.endsWith(".txt")) format = "plain";
        else if (fname.endsWith(".html") || fname.endsWith(".htm")) format = "html";

        if (!cancelled) {
          if (format === "html") {
            onUpdate(note.id, { content: text, contentFormat: "html" });
          } else {
            parseAndSetContent(text, format);
          }
          updateLinkedMetadata(note.id, file.name);
          setSavedSnapshot(note.id, format === "plain" ? "txt" : format === "html" ? "html" : "md", text);
        }
      } catch (error) {
        console.error("Load linked file failed", error);
        if (!cancelled) await clearLinkedMetadata();
      }
    };

    setImageBlobUrl(null);
    void hydrateHandle();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [note?.id]);

  function getExportBaseName() {
    if (!note) return t("editor.untitled");
    const name = note.fileName || note.title?.trim() || t("editor.untitled");
    const dotIdx = name.lastIndexOf(".");
    return dotIdx > 0 ? name.slice(0, dotIdx) : name;
  }

  function handleExportPdf() {
    if (!note) return;
    const content = editor?.getHTML() ?? note.content;
    const win = window.open("", "_blank");
    if (!win) return;
    const docTitle = note.fileName || note.title?.trim() || t("editor.untitled");
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title>` +
      `<style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;}` +
      `h1,h2,h3{margin-top:1.2em;}pre{background:#f4f4f4;padding:1em;border-radius:4px;overflow:auto;}` +
      `code{background:#f4f4f4;padding:.2em .4em;border-radius:3px;}blockquote{border-left:4px solid #ccc;margin:0;padding-left:1em;color:#666;}</style>` +
      `</head><body>${content}</body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  }

  function handleExportWord() {
    if (!note) return;
    const content = editor?.getHTML() ?? note.content;
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="UTF-8"></head><body>${content}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getExportBaseName()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveFile() {
    if (!note) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const existingHandle = fileHandleByNoteIdRef.current[note.id] ?? (await getStoredFileHandle(note.id));
    const ext = getPreferredExtension() as "md" | "txt" | "html";
    const content = getContentToSave(ext);

    if (!existingHandle?.createWritable) {
      setPendingSaveAction("saveas");
      setExtensionDialogOpen(true);
      return;
    }

    await performSave(content, ext);
  }

  async function handleExtensionSelected(ext: "md" | "txt" | "html") {
    if (!note) return;
    setSelectedExtension(ext);
    const content = getContentToSave(ext);
    setExtensionDialogOpen(false);
    if (pendingSaveAction === "save") {
      await performSave(content, ext);
    } else if (pendingSaveAction === "saveas") {
      await performSaveAs(content, ext);
    }
    setPendingSaveAction(null);
  }

  async function handleDeleteNote() {
    if (!note) return;

    deletedNoteIdsRef.current.add(note.id);
    if (autoSaveDiskTimeoutRef.current) {
      clearTimeout(autoSaveDiskTimeoutRef.current);
    }
    delete fileHandleByNoteIdRef.current[note.id];
    await clearLinkedMetadata();

    setDeleteConfirmOpen(false);
    onDelete(note.id);
  }

  function renderSaveStatusIndicator() {
    const isNonEditable =
      !note ||
      note.fileType === "image" ||
      note.fileType === "binary" ||
      note.fileName?.toLowerCase()?.endsWith(".zip") ||
      note.fileName?.toLowerCase()?.endsWith(".pdf") ||
      saveStatus === "unavailable";

    if (isNonEditable) {
      return null;
    }

    const solidCheckIcon = (
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-background" />
    );

    let icon = solidCheckIcon;
    let text = t("saveStatus.saved");
    let textClass = "text-emerald-600 dark:text-emerald-400 font-medium";

    switch (saveStatus) {
      case "saving":
        icon = <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/70" />;
        text = t("saveStatus.saving");
        textClass = "text-muted-foreground/70 font-medium";
        break;
      case "auto_saving":
        icon = <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/70" />;
        text = t("saveStatus.autoSaving");
        textClass = "text-muted-foreground/70 font-medium";
        break;
      case "auto_saved":
        icon = solidCheckIcon;
        text = t("saveStatus.autoSaved");
        textClass = "text-emerald-600 dark:text-emerald-400 font-medium";
        break;
      case "manually_saved":
        icon = solidCheckIcon;
        text = t("saveStatus.manuallySaved");
        textClass = "text-emerald-600 dark:text-emerald-400 font-medium";
        break;
      case "saved":
        icon = solidCheckIcon;
        text = t("saveStatus.saved");
        textClass = "text-emerald-600 dark:text-emerald-400 font-medium";
        break;
      case "unsaved":
        icon = <CircleDotDashedIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />;
        text = t("saveStatus.unsavedChanges");
        textClass = "text-amber-600 dark:text-amber-400 font-medium";
        break;
      case "failed":
        icon = <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />;
        text = t("saveStatus.saveFailed");
        textClass = "text-rose-600 dark:text-rose-400 font-medium";
        break;
    }

    const getLastEditedLabel = () => {
      if (!lastEditedTime) return t("saveStatus.editedJustNow");
      const diffSec = Math.floor((Date.now() - lastEditedTime) / 1000);
      if (diffSec < 10) return t("saveStatus.editedJustNow");
      if (diffSec < 60) return t("saveStatus.editedAt", { time: t("saveStatus.secondsAgo", { count: diffSec }) });
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return t("saveStatus.editedAt", { time: t("saveStatus.minutesAgo", { count: diffMin }) });
      const diffHr = Math.floor(diffMin / 60);
      return t("saveStatus.editedAt", { time: t("saveStatus.hoursAgo", { count: diffHr }) });
    };

    return (
      <div className="flex items-center gap-2 select-none">
        <div className={`flex items-center gap-1.5 ${textClass}`}>
          {icon}
          <span>{text}</span>
        </div>
        <span className="text-muted-foreground/30 font-light">|</span>
        <span className="text-muted-foreground/70">{getLastEditedLabel()}</span>
      </div>
    );
  }

  function renderActionButtons() {
    return (
      <Fragment>
        {note?.contentFormat === "html" && (
          <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none mr-1.5">
            <button
              type="button"
              onClick={() => setHtmlPreviewOpen(false)}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                !htmlPreviewOpen
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="h-3 w-3" />
              <span>{t("editor.modeEditor")}</span>
            </button>
            <button
              type="button"
              onClick={() => setHtmlPreviewOpen(true)}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                htmlPreviewOpen
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>{t("editor.modePreview")}</span>
            </button>
          </div>
        )}
        <DropdownMenu>
          <Tooltip>
          <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled={!note} className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5">
              <Save className="h-3.5 w-3.5" />
              <span className="sr-only">{t("editor.saveFile")}</span>
            </Button>
          </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{t("editor.saveFile")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48 rounded-xl px-0 py-2">
            <DropdownMenuItem disabled={!note} onClick={() => void handleSaveFile()} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
              <Save className="h-4 w-4" />
              <span>{t("editor.save")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!note} onClick={() => { setPendingSaveAction("saveas"); setExtensionDialogOpen(true); }} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
              <File className="h-4 w-4" />
              <span>{t("editor.saveAs")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <Tooltip>
          <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled={!note} className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only">{t("editor.exportFile")}</span>
            </Button>
          </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{t("editor.exportFile")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-52 rounded-xl px-0 py-2">
            <DropdownMenuItem disabled={!note} onClick={handleExportPdf} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
              <FileText className="h-4 w-4" />
              <span>{t("editor.exportPdf")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!note} onClick={handleExportWord} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
              <FileCode className="h-4 w-4" />
              <span>{t("editor.exportWord")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!note}
              className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5"
              onClick={() => {
                if (note) {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: t("breadcrumb.share") || "Share Note",
                    description: t("editor.linkCopied") || "Copied link to clipboard!",
                  });
                }
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="sr-only">{t("breadcrumb.share") || "Share"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("breadcrumb.share") || "Share Note"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!note}
              className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5"
              onClick={() => {
                if (note) {
                  toast({
                    title: t("breadcrumb.versionHistory") || "Version History",
                    description: t("saveStatus.saved") || "All changes saved.",
                  });
                }
              }}
            >
              <History className="h-3.5 w-3.5" />
              <span className="sr-only">{t("breadcrumb.versionHistory") || "Version History"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("breadcrumb.versionHistory") || "Version History"}</TooltipContent>
        </Tooltip>
        <Tooltip>
        <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!note}
          className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5"
          onClick={() => {
            if (settings.confirmBeforeDelete) {
              setDeleteConfirmOpen(true);
            } else {
              void handleDeleteNote();
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">{t("editor.deleteNote")}</span>
        </Button>
        </TooltipTrigger>
        <TooltipContent>{t("editor.deleteNote")}</TooltipContent>
        </Tooltip>
      </Fragment>
    );
  }

  if (!note) {
    return (
      <>
        {statusPortalTarget && createPortal(renderSaveStatusIndicator(), statusPortalTarget)}
        {portalTarget && createPortal(renderActionButtons(), portalTarget)}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground relative">
          <p className="text-sm">{t("editor.selectOrCreate")}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("sidebar.newNote")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44 rounded-xl px-0 py-2">
              <DropdownMenuItem onClick={handleOpenCreateFileDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>{t("sidebar.createFileAction")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenCreateFolderDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FolderPlus className="h-4 w-4" />
                <span>{t("sidebar.createFolderAction")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* ปุ่มปิด split เฉพาะ editor ฝั่งขวา */}
          {onCloseSplit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={onCloseSplit}>
                  <span className="sr-only">ปิด split</span>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5L13 13M13 5L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>ปิด split</TooltipContent>
            </Tooltip>
          )}
        </div>

        <Dialog open={createFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("sidebar.createFileTitle")}</DialogTitle>
              <DialogDescription>{t("sidebar.createFileDescription")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div>
                <label htmlFor="new-file-name-editor" className="mb-2 block text-sm font-medium text-foreground">
                  {t("sidebar.fileNameLabel")}
                </label>
                <input
                  id="new-file-name-editor"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFileFromDialog();
                    }
                  }}
                  placeholder={
                    settings.newFilePattern === "date"
                      ? `Note_${new Date().toISOString().slice(0, 10)}`
                      : settings.newFilePattern === "daily"
                      ? `Daily-${new Date().toISOString().slice(0, 10)}`
                      : "untitled"
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="new-file-ext-editor" className="mb-2 block text-sm font-medium text-foreground">
                  {t("sidebar.fileExtensionLabel")}
                </label>
                <Select value={newFileExt} onValueChange={(v) => setNewFileExt(v === "md" ? "md" : v === "html" ? "html" : "txt")}>
                  <SelectTrigger id="new-file-ext-editor" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">{t("sidebar.fileTypeTxt")}</SelectItem>
                    <SelectItem value="md">{t("sidebar.fileTypeMd")}</SelectItem>
                    <SelectItem value="html">{t("sidebar.fileTypeHtml")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateFileDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleCreateFileFromDialog}>
                {t("sidebar.createFileAction")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("sidebar.createFolderTitle")}</DialogTitle>
              <DialogDescription>{t("sidebar.createFolderDescription")}</DialogDescription>
            </DialogHeader>

            <div className="py-1">
              <label htmlFor="new-folder-name-editor" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.folderNameLabel")}
              </label>
              <input
                id="new-folder-name-editor"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFolderFromDialog();
                  }
                }}
                placeholder="untitled-folder"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleCreateFolderFromDialog}>
                {t("sidebar.createFolderAction")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(alertMessage)} onOpenChange={(open) => !open && setAlertMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("editor.cannotOpenFile")}</AlertDialogTitle>
              <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>{t("common.ok")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                <span>{t("editor.shortcutsTitle")}</span>
              </DialogTitle>
              <DialogDescription>{t("editor.shortcutsDescription")}</DialogDescription>
            </DialogHeader>

            <div className="my-2 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1 no-scrollbar text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutTabDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutTab")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutBoldDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutBold")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutItalicDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutItalic")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutStrikeDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutStrike")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutToggleDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutToggle")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutFixLangDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutFixLang")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutSaveDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSave")}</kbd>
              </div>
            </div>

            <DialogFooter className="sm:justify-end">
              <Button type="button" onClick={() => setShortcutsDialogOpen(false)}>
                {t("common.ok")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const displayFileName = note.fileName || `${note.title?.trim() || t("editor.untitled")}`;
  // const [fileInfoOpen, setFileInfoOpen] = useState(false);
  const savedSnapshot = savedSnapshotByNoteId[note.id];
  const isSaved = Boolean(
    savedSnapshot && getContentToSave(savedSnapshot.ext) === savedSnapshot.content,
  );
  const saveStatusLabel = isSaved ? t("editor.saveStatusSaved") : t("editor.saveStatusUnsaved");





  return (
    <>
      <TooltipProvider delayDuration={420}>
      <div className="flex min-h-0 flex-1 flex-row bg-background relative overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col min-w-0 overflow-hidden">
        {/* ...ปุ่ม close split เดิมถูกลบออก... */}
        <div className={note.contentFormat === "html" && !isMobile ? "hidden" : "px-3 py-2 sm:px-4 md:px-6"}>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3 md:hidden">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.08em] text-muted-foreground">LUNO</p>
            <p className="text-xs text-muted-foreground">{t("editor.mobileWritingMode")}</p>
          </div>
          <div className="min-w-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground relative">
            <span className="flex items-center gap-1.5">
              {(note.fileType === "image" || note.fileType === "binary") ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : isSaved ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <CircleDotDashedIcon className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              )}
              <span className="sr-only">{saveStatusLabel}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="block max-w-[126px] truncate cursor-pointer" tabIndex={0}>{displayFileName}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="w-64 rounded-xl px-0 py-2">
                  <div className="px-4 py-2 text-sm">
                    <div><b>Name:</b> {note.fileName || t("editor.untitled")}</div>
                    <div><b>Type:</b> {note.fileType || "-"}</div>
                    <div><b>Format:</b> {note.contentFormat || "-"}</div>
                    {note.fileName && <div><b>Extension:</b> {note.fileName.split('.').pop()}</div>}
                    {note.isLinkedFile && <div><b>Linked File:</b> Yes</div>}
                    {note.folderPath && <div><b>Folder:</b> {note.folderPath}</div>}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-3">
        <div ref={mobileToolbarAreaRef} className={`min-w-0 ${isMobile ? "order-2" : ""}`}>
          {/* Hide toolbar if not txt or md */}
          {((note.fileName?.toLowerCase().endsWith('.txt') || note.fileName?.toLowerCase().endsWith('.md') || note.fileName?.toLowerCase().endsWith('.markdown')) || (!note.fileName && (note.contentFormat === 'markdown' || note.contentFormat === 'plain'))) ? (() => {
            const ALL_TOOLBAR_ITEMS: Array<{
              id: string;
              group: "history" | "heading" | "inline" | "list" | "block" | "media" | "ai";
              labelKey: string;
            }> = [
              { id: "undo", group: "history", labelKey: "editor.undo" },
              { id: "redo", group: "history", labelKey: "editor.redo" },
              { id: "h1", group: "heading", labelKey: "editor.heading1" },
              { id: "h2", group: "heading", labelKey: "editor.heading2" },
              { id: "bold", group: "inline", labelKey: "editor.bold" },
              { id: "italic", group: "inline", labelKey: "editor.italic" },
              { id: "strike", group: "inline", labelKey: "editor.strikethrough" },
              { id: "bulletList", group: "list", labelKey: "editor.bulletList" },
              { id: "orderedList", group: "list", labelKey: "editor.numberedList" },
              { id: "taskList", group: "list", labelKey: "editor.checkbox" },
              { id: "toggle", group: "block", labelKey: "editor.toggle" },
              { id: "code", group: "block", labelKey: "editor.inlineCode" },
              { id: "codeBlock", group: "block", labelKey: "editor.codeBlock" },
              { id: "blockquote", group: "block", labelKey: "editor.blockquote" },
              { id: "horizontalRule", group: "block", labelKey: "editor.horizontalRule" },
              { id: "table", group: "block", labelKey: "editor.insertTable" },
              { id: "emoji", group: "media", labelKey: "editor.insertEmoji" },
              { id: "calculator", group: "media", labelKey: "editor.calculator" },
              { id: "clock", group: "media", labelKey: "editor.clock" },
              { id: "link", group: "media", labelKey: "editor.link" },
              { id: "image", group: "media", labelKey: "editor.insertImageByUrl" },
              { id: "fixLanguage", group: "media", labelKey: "editor.fixLanguage" },
              { id: "aiAssistant", group: "ai", labelKey: "settings.aiAssistant" },
            ];

            // For plain text (.txt) files, only keep tools that work without HTML
            // formatting (undo/redo, aiAssistant, emoji, calculator, clock, fixLanguage) since all other formatting
            // is stripped on save via getPlainTextFromHtml().
            const isPlainText = note?.fileName?.toLowerCase().endsWith(".txt") ||
              (!note?.fileName && getContentFormat() === "plain");
            const TOOLBAR_ITEMS = isPlainText
              ? ALL_TOOLBAR_ITEMS.filter(item =>
                  ["undo", "redo", "aiAssistant", "emoji", "calculator", "clock", "fixLanguage"].includes(item.id)
                )
              : ALL_TOOLBAR_ITEMS;

            const BUTTON_WIDTH = 36;
            const SEP_WIDTH = 9;
            const THREE_DOTS_WIDTH = 36;
            const CONTAINER_PADDING = 12;

            const totalAvailable = mobileToolbarWidth > 0 ? mobileToolbarWidth - CONTAINER_PADDING : 1000;

            let fullWidthNeeded = 0;
            let lastGroup = "";
            for (const item of TOOLBAR_ITEMS) {
              if (lastGroup && item.group !== lastGroup) fullWidthNeeded += SEP_WIDTH;
              fullWidthNeeded += BUTTON_WIDTH;
              lastGroup = item.group;
            }

            let visibleCount = TOOLBAR_ITEMS.length;
            let hasOverflow = false;

            if (totalAvailable < fullWidthNeeded && mobileToolbarWidth > 0) {
              const budget = totalAvailable - THREE_DOTS_WIDTH;
              let accumulated = 0;
              let count = 0;
              lastGroup = "";

              for (let i = 0; i < TOOLBAR_ITEMS.length; i++) {
                const item = TOOLBAR_ITEMS[i];
                let cost = BUTTON_WIDTH;
                if (lastGroup && item.group !== lastGroup) cost += SEP_WIDTH;

                if (accumulated + cost > budget) break;

                accumulated += cost;
                count++;
                lastGroup = item.group;
              }

              visibleCount = Math.max(1, count);
              hasOverflow = true;
            }

            const visibleItems = TOOLBAR_ITEMS.slice(0, visibleCount);
            const overflowItems = TOOLBAR_ITEMS.slice(visibleCount);

            const renderToolbarButton = (id: string) => {
              switch (id) {
                case "undo":
                  return (
                    <Tooltip key="undo">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor || !editor.can().undo()}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().undo().run()}
                        >
                          <Undo2 className="h-4 w-4" />
                          <span className="sr-only">{t("editor.undo")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.undo")}</TooltipContent>
                    </Tooltip>
                  );
                case "redo":
                  return (
                    <Tooltip key="redo">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor || !editor.can().redo()}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().redo().run()}
                        >
                          <Redo2 className="h-4 w-4" />
                          <span className="sr-only">{t("editor.redo")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.redo")}</TooltipContent>
                    </Tooltip>
                  );
                case "aiAssistant":
                  return (
                    <DropdownMenu key="aiAssistant">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor || aiGenerating}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                              <span className="sr-only">{t("settings.aiAssistant")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("settings.aiAssistant")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl px-0 py-2">
                        <DropdownMenuItem onClick={() => handleAiAction("improve")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <WandSparklesIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiImprove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("fix_grammar")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <SpellCheckIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiFixGrammar")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_shorter")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Minimize2 className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiMakeShorter")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_longer")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Maximize2 className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiMakeLonger")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("simplify")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiSimplify")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("formalize")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <BriefcaseBusinessIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiFormalize")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_casual")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiMakeCasual")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("translate")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Languages className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiTranslate")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("continue_writing")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <ArrowRight className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiContinueWriting")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("rewrite")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <PenLineIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiRewrite")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "h1":
                  return (
                    <Tooltip key="h1">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 1 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        >
                          <Heading1Icon className="h-4 w-4" />
                          <span className="sr-only">{t("editor.heading1")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading1")}</TooltipContent>
                    </Tooltip>
                  );
                case "h2":
                  return (
                    <Tooltip key="h2">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 2 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        >
                          <Heading2Icon className="h-4 w-4" />
                          <span className="sr-only">{t("editor.heading2")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading2")}</TooltipContent>
                    </Tooltip>
                  );
                case "bold":
                  return (
                    <Tooltip key="bold">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("bold") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                        >
                          <Bold className="h-4 w-4" />
                          <span className="sr-only">{t("editor.bold")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.bold")}</TooltipContent>
                    </Tooltip>
                  );
                case "italic":
                  return (
                    <Tooltip key="italic">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("italic") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                        >
                          <Italic className="h-4 w-4" />
                          <span className="sr-only">{t("editor.italic")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.italic")}</TooltipContent>
                    </Tooltip>
                  );
                case "strike":
                  return (
                    <Tooltip key="strike">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("strike") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleStrike().run()}
                        >
                          <Strikethrough className="h-4 w-4" />
                          <span className="sr-only">{t("editor.strikethrough")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.strikethrough")}</TooltipContent>
                    </Tooltip>
                  );
                case "bulletList":
                  return (
                    <Tooltip key="bulletList">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("bulletList") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        >
                          <List className="h-4 w-4" />
                          <span className="sr-only">{t("editor.bulletList")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.bulletList")}</TooltipContent>
                    </Tooltip>
                  );
                case "orderedList":
                  return (
                    <Tooltip key="orderedList">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("orderedList") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        >
                          <ListOrdered className="h-4 w-4" />
                          <span className="sr-only">{t("editor.orderedList")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.orderedList")}</TooltipContent>
                    </Tooltip>
                  );
                case "taskList":
                  return (
                    <Tooltip key="taskList">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("taskList") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleTaskList().run()}
                        >
                          <ListTodoIcon className="h-4 w-4" />
                          <span className="sr-only">{t("editor.checkbox")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.checkbox")}</TooltipContent>
                    </Tooltip>
                  );
                case "toggle":
                  return (
                    <Tooltip key="toggle">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("toggle") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleToggleClick(editor)}
                        >
                          <ChevronsDownUp className="h-4 w-4" />
                          <span className="sr-only">{t("editor.toggle")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.toggle")}</TooltipContent>
                    </Tooltip>
                  );
                case "code":
                  return (
                    <Tooltip key="code">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("code") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleCode().run()}
                        >
                          <Code className="h-4 w-4" />
                          <span className="sr-only">{t("editor.code")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.code")}</TooltipContent>
                    </Tooltip>
                  );
                case "codeBlock":
                  return (
                    <Tooltip key="codeBlock">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("codeBlock") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                        >
                          <Code2 className="h-4 w-4" />
                          <span className="sr-only">{t("editor.codeBlock")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.codeBlock")}</TooltipContent>
                    </Tooltip>
                  );
                case "blockquote":
                  return (
                    <Tooltip key="blockquote">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("blockquote") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        >
                          <Quote className="h-4 w-4" />
                          <span className="sr-only">{t("editor.blockquote")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.blockquote")}</TooltipContent>
                    </Tooltip>
                  );
                case "horizontalRule":
                  return (
                    <Tooltip key="horizontalRule">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        >
                          <Minus className="h-4 w-4" />
                          <span className="sr-only">{t("editor.horizontalRule")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.horizontalRule")}</TooltipContent>
                    </Tooltip>
                  );
                case "table":
                  if (!editor) return null;
                  if (!editor.isActive("table")) {
                    return (
                      <Tooltip key="table">
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                          >
                            <TableIcon className="h-4 w-4" />
                            <span className="sr-only">{t("editor.insertTable")}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.insertTable")}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return (
                    <DropdownMenu key="table">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full bg-primary/15 text-primary"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <TableIcon className="h-4 w-4" />
                              <span className="sr-only">{t("editor.tableOptions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.tableOptions")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-56 rounded-xl px-0 py-2">
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addRowAbove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addRowBelow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2 text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteRow")}</span>
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-border/40" />
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addColumnLeft")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addColumnRight")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2 text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteColumn")}</span>
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-border/40" />
                        <DropdownMenuItem
                          onClick={() => editor.chain().focus().mergeCells().run()}
                          disabled={!editor.can().mergeCells()}
                          className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                        >
                          <TableIcon className="mr-2 h-4 w-4" />
                          <span>{t("editor.mergeCells")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor.chain().focus().splitCell().run()}
                          disabled={!editor.can().splitCell()}
                          className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                        >
                          <TableIcon className="mr-2 h-4 w-4" />
                          <span>{t("editor.splitCell")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <TableIcon className="mr-2 h-4 w-4" />
                          <span>{t("editor.toggleHeaderRow")}</span>
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-border/40" />
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2 text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteTable")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "emoji":
                  return (
                    <Popover key="emoji">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <Smile className="h-4 w-4" />
                              <span className="sr-only">{t("editor.emoji")}</span>
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.emoji")}</TooltipContent>
                      </Tooltip>
                      <PopoverContent align="start" className="w-72 rounded-xl p-3 shadow-lg">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                          {t("editor.insertEmoji")}
                        </div>
                        <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto pr-1 select-none no-scrollbar">
                          {EMOJI_LIST.map((emoji, index) => (
                            <button
                              key={`${emoji}-${index}`}
                              type="button"
                              className="h-8 w-8 text-lg rounded-lg hover:bg-muted focus:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                if (editor) {
                                  editor.chain().focus().insertContent(emoji).run();
                                }
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                case "calculator":
                  return (
                    <Tooltip key="calculator">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${calculatorOpen ? "bg-primary/15 text-primary" : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={toggleCalculator}
                        >
                          <Calculator className="h-4 w-4" />
                          <span className="sr-only">{t("editor.calculator")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.calculator")}</TooltipContent>
                    </Tooltip>
                  );
                case "clock":
                  return (
                    <Tooltip key="clock">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${clockOpen ? "bg-primary/15 text-primary" : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={toggleClock}
                        >
                          <Clock className="h-4 w-4" />
                          <span className="sr-only">{t("editor.clock")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.clock")}</TooltipContent>
                    </Tooltip>
                  );
                case "link":
                  return (
                    <Tooltip key="link">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("link") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={openLinkDialog}
                        >
                          <Link2 className="h-4 w-4" />
                          <span className="sr-only">{t("editor.link")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.link")}</TooltipContent>
                    </Tooltip>
                  );
                case "image":
                  return (
                    <DropdownMenu key="image">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <ImagePlus className="h-4 w-4" />
                              <span className="sr-only">{t("editor.image")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.image")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-52 rounded-xl px-0 py-2">
                        <DropdownMenuItem onClick={openImageDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <ImagePlus className="mr-2 h-4 w-4" />
                          <span>{t("editor.insertImageByUrl")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            rememberSelection();
                            imageInputRef.current?.click();
                          }}
                          className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          <span>{t("editor.uploadImage")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "fixLanguage":
                  return (
                    <Tooltip key="fixLanguage">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleFixLanguage}
                        >
                          <Wrench className="h-4 w-4" />
                          <span className="sr-only">{t("editor.fixLanguage")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.fixLanguage")}</TooltipContent>
                    </Tooltip>
                  );
                default:
                  return null;
              }
            };

            const renderDropdownItem = (id: string) => {
              switch (id) {
                case "undo":
                  return (
                    <DropdownMenuItem key="undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor || !editor.can().undo()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Undo2 className="mr-2 h-4 w-4" />
                      <span>{t("editor.undo")}</span>
                    </DropdownMenuItem>
                  );
                case "redo":
                  return (
                    <DropdownMenuItem key="redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor || !editor.can().redo()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Redo2 className="mr-2 h-4 w-4" />
                      <span>{t("editor.redo")}</span>
                    </DropdownMenuItem>
                  );
                case "h1":
                  return (
                    <DropdownMenuItem key="h1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Heading1Icon className="mr-2 h-4 w-4" />
                      <span>{t("editor.heading1")}</span>
                    </DropdownMenuItem>
                  );
                case "h2":
                  return (
                    <DropdownMenuItem key="h2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Heading2Icon className="mr-2 h-4 w-4" />
                      <span>{t("editor.heading2")}</span>
                    </DropdownMenuItem>
                  );
                case "bold":
                  return (
                    <DropdownMenuItem key="bold" onClick={() => editor?.chain().focus().toggleBold().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Bold className="mr-2 h-4 w-4" />
                      <span>{t("editor.bold")}</span>
                    </DropdownMenuItem>
                  );
                case "italic":
                  return (
                    <DropdownMenuItem key="italic" onClick={() => editor?.chain().focus().toggleItalic().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Italic className="mr-2 h-4 w-4" />
                      <span>{t("editor.italic")}</span>
                    </DropdownMenuItem>
                  );
                case "strike":
                  return (
                    <DropdownMenuItem key="strike" onClick={() => editor?.chain().focus().toggleStrike().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Strikethrough className="mr-2 h-4 w-4" />
                      <span>{t("editor.strikethrough")}</span>
                    </DropdownMenuItem>
                  );
                case "bulletList":
                  return (
                    <DropdownMenuItem key="bulletList" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <List className="mr-2 h-4 w-4" />
                      <span>{t("editor.bulletList")}</span>
                    </DropdownMenuItem>
                  );
                case "orderedList":
                  return (
                    <DropdownMenuItem key="orderedList" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <ListOrdered className="mr-2 h-4 w-4" />
                      <span>{t("editor.numberedList")}</span>
                    </DropdownMenuItem>
                  );
                case "taskList":
                  return (
                    <DropdownMenuItem key="taskList" onClick={() => editor?.chain().focus().toggleTaskList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <ListTodoIcon className="mr-2 h-4 w-4" />
                      <span>{t("editor.checkbox")}</span>
                    </DropdownMenuItem>
                  );
                case "toggle":
                  return (
                    <DropdownMenuItem key="toggle" onClick={() => handleToggleClick(editor)} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <ChevronsDownUp className="mr-2 h-4 w-4" />
                      <span>{t("editor.toggle")}</span>
                    </DropdownMenuItem>
                  );
                case "code":
                  return (
                    <DropdownMenuItem key="code" onClick={() => editor?.chain().focus().toggleCode().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Code className="mr-2 h-4 w-4" />
                      <span>{t("editor.inlineCode")}</span>
                    </DropdownMenuItem>
                  );
                case "blockquote":
                  return (
                    <DropdownMenuItem key="blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Quote className="mr-2 h-4 w-4" />
                      <span>{t("editor.blockquote")}</span>
                    </DropdownMenuItem>
                  );
                case "table":
                  return (
                    <DropdownMenuItem
                      key="table"
                      onClick={() => {
                        if (editor) {
                          if (editor.isActive("table")) {
                            editor.chain().focus().deleteTable().run();
                          } else {
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                          }
                        }
                      }}
                      className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                    >
                      <TableIcon className="mr-2 h-4 w-4" />
                      <span>{t("editor.insertTable")}</span>
                    </DropdownMenuItem>
                  );
                case "emoji":
                  return (
                    <DropdownMenuItem key="emoji" onClick={() => {}} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Smile className="mr-2 h-4 w-4" />
                      <span>{t("editor.insertEmoji")}</span>
                    </DropdownMenuItem>
                  );
                case "calculator":
                  return (
                    <DropdownMenuItem key="calculator" onClick={toggleCalculator} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Calculator className="mr-2 h-4 w-4" />
                      <span>{t("editor.calculator")}</span>
                    </DropdownMenuItem>
                  );
                case "clock":
                  return (
                    <DropdownMenuItem key="clock" onClick={toggleClock} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{t("editor.clock")}</span>
                    </DropdownMenuItem>
                  );
                case "link":
                  return (
                    <DropdownMenuItem key="link" onClick={openLinkDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Link2 className="mr-2 h-4 w-4" />
                      <span>{t("editor.link")}</span>
                    </DropdownMenuItem>
                  );
                case "image":
                  return (
                    <Fragment key="image">
                      <DropdownMenuItem onClick={openImageDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                        <ImagePlus className="mr-2 h-4 w-4" />
                        <span>{t("editor.insertImageByUrl")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          rememberSelection();
                          imageInputRef.current?.click();
                        }}
                        className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        <span>{t("editor.uploadImage")}</span>
                      </DropdownMenuItem>
                    </Fragment>
                  );
                case "fixLanguage":
                  return (
                    <DropdownMenuItem key="fixLanguage" onClick={handleFixLanguage} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Wrench className="mr-2 h-4 w-4" />
                      <span>{t("editor.fixLanguage")}</span>
                    </DropdownMenuItem>
                  );
                case "aiAssistant":
                  return (
                    <DropdownMenuItem key="aiAssistant" onClick={() => {}} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <SparklesIcon className="mr-2 h-4 w-4" />
                      <span>{t("settings.aiAssistant")}</span>
                    </DropdownMenuItem>
                  );
                default:
                  return null;
              }
            };

            return (
              <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-full border border-border bg-secondary p-1">
                {visibleItems.map((item, index) => {
                  const showSeparator = index > 0 && item.group !== visibleItems[index - 1].group;
                  return (
                    <Fragment key={item.id}>
                      {showSeparator && <div className="h-4 w-px shrink-0 bg-border" />}
                      {renderToolbarButton(item.id)}
                    </Fragment>
                  );
                })}

                {hasOverflow && (
                  <>
                    <div className="h-4 w-px shrink-0 bg-border" />
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t("editor.moreTools")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.moreTools")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" sideOffset={4} className="w-56 rounded-xl px-0 py-2">
                        {overflowItems.map((item) => renderDropdownItem(item.id))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            );
          })() : null}
        </div>

        <div className={`flex w-full shrink-0 items-center justify-between gap-1 ${isMobile ? "order-1 pt-0" : "pt-1"} lg:w-auto lg:justify-self-end lg:justify-end lg:pt-0`}>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="ml-auto flex items-center gap-1">
          {statusPortalTarget && createPortal(renderSaveStatusIndicator(), statusPortalTarget)}
          {portalTarget && createPortal(renderActionButtons(), portalTarget)}
          <input ref={docxInputRef} type="file" accept=".docx" className="hidden" onChange={handleImportDocx} />
          <Dialog open={importDocxDialogOpen} onOpenChange={setImportDocxDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>นำเข้าไฟล์ docx</DialogTitle>
                <DialogDescription>เลือกไฟล์ docx เพื่อแปลงเป็น HTML และแก้ไขใน Editor</DialogDescription>
              </DialogHeader>
              <div className="py-1">
                <Button type="button" onClick={() => docxInputRef.current?.click()}>
                  เลือกไฟล์ docx
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportDocxDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* AI Assistant API Key Dialog */}
          <Dialog open={aiApiKeyModalOpen} onOpenChange={setAiApiKeyModalOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t("settings.aiApiKeyRequiredTitle")}</DialogTitle>
                <DialogDescription>{t("settings.aiApiKeyRequiredDesc")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="ai-api-key-modal-input" className="block text-sm font-semibold text-foreground">
                    Gemini API Key
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    Get Free API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <input
                  id="ai-api-key-modal-input"
                  type="password"
                  value={aiKeyInputValue}
                  onChange={(e) => setAiKeyInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveApiKeyFromModal();
                    }
                  }}
                  placeholder="AIzaSy..."
                  className="w-full rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-0 shadow-none"
                />
                {aiErrorMsg && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 mt-1">
                    {aiErrorMsg}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setAiApiKeyModalOpen(false)}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button type="button" onClick={handleSaveApiKeyFromModal} disabled={!aiKeyInputValue.trim()}>
                  Save Key & Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          {onCloseSplit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full" onClick={onCloseSplit} aria-label={t("editor.closeSplit")}> 
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.closeSplit")}</TooltipContent>
            </Tooltip>
          )}
          </div>
        </div>
      </div>
      </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && editor) {
              editor.commands.focus("end");
            }
          }}
          className={`flex flex-col cursor-text ${note.contentFormat === "html" ? "flex-1 min-h-0" : "flex-1 overflow-y-auto"} w-full`}
        >
          {note.fileType === "image" ? (
            <div className="flex min-h-full w-full flex-col items-center justify-center p-6">
              {imageBlobUrl ? (
                <img
                  src={imageBlobUrl}
                  alt={note.fileName}
                  className="max-h-full max-w-full rounded-lg object-contain shadow"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{note.fileName}</p>
              )}
            </div>
          ) : note.fileType === "binary" || (note.fileName?.toLowerCase()?.endsWith(".zip")) ? (
            <div className="flex min-h-full w-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
              {note.fileName?.toLowerCase()?.endsWith(".zip") ? (
                <FolderArchive className="h-12 w-12 opacity-30" />
              ) : (
                <File className="h-12 w-12 opacity-30" />
              )}
              <p className="text-sm">{note.fileName}</p>
              <p className="text-xs opacity-60">{t("editor.previewNotSupported")}</p>
            </div>
          ) : note.contentFormat === "html" ? (
            htmlPreviewOpen ? (
              <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 shrink-0">
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-foreground/80">HTML Preview</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={openHtmlPreviewInNewTab}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground flex items-center gap-1 text-xs"
                        aria-label="Open HTML in browser"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Open HTML in browser</TooltipContent>
                  </Tooltip>
                </div>
                <iframe
                  className="flex-1 w-full bg-white border-0"
                  srcDoc={previewHtml || note.content}
                  sandbox="allow-scripts allow-same-origin"
                  title="HTML Preview"
                />
              </div>
            ) : (
              <HtmlCodeEditor
                key={note.id}
                value={note.content}
                onChange={(val) => onUpdate(note.id, { content: val })}
                fontSize={editorFontSize}
              />
            )
          ) : (
            <div className={`flex w-full min-w-0 flex-col overflow-x-hidden px-4 pt-6 pb-0 sm:px-6 sm:pt-8 md:px-8 md:pt-10 lg:px-12 lg:pt-12 mx-auto ${
              settings.editorWidth === "compact" ? "max-w-2xl" : settings.editorWidth === "full" ? "max-w-none" : "max-w-4xl"
            } ${settings.showCodeLineNumbers ? "show-code-line-numbers" : ""}`}>
              {note.tags && note.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${getTagColorClass(tag, settings.theme, idx, settings.tagColorStyle)}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {editor && <TableInteractiveOverlay editor={editor} />}
              <EditorContent editor={editor} className="w-full min-w-0 max-w-full" />
              <div className="h-6 sm:h-8 md:h-10 lg:h-12 w-full shrink-0 pointer-events-none" />
            </div>
          )}
        </div>
        </div>

        {/* Editor Status Bar */}
        {note && (
          <div className="flex h-7 w-full shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-3 text-[11px] text-muted-foreground select-none overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3 shrink-0">
              <span>{`Ln ${editorStats.line}, Col ${editorStats.col}`}</span>
              {settings.showWordCount && (
                <>
                  <div className="h-3 w-[1px] bg-border/60" />
                  <span>{`${editorStats.wordCount} words`}</span>
                </>
              )}
              <div className="h-3 w-[1px] bg-border/60" />
              <span>{`${editorStats.charCount} ${t("editor.charCountUnit")}`}</span>
              {settings.showWordCount && (
                <>
                  <div className="h-3 w-[1px] bg-border/60" />
                  <span>{`${editorStats.readingTime} min read`}</span>
                </>
              )}
              <div className="h-3 w-[1px] bg-border/60" />
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[10px] tracking-tight">M↓</span>
                <span>{editorStats.syntaxLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span>{`${editorStats.zoom}%`}</span>
              <div className="h-3 w-[1px] bg-border/60" />
              <span>{editorStats.lineEnding}</span>
              <div className="h-3 w-[1px] bg-border/60" />
              <span>UTF-8</span>
            </div>
          </div>
        )}
        </div>
        {/* Docked Right Panel */}
        <AnimatePresence>
          {rightPanelOpen && (
            <RightPanel
              isOpen={rightPanelOpen}
              onClose={onCloseRightPanel || (() => {})}
              note={note}
              editor={editor}
              notes={notes}
              onUpdateNote={onUpdate}
              onFavorite={(id) => {
                const n = notes?.find((item) => item.id === id);
                if (n && onUpdate) onUpdate(id, { isFavorite: !n.isFavorite });
              }}
              onDuplicate={(n) => {
                if (onCreate) {
                  const baseName = n.fileName || "untitled.md";
                  const newName = baseName.includes(".")
                    ? baseName.replace(/(\.[^/.]+)$/, " copy$1")
                    : `${baseName} copy`;
                  onCreate(n.folderPath || "", {
                    fileName: newName,
                    contentFormat: n.contentFormat || "markdown",
                  });
                }
              }}
              onDelete={(n) => onDelete(n.id)}
            />
          )}

          {/* AI Assistant Right Panel */}
          {aiDiffState && (
            <AiAssistantPanel
              isOpen={Boolean(aiDiffState)}
              onClose={handleRejectDiff}
              diffState={aiDiffState}
              onAccept={handleAcceptDiff}
              onReject={handleRejectDiff}
              onInsertBelow={handleInsertBelowDiff}
            />
          )}
        </AnimatePresence>
      </div>

      <FloatingCalculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        zIndex={calculatorZIndex}
        onFocusWindow={bringCalculatorToFront}
      />

      <FloatingClock
        isOpen={clockOpen}
        onClose={() => setClockOpen(false)}
        zIndex={clockZIndex}
        onFocusWindow={bringClockToFront}
      />



      <AlertDialog open={Boolean(alertMessage)} onOpenChange={(open) => !open && setAlertMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editor.cannotOpenFile")}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t("common.ok")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.selectFileFormat")}</DialogTitle>
            <DialogDescription>{t("editor.selectFileFormatDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("txt")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.txt</span>
              <span className="text-xs text-muted-foreground">Plain text</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("md")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileCode className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.md</span>
              <span className="text-xs text-muted-foreground">Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("html")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileCode className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.html</span>
              <span className="text-xs text-muted-foreground">HTML</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.link")}</DialogTitle>
            <DialogDescription>{t("editor.linkDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <label htmlFor="link-url" className="block text-sm font-medium text-foreground">
              {t("editor.linkUrl")}
            </label>
            <input
              id="link-url"
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder={t("editor.linkUrlPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={handleRemoveLink}>
              {t("editor.removeLink")}
            </Button>
            <Button type="button" onClick={handleApplyLink}>
              {t("editor.applyLink")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.image")}</DialogTitle>
            <DialogDescription>{t("editor.imageDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <label htmlFor="image-url" className="block text-sm font-medium text-foreground">
              {t("editor.imageUrl")}
            </label>
            <input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder={t("editor.imageUrlPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleApplyImageUrl}>
              {t("editor.insertImage")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editor.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {note.isLinkedFile ? t("editor.deleteLinkedDescription") : t("editor.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                void handleDeleteNote();
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              <span>{t("editor.shortcutsTitle")}</span>
            </DialogTitle>
            <DialogDescription>{t("editor.shortcutsDescription")}</DialogDescription>
          </DialogHeader>

          <div className="my-2 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1 no-scrollbar text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutTabDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutTab")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutBoldDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutBold")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutItalicDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutItalic")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutStrikeDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutStrike")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutToggleDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutToggle")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutFixLangDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutFixLang")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutSaveDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSave")}</kbd>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setShortcutsDialogOpen(false)}>
              {t("common.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Slash Commands Menu */}
      {slashMenuState.open && slashMenuState.coords && (
        <div
          className="fixed z-50 w-56 rounded-xl border border-border bg-popover px-0 py-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-72 overflow-hidden text-popover-foreground"
          style={{
            top: `${Math.min(slashMenuState.coords.top + 6, window.innerHeight - 300)}px`,
            left: `${Math.min(slashMenuState.coords.left, window.innerWidth - 240)}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
            {t("editor.slashMenuTitle")}
          </div>

          {canScrollUp && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollSlashMenu("up")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronUp className="h-4 w-4" />
            </div>
          )}

          <div
            ref={(el) => {
              slashMenuScrollRef.current = el;
            }}
            onScroll={checkSlashMenuScroll}
            className="overflow-y-auto no-scrollbar flex-1 py-1"
          >
            {slashMenuState.filteredItems.length === 0 ? (
              <div className="px-4 py-3 text-xs text-center text-muted-foreground">
                {t("editor.noCommandsFound")}
              </div>
            ) : (
              slashMenuState.filteredItems.map((item, idx) => {
                const isSelected = idx === slashMenuState.selectedIndex;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    data-slash-item={idx}
                    onMouseEnter={() => {
                      setSlashMenuState((prev) => ({ ...prev, selectedIndex: idx }));
                      slashMenuStateRef.current.selectedIndex = idx;
                    }}
                    className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                      isSelected
                        ? "bg-accent/5 text-primary font-semibold"
                        : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                    }`}
                    onClick={() => {
                      if (editor) {
                        executeSlashCommand(editor, item);
                      }
                    }}
                  >
                    {item.icon}
                    <span className="truncate flex-1">{t(item.titleKey)}</span>
                  </div>
                );
              })
            )}
          </div>

          {canScrollDown && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollSlashMenu("down")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
      </TooltipProvider>
    </>
  );
}

