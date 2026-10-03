import type { NoteTemplateType } from "@/lib/templates";

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

export const TEMPLATE_CATEGORIES = [
  { id: "work", labelEn: "Work & Business", labelTh: "งาน & ธุรกิจ", icon: "briefcase" },
  { id: "daily", labelEn: "Daily & Wellness", labelTh: "สุขภาพ & ส่วนตัว", icon: "calendar" },
  { id: "study", labelEn: "Study & Research", labelTh: "การเรียน & วิจัย", icon: "graduationCap" },
  { id: "dev", labelEn: "Dev & Tech", labelTh: "พัฒนาโปรแกรม & IT", icon: "code" },
  { id: "web", labelEn: "Web & UI", labelTh: "เว็บไซต์ & โค้ด", icon: "globe" },
] as const;

export const TEMPLATE_DEFINITIONS: TemplateItemDef[] = [
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

export interface PendingTemplatePreview {
  type: string;
  format?: "markdown" | "html" | "plain";
  formatExt?: string;
}

let pendingTemplatePreview: PendingTemplatePreview | null = null;

export function setPendingTemplatePreview(preview: PendingTemplatePreview | null) {
  pendingTemplatePreview = preview;
  if (typeof window !== "undefined") {
    try {
      if (preview) {
        window.sessionStorage?.setItem("luno_pending_template_preview", JSON.stringify(preview));
        (window as any).__pendingTemplatePreview = preview;
      } else {
        window.sessionStorage?.removeItem("luno_pending_template_preview");
        (window as any).__pendingTemplatePreview = null;
      }
    } catch {
      /* ignore */
    }
  }
}

export function getPendingTemplatePreview(): PendingTemplatePreview | null {
  if (pendingTemplatePreview) return pendingTemplatePreview;
  if (typeof window !== "undefined") {
    try {
      if ((window as any).__pendingTemplatePreview) {
        return (window as any).__pendingTemplatePreview;
      }
      const saved = window.sessionStorage?.getItem("luno_pending_template_preview");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}
