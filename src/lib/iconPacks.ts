import React from "react";
// Lucide icons
import * as LucideIcons from "lucide-react";
// Tabler icons
import * as TablerIcons from "@tabler/icons-react";
// Phosphor icons
import * as PhosphorIcons from "@phosphor-icons/react";
import { FootnoteIcon } from "@/components/icons/FootnoteIcon";

export type IconPackId = "lucide" | "tabler" | "phosphor";

export interface IconPackOption {
  id: IconPackId;
  nameKey: string;
  descKey: string;
  author: string;
  count: string;
  previewIcons: string[];
}

export const ICON_PACK_OPTIONS: IconPackOption[] = [
  {
    id: "lucide",
    nameKey: "settings.iconPackLucide",
    descKey: "settings.iconPackLucideDesc",
    author: "Lucide Community",
    count: "1,500+ icons",
    previewIcons: ["folder", "fileText", "bold", "sparkles", "settings"],
  },
  {
    id: "tabler",
    nameKey: "settings.iconPackTabler",
    descKey: "settings.iconPackTablerDesc",
    author: "Paweł Kuna",
    count: "5,000+ icons",
    previewIcons: ["folder", "fileText", "bold", "sparkles", "settings"],
  },
  {
    id: "phosphor",
    nameKey: "settings.iconPackPhosphor",
    descKey: "settings.iconPackPhosphorDesc",
    author: "Phosphor Icons",
    count: "1,200+ icons",
    previewIcons: ["folder", "fileText", "bold", "sparkles", "settings"],
  },
];

// Mapping for standard App and Toolbar actions to specific icons per pack
export const TOOLBAR_ICON_MAP: Record<string, { lucide: any; tabler: any; phosphor: any }> = {
  undo: {
    lucide: LucideIcons.Undo2,
    tabler: TablerIcons.IconArrowBackUp,
    phosphor: PhosphorIcons.ArrowUUpLeft,
  },
  redo: {
    lucide: LucideIcons.Redo2,
    tabler: TablerIcons.IconArrowForwardUp,
    phosphor: PhosphorIcons.ArrowUUpRight,
  },
  h1: {
    lucide: LucideIcons.Heading1,
    tabler: TablerIcons.IconH1,
    phosphor: PhosphorIcons.TextHOne,
  },
  h2: {
    lucide: LucideIcons.Heading2,
    tabler: TablerIcons.IconH2,
    phosphor: PhosphorIcons.TextHTwo,
  },
  h3: {
    lucide: LucideIcons.Heading3,
    tabler: TablerIcons.IconH3,
    phosphor: PhosphorIcons.TextHThree,
  },
  h4: {
    lucide: LucideIcons.Heading4,
    tabler: TablerIcons.IconH4,
    phosphor: PhosphorIcons.TextHFour,
  },
  h5: {
    lucide: LucideIcons.Heading5,
    tabler: TablerIcons.IconH5,
    phosphor: PhosphorIcons.TextHFive,
  },
  h6: {
    lucide: LucideIcons.Heading6,
    tabler: TablerIcons.IconH6,
    phosphor: PhosphorIcons.TextHSix,
  },
  bold: {
    lucide: LucideIcons.Bold,
    tabler: TablerIcons.IconBold,
    phosphor: PhosphorIcons.TextB,
  },
  italic: {
    lucide: LucideIcons.Italic,
    tabler: TablerIcons.IconItalic,
    phosphor: PhosphorIcons.TextItalic,
  },
  underline: {
    lucide: LucideIcons.Underline,
    tabler: TablerIcons.IconUnderline,
    phosphor: PhosphorIcons.TextUnderline,
  },
  strike: {
    lucide: LucideIcons.Strikethrough,
    tabler: TablerIcons.IconStrikethrough,
    phosphor: PhosphorIcons.TextStrikethrough,
  },
  highlight: {
    lucide: LucideIcons.Highlighter,
    tabler: TablerIcons.IconHighlight,
    phosphor: PhosphorIcons.Highlighter,
  },
  bulletList: {
    lucide: LucideIcons.List,
    tabler: TablerIcons.IconList,
    phosphor: PhosphorIcons.ListBullets,
  },
  orderedList: {
    lucide: LucideIcons.ListOrdered,
    tabler: TablerIcons.IconListNumbers,
    phosphor: PhosphorIcons.ListNumbers,
  },
  taskList: {
    lucide: LucideIcons.ListChecks || LucideIcons.CheckSquare,
    tabler: TablerIcons.IconListCheck,
    phosphor: PhosphorIcons.ListChecks,
  },
  toggle: {
    lucide: LucideIcons.ChevronsDownUp,
    tabler: TablerIcons.IconLayoutNavbarCollapse,
    phosphor: PhosphorIcons.CaretDoubleDown,
  },
  code: {
    lucide: LucideIcons.CodeXml || LucideIcons.Code,
    tabler: TablerIcons.IconCode,
    phosphor: PhosphorIcons.Code,
  },
  codeBlock: {
    lucide: LucideIcons.SquareCode,
    tabler: TablerIcons.IconTerminal2,
    phosphor: PhosphorIcons.CodeBlock,
  },
  blockquote: {
    lucide: LucideIcons.Quote,
    tabler: TablerIcons.IconQuote,
    phosphor: PhosphorIcons.Quotes,
  },
  horizontalRule: {
    lucide: LucideIcons.Minus,
    tabler: TablerIcons.IconMinus,
    phosphor: PhosphorIcons.Minus,
  },
  footnote: {
    lucide: FootnoteIcon,
    tabler: FootnoteIcon,
    phosphor: FootnoteIcon,
  },
  table: {
    lucide: LucideIcons.Table,
    tabler: TablerIcons.IconTable,
    phosphor: PhosphorIcons.Table,
  },
  link: {
    lucide: LucideIcons.Link2 || LucideIcons.Link,
    tabler: TablerIcons.IconLink,
    phosphor: PhosphorIcons.Link,
  },
  image: {
    lucide: LucideIcons.ImagePlus || LucideIcons.Image,
    tabler: TablerIcons.IconPhotoPlus || TablerIcons.IconPhoto,
    phosphor: PhosphorIcons.ImageSquare,
  },
  emoji: {
    lucide: LucideIcons.Smile,
    tabler: TablerIcons.IconMoodSmile,
    phosphor: PhosphorIcons.Smiley,
  },
  audio: {
    lucide: LucideIcons.Mic,
    tabler: TablerIcons.IconMicrophone,
    phosphor: PhosphorIcons.Microphone,
  },
  calculator: {
    lucide: LucideIcons.Calculator,
    tabler: TablerIcons.IconCalculator,
    phosphor: PhosphorIcons.Calculator,
  },
  translator: {
    lucide: LucideIcons.Languages,
    tabler: TablerIcons.IconLanguage,
    phosphor: PhosphorIcons.Translate,
  },
  clock: {
    lucide: LucideIcons.Clock,
    tabler: TablerIcons.IconClock,
    phosphor: PhosphorIcons.Clock,
  },
  fixLanguage: {
    lucide: LucideIcons.Wrench,
    tabler: TablerIcons.IconWand,
    phosphor: PhosphorIcons.MagicWand,
  },
  aiAssistant: {
    lucide: LucideIcons.Sparkles,
    tabler: TablerIcons.IconSparkles,
    phosphor: PhosphorIcons.Sparkle,
  },
  home: {
    lucide: LucideIcons.Home,
    tabler: TablerIcons.IconHome,
    phosphor: PhosphorIcons.House,
  },
  explore: {
    lucide: LucideIcons.Compass,
    tabler: TablerIcons.IconCompass,
    phosphor: PhosphorIcons.Compass,
  },
  general: {
    lucide: LucideIcons.SlidersHorizontal,
    tabler: TablerIcons.IconAdjustmentsHorizontal,
    phosphor: PhosphorIcons.SlidersHorizontal,
  },
  appearance: {
    lucide: LucideIcons.Palette,
    tabler: TablerIcons.IconPalette,
    phosphor: PhosphorIcons.Palette,
  },
  editorCat: {
    lucide: LucideIcons.Pencil,
    tabler: TablerIcons.IconPencil,
    phosphor: PhosphorIcons.Pencil,
  },
  templates: {
    lucide: LucideIcons.LayoutTemplate,
    tabler: TablerIcons.IconLayout,
    phosphor: PhosphorIcons.Layout,
  },
  shortcuts: {
    lucide: LucideIcons.Keyboard,
    tabler: TablerIcons.IconKeyboard,
    phosphor: PhosphorIcons.Keyboard,
  },
  storage: {
    lucide: LucideIcons.Database,
    tabler: TablerIcons.IconDatabase,
    phosphor: PhosphorIcons.Database,
  },
  backup: {
    lucide: LucideIcons.Cloud,
    tabler: TablerIcons.IconCloud,
    phosphor: PhosphorIcons.Cloud,
  },
  privacy: {
    lucide: LucideIcons.Lock,
    tabler: TablerIcons.IconLock,
    phosphor: PhosphorIcons.Lock,
  },
  about: {
    lucide: LucideIcons.Info,
    tabler: TablerIcons.IconInfoCircle,
    phosphor: PhosphorIcons.Info,
  },
  rotateCcw: {
    lucide: LucideIcons.RotateCcw,
    tabler: TablerIcons.IconRotate2,
    phosphor: PhosphorIcons.ArrowCounterClockwise,
  },
  download: {
    lucide: LucideIcons.Download,
    tabler: TablerIcons.IconDownload,
    phosphor: PhosphorIcons.DownloadSimple,
  },
  refresh: {
    lucide: LucideIcons.RefreshCw,
    tabler: TablerIcons.IconRefresh,
    phosphor: PhosphorIcons.ArrowsClockwise,
  },
  externalLink: {
    lucide: LucideIcons.ExternalLink,
    tabler: TablerIcons.IconExternalLink,
    phosphor: PhosphorIcons.ArrowSquareOut,
  },
  ai: {
    lucide: LucideIcons.Sparkles,
    tabler: TablerIcons.IconSparkles,
    phosphor: PhosphorIcons.Sparkle,
  },
  sparkles: {
    lucide: LucideIcons.Sparkles,
    tabler: TablerIcons.IconSparkles,
    phosphor: PhosphorIcons.Sparkle,
  },
  plus: {
    lucide: LucideIcons.Plus,
    tabler: TablerIcons.IconPlus,
    phosphor: PhosphorIcons.Plus,
  },
  plusCircle: {
    lucide: LucideIcons.PlusCircle,
    tabler: TablerIcons.IconCirclePlus,
    phosphor: PhosphorIcons.PlusCircle,
  },
  folder: {
    lucide: LucideIcons.Folder,
    tabler: TablerIcons.IconFolder,
    phosphor: PhosphorIcons.Folder,
  },
  folderOpen: {
    lucide: LucideIcons.FolderOpen,
    tabler: TablerIcons.IconFolderOpen,
    phosphor: PhosphorIcons.FolderOpen,
  },
  folderPlus: {
    lucide: LucideIcons.FolderPlus,
    tabler: TablerIcons.IconFolderPlus,
    phosphor: PhosphorIcons.FolderPlus,
  },
  files: {
    lucide: LucideIcons.Files,
    tabler: TablerIcons.IconFiles,
    phosphor: PhosphorIcons.Files,
  },
  fileText: {
    lucide: LucideIcons.FileText,
    tabler: TablerIcons.IconFileText,
    phosphor: PhosphorIcons.FileText,
  },
  fileCode: {
    lucide: LucideIcons.FileCode,
    tabler: TablerIcons.IconFileCode,
    phosphor: PhosphorIcons.FileCode,
  },
  fileImage: {
    lucide: LucideIcons.FileImage,
    tabler: TablerIcons.IconPhoto,
    phosphor: PhosphorIcons.Image,
  },
  fileZip: {
    lucide: LucideIcons.FolderArchive,
    tabler: TablerIcons.IconFileZip,
    phosphor: PhosphorIcons.Archive,
  },
  file: {
    lucide: LucideIcons.File,
    tabler: TablerIcons.IconFile,
    phosphor: PhosphorIcons.File,
  },
  settings: {
    lucide: LucideIcons.Settings,
    tabler: TablerIcons.IconSettings,
    phosphor: PhosphorIcons.Gear,
  },
  search: {
    lucide: LucideIcons.Search,
    tabler: TablerIcons.IconSearch,
    phosphor: PhosphorIcons.MagnifyingGlass,
  },
  star: {
    lucide: LucideIcons.Star,
    tabler: TablerIcons.IconStar,
    phosphor: PhosphorIcons.Star,
  },
  tag: {
    lucide: LucideIcons.Tag,
    tabler: TablerIcons.IconTag,
    phosphor: PhosphorIcons.Tag,
  },
  lock: {
    lucide: LucideIcons.Lock,
    tabler: TablerIcons.IconLock,
    phosphor: PhosphorIcons.Lock,
  },
  unlock: {
    lucide: LucideIcons.Unlock,
    tabler: TablerIcons.IconLockOpen,
    phosphor: PhosphorIcons.LockOpen,
  },
  key: {
    lucide: LucideIcons.Key,
    tabler: TablerIcons.IconKey,
    phosphor: PhosphorIcons.Key,
  },
  pencil: {
    lucide: LucideIcons.Pencil,
    tabler: TablerIcons.IconPencil,
    phosphor: PhosphorIcons.Pencil,
  },
  copy: {
    lucide: LucideIcons.Copy,
    tabler: TablerIcons.IconCopy,
    phosphor: PhosphorIcons.Copy,
  },
  clipboard: {
    lucide: LucideIcons.ClipboardList,
    tabler: TablerIcons.IconClipboardList,
    phosphor: PhosphorIcons.ClipboardText,
  },
  chevronDown: {
    lucide: LucideIcons.ChevronDown,
    tabler: TablerIcons.IconChevronDown,
    phosphor: PhosphorIcons.CaretDown,
  },
  chevronRight: {
    lucide: LucideIcons.ChevronRight,
    tabler: TablerIcons.IconChevronRight,
    phosphor: PhosphorIcons.CaretRight,
  },
  chevronLeft: {
    lucide: LucideIcons.ChevronLeft,
    tabler: TablerIcons.IconChevronLeft,
    phosphor: PhosphorIcons.CaretLeft,
  },
  panelLeft: {
    lucide: LucideIcons.PanelLeft,
    tabler: TablerIcons.IconLayoutSidebar,
    phosphor: PhosphorIcons.Sidebar,
  },
  panelLeftClose: {
    lucide: LucideIcons.PanelLeftClose,
    tabler: TablerIcons.IconLayoutSidebarLeftCollapse,
    phosphor: PhosphorIcons.SidebarSimple,
  },
  sun: {
    lucide: LucideIcons.Sun,
    tabler: TablerIcons.IconSun,
    phosphor: PhosphorIcons.Sun,
  },
  moon: {
    lucide: LucideIcons.Moon,
    tabler: TablerIcons.IconMoon,
    phosphor: PhosphorIcons.Moon,
  },
  monitor: {
    lucide: LucideIcons.Monitor,
    tabler: TablerIcons.IconDeviceDesktop,
    phosphor: PhosphorIcons.Desktop,
  },
  check: {
    lucide: LucideIcons.Check,
    tabler: TablerIcons.IconCheck,
    phosphor: PhosphorIcons.Check,
  },
  x: {
    lucide: LucideIcons.X,
    tabler: TablerIcons.IconX,
    phosphor: PhosphorIcons.X,
  },
  calendar: {
    lucide: LucideIcons.Calendar,
    tabler: TablerIcons.IconCalendar,
    phosphor: PhosphorIcons.Calendar,
  },
  users: {
    lucide: LucideIcons.Users,
    tabler: TablerIcons.IconUsers,
    phosphor: PhosphorIcons.Users,
  },
  briefcase: {
    lucide: LucideIcons.Briefcase,
    tabler: TablerIcons.IconBriefcase,
    phosphor: PhosphorIcons.Briefcase,
  },
  lightbulb: {
    lucide: LucideIcons.Lightbulb,
    tabler: TablerIcons.IconBulb,
    phosphor: PhosphorIcons.Lightbulb,
  },
  arrowRight: {
    lucide: LucideIcons.ArrowRight,
    tabler: TablerIcons.IconArrowRight,
    phosphor: PhosphorIcons.ArrowRight,
  },
  helpCircle: {
    lucide: LucideIcons.HelpCircle,
    tabler: TablerIcons.IconHelp || TablerIcons.IconQuestionMark,
    phosphor: PhosphorIcons.Question,
  },
  keyboard: {
    lucide: LucideIcons.Keyboard,
    tabler: TablerIcons.IconKeyboard,
    phosphor: PhosphorIcons.Keyboard,
  },
  bookOpen: {
    lucide: LucideIcons.BookOpen,
    tabler: TablerIcons.IconBook || TablerIcons.IconBook2,
    phosphor: PhosphorIcons.BookOpen,
  },
  edit: {
    lucide: LucideIcons.PenLine || LucideIcons.Pencil,
    tabler: TablerIcons.IconPencil,
    phosphor: PhosphorIcons.PencilSimple,
  },
  trash: {
    lucide: LucideIcons.Trash2 || LucideIcons.Trash,
    tabler: TablerIcons.IconTrash,
    phosphor: PhosphorIcons.Trash,
  },
  moreHorizontal: {
    lucide: LucideIcons.MoreHorizontal,
    tabler: TablerIcons.IconDots,
    phosphor: PhosphorIcons.DotsThree,
  },
  moreVertical: {
    lucide: LucideIcons.MoreVertical,
    tabler: TablerIcons.IconDotsVertical,
    phosphor: PhosphorIcons.DotsThreeVertical,
  },
  more: {
    lucide: LucideIcons.MoreHorizontal,
    tabler: TablerIcons.IconDots,
    phosphor: PhosphorIcons.DotsThree,
  },
  panelRight: {
    lucide: LucideIcons.PanelRight,
    tabler: TablerIcons.IconLayoutSidebarRight,
    phosphor: PhosphorIcons.SidebarSimple,
  },
  save: {
    lucide: LucideIcons.Save,
    tabler: TablerIcons.IconDeviceFloppy,
    phosphor: PhosphorIcons.FloppyDisk,
  },
  share: {
    lucide: LucideIcons.Share2,
    tabler: TablerIcons.IconShare,
    phosphor: PhosphorIcons.ShareNetwork,
  },
  history: {
    lucide: LucideIcons.History,
    tabler: TablerIcons.IconHistory,
    phosphor: PhosphorIcons.ClockCounterClockwise,
  },
};

export function getToolbarIcon(toolId: string, pack: IconPackId = "lucide") {
  const entry = TOOLBAR_ICON_MAP[toolId];
  if (!entry) return LucideIcons.HelpCircle;
  return entry[pack] || entry.lucide || LucideIcons.HelpCircle;
}

// Preset Emojis categorized
export const EMOJI_CATEGORIES = [
  {
    nameKey: "iconPicker.catFolders",
    nameEn: "Folders & Org",
    emojis: ["📁", "📂", "🗂️", "📦", "🗃️", "💼", "📌", "📍", "🏷️", "🔖", "📎", "🔗", "🗄️", "📋", "📊", "🗎", "📥", "📤", "📇", "🗃️", "🗁", "🗀"],
  },
  {
    nameKey: "iconPicker.catNotes",
    nameEn: "Notes & Writing",
    emojis: ["📝", "📄", "📃", "📑", "✍️", "🖋️", "✒️", "📖", "📚", "📕", "📗", "📘", "📙", "📓", "📔", "📒", "📜", "📰", "🖍️", "✏️", "✉️", "📩", "📨", "📯", "📬", "📮", "🗞️"],
  },
  {
    nameKey: "iconPicker.catProjects",
    nameEn: "Projects & Tasks",
    emojis: ["💡", "🧠", "🎯", "🚀", "⭐", "✨", "🌟", "🏆", "🎖️", "🥇", "🥈", "🥉", "👑", "🔥", "💎", "🎲", "🧩", "🎪", "⏳", "⌛", "⏰", "⏱️", "⏲️", "🧭", "🏁", "🚩", "🔔", "🔕"],
  },
  {
    nameKey: "iconPicker.catFinance",
    nameEn: "Finance & Work",
    emojis: ["💰", "💵", "💳", "🏦", "📈", "📉", "📊", "🛒", "🛍️", "🏷️", "🪙", "🧾", "💸", "💼", "🤝", "👔", "🏢", "🏬", "🏭", "🏛️", "💱", "💲", "💹", "⚖️", "📦", "🚚"],
  },
  {
    nameKey: "iconPicker.catTech",
    nameEn: "Tech & Code",
    emojis: ["💻", "🖥️", "📱", "⌨️", "💾", "⚙️", "🔧", "🔨", "🛠️", "🔌", "⚡", "🛡️", "🔒", "🔑", "📡", "🌐", "🤖", "🎮", "🕹️", "🖨️", "🔋", "🔬", "🧮", "🎛️", "🎚️", "🛰️", "🧲", "🧪", "🧬", "🔭"],
  },
  {
    nameKey: "iconPicker.catHardware",
    nameEn: "Devices & Hardware",
    emojis: ["🖥️", "💻", "📱", "⌨️", "🖱️", "🖨️", "🕹️", "🎮", "🔌", "🔋", "💾", "📼", "💿", "📀", "📷", "📸", "📹", "📺", "📻", "🎙️", "🎧", "📡", "⏰", "💡", "🔦"],
  },
  {
    nameKey: "iconPicker.catMedia",
    nameEn: "Media & Design",
    emojis: ["🎨", "🖌️", "🖍️", "🎭", "🎬", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "🎙️", "🎤", "🎧", "🎵", "🎶", "🎼", "🎸", "🎹", "🥁", "🔮", "🔍", "🔎", "👁️", "✨", "🪄"],
  },
  {
    nameKey: "iconPicker.catLife",
    nameEn: "Daily & Lifestyle",
    emojis: ["☕", "🍵", "🧋", "🍺", "🍷", "🍕", "🍔", "🍟", "🌭", "🍿", "🍜", "🍣", "🍱", "🍰", "🍦", "🏋️", "🏃", "🧘", "🚴", "🏊", "⚽", "🏀", "🎾", "✈️", "🚗", "🚆", "🚲", "🛵", "🛳️", "🏠", "🏡", "⛺", "🏝️", "🏖️", "🏕️", "🎁", "🎉", "🎈"],
  },
  {
    nameKey: "iconPicker.catNature",
    nameEn: "Nature & Weather",
    emojis: ["🌿", "🌸", "🍀", "🌻", "🌲", "🌴", "🍁", "🍂", "🌵", "🌾", "🌹", "🌷", "🐱", "🐶", "🦊", "🦁", "🐯", "🐼", "🐨", "🐦", "🦉", "🐝", "🦋", "☀️", "🌙", "☁️", "⛅", "🌧️", "⛈️", "❄️", "💧", "🌈", "🌊", "🪐"],
  },
  {
    nameKey: "iconPicker.catSmiley",
    nameEn: "Faces & Mood",
    emojis: ["😊", "😎", "🧐", "🤔", "🥳", "🤩", "🥰", "😇", "🤫", "😴", "🤓", "🤠", "🤖", "👽", "👻", "👍", "👏", "🙌", "🤝", "✌️", "🤞", "🤙", "🤟", "👊", "💪", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💯"],
  },
];

// Color palette options for custom note & folder icons
export const ICON_COLOR_PALETTE = [
  { id: "default", label: "Default", color: "" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "indigo", label: "Indigo", color: "#6366f1" },
  { id: "purple", label: "Purple", color: "#a855f7" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
  { id: "red", label: "Red", color: "#ef4444" },
  { id: "cyan", label: "Cyan", color: "#06b6d4" },
  { id: "teal", label: "Teal", color: "#14b8a6" },
  { id: "slate", label: "Slate", color: "#64748b" },
];

export interface IconCategoryItem {
  name: string;
  icon: any;
  tags: string[];
}

export interface IconCategoryGroup {
  nameKey: string;
  nameEn: string;
  items: IconCategoryItem[];
}

// Categorized Lucide Icons
export const LUCIDE_ICON_CATEGORIES: IconCategoryGroup[] = [
  {
    nameKey: "iconPicker.catFolders",
    nameEn: "Folders & Org",
    items: [
      { name: "Folder", icon: LucideIcons.Folder, tags: ["folder", "directory", "files"] },
      { name: "FolderOpen", icon: LucideIcons.FolderOpen, tags: ["folder", "open", "dir"] },
      { name: "FolderArchive", icon: LucideIcons.FolderArchive, tags: ["archive", "backup"] },
      { name: "FolderKanban", icon: LucideIcons.FolderKanban, tags: ["kanban", "project", "tasks"] },
      { name: "FolderHeart", icon: LucideIcons.FolderHeart, tags: ["favorite", "love", "heart"] },
      { name: "FolderCode", icon: LucideIcons.FolderCode, tags: ["code", "dev", "tech"] },
      { name: "FolderGit2", icon: LucideIcons.FolderGit2, tags: ["git", "repo", "branch"] },
      { name: "FolderTree", icon: LucideIcons.FolderTree, tags: ["tree", "structure", "hierarchy"] },
      { name: "FolderRoot", icon: LucideIcons.FolderRoot, tags: ["root", "base", "main"] },
      { name: "FolderSync", icon: LucideIcons.FolderSync, tags: ["sync", "cloud", "refresh"] },
      { name: "FolderLock", icon: LucideIcons.FolderLock, tags: ["lock", "private", "secure"] },
      { name: "Archive", icon: LucideIcons.Archive, tags: ["box", "store", "old"] },
      { name: "Inbox", icon: LucideIcons.Inbox, tags: ["mail", "messages", "incoming"] },
      { name: "Package", icon: LucideIcons.Package, tags: ["box", "bundle", "module"] },
      { name: "Layers", icon: LucideIcons.Layers, tags: ["layers", "stack", "organization"] },
      { name: "Library", icon: LucideIcons.Library, tags: ["books", "collection", "library"] },
    ],
  },
  {
    nameKey: "iconPicker.catNotes",
    nameEn: "Notes & Writing",
    items: [
      { name: "FileText", icon: LucideIcons.FileText, tags: ["file", "note", "doc", "text"] },
      { name: "FileCode", icon: LucideIcons.FileCode, tags: ["code", "script", "programming"] },
      { name: "FileSpreadsheet", icon: LucideIcons.FileSpreadsheet, tags: ["sheet", "table", "excel", "data"] },
      { name: "FileStack", icon: LucideIcons.FileStack, tags: ["files", "documents", "stack"] },
      { name: "FileSignature", icon: LucideIcons.FileSignature, tags: ["sign", "contract", "legal"] },
      { name: "FileCheck", icon: LucideIcons.FileCheck, tags: ["verified", "done", "approved"] },
      { name: "FileSearch", icon: LucideIcons.FileSearch, tags: ["search", "find", "inspect"] },
      { name: "FileTerminal", icon: LucideIcons.FileTerminal, tags: ["script", "cli", "command"] },
      { name: "BookOpen", icon: LucideIcons.BookOpen, tags: ["book", "read", "study", "documentation"] },
      { name: "BookMarked", icon: LucideIcons.BookMarked, tags: ["bookmark", "read", "favorite"] },
      { name: "Bookmark", icon: LucideIcons.Bookmark, tags: ["tag", "save", "mark"] },
      { name: "BookmarkCheck", icon: LucideIcons.BookmarkCheck, tags: ["saved", "bookmark", "done"] },
      { name: "Notebook", icon: LucideIcons.Notebook, tags: ["journal", "notes", "diary"] },
      { name: "NotebookPen", icon: LucideIcons.NotebookPen, tags: ["write", "diary", "pen"] },
      { name: "ScrollText", icon: LucideIcons.ScrollText, tags: ["history", "doc", "script"] },
      { name: "Newspaper", icon: LucideIcons.Newspaper, tags: ["news", "articles", "press"] },
    ],
  },
  {
    nameKey: "iconPicker.catProjects",
    nameEn: "Projects & Tasks",
    items: [
      { name: "CheckSquare", icon: LucideIcons.CheckSquare, tags: ["task", "todo", "done", "checkbox"] },
      { name: "CheckCircle2", icon: LucideIcons.CheckCircle2, tags: ["done", "completed", "success"] },
      { name: "ListTodo", icon: LucideIcons.ListTodo, tags: ["todo", "list", "checklist"] },
      { name: "ListChecks", icon: LucideIcons.ListChecks, tags: ["tasks", "plan", "review"] },
      { name: "Calendar", icon: LucideIcons.Calendar, tags: ["date", "event", "schedule", "planner"] },
      { name: "CalendarCheck", icon: LucideIcons.CalendarCheck, tags: ["deadline", "scheduled", "done"] },
      { name: "Clock", icon: LucideIcons.Clock, tags: ["time", "alarm", "history"] },
      { name: "Timer", icon: LucideIcons.Timer, tags: ["stopwatch", "pomodoro", "time"] },
      { name: "Hourglass", icon: LucideIcons.Hourglass, tags: ["wait", "time", "loading"] },
      { name: "Star", icon: LucideIcons.Star, tags: ["favorite", "important", "rate"] },
      { name: "Sparkles", icon: LucideIcons.Sparkles, tags: ["ai", "magic", "smart", "clean"] },
      { name: "Lightbulb", icon: LucideIcons.Lightbulb, tags: ["idea", "insight", "brainstorm"] },
      { name: "Target", icon: LucideIcons.Target, tags: ["goal", "focus", "objective"] },
      { name: "Rocket", icon: LucideIcons.Rocket, tags: ["launch", "project", "speed", "start"] },
      { name: "Trophy", icon: LucideIcons.Trophy, tags: ["winner", "award", "achievement"] },
      { name: "Medal", icon: LucideIcons.Medal, tags: ["award", "honor", "rank"] },
      { name: "Award", icon: LucideIcons.Award, tags: ["certificate", "badge", "quality"] },
      { name: "Crown", icon: LucideIcons.Crown, tags: ["king", "leader", "vip", "top"] },
      { name: "Flame", icon: LucideIcons.Flame, tags: ["hot", "urgent", "fire", "streak"] },
      { name: "Milestone", icon: LucideIcons.Milestone, tags: ["roadmap", "direction", "goal"] },
      { name: "Flag", icon: LucideIcons.Flag, tags: ["priority", "mark", "checkpoint"] },
      { name: "Bell", icon: LucideIcons.Bell, tags: ["reminder", "notify", "alert"] },
      { name: "Activity", icon: LucideIcons.Activity, tags: ["pulse", "health", "monitor", "stats"] },
    ],
  },
  {
    nameKey: "iconPicker.catFinance",
    nameEn: "Finance & Work",
    items: [
      { name: "Briefcase", icon: LucideIcons.Briefcase, tags: ["work", "job", "business", "company"] },
      { name: "BriefcaseBusiness", icon: LucideIcons.BriefcaseBusiness, tags: ["corporate", "enterprise", "work"] },
      { name: "GraduationCap", icon: LucideIcons.GraduationCap, tags: ["school", "study", "university", "education"] },
      { name: "School", icon: LucideIcons.School, tags: ["education", "college", "study"] },
      { name: "Landmark", icon: LucideIcons.Landmark, tags: ["bank", "government", "institution"] },
      { name: "Building2", icon: LucideIcons.Building2, tags: ["office", "company", "headquarters"] },
      { name: "Coins", icon: LucideIcons.Coins, tags: ["money", "finance", "crypto", "cash"] },
      { name: "CreditCard", icon: LucideIcons.CreditCard, tags: ["card", "payment", "bank"] },
      { name: "Wallet", icon: LucideIcons.Wallet, tags: ["wallet", "budget", "finance"] },
      { name: "Receipt", icon: LucideIcons.Receipt, tags: ["bill", "invoice", "payment", "expense"] },
      { name: "TrendingUp", icon: LucideIcons.TrendingUp, tags: ["growth", "chart", "increase", "success"] },
      { name: "TrendingDown", icon: LucideIcons.TrendingDown, tags: ["decrease", "loss", "chart"] },
      { name: "PieChart", icon: LucideIcons.PieChart, tags: ["stats", "analytics", "data"] },
      { name: "BarChart3", icon: LucideIcons.BarChart3, tags: ["bars", "growth", "metrics"] },
      { name: "ShoppingBag", icon: LucideIcons.ShoppingBag, tags: ["shop", "buy", "store"] },
      { name: "ShoppingCart", icon: LucideIcons.ShoppingCart, tags: ["cart", "ecommerce", "order"] },
      { name: "Tag", icon: LucideIcons.Tag, tags: ["price", "label", "category"] },
      { name: "Percent", icon: LucideIcons.Percent, tags: ["discount", "rate", "math"] },
      { name: "Gift", icon: LucideIcons.Gift, tags: ["present", "holiday", "birthday"] },
    ],
  },
  {
    nameKey: "iconPicker.catTech",
    nameEn: "Tech & Code",
    items: [
      { name: "Code2", icon: LucideIcons.Code2, tags: ["code", "developer", "terminal"] },
      { name: "Terminal", icon: LucideIcons.Terminal, tags: ["console", "command", "bash", "cli"] },
      { name: "Workflow", icon: LucideIcons.Workflow, tags: ["workflow", "flow", "automation"] },
      { name: "GitBranch", icon: LucideIcons.GitBranch, tags: ["git", "branch", "version"] },
      { name: "GitPullRequest", icon: LucideIcons.GitPullRequest, tags: ["pr", "merge", "git"] },
      { name: "GitMerge", icon: LucideIcons.GitMerge, tags: ["merge", "git", "combine"] },
      { name: "GitCommit", icon: LucideIcons.GitCommit, tags: ["commit", "log", "history"] },
      { name: "GitFork", icon: LucideIcons.GitFork, tags: ["fork", "clone", "repo"] },
      { name: "Database", icon: LucideIcons.Database, tags: ["db", "storage", "sql", "data"] },
      { name: "Network", icon: LucideIcons.Network, tags: ["graph", "cluster", "nodes"] },
      { name: "Key", icon: LucideIcons.Key, tags: ["password", "secret", "security", "lock"] },
      { name: "KeyRound", icon: LucideIcons.KeyRound, tags: ["auth", "access", "token"] },
      { name: "Lock", icon: LucideIcons.Lock, tags: ["security", "pin", "private"] },
      { name: "Unlock", icon: LucideIcons.Unlock, tags: ["public", "open", "access"] },
      { name: "ShieldCheck", icon: LucideIcons.ShieldCheck, tags: ["security", "verified", "protection"] },
      { name: "ShieldAlert", icon: LucideIcons.ShieldAlert, tags: ["warning", "danger", "security"] },
      { name: "Zap", icon: LucideIcons.Zap, tags: ["fast", "energy", "power", "quick"] },
      { name: "Bug", icon: LucideIcons.Bug, tags: ["issue", "debug", "error", "defect"] },
      { name: "Binary", icon: LucideIcons.Binary, tags: ["data", "byte", "bits", "code"] },
      { name: "Braces", icon: LucideIcons.Braces, tags: ["json", "code", "syntax"] },
      { name: "Webhook", icon: LucideIcons.Webhook, tags: ["api", "integration", "hook"] },
    ],
  },
  {
    nameKey: "iconPicker.catHardware",
    nameEn: "Devices & Hardware",
    items: [
      { name: "Smartphone", icon: LucideIcons.Smartphone, tags: ["mobile", "phone", "app"] },
      { name: "Laptop", icon: LucideIcons.Laptop, tags: ["computer", "pc", "device"] },
      { name: "Monitor", icon: LucideIcons.Monitor, tags: ["screen", "desktop", "display"] },
      { name: "Tablet", icon: LucideIcons.Tablet, tags: ["ipad", "touch", "device"] },
      { name: "Server", icon: LucideIcons.Server, tags: ["backend", "hosting", "cloud"] },
      { name: "HardDrive", icon: LucideIcons.HardDrive, tags: ["disk", "storage", "memory"] },
      { name: "Cpu", icon: LucideIcons.Cpu, tags: ["hardware", "chip", "tech", "processor"] },
      { name: "Printer", icon: LucideIcons.Printer, tags: ["print", "paper", "office"] },
      { name: "Mouse", icon: LucideIcons.Mouse, tags: ["pointer", "click", "input"] },
      { name: "Keyboard", icon: LucideIcons.Keyboard, tags: ["type", "input", "keys"] },
      { name: "Headphones", icon: LucideIcons.Headphones, tags: ["audio", "listen", "music"] },
      { name: "Speaker", icon: LucideIcons.Speaker, tags: ["sound", "audio", "voice"] },
      { name: "BatteryCharging", icon: LucideIcons.BatteryCharging, tags: ["power", "charge", "energy"] },
      { name: "Wrench", icon: LucideIcons.Wrench, tags: ["tool", "fix", "repair"] },
      { name: "Hammer", icon: LucideIcons.Hammer, tags: ["build", "tool", "construction"] },
      { name: "Settings", icon: LucideIcons.Settings, tags: ["config", "gear", "preferences"] },
      { name: "Sliders", icon: LucideIcons.Sliders, tags: ["adjust", "controls", "options"] },
    ],
  },
  {
    nameKey: "iconPicker.catMedia",
    nameEn: "Media & Design",
    items: [
      { name: "Camera", icon: LucideIcons.Camera, tags: ["photo", "media", "picture"] },
      { name: "Video", icon: LucideIcons.Video, tags: ["video", "film", "record"] },
      { name: "Film", icon: LucideIcons.Film, tags: ["movie", "cinema", "clip"] },
      { name: "Clapperboard", icon: LucideIcons.Clapperboard, tags: ["movie", "action", "director"] },
      { name: "Music", icon: LucideIcons.Music, tags: ["audio", "song", "playlist"] },
      { name: "Mic", icon: LucideIcons.Mic, tags: ["audio", "voice", "podcast"] },
      { name: "Radio", icon: LucideIcons.Radio, tags: ["broadcast", "fm", "station"] },
      { name: "Palette", icon: LucideIcons.Palette, tags: ["art", "design", "color", "theme"] },
      { name: "Brush", icon: LucideIcons.Brush, tags: ["paint", "art", "draw"] },
      { name: "PenTool", icon: LucideIcons.PenTool, tags: ["design", "draw", "creative", "vector"] },
      { name: "Pipette", icon: LucideIcons.Pipette, tags: ["eyedropper", "color", "picker"] },
      { name: "Eye", icon: LucideIcons.Eye, tags: ["view", "preview", "vision"] },
      { name: "Image", icon: LucideIcons.Image, tags: ["photo", "graphic", "picture"] },
      { name: "Globe", icon: LucideIcons.Globe, tags: ["web", "internet", "world", "online"] },
      { name: "Cloud", icon: LucideIcons.Cloud, tags: ["storage", "sync", "backup", "server"] },
      { name: "Compass", icon: LucideIcons.Compass, tags: ["explore", "navigation", "direction"] },
      { name: "MapPin", icon: LucideIcons.MapPin, tags: ["location", "place", "geo"] },
      { name: "Wand2", icon: LucideIcons.Wand2, tags: ["magic", "auto", "wizard"] },
    ],
  },
  {
    nameKey: "iconPicker.catLife",
    nameEn: "Daily & Lifestyle",
    items: [
      { name: "Coffee", icon: LucideIcons.Coffee, tags: ["daily", "break", "routine", "cafe"] },
      { name: "Utensils", icon: LucideIcons.Utensils, tags: ["food", "restaurant", "meal", "dinner"] },
      { name: "Dumbbell", icon: LucideIcons.Dumbbell, tags: ["fitness", "gym", "workout", "health"] },
      { name: "Bike", icon: LucideIcons.Bike, tags: ["cycling", "sport", "transport"] },
      { name: "Car", icon: LucideIcons.Car, tags: ["drive", "transport", "vehicle"] },
      { name: "Plane", icon: LucideIcons.Plane, tags: ["travel", "trip", "flight", "vacation"] },
      { name: "Home", icon: LucideIcons.Home, tags: ["house", "main", "base"] },
      { name: "Hotel", icon: LucideIcons.Hotel, tags: ["stay", "vacation", "resort"] },
      { name: "Heart", icon: LucideIcons.Heart, tags: ["love", "favorite", "health"] },
      { name: "HeartHandshake", icon: LucideIcons.HeartHandshake, tags: ["partner", "trust", "help"] },
      { name: "User", icon: LucideIcons.User, tags: ["profile", "person", "account"] },
      { name: "Users", icon: LucideIcons.Users, tags: ["team", "group", "community"] },
      { name: "Smile", icon: LucideIcons.Smile, tags: ["happy", "face", "mood"] },
      { name: "MessageSquare", icon: LucideIcons.MessageSquare, tags: ["chat", "comment", "discussion"] },
      { name: "Mail", icon: LucideIcons.Mail, tags: ["email", "letter", "contact"] },
      { name: "Send", icon: LucideIcons.Send, tags: ["message", "post", "share"] },
      { name: "Share2", icon: LucideIcons.Share2, tags: ["network", "share", "export"] },
    ],
  },
  {
    nameKey: "iconPicker.catNature",
    nameEn: "Nature & Weather",
    items: [
      { name: "Sun", icon: LucideIcons.Sun, tags: ["day", "light", "bright"] },
      { name: "Moon", icon: LucideIcons.Moon, tags: ["night", "dark", "sleep"] },
      { name: "Stars", icon: LucideIcons.Stars, tags: ["night", "sky", "space", "galaxy"] },
      { name: "CloudRain", icon: LucideIcons.CloudRain, tags: ["weather", "rain", "storm"] },
      { name: "CloudLightning", icon: LucideIcons.CloudLightning, tags: ["thunder", "storm", "flash"] },
      { name: "CloudSnow", icon: LucideIcons.CloudSnow, tags: ["winter", "cold", "snow"] },
      { name: "Wind", icon: LucideIcons.Wind, tags: ["breeze", "air", "weather"] },
      { name: "Droplets", icon: LucideIcons.Droplets, tags: ["water", "liquid", "rain"] },
      { name: "TreePine", icon: LucideIcons.TreePine, tags: ["nature", "forest", "tree"] },
      { name: "Leaf", icon: LucideIcons.Leaf, tags: ["plant", "eco", "green"] },
      { name: "Flower2", icon: LucideIcons.Flower2, tags: ["blossom", "spring", "garden"] },
      { name: "Sprout", icon: LucideIcons.Sprout, tags: ["grow", "plant", "start"] },
      { name: "Mountain", icon: LucideIcons.Mountain, tags: ["hiking", "outdoor", "peak"] },
    ],
  },
];

// Categorized Tabler Icons
export const TABLER_ICON_CATEGORIES: IconCategoryGroup[] = [
  {
    nameKey: "iconPicker.catFolders",
    nameEn: "Folders & Org",
    items: [
      { name: "IconFolder", icon: TablerIcons.IconFolder, tags: ["folder", "directory"] },
      { name: "IconFolderOpen", icon: TablerIcons.IconFolderOpen, tags: ["open", "dir"] },
      { name: "IconFolderStar", icon: TablerIcons.IconFolderStar, tags: ["favorite", "starred"] },
      { name: "IconFolderCode", icon: TablerIcons.IconFolderCode, tags: ["code", "dev"] },
      { name: "IconFolderPlus", icon: TablerIcons.IconFolderPlus, tags: ["add", "new"] },
      { name: "IconFolderCheck", icon: TablerIcons.IconFolderCheck, tags: ["verified", "done"] },
      { name: "IconFolderSymlink", icon: TablerIcons.IconFolderSymlink, tags: ["link", "symlink"] },
      { name: "IconArchive", icon: TablerIcons.IconArchive, tags: ["box", "store"] },
      { name: "IconInbox", icon: TablerIcons.IconInbox, tags: ["messages", "inbox"] },
      { name: "IconPackage", icon: TablerIcons.IconPackage, tags: ["bundle", "package"] },
      { name: "IconLayersLinked", icon: TablerIcons.IconLayersLinked, tags: ["layers", "structure"] },
    ],
  },
  {
    nameKey: "iconPicker.catNotes",
    nameEn: "Notes & Writing",
    items: [
      { name: "IconFileText", icon: TablerIcons.IconFileText, tags: ["file", "doc"] },
      { name: "IconFileCode", icon: TablerIcons.IconFileCode, tags: ["code", "source"] },
      { name: "IconFileSpreadsheet", icon: TablerIcons.IconFileSpreadsheet, tags: ["sheet", "table"] },
      { name: "IconFilePlus", icon: TablerIcons.IconFilePlus, tags: ["new", "create"] },
      { name: "IconFileCheck", icon: TablerIcons.IconFileCheck, tags: ["done", "approved"] },
      { name: "IconFileSearch", icon: TablerIcons.IconFileSearch, tags: ["search", "find"] },
      { name: "IconBook", icon: TablerIcons.IconBook, tags: ["book", "study"] },
      { name: "IconBook2", icon: TablerIcons.IconBook2, tags: ["read", "manual"] },
      { name: "IconBookmark", icon: TablerIcons.IconBookmark, tags: ["mark", "tag"] },
      { name: "IconNotebook", icon: TablerIcons.IconNotebook, tags: ["notes", "diary"] },
      { name: "IconNews", icon: TablerIcons.IconNews, tags: ["newspaper", "articles"] },
      { name: "IconEdit", icon: TablerIcons.IconEdit, tags: ["pencil", "write"] },
    ],
  },
  {
    nameKey: "iconPicker.catProjects",
    nameEn: "Projects & Tasks",
    items: [
      { name: "IconCheckbox", icon: TablerIcons.IconCheckbox, tags: ["task", "todo"] },
      { name: "IconListCheck", icon: TablerIcons.IconListCheck, tags: ["checklist", "list"] },
      { name: "IconCalendar", icon: TablerIcons.IconCalendar, tags: ["calendar", "date"] },
      { name: "IconCalendarEvent", icon: TablerIcons.IconCalendarEvent, tags: ["event", "schedule"] },
      { name: "IconClock", icon: TablerIcons.IconClock, tags: ["time", "alarm"] },
      { name: "IconHourglass", icon: TablerIcons.IconHourglass, tags: ["wait", "timer"] },
      { name: "IconStar", icon: TablerIcons.IconStar, tags: ["star", "favorite"] },
      { name: "IconBulb", icon: TablerIcons.IconBulb, tags: ["idea", "light"] },
      { name: "IconSparkles", icon: TablerIcons.IconSparkles, tags: ["ai", "magic"] },
      { name: "IconRocket", icon: TablerIcons.IconRocket, tags: ["launch", "project"] },
      { name: "IconTarget", icon: TablerIcons.IconTarget, tags: ["goal", "aim"] },
      { name: "IconFlame", icon: TablerIcons.IconFlame, tags: ["fire", "trending"] },
      { name: "IconTrophy", icon: TablerIcons.IconTrophy, tags: ["award", "winner"] },
      { name: "IconMedal", icon: TablerIcons.IconMedal, tags: ["badge", "honor"] },
      { name: "IconCrown", icon: TablerIcons.IconCrown, tags: ["vip", "king"] },
      { name: "IconFlag", icon: TablerIcons.IconFlag, tags: ["priority", "mark"] },
      { name: "IconBell", icon: TablerIcons.IconBell, tags: ["notify", "alert"] },
    ],
  },
  {
    nameKey: "iconPicker.catFinance",
    nameEn: "Finance & Work",
    items: [
      { name: "IconBriefcase", icon: TablerIcons.IconBriefcase, tags: ["work", "job"] },
      { name: "IconBuilding", icon: TablerIcons.IconBuilding, tags: ["office", "building"] },
      { name: "IconBuildingBank", icon: TablerIcons.IconBuildingBank, tags: ["bank", "finance"] },
      { name: "IconCoin", icon: TablerIcons.IconCoin, tags: ["money", "finance"] },
      { name: "IconCreditCard", icon: TablerIcons.IconCreditCard, tags: ["card", "payment"] },
      { name: "IconWallet", icon: TablerIcons.IconWallet, tags: ["wallet", "money"] },
      { name: "IconReceipt", icon: TablerIcons.IconReceipt, tags: ["invoice", "bill"] },
      { name: "IconTrendingUp", icon: TablerIcons.IconTrendingUp, tags: ["growth", "stats"] },
      { name: "IconTrendingDown", icon: TablerIcons.IconTrendingDown, tags: ["decrease", "loss"] },
      { name: "IconChartBar", icon: TablerIcons.IconChartBar, tags: ["bars", "metrics"] },
      { name: "IconChartPie", icon: TablerIcons.IconChartPie, tags: ["pie", "stats"] },
      { name: "IconShoppingBag", icon: TablerIcons.IconShoppingBag, tags: ["shop", "buy"] },
      { name: "IconShoppingCart", icon: TablerIcons.IconShoppingCart, tags: ["cart", "order"] },
      { name: "IconTag", icon: TablerIcons.IconTag, tags: ["price", "tag"] },
      { name: "IconGift", icon: TablerIcons.IconGift, tags: ["gift", "reward"] },
    ],
  },
  {
    nameKey: "iconPicker.catTech",
    nameEn: "Tech & Code",
    items: [
      { name: "IconCode", icon: TablerIcons.IconCode, tags: ["programming", "dev"] },
      { name: "IconTerminal", icon: TablerIcons.IconTerminal, tags: ["cli", "console"] },
      { name: "IconGitBranch", icon: TablerIcons.IconGitBranch, tags: ["git", "branch"] },
      { name: "IconGitPullRequest", icon: TablerIcons.IconGitPullRequest, tags: ["pr", "merge"] },
      { name: "IconGitMerge", icon: TablerIcons.IconGitMerge, tags: ["merge", "git"] },
      { name: "IconGitCommit", icon: TablerIcons.IconGitCommit, tags: ["commit", "log"] },
      { name: "IconDatabase", icon: TablerIcons.IconDatabase, tags: ["db", "data"] },
      { name: "IconServer", icon: TablerIcons.IconServer, tags: ["backend", "cloud"] },
      { name: "IconLock", icon: TablerIcons.IconLock, tags: ["security", "private"] },
      { name: "IconLockOpen", icon: TablerIcons.IconLockOpen, tags: ["public", "unlock"] },
      { name: "IconKey", icon: TablerIcons.IconKey, tags: ["password", "key"] },
      { name: "IconShield", icon: TablerIcons.IconShield, tags: ["guard", "protect"] },
      { name: "IconShieldCheck", icon: TablerIcons.IconShieldCheck, tags: ["verified", "secure"] },
      { name: "IconBug", icon: TablerIcons.IconBug, tags: ["error", "fix"] },
      { name: "IconCpu", icon: TablerIcons.IconCpu, tags: ["chip", "hardware"] },
      { name: "IconBinary", icon: TablerIcons.IconBinary, tags: ["binary", "bytes"] },
    ],
  },
  {
    nameKey: "iconPicker.catHardware",
    nameEn: "Devices & Hardware",
    items: [
      { name: "IconDeviceMobile", icon: TablerIcons.IconDeviceMobile, tags: ["phone", "mobile"] },
      { name: "IconDeviceLaptop", icon: TablerIcons.IconDeviceLaptop, tags: ["laptop", "pc"] },
      { name: "IconDeviceDesktop", icon: TablerIcons.IconDeviceDesktop, tags: ["desktop", "screen"] },
      { name: "IconDeviceTablet", icon: TablerIcons.IconDeviceTablet, tags: ["tablet", "ipad"] },
      { name: "IconDeviceSdCard", icon: TablerIcons.IconDeviceSdCard, tags: ["disk", "storage", "card"] },
      { name: "IconPrinter", icon: TablerIcons.IconPrinter, tags: ["print", "paper"] },
      { name: "IconMouse", icon: TablerIcons.IconMouse, tags: ["mouse", "click"] },
      { name: "IconKeyboard", icon: TablerIcons.IconKeyboard, tags: ["type", "input"] },
      { name: "IconHeadphones", icon: TablerIcons.IconHeadphones, tags: ["audio", "listen"] },
      { name: "IconBatteryCharging", icon: TablerIcons.IconBatteryCharging, tags: ["power", "charge"] },
      { name: "IconTools", icon: TablerIcons.IconTools, tags: ["tools", "repair"] },
      { name: "IconHammer", icon: TablerIcons.IconHammer, tags: ["build", "tool"] },
      { name: "IconTool", icon: TablerIcons.IconTool, tags: ["fix", "wrench", "tool"] },
      { name: "IconSettings", icon: TablerIcons.IconSettings, tags: ["config", "gear"] },
    ],
  },
  {
    nameKey: "iconPicker.catMedia",
    nameEn: "Media & Design",
    items: [
      { name: "IconPhoto", icon: TablerIcons.IconPhoto, tags: ["image", "camera"] },
      { name: "IconVideo", icon: TablerIcons.IconVideo, tags: ["video", "film"] },
      { name: "IconMovie", icon: TablerIcons.IconMovie, tags: ["cinema", "movie"] },
      { name: "IconMusic", icon: TablerIcons.IconMusic, tags: ["song", "audio"] },
      { name: "IconMicrophone", icon: TablerIcons.IconMicrophone, tags: ["audio", "mic"] },
      { name: "IconPalette", icon: TablerIcons.IconPalette, tags: ["art", "design"] },
      { name: "IconBrush", icon: TablerIcons.IconBrush, tags: ["draw", "paint"] },
      { name: "IconColorPicker", icon: TablerIcons.IconColorPicker, tags: ["eyedropper", "color"] },
      { name: "IconEye", icon: TablerIcons.IconEye, tags: ["view", "look"] },
      { name: "IconWorld", icon: TablerIcons.IconWorld, tags: ["globe", "web"] },
      { name: "IconCloud", icon: TablerIcons.IconCloud, tags: ["cloud", "storage"] },
      { name: "IconMapPin", icon: TablerIcons.IconMapPin, tags: ["geo", "location"] },
      { name: "IconCompass", icon: TablerIcons.IconCompass, tags: ["nav", "direction"] },
      { name: "IconWand", icon: TablerIcons.IconWand, tags: ["magic", "wizard"] },
    ],
  },
  {
    nameKey: "iconPicker.catLife",
    nameEn: "Daily & Lifestyle",
    items: [
      { name: "IconCoffee", icon: TablerIcons.IconCoffee, tags: ["break", "daily"] },
      { name: "IconCup", icon: TablerIcons.IconCup, tags: ["drink", "tea"] },
      { name: "IconBarbell", icon: TablerIcons.IconBarbell, tags: ["gym", "workout"] },
      { name: "IconBike", icon: TablerIcons.IconBike, tags: ["bicycle", "cycle"] },
      { name: "IconCar", icon: TablerIcons.IconCar, tags: ["car", "vehicle"] },
      { name: "IconPlane", icon: TablerIcons.IconPlane, tags: ["travel", "flight"] },
      { name: "IconHome", icon: TablerIcons.IconHome, tags: ["house", "home"] },
      { name: "IconHeart", icon: TablerIcons.IconHeart, tags: ["love", "favorite"] },
      { name: "IconHeartHandshake", icon: TablerIcons.IconHeartHandshake, tags: ["partner", "trust"] },
      { name: "IconUser", icon: TablerIcons.IconUser, tags: ["profile", "person"] },
      { name: "IconUsers", icon: TablerIcons.IconUsers, tags: ["team", "group"] },
      { name: "IconMoodSmile", icon: TablerIcons.IconMoodSmile, tags: ["happy", "face"] },
    ],
  },
  {
    nameKey: "iconPicker.catNature",
    nameEn: "Nature & Weather",
    items: [
      { name: "IconSun", icon: TablerIcons.IconSun, tags: ["sun", "day"] },
      { name: "IconMoon", icon: TablerIcons.IconMoon, tags: ["moon", "night"] },
      { name: "IconCloudRain", icon: TablerIcons.IconCloudRain, tags: ["rain", "storm"] },
      { name: "IconTrees", icon: TablerIcons.IconTrees, tags: ["tree", "nature"] },
      { name: "IconPlant", icon: TablerIcons.IconPlant, tags: ["plant", "eco"] },
      { name: "IconLeaf", icon: TablerIcons.IconLeaf, tags: ["green", "leaf"] },
      { name: "IconMountain", icon: TablerIcons.IconMountain, tags: ["peak", "outdoor"] },
    ],
  },
];

// Categorized Phosphor Icons
export const PHOSPHOR_ICON_CATEGORIES: IconCategoryGroup[] = [
  {
    nameKey: "iconPicker.catFolders",
    nameEn: "Folders & Org",
    items: [
      { name: "Folder", icon: PhosphorIcons.Folder, tags: ["folder", "dir"] },
      { name: "FolderOpen", icon: PhosphorIcons.FolderOpen, tags: ["open", "dir"] },
      { name: "FolderStar", icon: PhosphorIcons.FolderStar, tags: ["favorite", "star"] },
      { name: "FolderSimple", icon: PhosphorIcons.FolderSimple, tags: ["minimal", "folder"] },
      { name: "FolderSimplePlus", icon: PhosphorIcons.FolderSimplePlus, tags: ["add", "new"] },
      { name: "FolderUser", icon: PhosphorIcons.FolderUser, tags: ["user", "shared"] },
      { name: "Archive", icon: PhosphorIcons.Archive, tags: ["archive", "box"] },
      { name: "Tray", icon: PhosphorIcons.Tray, tags: ["inbox", "tray"] },
      { name: "Package", icon: PhosphorIcons.Package, tags: ["box", "bundle"] },
      { name: "Stack", icon: PhosphorIcons.Stack, tags: ["stack", "layers"] },
    ],
  },
  {
    nameKey: "iconPicker.catNotes",
    nameEn: "Notes & Writing",
    items: [
      { name: "FileText", icon: PhosphorIcons.FileText, tags: ["file", "doc"] },
      { name: "FileCode", icon: PhosphorIcons.FileCode, tags: ["code", "tech"] },
      { name: "FileDoc", icon: PhosphorIcons.FileDoc, tags: ["document", "word"] },
      { name: "FilePlus", icon: PhosphorIcons.FilePlus, tags: ["new", "create"] },
      { name: "FileMagnifyingGlass", icon: PhosphorIcons.FileMagnifyingGlass, tags: ["search", "find"] },
      { name: "BookOpen", icon: PhosphorIcons.BookOpen, tags: ["book", "reading"] },
      { name: "BookBookmark", icon: PhosphorIcons.BookBookmark, tags: ["favorite", "study"] },
      { name: "BookmarkSimple", icon: PhosphorIcons.BookmarkSimple, tags: ["save", "tag"] },
      { name: "Books", icon: PhosphorIcons.Books, tags: ["library", "collection"] },
      { name: "Note", icon: PhosphorIcons.Note, tags: ["quick", "memo"] },
      { name: "Notebook", icon: PhosphorIcons.Notebook, tags: ["journal", "notes"] },
      { name: "Newspaper", icon: PhosphorIcons.Newspaper, tags: ["press", "articles"] },
      { name: "Pen", icon: PhosphorIcons.Pen, tags: ["write", "draw"] },
    ],
  },
  {
    nameKey: "iconPicker.catProjects",
    nameEn: "Projects & Tasks",
    items: [
      { name: "CheckSquare", icon: PhosphorIcons.CheckSquare, tags: ["todo", "task"] },
      { name: "CheckCircle", icon: PhosphorIcons.CheckCircle, tags: ["done", "completed"] },
      { name: "ListChecks", icon: PhosphorIcons.ListChecks, tags: ["checklist", "list"] },
      { name: "ListNumbers", icon: PhosphorIcons.ListNumbers, tags: ["ordered", "steps"] },
      { name: "Calendar", icon: PhosphorIcons.Calendar, tags: ["event", "schedule"] },
      { name: "CalendarCheck", icon: PhosphorIcons.CalendarCheck, tags: ["deadline", "done"] },
      { name: "Clock", icon: PhosphorIcons.Clock, tags: ["time", "timer"] },
      { name: "Hourglass", icon: PhosphorIcons.Hourglass, tags: ["wait", "sand"] },
      { name: "Star", icon: PhosphorIcons.Star, tags: ["star", "favorite"] },
      { name: "Lightbulb", icon: PhosphorIcons.Lightbulb, tags: ["idea", "light"] },
      { name: "Sparkle", icon: PhosphorIcons.Sparkle, tags: ["ai", "magic"] },
      { name: "Rocket", icon: PhosphorIcons.Rocket, tags: ["launch", "speed"] },
      { name: "Target", icon: PhosphorIcons.Target, tags: ["focus", "target"] },
      { name: "Fire", icon: PhosphorIcons.Fire, tags: ["urgent", "hot"] },
      { name: "Trophy", icon: PhosphorIcons.Trophy, tags: ["award", "winner"] },
      { name: "Medal", icon: PhosphorIcons.Medal, tags: ["medal", "honor"] },
      { name: "Crown", icon: PhosphorIcons.Crown, tags: ["vip", "king"] },
      { name: "Flag", icon: PhosphorIcons.Flag, tags: ["mark", "checkpoint"] },
      { name: "Bell", icon: PhosphorIcons.Bell, tags: ["notify", "reminder"] },
    ],
  },
  {
    nameKey: "iconPicker.catFinance",
    nameEn: "Finance & Work",
    items: [
      { name: "Briefcase", icon: PhosphorIcons.Briefcase, tags: ["work", "business"] },
      { name: "Buildings", icon: PhosphorIcons.Buildings, tags: ["office", "company"] },
      { name: "Bank", icon: PhosphorIcons.Bank, tags: ["bank", "finance"] },
      { name: "Coins", icon: PhosphorIcons.Coins, tags: ["money", "finance"] },
      { name: "CreditCard", icon: PhosphorIcons.CreditCard, tags: ["payment", "card"] },
      { name: "Wallet", icon: PhosphorIcons.Wallet, tags: ["wallet", "finance"] },
      { name: "Receipt", icon: PhosphorIcons.Receipt, tags: ["invoice", "receipt"] },
      { name: "TrendUp", icon: PhosphorIcons.TrendUp, tags: ["growth", "stats"] },
      { name: "TrendDown", icon: PhosphorIcons.TrendDown, tags: ["decrease", "loss"] },
      { name: "ChartBar", icon: PhosphorIcons.ChartBar, tags: ["bars", "metrics"] },
      { name: "ChartPie", icon: PhosphorIcons.ChartPie, tags: ["pie", "data"] },
      { name: "ChartLine", icon: PhosphorIcons.ChartLine, tags: ["graph", "trend"] },
      { name: "ShoppingBag", icon: PhosphorIcons.ShoppingBag, tags: ["shop", "store"] },
      { name: "ShoppingCart", icon: PhosphorIcons.ShoppingCart, tags: ["cart", "ecommerce"] },
      { name: "Tag", icon: PhosphorIcons.Tag, tags: ["price", "tag"] },
      { name: "Gift", icon: PhosphorIcons.Gift, tags: ["gift", "reward"] },
    ],
  },
  {
    nameKey: "iconPicker.catTech",
    nameEn: "Tech & Code",
    items: [
      { name: "Code", icon: PhosphorIcons.Code, tags: ["code", "dev"] },
      { name: "Terminal", icon: PhosphorIcons.Terminal, tags: ["cli", "shell"] },
      { name: "TerminalWindow", icon: PhosphorIcons.TerminalWindow, tags: ["console", "prompt"] },
      { name: "GitBranch", icon: PhosphorIcons.GitBranch, tags: ["git", "branch"] },
      { name: "GitPullRequest", icon: PhosphorIcons.GitPullRequest, tags: ["pr", "merge"] },
      { name: "GitMerge", icon: PhosphorIcons.GitMerge, tags: ["merge", "git"] },
      { name: "GitCommit", icon: PhosphorIcons.GitCommit, tags: ["commit", "log"] },
      { name: "Database", icon: PhosphorIcons.Database, tags: ["db", "storage"] },
      { name: "HardDrives", icon: PhosphorIcons.HardDrives, tags: ["server", "storage"] },
      { name: "Lock", icon: PhosphorIcons.Lock, tags: ["secure", "secret"] },
      { name: "LockOpen", icon: PhosphorIcons.LockOpen, tags: ["public", "open"] },
      { name: "Key", icon: PhosphorIcons.Key, tags: ["password", "key"] },
      { name: "Shield", icon: PhosphorIcons.Shield, tags: ["guard", "protect"] },
      { name: "ShieldCheck", icon: PhosphorIcons.ShieldCheck, tags: ["verified", "secure"] },
      { name: "Bug", icon: PhosphorIcons.Bug, tags: ["bug", "defect"] },
      { name: "Cpu", icon: PhosphorIcons.Cpu, tags: ["processor", "chip"] },
      { name: "TreeStructure", icon: PhosphorIcons.TreeStructure, tags: ["hierarchy", "nodes"] },
      { name: "BracketsCurly", icon: PhosphorIcons.BracketsCurly, tags: ["json", "code"] },
    ],
  },
  {
    nameKey: "iconPicker.catHardware",
    nameEn: "Devices & Hardware",
    items: [
      { name: "DeviceMobile", icon: PhosphorIcons.DeviceMobile, tags: ["phone", "mobile"] },
      { name: "Laptop", icon: PhosphorIcons.Laptop, tags: ["laptop", "computer"] },
      { name: "Desktop", icon: PhosphorIcons.Desktop, tags: ["pc", "monitor"] },
      { name: "DeviceTablet", icon: PhosphorIcons.DeviceTablet, tags: ["tablet", "ipad"] },
      { name: "Printer", icon: PhosphorIcons.Printer, tags: ["printer", "print"] },
      { name: "Mouse", icon: PhosphorIcons.Mouse, tags: ["mouse", "pointer"] },
      { name: "Keyboard", icon: PhosphorIcons.Keyboard, tags: ["keys", "type"] },
      { name: "Headphones", icon: PhosphorIcons.Headphones, tags: ["listen", "audio"] },
      { name: "SpeakerHigh", icon: PhosphorIcons.SpeakerHigh, tags: ["sound", "speaker"] },
      { name: "BatteryCharging", icon: PhosphorIcons.BatteryCharging, tags: ["power", "battery"] },
      { name: "Wrench", icon: PhosphorIcons.Wrench, tags: ["tools", "fix"] },
      { name: "Hammer", icon: PhosphorIcons.Hammer, tags: ["build", "tool"] },
      { name: "Gear", icon: PhosphorIcons.Gear, tags: ["settings", "config"] },
      { name: "Faders", icon: PhosphorIcons.Faders, tags: ["controls", "sliders"] },
    ],
  },
  {
    nameKey: "iconPicker.catMedia",
    nameEn: "Media & Design",
    items: [
      { name: "Image", icon: PhosphorIcons.Image, tags: ["photo", "picture"] },
      { name: "ImageSquare", icon: PhosphorIcons.ImageSquare, tags: ["gallery", "graphic"] },
      { name: "VideoCamera", icon: PhosphorIcons.VideoCamera, tags: ["video", "film"] },
      { name: "FilmStrip", icon: PhosphorIcons.FilmStrip, tags: ["cinema", "movie"] },
      { name: "MusicNotes", icon: PhosphorIcons.MusicNotes, tags: ["song", "melody"] },
      { name: "Microphone", icon: PhosphorIcons.Microphone, tags: ["mic", "audio"] },
      { name: "Palette", icon: PhosphorIcons.Palette, tags: ["art", "design"] },
      { name: "PaintBrush", icon: PhosphorIcons.PaintBrush, tags: ["draw", "paint"] },
      { name: "Eyedropper", icon: PhosphorIcons.Eyedropper, tags: ["color", "picker"] },
      { name: "Eye", icon: PhosphorIcons.Eye, tags: ["preview", "look"] },
      { name: "Globe", icon: PhosphorIcons.Globe, tags: ["web", "internet"] },
      { name: "Cloud", icon: PhosphorIcons.Cloud, tags: ["cloud", "storage"] },
      { name: "MapPin", icon: PhosphorIcons.MapPin, tags: ["location", "pin"] },
      { name: "Compass", icon: PhosphorIcons.Compass, tags: ["direction", "navigate"] },
      { name: "MagicWand", icon: PhosphorIcons.MagicWand, tags: ["magic", "wizard"] },
    ],
  },
  {
    nameKey: "iconPicker.catLife",
    nameEn: "Daily & Lifestyle",
    items: [
      { name: "Coffee", icon: PhosphorIcons.Coffee, tags: ["coffee", "daily"] },
      { name: "ForkKnife", icon: PhosphorIcons.ForkKnife, tags: ["food", "restaurant"] },
      { name: "Barbell", icon: PhosphorIcons.Barbell, tags: ["gym", "workout"] },
      { name: "Bicycle", icon: PhosphorIcons.Bicycle, tags: ["bike", "cycling"] },
      { name: "Car", icon: PhosphorIcons.Car, tags: ["car", "drive"] },
      { name: "Airplane", icon: PhosphorIcons.Airplane, tags: ["travel", "flight"] },
      { name: "House", icon: PhosphorIcons.House, tags: ["home", "house"] },
      { name: "Heart", icon: PhosphorIcons.Heart, tags: ["love", "favorite"] },
      { name: "Handshake", icon: PhosphorIcons.Handshake, tags: ["partner", "trust"] },
      { name: "User", icon: PhosphorIcons.User, tags: ["profile", "person"] },
      { name: "Users", icon: PhosphorIcons.Users, tags: ["team", "community"] },
      { name: "Smiley", icon: PhosphorIcons.Smiley, tags: ["happy", "face"] },
    ],
  },
  {
    nameKey: "iconPicker.catNature",
    nameEn: "Nature & Weather",
    items: [
      { name: "Sun", icon: PhosphorIcons.Sun, tags: ["sun", "day"] },
      { name: "Moon", icon: PhosphorIcons.Moon, tags: ["moon", "night"] },
      { name: "CloudRain", icon: PhosphorIcons.CloudRain, tags: ["rain", "weather"] },
      { name: "Tree", icon: PhosphorIcons.Tree, tags: ["nature", "tree"] },
      { name: "Leaf", icon: PhosphorIcons.Leaf, tags: ["leaf", "eco"] },
      { name: "Flower", icon: PhosphorIcons.Flower, tags: ["flower", "garden"] },
      { name: "Mountains", icon: PhosphorIcons.Mountains, tags: ["outdoor", "peak"] },
    ],
  },
];

// Flat lists for backwards compatibility if needed
export const POPULAR_LUCIDE_ICONS = LUCIDE_ICON_CATEGORIES.flatMap((c) => c.items);
export const POPULAR_TABLER_ICONS = TABLER_ICON_CATEGORIES.flatMap((c) => c.items);
export const POPULAR_PHOSPHOR_ICONS = PHOSPHOR_ICON_CATEGORIES.flatMap((c) => c.items);

/**
 * Renders a custom icon identifier (e.g. "emoji:🚀", "lucide:BookOpen", "tabler:IconBulb", "ph:Sparkle", or raw emoji "📁").
 */
export function renderCustomIcon(
  iconString?: string,
  className = "w-4 h-4",
  style?: React.CSSProperties
): React.ReactNode {
  if (!iconString) return null;

  // Handle explicit emoji prefix or raw unicode emoji
  if (iconString.startsWith("emoji:")) {
    const char = iconString.replace("emoji:", "");
    return React.createElement(
      "span",
      {
        className: "inline-flex items-center justify-center text-sm leading-none select-none",
        style,
      },
      char
    );
  }

  // Handle Lucide icon
  if (iconString.startsWith("lucide:")) {
    const iconName = iconString.replace("lucide:", "");
    const IconComp = (LucideIcons as Record<string, any>)[iconName];
    if (IconComp) {
      return React.createElement(IconComp, { className, style });
    }
  }

  // Handle Tabler icon
  if (iconString.startsWith("tabler:")) {
    const iconName = iconString.replace("tabler:", "");
    const IconComp = (TablerIcons as Record<string, any>)[iconName];
    if (IconComp) {
      return React.createElement(IconComp, { className, style });
    }
  }

  // Handle Phosphor icon
  if (iconString.startsWith("ph:") || iconString.startsWith("phosphor:")) {
    const iconName = iconString.replace(/^(ph|phosphor):/, "");
    const IconComp = (PhosphorIcons as Record<string, any>)[iconName];
    if (IconComp) {
      return React.createElement(IconComp, { className, style });
    }
  }

  // If pure emoji / unicode string
  if (/\p{Extended_Pictographic}/u.test(iconString) || iconString.length <= 4) {
    return React.createElement(
      "span",
      {
        className: "inline-flex items-center justify-center text-sm leading-none select-none",
        style,
      },
      iconString
    );
  }

  // Fallback: check Lucide
  const FallbackLucide = (LucideIcons as Record<string, any>)[iconString];
  if (FallbackLucide) {
    return React.createElement(FallbackLucide, { className, style });
  }

  return null;
}

export interface AutoFolderIconResult {
  icon: string;
  color: string;
}

const COMMON_FOLDER_RULES: Array<{
  matchers: string[];
  icons: { lucide: string; tabler: string; phosphor: string };
  color: string;
}> = [
  // 1. Images / Photos / Wallpapers / Screenshots
  {
    matchers: [
      "image", "images", "img", "imgs", "picture", "pictures", "pic", "pics", "photo", "photos",
      "gallery", "galleries", "wallpaper", "wallpapers", "screenshot", "screenshots", "snaps",
      "art", "artwork", "drawings", "illustrations", "graphic", "graphics",
      "รูป", "รูปภาพ", "ภาพ", "ภาพถ่าย", "แกลเลอรี", "แกลเลอรี่", "วอลเปเปอร์", "สกรีนช็อต", "แคปหน้าจอ", "ศิลปะ", "วาดรูป"
    ],
    icons: {
      lucide: "lucide:Image",
      tabler: "tabler:IconPhoto",
      phosphor: "phosphor:Image",
    },
    color: "#3b82f6", // Blue
  },
  // 2. Documents / Notes / Articles / Texts / Writing / Books
  {
    matchers: [
      "doc", "docs", "document", "documents", "note", "notes", "article", "articles",
      "text", "texts", "draft", "drafts", "writing", "writings", "blog", "blogs", "post", "posts",
      "diary", "journal", "journals", "memo", "memos", "readme",
      "เอกสาร", "โน้ต", "บันทึก", "บทความ", "ข้อความ", "ร่าง", "ไดอารี่", "สมุดบันทึก", "งานเขียน"
    ],
    icons: {
      lucide: "lucide:FileText",
      tabler: "tabler:IconFileText",
      phosphor: "phosphor:FileText",
    },
    color: "#f59e0b", // Amber
  },
  // 3. Code / Dev / Source / Projects / Git / Tech
  {
    matchers: [
      "code", "codes", "src", "source", "dev", "development", "project", "projects",
      "repo", "repos", "repository", "git", "github", "gitlab", "script", "scripts",
      "app", "apps", "api", "web", "lib", "utils", "components", "test", "tests",
      "โปรเจกต์", "โปรเจ็กต์", "โครงการ", "โค้ด", "โปรแกรม", "พัฒนา", "สคริปต์"
    ],
    icons: {
      lucide: "lucide:Code",
      tabler: "tabler:IconCode",
      phosphor: "phosphor:Code",
    },
    color: "#6366f1", // Indigo
  },
  // 4. Audio / Music / Songs / Voice / Sounds
  {
    matchers: [
      "audio", "audios", "music", "musics", "song", "songs", "sound", "sounds",
      "track", "tracks", "voice", "podcast", "podcasts", "recordings", "recording", "mp3", "beats",
      "เพลง", "ดนตรี", "เสียง", "บันทึกเสียง", "พอดแคสต์"
    ],
    icons: {
      lucide: "lucide:Music",
      tabler: "tabler:IconMusic",
      phosphor: "phosphor:MusicNotes",
    },
    color: "#f43f5e", // Rose
  },
  // 5. Videos / Movies / Clips / Film
  {
    matchers: [
      "video", "videos", "movie", "movies", "film", "films", "clip", "clips",
      "media", "youtube", "vlog", "vlogs", "stream", "streams", "streamings", "cinema",
      "วิดีโอ", "วีดีโอ", "คลิป", "หนัง", "ภาพยนตร์", "ยูทูป"
    ],
    icons: {
      lucide: "lucide:Video",
      tabler: "tabler:IconVideo",
      phosphor: "phosphor:VideoCamera",
    },
    color: "#ef4444", // Red
  },
  // 6. Work / Jobs / Business / Office / Meetings / Invoices
  {
    matchers: [
      "work", "works", "job", "jobs", "business", "office", "meeting", "meetings",
      "client", "clients", "customer", "customers", "company", "invoice", "invoices",
      "receipt", "receipts", "marketing", "hr", "sales",
      "งาน", "ทำงาน", "ธุรกิจ", "ออฟฟิศ", "บริษัท", "ประชุม", "ลูกค้า", "ใบเสร็จ", "ใบแจ้งหนี้"
    ],
    icons: {
      lucide: "lucide:Briefcase",
      tabler: "tabler:IconBriefcase",
      phosphor: "phosphor:Briefcase",
    },
    color: "#10b981", // Emerald
  },
  // 7. Money / Finance / Wallet / Crypto / Budget / Salary
  {
    matchers: [
      "money", "finance", "finances", "financial", "wallet", "budget", "budgets",
      "salary", "salaries", "investment", "investments", "crypto", "bank", "banking", "tax", "taxes",
      "เงิน", "การเงิน", "กระเป๋าเงิน", "งบประมาณ", "เงินเดือน", "ลงทุน", "ภาษี", "บัญชี"
    ],
    icons: {
      lucide: "lucide:DollarSign",
      tabler: "tabler:IconCurrencyDollar",
      phosphor: "phosphor:CurrencyDollar",
    },
    color: "#10b981", // Emerald
  },
  // 8. Study / School / University / Education / Research / Classes
  {
    matchers: [
      "study", "studies", "learn", "learning", "school", "university", "college",
      "class", "classes", "course", "courses", "homework", "exam", "exams", "lesson", "lessons",
      "lecture", "lectures", "research", "academy", "tutorial", "tutorials", "book", "books",
      "เรียน", "การเรียน", "การศึกษา", "โรงเรียน", "มหาวิทยาลัย", "การบ้าน", "สอบ", "วิจัย", "วิชา", "บทเรียน", "หนังสือ"
    ],
    icons: {
      lucide: "lucide:GraduationCap",
      tabler: "tabler:IconSchool",
      phosphor: "phosphor:GraduationCap",
    },
    color: "#a855f7", // Purple
  },
  // 9. Personal / Private / Secret / Vault / Security
  {
    matchers: [
      "personal", "private", "secret", "secrets", "confidential", "security", "secure",
      "vault", "safe", "lock", "locked", "passwords", "password", "keys", "credentials",
      "ส่วนตัว", "ความลับ", "ปลอดภัย", "รหัสผ่าน", "ล็อค"
    ],
    icons: {
      lucide: "lucide:Lock",
      tabler: "tabler:IconLock",
      phosphor: "phosphor:Lock",
    },
    color: "#64748b", // Slate
  },
  // 10. Archive / Backup / Storage / Database / History
  {
    matchers: [
      "archive", "archives", "backup", "backups", "storage", "database", "db",
      "history", "historical", "legacy", "old", "dump", "exports", "export",
      "คลัง", "สำรอง", "ประวัติ", "ของเก่า", "ฐานข้อมูล", "จัดเก็บ"
    ],
    icons: {
      lucide: "lucide:Archive",
      tabler: "tabler:IconArchive",
      phosphor: "phosphor:Archive",
    },
    color: "#06b6d4", // Cyan
  },
  // 11. Trash / Bin / Temp / Junk
  {
    matchers: [
      "trash", "bin", "recycle", "garbage", "rubbish", "deleted", "temp", "tmp", "junk",
      "ขยะ", "ถังขยะ", "ลบทิ้ง", "ชั่วคราว"
    ],
    icons: {
      lucide: "lucide:Trash2",
      tabler: "tabler:IconTrash",
      phosphor: "phosphor:Trash",
    },
    color: "#ef4444", // Red
  },
  // 12. Settings / Config / Preferences / Tools
  {
    matchers: [
      "setting", "settings", "config", "configs", "configuration", "configurations",
      "pref", "prefs", "preferences", "setup", "options", "tool", "tools", "utility", "utilities",
      "ตั้งค่า", "การตั้งค่า", "เครื่องมือ", "ปรับแต่ง"
    ],
    icons: {
      lucide: "lucide:Settings",
      tabler: "tabler:IconSettings",
      phosphor: "phosphor:Gear",
    },
    color: "#64748b", // Slate
  },
  // 13. Downloads / Inbox / Incoming
  {
    matchers: [
      "download", "downloads", "inbox", "incoming", "receive", "received", "import", "imports",
      "ดาวน์โหลด", "กล่องจดหมาย", "รับเข้า", "นำเข้า"
    ],
    icons: {
      lucide: "lucide:Download",
      tabler: "tabler:IconDownload",
      phosphor: "phosphor:DownloadSimple",
    },
    color: "#3b82f6", // Blue
  },
  // 14. Tasks / To-Do / Checklist / Goals / Planner
  {
    matchers: [
      "todo", "todos", "task", "tasks", "checklist", "checklists", "plan", "plans", "planner",
      "goal", "goals", "milestone", "milestones", "tracker", "tracking", "habit", "habits",
      "สิ่งที่ต้องทำ", "งานที่ต้องทำ", "เป้าหมาย", "แผนงาน", "เช็คลิสต์"
    ],
    icons: {
      lucide: "lucide:CheckSquare",
      tabler: "tabler:IconCheckbox",
      phosphor: "phosphor:CheckSquare",
    },
    color: "#3b82f6", // Blue
  },
  // 15. Ideas / Inspiration / Brainstorm / Creative
  {
    matchers: [
      "idea", "ideas", "inspiration", "inspirations", "brainstorm", "thoughts", "thought",
      "creative", "creativity", "mindmap", "concept", "concepts",
      "ไอเดีย", "ความคิด", "แรงบันดาลใจ", "สร้างสรรค์"
    ],
    icons: {
      lucide: "lucide:Lightbulb",
      tabler: "tabler:IconBulb",
      phosphor: "phosphor:Lightbulb",
    },
    color: "#f59e0b", // Amber
  },
  // 16. Favorites / Starred / Bookmarks / Highlights
  {
    matchers: [
      "favorite", "favorites", "fav", "favs", "star", "starred", "bookmark", "bookmarks",
      "important", "highlights", "pinned",
      "รายการโปรด", "ที่ชื่นชอบ", "สำคัญ", "บุ๊กมาร์ก", "ปักหมุด"
    ],
    icons: {
      lucide: "lucide:Star",
      tabler: "tabler:IconStar",
      phosphor: "phosphor:Star",
    },
    color: "#f59e0b", // Amber
  },
  // 17. Calendar / Events / Schedule / Daily
  {
    matchers: [
      "calendar", "calendars", "event", "events", "schedule", "schedules", "daily",
      "timeline", "agenda", "appointment", "appointments",
      "ปฏิทิน", "ตารางเวลา", "กำหนดการ", "นัดหมาย", "รายวัน", "กิจกรรม"
    ],
    icons: {
      lucide: "lucide:Calendar",
      tabler: "tabler:IconCalendar",
      phosphor: "phosphor:Calendar",
    },
    color: "#10b981", // Emerald
  },
  // 18. Users / People / Team / Contacts / Family
  {
    matchers: [
      "user", "users", "people", "team", "teams", "member", "members", "contact", "contacts",
      "family", "friend", "friends", "group", "groups", "community",
      "ทีม", "ผู้ใช้", "สมาชิก", "คน", "ครอบครัว", "เพื่อน", "รายชื่อ", "กลุ่ม"
    ],
    icons: {
      lucide: "lucide:Users",
      tabler: "tabler:IconUsers",
      phosphor: "phosphor:Users",
    },
    color: "#a855f7", // Purple
  },
  // 19. Health / Fitness / Workout / Medical
  {
    matchers: [
      "health", "fitness", "workout", "workouts", "gym", "medical", "medicine", "exercise",
      "diet", "nutrition", "wellness",
      "สุขภาพ", "ออกกำลังกาย", "ฟิตเนส", "ยา", "การแพทย์", "โภชนาการ"
    ],
    icons: {
      lucide: "lucide:Heart",
      tabler: "tabler:IconHeart",
      phosphor: "phosphor:Heart",
    },
    color: "#f43f5e", // Rose
  },
  // 20. Travel / Trip / Vacation / Holiday
  {
    matchers: [
      "travel", "travels", "trip", "trips", "vacation", "vacations", "holiday", "holidays",
      "tour", "flight", "hotel", "journey", "explore",
      "ท่องเที่ยว", "เที่ยว", "ทริป", "พักร้อน", "วันหยุด", "การเดินทาง"
    ],
    icons: {
      lucide: "lucide:Plane",
      tabler: "tabler:IconPlane",
      phosphor: "phosphor:Airplane",
    },
    color: "#06b6d4", // Cyan
  },
  // 21. Food / Cooking / Recipes / Kitchen
  {
    matchers: [
      "food", "foods", "recipe", "recipes", "cooking", "cook", "kitchen", "restaurant",
      "cafe", "meal", "meals", "drink", "drinks", "coffee",
      "อาหาร", "สูตรอาหาร", "ทำอาหาร", "ครัว", "ร้านอาหาร", "กาแฟ", "เครื่องดื่ม"
    ],
    icons: {
      lucide: "lucide:Utensils",
      tabler: "tabler:IconToolsKitchen2",
      phosphor: "phosphor:ForkKnife",
    },
    color: "#f59e0b", // Amber
  },
  // 22. Games / Gaming / Entertainment
  {
    matchers: [
      "game", "games", "gaming", "play", "gamer", "entertainment",
      "เกม", "เล่นเกม", "บันเทิง"
    ],
    icons: {
      lucide: "lucide:Gamepad2",
      tabler: "tabler:IconDeviceGamepad2",
      phosphor: "phosphor:GameController",
    },
    color: "#8b5cf6", // Purple / Violet
  },
  // 23. Tags / Categories / Labels
  {
    matchers: [
      "tag", "tags", "category", "categories", "label", "labels", "topic", "topics",
      "แท็ก", "หมวดหมู่", "ป้ายกำกับ", "หัวข้อ"
    ],
    icons: {
      lucide: "lucide:Tag",
      tabler: "tabler:IconTag",
      phosphor: "phosphor:Tag",
    },
    color: "#6366f1", // Indigo
  },
];

/**
 * Returns an auto-suggested icon and color for popular/common folder names.
 * Uses the specified (or user's active) icon pack as primary.
 */
export function getAutoFolderIconAndColor(
  folderName: string,
  iconPack: string = "lucide"
): AutoFolderIconResult | null {
  if (!folderName || typeof folderName !== "string") return null;

  // Extract base folder name from path if full path is passed
  const baseName = folderName.split("/").pop() || folderName;
  const normalized = baseName.trim().toLowerCase();
  // Strip leading numbers like '01. Images' -> 'images' or '[Images]' -> 'images'
  const cleanName = normalized
    .replace(/^[0-9]+[\.\-_ ]+/, "")
    .replace(/^[\[\(\{]+|[\]\)\}]+$/g, "")
    .trim();

  const packKey = (iconPack === "tabler" || iconPack === "phosphor") ? iconPack : "lucide";

  for (const rule of COMMON_FOLDER_RULES) {
    const isMatch = rule.matchers.some((m) => {
      const lowerM = m.toLowerCase();
      return (
        cleanName === lowerM ||
        cleanName.startsWith(lowerM + " ") ||
        cleanName.startsWith(lowerM + "_") ||
        cleanName.startsWith(lowerM + "-") ||
        cleanName.endsWith(" " + lowerM) ||
        cleanName.endsWith("_" + lowerM) ||
        cleanName.endsWith("-" + lowerM)
      );
    });

    if (isMatch) {
      const icon = rule.icons[packKey] || rule.icons.lucide;
      return {
        icon,
        color: rule.color,
      };
    }
  }

  return null;
}
