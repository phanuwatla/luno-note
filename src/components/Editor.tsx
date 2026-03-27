import HtmlCodeEditor from "@/components/HtmlCodeEditor";
import { Note } from "@/hooks/useNotes";
import {
  Bold,
  CheckCircle2,
  Circle,
  Code,
  Download,
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
  Monitor,
  Moon,
  MoreHorizontal,
  ClipboardList,
  Plus,
  Undo2,
  Redo2,
  Strikethrough,
  Quote,
  Upload,
  Trash2,
  Settings,
  Sun,
  Play,
  Pause,
  Save,
  X
} from "lucide-react";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { marked } from "marked";
import TurndownService from "turndown";
import { canUseNativeFileSystem, getStoredFileHandle, removeStoredFileHandle, setStoredFileHandle } from "@/lib/fileHandles";
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

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

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

interface EditorProps {
  note: Note | null;
  onUpdate: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => boolean;
  onCreate?: (folderPath?: string) => Note;
  onOpenSidebar?: () => void;
  isSidebarOpen?: boolean;
  editorFontSize?: number;
  isMobile?: boolean;
  onCloseSplit?: () => void; // เพิ่ม prop สำหรับปิด split
}

type SaveSnapshot = {
  ext: "md" | "txt" | "html";
  content: string;
};

export default function Editor(props: EditorProps & { notes?: any[] }) {
  const { note, onUpdate, onDelete, onCreate, onOpenSidebar, isSidebarOpen = false, editorFontSize = 15, isMobile = false, notes, onCloseSplit } = props;
    const [importDocxDialogOpen, setImportDocxDialogOpen] = useState(false);
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
          updated = true;
        }
        // กรณี openfolder หรือ note ถูกสร้างจากไฟล์ในระบบ: ค้นหา note ที่ fileName ตรงกับไฟล์ docx แล้ว update ซ้ำ
        if (!updated && file.name) {
          // ลองค้นหา notes จาก props (ถ้ามี)
          if (typeof window !== 'undefined') {
            let notesArr = [];
            if ((window as any).notesPlusNotes) {
              notesArr = (window as any).notesPlusNotes;
            } else if ((window as any).notes) {
              notesArr = (window as any).notes;
            } else if (typeof (window as any).getNotes === 'function') {
              notesArr = (window as any).getNotes();
            }
            const found = notesArr.find((n: any) => n.fileName === file.name);
            if (found) {
              onUpdate(found.id, { content: html, contentFormat: "html", fileType: undefined });
              updated = true;
            }
          }
        }
        // fallback: ถ้า notes ถูกส่งมาทาง props
        if (!updated && Array.isArray((props as any).notes)) {
          const found = (props as any).notes.find((n: any) => n.fileName === file.name);
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileToolbarAreaRef = useRef<HTMLDivElement>(null);
  const syncingFromNote = useRef(false);
  const fileHandleByNoteIdRef = useRef<Record<string, any>>({});
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileToolbarWidth, setMobileToolbarWidth] = useState(0);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const { t } = useTranslation();

  const MOBILE_FULL_TOOLBAR_MIN_WIDTH = 508;

  const turndown = useMemo(() => {
    const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

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
      replacement: (_content: string, node: Node) => {
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

    // Legacy format: <li class="task-list-item"> (notes saved before this fix)
    td.addRule("legacyTaskItem", {
      filter: (node: HTMLElement) =>
        node.nodeName === "LI" && node.classList.contains("task-list-item"),
      replacement: (_content: string, node: Node) => {
        const li = node as HTMLElement;
        const checkbox = li.querySelector('input[type="checkbox"]');
        const checked = checkbox ? ((checkbox as HTMLInputElement).checked ? "x" : " ") : " ";
        const contentSpan = li.querySelector(".task-list-item-content");
        const text = contentSpan ? contentSpan.textContent?.trim() ?? "" : "";
        return `- [${checked}] ${text}\n`;
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
    `<label contenteditable="false"><input type="checkbox"${isChecked ? " checked" : ""} style="width:16px;height:16px;"><span></span></label>` +
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

  const toEditorHtml = (text: string): string => {
    if (!text.trim()) return "<h1></h1><p></p>";

    if (isLikelyHtml(text)) {
      // Already in Tiptap native format — return as-is
      if (text.includes('data-type="taskList"') || text.includes("data-type='taskList'")) return text;
      // Migrate legacy HTML (<li class="task-list-item">) to Tiptap format
      if (!text.includes("task-list-item")) return text;
      const temp = document.createElement("div");
      temp.innerHTML = text;
      migrateDomTaskLists(temp);
      return temp.innerHTML;
    }

    // Let marked handle all markdown → HTML (including GFM task lists with <input type="checkbox">)
    const html = marked.parse(text, { async: false, gfm: true, breaks: true }) as string;

    // Post-process: convert marked's GFM checkbox output to Tiptap's native taskList format
    const temp = document.createElement("div");
    temp.innerHTML = html;
    migrateDomTaskLists(temp);
    return temp.innerHTML;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem,
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
        placeholder: ({ node, pos }) => {
          if (node.type.name === "heading" && pos === 0) {
            return t("editor.untitled");
          }
          return isMobile ? t("editor.startWritingMobile") : t("editor.startWriting");
        },
        showOnlyCurrent: false,
        includeChildren: true,
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
      }),
    ],
    content: parseEditorContent(note?.content ?? ""),
    editorProps: {
      attributes: {
        style: `font-size:${editorFontSize}px;`,
        class:
          "min-h-[60vh] md:min-h-[70vh] outline-none leading-7 text-foreground [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)] [&>*:first-child]:mb-3 [&>*:first-child]:text-2xl [&>*:first-child]:font-semibold [&>*:first-child]:leading-tight [&>*:first-child]:md:text-3xl [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_p]:leading-7 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6" +
          " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-2 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:mt-2 [&_ul[data-type='taskList']_li_label_input]:h-3 [&_ul[data-type='taskList']_li_label_input]:w-3 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0",
      },
    },
    onUpdate: ({ editor: instance }) => {
      if (!note || syncingFromNote.current) return;
      onUpdate(note.id, { content: JSON.stringify(instance.getJSON()) });
    },
  });

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
          class:
            "min-h-[60vh] md:min-h-[70vh] outline-none leading-7 text-foreground [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)] [&>*:first-child]:mb-3 [&>*:first-child]:text-2xl [&>*:first-child]:font-semibold [&>*:first-child]:leading-tight [&>*:first-child]:md:text-3xl [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_p]:leading-7 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6" +
            " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-2 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:mt-[3px] [&_ul[data-type='taskList']_li_label_input]:h-4 [&_ul[data-type='taskList']_li_label_input]:w-4 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0",
        },
      },
    });
  }, [editor, editorFontSize]);

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

  const performSave = async (content: string, ext: "md" | "txt" | "html") => {
    if (!note) return;

    const existingHandle = fileHandleByNoteIdRef.current[note.id];
    if (!existingHandle?.createWritable) return;

    try {
      if (typeof existingHandle.requestPermission === "function") {
        const permission = await existingHandle.requestPermission({ mode: "readwrite" });
        if (permission !== "granted") {
          downloadMarkdown(content, ext);
          return;
        }
      }

      const writable = await existingHandle.createWritable();
      await writable.write(content);
      await writable.close();
      await setStoredFileHandle(note.id, existingHandle);
      const savedFile = await existingHandle.getFile();
      updateLinkedMetadata(note.id, savedFile.name);
      toast({
        title: t("editor.saveToastTitle"),
        description: t("editor.saveToastSuccess", { file: savedFile.name }),
      });
      setSavedSnapshot(note.id, ext, content);
    } catch (error) {
      console.error("Save to existing file failed", error);
      // If file is missing, clear the link and fallback to download
      if ((error as any)?.name === "NotFoundError" || (error as any)?.name === "NotAllowedError") {
        await clearLinkedMetadata();
      }
      downloadMarkdown(content, ext);
    }
  };

  const performSaveAs = async (content: string, ext: "md" | "txt" | "html") => {
    if (!note) return;

    if (!canUseNativeFs()) {
      downloadMarkdown(content, ext);
      return;
    }

    try {
      const w = window as any;
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
      const removeFn = linkedHandle.remove;
      if (typeof removeFn !== "function") {
        showUiAlert(t("editor.deleteNotSupported"));
        return;
      }

      try {
        if (typeof linkedHandle.requestPermission === "function") {
          const permission = await linkedHandle.requestPermission({ mode: "readwrite" });
          if (permission !== "granted") {
            showUiAlert(t("editor.deletePermissionDenied"));
            return;
          }
        }

        await linkedHandle.remove();
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
        if (typeof storedHandle.requestPermission === "function") {
          const permission = await storedHandle.requestPermission({ mode: "read" });
          if (permission !== "granted") return;
        }

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
                <DropdownMenuContent align="end" className="w-64 rounded-xl px-0 py-2 absolute right-[-0.8rem] top-full z-50 mt-2">
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
          {((note.fileName?.toLowerCase().endsWith('.txt') || note.fileName?.toLowerCase().endsWith('.md') || note.fileName?.toLowerCase().endsWith('.markdown')) || (!note.fileName && (note.contentFormat === 'markdown' || note.contentFormat === 'plain'))) ? (
            <div className={`flex w-fit items-center gap-1 rounded-full border border-border bg-secondary p-1`}>
              {/* Undo / Redo */}
              <Tooltip>
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
              <Tooltip>
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

              <div className="hidden h-4 w-px bg-border md:block" />

              {/* Headings */}
              <>
              <Tooltip>
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
              {!shouldUseMobileOverflow && (
              <Tooltip>
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
              )}
              </>

              {!shouldUseMobileOverflow && <div className="hidden h-4 w-px bg-border md:block" />}

              {/* Inline formats */}
              <Tooltip>
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
              <Tooltip>
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
              <Tooltip>
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

              {!shouldUseMobileOverflow && <div className="hidden h-4 w-px bg-border md:block" />}


              {/* Lists */}
              <Tooltip>
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
              <Tooltip>
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
              <Tooltip>
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

              {!isMobile && <div className="hidden h-4 w-px bg-border md:block" />}

              {/* Code / Blockquote */}
              <>
              <Tooltip>
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
              <Tooltip>
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
              </>
              {!shouldUseMobileOverflow && (
              <>
              <Tooltip>
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
              </>
              )}

              {shouldUseMobileOverflow && (
                <DropdownMenu>
                  <Tooltip>
                  <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
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
                  <DropdownMenuContent align="start" className="w-56 rounded-xl px-0 py-2">
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Heading1Icon className="mr-2 h-4 w-4" />
                      <span>{t("editor.heading1")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Heading2Icon className="mr-2 h-4 w-4" />
                      <span>{t("editor.heading2")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleStrike().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Strikethrough className="mr-2 h-4 w-4" />
                      <span>{t("editor.strikethrough")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleTaskList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <ListTodoIcon className="mr-2 h-4 w-4" />
                      <span>{t("editor.checkbox")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openLinkDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Link2 className="mr-2 h-4 w-4" />
                      <span>{t("editor.link")}</span>
                    </DropdownMenuItem>
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
                    <DropdownMenuItem onClick={handleFixLanguage} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      <Languages className="mr-2 h-4 w-4" />
                      <span>{t("editor.fixLanguage")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!shouldUseMobileOverflow && <div className="hidden h-4 w-px bg-border md:block" />}

              {/* Fix Language */}
              {!shouldUseMobileOverflow && (
              <Tooltip>
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
              )}
            </div>
          ) : null}
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
          {!onCloseSplit && (
            <Tooltip>
            <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t("common.settings")}</span>
            </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.settings")}</TooltipContent>
            </Tooltip>
          )}
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
        <div className={`flex flex-col ${note.contentFormat === "html" ? "flex-1 min-h-0" : "no-scrollbar flex-1 overflow-y-auto"} ${note.contentFormat === "html" && htmlPreviewOpen ? "md:w-1/2" : ""}`}>
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
            <div className="flex min-h-full w-full flex-col overflow-y-auto px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:px-4 sm:py-5 sm:pb-24 md:px-5 md:py-8 lg:px-6 lg:py-10 lg:pb-10">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
        {note.contentFormat === "html" && htmlPreviewOpen && (
          <div className="flex-1 border-t border-border md:border-t-0 md:border-l overflow-hidden flex flex-col md:w-1/2">
            <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
              <Play className="h-3 w-3" />
              <span>Run</span>
            </div>
            <iframe
              className="flex-1 w-full bg-white"
              srcDoc={note.contentFormat === "html" ? note.content : (editor?.getHTML() ?? note.content)}
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
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
        <DialogContent className="flex max-h-[86vh] flex-col rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("settings.title")}</DialogTitle>
            <DialogDescription>{t("settings.description")}</DialogDescription>
          </DialogHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto space-y-6 py-1">
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
              <div className="flex flex-wrap gap-2.5">
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
              <select
                id="modal-language"
                value={settings.language}
                onChange={(e) => updateSetting("language", e.target.value === "th" ? "th" : "en")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">{t("settings.english")}</option>
                <option value="th">{t("settings.thai")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="modal-fontFamily" className="mb-2 block text-sm font-medium text-foreground">
                {t("settings.fontFamily")}
              </label>
              <select
                id="modal-fontFamily"
                value={settings.fontFamily}
                onChange={(e) => updateSetting("fontFamily", e.target.value as "inter" | "system" | "serif" | "mono" | "prompt")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="inter">{t("settings.fontInter")}</option>
                <option value="system">{t("settings.fontSystem")}</option>
                <option value="serif">{t("settings.fontSerif")}</option>
                <option value="mono">{t("settings.fontMono")}</option>
                <option value="prompt">{t("settings.fontPrompt")}</option>
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="modal-editorFontSize" className="text-sm font-medium text-foreground">
                  {t("settings.editorFontSize")}
                </label>
                <span className="text-xs text-muted-foreground">{settings.editorFontSize}px</span>
              </div>
              <select
                id="modal-editorFontSize"
                value={settings.editorFontSize}
                onChange={(e) => updateSetting("editorFontSize", Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
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
      </div>
      </TooltipProvider>
    </>
  );
}

