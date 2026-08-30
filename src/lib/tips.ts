export type TipCategory =
  | "shortcuts"
  | "editor"
  | "workspace"
  | "templates"
  | "ai"
  | "customization";

export interface TipItem {
  id: string;
  category: TipCategory;
  th: string;
  en: string;
}

export const TIPS: TipItem[] = [
  // 1. Shortcuts & Navigation
  {
    id: "shortcut-new-note",
    category: "shortcuts",
    th: "กด Ctrl + N เพื่อสร้างโน้ตใหม่ได้ทันทีจากทุกหน้าจอ",
    en: "Press Ctrl + N to create a new note instantly from anywhere in the app.",
  },
  {
    id: "shortcut-quick-search",
    category: "shortcuts",
    th: "กด Ctrl + K หรือ Ctrl + F เพื่อค้นหาและสลับโน้ตได้อย่างรวดเร็ว",
    en: "Press Ctrl + K or Ctrl + F to quickly search and switch between notes.",
  },
  {
    id: "shortcut-find-in-note",
    category: "shortcuts",
    th: "กด Ctrl + F เพื่อค้นหาคำหรือข้อความภายในโน้ตที่กำลังเปิดอยู่",
    en: "Press Ctrl + F to search and find text inside your current open note.",
  },
  {
    id: "shortcut-toggle-sidebar",
    category: "shortcuts",
    th: "กด Ctrl + \\ เพื่อซ่อน/แสดงแถบด้านข้าง เพิ่มพื้นที่ในการเขียน",
    en: "Press Ctrl + \\ to collapse or expand the sidebar to maximize your writing space.",
  },
  {
    id: "shortcut-settings",
    category: "shortcuts",
    th: "กด Ctrl + , เพื่อเปิดหน้าการตั้งค่า (Settings) ได้อย่างรวดเร็ว",
    en: "Press Ctrl + , to open the Settings tab quickly.",
  },
  {
    id: "shortcut-luno-ai",
    category: "shortcuts",
    th: "กด Ctrl + Shift + A เพื่อเปิดใช้งาน Luno AI ผู้ช่วยอัจฉริยะได้ทันที",
    en: "Press Ctrl + Shift + A to open Luno AI assistant instantly.",
  },
  {
    id: "shortcut-floating-calc",
    category: "shortcuts",
    th: "กด Ctrl + Shift + C เพื่อเปิด/ปิดหน้าต่างเครื่องคิดเลขลอยสำหรับคำนวณด่วน",
    en: "Press Ctrl + Shift + C to toggle the floating calculator widget.",
  },

  // 2. Editor & Markdown Superpowers
  {
    id: "editor-slash-commands",
    category: "editor",
    th: "พิมพ์ / ในตัวแก้ไขเพื่อเปิดเมนูคำสั่งด่วนสำหรับแทรกหัวข้อ ตาราง โค้ด หรือรายการงาน",
    en: "Type / in the editor to open the slash command menu for inserting headings, tables, and tasks.",
  },
  {
    id: "editor-tagging",
    category: "editor",
    th: "พิมพ์ #tag ในเนื้อหา หรือกำหนดในส่วนหัวเพื่อจัดหมวดหมู่โน้ตโดยอัตโนมัติ",
    en: "Type #tag anywhere in your text or YAML frontmatter to categorize notes automatically.",
  },
  {
    id: "editor-wikilinks",
    category: "editor",
    th: "พิมพ์ [[ เพื่อสร้างลิงก์เชื่อมโยงไปยังโน้ตอื่น พร้อมระบบ Backlink เชื่อมต่อความคิด",
    en: "Type [[ to link to any note in your workspace with bi-directional backlinks.",
  },
  {
    id: "editor-math-katex",
    category: "editor",
    th: "พิมพ์ $สูตร$ สำหรับสมการในบรรทัด หรือ $$สูตร$$ เพื่อแสดงสูตรคณิตศาสตร์ด้วย KaTeX",
    en: "Use $formula$ for inline math or $$formula$$ for display math equations rendered with KaTeX.",
  },
  {
    id: "editor-callouts",
    category: "editor",
    th: "พิมพ์ /callout หรือ > [!NOTE] เพื่อสร้างกล่องข้อความเน้นข้อมูลสำคัญที่สวยงาม",
    en: "Use /callout or > [!NOTE] to create styled alert callout boxes for key information.",
  },
  {
    id: "editor-code-blocks",
    category: "editor",
    th: "พิมพ์ ``` ตามด้วยชื่อภาษา เช่น ```typescript เพื่อเปิดกล่องโค้ดพร้อมไฮไลต์สีและปุ่มคัดลอก",
    en: "Type ``` followed by language name (e.g. ```python) for syntax highlighting and one-click copy.",
  },
  {
    id: "editor-footnotes",
    category: "editor",
    th: "ใส่ [^1] ในข้อความและ [^1]: คำอธิบาย เพื่อสร้างเชิงอรรถอ้างอิงท้ายโน้ต",
    en: "Use [^1] in text and [^1]: description to create interactive reference footnotes.",
  },
  {
    id: "editor-tables",
    category: "editor",
    th: "พิมพ์ /table หรือพิมพ์ตารางด้วย | หัวข้อ | เพื่อสร้างตารางข้อมูลพร้อมเมนูจัดการแถวและคอลัมน์",
    en: "Type /table or use markdown pipes | Header | to insert interactive tables with row/column tools.",
  },

  // 3. Workspace & File Management
  {
    id: "workspace-local-first",
    category: "workspace",
    th: "ไฟล์โน้ตของคุณถูกบันทึกเป็น Markdown (.md) ในเครื่องโดยตรง ทำงานออฟไลน์ได้ 100% ข้อมูลเป็นของคุณอย่างแท้จริง",
    en: "Your notes are saved directly as Markdown (.md) on your device — 100% offline-first and private.",
  },
  {
    id: "workspace-favorites",
    category: "workspace",
    th: "คลิกไอคอนดาวบนโน้ตเพื่อปักหมุดไว้ในรายการโปรด เข้าถึงได้ทันทีในคลิกเดียว",
    en: "Star important notes to pin them to Favorites for quick 1-click access anytime.",
  },
  {
    id: "workspace-folders",
    category: "workspace",
    th: "คลิกขวาที่แถบโฟลเดอร์เพื่อสร้างโฟลเดอร์ย่อย จัดระเบียบองค์ความรู้ให้เป็นหมวดหมู่",
    en: "Right-click any folder in the sidebar to create nested subfolders and organize your knowledge.",
  },
  {
    id: "workspace-multi-tab",
    category: "workspace",
    th: "เปิดหลายโน้ตพร้อมกันด้วยแถบแท็บด้านบน สลับทำงานและอ้างอิงข้อมูลได้อย่างราบรื่น",
    en: "Open multiple notes simultaneously in top tabs to multitask and cross-reference information.",
  },
  {
    id: "workspace-trash-recovery",
    category: "workspace",
    th: "โน้ตที่ถูกลบจะถูกย้ายไปที่ถังขยะ (Trash) ชั่วคราว คุณสามารถกู้คืนกลับมาได้ตลอดเวลา",
    en: "Deleted notes are safely moved to the Trash bin, where you can restore them anytime.",
  },
  {
    id: "workspace-switching",
    category: "workspace",
    th: "คุณสามารถเปิดโฟลเดอร์ใดๆ ในเครื่องเพื่อเป็น Workspace ใหม่ได้ง่ายๆ ผ่านเมนู Open Folder",
    en: "Open any local directory on your device as a separate workspace via Open Folder.",
  },

  // 4. Templates & Productivity
  {
    id: "template-starters",
    category: "templates",
    th: "เริ่มต้นจดบันทึกการประชุม ไดอารี่ประจำวัน หรือแผนโปรเจกต์ได้รวดเร็วผ่านการ์ดเทมเพลตในหน้า Home",
    en: "Start meeting notes, daily journals, or project plans instantly via template cards on Home.",
  },
  {
    id: "productivity-reading-mode",
    category: "templates",
    th: "สลับไปที่ Reading Mode เพื่ออ่านเนื้อหาอย่างมีสมาธิโดยไม่มีแถบเครื่องมือรบกวน",
    en: "Switch to Reading Mode for a distraction-free, beautifully formatted reading experience.",
  },
  {
    id: "productivity-word-stats",
    category: "templates",
    th: "ดูจำนวนคำ ตัวอักษร และเวลาโดยประมาณในการอ่านได้ที่แถบสถานะด้านล่างของตัวแก้ไข",
    en: "Check real-time word count, character count, and estimated reading time at the status bar.",
  },
  {
    id: "productivity-auto-save",
    category: "templates",
    th: "Luno บันทึกการเปลี่ยนแปลงให้อัตโนมัติในเบื้องหลังอย่างต่อเนื่อง หมดกังวลเรื่องข้อมูลสูญหาย",
    en: "Luno automatically saves your changes in the background as you write — never lose your work.",
  },

  // 5. Luno AI & Smart Assistance
  {
    id: "ai-assistant-summary",
    category: "ai",
    th: "คลิกที่เมนู Luno AI เพื่อช่วยสรุปเนื้อหา ระดมความคิด หรือแปลภาษาให้กับโน้ตของคุณ",
    en: "Click Luno AI to summarize notes, brainstorm ideas, translate text, or ask questions.",
  },
  {
    id: "ai-assistant-polish",
    category: "ai",
    th: "ให้ Luno AI ช่วยตรวจทาน ปรับสำนวน หรือขยายความเนื้อหาโน้ตของคุณได้อย่างมืออาชีพ",
    en: "Ask Luno AI to refine, polish, rephrase, or expand your note content with ease.",
  },

  // 6. Customization & Appearance
  {
    id: "customization-themes",
    category: "customization",
    th: "เลือกเปลี่ยนธีม Light, Dark หรือตามระบบ (System) ได้อย่างอิสระในเมนู Settings",
    en: "Switch between Light, Dark, or System theme anytime in the Settings menu.",
  },
  {
    id: "customization-accents",
    category: "customization",
    th: "ปรับแต่งสี Accent ของโปรแกรมให้ตรงกับสไตล์การทำงานที่คุณชื่นชอบใน Settings",
    en: "Customize your workspace with your favorite accent color palette in Settings.",
  },
];

/** Get a random index from the tips array */
export function getRandomTipIndex(): number {
  if (TIPS.length === 0) return 0;
  return Math.floor(Math.random() * TIPS.length);
}

/** Get the next tip index in the sequence (with wrap-around) */
export function getNextTipIndex(currentIndex: number): number {
  if (TIPS.length === 0) return 0;
  return (currentIndex + 1) % TIPS.length;
}
