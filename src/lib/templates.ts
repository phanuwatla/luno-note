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
          `โน้ตบันทึก - [หัวข้อ]\n` +
          `=======================================\n` +
          `วันที่: ${dateStr}\n` +
          `เวลา: ${timeStr}\n\n` +
          `บันทึก:\n` +
          `- \n`
        );
      }
      return (
        `Quick Notes - [Topic]\n` +
        `=======================================\n` +
        `Date: ${dateStr}\n` +
        `Time: ${timeStr}\n\n` +
        `Notes:\n` +
        `- \n`
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
          `คำอธิบายโปรเจกต์ วัตถุประสงค์ และเป้าหมายการทำงาน\n\n` +
          `2. ข้อกำหนดและการติดตั้ง (Installation & Setup)\n` +
          `----------------------------------------------------\n` +
          `- ความต้องการของระบบ:\n` +
          `- ขั้นตอนการติดตั้ง / เริ่มต้นใช้งาน:\n\n` +
          `3. วิธีการใช้งาน (Usage)\n` +
          `-----------------------------------\n` +
          `- คำสั่งหรือวิธีเปิดใช้งาน:\n` +
          `- ตัวอย่างการใช้งาน:\n\n` +
          `4. โครงสร้างไฟล์ (File Structure)\n` +
          `-------------------------------\n` +
          `/\n` +
          `├── src/\n` +
          `├── docs/\n` +
          `└── README.txt\n\n` +
          `5. ผู้จัดทำ & ข้อมูลติดต่อ (Author & Contact)\n` +
          `-----------------------------------------\n` +
          `- ผู้พัฒนา: \n` +
          `- ช่องทางติดต่อ / ลิงก์: \n`
        );
      }
      return (
        `=======================================\n` +
        `PROJECT NAME / REPOSITORY README\n` +
        `=======================================\n\n` +
        `1. Overview\n` +
        `-----------\n` +
        `A brief description of what this project is and what problem it solves.\n\n` +
        `2. Installation & Setup\n` +
        `-----------------------\n` +
        `- Requirements:\n` +
        `- Steps to install and get started:\n\n` +
        `3. Usage\n` +
        `--------\n` +
        `- Commands / how to run:\n` +
        `- Example usage:\n\n` +
        `4. File Structure\n` +
        `-----------------\n` +
        `/\n` +
        `├── src/\n` +
        `├── docs/\n` +
        `└── README.txt\n\n` +
        `5. Author & Contact\n` +
        `--------------------\n` +
        `- Author: \n` +
        `- Contact / Links: \n`
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
          `- ผู้เข้าร่วม: \n\n` +
          `วาระการประชุม\n` +
          `-------------\n` +
          `- [ ] วาระที่ 1\n` +
          `- [ ] วาระที่ 2\n\n` +
          `สรุปการพูดคุย & บันทึก\n` +
          `---------------------\n` +
          `- \n\n` +
          `งานที่ต้องทำต่อ (Action Items)\n` +
          `-----------------------------\n` +
          `- [ ] งานที่ 1 (ผู้รับผิดชอบ: )\n` +
          `- [ ] งานที่ 2 (ผู้รับผิดชอบ: )\n`
        );
      }
      return (
        `Meeting Notes - ${dateStr}\n` +
        `=======================================\n\n` +
        `Details\n` +
        `-------\n` +
        `- Date: ${dateStr}\n` +
        `- Time: ${timeStr}\n` +
        `- Attendees: \n\n` +
        `Agenda\n` +
        `------\n` +
        `- [ ] Item 1\n` +
        `- [ ] Item 2\n\n` +
        `Discussion & Notes\n` +
        `------------------\n` +
        `- \n\n` +
        `Action Items\n` +
        `------------\n` +
        `- [ ] Task 1 (Assigned to: )\n` +
        `- [ ] Task 2 (Assigned to: )\n`
      );
    }

    if (templateType === "daily") {
      if (isTh) {
        return (
          `บันทึกประจำวัน - ${dateStr}\n` +
          `=======================================\n\n` +
          `สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ\n` +
          `---------------------------------------\n` +
          `- \n\n` +
          `เป้าหมายสำคัญวันนี้\n` +
          `-------------------\n` +
          `- [ ] เป้าหมายที่ 1\n` +
          `- [ ] เป้าหมายที่ 2\n` +
          `- [ ] เป้าหมายที่ 3\n\n` +
          `ข้อคิด & สรุปประจำวัน\n` +
          `---------------------\n` +
          `- \n`
        );
      }
      return (
        `Daily Journal - ${dateStr}\n` +
        `=======================================\n\n` +
        `Highlights & Gratitude\n` +
        `----------------------\n` +
        `- What am I grateful for today?\n` +
        `- \n\n` +
        `Today's Priorities\n` +
        `------------------\n` +
        `- [ ] Priority 1\n` +
        `- [ ] Priority 2\n` +
        `- [ ] Priority 3\n\n` +
        `Notes & Reflections\n` +
        `-------------------\n` +
        `- \n`
      );
    }

    if (templateType === "project") {
      if (isTh) {
        return (
          `วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]\n` +
          `=======================================\n\n` +
          `ภาพรวมโปรเจกต์\n` +
          `--------------\n` +
          `- วัตถุประสงค์: \n` +
          `- กลุ่มเป้าหมาย: \n` +
          `- กำหนดการส่งมอบ: ${dateStr}\n\n` +
          `เป้าหมายหลัก (Key Objectives)\n` +
          `-----------------------------\n` +
          `- [ ] เป้าหมายที่ 1\n` +
          `- [ ] เป้าหมายที่ 2\n\n` +
          `ขั้นตอนดำเนินการ (Milestones & Timeline)\n` +
          `-----------------------------------------\n` +
          `- [ ] ระยะที่ 1: วางโครงสร้างและวางแผน\n` +
          `- [ ] ระยะที่ 2: ดำเนินการพัฒนา / สร้างสรรค์\n` +
          `- [ ] ระยะที่ 3: ทดสอบและตรวจสอบความถูกต้อง\n` +
          `- [ ] ระยะที่ 4: ปล่อยใช้งานและเปิดตัว\n\n` +
          `เครื่องมือและเทคโนโลยีที่ใช้\n` +
          `---------------------------\n` +
          `- \n\n` +
          `บันทึกเพิ่มเติม & ไอเดีย\n` +
          `-----------------------\n` +
          `- \n`
        );
      }
      return (
        `Project Planning - [Project Name]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Objective: \n` +
        `- Target Audience: \n` +
        `- Target Launch Date: ${dateStr}\n\n` +
        `Key Objectives\n` +
        `--------------\n` +
        `- [ ] Objective 1\n` +
        `- [ ] Objective 2\n\n` +
        `Milestones & Timeline\n` +
        `---------------------\n` +
        `- [ ] Phase 1: Planning & Architecture\n` +
        `- [ ] Phase 2: Implementation & Creation\n` +
        `- [ ] Phase 3: Testing & Quality Assurance\n` +
        `- [ ] Phase 4: Launch & Deployment\n\n` +
        `Tools & Technologies\n` +
        `--------------------\n` +
        `- \n\n` +
        `Additional Notes & Brainstorming\n` +
        `--------------------------------\n` +
        `- \n`
      );
    }

    if (templateType === "todo") {
      if (isTh) {
        return (
          `รายการงานที่ต้องทำ - ${dateStr}\n` +
          `=======================================\n\n` +
          `งานด่วนและสำคัญมาก (High Priority)\n` +
          `-----------------------------------\n` +
          `- [ ] งานที่ 1\n` +
          `- [ ] งานที่ 2\n\n` +
          `งานสำคัญทั่วไป (Medium Priority)\n` +
          `---------------------------------\n` +
          `- [ ] งานที่ 1\n` +
          `- [ ] งานที่ 2\n\n` +
          `งานอื่นๆ / งานตามหลัง (Low Priority)\n` +
          `------------------------------------\n` +
          `- [ ] งานที่ 1\n\n` +
          `สรุปงานเสร็จสิ้น (Completed)\n` +
          `----------------------------\n` +
          `- \n`
        );
      }
      return (
        `Task & To-Do List - ${dateStr}\n` +
        `=======================================\n\n` +
        `High Priority\n` +
        `-------------\n` +
        `- [ ] Task 1\n` +
        `- [ ] Task 2\n\n` +
        `Medium Priority\n` +
        `---------------\n` +
        `- [ ] Task 1\n` +
        `- [ ] Task 2\n\n` +
        `Low Priority\n` +
        `------------\n` +
        `- [ ] Task 1\n\n` +
        `Completed\n` +
        `---------\n` +
        `- \n`
      );
    }

    if (templateType === "study") {
      if (isTh) {
        return (
          `บันทึกการเรียนรู้ - [หัวข้อ/วิชา]\n` +
          `=======================================\n\n` +
          `ข้อมูลทั่วไป\n` +
          `------------\n` +
          `- วิชา/หัวข้อ: \n` +
          `- วันที่: ${dateStr}\n` +
          `- แหล่งอ้างอิง: \n\n` +
          `สรุปเนื้อหาสำคัญ (Key Concepts)\n` +
          `-------------------------------\n` +
          `- \n\n` +
          `รายละเอียดและคำอธิบายเพิ่มเติม\n` +
          `------------------------------\n` +
          `- \n\n` +
          `คำถามที่ต้องหาคำตอบเพิ่ม (Questions)\n` +
          `------------------------------------\n` +
          `[ ] คำถามที่ 1\n\n` +
          `สรุปความเข้าใจแบบสั้น (Takeaways)\n` +
          `---------------------------------\n` +
          `- \n`
        );
      }
      return (
        `Study & Research Notes - [Subject/Topic]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Subject/Topic: \n` +
        `- Date: ${dateStr}\n` +
        `- Source/References: \n\n` +
        `Key Concepts & Core Ideas\n` +
        `-------------------------\n` +
        `- \n\n` +
        `Detailed Notes\n` +
        `--------------\n` +
        `- \n\n` +
        `Questions to Explore Further\n` +
        `----------------------------\n` +
        `[ ] Question 1\n\n` +
        `Key Takeaways & Summary\n` +
        `-----------------------\n` +
        `- \n`
      );
    }

    if (templateType === "bug") {
      if (isTh) {
        return (
          `รายงานปัญหา / บั๊ก - [ชื่อปัญหา]\n` +
          `=======================================\n\n` +
          `รายละเอียดปัญหา (Issue Overview)\n` +
          `--------------------------------\n` +
          `- ความรุนแรง: [High / Medium / Low]\n` +
          `- สถานะ: [Open / In Progress / Resolved]\n` +
          `- วันที่พบปัญหา: ${dateStr}\n\n` +
          `อธิบายพฤติกรรมของปัญหา (Description)\n` +
          `-------------------------------------\n` +
          `- \n\n` +
          `ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)\n` +
          `---------------------------------------------\n` +
          `1. ขั้นตอนที่ 1\n` +
          `2. ขั้นตอนที่ 2\n` +
          `3. เกิดปัญหาทันที\n\n` +
          `ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง\n` +
          `-------------------------------------------\n` +
          `- ผลลัพธ์ที่คาดหวัง: \n` +
          `- ผลลัพธ์ที่เกิดขึ้นจริง: \n\n` +
          `แนวทางการแก้ไข (Proposed Fix & Action Items)\n` +
          `--------------------------------------------\n` +
          `[ ] ตรวจสอบสาเหตุ\n` +
          `[ ] ดำเนินการแก้ไขและทดสอบ\n`
        );
      }
      return (
        `Bug & Issue Report - [Issue Name]\n` +
        `=======================================\n\n` +
        `Issue Overview\n` +
        `--------------\n` +
        `- Severity: [High / Medium / Low]\n` +
        `- Status: [Open / In Progress / Resolved]\n` +
        `- Reported Date: ${dateStr}\n\n` +
        `Description\n` +
        `-----------\n` +
        `- \n\n` +
        `Steps to Reproduce\n` +
        `------------------\n` +
        `1. Step 1\n` +
        `2. Step 2\n` +
        `3. Observe issue\n\n` +
        `Expected vs Actual Behavior\n` +
        `---------------------------\n` +
        `- Expected: \n` +
        `- Actual: \n\n` +
        `Proposed Fix & Action Items\n` +
        `---------------------------\n` +
        `[ ] Investigate root cause\n` +
        `[ ] Implement fix & verify\n`
      );
    }

    if (templateType === "journal") {
      if (isTh) {
        return (
          `ไดอารี่และบันทึกประจำวัน - ${dateStr}\n` +
          `=======================================\n\n` +
          `สิ่งดีๆ & เรื่องที่รู้สึกขอบคุณวันนี้ (Highlights & Gratitude)\n` +
          `----------------------------------------------------------\n` +
          `- วันนี้มีเรื่องดีอะไรเกิดขึ้นบ้าง?\n` +
          `- บุคคลหรือเรื่องราวที่รู้สึกขอบคุณ:\n\n` +
          `บันทึกความคิด & เหตุการณ์สำคัญ (Reflections)\n` +
          `--------------------------------------------\n` +
          `- \n\n` +
          `เช็กลิสต์สุขภาพ & นิสัยประจำวัน (Habits & Wellbeing)\n` +
          `-------------------------------------------------\n` +
          `- [ ] ออกกำลังกาย / เคลื่อนไหวร่างกาย\n` +
          `- [ ] เรียนรู้ / โฟกัสงานสำคัญ\n` +
          `- [ ] พักผ่อนและดื่มน้ำเพียงพอ\n\n` +
          `เป้าหมาย & สิ่งที่จะโฟกัสในวันพรุ่งนี้ (Tomorrow's Priorities)\n` +
          `---------------------------------------------------------\n` +
          `- [ ] เป้าหมายที่ 1\n` +
          `- [ ] เป้าหมายที่ 2\n`
        );
      }
      return (
        `Daily Journal - ${dateStr}\n` +
        `=======================================\n\n` +
        `Highlights & Gratitude\n` +
        `----------------------\n` +
        `- What am I grateful for today?\n` +
        `- What went exceptionally well?\n\n` +
        `Today's Reflections & Key Events\n` +
        `--------------------------------\n` +
        `- \n\n` +
        `Habits & Wellbeing\n` +
        `------------------\n` +
        `- [ ] Exercise & Physical Movement\n` +
        `- [ ] Learning & Deep Focus\n` +
        `- [ ] Rest & Hydration\n\n` +
        `Tomorrow's Focus & Priorities\n` +
        `-----------------------------\n` +
        `- [ ] Priority 1\n` +
        `- [ ] Priority 2\n`
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
          `- \n\n` +
          `ปรับปรุง (Changed):\n` +
          `- \n\n` +
          `แก้ไขปัญหา (Fixed):\n` +
          `- \n\n\n` +
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
        `- \n\n` +
        `Changed:\n` +
        `- \n\n` +
        `Fixed:\n` +
        `- \n\n\n` +
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
          `- [ ] เป้าหมายสำคัญที่ 1\n` +
          `- [ ] เป้าหมายสำคัญที่ 2\n\n` +
          `บันทึกช่วงเวลาและงานที่ทำ (Time & Activity Log)\n` +
          `----------------------------------------------\n` +
          `- 09:00 - 10:30 : \n` +
          `- 10:30 - 12:00 : \n` +
          `- 13:00 - 15:00 : \n` +
          `- 15:00 - 17:00 : \n\n` +
          `งานที่ทำเสร็จแล้ว (Completed Tasks)\n` +
          `-----------------------------------\n` +
          `- [x] \n\n` +
          `งานที่ค้าง / ปัญหาและอุปสรรค (Blockers)\n` +
          `---------------------------------------\n` +
          `- \n\n` +
          `บันทึกเพิ่มเติมและแผนงานพรุ่งนี้ (Tomorrow's Plan)\n` +
          `-----------------------------------------------\n` +
          `- \n`
        );
      }
      return (
        `Work Log - ${dateStr}\n` +
        `=======================================\n\n` +
        `Summary of Goals for Today\n` +
        `--------------------------\n` +
        `- [ ] Primary Goal 1\n` +
        `- [ ] Primary Goal 2\n\n` +
        `Time & Activity Log\n` +
        `-------------------\n` +
        `- 09:00 - 10:30 : \n` +
        `- 10:30 - 12:00 : \n` +
        `- 13:00 - 15:00 : \n` +
        `- 15:00 - 17:00 : \n\n` +
        `Completed Tasks\n` +
        `---------------\n` +
        `- [x] \n\n` +
        `Pending & Blockers\n` +
        `------------------\n` +
        `- \n\n` +
        `Notes & Tomorrow's Plan\n` +
        `-----------------------\n` +
        `- \n`
      );
    }

    if (templateType === "lecture-notes") {
      if (isTh) {
        return (
          `บันทึกการเรียน / เลกเชอร์ - [ชื่อวิชา]\n` +
          `=======================================\n\n` +
          `ข้อมูลวิชาและการเรียน\n` +
          `--------------------\n` +
          `- วิชา: \n` +
          `- วันที่: ${dateStr}\n` +
          `- อาจารย์ผู้สอน: \n` +
          `- หัวข้อการบรรยาย: \n\n` +
          `ประเด็นสำคัญประจำคาบ (Key Concepts)\n` +
          `-----------------------------------\n` +
          `- \n\n` +
          `เนื้อหาและบันทึกรายละเอียด (Lecture Notes)\n` +
          `-----------------------------------------\n` +
          `- \n\n` +
          `คำถาม / สิ่งที่ต้องทบทวนเพิ่มเติม (Questions & Follow-ups)\n` +
          `---------------------------------------------------------\n` +
          `[ ] คำถามที่ 1\n` +
          `[ ] การบ้าน / งานที่ต้องส่ง (กำหนดส่ง: )\n\n` +
          `สรุปความเข้าใจใน 2 ประโยค (Summary)\n` +
          `-----------------------------------\n` +
          `- \n`
        );
      }
      return (
        `Lecture Notes - [Course Name]\n` +
        `=======================================\n\n` +
        `Course & Lecture Info\n` +
        `---------------------\n` +
        `- Course: \n` +
        `- Date: ${dateStr}\n` +
        `- Instructor/Professor: \n` +
        `- Topic: \n\n` +
        `Key Concepts & Takeaways\n` +
        `------------------------\n` +
        `- \n\n` +
        `Detailed Notes\n` +
        `--------------\n` +
        `- \n\n` +
        `Questions & Follow-ups\n` +
        `----------------------\n` +
        `[ ] Question 1\n` +
        `[ ] Assignment / Homework (Due: )\n\n` +
        `Summary in 2 Sentences\n` +
        `----------------------\n` +
        `- \n`
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
          `- Server Name: [Host / IP]\n` +
          `- Environment: [Production / Staging / Dev]\n` +
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
          `DATABASE_URL=postgres://user:password@localhost:5432/dbname\n\n` +
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
        `- Host / IP: [Host Name / IP]\n` +
        `- Environment: [Production / Staging / Dev]\n` +
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
        `DATABASE_URL=postgres://user:password@localhost:5432/dbname\n\n` +
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
          `- รหัสเหตุการณ์: INC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}\n` +
          `- วันที่เกิดเหตุ: ${dateStr}\n` +
          `- ระดับความรุนแรง: [P1 - Critical / P2 - High / P3 - Moderate]\n` +
          `- ระยะเวลาขัดข้อง: [เช่น 45 นาที]\n` +
          `- ผู้รับผิดชอบหลัก: \n\n` +
          `สรุปผลกระทบ (Impact Summary)\n` +
          `----------------------------\n` +
          `- จำนวนผู้ใช้ที่ได้รับผลกระทบ:\n` +
          `- บริการที่หยุดชะงัก:\n\n` +
          `ลำดับเหตุการณ์ตามเวลา (Timeline of Events)\n` +
          `-----------------------------------------\n` +
          `- ${timeStr} : ตรวจพบการแจ้งเตือนจากระบบ Monitoring\n` +
          `- [เวลา] : ทีมวิศวกรเริ่มตรวจสอบและหาสาเหตุ\n` +
          `- [เวลา] : ปล่อยแพตช์แก้ไขและบริการกลับมาเป็นปกติ\n\n` +
          `สาเหตุต้นตอ (Root Cause Analysis - RCA)\n` +
          `---------------------------------------\n` +
          `- \n\n` +
          `มาตรการแก้ไขและป้องกันในอนาคต (Action Items & Prevention)\n` +
          `---------------------------------------------------------\n` +
          `- [ ] เพิ่มระบบแจ้งเตือน (Alerting) ให้ครอบคลุม\n` +
          `- [ ] ปรับปรุง Automated Test Case เพื่อดักจับปัญหานี้\n` +
          `- [ ] อัปเดตเอกสารคู่มือการแก้ไขปัญหา (Runbook)\n`
        );
      }
      return (
        `=======================================\n` +
        `INCIDENT POSTMORTEM & ROOT CAUSE REPORT\n` +
        `=======================================\n\n` +
        `Incident Overview\n` +
        `-----------------\n` +
        `- Incident ID: INC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}\n` +
        `- Date: ${dateStr}\n` +
        `- Severity: [P1 - Critical / P2 - Major / P3 - Minor]\n` +
        `- Total Downtime: [e.g. 45 minutes]\n` +
        `- Incident Lead: \n\n` +
        `Impact Summary\n` +
        `--------------\n` +
        `- Affected users:\n` +
        `- Disrupted services:\n\n` +
        `Timeline\n` +
        `--------\n` +
        `- ${timeStr} : Alert triggered by monitoring system\n` +
        `- [Time] : Engineering team began triage & investigation\n` +
        `- [Time] : Mitigation deployed, service restored to normal\n\n` +
        `Root Cause Analysis (RCA)\n` +
        `-------------------------\n` +
        `- \n\n` +
        `Action Items & Prevention\n` +
        `-------------------------\n` +
        `- [ ] Implement automated monitoring and alerting for this metric\n` +
        `- [ ] Add regression test suite covering this edge case\n` +
        `- [ ] Update operational runbook documentation\n`
      );
    }

    if (templateType === "shopping-list") {
      if (isTh) {
        return (
          `รายการซื้อของและของใช้ - ${dateStr}\n` +
          `=======================================\n\n` +
          `ของสดและวัตถุดิบทำอาหาร (Fresh Produce & Groceries)\n` +
          `--------------------------------------------------\n` +
          `- [ ] ผักสดและผลไม้:\n` +
          `- [ ] เนื้อสัตว์ / ไข่ไก่ / นม:\n` +
          `- [ ] เครื่องปรุงและวัตถุดิบ:\n\n` +
          `ของใช้ส่วนตัวและในบ้าน (Household & Essentials)\n` +
          `----------------------------------------------\n` +
          `- [ ] กระดาษชำระ / สบู่ / ยาสระผม:\n` +
          `- [ ] น้ำยาซักผ้าและทำความสะอาด:\n\n` +
          `อุปกรณ์การเรียนและทำงาน (Office & Stationery)\n` +
          `---------------------------------------------\n` +
          `- [ ] \n\n` +
          `งบประมาณและบันทึกเพิ่มเติม (Budget & Notes)\n` +
          `------------------------------------------\n` +
          `- งบประมาณโดยประมาณ: \n` +
          `- ร้านค้า / พิกัด: \n`
        );
      }
      return (
        `Shopping & Grocery List - ${dateStr}\n` +
        `=======================================\n\n` +
        `Produce & Groceries\n` +
        `-------------------\n` +
        `- [ ] Fresh Vegetables & Fruits:\n` +
        `- [ ] Dairy, Eggs & Meat:\n` +
        `- [ ] Pantry & Ingredients:\n\n` +
        `Household & Personal Care\n` +
        `-------------------------\n` +
        `- [ ] Toiletries & Paper Goods:\n` +
        `- [ ] Cleaning & Laundry Supplies:\n\n` +
        `Office & Tech Supplies\n` +
        `----------------------\n` +
        `- [ ] \n\n` +
        `Budget & Notes\n` +
        `--------------\n` +
        `- Estimated Budget: \n` +
        `- Target Store/Location: \n`
      );
    }

    if (templateType === "recipe-txt") {
      if (isTh) {
        return (
          `สูตรอาหาร: [ชื่อเมนูอาหาร]\n` +
          `=======================================\n\n` +
          `ข้อมูลเมนูอาหาร\n` +
          `---------------\n` +
          `- เวลาเตรียม: 15 นาที\n` +
          `- เวลาปรุง: 20 นาที\n` +
          `- สำหรับ: 2-3 ที่\n` +
          `- ระดับความยาก: [ง่าย / ปานกลาง / ยาก]\n\n` +
          `วัตถุดิบและส่วนผสม (Ingredients)\n` +
          `-------------------------------\n` +
          `- [ ] วัตถุดิบหลัก:\n` +
          `- [ ] เครื่องปรุงรส:\n` +
          `- [ ] ผักและเครื่องเคียง:\n\n` +
          `ขั้นตอนการทำ (Step-by-Step Instructions)\n` +
          `----------------------------------------\n` +
          `1. ขั้นตอนที่ 1: เตรียมวัตถุดิบและล้างให้สะอาด\n` +
          `2. ขั้นตอนที่ 2: ตั้งไฟและเริ่มผัด/ปรุง\n` +
          `3. ขั้นตอนที่ 3: ปรุงรสตามชอบและจัดเสิร์ฟ\n\n` +
          `เคล็ดลับความอร่อย (Chef's Tips)\n` +
          `------------------------------\n` +
          `- \n`
        );
      }
      return (
        `Recipe: [Dish Name]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Prep Time: 15 mins\n` +
        `- Cook Time: 20 mins\n` +
        `- Servings: 2-3 portions\n` +
        `- Difficulty: [Easy / Medium / Hard]\n\n` +
        `Ingredients\n` +
        `-----------\n` +
        `- [ ] Main Ingredients:\n` +
        `- [ ] Seasonings & Sauces:\n` +
        `- [ ] Garnish & Sides:\n\n` +
        `Instructions\n` +
        `------------\n` +
        `1. Step 1: Prep and wash all ingredients\n` +
        `2. Step 2: Heat pan/pot and cook aromatics\n` +
        `3. Step 3: Combine and simmer to perfection\n` +
        `4. Step 4: Plate and serve hot\n\n` +
        `Chef's Notes & Tips\n` +
        `-------------------\n` +
        `- \n`
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
        `      <a href="#" class="brand">My Website</a>\n` +
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
        `      <a href="#" class="logo">BrandName</a>\n` +
        `      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">\n` +
        `        <svg id="iconMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `        <svg id="iconClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `      </button>\n` +
        `      <div class="nav-links" id="navMenu">\n` +
        `        <a href="#features">Features</a>\n` +
        `        <a href="#about">About</a>\n` +
        `        <a href="#pricing">Pricing</a>\n` +
        `        <a href="#get-started" class="btn">Get Started</a>\n` +
        `      </div>\n` +
        `    </header>\n\n` +
        `    <section class="hero">\n` +
        `      <h1>Build something amazing with our platform</h1>\n` +
        `      <p>The all-in-one solution designed to help your team work faster, smarter, and achieve better results.</p>\n` +
        `      <a href="#cta" class="btn">Start Free Trial</a>\n` +
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
        `      <a href="#" class="brand">My Portfolio</a>\n` +
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
        `    <header class="profile">\n` +
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
        `            <a href="#" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 0.9rem;">View Project &rarr;</a>\n` +
        `          </div>\n` +
        `        </div>\n` +
        `        <div class="project-card">\n` +
        `          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80" alt="Project Two">\n` +
        `          <div class="project-info">\n` +
        `            <h3>Project Two</h3>\n` +
        `            <p>Interactive dashboard UI kit built with modern web components and data charts.</p>\n` +
        `            <a href="#" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 0.9rem;">View Project &rarr;</a>\n` +
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
        `    <footer id="contact">\n` +
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
        `      <a href="#" class="brand">My Blog</a>\n` +
        `      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">\n` +
        `        <svg id="iconMenu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n` +
        `        <svg id="iconClose" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n` +
        `      </button>\n` +
        `      <nav id="navMenu">\n` +
        `        <a href="#">Articles</a>\n` +
        `        <a href="#">Tech</a>\n` +
        `        <a href="#">Design</a>\n` +
        `        <a href="#">Newsletter</a>\n` +
        `      </nav>\n` +
        `    </div>\n` +
        `  </div>\n\n` +
        `  <div class="container">\n` +
        `    <header>\n` +
        `      <div class="category">Technology & Design</div>\n` +
        `      <h1>The Future of Web Development and Design</h1>\n` +
        `      <div class="meta">By Author Name &bull; Published on ${dateStr} &bull; 5 min read</div>\n` +
        `    </header>\n\n` +
        `    <article class="article-body">\n` +
        `      <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80" alt="Featured Cover" class="featured-img">\n` +
        `      <p>The landscape of modern web development continues to evolve rapidly. From AI-assisted tools to hyper-optimized browser rendering engines, developers now have more powerful tools than ever before.</p>\n\n` +
        `      <h2>Embracing Simplicity and Performance</h2>\n` +
        `      <p>While frameworks come and go, fundamental principles of good software engineering remain unchanged. Fast load times, clean semantics, and accessible user interfaces create the best experience for everyone.</p>\n\n` +
        `      <blockquote>"Simplicity is the prerequisite for reliability." &mdash; Edsger W. Dijkstra</blockquote>\n\n` +
        `      <p>As we look forward, the focus shifts toward sustainable architecture, lightweight tooling, and delightful user interactions.</p>\n` +
        `    </article>\n\n` +
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
        `      <a href="#" class="active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> Overview</a>\n` +
        `      <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Customers</a>\n` +
        `      <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Products</a>\n` +
        `      <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Analytics</a>\n` +
        `      <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Settings</a>\n` +
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
        `      <a href="#" class="active">Overview & Installation</a>\n` +
        `      <a href="#">Configuration</a>\n` +
        `      <h3>Guides</h3>\n` +
        `      <a href="#">Authentication</a>\n` +
        `      <a href="#">API Endpoints</a>\n` +
        `      <a href="#">Deployment</a>\n` +
        `    </aside>\n` +
        `    <main>\n` +
        `      <h1>Getting Started</h1>\n` +
        `      <p class="lead">Everything you need to integrate and build with our modern API.</p>\n` +
        `      <h2>Quick Install</h2>\n` +
        `      <pre>npm install @app/core --save</pre>\n` +
        `      <div class="callout">\n` +
        `        <strong>Tip:</strong> Make sure you are using Node.js version 18 or higher for full LTS support.\n` +
        `      </div>\n` +
        `      <h2>API Endpoints</h2>\n` +
        `      <div class="table-responsive">\n` +
        `        <table>\n` +
        `          <thead>\n` +
        `            <tr>\n` +
        `              <th>Method</th>\n` +
        `              <th>Endpoint</th>\n` +
        `              <th>Description</th>\n` +
        `            </tr>\n` +
        `          </thead>\n` +
        `          <tbody>\n` +
        `            <tr>\n` +
        `              <td><code>GET</code></td>\n` +
        `              <td>/api/v1/notes</td>\n` +
        `              <td>Retrieve all user notes</td>\n` +
        `            </tr>\n` +
        `            <tr>\n` +
        `              <td><code>POST</code></td>\n` +
        `              <td>/api/v1/notes</td>\n` +
        `              <td>Create a new note entry</td>\n` +
        `            </tr>\n` +
        `          </tbody>\n` +
        `        </table>\n` +
        `      </div>\n` +
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
        `      <a href="#" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>\n` +
        `        Visit My Portfolio Website\n` +
        `      </a>\n` +
        `      <a href="#" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>\n` +
        `        Read My Latest Blog Articles\n` +
        `      </a>\n` +
        `      <a href="#" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>\n` +
        `        Check Out My Recent Project\n` +
        `      </a>\n` +
        `      <a href="#" class="link-card">\n` +
        `        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>\n` +
        `        Join My Weekly Newsletter\n` +
        `      </a>\n` +
        `    </div>\n` +
        `    <div class="socials">\n` +
        `      <a href="#" class="social-btn" title="Twitter / X">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>\n` +
        `      </a>\n` +
        `      <a href="#" class="social-btn" title="GitHub">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>\n` +
        `      </a>\n` +
        `      <a href="#" class="social-btn" title="LinkedIn">\n` +
        `        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>\n` +
        `      </a>\n` +
        `      <a href="#" class="social-btn" title="YouTube">\n` +
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
        `  <div class="container">\n` +
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
        `        <a href="#" class="btn btn-outline">Get Started Free</a>\n` +
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
        `        <a href="#" class="btn btn-primary">Start 14-Day Free Trial</a>\n` +
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
        `        <a href="#" class="btn btn-outline">Contact Sales</a>\n` +
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
          `  <li><strong>ผู้เข้าร่วม:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>วาระการประชุม</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> วาระที่ 1</li>\n` +
          `  <li><input type="checkbox"> วาระที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>สรุปการพูดคุย & บันทึก</h2>\n` +
          `<p></p>\n` +
          `<h2>งานที่ต้องทำต่อ (Action Items)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1 (ผู้รับผิดชอบ: )</li>\n` +
          `  <li><input type="checkbox"> งานที่ 2 (ผู้รับผิดชอบ: )</li>\n` +
          `</ul>`
        : `<h1>Meeting Notes - ${dateStr}</h1>\n` +
          `<h2>Details</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Date:</strong> ${dateStr}</li>\n` +
          `  <li><strong>Time:</strong> ${timeStr}</li>\n` +
          `  <li><strong>Attendees:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>Agenda</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Item 1</li>\n` +
          `  <li><input type="checkbox"> Item 2</li>\n` +
          `</ul>\n` +
          `<h2>Discussion & Notes</h2>\n` +
          `<p></p>\n` +
          `<h2>Action Items</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1 (Assigned to: )</li>\n` +
          `  <li><input type="checkbox"> Task 2 (Assigned to: )</li>\n` +
          `</ul>`;
    } else if (templateType === "daily") {
      title = isTh ? `บันทึกประจำวัน - ${dateStr}` : `Daily Journal - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>บันทึกประจำวัน - ${dateStr}</h1>\n` +
          `<h2>สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ</h2>\n` +
          `<p></p>\n` +
          `<h2>เป้าหมายสำคัญวันนี้</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 1</li>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 2</li>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 3</li>\n` +
          `</ul>\n` +
          `<h2>ข้อคิด & สรุปประจำวัน</h2>\n` +
          `<p></p>`
        : `<h1>Daily Journal - ${dateStr}</h1>\n` +
          `<h2>Highlights & Gratitude</h2>\n` +
          `<p></p>\n` +
          `<h2>Today's Priorities</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Priority 1</li>\n` +
          `  <li><input type="checkbox"> Priority 2</li>\n` +
          `  <li><input type="checkbox"> Priority 3</li>\n` +
          `</ul>\n` +
          `<h2>Notes & Reflections</h2>\n` +
          `<p></p>`;
    } else if (templateType === "project") {
      title = isTh ? `วางแผนโปรเจกต์` : `Project Planning`;
      bodyContent = isTh
        ? `<h1>วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]</h1>\n` +
          `<h2>ภาพรวมโปรเจกต์</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วัตถุประสงค์:</strong> </li>\n` +
          `  <li><strong>กลุ่มเป้าหมาย:</strong> </li>\n` +
          `  <li><strong>กำหนดการส่งมอบ:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>เป้าหมายหลัก (Key Objectives)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 1</li>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>ขั้นตอนดำเนินการ (Milestones & Timeline)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> ระยะที่ 1: วางโครงสร้างและวางแผน</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 2: ดำเนินการพัฒนา / สร้างสรรค์</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 3: ทดสอบและตรวจสอบความถูกต้อง</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 4: ปล่อยใช้งานและเปิดตัว</li>\n` +
          `</ul>\n` +
          `<h2>เครื่องมือและเทคโนโลยีที่ใช้</h2>\n` +
          `<p></p>\n` +
          `<h2>บันทึกเพิ่มเติม & ไอเดีย</h2>\n` +
          `<p></p>`
        : `<h1>Project Planning - [Project Name]</h1>\n` +
          `<h2>Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Objective:</strong> </li>\n` +
          `  <li><strong>Target Audience:</strong> </li>\n` +
          `  <li><strong>Target Launch Date:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>Key Objectives</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Objective 1</li>\n` +
          `  <li><input type="checkbox"> Objective 2</li>\n` +
          `</ul>\n` +
          `<h2>Milestones & Timeline</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Phase 1: Planning & Architecture</li>\n` +
          `  <li><input type="checkbox"> Phase 2: Implementation & Creation</li>\n` +
          `  <li><input type="checkbox"> Phase 3: Testing & Quality Assurance</li>\n` +
          `  <li><input type="checkbox"> Phase 4: Launch & Deployment</li>\n` +
          `</ul>\n` +
          `<h2>Tools & Technologies</h2>\n` +
          `<p></p>\n` +
          `<h2>Additional Notes & Brainstorming</h2>\n` +
          `<p></p>`;
    } else if (templateType === "todo") {
      title = isTh ? `รายการงานที่ต้องทำ - ${dateStr}` : `Task & To-Do List - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>รายการงานที่ต้องทำ - ${dateStr}</h1>\n` +
          `<h2>งานด่วนและสำคัญมาก (High Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1</li>\n` +
          `  <li><input type="checkbox"> งานที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>งานสำคัญทั่วไป (Medium Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1</li>\n` +
          `  <li><input type="checkbox"> งานที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>งานอื่นๆ / งานตามหลัง (Low Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1</li>\n` +
          `</ul>\n` +
          `<h2>สรุปงานเสร็จสิ้น (Completed)</h2>\n` +
          `<p></p>`
        : `<h1>Task & To-Do List - ${dateStr}</h1>\n` +
          `<h2>High Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1</li>\n` +
          `  <li><input type="checkbox"> Task 2</li>\n` +
          `</ul>\n` +
          `<h2>Medium Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1</li>\n` +
          `  <li><input type="checkbox"> Task 2</li>\n` +
          `</ul>\n` +
          `<h2>Low Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1</li>\n` +
          `</ul>\n` +
          `<h2>Completed</h2>\n` +
          `<p></p>`;
    } else if (templateType === "study") {
      title = isTh ? `บันทึกการเรียนรู้` : `Study & Research Notes`;
      bodyContent = isTh
        ? `<h1>บันทึกการเรียนรู้ - [หัวข้อ/วิชา]</h1>\n` +
          `<h2>ข้อมูลทั่วไป</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วิชา/หัวข้อ:</strong> </li>\n` +
          `  <li><strong>วันที่:</strong> ${dateStr}</li>\n` +
          `  <li><strong>แหล่งอ้างอิง:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>สรุปเนื้อหาสำคัญ (Key Concepts)</h2>\n` +
          `<p></p>\n` +
          `<h2>รายละเอียดและคำอธิบายเพิ่มเติม</h2>\n` +
          `<p></p>\n` +
          `<h2>คำถามที่ต้องหาคำตอบเพิ่ม (Questions)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> คำถามที่ 1</li>\n` +
          `</ul>\n` +
          `<h2>สรุปความเข้าใจแบบสั้น (Takeaways)</h2>\n` +
          `<p></p>`
        : `<h1>Study & Research Notes - [Subject/Topic]</h1>\n` +
          `<h2>Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Subject/Topic:</strong> </li>\n` +
          `  <li><strong>Date:</strong> ${dateStr}</li>\n` +
          `  <li><strong>Source/References:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>Key Concepts & Core Ideas</h2>\n` +
          `<p></p>\n` +
          `<h2>Detailed Notes</h2>\n` +
          `<p></p>\n` +
          `<h2>Questions to Explore Further</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Question 1</li>\n` +
          `</ul>\n` +
          `<h2>Key Takeaways & Summary</h2>\n` +
          `<p></p>`;
    } else if (templateType === "bug") {
      title = isTh ? `รายงานปัญหา / บั๊ก` : `Bug & Issue Report`;
      bodyContent = isTh
        ? `<h1>รายงานปัญหา / บั๊ก - [ชื่อปัญหา]</h1>\n` +
          `<h2>รายละเอียดปัญหา (Issue Overview)</h2>\n` +
          `<ul>\n` +
          `  <li><strong>ความรุนแรง:</strong> [High / Medium / Low]</li>\n` +
          `  <li><strong>สถานะ:</strong> [Open / In Progress / Resolved]</li>\n` +
          `  <li><strong>วันที่พบปัญหา:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>อธิบายพฤติกรรมของปัญหา (Description)</h2>\n` +
          `<p></p>\n` +
          `<h2>ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)</h2>\n` +
          `<ol>\n` +
          `  <li>ขั้นตอนที่ 1</li>\n` +
          `  <li>ขั้นตอนที่ 2</li>\n` +
          `  <li>เกิดปัญหาทันที</li>\n` +
          `</ol>\n` +
          `<h2>ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง</h2>\n` +
          `<ul>\n` +
          `  <li><strong>ผลลัพธ์ที่คาดหวัง:</strong> </li>\n` +
          `  <li><strong>ผลลัพธ์ที่เกิดขึ้นจริง:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>แนวทางการแก้ไข (Proposed Fix & Action Items)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> ตรวจสอบสาเหตุ</li>\n` +
          `  <li><input type="checkbox"> ดำเนินการแก้ไขและทดสอบ</li>\n` +
          `</ul>`
        : `<h1>Bug & Issue Report - [Issue Name]</h1>\n` +
          `<h2>Issue Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Severity:</strong> [High / Medium / Low]</li>\n` +
          `  <li><strong>Status:</strong> [Open / In Progress / Resolved]</li>\n` +
          `  <li><strong>Reported Date:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>Description</h2>\n` +
          `<p></p>\n` +
          `<h2>Steps to Reproduce</h2>\n` +
          `<ol>\n` +
          `  <li>Step 1</li>\n` +
          `  <li>Step 2</li>\n` +
          `  <li>Observe issue</li>\n` +
          `</ol>\n` +
          `<h2>Expected vs Actual Behavior</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Expected:</strong> </li>\n` +
          `  <li><strong>Actual:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>Proposed Fix & Action Items</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Investigate root cause</li>\n` +
          `  <li><input type="checkbox"> Implement fix & verify</li>\n` +
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
        `## รายละเอียด\n` +
        `- **วันที่:** ${dateStr}\n` +
        `- **เวลา:** ${timeStr}\n` +
        `- **ผู้เข้าร่วม:** \n\n` +
        `## วาระการประชุม\n` +
        `- [ ] วาระที่ 1\n` +
        `- [ ] วาระที่ 2\n\n` +
        `## สรุปการพูดคุย & บันทึก\n` +
        `- \n\n` +
        `## งานที่ต้องทำต่อ (Action Items)\n` +
        `- [ ] งานที่ 1 (ผู้รับผิดชอบ: )\n` +
        `- [ ] งานที่ 2 (ผู้รับผิดชอบ: )\n`
      );
    } else {
      rawMarkdown = (
        `# Meeting Notes - ${dateStr}\n\n` +
        `## Details\n` +
        `- **Date:** ${dateStr}\n` +
        `- **Time:** ${timeStr}\n` +
        `- **Attendees:** \n\n` +
        `## Agenda\n` +
        `- [ ] Item 1\n` +
        `- [ ] Item 2\n\n` +
        `## Discussion & Notes\n` +
        `- \n\n` +
        `## Action Items\n` +
        `- [ ] Task 1 (Assigned to: )\n` +
        `- [ ] Task 2 (Assigned to: )\n`
      );
    }
  } else if (templateType === "daily") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกประจำวัน - ${dateStr}\n\n` +
        `## สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ\n` +
        `- \n\n` +
        `## เป้าหมายสำคัญวันนี้\n` +
        `- [ ] เป้าหมายที่ 1\n` +
        `- [ ] เป้าหมายที่ 2\n` +
        `- [ ] เป้าหมายที่ 3\n\n` +
        `## ข้อคิด & สรุปประจำวัน\n` +
        `- \n`
      );
    } else {
      rawMarkdown = (
        `# Daily Journal - ${dateStr}\n\n` +
        `## Highlights & Gratitude\n` +
        `- What am I grateful for today?\n` +
        `- \n\n` +
        `## Today's Priorities\n` +
        `- [ ] Priority 1\n` +
        `- [ ] Priority 2\n` +
        `- [ ] Priority 3\n\n` +
        `## Notes & Reflections\n` +
        `- \n`
      );
    }
  } else if (templateType === "project") {
    if (isTh) {
      rawMarkdown = (
        `# วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]\n\n` +
        `## ภาพรวมโปรเจกต์\n` +
        `- **วัตถุประสงค์:** \n` +
        `- **กลุ่มเป้าหมาย:** \n` +
        `- **กำหนดการส่งมอบ:** ${dateStr}\n\n` +
        `## เป้าหมายหลัก (Key Objectives)\n` +
        `- [ ] เป้าหมายที่ 1\n` +
        `- [ ] เป้าหมายที่ 2\n\n` +
        `## ขั้นตอนดำเนินการ (Milestones & Timeline)\n` +
        `- [ ] ระยะที่ 1: วางโครงสร้างและวางแผน\n` +
        `- [ ] ระยะที่ 2: ดำเนินการพัฒนา / สร้างสรรค์\n` +
        `- [ ] ระยะที่ 3: ทดสอบและตรวจสอบความถูกต้อง\n` +
        `- [ ] ระยะที่ 4: ปล่อยใช้งานและเปิดตัว\n\n` +
        `## เครื่องมือและเทคโนโลยีที่ใช้\n` +
        `- \n\n` +
        `## บันทึกเพิ่มเติม & ไอเดีย\n` +
        `- \n`
      );
    } else {
      rawMarkdown = (
        `# Project Planning - [Project Name]\n\n` +
        `## Overview\n` +
        `- **Objective:** \n` +
        `- **Target Audience:** \n` +
        `- **Target Launch Date:** ${dateStr}\n\n` +
        `## Key Objectives\n` +
        `- [ ] Objective 1\n` +
        `- [ ] Objective 2\n\n` +
        `## Milestones & Timeline\n` +
        `- [ ] Phase 1: Planning & Architecture\n` +
        `- [ ] Phase 2: Implementation & Creation\n` +
        `- [ ] Phase 3: Testing & Quality Assurance\n` +
        `- [ ] Phase 4: Launch & Deployment\n\n` +
        `## Tools & Technologies\n` +
        `- \n\n` +
        `## Additional Notes & Brainstorming\n` +
        `- \n`
      );
    }
  } else if (templateType === "todo") {
    if (isTh) {
      rawMarkdown = (
        `# รายการงานที่ต้องทำ - ${dateStr}\n\n` +
        `## งานด่วนและสำคัญมาก (High Priority)\n` +
        `- [ ] งานที่ 1\n` +
        `- [ ] งานที่ 2\n\n` +
        `## งานสำคัญทั่วไป (Medium Priority)\n` +
        `- [ ] งานที่ 1\n` +
        `- [ ] งานที่ 2\n\n` +
        `## งานอื่นๆ / งานตามหลัง (Low Priority)\n` +
        `- [ ] งานที่ 1\n\n` +
        `## สรุปงานเสร็จสิ้น (Completed)\n` +
        `- \n`
      );
    } else {
      rawMarkdown = (
        `# Task & To-Do List - ${dateStr}\n\n` +
        `## High Priority\n` +
        `- [ ] Task 1\n` +
        `- [ ] Task 2\n\n` +
        `## Medium Priority\n` +
        `- [ ] Task 1\n` +
        `- [ ] Task 2\n\n` +
        `## Low Priority\n` +
        `- [ ] Task 1\n\n` +
        `## Completed\n` +
        `- \n`
      );
    }
  } else if (templateType === "study") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกการเรียนรู้ - [หัวข้อ/วิชา]\n\n` +
        `## ข้อมูลทั่วไป\n` +
        `- **วิชา/หัวข้อ:** \n` +
        `- **วันที่:** ${dateStr}\n` +
        `- **แหล่งอ้างอิง:** \n\n` +
        `## สรุปเนื้อหาสำคัญ (Key Concepts)\n` +
        `- \n\n` +
        `## รายละเอียดและคำอธิบายเพิ่มเติม\n` +
        `- \n\n` +
        `## คำถามที่ต้องหาคำตอบเพิ่ม (Questions)\n` +
        `- [ ] คำถามที่ 1\n\n` +
        `## สรุปความเข้าใจแบบสั้น (Takeaways)\n` +
        `- \n`
      );
    } else {
      rawMarkdown = (
        `# Study & Research Notes - [Subject/Topic]\n\n` +
        `## Overview\n` +
        `- **Subject/Topic:** \n` +
        `- **Date:** ${dateStr}\n` +
        `- **Source/References:** \n\n` +
        `## Key Concepts & Core Ideas\n` +
        `- \n\n` +
        `## Detailed Notes\n` +
        `- \n\n` +
        `## Questions to Explore Further\n` +
        `- [ ] Question 1\n\n` +
        `## Key Takeaways & Summary\n` +
        `- \n`
      );
    }
  } else if (templateType === "bug") {
    if (isTh) {
      rawMarkdown = (
        `# รายงานปัญหา / บั๊ก - [ชื่อปัญหา]\n\n` +
        `## รายละเอียดปัญหา (Issue Overview)\n` +
        `- **ความรุนแรง:** [High / Medium / Low]\n` +
        `- **สถานะ:** [Open / In Progress / Resolved]\n` +
        `- **วันที่พบปัญหา:** ${dateStr}\n\n` +
        `## อธิบายพฤติกรรมของปัญหา (Description)\n` +
        `- \n\n` +
        `## ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)\n` +
        `1. ขั้นตอนที่ 1\n` +
        `2. ขั้นตอนที่ 2\n` +
        `3. เกิดปัญหาทันที\n\n` +
        `## ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง\n` +
        `- **ผลลัพธ์ที่คาดหวัง:** \n` +
        `- **ผลลัพธ์ที่เกิดขึ้นจริง:** \n\n` +
        `## แนวทางการแก้ไข (Proposed Fix & Action Items)\n` +
        `- [ ] ตรวจสอบสาเหตุ\n` +
        `- [ ] ดำเนินการแก้ไขและทดสอบ\n`
      );
    } else {
      rawMarkdown = (
        `# Bug & Issue Report - [Issue Name]\n\n` +
        `## Issue Overview\n` +
        `- **Severity:** [High / Medium / Low]\n` +
        `- **Status:** [Open / In Progress / Resolved]\n` +
        `- **Reported Date:** ${dateStr}\n\n` +
        `## Description\n` +
        `- \n\n` +
        `## Steps to Reproduce\n` +
        `1. Step 1\n` +
        `2. Step 2\n` +
        `3. Observe issue\n\n` +
        `## Expected vs Actual Behavior\n` +
        `- **Expected:** \n` +
        `- **Actual:** \n\n` +
        `## Proposed Fix & Action Items\n` +
        `- [ ] Investigate root cause\n` +
        `- [ ] Implement fix & verify\n`
      );
    }
  } else if (templateType === "weekly-review") {
    if (isTh) {
      rawMarkdown = (
        `# สรุปประจำสัปดาห์ (Weekly Review) - ${dateStr}\n\n` +
        `## ผลงานและความสำเร็จในสัปดาห์นี้ (Wins & Highlights)\n` +
        `- [x] \n` +
        `- [ ] \n\n` +
        `## ทบทวนเป้าหมายและความคืบหน้า (Goal Review & Metrics)\n` +
        `- **เป้าหมายที่สำเร็จตามแผน:** \n` +
        `- **สิ่งที่ทำได้ดีเป็นพิเศษ:** \n` +
        `- **ปัญหาหรือจุดที่ต้องปรับปรุง:** \n\n` +
        `## บทเรียนและข้อคิดที่ได้ (Lessons & Insights)\n` +
        `- \n\n` +
        `## เป้าหมายสำคัญ 3 ข้อสำหรับสัปดาห์หน้า (Next Week's Big 3)\n` +
        `1. [ ] \n` +
        `2. [ ] \n` +
        `3. [ ] \n\n` +
        `## เช็กลิสต์การเตรียมตัวสำหรับสัปดาห์หน้า\n` +
        `- [ ] เคลียร์กล่องข้อความและงานตกค้าง\n` +
        `- [ ] จัดตารางนัดหมายและวางแผนปฏิทิน\n` +
        `- [ ] จัดระเบียบโต๊ะทำงานและโฟลเดอร์ไฟล์\n`
      );
    } else {
      rawMarkdown = (
        `# Weekly Review - ${dateStr}\n\n` +
        `## Wins & Highlights\n` +
        `- [x] \n` +
        `- [ ] \n\n` +
        `## Goal Progress & Key Metrics\n` +
        `- **Completed Objectives:** \n` +
        `- **What went well:** \n` +
        `- **Challenges & Roadblocks:** \n\n` +
        `## Lessons & Insights\n` +
        `- \n\n` +
        `## Top 3 Priorities for Next Week (The Big 3)\n` +
        `1. [ ] \n` +
        `2. [ ] \n` +
        `3. [ ] \n\n` +
        `## Weekly Reset & Preparation Checklist\n` +
        `- [ ] Clear inbox & pending messages\n` +
        `- [ ] Review calendar & upcoming deadlines\n` +
        `- [ ] Organize workspace and files\n`
      );
    }
  } else if (templateType === "book-notes") {
    if (isTh) {
      rawMarkdown = (
        `# สรุปหนังสือ: [ชื่อหนังสือ]\n\n` +
        `## ข้อมูลหนังสือ (Book Details)\n` +
        `- **ผู้เขียน (Author):** \n` +
        `- **คะแนนความประทับใจ:** ⭐⭐⭐⭐⭐\n` +
        `- **วันที่อ่านจบ:** ${dateStr}\n` +
        `- **หมวดหมู่ / แท็ก:** #reading #book-notes\n\n` +
        `## สรุปใจความสำคัญใน 3 ประโยค (3-Sentence Summary)\n` +
        `1. \n` +
        `2. \n` +
        `3. \n\n` +
        `## สาระสำคัญและแนวคิดหลัก (Key Takeaways)\n` +
        `- **แนวคิดที่ 1:** \n` +
        `- **แนวคิดที่ 2:** \n` +
        `- **แนวคิดที่ 3:** \n\n` +
        `## คำคมและประโยคที่ประทับใจ (Favorite Quotes)\n` +
        `> " "\n\n` +
        `## สิ่งที่จะนำไปลงมือทำจริง (Actionable Next Steps)\n` +
        `- [ ] \n` +
        `- [ ] \n`
      );
    } else {
      rawMarkdown = (
        `# Book Notes: [Book Title]\n\n` +
        `## Book Details\n` +
        `- **Author:** \n` +
        `- **Rating:** ⭐⭐⭐⭐⭐\n` +
        `- **Date Finished:** ${dateStr}\n` +
        `- **Category / Tags:** #reading #book-notes\n\n` +
        `## 3-Sentence Summary\n` +
        `1. \n` +
        `2. \n` +
        `3. \n\n` +
        `## Key Takeaways & Core Concepts\n` +
        `- **Core Idea 1:** \n` +
        `- **Core Idea 2:** \n` +
        `- **Core Idea 3:** \n\n` +
        `## Favorite Quotes & Highlights\n` +
        `> " "\n\n` +
        `## Actionable Next Steps & Implementation\n` +
        `- [ ] \n` +
        `- [ ] \n`
      );
    }
  } else if (templateType === "cornell-notes") {
    if (isTh) {
      rawMarkdown = (
        `# บันทึกการเรียนแบบคอร์เนลล์ (Cornell Notes)\n\n` +
        `## ข้อมูลทั่วไป (Topic Details)\n` +
        `- **วิชา / หัวข้อ:** \n` +
        `- **วันที่:** ${dateStr}\n` +
        `- **ผู้สอน / แหล่งอ้างอิง:** \n\n` +
        `---\n\n` +
        `## ❓ คำถามและประเด็นสำคัญ (Cue Column)\n` +
        `- คำถามสำคัญที่ 1\n` +
        `- นิยามและคีย์เวิร์ดหลัก\n` +
        `- จุดที่มักออกสอบ\n\n` +
        `## 📝 บันทึกเนื้อหาละเอียด (Notes Column)\n` +
        `- บันทึกคำอธิบายหลัก:\n` +
        `- สูตรและตัวอย่างประกอบ:\n` +
        `- แผนภาพและขั้นตอนการทำงาน:\n\n` +
        `---\n\n` +
        `## 💡 สรุปใจความสำคัญ (Summary)\n` +
        `> สรุปเนื้อหาสำคัญทั้งหมดของหน้านี้ด้วยภาษาของตัวเองใน 2-3 ประโยค\n\n` +
        `## 🎯 สิ่งที่ต้องทบทวนต่อ (Action Items)\n` +
        `- [ ] ทบทวนจุดที่ไม่เข้าใจ\n` +
        `- [ ] ทำแบบฝึกหัดท้ายบท\n`
      );
    } else {
      rawMarkdown = (
        `# Cornell Notes: [Subject / Topic]\n\n` +
        `## Topic Details\n` +
        `- **Course / Subject:** \n` +
        `- **Date:** ${dateStr}\n` +
        `- **Instructor / Source:** \n\n` +
        `---\n\n` +
        `## ❓ Cue Column & Key Questions\n` +
        `- What are the primary concepts?\n` +
        `- Key terminology & definitions\n` +
        `- Potential exam questions\n\n` +
        `## 📝 Detailed Notes & Explanations\n` +
        `- Main lecture points & ideas:\n` +
        `- Examples, formulas, and proofs:\n` +
        `- Diagrams and workflows:\n\n` +
        `---\n\n` +
        `## 💡 Summary\n` +
        `> Synthesize and summarize the core takeaways in 2-3 concise sentences using your own words.\n\n` +
        `## 🎯 Action Items & Follow-ups\n` +
        `- [ ] Review unclear concepts\n` +
        `- [ ] Complete practice exercises\n`
      );
    }
  } else if (templateType === "content-planner") {
    if (isTh) {
      rawMarkdown = (
        `# วางแผนคอนเทนต์และสคริปต์วิดีโอ (Content Planner)\n\n` +
        `## ข้อมูลคอนเทนต์ (Content Metadata)\n` +
        `- **หัวข้อคอนเทนต์:** \n` +
        `- **แพลตฟอร์ม:** [YouTube / TikTok / Facebook / Blog / Reels]\n` +
        `- **กลุ่มเป้าหมาย (Target Audience):** \n` +
        `- **วันที่เผยแพร่เป้าหมาย:** ${dateStr}\n` +
        `- **เป้าหมายหลัก:** [Brand Awareness / Conversion / Education]\n\n` +
        `## 1. 🪝 ท่อนฮุกดึงดูดใจ (The Hook - 0:00 to 0:05)\n` +
        `> "ประโยคเปิดตัวหรือคำถามที่ทำให้ผู้ชมหยุดดูทันที"\n\n` +
        `## 2. 📖 เนื้อหาและลำดับเรื่องราว (Body & Storyline)\n` +
        `- **ช่วงเปิดและปัญหา (The Problem):** \n` +
        `- **แนวทางแก้ไขและสาระสำคัญ (The Solution & Key Points):** \n` +
        `  1. ข้อที่ 1:\n` +
        `  2. ข้อที่ 2:\n` +
        `  3. ข้อที่ 3:\n` +
        `- **ตัวอย่างประกอบและสาธิต:** \n\n` +
        `## 3. 📣 ปิดท้ายและคำกระตุ้นการกระทำ (Call to Action - CTA)\n` +
        `> "กดไลก์ ติดตาม หรือคอมเมนต์ความคิดเห็นด้านล่าง"\n\n` +
        `## 4. 🎨 ไอเดียภาพปกและแคปชัน (Thumbnail & Caption)\n` +
        `- **ข้อความบนปก (Thumbnail Text):** \n` +
        `- **แฮชแท็ก (#Hashtags):** #content #creator\n\n` +
        `## 5. ✅ เช็กลิสต์การผลิต (Production Checklist)\n` +
        `- [ ] เขียนสคริปต์เสร็จสมบูรณ์\n` +
        `- [ ] ถ่ายทำวิดีโอ / บันทึกเสียง\n` +
        `- [ ] ตัดต่อและใส่ซับไตเติล\n` +
        `- [ ] ออกแบบภาพปก\n` +
        `- [ ] อัปโหลดและตั้งเวลาเผยแพร่\n`
      );
    } else {
      rawMarkdown = (
        `# Content & Video Script Planner\n\n` +
        `## Content Metadata\n` +
        `- **Working Title:** \n` +
        `- **Platforms:** [YouTube / TikTok / LinkedIn / Blog / Reels]\n` +
        `- **Target Audience:** \n` +
        `- **Target Publish Date:** ${dateStr}\n` +
        `- **Primary Goal:** [Awareness / Conversion / Education]\n\n` +
        `## 1. 🪝 The Hook (0:00 - 0:05)\n` +
        `> "Opening statement, pattern interrupt, or provocative question that immediately captures attention."\n\n` +
        `## 2. 📖 Core Body & Storyline\n` +
        `- **The Problem / Context:** \n` +
        `- **The Solution & Core Steps:** \n` +
        `  1. Key Point 1:\n` +
        `  2. Key Point 2:\n` +
        `  3. Key Point 3:\n` +
        `- **Proof & Visual Demonstration:** \n\n` +
        `## 3. 📣 Call to Action (CTA)\n` +
        `> "Like, subscribe, join the newsletter, or drop a comment below."\n\n` +
        `## 4. 🎨 Thumbnail Concept & Copy\n` +
        `- **Thumbnail Text Overlay:** \n` +
        `- **Hashtags / SEO Keywords:** #creator #content #workflow\n\n` +
        `## 5. ✅ Production & Publishing Checklist\n` +
        `- [ ] Script outline finalized\n` +
        `- [ ] Footage recorded / Voiceover tracked\n` +
        `- [ ] Video edited with B-roll & captions\n` +
        `- [ ] High-CTR thumbnail created\n` +
        `- [ ] Scheduled for publication\n`
      );
    }
  } else if (templateType === "api-doc") {
    if (isTh) {
      rawMarkdown = (
        `# เอกสารข้อกำหนด API (API Specification)\n\n` +
        `## ข้อมูล Endpoint\n` +
        `- **Method:** \`POST\`\n` +
        `- **Endpoint Path:** \`/api/v1/notes\`\n` +
        `- **คำอธิบาย:** สร้างโน้ตใหม่ในระบบพร้อมรองรับการเข้ารหัสข้อมูล\n` +
        `- **การยืนยันตัวตน (Auth):** \`Bearer <JWT_TOKEN>\`\n\n` +
        `## Headers\n` +
        `| Header | Type | Required | Description |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| \`Authorization\` | string | Yes | Bearer Token |\n` +
        `| \`Content-Type\` | string | Yes | \`application/json\` |\n\n` +
        `## Request Parameters & Body\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "title": "My Note Title",\n` +
        `  "content": "# Markdown Content",\n` +
        `  "folderPath": "Projects/2026",\n` +
        `  "tags": ["work", "planning"],\n` +
        `  "isEncrypted": false\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## Response Examples\n` +
        `### ✅ 201 Created (สำเร็จ)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "success": true,\n` +
        `  "data": {\n` +
        `    "id": "note_123456",\n` +
        `    "title": "My Note Title",\n` +
        `    "createdAt": "${dateStr}T${timeStr}:00Z"\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `### ❌ 400 Bad Request (ข้อมูลไม่ถูกต้อง)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "success": false,\n` +
        `  "error": "Validation failed",\n` +
        `  "details": ["title is required"]\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## หมายเหตุเพิ่มเติมสำหรับทีมพัฒนา\n` +
        `- มี Rate limit จำกัดไม่เกิน 100 requests / minute / IP\n`
      );
    } else {
      rawMarkdown = (
        `# API Endpoint Specification\n\n` +
        `## Endpoint Overview\n` +
        `- **HTTP Method:** \`POST\`\n` +
        `- **Path:** \`/api/v1/notes\`\n` +
        `- **Summary:** Create a new document in the active workspace\n` +
        `- **Authentication:** \`Bearer <API_TOKEN>\`\n\n` +
        `## Request Headers\n` +
        `| Header | Type | Required | Description |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| \`Authorization\` | string | Yes | Bearer Token authentication |\n` +
        `| \`Content-Type\` | string | Yes | \`application/json\` |\n\n` +
        `## Request Body Schema\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "title": "Architecture Overview",\n` +
        `  "content": "# System Architecture...",\n` +
        `  "folderPath": "docs/architecture",\n` +
        `  "tags": ["engineering", "backend"],\n` +
        `  "isEncrypted": false\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## Response Status Codes\n` +
        `### ✅ 201 Created (Success)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "success": true,\n` +
        `  "data": {\n` +
        `    "id": "note_123456",\n` +
        `    "title": "Architecture Overview",\n` +
        `    "createdAt": "${dateStr}T${timeStr}:00Z"\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `### ❌ 400 Bad Request (Validation Error)\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "success": false,\n` +
        `  "error": "Validation failed",\n` +
        `  "details": ["title cannot be empty"]\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `## Rate Limits & Technical Notes\n` +
        `- Throttled at 100 requests per minute per authenticated client.\n`
      );
    }
  } else if (templateType === "habit-tracker") {
    if (isTh) {
      rawMarkdown = (
        `# ตารางติดตามนิสัยและสุขภาพ (Habit & Wellness Tracker)\n\n` +
        `## ประจำสัปดาห์: ${dateStr}\n\n` +
        `## 🏃‍♂️ ตารางติดตามนิสัยประจำวัน (Daily Habit Matrix)\n` +
        `| นิสัยเป้าหมาย | จ. | อ. | พ. | พฤ. | ศ. | ส. | อา. |\n` +
        `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n` +
        `| 💧 ดื่มน้ำ 2-3 ลิตร | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 🏃 ออกกำลังกาย 30 นาที | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 📖 อ่านหนังสือ 15 นาที | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 🧘 นั่งสมาธิ / ผ่อนคลาย | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 🛌 นอนก่อน 23:00 น. | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n\n` +
        `## ⚡ ระดับพลังงานและความพร้อม (Energy & Mood Log)\n` +
        `- วันจันทร์: ⭐⭐⭐⭐⭐\n` +
        `- วันพุธ: ⭐⭐⭐⭐⭐\n` +
        `- วันศุกร์: ⭐⭐⭐⭐⭐\n\n` +
        `## 🌟 สรุปความสำเร็จและสิ่งที่จะปรับปรุงประจำสัปดาห์\n` +
        `- สิ่งที่ทำได้ดีมาก:\n` +
        `- นิสัยที่ต้องการปรับปรุงในสัปดาห์หน้า:\n`
      );
    } else {
      rawMarkdown = (
        `# Weekly Habit & Wellness Tracker\n\n` +
        `## Week of: ${dateStr}\n\n` +
        `## 🏃‍♂️ Daily Habit Matrix\n` +
        `| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |\n` +
        `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n` +
        `| 💧 Hydrate 2-3L | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 🏃 30-min Exercise | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 📖 Read 15 mins | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 🧘 Meditation / Mindfulness | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n` +
        `| 🛌 Sleep before 11 PM | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |\n\n` +
        `## ⚡ Weekly Energy & Wellbeing Check-in\n` +
        `- Monday: ⭐⭐⭐⭐⭐\n` +
        `- Wednesday: ⭐⭐⭐⭐⭐\n` +
        `- Friday: ⭐⭐⭐⭐⭐\n\n` +
        `## 🌟 Weekly Reflection & Adjustments\n` +
        `- What went exceptionally well:\n` +
        `- Habit to prioritize next week:\n`
      );
    }
  } else if (templateType === "monthly-budget") {
    if (isTh) {
      rawMarkdown = (
        `# วางแผนงบประมาณและการเงินประจำเดือน (Monthly Budget)\n\n` +
        `## ประจำเดือน: ${dateStr}\n\n` +
        `## 💰 1. รายรับทั้งหมด (Total Income)\n` +
        `| รายการรายรับ | ประมาณการ (฿) | ได้รับจริง (฿) |\n` +
        `| :--- | :---: | :---: |\n` +
        `| เงินเดือนประจำ | 0.00 | 0.00 |\n` +
        `| รายได้เสริม / ฟรีแลนซ์ | 0.00 | 0.00 |\n` +
        `| **รวมรายรับทั้งหมด** | **0.00** | **0.00** |\n\n` +
        `## 🏠 2. รายจ่ายคงที่ (Fixed Expenses)\n` +
        `| รายการค่าใช้จ่าย | งบประมาณ (฿) | จ่ายจริง (฿) |\n` +
        `| :--- | :---: | :---: |\n` +
        `| ค่าที่พัก / ค่าผ่อนบ้าน | 0.00 | 0.00 |\n` +
        `| ค่าน้ำ / ค่าไฟ / ค่าเน็ต | 0.00 | 0.00 |\n` +
        `| ค่าเดินทาง / ค่าประกัน | 0.00 | 0.00 |\n` +
        `| **รวมรายจ่ายคงที่** | **0.00** | **0.00** |\n\n` +
        `## 🛒 3. รายจ่ายผันแปร & เงินออม (Variable & Savings)\n` +
        `| รายการ | งบประมาณ (฿) | จ่ายจริง (฿) |\n` +
        `| :--- | :---: | :---: |\n` +
        `| ค่าอาหารและของใช้ | 0.00 | 0.00 |\n` +
        `| เงินออมและการลงทุน (20%) | 0.00 | 0.00 |\n` +
        `| ช้อปปิ้ง / สังสรรค์ | 0.00 | 0.00 |\n\n` +
        `## 📊 สรุปยอดเงินคงเหลือสุทธิ (Net Balance)\n` +
        `- **ยอดเงินคงเหลือสุทธิ:** ฿0.00\n` +
        `- **อัตราการออม:** 0%\n`
      );
    } else {
      rawMarkdown = (
        `# Monthly Budget & Financial Planner\n\n` +
        `## Month of: ${dateStr}\n\n` +
        `## 💰 1. Total Income\n` +
        `| Source | Planned ($) | Actual ($) |\n` +
        `| :--- | :---: | :---: |\n` +
        `| Primary Salary | 0.00 | 0.00 |\n` +
        `| Freelance / Secondary | 0.00 | 0.00 |\n` +
        `| **Total Income** | **0.00** | **0.00** |\n\n` +
        `## 🏠 2. Fixed Expenses\n` +
        `| Category | Budgeted ($) | Actual ($) |\n` +
        `| :--- | :---: | :---: |\n` +
        `| Rent / Mortgage | 0.00 | 0.00 |\n` +
        `| Utilities & Internet | 0.00 | 0.00 |\n` +
        `| Insurance & Transit | 0.00 | 0.00 |\n` +
        `| **Total Fixed** | **0.00** | **0.00** |\n\n` +
        `## 🛒 3. Variable Expenses & Savings\n` +
        `| Category | Budgeted ($) | Actual ($) |\n` +
        `| :--- | :---: | :---: |\n` +
        `| Groceries & Dining | 0.00 | 0.00 |\n` +
        `| Savings & Investments (20%) | 0.00 | 0.00 |\n` +
        `| Entertainment & Personal | 0.00 | 0.00 |\n\n` +
        `## 📊 Net Monthly Balance\n` +
        `- **Net Balance:** $0.00\n` +
        `- **Savings Rate:** 0%\n`
      );
    }
  } else if (templateType === "travel-itinerary") {
    if (isTh) {
      rawMarkdown = (
        `# แผนการเดินทางท่องเที่ยว (Travel Itinerary)\n\n` +
        `## ข้อมูลการเดินทาง (Trip Overview)\n` +
        `- **จุดหมายปลายทาง:** \n` +
        `- **วันที่เดินทาง:** ${dateStr}\n` +
        `- **ผู้ร่วมเดินทาง:** \n` +
        `- **งบประมาณรวม:** \n\n` +
        `## ✈️ ข้อมูลการเดินทางและที่พัก (Flight & Stay)\n` +
        `- **เที่ยวบินไป/กลับ:** \n` +
        `- **โรงแรม / ที่พัก:** \n` +
        `- **การเดินทางในพื้นที่:** [เช่ารถ / รถไฟ / Grab]\n\n` +
        `## 🗺️ ตารางกิจกรรมรายวัน (Day-by-Day Schedule)\n` +
        `### วันที่ 1: เดินทางถึงและเช็กอิน\n` +
        `- 10:00 - เดินทางถึงสนามบิน / เช็กอินที่พัก\n` +
        `- 13:00 - รับประทานอาหารกลางวันและเดินเล่นย่านเมืองเก่า\n` +
        `- 18:00 - จุดชมวิวพระอาทิตย์ตกและอาหารค่ำ\n\n` +
        `### วันที่ 2: สถานที่ท่องเที่ยวสำคัญ\n` +
        `- 09:00 - \n` +
        `- 14:00 - \n\n` +
        `## 🎒 เช็กลิสต์จัดกระเป๋า (Packing Checklist)\n` +
        `- [ ] พาสปอร์ต / บัตรประชาชน / ตั๋วเครื่องบิน\n` +
        `- [ ] ยาสามัญประจำตัวและอุปกรณ์ชาร์จไฟ\n` +
        `- [ ] เสื้อผ้าและรองเท้าที่เหมาะสมกับสภาพอากาศ\n`
      );
    } else {
      rawMarkdown = (
        `# Travel Itinerary & Trip Planner\n\n` +
        `## Trip Overview\n` +
        `- **Destination:** \n` +
        `- **Dates:** ${dateStr}\n` +
        `- **Travelers:** \n` +
        `- **Total Budget:** \n\n` +
        `## ✈️ Flights & Lodging\n` +
        `- **Outbound / Return Flights:** \n` +
        `- **Hotel / Accommodation:** \n` +
        `- **Local Transit:** [Rental Car / Rail / Taxi]\n\n` +
        `## 🗺️ Day-by-Day Itinerary\n` +
        `### Day 1: Arrival & Exploration\n` +
        `- 10:00 - Arrive and check into accommodation\n` +
        `- 13:00 - Local lunch and historical walking tour\n` +
        `- 18:00 - Sunset viewpoint & welcome dinner\n\n` +
        `### Day 2: Highlights & Adventure\n` +
        `- 09:00 - \n` +
        `- 14:00 - \n\n` +
        `## 🎒 Packing & Essentials Checklist\n` +
        `- [ ] Passport / IDs / Boarding Passes\n` +
        `- [ ] Universal power adapter & electronics\n` +
        `- [ ] Weather-appropriate clothing & comfortable shoes\n`
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
