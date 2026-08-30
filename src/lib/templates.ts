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
  | "basic-website"
  | "landing-page"
  | "portfolio"
  | "blog"
  | "dashboard"
  | "notes"
  | "journal"
  | "readme";

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
        `    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }\n` +
        `    header { background: #1e293b; color: #fff; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; }\n` +
        `    nav a { color: #cbd5e1; text-decoration: none; margin-left: 1.5rem; }\n` +
        `    nav a:hover { color: #fff; }\n` +
        `    main { max-width: 1000px; margin: 2rem auto; padding: 0 1.5rem; }\n` +
        `    section { margin-bottom: 2.5rem; }\n` +
        `    h1, h2 { margin-bottom: 1rem; color: #0f172a; }\n` +
        `    footer { background: #f1f5f9; text-align: center; padding: 1.5rem; margin-top: 3rem; color: #64748b; font-size: 0.9rem; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <header>\n` +
        `    <h2>My Website</h2>\n` +
        `    <nav>\n` +
        `      <a href="#home">Home</a>\n` +
        `      <a href="#about">About</a>\n` +
        `      <a href="#services">Services</a>\n` +
        `      <a href="#contact">Contact</a>\n` +
        `    </nav>\n` +
        `  </header>\n\n` +
        `  <main>\n` +
        `    <section id="home">\n` +
        `      <h1>Welcome to Our Website</h1>\n` +
        `      <p>This is a modern, responsive website template with a clean semantic layout.</p>\n` +
        `    </section>\n\n` +
        `    <section id="about">\n` +
        `      <h2>About Us</h2>\n` +
        `      <p>Learn more about our mission, vision, and the values that drive our team forward.</p>\n` +
        `    </section>\n\n` +
        `    <section id="services">\n` +
        `      <h2>Our Services</h2>\n` +
        `      <p>Explore what we offer and how we can help you achieve your goals.</p>\n` +
        `    </section>\n` +
        `  </main>\n\n` +
        `  <footer>\n` +
        `    <p>&copy; ${new Date().getFullYear()} My Website. All rights reserved.</p>\n` +
        `  </footer>\n` +
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
        `    header { padding: 1.5rem 0; display: flex; justify-content: space-between; align-items: center; }\n` +
        `    .logo { font-size: 1.4rem; font-weight: 700; color: #2563eb; }\n` +
        `    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }\n` +
        `    .btn:hover { background: #1d4ed8; }\n` +
        `    .hero { text-align: center; padding: 5rem 0 4rem; }\n` +
        `    .hero h1 { font-size: 3rem; font-weight: 800; line-height: 1.2; margin-bottom: 1.25rem; color: #0f172a; }\n` +
        `    .hero p { font-size: 1.2rem; color: #64748b; max-width: 650px; margin: 0 auto 2rem; }\n` +
        `    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; padding: 4rem 0; }\n` +
        `    .feature-card { background: #fff; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; }\n` +
        `    .feature-card h3 { margin-bottom: 0.5rem; color: #0f172a; }\n` +
        `    .feature-card p { color: #64748b; font-size: 0.95rem; }\n` +
        `    footer { text-align: center; padding: 3rem 0; color: #94a3b8; font-size: 0.9rem; border-top: 1px solid #e2e8f0; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <header>\n` +
        `      <div class="logo">BrandName</div>\n` +
        `      <a href="#get-started" class="btn">Get Started</a>\n` +
        `    </header>\n\n` +
        `    <section class="hero">\n` +
        `      <h1>Build something amazing with our platform</h1>\n` +
        `      <p>The all-in-one solution designed to help your team work faster, smarter, and achieve better results.</p>\n` +
        `      <a href="#cta" class="btn">Start Free Trial</a>\n` +
        `    </section>\n\n` +
        `    <section class="features">\n` +
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
        `  </div>\n` +
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
        `    .container { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; }\n` +
        `    .profile { text-align: center; margin-bottom: 4rem; }\n` +
        `    .avatar { width: 100px; height: 100px; border-radius: 50%; background: #e2e8f0; margin: 0 auto 1.25rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }\n` +
        `    h1 { font-size: 2.25rem; color: #0f172a; margin-bottom: 0.5rem; }\n` +
        `    .tagline { color: #64748b; font-size: 1.1rem; margin-bottom: 1.5rem; }\n` +
        `    section { margin-bottom: 3.5rem; }\n` +
        `    h2 { font-size: 1.5rem; color: #0f172a; margin-bottom: 1.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }\n` +
        `    .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }\n` +
        `    .project-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.5rem; background: #f8fafc; }\n` +
        `    .project-card h3 { margin-bottom: 0.5rem; color: #0f172a; }\n` +
        `    .project-card p { font-size: 0.9rem; color: #64748b; margin-bottom: 1rem; }\n` +
        `    .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }\n` +
        `    .skill-tag { background: #e0f2fe; color: #0369a1; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }\n` +
        `    footer { text-align: center; color: #94a3b8; font-size: 0.85rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <header class="profile">\n` +
        `      <div class="avatar">👨‍💻</div>\n` +
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
        `          <h3>Project One</h3>\n` +
        `          <p>A full-stack web application designed for task management and team collaboration.</p>\n` +
        `          <a href="#" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 0.9rem;">View Project &rarr;</a>\n` +
        `        </div>\n` +
        `        <div class="project-card">\n` +
        `          <h3>Project Two</h3>\n` +
        `          <p>Interactive dashboard UI kit built with modern web components and data charts.</p>\n` +
        `          <a href="#" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 0.9rem;">View Project &rarr;</a>\n` +
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
        `    <footer>\n` +
        `      <p>&copy; ${new Date().getFullYear()} Your Name. All rights reserved.</p>\n` +
        `    </footer>\n` +
        `  </div>\n` +
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
        `    .container { max-width: 760px; margin: 0 auto; padding: 3rem 1.5rem; }\n` +
        `    header { margin-bottom: 2.5rem; }\n` +
        `    .category { font-family: system-ui, sans-serif; font-size: 0.85rem; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }\n` +
        `    h1 { font-size: 2.5rem; color: #1a202c; line-height: 1.25; margin-bottom: 1rem; }\n` +
        `    .meta { font-family: system-ui, sans-serif; font-size: 0.9rem; color: #718096; }\n` +
        `    .article-body p { margin-bottom: 1.5rem; font-size: 1.1rem; }\n` +
        `    .article-body h2 { font-family: system-ui, sans-serif; font-size: 1.6rem; color: #1a202c; margin: 2.5rem 0 1rem; }\n` +
        `    blockquote { border-left: 4px solid #8b5cf6; padding-left: 1.25rem; margin: 2rem 0; font-style: italic; color: #4a5568; }\n` +
        `    footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; font-family: system-ui, sans-serif; font-size: 0.9rem; color: #a0aec0; text-align: center; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="container">\n` +
        `    <header>\n` +
        `      <div class="category">Technology & Design</div>\n` +
        `      <h1>The Future of Web Development and Design</h1>\n` +
        `      <div class="meta">By Author Name &bull; Published on ${dateStr} &bull; 5 min read</div>\n` +
        `    </header>\n\n` +
        `    <article class="article-body">\n` +
        `      <p>The landscape of modern web development continues to evolve rapidly. From AI-assisted tools to hyper-optimized browser rendering engines, developers now have more powerful tools than ever before.</p>\n\n` +
        `      <h2>Embracing Simplicity and Performance</h2>\n` +
        `      <p>While frameworks come and go, fundamental principles of good software engineering remain unchanged. Fast load times, clean semantics, and accessible user interfaces create the best experience for everyone.</p>\n\n` +
        `      <blockquote>"Simplicity is the prerequisite for reliability." &mdash; Edsger W. Dijkstra</blockquote>\n\n` +
        `      <p>As we look forward, the focus shifts toward sustainable architecture, lightweight tooling, and delightful user interactions.</p>\n` +
        `    </article>\n\n` +
        `    <footer>\n` +
        `      <p>&copy; ${new Date().getFullYear()} My Blog. Thanks for reading!</p>\n` +
        `    </footer>\n` +
        `  </div>\n` +
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
        `    aside { width: 240px; background: #0f172a; color: #fff; padding: 1.5rem 1rem; }\n` +
        `    aside h2 { font-size: 1.2rem; margin-bottom: 2rem; padding: 0 0.5rem; color: #38bdf8; }\n` +
        `    aside a { display: block; color: #94a3b8; text-decoration: none; padding: 0.75rem 0.5rem; border-radius: 6px; margin-bottom: 0.25rem; font-size: 0.9rem; }\n` +
        `    aside a:hover, aside a.active { background: #1e293b; color: #fff; }\n` +
        `    main { flex: 1; padding: 2rem; }\n` +
        `    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }\n` +
        `    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }\n` +
        `    .stat-card { background: #fff; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; }\n` +
        `    .stat-title { font-size: 0.85rem; color: #64748b; font-weight: 500; }\n` +
        `    .stat-value { font-size: 1.8rem; font-weight: 700; color: #0f172a; margin-top: 0.5rem; }\n` +
        `    .card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 1.5rem; }\n` +
        `    .card h3 { font-size: 1.1rem; color: #0f172a; margin-bottom: 1rem; }\n` +
        `    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }\n` +
        `    th, td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }\n` +
        `    th { color: #64748b; font-weight: 600; }\n` +
        `    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }\n` +
        `    .badge-success { background: #dcfce7; color: #15803d; } \n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <div class="layout">\n` +
        `    <aside>\n` +
        `      <h2>AdminPanel</h2>\n` +
        `      <a href="#" class="active">📊 Overview</a>\n` +
        `      <a href="#">👥 Customers</a>\n` +
        `      <a href="#">📦 Products</a>\n` +
        `      <a href="#">📈 Analytics</a>\n` +
        `      <a href="#">⚙️ Settings</a>\n` +
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
        `        <table>\n` +
        `          <thead>\n` +
        `            <tr>\n` +
        `              <th>Customer</th>\n` +
        `              <th>Status</th>\n` +
        `              <th>Date</th>\n` +
        `              <th>Amount</th>\n` +
        `            </tr>\n` +
        `          </thead>\n` +
        `          <tbody>\n` +
        `            <tr>\n` +
        `              <td>John Doe</td>\n` +
        `              <td><span class="badge badge-success">Completed</span></td>\n` +
        `              <td>Today, 14:32</td>\n` +
        `              <td>$250.00</td>\n` +
        `            </tr>\n` +
        `            <tr>\n` +
        `              <td>Jane Smith</td>\n` +
        `              <td><span class="badge badge-success">Completed</span></td>\n` +
        `              <td>Today, 11:15</td>\n` +
        `              <td>$120.50</td>\n` +
        `            </tr>\n` +
        `          </tbody>\n` +
        `        </table>\n` +
        `      </div>\n` +
        `    </main>\n` +
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
