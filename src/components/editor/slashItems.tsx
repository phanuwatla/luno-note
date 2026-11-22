import React from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  Bold,
  CodeXml,
  SquareCode,
  Images,
  ImagePlus,
  Mic,
  Italic,
  Wrench,
  Link2,
  List,
  ListOrdered,
  ChevronsDownUp,
  Undo2,
  Redo2,
  Strikethrough,
  Quote,
  Smile,
  Upload,
  Minus,
  ArrowRight,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Highlighter,
  Maximize2,
  Minimize2,
  BookOpen,
  MessageCircle,
  Languages,
  Calculator,
  Clock,
  History,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  QrCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Video,
  Film,
} from "lucide-react";
import { Heading1Icon } from "@/components/icons/Heading1Icon";
import { Heading2Icon } from "@/components/icons/Heading2Icon";
import { Heading3Icon } from "@/components/icons/Heading3Icon";
import { Heading4Icon } from "@/components/icons/Heading4Icon";
import { Heading5Icon } from "@/components/icons/Heading5Icon";
import { Heading6Icon } from "@/components/icons/Heading6Icon";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { FootnoteIcon } from "@/components/icons/FootnoteIcon";
import { WandSparklesIcon } from "@/components/icons/WandSparklesIcon";
import { SpellCheckIcon } from "@/components/icons/SpellCheckIcon";
import { BriefcaseBusinessIcon } from "@/components/icons/BriefcaseBusinessIcon";
import { PenLineIcon } from "@/components/icons/PenLineIcon";
import type { AiActionType } from "@/lib/geminiApi";
import { handleToggleClick } from "./extensions/editorExtensions";

export type SlashMenuItem = {
  id: string;
  titleKey: string;
  categoryKey?: string;
  icon: React.ReactNode;
  keywords: string[];
  action: (
    editor: TiptapEditor,
    helpers: {
      openLinkDialog: () => void;
      openFootnoteDialog?: () => void;
      openImageDialog: () => void;
      openWorkspaceImageDialog?: () => void;
      triggerImageUpload: () => void;
      openVideoDialog?: () => void;
      openWorkspaceVideoDialog?: () => void;
      triggerVideoUpload?: () => void;
      openAudioRecorder: () => void;
      openQrCodeDialog?: () => void;
      openEmojiPicker?: () => void;
      handleFixLanguage: () => void;
      openTranslator?: () => void;
      openCalculator?: () => void;
      openClock?: () => void;
      triggerAi?: (actionType?: AiActionType) => void;
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

const escHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const insertFootnoteAtSelection = (editor: any, referenceText: string = "") => {
  if (!editor || editor.isDestroyed) return;

  const doc = editor.state.doc;
  const existingNums: number[] = [];

  try {
    // Collect all existing citation numbers across the whole document
    doc.descendants((node: any) => {
      if (node.isText && node.text) {
        const matches = Array.from(node.text.matchAll(/\[\^?(\d+)\]/g));
        for (const m of matches as RegExpMatchArray[]) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n)) existingNums.push(n);
        }
      }
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.attrs?.["data-footnote-ref"]) {
            const n = parseInt(mark.attrs["data-footnote-ref"], 10);
            if (!isNaN(n)) existingNums.push(n);
          }
          if (mark.attrs?.["data-footnote-backref"]) {
            const n = parseInt(mark.attrs["data-footnote-backref"], 10);
            if (!isNaN(n)) existingNums.push(n);
          }
        });
      }
      if (node.attrs?.["data-footnote-def"]) {
        const n = parseInt(node.attrs["data-footnote-def"], 10);
        if (!isNaN(n)) existingNums.push(n);
      }
    });
  } catch {
    const docText = editor.getText();
    const matches = Array.from(docText.matchAll(/\[\^(\d+)\]/g));
    for (const m of matches as RegExpMatchArray[]) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n)) existingNums.push(n);
    }
  }

  let nextNum = 1;
  if (existingNums.length > 0) {
    nextNum = Math.max(...existingNums) + 1;
  }

  const tr = editor.state.tr;
  const cursorPos = editor.state.selection.from;

  // 1. Insert citation [nextNum] at current cursor position
  const citationSchema = editor.schema;
  const supMark = citationSchema.marks.superscript ? citationSchema.marks.superscript.create() : null;
  const linkMark = citationSchema.marks.link.create({
    href: `#fn-${nextNum}`,
    id: `fnref-${nextNum}`,
    "data-footnote-ref": String(nextNum),
    class: "footnote-ref text-primary hover:underline cursor-pointer select-none font-medium px-0.5",
  });
  const marks = supMark ? [linkMark, supMark] : [linkMark];
  const citationText = citationSchema.text(`[${nextNum}]`, marks);
  tr.insert(cursorPos, citationText);

  // 2. Build the definition paragraph: [^nextNum]: referenceText
  const backlink = citationSchema.marks.link.create({
    href: `#fnref-${nextNum}`,
    "data-footnote-backref": String(nextNum),
    class: "footnote-backref text-primary font-medium mr-1 select-none no-underline hover:underline cursor-pointer",
  });
  const prefix = citationSchema.text(`[^${nextNum}]:`, [backlink]);
  const children = [prefix];
  const trimmed = referenceText.trim();
  if (trimmed) {
    children.push(citationSchema.text(" " + trimmed));
  } else {
    children.push(citationSchema.text(" "));
  }

  const defPara = citationSchema.nodes.paragraph.create(
    {
      id: `fn-${nextNum}`,
      "data-footnote-def": String(nextNum),
      class: "footnote-def text-sm text-muted-foreground my-1.5",
    },
    children
  );

  // 3. Append definition to the end of the document preceded by 1 empty line
  const lastChild = tr.doc.lastChild;
  const isLastChildDef =
    lastChild?.type?.name === "paragraph" &&
    (lastChild.attrs?.["data-footnote-def"] ||
      (lastChild.attrs?.["id"]?.startsWith("fn-") ? lastChild.attrs["id"].replace(/^fn-/, "") : null) ||
      /^\s*\[\^[^\]]+\]:/.test(lastChild.textContent || ""));

  const isLastChildEmpty =
    lastChild?.type?.name === "paragraph" &&
    !lastChild.textContent?.trim();

  const docEndPos = tr.doc.content.size;

  if (isLastChildDef) {
    // If the last line is already a footnote definition, append directly below it
    tr.insert(docEndPos, defPara);
  } else if (isLastChildEmpty) {
    // Already has 1 empty line at the end, insert definition after it
    tr.insert(docEndPos, defPara);
  } else {
    // Precede with 1 empty line (empty paragraph), followed by the definition
    const emptyPara = citationSchema.nodes.paragraph.create();
    tr.insert(docEndPos, [emptyPara, defPara]);
  }

  // 4. Move selection to right after the inserted citation [nextNum]
  const afterCitationPos = cursorPos + citationText.nodeSize;
  if (afterCitationPos <= tr.doc.content.size) {
    tr.setSelection(editor.state.selection.constructor.near(tr.doc.resolve(afterCitationPos)));
  }

  editor.view.dispatch(tr);
  editor.view.focus();
};

export const SLASH_ITEMS: SlashMenuItem[] = [
  // 1. History
  {
    id: "undo",
    titleKey: "editor.undo",
    categoryKey: "settings.toolCategoryHistory",
    icon: <Undo2 className="mr-2 h-4 w-4" />,
    keywords: ["undo", "history", "ย้อนกลับ", "เลิกทำ", "ยกเลิก"],
    action: (editor) => editor.chain().focus().undo().run(),
  },
  {
    id: "redo",
    titleKey: "editor.redo",
    categoryKey: "settings.toolCategoryHistory",
    icon: <Redo2 className="mr-2 h-4 w-4" />,
    keywords: ["redo", "history", "ทำซ้ำ", "ทำอีกครั้ง"],
    action: (editor) => editor.chain().focus().redo().run(),
  },

  // 2. Headings
  {
    id: "h1",
    titleKey: "editor.heading1",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading1Icon className="mr-2 h-4 w-4" />,
    keywords: ["h1", "heading1", "header1", "หัวข้อ1", "หัวข้อ 1", "หัวเรื่องใหญ่"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    titleKey: "editor.heading2",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading2Icon className="mr-2 h-4 w-4" />,
    keywords: ["h2", "heading2", "header2", "หัวข้อ2", "หัวข้อ 2", "หัวเรื่องกลาง"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    titleKey: "editor.heading3",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading3Icon className="mr-2 h-4 w-4" />,
    keywords: ["h3", "heading3", "header3", "หัวข้อ3", "หัวข้อ 3", "หัวเรื่องเล็ก"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "h4",
    titleKey: "editor.heading4",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading4Icon className="mr-2 h-4 w-4" />,
    keywords: ["h4", "heading4", "header4", "หัวข้อ4", "หัวข้อ 4"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    id: "h5",
    titleKey: "editor.heading5",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading5Icon className="mr-2 h-4 w-4" />,
    keywords: ["h5", "heading5", "header5", "หัวข้อ5", "หัวข้อ 5"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    id: "h6",
    titleKey: "editor.heading6",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading6Icon className="mr-2 h-4 w-4" />,
    keywords: ["h6", "heading6", "header6", "หัวข้อ6", "หัวข้อ 6"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },

  // 3. Inline Formatting
  {
    id: "bold",
    titleKey: "editor.bold",
    categoryKey: "settings.toolCategoryInline",
    icon: <Bold className="mr-2 h-4 w-4" />,
    keywords: ["bold", "b", "ตัวหนา", "หนา"],
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    titleKey: "editor.italic",
    categoryKey: "settings.toolCategoryInline",
    icon: <Italic className="mr-2 h-4 w-4" />,
    keywords: ["italic", "i", "ตัวเอียง", "เอียง"],
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "underline",
    titleKey: "editor.underline",
    categoryKey: "settings.toolCategoryInline",
    icon: <UnderlineIcon className="mr-2 h-4 w-4" />,
    keywords: ["underline", "u", "ขีดเส้นใต้", "เส้นใต้"],
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    id: "strike",
    titleKey: "editor.strikethrough",
    categoryKey: "settings.toolCategoryInline",
    icon: <Strikethrough className="mr-2 h-4 w-4" />,
    keywords: ["strike", "strikethrough", "s", "ขีดฆ่า"],
    action: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "highlight",
    titleKey: "editor.highlight",
    categoryKey: "settings.toolCategoryInline",
    icon: <Highlighter className="mr-2 h-4 w-4" />,
    keywords: ["highlight", "mark", "hl", "ไฮไลต์", "ไฮไลท์", "เน้นข้อความ", "ป้าย"],
    action: (editor) => editor.chain().focus().toggleHighlight().run(),
  },
  {
    id: "superscript",
    titleKey: "editor.superscript",
    categoryKey: "settings.toolCategoryInline",
    icon: <SuperscriptIcon className="mr-2 h-4 w-4" />,
    keywords: ["superscript", "sup", "ตัวยก", "ยกกำลัง", "x2"],
    action: (editor) => editor.chain().focus().toggleSuperscript().run(),
  },
  {
    id: "subscript",
    titleKey: "editor.subscript",
    categoryKey: "settings.toolCategoryInline",
    icon: <SubscriptIcon className="mr-2 h-4 w-4" />,
    keywords: ["subscript", "sub", "ตัวห้อย", "ห้อย", "x2"],
    action: (editor) => editor.chain().focus().toggleSubscript().run(),
  },
  {
    id: "alignLeft",
    titleKey: "editor.alignLeft",
    categoryKey: "settings.toolCategoryAlign",
    icon: <AlignLeft className="mr-2 h-4 w-4" />,
    keywords: ["align", "left", "alignleft", "ชิดซ้าย", "จัดซ้าย"],
    action: (editor) => editor.chain().focus().setTextAlign("left").run(),
  },
  {
    id: "alignCenter",
    titleKey: "editor.alignCenter",
    categoryKey: "settings.toolCategoryAlign",
    icon: <AlignCenter className="mr-2 h-4 w-4" />,
    keywords: ["align", "center", "aligncenter", "กึ่งกลาง", "จัดกลาง"],
    action: (editor) => editor.chain().focus().setTextAlign("center").run(),
  },
  {
    id: "alignRight",
    titleKey: "editor.alignRight",
    categoryKey: "settings.toolCategoryAlign",
    icon: <AlignRight className="mr-2 h-4 w-4" />,
    keywords: ["align", "right", "alignright", "ชิดขวา", "จัดขวา"],
    action: (editor) => editor.chain().focus().setTextAlign("right").run(),
  },
  {
    id: "alignJustify",
    titleKey: "editor.alignJustify",
    categoryKey: "settings.toolCategoryAlign",
    icon: <AlignJustify className="mr-2 h-4 w-4" />,
    keywords: ["align", "justify", "alignjustify", "กระจายเท่ากัน", "กระจาย"],
    action: (editor) => editor.chain().focus().setTextAlign("justify").run(),
  },

  // 4. Lists
  {
    id: "bulletList",
    titleKey: "editor.bulletList",
    categoryKey: "settings.toolCategoryList",
    icon: <List className="mr-2 h-4 w-4" />,
    keywords: ["bullet", "list", "ul", "รายการ", "จุด"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    titleKey: "editor.numberedList",
    categoryKey: "settings.toolCategoryList",
    icon: <ListOrdered className="mr-2 h-4 w-4" />,
    keywords: ["number", "ordered", "ol", "เลข", "ลำดับ"],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    titleKey: "editor.checkbox",
    categoryKey: "settings.toolCategoryList",
    icon: <ListTodoIcon className="mr-2 h-4 w-4" />,
    keywords: ["todo", "task", "check", "checkbox", "กล่อง", "เช็ค", "ทาสก์"],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },

  // 5. Blocks & Structure
  {
    id: "toggle",
    titleKey: "editor.toggle",
    categoryKey: "settings.toolCategoryBlock",
    icon: <ChevronsDownUp className="mr-2 h-4 w-4" />,
    keywords: ["toggle", "collapse", "details", "พับ", "ย่อย"],
    action: (editor) => handleToggleClick(editor),
  },
  {
    id: "code",
    titleKey: "editor.inlineCode",
    categoryKey: "settings.toolCategoryBlock",
    icon: <CodeXml className="mr-2 h-4 w-4" />,
    keywords: ["code", "inline", "โค้ด", "โค้ดในบรรทัด"],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: "codeBlock",
    titleKey: "editor.codeBlock",
    categoryKey: "settings.toolCategoryBlock",
    icon: <SquareCode className="mr-2 h-4 w-4" />,
    keywords: ["codeblock", "code", "block", "โค้ด", "บล็อกโค้ด"],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "blockquote",
    titleKey: "editor.blockquote",
    categoryKey: "settings.toolCategoryBlock",
    icon: <Quote className="mr-2 h-4 w-4" />,
    keywords: ["quote", "blockquote", "คำพูด", "อ้างอิง"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "footnote",
    titleKey: "editor.footnote",
    categoryKey: "settings.toolCategoryBlock",
    icon: <FootnoteIcon className="mr-2 h-4 w-4" />,
    keywords: ["footnote", "note", "fn", "เชิงอรรถ", "อ้างอิงท้ายหน้า", "อ้างอิง", "reference"],
    action: (editor, helpers) => {
      if (helpers.openFootnoteDialog) {
        helpers.openFootnoteDialog();
      } else {
        insertFootnoteAtSelection(editor);
      }
    },
  },
  {
    id: "horizontalRule",
    titleKey: "editor.horizontalRule",
    categoryKey: "settings.toolCategoryBlock",
    icon: <Minus className="mr-2 h-4 w-4" />,
    keywords: ["hr", "horizontal", "rule", "line", "divider", "เส้นแบ่ง", "เส้น", "คั่น"],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table",
    titleKey: "editor.insertTable",
    categoryKey: "settings.toolCategoryBlock",
    icon: <TableIcon className="mr-2 h-4 w-4" />,
    keywords: ["table", "grid", "ตาราง", "แถว", "คอลัมน์"],
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // 6. Media & Tools
  {
    id: "link",
    titleKey: "editor.link",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Link2 className="mr-2 h-4 w-4" />,
    keywords: ["link", "url", "ลิงก์"],
    action: (_editor, helpers) => helpers.openLinkDialog(),
  },
  {
    id: "imageUrl",
    titleKey: "editor.insertImageByUrl",
    categoryKey: "settings.toolCategoryMedia",
    icon: <ImagePlus className="mr-2 h-4 w-4" />,
    keywords: ["image", "img", "photo", "pic", "รูป", "ภาพ", "url"],
    action: (_editor, helpers) => helpers.openImageDialog(),
  },
  {
    id: "imageWorkspace",
    titleKey: "editor.insertImageFromWorkspace",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Images className="mr-2 h-4 w-4" />,
    keywords: ["image", "workspace", "attachment", "attachments", "รูป", "ไฟล์แนบ", "คลังภาพ"],
    action: (_editor, helpers) => helpers.openWorkspaceImageDialog?.(),
  },
  {
    id: "imageUpload",
    titleKey: "editor.uploadImage",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Upload className="mr-2 h-4 w-4" />,
    keywords: ["upload", "file", "image", "img", "อัปโหลด", "อัพโหลด", "รูป", "ไฟล์"],
    action: (_editor, helpers) => helpers.triggerImageUpload(),
  },
  {
    id: "videoUrl",
    titleKey: "editor.insertVideoByUrl",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Film className="mr-2 h-4 w-4" />,
    keywords: ["video", "vid", "movie", "clip", "วิดีโอ", "คลิป", "หนัง", "url"],
    action: (_editor, helpers) => helpers.openVideoDialog?.(),
  },
  {
    id: "videoWorkspace",
    titleKey: "editor.insertVideoFromWorkspace",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Video className="mr-2 h-4 w-4" />,
    keywords: ["video", "workspace", "attachment", "attachments", "วิดีโอ", "ไฟล์แนบ", "คลังวิดีโอ"],
    action: (_editor, helpers) => helpers.openWorkspaceVideoDialog?.(),
  },
  {
    id: "videoUpload",
    titleKey: "editor.uploadVideo",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Upload className="mr-2 h-4 w-4" />,
    keywords: ["upload", "file", "video", "vid", "อัปโหลด", "อัพโหลด", "วิดีโอ", "ไฟล์"],
    action: (_editor, helpers) => helpers.triggerVideoUpload?.(),
  },
  {
    id: "qrCode",
    titleKey: "editor.qrCode",
    categoryKey: "settings.toolCategoryMedia",
    icon: <QrCode className="mr-2 h-4 w-4" />,
    keywords: ["qr", "qrcode", "คิวอาร์", "บาร์โค้ด", "สแกน", "คิวอาร์โค้ด"],
    action: (_editor, helpers) => helpers.openQrCodeDialog?.(),
  },
  {
    id: "emoji",
    titleKey: "editor.insertEmoji",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Smile className="mr-2 h-4 w-4" />,
    keywords: ["emoji", "smile", "อิโมจิ", "ยิ้ม"],
    action: (_editor, helpers) => helpers.openEmojiPicker?.(),
  },
  {
    id: "audio",
    titleKey: "editor.recordAudio",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Mic className="mr-2 h-4 w-4" />,
    keywords: ["audio", "record", "voice", "sound", "mic", "อัดเสียง", "เสียง", "บันทึกเสียง", "ไมค์"],
    action: (_editor, helpers) => helpers.openAudioRecorder(),
  },
  {
    id: "calculator",
    titleKey: "editor.calculator",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Calculator className="mr-2 h-4 w-4" />,
    keywords: ["calculator", "calc", "math", "เครื่องคิดเลข", "คำนวณ", "เลข"],
    action: (_editor, helpers) => helpers.openCalculator?.(),
  },
  {
    id: "translator",
    titleKey: "editor.translator",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Languages className="mr-2 h-4 w-4" />,
    keywords: ["translate", "translator", "language", "แปล", "แปลภาษา", "ดิกชันนารี", "ภาษา"],
    action: (_editor, helpers) => helpers.openTranslator?.(),
  },
  {
    id: "clock",
    titleKey: "editor.clock",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Clock className="mr-2 h-4 w-4" />,
    keywords: ["clock", "timer", "stopwatch", "time", "นาฬิกา", "จับเวลา", "เวลา"],
    action: (_editor, helpers) => helpers.openClock?.(),
  },
  {
    id: "fixLanguage",
    titleKey: "editor.fixLanguage",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Wrench className="mr-2 h-4 w-4" />,
    keywords: ["fix", "lang", "language", "th", "en", "ซ่อม", "ภาษา", "แก้แป้นพิมพ์"],
    action: (_editor, helpers) => helpers.handleFixLanguage(),
  },

  // 7. AI Assistant
  {
    id: "aiImprove",
    titleKey: "settings.aiImprove",
    categoryKey: "settings.toolCategoryAi",
    icon: <WandSparklesIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "improve", "เขียนดีขึ้น", "ปรับปรุง", "เกลา", "เอไอ"],
    action: (_editor, helpers) => helpers.triggerAi?.("improve"),
  },
  {
    id: "aiFixGrammar",
    titleKey: "settings.aiFixGrammar",
    categoryKey: "settings.toolCategoryAi",
    icon: <SpellCheckIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "grammar", "spell", "ไวยากรณ์", "สะกด", "ตรวจคำผิด"],
    action: (_editor, helpers) => helpers.triggerAi?.("fix_grammar"),
  },
  {
    id: "aiMakeShorter",
    titleKey: "settings.aiMakeShorter",
    categoryKey: "settings.toolCategoryAi",
    icon: <Minimize2 className="mr-2 h-4 w-4" />,
    keywords: ["ai", "short", "shorter", "summarize", "ย่อ", "สั้นลง", "สรุป"],
    action: (_editor, helpers) => helpers.triggerAi?.("make_shorter"),
  },
  {
    id: "aiMakeLonger",
    titleKey: "settings.aiMakeLonger",
    categoryKey: "settings.toolCategoryAi",
    icon: <Maximize2 className="mr-2 h-4 w-4" />,
    keywords: ["ai", "long", "longer", "expand", "ขยาย", "ยาวขึ้น", "เพิ่มรายละเอียด"],
    action: (_editor, helpers) => helpers.triggerAi?.("make_longer"),
  },
  {
    id: "aiSimplify",
    titleKey: "settings.aiSimplify",
    categoryKey: "settings.toolCategoryAi",
    icon: <BookOpen className="mr-2 h-4 w-4" />,
    keywords: ["ai", "simplify", "เข้าใจง่าย", "ภาษาเรียบง่าย"],
    action: (_editor, helpers) => helpers.triggerAi?.("simplify"),
  },
  {
    id: "aiFormalize",
    titleKey: "settings.aiFormalize",
    categoryKey: "settings.toolCategoryAi",
    icon: <BriefcaseBusinessIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "formal", "formalize", "ทางการ", "ภาษาทางการ"],
    action: (_editor, helpers) => helpers.triggerAi?.("formalize"),
  },
  {
    id: "aiMakeCasual",
    titleKey: "settings.aiMakeCasual",
    categoryKey: "settings.toolCategoryAi",
    icon: <MessageCircle className="mr-2 h-4 w-4" />,
    keywords: ["ai", "casual", "เป็นกันเอง", "ภาษาสนทนา"],
    action: (_editor, helpers) => helpers.triggerAi?.("make_casual"),
  },
  {
    id: "aiTranslate",
    titleKey: "settings.aiTranslate",
    categoryKey: "settings.toolCategoryAi",
    icon: <Languages className="mr-2 h-4 w-4" />,
    keywords: ["ai", "translate", "แปล", "แปลภาษา", "อังกฤษ", "ไทย"],
    action: (_editor, helpers) => helpers.triggerAi?.("translate"),
  },
  {
    id: "aiContinueWriting",
    titleKey: "settings.aiContinueWriting",
    categoryKey: "settings.toolCategoryAi",
    icon: <ArrowRight className="mr-2 h-4 w-4" />,
    keywords: ["ai", "continue", "write", "เขียนต่อ", "ต่อข้อความ"],
    action: (_editor, helpers) => helpers.triggerAi?.("continue_writing"),
  },
  {
    id: "aiRewrite",
    titleKey: "settings.aiRewrite",
    categoryKey: "settings.toolCategoryAi",
    icon: <PenLineIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "rewrite", "เขียนใหม่", "เรียบเรียงใหม่", "สำนวนใหม่"],
    action: (_editor, helpers) => helpers.triggerAi?.("rewrite"),
  },
];
