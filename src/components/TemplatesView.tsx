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
import { Check, Copy, Plus, Code, Eye, Monitor, Smartphone, Tablet, RotateCcw, X } from "lucide-react";
import { marked } from "marked";
import { parseFrontmatterAndTags } from "@/lib/frontmatter";
import { preprocessMarkdownForEditor } from "@/components/Editor";

export interface TemplateItemDef {
  type: NoteTemplateType;
  titleEn: string;
  titleTh: string;
  descEn: string;
  descTh: string;
  format: "markdown" | "html" | "plain";
  formatExt: "md" | "html" | "txt";
  category: "work" | "daily" | "web" | "general";
  icon: string;
  color?: string;
}

const TEMPLATE_DEFINITIONS: TemplateItemDef[] = [
  // 1. Markdown (.md) - 6 items
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
    type: "bug",
    titleEn: "Bug Report",
    titleTh: "รายงานปัญหา",
    descEn: "Document bug reproduction and steps",
    descTh: "บันทึกขั้นตอนการจำลองและแก้ปัญหา",
    format: "markdown",
    formatExt: "md",
    category: "work",
    icon: "lucide:Bug",
    color: "#ef4444",
  },

  // 2. HTML (.html) - 5 items
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

  // 3. Plain Text (.txt) - 5 items
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
    type: "readme",
    titleEn: "README",
    titleTh: "เอกสาร README",
    descEn: "Project overview, setup & usage",
    descTh: "อธิบายโปรเจกต์ / ไฟล์ / วิธีใช้งาน",
    format: "plain",
    formatExt: "txt",
    category: "work",
    icon: "lucide:BookOpen",
    color: "#6366f1",
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
      { id: "md", label: "Markdown (.md)" },
      { id: "html", label: "HTML (.html)" },
      { id: "txt", label: isTh ? "ข้อความ (.txt)" : "Text (.txt)" },
      { id: "work", label: isTh ? "งานและโครงการ" : "Work & Projects" },
      { id: "daily", label: isTh ? "ประจำวันและส่วนตัว" : "Daily & Personal" },
      { id: "web", label: isTh ? "เว็บไซต์และโค้ด" : "Web & Code" },
    ],
    [isTh]
  );

  const filterItem = (item: TemplateItemDef) => {
    if (selectedCategory === "md" && item.formatExt !== "md") return false;
    if (selectedCategory === "html" && item.formatExt !== "html") return false;
    if (selectedCategory === "txt" && item.formatExt !== "txt") return false;
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
    try {
      // 1. Strip YAML frontmatter block (icon, iconColor, tags, etc.) so it matches the editor 100%
      const parsed = parseFrontmatterAndTags(previewContent);
      const markdownBody = parsed.bodyContent || previewContent;

      // 2. Normalize standalone `[ ]` or `[x]` lines to `- [ ]` so marked parses them into standard task lists
      const normalizedBody = markdownBody.replace(/^([ \t]*)\[([ xX])\]\s*(.*)$/gm, "$1- [$2] $3");

      // 3. Preprocess custom features & wikilinks using Editor's exact preprocessor
      const textWithTableAttr = normalizedBody.replace(/<table([\s>])/gi, '<table data-original-html-table="true"$1');
      const preprocessed = preprocessMarkdownForEditor(textWithTableAttr, false);

      const rawHtml = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;

      // 4. Transform HTML tasklists into Editor's native taskList structure (removes bullet dots and aligns checkbox 100% like Editor!)
      if (typeof document !== "undefined") {
        const root = document.createElement("div");
        root.innerHTML = rawHtml;

        root.querySelectorAll("li").forEach((li) => {
          const checkbox = li.querySelector('input[type="checkbox"]');
          if (!checkbox) return;
          const isChecked = (checkbox as HTMLInputElement).checked;
          checkbox.remove();
          const inner = (li.innerHTML || "").trim();
          const tpl = document.createElement("template");
          tpl.innerHTML =
            `<li data-type="taskItem" data-checked="${isChecked}">` +
            `<label contenteditable="false"><input type="checkbox"${isChecked ? " checked" : ""}><span></span></label>` +
            `<div><p>${inner || ""}</p></div>` +
            `</li>`;
          li.replaceWith(tpl.content.firstChild!);
        });

        root.querySelectorAll("ul").forEach((ul) => {
          if (ul.querySelector('li[data-type="taskItem"]')) {
            ul.setAttribute("data-type", "taskList");
            ul.removeAttribute("class");
          }
        });

        // Clean up redundant empty paragraphs and extra break spacing between headings and lists
        root.querySelectorAll("p").forEach((p) => {
          const text = p.textContent?.trim();
          const hasMediaOrInput = p.querySelector("img, input, iframe, a, svg");
          if (!text && !hasMediaOrInput) {
            p.remove();
          }
        });

        return root.innerHTML;
      }

      return rawHtml;
    } catch {
      return "";
    }
  }, [previewItem, previewContent]);

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isTh ? "เทมเพลตทั้งหมด" : "All Templates"}
              </h1>
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
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
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
                  {cat.label}
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
            className="w-[95vw] max-w-6xl h-[88vh] max-h-[88vh] rounded-2xl flex flex-col p-5 overflow-hidden bg-card border border-border shadow-2xl transition-all duration-200 [&>button:last-child]:hidden"
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
                        {previewItem.format === "html" ? <Monitor className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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

                    {/* Responsive Device Container */}
                    <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 overflow-auto bg-muted/10">
                      <div
                        className={`h-full transition-all duration-300 shadow-md rounded-lg overflow-hidden border border-border/50 ${
                          deviceMode === "mobile"
                            ? "w-[375px]"
                            : deviceMode === "tablet"
                            ? "w-[768px]"
                            : "w-full"
                        }`}
                      >
                        <iframe
                          key={iframeKey}
                          title="Live HTML Preview"
                          srcDoc={previewContent}
                          sandbox="allow-scripts allow-same-origin"
                          className="w-full h-full border-0 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : previewItem?.format === "markdown" ? (
                  // 100% Editor-Matching Realistic Markdown Preview (Scrollbar on the far right edge)
                  <div className="flex-1 h-full overflow-y-auto w-full">
                    <div
                      className="max-w-4xl mx-auto px-10 py-8 text-foreground leading-relaxed break-words [overflow-wrap:anywhere] outline-none select-text
                        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                        [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:my-0 [&_h1]:mb-3 [&_h1]:leading-tight [&_h1]:border-0
                        [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:my-0 [&_h2]:mt-4 [&_h2]:mb-1
                        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:my-0 [&_h3]:mt-3 [&_h3]:mb-1
                        [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:my-0 [&_h4]:mt-2 [&_h4]:mb-0.5
                        [&_p]:my-0 [&_p]:leading-relaxed
                        [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-6
                        [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-6
                        [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']]:my-0 [&_ul[data-type='taskList']]:space-y-0
                        [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-0
                        [&_ul[data-type='taskList']_li_label]:w-6 [&_ul[data-type='taskList']_li_label]:h-7 [&_ul[data-type='taskList']_li_label]:shrink-0 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:justify-center
                        [&_ul[data-type='taskList']_li_label_input]:h-[14px] [&_ul[data-type='taskList']_li_label_input]:w-[14px] [&_ul[data-type='taskList']_li_label_input]:bg-transparent [&_ul[data-type='taskList']_li_label_input]:rounded-[3px] [&_ul[data-type='taskList']_li_label_input]:border [&_ul[data-type='taskList']_li_label_input]:border-muted-foreground/50 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary
                        [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:rounded-lg [&_table]:overflow-hidden
                        [&_th]:border [&_th]:border-border/80 [&_th]:bg-muted/60 [&_th]:px-3.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-xs [&_th]:text-foreground
                        [&_td]:border [&_td]:border-border/80 [&_td]:px-3.5 [&_td]:py-1.5 [&_td]:text-xs [&_td]:text-foreground/90
                        [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-foreground/90
                        [&_code]:bg-muted/70 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs
                        [&_pre]:bg-muted/60 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border/50
                        [&_hr]:my-4 [&_hr]:border-border/50"
                      style={{
                        fontFamily: settings?.fontFamily || undefined,
                        fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
                        lineHeight: settings?.lineHeight || undefined,
                      }}
                      dangerouslySetInnerHTML={{ __html: renderedMarkdownHtml }}
                    />
                  </div>
                ) : (
                  // Plain Text Formatting (Matching Plain Text Editor with scrollbar on the far right edge)
                  <div className="flex-1 h-full overflow-y-auto w-full">
                    <div
                      className="max-w-4xl mx-auto px-10 py-8 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed selection:bg-primary/20"
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
                <div className="flex-1 h-full overflow-auto p-6 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/40 selection:bg-primary/20">
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
