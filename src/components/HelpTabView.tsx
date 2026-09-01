import React, { useState, useMemo } from "react";
import {
  Keyboard,
  BookOpen,
  Sparkles,
  HelpCircle,
  Info,
  Search,
  Check,
  Copy,
  ExternalLink,
  CodeXml,
  SquareCode,
  Columns,
  Cloud,
  Tag,
  Settings as SettingsIcon,
  Command,
  FileText,
  CheckSquare,
  SlidersHorizontal,
  Table as TableIcon,
  Sun,
  Moon,
  ChevronRight,
  Hash,
  Quote,
  Lightbulb,
  Zap,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { getToolbarIcon } from "@/lib/iconPacks";

export type HelpCategory =
  | "shortcuts"
  | "markdown"
  | "features"
  | "faq"
  | "about";

interface HelpCategoryMeta {
  id: HelpCategory;
  label: string;
  iconKey: string;
  desc: string;
}

interface HelpTabViewProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export default function HelpTabView({ onClose, onOpenSettings }: HelpTabViewProps) {
  const { t } = useTranslation();
  const { settings, updateSetting } = useAppSettings();
  const [activeCategory, setActiveCategory] = useState<HelpCategory>("shortcuts");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const pack = settings?.iconPack || "lucide";

  const isMac = useMemo(() => {
    return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  const modKey = isMac ? "Cmd" : "Ctrl";

  const categories: HelpCategoryMeta[] = useMemo(
    () => [
      {
        id: "shortcuts",
        label: t("helpModal.tabShortcuts") || "Shortcuts",
        iconKey: "keyboard",
        desc: t("helpModal.sectionGeneral") || "Keyboard shortcuts for quick navigation and editing.",
      },
      {
        id: "markdown",
        label: t("helpModal.tabMarkdown") || "Markdown Guide",
        iconKey: "bookOpen",
        desc: t("helpModal.markdownDescription") || "Comprehensive syntax reference for markdown documents.",
      },
      {
        id: "features",
        label: t("helpModal.tabFeatures") || "Features & Tools",
        iconKey: "sparkles",
        desc: t("helpModal.description") || "Core features, slash commands, and editing workflow.",
      },
      {
        id: "faq",
        label: t("helpModal.tabFaq") || "FAQ & Tips",
        iconKey: "helpCircle",
        desc: t("helpModal.faqGeneralDesc") || "Frequently asked questions, troubleshooting, and power user tips.",
      },
      {
        id: "about",
        label: t("helpModal.tabAbout") || "About",
        iconKey: "about",
        desc: t("helpModal.aboutDesc") || "Version info, community, and app overview.",
      },
    ],
    [t]
  );

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({
      title: t("editor.copied") || "Copied to clipboard",
      description: text,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const shortcutGroups = useMemo(
    () => [
      {
        title: t("helpModal.sectionGeneral") || "General & Navigation",
        items: [
          { label: t("editor.newNote") || "New Note", keys: [modKey, "N"], desc: t("helpModal.newNoteDesc") || "Create a new note in active workspace folder" },
          { label: t("editor.saveFile") || "Save Note", keys: [modKey, "S"], desc: t("helpModal.saveNoteDesc") || "Manually persist current note to disk" },
          { label: t("sidebar.openFolderAction") || "Open Workspace Folder", keys: [modKey, "O"], desc: t("helpModal.openFolderDesc") || "Open a folder as your workspace" },
          { label: t("editor.searchNotes") || "Quick Note Search", keys: [modKey, "P"], desc: t("helpModal.searchNotesDesc") || "Search and jump across all workspace notes" },
          { label: t("common.settings") || "Open Settings", keys: [modKey, ","], desc: t("helpModal.openSettingsDesc") || "Open application preferences tab" },
          { label: t("sidebar.help") || "Help & Documentation", keys: ["F1"], desc: t("helpModal.helpDesc") || "Open this help center" },
          { label: t("helpModal.closeActiveTab") || "Close Active Tab", keys: [modKey, "W"], desc: t("helpModal.closeActiveTabDesc") || "Close currently active editor tab" },
        ],
      },
      {
        title: t("helpModal.sectionFormatting") || "Text Formatting",
        items: [
          { label: t("editor.bold") || "Bold", keys: [modKey, "B"], desc: t("editor.shortcutBoldDesc") || "Make selected text bold" },
          { label: t("editor.italic") || "Italic", keys: [modKey, "I"], desc: t("editor.shortcutItalicDesc") || "Italicize selected text" },
          { label: t("editor.underline") || "Underline", keys: [modKey, "U"], desc: "Underline selected text" },
          { label: t("editor.strikethrough") || "Strikethrough", keys: [modKey, "Shift", "X"], desc: t("editor.shortcutStrikeDesc") || "Cross out text" },
          { label: t("editor.inlineCode") || "Inline Code", keys: [modKey, "E"], desc: "Convert text to inline code block" },
          { label: t("editor.highlight") || "Highlight", keys: [modKey, "Shift", "H"], desc: "Apply background color highlight" },
          { label: t("editor.link") || "Insert Link", keys: [modKey, "K"], desc: "Insert or edit hyperlink" },
        ],
      },
      {
        title: t("helpModal.sectionBlocks") || "Blocks & Headings",
        items: [
          { label: t("editor.heading1") || "Heading 1", keys: [modKey, "Alt", "1"], desc: "Set current line as H1 header" },
          { label: t("editor.heading2") || "Heading 2", keys: [modKey, "Alt", "2"], desc: "Set current line as H2 header" },
          { label: t("editor.heading3") || "Heading 3", keys: [modKey, "Alt", "3"], desc: "Set current line as H3 header" },
          { label: t("editor.codeBlock") || "Code Block", keys: [modKey, "Alt", "C"], desc: "Insert fenced syntax-highlighted code block" },
          { label: t("editor.bulletList") || "Bullet List", keys: [modKey, "Shift", "8"], desc: "Toggle bulleted unordered list" },
          { label: t("editor.orderedList") || "Ordered List", keys: [modKey, "Shift", "7"], desc: "Toggle numbered ordered list" },
          { label: t("editor.checkbox") || "Task List", keys: [modKey, "Shift", "9"], desc: "Toggle interactive checkbox task item" },
          { label: t("editor.blockquote") || "Blockquote", keys: [modKey, "Shift", "."], desc: "Wrap line in quote block" },
        ],
      },
      {
        title: t("helpModal.sectionEditor") || "Editor Controls",
        items: [
          { label: t("helpModal.featureSlashTitle") || "Slash Commands Menu", keys: ["/"], desc: "Trigger quick insert block popup" },
          { label: t("editor.shortcutTabDesc") || "Indent / Tab", keys: ["Tab"], desc: "Indent line or list item" },
          { label: t("editor.shortcutShiftTabDesc") || "Outdent", keys: ["Shift", "Tab"], desc: t("editor.shortcutShiftTabDesc") || "Outdent line or list item" },
          { label: t("editor.undo") || "Undo", keys: [modKey, "Z"], desc: "Revert last change" },
          { label: t("editor.redo") || "Redo", keys: [modKey, "Y"], desc: "Reapply previously undone change" },
        ],
      },
    ],
    [t, modKey]
  );

  const filteredShortcutGroups = useMemo(() => {
    if (!searchQuery.trim()) return shortcutGroups;
    const q = searchQuery.toLowerCase().trim();
    return shortcutGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            item.keys.some((k) => k.toLowerCase().includes(q))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [shortcutGroups, searchQuery]);

  const isTh = language === "th";

  const markdownCheatSheet = useMemo(
    () => [
      {
        category: isTh ? "หัวข้อ (Headings)" : "Headings",
        items: [
          { syntax: "# Heading 1", preview: isTh ? "หัวข้อหลักขนาดใหญ่ (H1)" : "Large primary heading (H1)" },
          { syntax: "## Heading 2", preview: isTh ? "หัวข้อส่วนขนาดกลาง (H2)" : "Medium section heading (H2)" },
          { syntax: "### Heading 3", preview: isTh ? "หัวข้อย่อย (H3)" : "Sub-section heading (H3)" },
        ],
      },
      {
        category: isTh ? "การเน้นข้อความ (Styling)" : "Styling",
        items: [
          { syntax: "**bold text**", preview: isTh ? "ตัวหนาเน้นข้อความ" : "Bold emphasis" },
          { syntax: "*italic text*", preview: isTh ? "ตัวเอียง" : "Italicized text" },
          { syntax: "~~strikethrough~~", preview: isTh ? "ขีดฆ่าข้อความ" : "Strikethrough line" },
          { syntax: "==highlighted text==", preview: isTh ? "ไฮไลต์พื้นหลังข้อความ" : "Colored marker background" },
          { syntax: "`inline code`", preview: isTh ? "โค้ดแทรกในบรรทัด" : "Inline monospace block" },
        ],
      },
      {
        category: isTh ? "รายการและงาน (Lists & Tasks)" : "Lists & Tasks",
        items: [
          { syntax: "- [ ] Task to do\n- [x] Completed task", preview: isTh ? "กล่องเครื่องหมายสำหรับรายการงาน" : "Interactive task checkboxes" },
          { syntax: "- Bullet item\n  - Indented bullet", preview: isTh ? "รายการหัวข้อย่อยแบบจุด" : "Unordered bullet lists" },
          { syntax: "1. First step\n2. Second step", preview: isTh ? "รายการแบบใส่หมายเลขลำดับ" : "Numbered ordered lists" },
        ],
      },
      {
        category: isTh ? "บล็อกขั้นสูง (Advanced Blocks)" : "Advanced Blocks",
        items: [
          { syntax: "```javascript\nfunction greet() {\n  console.log('Hello');\n}\n```", preview: isTh ? "บล็อกโค้ดพร้อมไฮไลต์สีไวยากรณ์" : "Syntax highlighted code block with copy" },
          { syntax: "> This is a blockquote quote.", preview: isTh ? "กล่องข้อความอ้างอิง" : "Indented blockquote callout" },
          { syntax: "| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell A | Cell B |", preview: isTh ? "ตารางจัดระเบียบข้อมูล" : "Clean markdown table" },
          { syntax: "$E = mc^2$", preview: isTh ? "สูตรคณิตศาสตร์ KaTeX" : "Inline KaTeX Math equation" },
          { syntax: "---\n***", preview: isTh ? "เส้นคั่นแบ่งแนวนอน" : "Horizontal dividing rule" },
          { syntax: "[Link Title](https://example.com)", preview: isTh ? "ลิงก์เว็บไซต์ภายนอก" : "Clickable external hyperlink" },
          { syntax: "Here is text[^1].\n\n[^1]: Footnote description.", preview: isTh ? "เชิงอรรถอ้างอิงท้ายหน้า" : "Footnote reference and definition" },
        ],
      },
    ],
    [isTh]
  );

  const faqItems = useMemo(
    () => isTh ? [
      {
        q: "โน้ตและไฟล์ของฉันถูกเก็บไว้ที่ไหน?",
        a: "Luno Notes ทำงานแบบ Local-first ข้อมูลทั้งหมดจะถูกเก็บเป็นไฟล์ .md และไฟล์รูปภาพจริงในโฟลเดอร์เครื่องคอมพิวเตอร์ของคุณ 100% ทำให้คุณสามารถเปิดแก้ไขด้วยโปรแกรมอื่นหรือย้ายโฟลเดอร์ได้อย่างอิสระ",
      },
      {
        q: "การซิงก์กับ Google Drive ทำงานอย่างไร?",
        a: "เมื่อเปิดใช้งานในหน้าตั้งค่า (Settings > Cloud Sync) แอปจะทำการสำรองและซิงก์ไฟล์ใน Workspace ของคุณไปยังโฟลเดอร์ Google Drive แบบอัตโนมัติ ทำให้คุณสามารถใช้งานโน้ตเดียวกันได้ทุกที่",
      },
      {
        q: "คำสั่ง Slash (/) ใช้งานอย่างไร?",
        a: "เมื่อคุณอยู่บนบรรทัดว่างในตัวแก้ไข เพียงพิมพ์เครื่องหมาย '/' เมนูลัดจะปรากฏขึ้นมาให้คุณเลือกแทรกตาราง, บล็อกโค้ด, รายการงาน, สูตรคณิตศาสตร์ หรือจัดรูปแบบได้อย่างรวดเร็วโดยไม่ต้องกดปุ่มบนแถบเครื่องมือ",
      },
      {
        q: "ฉันสามารถเปิด 2 โน้ตพร้อมกันได้หรือไม่?",
        a: "ได้ครับ คุณสามารถใช้ฟีเจอร์ Split View โดยคลิกขวาที่แท็บโน้ตหรือกดปุ่มแบ่งหน้าจอบนแถบเครื่องมือ เพื่อเปิด 2 โน้ตเทียบเคียงกันและแก้ไขได้พร้อมกัน",
      },
      {
        q: "สามารถปรับแต่งแถบเครื่องมือและไอคอนได้ไหม?",
        a: "สามารถทำได้ในเมนูตั้งค่า > แถบเครื่องมือ (Toolbar) คุณสามารถเปิด/ปิดปุ่มเครื่องมือ หรือลากสลับลำดับตำแหน่งปุ่มบน Toolbar ได้อย่างอิสระตามความถนัด",
      },
    ] : [
      {
        q: "Where are my notes and files stored?",
        a: "Luno Notes operates with a local-first architecture. All your notes and images are saved directly as real Markdown (.md) and media files on your local computer, allowing you to open or edit them with any external editor freely.",
      },
      {
        q: "How does Google Drive synchronization work?",
        a: "When enabled in Settings > Cloud Sync, Luno automatically backs up and syncs your workspace files with your personal Google Drive, giving you seamless access across all your devices.",
      },
      {
        q: "How do I use Slash (/) commands?",
        a: "Simply press '/' at the start of any empty line in the editor to bring up a quick popup menu for tables, code blocks, task lists, math formulas, and formatting tools without using the toolbar.",
      },
      {
        q: "Can I view and edit two notes side-by-side?",
        a: "Yes! Use the Split Screen button on the toolbar or right-click a note tab to open two documents side-by-side with an adjustable resizable divider.",
      },
      {
        q: "Can I customize the toolbar and button order?",
        a: "Yes, head over to Settings > Toolbar Preferences where you can toggle tool visibility and drag buttons to reorder them according to your workflow.",
      },
    ],
    [isTh]
  );

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      {/* Left Sidebar: Categories Navigation */}
      <div className="w-56 sm:w-64 shrink-0 border-r border-border/50 bg-sidebar/50 flex flex-col h-full select-none">
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              {(() => {
                const HelpIcon = getToolbarIcon("helpCircle", pack);
                return <HelpIcon className="h-4 w-4" />;
              })()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-tight">
                {t("sidebar.help") || "Help Center"}
              </h2>
              <p className="text-[11px] text-muted-foreground">Luno Notes v1.1.0</p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => {
            const Icon = getToolbarIcon(cat.iconKey, pack);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className="truncate flex-1">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Quick Action */}
        <div className="p-3 border-t border-border/40 space-y-1.5 bg-sidebar/30">
          {onOpenSettings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs rounded-xl h-8 border-border/60 cursor-pointer"
              onClick={onOpenSettings}
            >
              {(() => {
                const SettingsIconComp = getToolbarIcon("settings", pack);
                return <SettingsIconComp className="h-3.5 w-3.5" />;
              })()}
              <span>{t("common.settings") || "Settings"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto bg-background">
        <div className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Title for Current Category */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {(() => {
                    const CurrentHeaderIcon = getToolbarIcon(currentCategory.iconKey, pack);
                    return <CurrentHeaderIcon className="h-4 w-4" />;
                  })()}
                </div>
                <h1 className="text-lg md:text-xl font-bold text-foreground">
                  {currentCategory.label}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground pl-9">
                {currentCategory.desc}
              </p>
            </div>
          </div>

          {/* 1. SHORTCUTS CATEGORY */}
          {activeCategory === "shortcuts" && (
            <div className="space-y-5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("helpModal.searchShortcutsPlaceholder") || "Search keyboard shortcuts (e.g. Save, Bold, New Note, Ctrl+N)..."}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/70 bg-card text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              {filteredShortcutGroups.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground rounded-2xl border border-border/40 bg-card/40">
                  {t("helpModal.noShortcutsFound") || "No matching shortcuts found."}
                </div>
              ) : (
                filteredShortcutGroups.map((group) => (
                  <div key={group.title} className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      {group.title}
                    </h3>
                    <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
                      {group.items.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-4"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-xs font-semibold text-foreground block">{item.label}</span>
                            <span className="text-[11px] text-muted-foreground block truncate">{item.desc}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.keys.map((k, idx) => (
                              <React.Fragment key={idx}>
                                <kbd className="px-2.5 py-1 rounded-lg bg-muted border border-border/80 text-xs font-mono font-semibold text-foreground shadow-2xs">
                                  {k}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className="text-muted-foreground text-xs font-bold">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. MARKDOWN GUIDE CATEGORY */}
          {activeCategory === "markdown" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground">{t("helpModal.markdownTipTitle") || "Markdown Live Formatting"}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("helpModal.markdownTipDesc") || "Luno Notes supports CommonMark and GFM syntax with instant live rendering. Type these symbols to format your documents on the fly."}
                  </p>
                </div>
              </div>

              {markdownCheatSheet.map((section, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {section.category}
                  </h3>
                  <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 px-4 py-2.5 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>{t("helpModal.markdownSyntax") || "Markdown Syntax"}</span>
                      <span className="hidden md:block">{t("helpModal.markdownOutput") || "Rendered Output"}</span>
                    </div>
                    {section.items.map((item, itemIdx) => {
                      const codeId = `md-${idx}-${itemIdx}`;
                      return (
                        <div
                          key={itemIdx}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 py-3 items-center hover:bg-muted/20 transition-colors"
                        >
                          <div className="relative group">
                            <pre className="text-xs font-mono bg-muted/70 p-2.5 pr-8 rounded-xl border border-border/50 text-foreground overflow-x-auto whitespace-pre-wrap">
                              {item.syntax}
                            </pre>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.syntax, codeId)}
                                  className="absolute top-2 right-2 p-1 rounded-md bg-card/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Copy markdown snippet"
                                >
                                  {copiedCode === codeId ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left" sideOffset={4}>
                                {copiedCode === codeId ? "Copied!" : "Copy markdown snippet"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-xs text-muted-foreground pl-1">{item.preview}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. FEATURES CATEGORY */}
          {activeCategory === "features" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Command className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("helpModal.featureSlashTitle")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("helpModal.featureSlashDesc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Columns className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("helpModal.featureSplitTitle")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("helpModal.featureSplitDesc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("helpModal.featureAiTitle")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("helpModal.featureAiDesc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Cloud className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("helpModal.featureSyncTitle")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("helpModal.featureSyncDesc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("helpModal.featureTagsTitle")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("helpModal.featureTagsDesc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("settings.title")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.appThemeDesc")}
                </p>
              </div>
            </div>
          )}

          {/* 4. FAQ CATEGORY */}
          {activeCategory === "faq" && (
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-border/60 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">{item.q}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 5. ABOUT CATEGORY */}
          {activeCategory === "about" && (
            <div className="space-y-6">
              <div className="p-8 rounded-2xl border border-border/60 bg-card shadow-2xs text-center space-y-3">
                <div className="mx-auto h-16 w-16 rounded-3xl bg-primary/15 flex items-center justify-center text-primary shadow-xs">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Luno Notes</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <span>Version 1.1.0</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Production Ready</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed pt-1">
                  {t("helpModal.aboutDesc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onOpenSettings && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl text-xs h-10 gap-2"
                    onClick={onOpenSettings}
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>{t("common.settings") || "Open Settings"}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  className="w-full rounded-xl text-xs h-10"
                  onClick={onClose}
                >
                  {t("helpModal.close") || "Close"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
