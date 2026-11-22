import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  Copy,
  Command,
  Columns,
  Cloud,
  Tag,
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  Calculator,
  Lock,
  FileDown,
  LayoutTemplate,
  Mic,
  Database,
  Search,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { getToolbarIcon } from "@/lib/iconPacks";
import { APP_VERSION, APP_AUTHOR, APP_AUTHOR_URL, APP_ABOUT_CREDIT, openExternalUrl } from "@/lib/appVersion";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { ShortcutsSection } from "@/components/shared/ShortcutsSection";
import { AboutUpdateCard } from "@/components/shared/AboutUpdateCard";

import {
  type HelpCategory,
  HELP_CATEGORIES,
  isValidHelpCategory,
} from "@/types/helpCategory";

export {
  type HelpCategory,
  HELP_CATEGORIES,
  isValidHelpCategory,
};

interface HelpCategoryMeta {
  id: HelpCategory;
  label: string;
  iconKey: string;
  desc: string;
}

interface HelpTabViewProps {
  onClose?: () => void;
  initialCategory?: HelpCategory;
  onCategoryChange?: (category: HelpCategory) => void;
  onOpenSettings?: (category?: string) => void;
  onOpenWhatsNew?: () => void;
  onOpenWebTab?: (url: string, initialTitle?: string) => void;
}

export default function HelpTabView({
  onClose,
  initialCategory = "features",
  onCategoryChange,
  onOpenSettings,
  onOpenWhatsNew,
  onOpenWebTab,
}: HelpTabViewProps) {
  const { t, language } = useTranslation();
  const { settings } = useAppSettings();
  const appUpdate = useAppUpdate();

  const [activeCategory, setActiveCategory] = useState<HelpCategory>(() => {
    if (isValidHelpCategory(initialCategory) && initialCategory !== "features") return initialCategory;
    try {
      const saved = localStorage.getItem("luno_last_help_category");
      if (isValidHelpCategory(saved)) return saved;
    } catch { /* ignore */ }
    return isValidHelpCategory(initialCategory) ? initialCategory : "features";
  });

  useEffect(() => {
    if (isValidHelpCategory(initialCategory)) {
      setActiveCategory(initialCategory);
      try {
        localStorage.setItem("luno_last_help_category", initialCategory);
      } catch { /* ignore */ }
    }
  }, [initialCategory]);

  const handleSelectCategory = (catId: HelpCategory) => {
    if (!isValidHelpCategory(catId)) return;
    setActiveCategory(catId);
    try {
      localStorage.setItem("luno_last_help_category", catId);
    } catch { /* ignore */ }
    onCategoryChange?.(catId);
  };

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const pack = settings?.iconPack || "lucide";
  const isTh = language === "th" || settings.language === "th";

  const categories: HelpCategoryMeta[] = useMemo(
    () => [
      {
        id: "features",
        label: t("helpModal.tabFeatures"),
        iconKey: "features",
        desc: t("helpModal.description"),
      },
      {
        id: "markdown",
        label: t("helpModal.tabMarkdown"),
        iconKey: "bookOpen",
        desc: t("helpModal.markdownDescription"),
      },
      {
        id: "shortcuts",
        label: t("settings.catShortcutsTitle"),
        iconKey: "shortcuts",
        desc: t("settings.catShortcutsDesc"),
      },
      {
        id: "faq",
        label: t("helpModal.tabFaq"),
        iconKey: "helpCircle",
        desc: t("helpModal.faqGeneralDesc"),
      },
      {
        id: "about",
        label: t("settings.catAboutTitle"),
        iconKey: "about",
        desc: t("settings.catAboutDesc"),
      },
    ],
    [t, isTh]
  );

  const safeActiveCategory: HelpCategory = isValidHelpCategory(activeCategory)
    ? activeCategory
    : isValidHelpCategory(initialCategory)
    ? initialCategory
    : "features";

  const currentCategory = categories.find((c) => c.id === safeActiveCategory) || categories[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({
      title: t("editor.copied"),
      description: text,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const featureItems = useMemo(
    () => [
      {
        title: isTh ? "Slash Commands (/)" : "Slash Commands (/)",
        desc: t("help.typeAtTheBeginningOf"),
        icon: Command,
      },
      {
        title: isTh ? "AI Assistant (Luno AI)" : "AI Assistant (Luno AI)",
        desc: t("help.intelligentCompanionToSummarizeRewri"),
        icon: Sparkles,
      },
      {
        title: t("help.splitViewDualPane"),
        desc: t("help.workOnTwoNotesSide"),
        icon: Columns,
      },
      {
        title: isTh ? "Google Drive Cloud Sync" : "Google Drive Cloud Sync",
        desc: t("help.directPeerToCloudSynchronization"),
        icon: Cloud,
      },
      {
        title: t("help.tagsFoldersOrganization"),
        desc: t("help.flexibleOrganizationUsingBothReal"),
        icon: Tag,
      },
      {
        title: t("help.builtInUtilities"),
        desc: t("help.builtInAudioRecorderWith"),
        icon: Calculator,
      },
      {
        title: t("help.pinLockProtection"),
        desc: t("help.secureSensitiveNotesWith6"),
        icon: Lock,
      },
      {
        title: t("help.printPdfExport"),
        desc: t("help.exportBeautifullyFormattedNotesTo"),
        icon: FileDown,
      },
      {
        title: t("help.documentTemplates"),
        desc: t("help.kickstartNewNotesFromBuilt"),
        icon: LayoutTemplate,
      },
      {
        title: t("help.globalQuickSearch"),
        desc: t("help.instantLightningFastSearchAcross"),
        icon: Search,
      },
      {
        title: t("help.audioRecording"),
        desc: t("help.recordVoiceMemosDirectlyInside"),
        icon: Mic,
      },
      {
        title: t("help.dataBackupSafety"),
        desc: t("help.exportCompleteWorkspaceZipBackups"),
        icon: Database,
      },
    ],
    [isTh]
  );

  const markdownGroups = useMemo(
    () => [
      {
        title: t("help.headings"),
        items: [
          { label: t("help.largePrimaryHeadingH1"), syntax: "# Heading 1" },
          { label: t("help.mediumSectionHeadingH2"), syntax: "## Heading 2" },
          { label: t("help.subSectionHeadingH3"), syntax: "### Heading 3" },
          { label: t("help.smallHeadingH4"), syntax: "#### Heading 4" },
          { label: t("help.tinyHeadingH5"), syntax: "##### Heading 5" },
          { label: t("help.minimalHeadingH6"), syntax: "###### Heading 6" },
        ],
      },
      {
        title: t("help.textFormatting"),
        items: [
          { label: t("help.boldEmphasis"), syntax: "**bold text**" },
          { label: t("help.italicEmphasis"), syntax: "*italic text*" },
          { label: t("help.strikethroughTextLine"), syntax: "~~strikethrough~~" },
          { label: t("help.backgroundColorHighlight"), syntax: "==highlighted==" },
          { label: t("help.inlineCodeSnippet"), syntax: "`inline code`" },
          { label: t("help.underlineText"), syntax: "<u>underline</u>" },
          { label: t("help.subscriptText"), syntax: "~subscript~" },
          { label: t("help.superscriptText"), syntax: "^superscript^" },
        ],
      },
      {
        title: t("help.listsTasks"),
        items: [
          { label: t("help.bulletedUnorderedList"), syntax: "- Bullet item" },
          { label: t("help.numberedOrderedList"), syntax: "1. First item" },
          { label: t("help.interactiveTaskCheckbox"), syntax: "- [ ] Todo task" },
          { label: t("help.completedCheckboxItem"), syntax: "- [x] Done task" },
        ],
      },
      {
        title: t("help.blocksElements"),
        items: [
          { label: t("help.quoteCalloutText"), syntax: "> Blockquote" },
          { label: t("help.syntaxHighlightedCodeBlock"), syntax: "```javascript ... ```" },
          { label: t("help.horizontalDividerLine"), syntax: "---" },
          { label: t("help.webHyperlinkWithTitle"), syntax: "[Luno](https://luno.app)" },
          { label: t("help.imageWithAltText"), syntax: "![Alt](image.png)" },
          { label: t("help.gfmMarkdownTable"), syntax: "| Col 1 | Col 2 |" },
          { label: t("help.inlineKatexMathFormula"), syntax: "$E = mc^2$" },
          { label: t("help.footnoteReferenceTag"), syntax: "[^1]" },
        ],
      },
    ],
    [isTh]
  );

  const faqItems = useMemo(
    () => [
      {
        q: t("help.whereAreMyNotesStored"),
        a: t("help.lunoNotesIs100Local"),
      },
      {
        q: t("help.doesItWorkCompletelyOffline"),
        a: t("help.yesFullyOfflineAllEditor"),
      },
      {
        q: t("help.canIRecoverAccidentallyDeleted"),
        a: t("help.yesDeletedFilesAreSafely"),
      },
      {
        q: t("help.howDoImagesWork"),
        a: t("help.simplyDragAndDropImage"),
      },
      {
        q: t("help.howDoISyncNotes"),
        a: t("help.navigateToSettingsStorageAnd"),
      },
      {
        q: t("help.howDoesPinLockFor"),
        a: t("help.youCanRightClickAny"),
      },
      {
        q: t("help.howDoIUseSplit"),
        a: t("help.rightClickAnyTabAnd"),
      },
      {
        q: t("help.whatAreSlashCommandsAnd"),
        a: t("help.justTypeOnAnEmpty"),
      },
      {
        q: t("help.howDoIConfigureLuno"),
        a: t("help.headToSettingsAiAnd"),
      },
      {
        q: t("help.howDoIExportOr"),
        a: t("help.clickTheNoteOptionsMenu"),
      },
      {
        q: t("help.howDoTemplatesWork"),
        a: t("help.openTheTemplatesTabTo"),
      },
      {
        q: t("help.howDoTagsAndFavorites"),
        a: t("help.typeTagsInYourNote"),
      },
      {
        q: t("help.canIRecordAudioIn"),
        a: t("help.yesClickTheMicrophoneButton"),
      },
      {
        q: t("help.howDoIBackupAll"),
        a: t("help.visitSettingsBackupToCreate"),
      },
    ],
    [isTh]
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 min-h-0 h-full w-full max-h-full flex flex-col bg-background text-foreground overflow-hidden select-none">
        {/* Main 2-Column Responsive Content View (Mirroring SettingsTabView) */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation Category Column (Collapses to horizontal nav below md) */}
          <nav
            aria-label={t("sidebar.help")}
            className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border/50 bg-card/30 flex flex-col shrink-0 select-none"
          >
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-border/40 font-bold text-base md:text-lg text-foreground flex items-center justify-between">
              <h1 className="text-base md:text-lg font-bold leading-none">{t("sidebar.help")}</h1>
            </div>

            <div className="flex flex-row md:flex-col md:flex-1 min-h-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto p-2 md:p-2.5 gap-1 md:gap-0 md:space-y-1 no-scrollbar overscroll-contain">
              {categories.map((cat) => {
                const Icon = getToolbarIcon(cat.iconKey, pack);
                const isActive = safeActiveCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`shrink-0 md:w-full flex items-center justify-between px-3 py-2 md:py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70"}`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Right Content Panel View */}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col bg-background/50 overflow-hidden">
            {/* Category Header */}
            <div className="px-4 py-4 sm:px-6 md:px-8 md:py-5 border-b border-border/40 bg-card/20 shrink-0">
              <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">{currentCategory.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.desc}</p>
              </div>
            </div>

            {/* Scrollable Category Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 no-scrollbar w-full overscroll-contain">
              {/* 1. FEATURES & TOOLS (Priority #1: App overview & tools) */}
              {safeActiveCategory === "features" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featureItems.map((feat) => {
                      const Icon = feat.icon;
                      return (
                        <div
                          key={feat.title}
                          className="rounded-2xl border border-border/60 bg-card p-5 space-y-2.5 shadow-sm hover:border-border transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-primary shrink-0" />
                            <h4 className="text-xs font-bold text-foreground leading-snug">{feat.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. MARKDOWN GUIDE (Priority #2: Core writing guide) */}
              {safeActiveCategory === "markdown" && (
                <div className="space-y-6">
                  {markdownGroups.map((group, secIdx) => (
                    <div key={group.title} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {group.title}
                      </h3>
                      <div className="divide-y divide-border/30 text-xs">
                        {group.items.map((item, idx) => {
                          const codeId = `md-${secIdx}-${idx}`;
                          return (
                            <div key={idx} className="flex justify-between items-center py-2 gap-4">
                              <span className="text-muted-foreground">{item.label}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.syntax, codeId)}
                                    className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 active:scale-95 transition-all font-mono text-[11px] font-semibold text-foreground cursor-pointer shrink-0 flex items-center gap-1.5"
                                  >
                                    <span>{item.syntax}</span>
                                    {copiedCode === codeId ? (
                                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                    ) : null}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {copiedCode === codeId ? (t("lunoAi.copied")) : (t("help.clickToCopySyntax"))}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. SHORTCUTS (Priority #3: Power user keyboard shortcuts) */}
              {safeActiveCategory === "shortcuts" && <ShortcutsSection />}

              {/* 4. FAQ & TIPS (Priority #4: Troubleshooting & questions) */}
              {safeActiveCategory === "faq" && (
                <div className="space-y-4">
                  {faqItems.map((faq, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/60 bg-card p-5 space-y-2 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="w-4 text-xs font-bold text-primary shrink-0 mt-0.5 select-none">Q:</span>
                        <h4 className="text-xs font-bold text-foreground leading-snug flex-1">{faq.q}</h4>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-4 text-xs font-bold text-muted-foreground shrink-0 mt-0.5 select-none">A:</span>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{faq.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. ABOUT (Priority #5: App Info & Updates - Always at bottom) */}
              {safeActiveCategory === "about" && (
                <AboutUpdateCard
                  onOpenWebTab={onOpenWebTab}
                  onOpenWhatsNew={onOpenWhatsNew}
                  appUpdate={appUpdate}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
