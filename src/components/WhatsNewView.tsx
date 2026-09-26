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
  Archive,
  Mic,
  RefreshCw,
  FolderSync,
  Languages,
  Cloud,
  Download,
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
    version: "1.3.2",
    releaseDate: "2026",
    isLatest: true,
    tagline: {
      en: "HTML Browser & URL Navigation, Comprehensive Tooltip System, Slash Command Toggle, Media PiP & High-Fidelity Exports",
      th: "พรีวิวไฟล์ HTML พร้อมแถบ URL นำทาง, ปรับระบบ Tooltip ทั้งโปรแกรม, ตั้งค่าเปิด-ปิด Slash Command, หน้าต่างวิดีโอลอยตัว (PiP) และปรับปรุงระบบส่งออกเอกสาร",
    },
    highlights: [
      {
        title: {
          en: "Real File Path & Browser Navigation in HTML Preview",
          th: "แสดงพาธจริงและเปิดในเบราว์เซอร์จากหน้าพรีวิว HTML",
        },
        description: {
          en: "URL bar displays actual relative workspace paths or file:/// URLs with quick 'Open in Default Browser' and robust clipboard copy actions.",
          th: "แถบ URL แสดง Relative Path หรือ file:/// พร้อมปุ่มเปิดในเบราว์เซอร์หลักของเครื่อง และปุ่มคัดลอกพาธลงคลิปบอร์ดที่ทำงานได้จริงทุกสภาพแวดล้อม",
        },
        icon: FileCode,
        badge: { en: "HTML Preview", th: "พรีวิว HTML", variant: "default" },
      },
      {
        title: {
          en: "Unified & Accessible Tooltip Overhaul",
          th: "ยกเครื่องระบบ Tooltip ทั่วทั้งโปรแกรม",
        },
        description: {
          en: "Replaced legacy browser title attributes with polished, accessible UI tooltips across the Sidebar, TabBar, Breadcrumb, Node Views, and Panels.",
          th: "เปลี่ยนป้ายกำกับ title ดั้งเดิมของเบราว์เซอร์เป็น Tooltip ที่สวยงาม สม่ำเสมอ และรองรับ Accessibility ทั้งแถบข้าง, แถบแท็บ, แถบเส้นทาง และแผงควบคุมต่าง ๆ",
        },
        icon: Layers,
        badge: { en: "UI / UX", th: "หน้าตาโปรแกรม", variant: "secondary" },
      },
      {
        title: {
          en: "Customizable Slash Command (/) & Clean Placeholders",
          th: "เปิด-ปิด Slash Command (/) พร้อม Placeholder ที่สะอาดตา",
        },
        description: {
          en: "Toggle Slash Commands on or off in Settings > Editor. When disabled, empty lines display a distraction-free placeholder without prompting for '/'.",
          th: "ตั้งค่าเปิดหรือปิดการเรียกใช้ Slash Command ได้ที่การตั้งค่าเอดิเตอร์ เมื่อปิดใช้งาน บรรทัดว่างจะแสดงข้อความเริ่มต้นที่สะอาดตาโดยไม่มีข้อความชวนพิมพ์ /",
        },
        icon: Settings,
        badge: { en: "Editor", th: "เอดิเตอร์", variant: "default" },
      },
      {
        title: {
          en: "Floating Video Picture-in-Picture (PiP) & Media Pickers",
          th: "หน้าต่างวิดีโอลอยตัวข้ามแท็บ (PiP) และระบบเลือกสื่อ",
        },
        description: {
          en: "Watch videos seamlessly across tabs with floating Picture-in-Picture playback, dedicated workspace video pickers, and custom protocol caching.",
          th: "รับชมวิดีโอต่อเนื่องได้ทุกแท็บด้วยหน้าต่างลอยตัว (Picture-in-Picture) พร้อมหน้าต่างเลือกวิดีโอจากโฟลเดอร์งาน และโปรโตคอล luno-asset:// ที่รวดเร็วปลอดภัย",
        },
        icon: Video,
        badge: { en: "Media", th: "มัลติมีเดีย", variant: "default" },
      },
      {
        title: {
          en: "High-Fidelity PDF & Document Exporting",
          th: "ส่งออกเอกสารและ PDF คุณภาพสูง",
        },
        description: {
          en: "Enhanced PDF rendering engine synchronizes web fonts, images, and math formulas before printing, paired with rich DOCX export capabilities.",
          th: "ระบบพิมพ์เป็น PDF โฉมใหม่ รอการโหลดฟอนต์ รูปภาพ และสูตรคณิตศาสตร์ให้เสร็จสิ้นก่อนเรนเดอร์ พร้อมตัวสร้างเอกสาร Word (DOCX) ที่สมบูรณ์แบบ",
        },
        icon: Download,
        badge: { en: "Export", th: "การส่งออก", variant: "secondary" },
      },
      {
        title: {
          en: "Updated Tip of the Day & Editing Polish",
          th: "เกร็ดความรู้ประจำวันใหม่และปรับปรุงการจัดหน้า",
        },
        description: {
          en: "Expanded modern workflow tips, refined multi-file drag-and-drop in the sidebar, and accurate blank line preservation around headings.",
          th: "เพิ่มเคล็ดลับการใช้งานที่หลากหลายและทันสมัยขึ้น ปรับปรุงการลากย้ายหลายไฟล์พร้อมกันใน Sidebar และรักษาบรรทัดว่างรอบหัวข้อได้อย่างแม่นยำ 1:1",
        },
        icon: Sparkles,
        badge: { en: "Improvement", th: "การปรับปรุง", variant: "outline" },
      },
    ],
    changes: [
      {
        category: { en: "HTML & Web Viewer", th: "การพรีวิว HTML และเว็บ" },
        items: [
          {
            en: "Display relative file paths and file:/// URLs directly in the preview address bar.",
            th: "แสดงพาธสัมพันธ์ (Relative Path) และ URL แบบ file:/// ในแถบที่อยู่ของหน้าพรีวิว",
          },
          {
            en: "Added 'Open in default browser' button to launch the rendered HTML document externally.",
            th: "เพิ่มปุ่ม 'เปิดในเบราว์เซอร์หลัก' เพื่อเปิดดูเอกสาร HTML ในเว็บเบราว์เซอร์ภายนอกทันที",
          },
          {
            en: "Fixed 'Copy path' action with robust clipboard utilities and document.execCommand fallback.",
            th: "แก้ไขปุ่ม 'คัดลอกพาธ' ให้บันทึกลงคลิปบอร์ดจริงได้อย่างแม่นยำ พร้อมระบบ Fallback รองรับทุกสภาวะ",
          },
          {
            en: "Automatic live refresh and state persistence when editing linked HTML files.",
            th: "อัปเดตการแสดงผลอัตโนมัติทันทีที่แก้ไขไฟล์ HTML พร้อมจดจำสถานะและบันทึกข้อมูลอย่างปลอดภัย",
          },
        ],
      },
      {
        category: { en: "Editor & Formatting", th: "เอดิเตอร์และการจัดรูปแบบ" },
        items: [
          {
            en: "Added enableSlashCommand setting under Editor > Formatting Helpers to toggle slash commands on or off.",
            th: "เพิ่มการตั้งค่าเปิด-ปิด Slash Command ในเมนูการตั้งค่า > เอดิเตอร์ > เครื่องมือช่วยจัดรูปแบบ",
          },
          {
            en: "Dynamic line placeholder hides '/' prompt when slash command is disabled, showing a clean prompt.",
            th: "ปรับแต่ง Placeholder อัตโนมัติ ไม่แสดงข้อความชวนพิมพ์ / เมื่อปิดการใช้งาน Slash Command",
          },
          {
            en: "Suppressed 'Type to search...' placeholder when slash commands are turned off.",
            th: "ปิดการแสดงคำใบ้ 'พิมพ์เพื่อค้นหา...' เมื่อปิดฟังก์ชัน Slash Command",
          },
          {
            en: "Refined Toggle list header title placeholder to show clean, localized labels.",
            th: "ปรับแต่ง Placeholder บนหัวข้อ Toggle list ให้กระชับ สวยงาม และตรงตามภาษาที่เลือก",
          },
          {
            en: "Guaranteed 1:1 blank line and paragraph spacing preservation around headings and blockquotes across tab switching.",
            th: "คงจำนวนบรรทัดว่างและย่อหน้าก่อนและหลังหัวข้อ/ข้อความอ้างอิงให้แม่นยำ 1:1 เสมอเมื่อสลับแท็บ",
          },
        ],
      },
      {
        category: { en: "User Interface & Experience", th: "อินเทอร์เฟซและประสบการณ์ผู้ใช้" },
        items: [
          {
            en: "System-wide conversion from native title labels to accessible Shadcn/Radix tooltip components.",
            th: "ปรับเปลี่ยนป้ายกำกับ title ทั่วทั้งโปรแกรมให้เป็น Tooltip ที่สวยงาม คมชัด และเป็นมิตรกับผู้ใช้งาน",
          },
          {
            en: "Polished tooltips across Sidebar navigation, TabBar, Breadcrumb, RelationsView, TrashView, and Settings.",
            th: "ปรับแต่ง Tooltip บนแถบข้าง, แถบแท็บ, แถบนำทาง, แผนผังความสัมพันธ์, ถังขยะ และหน้าตั้งค่า",
          },
          {
            en: "Preserved multi-selection state during drag-and-drop operations in the Sidebar tree.",
            th: "คงสถานะการเลือกหลายไฟล์พร้อมกันเมื่อลากย้าย (Drag and drop) ในรายการไฟล์ของแถบข้าง",
          },
          {
            en: "Expanded Tip of the Day library with modern, practical productivity and workflow tips.",
            th: "อัปเดตคลังเกร็ดความรู้ประจำวัน (Tip of the day) ด้วยคำแนะนำการใช้งานและเทคนิคการทำงานใหม่ ๆ",
          },
        ],
      },
      {
        category: { en: "Media, Export & Platform", th: "มัลติมีเดีย การส่งออก และระบบภายใน" },
        items: [
          {
            en: "Introduced Global Video Picture-in-Picture (PiP) floating player across tab navigations.",
            th: "เพิ่มระบบเล่นวิดีโอแบบ Picture-in-Picture (PiP) ลอยตัวข้ามหน้าต่างและสลับแท็บได้อย่างต่อเนื่อง",
          },
          {
            en: "Registered custom luno-asset:// protocol in Electron for fast, sandbox-safe local media streaming.",
            th: "ลงทะเบียนโปรโตคอล luno-asset:// ใน Electron สำหรับโหลดไฟล์สื่อในเครื่องอย่างรวดเร็วและปลอดภัย",
          },
          {
            en: "Added dedicated Workspace Video and Image picker dialogs with context menus.",
            th: "เพิ่มหน้าต่างเลือกไฟล์วิดีโอและรูปภาพจากโฟลเดอร์งาน พร้อมเมนูคลิกขวาจัดการสื่อ",
          },
          {
            en: "Enhanced print-to-PDF pipeline with font and image pre-rendering guarantees.",
            th: "ปรับปรุงกระบวนการส่งออก PDF ให้รอโหลดฟอนต์และรูปภาพทั้งหมดให้สมบูรณ์ก่อนสร้างไฟล์",
          },
          {
            en: "Added native window fullscreen toggle controls via IPC.",
            th: "เพิ่มคำสั่งควบคุมโหมดเต็มหน้าจอ (Fullscreen) ผ่าน IPC บนระบบเดสก์ท็อป",
          },
        ],
      },
    ],
  },
  {
    version: "1.3.1",
    releaseDate: "2026",
    isLatest: false,
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
    version: "1.2.7",
    releaseDate: "2026",
    tagline: {
      en: "Native OAuth Tab Closer, Omni-Channel Image Pasting & UI Improvements",
      th: "ปิดแท็บ OAuth อัตโนมัติ, วางรูปภาพได้ครอบคลุมทุกจุด และปรับปรุงส่วนติดต่อผู้ใช้",
    },
    highlights: [
      {
        title: {
          en: "Native OAuth Auto-Close & Window Focus",
          th: "ปิดแท็บ OAuth อัตโนมัติและโฟกัสหน้าต่าง Luno",
        },
        description: {
          en: "Browser tab automatically closes upon completing Google OAuth authentication, seamlessly refocusing the Luno Note desktop window.",
          th: "ปิดแท็บเบราว์เซอร์ให้อัตโนมัติเมื่อยืนยันสิทธิ์ Google OAuth สำเร็จ พร้อมสลับโฟกัสกลับมายังหน้าต่างโปรแกรม Luno Note ทันที",
        },
        icon: ShieldCheck,
      },
      {
        title: {
          en: "Omni-Channel Clipboard Image Pasting",
          th: "วางรูปภาพจากคลิปบอร์ดได้ทุกตำแหน่ง",
        },
        description: {
          en: "Paste copied images directly anywhere across the editor with automatic asset naming and reliable inline embedding.",
          th: "คัดลอกรูปภาพแล้วกดวางลงในตัวแก้ไขข้อความได้โดยตรงจากทุกที่ พร้อมตั้งชื่อไฟล์แนบและแสดงผลในบรรทัดทันที",
        },
        icon: FileText,
      },
      {
        title: {
          en: "Automated Release Workflow Polish",
          th: "ปรับปรุงกระบวนการปล่อยอัปเดตและเสถียรภาพ",
        },
        description: {
          en: "Refined CI/CD automated build pipelines with pre-clean steps and bash release note generation.",
          th: "ปรับปรุงระบบ CI/CD สร้างตัวติดตั้งเวอร์ชันใหม่อัตโนมัติพร้อมบันทึกประวัติการเปลี่ยนแปลง",
        },
        icon: Sparkles,
      },
    ],
    changes: [
      {
        category: { en: "Authentication & Cloud", th: "การยืนยันตัวตนและคลาวด์" },
        items: [
          {
            en: "Added native browser tab closer and instant desktop focus on Google Drive OAuth completion.",
            th: "เพิ่มระบบปิดแท็บเบราว์เซอร์อัตโนมัติและโฟกัสแอปทันทีเมื่อยืนยัน Google Drive OAuth เสร็จสิ้น",
          },
          {
            en: "Optimized loopback local server port handling for OAuth callbacks.",
            th: "ปรับปรุงการจัดการพอร์ต Local Server สำหรับรับผลการยืนยัน OAuth ให้เสถียรยิ่งขึ้น",
          },
        ],
      },
      {
        category: { en: "Editor & Media", th: "ตัวแก้ไขและสื่อมัลติมีเดีย" },
        items: [
          {
            en: "Enhanced synchronous and asynchronous clipboard image pasting with fallback mechanisms.",
            th: "ยกระดับการวางรูปภาพจากคลิปบอร์ดทั้งแบบ Synchronous และ Asynchronous พร้อมระบบสำรองกรณีฉุกเฉิน",
          },
          {
            en: "Refined local attachment path resolution in markdown view.",
            th: "ปรับปรุงการแปลงพาธไฟล์แนบภายในเครื่องเพื่อแสดงผลรูปภาพในมุมมอง Markdown",
          },
        ],
      },
    ],
  },
  {
    version: "1.2.6",
    releaseDate: "2026",
    tagline: {
      en: "Instant Image Pasting with Block Fallback & Dynamic OAuth Security",
      th: "วางรูปภาพทันทีพร้อมระบบ Block Fallback และระบบยืนยันตัวตน Google Drive OAuth",
    },
    highlights: [
      {
        title: {
          en: "Instant Image Pasting with Block Fallback",
          th: "วางรูปภาพทันใจพร้อมระบบ Block Fallback",
        },
        description: {
          en: "Paste image files or clipboard screenshots directly at cursor position with robust node-level block fallbacks.",
          th: "วางไฟล์รูปภาพหรือภาพหน้าจอจากคลิปบอร์ดลงตรงตำแหน่งเคอร์เซอร์ได้ทันที พร้อมระบบจัดการบล็อกสำรอง",
        },
        icon: FileText,
      },
      {
        title: {
          en: "Dynamic OAuth Client Secrets",
          th: "ระบบจัดการกุญแจ Google OAuth แบบไดนามิก",
        },
        description: {
          en: "Secure dynamic resolution of Google Drive OAuth client credentials ensuring permanent sync reliability.",
          th: "จัดการและดึงกุญแจเชื่อมต่อ Google OAuth อย่างปลอดภัย ช่วยให้ระบบซิงก์ทำงานได้อย่างต่อเนื่อง",
        },
        icon: ShieldCheck,
      },
    ],
    changes: [
      {
        category: { en: "Editor", th: "ตัวแก้ไขข้อความ" },
        items: [
          {
            en: "Added instant clipboard image paste handler with custom node insert fallback.",
            th: "เพิ่มระบบตรวจจับการวางรูปภาพจากคลิปบอร์ดพร้อมตัวแทรกบล็อกรูปภาพอัตโนมัติ",
          },
          {
            en: "Resolved image attachment local storage path resolution.",
            th: "แก้ปัญหาการระบุตำแหน่งบันทึกไฟล์รูปภาพแนบในเครื่อง",
          },
        ],
      },
      {
        category: { en: "Cloud & Security", th: "คลาวด์และความปลอดภัย" },
        items: [
          {
            en: "Implemented dynamic resolution for Google Drive OAuth client secrets.",
            th: "พัฒนาระบบตรวจสอบ Client Secret ของ Google Drive OAuth แบบไดนามิก",
          },
          {
            en: "Added OAuth completion confirmation landing page.",
            th: "เพิ่มหน้าเว็บแจ้งสถานะเมื่อยืนยันตัวตน OAuth สำเร็จ",
          },
        ],
      },
    ],
  },
  {
    version: "1.2.2",
    releaseDate: "2026",
    tagline: {
      en: "Workspace ZIP Backup, Superscript/Subscript, Gemini Auto-Fallback & Google Drive OAuth Sync",
      th: "สำรองข้อมูล Workspace เป็นไฟล์ ZIP, รองรับตัวยก/ตัวห้อย, ระบบสลับโมเดล Gemini อัตโนมัติ และ Google Drive Sync",
    },
    highlights: [
      {
        title: {
          en: "Full Workspace ZIP Backup & Export",
          th: "สำรองข้อมูลทั้ง Workspace เป็นไฟล์ ZIP",
        },
        description: {
          en: "Export and back up your entire notes workspace, folders, and attachments into a compressed ZIP file with one click.",
          th: "ส่งออกและสำรองข้อมูลโน้ต โฟลเดอร์ และไฟล์แนบทั้งหมดใน Workspace เป็นไฟล์ ZIP บีบอัดได้ในคลิกเดียว",
        },
        icon: Archive,
      },
      {
        title: {
          en: "Superscript and Subscript Formatting",
          th: "จัดรูปแบบตัวยกและตัวห้อย (Superscript / Subscript)",
        },
        description: {
          en: "Write mathematical formulas, chemical compounds, and footnotes with dedicated superscript and subscript controls.",
          th: "พิมพ์สูตรคณิตศาสตร์ สมการเคมี และเชิงอรรถได้สะดวกด้วยปุ่มและคีย์ลัดตัวยก (x²) และตัวห้อย (H₂O)",
        },
        icon: FileCode,
      },
      {
        title: {
          en: "Intelligent Gemini Model Auto-Fallback",
          th: "ระบบสลับโมเดล AI Gemini อัตโนมัติเมื่อมีปัญหา",
        },
        description: {
          en: "Automatically falls back to alternative Gemini models if the primary model encounters quota or network errors.",
          th: "สลับไปใช้โมเดล Gemini สำรองโดยอัตโนมัติหากโมเดลหลักติดโควตาหรือมีปัญหาการเชื่อมต่อ",
        },
        icon: Sparkles,
      },
    ],
    changes: [
      {
        category: { en: "Backup & Export", th: "การสำรองข้อมูลและส่งออก" },
        items: [
          {
            en: "Added one-click Workspace ZIP export in Settings.",
            th: "เพิ่มปุ่มส่งออก Workspace ทั้งหมดเป็นไฟล์ ZIP ในหน้าการตั้งค่า",
          },
        ],
      },
      {
        category: { en: "Editor & Formatting", th: "ตัวแก้ไขและการจัดรูปแบบ" },
        items: [
          {
            en: "Added Superscript (Ctrl+.) and Subscript (Ctrl+,) custom marks.",
            th: "เพิ่มปุ่มและคีย์ลัดสำหรับตัวยก (Ctrl+.) และตัวห้อย (Ctrl+,)",
          },
        ],
      },
      {
        category: { en: "AI Assistant", th: "ผู้ช่วย AI" },
        items: [
          {
            en: "Implemented automatic fallback strategy for Gemini 2.5 Flash / Pro models.",
            th: "เพิ่มระบบสลับโมเดลอัตโนมัติระหว่าง Gemini 2.5 Flash / Pro เพื่อความต่อเนื่องในการใช้งาน",
          },
        ],
      },
    ],
  },
  {
    version: "1.2.1",
    releaseDate: "2026",
    tagline: {
      en: "Gemini Voice Dictation, Custom Icon Support, Folder Sync & English README",
      th: "พิมพ์ด้วยเสียงผ่าน Gemini AI (Voice Dictation), รองรับไอคอนกำหนดเอง และซิงก์โฟลเดอร์",
    },
    highlights: [
      {
        title: {
          en: "Gemini Voice Dictation",
          th: "พิมพ์ด้วยเสียงผ่าน Gemini AI (Voice Dictation)",
        },
        description: {
          en: "Speak naturally and let Gemini AI transcribe and punctuate your speech directly into clean markdown notes.",
          th: "พูดบันทึกเสียงแล้วให้ Gemini AI ถอดความและจัดรูปแบบเป็นข้อความลงในโน้ตให้อัตโนมัติ",
        },
        icon: Mic,
      },
      {
        title: {
          en: "Custom File & Folder Icons",
          th: "ปรับแต่งไอคอนไฟล์และโฟลเดอร์",
        },
        description: {
          en: "Assign customized Lucide, Tabler, and Phosphor icons to any folder or note for visual categorization.",
          th: "เลือกไอคอนที่ต้องการให้กับโฟลเดอร์และไฟล์โน้ตเพื่อจัดหมวดหมู่อย่างสวยงาม",
        },
        icon: Layers,
      },
      {
        title: {
          en: "Hierarchical Folder Sync",
          th: "ซิงก์โฟลเดอร์แบบลำดับชั้น",
        },
        description: {
          en: "Full recursive directory sync preserving nested folder trees with Google Drive cloud storage.",
          th: "ซิงก์โครงสร้างโฟลเดอร์ย่อยหลายชั้นกับ Google Drive ได้อย่างแม่นยำและเป็นระเบียบ",
        },
        icon: FolderSync,
      },
    ],
    changes: [
      {
        category: { en: "AI & Audio", th: "ระบบ AI และเสียง" },
        items: [
          {
            en: "Integrated Gemini multimodal audio transcription for speech-to-text dictation.",
            th: "เชื่อมต่อระบบถอดเสียงด้วย Gemini Multimodal Audio สำหรับพิมพ์งานด้วยเสียง",
          },
        ],
      },
      {
        category: { en: "File Management", th: "การจัดการไฟล์" },
        items: [
          {
            en: "Added Icon Picker dialog for folder and file customization.",
            th: "เพิ่มหน้าต่างเลือกไอคอนสำหรับกำหนดไอคอนเฉพาะของแต่ละโฟลเดอร์และไฟล์",
          },
          {
            en: "Enhanced recursive directory tree sync with Google Drive.",
            th: "ปรับปรุงการซิงก์โฟลเดอร์แบบ Recursive กับ Google Drive",
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
    version: "1.1.2",
    releaseDate: "2026",
    tagline: {
      en: "Desktop Auto-Updater with In-App Notifications & Stability Guards",
      th: "ระบบอัปเดตอัตโนมัติบนเดสก์ท็อปพร้อมการแจ้งเตือนแบบ Toast และปรับปรุงเสถียรภาพ",
    },
    highlights: [
      {
        title: {
          en: "Background Desktop Auto-Updater",
          th: "ระบบตรวจหาและดาวน์โหลดอัปเดตเบื้องหลัง",
        },
        description: {
          en: "Automatically detects new releases on startup and downloads them silently in the background.",
          th: "ตรวจหาเวอร์ชันใหม่จาก GitHub เมื่อเปิดโปรแกรม และดาวน์โหลดไฟล์อัปเดตในเบื้องหลังโดยอัตโนมัติ",
        },
        icon: RefreshCw,
      },
      {
        title: {
          en: "Updater Error Recovery & Guards",
          th: "ระบบป้องกันข้อผิดพลาดของ Auto-Updater",
        },
        description: {
          en: "Robust guards against updater initialization errors and clear human-readable update notifications.",
          th: "เพิ่มระบบป้องกันความผิดพลาดในการเริ่มต้นตัวอัปเดตและแสดงข้อความแจ้งเตือนที่เข้าใจง่าย",
        },
        icon: ShieldCheck,
      },
    ],
    changes: [
      {
        category: { en: "Auto-Updater", th: "ระบบอัปเดตอัตโนมัติ" },
        items: [
          {
            en: "Integrated electron-updater with background download and restart-to-install flow.",
            th: "ติดตั้ง electron-updater พร้อมระบบดาวน์โหลดเบื้องหลังและปุ่มรีสตาร์ทเพื่อติดตั้ง",
          },
          {
            en: "Added toast notifications for update available, downloading, and update ready states.",
            th: "เพิ่มการแจ้งเตือนสถานะเมื่อพบอัปเดตใหม่ กำลังดาวน์โหลด และพร้อมติดตั้ง",
          },
        ],
      },
    ],
  },
  {
    version: "1.1.1",
    releaseDate: "2026",
    tagline: {
      en: "GitHub Update Checker, Wrong-Language Detector & HTML Preview Enhancements",
      th: "ระบบตรวจหาอัปเดตจาก GitHub, เครื่องมือแก้ภาษาผิดอัตโนมัติ และปรับปรุง HTML Preview",
    },
    highlights: [
      {
        title: {
          en: "Wrong Language Auto-Detector & Converter",
          th: "ระบบตรวจจับและแปลงภาษาผิดอัตโนมัติ (ไทย-อังกฤษ)",
        },
        description: {
          en: "Detects when text was typed with the wrong keyboard layout (e.g. Kedmanee vs QWERTY) and converts it with a single click.",
          th: "ตรวจจับข้อความที่พิมพ์ผิดภาษา (เช่น ลืมเปลี่ยนภาษาไทย/อังกฤษ) และกดแปลงข้อความที่ถูกต้องได้ทันที",
        },
        icon: Languages,
      },
      {
        title: {
          en: "Interactive HTML & CSS Code Editor with Preview",
          th: "ตัวแก้ไขและพรีวิวโค้ด HTML/CSS ในตัว",
        },
        description: {
          en: "Write and preview standalone HTML and CSS files directly with live syntax highlighting and responsive device previews.",
          th: "เขียนและดูตัวอย่างผลลัพธ์ไฟล์ HTML และ CSS ได้ในโปรแกรม พร้อมไฮไลต์โค้ดและปรับขนาดหน้าจอพรีวิว",
        },
        icon: FileCode,
      },
      {
        title: {
          en: "Dynamic Version Synchronization",
          th: "ซิงก์เวอร์ชันแอปอัตโนมัติ",
        },
        description: {
          en: "App version dynamically reflects package metadata across Settings, Help, and Launcher views.",
          th: "ซิงก์เลขเวอร์ชันของแอปพลิเคชันจาก package.json ไปยังหน้าตั้งค่า คู่มือ และหน้าแรกอย่างถูกต้อง",
        },
        icon: Sparkles,
      },
    ],
    changes: [
      {
        category: { en: "Editor Tools", th: "เครื่องมือในตัวแก้ไข" },
        items: [
          {
            en: "Added wrong language detection and Thai-English keyboard mapper utility.",
            th: "เพิ่มระบบวิเคราะห์และแปลงภาษาแป้นพิมพ์ไทย-อังกฤษ (Thai Keyboard Mapper)",
          },
          {
            en: "Added dedicated HtmlCodeEditor with line numbering and responsive preview pane.",
            th: "เพิ่มตัวแก้ไข HtmlCodeEditor พร้อมเลขบรรทัดและหน้าต่างพรีวิว Responsive",
          },
        ],
      },
      {
        category: { en: "System & UI", th: "ระบบและหน้าตาโปรแกรม" },
        items: [
          {
            en: "Added GitHub update checker with action toast and direct release links.",
            th: "เพิ่มระบบตรวจสอบอัปเดตจาก GitHub พร้อมปุ่มลิงก์ไปยัง Release Notes",
          },
          {
            en: "Added dedicated TabViews for Tags and Favorites.",
            th: "เพิ่มหน้าต่างแท็บเฉพาะสำหรับจัดการ Tags และ Favorites",
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
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
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
