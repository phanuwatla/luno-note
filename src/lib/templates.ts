import { formatDate, formatTime } from "./dateTimeFormatter";
import { updateFrontmatterIcon } from "./frontmatter";

export type NoteTemplateType =
  | "blank"
  | "meeting"
  | "daily"
  | "project"
  | "todo"
  | "study"
  | "bug"
  | "weekly-review"
  | "book-notes"
  | "cornell-notes"
  | "content-planner"
  | "api-doc"
  | "habit-tracker"
  | "monthly-budget"
  | "travel-itinerary"
  | "basic-website"
  | "landing-page"
  | "portfolio"
  | "blog"
  | "dashboard"
  | "documentation"
  | "link-tree"
  | "invoice"
  | "pricing-table"
  | "event-invite"
  | "restaurant-menu"
  | "faq-page"
  | "notes"
  | "journal"
  | "readme"
  | "changelog"
  | "work-log"
  | "lecture-notes"
  | "server-config"
  | "incident-report"
  | "shopping-list"
  | "recipe-txt";

export interface TemplateMetadata {
  type: NoteTemplateType;
  titleKey: string;
  defaultTitleEn: string;
  defaultTitleTh: string;
  filePrefix: string;
  icon?: string;
  iconColor?: string;
  icons?: {
    lucide: string;
    tabler: string;
    phosphor: string;
  };
}

export const NOTE_TEMPLATE_METADATA: Record<NoteTemplateType, TemplateMetadata> = {
  daily: {
    type: "daily",
    titleKey: "templates.dailyTitle",
    defaultTitleEn: "Daily Note",
    defaultTitleTh: "บันทึกประจำวัน",
    filePrefix: "Daily",
    icon: "lucide:Calendar",
    iconColor: "#10b981",
    icons: {
      lucide: "lucide:Calendar",
      tabler: "tabler:IconCalendar",
      phosphor: "phosphor:Calendar",
    },
  },
  todo: {
    type: "todo",
    titleKey: "templates.todoTitle",
    defaultTitleEn: "To-Do List",
    defaultTitleTh: "รายการสิ่งที่ต้องทำ",
    filePrefix: "Todo",
    icon: "lucide:CheckSquare",
    iconColor: "#3b82f6",
    icons: {
      lucide: "lucide:CheckSquare",
      tabler: "tabler:IconSquareCheck",
      phosphor: "phosphor:CheckSquare",
    },
  },
  meeting: {
    type: "meeting",
    titleKey: "templates.meetingTitle",
    defaultTitleEn: "Meeting Notes",
    defaultTitleTh: "บันทึกการประชุม",
    filePrefix: "Meeting",
    icon: "lucide:Users",
    iconColor: "#8b5cf6",
    icons: {
      lucide: "lucide:Users",
      tabler: "tabler:IconUsers",
      phosphor: "phosphor:Users",
    },
  },
  project: {
    type: "project",
    titleKey: "templates.projectTitle",
    defaultTitleEn: "Project Plan",
    defaultTitleTh: "แผนงานโครงการ",
    filePrefix: "Project",
    icon: "lucide:Briefcase",
    iconColor: "#f59e0b",
    icons: {
      lucide: "lucide:Briefcase",
      tabler: "tabler:IconBriefcase",
      phosphor: "phosphor:Briefcase",
    },
  },
  study: {
    type: "study",
    titleKey: "templates.studyTitle",
    defaultTitleEn: "Idea Brainstorm",
    defaultTitleTh: "ระดมความคิด",
    filePrefix: "Brainstorm",
    icon: "lucide:Lightbulb",
    iconColor: "#f43f5e",
    icons: {
      lucide: "lucide:Lightbulb",
      tabler: "tabler:IconBulb",
      phosphor: "phosphor:Lightbulb",
    },
  },
  bug: {
    type: "bug",
    titleKey: "templates.bugTitle",
    defaultTitleEn: "Bug Report",
    defaultTitleTh: "รายงานปัญหา",
    filePrefix: "Bug",
    icon: "lucide:Bug",
    iconColor: "#ef4444",
    icons: {
      lucide: "lucide:Bug",
      tabler: "tabler:IconBug",
      phosphor: "phosphor:Bug",
    },
  },
  "weekly-review": {
    type: "weekly-review",
    titleKey: "settings.optWeeklyReview",
    defaultTitleEn: "Weekly Review",
    defaultTitleTh: "สรุปประจำสัปดาห์",
    filePrefix: "Weekly",
    icon: "lucide:CalendarCheck",
    iconColor: "#0ea5e9",
    icons: {
      lucide: "lucide:CalendarCheck",
      tabler: "tabler:IconCalendarStats",
      phosphor: "phosphor:CalendarCheck",
    },
  },
  "book-notes": {
    type: "book-notes",
    titleKey: "settings.optBookNotes",
    defaultTitleEn: "Book Notes",
    defaultTitleTh: "สรุปหนังสือ",
    filePrefix: "Book",
    icon: "lucide:Bookmark",
    iconColor: "#a855f7",
    icons: {
      lucide: "lucide:Bookmark",
      tabler: "tabler:IconBookmark",
      phosphor: "phosphor:BookmarkSimple",
    },
  },
  "basic-website": {
    type: "basic-website",
    titleKey: "settings.optHtmlBasic",
    defaultTitleEn: "Basic Website",
    defaultTitleTh: "Basic Website",
    filePrefix: "Website",
    icon: "lucide:Globe",
    iconColor: "#3b82f6",
    icons: {
      lucide: "lucide:Globe",
      tabler: "tabler:IconWorld",
      phosphor: "phosphor:Globe",
    },
  },
  "landing-page": {
    type: "landing-page",
    titleKey: "settings.optHtmlLanding",
    defaultTitleEn: "Landing Page",
    defaultTitleTh: "Landing Page",
    filePrefix: "Landing",
    icon: "lucide:Rocket",
    iconColor: "#f43f5e",
    icons: {
      lucide: "lucide:Rocket",
      tabler: "tabler:IconRocket",
      phosphor: "phosphor:Rocket",
    },
  },
  portfolio: {
    type: "portfolio",
    titleKey: "settings.optHtmlPortfolio",
    defaultTitleEn: "Portfolio",
    defaultTitleTh: "Portfolio",
    filePrefix: "Portfolio",
    icon: "lucide:User",
    iconColor: "#10b981",
    icons: {
      lucide: "lucide:User",
      tabler: "tabler:IconUser",
      phosphor: "phosphor:User",
    },
  },
  blog: {
    type: "blog",
    titleKey: "settings.optHtmlBlog",
    defaultTitleEn: "Blog",
    defaultTitleTh: "Blog",
    filePrefix: "Blog",
    icon: "lucide:BookOpen",
    iconColor: "#8b5cf6",
    icons: {
      lucide: "lucide:BookOpen",
      tabler: "tabler:IconBook",
      phosphor: "phosphor:BookOpen",
    },
  },
  dashboard: {
    type: "dashboard",
    titleKey: "settings.optHtmlDashboard",
    defaultTitleEn: "Dashboard",
    defaultTitleTh: "Dashboard",
    filePrefix: "Dashboard",
    icon: "lucide:LayoutDashboard",
    iconColor: "#06b6d4",
    icons: {
      lucide: "lucide:LayoutDashboard",
      tabler: "tabler:IconDashboard",
      phosphor: "phosphor:SquaresFour",
    },
  },
  documentation: {
    type: "documentation",
    titleKey: "settings.optHtmlDoc",
    defaultTitleEn: "Documentation",
    defaultTitleTh: "Documentation",
    filePrefix: "Docs",
    icon: "lucide:FileCode",
    iconColor: "#6366f1",
    icons: {
      lucide: "lucide:FileCode",
      tabler: "tabler:IconCode",
      phosphor: "phosphor:CodeBlock",
    },
  },
  "link-tree": {
    type: "link-tree",
    titleKey: "settings.optHtmlLinks",
    defaultTitleEn: "Link in Bio",
    defaultTitleTh: "Link in Bio",
    filePrefix: "Links",
    icon: "lucide:Share2",
    iconColor: "#ec4899",
    icons: {
      lucide: "lucide:Share2",
      tabler: "tabler:IconShare",
      phosphor: "phosphor:ShareNetwork",
    },
  },
  notes: {
    type: "notes",
    titleKey: "settings.optTxtNotes",
    defaultTitleEn: "Notes",
    defaultTitleTh: "Notes",
    filePrefix: "Notes",
    icon: "lucide:FileText",
    iconColor: "#64748b",
    icons: {
      lucide: "lucide:FileText",
      tabler: "tabler:IconFileText",
      phosphor: "phosphor:FileText",
    },
  },
  journal: {
    type: "journal",
    titleKey: "settings.optTxtJournal",
    defaultTitleEn: "Journal",
    defaultTitleTh: "Journal",
    filePrefix: "Journal",
    icon: "lucide:Calendar",
    iconColor: "#10b981",
    icons: {
      lucide: "lucide:Calendar",
      tabler: "tabler:IconCalendar",
      phosphor: "phosphor:Calendar",
    },
  },
  readme: {
    type: "readme",
    titleKey: "settings.optTxtReadme",
    defaultTitleEn: "README",
    defaultTitleTh: "README",
    filePrefix: "README",
    icon: "lucide:BookOpen",
    iconColor: "#6366f1",
    icons: {
      lucide: "lucide:BookOpen",
      tabler: "tabler:IconBook",
      phosphor: "phosphor:BookOpen",
    },
  },
  changelog: {
    type: "changelog",
    titleKey: "settings.optTxtChangelog",
    defaultTitleEn: "CHANGELOG",
    defaultTitleTh: "CHANGELOG",
    filePrefix: "CHANGELOG",
    icon: "lucide:History",
    iconColor: "#f97316",
    icons: {
      lucide: "lucide:History",
      tabler: "tabler:IconHistory",
      phosphor: "phosphor:ClockCounterClockwise",
    },
  },
  "work-log": {
    type: "work-log",
    titleKey: "settings.optTxtWorkLog",
    defaultTitleEn: "Work Log",
    defaultTitleTh: "Work Log",
    filePrefix: "WorkLog",
    icon: "lucide:Clock",
    iconColor: "#14b8a6",
    icons: {
      lucide: "lucide:Clock",
      tabler: "tabler:IconClock",
      phosphor: "phosphor:Clock",
    },
  },
  "cornell-notes": {
    type: "cornell-notes",
    titleKey: "settings.optCornellNotes",
    defaultTitleEn: "Cornell Notes",
    defaultTitleTh: "โน้ตแบบคอร์เนลล์",
    filePrefix: "Cornell",
    icon: "lucide:GraduationCap",
    iconColor: "#6366f1",
    icons: {
      lucide: "lucide:GraduationCap",
      tabler: "tabler:IconSchool",
      phosphor: "phosphor:GraduationCap",
    },
  },
  "content-planner": {
    type: "content-planner",
    titleKey: "settings.optContentPlanner",
    defaultTitleEn: "Content & Video Planner",
    defaultTitleTh: "วางแผนคอนเทนต์และสคริปต์",
    filePrefix: "ContentPlan",
    icon: "lucide:Video",
    iconColor: "#ef4444",
    icons: {
      lucide: "lucide:Video",
      tabler: "tabler:IconVideo",
      phosphor: "phosphor:VideoCamera",
    },
  },
  "api-doc": {
    type: "api-doc",
    titleKey: "settings.optApiDoc",
    defaultTitleEn: "API Specification",
    defaultTitleTh: "เอกสารสเปก API",
    filePrefix: "APISpec",
    icon: "lucide:Code2",
    iconColor: "#0ea5e9",
    icons: {
      lucide: "lucide:Code2",
      tabler: "tabler:IconCode",
      phosphor: "phosphor:Code",
    },
  },
  "habit-tracker": {
    type: "habit-tracker",
    titleKey: "settings.optHabitTracker",
    defaultTitleEn: "Habit & Wellness Tracker",
    defaultTitleTh: "ติดตามนิสัยและสุขภาพ",
    filePrefix: "HabitTracker",
    icon: "lucide:Activity",
    iconColor: "#10b981",
    icons: {
      lucide: "lucide:Activity",
      tabler: "tabler:IconActivity",
      phosphor: "phosphor:Heartbeat",
    },
  },
  "monthly-budget": {
    type: "monthly-budget",
    titleKey: "settings.optMonthlyBudget",
    defaultTitleEn: "Monthly Budget Planner",
    defaultTitleTh: "วางแผนการเงินประจำเดือน",
    filePrefix: "Budget",
    icon: "lucide:Wallet",
    iconColor: "#14b8a6",
    icons: {
      lucide: "lucide:Wallet",
      tabler: "tabler:IconWallet",
      phosphor: "phosphor:Wallet",
    },
  },
  "travel-itinerary": {
    type: "travel-itinerary",
    titleKey: "settings.optTravelItinerary",
    defaultTitleEn: "Travel Itinerary",
    defaultTitleTh: "แผนการท่องเที่ยว",
    filePrefix: "Trip",
    icon: "lucide:Compass",
    iconColor: "#06b6d4",
    icons: {
      lucide: "lucide:Compass",
      tabler: "tabler:IconCompass",
      phosphor: "phosphor:Compass",
    },
  },
  invoice: {
    type: "invoice",
    titleKey: "settings.optHtmlInvoice",
    defaultTitleEn: "Invoice & Receipt",
    defaultTitleTh: "ใบแจ้งหนี้และใบเสร็จ",
    filePrefix: "Invoice",
    icon: "lucide:Receipt",
    iconColor: "#059669",
    icons: {
      lucide: "lucide:Receipt",
      tabler: "tabler:IconReceipt",
      phosphor: "phosphor:Receipt",
    },
  },
  "pricing-table": {
    type: "pricing-table",
    titleKey: "settings.optHtmlPricingTable",
    defaultTitleEn: "Pricing Plans Table",
    defaultTitleTh: "ตารางแพ็กเกจราคา",
    filePrefix: "Pricing",
    icon: "lucide:BadgePercent",
    iconColor: "#3b82f6",
    icons: {
      lucide: "lucide:BadgePercent",
      tabler: "tabler:IconDiscount2",
      phosphor: "phosphor:Tag",
    },
  },
  "event-invite": {
    type: "event-invite",
    titleKey: "settings.optHtmlEventInvite",
    defaultTitleEn: "Event Invitation & RSVP",
    defaultTitleTh: "การ์ดเชิญและลงทะเบียน",
    filePrefix: "Event",
    icon: "lucide:Ticket",
    iconColor: "#ec4899",
    icons: {
      lucide: "lucide:Ticket",
      tabler: "tabler:IconTicket",
      phosphor: "phosphor:Ticket",
    },
  },
  "restaurant-menu": {
    type: "restaurant-menu",
    titleKey: "settings.optHtmlRestaurantMenu",
    defaultTitleEn: "Restaurant & Cafe Menu",
    defaultTitleTh: "เมนูร้านอาหารและคาเฟ่",
    filePrefix: "Menu",
    icon: "lucide:Coffee",
    iconColor: "#d97706",
    icons: {
      lucide: "lucide:Coffee",
      tabler: "tabler:IconCoffee",
      phosphor: "phosphor:Coffee",
    },
  },
  "faq-page": {
    type: "faq-page",
    titleKey: "settings.optHtmlFaqPage",
    defaultTitleEn: "Help Center & FAQ",
    defaultTitleTh: "ศูนย์ช่วยเหลือและ FAQ",
    filePrefix: "FAQ",
    icon: "lucide:HelpCircle",
    iconColor: "#6366f1",
    icons: {
      lucide: "lucide:HelpCircle",
      tabler: "tabler:IconHelp",
      phosphor: "phosphor:Question",
    },
  },
  "lecture-notes": {
    type: "lecture-notes",
    titleKey: "settings.optTxtLectureNotes",
    defaultTitleEn: "Lecture Notes",
    defaultTitleTh: "บันทึกเลกเชอร์",
    filePrefix: "Lecture",
    icon: "lucide:GraduationCap",
    iconColor: "#6366f1",
    icons: {
      lucide: "lucide:GraduationCap",
      tabler: "tabler:IconSchool",
      phosphor: "phosphor:GraduationCap",
    },
  },
  "server-config": {
    type: "server-config",
    titleKey: "settings.optTxtServerConfig",
    defaultTitleEn: "Server Config",
    defaultTitleTh: "การตั้งค่าเซิร์ฟเวอร์",
    filePrefix: "ServerConfig",
    icon: "lucide:Server",
    iconColor: "#0ea5e9",
    icons: {
      lucide: "lucide:Server",
      tabler: "tabler:IconServer",
      phosphor: "phosphor:HardDrives",
    },
  },
  "incident-report": {
    type: "incident-report",
    titleKey: "settings.optTxtIncidentReport",
    defaultTitleEn: "Incident Postmortem",
    defaultTitleTh: "รายงานวิเคราะห์เหตุขัดข้อง",
    filePrefix: "Incident",
    icon: "lucide:AlertTriangle",
    iconColor: "#ef4444",
    icons: {
      lucide: "lucide:AlertTriangle",
      tabler: "tabler:IconAlertTriangle",
      phosphor: "phosphor:Warning",
    },
  },
  "shopping-list": {
    type: "shopping-list",
    titleKey: "settings.optTxtShoppingList",
    defaultTitleEn: "Shopping List",
    defaultTitleTh: "รายการซื้อของ",
    filePrefix: "Shopping",
    icon: "lucide:ShoppingCart",
    iconColor: "#10b981",
    icons: {
      lucide: "lucide:ShoppingCart",
      tabler: "tabler:IconShoppingCart",
      phosphor: "phosphor:ShoppingCart",
    },
  },
  "recipe-txt": {
    type: "recipe-txt",
    titleKey: "settings.optTxtRecipe",
    defaultTitleEn: "Recipe",
    defaultTitleTh: "สูตรอาหาร",
    filePrefix: "Recipe",
    icon: "lucide:Utensils",
    iconColor: "#f59e0b",
    icons: {
      lucide: "lucide:Utensils",
      tabler: "tabler:IconToolsKitchen2",
      phosphor: "phosphor:CookingPot",
    },
  },
  blank: {
    type: "blank",
    titleKey: "templates.blankTitle",
    defaultTitleEn: "Blank Document",
    defaultTitleTh: "เอกสารเปล่า",
    filePrefix: "Note",
    icon: undefined,
    iconColor: undefined,
    icons: {
      lucide: "lucide:Plus",
      tabler: "tabler:IconPlus",
      phosphor: "phosphor:Plus",
    },
  },
};

export function getNoteTemplateMetadata(templateType: NoteTemplateType): TemplateMetadata {
  return NOTE_TEMPLATE_METADATA[templateType] || NOTE_TEMPLATE_METADATA.blank;
}

export function getTemplateIcon(templateType: NoteTemplateType, pack: string = "lucide"): string | undefined {
  const meta = NOTE_TEMPLATE_METADATA[templateType];
  if (!meta) return undefined;
  const packKey = (pack === "tabler" || pack === "phosphor") ? pack : "lucide";
  return meta.icons?.[packKey] || meta.icon;
}

export function getDefaultTemplateForExtension(
  settings?: {
    defaultTemplateMd?: NoteTemplateType;
    defaultTemplateTxt?: NoteTemplateType;
    defaultTemplateHtml?: NoteTemplateType;
    defaultNoteTemplate?: NoteTemplateType;
  },
  fileNameOrFormat?: string
): NoteTemplateType {
  if (!settings) return "blank";
  const name = (fileNameOrFormat || "").toLowerCase();
  if (name.endsWith(".txt") || name === "plain" || name === "txt") {
    return settings.defaultTemplateTxt || "blank";
  }
  if (name.endsWith(".html") || name.endsWith(".htm") || name === "html" || name === "htm") {
    return settings.defaultTemplateHtml || "blank";
  }
  return settings.defaultTemplateMd || settings.defaultNoteTemplate || "blank";
}

export function getNoteTemplateContent(
  templateType: NoteTemplateType,
  lang: "en" | "th" = "en",
  format: "markdown" | "html" | "plain" = "markdown",
  dateFormat: string = "YYYY-MM-DD",
  timeFormat: string = "24h",
  iconPack: string = "lucide"
): string {
  const isTh = lang === "th";
  const now = new Date();
  const dateStr = formatDate(now, dateFormat, lang);
  const timeStr = formatTime(now, timeFormat, lang);

  // Handle Plain Text Format templates (.txt)
  if (format === "plain") {
    if (!templateType || templateType === "blank") {
      return "";
    }

    if (templateType === "notes") {
      if (isTh) {
        return (
          `โน้ตบันทึก - [หัวข้อการทำงาน]\n` +
          `=======================================\n` +
          `วันที่: ${dateStr}\n` +
          `เวลา: ${timeStr}\n\n` +
          `บันทึก:\n` +
          `- สรุปประเด็นการประชุมรอบเช้ากับทีมพัฒนาและ Product Owner\n` +
          `- ตรวจสอบความถูกต้องของ UI/UX Design tokens ในระบบธีมใหม่\n` +
          `- นัดหมายพูดคุยเรื่องระบบสำรองข้อมูลอัตโนมัติในสัปดาห์หน้า\n`
        );
      }
      return (
        `Quick Notes - [Project Sync]\n` +
        `=======================================\n` +
        `Date: ${dateStr}\n` +
        `Time: ${timeStr}\n\n` +
        `Notes:\n` +
        `- Morning engineering alignment sync regarding quarterly sprint goals\n` +
        `- Review design tokens and typography hierarchy for new theme system\n` +
        `- Schedule follow-up architecture review for automated database backups\n`
      );
    }

    if (templateType === "readme") {
      if (isTh) {
        return (
          `=======================================\n` +
          `ชื่อโปรเจกต์ (PROJECT NAME)\n` +
          `=======================================\n\n` +
          `1. ภาพรวมโปรเจกต์ (Overview)\n` +
          `---------------------------\n` +
          `แอปพลิเคชันจัดการบันทึกและเอกสารที่เน้นความเร็ว ความเป็นส่วนตัว และความเรียบง่าย\n\n` +
          `2. ข้อกำหนดและการติดตั้ง (Installation & Setup)\n` +
          `----------------------------------------------------\n` +
          `- ความต้องการของระบบ: Node.js 18+ หรือ Bun 1.0+, พื้นที่ว่าง 500 MB\n` +
          `- ขั้นตอนการติดตั้ง: รันคำสั่ง npm install และ npm run dev เพื่อเริ่มต้นเซิร์ฟเวอร์\n\n` +
          `3. วิธีการใช้งาน (Usage)\n` +
          `-----------------------------------\n` +
          `- คำสั่งเปิดใช้งาน: เปิดเว็บเบราว์เซอร์แล้วไปที่ http://localhost:5173\n` +
          `- ตัวอย่างการใช้งาน: สร้างบันทึกใหม่ ค้นหาข้อมูลแบบเรียลไทม์ และสลับโหมดการแสดงผล\n\n` +
          `4. โครงสร้างไฟล์ (File Structure)\n` +
          `-------------------------------\n` +
          `/\n` +
          `├── src/\n` +
          `├── docs/\n` +
          `└── README.txt\n\n` +
          `5. ผู้จัดทำ & ข้อมูลติดต่อ (Author & Contact)\n` +
          `-----------------------------------------\n` +
          `- ผู้พัฒนา: ทีมพัฒนา Luno (core-team@lunonote.app)\n` +
          `- ช่องทางติดต่อ / ลิงก์: https://github.com/phanuwatla/luno-note\n`
        );
      }
      return (
        `=======================================\n` +
        `PROJECT NAME / REPOSITORY README\n` +
        `=======================================\n\n` +
        `1. Overview\n` +
        `-----------\n` +
        `A high-performance local-first notes application crafted for speed, privacy, and simplicity.\n\n` +
        `2. Installation & Setup\n` +
        `-----------------------\n` +
        `- Requirements: Node.js 18+ or Bun 1.0+, 500 MB available disk space\n` +
        `- Steps to install and get started: Run npm install followed by npm run dev\n\n` +
        `3. Usage\n` +
        `--------\n` +
        `- Commands / how to run: Open your browser at http://localhost:5173\n` +
        `- Example usage: Create new notes, perform instant fuzzy search, and toggle reading mode\n\n` +
        `4. File Structure\n` +
        `-----------------\n` +
        `/\n` +
        `├── src/\n` +
        `├── docs/\n` +
        `└── README.txt\n\n` +
        `5. Author & Contact\n` +
        `--------------------\n` +
        `- Author: Luno Core Engineering Team (core-team@lunonote.app)\n` +
        `- Contact / Links: https://github.com/phanuwatla/luno-note\n`
      );
    }

    if (templateType === "meeting") {
      if (isTh) {
        return (
          `บันทึกการประชุม - ${dateStr}\n` +
          `=======================================\n\n` +
          `รายละเอียดการประชุม\n` +
          `-------------------\n` +
          `- วันที่: ${dateStr}\n` +
          `- เวลา: ${timeStr}\n` +
          `- ผู้เข้าร่วม: กิตติศักดิ์ (Tech Lead), วริศรา (Product Manager), ณภัทร (Senior Dev)\n\n` +
          `วาระการประชุม\n` +
          `-------------\n` +
          `- [x] วาระที่ 1: ติดตามความคืบหน้าระบบ Offline Storage และ Database Migration\n` +
          `- [x] วาระที่ 2: วางแผนการเปิดตัว Public Beta และการทดสอบความปลอดภัย\n\n` +
          `สรุปการพูดคุย & บันทึก\n` +
          `---------------------\n` +
          `- ทีมเห็นชอบให้ใช้ IndexedDB ร่วมกับ Web Locks API เพื่อป้องกันการเขียนไฟล์ชนกัน\n` +
          `- กำหนดการทดสอบระบบภายในรอบสุดท้ายคือวันศุกร์นี้เวลา 15:00 น.\n\n` +
          `งานที่ต้องทำต่อ (Action Items)\n` +
          `-----------------------------\n` +
          `- [ ] งานที่ 1: จัดทำแบบจำลองข้อมูล Database Schema (ผู้รับผิดชอบ: กิตติศักดิ์)\n` +
          `- [ ] งานที่ 2: ออกแบบสถานะการเชื่อมต่อ Network Indicator (ผู้รับผิดชอบ: ณภัทร)\n`
        );
      }
      return (
        `Meeting Notes - ${dateStr}\n` +
        `=======================================\n\n` +
        `Details\n` +
        `-------\n` +
        `- Date: ${dateStr}\n` +
        `- Time: ${timeStr}\n` +
        `- Attendees: Alex (Tech Lead), Sarah (Product Manager), David (Senior Dev)\n\n` +
        `Agenda\n` +
        `------\n` +
        `- [x] Item 1: Review offline storage synchronization and conflict resolution\n` +
        `- [x] Item 2: Finalize public beta timeline and security audit items\n\n` +
        `Discussion & Notes\n` +
        `------------------\n` +
        `- Aligned on using IndexedDB paired with Web Locks API to eliminate write collisions\n` +
        `- Internal staging smoke tests scheduled for this Friday at 15:00 UTC\n\n` +
        `Action Items\n` +
        `------------\n` +
        `- [ ] Task 1: Document database schema migrations (Assigned to: Alex)\n` +
        `- [ ] Task 2: Implement offline connection status indicator (Assigned to: David)\n`
      );
    }

    if (templateType === "daily") {
      if (isTh) {
        return (
          `บันทึกประจำวัน - ${dateStr}\n` +
          `=======================================\n\n` +
          `สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ\n` +
          `---------------------------------------\n` +
          `- แก้ไขปัญหา Memory Leak ในหน้าพรีวิวเอกสารได้สำเร็จ ทำให้ระบบลื่นไหลขึ้น\n` +
          `- ได้รับคำแนะนำดีๆ จากเพื่อนร่วมทีมเรื่องการจัดการ State ในคอมโพเนนต์ขนาดใหญ่\n\n` +
          `เป้าหมายสำคัญวันนี้\n` +
          `-------------------\n` +
          `- [ ] ตรวจสอบโค้ดรีวิว (PR #42) และ Merge ฟีเจอร์ตัวช่วยเขียน AI เข้าสู่ Main\n` +
          `- [ ] ปรับปรุงหน้าจอ Settings เพิ่มตัวเลือกปรับขนาดฟอนต์ของตัวแก้ไข\n` +
          `- [ ] วางแผนขั้นตอนการทดสอบสำหรับเวอร์ชันถัดไป\n\n` +
          `ข้อคิด & สรุปประจำวัน\n` +
          `---------------------\n` +
          `- การจัดลำดับความสำคัญของงานตั้งแต่ช่วงเช้าช่วยลดความตึงเครียดและทำให้งานเสร็จตามเป้าหมาย\n`
        );
      }
      return (
        `Daily Journal - ${dateStr}\n` +
        `=======================================\n\n` +
        `Highlights & Gratitude\n` +
        `----------------------\n` +
        `- Successfully resolved a memory leak in the document preview canvas, boosting performance\n` +
        `- Collaborative architecture sync with teammates provided great insights on state management\n\n` +
        `Today's Priorities\n` +
        `------------------\n` +
        `- [ ] Review PR #42 and merge the AI writing assistant enhancements into main branch\n` +
        `- [ ] Implement font-size configuration slider inside editor preferences modal\n` +
        `- [ ] Outline end-to-end integration test scenarios for the next release\n\n` +
        `Notes & Reflections\n` +
        `-------------------\n` +
        `- Dedicating the first two hours of the morning to uninterrupted deep work produces the highest quality code\n`
      );
    }

    if (templateType === "project") {
      if (isTh) {
        return (
          `วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]\n` +
          `=======================================\n\n` +
          `ภาพรวมโปรเจกต์\n` +
          `--------------\n` +
          `- วัตถุประสงค์: ออกแบบและพัฒนาระบบเทมเพลตโน้ตอัจฉริยะให้รองรับทั้ง Markdown, HTML และ Plain Text\n` +
          `- กลุ่มเป้าหมาย: นักเรียน นักศึกษา นักเขียน และนักพัฒนาซอฟต์แวร์\n` +
          `- กำหนดการส่งมอบ: ${dateStr}\n\n` +
          `เป้าหมายหลัก (Key Objectives)\n` +
          `-----------------------------\n` +
          `- [ ] เป้าหมายที่ 1: สร้างคลังเทมเพลตมาตรฐานพร้อมเนื้อหาตัวอย่างจริงที่ใช้งานได้ทันที\n` +
          `- [ ] เป้าหมายที่ 2: พัฒนาระบบพรีวิวแยกอุปกรณ์ (Desktop, Tablet, Mobile) ที่แม่นยำ 100%\n\n` +
          `ขั้นตอนดำเนินการ (Milestones & Timeline)\n` +
          `-----------------------------------------\n` +
          `- [x] ระยะที่ 1: วางโครงสร้างและวางแผนสถาปัตยกรรมข้อมูล\n` +
          `- [ ] ระยะที่ 2: ดำเนินการพัฒนาส่วนประกอบ UI และหน้าจอพรีวิว\n` +
          `- [ ] ระยะที่ 3: ทดสอบการทำงานข้ามแพลตฟอร์มและตรวจสอบความปลอดภัย\n` +
          `- [ ] ระยะที่ 4: ปล่อยใช้งานอย่างเป็นทางการพร้อมคู่มือการใช้งาน\n\n` +
          `เครื่องมือและเทคโนโลยีที่ใช้\n` +
          `---------------------------\n` +
          `- React 19, TypeScript, Tailwind CSS, Lucide / Tabler Icons, Vite\n\n` +
          `บันทึกเพิ่มเติม & ไอเดีย\n` +
          `-----------------------\n` +
          `- ควรเพิ่มฟังก์ชันคัดลอกเนื้อหาเทมเพลตด่วน และปุ่มสร้างไฟล์ตามนามสกุล (.md, .html, .txt)\n`
        );
      }
      return (
        `Project Planning - [Project Name]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Objective: Design and deliver a modern note template system supporting Markdown, HTML, and Plain Text\n` +
        `- Target Audience: Students, knowledge workers, creators, and software developers\n` +
        `- Target Launch Date: ${dateStr}\n\n` +
        `Key Objectives\n` +
        `--------------\n` +
        `- [ ] Objective 1: Curate a high-quality template catalog with practical, realistic sample data\n` +
        `- [ ] Objective 2: Build an interactive responsive device viewport simulator for HTML & Markdown previews\n\n` +
        `Milestones & Timeline\n` +
        `---------------------\n` +
        `- [x] Phase 1: Planning & Information Architecture\n` +
        `- [ ] Phase 2: Implementation & Component Creation\n` +
        `- [ ] Phase 3: Testing, Accessibility & Quality Assurance\n` +
        `- [ ] Phase 4: Launch & Deployment\n\n` +
        `Tools & Technologies\n` +
        `--------------------\n` +
        `- React 19, TypeScript, Tailwind CSS, Lucide / Tabler / Phosphor Icons, Vite\n\n` +
        `Additional Notes & Brainstorming\n` +
        `--------------------------------\n` +
        `- Consider adding one-click copy button and direct file creation mapped to file extensions (.md, .html, .txt)\n`
      );
    }

    if (templateType === "todo") {
      if (isTh) {
        return (
          `รายการงานที่ต้องทำ - ${dateStr}\n` +
          `=======================================\n\n` +
          `งานด่วนและสำคัญมาก (High Priority)\n` +
          `-----------------------------------\n` +
          `- [ ] ตรวจสอบความปลอดภัยและต่ออายุใบรับรอง SSL บนเซิร์ฟเวอร์หลัก\n` +
          `- [ ] แก้ไขบั๊กการบันทึกไฟล์อัตโนมัติเมื่อผู้ใช้สลับหน้าต่างอย่างรวดเร็ว\n\n` +
          `งานสำคัญทั่วไป (Medium Priority)\n` +
          `---------------------------------\n` +
          `- [ ] ปรับปรุงการแสดงผล Breadcrumb ให้ตรงตามมาตรฐานการออกแบบ\n` +
          `- [ ] เขียน Unit Test เพิ่มเติมสำหรับฟังก์ชันแปลงวันที่และเวลา\n\n` +
          `งานอื่นๆ / งานตามหลัง (Low Priority)\n` +
          `------------------------------------\n` +
          `- [ ] จัดระเบียบโฟลเดอร์รูปภาพและลบไฟล์ขยะที่ไม่ได้ใช้งาน\n\n` +
          `สรุปงานเสร็จสิ้น (Completed)\n` +
          `----------------------------\n` +
          `- [x] ปรับปรุงส่วนหัวของหน้า TemplatesView พร้อมใส่ Tooltip ให้ครบทุกปุ่ม\n`
        );
      }
      return (
        `Task & To-Do List - ${dateStr}\n` +
        `=======================================\n\n` +
        `High Priority\n` +
        `-------------\n` +
        `- [ ] Audit production server SSL certificates and renew domain keys\n` +
        `- [ ] Resolve edge-case file autosave collision when rapidly toggling workspaces\n\n` +
        `Medium Priority\n` +
        `---------------\n` +
        `- [ ] Refine breadcrumb toolbar layout and typography to match editor design\n` +
        `- [ ] Expand unit test coverage for date-time formatting utilities\n\n` +
        `Low Priority\n` +
        `------------\n` +
        `- [ ] Organize assets folder and prune deprecated test fixtures\n\n` +
        `Completed\n` +
        `---------\n` +
        `- [x] Enhanced TemplatesView header toolbar with unified tooltip components\n`
      );
    }

    if (templateType === "study") {
      if (isTh) {
        return (
          `บันทึกการเรียนรู้ - [หัวข้อ/วิชา]\n` +
          `=======================================\n\n` +
          `ข้อมูลทั่วไป\n` +
          `------------\n` +
          `- วิชา/หัวข้อ: สถาปัตยกรรมระบบคลาวด์และฐานข้อมูลแบบกระจายตัว (Cloud & Distributed Systems)\n` +
          `- วันที่: ${dateStr}\n` +
          `- แหล่งอ้างอิง: Designing Data-Intensive Applications (บทที่ 5-7)\n\n` +
          `สรุปเนื้อหาสำคัญ (Key Concepts)\n` +
          `-------------------------------\n` +
          `- ความแตกต่างระหว่างการจำลองข้อมูลแบบ Single-Leader, Multi-Leader และ Leaderless\n` +
          `- กลไก Consensus Algorithm (Raft) ในการจัดการสถานะโหนดเมื่อเกิด Network Partition\n\n` +
          `รายละเอียดและคำอธิบายเพิ่มเติม\n` +
          `------------------------------\n` +
          `- Quorum Reads/Writes กำหนดว่า w + r > n เพื่อรับประกันว่าจะได้อ่านข้อมูลเวอร์ชันล่าสุดเสมอ\n` +
          `- เวกเตอร์คล็อก (Vector Clocks) ช่วยตรวจสอบและระบุการแก้ไขข้อมูลที่เกิดขึ้นพร้อมกัน (Concurrent Writes)\n\n` +
          `คำถามที่ต้องหาคำตอบเพิ่ม (Questions)\n` +
          `------------------------------------\n` +
          `[ ] การประยุกต์ใช้ Raft vs Paxos ในระบบจริงมีข้อได้เปรียบด้านความง่ายในการตรวจสอบความถูกต้องอย่างไร?\n\n` +
          `สรุปความเข้าใจแบบสั้น (Takeaways)\n` +
          `---------------------------------\n` +
          `- ไม่มีสถาปัตยกรรมที่ตอบโจทย์ทุกสถานการณ์ การออกแบบระบบต้องชั่งน้ำหนักระหว่าง Latency, Consistency และ Availability เสมอ\n`
        );
      }
      return (
        `Study & Research Notes - [Subject/Topic]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Subject/Topic: Distributed Database Architectures & Consensus Protocols\n` +
        `- Date: ${dateStr}\n` +
        `- Source/References: Designing Data-Intensive Applications (Chapters 5-7)\n\n` +
        `Key Concepts & Core Ideas\n` +
        `-------------------------\n` +
        `- Single-leader vs multi-leader vs leaderless replication trade-offs\n` +
        `- Raft consensus state machine replication and split-brain resolution\n\n` +
        `Detailed Notes\n` +
        `--------------\n` +
        `- Quorum consistency requires w + r > n to guarantee reading the most recent write\n` +
        `- Vector clocks track causality and identify concurrent conflicting updates\n\n` +
        `Questions to Explore Further\n` +
        `----------------------------\n` +
        `[ ] How does Raft optimize log compaction during sustained high write throughput?\n\n` +
        `Key Takeaways & Summary\n` +
        `-----------------------\n` +
        `- Every distributed system represents a deliberate compromise between latency, consistency, and network partition resilience.\n`
      );
    }

    if (templateType === "bug") {
      if (isTh) {
        return (
          `รายงานปัญหา / บั๊ก - [ชื่อปัญหา]\n` +
          `=======================================\n\n` +
          `รายละเอียดปัญหา (Issue Overview)\n` +
          `--------------------------------\n` +
          `- ความรุนแรง: High (กระทบขั้นตอนการชำระเงินของผู้ใช้)\n` +
          `- สถานะ: In Progress\n` +
          `- วันที่พบปัญหา: ${dateStr}\n\n` +
          `อธิบายพฤติกรรมของปัญหา (Description)\n` +
          `-------------------------------------\n` +
          `- หน้าสั่งซื้อค้างและขึ้นข้อผิดพลาด 500 เมื่อผู้ใช้กดปุ่ม 'ชำระเงิน' ซ้ำอย่างรวดเร็ว\n\n` +
          `ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)\n` +
          `---------------------------------------------\n` +
          `1. เพิ่มสินค้าลงในตะกร้าและไปยังหน้า Checkout\n` +
          `2. ดับเบิลคลิกที่ปุ่ม 'ยืนยันการชำระเงิน' ด้วยความเร็ว\n` +
          `3. สังเกตหน้าจอหมุนโหลดค้างและระบบตัดสต็อกซ้ำซ้อน\n\n` +
          `ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง\n` +
          `-------------------------------------------\n` +
          `- ผลลัพธ์ที่คาดหวัง: ปุ่มยืนยันควรปิดการกดทันที (Disabled) และส่งคำขอเพียงครั้งเดียว\n` +
          `- ผลลัพธ์ที่เกิดขึ้นจริง: คำขอถูกส่งไปยัง Backend 2 ครั้งพร้อมกัน เกิด Race Condition ในการตัดยอดเงิน\n\n` +
          `แนวทางการแก้ไข (Proposed Fix & Action Items)\n` +
          `--------------------------------------------\n` +
          `[ ] เพิ่ม Debounce และตั้งค่าสถานะ isLoading ปิดการคลิกที่ปุ่มทันที\n` +
          `[ ] เพิ่ม Idempotency Key ใน Header ของคำขอ API ฝั่งเซิร์ฟเวอร์\n`
        );
      }
      return (
        `Bug & Issue Report - [Issue Name]\n` +
        `=======================================\n\n` +
        `Issue Overview\n` +
        `--------------\n` +
        `- Severity: High (Affects customer checkout flow)\n` +
        `- Status: In Progress\n` +
        `- Reported Date: ${dateStr}\n\n` +
        `Description\n` +
        `-----------\n` +
        `- The checkout screen freezes and throws an unhandled 500 error when the confirm button is clicked rapidly multiple times.\n\n` +
        `Steps to Reproduce\n` +
        `------------------\n` +
        `1. Add items to shopping cart and proceed to checkout page\n` +
        `2. Rapidly double-click the 'Confirm Payment' button\n` +
        `3. Observe an infinite loading spinner and duplicate balance deductions\n\n` +
        `Expected vs Actual Behavior\n` +
        `---------------------------\n` +
        `- Expected: The confirm button immediately disables upon first click; backend processes exactly one payment\n` +
        `- Actual: Concurrent requests trigger a race condition in payment balance verification\n\n` +
        `Proposed Fix & Action Items\n` +
        `---------------------------\n` +
        `[ ] Add client-side debounce and set button to disabled while submission is pending\n` +
        `[ ] Implement backend idempotency keys to safely deduplicate identical transactions\n`
      );
    }

    if (templateType === "journal") {
      if (isTh) {
        return (
          `ไดอารี่และบันทึกประจำวัน - ${dateStr}\n` +
          `=======================================\n\n` +
          `สิ่งดีๆ & เรื่องที่รู้สึกขอบคุณวันนี้ (Highlights & Gratitude)\n` +
          `----------------------------------------------------------\n` +
          `- วันนี้ทำงานยากที่ค้างคามาหลายวันเสร็จสิ้น และได้ออกไปวิ่งออกกำลังกายตอนเย็น\n` +
          `- ขอบคุณทีมที่ช่วยกันตรวจสอบโค้ดและให้ข้อเสนอแนะที่สร้างสรรค์\n\n` +
          `บันทึกความคิด & เหตุการณ์สำคัญ (Reflections)\n` +
          `--------------------------------------------\n` +
          `- การแบ่งงานชิ้นใหญ่ออกเป็นเป้าหมายย่อยที่ทำเสร็จได้ใน 25 นาที ช่วยให้มีสมาธิและลดความกังวลได้มาก\n\n` +
          `เช็กลิสต์สุขภาพ & นิสัยประจำวัน (Habits & Wellbeing)\n` +
          `-------------------------------------------------\n` +
          `- [x] ออกกำลังกาย / เคลื่อนไหวร่างกาย 30 นาที\n` +
          `- [x] เรียนรู้ / โฟกัสงานสำคัญแบบไม่วอกแวก\n` +
          `- [x] ดื่มน้ำสะอาดครบ 2.5 ลิตรและนอนหลับเต็มอิ่ม\n\n` +
          `เป้าหมาย & สิ่งที่จะโฟกัสในวันพรุ่งนี้ (Tomorrow's Priorities)\n` +
          `---------------------------------------------------------\n` +
          `- [ ] เคลียร์บันทึกการประชุมและแจกแจงงานให้ทีมพัฒนา\n` +
          `- [ ] ทดสอบระบบส่งออกไฟล์ PDF บนเบราว์เซอร์ต่างๆ\n`
        );
      }
      return (
        `Daily Journal - ${dateStr}\n` +
        `=======================================\n\n` +
        `Highlights & Gratitude\n` +
        `----------------------\n` +
        `- What am I grateful for today? Completed a complex database refactor and had time for an evening workout\n` +
        `- What went exceptionally well? Cross-team code review was smooth and uncovered helpful optimizations\n\n` +
        `Today's Reflections & Key Events\n` +
        `--------------------------------\n` +
        `- Breaking down large tasks into focused 25-minute Pomodoro intervals drastically improves output quality\n\n` +
        `Habits & Wellbeing\n` +
        `------------------\n` +
        `- [x] Exercise & Physical Movement (30 mins)\n` +
        `- [x] Learning & Deep Focus sessions\n` +
        `- [x] Rest & Hydration (2.5L water)\n\n` +
        `Tomorrow's Focus & Priorities\n` +
        `-----------------------------\n` +
        `- [ ] Review meeting minutes and assign tickets in the sprint backlog\n` +
        `- [ ] Test PDF document export functionality across modern browsers\n`
      );
    }

    if (templateType === "changelog") {
      if (isTh) {
        return (
          `=======================================\n` +
          `บันทึกการเปลี่ยนแปลง (CHANGELOG)\n` +
          `=======================================\n` +
          `บันทึกรายการปรับปรุง เปลี่ยนแปลง และแก้ไขทั้งหมดของโปรเจกต์นี้\n\n` +
          `[เวอร์ชันที่กำลังพัฒนา / Unreleased]\n` +
          `---------------------------------------\n` +
          `เพิ่มใหม่ (Added):\n` +
          `- รองรับการพรีวิวเทมเพลตแบบ Interactive พร้อมตัวจำลองมุมมองอุปกรณ์ (Desktop, Tablet, Mobile)\n` +
          `- เพิ่มการค้นหาเทมเพลตแบบกรองหมวดหมู่และค้นหาคำสำคัญแบบเรียลไทม์\n\n` +
          `ปรับปรุง (Changed):\n` +
          `- ปรับปรุงแถบเครื่องมือ Breadcrumb ให้มีสไตล์เดียวกับหน้าต่างแก้ไขเอกสาร\n\n` +
          `แก้ไขปัญหา (Fixed):\n` +
          `- ป้องกันลิงก์ในเทมเพลต HTML นำทางออกนอกระบบและจัดการการเลื่อนหน้าแบบ Smooth Scroll\n\n\n` +
          `[1.0.0] - ${dateStr}\n` +
          `---------------------------------------\n` +
          `เพิ่มใหม่ (Added):\n` +
          `- เปิดตัวโปรเจกต์เวอร์ชันแรกพร้อมฟีเจอร์หลัก\n`
        );
      }
      return (
        `=======================================\n` +
        `CHANGELOG\n` +
        `=======================================\n` +
        `All notable changes to this project will be documented in this file.\n\n` +
        `[Unreleased]\n` +
        `---------------------------------------\n` +
        `Added:\n` +
        `- Interactive template live preview with responsive device viewports (Desktop, Tablet, Mobile)\n` +
        `- Real-time search and category filtering across template catalog\n\n` +
        `Changed:\n` +
        `- Modernized TemplatesView breadcrumb toolbar to harmonize with editor design language\n\n` +
        `Fixed:\n` +
        `- Prevented HTML preview links from navigating away and enabled internal smooth scrolling\n\n\n` +
        `[1.0.0] - ${dateStr}\n` +
        `---------------------------------------\n` +
        `Added:\n` +
        `- Initial project release and core features.\n`
      );
    }

    if (templateType === "work-log") {
      if (isTh) {
        return (
          `บันทึกการทำงาน (Work Log) - ${dateStr}\n` +
          `=======================================\n\n` +
          `เป้าหมายหลักประจำวัน (Daily Goals)\n` +
          `---------------------------------\n` +
          `- [ ] เป้าหมายสำคัญที่ 1: ปรับปรุงคุณภาพเนื้อหาเทมเพลตทั้งหมดให้มีข้อมูลตัวอย่างสมบูรณ์\n` +
          `- [ ] เป้าหมายสำคัญที่ 2: ทดสอบระบบความปลอดภัยของลิงก์ในพรีวิว HTML\n\n` +
          `บันทึกช่วงเวลาและงานที่ทำ (Time & Activity Log)\n` +
          `----------------------------------------------\n` +
          `- 09:00 - 10:30 : สำรวจเนื้อหาเทมเพลตและรวบรวมจุดที่ยังเป็นช่องว่างหรือเครื่องหมายขีดเปล่า\n` +
          `- 10:30 - 12:00 : เติมเนื้อหาตัวอย่างจริงในหมวดบันทึกการประชุม วางแผนโปรเจกต์ และไดอารี่\n` +
          `- 13:00 - 15:00 : ตรวจสอบเทมเพลตภาษาอังกฤษและภาษาไทยให้ตรงกันทั้ง Markdown และ Plain Text\n` +
          `- 15:00 - 17:00 : แก้ไขตัวดักจับลิงก์ใน iframe และรันคำสั่ง npm run build เพื่อทดสอบ\n\n` +
          `งานที่ทำเสร็จแล้ว (Completed Tasks)\n` +
          `-----------------------------------\n` +
          `- [x] ปรับปรุงเนื้อหาเทมเพลต Plain Text และ Markdown ครบทุกหัวข้อ\n\n` +
          `งานที่ค้าง / ปัญหาและอุปสรรค (Blockers)\n` +
          `---------------------------------------\n` +
          `- ไม่มีปัญหาที่ขัดขวางการทำงาน ทุกระบบทำงานได้ตามแผน\n\n` +
          `บันทึกเพิ่มเติมและแผนงานพรุ่งนี้ (Tomorrow's Plan)\n` +
          `-----------------------------------------------\n` +
          `- รวบรวมข้อเสนอแนะจากผู้ใช้และปรับปรุงสไตล์การแสดงผลเพิ่มเติม\n`
        );
      }
      return (
        `Work Log - ${dateStr}\n` +
        `=======================================\n\n` +
        `Summary of Goals for Today\n` +
        `--------------------------\n` +
        `- [ ] Primary Goal 1: Populate all note templates with comprehensive, realistic sample data\n` +
        `- [ ] Primary Goal 2: Validate link sandboxing and navigation handling in HTML preview\n\n` +
        `Time & Activity Log\n` +
        `-------------------\n` +
        `- 09:00 - 10:30 : Audited all template files to locate empty bullet markers and missing placeholders\n` +
        `- 10:30 - 12:00 : Populated realistic meeting, project planning, and daily journal content\n` +
        `- 13:00 - 15:00 : Harmonized English and Thai template versions across Markdown and Plain text\n` +
        `- 15:00 - 17:00 : Updated iframe link interception handlers and verified clean npm run build\n\n` +
        `Completed Tasks\n` +
        `---------------\n` +
        `- [x] Successfully enriched all plain text and markdown template definitions\n\n` +
        `Pending & Blockers\n` +
        `------------------\n` +
        `- None; all tasks progressing smoothly according to milestone goals\n\n` +
        `Notes & Tomorrow's Plan\n` +
        `-----------------------\n` +
        `- Collect user feedback and continue fine-tuning editor visual hierarchy\n`
      );
    }

    if (templateType === "lecture-notes") {
      if (isTh) {
        return (
          `บันทึกการเรียน / เลกเชอร์ - [ชื่อวิชา]\n` +
          `=======================================\n\n` +
          `ข้อมูลวิชาและการเรียน\n` +
          `--------------------\n` +
          `- วิชา: CS204 โครงสร้างข้อมูลและขั้นตอนวิธี (Data Structures & Algorithms)\n` +
          `- วันที่: ${dateStr}\n` +
          `- อาจารย์ผู้สอน: รศ.ดร. ธีรภัทร วัฒนพาณิชย์\n` +
          `- หัวข้อการบรรยาย: การค้นหาในกราฟด้วย BFS และ DFS (Breadth-First & Depth-First Search)\n\n` +
          `ประเด็นสำคัญประจำคาบ (Key Concepts)\n` +
          `-----------------------------------\n` +
          `- BFS ใช้วิธีการสำรวจทีละระดับ (Level-by-Level) โดยใช้โครงสร้างข้อมูล Queue (FIFO)\n` +
          `- DFS สำรวจลึกไปตามกิ่งจนสุดทางก่อนย้อนกลับ โดยใช้ Stack หรือการเรียกซ้ำ (Recursion)\n\n` +
          `เนื้อหาและบันทึกรายละเอียด (Lecture Notes)\n` +
          `-----------------------------------------\n` +
          `- การเลือกใช้ Adjacency List ช่วยประหยัดหน่วยความจำสำหรับ Sparse Graph: Space complexity O(V + E)\n` +
          `- BFS การันตีว่าจะพบเส้นทางที่สั้นที่สุด (Shortest Path) ในกราฟที่ไม่มีค่าน้ำหนัก\n\n` +
          `คำถาม / สิ่งที่ต้องทบทวนเพิ่มเติม (Questions & Follow-ups)\n` +
          `---------------------------------------------------------\n` +
          `[ ] การประยุกต์ใช้ DFS ในการจัดลำดับงาน (Topological Sorting) สำหรับ Directed Acyclic Graphs (DAG)\n` +
          `[ ] การบ้านชุดที่ 3 เรื่องการเขียนโปรแกรมค้นหาเส้นทางสั้นที่สุด (กำหนดส่ง: วันศุกร์หน้า)\n\n` +
          `สรุปความเข้าใจใน 2 ประโยค (Summary)\n` +
          `-----------------------------------\n` +
          `- การเลือกโครงสร้างข้อมูลระหว่าง Adjacency List และ Matrix ส่งผลอย่างมากต่อประสิทธิภาพการทำงาน โดย BFS เหมาะสำหรับการหาระยะทางสั้นที่สุด และ DFS เหมาะสำหรับการตรวจจับรอบและการจัดลำดับงาน\n`
        );
      }
      return (
        `Lecture Notes - [Course Name]\n` +
        `=======================================\n\n` +
        `Course & Lecture Info\n` +
        `---------------------\n` +
        `- Course: CS204 Data Structures & Algorithms\n` +
        `- Date: ${dateStr}\n` +
        `- Instructor/Professor: Dr. Alan Vance\n` +
        `- Topic: Graph Traversal Algorithms (BFS & DFS)\n\n` +
        `Key Concepts & Takeaways\n` +
        `------------------------\n` +
        `- BFS explores graph level-by-level using a FIFO queue; optimal for unweighted shortest path\n` +
        `- DFS delves deep into branches before backtracking using a LIFO stack or recursion\n\n` +
        `Detailed Notes\n` +
        `--------------\n` +
        `- Adjacency list representation is memory optimal for sparse graphs: O(V + E) space\n` +
        `- Cycle detection in directed graphs is efficiently solved via DFS coloring (white/gray/black)\n\n` +
        `Questions & Follow-ups\n` +
        `----------------------\n` +
        `[ ] Explore how topological sorting utilizes DFS post-order traversal on DAGs\n` +
        `[ ] Homework assignment #3: Dijkstra pathfinding implementation (Due: Next Friday)\n\n` +
        `Summary in 2 Sentences\n` +
        `----------------------\n` +
        `- Graph traversal techniques form the foundation of routing and dependency resolution. Selecting between BFS and DFS depends on whether branch depth or shortest path level is prioritized.\n`
      );
    }

    if (templateType === "server-config") {
      if (isTh) {
        return (
          `=======================================\n` +
          `การตั้งค่าเซิร์ฟเวอร์ & สภาพแวดล้อม (SERVER CONFIG)\n` +
          `=======================================\n\n` +
          `1. ข้อมูลเซิร์ฟเวอร์ (Server Details)\n` +
          `------------------------------------\n` +
          `- Server Name: prod-api-01 (192.168.1.105)\n` +
          `- Environment: Production\n` +
          `- OS / Version: Ubuntu 24.04 LTS\n` +
          `- วันที่อัปเดตล่าสุด: ${dateStr}\n\n` +
          `2. พอร์ตและบริการที่เปิดใช้งาน (Ports & Services)\n` +
          `-----------------------------------------------\n` +
          `- Port 80 / 443 : Nginx (Reverse Proxy & SSL)\n` +
          `- Port 3000     : Node.js / Web Application\n` +
          `- Port 5432     : PostgreSQL Database\n\n` +
          `3. ตัวแปรสภาพแวดล้อมหลัก (Environment Variables)\n` +
          `-------------------------------------------------\n` +
          `NODE_ENV=production\n` +
          `PORT=3000\n` +
          `DATABASE_URL=postgres://app_user:secret_pass@localhost:5432/lunodb\n\n` +
          `4. คำสั่งจัดการและบำรุงรักษา (Management Commands)\n` +
          `-------------------------------------------------\n` +
          `- เช็กสถานะบริการ: systemctl status app.service\n` +
          `- รีสตาร์ตแอป:    pm2 restart all / docker compose restart\n` +
          `- ดูล็อกระบบ:     journalctl -u app.service -f\n\n` +
          `5. บันทึกความปลอดภัย & Backup (Security & Backup)\n` +
          `------------------------------------------------\n` +
          `- [x] เปิดใช้งาน Firewall (UFW) และจำกัด SSH Key\n` +
          `- [x] สำรองข้อมูลฐานข้อมูลอัตโนมัติทุกวันเวลา 03:00 น.\n`
        );
      }
      return (
        `=======================================\n` +
        `SERVER CONFIGURATION & ENVIRONMENT SPEC\n` +
        `=======================================\n\n` +
        `1. Server Details\n` +
        `-----------------\n` +
        `- Host / IP: prod-api-01 (192.168.1.105)\n` +
        `- Environment: Production\n` +
        `- OS: Ubuntu 24.04 LTS\n` +
        `- Last Updated: ${dateStr}\n\n` +
        `2. Ports & Active Services\n` +
        `--------------------------\n` +
        `- Port 80 / 443 : Nginx (SSL Reverse Proxy)\n` +
        `- Port 3000     : Node.js / Web Application\n` +
        `- Port 5432     : PostgreSQL Database\n\n` +
        `3. Key Environment Variables\n` +
        `----------------------------\n` +
        `NODE_ENV=production\n` +
        `PORT=3000\n` +
        `DATABASE_URL=postgres://app_user:secret_pass@localhost:5432/lunodb\n\n` +
        `4. Useful Maintenance Commands\n` +
        `------------------------------\n` +
        `- Check status:  systemctl status app.service\n` +
        `- Restart app:   pm2 restart all / docker compose restart\n` +
        `- Tail logs:     journalctl -u app.service -f\n\n` +
        `5. Security & Backup Checklist\n` +
        `------------------------------\n` +
        `- [x] UFW firewall active & SSH key authentication only\n` +
        `- [x] Automated daily database backup at 03:00 UTC\n`
      );
    }

    if (templateType === "incident-report") {
      if (isTh) {
        return (
          `=======================================\n` +
          `รายงานวิเคราะห์เหตุขัดข้อง (INCIDENT POSTMORTEM)\n` +
          `=======================================\n\n` +
          `ข้อมูลเหตุการณ์ (Incident Overview)\n` +
          `-----------------------------------\n` +
          `- รหัสเหตุการณ์: INC-202609-01\n` +
          `- วันที่เกิดเหตุ: ${dateStr}\n` +
          `- ระดับความรุนแรง: P2 - High (กระทบความเร็วในการเข้าสู่ระบบ)\n` +
          `- ระยะเวลาขัดข้อง: 35 นาที\n` +
          `- ผู้รับผิดชอบหลัก: วิศรุต ปัญญาวงศ์ (SRE Lead)\n\n` +
          `สรุปผลกระทบ (Impact Summary)\n` +
          `----------------------------\n` +
          `- จำนวนผู้ใช้ที่ได้รับผลกระทบ: ประมาณ 12% ของผู้ใช้ที่เข้าสู่ระบบในแถบเอเชียตะวันออกเฉียงใต้\n` +
          `- บริการที่หยุดชะงัก: บริการตรวจสอบสิทธิ์โทเค็น (Authentication Token Validation Gateway)\n\n` +
          `ลำดับเหตุการณ์ตามเวลา (Timeline of Events)\n` +
          `-----------------------------------------\n` +
          `- ${timeStr} : ตรวจพบการแจ้งเตือนความหน่วงสูงจากระบบ Monitoring\n` +
          `- 09:25 น. : พบ Connection Pool ฐานข้อมูลเต็มเนื่องจาก Query ที่ไม่ได้ใส่ Index\n` +
          `- 09:40 น. : ปล่อยแพตช์ขยาย Pool และรีสตาร์ต Pods กลับมาเป็นปกติ\n\n` +
          `สาเหตุต้นตอ (Root Cause Analysis - RCA)\n` +
          `---------------------------------------\n` +
          `- มีคำสั่งค้นหาข้อมูลที่ไม่มี Index ในตาราง user_auth_tokens ทำงานพร้อมกับช่วงผู้ใช้งานหนาแน่น ทำให้ Connection Pool ถูกใช้จนหมด\n\n` +
          `มาตรการแก้ไขและป้องกันในอนาคต (Action Items & Prevention)\n` +
          `---------------------------------------------------------\n` +
          `- [ ] เพิ่มระบบแจ้งเตือน (Alerting) เมื่อการใช้งาน Connection Pool เกิน 75%\n` +
          `- [ ] สร้าง Compound Index เพิ่มเติมบนคอลัมน์ user_auth_tokens\n` +
          `- [ ] อัปเดตเอกสารคู่มือการแก้ไขปัญหา (Runbook) และตั้งค่า Auto-scaling\n`
        );
      }
      return (
        `=======================================\n` +
        `INCIDENT POSTMORTEM & ROOT CAUSE REPORT\n` +
        `=======================================\n\n` +
        `Incident Overview\n` +
        `-----------------\n` +
        `- Incident ID: INC-202609-01\n` +
        `- Date: ${dateStr}\n` +
        `- Severity: P2 - High (Auth Gateway latency spike)\n` +
        `- Total Downtime: 35 minutes\n` +
        `- Incident Lead: David Chen (SRE Lead)\n\n` +
        `Impact Summary\n` +
        `--------------\n` +
        `- Affected users: Approximately 12% of concurrent users in Southeast Asia\n` +
        `- Disrupted services: Authentication Token Validation Gateway\n\n` +
        `Timeline\n` +
        `--------\n` +
        `- ${timeStr} : Alert triggered by monitoring system detecting elevated latency\n` +
        `- 09:25 UTC : Isolated bottleneck to database pool exhaustion on session verification\n` +
        `- 09:40 UTC : Mitigation deployed: pool capacity doubled and worker pods recycled\n\n` +
        `Root Cause Analysis (RCA)\n` +
        `-------------------------\n` +
        `- An unindexed join query on user session tokens coincided with morning peak traffic, depleting the active database connection pool.\n\n` +
        `Action Items & Prevention\n` +
        `-------------------------\n` +
        `- [ ] Configure proactive alerting threshold when connection pool utilization exceeds 75%\n` +
        `- [ ] Add compound index on user_auth_tokens table\n` +
        `- [ ] Update operational runbook with automated pool auto-scaling steps\n`
      );
    }

    if (templateType === "shopping-list") {
      if (isTh) {
        return (
          `รายการซื้อของและของใช้ - ${dateStr}\n` +
          `=======================================\n\n` +
          `ของสดและวัตถุดิบทำอาหาร (Fresh Produce & Groceries)\n` +
          `--------------------------------------------------\n` +
          `- [ ] ผักสดและผลไม้: อะโวคาโด 3 ลูก, ผักสลัดคอส 2 แพ็ก, กล้วยหอมทอง 1 หวี\n` +
          `- [ ] เนื้อสัตว์ / ไข่ไก่ / นม: อกไก่ลอกหนัง 1 กก., ไข่ไก่ออร์แกนิก 10 ฟอง, นมข้าวโอ๊ต 1 ลิตร\n` +
          `- [ ] เครื่องปรุงและวัตถุดิบ: น้ำมันมะกอก Extra Virgin, เกลือสมุทรชมพู, พริกไทยดำบดหยาบ\n\n` +
          `ของใช้ส่วนตัวและในบ้าน (Household & Essentials)\n` +
          `----------------------------------------------\n` +
          `- [ ] กระดาษชำระ / สบู่ / ยาสระผม: สบู่เหลวอาบน้ำกลิ่นยูคาลิปตัส, กระดาษทิชชูม้วนแพ็ก 12 ม้วน\n` +
          `- [ ] น้ำยาซักผ้าและทำความสะอาด: น้ำยาปรับผ้านุ่มสูตรเข้มข้น, ถุงขยะขนาด 24x30 นิ้ว\n\n` +
          `อุปกรณ์การเรียนและทำงาน (Office & Stationery)\n` +
          `---------------------------------------------\n` +
          `- [ ] ปากกาหมึกเจลสีดำ 0.5 มม., สมุดบันทึกกริด A5, โพสต์อิทสีพาสเทล\n\n` +
          `งบประมาณและบันทึกเพิ่มเติม (Budget & Notes)\n` +
          `------------------------------------------\n` +
          `- งบประมาณโดยประมาณ: ฿1,850.00\n` +
          `- ร้านค้า / พิกัด: ซูเปอร์มาร์เก็ตชั้นนำใกล้บ้าน\n`
        );
      }
      return (
        `Shopping & Grocery List - ${dateStr}\n` +
        `=======================================\n\n` +
        `Produce & Groceries\n` +
        `-------------------\n` +
        `- [ ] Fresh Vegetables & Fruits: Hass Avocados (x3), Romaine Hearts (2 packs), Bananas (1 bunch)\n` +
        `- [ ] Dairy, Eggs & Meat: Skinless Chicken Breast (1kg), Pasture-raised Eggs (dozen), Oat Milk (1L)\n` +
        `- [ ] Pantry & Ingredients: Extra Virgin Olive Oil, Himalayan Pink Salt, Whole Black Peppercorns\n\n` +
        `Household & Personal Care\n` +
        `-------------------------\n` +
        `- [ ] Toiletries & Paper Goods: Lavender Body Wash, Bamboo Bath Tissue (12-roll pack)\n` +
        `- [ ] Cleaning & Laundry Supplies: Eco-friendly Laundry Detergent, Recycled Trash Bags (20L)\n\n` +
        `Office & Tech Supplies\n` +
        `----------------------\n` +
        `- [ ] Black Gel Ink Pens (0.5mm, 3-pack), Dot-grid A5 Journal, Pastel Sticky Notes\n\n` +
        `Budget & Notes\n` +
        `--------------\n` +
        `- Estimated Budget: $65.00\n` +
        `- Target Store/Location: Local Organic Market / Supermarket\n`
      );
    }

    if (templateType === "recipe-txt") {
      if (isTh) {
        return (
          `สูตรอาหาร: พาสต้าเส้นสดซอสเห็ดทรัฟเฟิล (Truffle Cream Pasta)\n` +
          `=======================================\n\n` +
          `ข้อมูลเมนูอาหาร\n` +
          `---------------\n` +
          `- เวลาเตรียม: 15 นาที\n` +
          `- เวลาปรุง: 20 นาที\n` +
          `- สำหรับ: 2-3 ที่\n` +
          `- ระดับความยาก: ปานกลาง\n\n` +
          `วัตถุดิบและส่วนผสม (Ingredients)\n` +
          `-------------------------------\n` +
          `- [ ] วัตถุดิบหลัก: เส้นเฟตตูชินี 200 กรัม, เห็ดแชมปิญอง 100 กรัม, ครีมสด 150 มล.\n` +
          `- [ ] เครื่องปรุงรส: ซอสเห็ดทรัฟเฟิล 2 ช้อนโต๊ะ, เนยสด 20 กรัม, พาเมซานชีสขูด, พริกไทยดำ\n` +
          `- [ ] ผักและเครื่องเคียง: พาร์สลีย์สับละเอียดสำหรับโรยหน้า, กระเทียมสับ 2 กลีบ\n\n` +
          `ขั้นตอนการทำ (Step-by-Step Instructions)\n` +
          `----------------------------------------\n` +
          `1. ขั้นตอนที่ 1: ต้มน้ำใส่เกลือ ลวกเส้นเฟตตูชินีให้ได้ระดับ Al Dente ประมาณ 7-8 นาที\n` +
          `2. ขั้นตอนที่ 2: ตั้งกระทะไฟปานกลาง ละลายเนย ผัดกระเทียมและเห็ดแชมปิญองจนส่งกลิ่นหอม\n` +
          `3. ขั้นตอนที่ 3: ใส่ครีมสดและซอสทรัฟเฟิล คนให้เข้ากัน เติมน้ำต้มเส้น 2 ช้อนโต๊ะเพื่อความเนียนนุ่ม\n` +
          `4. ขั้นตอนที่ 4: นำเส้นพาสต้าลงคลุกเคล้า โรยพาเมซานชีสและพาร์สลีย์ จัดเสิร์ฟร้อนๆ ทันที\n\n` +
          `เคล็ดลับความอร่อย (Chef's Tips)\n` +
          `------------------------------\n` +
          `- ใช้น้ำต้มเส้นพาสต้าผสมในขั้นตอนทำซอส เพื่อให้น้ำมันและครีมรวมตัวกันเป็นเนื้อเงาสวยเคลือบเส้นได้อย่างสมบูรณ์แบบ\n`
        );
      }
      return (
        `Recipe: Handcrafted Truffle Cream Fettuccine\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Prep Time: 15 mins\n` +
        `- Cook Time: 20 mins\n` +
        `- Servings: 2-3 portions\n` +
        `- Difficulty: Medium\n\n` +
        `Ingredients\n` +
        `-----------\n` +
        `- [ ] Main Ingredients: Fresh Fettuccine pasta (200g), Cremini mushrooms (100g), Heavy cream (150ml)\n` +
        `- [ ] Seasonings & Sauces: Black truffle paste (2 tbsp), Unsalted butter (20g), Freshly grated Parmesan, Cracked black pepper\n` +
        `- [ ] Garnish & Sides: Finely chopped Italian parsley, Minced garlic (2 cloves)\n\n` +
        `Instructions\n` +
        `------------\n` +
        `1. Step 1: Bring salted water to rolling boil; cook fettuccine until al dente (approx. 7-8 mins)\n` +
        `2. Step 2: Melt butter in a large skillet over medium heat; sauté minced garlic and sliced mushrooms until fragrant\n` +
        `3. Step 3: Pour in heavy cream and stir in black truffle paste; add 2 tbsp of starchy pasta water to emulsify\n` +
        `4. Step 4: Toss cooked fettuccine into sauce until glossy; plate immediately with fresh Parmesan and parsley\n\n` +
        `Chef's Notes & Tips\n` +
        `-------------------\n` +
        `- Always reserve a splash of starchy pasta water to emulsify the cream sauce, creating a silky restaurant-grade glaze.\n`
      );
    }

    return "";
  }

  // Handle HTML Format templates (.html)
  if (format === "html") {
    if (templateType === "basic-website") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>My Website</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; background: #fff; }\n` +
        `    header { background: #1e293b; color: #fff; padding: 1rem 2rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n` +
        `    .header-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }\n` +
        `    .brand { font-size: 1.35rem; font-weight: 700; color: #fff; text-decoration: none; }\n` +
        `    .menu-toggle { display: none; background: none; border: 1px solid #475569; color: #fff; border-radius: 6px; padding: 0.4rem; cursor: pointer; align-items: center; justify-content: center; }\n` +
        `    nav { display: flex; gap: 1.5rem; }\n` +
        `    nav a { color: #cbd5e1; text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.2s; }\n` +
        `    nav a:hover { color: #38bdf8; }\n` +
        `    main { max-width: 1000px; margin: 2rem auto; padding: 0 1.5rem; }\n` +
        `    section { margin-bottom: 3rem; }\n` +
        `    h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 1rem; color: #0f172a; line-height: 1.25; }\n` +
        `    h2 { font-size: clamp(1.35rem, 3vw, 1.75rem); margin-bottom: 1rem; color: #0f172a; }\n` +
        `    .banner-img { width: 100%; height: 320px; object-fit: cover; border-radius: 12px; margin: 1.5rem 0; display: block; }\n` +
        `    .grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }\n` +
        `    .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 10px; }\n` +
        `    footer { background: #f1f5f9; text-align: center; padding: 2rem 1.5rem; margin-top: 4rem; color: #64748b; font-size: 0.9rem; border-top: 1px solid #e2e8f0; }\n` +
        `    @media (max-width: 768px) {\n` +
        `      header { padding: 1rem 1.25rem; }\n` +
        `      .menu-toggle { display: flex; }\n` +
        `      nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #1e293b; flex-direction: column; padding: 1.25rem 1.5rem; gap: 1rem; border-top: 1px solid #334155; box-shadow: 0 8px 20px rgba(0,0,0,0.2); }\n` +
        `      nav.open { display: flex; }\n` +
        `      .banner-img { height: 220px; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <header>\n` +
        `    <div class="header-inner">\n` +
        `      <a href="#home" class="brand">My Website</a>\n` +
        `      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Navigation">\n` +
        `        <svg id="iconMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `        <svg id="iconClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `      </button>\n` +
        `      <nav id="navMenu">\n` +
        `        <a href="#home">Home</a>\n` +
        `        <a href="#about">About</a>\n` +
        `        <a href="#services">Services</a>\n` +
        `        <a href="#contact">Contact</a>\n` +
        `      </nav>\n` +
        `    </div>\n` +
        `  </header>\n\n` +
        `  <main>\n` +
        `    <section id="home">\n` +
        `      <h1>Welcome to Our Website</h1>\n` +
        `      <p>This is a modern, responsive website template with a clean semantic layout and mobile navigation.</p>\n` +
        `      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80" alt="Website Banner" class="banner-img">\n` +
        `    </section>\n\n` +
        `    <section id="about">\n` +
        `      <h2>About Us</h2>\n` +
        `      <p>Learn more about our mission, vision, and the values that drive our team forward.</p>\n` +
        `    </section>\n\n` +
        `    <section id="services">\n` +
        `      <h2>Our Services</h2>\n` +
        `      <div class="grid-cards">\n` +
        `        <div class="card">\n` +
        `          <h3>Design & UI/UX</h3>\n` +
        `          <p>Crafting intuitive and engaging experiences for web and mobile platforms.</p>\n` +
        `        </div>\n` +
        `        <div class="card">\n` +
        `          <h3>Development</h3>\n` +
        `          <p>Building high-performance, accessible, and scalable digital solutions.</p>\n` +
        `        </div>\n` +
        `      </div>\n` +
        `    </section>\n\n` +
        `    <section id="contact">\n` +
        `      <h2>Contact Us</h2>\n` +
        `      <p>Have questions or want to work together? Reach out to our friendly team.</p>\n` +
        `      <div class="card" style="margin-top: 1rem;">\n` +
        `        <p><strong>Email:</strong> contact@example.com</p>\n` +
        `        <p style="margin-top: 0.5rem;"><strong>Office:</strong> 123 Innovation Boulevard, Suite 500</p>\n` +
        `      </div>\n` +
        `    </section>\n` +
        `  </main>\n\n` +
        `  <footer>\n` +
        `    <p>&copy; ${new Date().getFullYear()} My Website. All rights reserved.</p>\n` +
        `  </footer>\n\n` +
        `  <script>\n` +
        `    const toggle = document.getElementById('menuToggle');\n` +
        `    const menu = document.getElementById('navMenu');\n` +
        `    const iconMenu = document.getElementById('iconMenu');\n` +
        `    const iconClose = document.getElementById('iconClose');\n` +
        `    if (toggle && menu) {\n` +
        `      toggle.addEventListener('click', () => {\n` +
        `        const isOpen = menu.classList.toggle('open');\n` +
        `        if (iconMenu) iconMenu.style.display = isOpen ? 'none' : 'block';\n` +
        `        if (iconClose) iconClose.style.display = isOpen ? 'block' : 'none';\n` +
        `      });\n` +
        `    }\n` +
        `  </script>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "landing-page") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Product Landing Page</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; background: #fafafa; line-height: 1.6; }\n` +
        `    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }\n` +
        `    header { padding: 1.25rem 0; display: flex; justify-content: space-between; align-items: center; position: relative; }\n` +
        `    .logo { font-size: 1.4rem; font-weight: 700; color: #2563eb; text-decoration: none; }\n` +
        `    .menu-toggle { display: none; background: none; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.4rem; cursor: pointer; color: #1e293b; align-items: center; justify-content: center; }\n` +
        `    .nav-links { display: flex; align-items: center; gap: 2rem; }\n` +
        `    .nav-links a { color: #475569; text-decoration: none; font-weight: 500; font-size: 0.95rem; transition: color 0.2s; }\n` +
        `    .nav-links a:hover { color: #2563eb; }\n` +
        `    .nav-links a.btn, .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; transition: background 0.2s; border: none; }\n` +
        `    .nav-links a.btn:hover, .btn:hover { background: #1d4ed8; color: #ffffff !important; }\n` +
        `    .hero { text-align: center; padding: 4.5rem 0 3.5rem; }\n` +
        `    .hero h1 { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.2; margin-bottom: 1.25rem; color: #0f172a; }\n` +
        `    .hero p { font-size: clamp(1rem, 2.5vw, 1.2rem); color: #64748b; max-width: 650px; margin: 0 auto 2rem; }\n` +
        `    .hero-img { width: 100%; max-width: 850px; height: auto; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); margin: 2.5rem auto 0; display: block; }\n` +
        `    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.75rem; padding: 3.5rem 0; }\n` +
        `    .feature-card { background: #fff; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; }\n` +
        `    .feature-card h3 { margin-bottom: 0.5rem; color: #0f172a; }\n` +
        `    .feature-card p { color: #64748b; font-size: 0.95rem; }\n` +
        `    footer { text-align: center; padding: 3rem 0; color: #94a3b8; font-size: 0.9rem; border-top: 1px solid #e2e8f0; }\n` +
        `    @media (max-width: 768px) {\n` +
        `      .menu-toggle { display: flex; }\n` +
        `      .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); flex-direction: column; padding: 1.5rem; gap: 1.25rem; z-index: 50; }\n` +
        `      .nav-links.open { display: flex; }\n` +
        `      .nav-links .btn { width: 100%; }\n` +
        `      .hero { padding: 2.5rem 0 2rem; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <header>\n` +
        `      <a href="#hero" class="logo">BrandName</a>\n` +
        `      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">\n` +
        `        <svg id="iconMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `        <svg id="iconClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `      </button>\n` +
        `      <div class="nav-links" id="navMenu">\n` +
        `        <a href="#features">Features</a>\n` +
        `        <a href="#about">About</a>\n` +
        `        <a href="#pricing">Pricing</a>\n` +
        `        <a href="#contact" class="btn">Get Started</a>\n` +
        `      </div>\n` +
        `    </header>\n\n` +
        `    <section id="hero" class="hero">\n` +
        `      <h1>Build something amazing with our platform</h1>\n` +
        `      <p>The all-in-one solution designed to help your team work faster, smarter, and achieve better results.</p>\n` +
        `      <a href="#pricing" class="btn">Start Free Trial</a>\n` +
        `      <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80" alt="Platform Dashboard Preview" class="hero-img">\n` +
        `    </section>\n\n` +
        `    <section id="features" class="features">\n` +
        `      <div class="feature-card">\n` +
        `        <h3>Fast Performance</h3>\n` +
        `        <p>Engineered from the ground up for maximum speed, reliability, and responsiveness.</p>\n` +
        `      </div>\n` +
        `      <div class="feature-card">\n` +
        `        <h3>Intuitive Design</h3>\n` +
        `        <p>A seamless user interface crafted for productivity, clarity, and ease of use.</p>\n` +
        `      </div>\n` +
        `      <div class="feature-card">\n` +
        `        <h3>Secure & Scalable</h3>\n` +
        `        <p>Enterprise-grade security standards with effortless scalability as you grow.</p>\n` +
        `      </div>\n` +
        `    </section>\n\n` +
        `    <section id="about" class="feature-card" style="margin-bottom: 2rem;">\n` +
        `      <h3>About Our Mission</h3>\n` +
        `      <p>We are dedicated to crafting thoughtful software tools that empower individuals and modern teams to produce their best work every day.</p>\n` +
        `    </section>\n\n` +
        `    <section id="pricing" style="padding: 2.5rem 0; text-align: center;">\n` +
        `      <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; color: #0f172a;">Simple, Predictable Pricing</h2>\n` +
        `      <p style="color: #64748b; margin-bottom: 1.5rem;">Start free for 14 days. No credit card required.</p>\n` +
        `      <a href="#contact" class="btn">View All Plans &rarr;</a>\n` +
        `    </section>\n\n` +
        `    <section id="contact" class="feature-card" style="margin-top: 1rem; text-align: center;">\n` +
        `      <h3>Get Started Today</h3>\n` +
        `      <p style="margin-bottom: 1.5rem;">Join thousands of teams shipping better work with our platform.</p>\n` +
        `      <a href="mailto:hello@example.com" class="btn">Contact Our Team</a>\n` +
        `    </section>\n\n` +
        `    <footer>\n` +
        `      <p>&copy; ${new Date().getFullYear()} BrandName. All rights reserved.</p>\n` +
        `    </footer>\n` +
        `  </div>\n\n` +
        `  <script>\n` +
        `    const toggle = document.getElementById('menuToggle');\n` +
        `    const menu = document.getElementById('navMenu');\n` +
        `    const iconMenu = document.getElementById('iconMenu');\n` +
        `    const iconClose = document.getElementById('iconClose');\n` +
        `    if (toggle && menu) {\n` +
        `      toggle.addEventListener('click', () => {\n` +
        `        const isOpen = menu.classList.toggle('open');\n` +
        `        if (iconMenu) iconMenu.style.display = isOpen ? 'none' : 'block';\n` +
        `        if (iconClose) iconClose.style.display = isOpen ? 'block' : 'none';\n` +
        `      });\n` +
        `    }\n` +
        `  </script>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "portfolio") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>My Portfolio</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; color: #334155; line-height: 1.6; background: #fff; }\n` +
        `    .nav-bar { background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }\n` +
        `    .nav-inner { max-width: 900px; margin: 0 auto; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; position: relative; }\n` +
        `    .brand { font-size: 1.25rem; font-weight: 700; color: #0f172a; text-decoration: none; }\n` +
        `    .menu-toggle { display: none; background: none; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.4rem; cursor: pointer; color: #334155; align-items: center; justify-content: center; }\n` +
        `    nav { display: flex; gap: 1.5rem; }\n` +
        `    nav a { color: #64748b; text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.2s; }\n` +
        `    nav a:hover { color: #2563eb; }\n` +
        `    .container { max-width: 900px; margin: 0 auto; padding: 2.5rem 1.5rem; }\n` +
        `    .profile { text-align: center; margin-bottom: 3.5rem; }\n` +
        `    .avatar { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; margin: 0 auto 1.25rem; border: 3px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block; }\n` +
        `    h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); color: #0f172a; margin-bottom: 0.5rem; }\n` +
        `    .tagline { color: #64748b; font-size: clamp(1rem, 2.5vw, 1.15rem); margin-bottom: 1.25rem; }\n` +
        `    section { margin-bottom: 3.5rem; }\n` +
        `    h2 { font-size: 1.5rem; color: #0f172a; margin-bottom: 1.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }\n` +
        `    .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }\n` +
        `    .project-card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #f8fafc; }\n` +
        `    .project-card img { width: 100%; height: 160px; object-fit: cover; display: block; }\n` +
        `    .project-info { padding: 1.25rem; }\n` +
        `    .project-info h3 { margin-bottom: 0.5rem; color: #0f172a; font-size: 1.1rem; }\n` +
        `    .project-info p { font-size: 0.9rem; color: #64748b; margin-bottom: 1rem; }\n` +
        `    .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }\n` +
        `    .skill-tag { background: #e0f2fe; color: #0369a1; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }\n` +
        `    footer { text-align: center; color: #94a3b8; font-size: 0.85rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; }\n` +
        `    @media (max-width: 768px) {\n` +
        `      .menu-toggle { display: flex; }\n` +
        `      nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.06); flex-direction: column; padding: 1.25rem 1.5rem; gap: 1rem; }\n` +
        `      nav.open { display: flex; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="nav-bar">\n` +
        `    <div class="nav-inner">\n` +
        `      <a href="#hero" class="brand">My Portfolio</a>\n` +
        `      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">\n` +
        `        <svg id="iconMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `        <svg id="iconClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `      </button>\n` +
        `      <nav id="navMenu">\n` +
        `        <a href="#about">About</a>\n` +
        `        <a href="#projects">Projects</a>\n` +
        `        <a href="#skills">Skills</a>\n` +
        `        <a href="#contact">Contact</a>\n` +
        `      </nav>\n` +
        `    </div>\n` +
        `  </div>\n\n` +
        `  <div class="container">\n` +
        `    <header id="hero" class="profile">\n` +
        `      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" alt="Profile Avatar" class="avatar">\n` +
        `      <h1>Your Name</h1>\n` +
        `      <p class="tagline">Designer & Frontend Developer</p>\n` +
        `      <p>Building thoughtful and engaging digital experiences with clean code.</p>\n` +
        `    </header>\n\n` +
        `    <section id="about">\n` +
        `      <h2>About Me</h2>\n` +
        `      <p>I specialize in creating beautiful, responsive user interfaces and web applications with a focus on modern aesthetics, speed, and usability.</p>\n` +
        `    </section>\n\n` +
        `    <section id="projects">\n` +
        `      <h2>Featured Projects</h2>\n` +
        `      <div class="projects-grid">\n` +
        `        <div class="project-card">\n` +
        `          <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80" alt="Project One">\n` +
        `          <div class="project-info">\n` +
        `            <h3>Project One</h3>\n` +
        `            <p>A full-stack web application designed for task management and team collaboration.</p>\n` +
        `            <a href="javascript:void(0)" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 0.9rem;">View Project &rarr;</a>\n` +
        `          </div>\n` +
        `        </div>\n` +
        `        <div class="project-card">\n` +
        `          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80" alt="Project Two">\n` +
        `          <div class="project-info">\n` +
        `            <h3>Project Two</h3>\n` +
        `            <p>Interactive dashboard UI kit built with modern web components and data charts.</p>\n` +
        `            <a href="javascript:void(0)" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 0.9rem;">View Project &rarr;</a>\n` +
        `          </div>\n` +
        `        </div>\n` +
        `      </div>\n` +
        `    </section>\n\n` +
        `    <section id="skills">\n` +
        `      <h2>Skills & Technologies</h2>\n` +
        `      <div class="skills-list">\n` +
        `        <span class="skill-tag">HTML5 / CSS3</span>\n` +
        `        <span class="skill-tag">JavaScript / TypeScript</span>\n` +
        `        <span class="skill-tag">React / Vue</span>\n` +
        `        <span class="skill-tag">Tailwind CSS</span>\n` +
        `        <span class="skill-tag">UI / UX Design</span>\n` +
        `      </div>\n` +
        `    </section>\n\n` +
        `    <section id="contact" style="text-align: center; padding: 2.5rem 0 1rem; border-top: 1px solid #e2e8f0;">\n` +
        `      <h2>Get In Touch</h2>\n` +
        `      <p style="color: #64748b; margin-bottom: 1.25rem;">Interested in working together or have a project in mind? Let's connect.</p>\n` +
        `      <a href="mailto:hello@example.com" style="display: inline-block; background: #2563eb; color: #ffffff !important; padding: 0.65rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600;">hello@example.com</a>\n` +
        `    </section>\n\n` +
        `    <footer>\n` +
        `      <p>&copy; ${new Date().getFullYear()} Your Name. All rights reserved.</p>\n` +
        `    </footer>\n` +
        `  </div>\n\n` +
        `  <script>\n` +
        `    const toggle = document.getElementById('menuToggle');\n` +
        `    const menu = document.getElementById('navMenu');\n` +
        `    const iconMenu = document.getElementById('iconMenu');\n` +
        `    const iconClose = document.getElementById('iconClose');\n` +
        `    if (toggle && menu) {\n` +
        `      toggle.addEventListener('click', () => {\n` +
        `        const isOpen = menu.classList.toggle('open');\n` +
        `        if (iconMenu) iconMenu.style.display = isOpen ? 'none' : 'block';\n` +
        `        if (iconClose) iconClose.style.display = isOpen ? 'block' : 'none';\n` +
        `      });\n` +
        `    }\n` +
        `  </script>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "blog") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Blog Post</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: Georgia, Cambria, "Times New Roman", serif; color: #2d3748; line-height: 1.8; background: #fff; }\n` +
        `    .nav-bar { background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }\n` +
        `    .nav-inner { max-width: 800px; margin: 0 auto; padding: 0.85rem 1.5rem; display: flex; justify-content: space-between; align-items: center; position: relative; font-family: system-ui, sans-serif; }\n` +
        `    .brand { font-size: 1.25rem; font-weight: 700; color: #1a202c; text-decoration: none; }\n` +
        `    .menu-toggle { display: none; background: none; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.4rem; cursor: pointer; color: #1a202c; align-items: center; justify-content: center; }\n` +
        `    nav { display: flex; gap: 1.5rem; }\n` +
        `    nav a { color: #718096; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }\n` +
        `    nav a:hover { color: #8b5cf6; }\n` +
        `    .container { max-width: 760px; margin: 0 auto; padding: 2.5rem 1.5rem; }\n` +
        `    header { margin-bottom: 2rem; }\n` +
        `    .category { font-family: system-ui, sans-serif; font-size: 0.85rem; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }\n` +
        `    h1 { font-size: clamp(1.85rem, 5vw, 2.5rem); color: #1a202c; line-height: 1.25; margin-bottom: 1rem; }\n` +
        `    .meta { font-family: system-ui, sans-serif; font-size: 0.9rem; color: #718096; }\n` +
        `    .featured-img { width: 100%; height: auto; max-height: 380px; object-fit: cover; border-radius: 10px; margin: 1.5rem 0 2rem; display: block; }\n` +
        `    .article-body p { margin-bottom: 1.5rem; font-size: 1.1rem; }\n` +
        `    .article-body h2 { font-family: system-ui, sans-serif; font-size: clamp(1.3rem, 3vw, 1.6rem); color: #1a202c; margin: 2.5rem 0 1rem; }\n` +
        `    blockquote { border-left: 4px solid #8b5cf6; padding-left: 1.25rem; margin: 2rem 0; font-style: italic; color: #4a5568; }\n` +
        `    footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; font-family: system-ui, sans-serif; font-size: 0.9rem; color: #a0aec0; text-align: center; }\n` +
        `    @media (max-width: 768px) {\n` +
        `      .menu-toggle { display: flex; }\n` +
        `      nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.06); flex-direction: column; padding: 1.25rem 1.5rem; gap: 1rem; }\n` +
        `      nav.open { display: flex; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="nav-bar">\n` +
        `    <div class="nav-inner">\n` +
        `      <a href="#article" class="brand">My Blog</a>\n` +
        `      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">\n` +
        `        <svg id="iconMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `        <svg id="iconClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `      </button>\n` +
        `      <nav id="navMenu">\n` +
        `        <a href="#article">Articles</a>\n` +
        `        <a href="#tech">Tech</a>\n` +
        `        <a href="#design">Design</a>\n` +
        `        <a href="#newsletter">Newsletter</a>\n` +
        `      </nav>\n` +
        `    </div>\n` +
        `  </div>\n\n` +
        `  <div class="container">\n` +
        `    <header>\n` +
        `      <div class="category">Technology & Design</div>\n` +
        `      <h1>The Future of Web Development and Design</h1>\n` +
        `      <div class="meta">By Author Name &bull; Published on ${dateStr} &bull; 5 min read</div>\n` +
        `    </header>\n\n` +
        `    <article class="article-body" id="article">\n` +
        `      <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80" alt="Featured Cover" class="featured-img">\n` +
        `      <p>The landscape of modern web development continues to evolve rapidly. From AI-assisted tools to hyper-optimized browser rendering engines, developers now have more powerful tools than ever before.</p>\n\n` +
        `      <h2 id="tech">Embracing Simplicity and Performance</h2>\n` +
        `      <p>While frameworks come and go, fundamental principles of good software engineering remain unchanged. Fast load times, clean semantics, and accessible user interfaces create the best experience for everyone.</p>\n\n` +
        `      <blockquote>"Simplicity is the prerequisite for reliability." &mdash; Edsger W. Dijkstra</blockquote>\n\n` +
        `      <h2 id="design">Thoughtful Design for Modern Interfaces</h2>\n` +
        `      <p>Great software marries functional precision with visual calm. Clear hierarchy, consistent spacing, and purposeful typography elevate everyday productivity tools into products people love using.</p>\n\n` +
        `      <p>As we look forward, the focus shifts toward sustainable architecture, lightweight tooling, and delightful user interactions.</p>\n` +
        `    </article>\n\n` +
        `    <section id="newsletter" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem 1.5rem; margin-top: 3.5rem; text-align: center; font-family: system-ui, sans-serif;">\n` +
        `      <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #1a202c;">Subscribe to the Weekly Digest</h3>\n` +
        `      <p style="font-size: 0.95rem; color: #718096; margin-bottom: 1.25rem;">Get curated engineering deep dives, design patterns, and architecture articles straight to your inbox.</p>\n` +
        `      <form onsubmit="event.preventDefault(); alert('Thank you for subscribing!');" style="display: flex; gap: 0.5rem; max-width: 440px; margin: 0 auto; flex-wrap: wrap;">\n` +
        `        <input type="email" placeholder="you@company.com" required style="flex: 1; min-width: 200px; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;">\n` +
        `        <button type="submit" style="background: #8b5cf6; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer;">Subscribe</button>\n` +
        `      </form>\n` +
        `    </section>\n\n` +
        `    <footer>\n` +
        `      <p>&copy; ${new Date().getFullYear()} My Blog. Thanks for reading!</p>\n` +
        `    </footer>\n` +
        `  </div>\n\n` +
        `  <script>\n` +
        `    const toggle = document.getElementById('menuToggle');\n` +
        `    const menu = document.getElementById('navMenu');\n` +
        `    const iconMenu = document.getElementById('iconMenu');\n` +
        `    const iconClose = document.getElementById('iconClose');\n` +
        `    if (toggle && menu) {\n` +
        `      toggle.addEventListener('click', () => {\n` +
        `        const isOpen = menu.classList.toggle('open');\n` +
        `        if (iconMenu) iconMenu.style.display = isOpen ? 'none' : 'block';\n` +
        `        if (iconClose) iconClose.style.display = isOpen ? 'block' : 'none';\n` +
        `      });\n` +
        `    }\n` +
        `  </script>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "dashboard") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Admin Dashboard</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #334155; }\n` +
        `    .layout { display: flex; min-height: 100vh; }\n` +
        `    .mobile-header { display: none; background: #0f172a; color: #fff; padding: 0.85rem 1.25rem; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 90; }\n` +
        `    .mobile-header .brand { font-size: 1.15rem; font-weight: 700; color: #38bdf8; }\n` +
        `    .sidebar-toggle { background: none; border: 1px solid #334155; color: #fff; padding: 0.4rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }\n` +
        `    aside { width: 240px; background: #0f172a; color: #fff; padding: 1.5rem 1rem; shrink: 0; display: flex; flex-direction: column; transition: transform 0.3s ease; z-index: 100; }\n` +
        `    aside h2 { font-size: 1.2rem; margin-bottom: 2rem; padding: 0 0.5rem; color: #38bdf8; }\n` +
        `    aside a { display: flex; align-items: center; gap: 0.6rem; color: #94a3b8; text-decoration: none; padding: 0.75rem 0.5rem; border-radius: 6px; margin-bottom: 0.25rem; font-size: 0.9rem; transition: all 0.2s; }\n` +
        `    aside a svg { shrink: 0; }\n` +
        `    aside a:hover, aside a.active { background: #1e293b; color: #fff; }\n` +
        `    .backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 95; backdrop-filter: blur(2px); }\n` +
        `    main { flex: 1; padding: 2rem; max-width: 1200px; min-width: 0; }\n` +
        `    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }\n` +
        `    .header h1 { font-size: clamp(1.4rem, 3vw, 1.85rem); color: #0f172a; }\n` +
        `    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }\n` +
        `    .stat-card { background: #fff; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }\n` +
        `    .stat-title { font-size: 0.85rem; color: #64748b; font-weight: 500; }\n` +
        `    .stat-value { font-size: 1.8rem; font-weight: 700; color: #0f172a; margin-top: 0.5rem; }\n` +
        `    .card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }\n` +
        `    .card h3 { font-size: 1.1rem; color: #0f172a; margin-bottom: 1rem; }\n` +
        `    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -0.5rem; padding: 0 0.5rem; }\n` +
        `    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; min-width: 500px; }\n` +
        `    th, td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }\n` +
        `    th { color: #64748b; font-weight: 600; }\n` +
        `    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }\n` +
        `    .badge-success { background: #dcfce7; color: #15803d; }\n` +
        `    @media (max-width: 768px) {\n` +
        `      .layout { flex-direction: column; }\n` +
        `      .mobile-header { display: flex; }\n` +
        `      aside { position: fixed; top: 0; bottom: 0; left: 0; width: 260px; transform: translateX(-100%); }\n` +
        `      aside.open { transform: translateX(0); }\n` +
        `      .backdrop.open { display: block; }\n` +
        `      main { padding: 1.25rem; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="mobile-header">\n` +
        `    <span class="brand">AdminPanel</span>\n` +
        `    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle Sidebar">\n` +
        `      <svg id="iconSidebarMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `      <svg id="iconSidebarClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `    </button>\n` +
        `  </div>\n\n` +
        `  <div class="layout">\n` +
        `    <div class="backdrop" id="backdrop"></div>\n` +
        `    <aside id="sidebar">\n` +
        `      <h2>AdminPanel</h2>\n` +
        `      <a href="javascript:void(0)" class="active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> Overview</a>\n` +
        `      <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Customers</a>\n` +
        `      <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Products</a>\n` +
        `      <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Analytics</a>\n` +
        `      <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Settings</a>\n` +
        `    </aside>\n\n` +
        `    <main>\n` +
        `      <div class="header">\n` +
        `        <h1>Dashboard Overview</h1>\n` +
        `      </div>\n\n` +
        `      <div class="stats-grid">\n` +
        `        <div class="stat-card">\n` +
        `          <div class="stat-title">Total Revenue</div>\n` +
        `          <div class="stat-value">$45,231.89</div>\n` +
        `        </div>\n` +
        `        <div class="stat-card">\n` +
        `          <div class="stat-title">Active Users</div>\n` +
        `          <div class="stat-value">+2,350</div>\n` +
        `        </div>\n` +
        `        <div class="stat-card">\n` +
        `          <div class="stat-title">Sales Today</div>\n` +
        `          <div class="stat-value">+12,234</div>\n` +
        `        </div>\n` +
        `        <div class="stat-card">\n` +
        `          <div class="stat-title">Growth Rate</div>\n` +
        `          <div class="stat-value">+19.2%</div>\n` +
        `        </div>\n` +
        `      </div>\n\n` +
        `      <div class="card">\n` +
        `        <h3>Recent Transactions</h3>\n` +
        `        <div class="table-responsive">\n` +
        `          <table>\n` +
        `            <thead>\n` +
        `              <tr>\n` +
        `                <th>Customer</th>\n` +
        `                <th>Status</th>\n` +
        `                <th>Date</th>\n` +
        `                <th>Amount</th>\n` +
        `              </tr>\n` +
        `            </thead>\n` +
        `            <tbody>\n` +
        `              <tr>\n` +
        `                <td>John Doe</td>\n` +
        `                <td><span class="badge badge-success">Completed</span></td>\n` +
        `                <td>Today, 14:32</td>\n` +
        `                <td>$250.00</td>\n` +
        `              </tr>\n` +
        `              <tr>\n` +
        `                <td>Jane Smith</td>\n` +
        `                <td><span class="badge badge-success">Completed</span></td>\n` +
        `                <td>Today, 11:15</td>\n` +
        `                <td>$120.50</td>\n` +
        `              </tr>\n` +
        `            </tbody>\n` +
        `          </table>\n` +
        `        </div>\n` +
        `      </div>\n` +
        `    </main>\n` +
        `  </div>\n\n` +
        `  <script>\n` +
        `    const toggle = document.getElementById('sidebarToggle');\n` +
        `    const sidebar = document.getElementById('sidebar');\n` +
        `    const backdrop = document.getElementById('backdrop');\n` +
        `    const iconSidebarMenu = document.getElementById('iconSidebarMenu');\n` +
        `    const iconSidebarClose = document.getElementById('iconSidebarClose');\n` +
        `    function toggleSidebar() {\n` +
        `      const isOpen = sidebar.classList.toggle('open');\n` +
        `      backdrop.classList.toggle('open', isOpen);\n` +
        `      if (iconSidebarMenu) iconSidebarMenu.style.display = isOpen ? 'none' : 'block';\n` +
        `      if (iconSidebarClose) iconSidebarClose.style.display = isOpen ? 'block' : 'none';\n` +
        `    }\n` +
        `    if (toggle) toggle.addEventListener('click', toggleSidebar);\n` +
        `    if (backdrop) backdrop.addEventListener('click', toggleSidebar);\n` +
        `  </script>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "documentation") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Developer Documentation</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; background: #fff; line-height: 1.6; }\n` +
        `    .layout { display: flex; min-height: 100vh; }\n` +
        `    .mobile-header { display: none; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.85rem 1.25rem; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 90; }\n` +
        `    .mobile-header .brand { font-size: 1.15rem; font-weight: 700; color: #4338ca; display: flex; align-items: center; gap: 0.4rem; }\n` +
        `    .sidebar-toggle { background: #fff; border: 1px solid #cbd5e1; color: #1e293b; padding: 0.4rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }\n` +
        `    aside { width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 1.5rem 1rem; shrink: 0; transition: transform 0.3s ease; z-index: 100; }\n` +
        `    aside h2 { font-size: 1.15rem; color: #4338ca; margin-bottom: 1rem; padding-left: 0.5rem; display: flex; align-items: center; gap: 0.4rem; }\n` +
        `    aside h3 { font-size: 0.8rem; text-transform: uppercase; color: #64748b; margin: 1.25rem 0 0.5rem 0.5rem; letter-spacing: 0.05em; }\n` +
        `    aside a { display: block; color: #475569; text-decoration: none; padding: 0.45rem 0.5rem; border-radius: 6px; font-size: 0.9rem; margin-bottom: 0.2rem; transition: background 0.15s; }\n` +
        `    aside a:hover, aside a.active { background: #e0e7ff; color: #4338ca; font-weight: 600; }\n` +
        `    .backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 95; backdrop-filter: blur(2px); }\n` +
        `    main { flex: 1; padding: 3rem 4rem; max-width: 900px; min-width: 0; }\n` +
        `    h1 { font-size: clamp(1.8rem, 4vw, 2.25rem); color: #0f172a; margin-bottom: 0.75rem; }\n` +
        `    .lead { font-size: 1.1rem; color: #64748b; margin-bottom: 2rem; }\n` +
        `    h2 { font-size: clamp(1.2rem, 3vw, 1.4rem); color: #0f172a; margin: 2rem 0 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }\n` +
        `    pre { background: #0f172a; color: #f8fafc; padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 0.9rem; margin: 1rem 0; -webkit-overflow-scrolling: touch; }\n` +
        `    code { font-family: monospace; font-size: 0.9em; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; color: #6366f1; }\n` +
        `    .callout { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 0 8px 8px 0; margin: 1.5rem 0; font-size: 0.95rem; }\n` +
        `    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0; }\n` +
        `    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 480px; }\n` +
        `    th, td { padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: left; }\n` +
        `    th { background: #f8fafc; color: #475569; font-weight: 600; }\n` +
        `    @media (max-width: 768px) {\n` +
        `      .layout { flex-direction: column; }\n` +
        `      .mobile-header { display: flex; }\n` +
        `      aside { position: fixed; top: 0; bottom: 0; left: 0; width: 260px; transform: translateX(-100%); background: #f8fafc; box-shadow: 2px 0 12px rgba(0,0,0,0.1); }\n` +
        `      aside.open { transform: translateX(0); }\n` +
        `      .backdrop.open { display: block; }\n` +
        `      main { padding: 1.5rem 1.25rem; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="mobile-header">\n` +
        `    <span class="brand">\n` +
        `      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>\n` +
        `      Documentation\n` +
        `    </span>\n` +
        `    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle Navigation">\n` +
        `      <svg id="iconDocsMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `      <svg id="iconDocsClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `    </button>\n` +
        `  </div>\n\n` +
        `  <div class="layout">\n` +
        `    <div class="backdrop" id="backdrop"></div>\n` +
        `    <aside id="sidebar">\n` +
        `      <h2>\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>\n` +
        `        Documentation\n` +
        `      </h2>\n` +
        `      <h3>Getting Started</h3>\n` +
        `      <a href="#overview" class="active">Overview & Installation</a>\n` +
        `      <a href="#configuration">Configuration</a>\n` +
        `      <h3>Guides</h3>\n` +
        `      <a href="#authentication">Authentication</a>\n` +
        `      <a href="#api">API Endpoints</a>\n` +
        `      <a href="#deployment">Deployment</a>\n` +
        `    </aside>\n` +
        `    <main>\n` +
        `      <section id="overview">\n` +
        `        <h1>Getting Started</h1>\n` +
        `        <p class="lead">Everything you need to integrate and build with our modern API.</p>\n` +
        `        <h2>Quick Install</h2>\n` +
        `        <pre>npm install @app/core --save</pre>\n` +
        `        <div class="callout">\n` +
        `          <strong>Tip:</strong> Make sure you are using Node.js version 18 or higher for full LTS support.\n` +
        `        </div>\n` +
        `      </section>\n\n` +
        `      <section id="configuration">\n` +
        `        <h2>Configuration</h2>\n` +
        `        <p>Configure your environment variables in your root <code>.env</code> file:</p>\n` +
        `        <pre>API_KEY=your_production_key_here\nDATABASE_URL=postgresql://localhost:5432/notes\nPORT=3000</pre>\n` +
        `      </section>\n\n` +
        `      <section id="authentication">\n` +
        `        <h2>Authentication</h2>\n` +
        `        <p>Pass your Bearer token in the <code>Authorization</code> header on every API request:</p>\n` +
        `        <pre>Authorization: Bearer &lt;YOUR_API_TOKEN&gt;</pre>\n` +
        `      </section>\n\n` +
        `      <section id="api">\n` +
        `        <h2>API Endpoints</h2>\n` +
        `        <div class="table-responsive">\n` +
        `          <table>\n` +
        `            <thead>\n` +
        `              <tr>\n` +
        `                <th>Method</th>\n` +
        `                <th>Endpoint</th>\n` +
        `                <th>Description</th>\n` +
        `              </tr>\n` +
        `            </thead>\n` +
        `            <tbody>\n` +
        `              <tr>\n` +
        `                <td><code>GET</code></td>\n` +
        `                <td>/api/v1/notes</td>\n` +
        `                <td>Retrieve all user notes</td>\n` +
        `              </tr>\n` +
        `              <tr>\n` +
        `                <td><code>POST</code></td>\n` +
        `                <td>/api/v1/notes</td>\n` +
        `                <td>Create a new note entry</td>\n` +
        `              </tr>\n` +
        `              <tr>\n` +
        `                <td><code>DELETE</code></td>\n` +
        `                <td>/api/v1/notes/:id</td>\n` +
        `                <td>Delete a note permanently</td>\n` +
        `              </tr>\n` +
        `            </tbody>\n` +
        `          </table>\n` +
        `        </div>\n` +
        `      </section>\n\n` +
        `      <section id="deployment">\n` +
        `        <h2>Deployment</h2>\n` +
        `        <p>Deploy to production with Docker or any modern containerized cloud platform:</p>\n` +
        `        <pre>docker build -t luno-app .\ndocker run -p 3000:3000 luno-app</pre>\n` +
        `      </section>\n` +
        `    </main>\n` +
        `  </div>\n\n` +
        `  <script>\n` +
        `    const toggle = document.getElementById('sidebarToggle');\n` +
        `    const sidebar = document.getElementById('sidebar');\n` +
        `    const backdrop = document.getElementById('backdrop');\n` +
        `    const iconDocsMenu = document.getElementById('iconDocsMenu');\n` +
        `    const iconDocsClose = document.getElementById('iconDocsClose');\n` +
        `    function toggleSidebar() {\n` +
        `      const isOpen = sidebar.classList.toggle('open');\n` +
        `      backdrop.classList.toggle('open', isOpen);\n` +
        `      if (iconDocsMenu) iconDocsMenu.style.display = isOpen ? 'none' : 'block';\n` +
        `      if (iconDocsClose) iconDocsClose.style.display = isOpen ? 'block' : 'none';\n` +
        `    }\n` +
        `    if (toggle) toggle.addEventListener('click', toggleSidebar);\n` +
        `    if (backdrop) backdrop.addEventListener('click', toggleSidebar);\n` +
        `  </script>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "link-tree") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>My Links</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; padding: 2.5rem 1.25rem; }\n` +
        `    .container { max-width: 480px; width: 100%; text-align: center; }\n` +
        `    .avatar { width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 1.25rem; border: 3px solid #ec4899; box-shadow: 0 4px 20px rgba(236,72,153,0.3); object-fit: cover; display: block; }\n` +
        `    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }\n` +
        `    .bio { font-size: 0.95rem; color: #94a3b8; margin-bottom: 2rem; }\n` +
        `    .links { display: flex; flex-direction: column; gap: 1rem; }\n` +
        `    .link-card { display: flex; align-items: center; justify-content: center; gap: 0.65rem; padding: 1rem 1.5rem; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 14px; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 1rem; transition: all 0.2s ease; }\n` +
        `    .link-card svg { shrink: 0; }\n` +
        `    .link-card:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.16); border-color: #ec4899; box-shadow: 0 8px 24px rgba(236,72,153,0.2); color: #ffffff !important; }\n` +
        `    .socials { display: flex; justify-content: center; align-items: center; gap: 1.25rem; margin-top: 2.5rem; }\n` +
        `    .social-btn { color: #94a3b8; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform 0.2s; }\n` +
        `    .social-btn:hover { color: #ec4899; transform: translateY(-2px); }\n` +
        `    footer { margin-top: 3rem; font-size: 0.8rem; color: #64748b; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" alt="Profile Avatar" class="avatar">\n` +
        `    <h1>Creator Name</h1>\n` +
        `    <p class="bio">Designer, Developer & Content Creator</p>\n` +
        `    <div class="links">\n` +
        `      <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>\n` +
        `        Visit My Portfolio Website\n` +
        `      </a>\n` +
        `      <a href="https://medium.com" target="_blank" rel="noopener noreferrer" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>\n` +
        `        Read My Latest Blog Articles\n` +
        `      </a>\n` +
        `      <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>\n` +
        `        Check Out My Recent Project\n` +
        `      </a>\n` +
        `      <a href="mailto:creator@example.com" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>\n` +
        `        Contact & Business Inquiries\n` +
        `      </a>\n` +
        `    </div>\n` +
        `    <div class="socials">\n` +
        `      <a href="https://x.com" target="_blank" rel="noopener noreferrer" class="social-btn" title="Twitter / X">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>\n` +
        `      </a>\n` +
        `      <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="social-btn" title="GitHub">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>\n` +
        `      </a>\n` +
        `      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="social-btn" title="LinkedIn">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>\n` +
        `      </a>\n` +
        `      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="social-btn" title="YouTube">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>\n` +
        `      </a>\n` +
        `    </div>\n` +
        `    <footer>&copy; ${new Date().getFullYear()} Creator Name. Powered by Luno.</footer>\n` +
        `  </div>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "invoice") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Invoice #INV-${now.getFullYear()}-001</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; background: #f8fafc; padding: 2rem 1rem; }\n` +
        `    .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; padding: clamp(1.5rem, 4vw, 3rem); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }\n` +
        `    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }\n` +
        `    .brand h1 { font-size: 1.75rem; color: #059669; font-weight: 800; }\n` +
        `    .brand p { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }\n` +
        `    .meta { text-align: right; font-size: 0.875rem; color: #64748b; }\n` +
        `    .meta h2 { font-size: 1.25rem; color: #0f172a; margin-bottom: 0.25rem; }\n` +
        `    .parties { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }\n` +
        `    .party-title { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 0.5rem; }\n` +
        `    .party-name { font-size: 1rem; font-weight: 600; color: #0f172a; }\n` +
        `    .party-info { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-top: 0.25rem; }\n` +
        `    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1.5rem; }\n` +
        `    table { width: 100%; border-collapse: collapse; min-width: 480px; }\n` +
        `    th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }\n` +
        `    td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }\n` +
        `    .text-right { text-align: right; }\n` +
        `    .totals { width: 100%; max-width: 280px; margin-left: auto; margin-bottom: 2rem; }\n` +
        `    .total-row { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; color: #64748b; }\n` +
        `    .total-row.grand { border-top: 2px solid #0f172a; font-size: 1.15rem; font-weight: 700; color: #0f172a; padding-top: 0.75rem; }\n` +
        `    .payment-info { background: #f8fafc; border-radius: 8px; padding: 1.25rem; font-size: 0.875rem; color: #475569; border-left: 4px solid #059669; }\n` +
        `    .print-btn { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem; background: #059669; color: #ffffff !important; border: none; padding: 0.6rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; }\n` +
        `    .print-btn:hover { background: #047857; }\n` +
        `    @media print { body { background: #fff; padding: 0; } .invoice-card { border: none; box-shadow: none; padding: 0; } .print-btn { display: none; } }\n` +
        `    @media (max-width: 600px) {\n` +
        `      .meta { text-align: left; }\n` +
        `      .header { flex-direction: column; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="invoice-card">\n` +
        `    <div class="header">\n` +
        `      <div class="brand">\n` +
        `        <h1>Your Company Name</h1>\n` +
        `        <p>Design & Software Development Studio</p>\n` +
        `      </div>\n` +
        `      <div class="meta">\n` +
        `        <h2>INVOICE</h2>\n` +
        `        <p><strong>Invoice No:</strong> #INV-${now.getFullYear()}-001</p>\n` +
        `        <p><strong>Date:</strong> ${dateStr}</p>\n` +
        `        <p><strong>Due Date:</strong> ${dateStr}</p>\n` +
        `      </div>\n` +
        `    </div>\n\n` +
        `    <div class="parties">\n` +
        `      <div>\n` +
        `        <div class="party-title">Billed From:</div>\n` +
        `        <div class="party-name">Studio Luno Co., Ltd.</div>\n` +
        `        <div class="party-info">123 Tech Avenue, Suite 400<br>Bangkok 10110, Thailand<br>tax@company.com</div>\n` +
        `      </div>\n` +
        `      <div>\n` +
        `        <div class="party-title">Billed To:</div>\n` +
        `        <div class="party-name">Client Name / Business</div>\n` +
        `        <div class="party-info">456 Enterprise Road<br>contact@client.com<br>Tax ID: 0105550000000</div>\n` +
        `      </div>\n` +
        `    </div>\n\n` +
        `    <div class="table-responsive">\n` +
        `      <table>\n` +
        `        <thead>\n` +
        `          <tr>\n` +
        `            <th>Description</th>\n` +
        `            <th class="text-right">Qty</th>\n` +
        `            <th class="text-right">Rate</th>\n` +
        `            <th class="text-right">Amount</th>\n` +
        `          </tr>\n` +
        `        </thead>\n` +
        `        <tbody>\n` +
        `          <tr>\n` +
        `            <td>UI/UX Design & Prototyping System</td>\n` +
        `            <td class="text-right">1</td>\n` +
        `            <td class="text-right">฿25,000.00</td>\n` +
        `            <td class="text-right">฿25,000.00</td>\n` +
        `          </tr>\n` +
        `          <tr>\n` +
        `            <td>Frontend Web Application Development</td>\n` +
        `            <td class="text-right">1</td>\n` +
        `            <td class="text-right">฿35,000.00</td>\n` +
        `            <td class="text-right">฿35,000.00</td>\n` +
        `          </tr>\n` +
        `        </tbody>\n` +
        `      </table>\n` +
        `    </div>\n\n` +
        `    <div class="totals">\n` +
        `      <div class="total-row"><span>Subtotal:</span><span>฿60,000.00</span></div>\n` +
        `      <div class="total-row"><span>VAT (7%):</span><span>฿4,200.00</span></div>\n` +
        `      <div class="total-row grand"><span>Total Due:</span><span>฿64,200.00</span></div>\n` +
        `    </div>\n\n` +
        `    <div class="payment-info">\n` +
        `      <strong>Payment Details:</strong><br>\n` +
        `      Bank Name: Kasikorn Bank (KBank)<br>\n` +
        `      Account Name: Studio Luno Co., Ltd.<br>\n` +
        `      Account No: 123-4-56789-0<br>\n` +
        `      PromptPay / Reference: 0812345678\n` +
        `    </div>\n\n` +
        `    <button class="print-btn" onclick="window.print()">\n` +
        `      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>\n` +
        `      Print / Save as PDF\n` +
        `    </button>\n` +
        `  </div>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "pricing-table") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Pricing Plans</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 3.5rem 1.25rem; }\n` +
        `    .container { max-width: 1080px; margin: 0 auto; }\n` +
        `    .header { text-align: center; margin-bottom: 3rem; }\n` +
        `    .header h1 { font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 800; margin-bottom: 0.75rem; background: linear-gradient(to right, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n` +
        `    .header p { color: #94a3b8; font-size: clamp(1rem, 2.5vw, 1.15rem); }\n` +
        `    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 1.75rem; align-items: stretch; }\n` +
        `    .plan-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2.25rem 1.75rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: transform 0.2s, border-color 0.2s; }\n` +
        `    .plan-card:hover { transform: translateY(-4px); border-color: #60a5fa; }\n` +
        `    .plan-card.popular { border: 2px solid #3b82f6; background: linear-gradient(180deg, #1e293b 0%, #172554 100%); }\n` +
        `    .badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #3b82f6; color: #fff; padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }\n` +
        `    .plan-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }\n` +
        `    .plan-desc { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.25rem; min-height: 40px; }\n` +
        `    .price { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 1.5rem; color: #fff; }\n` +
        `    .price span { font-size: 0.95rem; color: #94a3b8; font-weight: 400; }\n` +
        `    .features { list-style: none; margin-bottom: 2rem; flex: 1; }\n` +
        `    .features li { padding: 0.55rem 0; font-size: 0.9rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.6rem; }\n` +
        `    .features li::before { content: ""; display: inline-block; width: 15px; height: 15px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; shrink: 0; }\n` +
        `    .btn { display: block; text-align: center; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; text-decoration: none; transition: background 0.2s; }\n` +
        `    .btn-outline { border: 1px solid #475569; color: #ffffff !important; }\n` +
        `    .btn-outline:hover { background: #334155; color: #ffffff !important; }\n` +
        `    .btn-primary { background: #2563eb; color: #ffffff !important; }\n` +
        `    .btn-primary:hover { background: #1d4ed8; color: #ffffff !important; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container" id="plans">\n` +
        `    <div class="header">\n` +
        `      <h1>Simple, Transparent Pricing</h1>\n` +
        `      <p>Choose the right plan to scale your productivity and projects</p>\n` +
        `    </div>\n\n` +
        `    <div class="pricing-grid">\n` +
        `      <div class="plan-card">\n` +
        `        <div>\n` +
        `          <div class="plan-name">Starter</div>\n` +
        `          <div class="plan-desc">For individuals and students getting started</div>\n` +
        `          <div class="price">Free <span>/ lifetime</span></div>\n` +
        `          <ul class="features">\n` +
        `            <li>Up to 10 workspaces</li>\n` +
        `            <li>Full Markdown & Note editor</li>\n` +
        `            <li>Local file storage</li>\n` +
        `            <li>Community support</li>\n` +
        `          </ul>\n` +
        `        </div>\n` +
        `        <a href="#plans" class="btn btn-outline" onclick="alert('Starter Plan selected');">Get Started Free</a>\n` +
        `      </div>\n\n` +
        `      <div class="plan-card popular">\n` +
        `        <span class="badge">Most Popular</span>\n` +
        `        <div>\n` +
        `          <div class="plan-name">Professional</div>\n` +
        `          <div class="plan-desc">For professionals, developers and power users</div>\n` +
        `          <div class="price">$12 <span>/ month</span></div>\n` +
        `          <ul class="features">\n` +
        `            <li>Unlimited workspaces & files</li>\n` +
        `            <li>AI Assistant integration (Gemini)</li>\n` +
        `            <li>Live HTML & Web viewer</li>\n` +
        `            <li>Cloud sync & backup</li>\n` +
        `            <li>Priority customer support</li>\n` +
        `          </ul>\n` +
        `        </div>\n` +
        `        <a href="#plans" class="btn btn-primary" onclick="alert('Starting 14-day free trial');">Start 14-Day Free Trial</a>\n` +
        `      </div>\n\n` +
        `      <div class="plan-card">\n` +
        `        <div>\n` +
        `          <div class="plan-name">Team & Enterprise</div>\n` +
        `          <div class="plan-desc">For growing teams requiring advanced security</div>\n` +
        `          <div class="price">$29 <span>/ user / mo</span></div>\n` +
        `          <ul class="features">\n` +
        `            <li>Everything in Professional</li>\n` +
        `            <li>Team collaboration & workspaces</li>\n` +
        `            <li>Audit logs & version snapshots</li>\n` +
        `            <li>Dedicated onboarding manager</li>\n` +
        `          </ul>\n` +
        `        </div>\n` +
        `        <a href="mailto:sales@example.com" class="btn btn-outline">Contact Sales</a>\n` +
        `      </div>\n` +
        `    </div>\n` +
        `  </div>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "event-invite") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Tech Summit 2026 - Invitation</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; line-height: 1.6; }\n` +
        `    .container { max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; }\n` +
        `    .hero { text-align: center; padding: clamp(2.5rem, 5vw, 4rem) 1.25rem 2.5rem; background: radial-gradient(circle at center, #1e1b4b 0%, #0b0f19 70%); border-radius: 20px; margin-bottom: 2.5rem; border: 1px solid #1e293b; }\n` +
        `    .tag { display: inline-block; background: #ec4899; color: #ffffff; padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem; }\n` +
        `    h1 { font-size: clamp(1.85rem, 5vw, 2.75rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem; color: #fff; }\n` +
        `    .lead { font-size: clamp(1rem, 2.5vw, 1.15rem); color: #94a3b8; max-width: 600px; margin: 0 auto 2rem; }\n` +
        `    .event-badges { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }\n` +
        `    .badge-item { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 0.65rem 1.15rem; border-radius: 12px; font-size: 0.85rem; text-align: center; }\n` +
        `    .badge-item strong { display: block; color: #38bdf8; font-size: 1.05rem; margin-top: 0.15rem; }\n` +
        `    .schedule-card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: clamp(1.5rem, 4vw, 2.5rem); margin-bottom: 2.5rem; }\n` +
        `    .schedule-card h2 { font-size: 1.4rem; margin-bottom: 1.5rem; color: #fff; border-bottom: 1px solid #1f2937; padding-bottom: 0.75rem; }\n` +
        `    .timeline-item { display: flex; gap: 1.25rem; margin-bottom: 1.25rem; }\n` +
        `    .time { width: 100px; font-weight: 700; color: #ec4899; font-size: 0.9rem; shrink: 0; }\n` +
        `    .session h3 { font-size: 1rem; color: #fff; margin-bottom: 0.2rem; }\n` +
        `    .session p { font-size: 0.85rem; color: #94a3b8; }\n` +
        `    .rsvp-form { background: #1e1b4b; border: 1px solid #3730a3; border-radius: 16px; padding: clamp(1.5rem, 4vw, 2.5rem); text-align: center; }\n` +
        `    .rsvp-form h2 { font-size: clamp(1.3rem, 3vw, 1.6rem); color: #fff; margin-bottom: 0.5rem; }\n` +
        `    .rsvp-form p { color: #cbd5e1; font-size: 0.95rem; margin-bottom: 1.5rem; }\n` +
        `    .form-inputs { display: flex; gap: 0.75rem; max-width: 500px; margin: 0 auto; }\n` +
        `    input[type="email"] { flex: 1; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid #4338ca; background: #0f172a; color: #fff; font-size: 0.95rem; outline: none; }\n` +
        `    .btn-rsvp { background: #ec4899; color: #ffffff !important; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; }\n` +
        `    .btn-rsvp:hover { background: #db2777; color: #ffffff !important; }\n` +
        `    footer { text-align: center; margin-top: 3rem; color: #64748b; font-size: 0.85rem; }\n` +
        `    @media (max-width: 600px) {\n` +
        `      .timeline-item { flex-direction: column; gap: 0.25rem; }\n` +
        `      .form-inputs { flex-direction: column; }\n` +
        `      .btn-rsvp { width: 100%; }\n` +
        `    }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <div class="hero">\n` +
        `      <span class="tag">Exclusive Invitation</span>\n` +
        `      <h1>Annual Tech & Innovation Summit 2026</h1>\n` +
        `      <p class="lead">Join global creators, software leaders, and innovators for a day of inspiring keynotes and workshops.</p>\n` +
        `      <div class="event-badges">\n` +
        `        <div class="badge-item"><span>Date</span><strong>${dateStr}</strong></div>\n` +
        `        <div class="badge-item"><span>Time</span><strong>09:00 - 17:00</strong></div>\n` +
        `        <div class="badge-item"><span>Location</span><strong>Grand Hall & Online</strong></div>\n` +
        `      </div>\n` +
        `    </div>\n\n` +
        `    <div class="schedule-card">\n` +
        `      <h2>Agenda & Highlights</h2>\n` +
        `      <div class="timeline-item">\n` +
        `        <div class="time">09:00 - 10:00</div>\n` +
        `        <div class="session">\n` +
        `          <h3>Opening Keynote: The Future of Autonomous Software</h3>\n` +
        `          <p>Key insights on emerging AI frameworks and local-first computing.</p>\n` +
        `        </div>\n` +
        `      </div>\n` +
        `      <div class="timeline-item">\n` +
        `        <div class="time">10:30 - 12:00</div>\n` +
        `        <div class="session">\n` +
        `          <h3>Modern UI Architecture & Scalable Systems</h3>\n` +
        `          <p>Interactive panel with top tech leaders and open-source contributors.</p>\n` +
        `        </div>\n` +
        `      </div>\n` +
        `      <div class="timeline-item">\n` +
        `        <div class="time">13:30 - 16:30</div>\n` +
        `        <div class="session">\n` +
        `          <h3>Hands-on Workshops & Networking Sessions</h3>\n` +
        `          <p>Build and deploy production-ready applications with team mentors.</p>\n` +
        `        </div>\n` +
        `      </div>\n` +
        `    </div>\n\n` +
        `    <div class="rsvp-form">\n` +
        `      <h2>Reserve Your Seat</h2>\n` +
        `      <p>Spots are limited. Enter your email to receive your personalized pass.</p>\n` +
        `      <form class="form-inputs" onsubmit="event.preventDefault(); alert('RSVP Confirmed! Check your inbox.');">\n` +
        `        <input type="email" placeholder="you@company.com" required>\n` +
        `        <button type="submit" class="btn-rsvp">RSVP Now</button>\n` +
        `      </form>\n` +
        `    </div>\n\n` +
        `    <footer>\n` +
        `      <p>&copy; ${new Date().getFullYear()} Tech Summit Organization. All rights reserved.</p>\n` +
        `    </footer>\n` +
        `  </div>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "restaurant-menu") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Artisan Cafe & Bistro Menu</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: 'Times New Roman', Georgia, serif; color: #292524; background: #fafaf9; line-height: 1.6; padding: 2.5rem 1rem; }\n` +
        `    .menu-card { max-width: 820px; margin: 0 auto; background: #fff; padding: clamp(1.5rem, 5vw, 3.5rem); border: 1px solid #e7e5e4; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }\n` +
        `    .header { text-align: center; border-bottom: 2px solid #78716c; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }\n` +
        `    .header h1 { font-size: clamp(2rem, 5vw, 2.75rem); font-weight: normal; letter-spacing: 0.1em; text-transform: uppercase; color: #1c1917; margin-bottom: 0.25rem; }\n` +
        `    .header p { font-style: italic; color: #78716c; font-size: clamp(0.95rem, 2.5vw, 1.1rem); }\n` +
        `    .category-title { font-size: 1.35rem; text-transform: uppercase; letter-spacing: 0.08em; color: #b45309; text-align: center; margin: 2rem 0 1.25rem; border-bottom: 1px dashed #d6d3d1; padding-bottom: 0.5rem; }\n` +
        `    .menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.75rem; }\n` +
        `    .menu-item { margin-bottom: 1rem; }\n` +
        `    .item-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 1.05rem; font-weight: bold; color: #1c1917; border-bottom: 1px dotted #d6d3d1; padding-bottom: 0.2rem; margin-bottom: 0.35rem; }\n` +
        `    .item-desc { font-size: 0.875rem; color: #78716c; font-family: system-ui, sans-serif; line-height: 1.4; }\n` +
        `    .tag { font-size: 0.75rem; background: #fef3c7; color: #92400e; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: system-ui, sans-serif; font-weight: 500; margin-left: 0.5rem; }\n` +
        `    .footer { text-align: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e7e5e4; font-family: system-ui, sans-serif; font-size: 0.85rem; color: #a8a29e; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="menu-card">\n` +
        `    <div class="header">\n` +
        `      <h1>Luno Bistro & Cafe</h1>\n` +
        `      <p>Handcrafted Dishes, Specialty Coffee & Desserts</p>\n` +
        `    </div>\n\n` +
        `    <h2 class="category-title">Signature Dishes</h2>\n` +
        `    <div class="menu-grid">\n` +
        `      <div class="menu-item">\n` +
        `        <div class="item-header">\n` +
        `          <span>Truffle Pasta Fresca <span class="tag">Chef's Choice</span></span>\n` +
        `          <span>฿380</span>\n` +
        `        </div>\n` +
        `        <p class="item-desc">Fresh handmade fettuccine, black truffle cream, parmesan reggiano, wild mushrooms.</p>\n` +
        `      </div>\n` +
        `      <div class="menu-item">\n` +
        `        <div class="item-header">\n` +
        `          <span>Pan-Seared Salmon</span>\n` +
        `          <span>฿450</span>\n` +
        `        </div>\n` +
        `        <p class="item-desc">Crispy skin Norwegian salmon, asparagus puree, lemon-butter reduction.</p>\n` +
        `      </div>\n` +
        `    </div>\n\n` +
        `    <h2 class="category-title">Specialty Coffee & Drinks</h2>\n` +
        `    <div class="menu-grid">\n` +
        `      <div class="menu-item">\n` +
        `        <div class="item-header">\n` +
        `          <span>Single-Origin Pour Over</span>\n` +
        `          <span>฿140</span>\n` +
        `        </div>\n` +
        `        <p class="item-desc">Ethiopian Yirgacheffe, floral notes, bergamot, clean sweet finish.</p>\n` +
        `      </div>\n` +
        `      <div class="menu-item">\n` +
        `        <div class="item-header">\n` +
        `          <span>Dirty Honey Matcha</span>\n` +
        `          <span>฿160</span>\n` +
        `        </div>\n` +
        `        <p class="item-desc">Ceremonial grade Uji matcha, espresso shot, cold velvety milk, wild honey.</p>\n` +
        `      </div>\n` +
        `    </div>\n\n` +
        `    <div class="footer">\n` +
        `      <p>Open Tuesday - Sunday: 08:00 AM - 10:00 PM &bull; Tel: 02-123-4567</p>\n` +
        `      <p>Please inform our team of any food allergies.</p>\n` +
        `    </div>\n` +
        `  </div>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (templateType === "faq-page") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Frequently Asked Questions (FAQ)</title>\n` +
        `  <style>\n` +
        `    * { box-sizing: border-box; margin: 0; padding: 0; }\n` +
        `    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; padding: 2.5rem 1.25rem; }\n` +
        `    .container { max-width: 800px; margin: 0 auto; }\n` +
        `    .header { text-align: center; margin-bottom: 2.5rem; }\n` +
        `    .header h1 { font-size: clamp(1.8rem, 4vw, 2.25rem); font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }\n` +
        `    .header p { color: #64748b; font-size: clamp(0.95rem, 2.5vw, 1.05rem); }\n` +
        `    .faq-list { display: flex; flex-direction: column; gap: 1rem; }\n` +
        `    details { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem 1.5rem; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }\n` +
        `    details[open] { border-color: #6366f1; box-shadow: 0 6px 16px rgba(99,102,241,0.08); }\n` +
        `    summary { font-size: 1.05rem; font-weight: 600; color: #0f172a; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none; }\n` +
        `    summary::-webkit-details-marker { display: none; }\n` +
        `    summary::after { content: "+"; font-size: 1.4rem; color: #6366f1; font-weight: 400; transition: transform 0.2s; }\n` +
        `    details[open] summary::after { transform: rotate(45deg); }\n` +
        `    .faq-content { margin-top: 1rem; font-size: 0.95rem; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }\n` +
        `    .support-card { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 14px; padding: 2rem; text-align: center; margin-top: 2.5rem; }\n` +
        `    .support-card h3 { font-size: 1.2rem; color: #3730a3; margin-bottom: 0.5rem; }\n` +
        `    .support-card p { font-size: 0.9rem; color: #4f46e5; margin-bottom: 1.25rem; }\n` +
        `    .btn-support { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 0.65rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; }\n` +
        `    .btn-support:hover { background: #4338ca; color: #ffffff !important; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <div class="header">\n` +
        `      <h1>Help Center & FAQ</h1>\n` +
        `      <p>Find answers to common questions about accounts, features, and billing.</p>\n` +
        `    </div>\n\n` +
        `    <div class="faq-list">\n` +
        `      <details open>\n` +
        `        <summary>How does local note storage and encryption work?</summary>\n` +
        `        <div class="faq-content">\n` +
        `          All your notes and files are stored directly on your machine in standard Markdown, HTML, or Plain Text format. When you lock a note with a PIN, it is encrypted using AES-256 standard encryption.\n` +
        `        </div>\n` +
        `      </details>\n\n` +
        `      <details>\n` +
        `        <summary>Can I sync my notes across multiple devices?</summary>\n` +
        `        <div class="faq-content">\n` +
        `          Yes! You can connect your Google Drive account in Settings to automatically sync and backup your entire workspace folder seamlessly.\n` +
        `        </div>\n` +
        `      </details>\n\n` +
        `      <details>\n` +
        `        <summary>How do I integrate Gemini AI features?</summary>\n` +
        `        <div class="faq-content">\n` +
        `          Simply open Settings &rarr; AI Assistant and paste your free Google AI Studio Gemini API key. You will be able to brainstorm, summarize, and translate notes instantly.\n` +
        `        </div>\n` +
        `      </details>\n` +
        `      <details>\n` +
        `        <summary>Are there keyboard shortcuts available?</summary>\n` +
        `        <div class="faq-content">\n` +
        `          Yes, Luno Notes features comprehensive shortcuts. Press <kbd>Ctrl+N</kbd> for a new note, <kbd>Ctrl+S</kbd> to save, and type <code>/</code> at the start of any line for Slash commands.\n` +
        `        </div>\n` +
        `      </details>\n` +
        `    </div>\n\n` +
        `    <div class="support-card">\n` +
        `      <h3>Still have questions?</h3>\n` +
        `      <p>We're here to help you get the most out of your workflow.</p>\n` +
        `      <a href="mailto:support@example.com" class="btn-support">Contact Support</a>\n` +
        `    </div>\n` +
        `  </div>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    if (!templateType || templateType === "blank") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Document</title>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <h1>Hello, World!</h1>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    let title = "";
    let bodyContent = "";

    if (templateType === "meeting") {
      title = isTh ? `บันทึกการประชุม - ${dateStr}` : `Meeting Notes - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>บันทึกการประชุม - ${dateStr}</h1>\n` +
          `<h2>รายละเอียด</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วันที่:</strong> ${dateStr}</li>\n` +
          `  <li><strong>เวลา:</strong> ${timeStr}</li>\n` +
          `  <li><strong>ผู้เข้าร่วม:</strong> สมชาย (Lead Architect), วิภา (Product Designer), ธีรภัทร (Backend Engineer), กานต์ (QA)</li>\n` +
          `</ul>\n` +
          `<h2>วาระการประชุม</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> วาระที่ 1: ทบทวนผลการทดสอบระบบเวอร์ชัน 2.4</li>\n` +
          `  <li><input type="checkbox"> วาระที่ 2: วางแผนสปรินต์ระบบค้นหาอัจฉริยะ (Semantic Search)</li>\n` +
          `  <li><input type="checkbox"> วาระที่ 3: สรุปกรอบเวลาการเปิดตัวและการย้ายข้อมูล</li>\n` +
          `</ul>\n` +
          `<h2>สรุปการพูดคุย & บันทึก</h2>\n` +
          `<p>ทีมตรวจสอบผลการทดสอบโหลดระบบ พบว่า API ตอบสนองได้ต่ำกว่า 85ms ภายใต้โหลด 10,000 req/s ซึ่งผ่านเกณฑ์ที่กำหนด</p>\n` +
          `<p>คุณวิภานำเสนอ Wireframe หน้าค้นหาใหม่ ทีมเห็นชอบกับการแสดงพรีวิวผลลัพธ์แบบเรียลไทม์ และเตรียมส่งต่อให้ทีม Backend ตรวจสอบ API Schema</p>\n` +
          `<h2>งานที่ต้องทำต่อ (Action Items)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> ตรวจสอบดัชนีฐานข้อมูลสำหรับการค้นหาข้อความ (ผู้รับผิดชอบ: ธีรภัทร, กำหนดเสร็จ: พรุ่งนี้ 17:00)</li>\n` +
          `  <li><input type="checkbox"> ปรับแก้ UI/UX ฟิลเตอร์ตามข้อเสนอแนะในการประชุม (ผู้รับผิดชอบ: วิภา, กำหนดเสร็จ: ศุกร์นี้)</li>\n` +
          `</ul>`
        : `<h1>Meeting Notes - ${dateStr}</h1>\n` +
          `<h2>Details</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Date:</strong> ${dateStr}</li>\n` +
          `  <li><strong>Time:</strong> ${timeStr}</li>\n` +
          `  <li><strong>Attendees:</strong> Alex Rivera (Lead Architect), Sarah Chen (Product Designer), Marcus Vance (Senior Backend Engineer), Elena Rostova (QA Specialist)</li>\n` +
          `</ul>\n` +
          `<h2>Agenda</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> Item 1: Review v2.4 load test results & benchmark performance</li>\n` +
          `  <li><input type="checkbox"> Item 2: Finalize architecture for semantic vector search rollout</li>\n` +
          `  <li><input type="checkbox"> Item 3: Coordinate staging release cut-off & migration checklist</li>\n` +
          `</ul>\n` +
          `<h2>Discussion & Notes</h2>\n` +
          `<p>The QA team verified that p99 latency remained steady under 85ms across 10,000 requests/sec during stress testing.</p>\n` +
          `<p>Sarah demonstrated the updated search UI prototypes with live document snippet preview; team agreed on the layout and frozen specifications.</p>\n` +
          `<h2>Action Items</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Configure pgvector indexing and cache tuning (Assigned to: Marcus Vance, Due: Tomorrow 5 PM)</li>\n` +
          `  <li><input type="checkbox"> Deliver finalized responsive mockup for filters (Assigned to: Sarah Chen, Due: Friday)</li>\n` +
          `</ul>`;
    } else if (templateType === "daily") {
      title = isTh ? `บันทึกประจำวัน - ${dateStr}` : `Daily Journal - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>บันทึกประจำวัน - ${dateStr}</h1>\n` +
          `<h2>สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ</h2>\n` +
          `<p>ขอบคุณทีมงานที่ช่วยกันตรวจสอบและแก้ไขปัญหา deployment ได้รวดเร็ว ทำให้ระบบกลับมาทำงานได้อย่างราบรื่น และได้แบ่งเวลาช่วงบ่ายอ่านบทความสถาปัตยกรรมคลาวด์</p>\n` +
          `<h2>เป้าหมายสำคัญวันนี้</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> ตรวจทาน Pull Request สำหรับระบบค้นหาเอกสาร</li>\n` +
          `  <li><input type="checkbox"> ออกแบบ Data Schema สำหรับระบบแท็กและหมวดหมู่</li>\n` +
          `  <li><input type="checkbox"> สรุปรายงานความคืบหน้ารายสัปดาห์ส่งให้หัวหน้าทีม</li>\n` +
          `</ul>\n` +
          `<h2>ข้อคิด & สรุปประจำวัน</h2>\n` +
          `<p>การให้เวลากับการวางแผนและเขียน Type Definition ที่รัดกุมตั้งแต่แรก ช่วยประหยัดเวลาในการแก้บั๊กช่วงท้ายโปรเจกต์ได้อย่างมหาศาล</p>`
        : `<h1>Daily Journal - ${dateStr}</h1>\n` +
          `<h2>Highlights & Gratitude</h2>\n` +
          `<p>Grateful for a productive morning sprint with the team, smoothly shipping the v2.4 performance patch ahead of schedule. Enjoyed a focused deep-work block in the afternoon.</p>\n` +
          `<h2>Today's Priorities</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> Review and approve core authentication refactor PR</li>\n` +
          `  <li><input type="checkbox"> Implement query caching layer for vector search endpoints</li>\n` +
          `  <li><input type="checkbox"> Draft architecture RFC for distributed sync engine</li>\n` +
          `</ul>\n` +
          `<h2>Notes & Reflections</h2>\n` +
          `<p>Investing upfront effort into clean component boundaries and comprehensive type contracts consistently prevents regressions downstream.</p>`;
    } else if (templateType === "project") {
      title = isTh ? `วางแผนโปรเจกต์` : `Project Planning`;
      bodyContent = isTh
        ? `<h1>วางแผนโปรเจกต์ - ระบบคลังเอกสารอัจฉริยะ</h1>\n` +
          `<h2>ภาพรวมโปรเจกต์</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วัตถุประสงค์:</strong> พัฒนาระบบคลังเอกสารและการจัดการองค์ความรู้อัจฉริยะ สำหรับทีมงานวิศวกรรม</li>\n` +
          `  <li><strong>กลุ่มเป้าหมาย:</strong> ทีมพัฒนาซอฟต์แวร์ ฝ่ายปฏิบัติการ และลูกค้าองค์กร</li>\n` +
          `  <li><strong>กำหนดการส่งมอบ:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>เป้าหมายหลัก (Key Objectives)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> ออกแบบโครงสร้างสถาปัตยกรรมแบบ Modular และ Local-first Storage</li>\n` +
          `  <li><input type="checkbox"> รองรับการค้นหาเอกสารแบบ Full-text และ Semantic Search ด้วยความเร็วระดับ Sub-second</li>\n` +
          `  <li><input type="checkbox"> ผ่านเกณฑ์การทดสอบความปลอดภัยและการเข้ารหัสตามมาตรฐาน AES-256</li>\n` +
          `</ul>\n` +
          `<h2>ขั้นตอนดำเนินการ (Milestones & Timeline)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> ระยะที่ 1: วางโครงสร้างสถาปัตยกรรมและกำหนด API Contract (เสร็จสิ้น)</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 2: ดำเนินการพัฒนา Core Engine และ UI Components (กำลังดำเนินการ)</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 3: ทดสอบโหลดและการรักษาความปลอดภัย (Penetration Testing)</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 4: ปล่อยใช้งานรุ่น Production และจัดอบรมทีมงาน</li>\n` +
          `</ul>\n` +
          `<h2>เครื่องมือและเทคโนโลยีที่ใช้</h2>\n` +
          `<p>TypeScript, Next.js, Tailwind CSS, TipTap Editor, PostgreSQL, Docker, Redis</p>\n` +
          `<h2>บันทึกเพิ่มเติม & ไอเดีย</h2>\n` +
          `<p>กำหนดให้ความสำคัญกับ Local-first ประสิทธิภาพต้องใช้งานแบบออฟไลน์ได้โดยสมบูรณ์ และมีระบบ Conflict Resolution อัตโนมัติเมื่อกลับมาออนไลน์</p>`
        : `<h1>Project Planning - Intelligent Knowledge Workspace</h1>\n` +
          `<h2>Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Objective:</strong> Build a high-performance, local-first document and knowledge management platform for modern engineering teams.</li>\n` +
          `  <li><strong>Target Audience:</strong> Engineering teams, product managers, and enterprise collaborators.</li>\n` +
          `  <li><strong>Target Launch Date:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>Key Objectives</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> Design extensible modular architecture with local AES-256 file encryption</li>\n` +
          `  <li><input type="checkbox"> Deliver sub-second full-text and semantic vector search across 100k+ documents</li>\n` +
          `  <li><input type="checkbox"> Achieve zero-loss offline sync with conflict-free replication</li>\n` +
          `</ul>\n` +
          `<h2>Milestones & Timeline</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> Phase 1: System architecture design & API contract specification (Completed)</li>\n` +
          `  <li><input type="checkbox"> Phase 2: Core editor & search engine implementation (In Progress)</li>\n` +
          `  <li><input type="checkbox"> Phase 3: Stress testing, security audit & cross-device validation</li>\n` +
          `  <li><input type="checkbox"> Phase 4: Production cutover and customer onboarding</li>\n` +
          `</ul>\n` +
          `<h2>Tools & Technologies</h2>\n` +
          `<p>TypeScript, Next.js, Tailwind CSS, TipTap, PostgreSQL, Redis, Docker</p>\n` +
          `<h2>Additional Notes & Brainstorming</h2>\n` +
          `<p>Prioritize offline-first responsiveness; all keystrokes and local metadata changes must persist synchronously to indexed storage before background syncing.</p>`;
    } else if (templateType === "todo") {
      title = isTh ? `รายการงานที่ต้องทำ - ${dateStr}` : `Task & To-Do List - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>รายการงานที่ต้องทำ - ${dateStr}</h1>\n` +
          `<h2>งานด่วนและสำคัญมาก (High Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> แก้ไขบั๊กหน่วยความจำรั่วไหลในกระบวนการแปลงไฟล์ PDF</li>\n` +
          `  <li><input type="checkbox" checked> อัปเดตคีย์ความปลอดภัยและการยืนยันตัวตนสำหรับ Production API</li>\n` +
          `</ul>\n` +
          `<h2>งานสำคัญทั่วไป (Medium Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> ปรับปรุงหน้าต่างการตั้งค่าให้รองรับการสลับภาษาแบบ Dynamic</li>\n` +
          `  <li><input type="checkbox" checked> เขียน Unit Test เพิ่มเติมสำหรับส่วนโมดูล dateTimeFormatter</li>\n` +
          `</ul>\n` +
          `<h2>งานอื่นๆ / งานตามหลัง (Low Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> จัดระเบียบไอคอนและล้างคลาส CSS ที่ไม่ได้ใช้งาน</li>\n` +
          `</ul>\n` +
          `<h2>สรุปงานเสร็จสิ้น (Completed)</h2>\n` +
          `<p>งานโครงสร้างพื้นฐานและการทดสอบเบื้องต้นเสร็จสมบูรณ์ 100% เตรียมส่งมอบงานส่วนที่เหลือในสปรินต์ถัดไป</p>`
        : `<h1>Task & To-Do List - ${dateStr}</h1>\n` +
          `<h2>High Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Fix memory leak during concurrent batch PDF export processing</li>\n` +
          `  <li><input type="checkbox" checked> Rotate staging API secret keys and update environment configs</li>\n` +
          `</ul>\n` +
          `<h2>Medium Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Refactor template preview breadcrumb to match editor height & padding</li>\n` +
          `  <li><input type="checkbox" checked> Add comprehensive unit tests for datetime formatting and frontmatter helpers</li>\n` +
          `</ul>\n` +
          `<h2>Low Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Audit unused CSS utilities and optimize bundle size</li>\n` +
          `</ul>\n` +
          `<h2>Completed</h2>\n` +
          `<p>Core infrastructure milestones achieved on schedule; ready to transition to feature integration testing.</p>`;
    } else if (templateType === "study") {
      title = isTh ? `บันทึกการเรียนรู้` : `Study & Research Notes`;
      bodyContent = isTh
        ? `<h1>บันทึกการเรียนรู้ - ระบบกระจายศูนย์และขั้นตอนวิธี Raft</h1>\n` +
          `<h2>ข้อมูลทั่วไป</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วิชา/หัวข้อ:</strong> ระบบกระจายศูนย์และขั้นตอนวิธี Raft Consensus</li>\n` +
          `  <li><strong>วันที่:</strong> ${dateStr}</li>\n` +
          `  <li><strong>แหล่งอ้างอิง:</strong> Designing Data-Intensive Applications (Martin Kleppmann), MIT 6.824</li>\n` +
          `</ul>\n` +
          `<h2>สรุปเนื้อหาสำคัญ (Key Concepts)</h2>\n` +
          `<p>Raft คือ Consensus Algorithm ที่ออกแบบมาให้เข้าใจง่ายกว่า Paxos โดยแบ่งการทำงานเป็น 3 ส่วนหลัก: Leader Election, Log Replication, และ Safety รับประกันว่าระบบยังทำงานได้ตราบใดที่โหนดส่วนใหญ่ (Quorum) ยังออนไลน์</p>\n` +
          `<h2>รายละเอียดและคำอธิบายเพิ่มเติม</h2>\n` +
          `<p>แต่ละโหนดมี 3 สถานะ: Follower, Candidate, และ Leader เมื่อ Follower ไม่ได้รับ Heartbeat ภายในช่วงสุ่ม Election Timeout จะสลับเป็น Candidate และเริ่มขอคะแนนเสียง (RequestVote) หากได้เสียงเกินกึ่งหนึ่งจะได้เป็น Leader</p>\n` +
          `<h2>คำถามที่ต้องหาคำตอบเพิ่ม (Questions)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> กลไก Log Compaction และ Snapshotting ทำงานอย่างไรเพื่อไม่ให้ Log มีขนาดใหญ่เกินไป?</li>\n` +
          `  <li><input type="checkbox"> จะจัดการกับปัญหา Split Brain อย่างมีประสิทธิภาพได้อย่างไรในสภาพเครือข่ายที่มี Latency สูง?</li>\n` +
          `</ul>\n` +
          `<h2>สรุปความเข้าใจแบบสั้น (Takeaways)</h2>\n` +
          `<p>หัวใจสำคัญของ Raft คือการพึ่งพา Leader เพียงตัวเดียว (Strong Leader Approach) ทำให้การตัดสินใจเรียงลำดับคำสั่งใน Log เกิดขึ้นได้โดยไม่ขัดแย้งกัน</p>`
        : `<h1>Study & Research Notes - Distributed Consensus & Raft</h1>\n` +
          `<h2>Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Subject/Topic:</strong> Distributed Consensus & The Raft Algorithm</li>\n` +
          `  <li><strong>Date:</strong> ${dateStr}</li>\n` +
          `  <li><strong>Source/References:</strong> Designing Data-Intensive Applications (Kleppmann), MIT 6.824 Distributed Systems</li>\n` +
          `</ul>\n` +
          `<h2>Key Concepts & Core Ideas</h2>\n` +
          `<p>Raft decomposes consensus into explicit, understandable sub-problems: Leader Election, Log Replication, and Safety guarantees. It guarantees linearizable state machine replication across unreliable networks as long as a strict majority (quorum) remains reachable.</p>\n` +
          `<h2>Detailed Notes</h2>\n` +
          `<p>Nodes transition through three discrete roles: Follower, Candidate, and Leader. Randomized election timeouts prevent split-vote deadlocks during elections. Once established, the Leader handles all write commands, serializes entries into its log, and broadcasts AppendEntries RPCs to replicas.</p>\n` +
          `<h2>Questions to Explore Further</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> How does log compaction via state snapshots integrate with incremental catch-up for partitioned replicas?</li>\n` +
          `  <li><input type="checkbox"> What are the exact trade-offs of Joint Consensus during dynamic cluster membership changes?</li>\n` +
          `</ul>\n` +
          `<h2>Key Takeaways & Summary</h2>\n` +
          `<p>Raft trades Paxos's symmetrical flexibility for an intuitive, strong-leader hierarchy, ensuring reliable ordered execution in real-world distributed architectures.</p>`;
    } else if (templateType === "bug") {
      title = isTh ? `รายงานปัญหา / บั๊ก` : `Bug & Issue Report`;
      bodyContent = isTh
        ? `<h1>รายงานปัญหา / บั๊ก - ปัญหาหน่วยความจำรั่วไหลในกระบวนการแปลงไฟล์ PDF</h1>\n` +
          `<h2>รายละเอียดปัญหา (Issue Overview)</h2>\n` +
          `<ul>\n` +
          `  <li><strong>ความรุนแรง:</strong> High</li>\n` +
          `  <li><strong>สถานะ:</strong> In Progress</li>\n` +
          `  <li><strong>วันที่พบปัญหา:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>อธิบายพฤติกรรมของปัญหา (Description)</h2>\n` +
          `<p>เมื่อผู้ใช้ส่งออกโน้ตเป็นไฟล์ PDF พร้อมกันมากกว่า 5 ไฟล์ผ่านหน้าต่าง Batch Export พบว่า Node.js process ใช้หน่วยความจำเพิ่มขึ้นอย่างรวดเร็วจนเกิน 2GB และเกิดข้อผิดพลาด OOM (Out of Memory) crash</p>\n` +
          `<h2>ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)</h2>\n` +
          `<ol>\n` +
          `  <li>เปิดหน้าคลังโน้ตและเลือกเอกสารจำนวน 6 ฉบับขึ้นไปที่มีภาพประกอบ</li>\n` +
          `  <li>กดปุ่ม &quot;ส่งออกเป็น PDF (Batch Export)&quot;</li>\n` +
          `  <li>สังเกตการใช้หน่วยความจำใน Task Manager พุ่งสูงและโปรเซสหยุดทำงาน</li>\n` +
          `</ol>\n` +
          `<h2>ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง</h2>\n` +
          `<ul>\n` +
          `  <li><strong>ผลลัพธ์ที่คาดหวัง:</strong> การส่งออกไฟล์ควรดำเนินการแบบสตรีมหรือประมวลผลทีละไฟล์ตามคิว โดยหน่วยความจำไม่ควรเกิน 250MB</li>\n` +
          `  <li><strong>ผลลัพธ์ที่เกิดขึ้นจริง:</strong> ตัวจัดการไฟล์โหลด Buffer ข้อมูลทั้งหมดเข้า Memory พร้อมกัน ทำให้หน่วยความจำล้น</li>\n` +
          `</ul>\n` +
          `<h2>แนวทางการแก้ไข (Proposed Fix & Action Items)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> ตรวจสอบ Profiler และระบุจุดที่ไม่ได้เรียก Dispose บน Canvas context</li>\n` +
          `  <li><input type="checkbox"> ปรับการทำงานให้เป็น Queue Worker ประมวลผลทีละ 2 รายการพร้อมกัน</li>\n` +
          `  <li><input type="checkbox"> เพิ่ม Unit Test ตรวจสอบขีดจำกัดการใช้ RAM ก่อนส่งขึ้น Production</li>\n` +
          `</ul>`
        : `<h1>Bug & Issue Report - Memory Leak in Batch PDF Export Processing</h1>\n` +
          `<h2>Issue Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Severity:</strong> High</li>\n` +
          `  <li><strong>Status:</strong> In Progress</li>\n` +
          `  <li><strong>Reported Date:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>Description</h2>\n` +
          `<p>When exporting more than 5 documents concurrently using the Batch PDF Export dialog, memory consumption escalates rapidly past 2GB, resulting in process crash due to Node.js Out-of-Memory (OOM).</p>\n` +
          `<h2>Steps to Reproduce</h2>\n` +
          `<ol>\n` +
          `  <li>Select 6 or more notes containing embedded images in the workspace</li>\n` +
          `  <li>Click &quot;Export as PDF (Batch)&quot; from the actions menu</li>\n` +
          `  <li>Monitor heap allocation in performance profiler; observe uncollected buffer growth until crash</li>\n` +
          `</ol>\n` +
          `<h2>Expected vs Actual Behavior</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Expected:</strong> Files should be processed sequentially or through a rate-limited worker pool with memory usage capped under 250MB.</li>\n` +
          `  <li><strong>Actual:</strong> All document streams and rendered canvases are buffered concurrently in heap memory without disposal.</li>\n` +
          `</ul>\n` +
          `<h2>Proposed Fix & Action Items</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox" checked> Identify uncollected canvas buffer references in the PDF generator worker</li>\n` +
          `  <li><input type="checkbox"> Implement sequential queue concurrency (concurrency limit: 2)</li>\n` +
          `  <li><input type="checkbox"> Write integration test verifying memory footprint remains bounded under stress</li>\n` +
          `</ul>`;
    }

    return (
      `<!DOCTYPE html>\n` +
      `<html lang="${lang}">\n` +
      `<head>\n` +
      `  <meta charset="UTF-8">\n` +
      `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
      `  <title>${title}</title>\n` +
      `  <style>\n` +
      `    body {\n` +
      `      font-family: system-ui, -apple-system, sans-serif;\n` +
      `      line-height: 1.7;\n` +
      `      max-width: 800px;\n` +
      `      margin: 40px auto;\n` +
      `      padding: 0 20px;\n` +
      `      color: #222;\n` +
      `    }\n` +
      `    h1 { font-size: 2.2rem; margin-bottom: 10px; }\n` +
      `    h2 { margin-top: 35px; }\n` +
      `    p { margin: 12px 0; }\n` +
      `    ul, ol { padding-left: 24px; }\n` +
      `  </style>\n` +
      `</head>\n` +
      `<body>\n` +
      `  ${bodyContent}\n` +
      `</body>\n` +
      `</html>`
    );
  }

  // Handle Markdown Format templates
  if (!templateType || templateType === "blank") {
    return "";
  }

  let rawMarkdown = "";

  if (templateType === "meeting") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกการประชุม - ${dateStr}\n\n` +
        `> 📌 **มติสำคัญที่ประชุม:** อนุมัติสถาปัตยกรรม Local-first v2.4 และเตรียมปล่อยทดสอบใน Staging วันศุกร์นี้\n\n` +
        `## ข้อมูลและผู้เข้าร่วมการประชุม (Meeting Details)\n` +
        `| ผู้เข้าร่วม | บทบาท / แผนก | สถานะ |\n` +
        `| :--- | :--- | :---: |\n` +
        `| สมชาย วงศ์สวัสดิ์ | Lead Architect | เข้าร่วม |\n` +
        `| วิภา เลิศรัตนชัย | Product Designer | เข้าร่วม |\n` +
        `| ธีรภัทร ชาญวิทย์ | Senior Backend Engineer | เข้าร่วม |\n` +
        `| กานต์ดา สุขใจ | QA Specialist | ลากิจ |\n\n` +
        `## วาระการประชุมตามลำดับ (Agenda)\n` +
        `1. **ทบทวนผล Benchmark:** ตรวจสอบ Latency ของระบบแคชและฐานข้อมูล\n` +
        `2. **อนุมัติ UI Search Flow:** ดูตัวอย่าง Wireframe หน้าค้นหาแบบเรียลไทม์\n` +
        `3. **วางแผนการปล่อยระบบ (Rollout):** กำหนดการย้ายข้อมูลและกรอบเวลา Staging\n\n` +
        `## บันทึกการพูดคุย & ข้อตกลง (Discussion Notes)\n` +
        `- ผลการทดสอบโหลดระบบพบว่า **p99 latency** อยู่ที่ \`85ms\` ภายใต้การโหลด \`10,000 req/s\` ผ่านเกณฑ์ความปลอดภัยเรียบร้อย\n` +
        `- ทีมเห็นพ้องใช้ \`pgvector\` ร่วมกับ Index แบบ HNSW สำหรับฟีเจอร์ Semantic Search\n` +
        `- คุณวิภานำเสนอแบบร่าง UI หน้าค้นหาใหม่ ทุกฝ่ายเห็นชอบกับการแสดงผลแบบ Instant Snippet\n\n` +
        `## รายการงานที่ต้องทำต่อ (Action Items)\n` +
        `- [x] ตรวจสอบ Index ฐานข้อมูลสำหรับ Full-text Search (ผู้รับผิดชอบ: ธีรภัทร, กำหนดเสร็จ: พรุ่งนี้ 17:00)\n` +
        `- [ ] ออกแบบ Responsive Mockup สำหรับหน้าจอมือถือ (ผู้รับผิดชอบ: วิภา, กำหนดเสร็จ: ศุกร์นี้)\n` +
        `- [ ] จัดเตรียมเอกสาร Migration Checklist สำหรับทีม DevOps (ผู้รับผิดชอบ: สมชาย)\n\n` +
        `#meeting #work #planning `
      );
    } else {
      rawMarkdown = (
        `# Meeting Notes - ${dateStr}\n\n` +
        `> 📌 **Key Decision:** Approved Local-first v2.4 core architecture specification; cut-off scheduled for Staging deployment this Friday.\n\n` +
        `## Meeting Details & Attendees\n` +
        `| Attendee | Role / Department | Status |\n` +
        `| :--- | :--- | :---: |\n` +
        `| Alex Rivera | Lead Architect | Present |\n` +
        `| Sarah Chen | Product Designer | Present |\n` +
        `| Marcus Vance | Senior Backend Engineer | Present |\n` +
        `| Elena Rostova | QA Specialist | Excused |\n\n` +
        `## Ordered Agenda\n` +
        `1. **Benchmark Review:** Audit vector cache latency and memory profiling under stress\n` +
        `2. **Search UI Approval:** Walkthrough responsive real-time snippet previews\n` +
        `3. **Release Planning:** Coordinate staging migration steps and rollback procedures\n\n` +
        `## Discussion Notes\n` +
        `- QA verified p99 latency stabilized below \`85ms\` across \`10,000 requests/sec\`, meeting all SLA criteria.\n` +
        `- Team agreed on adopting \`pgvector\` with HNSW indexing for low-latency semantic retrieval.\n` +
        `- Sarah presented updated modal designs; unanimous consensus on the split layout with live markdown rendering.\n\n` +
        `## Action Items\n` +
        `- [x] Configure database indexes for full-text search (Owner: Marcus Vance, Due: Tomorrow 5 PM)\n` +
        `- [ ] Finalize responsive mobile mockups (Owner: Sarah Chen, Due: Friday)\n` +
        `- [ ] Prepare staging deployment runbook for DevOps (Owner: Alex Rivera)\n\n` +
        `#meeting #work #planning `
      );
    }
  } else if (templateType === "daily") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกประจำวัน - ${dateStr}\n\n` +
        `> 💡 "การเริ่มต้นวันด้วยความชัดเจนในเป้าหมาย ดีกว่าการรีบเร่งลงมือทำโดยไร้ทิศทาง" — **Daily Mindset**\n\n` +
        `## 🎯 3 อันดับสิ่งสำคัญที่สุดวันนี้ (Top 3 Priorities)\n` +
        `1. **ตรวจสอบโค้ด Core Architecture:** อนุมัติ Pull Request สำหรับระบบแคชเอกสาร\n` +
        `2. **ออกแบบ Schema ฐานข้อมูล:** สรุปโครงสร้างตารางและดัชนีสำหรับระบบค้นหา\n` +
        `3. **ส่งสรุปสปรินต์ประจำสัปดาห์:** สรุปผลการทดสอบและตัวชี้วัดส่งให้ผู้จัดการฝ่าย\n\n` +
        `## ⏰ ตารางจัดสรรเวลา (Time-blocking Schedule)\n` +
        `| ช่วงเวลา | กิจกรรม / งานสำคัญ | หมวดหมู่งาน |\n` +
        `| :--- | :--- | :---: |\n` +
        `| 09:00 - 10:30 | Deep Work: เขียน Unit Test และ Refactor Core Module | Focus |\n` +
        `| 10:30 - 11:30 | Daily Standup & Sync งานกับทีม Product | Sync |\n` +
        `| 13:30 - 15:30 | พัฒนาระบบ Search Indexing & Caching | Dev |\n` +
        `| 16:00 - 17:00 | เคลียร์กล่องข้อความ และวางแผนสำหรับวันพรุ่งนี้ | Admin |\n\n` +
        `## 📋 กิจวัตรและเช็กลิสต์ประจำวัน (Daily Checklist)\n` +
        `- [x] ดื่มน้ำ 1 แก้วใหญ่หลังตื่นนอน และยืดเหยียดร่างกาย 10 นาที\n` +
        `- [x] ตรวจสอบปฏิทินนัดหมายและเตรียมประเด็นสำหรับการประชุม\n` +
        `- [ ] ปิดแจ้งเตือนแอปข้อความขณะทำงานแบบ Focus Block\n` +
        `- [ ] บันทึกสิ่งที่ได้เรียนรู้และสรุปความคืบหน้าก่อนเลิกงาน\n\n` +
        `## 🌟 เรื่องที่รู้สึกขอบคุณ & บันทึกข้อคิด (Gratitude & Notes)\n` +
        `- ขอบคุณทีมงานที่ช่วยแก้ปัญหา Deployment ได้อย่างรวดเร็วและเป็นมืออาชีพ\n` +
        `- ได้เรียนรู้ว่าการเขียน Type Definition ที่ครอบคลุมตั้งแต่แรก ช่วยประหยัดเวลาแก้ไขบั๊กได้มหาศาล\n\n` +
        `#daily #journal #focus `
      );
    } else {
      rawMarkdown = (
        `# Daily Journal - ${dateStr}\n\n` +
        `> 💡 "Clarity of purpose at dawn prevents regret at twilight. Focus on the essential few." — **Daily Mindset**\n\n` +
        `## 🎯 Top 3 Priorities for Today\n` +
        `1. **Core Architecture Review:** Review and approve the document caching refactor PR\n` +
        `2. **Schema Design:** Finalize table definitions and vector index layout for search\n` +
        `3. **Sprint Wrap-up:** Publish sprint velocity metrics and deliverables summary\n\n` +
        `## ⏰ Time-blocking Schedule\n` +
        `| Time Window | Focus Activity | Category |\n` +
        `| :--- | :--- | :---: |\n` +
        `| 09:00 - 10:30 | Deep Work: Core Module Refactor & Unit Tests | Focus |\n` +
        `| 10:30 - 11:30 | Engineering Standup & Cross-team Sync | Sync |\n` +
        `| 13:30 - 15:30 | Search Indexing Engine Implementation | Dev |\n` +
        `| 16:00 - 17:00 | Inbox Zero & Daily Debrief | Admin |\n\n` +
        `## 📋 Daily Habits & Tasks\n` +
        `- [x] Morning hydration (500ml) & light physical stretch\n` +
        `- [x] Review daily schedule & identify MIT (Most Important Task)\n` +
        `- [ ] Keep notification mute active during deep focus blocks\n` +
        `- [ ] Log end-of-day reflections and plan tomorrow's docket\n\n` +
        `## 🌟 Highlights & Gratitude\n` +
        `- Grateful for the seamless staging deployment executed with the team this morning.\n` +
        `- Key takeaway: Upfront investment into airtight type contracts eliminates dozens of downstream bugs.\n\n` +
        `#daily #journal #focus `
      );
    }
  } else if (templateType === "project") {
    if (isTh) {
      rawMarkdown = (
        `# วางแผนโปรเจกต์ - ระบบคลังเอกสารอัจฉริยะ\n\n` +
        `> 🚀 **วิสัยทัศน์โครงการ:** พัฒนาพื้นที่จัดเก็บและสืบค้นความรู้อัจฉริยะ (Local-first Knowledge Workspace) ที่ทำงานได้อย่างสมบูรณ์แบบแม้ออฟไลน์ ปลอดภัย และรวดเร็วระดับ Sub-second\n\n` +
        `## 🎯 วัตถุประสงค์หลักของโครงการ (Core Objectives)\n` +
        `1. **สถาปัตยกรรมแบบ Local-first:** บันทึกข้อมูลลงดิสก์เครื่องผู้ใช้ทันที พร้อมระบบเข้ารหัส AES-256\n` +
        `2. **การสืบค้นข้อมูลความเร็วสูง:** รองรับ Full-text Search และ Semantic Search ในเอกสารกว่า 100,000 ฉบับ\n` +
        `3. **ความต่อเนื่องของการทำงาน:** ระบบตรวจจับการชนกันของข้อมูล (Conflict-free Sync) เมื่อเชื่อมต่ออินเทอร์เน็ต\n\n` +
        `## 📅 แผนการดำเนินงานและกำหนดส่ง (Milestones & Timeline)\n` +
        `| ระยะที่ | เป้าหมายส่งมอบ (Milestone) | ผู้รับผิดชอบ | กำหนดส่ง | สถานะ |\n` +
        `| :---: | :--- | :--- | :---: | :---: |\n` +
        `| 1 | สถาปัตยกรรมระบบและกำหนด API Contract | Lead Architect | 15 ต.ค. | เสร็จสมบูรณ์ |\n` +
        `| 2 | พัฒนา TipTap Core Editor & Custom Views | Frontend Team | 30 ต.ค. | กำลังทำ |\n` +
        `| 3 | ทดสอบประสิทธิภาพการโหลดและ Pen-test | QA / Security | 15 พ.ย. | รอดำเนินการ |\n` +
        `| 4 | ปล่อยเวอร์ชัน Production & อบรมผู้ใช้ | Release Team | 30 พ.ย. | รอดำเนินการ |\n\n` +
        `## 📦 รายการส่งมอบและเช็กลิสต์ความพร้อม (Deliverables Checklist)\n` +
        `- [x] เอกสาร System Architecture RFC ได้รับการอนุมัติ\n` +
        `- [x] ตรวจสอบความถูกต้องของ Type Definitions ทั้งหมดในโปรเจกต์\n` +
        `- [ ] ทดสอบความเข้ากันได้บนระบบปฏิบัติการ Windows, macOS และ Linux\n` +
        `- [ ] จัดทำคู่มือ Getting Started Guide พร้อมตัวอย่างโค้ด\n\n` +
        `#project #planning #roadmap `
      );
    } else {
      rawMarkdown = (
        `# Project Planning - Intelligent Knowledge Workspace\n\n` +
        `> 🚀 **Vision:** Build a high-performance, local-first document and knowledge platform engineered for modern engineering teams with sub-second responsiveness and military-grade encryption.\n\n` +
        `## 🎯 Core Objectives\n` +
        `1. **Local-first Foundation:** Zero-latency writes to local storage with automated AES-GCM-256 encryption\n` +
        `2. **Instant Search Engine:** Sub-second full-text and semantic retrieval across 100,000+ documents\n` +
        `3. **Conflict-Free Replication:** Seamless peer-to-peer sync with automated CRDT merge resolution\n\n` +
        `## 📅 Milestones & Timeline\n` +
        `| Phase | Milestone Deliverable | Owner | Target Date | Status |\n` +
        `| :---: | :--- | :--- | :---: | :---: |\n` +
        `| 1 | Architecture RFC & API Contract Specifications | Lead Architect | Oct 15 | Completed |\n` +
        `| 2 | Core TipTap Editor & Custom Block NodeViews | Frontend Team | Oct 30 | In Progress |\n` +
        `| 3 | Load Benchmarks & Penetration Audit | QA / Security | Nov 15 | Pending |\n` +
        `| 4 | Production Cutover & Team Onboarding | Release Team | Nov 30 | Pending |\n\n` +
        `## 📦 Deliverables Checklist\n` +
        `- [x] Architecture RFC approved by leadership\n` +
        `- [x] Full TypeScript strict mode compliance across all modules\n` +
        `- [ ] Cross-platform validation across Windows, macOS, and Linux\n` +
        `- [ ] Comprehensive developer guide and API documentation published\n\n` +
        `#project #planning #roadmap `
      );
    }
  } else if (templateType === "todo") {
    if (isTh) {
      rawMarkdown = (
        `# รายการงานที่ต้องทำ - ${dateStr}\n\n` +
        `> ⚡ **หลักการทำงาน:** ทำงานที่ยากและสำคัญที่สุดให้เสร็จเป็นอันดับแรก (Eat That Frog) เพื่อสร้างแรงผลักดันตลอดทั้งวัน\n\n` +
        `## 🔥 งานด่วนและสำคัญมาก (High Priority Tasks)\n` +
        `- [x] ตรวจสอบ Canvas Memory Profiler เพื่อแก้ปัญหา Buffer ล้น\n` +
        `- [ ] เขียน Unit Test ครอบคลุมการส่งออกไฟล์ขนาดใหญ่\n` +
        `- [ ] ส่ง Patch แก้ไขบั๊กขึ้น Staging Environment\n\n` +
        `## 📌 งานสำคัญทั่วไป (Medium Priority Tasks)\n` +
        `- [x] เพิ่มคำแปลภาษาสำหรับ Version History Diff\n` +
        `- [ ] ปรับปรุงการแสดงผล Badge แท็กในหน้าต่างเทมเพลต\n` +
        `- [ ] ทดสอบปุ่มสลับธีม Dark/Light บนจอภาพความละเอียดสูง\n\n` +
        `## 📥 งานรอจัดสรรเวลา (Backlog & Someday)\n` +
        `- [ ] ศึกษาฟีเจอร์ Multi-tab Drag and Drop\n` +
        `- [ ] ออกแบบชุดธีมสี Pastel สำหรับโหมดอ่านหนังสือ\n\n` +
        `## 💡 กฎ 3 ข้อสำหรับการทำงานให้มีประสิทธิภาพ (Rules of Execution)\n` +
        `1. **Timebox 25 นาที:** โฟกัสกับงานเดียวโดยไม่สลับหน้าจอ (Pomodoro Technique)\n` +
        `2. **ทดสอบก่อนส่ง:** ทุกการแก้บั๊กต้องมีชุดทดสอบรองรับเสมอ\n` +
        `3. **สรุปความคืบหน้า:** บันทึกสถานะงานลงในบอร์ดก่อนปิดการทำงานแต่ละวัน\n\n` +
        `#todo #tasks #productivity `
      );
    } else {
      rawMarkdown = (
        `# Task & To-Do List - ${dateStr}\n\n` +
        `> ⚡ **Execution Rule:** "Eat that frog first thing in the morning." Tackle the most demanding priority before answering reactive communications.\n\n` +
        `## 🔥 High Priority Tasks\n` +
        `- [x] Trace canvas buffer allocation in heap profiler\n` +
        `- [ ] Write stress tests for concurrent batch document conversions\n` +
        `- [ ] Promote memory patch to staging environment\n\n` +
        `## 📌 Medium Priority Tasks\n` +
        `- [x] Add localized translation strings for version history diff\n` +
        `- [ ] Refine tag badge rendering inside template browser\n` +
        `- [ ] Verify dark/light theme contrast ratios on high-DPI displays\n\n` +
        `## 📥 Backlog & Someday Tasks\n` +
        `- [ ] Explore tab drag-and-drop reordering with tab grouping\n` +
        `- [ ] Create pastel reading themes with low contrast for night work\n\n` +
        `## 💡 3 Rules of Execution\n` +
        `1. **25-Minute Focus Blocks:** Single-task without context switching (Pomodoro method)\n` +
        `2. **Test Before Commit:** Every bug fix must include an automated regression test\n` +
        `3. **Daily Closeout:** Sync board statuses and outline tomorrow's top docket before logging off\n\n` +
        `#todo #tasks #productivity `
      );
    }
  } else if (templateType === "study") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกการเรียนรู้ - สถาปัตยกรรมกระจายศูนย์และขั้นตอนวิธี Raft\n\n` +
        `> 🔬 **คำถามวิจัยหลัก:** ทำไมขั้นตอนวิธี Raft จึงได้รับการยอมรับและนำมาใช้งานจริงอย่างแพร่หลายแทนที่ Paxos ในระบบคลาวด์ยุคใหม่?\n\n` +
        `## 📌 ข้อมูลและแหล่งอ้างอิง (Topic Overview)\n` +
        `| หมวดหมู่ | ข้อมูล |\n` +
        `| :--- | :--- |\n` +
        `| **วิชา / หัวข้อ** | Distributed Consensus & State Machine Replication |\n` +
        `| **ผู้สอน / สถาบัน** | MIT 6.824: Distributed Systems (Prof. Robert Morris) |\n` +
        `| **เอกสารอ้างอิง** | In Search of an Understandable Consensus Algorithm (Ongaro & Ousterhout) |\n` +
        `| **วันที่บันทึก** | ${dateStr} |\n\n` +
        `## 💡 ข้อสรุป 3 ประเด็นหลัก (Core Findings)\n` +
        `1. **การแยกปัญหาย่อย (Decomposition):** Raft แบ่งขั้นตอนวิธีออกเป็น Leader Election, Log Replication และ Safety ทำให้ตรวจสอบและทำความเข้าใจได้ง่ายกว่า Paxos\n` +
        `2. **สิทธิ์เด็ดขาดของผู้นำ (Strong Leader):** คำสั่งทั้งหมดต้องผ่าน Leader เท่านั้น ทำให้ Log ไหลไปในทิศทางเดียวจาก Leader ไปยัง Follower เสมอ\n` +
        `3. **ความปลอดภัยของระบบ (Safety Invariant):** ข้อมูลคำสั่งที่ผ่านการ Commit แล้วจะไม่มีวันสูญหายหรือถูกเขียนทับ แม้จะมีการสลับ Leader ใหม่ก็ตาม\n\n` +
        `## ⚖️ ตารางเปรียบเทียบ Raft vs Multi-Paxos\n` +
        `| คุณสมบัติ | Raft | Multi-Paxos |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **ความซับซ้อนในการเข้าใจ** | ต่ำ (ออกแบบมาเพื่อให้เข้าใจง่าย) | สูงมาก (ทฤษฎีซับซ้อนและช่องว่างการตีความเยอะ) |\n` +
        `| **บทบาทของผู้นำ (Leader)** | ผู้นำเดี่ยวมีอำนาจสมบูรณ์ (Strong Leader) | มี Weak Leader หรือสลับบทบาทได้ |\n` +
        `| **การจัดการ Log Holes** | ไม่อนุญาตให้มีช่องว่างใน Log | มี Log Holes และต้องมีกลไกตามอุด |\n` +
        `| **การนำไปใช้งานจริง** | etcd (Kubernetes), Consul, TiKV, MongoDB | Chubby (Google), Apache ZooKeeper (Zab) |\n\n` +
        `## 💻 ตัวอย่างโค้ดจำลองโครงสร้าง RPC ของ Raft\n` +
        `\`\`\`typescript\n` +
        `interface AppendEntriesArgs {\n` +
        `  term: number;         // รอบการเลือกตั้งของ Leader\n` +
        `  leaderId: string;     // รหัสประจำตัวของ Leader\n` +
        `  prevLogIndex: number; // ตำแหน่งดัชนีของ Log ก่อนหน้า\n` +
        `  prevLogTerm: number;  // Term ของ Log ก่อนหน้า\n` +
        `  entries: LogEntry[];  // รายการคำสั่งใหม่ที่ส่งมาบันทึก\n` +
        `  leaderCommit: number; // ดัชนีที่ Leader ทำการ Commit แล้ว\n` +
        `}\n` +
        `\n` +
        `interface AppendEntriesReply {\n` +
        `  term: number;         // Term ปัจจุบันของ Follower\n` +
        `  success: boolean;     // คืนค่า true หาก Follower มี Log ตรงกัน\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## 🎯 ประเด็นที่ต้องศึกษาเพิ่มเติม (Next Steps)\n` +
        `- [x] ศึกษาการทำงานของ Randomized Election Timeout ในการป้องกัน Split Vote\n` +
        `- [ ] ทำความเข้าใจกลไก Log Compaction ด้วย Snapshotting เพื่อลดขนาดดิสก์\n` +
        `- [ ] เขียนโปรแกรมจำลอง Raft Cluster ขนาด 3 โหนดด้วย Node.js\n\n` +
        `#study #research #notes `
      );
    } else {
      rawMarkdown = (
        `# Study & Research Notes - Distributed Consensus & Raft\n\n` +
        `> 🔬 **Core Research Question:** Why has the Raft consensus algorithm displaced Multi-Paxos as the standard foundation in modern cloud infrastructure?\n\n` +
        `## 📌 Overview & Source Metadata\n` +
        `| Category | Details |\n` +
        `| :--- | :--- |\n` +
        `| **Course / Subject** | Distributed Consensus & Fault-tolerant State Machines |\n` +
        `| **Instructor / University** | MIT 6.824: Distributed Systems (Prof. Robert Morris) |\n` +
        `| **Primary Paper** | In Search of an Understandable Consensus Algorithm (Ongaro & Ousterhout) |\n` +
        `| **Date Recorded** | ${dateStr} |\n\n` +
        `## 💡 Core Takeaways\n` +
        `1. **Problem Decomposition:** Raft separates consensus into explicit sub-problems: Leader Election, Log Replication, and Safety guarantees\n` +
        `2. **Strong Leader Model:** Log entries flow strictly unidirectional from the elected Leader down to Followers\n` +
        `3. **State Safety Invariant:** Once an entry is committed by a quorum, it is guaranteed to persist across all subsequent terms\n\n` +
        `## ⚖️ Comparative Architecture: Raft vs Multi-Paxos\n` +
        `| Dimension | Raft Protocol | Multi-Paxos |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **Understandability** | High (Engineered specifically for clarity) | Very Low (Notorious conceptual hurdles) |\n` +
        `| **Leader Role** | Strong, authoritative Leader | Weak or symmetric proposers |\n` +
        `| **Log Holes** | Strictly disallowed (Sequential contiguous entries) | Allows log holes requiring explicit fill rounds |\n` +
        `| **Production Adopters** | etcd (Kubernetes), Consul, TiKV, MongoDB | Chubby (Google), Apache ZooKeeper (Zab) |\n\n` +
        `## 💻 Raft RPC Interface Representation\n` +
        `\`\`\`typescript\n` +
        `interface AppendEntriesArgs {\n` +
        `  term: number;         // Current leader term\n` +
        `  leaderId: string;     // Leader identifier\n` +
        `  prevLogIndex: number; // Index of entry immediately preceding new ones\n` +
        `  prevLogTerm: number;  // Term of prevLogIndex entry\n` +
        `  entries: LogEntry[];  // Log entries to store (empty for heartbeat)\n` +
        `  leaderCommit: number; // Leader's commitIndex\n` +
        `}\n` +
        `\n` +
        `interface AppendEntriesReply {\n` +
        `  term: number;         // CurrentTerm, for leader to update itself\n` +
        `  success: boolean;     // True if follower contained entry matching prevLogIndex and prevLogTerm\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## 🎯 Follow-up Exploration Checklist\n` +
        `- [x] Analyze randomized election timeout mechanics to avoid split-vote stalls\n` +
        `- [ ] Deep-dive into log compaction via state snapshotting\n` +
        `- [ ] Build a minimal 3-node in-memory cluster simulator in TypeScript\n\n` +
        `#study #research #notes `
      );
    }
  } else if (templateType === "bug") {
    if (isTh) {
      rawMarkdown = (
        `# รายงานปัญหา / บั๊ก - ปัญหาหน่วยความจำรั่วไหลในกระบวนการแปลงไฟล์ PDF\n\n` +
        `> ⚠️ **คำเตือนผลกระทบ:** บั๊กนี้ทำให้ Node.js process หยุดทำงาน (Crash) ทันทีเมื่อผู้ใช้ส่งออกเอกสารมากกว่า 5 ไฟล์พร้อมกัน ส่งผลต่อระบบ Production ในระดับสูง\n\n` +
        `## 📋 ข้อมูลสรุปของปัญหา (Issue Overview)\n` +
        `| ข้อมูล | รายละเอียด |\n` +
        `| :--- | :--- |\n` +
        `| **ระดับความรุนแรง** | Critical / P1 |\n` +
        `| **สถานะปัจจุบัน** | กำลังแก้ไข (In Progress) |\n` +
        `| **สภาพแวดล้อมที่พบ** | Production & Staging (Node.js v20.x, Windows / Linux) |\n` +
        `| **ผู้รายงาน** | ทีมทดสอบระบบ (QA Team) |\n` +
        `| **วันที่พบปัญหา** | ${dateStr} |\n\n` +
        `## 🔁 ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)\n` +
        `1. เปิดหน้าต่างคลังเอกสารและเลือกโน้ตที่มีภาพประกอบความละเอียดสูงจำนวน 6 ฉบับขึ้นไป\n` +
        `2. คลิกขวาแล้วเลือกคำสั่ง **"ส่งออกเป็น PDF (Batch Export)"**\n` +
        `3. ตรวจสอบการใช้หน่วยความจำผ่าน Performance Profiler จะพบว่า Heap Memory เพิ่มขึ้นต่อเนื่องจนเกิน \`2GB\` และเกิดข้อผิดพลาด OOM\n\n` +
        `## 💥 ข้อผิดพลาดที่บันทึกได้ (Error Stack Trace)\n` +
        `\`\`\`bash\n` +
        `<--- Last few GCs --->\n` +
        `[21808:0x158008000]  45210 ms: Mark-sweep 2046.8 (2055.1) -> 2045.2 (2055.1) MB, 1420.5 / 0.0 ms\n` +
        `\n` +
        `<--- JS stacktrace --->\n` +
        `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n` +
        `1: 0x10007d375 node::OOMErrorHandler(char const*, bool)\n` +
        `2: 0x1001b2c4e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool)\n` +
        `\`\`\`\n\n` +
        `## 🎯 ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง\n` +
        `- **ผลลัพธ์ที่คาดหวัง:** ไฟล์ควรถูกประมวลผลแบบสตรีมทีละไฟล์ โดยควบคุมการใช้หน่วยความจำไม่ให้เกิน \`250MB\`\n` +
        `- **ผลลัพธ์ที่เกิดขึ้นจริง:** กระบวนการเรนเดอร์ Canvas โหลดข้อมูลทุกภาพเข้า Buffer พร้อมกันโดยไม่ได้เรียก \`dispose()\` ส่งผลให้ Memory รั่วไหล\n\n` +
        `## ✅ แนวทางการแก้ไขและเช็กลิสต์ (Proposed Fix & Action Items)\n` +
        `- [x] ตรวจพบจุดที่หน่วยความจำค้างในโมดูล \`pdfExportWorker.ts\`\n` +
        `- [ ] ปรับกระบวนการทำงานให้เป็น Queue Worker โดยจำกัดการทำงานพร้อมกันไม่เกิน 2 ไฟล์\n` +
        `- [ ] เรียกใช้ \`context.cleanup()\` และเคลียร์ Blob Object URLs ทันทีหลังแปลงหน้าเสร็จ\n` +
        `- [ ] เขียน Integration Test เพื่อจำลองการส่งออกเอกสาร 20 ฉบับติดต่อกัน\n\n` +
        `#bug #issue #debugging `
      );
    } else {
      rawMarkdown = (
        `# Bug & Issue Report - Memory Leak in Batch PDF Export Processing\n\n` +
        `> ⚠️ **Impact Warning:** Process crashes ungracefully due to Node.js OOM when exporting more than 5 notes with heavy inline assets concurrently.\n\n` +
        `## 📋 Issue Overview\n` +
        `| Attribute | Value |\n` +
        `| :--- | :--- |\n` +
        `| **Severity** | Critical / P1 |\n` +
        `| **Status** | In Progress |\n` +
        `| **Environment** | Production & Staging (Node.js v20.x, Windows / Linux) |\n` +
        `| **Reporter** | QA Performance Benchmarking Team |\n` +
        `| **Reported Date** | ${dateStr} |\n\n` +
        `## 🔁 Steps to Reproduce\n` +
        `1. Open workspace and select 6 or more notes containing embedded high-resolution graphics\n` +
        `2. Trigger **"Export as PDF (Batch)"** from the batch actions toolbar\n` +
        `3. Observe rapid monotonic heap allocation growth in profiler until process termination at \`2.1GB\`\n\n` +
        `## 💥 Captured Stack Trace\n` +
        `\`\`\`bash\n` +
        `<--- Last few GCs --->\n` +
        `[21808:0x158008000]  45210 ms: Mark-sweep 2046.8 (2055.1) -> 2045.2 (2055.1) MB, 1420.5 / 0.0 ms\n` +
        `\n` +
        `<--- JS stacktrace --->\n` +
        `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n` +
        `1: 0x10007d375 node::OOMErrorHandler(char const*, bool)\n` +
        `2: 0x1001b2c4e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool)\n` +
        `\`\`\`\n\n` +
        `## 🎯 Expected vs Actual Behavior\n` +
        `- **Expected:** Sequential batch queue processing with bounded heap ceiling under \`250MB\`\n` +
        `- **Actual:** Concurrent canvas allocations retain unreleased buffer handles across iterations\n\n` +
        `## ✅ Proposed Fix & Action Items\n` +
        `- [x] Locate uncollected canvas buffer references in \`pdfExportWorker.ts\`\n` +
        `- [ ] Implement rate-limited queue worker (concurrency limit: 2)\n` +
        `- [ ] Invoke explicit \`context.cleanup()\` and revoke created Blob URLs after page render\n` +
        `- [ ] Add stress regression test asserting memory stays bounded over 20 exports\n\n` +
        `#bug #issue #debugging `
      );
    }
  } else if (templateType === "weekly-review") {
    if (isTh) {
      rawMarkdown = (
        `# สรุปประจำสัปดาห์ (Weekly Review) - ${dateStr}\n\n` +
        `> 📊 **ภาพรวมสัปดาห์นี้:** ปิดรอบสปรินต์ได้ตามเป้าหมาย 85% ประสิทธิภาพของ Editor เร็วขึ้นอย่างมีนัยสำคัญ แต่ต้องเพิ่มความระมัดระวังเรื่องการจัดการ State บนหลายอุปกรณ์\n\n` +
        `## 🏆 ผลงานและความสำเร็จในสัปดาห์นี้ (Wins & Highlights)\n` +
        `- ปล่อยฟีเจอร์ Editor Toolbar v2.4 ตรงตามกำหนดการ พร้อมรับคำชมจากผู้ใช้กลุ่มเบต้า\n` +
        `- ประสิทธิภาพการเปิดเอกสารเร็วขึ้น \`40%\` ด้วยการย้ายกระบวนการคำนวณเข้าสู่ Web Worker\n` +
        `- อัปเดตและปรับปรุงดีไซน์เทมเพลตใหม่ให้ใช้งานได้จริงครบทั้ง 14 หมวดหมู่\n\n` +
        `## 📈 ทบทวนตัวชี้วัดและเป้าหมาย (Goal Review & Metrics)\n` +
        `| ตัวชี้วัดสำคัญ (Key Metric) | เป้าหมายที่ตั้งไว้ | ผลลัพธ์จริง | สถานะการประเมิน |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| เวลาในการเปิดเอกสาร (Load Latency) | < 120ms | 85ms | 🟢 ดีกว่าเป้าหมาย |\n` +
        `| ความครอบคลุมของการทดสอบ (Unit Test Coverage) | > 85% | 88.5% | 🟢 บรรลุเป้าหมาย |\n` +
        `| รายการบั๊กรอการแก้ไข (Pending P1/P2 Bugs) | 0 รายการ | 1 รายการ | 🟡 ต้องแก้ไขเร่งด่วน |\n` +
        `| การจัดส่งฟีเจอร์ตามสปรินต์ | 100% | 85% | 🟡 เลื่อน 1 ฟีเจอร์ย่อย |\n\n` +
        `## 🧠 บทเรียนและข้อคิดสำคัญ (Lessons & Insights)\n` +
        `- การออกแบบ State Synchronization ให้เป็น Finite State Machine ชัดเจน ช่วยป้องกันปัญหา Race Condition ได้ดีกว่าการใช้ธงสถานะแยกย่อย\n` +
        `- การรับฟังข้อเสนอแนะจากผู้ใช้จริงช่วยให้เห็นจุดบกพร่องที่ทีมมองข้ามได้อย่างรวดเร็ว\n\n` +
        `## 🎯 3 อันดับเป้าหมายสำคัญสำหรับสัปดาห์หน้า (Top 3 Priorities for Next Week)\n` +
        `1. **ติดตั้งระบบสำรองข้อมูลอัตโนมัติ (Auto-backup):** เชื่อมต่อระบบแบ็กอัปเข้ารหัสลงดิสก์และคลาวด์แบบ Background Sync\n` +
        `2. **จัดทำคู่มือเริ่มต้นใช้งาน (Getting Started Guide):** เขียนคำแนะนำแบบ Interactive Walkthrough สำหรับผู้ใช้งานใหม่\n` +
        `3. **ปรับปรุงประสิทธิภาพ Preview Container:** ปรับโครงสร้างสถาปัตยกรรมเพื่อลดการเรนเดอร์ซ้ำซ้อน\n\n` +
        `## 📋 เช็กลิสต์การเตรียมตัวสำหรับสัปดาห์หน้า (Weekly Reset Checklist)\n` +
        `- [x] เคลียร์กล่องข้อความและอีเมลที่ยังค้างตอบ\n` +
        `- [x] ตรวจสอบปฏิทินนัดหมายและจัดสรรเวลาสำหรับงานสำคัญ (Focus Blocks)\n` +
        `- [ ] จัดระเบียบโฟลเดอร์เอกสารและลบไฟล์ชั่วคราวที่ไม่จำเป็น\n` +
        `- [ ] สำรองข้อมูลฐานข้อมูลประจำสัปดาห์\n\n` +
        `#weekly #review #productivity `
      );
    } else {
      rawMarkdown = (
        `# Weekly Review - ${dateStr}\n\n` +
        `> 📊 **Weekly Debrief:** Sprint velocity achieved 85% of forecast. Core editor responsiveness improved markedly, though multi-device replication needs tighter state machine safeguards.\n\n` +
        `## 🏆 Wins & Highlights\n` +
        `- Shipped Editor Toolbar v2.4 milestone ahead of schedule with enthusiastic beta user feedback\n` +
        `- Slashed initial document load latency by \`40%\` by offloading parsing pipelines to Web Workers\n` +
        `- Completed full refresh of 14 production note templates with realistic, rich markdown datasets\n\n` +
        `## 📈 Key Metrics & Goals Review\n` +
        `| Performance KPI | Target Goal | Actual Result | Evaluation Status |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| Initial Load Latency | < 120ms | 85ms | 🟢 Exceeded Target |\n` +
        `| Automated Test Coverage | > 85% | 88.5% | 🟢 Target Met |\n` +
        `| Open P1/P2 Regression Bugs | 0 defects | 1 defect | 🟡 Needs Urgent Patch |\n` +
        `| Sprint Feature Delivery | 100% | 85% | 🟡 Minor Stretch Carried |\n\n` +
        `## 🧠 Lessons & Strategic Insights\n` +
        `- Formally modeling state transitions as deterministic finite state machines eliminates race conditions much earlier than dispersed boolean flags.\n` +
        `- Regular user feedback sessions pinpoint edge cases that automated suites inherently miss.\n\n` +
        `## 🎯 Top 3 Priorities for Next Week (The Big 3)\n` +
        `1. **Background Backup Pipeline:** Implement encrypted local and cloud sync backups\n` +
        `2. **Interactive Onboarding Walkthrough:** Publish guided tutorials for new workspace users\n` +
        `3. **Preview Container Optimization:** Refactor layout rendering tree to prevent layout shifts\n\n` +
        `## 📋 Weekly Reset & Preparation Checklist\n` +
        `- [x] Inbox zero across communication channels & pending PRs\n` +
        `- [x] Calendar audit and dedicated deep-work schedule block reservations\n` +
        `- [ ] Workspace folder tidy-up and archival of completed project notes\n` +
        `- [ ] Complete weekly encrypted backup verification\n\n` +
        `#weekly #review #productivity `
      );
    }
  } else if (templateType === "book-notes") {
    if (isTh) {
      rawMarkdown = (
        `# สรุปหนังสือ: Atomic Habits (เพราะชีวิตดีได้กว่าที่เป็น)\n\n` +
        `> 📖 **แก่นสำคัญของเล่ม:** "คุณไม่ได้ก้าวหน้าไปตามระดับของเป้าหมายที่คุณตั้งไว้ แต่คุณตกลงมาอยู่ที่ระดับของระบบที่คุณสร้างขึ้นมาต่างหาก" — **James Clear**\n\n` +
        `## 📚 ข้อมูลหนังสือ (Book Metadata)\n` +
        `| ข้อมูล | รายละเอียด |\n` +
        `| :--- | :--- |\n` +
        `| **ชื่อหนังสือ** | Atomic Habits: Tiny Changes, Remarkable Results |\n` +
        `| **ผู้เขียน** | James Clear |\n` +
        `| **คะแนนประเมิน** | ⭐⭐⭐⭐⭐ (5/5) |\n` +
        `| **หมวดหมู่** | พัฒนาตนเอง / จิตวิทยาพฤติกรรม |\n` +
        `| **วันที่อ่านจบ** | ${dateStr} |\n\n` +
        `## 💡 สาระสำคัญและแนวคิดหลัก (Key Takeaways & Core Concepts)\n` +
        `1. การเปลี่ยนแปลงที่ยิ่งใหญ่ในชีวิตไม่ได้เกิดจากการกระทำครั้งใหญ่เพียงครั้งเดียว แต่เกิดจากการสะสมของการพัฒนาเล็กๆ วันละ \`1%\` อย่างต่อเนื่อง\n` +
        `2. การสร้างนิสัยที่ดีอย่างยั่งยืนไม่ได้พึ่งพาพลังใจ (Willpower) แต่ขึ้นอยู่กับการออกแบบสภาพแวดล้อมและระบบที่ลดแรงต้านทานในการลงมือทำ\n` +
        `3. การเปลี่ยนนิสัยที่ทรงพลังที่สุดคือการเปลี่ยนที่ระดับตัวตน (Identity-based Habits) โดยเริ่มจากการถามตัวเองว่า "คนแบบที่เราอยากเป็นจะตัดสินใจอย่างไร?"\n\n` +
        `## ⚙️ กฎ 4 ข้อของการสร้างและทำลายนิสัย (The 4 Laws of Behavior Change)\n` +
        `| กฎ (The Laws) | วิธีสร้างนิสัยที่ดี (How to Create) | วิธีทำลายนิสัยที่ไม่ดี (How to Break) |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **กฎข้อที่ 1: สัญญาณ (Cue)** | ทำให้เห็นชัดเจน (Make it obvious) | ทำให้มองไม่เห็น (Make it invisible) |\n` +
        `| **กฎข้อที่ 2: ความอยาก (Craving)** | ทำให้น่าดึงดูดใจ (Make it attractive) | ทำให้น่าเบื่อหรือไม่น่าสนใจ (Make it unattractive) |\n` +
        `| **กฎข้อที่ 3: การตอบสนอง (Response)** | ทำให้ง่ายและสะดวก (Make it easy) | ทำให้ยากและมีอุปสรรค (Make it difficult) |\n` +
        `| **กฎข้อที่ 4: รางวัล (Reward)** | ทำให้เกิดความพึงพอใจทันที (Make it satisfying) | ทำให้เกิดผลเสียทันที (Make it unsatisfying) |\n\n` +
        `## 🚀 แผนการนำไปลงมือทำจริง (Actionable Implementation Steps)\n` +
        `- [x] จัดเตรียมหนังสือน่าอ่านไว้บนโต๊ะทำงานก่อนเข้านอนทุกคืน (Make it obvious)\n` +
        `- [x] ใช้กฎ 2 นาที: อ่านหนังสือวันละ 2 หน้าทันทีหลังนั่งลงที่โต๊ะทำงาน (Make it easy)\n` +
        `- [ ] กำหนด Habit Stacking: "หลังชงกาแฟตอนเช้าเสร็จ ฉันจะเขียนบันทึก 1 ย่อหน้าทันที"\n` +
        `- [ ] นำมือถือไปวางไว้นอกห้องนอนตอน 22:00 น. เพื่อหลีกเลี่ยงการไถจอดึก (Make it invisible)\n\n` +
        `#book #reading #notes `
      );
    } else {
      rawMarkdown = (
        `# Book Notes: Atomic Habits by James Clear\n\n` +
        `> 📖 **Favorite Quotes & Core Thesis:** "You do not rise to the level of your goals. You fall to the level of your systems." — **James Clear**\n\n` +
        `## 📚 Book Metadata\n` +
        `| Attribute | Details |\n` +
        `| :--- | :--- |\n` +
        `| **Title** | Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones |\n` +
        `| **Author** | James Clear |\n` +
        `| **Rating** | ⭐⭐⭐⭐⭐ (5/5) |\n` +
        `| **Genre** | Behavioral Psychology / Self-Improvement |\n` +
        `| **Date Finished** | ${dateStr} |\n\n` +
        `## 💡 Key Takeaways & Core Concepts\n` +
        `1. Groundbreaking transformations stem not from monumental singular feats, but from compounding small \`1%\` improvements enacted consistently every single day.\n` +
        `2. Sustainable behavioral change depends far less on raw willpower and far more on intentionally architecting low-friction environments.\n` +
        `3. The most profound shifts take root at the identity level by asking: "Who is the type of person that achieves the outcome I desire?"\n\n` +
        `## ⚙️ The 4 Laws of Behavior Change\n` +
        `| Stage of Habit | To Build a Good Habit | To Break a Bad Habit |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **1. Cue** | Make it obvious | Make it invisible |\n` +
        `| **2. Craving** | Make it attractive | Make it unattractive |\n` +
        `| **3. Response** | Make it easy | Make it difficult |\n` +
        `| **4. Reward** | Make it satisfying | Make it unsatisfying |\n\n` +
        `## 🚀 Actionable Implementation Steps\n` +
        `- [x] Place notebook and reading material prominently beside workstation every evening (Make it obvious)\n` +
        `- [x] Apply Two-Minute Rule: Read 2 pages immediately after morning coffee (Make it easy)\n` +
        `- [ ] Habit Stacking: "After closing my laptop for the day, I will immediately slip on running shoes"\n` +
        `- [ ] Place mobile charger in another room past 10 PM to eliminate late-night scrolling (Make it invisible)\n\n` +
        `#book #reading #notes `
      );
    }
  } else if (templateType === "cornell-notes") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกการเรียนแบบคอร์เนลล์: สถาปัตยกรรมคอมพิวเตอร์และระบบหน่วยความจำ\n\n` +
        `> 📐 **Average Memory Access Time (AMAT):**\n` +
        `> $\\text{AMAT} = \\text{Hit Time} + (\\text{Miss Rate} \\times \\text{Miss Penalty})$\n\n` +
        `## 📋 ข้อมูลการบรรยาย (Lecture Details)\n` +
        `| ข้อมูล | รายละเอียด |\n` +
        `| :--- | :--- |\n` +
        `| **วิชา / รหัสวิชา** | Computer Science 61C: Great Ideas in Computer Architecture |\n` +
        `| **หัวข้อการบรรยาย** | Memory Hierarchy, Caching Principles, and Locality |\n` +
        `| **ผู้บรรยาย / สถาบัน** | UC Berkeley / MIT OpenCourseWare |\n` +
        `| **วันที่บันทึก** | ${dateStr} |\n\n` +
        `## 🗄️ ตารางเปรียบเทียบลำดับชั้นหน่วยความจำ (Memory Hierarchy)\n` +
        `| ลำดับชั้น | ความจุโดยประมาณ | เวลาในการเข้าถึง (Latency) | เทคโนโลยีฮาร์ดแวร์ |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| **Registers** | < 1 KB | 0.25 - 0.5 ns | CPU Register File |\n` +
        `| **L1 Cache** | 32 - 64 KB | ~ 1 ns | On-chip SRAM |\n` +
        `| **L2 Cache** | 256 - 512 KB | 3 - 5 ns | SRAM |\n` +
        `| **L3 Cache** | 8 - 32 MB | 10 - 20 ns | Shared SRAM |\n` +
        `| **Main Memory (DRAM)**| 16 - 64 GB | 50 - 100 ns | Synchronous DRAM |\n` +
        `| **Solid State Drive (SSD)** | 512 GB - 2 TB | 25 - 100 µs | Non-Volatile Flash / NVMe |\n\n` +
        `## ❓ คำถามและประเด็นสำคัญ (Cue Column)\n` +
        `- ทำไมระบบคอมพิวเตอร์จึงต้องออกแบบหน่วยความจำให้เป็นลำดับชั้นหลายชั้น แทนที่จะใช้หน่วยความจำความเร็วสูงทั้งหมด?\n` +
        `- ความแตกต่างพื้นฐานระหว่าง **Temporal Locality** กับ **Spatial Locality** มีผลต่อขนาดของ Cache Line อย่างไร?\n` +
        `- เมื่อเกิด Cache Miss อะไรคือสาเหตุหลัก (3Cs: Compulsory, Capacity, Conflict)?\n\n` +
        `## 📝 บันทึกเนื้อหาละเอียด (Notes Column)\n` +
        `- **หลักการ Locality of Reference:** โปรแกรมไม่ได้เข้าถึงหน่วยความจำแบบสุ่ม แต่มีแนวโน้มเข้าถึงข้อมูลที่ใกล้เคียงกันเสมอ\n` +
        `- **Temporal Locality:** ข้อมูลที่เพิ่งถูกเรียกใช้ มีโอกาสสูงมากที่จะถูกเรียกใช้ซ้ำในอนาคตอันใกล้ (เช่น ตัวแปรใน Loop \`for (int i = 0; i < n; i++)\`)\n` +
        `- **Spatial Locality:** ข้อมูลที่มีตำแหน่ง Address ติดกัน มักจะถูกเรียกใช้ตามมาเรื่อยๆ ฮาร์ดแวร์จึงดึงข้อมูลมาเป็นบล็อกขนาด \`64 bytes\` (Cache Line)\n\n` +
        `## 💡 สรุปใจความสำคัญ (Summary)\n` +
        `> 💡 ความเร็วในการประมวลผลของซอฟต์แวร์ถูกจำกัดด้วยความเร็วของหน่วยความจำ (Memory Wall) การเขียนโค้ดที่เข้าถึงข้อมูลเรียงตามแนวราบ (Row-major) ในภาษา C ช่วยลด Cache Miss ได้มากกว่าการวนแบบ Column-major หลายเท่าตัว\n\n` +
        `## 🎯 เช็กลิสต์ทบทวนความเข้าใจ (Self-Quiz Checklist)\n` +
        `- [x] อธิบายความหมายของสมการคำนวณ AMAT ได้ด้วยตนเอง\n` +
        `- [ ] เขียนโปรแกรมภาษา C เปรียบเทียบเวลา Execution Time ระหว่าง Row-major vs Column-major Matrix\n` +
        `- [ ] ศึกษาเรื่อง Virtual Memory และ Translation Lookaside Buffer (TLB) เพิ่มเติม\n\n` +
        `#cornell #learning #notes `
      );
    } else {
      rawMarkdown = (
        `# Cornell Notes: Computer Systems Architecture - Memory Hierarchy\n\n` +
        `> 📐 **Average Memory Access Time (AMAT):**\n` +
        `> $\\text{AMAT} = \\text{Hit Time} + (\\text{Miss Rate} \\times \\text{Miss Penalty})$\n\n` +
        `## 📋 Lecture Details\n` +
        `| Attribute | Details |\n` +
        `| :--- | :--- |\n` +
        `| **Course / Code** | CS 61C: Great Ideas in Computer Architecture |\n` +
        `| **Lecture Topic** | Memory Hierarchy, Caching Mechanics, and Locality |\n` +
        `| **Instructor / Source** | UC Berkeley / MIT OpenCourseWare |\n` +
        `| **Date Recorded** | ${dateStr} |\n\n` +
        `## 🗄️ Memory Hierarchy Architecture\n` +
        `| Level | Typical Capacity | Access Latency | Physical Implementation |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| **Registers** | < 1 KB | 0.25 - 0.5 ns | CPU Register File |\n` +
        `| **L1 Cache** | 32 - 64 KB | ~ 1 ns | On-die Static RAM (SRAM) |\n` +
        `| **L2 Cache** | 256 - 512 KB | 3 - 5 ns | SRAM |\n` +
        `| **L3 Cache** | 8 - 32 MB | 10 - 20 ns | Shared On-die SRAM |\n` +
        `| **Main Memory (DRAM)**| 16 - 64 GB | 50 - 100 ns | Synchronous Dynamic RAM |\n` +
        `| **Solid State Drive (SSD)** | 512 GB - 2 TB | 25 - 100 µs | NVMe NAND Flash Storage |\n\n` +
        `## ❓ Cue Column & Key Questions\n` +
        `- Why does the physics of silicon prohibit building massive memory that operates at sub-nanosecond speeds?\n` +
        `- How do **Temporal Locality** and **Spatial Locality** dictate cache line sizing decisions?\n` +
        `- What are the primary mechanisms causing the Three Cs of Cache Misses (Compulsory, Capacity, Conflict)?\n\n` +
        `## 📝 Detailed Notes\n` +
        `- **Locality Principle:** Programs access a small, localized portion of address space at any given time.\n` +
        `- **Temporal Locality:** Recently accessed memory addresses are likely to be accessed again soon (e.g. index variable in a tight loop \`for (int i = 0; i < n; i++)\`).\n` +
        `- **Spatial Locality:** Contiguous memory locations tend to be accessed in sequence. Caches load contiguous \`64-byte\` Cache Lines on every miss.\n\n` +
        `## 💡 Core Summary\n` +
        `> 💡 Application throughput is fundamentally bounded by memory latency (The Memory Wall). Designing data access patterns that traverse memory linearly in row-major order maximizes hardware cache hits and eliminates CPU pipeline stalls.\n\n` +
        `## 🎯 Action Items & Self-Quiz\n` +
        `- [x] Articulate AMAT derivation and penalty trade-offs\n` +
        `- [ ] Benchmark C program comparing row-major vs column-major 2D matrix multiplication\n` +
        `- [ ] Review Virtual Memory page tables and Translation Lookaside Buffer (TLB) caching\n\n` +
        `#cornell #learning #notes `
      );
    }
  } else if (templateType === "content-planner") {
    if (isTh) {
      rawMarkdown = (
        `# วางแผนคอนเทนต์และสคริปต์วิดีโอ (Content Planner)\n\n` +
        `> 🪝 **ท่อนฮุกดึงดูดใจ (The Hook - 0:00 to 0:05):** "เคยสงสัยไหมว่าทำไมโค้ดที่เราเขียนเมื่อ 6 เดือนที่แล้ว พอกลับมาเปิดอ่านอีกทีกลับรู้สึกเหมือนกำลังแกะรหัสโบราณ ทั้งๆ ที่เราเป็นคนเขียนเองทุกบรรทัด?"\n\n` +
        `## 📋 ข้อมูลคอนเทนต์ (Content Metadata)\n` +
        `| รายการ | รายละเอียด |\n` +
        `| :--- | :--- |\n` +
        `| **หัวข้อคอนเทนต์** | 5 เทคนิคเขียน Clean Code ที่วิศวกรซอฟต์แวร์มืออาชีพใช้เป็นประจำ |\n` +
        `| **แพลตฟอร์มเผยแพร่** | YouTube / TikTok / LinkedIn Newsletter |\n` +
        `| **กลุ่มผู้ชมเป้าหมาย** | นักพัฒนาซอฟต์แวร์ระดับ Junior - Mid Level |\n` +
        `| **ความยาวเป้าหมาย** | 8 - 10 นาที |\n` +
        `| **วันที่เผยแพร่** | ${dateStr} |\n\n` +
        `## 🎬 ลำดับเรื่องราวและโครงสร้างสคริปต์ (Storyline & Structure)\n` +
        `1. **เปิดตัวด้วยปัญหา (0:00 - 1:30):** แสดงให้เห็นความเสียหายของ Technical Debt ที่ทำให้ทีมพัฒนาทำงานช้าลงเรื่อยๆ\n` +
        `2. **เนื้อหาหลัก 5 เทคนิค (1:30 - 7:00):** อธิบายพร้อมแสดงหน้าจอเปรียบเทียบโค้ดก่อน-หลังปรับปรุง (Refactoring Diff)\n` +
        `3. **สรุปและ Call to Action (7:00 - 8:30):** ชวนผู้ฟังแสดงความคิดเห็นและแนะนำทรัพยากรสำหรับศึกษาต่อ\n\n` +
        `## 💻 โค้ดตัวอย่างสำหรับสาธิตในวิดีโอ (Code Demonstration)\n` +
        `\`\`\`typescript\n` +
        `// ❌ ก่อนปรับปรุง: Nested conditionals อ่านยาก\n` +
        `function processOrder(order: Order) {\n` +
        `  if (order.isValid) {\n` +
        `    if (order.items.length > 0) {\n` +
        `      if (order.paymentStatus === 'PAID') {\n` +
        `        return shipOrder(order);\n` +
        `      }\n` +
        `    }\n` +
        `  }\n` +
        `  return null;\n` +
        `}\n` +
        `\n` +
        `// ✅ หลังปรับปรุง: Guard Clauses & Early Return ชัดเจน\n` +
        `function processOrderClean(order: Order) {\n` +
        `  if (!order.isValid || order.items.length === 0) return null;\n` +
        `  if (order.paymentStatus !== 'PAID') return null;\n` +
        `\n` +
        `  return shipOrder(order);\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## 📋 เช็กลิสต์การผลิตและการเผยแพร่ (Production Checklist)\n` +
        `- [x] ยกร่างโครงสร้างและสคริปต์วิดีโอเสร็จสมบูรณ์\n` +
        `- [x] บันทึกหน้าจอตัวอย่างโค้ดและเตรียมโปรเจกต์สาธิต\n` +
        `- [ ] ถ่ายทำฟุตเทจหน้ากล้อง (A-roll) และบันทึกเสียงบรรยาย\n` +
        `- [ ] ตัดต่อคลิป ใส่ซับไตเติล และ B-roll ประกอบ\n` +
        `- [ ] ออกแบบภาพปกที่มีอัตราการคลิกสูง (High CTR Thumbnail)\n` +
        `- [ ] อัปโหลดวิดีโอพร้อมตั้งเวลาเผยแพร่\n\n` +
        `#content #video #creator `
      );
    } else {
      rawMarkdown = (
        `# Content & Video Script Planner\n\n` +
        `> 🪝 **The Hook (0:00 - 0:05):** "Why does code written six months ago feel like deciphering an ancient foreign dialect—even when you wrote every single line yourself?"\n\n` +
        `## 📋 Content Metadata\n` +
        `| Attribute | Value |\n` +
        `| :--- | :--- |\n` +
        `| **Working Title** | 5 Clean Code Patterns That Save 100+ Engineering Hours |\n` +
        `| **Target Platforms** | YouTube / LinkedIn Video / Tech Blog |\n` +
        `| **Target Audience** | Junior to Mid-level Software Engineers |\n` +
        `| **Target Runtime** | 8 - 10 Minutes |\n` +
        `| **Target Publish Date** | ${dateStr} |\n\n` +
        `## 🎬 Storyline & Narrative Arc\n` +
        `1. **The Agony of Tech Debt (0:00 - 1:30):** Illustrate how messy code silently degrades team velocity and causes sprint burnout\n` +
        `2. **The 5 Core Principles (1:30 - 7:00):** Side-by-side IDE visual diff demonstrations of before-and-after refactoring\n` +
        `3. **Outro & Call to Action (7:00 - 8:30):** Encourage audience discussion on their favorite pattern and link resources\n\n` +
        `## 💻 Live Demonstration Code Snippet\n` +
        `\`\`\`typescript\n` +
        `// ❌ Before: Unruly nested conditionals\n` +
        `function processOrder(order: Order) {\n` +
        `  if (order.isValid) {\n` +
        `    if (order.items.length > 0) {\n` +
        `      if (order.paymentStatus === 'PAID') {\n` +
        `        return shipOrder(order);\n` +
        `      }\n` +
        `    }\n` +
        `  }\n` +
        `  return null;\n` +
        `}\n` +
        `\n` +
        `// ✅ After: Declarative guard clauses with early returns\n` +
        `function processOrderClean(order: Order) {\n` +
        `  if (!order.isValid || order.items.length === 0) return null;\n` +
        `  if (order.paymentStatus !== 'PAID') return null;\n` +
        `\n` +
        `  return shipOrder(order);\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## 📋 Production & Publishing Checklist\n` +
        `- [x] Storyboard structure and script drafted\n` +
        `- [x] IDE sample repository configured with live test cases\n` +
        `- [ ] Record talking-head video footage (A-roll) and high-fidelity audio\n` +
        `- [ ] Edit timeline, add animated syntax callouts and background tracks\n` +
        `- [ ] Render high-CTR thumbnail assets\n` +
        `- [ ] Schedule release and draft newsletter companion post\n\n` +
        `#content #video #creator `
      );
    }
  } else if (templateType === "api-doc") {
    if (isTh) {
      rawMarkdown = (
        `# เอกสารข้อกำหนด API (API Specification)\n\n` +
        `> \`POST /api/v1/notes\` — สร้างเอกสารหรือโน้ตใหม่ในคลังข้อมูล พร้อมรองรับการเข้ารหัสข้อมูลและการกำหนดแท็ก\n\n` +
        `## 📋 ข้อมูลทั่วไปของ Endpoint (Overview)\n` +
        `| คุณสมบัติ | ค่าที่กำหนด |\n` +
        `| :--- | :--- |\n` +
        `| **HTTP Method** | \`POST\` |\n` +
        `| **Base URL** | \`https://api.luno.local/api/v1\` |\n` +
        `| **การยืนยันตัวตน (Auth)** | \`Bearer <JWT_TOKEN>\` |\n` +
        `| **Rate Limit** | 120 คำขอ / นาที / IP |\n\n` +
        `## 🔐 Headers ที่ต้องส่งในคำขอ (Request Headers)\n` +
        `| Header Name | Type | Required | Description |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| \`Authorization\` | string | จำเป็น (Yes) | รูปแบบ: \`Bearer eyJhbGciOi...\` |\n` +
        `| \`Content-Type\` | string | จำเป็น (Yes) | ต้องระบุเป็น \`application/json\` |\n` +
        `| \`X-Client-Version\` | string | ไม่บังคับ (No) | เวอร์ชันของแอปพลิเคชัน เช่น \`2.4.0\` |\n\n` +
        `## 📦 โครงสร้างข้อมูลคำขอ (Request Body Schema)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "title": "บันทึกสถาปัตยกรรมระบบ",\n` +
        `  "content": "# สถาปัตยกรรมระบบ\\n\\nรายละเอียดเนื้อหา...",\n` +
        `  "folderPath": "Projects/Architecture",\n` +
        `  "tags": ["engineering", "architecture", "v2"],\n` +
        `  "isEncrypted": true,\n` +
        `  "metadata": {\n` +
        `    "icon": "FolderGit2",\n` +
        `    "iconColor": "text-primary"\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## 🚦 รหัสสถานะและการตอบกลับ (Response Status Codes)\n` +
        `| HTTP Status | ความหมาย | รูปแบบเนื้อหาที่ส่งคืน |\n` +
        `| :---: | :--- | :--- |\n` +
        `| **201 Created** | สำเร็จ: สร้างเอกสารใหม่เรียบร้อย | JSON Object ของโน้ตที่สร้าง |\n` +
        `| **400 Bad Request** | ข้อมูลนำเข้าไม่ถูกต้อง | รายการฟิลด์ที่ Validation ไม่ผ่าน |\n` +
        `| **401 Unauthorized** | Token หมดอายุหรือไม่ถูกต้อง | ข้อความแจ้งเตือนข้อผิดพลาด Auth |\n` +
        `| **429 Too Many Requests** | เกินขีดจำกัด Rate Limit | ข้อมูล Retry-After ใน Header |\n\n` +
        `## 💻 ตัวอย่างคำสั่งเรียกใช้งานผ่าน cURL\n` +
        `\`\`\`bash\n` +
        `curl -X POST "https://api.luno.local/api/v1/notes" \\\n` +
        `  -H "Authorization: Bearer $API_TOKEN" \\\n` +
        `  -H "Content-Type: application/json" \\\n` +
        `  -d '{\n` +
        `    "title": "Weekly Engineering Sync",\n` +
        `    "content": "# Weekly Sync Content",\n` +
        `    "tags": ["work", "sync"]\n` +
        `  }'\n` +
        `\`\`\`\n\n` +
        `## ✅ เช็กลิสต์การทดสอบ API (Testing Checklist)\n` +
        `- [x] ทดสอบการเรียกใช้งานกรณีปกติ (Happy Path) คืนค่าสถานะ 201 Created\n` +
        `- [x] ทดสอบการส่งฟิลด์ว่างหรือไม่ครบ คืนค่าสถานะ 400 Validation Error\n` +
        `- [ ] ทดสอบความถูกต้องของการประมวลผล Header Authorization ปลอม คืนค่า 401\n` +
        `- [ ] ทำการทดสอบ Stress Test เกิน Rate Limit ยืนยันการทำงานของระบบ 429\n\n` +
        `## 📤 ตัวอย่างผลลัพธ์ที่ตอบกลับ (Sample 201 Response)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "success": true,\n` +
        `  "data": {\n` +
        `    "id": "note_774921",\n` +
        `    "title": "บันทึกสถาปัตยกรรมระบบ",\n` +
        `    "createdAt": "${dateStr}T${timeStr}:00Z",\n` +
        `    "updatedAt": "${dateStr}T${timeStr}:00Z"\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `#api #docs #backend `
      );
    } else {
      rawMarkdown = (
        `# API Endpoint Specification\n\n` +
        `> \`POST /api/v1/notes\` — Create a new note or document with encrypted payload support, workspace tags, and custom icon metadata.\n\n` +
        `## 📋 Endpoint Overview\n` +
        `| Attribute | Value |\n` +
        `| :--- | :--- |\n` +
        `| **HTTP Method** | \`POST\` |\n` +
        `| **Base URL** | \`https://api.luno.local/api/v1\` |\n` +
        `| **Authentication** | \`Bearer <JWT_TOKEN>\` |\n` +
        `| **Rate Limiting** | 120 requests / minute / IP |\n\n` +
        `## 🔐 Required Request Headers\n` +
        `| Header Name | Type | Required | Description |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| \`Authorization\` | string | Yes | Bearer Token: \`Bearer eyJhbGciOi...\` |\n` +
        `| \`Content-Type\` | string | Yes | Must be \`application/json\` |\n` +
        `| \`X-Client-Version\` | string | Optional | Client release version string (e.g. \`2.4.0\`) |\n\n` +
        `## 📦 Request Body Schema\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "title": "System Architecture Overview",\n` +
        `  "content": "# System Architecture\\n\\nDetailed content...",\n` +
        `  "folderPath": "docs/architecture",\n` +
        `  "tags": ["engineering", "architecture", "v2"],\n` +
        `  "isEncrypted": true,\n` +
        `  "metadata": {\n` +
        `    "icon": "FolderGit2",\n` +
        `    "iconColor": "text-primary"\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## 🚦 Response Status Codes\n` +
        `| HTTP Status | Meaning | Response Body Format |\n` +
        `| :---: | :--- | :--- |\n` +
        `| **201 Created** | Document created successfully | JSON representation of created resource |\n` +
        `| **400 Bad Request** | Schema validation failed | List of invalid property constraints |\n` +
        `| **401 Unauthorized** | Token missing, invalid, or expired | Standardized error payload |\n` +
        `| **429 Too Many Requests** | Rate limit ceiling exceeded | Includes \`Retry-After\` header timestamp |\n\n` +
        `## 💻 Practical cURL Invocation\n` +
        `\`\`\`bash\n` +
        `curl -X POST "https://api.luno.local/api/v1/notes" \\\n` +
        `  -H "Authorization: Bearer $API_TOKEN" \\\n` +
        `  -H "Content-Type: application/json" \\\n` +
        `  -d '{\n` +
        `    "title": "Weekly Engineering Sync",\n` +
        `    "content": "# Weekly Sync Content",\n` +
        `    "tags": ["work", "sync"]\n` +
        `  }'\n` +
        `\`\`\`\n\n` +
        `## ✅ API Test Suite Checklist\n` +
        `- [x] Verify valid payload generates 201 Created response\n` +
        `- [x] Verify payload missing title returns 400 Bad Request\n` +
        `- [ ] Verify forged or malformed bearer token returns 401 Unauthorized\n` +
        `- [ ] Execute stress benchmark past 120 req/min asserting 429 throttling\n\n` +
        `## 📤 Sample Response (201 Created)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "success": true,\n` +
        `  "data": {\n` +
        `    "id": "note_774921",\n` +
        `    "title": "System Architecture Overview",\n` +
        `    "createdAt": "${dateStr}T${timeStr}:00Z",\n` +
        `    "updatedAt": "${dateStr}T${timeStr}:00Z"\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `#api #docs #backend `
      );
    }
  } else if (templateType === "habit-tracker") {
    if (isTh) {
      rawMarkdown = (
        `# ตารางติดตามนิสัยและสุขภาพ (Habit & Wellness Tracker)\n\n` +
        `> 🎯 **เป้าหมายสุขภาพประจำสัปดาห์:** "ความสม่ำเสมอชนะความสมบูรณ์แบบเสมอ การทำเพียง 10 นาทีทุกวันให้ผลลัพธ์ที่ยิ่งใหญ่กว่าการทำ 2 ชั่วโมงเพียงสัปดาห์ละครั้ง"\n\n` +
        `## 🏃‍♂️ ตารางติดตามนิสัยรายวัน (Daily Habit Matrix)\n` +
        `| นิสัยเป้าหมาย (Daily Habits) | จ. | อ. | พ. | พฤ. | ศ. | ส. | อา. | สำเร็จ |\n` +
        `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n` +
        `| 💧 ดื่มน้ำ 2 - 3 ลิตร | [x] | [x] | [x] | [x] | [x] | [ ] | [ ] | 5/7 |\n` +
        `| 🏃 ออกกำลังกาย / วิ่ง 30 นาที | [x] | [ ] | [x] | [ ] | [x] | [ ] | [ ] | 3/7 |\n` +
        `| 📖 อ่านหนังสือพัฒนาตนเอง 15 นาที | [x] | [x] | [x] | [x] | [ ] | [ ] | [ ] | 4/7 |\n` +
        `| 🧘 ฝึกสมาธิ / ผ่อนคลายกล้ามเนื้อ | [x] | [x] | [x] | [x] | [x] | [ ] | [ ] | 5/7 |\n` +
        `| 🛌 เข้านอนก่อน 23:00 น. | [x] | [x] | [ ] | [x] | [x] | [ ] | [ ] | 4/7 |\n\n` +
        `## 🌅 ลำดับขั้นตอนกิจวัตรยามเช้า (Morning Routine)\n` +
        `1. **ดื่มน้ำและรับแสงแดดยามเช้า:** ดื่มน้ำ 500ml ทันทีหลังตื่น และเดินรับแดดอ่อน 10 นาทีเพื่อตั้งนาฬิกาชีวภาพ\n` +
        `2. **ยืดเหยียดร่างกาย:** ทำท่ายืดกล้ามเนื้อและโยคะเบาๆ 10 นาที เพื่อกระตุ้นการไหลเวียนโลหิต\n` +
        `3. **วางแผนเป้าหมาย 3 ข้อ:** เปิดโน้ตและเขียน 3 อันดับงานสำคัญที่สุดก่อนเริ่มเช็กข้อความ\n\n` +
        `## ⚡ บันทึกระดับพลังงานและอารมณ์ (Energy & Mood Log)\n` +
        `| วัน | ระดับพลังงาน | คุณภาพการนอนหลับ | บันทึกสั้นๆ |\n` +
        `| :---: | :---: | :---: | :--- |\n` +
        `| **จันทร์** | ⭐⭐⭐⭐⭐ | 8 ชม. (หลับสนิท) | เริ่มสัปดาห์ด้วยความกระปรี้กระเปร่า โฟกัสงานได้ดีมาก |\n` +
        `| **พุธ** | ⭐⭐⭐⭐☆ | 7 ชม. (ตื่นกลางดึก 1 ครั้ง) | ช่วงบ่ายมีอาการล้าเล็กน้อย จิบชาเขียวช่วยได้ |\n` +
        `| **ศุกร์** | ⭐⭐⭐⭐⭐ | 7.5 ชม. (สดชื่น) | สมาธิต่อเนื่อง เคลียร์งานสำคัญตามเป้าหมายครบถ้วน |\n\n` +
        `## 📋 เช็กลิสต์การพัฒนาวินัยและสุขภาพ (Wellness Checklist)\n` +
        `- [x] เตรียมขวดน้ำประจำโต๊ะทำงานขนาด 1.5 ลิตรทุกเช้า\n` +
        `- [x] ปิดเสียงแจ้งเตือนโทรศัพท์มือถือขณะฝึกสมาธิ\n` +
        `- [ ] ไม่รับประทานอาหารมื้อหนักหลัง 19:30 น.\n` +
        `- [ ] เดินสะสมระยะทางให้ครบ 8,000 ก้าวต่อวัน\n\n` +
        `#habits #tracker #wellness `
      );
    } else {
      rawMarkdown = (
        `# Weekly Habit & Wellness Tracker\n\n` +
        `> 🎯 **Weekly Wellness Intent:** "Consistency always beats intensity. Ten mindful minutes every day compounds into greater vitality than a grueling two-hour session once a week."\n\n` +
        `## 🏃‍♂️ Daily Habit Matrix\n` +
        `| Target Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Progress |\n` +
        `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n` +
        `| 💧 Hydrate 2-3 Liters | [x] | [x] | [x] | [x] | [x] | [ ] | [ ] | 5/7 |\n` +
        `| 🏃 30-min Cardio / Exercise | [x] | [ ] | [x] | [ ] | [x] | [ ] | [ ] | 3/7 |\n` +
        `| 📖 15-min Book Reading | [x] | [x] | [x] | [x] | [ ] | [ ] | [ ] | 4/7 |\n` +
        `| 🧘 Mindfulness & Breathwork | [x] | [x] | [x] | [x] | [x] | [ ] | [ ] | 5/7 |\n` +
        `| 🛌 Asleep before 11:00 PM | [x] | [x] | [ ] | [x] | [x] | [ ] | [ ] | 4/7 |\n\n` +
        `## 🌅 Morning Routine Sequence\n` +
        `1. **Hydration & Sunlight Exposure:** Drink 500ml of water and get 10 minutes of direct morning sunlight to anchor circadian rhythm\n` +
        `2. **Gentle Mobility Routine:** 10 minutes of dynamic full-body stretching to invigorate blood flow\n` +
        `3. **Top 3 Priorities Selection:** Open daily log and outline today's vital outcomes prior to checking email\n\n` +
        `## ⚡ Energy & Mood Check-in\n` +
        `| Day | Energy Level | Sleep Quality | Daily Observation |\n` +
        `| :---: | :---: | :---: | :--- |\n` +
        `| **Monday** | ⭐⭐⭐⭐⭐ | 8 hrs (Deep sleep) | Started the sprint with high clarity and sustained focus |\n` +
        `| **Wednesday**| ⭐⭐⭐⭐☆ | 7 hrs (Woke once) | Slight afternoon slump resolved with a brief walking break |\n` +
        `| **Friday** | ⭐⭐⭐⭐⭐ | 7.5 hrs (Refreshed) | Finished core sprint commitments with strong momentum |\n\n` +
        `## 📋 Wellness & Discipline Checklist\n` +
        `- [x] Keep filled 1.5L water bottle on desk every morning\n` +
        `- [x] Activate Do Not Disturb mode during breathwork sessions\n` +
        `- [ ] Avoid heavy carbohydrate meals after 7:30 PM\n` +
        `- [ ] Log at least 8,000 steps daily\n\n` +
        `#habits #tracker #wellness `
      );
    }
  } else if (templateType === "monthly-budget") {
    if (isTh) {
      rawMarkdown = (
        `# วางแผนงบประมาณและการเงินประจำเดือน (Monthly Budget)\n\n` +
        `> 💰 **เป้าหมายการเงินประจำเดือน:** "ออมเงินให้ได้อย่างน้อย 20% ของรายรับสุทธิ และควบคุมงบประมาณหมวดหมู่อาหารและสังสรรค์ไม่ให้เกินที่กำหนด"\n\n` +
        `## 💵 1. รายรับทั้งหมด (Total Income)\n` +
        `| แหล่งรายรับ | ประมาณการ (฿) | ได้รับจริง (฿) | ผลต่าง (฿) |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| เงินเดือนประจำ | 55,000.00 | 55,000.00 | 0.00 |\n` +
        `| รายได้เสริม / ฟรีแลนซ์ | 12,000.00 | 14,500.00 | +2,500.00 |\n` +
        `| เงินปันผล / ผลตอบแทนการลงทุน | 2,000.00 | 2,250.00 | +250.00 |\n` +
        `| **รวมรายรับทั้งหมด** | **69,000.00** | **71,750.00** | **+2,750.00** |\n\n` +
        `## 🏠 2. รายจ่ายคงที่ (Fixed Expenses)\n` +
        `| รายการค่าใช้จ่าย | งบประมาณ (฿) | จ่ายจริง (฿) | สถานะการชำระ |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| ค่าเช่าที่พัก / ผ่อนคอนโด | 15,000.00 | 15,000.00 | ชำระแล้ว |\n` +
        `| ค่าน้ำ / ค่าไฟฟ้า / อินเทอร์เน็ตบ้าน | 3,000.00 | 2,840.00 | ชำระแล้ว |\n` +
        `| ค่าเดินทาง / รถไฟฟ้า / น้ำมัน | 4,500.00 | 4,200.00 | ชำระแล้ว |\n` +
        `| ค่าประกันสุขภาพและอุบัติเหตุ | 3,500.00 | 3,500.00 | ชำระแล้ว |\n` +
        `| **รวมรายจ่ายคงที่** | **26,000.00** | **25,540.00** | **ประหยัดได้ ฿460** |\n\n` +
        `## 🛒 3. รายจ่ายผันแปร & เงินออม (Variable & Savings)\n` +
        `| หมวดหมู่ | งบประมาณ (฿) | จ่ายจริง (฿) | คงเหลือ (฿) |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| ค่าอาหารและวัตถุดิบทำกับข้าว | 14,000.00 | 13,200.00 | +800.00 |\n` +
        `| เงินออมเพื่อการเกษียณ / กองทุน (20%) | 14,000.00 | 14,000.00 | 0.00 |\n` +
        `| เงินสำรองฉุกเฉิน | 5,000.00 | 5,000.00 | 0.00 |\n` +
        `| ช้อปปิ้ง บันเทิง และสังสรรค์ | 6,000.00 | 5,400.00 | +600.00 |\n` +
        `| **รวมรายจ่ายผันแปรและออม** | **39,000.00** | **37,600.00** | **ประหยัดได้ ฿1,400** |\n\n` +
        `## 🧭 ลำดับความสำคัญในการจัดสรรเงิน (Financial Priority Rules)\n` +
        `1. **Pay Yourself First:** โอนเงินออมและลงทุน \`20%\` เข้าบัญชีแยกทันทีที่เงินเดือนเข้า\n` +
        `2. **เคลียร์หนี้สินและค่าใช้จ่ายคงที่:** ชำระค่าที่พัก บิลค่าสาธารณูปโภค และบัตรเครดิตเต็มจำนวน\n` +
        `3. **จำกัดวงเงินใช้จ่ายรายวัน:** แบ่งงบประมาณรายจ่ายผันแปรเป็นรายสัปดาห์เพื่อไม่ให้ใช้จ่ายเกินงบ\n\n` +
        `## 📋 เช็กลิสต์การเงินประจำเดือน (Financial Checklist)\n` +
        `- [x] ตรวจสอบยอดเงินโอนเข้าบัญชีและสลิปเงินเดือน\n` +
        `- [x] โอนเงินออมเข้าบัญชีกองทุนดัชนีอัตโนมัติ\n` +
        `- [x] ชำระค่าสาธารณูปโภคและบิลค่าอินเทอร์เน็ตครบถ้วน\n` +
        `- [ ] สรุปยอดค่าใช้จ่ายผ่านบัตรเครดิตและบันทึกบัญชีรายรับ-รายจ่าย\n\n` +
        `## 📊 สรุปยอดคงเหลือสุทธิ (Net Financial Balance)\n` +
        `| รายการสรุป | จำนวนเงิน (฿) |\n` +
        `| :--- | :---: |\n` +
        `| **รายรับจริงรวม** | ฿71,750.00 |\n` +
        `| **รายจ่ายจริงรวม (รวมเงินออม)** | ฿63,140.00 |\n` +
        `| **ยอดเงินคงเหลือสุทธิ (Net Surplus)** | **฿8,610.00** |\n` +
        `| **อัตราการออมและการลงทุนจริง** | **26.48%** |\n\n` +
        `#budget #finance #money `
      );
    } else {
      rawMarkdown = (
        `# Monthly Budget & Financial Planner\n\n` +
        `> 💰 **Financial North Star:** "Pay yourself first: Automate a minimum 20% savings and investment allocation prior to discretionary lifestyle expenditures."\n\n` +
        `## 💵 1. Total Income Breakdown\n` +
        `| Income Stream | Projected ($) | Actual Received ($) | Variance ($) |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| Primary Salary | 5,500.00 | 5,500.00 | 0.00 |\n` +
        `| Secondary / Consulting | 1,200.00 | 1,450.00 | +250.00 |\n` +
        `| Dividends & Investments | 200.00 | 225.00 | +25.00 |\n` +
        `| **Total Monthly Income** | **6,900.00** | **7,175.00** | **+275.00** |\n\n` +
        `## 🏠 2. Fixed Expenses & Essentials\n` +
        `| Expense Category | Budgeted ($) | Actual Paid ($) | Payment Status |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| Rent / Mortgage | 1,500.00 | 1,500.00 | Settled |\n` +
        `| Utilities & High-Speed Internet | 300.00 | 284.00 | Settled |\n` +
        `| Commute, Fuel & Transit | 450.00 | 420.00 | Settled |\n` +
        `| Health & Property Insurance | 350.00 | 350.00 | Settled |\n` +
        `| **Total Fixed Expenses** | **2,600.00** | **2,554.00** | **Saved $46.00** |\n\n` +
        `## 🛒 3. Variable Spending & Savings\n` +
        `| Category | Budgeted ($) | Actual Spent ($) | Remaining ($) |\n` +
        `| :--- | :---: | :---: | :--- |\n` +
        `| Groceries & Dining | 1,400.00 | 1,320.00 | +80.00 |\n` +
        `| Retirement & Index Funds (20%) | 1,400.00 | 1,400.00 | 0.00 |\n` +
        `| Emergency Cushion Fund | 500.00 | 500.00 | 0.00 |\n` +
        `| Entertainment & Personal | 600.00 | 540.00 | +60.00 |\n` +
        `| **Total Variable & Savings** | **3,900.00** | **3,760.00** | **Saved $140.00** |\n\n` +
        `## 🧭 3 Golden Financial Execution Rules\n` +
        `1. **Automate Savings First:** Direct 20% into diversified index funds immediately upon pay distribution\n` +
        `2. **Settle High-Priority Fixed Bills:** Clear housing, utilities, and credit balances in full without carrying debt\n` +
        `3. **Weekly Discretionary Caps:** Segment variable expenses into weekly allowances to avoid end-of-month deficits\n\n` +
        `## 📋 Monthly Financial Routine Checklist\n` +
        `- [x] Verify payroll deposit and employer pension contribution\n` +
        `- [x] Execute automatic scheduled transfer to index investment portfolio\n` +
        `- [x] Confirm utility bills and credit statements cleared\n` +
        `- [ ] Reconcile transactions in personal ledger and audit discretionary variance\n\n` +
        `## 📊 Net Financial Balance\n` +
        `| Summary Metric | Amount ($) |\n` +
        `| :--- | :---: |\n` +
        `| **Total Actual Income** | $7,175.00 |\n` +
        `| **Total Outflows (Incl. Savings)** | $6,314.00 |\n` +
        `| **Net Monthly Surplus** | **$861.00** |\n` +
        `| **Effective Savings & Investment Rate** | **26.48%** |\n\n` +
        `#budget #finance #money `
      );
    }
  } else if (templateType === "travel-itinerary") {
    if (isTh) {
      rawMarkdown = (
        `# แผนการเดินทางท่องเที่ยว (Travel Itinerary)\n\n` +
        `> ✈️ **ทริปพักผ่อนธรรมชาติและวัฒนธรรม: เชียงใหม่ 4 วัน 3 คืน** (${dateStr})\n` +
        `> ผู้ร่วมเดินทาง: 2 คน | สภาพอากาศเฉลี่ย: 18°C - 26°C | งบประมาณรวม: ฿20,000\n\n` +
        `## 🛫 ข้อมูลการเดินทางและที่พัก (Flights & Accommodation)\n` +
        `| วันที่ | รายการ | รายละเอียด | หมายเลขยืนยัน |\n` +
        `| :---: | :--- | :--- | :---: |\n` +
        `| วันที่ 1 | เที่ยวบินขาไป (DMK - CNX) | สายการบิน Thai AirAsia (FD3435) ออก 08:30 ถึง 09:45 | \`TK-9821A\` |\n` +
        `| วันที่ 1 - 4 | โรงแรมที่พัก | Nimman Heritage Boutique Hotel (ห้อง Deluxe) | \`HTL-77412\` |\n` +
        `| วันที่ 1 - 4 | รถเช่าขับเอง | Toyota Yaris Ativ (รับ-ส่งที่สนามบินเชียงใหม่) | \`RC-55209\` |\n` +
        `| วันที่ 4 | เที่ยวบินขากลับ (CNX - DMK)| สายการบิน Thai AirAsia (FD3436) ออก 18:50 ถึง 20:05 | \`TK-9821B\` |\n\n` +
        `## 🗺️ ตารางกิจกรรมรายวัน (Day-by-Day Itinerary)\n` +
        `### 📍 วันที่ 1: เดินทางถึง แวะคาเฟ่นิมมาน และชมพระอาทิตย์ตก\n` +
        `1. **10:00 - รับรถเช่า:** เดินทางถึงสนามบินเชียงใหม่ รับรถเช่าและมุ่งหน้าสู่นิมมานเหมินท์\n` +
        `2. **12:30 - ข้าวซอยแม่สาย:** รับประทานอาหารกลางวันข้าวซอยและน้ำเงี้ยวต้นตำรับ\n` +
        `3. **14:00 - เช็กอินโรงแรม:** พักผ่อนและแวะดื่มกาแฟ Specialty ที่ Roast8ry Lab\n` +
        `4. **17:30 - จุดชมวิวดอยสุเทพ:** ชมวิวเมืองเชียงใหม่ยามพระอาทิตย์ตกดิน และเดินถนนคนเดิน\n\n` +
        `### 📍 วันที่ 2: สัมผัสอากาศหนาวบนยอดดอยอินทนนท์\n` +
        `1. **06:30 - ออกเดินทางสู่ดอยอินทนนท์:** มุ่งหน้าสู่จุดสูงสุดแดนสยาม\n` +
        `2. **09:30 - เส้นทางศึกษาธรรมชาติกิ่วแม่ปาน:** เดินศึกษาธรรมชาติระยะทาง 3.2 กิโลเมตร\n` +
        `3. **13:00 - สถานีเกษตรหลวงอินทนนท์:** รับประทานอาหารกลางวันเมนูผักปลอดสารพิษ\n` +
        `4. **15:30 - น้ำตกวชิรธาร:** แวะถ่ายรูปความอลังการของน้ำตกและเดินทางกลับที่พัก\n\n` +
        `## 💰 ตารางประมาณการงบประมาณ (Budget Breakdown)\n` +
        `| หมวดหมู่ | ประมาณการ (฿) | จ่ายจริง (฿) | สถานะ |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| ตั๋วเครื่องบินไป-กลับ (2 คน) | 5,500.00 | 5,200.00 | จ่ายแล้ว |\n` +
        `| ค่าที่พัก 3 คืน | 6,000.00 | 5,850.00 | จ่ายแล้ว |\n` +
        `| ค่าเช่ารถและค่าน้ำมัน | 3,500.00 | 3,300.00 | จ่ายแล้ว |\n` +
        `| ค่าอาหาร คาเฟ่ และของฝาก | 5,000.00 | 4,650.00 | ในงบประมาณ |\n` +
        `| **รวมงบประมาณทั้งหมด** | **20,000.00** | **19,000.00** | **ประหยัดได้ ฿1,000** |\n\n` +
        `## 🎒 เช็กลิสต์จัดกระเป๋าเดินทาง (Packing Checklist)\n` +
        `- [x] บัตรประชาชน / ใบขับขี่ / เอกสารยืนยันการจองตั๋วและโรงแรม\n` +
        `- [x] เสื้อกันหนาวและเสื้อแจ็กเกตสำหรับเดินกิ่วแม่ปาน\n` +
        `- [x] รองเท้าผ้าใบสำหรับเดินป่าและถุงเท้าหนา\n` +
        `- [x] ยาสามัญประจำตัว ยาแก้เมารถ และชุดปฐมพยาบาลเบื้องต้น\n` +
        `- [ ] กล้องถ่ายรูป สายชาร์จ และ Power Bank ความจุ 20,000mAh\n` +
        `- [ ] ร่มพับและครีมกันแดด\n\n` +
        `#travel #itinerary #vacation `
      );
    } else {
      rawMarkdown = (
        `# Travel Itinerary & Trip Planner\n\n` +
        `> ✈️ **Cultural & Scenic Expedition: Tokyo & Hakone 5 Days 4 Nights** (${dateStr})\n` +
        `> Travelers: 2 Adults | Weather Forecast: 15°C - 22°C | Total Budget: $3,200\n\n` +
        `## 🛫 Flights & Accommodations\n` +
        `| Segment | Service / Booking | Details | Confirmation |\n` +
        `| :---: | :--- | :--- | :---: |\n` +
        `| Day 1 | Inbound Flight | ANA (NH850) Dep 08:00 Arr 15:45 Haneda (HND) | \`NH-8821X\` |\n` +
        `| Day 1 - 4 | Hotel Lodging | Shibuya Stream Excel Hotel Tokyu (Corner King) | \`HTL-9041A\` |\n` +
        `| Day 1 - 5 | Transit Passes | Digital Suica IC Card + Tokyo Metro 72-Hour Pass | Active |\n` +
        `| Day 5 | Outbound Flight | ANA (NH849) Dep 18:30 Arr 23:15 | \`NH-8821Y\` |\n\n` +
        `## 🗺️ Day-by-Day Itinerary\n` +
        `### 📍 Day 1: Arrival, Shibuya Crossing & Sunset Skyline\n` +
        `1. **16:30 - Haneda Express:** Clear customs, activate digital transit pass, and take Tokyo Monorail\n` +
        `2. **18:00 - Hotel Check-in:** Unpack at Shibuya Stream and enjoy welcome matcha tea\n` +
        `3. **19:30 - Shibuya Sky Observatory:** Sunset panoramic views of Tokyo skyline and Mt. Fuji silhouette\n` +
        `4. **21:00 - Izakaya Dinner:** Authentic yakitori and craft ramen in Omoide Yokocho\n\n` +
        `### 📍 Day 2: Historic Heritage, Tech Districts & Gastronomy\n` +
        `1. **08:30 - Senso-ji Temple & Asakusa:** Explore Tokyo's oldest temple before peak tourist hours\n` +
        `2. **12:00 - Tsukiji Outer Market:** Fresh sushi, grilled scallops, and tamagoyaki tastings\n` +
        `3. **15:00 - Akihabara Electric Town:** Explore retro gaming arcades and specialty electronics\n` +
        `4. **19:30 - Ginza District:** Traditional multi-course Kaiseki dinner and specialty roastery\n\n` +
        `## 💰 Comprehensive Budget Breakdown\n` +
        `| Category | Projected ($) | Actual Spent ($) | Status |\n` +
        `| :--- | :---: | :---: | :---: |\n` +
        `| Roundtrip Flights (2 Adults) | 1,400.00 | 1,350.00 | Booked |\n` +
        `| Hotel Accommodations (4 Nights) | 900.00 | 880.00 | Booked |\n` +
        `| Local Transit & High-Speed Rail | 200.00 | 185.00 | Funded |\n` +
        `| Dining, Cafes & Experiences | 700.00 | 660.00 | On Track |\n` +
        `| **Total Trip Expenditure** | **3,200.00** | **3,075.00** | **Under Budget ($125)** |\n\n` +
        `## 🎒 Packing & Essentials Checklist\n` +
        `- [x] Passports valid 6+ months & international e-tickets\n` +
        `- [x] Universal plug adapters & high-capacity 20,000mAh power banks\n` +
        `- [x] Comfortable walking shoes (15k+ daily steps expected)\n` +
        `- [x] Prescriptions and international travel health insurance card\n` +
        `- [ ] Compact travel umbrella and weather-appropriate layer jacket\n` +
        `- [ ] Pocket Wi-Fi reservation voucher\n\n` +
        `#travel #itinerary #vacation `
      );
    }
  }

  if (!rawMarkdown) {
    return "";
  }

  const meta = NOTE_TEMPLATE_METADATA[templateType];
  const templateIcon = getTemplateIcon(templateType, iconPack);
  if (templateIcon) {
    return updateFrontmatterIcon(rawMarkdown, templateIcon, meta?.iconColor);
  }

  return rawMarkdown;
}

/**
 * Replaces or prepends the first H1 heading in a Markdown document with a new title,
 * safely preserving any YAML frontmatter block at the top.
 */
export function replaceFirstH1InMarkdown(markdown: string, newTitle: string): string {
  if (!markdown || !newTitle) return markdown;
  const h1Regex = /^(\s*(?:---[\s\S]*?---\s*)?)#\s+[^\n]+/m;
  if (h1Regex.test(markdown)) {
    return markdown.replace(h1Regex, (_match, frontmatter) => `${frontmatter}# ${newTitle}`);
  }
  const fmRegex = /^(\s*---[\s\S]*?---\s*)/;
  const fmMatch = fmRegex.exec(markdown);
  if (fmMatch) {
    return `${fmMatch[1]}# ${newTitle}\n\n${markdown.slice(fmMatch[1].length)}`;
  }
  return `# ${newTitle}\n\n${markdown}`;
}
