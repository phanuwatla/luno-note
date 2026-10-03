import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  type NoteTemplateType,
  NOTE_TEMPLATE_METADATA,
  getNoteTemplateContent,
  getNoteTemplateMetadata,
  getTemplateIcon,
  replaceFirstH1InMarkdown,
} from "@/lib/templates";
import { formatDateForFileName } from "@/lib/dateTimeFormatter";
import type { Note } from "@/hooks/useNotes";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Check, Copy, Plus, Code, Eye, Monitor, Smartphone, Tablet, RotateCcw, X, LayoutTemplate, ArrowLeft, ChevronRight } from "lucide-react";
import { marked } from "marked";
import { parseFrontmatterAndTags } from "@/lib/frontmatter";
import { renderMarkdownToEditorHtml, EDITOR_CLASSES } from "@/components/Editor";
import NoteEditorPreview from "@/components/NoteEditorPreview";

export {
  type TemplateItemDef,
  TEMPLATE_CATEGORIES,
  TEMPLATE_DEFINITIONS,
  type PendingTemplatePreview,
  setPendingTemplatePreview,
  getPendingTemplatePreview,
} from "@/lib/templateDefinitions";
import {
  type TemplateItemDef,
  TEMPLATE_CATEGORIES,
  TEMPLATE_DEFINITIONS,
  getPendingTemplatePreview,
  setPendingTemplatePreview,
} from "@/lib/templateDefinitions";

interface TemplatesViewProps {
  onCreateWithTemplate: (
    templateType: NoteTemplateType,
    format?: "markdown" | "html" | "plain",
    templateIcon?: string,
    templateColor?: string
  ) => void;
  notes?: Note[];
}

export default function TemplatesView({
  onCreateWithTemplate,
  notes,
}: TemplatesViewProps) {
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";
  const pack = settings?.iconPack || "lucide";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<TemplateItemDef | null>(() => {
    const pending = getPendingTemplatePreview();
    if (pending?.type) {
      setPendingTemplatePreview(null);
      const found =
        TEMPLATE_DEFINITIONS.find((item) => item.type === pending.type && (!pending.formatExt || item.formatExt === pending.formatExt)) ||
        TEMPLATE_DEFINITIONS.find((item) => item.type === pending.type);
      if (found) return found;
    }
    return null;
  });
  const [previewTab, setPreviewTab] = useState<"rendered" | "code">("rendered");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Monitor preview viewport container size for responsive iframe scaling
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const el = previewContainerRef.current;
    const updateSize = () => {
      if (el) {
        setContainerWidth(el.clientWidth);
        setContainerHeight(el.clientHeight);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewItem, previewTab, deviceMode]);

  const deviceViewport = useMemo(() => {
    const pad = 16;
    const availW = Math.max((containerWidth || 720) - pad, 280);
    const availH = Math.max((containerHeight || 450) - pad, 200);

    if (deviceMode === "mobile") {
      const targetW = 375;
      const scale = availW < targetW ? availW / targetW : 1;
      return {
        targetW,
        scale,
        wrapperW: `${targetW * scale}px`,
        wrapperH: `${availH}px`,
        iframeH: `${availH / scale}px`,
        isScaled: scale < 1,
      };
    }

    if (deviceMode === "tablet") {
      const targetW = 768;
      const scale = availW < targetW ? availW / targetW : 1;
      return {
        targetW,
        scale,
        wrapperW: `${targetW * scale}px`,
        wrapperH: `${availH}px`,
        iframeH: `${availH / scale}px`,
        isScaled: scale < 1,
      };
    }

    // desktop: 100%
    return {
      targetW: 0,
      scale: 1,
      wrapperW: "100%",
      wrapperH: "100%",
      iframeH: "100%",
      isScaled: false,
    };
  }, [deviceMode, containerWidth, containerHeight]);

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

  // Listen to template preview selection from sidebar or other components
  useEffect(() => {
    const applyPending = () => {
      const pending = getPendingTemplatePreview();
      if (pending?.type) {
        setPendingTemplatePreview(null);
        const found =
          TEMPLATE_DEFINITIONS.find((item) => item.type === pending.type && (!pending.formatExt || item.formatExt === pending.formatExt)) ||
          TEMPLATE_DEFINITIONS.find((item) => item.type === pending.type);
        if (found) {
          setPreviewItem(found);
          setSelectedCategory("all");
          setSearchQuery("");
        }
      }
    };

    applyPending();

    const handleOpenPreview = (e: Event) => {
      const custom = e as CustomEvent<{ type?: string; format?: string; formatExt?: string }>;
      const { type, formatExt } = custom.detail || {};
      if (!type) return;
      const found =
        TEMPLATE_DEFINITIONS.find((item) => item.type === type && (!formatExt || item.formatExt === formatExt)) ||
        TEMPLATE_DEFINITIONS.find((item) => item.type === type);
      if (found) {
        setPreviewItem(found);
        setSelectedCategory("all");
        setSearchQuery("");
      }
    };
    window.addEventListener("luno:open-template-preview", handleOpenPreview);
    return () => {
      window.removeEventListener("luno:open-template-preview", handleOpenPreview);
    };
  }, []);

  const categories = useMemo(
    () => [
      { id: "all", label: isTh ? "ทั้งหมด" : "All" },
      { id: "md", label: "Markdown" },
      { id: "html", label: "HTML" },
      { id: "txt", label: isTh ? "ข้อความ" : "Text" },
      { id: "study", label: isTh ? "การเรียน & วิจัย" : "Study & Research" },
      { id: "dev", label: isTh ? "พัฒนาโปรแกรม & IT" : "Dev & Tech" },
      { id: "work", label: isTh ? "งาน & ธุรกิจ" : "Work & Business" },
      { id: "daily", label: isTh ? "สุขภาพ & ส่วนตัว" : "Daily & Wellness" },
      { id: "web", label: isTh ? "เว็บไซต์ & โค้ด" : "Web & UI" },
    ],
    [isTh]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: TEMPLATE_DEFINITIONS.length,
      md: 0,
      html: 0,
      txt: 0,
      study: 0,
      dev: 0,
      work: 0,
      daily: 0,
      web: 0,
    };

    TEMPLATE_DEFINITIONS.forEach((item) => {
      if (item.formatExt === "md") counts.md++;
      if (item.formatExt === "html") counts.html++;
      if (item.formatExt === "txt") counts.txt++;
      if (item.category === "study") counts.study++;
      if (item.category === "dev") counts.dev++;
      if (item.category === "work") counts.work++;
      if (item.category === "daily") counts.daily++;
      if (item.category === "web") counts.web++;
    });

    return counts;
  }, []);

  const filterItem = (item: TemplateItemDef) => {
    if (selectedCategory === "md" && item.formatExt !== "md") return false;
    if (selectedCategory === "html" && item.formatExt !== "html") return false;
    if (selectedCategory === "txt" && item.formatExt !== "txt") return false;
    if (selectedCategory === "study" && item.category !== "study") return false;
    if (selectedCategory === "dev" && item.category !== "dev") return false;
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

  /**
   * Title that will be displayed in the editor when this template is created and opened.
   * Matches handleCreateFromHomeTemplate and getBaseTitle 100%.
   */
  const appliedTitle = useMemo(() => {
    if (!previewItem || previewItem.format !== "markdown") return "";
    const meta = getNoteTemplateMetadata(previewItem.type);
    const dateStr = formatDateForFileName(new Date(), settings.dateFormat);
    const prefix = meta?.filePrefix || (previewItem.type === "daily" ? "Daily" : "Note");
    const defaultExt = previewItem.formatExt || "md";
    const desiredFileName = `${prefix}-${dateStr}.${defaultExt}`;

    const currentNotes = notes || [];
    if (currentNotes.length > 0) {
      const existingNames = new Set(
        currentNotes
          .filter((n) => !n.folderPath && n.fileName)
          .map((n) => n.fileName!.toLowerCase())
      );
      if (!existingNames.has(desiredFileName.toLowerCase())) {
        return `${prefix}-${dateStr}`;
      }
      let index = 1;
      while (true) {
        const candidate = `${prefix}-${dateStr}-${index}.${defaultExt}`;
        if (!existingNames.has(candidate.toLowerCase())) {
          return `${prefix}-${dateStr}-${index}`;
        }
        index += 1;
      }
    }

    return `${prefix}-${dateStr}`;
  }, [previewItem, settings.dateFormat, notes]);

  /**
   * Preview markdown content with the H1 heading replaced by the exact appliedTitle,
   * guaranteeing 100% WYSIWYG consistency with the editor when applied.
   */
  const displayPreviewContent = useMemo(() => {
    if (!previewItem || previewItem.format !== "markdown" || !appliedTitle || !previewContent) {
      return previewContent;
    }
    return replaceFirstH1InMarkdown(previewContent, appliedTitle);
  }, [previewItem, appliedTitle, previewContent]);

  const renderedMarkdownHtml = useMemo(() => {
    if (!previewItem || previewItem.format !== "markdown" || !displayPreviewContent) return "";
    return renderMarkdownToEditorHtml(displayPreviewContent, {
      isReadingMode: false,
      theme: settings.theme,
      tagColorStyle: settings.tagColorStyle,
    });
  }, [previewItem, displayPreviewContent, settings.theme, settings.tagColorStyle]);

  const safeHtmlPreviewContent = useMemo(() => {
    if (!previewItem || previewItem.format !== "html" || !previewContent) return "";
    const interceptorScript = `
<script>
  (function() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;
      if (href === '#' || href === 'javascript:void(0)' || href === 'javascript:;') {
        e.preventDefault();
        return;
      }
      if (href.indexOf('#') === 0) {
        e.preventDefault();
        var targetId = href.substring(1);
        if (targetId) {
          var targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
        return;
      }
      if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0 || href.indexOf('mailto:') === 0) {
        e.preventDefault();
        if (href.indexOf('mailto:') === 0) {
          window.open(href, '_blank');
        } else {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    }, true);
  })();
</script>
`;
    if (previewContent.includes("</body>")) {
      return previewContent.replace("</body>", `${interceptorScript}</body>`);
    }
    return previewContent + interceptorScript;
  }, [previewItem, previewContent]);

  const handleCopyPreview = () => {
    const textToCopy = previewItem?.format === "markdown" ? displayPreviewContent : previewContent;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast({
        title: isTh ? "คัดลอกแล้ว" : "Copied to clipboard",
        description: isTh ? "คัดลอกเนื้อหาเทมเพลตลงในคลิปบอร์ดแล้ว" : "Template content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Escape key to exit in-tab preview
  useEffect(() => {
    if (!previewItem || settings.appLayout === "compact") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem, settings.appLayout]);

  const relatedTemplates = useMemo(() => {
    if (!previewItem) return [];

    // Filter STRICTLY to templates that are genuinely related:
    // - Based on functional category (e.g. "work", "dev", "study", "daily", "web") — NOT file extension (.md, .html, .txt)
    // - OR same template type in an alternative format (e.g. Markdown Todo vs Text Todo)
    // - OR shared functional non-extension tags
    const filtered = TEMPLATE_DEFINITIONS.filter((item) => {
      // Exclude the currently opened template
      if (item.type === previewItem.type && item.formatExt === previewItem.formatExt) {
        return false;
      }

      // 1. Same template type in another format (e.g. Markdown Todo vs Plain Text Todo)
      if (item.type === previewItem.type) return true;

      // 2. Same functional category tag (Work, Dev, Study, Daily, Web)
      if (item.category === previewItem.category) return true;

      // 3. Shared functional tags (excluding file extensions)
      if (item.tags && previewItem.tags) {
        const shared = item.tags.filter(
          (t) => previewItem.tags?.includes(t) && t !== item.formatExt && t !== previewItem.formatExt
        );
        if (shared.length > 0) return true;
      }

      return false;
    });

    // Sort: Same template type first (alternative format), then same category
    return filtered
      .sort((a, b) => {
        const aSameType = a.type === previewItem.type ? 20 : 0;
        const bSameType = b.type === previewItem.type ? 20 : 0;
        const aSameCategory = a.category === previewItem.category ? 10 : 0;
        const bSameCategory = b.category === previewItem.category ? 10 : 0;
        return (bSameType + bSameCategory) - (aSameType + aSameCategory);
      })
      .slice(0, 12); // Maximum 12 items (not forced to reach 12)
  }, [previewItem]);

  const handleSelectTemplate = (tmpl: TemplateItemDef) => {
    setPreviewItem(tmpl);
    setPreviewTab("rendered");
    setDeviceMode("desktop");
    if (typeof mainScrollRef.current?.scrollTo === "function") {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  };

  const renderTemplateCard = (tmpl: TemplateItemDef, compact = false, extraClassName = "") => {
    const meta = NOTE_TEMPLATE_METADATA[tmpl.type];
    const iconStr = getTemplateIcon(tmpl.type, pack) || meta?.icon || tmpl.icon;
    const colorStr = meta?.iconColor || tmpl.color;
    const title = isTh ? tmpl.titleTh : tmpl.titleEn;
    const desc = isTh ? tmpl.descTh : tmpl.descEn;
    const isCurrentPreview = previewItem?.type === tmpl.type && previewItem?.formatExt === tmpl.formatExt;

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
        className={`flex flex-col text-left p-3.5 rounded-xl bg-card border-[1.5px] transition-all group shadow-2xs cursor-pointer focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 outline-none relative ${
          isCurrentPreview
            ? "border-primary bg-primary/10"
            : "border-border/70 hover:border-primary/60 hover:bg-muted/50"
        } ${compact ? "w-48 sm:w-56 shrink-0" : ""} ${extraClassName}`}
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

        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
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
      <div
        ref={mainScrollRef}
        className="flex-1 h-full min-h-0 overflow-y-auto bg-background text-foreground select-none flex flex-col"
      >
        {previewItem ? (
          // ==================== IN-TAB TEMPLATE PREVIEW VIEW ====================
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {/* Top Breadcrumb Toolbar (Slightly larger for Template Preview) */}
            <div className="sticky top-0 z-30 flex items-center justify-between bg-background px-3.5 h-10 text-[12px] leading-tight text-muted-foreground select-none min-w-0 w-full gap-2 border-b border-border/40 shrink-0">
              {/* Left: ArrowLeft (replaces home icon) + Templates > Template Name */}
              <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden py-1">
                {settings.appLayout === "compact" ? (
                  <span className="font-normal truncate text-muted-foreground/90 px-1 py-0.5 select-none">
                    {isTh ? "เทมเพลต" : "Templates"}
                  </span>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewItem(null);
                          if (typeof mainScrollRef.current?.scrollTo === "function") {
                            mainScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
                          } else if (mainScrollRef.current) {
                            mainScrollRef.current.scrollTop = 0;
                          }
                        }}
                        className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted hover:text-foreground cursor-pointer transition-colors outline-none shrink-0 text-muted-foreground/90"
                      >
                        {(() => {
                          const ArrowLeftIcon = getToolbarIcon("arrowLeft", pack);
                          return <ArrowLeftIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />;
                        })()}
                        <span className="font-normal truncate">{isTh ? "เทมเพลต" : "Templates"}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={4}>
                      {isTh ? "ย้อนกลับไปยังเทมเพลตทั้งหมด" : "Back to all templates"}
                    </TooltipContent>
                  </Tooltip>
                )}
                {(() => {
                  const ChevRightIcon = getToolbarIcon("chevronRight", pack);
                  return <ChevRightIcon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />;
                })()}
                <span className="flex items-center gap-1.5 min-w-[40px] px-0.5 leading-none shrink truncate font-semibold text-foreground">
                  {renderCustomIcon(
                    getTemplateIcon(previewItem.type, pack) || NOTE_TEMPLATE_METADATA[previewItem.type]?.icon || previewItem.icon,
                    "h-3.5 w-3.5 shrink-0",
                    { color: NOTE_TEMPLATE_METADATA[previewItem.type]?.iconColor || previewItem.color }
                  )}
                  <span className="truncate">{isTh ? previewItem.titleTh : previewItem.titleEn}</span>
                </span>
              </div>

              {/* Right: Action and view buttons (100% matched with Editor controls) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-[11.5px] pl-1">
                {/* View Mode Toggle: Live / Formatted vs Source Code (Matching Editor Breadcrumb) */}
                <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("rendered")}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                          previewTab === "rendered"
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {(() => {
                          const EyeIcon = getToolbarIcon("eye", pack);
                          return <EyeIcon className="h-3 w-3" />;
                        })()}
                        <span className="hidden sm:inline">
                          {previewItem.format === "html"
                            ? isTh ? "ดูหน้าเว็บจริง" : "Live Website"
                            : previewItem.format === "markdown"
                            ? isTh ? "เอกสารมาร์กดาวน์" : "Formatted Doc"
                            : isTh ? "ข้อความ" : "Text"}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={4}>
                      {previewItem.format === "html"
                        ? isTh ? "ดูหน้าเว็บจริง" : "Live Website"
                        : previewItem.format === "markdown"
                        ? isTh ? "เอกสารมาร์กดาวน์" : "Formatted Doc"
                        : isTh ? "ข้อความ" : "Text"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("code")}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                          previewTab === "code"
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {(() => {
                          const CodeIcon = getToolbarIcon("code", pack);
                          return <CodeIcon className="h-3 w-3" />;
                        })()}
                        <span className="hidden sm:inline">{isTh ? "โค้ดต้นฉบับ" : "Source Code"}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={4}>
                      {isTh ? "ดูโค้ดต้นฉบับ" : "View Source Code"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* HTML device switcher if HTML & rendered (placed after view mode toggle, exactly like HTML Editor) */}
                {previewItem.format === "html" && previewTab === "rendered" && (
                  <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setDeviceMode("desktop")}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            deviceMode === "desktop"
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          aria-label="Desktop (100%)"
                        >
                          {(() => {
                            const MonitorIcon = getToolbarIcon("monitor", pack);
                            return <MonitorIcon className="h-3.5 w-3.5" />;
                          })()}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={4}>
                        {isTh ? "เดสก์ท็อป (100%)" : "Desktop (100%)"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setDeviceMode("tablet")}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            deviceMode === "tablet"
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          aria-label="Tablet (768px)"
                        >
                          {(() => {
                            const TabletIcon = getToolbarIcon("tablet", pack);
                            return <TabletIcon className="h-3.5 w-3.5" />;
                          })()}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={4}>
                        {isTh ? "แท็บเล็ต (768px)" : "Tablet (768px)"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setDeviceMode("mobile")}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            deviceMode === "mobile"
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          aria-label="Mobile (375px)"
                        >
                          {(() => {
                            const SmartphoneIcon = getToolbarIcon("smartphone", pack);
                            return <SmartphoneIcon className="h-3.5 w-3.5" />;
                          })()}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={4}>
                        {isTh ? "มือถือ (375px)" : "Mobile (375px)"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Copy button - matching Editor Breadcrumb action button style */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyPreview}
                      className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus-visible:ring-0 focus-visible:outline-none focus:outline-none"
                    >
                      {copied ? (
                        (() => {
                          const CheckIcon = getToolbarIcon("check", pack);
                          return <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />;
                        })()
                      ) : (
                        (() => {
                          const CopyIcon = getToolbarIcon("copy", pack);
                          return <CopyIcon className="h-3.5 w-3.5" />;
                        })()
                      )}
                      <span className="sr-only">
                        {copied ? (isTh ? "คัดลอกแล้ว" : "Copied") : (isTh ? "คัดลอกโค้ด" : "Copy code")}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? (isTh ? "คัดลอกแล้ว" : "Copied") : (isTh ? "คัดลอกโค้ด" : "Copy code")}
                  </TooltipContent>
                </Tooltip>

                {/* Use this template primary button - styled like the image button (comfortable height h-7, slightly more rounded) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={() => {
                        const iconVal = getTemplateIcon(previewItem.type, pack) || NOTE_TEMPLATE_METADATA[previewItem.type]?.icon || previewItem.icon;
                        const colorVal = NOTE_TEMPLATE_METADATA[previewItem.type]?.iconColor || previewItem.color;
                        onCreateWithTemplate(previewItem.type, previewItem.format, iconVal, colorVal);
                      }}
                      className="h-7 px-3 rounded-[10px] text-xs font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer shrink-0"
                    >
                      {(() => {
                        const PlusIcon = getToolbarIcon("plus", pack);
                        return <PlusIcon className="h-3.5 w-3.5" />;
                      })()}
                      <span>{isTh ? "ใช้เทมเพลตนี้" : "Use this template"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4}>
                    {isTh ? "ใช้เทมเพลตนี้" : "Use this template"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-4">
              {/* Template Info Section: Icon, Title, Format badge, Category badge & Description */}
              <div className="space-y-1.5 shrink-0 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {renderCustomIcon(
                    getTemplateIcon(previewItem.type, pack) || NOTE_TEMPLATE_METADATA[previewItem.type]?.icon || previewItem.icon,
                    "h-6 w-6 shrink-0",
                    { color: NOTE_TEMPLATE_METADATA[previewItem.type]?.iconColor || previewItem.color }
                  )}
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {isTh ? previewItem.titleTh : previewItem.titleEn}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/40 bg-sidebar-accent/60 text-muted-foreground uppercase shrink-0">
                    .{previewItem.formatExt}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border/40 bg-muted/50 text-muted-foreground capitalize shrink-0">
                    {previewItem.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isTh ? previewItem.descTh : previewItem.descEn}
                </p>
              </div>

            {/* Main Preview Container */}
            <div className="h-[520px] lg:h-[600px] rounded-xl border border-border/60 bg-background overflow-hidden flex flex-col relative shadow-xs shrink-0">
              {previewTab === "rendered" ? (
                previewItem.format === "html" ? (
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

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setIframeKey((prev) => prev + 1)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="sr-only">{isTh ? "โหลดใหม่" : "Reload"}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4}>
                          {isTh ? "โหลดใหม่" : "Reload"}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Responsive Device Container with High-Fidelity Exact Viewport Simulation */}
                    <div
                      ref={previewContainerRef}
                      className="flex-1 min-h-0 w-full flex items-center justify-center p-2 overflow-hidden bg-muted/10"
                    >
                      {deviceMode === "desktop" ? (
                        <div className="w-full h-full transition-all duration-300 shadow-md rounded-lg overflow-hidden border border-border/50 bg-white">
                          <iframe
                            key={iframeKey}
                            title="Live HTML Preview"
                            srcDoc={safeHtmlPreviewContent}
                            sandbox="allow-scripts allow-popups"
                            className="w-full h-full border-0 bg-white block"
                          />
                        </div>
                      ) : (
                        <div
                          className="transition-all duration-300 shadow-md rounded-lg overflow-hidden border border-border/50 bg-white relative flex-shrink-0"
                          style={{
                            width: deviceViewport.wrapperW,
                            height: deviceViewport.wrapperH,
                          }}
                        >
                          <div
                            style={{
                              width: `${deviceViewport.targetW}px`,
                              height: deviceViewport.iframeH,
                              transform: deviceViewport.isScaled ? `scale(${deviceViewport.scale})` : undefined,
                              transformOrigin: "top left",
                            }}
                          >
                            <iframe
                              key={iframeKey}
                              title="Live HTML Preview"
                              srcDoc={safeHtmlPreviewContent}
                              sandbox="allow-scripts allow-popups"
                              style={{
                                width: `${deviceViewport.targetW}px`,
                                height: deviceViewport.iframeH,
                              }}
                              className="border-0 bg-white block"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // 100% Editor-Matching Realistic Preview using live TipTap Editor Renderer for Markdown and Plain Text (.txt)
                  <NoteEditorPreview
                    content={previewItem.format === "markdown" ? displayPreviewContent : previewContent}
                    title={previewItem.format === "markdown" ? appliedTitle : undefined}
                    tags={previewItem.tags}
                    format={previewItem.format}
                    className="h-full select-text"
                  />
                )
              ) : (
                // Raw Source Code
                <div className="flex-1 h-full overflow-auto p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/40 selection:bg-primary/20 select-text">
                  {displayPreviewContent}
                </div>
              )}
            </div>

            {/* Related Templates Grid (No horizontal scroll, clean heading without icon, genuinely related, max 12 items) */}
            {relatedTemplates.length > 0 && (
              <div className="space-y-3 pt-2 pb-8 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    {isTh ? "เทมเพลตที่เกี่ยวข้อง" : "Related Templates"}
                  </h2>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {relatedTemplates.length} {isTh ? "เทมเพลต" : "templates"}
                  </span>
                </div>

                {/* Grid matching main catalog layout, max 12 items (at most 2 rows on desktop) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {relatedTemplates.map((item) => renderTemplateCard(item))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
          // ==================== CATALOG VIEW (ALL TEMPLATES) ====================
          <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5">
            {/* 1. Header Section (Matching HomeView Style) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-6 w-6 text-primary shrink-0" />
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {isTh ? "เทมเพลตทั้งหมด" : "All Templates"}
                  </h1>
                </div>
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
            <div
              className="flex items-center gap-1.5 pill-scrollbar w-full min-w-0 shrink-0 pb-1"
              onWheel={(e) => {
                if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] ?? 0;
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
                    {cat.label} ({count})
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
                      {mdGroup.map((item) => renderTemplateCard(item))}
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
                      {htmlGroup.map((item) => renderTemplateCard(item))}
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
                      {txtGroup.map((item) => renderTemplateCard(item))}
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
                    {allFiltered.map((item) => renderTemplateCard(item))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
