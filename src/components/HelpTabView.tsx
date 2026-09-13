import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  Copy,
  Command,
  Columns,
  Cloud,
  Tag,
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  Calculator,
  Lock,
  FileDown,
  LayoutTemplate,
  Mic,
  Database,
  Search,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { getToolbarIcon } from "@/lib/iconPacks";
import { APP_VERSION, APP_AUTHOR, APP_AUTHOR_URL, APP_ABOUT_CREDIT, openExternalUrl } from "@/lib/appVersion";
import { useAppUpdate } from "@/hooks/useAppUpdate";

export type HelpCategory =
  | "features"
  | "markdown"
  | "shortcuts"
  | "faq"
  | "about";

export const HELP_CATEGORIES: HelpCategory[] = [
  "features",
  "markdown",
  "shortcuts",
  "faq",
  "about",
];

export function isValidHelpCategory(cat: unknown): cat is HelpCategory {
  return typeof cat === "string" && (HELP_CATEGORIES as string[]).includes(cat);
}

interface HelpCategoryMeta {
  id: HelpCategory;
  label: string;
  iconKey: string;
  desc: string;
}

interface HelpTabViewProps {
  onClose?: () => void;
  initialCategory?: HelpCategory;
  onCategoryChange?: (category: HelpCategory) => void;
  onOpenSettings?: (category?: string) => void;
}

export default function HelpTabView({
  initialCategory = "features",
  onCategoryChange,
}: HelpTabViewProps) {
  const { t, language } = useTranslation();
  const { settings } = useAppSettings();
  const appUpdate = useAppUpdate();

  const [activeCategory, setActiveCategory] = useState<HelpCategory>(() => {
    if (isValidHelpCategory(initialCategory) && initialCategory !== "features") return initialCategory;
    try {
      const saved = localStorage.getItem("luno_last_help_category");
      if (isValidHelpCategory(saved)) return saved;
    } catch {}
    return isValidHelpCategory(initialCategory) ? initialCategory : "features";
  });

  useEffect(() => {
    if (isValidHelpCategory(initialCategory)) {
      setActiveCategory(initialCategory);
      try {
        localStorage.setItem("luno_last_help_category", initialCategory);
      } catch {}
    }
  }, [initialCategory]);

  const handleSelectCategory = (catId: HelpCategory) => {
    if (!isValidHelpCategory(catId)) return;
    setActiveCategory(catId);
    try {
      localStorage.setItem("luno_last_help_category", catId);
    } catch {}
    onCategoryChange?.(catId);
  };

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const pack = settings?.iconPack || "lucide";
  const isTh = language === "th" || settings.language === "th";

  const categories: HelpCategoryMeta[] = useMemo(
    () => [
      {
        id: "features",
        label: t("helpModal.tabFeatures") || (isTh ? "ฟีเจอร์และเครื่องมือ" : "Features & Tools"),
        iconKey: "features",
        desc: t("helpModal.description") || (isTh ? "ฟังก์ชันหลัก เมนูลัด และเวิร์กโฟลว์การใช้งาน" : "Core features, slash commands, and editing workflow."),
      },
      {
        id: "markdown",
        label: t("helpModal.tabMarkdown") || (isTh ? "คู่มือ Markdown" : "Markdown Guide"),
        iconKey: "bookOpen",
        desc: t("helpModal.markdownDescription") || (isTh ? "คู่มือไวยากรณ์และรูปแบบคำสั่ง Markdown ทั้งหมด" : "Comprehensive syntax reference for markdown documents."),
      },
      {
        id: "shortcuts",
        label: t("settings.catShortcutsTitle") || (isTh ? "คีย์ลัด" : "Shortcuts"),
        iconKey: "shortcuts",
        desc: t("settings.catShortcutsDesc") || (isTh ? "คีย์ลัดสำหรับนำทางและจัดรูปแบบข้อความทั้งหมด" : "Quick keyboard reference for editing and navigation."),
      },
      {
        id: "faq",
        label: t("helpModal.tabFaq") || (isTh ? "FAQ & ทิปส์" : "FAQ & Tips"),
        iconKey: "helpCircle",
        desc: t("helpModal.faqGeneralDesc") || (isTh ? "คำถามที่พบบ่อยและการแก้ปัญหาเบื้องต้น" : "Frequently asked questions, troubleshooting, and power user tips."),
      },
      {
        id: "about",
        label: t("settings.catAboutTitle") || (isTh ? "เกี่ยวกับ" : "About"),
        iconKey: "about",
        desc: t("settings.catAboutDesc") || (isTh ? "ข้อมูลแอปพลิเคชันและเวอร์ชันปัจจุบัน" : "Version info and app overview."),
      },
    ],
    [t, isTh]
  );

  const safeActiveCategory: HelpCategory = isValidHelpCategory(activeCategory)
    ? activeCategory
    : isValidHelpCategory(initialCategory)
    ? initialCategory
    : "features";

  const currentCategory = categories.find((c) => c.id === safeActiveCategory) || categories[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({
      title: t("editor.copied") || (isTh ? "คัดลอกเรียบร้อยแล้ว" : "Copied to clipboard"),
      description: text,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const featureItems = useMemo(
    () => [
      {
        title: isTh ? "Slash Commands (/)" : "Slash Commands (/)",
        desc: isTh
          ? "พิมพ์เครื่องหมาย / ในบรรทัดว่างเพื่อเปิดเมนูคำสั่งลัด แทรกหัวข้อ ตาราง โค้ดบล็อก เช็คลิสต์ รูปภาพ หรือเครื่องคิดเลขได้ทันที"
          : "Type '/' at the beginning of an empty line to quickly insert headers, tables, code blocks, checklists, or media.",
        icon: Command,
      },
      {
        title: isTh ? "AI Assistant (Luno AI)" : "AI Assistant (Luno AI)",
        desc: isTh
          ? "ผู้ช่วยอัจฉริยะช่วยสรุปเนื้อหา แปลภาษา ปรับแก้ไวยากรณ์ หรือเขียนร่างเอกสารใหม่ เชื่อมต่อโมเดลชั้นนำ"
          : "Intelligent companion to summarize, rewrite, translate, or brainstorm notes using state-of-the-art AI models.",
        icon: Sparkles,
      },
      {
        title: isTh ? "Split View (แบ่งหน้าต่างทำงาน)" : "Split View (Dual Pane)",
        desc: isTh
          ? "เปิดอ่านหรือแก้ไขเอกสาร 2 หน้าพร้อมกันแบบ Side-by-side สะดวกสำหรับการเทียบข้อมูลหรือค้นคว้า"
          : "Work on two notes side-by-side with full independent scrolling and real-time editing.",
        icon: Columns,
      },
      {
        title: isTh ? "Google Drive Cloud Sync" : "Google Drive Cloud Sync",
        desc: isTh
          ? "ซิงก์ข้อมูลเอกสารกับ Google Drive อัตโนมัติ ปลอดภัย ไม่ผ่านเซิร์ฟเวอร์ภายนอก (Direct Sync)"
          : "Direct peer-to-cloud synchronization with your personal Google Drive for total privacy and backup.",
        icon: Cloud,
      },
      {
        title: isTh ? "จัดหมวดหมู่ด้วย Tags & Folders" : "Tags & Folders Organization",
        desc: isTh
          ? "จัดการเอกสารได้อย่างยืดหยุ่นด้วยระบบโฟลเดอร์ในเครื่อง และแท็กหลายมิติเพื่อค้นหาและจัดระเบียบ"
          : "Flexible organization using both real file directory folders and multi-tag categorizations.",
        icon: Tag,
      },
      {
        title: isTh ? "เครื่องมือมัลติมีเดีย (Audio, Clock, Calc)" : "Built-in Utilities",
        desc: isTh
          ? "มีเครื่องบันทึกเสียงและถอดเสียง นาฬิกาจับเวลา และเครื่องคิดเลขฝังในตัวโน้ตเพื่อการทำงานที่ครบวงจร"
          : "Built-in audio recorder with transcription, stopwatch timers, and live in-note calculators.",
        icon: Calculator,
      },
      {
        title: isTh ? "ระบบความปลอดภัยด้วยรหัส PIN" : "PIN Lock Protection",
        desc: isTh
          ? "ตั้งรหัส PIN 6 หลักเพื่อล็อคโน้ตสำคัญที่ต้องการความเป็นส่วนตัว ป้องกันการเปิดอ่านโดยไม่ได้รับอนุญาต"
          : "Secure sensitive notes with 6-digit PIN lock encryption to safeguard confidential thoughts.",
        icon: Lock,
      },
      {
        title: isTh ? "ส่งออกเป็น PDF และสั่งพิมพ์" : "Print & PDF Export",
        desc: isTh
          ? "แปลงโน้ตเป็นเอกสาร PDF รูปแบบสวยงามสะอาดตา หรือสั่งพิมพ์ออกทางเครื่องพิมพ์ได้ทันทีในคลิกเดียว"
          : "Export beautifully formatted notes to clean PDF documents or send directly to physical printers.",
        icon: FileDown,
      },
      {
        title: isTh ? "ระบบแม่แบบเอกสาร (Templates)" : "Document Templates",
        desc: isTh
          ? "สร้างโน้ตใหม่อย่างรวดเร็วจากแม่แบบสำเร็จรูป เช่น บันทึกประจำวัน รายงานการประชุม หรือบันทึกโน้ตของตนเองเป็นแม่แบบ"
          : "Kickstart new notes from built-in templates (Daily Log, Meeting Notes) or save your custom designs.",
        icon: LayoutTemplate,
      },
      {
        title: isTh ? "ค้นหาด่วนทั่วทั้งพื้นที่ทำงาน" : "Global Quick Search",
        desc: isTh
          ? "ค้นหาไฟล์และเนื้อหาภายในโน้ตทั้งหมดได้ทันทีด้วย Ctrl+K หรือ Ctrl+P พร้อมระบบ Highlight ผลการค้นหา"
          : "Instant lightning-fast search across titles and body contents using Ctrl+K / Ctrl+P with live highlights.",
        icon: Search,
      },
      {
        title: isTh ? "บันทึกเสียงในโน้ต (Voice Memos)" : "Audio Recording",
        desc: isTh
          ? "อัดเสียงบันทึกการประชุมหรือไอเดียโดยตรงในโน้ต พร้อมเครื่องเล่นเสียงในตัวและรองรับถอดเสียงอัตโนมัติ"
          : "Record voice memos directly inside notes with a sleek embedded player and speech recognition.",
        icon: Mic,
      },
      {
        title: isTh ? "สำรองและกู้คืนข้อมูล (Local Backup)" : "Data Backup & Safety",
        desc: isTh
          ? "ส่งออกไฟล์สำรอง Zip ทั้งหมดได้ในคลิกเดียว หรือคัดลอกโฟลเดอร์ไฟล์ Markdown เพื่อย้ายเครื่องได้ทันที"
          : "Export complete workspace zip backups in one click, or freely copy markdown files to any device.",
        icon: Database,
      },
    ],
    [isTh]
  );

  const markdownGroups = useMemo(
    () => [
      {
        title: isTh ? "หัวข้อ (Headings)" : "Headings",
        items: [
          { label: isTh ? "หัวข้อหลักขนาดใหญ่ (H1)" : "Large primary heading (H1)", syntax: "# Heading 1" },
          { label: isTh ? "หัวข้อส่วนขนาดกลาง (H2)" : "Medium section heading (H2)", syntax: "## Heading 2" },
          { label: isTh ? "หัวข้อย่อย (H3)" : "Sub-section heading (H3)", syntax: "### Heading 3" },
          { label: isTh ? "หัวข้อย่อยขนาดเล็ก (H4)" : "Small heading (H4)", syntax: "#### Heading 4" },
          { label: isTh ? "หัวข้อย่อยระดับ 5 (H5)" : "Tiny heading (H5)", syntax: "##### Heading 5" },
          { label: isTh ? "หัวข้อย่อยระดับ 6 (H6)" : "Minimal heading (H6)", syntax: "###### Heading 6" },
        ],
      },
      {
        title: isTh ? "การจัดรูปแบบข้อความ (Text Formatting)" : "Text Formatting",
        items: [
          { label: isTh ? "ตัวหนา (Bold)" : "Bold emphasis", syntax: "**bold text**" },
          { label: isTh ? "ตัวเอียง (Italic)" : "Italic emphasis", syntax: "*italic text*" },
          { label: isTh ? "ขีดฆ่า (Strikethrough)" : "Strikethrough text line", syntax: "~~strikethrough~~" },
          { label: isTh ? "ไฮไลต์สีพื้นหลัง (Highlight)" : "Background color highlight", syntax: "==highlighted==" },
          { label: isTh ? "โค้ดในบรรทัด (Inline Code)" : "Inline code snippet", syntax: "`inline code`" },
          { label: isTh ? "ขีดเส้นใต้ (Underline)" : "Underline text", syntax: "<u>underline</u>" },
          { label: isTh ? "ตัวห้อย (Subscript)" : "Subscript text", syntax: "~subscript~" },
          { label: isTh ? "ตัวยก (Superscript)" : "Superscript text", syntax: "^superscript^" },
        ],
      },
      {
        title: isTh ? "รายการและเช็คลิสต์ (Lists & Tasks)" : "Lists & Tasks",
        items: [
          { label: isTh ? "รายการหัวข้อย่อยแบบจุด (Bullet List)" : "Bulleted unordered list", syntax: "- Bullet item" },
          { label: isTh ? "รายการลำดับหมายเลข (Numbered List)" : "Numbered ordered list", syntax: "1. First item" },
          { label: isTh ? "รายการสิ่งที่ต้องทำ (Todo Checkbox)" : "Interactive task checkbox", syntax: "- [ ] Todo task" },
          { label: isTh ? "รายการที่ทำเสร็จแล้ว (Completed Task)" : "Completed checkbox item", syntax: "- [x] Done task" },
        ],
      },
      {
        title: isTh ? "บล็อกและองค์ประกอบ (Blocks & Elements)" : "Blocks & Elements",
        items: [
          { label: isTh ? "บล็อกข้อความอ้างอิง (Blockquote)" : "Quote callout text", syntax: "> Blockquote" },
          { label: isTh ? "บล็อกโค้ดหลายบรรทัด (Code Block)" : "Syntax highlighted code block", syntax: "```javascript ... ```" },
          { label: isTh ? "เส้นคั่นแนวนอน (Horizontal Rule)" : "Horizontal divider line", syntax: "---" },
          { label: isTh ? "ลิงก์ภายนอก (Hyperlink)" : "Web hyperlink with title", syntax: "[Luno](https://luno.app)" },
          { label: isTh ? "แทรกรูปภาพ (Image)" : "Image with alt text", syntax: "![Alt](image.png)" },
          { label: isTh ? "ตาราง (Markdown Table)" : "GFM Markdown table", syntax: "| Col 1 | Col 2 |" },
          { label: isTh ? "สูตรคณิตศาสตร์ (Math Formula)" : "Inline KaTeX math formula", syntax: "$E = mc^2$" },
          { label: isTh ? "เชิงอรรถ (Footnote)" : "Footnote reference tag", syntax: "[^1]" },
        ],
      },
    ],
    [isTh]
  );

  const faqItems = useMemo(
    () => [
      {
        q: isTh ? "ไฟล์เอกสารของฉันถูกจัดเก็บไว้ที่ไหน?" : "Where are my notes stored?",
        a: isTh
          ? "Luno Notes เป็นแอปพลิเคชันแบบ Local-first ข้อมูลทั้งหมดจะถูกบันทึกเป็นไฟล์ Markdown (.md) ธรรมดาลงบนโฟลเดอร์เครื่องคอมพิวเตอร์ของคุณโดยตรง คุณเป็นเจ้าของข้อมูล 100% และสามารถเปิดด้วยโปรแกรมอื่นได้ตลอดเวลา"
          : "Luno Notes is 100% local-first. All notes are saved as standard Markdown (.md) files directly in your selected local directory. You own and control your files completely.",
      },
      {
        q: isTh ? "สามารถใช้งานตอนไม่มีอินเทอร์เน็ต (Offline) ได้หรือไม่?" : "Does it work completely offline?",
        a: isTh
          ? "ใช้งานได้สมบูรณ์แบบโดยไม่ต้องต่ออินเทอร์เน็ต ทั้งการเปิด แก้ไข ค้นหา และบันทึกไฟล์ (ยกเว้นฟีเจอร์ Luno AI และ Google Drive Cloud Sync ที่ต้องใช้อินเทอร์เน็ต)"
          : "Yes, fully offline! All editor tools, local search, and file management work with zero internet connectivity. Only AI services and Drive sync require network access.",
      },
      {
        q: isTh ? "โน้ตที่เผลอลบไป สามารถกู้คืนได้หรือไม่?" : "Can I recover accidentally deleted notes?",
        a: isTh
          ? "ได้ครับ โน้ตที่ถูกลบจะถูกย้ายไปเก็บไว้ในแท็บ 'ถังขยะ (Trash)' คุณสามารถกดกู้คืน (Restore) กลับโฟลเดอร์เดิม หรือลบถาวรได้ตลอดเวลา"
          : "Yes! Deleted files are safely moved to the Trash tab, where you can restore them back to their original paths or purge them permanently.",
      },
      {
        q: isTh ? "รองรับการแทรกรูปภาพอย่างไร?" : "How do images work?",
        a: isTh
          ? "คุณสามารถลากไฟล์รูปภาพมาวาง (Drag & Drop) หรือกดคัดลอกรูปแล้วกด Ctrl+V วางลงในตัวแก้ไขได้ทันที รูปภาพจะถูกจัดเก็บลงในโฟลเดอร์ assets ของ workspace"
          : "Simply drag and drop image files or paste from clipboard (Ctrl+V). Media files are neatly saved in your workspace assets folder.",
      },
      {
        q: isTh ? "จะซิงก์ข้อมูลระหว่างเครื่องหลายเครื่องได้อย่างไร?" : "How do I sync notes across multiple devices?",
        a: isTh
          ? "ไปที่การตั้งค่า (Settings) -> หมวด 'พื้นที่จัดเก็บข้อมูล (Storage)' แล้วกดเชื่อมต่อ Google Drive ระบบจะซิงก์ไฟล์ Markdown ของคุณขึ้นไดรฟ์โดยตรงแบบ Peer-to-cloud ไม่ผ่านเซิร์ฟเวอร์คนกลาง"
          : "Navigate to Settings -> Storage and connect Google Drive. Files synchronize peer-to-cloud directly between your computer and your personal cloud storage.",
      },
      {
        q: isTh ? "ระบบล็อคโน้ตด้วยรหัส PIN ทำงานอย่างไร?" : "How does PIN lock for private notes work?",
        a: isTh
          ? "คุณสามารถคลิกขวาที่โน้ตหรือกดเมนู 'ตั้งรหัส PIN' เพื่อกำหนดรหัสผ่าน 6 หลัก โน้ตที่ถูกล็อคจะต้องใส่รหัสผ่านทุกครั้งก่อนเปิดอ่าน ช่วยปกป้องข้อมูลส่วนตัวของคุณ"
          : "You can right-click any note to configure a 6-digit PIN. Locked documents require PIN authentication before the editor unveils their content.",
      },
      {
        q: isTh ? "ใช้งาน Split View (แบ่งสองหน้าต่าง) อย่างไร?" : "How do I use Split View?",
        a: isTh
          ? "คลิกขวาที่แท็บใดก็ได้แล้วเลือก 'แยกหน้าจอ (Split Tab)' หรือกดปุ่มไอคอน Split บนแถบแท็บ เพื่อเปิดดูหรือแก้ไขเอกสาร 2 หน้าคู่กันแบบอิสระ"
          : "Right-click any tab and pick 'Split Tab' (or click the split icon in the tab bar) to open two documents side-by-side with independent scrolling.",
      },
      {
        q: isTh ? "Slash Commands คืออะไร และเรียกใช้อย่างไร?" : "What are Slash Commands and how do I use them?",
        a: isTh
          ? "เพียงพิมพ์เครื่องหมาย / ในบรรทัดว่าง เมนูลัดจะปรากฏขึ้นเพื่อให้คุณแทรกหัวข้อ ตาราง โค้ดบล็อก เช็คลิสต์ รูปภาพ หรือเครื่องคิดเลขได้อย่างรวดเร็วโดยไม่ต้องใช้เมาส์"
          : "Just type '/' on an empty line to trigger the quick insert menu for headings, tables, code blocks, checklists, or media without lifting your hands from the keyboard.",
      },
      {
        q: isTh ? "วิธีตั้งค่าใช้งาน AI Assistant (Luno AI) ทำอย่างไร?" : "How do I configure Luno AI Assistant?",
        a: isTh
          ? "ไปที่การตั้งค่า (Settings) -> หมวด 'AI' แล้วกรอก API Key (เช่น Google Gemini API Key หรือ OpenAI) คุณจะสามารถสั่งให้ AI สรุป แปลภาษา หรือช่วยเขียนได้ทันที"
          : "Head to Settings -> AI and provide your API Key (e.g., Google Gemini or OpenAI). You can then prompt AI to summarize, translate, or draft text.",
      },
      {
        q: isTh ? "สามารถ Export เอกสารออกเป็นไฟล์ PDF หรือพิมพ์ได้อย่างไร?" : "How do I export or print notes?",
        a: isTh
          ? "กดปุ่มตัวเลือกเอกสารที่มุมขวาบนของตัวแก้ไข แล้วเลือก 'พิมพ์ / ส่งออกเป็น PDF (Print / Export PDF)' ระบบจะจัดหน้ารูปแบบสวยงามพร้อมพิมพ์หรือบันทึกเป็น PDF ทันที"
          : "Click the note options menu in the top-right toolbar and choose 'Print / Export PDF' to generate clean, printable pages or standard PDF files.",
      },
      {
        q: isTh ? "แม่แบบเอกสาร (Templates) ใช้งานอย่างไร?" : "How do Templates work?",
        a: isTh
          ? "คุณสามารถเปิดแท็บ 'แม่แบบ (Templates)' เพื่อเลือกใช้งานแม่แบบสำเร็จรูป เช่น บันทึกประจำวัน รายงานการประชุม หรือบันทึกโน้ตปัจจุบันเป็นแม่แบบใหม่เพื่อนำกลับมาใช้ซ้ำ"
          : "Open the Templates tab to create notes from pre-designed layouts (Daily Log, Meeting Notes) or easily save your current note structure as a reusable template.",
      },
      {
        q: isTh ? "การใช้แท็ก (Tags) และรายการโปรด (Favorites) ทำงานอย่างไร?" : "How do Tags and Favorites work?",
        a: isTh
          ? "คุณสามารถพิมพ์ #tag ในเนื้อหา หรือกำหนดใน Frontmatter และกดไอคอนดาวเพื่อติดดาวโน้ตสำคัญ สามารถกรองดูได้จากแท็บ Favorites และ Tags บนแถบข้าง"
          : "Type #tags in your note body or frontmatter, and click the star icon to pin favorites. You can filter and group them anytime from the sidebar tabs.",
      },
      {
        q: isTh ? "สามารถบันทึกเสียงลงในโน้ตได้หรือไม่?" : "Can I record audio in my notes?",
        a: isTh
          ? "ได้ครับ สามารถกดปุ่มไอคอนไมโครโฟนบนแถบเครื่องมือเพื่อบันทึกเสียง ไฟล์เสียงจะถูกแนบและเล่นได้โดยตรงในเนื้อหาโน้ต สะดวกสำหรับการบันทึกเสียงการประชุมหรือเลกเชอร์"
          : "Yes! Click the microphone button on the editor toolbar to capture audio memos directly into your note with seamless inline playback.",
      },
      {
        q: isTh ? "ฉันสามารถสำรองข้อมูลทั้งหมดเก็บไว้ได้อย่างไร?" : "How do I backup all my data?",
        a: isTh
          ? "ไปที่การตั้งค่า (Settings) -> สำรองข้อมูล (Backup) แล้วกด 'ส่งออกข้อมูลสำรอง' หรือเพียงแค่ Copy โฟลเดอร์ Workspace ของคุณเก็บไว้ที่แฟลชไดรฟ์หรือคลาวด์ได้ทันที"
          : "Visit Settings -> Backup to create a full archive, or simply copy your local workspace folder to any backup drive or cloud folder anytime.",
      },
    ],
    [isTh]
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden select-none">
        {/* Main 2-Column Content View (100% Mirroring SettingsTabView) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Category Column (100% Mirroring SettingsTabView - No bottom buttons) */}
          <div className="w-60 border-r border-border/50 bg-card/30 flex flex-col shrink-0 select-none">
            <div className="px-5 py-4 border-b border-border/40 font-bold text-lg text-foreground flex items-center justify-between">
              <span>{t("sidebar.help") || (isTh ? "ช่วยเหลือ" : "Help")}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 no-scrollbar">
              {categories.map((cat) => {
                const Icon = getToolbarIcon(cat.iconKey, pack);
                const isActive = safeActiveCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70"}`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Panel View */}
          <div className="flex-1 flex flex-col bg-background/50 overflow-hidden">
            {/* Category Header */}
            <div className="px-8 py-5 border-b border-border/40 bg-card/20 shrink-0">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{currentCategory.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.desc}</p>
              </div>
            </div>

            {/* Scrollable Category Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar w-full">
              {/* 1. FEATURES & TOOLS (Priority #1: App overview & tools) */}
              {safeActiveCategory === "features" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featureItems.map((feat) => {
                      const Icon = feat.icon;
                      return (
                        <div
                          key={feat.title}
                          className="rounded-2xl border border-border/60 bg-card p-5 space-y-2.5 shadow-2xs hover:border-border transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-primary shrink-0" />
                            <h4 className="text-xs font-bold text-foreground leading-snug">{feat.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. MARKDOWN GUIDE (Priority #2: Core writing guide) */}
              {safeActiveCategory === "markdown" && (
                <div className="space-y-6">
                  {markdownGroups.map((group, secIdx) => (
                    <div key={group.title} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {group.title}
                      </h3>
                      <div className="divide-y divide-border/30 text-xs">
                        {group.items.map((item, idx) => {
                          const codeId = `md-${secIdx}-${idx}`;
                          return (
                            <div key={idx} className="flex justify-between items-center py-2 gap-4">
                              <span className="text-muted-foreground">{item.label}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.syntax, codeId)}
                                className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 active:scale-95 transition-all font-mono text-[11px] font-semibold text-foreground cursor-pointer shrink-0 flex items-center gap-1.5"
                                title="Click to copy syntax"
                              >
                                <span>{item.syntax}</span>
                                {copiedCode === codeId ? (
                                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                ) : null}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. SHORTCUTS (Priority #3: Power user keyboard shortcuts) */}
              {safeActiveCategory === "shortcuts" && (
                <div className="space-y-6">
                  {/* Group 1: General & Navigation */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupGeneral")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbNewNote")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + N</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOpenFolder")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + O</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSave")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + S</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbCloseTab")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + W</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbCycleTabs")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Tab / Ctrl + Shift + Tab</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleSidebar")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + \</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOpenSettings")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + ,</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSearch")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + K / Ctrl + F</kbd></div>
                    </div>
                  </div>

                  {/* Group 2: Text Formatting */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupFormatting")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBold")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + B</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbItalic")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + I</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbUnderline")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + U</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbStrike")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + X</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbHighlight")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + H</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSuperscript")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + .</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSubscript")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + ,</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbInlineCode")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + E / Ctrl + `</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbInsertLink")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + K</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbClearFormatting")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + N</kbd></div>
                    </div>
                  </div>

                  {/* Group 3: Lists & Blocks */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupListsAndBlocks")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBulletList")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + 8</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOrderedList")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + 7</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbTaskList")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + 9</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBlockquote")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + Q</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbCodeBlock")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Alt + C</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbIndent")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Tab / Shift + Tab</kbd></div>
                    </div>
                  </div>

                  {/* Group 4: Tools & Utilities */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupTools")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbFixLang")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + L</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOpenAi")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + A</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleCalc")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + C</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleClock")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + T</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSlashCommands")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">/</kbd></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FAQ & TIPS (Priority #4: Troubleshooting & questions) */}
              {safeActiveCategory === "faq" && (
                <div className="space-y-4">
                  {faqItems.map((faq, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/60 bg-card p-5 space-y-2 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <span className="w-4 text-xs font-bold text-primary shrink-0 mt-0.5 select-none">Q:</span>
                        <h4 className="text-xs font-bold text-foreground leading-snug flex-1">{faq.q}</h4>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-4 text-xs font-bold text-muted-foreground shrink-0 mt-0.5 select-none">A:</span>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{faq.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. ABOUT (Priority #5: App Info & Updates - Always at bottom) */}
              {safeActiveCategory === "about" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-1.5 max-w-xl">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Luno Note</h3>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Version {APP_VERSION} ({appUpdate.currentAppVersion ? `App v${appUpdate.currentAppVersion}` : "Desktop"})
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                          {t("settings.aboutAppDesc")}
                        </p>
                        <p className="text-xs text-muted-foreground pt-1">
                          <a
                            href={APP_AUTHOR_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              openExternalUrl(APP_AUTHOR_URL);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {APP_ABOUT_CREDIT}
                          </a>
                        </p>
                      </div>

                      {/* Vertically Centered Check for Updates in Middle of Card */}
                      <div className="flex items-center gap-2 shrink-0 sm:self-center">
                        {appUpdate.isAvailable && (
                          <button
                            type="button"
                            onClick={appUpdate.downloadUpdate}
                            disabled={appUpdate.isDownloading}
                            className="w-48 h-10 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{t("settings.downloadUpdate") || "Download Update"}</span>
                          </button>
                        )}

                        {appUpdate.isDownloaded && (
                          <button
                            type="button"
                            onClick={appUpdate.quitAndInstall}
                            className="w-48 h-10 px-3 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>{t("settings.installAndRestart") || "Restart & Install"}</span>
                          </button>
                        )}

                        {!appUpdate.isAvailable && !appUpdate.isDownloaded && (
                          <button
                            type="button"
                            onClick={() => appUpdate.checkForUpdates(true)}
                            disabled={appUpdate.isChecking || appUpdate.isDownloading}
                            className="w-48 h-10 px-3 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {appUpdate.isChecking ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span>
                              {appUpdate.isChecking
                                ? (t("settings.checkingForUpdates") || "Checking...")
                                : (t("settings.checkUpdatesNow") || "Check for Updates")}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Show download progress if downloading */}
                    {appUpdate.isDownloading && appUpdate.progress && (
                      <div className="pt-2 border-t border-border/30 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t("settings.downloadingUpdate") || "Downloading..."}</span>
                          <span className="font-mono font-semibold text-foreground">{appUpdate.progress.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${appUpdate.progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
