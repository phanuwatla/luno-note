/* eslint-disable react-hooks/exhaustive-deps, react-refresh/only-export-components */
import HtmlCodeEditor from "@/components/HtmlCodeEditor";
import { Note } from "@/hooks/useNotes";
import {
  Bold,
  CheckCircle2,
  Circle,
  Code,
  Download,
  ExternalLink,
  File,
  FileCode,
  FileText,
  FileImage,
  FolderArchive,
  ImagePlus,
  Italic,
  Languages,
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
  Save,
  Table as TableIcon,
  Copy,
  ChevronRight,
  Columns,
  Layers,
  X
} from "lucide-react";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { docxToHtml } from "@/lib/docxUtils";
import { EditorContent, ReactNodeViewRenderer, useEditor, Editor as TiptapEditor } from "@tiptap/react";
import { Extension, mergeAttributes, Node as TiptapNode } from "@tiptap/core";
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
import { canUseNativeFileSystem, getStoredFileHandle, removeStoredFileHandle, setStoredFileHandle, requestPermissionIfAvailable, ExtendedFileSystemHandle } from "@/lib/fileHandles";
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
    id: "blockquote",
    titleKey: "editor.blockquote",
    icon: <Quote className="mr-2 h-4 w-4" />,
    keywords: ["quote", "blockquote", "คำพูด", "อ้างอิง"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
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
    icon: <Languages className="mr-2 h-4 w-4" />,
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
  onCreate?: (folderPath?: string) => Note;
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
  editorFontSize?: number;
  isMobile?: boolean;
  notes?: Note[];
  rootDirHandle?: ExtendedFileSystemHandle | null;
  onCloseSplit?: () => void;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
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
  const { note, onUpdate, onDelete, onCreate, onOpenSidebar, isSidebarOpen = false, editorFontSize = 15, isMobile = false, notes, rootDirHandle, onCloseSplit, settingsOpen: propSettingsOpen, onSettingsOpenChange } = props;
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
          const newNote = onCreate();
          onUpdate(newNote.id, { content: html, contentFormat: "html", fileType: undefined });
          onUpdate(newNote.id, { content: html, contentFormat: "html", fileType: undefined });
          updated = true;
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileToolbarAreaRef = useRef<HTMLDivElement>(null);
  const syncingFromNote = useRef(false);
  const fileHandleByNoteIdRef = useRef<Record<string, FileSystemFileHandle>>({});
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
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const { t } = useTranslation();

  const MOBILE_FULL_TOOLBAR_MIN_WIDTH = 340;

  const turndown = useMemo(() => {
    const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

    // Preserve table elements so table structure & layout are saved intact
    td.keep(["table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col"]);

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

  /** Detect if a string is a Tiptap JSON document */
  const isTiptapJson = (text: string) => text.trimStart().startsWith('{"type":"doc"');

  /** Return content in the format that editor.setContent() / useEditor({ content }) accepts */
  const parseEditorContent = (text: string): string | Record<string, unknown> => {
    if (!text.trim()) return "<h1></h1><p></p>";
    if (isTiptapJson(text)) {
      try { return JSON.parse(text); } catch { /* fall through */ }
    }
    return toEditorHtml(text);
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
        ? (contentSpan as HTMLElement).innerHTML.trim()
        : (li as HTMLElement).innerHTML.trim();
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
      const inner = (li as HTMLElement).innerHTML.trim();
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

  const toEditorHtml = (text: string): string => {
    if (!text.trim()) return "<h1></h1><p></p>";

    const temp = document.createElement("div");
    if (isLikelyHtml(text)) {
      temp.innerHTML = text;
    } else {
      temp.innerHTML = marked.parse(text, { async: false, gfm: true, breaks: true }) as string;
    }

    prepareDomForEditor(temp);
    return temp.innerHTML;
  };

  const EDITOR_CLASSES =
    "min-h-[60vh] md:min-h-[70vh] outline-none leading-7 text-foreground [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)] [&>*:first-child]:mb-3 [&>*:first-child]:text-2xl [&>*:first-child]:font-semibold [&>*:first-child]:leading-tight [&>*:first-child]:md:text-3xl [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_h2]:text-xl [&_h2]:font-semibold [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_p]:leading-7 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_details]:my-0 [&_details]:py-0 [&_details_summary]:my-0 [&_details_summary]:py-0" +
    " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-0 [&_ul[data-type='taskList']_li_label]:w-6 [&_ul[data-type='taskList']_li_label]:h-7 [&_ul[data-type='taskList']_li_label]:shrink-0 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:justify-center [&_ul[data-type='taskList']_li_label_input]:h-[14px] [&_ul[data-type='taskList']_li_label_input]:w-[14px] [&_ul[data-type='taskList']_li_label_input]:bg-transparent [&_ul[data-type='taskList']_li_label_input]:rounded-[3px] [&_ul[data-type='taskList']_li_label_input]:border [&_ul[data-type='taskList']_li_label_input]:border-muted-foreground/50 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0 [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:text-muted-foreground/90" +
    " [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:my-4 [&_table]:my-0 [&_table]:w-[70%] max-md:[&_table]:w-full [&_td]:border [&_td]:border-border/60 [&_td]:py-2 [&_td]:px-3 [&_td]:relative [&_th]:border [&_th]:border-border/60 [&_th]:py-2 [&_th]:px-3 [&_th]:bg-muted/30 [&_th]:font-semibold [&_th]:text-left [&_td_p]:my-0 [&_td_p]:leading-normal [&_th_p]:my-0 [&_th_p]:leading-normal";

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

  useEffect(() => {
    tRef.current = t;
    isMobileRef.current = isMobile;
  }, [t, isMobile]);

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
            return tRef.current("editor.untitled");
          }

          const doc = ed.state.doc;
          const firstChild = doc.firstChild;
          const isTopH1Empty =
            firstChild &&
            firstChild.type.name === "heading" &&
            firstChild.attrs?.level === 1 &&
            firstChild.textContent.trim() === "";

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
    content: parseEditorContent(note?.content ?? ""),
    editorProps: {
      attributes: {
        style: `font-size:${editorFontSize}px;`,
        class: EDITOR_CLASSES,
      },
    },
    onSelectionUpdate: ({ editor: instance }) => {
      checkSlashCommand(instance);
      setEditorTick((v) => v + 1);
    },
    onUpdate: ({ editor: instance }) => {
      checkSlashCommand(instance);
      setEditorTick((v) => v + 1);
      if (!note || syncingFromNote.current) return;
      if (!settings.autoSave) return;
      onUpdate(note.id, { content: JSON.stringify(instance.getJSON()) });
      scheduleAutoSaveDiskRef.current?.();
    },
  });

  const editorStats = useMemo(() => {
    if (!editor) {
      const charCount = note?.content ? note.content.length : 0;
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
    const charCount = doc.textContent.length;

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
      syntaxLabel,
      zoom,
      lineEnding,
    };
  }, [editor, editorTick, note, editorFontSize, t]);

  const saveLinkedFileToDisk = useCallback(async () => {
    if (!note || !editor || !settings.autoSave) return;
    const existingHandle = fileHandleByNoteIdRef.current[note.id];
    if (!existingHandle?.createWritable) return;

    try {
      const ext = getPreferredExtension() as "md" | "txt" | "html";
      const content = getContentToSave(ext);
      await performSave(content, ext, true);
    } catch {
      /* ignore background disk save errors */
    }
  }, [note, editor, settings.autoSave]);

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

  useEffect(() => {
    return () => {
      if (autoSaveDiskTimeoutRef.current) {
        clearTimeout(autoSaveDiskTimeoutRef.current);
      }
      if (note && editor && settings.autoSave) {
        void saveLinkedFileToDisk();
      }
    };
  }, [note?.id, editor, settings.autoSave, saveLinkedFileToDisk]);

  useEffect(() => {
    if (!note || !editor || note.fileType) return;
    if (!note.content.trim()) {
      requestAnimationFrame(() => editor.commands.focus("start"));
    }
  }, [note?.id, note?.content, editor]);

  useEffect(() => {
    if (!editor) return;
    const noteContent = note?.content ?? "";
    const parsed = parseEditorContent(noteContent);

    // For JSON content, compare by JSON string to avoid spurious re-renders
    if (isTiptapJson(noteContent)) {
      if (JSON.stringify(editor.getJSON()) === noteContent) return;
    } else {
      if (editor.getHTML() === parsed) return;
    }

    syncingFromNote.current = true;
    editor.commands.setContent(parsed as string);
    syncingFromNote.current = false;
  }, [editor, note?.id, note?.content]);

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
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === "s") {
        e.preventDefault();
        handleSaveFile();
        return;
      }
      if (e.shiftKey && e.key === "L") {
        e.preventDefault();
        handleFixLanguage();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [note, editor]);
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
    // For plain text, store as plain text directly
    // For markdown, parse and store as HTML
    const content = format === "plain" ? text : marked.parse(text, { async: false, gfm: true, breaks: true }) as string;
    onUpdate(note.id, { content, contentFormat: format });
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

  const getContentToSave = (targetExt?: "md" | "txt" | "html"): string => {
    if (!note) return "";
    const format = targetExt === "html" ? "html" : targetExt ? (targetExt === "txt" ? "plain" : "markdown") : getContentFormat();
    const content = note.content;

    // For JSON-stored notes, always use the live editor HTML as the source for export
    const htmlContent = isTiptapJson(content) ? (editor?.getHTML() ?? "") : content;

    if (format === "html") {
      return note.contentFormat === "html" ? content : (editor?.getHTML() ?? content);
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
      if (isLikelyHtml(htmlContent)) return getMarkdownFromHtml(htmlContent);
      return htmlContent;
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
    if (!note) return;

    const existingHandle = fileHandleByNoteIdRef.current[note.id];
    if (!existingHandle?.createWritable) return;

    try {
      const permission = await requestPermissionIfAvailable(existingHandle, "readwrite");
      if (permission !== "granted") {
        if (!isSilent) downloadMarkdown(content, ext);
        return;
      }

      const writable = await existingHandle.createWritable();
      await writable.write(content);
      await writable.close();
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
    } catch (error) {
      console.error("Save to existing file failed", error);
      // If file is missing, clear the link and fallback to download
      if ((error as Error)?.name === "NotFoundError" || (error as Error)?.name === "NotAllowedError") {
        await clearLinkedMetadata();
      }
      if (!isSilent) downloadMarkdown(content, ext);
    }
  };

  const performSaveAs = async (content: string, ext: "md" | "txt" | "html") => {
    if (!note) return;

    if (!canUseNativeFs()) {
      downloadMarkdown(content, ext);
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
        const createdNote = onCreate(note.folderPath ?? undefined);
        targetNoteId = createdNote.id;
        onUpdate(targetNoteId, {
          content: ext === "txt" ? content : note.content,
          contentFormat: ext === "txt" ? "plain" : ext === "html" ? "html" : "markdown",
          isLinkedFile: false,
          fileName: undefined,
        });
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
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Save file failed", error);
      }
      downloadMarkdown(content, ext);
    }
  };

  const handleSaveFile = async () => {
    if (!note) return;

    const existingHandle = fileHandleByNoteIdRef.current[note.id] ?? (await getStoredFileHandle(note.id));
    const ext = getPreferredExtension() as "md" | "txt" | "html";
    const content = getContentToSave(ext);

    if (!existingHandle?.createWritable) {
      setPendingSaveAction("saveas");
      setExtensionDialogOpen(true);
      return;
    }

    await performSave(content, ext);
  };

  const handleExtensionSelected = async (ext: "md" | "txt" | "html") => {
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
  };

  const handleDeleteNote = async () => {
    if (!note) return;

    const linkedHandle = fileHandleByNoteIdRef.current[note.id] ?? (await getStoredFileHandle(note.id));

    if (linkedHandle) {
      const extLinkedHandle = linkedHandle as ExtendedFileSystemHandle;
      if (typeof extLinkedHandle.remove !== "function") {
        showUiAlert(t("editor.deleteNotSupported"));
        return;
      }

      try {
        const permission = await requestPermissionIfAvailable(linkedHandle, "readwrite");
        if (permission !== "granted") {
          showUiAlert(t("editor.deletePermissionDenied"));
          return;
        }

        await extLinkedHandle.remove();
        await clearLinkedMetadata();
      } catch (error) {
        console.error("Delete linked file failed", error);
        showUiAlert(t("editor.deleteFailed"));
        return;
      }
    }

    onDelete(note.id);
    setDeleteConfirmOpen(false);
  };

  useEffect(() => {
    if (!note || !canUseNativeFs()) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    const hydrateHandle = async () => {
      const storedHandle = await getStoredFileHandle(note.id);
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

  if (!note) {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground relative">
          <p className="text-sm">{t("editor.selectOrCreate")}</p>
          <Button type="button" className="gap-2" onClick={() => onCreate?.()}>
            <Plus className="h-4 w-4" />
            {t("sidebar.newNote")}
          </Button>
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

  const getExportBaseName = () => {
    const name = note.fileName || note.title?.trim() || t("editor.untitled");
    const dotIdx = name.lastIndexOf(".");
    return dotIdx > 0 ? name.slice(0, dotIdx) : name;
  };

  const handleExportPdf = () => {
    const content = editor?.getHTML() ?? note.content;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${displayFileName}</title>` +
      `<style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;}` +
      `h1,h2,h3{margin-top:1.2em;}pre{background:#f4f4f4;padding:1em;border-radius:4px;overflow:auto;}` +
      `code{background:#f4f4f4;padding:.2em .4em;border-radius:3px;}blockquote{border-left:4px solid #ccc;margin:0;padding-left:1em;color:#666;}</style>` +
      `</head><body>${content}</body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExportWord = () => {
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
  };

  return (
    <>
      <TooltipProvider delayDuration={420}>
      <div className="flex min-h-0 flex-1 flex-col bg-background relative">
        {/* ...ปุ่ม close split เดิมถูกลบออก... */}
        <div className="border-b border-border px-3 py-3 sm:px-4 md:px-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3 md:hidden">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.08em] text-muted-foreground">NOTES+</p>
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
          {note.contentFormat === "html" && (
            <div className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <FileCode className="h-4 w-4" />
              <span>HTML Editor</span>
            </div>
          )}
          {/* Hide toolbar if not txt or md */}
          {((note.fileName?.toLowerCase().endsWith('.txt') || note.fileName?.toLowerCase().endsWith('.md') || note.fileName?.toLowerCase().endsWith('.markdown')) || (!note.fileName && (note.contentFormat === 'markdown' || note.contentFormat === 'plain'))) ? (() => {
            const TOOLBAR_ITEMS: Array<{
              id: string;
              group: "history" | "heading" | "inline" | "list" | "block" | "media";
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
              { id: "blockquote", group: "block", labelKey: "editor.blockquote" },
              { id: "table", group: "block", labelKey: "editor.insertTable" },
              { id: "emoji", group: "media", labelKey: "editor.insertEmoji" },
              { id: "link", group: "media", labelKey: "editor.link" },
              { id: "image", group: "media", labelKey: "editor.insertImageByUrl" },
              { id: "fixLanguage", group: "media", labelKey: "editor.fixLanguage" },
            ];

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
                          <Languages className="h-4 w-4" />
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
                      <Languages className="mr-2 h-4 w-4" />
                      <span>{t("editor.fixLanguage")}</span>
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

        <div className="hidden min-w-0 self-start rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground relative lg:block lg:justify-self-center lg:self-auto">
          <span className="flex items-center gap-2">
            {(note.fileType === "image" || note.fileType === "binary") ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : isSaved ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <CircleDotDashedIcon className="h-4 w-4 shrink-0 text-amber-600" />
            )}
            <span className="sr-only">{saveStatusLabel}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="block max-w-[296px] truncate xl:max-w-[356px] cursor-pointer" tabIndex={0}>{displayFileName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl px-0 py-2 absolute right-[-1rem] top-full z-50 mt-2">
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
      {/* File Info Dropdown now handled inline above */}

        <div className={`flex w-full shrink-0 items-center justify-between gap-1 ${isMobile ? "order-1 pt-0" : "pt-1"} lg:w-auto lg:justify-self-end lg:justify-end lg:pt-0`}>
          {!onCloseSplit && !isSidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full" onClick={onOpenSidebar}>
                  <PanelRightCloseIcon className="h-4 w-4" />
                  <span className="sr-only">{t("editor.showSidebar")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.showSidebar")}</TooltipContent>
            </Tooltip>
          )}

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="ml-auto flex items-center gap-1">
          {note.contentFormat === "html" && (
          <Tooltip>
          <TooltipTrigger asChild>
          <Button
            type="button"
            variant={htmlPreviewOpen ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setHtmlPreviewOpen((v) => !v)}
          >
            {htmlPreviewOpen ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="sr-only">Preview</span>
          </Button>
          </TooltipTrigger>
          <TooltipContent>{htmlPreviewOpen ? t("editor.hidePreview") : t("editor.showPreview")}</TooltipContent>
          </Tooltip>
          )}
          <DropdownMenu>
            <Tooltip>
            <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full">
                <Save className="h-4 w-4" />
                <span className="sr-only">{t("editor.saveFile")}</span>
              </Button>
            </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t("editor.saveFile")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48 rounded-xl px-0 py-2">
              <DropdownMenuItem onClick={() => void handleSaveFile()} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <Save className="h-4 w-4" />
                <span>{t("editor.save")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setPendingSaveAction("saveas"); setExtensionDialogOpen(true); }} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <File className="h-4 w-4" />
                <span>{t("editor.saveAs")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <Tooltip>
            <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full">
                <Download className="h-4 w-4" />
                <span className="sr-only">{t("editor.exportFile")}</span>
              </Button>
            </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t("editor.exportFile")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52 rounded-xl px-0 py-2">
              <DropdownMenuItem onClick={handleExportPdf} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>{t("editor.exportPdf")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportWord} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FileCode className="h-4 w-4" />
                <span>{t("editor.exportWord")}</span>
              </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportDocxDialogOpen(true)} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                  <FileImage className="h-4 w-4" />
                  <span>Import docx</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Tooltip>
          <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
            onClick={() => {
              if (settings.confirmBeforeDelete) {
                setDeleteConfirmOpen(true);
              } else {
                void handleDeleteNote();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t("editor.deleteNote")}</span>
          </Button>
          </TooltipTrigger>
          <TooltipContent>{t("editor.deleteNote")}</TooltipContent>
          </Tooltip>
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
        <div className={`flex flex-col ${note.contentFormat === "html" ? "flex-1 min-h-0" : "flex-1 overflow-y-auto"} ${note.contentFormat === "html" && htmlPreviewOpen ? "md:w-1/2" : ""}`}>
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
            <HtmlCodeEditor
              key={note.id}
              value={note.content}
              onChange={(val) => onUpdate(note.id, { content: val })}
              fontSize={editorFontSize}
            />
          ) : (
            <div className="flex min-h-full w-full flex-col px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:px-4 sm:py-5 sm:pb-24 md:px-5 md:py-8 lg:px-6 lg:py-10 lg:pb-10">
              {editor && <TableInteractiveOverlay editor={editor} />}
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
        {note.contentFormat === "html" && htmlPreviewOpen && (
          <div className="flex-1 border-t border-border md:border-t-0 md:border-l overflow-hidden flex flex-col md:w-1/2">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
              <div className="flex items-center gap-2">
                <Play className="h-3 w-3" />
                <span>Run</span>
              </div>
              <button
                type="button"
                onClick={openHtmlPreviewInNewTab}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Open HTML in browser"
                title="Open HTML in browser"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            <iframe
              className="flex-1 w-full bg-white"
              srcDoc={note.contentFormat === "html" ? previewHtml || note.content : (editor?.getHTML() ?? note.content)}
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      {note && (
        <div className="flex h-7 w-full shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-3 text-[11px] text-muted-foreground select-none overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <span>{`Ln ${editorStats.line}, Col ${editorStats.col}`}</span>
            <div className="h-3 w-[1px] bg-border/60" />
            <span>{`${editorStats.charCount} ${t("editor.charCountUnit")}`}</span>
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="flex max-h-[86vh] flex-col rounded-2xl p-6 sm:p-7 sm:max-w-2xl">
          <DialogHeader className="pt-1 pb-1">
            <DialogTitle className="text-2xl font-semibold leading-normal pt-1">{t("settings.title")}</DialogTitle>
            <DialogDescription className="leading-relaxed">{t("settings.description")}</DialogDescription>
          </DialogHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto space-y-6 px-2 py-1.5">
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                {t("settings.colorScheme")}
              </label>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((scheme) => {
                  const Icon = scheme === "light" ? Sun : scheme === "dark" ? Moon : Monitor;
                  const label = t(`settings.colorScheme${scheme.charAt(0).toUpperCase()}${scheme.slice(1)}`);
                  return (
                    <button
                      key={scheme}
                      type="button"
                      onClick={() => updateSetting("colorScheme", scheme)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                        settings.colorScheme === scheme
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                {t("settings.theme")}
              </label>
              <div className="flex flex-wrap gap-2.5 p-1">
                {APP_THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    style={{ backgroundColor: th.color }}
                    title={t(`settings.theme${th.id.charAt(0).toUpperCase()}${th.id.slice(1)}`)}
                    onClick={() => updateSetting("theme", th.id)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      settings.theme === th.id
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="modal-language" className="mb-2 block text-sm font-medium text-foreground">
                {t("settings.language")}
              </label>
              <Select value={settings.language} onValueChange={(v) => updateSetting("language", v === "th" ? "th" : "en")}>
                <SelectTrigger id="modal-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("settings.english")}</SelectItem>
                  <SelectItem value="th">{t("settings.thai")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="modal-fontFamily" className="mb-2 block text-sm font-medium text-foreground">
                {t("settings.fontFamily")}
              </label>
              <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v as "inter" | "system" | "serif" | "mono" | "prompt")}>
                <SelectTrigger id="modal-fontFamily" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">{t("settings.fontInter")}</SelectItem>
                  <SelectItem value="system">{t("settings.fontSystem")}</SelectItem>
                  <SelectItem value="serif">{t("settings.fontSerif")}</SelectItem>
                  <SelectItem value="mono">{t("settings.fontMono")}</SelectItem>
                  <SelectItem value="prompt">{t("settings.fontPrompt")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="modal-editorFontSize" className="text-sm font-medium text-foreground">
                  {t("settings.editorFontSize")}
                </label>
                <span className="text-xs text-muted-foreground">{settings.editorFontSize}px</span>
              </div>
              <Select value={String(settings.editorFontSize)} onValueChange={(v) => updateSetting("editorFontSize", Number(v))}>
                <SelectTrigger id="modal-editorFontSize" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <div>
                  <label htmlFor="modal-autoSave" className="text-sm font-medium text-foreground">
                    {t("settings.autoSave")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">{t("settings.autoSaveDescription")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {settings.autoSave ? t("settings.enabled") : t("settings.disabled")}
                  </span>
                  <Switch
                    id="modal-autoSave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting("autoSave", checked)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <div>
                  <label htmlFor="modal-confirmBeforeDelete" className="text-sm font-medium text-foreground">
                    {t("settings.confirmBeforeDelete")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">{t("settings.confirmBeforeDeleteDescription")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {settings.confirmBeforeDelete ? t("settings.enabled") : t("settings.disabled")}
                  </span>
                  <Switch
                    id="modal-confirmBeforeDelete"
                    checked={settings.confirmBeforeDelete}
                    onCheckedChange={(checked) => updateSetting("confirmBeforeDelete", checked)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Button type="button" variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => setShortcutsDialogOpen(true)}>
                <Keyboard className="h-4 w-4 text-primary" />
                <span>{t("editor.shortcutsTitle")}</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-between sm:space-x-0">
            <Button type="button" variant="outline" onClick={resetSettings}>
              {t("common.reset")}
            </Button>
            <Button type="button" onClick={() => setSettingsOpen(false)}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      </div>
      </TooltipProvider>
    </>
  );
}

