import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  type NoteTemplateType,
  NOTE_TEMPLATE_METADATA,
  getNoteTemplateContent,
  getTemplateIcon,
} from "@/lib/templates";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Check, Copy, Plus, Code, Eye, Monitor, Smartphone, Tablet, RotateCcw, X, LayoutTemplate } from "lucide-react";
import { marked } from "marked";
import { parseFrontmatterAndTags } from "@/lib/frontmatter";
import { renderMarkdownToEditorHtml, EDITOR_CLASSES } from "@/components/Editor";

export interface TemplateItemDef {
  type: NoteTemplateType;
  titleEn: string;
  titleTh: string;
  descEn: string;
  descTh: string;
  format: "markdown" | "html" | "plain";
  formatExt: "md" | "html" | "txt";
  category: "work" | "daily" | "web" | "study" | "dev" | "general";
  icon: string;
  color?: string;
}

const TEMPLATE_DEFINITIONS: TemplateItemDef[] = [
  // 1. Markdown (.md)
  {
    type: "daily",
    titleEn: "Daily Note",
    titleTh: "บันทึกประจำวัน",
    descEn: "Capture your thoughts and reflect on your day",
    descTh: "บันทึกสิ่งที่คิดและสรุปวันของคุณ",
    format: "markdown",
    formatExt: "md",
    category: "daily",
    icon: "lucide:Calendar",
    color: "#10b981",
  },
  {
    type: "weekly-review",
    titleEn: "Weekly Review",
    titleTh: "สรุปประจำสัปดาห์",
    descEn: "Review progress, lessons and plan next week",
    descTh: "ทบทวนผลงาน สรุปบทเรียน และวางแผนสัปดาห์ถัดไป",
    format: "markdown",
    formatExt: "md",
    category: "work",
    icon: "lucide:CalendarCheck",
    color: "#0ea5e9",
  },
  {
    type: "todo",
    titleEn: "To-Do List",
    titleTh: "รายการสิ่งที่ต้องทำ",
    descEn: "Stay organized and get things done",
    descTh: "จัดระเบียบงานและทำสิ่งต่างๆ ให้สำเร็จ",
    format: "markdown",
    formatExt: "md",
    category: "work",
    icon: "lucide:CheckSquare",
    color: "#3b82f6",
  },
  {
    type: "meeting",
    titleEn: "Meeting Notes",
    titleTh: "บันทึกการประชุม",
    descEn: "Structure your meetings and take better notes",
    descTh: "จดบันทึกวาระและข้อสรุปการประชุม",
    format: "markdown",
    formatExt: "md",
    category: "work",
    icon: "lucide:Users",
    color: "#8b5cf6",
  },
  {
    type: "project",
    titleEn: "Project Plan",
    titleTh: "แผนงานโครงการ",
    descEn: "Plan projects and track progress",
    descTh: "วางแผนโครงการและติดตามความคืบหน้า",
    format: "markdown",
    formatExt: "md",
    category: "work",
    icon: "lucide:Briefcase",
    color: "#f59e0b",
  },
  {
    type: "study",
    titleEn: "Idea Brainstorm",
    titleTh: "ระดมความคิด",
    descEn: "Capture and develop your ideas",
    descTh: "บันทึกและต่อยอดไอเดียใหม่ๆ",
    format: "markdown",
    formatExt: "md",
    category: "daily",
    icon: "lucide:Lightbulb",
    color: "#f43f5e",
  },
  {
    type: "book-notes",
    titleEn: "Book Notes",
    titleTh: "สรุปหนังสือ",
    descEn: "Key takeaways, quotes & actionable insights",
    descTh: "สรุปใจความสำคัญ คำคม และบทเรียนจากหนังสือ",
    format: "markdown",
    formatExt: "md",
    category: "study",
    icon: "lucide:Bookmark",
    color: "#a855f7",
  },
  {
    type: "cornell-notes",
    titleEn: "Cornell Notes",
    titleTh: "โน้ตแบบคอร์เนลล์",
    descEn: "Structured note-taking with cues, notes and summary",
    descTh: "จดบันทึกแบ่งคำถาม คีย์เวิร์ด และสรุปใจความ",
    format: "markdown",
    formatExt: "md",
    category: "study",
    icon: "lucide:GraduationCap",
    color: "#6366f1",
  },
  {
    type: "content-planner",
    titleEn: "Content & Video Planner",
    titleTh: "วางแผนคอนเทนต์และสคริปต์",
    descEn: "Hook, storyline, CTA and production checklist",
    descTh: "วางโครงเรื่อง สคริปต์วิดีโอ และเช็กลิสต์ผลิตสื่อ",
    format: "markdown",
    formatExt: "md",
    category: "work",
    icon: "lucide:Video",
    color: "#ef4444",
  },
  {
    type: "api-doc",
    titleEn: "API Specification",
    titleTh: "เอกสารสเปก API",
    descEn: "REST endpoint schema, parameters & response codes",
    descTh: "สเปก Endpoint, Request body, Response และ Error",
    format: "markdown",
    formatExt: "md",
    category: "dev",
    icon: "lucide:Code2",
    color: "#0ea5e9",
  },
  {
    type: "bug",
    titleEn: "Bug Report",
    titleTh: "รายงานปัญหา",
    descEn: "Document bug reproduction and steps",
    descTh: "บันทึกขั้นตอนการจำลองและแก้ปัญหา",
    format: "markdown",
    formatExt: "md",
    category: "dev",
    icon: "lucide:Bug",
    color: "#ef4444",
  },
  {
    type: "habit-tracker",
    titleEn: "Habit & Wellness Tracker",
    titleTh: "ติดตามนิสัยและสุขภาพ",
    descEn: "Weekly habit grid, hydration, sleep & energy log",
    descTh: "ตารางเช็กนิสัย ดื่มน้ำ ออกกำลังกาย และการนอน",
    format: "markdown",
    formatExt: "md",
    category: "daily",
    icon: "lucide:Activity",
    color: "#10b981",
  },
  {
    type: "monthly-budget",
    titleEn: "Monthly Budget Planner",
    titleTh: "วางแผนการเงินประจำเดือน",
    descEn: "Income, fixed expenses, savings & net balance",
    descTh: "คำนวณรายรับ รายจ่ายคงที่ เงินออม และยอดคงเหลือ",
    format: "markdown",
    formatExt: "md",
    category: "daily",
    icon: "lucide:Wallet",
    color: "#14b8a6",
  },
  {
    type: "travel-itinerary",
    titleEn: "Travel Itinerary",
    titleTh: "แผนการท่องเที่ยว",
    descEn: "Flights, hotel, daily schedule & packing list",
    descTh: "ตารางเที่ยวรายวัน ที่พัก การเดินทาง และกระเป๋า",
    format: "markdown",
    formatExt: "md",
    category: "daily",
    icon: "lucide:Compass",
    color: "#06b6d4",
  },

  // 2. HTML (.html)
  {
    type: "basic-website",
    titleEn: "Basic Website",
    titleTh: "เว็บไซต์ทั่วไป",
    descEn: "General website with header, main, footer",
    descTh: "เว็บไซต์ทั่วไป มี Header / Main / Footer",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:Globe",
    color: "#3b82f6",
  },
  {
    type: "landing-page",
    titleEn: "Landing Page",
    titleTh: "หน้าแลนดิ้งเพจ",
    descEn: "Promote products, apps or services",
    descTh: "หน้าโปรโมตสินค้า แอป หรือบริการ",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:Rocket",
    color: "#f43f5e",
  },
  {
    type: "portfolio",
    titleEn: "Portfolio",
    titleTh: "พอร์ตโฟลิโอ",
    descEn: "Personal portfolio and showcase",
    descTh: "Portfolio / ผลงานส่วนตัว",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:User",
    color: "#10b981",
  },
  {
    type: "blog",
    titleEn: "Blog",
    titleTh: "บล็อกบทความ",
    descEn: "Article and blog post layout",
    descTh: "เว็บบทความ / ข่าว / บล็อก",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:BookOpen",
    color: "#8b5cf6",
  },
  {
    type: "dashboard",
    titleEn: "Dashboard",
    titleTh: "แดชบอร์ด",
    descEn: "Admin panel and data management",
    descTh: "Admin panel / ระบบจัดการข้อมูล",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:LayoutDashboard",
    color: "#06b6d4",
  },
  {
    type: "documentation",
    titleEn: "Documentation",
    titleTh: "เอกสารคู่มือ",
    descEn: "API reference & developer docs layout",
    descTh: "หน้าเอกสารคู่มือ API และการใช้งาน",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:FileCode",
    color: "#6366f1",
  },
  {
    type: "link-tree",
    titleEn: "Link in Bio",
    titleTh: "รวมลิงก์โปรไฟล์",
    descEn: "Mobile-friendly social link aggregator",
    descTh: "หน้ารวมลิงก์ผลงานและโซเชียลมีเดีย",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:Share2",
    color: "#ec4899",
  },
  {
    type: "invoice",
    titleEn: "Invoice & Receipt",
    titleTh: "ใบแจ้งหนี้และใบเสร็จ",
    descEn: "Professional invoice layout ready to print or PDF",
    descTh: "ใบแจ้งหนี้พร้อมตารางคำนวณภาษีและสั่งพิมพ์",
    format: "html",
    formatExt: "html",
    category: "work",
    icon: "lucide:Receipt",
    color: "#059669",
  },
  {
    type: "pricing-table",
    titleEn: "Pricing Plans Table",
    titleTh: "ตารางแพ็กเกจราคา",
    descEn: "Compare subscription tiers and feature list",
    descTh: "ตารางเปรียบเทียบระดับแพ็กเกจและฟีเจอร์",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:BadgePercent",
    color: "#3b82f6",
  },
  {
    type: "event-invite",
    titleEn: "Event Invitation & RSVP",
    titleTh: "การ์ดเชิญและลงทะเบียน",
    descEn: "Event landing with schedule and RSVP form",
    descTh: "หน้าการ์ดเชิญงานสัมมนา ตารางเวลา และฟอร์มลงทะเบียน",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:Ticket",
    color: "#ec4899",
  },
  {
    type: "restaurant-menu",
    titleEn: "Restaurant & Cafe Menu",
    titleTh: "เมนูร้านอาหารและคาเฟ่",
    descEn: "Digital menu with prices, food items & specials",
    descTh: "เมนูอาหารและเครื่องดื่มดิจิทัลพร้อมราคาและแท็ก",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:Coffee",
    color: "#d97706",
  },
  {
    type: "faq-page",
    titleEn: "Help Center & FAQ",
    titleTh: "ศูนย์ช่วยเหลือและ FAQ",
    descEn: "Accordion-style questions and support answers",
    descTh: "หน้ารวมคำถามที่พบบ่อยและช่องทางติดต่อช่วยเหลือ",
    format: "html",
    formatExt: "html",
    category: "web",
    icon: "lucide:HelpCircle",
    color: "#6366f1",
  },

  // 3. Plain Text (.txt)
  {
    type: "notes",
    titleEn: "Quick Notes",
    titleTh: "บันทึกสั้น",
    descEn: "Quick short plain notes",
    descTh: "จดบันทึกสั้น ๆ เรียบง่าย",
    format: "plain",
    formatExt: "txt",
    category: "daily",
    icon: "lucide:FileText",
    color: "#64748b",
  },
  {
    type: "todo",
    titleEn: "To-Do List",
    titleTh: "รายการสิ่งที่ต้องทำ",
    descEn: "Tasks & checklist in plain text",
    descTh: "รายการงาน / เช็กลิสต์แบบข้อความ",
    format: "plain",
    formatExt: "txt",
    category: "work",
    icon: "lucide:CheckSquare",
    color: "#3b82f6",
  },
  {
    type: "meeting",
    titleEn: "Meeting Notes",
    titleTh: "บันทึกการประชุม",
    descEn: "Meeting minutes in plain text",
    descTh: "บันทึกการประชุมแบบข้อความ",
    format: "plain",
    formatExt: "txt",
    category: "work",
    icon: "lucide:Users",
    color: "#8b5cf6",
  },
  {
    type: "journal",
    titleEn: "Journal",
    titleTh: "ไดอารี่",
    descEn: "Daily journal and thoughts in text",
    descTh: "บันทึกประจำวันและไดอารี่",
    format: "plain",
    formatExt: "txt",
    category: "daily",
    icon: "lucide:Calendar",
    color: "#10b981",
  },
  {
    type: "work-log",
    titleEn: "Work Log",
    titleTh: "บันทึกเวลาทำงาน",
    descEn: "Daily time tracking and task logging",
    descTh: "บันทึกเวลาและงานที่ทำประจำวัน",
    format: "plain",
    formatExt: "txt",
    category: "work",
    icon: "lucide:Clock",
    color: "#14b8a6",
  },
  {
    type: "readme",
    titleEn: "README",
    titleTh: "เอกสาร README",
    descEn: "Project overview, setup & usage",
    descTh: "อธิบายโปรเจกต์ / ไฟล์ / วิธีใช้งาน",
    format: "plain",
    formatExt: "txt",
    category: "dev",
    icon: "lucide:BookOpen",
    color: "#6366f1",
  },
  {
    type: "changelog",
    titleEn: "Changelog",
    titleTh: "บันทึกการเปลี่ยนแปลง",
    descEn: "Version history, updates and fixes",
    descTh: "ประวัติเวอร์ชันและการปรับปรุง",
    format: "plain",
    formatExt: "txt",
    category: "dev",
    icon: "lucide:History",
    color: "#f97316",
  },
  {
    type: "lecture-notes",
    titleEn: "Lecture Notes",
    titleTh: "บันทึกเลกเชอร์",
    descEn: "Quick lecture takeaways and homework checklist",
    descTh: "บันทึกเลกเชอร์ คอนเซปต์หลัก และการบ้าน",
    format: "plain",
    formatExt: "txt",
    category: "study",
    icon: "lucide:GraduationCap",
    color: "#6366f1",
  },
  {
    type: "server-config",
    titleEn: "Server Config",
    titleTh: "การตั้งค่าเซิร์ฟเวอร์",
    descEn: "Server specs, environment variables & commands",
    descTh: "สเปกเซิร์ฟเวอร์ ตัวแปรสภาพแวดล้อม และคำสั่งระบบ",
    format: "plain",
    formatExt: "txt",
    category: "dev",
    icon: "lucide:Server",
    color: "#0ea5e9",
  },
  {
    type: "incident-report",
    titleEn: "Incident Postmortem",
    titleTh: "รายงานวิเคราะห์เหตุขัดข้อง",
    descEn: "Incident timeline, impact and root cause analysis",
    descTh: "ลำดับเหตุการณ์ ผลกระทบ และการป้องกัน RCA",
    format: "plain",
    formatExt: "txt",
    category: "dev",
    icon: "lucide:AlertTriangle",
    color: "#ef4444",
  },
  {
    type: "shopping-list",
    titleEn: "Shopping List",
    titleTh: "รายการซื้อของ",
    descEn: "Groceries and household essentials checklist",
    descTh: "เช็กลิสต์ซื้อของกินและของใช้ในบ้าน",
    format: "plain",
    formatExt: "txt",
    category: "daily",
    icon: "lucide:ShoppingCart",
    color: "#10b981",
  },
  {
    type: "recipe-txt",
    titleEn: "Recipe",
    titleTh: "สูตรอาหาร",
    descEn: "Plain text recipe and cooking steps",
    descTh: "สูตรอาหารและขั้นตอนการปรุงแบบเรียบง่าย",
    format: "plain",
    formatExt: "txt",
    category: "daily",
    icon: "lucide:Utensils",
    color: "#f59e0b",
  },
];

interface TemplatesViewProps {
  onCreateWithTemplate: (templateType: NoteTemplateType, format?: "markdown" | "html" | "plain") => void;
}

export default function TemplatesView({
  onCreateWithTemplate,
}: TemplatesViewProps) {
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";
  const pack = settings?.iconPack || "lucide";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<TemplateItemDef | null>(null);
  const [previewTab, setPreviewTab] = useState<"rendered" | "code">("rendered");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Monitor preview viewport container size for responsive iframe scaling
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const el = previewContainerRef.current;
    const updateSize = () => {
      if (el) {
        setContainerWidth(el.clientWidth);
        setContainerHeight(el.clientHeight);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewItem, previewTab, deviceMode]);

  const deviceViewport = useMemo(() => {
    const pad = 16;
    const availW = Math.max((containerWidth || 720) - pad, 280);
    const availH = Math.max((containerHeight || 450) - pad, 200);

    if (deviceMode === "mobile") {
      const targetW = 375;
      const scale = availW < targetW ? availW / targetW : 1;
      return {
        targetW,
        scale,
        wrapperW: `${targetW * scale}px`,
        wrapperH: `${availH}px`,
        iframeH: `${availH / scale}px`,
        isScaled: scale < 1,
      };
    }

    if (deviceMode === "tablet") {
      const targetW = 768;
      const scale = availW < targetW ? availW / targetW : 1;
      return {
        targetW,
        scale,
        wrapperW: `${targetW * scale}px`,
        wrapperH: `${availH}px`,
        iframeH: `${availH / scale}px`,
        isScaled: scale < 1,
      };
    }

    // desktop: 100%
    return {
      targetW: 0,
      scale: 1,
      wrapperW: "100%",
      wrapperH: "100%",
      iframeH: "100%",
      isScaled: false,
    };
  }, [deviceMode, containerWidth, containerHeight]);

  const renderIcon = (key: string, cls = "h-4 w-4") => {
    const IconComp = getToolbarIcon(key, pack);
    return <IconComp className={cls} />;
  };

  // Keyboard shortcut Ctrl+K / Ctrl+F for templates search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isCmdOrCtrl && (key === "k" || key === "f" || key === "า" || key === "ด")) {
        const active = document.activeElement;
        const isEditing =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";

        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categories = useMemo(
    () => [
      { id: "all", label: isTh ? "ทั้งหมด" : "All" },
      { id: "md", label: "Markdown" },
      { id: "html", label: "HTML" },
      { id: "txt", label: isTh ? "ข้อความ" : "Text" },
      { id: "study", label: isTh ? "การเรียน & วิจัย" : "Study & Research" },
      { id: "dev", label: isTh ? "พัฒนาโปรแกรม & IT" : "Dev & Tech" },
      { id: "work", label: isTh ? "งาน & ธุรกิจ" : "Work & Business" },
      { id: "daily", label: isTh ? "สุขภาพ & ส่วนตัว" : "Daily & Wellness" },
      { id: "web", label: isTh ? "เว็บไซต์ & โค้ด" : "Web & UI" },
    ],
    [isTh]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: TEMPLATE_DEFINITIONS.length,
      md: 0,
      html: 0,
      txt: 0,
      study: 0,
      dev: 0,
      work: 0,
      daily: 0,
      web: 0,
    };

    TEMPLATE_DEFINITIONS.forEach((item) => {
      if (item.formatExt === "md") counts.md++;
      if (item.formatExt === "html") counts.html++;
      if (item.formatExt === "txt") counts.txt++;
      if (item.category === "study") counts.study++;
      if (item.category === "dev") counts.dev++;
      if (item.category === "work") counts.work++;
      if (item.category === "daily") counts.daily++;
      if (item.category === "web") counts.web++;
    });

    return counts;
  }, []);

  const filterItem = (item: TemplateItemDef) => {
    if (selectedCategory === "md" && item.formatExt !== "md") return false;
    if (selectedCategory === "html" && item.formatExt !== "html") return false;
    if (selectedCategory === "txt" && item.formatExt !== "txt") return false;
    if (selectedCategory === "study" && item.category !== "study") return false;
    if (selectedCategory === "dev" && item.category !== "dev") return false;
    if (selectedCategory === "work" && item.category !== "work") return false;
    if (selectedCategory === "daily" && item.category !== "daily") return false;
    if (selectedCategory === "web" && item.category !== "web") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.titleEn.toLowerCase().includes(q) || item.titleTh.toLowerCase().includes(q);
      const matchDesc = item.descEn.toLowerCase().includes(q) || item.descTh.toLowerCase().includes(q);
      const matchExt = item.formatExt.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchExt;
    }
    return true;
  };

  const mdGroup = useMemo(() => TEMPLATE_DEFINITIONS.filter((item) => item.formatExt === "md" && filterItem(item)), [selectedCategory, searchQuery]);
  const htmlGroup = useMemo(() => TEMPLATE_DEFINITIONS.filter((item) => item.formatExt === "html" && filterItem(item)), [selectedCategory, searchQuery]);
  const txtGroup = useMemo(() => TEMPLATE_DEFINITIONS.filter((item) => item.formatExt === "txt" && filterItem(item)), [selectedCategory, searchQuery]);

  const allFiltered = useMemo(() => TEMPLATE_DEFINITIONS.filter(filterItem), [selectedCategory, searchQuery]);

  const previewContent = useMemo(() => {
    if (!previewItem) return "";
    return getNoteTemplateContent(
      previewItem.type,
      settings.language,
      previewItem.format,
      settings.dateFormat,
      settings.timeFormat,
      settings.iconPack
    );
  }, [previewItem, settings]);

  const renderedMarkdownHtml = useMemo(() => {
    if (!previewItem || previewItem.format !== "markdown" || !previewContent) return "";
    return renderMarkdownToEditorHtml(previewContent, {
      isReadingMode: false,
      theme: settings.theme,
      tagColorStyle: settings.tagColorStyle,
    });
  }, [previewItem, previewContent, settings.theme, settings.tagColorStyle]);

  const handleCopyPreview = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent).then(() => {
      setCopied(true);
      toast({
        title: isTh ? "คัดลอกแล้ว" : "Copied to clipboard",
        description: isTh ? "คัดลอกเนื้อหาเทมเพลตลงในคลิปบอร์ดแล้ว" : "Template content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSelectTemplate = (tmpl: TemplateItemDef) => {
    setPreviewItem(tmpl);
    setPreviewTab("rendered");
    setDeviceMode("desktop");
  };

  const renderTemplateCard = (tmpl: TemplateItemDef) => {
    const meta = NOTE_TEMPLATE_METADATA[tmpl.type];
    const iconStr = getTemplateIcon(tmpl.type, pack) || meta?.icon || tmpl.icon;
    const colorStr = meta?.iconColor || tmpl.color;
    const title = isTh ? tmpl.titleTh : tmpl.titleEn;
    const desc = isTh ? tmpl.descTh : tmpl.descEn;

    return (
      <motion.div
        key={`${tmpl.type}-${tmpl.formatExt}`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSelectTemplate(tmpl)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelectTemplate(tmpl);
          }
        }}
        className="flex flex-col text-left p-3.5 rounded-xl bg-card border-[1.5px] border-border/70 hover:border-primary/60 hover:bg-muted/50 transition-all group shadow-2xs cursor-pointer focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 outline-none relative"
      >
        <div className="flex items-center justify-between w-full">
          {renderCustomIcon(
            iconStr,
            "h-5 w-5 mb-2 group-hover:scale-110 transition-transform shrink-0",
            { color: colorStr }
          )}

          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border border-border/40 bg-sidebar-accent/60 text-muted-foreground uppercase group-hover:border-primary/40 group-hover:text-primary transition-colors">
            .{tmpl.formatExt}
          </span>
        </div>

        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </span>
        <span className="text-[10.5px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
          {desc}
        </span>
      </motion.div>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full min-h-0 overflow-y-auto bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5">
          {/* 1. Header Section (Matching HomeView Style) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-6 w-6 text-primary shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {isTh ? "เทมเพลตทั้งหมด" : "All Templates"}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTh
                  ? "เลือกเทมเพลตสำเร็จรูปเพื่อเริ่มต้นเขียนโน้ต ออกแบบหน้าเว็บ หรือจัดระเบียบงานได้ทันที"
                  : "Choose pre-built templates to start writing notes, building web pages, or organizing tasks."}
              </p>
            </div>

            {/* Functional Search Input Box */}
            <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full md:w-64 transition-all shadow-none group">
              {renderIcon("search", "h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors")}
              <input
                ref={searchInputRef}
                data-templates-search="true"
                type="text"
                placeholder={isTh ? "ค้นหาเทมเพลต..." : "Search templates..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    searchInputRef.current?.blur();
                  }
                }}
                className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  aria-label={isTh ? "ล้างข้อความ" : "Clear search"}
                >
                  {renderIcon("x", "h-3 w-3")}
                </button>
              )}
            </div>
          </div>

          {/* 2. Filter Pills (Shaded / Outlined Tint Style) */}
          <div
            className="flex items-center gap-1.5 pill-scrollbar w-full min-w-0 shrink-0 pb-1"
            onWheel={(e) => {
              if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* 3. Main Templates Showcase */}
          <div className={`space-y-5 ${allFiltered.length === 0 ? "flex-1 flex flex-col items-center justify-center min-h-[360px]" : ""}`}>
            {allFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                  {renderIcon("search", "h-6 w-6 opacity-40")}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {isTh ? "ไม่พบเทมเพลตที่ตรงกับการค้นหา" : "No templates found"}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {isTh
                    ? "ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นเพื่อดูเทมเพลตทั้งหมด"
                    : "Try changing your search keywords or switch category filter to see all templates."}
                </p>
              </div>
            ) : selectedCategory === "all" && !searchQuery ? (
              // Grouped Sections (Markdown, HTML, Text)
              <>
                {/* Markdown (.md) Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-foreground">
                      <span>{isTh ? "เอกสารมาร์กดาวน์ (Markdown .md)" : "Markdown Documents (.md)"}</span>
                    </h2>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {mdGroup.length} {isTh ? "เทมเพลต" : "templates"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {mdGroup.map(renderTemplateCard)}
                  </div>
                </div>

                {/* HTML (.html) Section */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-foreground">
                      <span>{isTh ? "เทมเพลตหน้าเว็บ (HTML .html)" : "Web Page Templates (.html)"}</span>
                    </h2>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {htmlGroup.length} {isTh ? "เทมเพลต" : "templates"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {htmlGroup.map(renderTemplateCard)}
                  </div>
                </div>

                {/* Plain Text (.txt) Section */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-foreground">
                      <span>{isTh ? "ไฟล์ข้อความธรรมดา (Plain Text .txt)" : "Plain Text Documents (.txt)"}</span>
                    </h2>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {txtGroup.length} {isTh ? "เทมเพลต" : "templates"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {txtGroup.map(renderTemplateCard)}
                  </div>
                </div>
              </>
            ) : (
              // Filtered unified grid
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-foreground">
                    <span>
                      {searchQuery
                        ? isTh ? `ผลการค้นหา (${allFiltered.length})` : `Search Results (${allFiltered.length})`
                        : isTh ? `เทมเพลตที่เลือก (${allFiltered.length})` : `Selected Templates (${allFiltered.length})`}
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {allFiltered.map(renderTemplateCard)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High-Fidelity Full-Featured Preview Dialog */}
        <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent
            className="w-[94vw] max-w-4xl h-[78vh] max-h-[680px] rounded-2xl flex flex-col p-4 sm:p-5 overflow-hidden bg-card border border-border shadow-2xl transition-all duration-200 [&>button:last-child]:hidden"
          >
            {/* Header with Title & Preview Controls (Clean horizontal alignment) */}
            <DialogHeader className="shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  {previewItem && (
                    <div className="shrink-0 flex items-center justify-center">
                      {renderCustomIcon(previewItem.icon, "h-5 w-5 shrink-0", { color: previewItem.color })}
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <span>{previewItem ? (isTh ? previewItem.titleTh : previewItem.titleEn) : ""}</span>
                      {previewItem && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/40 bg-sidebar-accent/60 text-muted-foreground uppercase">
                          .{previewItem.formatExt}
                        </span>
                      )}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {previewItem ? (isTh ? previewItem.descTh : previewItem.descEn) : ""}
                    </p>
                  </div>
                </div>

                {/* Right Controls (Device Switcher, Mode Switcher, and Aligned Close Button) */}
                <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto">
                  {/* Device Switcher for HTML */}
                  {previewItem?.format === "html" && previewTab === "rendered" && (
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setDeviceMode("desktop")}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              deviceMode === "desktop"
                                ? "bg-background text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Monitor className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          {isTh ? "เดสก์ท็อป (100%)" : "Desktop (100%)"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setDeviceMode("tablet")}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              deviceMode === "tablet"
                                ? "bg-background text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Tablet className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          {isTh ? "แท็บเล็ต (768px)" : "Tablet (768px)"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setDeviceMode("mobile")}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              deviceMode === "mobile"
                                ? "bg-background text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          {isTh ? "มือถือ (375px)" : "Mobile (375px)"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Mode Switcher (Rendered / Raw Code) */}
                  {previewItem && (
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("rendered")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          previewTab === "rendered"
                            ? "bg-background text-foreground shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>
                          {previewItem.format === "html"
                            ? isTh ? "ดูหน้าเว็บจริง" : "Live Website"
                            : previewItem.format === "markdown"
                            ? isTh ? "เอกสารมาร์กดาวน์" : "Formatted Doc"
                            : isTh ? "ข้อความ" : "Text"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("code")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          previewTab === "code"
                            ? "bg-background text-foreground shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span>{isTh ? "โค้ดต้นฉบับ" : "Source Code"}</span>
                      </button>
                    </div>
                  )}

                  {/* Aligned Close Button (✕) */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setPreviewItem(null)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 ml-1"
                        aria-label={isTh ? "ปิด" : "Close"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                      {isTh ? "ปิด (Esc)" : "Close (Esc)"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </DialogHeader>

            {/* High-Fidelity 100% Editor-Matching Preview Content Body */}
            <div className="flex-1 min-h-0 my-2 rounded-xl border border-border/70 bg-background overflow-hidden flex flex-col relative shadow-inner">
              {previewTab === "rendered" ? (
                previewItem?.format === "html" ? (
                  // Live HTML Webpage Preview with Simulated Browser Bar & Device Viewport
                  <div className="w-full h-full flex flex-col bg-muted/20 overflow-hidden">
                    {/* Simulated Browser Bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border/60 text-xs shrink-0 select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
                      </div>

                      <div className="flex items-center gap-2 bg-background/80 border border-border/60 rounded-lg px-3 py-0.5 text-[11px] text-muted-foreground max-w-sm w-full mx-4 justify-center shadow-2xs font-mono">
                        <span>https://preview.luno.local/{previewItem.type}.html</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIframeKey((prev) => prev + 1)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title={isTh ? "โหลดใหม่" : "Reload"}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Responsive Device Container with High-Fidelity Exact Viewport Simulation */}
                    <div
                      ref={previewContainerRef}
                      className="flex-1 min-h-0 w-full flex items-center justify-center p-2 overflow-hidden bg-muted/10"
                    >
                      {deviceMode === "desktop" ? (
                        <div className="w-full h-full transition-all duration-300 shadow-md rounded-lg overflow-hidden border border-border/50 bg-white">
                          <iframe
                            key={iframeKey}
                            title="Live HTML Preview"
                            srcDoc={previewContent}
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full border-0 bg-white block"
                          />
                        </div>
                      ) : (
                        <div
                          className="transition-all duration-300 shadow-md rounded-lg overflow-hidden border border-border/50 bg-white relative flex-shrink-0"
                          style={{
                            width: deviceViewport.wrapperW,
                            height: deviceViewport.wrapperH,
                          }}
                        >
                          <div
                            style={{
                              width: `${deviceViewport.targetW}px`,
                              height: deviceViewport.iframeH,
                              transform: deviceViewport.isScaled ? `scale(${deviceViewport.scale})` : undefined,
                              transformOrigin: "top left",
                            }}
                          >
                            <iframe
                              key={iframeKey}
                              title="Live HTML Preview"
                              srcDoc={previewContent}
                              sandbox="allow-scripts allow-same-origin"
                              style={{
                                width: `${deviceViewport.targetW}px`,
                                height: deviceViewport.iframeH,
                              }}
                              className="border-0 bg-white block"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : previewItem?.format === "markdown" ? (
                  // 100% Editor-Matching Realistic Markdown Preview (Scrollbar on the far right edge)
                  <div className="flex-1 h-full overflow-y-auto w-full select-text">
                    <div className="editor-content-area flex w-full min-w-0 flex-col max-w-2xl sm:max-w-3xl mx-auto min-h-full px-6 py-5">
                      <div
                        className={`tiptap ProseMirror ${EDITOR_CLASSES} ${
                          settings.accentHeadings
                            ? "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&>h1:first-child]:text-primary"
                            : "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-muted-foreground [&>h1:first-child]:text-foreground"
                        }`}
                        style={{
                          fontFamily: settings?.fontFamily || "var(--editor-font-family, var(--app-font-family))",
                          fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
                          lineHeight: settings?.lineHeight || undefined,
                        }}
                        dangerouslySetInnerHTML={{ __html: renderedMarkdownHtml }}
                      />
                    </div>
                  </div>
                ) : (
                  // Plain Text Formatting (Matching Plain Text Editor with scrollbar on the far right edge)
                  <div className="flex-1 h-full overflow-y-auto w-full">
                    <div
                      className="max-w-2xl mx-auto px-6 py-5 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed selection:bg-primary/20"
                      style={{
                        fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
                      }}
                    >
                      {previewContent}
                    </div>
                  </div>
                )
              ) : (
                // Raw Source Code
                <div className="flex-1 h-full overflow-auto p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/40 selection:bg-primary/20">
                  {previewContent}
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <DialogFooter className="shrink-0 flex flex-row items-center justify-between gap-2 sm:justify-between pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPreview}
                className="rounded-xl text-xs gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? (isTh ? "คัดลอกแล้ว" : "Copied") : (isTh ? "คัดลอกโค้ด" : "Copy code")}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  {isTh ? "ปิด" : "Close"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (previewItem) {
                      onCreateWithTemplate(previewItem.type, previewItem.format);
                      setPreviewItem(null);
                    }
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isTh ? "ใช้เทมเพลตนี้" : "Use this template"}</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
