import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  FileCode,
  Layers,
  History,
  CheckCircle2,
  ExternalLink,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
  HelpCircle,
  Clock,
  KeyRound,
  FileText,
  EyeOff,
  Zap,
  Video,
  QrCode,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import lunoLogo from "@/assets/luno-logo.png";
import {
  APP_VERSION,
  APP_AUTHOR,
  APP_AUTHOR_URL,
  APP_ABOUT_CREDIT,
  APP_LATEST_RELEASE_URL,
  openExternalUrl,
} from "@/lib/appVersion";

interface WhatsNewViewProps {
  onClose?: () => void;
  onOpenSettings?: (category?: string) => void;
  onOpenHelp?: (category?: string) => void;
  onOpenWebTab?: (url: string, initialTitle?: string) => void;
}

interface ReleaseVersion {
  version: string;
  releaseDate: string;
  isLatest?: boolean;
  tagline: { en: string; th: string };
  highlights: {
    title: { en: string; th: string };
    description: { en: string; th: string };
    icon: React.ElementType;
    badge?: { en: string; th: string; variant?: "default" | "secondary" | "outline" };
  }[];
  changes: {
    category: { en: string; th: string };
    items: { en: string; th: string }[];
  }[];
}

const RELEASES: ReleaseVersion[] = [
  {
    version: "1.3.1",
    releaseDate: "2026",
    isLatest: true,
    tagline: {
      en: "Security & Media Enhancements: Video Playback, In-Place QR Code Editing, OWASP PBKDF2 600k PIN Encryption, and Anti-Brute Force Lockout",
      th: "อัปเกรดระบบความปลอดภัยและมัลติมีเดีย: เล่นวิดีโอในตัว, แก้ไข QR Code จากในโน้ต, เข้ารหัส PIN 6 หลักตามมาตรฐาน OWASP PBKDF2 และระบบป้องกัน Brute Force",
    },
    highlights: [
      {
        title: {
          en: "Embedded Video Support & Playback",
          th: "แทรกและเล่นวิดีโอในตัว (Video Embedding)",
        },
        description: {
          en: "Embed and play MP4, WebM, and local workspace video files directly within your notes with alignment and width controls.",
          th: "แทรกและเล่นไฟล์วิดีโอ MP4, WebM และไฟล์วิดีโอใน Workspace ได้โดยตรงในโน้ต พร้อมปรับขนาดความกว้างและจัดตำแหน่งได้อย่างอิสระ",
        },
        icon: Video,
        badge: { en: "Media", th: "มัลติมีเดีย", variant: "default" },
      },
      {
        title: {
          en: "In-Place QR Code Editing & Auto Detection",
          th: "แก้ไข QR Code จากรูปภาพในโน้ตทันที",
        },
        description: {
          en: "Edit embedded QR codes directly in your note with auto-detected content scanning, color options, and error correction levels.",
          th: "แก้ไข QR Code บนรูปภาพในโน้ตได้ทันที พร้อมระบบสแกนอ่านข้อความเดิมอัตโนมัติ ปรับแต่งสี และระดับแก้ไขความผิดพลาด",
        },
        icon: QrCode,
        badge: { en: "Feature", th: "ฟีเจอร์ใหม่", variant: "secondary" },
      },
      {
        title: {
          en: "OWASP-Recommended PBKDF2 (600,000 Iterations)",
          th: "มาตรฐานการเข้ารหัส PBKDF2 600,000 รอบ (OWASP)",
        },
        description: {
          en: "Derives cryptographic keys using 600,000 PBKDF2-HMAC-SHA256 iterations with unique cryptographic salts, making offline dictionary attacks computationally unfeasible.",
          th: "สร้างกุญแจเข้ารหัสด้วย PBKDF2-HMAC-SHA256 จำนวน 600,000 รอบ พร้อม Salt เฉพาะ ป้องกันการถอดรหัสแบบ Brute-force ออฟไลน์ได้อย่างมีประสิทธิภาพสูงสุด",
        },
        icon: KeyRound,
        badge: { en: "Security", th: "ความปลอดภัย", variant: "default" },
      },
      {
        title: {
          en: "Multi-Format Text File Encryption (.md, .txt, .html, .css)",
          th: "ล็อกและเข้ารหัสไฟล์ข้อความหลากหลายรูปแบบ (.md, .txt, .html, .css)",
        },
        description: {
          en: "Lock any supported text-based note in your workspace with full AES-GCM payload encryption, preserving metadata while keeping your private data safe.",
          th: "รองรับการล็อกไฟล์ข้อความในระบบทั้งหมดทั้ง Markdown, ข้อความธรรมดา, HTML และ CSS โดยเนื้อหาจะถูกเข้ารหัส AES-GCM ไว้อย่างมิดชิด",
        },
        icon: Lock,
        badge: { en: "Feature", th: "ฟีเจอร์ใหม่", variant: "secondary" },
      },
      {
        title: {
          en: "Progressive Anti-Brute Force Lockout",
          th: "ระบบหน่วงเวลาและป้องกันการสุ่มรหัส (Anti-Brute Force)",
        },
        description: {
          en: "Escalating lockout cooldowns protect locked notes against automated PIN guessing. Lockout timers remain enforced even across tab switches.",
          th: "เมื่อกรอกรหัสผิดติดต่อกัน ระบบจะเริ่มหน่วงเวลาเพิ่มขึ้นตามลำดับ และคงการนับเวลาต่อเนื่องแม้ย้ายหรือสลับแท็บไปหน้าอื่น",
        },
        icon: ShieldCheck,
        badge: { en: "Protection", th: "การปกป้อง", variant: "default" },
      },
      {
        title: {
          en: "Distraction-Free Locked Experience",
          th: "หน้าต่างปลดล็อกที่สะอาดและรักษาความเป็นส่วนตัว",
        },
        description: {
          en: "Toolbars, sensitive action buttons, and save status indicators are automatically hidden when viewing a locked note until unlocked.",
          th: "ซ่อนแถบเครื่องมือ (Toolbar), ปุ่มคำสั่งที่เกี่ยวข้อง และสถานะการบันทึกระหว่างล็อก เพื่อความเป็นส่วนตัวและความเรียบง่ายสูงสุด",
        },
        icon: EyeOff,
        badge: { en: "UI / UX", th: "หน้าตาโปรแกรม", variant: "outline" },
      },
      {
        title: {
          en: "Interactive Footnote Popover & WhatsNew Hub",
          th: "ป๊อปอัปแทรกเชิงอรรถ และศูนย์ข้อมูลบันทึกเวอร์ชัน",
        },
        description: {
          en: "Insert footnotes at cursor with an anchored floating popover, and explore update release notes anytime from Settings, Help, or on first startup.",
          th: "แทรกเชิงอรรถ (Footnote) ตรงจุดเคอร์เซอร์ด้วยป๊อปอัปแบบลอยตัว และเปิดดูบันทึกการอัปเดตเวอร์ชันได้จากทั้ง Settings, Help หรือเมื่อเปิดโปรแกรมครั้งแรก",
        },
        icon: Sparkles,
        badge: { en: "Update", th: "การอัปเดต", variant: "secondary" },
      },
    ],
    changes: [
      {
        category: { en: "Multimedia & Editor", th: "มัลติมีเดียและการพิมพ์งาน" },
        items: [
          {
            en: "Added VideoExtension and VideoNodeView for embedding HTML5 video with local asset cache resolution.",
            th: "เพิ่ม VideoExtension และ VideoNodeView สำหรับแทรกวิดีโอ HTML5 พร้อมระบบแคชดึงไฟล์วิดีโอจาก Workspace",
          },
          {
            en: "Added in-place QR Code edit button and auto-scanning text detection in the note editor.",
            th: "เพิ่มปุ่มแก้ไข QR Code ทันทีบนรูปภาพในโน้ต พร้อมระบบตรวจจับและสแกนอ่านข้อความเดิมอัตโนมัติ",
          },
          {
            en: "Added floating footnote reference input popover anchored to insertion cursor position.",
            th: "เพิ่มป๊อปอัปกรอกข้อความอ้างอิงเชิงอรรถแบบลอยตัวตรงตำแหน่งเคอร์เซอร์",
          },
          {
            en: "Refined HTML and CSS code editor with blur autosave flushing and cursor tracking.",
            th: "ปรับปรุงตัวแก้ไขโค้ด HTML/CSS ให้บันทึกอัตโนมัติเมื่อหลุดโฟกัสและระบุพิกัดเคอร์เซอร์แม่นยำ",
          },
        ],
      },
      {
        category: { en: "Security & Encryption", th: "ความปลอดภัยและการเข้ารหัส" },
        items: [
          {
            en: "Upgraded PBKDF2 iteration count to 600,000 according to OWASP guidelines.",
            th: "ปรับค่า Iterations ของ PBKDF2 เป็น 600,000 รอบตามคำแนะนำของ OWASP เพื่อความปลอดภัยสูงสุด",
          },
          {
            en: "Whitelisted encryption capability for .md, .txt, .html, and .css files.",
            th: "เปิดให้ล็อกไฟล์นามสกุล .md, .txt, .html และ .css ได้อย่างสมบูรณ์",
          },
          {
            en: "Implemented pinLockout state management to prevent lockout bypass via tab re-entry.",
            th: "พัฒนาระบบ pinLockout จัดการเวลารอการกรอกรหัสผิด ป้องกันการหลีกเลี่ยงด้วยการสลับแท็บ",
          },
          {
            en: "Distraction-free locked note viewer hides toolbars and indicators until unlocked.",
            th: "ซ่อนแถบเครื่องมือและสถานะการบันทึกระหว่างล็อก เพื่อความเป็นส่วนตัวและความเรียบง่ายสูงสุด",
          },
          {
            en: "Ensured locked notes stored in trash retain ciphertext and do not leak plaintext.",
            th: "ปกป้องโน้ตที่เข้ารหัสในถังขยะให้คงรูป Ciphertext เสมอ ป้องกันข้อมูลรั่วไหล",
          },
        ],
      },
      {
        category: { en: "Version History & Tabs", th: "ประวัติเวอร์ชันและระบบแท็บ" },
        items: [
          {
            en: "Enhanced VersionHistorySplitDiffView with synchronized scrolling and multi-format support.",
            th: "ปรับปรุง VersionHistorySplitDiffView ให้เลื่อนหน้าจอพร้อมกันและรองรับการเปรียบเทียบไฟล์หลากชนิด",
          },
          {
            en: "Added dedicated TabView for What's New / Release Notes (Luno Note vx.x.x).",
            th: "เพิ่ม TabView สำหรับแสดงข้อมูล What's New (Luno Note vx.x.x)",
          },
          {
            en: "First-run on a new version automatically opens release notes, bypassing onStartup preference once.",
            th: "เมื่อเปิดโปรแกรมในเวอร์ชันใหม่เป็นครั้งแรก จะเปิดหน้า Release Notes ให้อัตโนมัติ โดยข้ามการตั้งค่า onStartup ในครั้งแรก",
          },
        ],
      },
    ],
  },
  {
    version: "1.3.0",
    releaseDate: "2026",
    tagline: {
      en: "Major Overhaul: Interactive Knowledge Graph, Custom Fonts, QR Code Generator, and Custom Accent Theming",
      th: "อัปเกรดฟีเจอร์ใหญ่: ผังความสัมพันธ์ (Relations Graph), ระบบฟอนต์ใน Workspace, เครื่องมือสร้าง QR Code และธีมสี Accent",
    },
    highlights: [
      {
        title: {
          en: "Interactive Knowledge Graph (Relations View)",
          th: "ผังความสัมพันธ์โครงข่ายโน้ต (Relations View)",
        },
        description: {
          en: "Dynamic canvas-based force-directed graph visualizing bi-directional links, wikilinks, and cross-references.",
          th: "ผังแบบ Force-directed แสดงโครงข่ายความสัมพันธ์ ลิงก์สองทิศทาง และ Wikilinks ระหว่างโน้ตทั้งหมดใน Workspace",
        },
        icon: Zap,
      },
      {
        title: {
          en: "Workspace Custom Font Management",
          th: "ติดตั้งฟอนต์ลงใน Workspace ส่วนตัว",
        },
        description: {
          en: "Install .ttf, .otf, and .woff font files directly into the workspace with persistent runtime registration.",
          th: "อัปโหลดฟอนต์ .ttf, .otf และ .woff เข้า Workspace เพื่อใช้แสดงผลทันทีทั้งในแอปและตัวแก้ไข",
        },
        icon: FileText,
      },
      {
        title: {
          en: "Integrated QR Code Generator",
          th: "ระบบสร้างคิวอาร์โค้ด (QR Code) ในตัว",
        },
        description: {
          en: "Generate ISO-compliant QR codes with custom colors, transparency, ECC levels, and direct insertion into notes.",
          th: "สร้างคิวอาร์โค้ดความละเอียดสูง ปรับแต่งสี พื้นหลัง ระดับแก้ไขความผิดพลาด และแทรกลงในโน้ตได้ทันที",
        },
        icon: QrCode,
      },
      {
        title: {
          en: "Custom Accent Color Theming",
          th: "ปรับแต่งโทนสี Accent ตามใจชอบ",
        },
        description: {
          en: "Select custom hex colors with automated real-time HSL palette computation and adaptive logo branding.",
          th: "เลือกโทนสี Accent ในแบบของคุณด้วยระบบคำนวณ HSL อัตโนมัติ ปรับสีโลโก้และธีมแอปพลิเคชันอย่างกลมกลืน",
        },
        icon: Sparkles,
      },
      {
        title: {
          en: "Compact Activity Bar Layout (VS Code Style)",
          th: "แถบ Activity Bar สไตล์ VS Code",
        },
        description: {
          en: "Streamlined 52px left activity bar with an independent collapsible workspace explorer panel.",
          th: "แถบเครื่องมือด้านซ้ายสไตล์มินิมอล 52px พร้อมแผง Explorer แบบพับเก็บได้ ช่วยเพิ่มพื้นที่ใช้งานสูงสุด",
        },
        icon: Layers,
      },
    ],
    changes: [
      {
        category: { en: "Features", th: "ฟีเจอร์ใหม่" },
        items: [
          {
            en: "Added Relations graph canvas with physics simulation, search filtering, and node navigation.",
            th: "เพิ่มผังความสัมพันธ์ Relations View พร้อมระบบฟิสิกส์ การค้นหา และกดเปิดโน้ตได้ทันที",
          },
          {
            en: "Added .luno/fonts storage and workspace-level custom font registration.",
            th: "เพิ่มระบบจัดเก็บและโหลดฟอนต์ในโฟลเดอร์ .luno/fonts ประจำแต่ละ Workspace",
          },
          {
            en: "Added standalone QR Code generator dialog with image copy and download.",
            th: "เพิ่มหน้าต่างสร้าง QR Code พร้อมตัวเลือกคัดลอกรูปภาพและบันทึกไฟล์",
          },
          {
            en: "Added Custom accent color theme with live CSS variable injection.",
            th: "เพิ่มตัวเลือกธีม Custom สีตามรหัส Hex พร้อมคำนวณตัวแปร CSS อัตโนมัติ",
          },
          {
            en: "Added VS Code style compact activity bar layout.",
            th: "เพิ่มเค้าโครงหน้าจอแบบแถบเมนูกะทัดรัด Activity Bar สไตล์ VS Code",
          },
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    releaseDate: "2026",
    tagline: {
      en: "Cloud Sync with Google Drive, Custom Fonts, and Dual Pane Split View",
      th: "เชื่อมต่อ Google Drive Cloud Sync, ติดตั้งฟอนต์กำหนดเอง และ Dual Pane Split View",
    },
    highlights: [
      {
        title: {
          en: "Google Drive Cloud Synchronization",
          th: "ระบบซิงก์ข้อมูลผ่าน Google Drive",
        },
        description: {
          en: "Sync your markdown notes and attachments effortlessly with your private Google Drive storage.",
          th: "เชื่อมต่อและสำรองไฟล์โน้ตและรูปภาพของคุณเข้ากับ Google Drive ได้อย่างง่ายดายและปลอดภัย",
        },
        icon: Zap,
      },
      {
        title: {
          en: "Custom Typography & Fonts",
          th: "ติดตั้งและเลือกใช้ฟอนต์ได้ตามใจ",
        },
        description: {
          en: "Import and apply your own TTF/OTF fonts across the editor and UI for a personalized writing atmosphere.",
          th: "อัปโหลดฟอนต์ TTF/OTF ของตนเองเพื่อใช้แสดงผลในส่วนพิมพ์งานและส่วนต่อประสานทั้งหมด",
        },
        icon: FileText,
      },
      {
        title: {
          en: "Dual Pane Split Editor",
          th: "แบ่งหน้าจอทำงานสองฝั่ง (Split View)",
        },
        description: {
          en: "Open and edit two notes simultaneously side-by-side with independent scroll positions and toolbars.",
          th: "เปิดอ่านหรือแก้ไขเอกสารสองไฟล์พร้อมกันแบบแบ่งครึ่งหน้าจอได้อย่างอิสระ",
        },
        icon: Layers,
      },
    ],
    changes: [
      {
        category: { en: "Features", th: "ฟีเจอร์" },
        items: [
          {
            en: "Added Google Drive Cloud Sync with automated conflict resolution.",
            th: "เพิ่มการซิงก์ Google Drive พร้อมระบบจัดการกรณีไฟล์ขัดแย้งกัน",
          },
          {
            en: "Added custom font file uploader and font family selectors in Appearance settings.",
            th: "เพิ่มตัวอัปโหลดฟอนต์และการเลือกฟอนต์ในหน้าตั้งค่า Appearance",
          },
          {
            en: "Added Split View support for all notes and system views.",
            th: "รองรับ Split View สำหรับเอกสารและมุมมองระบบทั้งหมด",
          },
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    releaseDate: "2026",
    tagline: {
      en: "Note Templates, Audio Voice Memos, and Trash Recovery",
      th: "ระบบแม่แบบเอกสาร (Templates), บันทึกเสียง และระบบถังขยะกู้คืนข้อมูล",
    },
    highlights: [
      {
        title: {
          en: "Built-in & Custom Note Templates",
          th: "แม่แบบเอกสารสำเร็จรูปและปรับแต่งเอง",
        },
        description: {
          en: "Start notes rapidly with Daily Log, Meeting Notes, Project Canvas, or design your own templates.",
          th: "สร้างโน้ตใหม่อย่างรวดเร็วด้วยแม่แบบ Daily Log, บันทึกการประชุม หรือแม่แบบที่คุณออกแบบเอง",
        },
        icon: FileCode,
      },
      {
        title: {
          en: "Voice Memos & Audio Player",
          th: "บันทึกเสียงและเครื่องเล่นเสียงในตัว",
        },
        description: {
          en: "Record spoken thoughts and embed audio recordings directly inside your notes.",
          th: "อัดเสียงบันทึกการประชุมหรือไอเดียโดยตรงในโน้ต พร้อมเครื่องเล่นเสียงในตัว",
        },
        icon: Zap,
      },
      {
        title: {
          en: "Trash & Permanent Recovery",
          th: "ถังขยะและระบบกู้คืนไฟล์",
        },
        description: {
          en: "Safely delete notes with the option to restore or permanently erase them at your convenience.",
          th: "ลบโน้ตอย่างปลอดภัยพร้อมตัวเลือกในการกู้คืนหรือลบทิ้งถาวรได้ตามต้องการ",
        },
        icon: History,
      },
    ],
    changes: [
      {
        category: { en: "Features", th: "ฟีเจอร์" },
        items: [
          {
            en: "Added Templates gallery and template creation workflow.",
            th: "เพิ่มหน้ารวมเทมเพลตและระบบบันทึกโน้ตเป็นแม่แบบใหม่",
          },
          {
            en: "Added embedded audio recorder and player with waveform visualization.",
            th: "เพิ่มตัวอัดและเล่นเสียงพร้อมแสดงคลื่นเสียงในเอกสาร",
          },
          {
            en: "Added dedicated Trash view with batch restore and empty trash actions.",
            th: "เพิ่มหน้าถังขยะพร้อมปุ่มกู้คืนและล้างถังขยะทั้งหมด",
          },
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    releaseDate: "2026",
    tagline: {
      en: "Initial Release of Luno Note — Fast, Local-first Markdown Workspace",
      th: "เปิดตัว Luno Note เวอร์ชันแรก — พื้นที่จดบันทึก Markdown ที่รวดเร็วและปลอดภัยในเครื่องคุณ",
    },
    highlights: [
      {
        title: {
          en: "Local-First Workspace & Markdown Engine",
          th: "ทำงานแบบ Local-First บนเครื่องคอมพิวเตอร์ของคุณ",
        },
        description: {
          en: "Full offline privacy and performance with instant file saving and directory workspace support.",
          th: "ข้อมูลทั้งหมดอยู่ในเครื่องของคุณแบบออฟไลน์ บันทึกรวดเร็วและปลอดภัย",
        },
        icon: ShieldCheck,
      },
    ],
    changes: [
      {
        category: { en: "Foundation", th: "การเปิดตัว" },
        items: [
          {
            en: "Rich Markdown WYSIWYG & Source editing modes.",
            th: "รองรับโหมดแก้ไขทั้งแบบ WYSIWYG และ Source Markdown",
          },
          {
            en: "Slash commands (/), code blocks, math formulas, and interactive tables.",
            th: "คำสั่งลัด Slash (/), บล็อกโค้ด, สูตรคณิตศาสตร์ และตารางแบบโต้ตอบได้",
          },
          {
            en: "Fast global search and file tree organization.",
            th: "ค้นหาข้อมูลด่วนทั่วทั้งพื้นที่ทำงานและโครงสร้างโฟลเดอร์แบบลำดับชั้น",
          },
        ],
      },
    ],
  },
];

export default function WhatsNewView({
  onClose,
  onOpenSettings,
  onOpenHelp,
  onOpenWebTab,
}: WhatsNewViewProps) {
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";
  const [selectedVersion, setSelectedVersion] = useState<string>(APP_VERSION);
  const [expandedOlderVersions, setExpandedOlderVersions] = useState<Record<string, boolean>>({});

  const activeRelease = RELEASES.find((r) => r.version === selectedVersion) || RELEASES[0];

  const toggleExpand = (version: string) => {
    setExpandedOlderVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full min-h-0 overflow-y-auto bg-background text-foreground select-none flex flex-col no-scrollbar">
        <div className="max-w-5xl w-full mx-auto px-6 py-6 sm:py-7 flex-1 flex flex-col gap-8">
          {/* 1. Header Section (matching Tags/Favorites tab views) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <img src={lunoLogo} alt="Luno" className="h-6 w-6 object-contain select-none shrink-0 luno-app-logo" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Luno Note v{APP_VERSION}
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
                  {isTh ? "เวอร์ชันล่าสุด" : "Latest Version"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTh
                  ? "บันทึกการอัปเดตและฟีเจอร์ใหม่ทั้งหมดใน Luno Note"
                  : "Changelog and overview of what's new in Luno Note"}
              </p>
            </div>

            {/* Action Buttons Group (Settings, Help, GitHub Release) */}
            <div className="flex items-center gap-1 shrink-0 self-start md:self-center">
              {onOpenSettings && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenSettings("about")}
                      className="h-7 w-7 rounded-md shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">{isTh ? "ตั้งค่า" : "Settings"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isTh ? "ตั้งค่า" : "Settings"}</TooltipContent>
                </Tooltip>
              )}
              {onOpenHelp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenHelp("features")}
                      className="h-7 w-7 rounded-md shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">{isTh ? "คู่มือ" : "Help"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isTh ? "คู่มือ" : "Help"}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (onOpenWebTab) {
                        onOpenWebTab(APP_LATEST_RELEASE_URL, `GitHub - Luno Note Releases`);
                      } else {
                        openExternalUrl(APP_LATEST_RELEASE_URL);
                      }
                    }}
                    className="h-7 w-7 rounded-md shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
                    aria-label={isTh ? "เปิด GitHub Release ล่าสุด" : "Open Latest GitHub Release"}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">{isTh ? "GitHub Release ล่าสุด" : "Latest GitHub Release"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isTh ? "GitHub Release ล่าสุด" : "Latest GitHub Release"}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Release Header & Key Feature Highlights */}
          <div className="space-y-6 pt-1 sm:pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  {isTh ? `เปิดตัวในปี ${activeRelease.releaseDate}` : `Released in ${activeRelease.releaseDate}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                {isTh ? activeRelease.tagline.th : activeRelease.tagline.en}
              </h2>
            </div>

          {/* Key Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRelease.highlights.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug truncate">
                        {isTh ? feat.title.th : feat.title.en}
                      </h3>
                    </div>
                    {feat.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {isTh ? feat.badge.th : feat.badge.en}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                    {isTh ? feat.description.th : feat.description.en}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Detailed Changes List */}
          {activeRelease.changes && activeRelease.changes.length > 0 && (
            <div className="pt-4 border-t border-border/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isTh ? "รายละเอียดการเปลี่ยนแปลงทั้งหมด" : "Changelog Details"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRelease.changes.map((group, gIdx) => (
                  <div key={gIdx} className="rounded-2xl border border-border/50 bg-muted/20 p-4 space-y-2.5">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{isTh ? group.category.th : group.category.en}</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {group.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-primary font-bold leading-none mt-1">•</span>
                          <span>{isTh ? item.th : item.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Older Versions Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">
                {isTh ? "ประวัติเวอร์ชันก่อนหน้า" : "Previous Releases"}
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {RELEASES.filter((r) => !r.isLatest).map((rel) => {
              const isExpanded = !!expandedOlderVersions[rel.version];
              return (
                <div
                  key={rel.version}
                  className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(rel.version)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-semibold text-foreground shrink-0">
                        v{rel.version}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {isTh ? rel.tagline.th : rel.tagline.en}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0 ml-2">
                      <span className="text-[11px]">{rel.releaseDate}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-border/40 bg-card/40 space-y-3 mt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                        {rel.highlights.map((feat, idx) => (
                          <div key={idx} className="text-xs p-3 rounded-xl bg-background border border-border/50 space-y-1">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                              <span>{isTh ? feat.title.th : feat.title.en}</span>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              {isTh ? feat.description.th : feat.description.en}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 pb-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            <a
              href={APP_AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                if (onOpenWebTab) {
                  onOpenWebTab(APP_AUTHOR_URL, `GitHub - ${APP_AUTHOR}`);
                } else {
                  openExternalUrl(APP_AUTHOR_URL);
                }
              }}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {APP_ABOUT_CREDIT}
            </a>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Luno Note v{APP_VERSION}</span>
            <span>•</span>
            <span>Privacy-First & Local-Only</span>
          </div>
        </div>
      </div>
    </div>
  </TooltipProvider>
);
}
