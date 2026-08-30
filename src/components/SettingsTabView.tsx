import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Palette,
  Pencil,
  Folder,
  FileCode,
  LayoutTemplate,
  Keyboard,
  Database,
  Cloud,
  Lock,
  Info,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  ExternalLink,
  RotateCcw,
  Check,
  Download,
  Key,
  Loader2,
  RefreshCw,
  Trash2,
  Plug,
  Unplug,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ChevronsDownUp,
  CodeXml,
  SquareCode,
  Quote,
  Minus,
  Table as TableIcon,
  Smile,
  Calculator,
  Languages,
  Clock,
  Link2,
  ImagePlus,
  Mic,
  Wrench,
  Underline as UnderlineIcon,
  Highlighter,
  Sparkles,
  Layers,
  Feather,
  BookOpen,
  LayoutGrid,
} from "lucide-react";
import { Heading1Icon } from "@/components/icons/Heading1Icon";
import { Heading2Icon } from "@/components/icons/Heading2Icon";
import { Heading3Icon } from "@/components/icons/Heading3Icon";
import { Heading4Icon } from "@/components/icons/Heading4Icon";
import { Heading5Icon } from "@/components/icons/Heading5Icon";
import { Heading6Icon } from "@/components/icons/Heading6Icon";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { FootnoteIcon } from "@/components/icons/FootnoteIcon";
import { GoogleDriveIcon } from "@/components/icons/GoogleDriveIcon";
import { requestGoogleDriveAuth, disconnectGoogleDrive, isGoogleDriveConnected, saveStoredClientId, getStoredClientId } from "@/lib/googleDriveAuth";
import { useGoogleDriveSync } from "@/hooks/useGoogleDriveSync";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_THEMES, APPEARANCE_STYLE_OPTIONS, DEFAULT_HIDDEN_TOOLBAR_ITEMS, DEFAULT_TOOLBAR_ORDER, TOOLBAR_PRESETS, FONT_OPTIONS, useAppSettings } from "@/hooks/useAppSettings";
import { ICON_PACK_OPTIONS, IconPackId, TOOLBAR_ICON_MAP, getToolbarIcon } from "@/lib/iconPacks";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatTime, getDatePatternLabel } from "@/lib/dateTimeFormatter";

const TOOLBAR_TOOL_DEFS: Record<
  string,
  { labelKey: string; icon: any; categoryKey: string; locked?: boolean }
> = {
  undo: { labelKey: "editor.undo", icon: Undo2, categoryKey: "settings.toolCategoryHistory", locked: true },
  redo: { labelKey: "editor.redo", icon: Redo2, categoryKey: "settings.toolCategoryHistory", locked: true },
  h1: { labelKey: "editor.heading1", icon: Heading1Icon, categoryKey: "settings.toolCategoryHeading" },
  h2: { labelKey: "editor.heading2", icon: Heading2Icon, categoryKey: "settings.toolCategoryHeading" },
  h3: { labelKey: "editor.heading3", icon: Heading3Icon, categoryKey: "settings.toolCategoryHeading" },
  h4: { labelKey: "editor.heading4", icon: Heading4Icon, categoryKey: "settings.toolCategoryHeading" },
  h5: { labelKey: "editor.heading5", icon: Heading5Icon, categoryKey: "settings.toolCategoryHeading" },
  h6: { labelKey: "editor.heading6", icon: Heading6Icon, categoryKey: "settings.toolCategoryHeading" },
  bold: { labelKey: "editor.bold", icon: Bold, categoryKey: "settings.toolCategoryInline" },
  italic: { labelKey: "editor.italic", icon: Italic, categoryKey: "settings.toolCategoryInline" },
  underline: { labelKey: "editor.underline", icon: UnderlineIcon, categoryKey: "settings.toolCategoryInline" },
  strike: { labelKey: "editor.strikethrough", icon: Strikethrough, categoryKey: "settings.toolCategoryInline" },
  highlight: { labelKey: "editor.highlight", icon: Highlighter, categoryKey: "settings.toolCategoryInline" },
  bulletList: { labelKey: "editor.bulletList", icon: List, categoryKey: "settings.toolCategoryList" },
  orderedList: { labelKey: "editor.orderedList", icon: ListOrdered, categoryKey: "settings.toolCategoryList" },
  taskList: { labelKey: "editor.checkbox", icon: ListTodoIcon, categoryKey: "settings.toolCategoryList" },
  toggle: { labelKey: "editor.toggle", icon: ChevronsDownUp, categoryKey: "settings.toolCategoryBlock" },
  code: { labelKey: "editor.inlineCode", icon: CodeXml, categoryKey: "settings.toolCategoryBlock" },
  codeBlock: { labelKey: "editor.codeBlock", icon: SquareCode, categoryKey: "settings.toolCategoryBlock" },
  blockquote: { labelKey: "editor.blockquote", icon: Quote, categoryKey: "settings.toolCategoryBlock" },
  horizontalRule: { labelKey: "editor.horizontalRule", icon: Minus, categoryKey: "settings.toolCategoryBlock" },
  footnote: { labelKey: "editor.footnote", icon: FootnoteIcon, categoryKey: "settings.toolCategoryBlock" },
  table: { labelKey: "editor.insertTable", icon: TableIcon, categoryKey: "settings.toolCategoryBlock" },
  emoji: { labelKey: "editor.insertEmoji", icon: Smile, categoryKey: "settings.toolCategoryMedia" },
  calculator: { labelKey: "editor.calculator", icon: Calculator, categoryKey: "settings.toolCategoryMedia" },
  translator: { labelKey: "editor.translator", icon: Languages, categoryKey: "settings.toolCategoryMedia" },
  clock: { labelKey: "editor.clock", icon: Clock, categoryKey: "settings.toolCategoryMedia" },
  link: { labelKey: "editor.link", icon: Link2, categoryKey: "settings.toolCategoryMedia" },
  image: { labelKey: "editor.image", icon: ImagePlus, categoryKey: "settings.toolCategoryMedia" },
  audio: { labelKey: "editor.recordAudio", icon: Mic, categoryKey: "settings.toolCategoryMedia" },
  fixLanguage: { labelKey: "editor.fixLanguage", icon: Wrench, categoryKey: "settings.toolCategoryMedia" },
  aiAssistant: { labelKey: "settings.aiAssistant", icon: SparklesIcon, categoryKey: "settings.toolCategoryAi" },
};

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

export type SettingsCategory =
  | "general"
  | "appearance"
  | "editor"
  | "files"
  | "markdown"
  | "templates"
  | "ai"
  | "shortcuts"
  | "storage"
  | "backup"
  | "privacy"
  | "about";

interface CategoryMeta {
  id: SettingsCategory;
  label: string;
  icon: any;
  isPro?: boolean;
  desc: string;
}

import type { Note } from "@/hooks/useNotes";

interface SettingsTabViewProps {
  onClose?: () => void;
  initialCategory?: SettingsCategory;
  onCategoryChange?: (category: SettingsCategory) => void;
  notes?: Note[];
  onNotesUpdated?: (notes: Note[]) => void;
  openedFolderName?: string | null;
  onCloseWorkspace?: () => void;
  onOpenWebTab?: (url: string) => void;
}

export default function SettingsTabView({
  onClose,
  initialCategory = "general",
  onCategoryChange,
  notes = [],
  onNotesUpdated,
  openedFolderName,
  onCloseWorkspace,
  onOpenWebTab,
}: SettingsTabViewProps) {
  const { settings, updateSetting, applyAppearanceStyle, resetSettings } = useAppSettings();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
    if (initialCategory && initialCategory !== "general") return initialCategory;
    try {
      const saved = localStorage.getItem("luno_last_settings_category") as SettingsCategory;
      if (saved) return saved;
    } catch {}
    return initialCategory || "general";
  });

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
      try {
        localStorage.setItem("luno_last_settings_category", initialCategory);
      } catch {}
    }
  }, [initialCategory]);

  const handleSelectCategory = (catId: SettingsCategory) => {
    setActiveCategory(catId);
    try {
      localStorage.setItem("luno_last_settings_category", catId);
    } catch {}
    onCategoryChange?.(catId);
  };
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  const { status: syncStatus, userProfile, lastSyncedAt, folderStructure, triggerSync } = useGoogleDriveSync();

  // Additional local state matching the design
  const [draggedToolbarIndex, setDraggedToolbarIndex] = useState<number | null>(null);
  const [dragOverToolbarIndex, setDragOverToolbarIndex] = useState<number | null>(null);
  const [aiModel, setAiModel] = useState<string>("gemini-2.5-flash");

  const pack = settings?.iconPack || "lucide";

  const categories = [
    { id: "general" as SettingsCategory, iconKey: "general", label: t("settings.catGeneralTitle"), desc: t("settings.catGeneralDesc") },
    { id: "appearance" as SettingsCategory, iconKey: "appearance", label: t("settings.catAppearanceTitle"), desc: t("settings.catAppearanceDesc") },
    { id: "editor" as SettingsCategory, iconKey: "editorCat", label: t("settings.catEditorTitle"), desc: t("settings.catEditorDesc") },
    { id: "files" as SettingsCategory, iconKey: "folder", label: t("settings.catFilesTitle"), desc: t("settings.catFilesDesc") },
    { id: "markdown" as SettingsCategory, iconKey: "fileCode", label: t("settings.catMarkdownTitle"), desc: t("settings.catMarkdownDesc") },
    { id: "templates" as SettingsCategory, iconKey: "templates", label: t("settings.catTemplatesTitle"), desc: t("settings.catTemplatesDesc") },
    { id: "ai" as SettingsCategory, iconKey: "ai", label: t("settings.catAiTitle"), desc: t("settings.catAiDesc") },
    { id: "shortcuts" as SettingsCategory, iconKey: "shortcuts", label: t("settings.catShortcutsTitle"), desc: t("settings.catShortcutsDesc") },
    { id: "storage" as SettingsCategory, iconKey: "storage", label: t("settings.catStorageTitle"), desc: t("settings.catStorageDesc") },
    { id: "backup" as SettingsCategory, iconKey: "backup", label: t("settings.catBackupTitle"), desc: t("settings.catBackupDesc") },
    { id: "privacy" as SettingsCategory, iconKey: "privacy", label: t("settings.catPrivacyTitle"), desc: t("settings.catPrivacyDesc") },
    { id: "about" as SettingsCategory, iconKey: "about", label: t("settings.catAboutTitle"), desc: t("settings.catAboutDesc") },
  ];

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  const handleSave = () => {
    setSavedSuccess(true);
    toast({
      title: t("settings.saveSuccess"),
      description: t("settings.saveSuccessDesc"),
    });
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: t("settings.resetSuccessTitle"),
      description: t("settings.resetSuccessDesc"),
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden select-none">
        {/* Main 2-Column Content View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Category Column (Matching Screenshot) */}
          <div className="w-60 border-r border-border/50 bg-card/30 flex flex-col shrink-0 select-none">
            <div className="px-5 py-4 border-b border-border/40 font-bold text-lg text-foreground flex items-center justify-between">
              <span>{t("settings.title") || "Settings"}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 no-scrollbar">
              {categories.map((cat) => {
                const Icon = getToolbarIcon(cat.iconKey, pack);
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70"}`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Panel View */}
          <div className="flex-1 flex flex-col bg-background/50 overflow-hidden">
            {/* Category Header */}
            <div className="px-8 py-5 border-b border-border/40 bg-card/20 shrink-0">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{currentCategory.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.desc}</p>
              </div>
            </div>

            {/* Scrollable Category Options Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar w-full">
              {/* 1. GENERAL */}
              {activeCategory === "general" && (
                <div className="space-y-6">
                  {/* Startup Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.startupGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.onStartup")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.onStartupDesc")}</p>
                      </div>
                      <Select value={settings.onStartup || "home"} onValueChange={(v) => updateSetting("onStartup", v)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">{t("settings.optOpenHome")}</SelectItem>
                          <SelectItem value="lastNote">{t("settings.optOpenLastNote")}</SelectItem>
                          <SelectItem value="blank">{t("settings.optBlankPage")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.reopenTabs")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.reopenTabsDesc")}</p>
                      </div>
                      <Switch
                        checked={settings.reopenTabs}
                        onCheckedChange={(val) => updateSetting("reopenTabs", val)}
                        className="scale-85 origin-right"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.checkUpdates")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.checkUpdatesDesc")}</p>
                      </div>
                      <Switch checked={settings.checkUpdates !== false} onCheckedChange={(val) => updateSetting("checkUpdates", val)} className="scale-85 origin-right" />
                    </div>
                  </div>

                  {/* Language Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.languageGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.appLanguage")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.appLanguageDesc")}</p>
                      </div>
                      <Select value={settings.language || "en"} onValueChange={(v) => updateSetting("language", v)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="th">ภาษาไทย</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date & Time Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.dateTimeGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.dateFormat")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.dateFormatDesc")}</p>
                      </div>
                      <Select value={settings.dateFormat || "YYYY-MM-DD"} onValueChange={(v) => updateSetting("dateFormat", v)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">{formatDate(new Date(), "YYYY-MM-DD")} (YYYY-MM-DD)</SelectItem>
                          <SelectItem value="DD/MM/YYYY">{formatDate(new Date(), "DD/MM/YYYY")} (DD/MM/YYYY)</SelectItem>
                          <SelectItem value="MM/DD/YYYY">{formatDate(new Date(), "MM/DD/YYYY")} (MM/DD/YYYY)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.timeFormat")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.timeFormatDesc")}</p>
                      </div>
                      <Select value={settings.timeFormat || "24h"} onValueChange={(v) => updateSetting("timeFormat", v)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">
                            {settings.language === "th" ? "24 ชั่วโมง" : "24-hour"} ({formatTime(new Date(), "24h", settings.language)})
                          </SelectItem>
                          <SelectItem value="12h">
                            {settings.language === "th" ? "12 ชั่วโมง" : "12-hour"} ({formatTime(new Date(), "12h", settings.language)})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.startWeekOn")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.startWeekOnDesc")}</p>
                      </div>
                      <Select value={settings.startWeekOn || "monday"} onValueChange={(v) => updateSetting("startWeekOn", v)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">{t("settings.optMonday")}</SelectItem>
                          <SelectItem value="sunday">{t("settings.optSunday")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Other Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.otherGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.enableAnimations")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.enableAnimationsDesc")}</p>
                      </div>
                      <Switch checked={settings.enableAnimations !== false} onCheckedChange={(val) => updateSetting("enableAnimations", val)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.sendUsageData")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.sendUsageDataDesc")}</p>
                      </div>
                      <Switch checked={settings.sendUsageData === true} onCheckedChange={(val) => updateSetting("sendUsageData", val)} className="scale-85 origin-right" />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. APPEARANCE */}
              {activeCategory === "appearance" && (
                <div className="space-y-6">
                  {/* Theme & Colors */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.colorSchemeGroup")}</h3>

                    {/* Color Scheme Mode */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-2 block">{t("settings.schemeLabel")}</label>
                      <div className="flex gap-2">
                        {(["light", "dark", "system"] as const).map((scheme) => {
                          const Icon = getToolbarIcon(scheme === "light" ? "sun" : scheme === "dark" ? "moon" : "monitor", pack);
                          const label = scheme === "light" ? t("settings.colorSchemeLight") : scheme === "dark" ? t("settings.colorSchemeDark") : t("settings.colorSchemeSystem");
                          return (
                            <button
                              key={scheme}
                              type="button"
                              onClick={() => updateSetting("colorScheme", scheme)}
                              className={`flex flex-1 h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs transition-all cursor-pointer ${
                                settings.colorScheme === scheme
                                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visual Appearance Themes / Mood & Tone */}
                    <div className="pt-3 border-t border-border/30">
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <label className="text-xs font-semibold text-foreground block">{t("settings.visualAppearanceGroup")}</label>
                          <p className="text-xs text-muted-foreground mt-0.5">{t("settings.visualAppearanceDesc")}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                        {APPEARANCE_STYLE_OPTIONS.map((style) => {
                          const isSelected = (settings.appearanceStyle || "default") === style.id;
                          const isDark = style.recommendedColorScheme === "dark" || (style.id === "default" && settings.colorScheme === "dark");
                          const bgPreview = isDark ? style.darkBg : style.lightBg;
                          const sbPreview = isDark ? style.darkSidebar : style.lightSidebar;
                          const accentColor = APP_THEMES.find((th) => th.id === style.recommendedTheme)?.color || style.accentPreview;

                          const getInnerRadiusClass = () => {
                            switch (style.id) {
                              case "catppuccin":
                                return "rounded-full"; // 9999px bubbly pill
                              case "neumorphism":
                                return "rounded-lg"; // 8px soft curve
                              case "glass":
                                return "rounded-md"; // 8px floating glass
                              case "nord":
                                return "rounded-sm"; // 4px smooth Nordic
                              case "default":
                                return "rounded-sm"; // 3px standard clean
                              case "paper":
                                return "rounded-xs"; // 2px crisp notebook
                              case "midnight":
                              case "cyberpunk":
                                return "rounded-none"; // 0px razor-sharp rectangular
                              default:
                                return "rounded-sm";
                            }
                          };

                          const innerRadiusClass = getInnerRadiusClass();

                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => applyAppearanceStyle(style.id)}
                              className={`group relative flex flex-col rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-2xs"
                                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.02]"
                              }`}
                            >
                              {/* Mini UI Mockup Preview - Uniform crisp border with signature inner roundness */}
                              <div
                                className="w-full h-14 overflow-hidden flex mb-2 relative rounded-lg border border-border/40"
                                style={{ background: bgPreview }}
                              >
                                {/* Mini Sidebar */}
                                <div
                                  className="w-1/3 h-full border-r border-border/20 p-1.5 flex flex-col gap-1"
                                  style={{
                                    background: sbPreview,
                                    ...(style.id === "glass" ? { backdropFilter: "blur(12px)", backgroundColor: isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)" } : {}),
                                    ...(style.id === "cyberpunk" ? { borderRight: `1px solid ${accentColor}` } : {}),
                                  }}
                                >
                                  <div className={`h-1.5 w-full ${innerRadiusClass} ${isDark ? "bg-white/35" : "bg-black/25"}`} />
                                  <div className={`h-1 w-3/4 ${innerRadiusClass} ${isDark ? "bg-white/20" : "bg-black/15"}`} />
                                  <div className={`h-1 w-1/2 ${innerRadiusClass} ${isDark ? "bg-white/15" : "bg-black/10"}`} />
                                </div>
                                {/* Mini Content - Prominently displaying unique corner radius & card properties */}
                                <div className="flex-1 p-1.5 flex flex-col gap-1 justify-center">
                                  {style.id === "glass" ? (
                                    <div
                                      className="p-1 rounded-md flex flex-col gap-1"
                                      style={{
                                        background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.7)",
                                        border: "1px solid rgba(255,255,255,0.25)",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                                      }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-md" style={{ backgroundColor: accentColor }} />
                                      <div className={`h-1 w-full rounded-md ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                                    </div>
                                  ) : style.id === "cyberpunk" ? (
                                    <div
                                      className="p-1 rounded-none flex flex-col gap-1"
                                      style={{
                                        border: `1px solid ${accentColor}`,
                                        boxShadow: `inset 0 0 3px ${accentColor}`,
                                        background: "rgba(11, 5, 20, 0.8)",
                                      }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-none" style={{ backgroundColor: accentColor, boxShadow: `0 0 3px ${accentColor}` }} />
                                      <div className="h-1 w-full rounded-none bg-white/30" />
                                    </div>
                                  ) : style.id === "catppuccin" ? (
                                    <div
                                      className="p-1 rounded-xl flex flex-col gap-1 border border-white/10"
                                      style={{ background: isDark ? "#181825" : "#e6e9ef" }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accentColor }} />
                                      <div className={`h-1 w-full rounded-full ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                                    </div>
                                  ) : style.id === "neumorphism" ? (
                                    <div
                                      className="p-1 rounded-lg flex flex-col gap-1"
                                      style={{
                                        background: isDark ? "#242831" : "#e5e9ef",
                                        boxShadow: isDark
                                          ? "2px 2px 5px rgba(0,0,0,0.5), -2px -2px 5px rgba(255,255,255,0.05)"
                                          : "2px 2px 5px rgba(163,170,181,0.5), -2px -2px 5px rgba(255,255,255,0.9)",
                                      }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accentColor }} />
                                      <div className={`h-1 w-full rounded-full ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                                    </div>
                                  ) : style.id === "midnight" ? (
                                    <div
                                      className="p-1 rounded-none flex flex-col gap-1 border border-zinc-800"
                                      style={{ background: "#050505" }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-none" style={{ backgroundColor: accentColor }} />
                                      <div className="h-1 w-full rounded-none bg-white/30" />
                                    </div>
                                  ) : style.id === "paper" ? (
                                    <div
                                      className="p-1 rounded-xs flex flex-col gap-1 border border-amber-900/15"
                                      style={{ background: isDark ? "#161311" : "#f4ede0" }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-xs" style={{ backgroundColor: accentColor }} />
                                      <div className={`h-1 w-full rounded-xs ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                                    </div>
                                  ) : style.id === "nord" ? (
                                    <div
                                      className="p-1 rounded-sm flex flex-col gap-1 border border-slate-700/40"
                                      style={{ background: isDark ? "#1e222a" : "#e5e9f0" }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-sm" style={{ backgroundColor: accentColor }} />
                                      <div className={`h-1 w-full rounded-sm ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                                    </div>
                                  ) : (
                                    <div
                                      className="p-1 rounded-sm flex flex-col gap-1 border border-border/40"
                                      style={{ background: isDark ? "#090d16" : "#f8fafc" }}
                                    >
                                      <div className="h-1.5 w-2/3 rounded-sm" style={{ backgroundColor: accentColor }} />
                                      <div className={`h-1 w-full rounded-sm ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-semibold line-clamp-1 ${isSelected ? "text-primary" : "text-foreground"}`}>
                                {t(style.nameKey as any) || style.id}
                              </span>
                              <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                {t(style.descKey as any)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/30">
                      <label className="text-xs font-semibold text-foreground mb-2 block">{t("settings.accentTheme")}</label>
                      <div className="flex flex-wrap gap-3">
                        {APP_THEMES.map((th) => (
                          <Tooltip key={th.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                style={{ backgroundColor: th.color }}
                                onClick={() => updateSetting("theme", th.id)}
                                className={`h-8 w-8 rounded-full transition-all cursor-pointer ${
                                  settings.theme === th.id
                                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-xs"
                                    : "opacity-75 hover:opacity-100"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>{t(`settings.theme${th.id.charAt(0).toUpperCase() + th.id.slice(1)}` as any) || th.label}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.tagColorStyle")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.tagStyleDesc")}</p>
                      </div>
                      <Select value={settings.tagColorStyle} onValueChange={(v) => updateSetting("tagColorStyle", v as any)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multicolor">{t("settings.tagColorStyleMulticolor")}</SelectItem>
                          <SelectItem value="accent">{t("settings.tagColorStyleAccent")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.accentHeadings")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.accentHeadingsDesc")}</p>
                      </div>
                      <Switch checked={settings.accentHeadings} onCheckedChange={(v) => updateSetting("accentHeadings", v)} className="scale-85 origin-right" />
                    </div>
                  </div>

                  {/* Icon Pack Selection Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.iconPackGroup") || "Icon Pack"}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("settings.iconPackDesc") || "Choose icon theme and styling for app controls, sidebar, and toolbar"}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {ICON_PACK_OPTIONS.map((pack) => {
                        const isSelected = (settings.iconPack || "lucide") === pack.id;
                        const FolderIcon = getToolbarIcon("folder", pack.id);
                        const FileIcon = getToolbarIcon("fileText", pack.id);
                        const BoldIcon = getToolbarIcon("bold", pack.id);
                        const SparkleIcon = getToolbarIcon("aiAssistant", pack.id);
                        const SettingsIcon = getToolbarIcon("settings", pack.id);

                        return (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => updateSetting("iconPack", pack.id)}
                            className={`flex flex-col p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-2xs"
                                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.02]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-semibold ${isSelected ? "text-primary font-bold" : "text-foreground"}`}>
                                {t(pack.nameKey as any) || pack.id}
                              </span>
                            </div>

                            {/* Mini Icons Strip Preview */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/40 mb-2">
                              <FolderIcon className="w-4 h-4 text-amber-500" />
                              <FileIcon className="w-4 h-4 text-primary" />
                              <BoldIcon className="w-4 h-4 text-foreground/80" />
                              <SparkleIcon className="w-4 h-4 text-purple-400" />
                              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                            </div>

                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-auto">
                              {t(pack.descKey as any)}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 mt-2 pt-1.5 border-t border-border/20">
                              <span>{pack.author}</span>
                              <span className="font-mono">{pack.count}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                    {/* Typography */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.typographyGroup")}</h3>

                    {/* Interface Font */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.interfaceFontFamily") || "Interface Font"}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.interfaceFontFamilyDesc") || "Set typography for sidebar, buttons, and navigation"}</p>
                      </div>
                      <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v as any)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.css }}>
                              <span style={{ fontFamily: font.css }}>{t(font.nameKey)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Editor Font */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.editorFontFamily") || "Editor Font"}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.editorFontFamilyDesc") || "Set typography for writing and reading notes"}</p>
                      </div>
                      <Select value={settings.editorFontFamily || settings.fontFamily} onValueChange={(v) => updateSetting("editorFontFamily", v as any)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.css }}>
                              <span style={{ fontFamily: font.css }}>{t(font.nameKey)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.editorFontSize")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.fontSizeDesc")} ({settings.editorFontSize}px)</p>
                      </div>
                      <Select value={String(settings.editorFontSize)} onValueChange={(v) => updateSetting("editorFontSize", Number(v))}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {FONT_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.layoutGroup")}</h3>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.interfaceScale")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.interfaceScaleDesc")}</p>
                      </div>
                      <Select value={String(settings.interfaceScale || 100)} onValueChange={(v) => updateSetting("interfaceScale", Number(v))}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                          <SelectItem value="100">100% (Default)</SelectItem>
                          <SelectItem value="110">110%</SelectItem>
                          <SelectItem value="125">125%</SelectItem>
                          <SelectItem value="150">150%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.editorWidth")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.editorWidthDesc")}</p>
                      </div>
                      <Select value={settings.editorWidth} onValueChange={(v) => updateSetting("editorWidth", v as any)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">{t("settings.optCompact640")}</SelectItem>
                          <SelectItem value="standard">{t("settings.optStandard800")}</SelectItem>
                          <SelectItem value="full">{t("settings.optFullWidth")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.lineHeight")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.lineHeightDesc")}</p>
                      </div>
                      <Select value={settings.lineHeight} onValueChange={(v) => updateSetting("lineHeight", v as any)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.4">{t("settings.optLineCompact")}</SelectItem>
                          <SelectItem value="1.6">{t("settings.optLineStandard")}</SelectItem>
                          <SelectItem value="1.8">{t("settings.optLineSpacious")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.sidebarDensity")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.sidebarDensityDesc")}</p>
                      </div>
                      <Select value={settings.sidebarDensity} onValueChange={(v) => updateSetting("sidebarDensity", v as any)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comfortable">{t("settings.densityComfortable")}</SelectItem>
                          <SelectItem value="compact">{t("settings.densityCompact")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. EDITOR */}
              {activeCategory === "editor" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.writingBehaviorGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.autoSave")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.autoSaveDesc")}</p>
                      </div>
                      <Switch checked={settings.autoSave} onCheckedChange={(v) => updateSetting("autoSave", v)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.confirmBeforeDelete")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.confirmBeforeDeleteDesc")}</p>
                      </div>
                      <Switch checked={settings.confirmBeforeDelete} onCheckedChange={(v) => updateSetting("confirmBeforeDelete", v)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.showWordCount")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.showWordCountDesc")}</p>
                      </div>
                      <Switch checked={settings.showWordCount} onCheckedChange={(v) => updateSetting("showWordCount", v)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.spellCheckSetting") || "Spell Check"}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.spellCheckSettingDesc") || "Check and underline misspelled words in Thai and English"}</p>
                      </div>
                      <Switch checked={settings.spellCheck !== false} onCheckedChange={(v) => updateSetting("spellCheck", v)} className="scale-85 origin-right" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.formattingHelpersGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.autoPairBrackets")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.autoPairBracketsHint")}</p>
                      </div>
                      <Switch checked={settings.autoPairBrackets} onCheckedChange={(v) => updateSetting("autoPairBrackets", v)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.showCodeLineNumbers")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.showCodeLineNumbersHint")}</p>
                      </div>
                      <Switch checked={settings.showCodeLineNumbers} onCheckedChange={(v) => updateSetting("showCodeLineNumbers", v)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.showGuideLines")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.showGuideLinesHint")}</p>
                      </div>
                      <Switch checked={settings.showGuideLines} onCheckedChange={(v) => updateSetting("showGuideLines", v)} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.highlightInlineCode")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.highlightInlineCodeDesc")}</p>
                      </div>
                      <Switch checked={settings.highlightInlineCode} onCheckedChange={(v) => updateSetting("highlightInlineCode", v)} className="scale-85 origin-right" />
                    </div>
                  </div>

                  {/* Custom Toolbar */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.customToolbar")}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.customToolbarDesc")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateSetting("toolbarItemsOrder", DEFAULT_TOOLBAR_ORDER);
                          updateSetting("hiddenToolbarItems", DEFAULT_HIDDEN_TOOLBAR_ITEMS);
                          updateSetting("toolbarConfiguredV3" as any, true);
                          toast({
                            title: t("settings.resetToolbarDefaults"),
                            description: "Toolbar layout and order restored to defaults",
                          });
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer border border-border/40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{t("settings.resetToolbarDefaults")}</span>
                      </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground">
                        <span className="font-medium">{t("settings.toolbarPresets")}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TOOLBAR_PRESETS.map((preset) => {
                        const currHidden = settings.hiddenToolbarItems || DEFAULT_HIDDEN_TOOLBAR_ITEMS;
                        const isMatch =
                          preset.hidden.length === currHidden.length &&
                          preset.hidden.every((id) => currHidden.includes(id));

                        const PRESET_ICONS: Record<string, any> = {
                          standard: Layers,
                          minimal: Feather,
                          tasks: ListTodoIcon,
                          academic: BookOpen,
                          technical: SquareCode,
                          all: LayoutGrid,
                        };
                        const PresetIcon = PRESET_ICONS[preset.id] || Layers;

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              updateSetting("toolbarItemsOrder", preset.order);
                              updateSetting("hiddenToolbarItems", preset.hidden);
                              updateSetting("toolbarConfiguredV3" as any, true);
                              toast({
                                title: t("settings.presetApplied"),
                                description: t(preset.nameKey),
                              });
                            }}
                            className={`flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer select-none border ${
                              isMatch
                                ? "bg-primary/10 border-primary/70 text-primary shadow-xs ring-1 ring-primary/20 font-semibold"
                                : "bg-muted/30 border-border/40 text-foreground/85 hover:text-foreground hover:bg-muted/60 hover:border-border hover:shadow-2xs"
                            }`}
                          >
                            <PresetIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate flex-1 text-left">{t(preset.nameKey)}</span>
                          </button>
                        );
                      })}
                      </div>
                    </div>

                    {/* Toolbar Reorder List */}
                    {(() => {
                      const toolbarOrder = settings.toolbarItemsOrder || DEFAULT_TOOLBAR_ORDER;
                      const hiddenSet = new Set(settings.hiddenToolbarItems || []);
                      const activeCount = toolbarOrder.length - hiddenSet.size;

                      const moveItem = (index: number, dir: "up" | "down") => {
                        const targetIdx = dir === "up" ? index - 1 : index + 1;
                        if (targetIdx < 0 || targetIdx >= toolbarOrder.length) return;
                        const newArr = [...toolbarOrder];
                        const [item] = newArr.splice(index, 1);
                        newArr.splice(targetIdx, 0, item);
                        updateSetting("toolbarItemsOrder", newArr);
                        updateSetting("toolbarConfiguredV3" as any, true);
                      };

                      const toggleHidden = (id: string) => {
                        const currHidden = settings.hiddenToolbarItems || [];
                        const nextHidden = currHidden.includes(id)
                          ? currHidden.filter((i) => i !== id)
                          : [...currHidden, id];
                        updateSetting("hiddenToolbarItems", nextHidden);
                        updateSetting("toolbarConfiguredV3" as any, true);
                      };

                      const renderedItems = toolbarOrder.map((id, index) => {
                        const def = TOOLBAR_TOOL_DEFS[id];
                        if (!def) return null;
                        const IconComp = getToolbarIcon(id, pack);
                        const isHidden = hiddenSet.has(id);
                        const isDragging = draggedToolbarIndex === index;
                        const isDragOver = dragOverToolbarIndex === index && draggedToolbarIndex !== index;

                        return (
                            <div
                              key={id}
                              draggable
                              onDragStart={(e) => {
                                setDraggedToolbarIndex(index);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", id);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                if (draggedToolbarIndex !== null && draggedToolbarIndex !== index) {
                                  const newArr = [...toolbarOrder];
                                  const [item] = newArr.splice(draggedToolbarIndex, 1);
                                  newArr.splice(index, 0, item);
                                  updateSetting("toolbarItemsOrder", newArr);
                                  setDraggedToolbarIndex(index);
                                }
                                if (dragOverToolbarIndex !== index) {
                                  setDragOverToolbarIndex(index);
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverToolbarIndex === index) {
                                  setDragOverToolbarIndex(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDraggedToolbarIndex(null);
                                setDragOverToolbarIndex(null);
                              }}
                              onDragEnd={() => {
                                setDraggedToolbarIndex(null);
                                setDragOverToolbarIndex(null);
                              }}
                              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none ${
                                isDragging
                                  ? "opacity-40 scale-[0.98] border-primary/50 bg-primary/5 shadow-inner"
                                  : isDragOver
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : isHidden
                                  ? "bg-muted/30 border-border/20 opacity-60 text-muted-foreground hover:border-border/60"
                                  : "bg-background border-border/40 text-foreground hover:border-border shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                <div className="h-7 w-7 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                                  <IconComp className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium truncate">{t(def.labelKey)}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 hidden sm:inline">
                                  {t(def.categoryKey)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveItem(index, "up");
                                      }}
                                      aria-label={t("settings.moveUp")}
                                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                    >
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={4}>
                                    {t("settings.moveUp")}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      disabled={index === toolbarOrder.length - 1}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveItem(index, "down");
                                      }}
                                      aria-label={t("settings.moveDown")}
                                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={4}>
                                    {t("settings.moveDown")}
                                  </TooltipContent>
                                </Tooltip>

                                {def.locked ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        aria-label={t("settings.toolLocked")}
                                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/40 cursor-not-allowed"
                                      >
                                        <Lock className="h-3.5 w-3.5" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={4}>
                                      {t("settings.toolLocked")}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleHidden(id);
                                        }}
                                        aria-label={isHidden ? t("settings.showTool") : t("settings.hideTool")}
                                        className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                          isHidden
                                            ? "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                                            : "text-primary hover:bg-primary/10"
                                        }`}
                                      >
                                        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={4}>
                                      {isHidden ? t("settings.showTool") : t("settings.hideTool")}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          );
                        });

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground">
                              <span className="font-medium">{t("settings.dragToReorder")}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium">
                                {activeCount} / {toolbarOrder.length}
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1 border border-border/30 rounded-xl p-2 bg-muted/20">
                              {renderedItems}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              )}
              {activeCategory === "files" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.fileCreationGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.defaultExtension")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.defaultExtensionDesc")}</p>
                      </div>
                      <Select value={settings.defaultExtension} onValueChange={(v) => updateSetting("defaultExtension", v as any)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="md">{t("settings.extMd")}</SelectItem>
                          <SelectItem value="txt">{t("settings.optTxtPlain")}</SelectItem>
                          <SelectItem value="html">{t("settings.extHtml")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.newFilePattern")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.newFilePatternDesc")}</p>
                      </div>
                      <Select value={settings.newFilePattern} onValueChange={(v) => updateSetting("newFilePattern", v as any)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="untitled">{t("settings.optUntitledPattern")}</SelectItem>
                          <SelectItem value="date">
                            {settings.language === "th"
                              ? `ตามวันที่ (Note_${getDatePatternLabel(settings.dateFormat)})`
                              : `Date (Note_${getDatePatternLabel(settings.dateFormat)})`}
                          </SelectItem>
                          <SelectItem value="daily">
                            {settings.language === "th"
                              ? `บันทึกประจำวัน (Daily-${getDatePatternLabel(settings.dateFormat)})`
                              : `Daily (Daily-${getDatePatternLabel(settings.dateFormat)})`}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.autoFolderIcons")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.autoFolderIconsDesc")}</p>
                      </div>
                      <Switch
                        checked={settings.autoFolderIcons !== false}
                        onCheckedChange={(checked) => updateSetting("autoFolderIcons", checked)}
                        className="scale-85 origin-right"
                      />
                    </div>
                  </div>

                  {/* Trash & Deletion Settings */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("trash.title")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("trash.trashRetention")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("trash.trashRetentionDesc")}</p>
                      </div>
                      <Select
                        value={String(settings.trashRetentionDays ?? 30)}
                        onValueChange={(v) => updateSetting("trashRetentionDays", Number(v))}
                      >
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">{t("trash.retention7Days")}</SelectItem>
                          <SelectItem value="14">{t("trash.retention14Days")}</SelectItem>
                          <SelectItem value="30">{t("trash.retention30Days")}</SelectItem>
                          <SelectItem value="60">{t("trash.retention60Days")}</SelectItem>
                          <SelectItem value="90">{t("trash.retention90Days")}</SelectItem>
                          <SelectItem value="0">{t("trash.retentionNever")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.confirmBeforeDelete")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.confirmBeforeDeleteDesc")}</p>
                      </div>
                      <Switch
                        checked={settings.confirmBeforeDelete}
                        onCheckedChange={(v) => updateSetting("confirmBeforeDelete", v)}
                        className="scale-85 origin-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. MARKDOWN */}
              {activeCategory === "markdown" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.syntaxGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">GitHub Flavored Markdown (GFM)</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.gfmDesc")}</p>
                      </div>
                      <Switch checked={true} disabled className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.smartTypo")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.smartTypoDesc")}</p>
                      </div>
                      <Switch checked={true} className="scale-85 origin-right" />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. TEMPLATES */}
              {activeCategory === "templates" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.templatesGroup")}</h3>

                    {/* Markdown (.md) */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.templateMdTitle")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.templateMdDesc")}</p>
                      </div>
                      <Select
                        value={settings.defaultTemplateMd || settings.defaultNoteTemplate || "blank"}
                        onValueChange={(val) => {
                          updateSetting("defaultTemplateMd", val as any);
                          updateSetting("defaultNoteTemplate", val as any);
                        }}
                      >
                        <SelectTrigger className="w-52 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optBlankDocument")}</SelectItem>
                          <SelectItem value="daily">{t("settings.optDailyNote")}</SelectItem>
                          <SelectItem value="todo">{t("settings.optTodoList")}</SelectItem>
                          <SelectItem value="meeting">{t("settings.optMeetingNotes")}</SelectItem>
                          <SelectItem value="project">{t("settings.optProjectPlan")}</SelectItem>
                          <SelectItem value="study">{t("settings.optIdeaBrainstorm")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Plain Text (.txt) */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.templateTxtTitle")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.templateTxtDesc")}</p>
                      </div>
                      <Select
                        value={settings.defaultTemplateTxt || "blank"}
                        onValueChange={(val) => updateSetting("defaultTemplateTxt", val as any)}
                      >
                        <SelectTrigger className="w-52 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optTxtBlank") || "Blank Text"}</SelectItem>
                          <SelectItem value="notes">{t("settings.optTxtNotes") || "Notes"}</SelectItem>
                          <SelectItem value="todo">{t("settings.optTxtTodoList") || "To-Do List"}</SelectItem>
                          <SelectItem value="meeting">{t("settings.optTxtMeetingNotes") || "Meeting Notes"}</SelectItem>
                          <SelectItem value="journal">{t("settings.optTxtJournal") || "Journal"}</SelectItem>
                          <SelectItem value="readme">{t("settings.optTxtReadme") || "README"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* HTML (.html) */}
                    <div className="flex items-center justify-between gap-4 py-2">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.templateHtmlTitle")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.templateHtmlDesc")}</p>
                      </div>
                      <Select
                        value={settings.defaultTemplateHtml || "blank"}
                        onValueChange={(val) => updateSetting("defaultTemplateHtml", val as any)}
                      >
                        <SelectTrigger className="w-52 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optHtmlBlank") || "Blank HTML"}</SelectItem>
                          <SelectItem value="basic-website">{t("settings.optHtmlBasic") || "Basic Website"}</SelectItem>
                          <SelectItem value="landing-page">{t("settings.optHtmlLanding") || "Landing Page"}</SelectItem>
                          <SelectItem value="portfolio">{t("settings.optHtmlPortfolio") || "Portfolio"}</SelectItem>
                          <SelectItem value="blog">{t("settings.optHtmlBlog") || "Blog"}</SelectItem>
                          <SelectItem value="dashboard">{t("settings.optHtmlDashboard") || "Dashboard"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. AI ASSISTANT */}
              {activeCategory === "ai" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-primary" />
                        <span>Gemini API Key</span>
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (onOpenWebTab) {
                            e.preventDefault();
                            onOpenWebTab("https://aistudio.google.com/app/apikey");
                          }
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        {t("settings.getKeyFree")} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <p className="text-xs text-muted-foreground">{t("settings.getKeyDesc")}</p>

                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder="AIzaSy..."
                        value={settings.geminiApiKey}
                        onChange={(e) => updateSetting("geminiApiKey", e.target.value)}
                        className="w-full rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-0 shadow-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.aiModelGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.aiModelLabel")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.aiModelDesc")}</p>
                      </div>
                      <Select value={aiModel} onValueChange={setAiModel}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash">{t("settings.optFlashFast")}</SelectItem>
                          <SelectItem value="gemini-2.5-pro">{t("settings.optProDeep")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. SHORTCUTS */}
              {activeCategory === "shortcuts" && (
                <div className="space-y-6">
                  {/* Group 1: General & Navigation */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupGeneral")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbNewNote")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + N</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOpenFolder")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + O</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSave")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + S</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbCloseTab")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + W</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbCycleTabs")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Tab / Ctrl + Shift + Tab</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleSidebar")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + \</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOpenSettings")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + ,</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSearch")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + K / Ctrl + F</kbd></div>
                    </div>
                  </div>

                  {/* Group 2: Text Formatting */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupFormatting")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBold")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + B</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbItalic")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + I</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbUnderline")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + U</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbStrike")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + X</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbHighlight")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + H</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbInlineCode")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + E / Ctrl + `</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbInsertLink")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + K</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbClearFormatting")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + N</kbd></div>
                    </div>
                  </div>

                  {/* Group 3: Lists & Blocks */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupListsAndBlocks")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBulletList")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + 8</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOrderedList")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + 7</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbTaskList")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + 9</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBlockquote")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + Q</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbCodeBlock")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Alt + C</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbIndent")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Tab / Shift + Tab</kbd></div>
                    </div>
                  </div>

                  {/* Group 4: Tools & Utilities */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbGroupTools")}</h3>
                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbFixLang")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + L</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbOpenAi")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + A</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleCalc")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + C</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleClock")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + T</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSlashCommands")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">/</kbd></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. STORAGE */}
              {activeCategory === "storage" && (
                <div className="space-y-6">
                  {/* Local Storage Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.storageGroup") || "Storage Provider"}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{t("settings.localStorageLabel") || "Local Storage"}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.localStorageDesc") || "Store notes locally in browser and local disk."}</p>
                      </div>
                      {(() => {
                        let isLocalOk = false;
                        try {
                          const testKey = "__luno_test_storage__";
                          localStorage.setItem(testKey, "1");
                          localStorage.removeItem(testKey);
                          isLocalOk = true;
                        } catch {
                          isLocalOk = false;
                        }
                        return isLocalOk ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("settings.connected") || "Connected"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {t("settings.unavailable") || "Unavailable"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Google Drive Cloud Storage Card */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.cloudSyncGroup") || "Cloud Sync"}</h3>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center shrink-0">
                          <GoogleDriveIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">Google Drive</div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("settings.gdriveDesc") || "Store your Luno files in your Google Drive."}
                          </p>
                        </div>
                      </div>

                      {isGoogleDriveConnected() ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t("settings.connected") || "Connected"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isConnectingDrive}
                          onClick={async () => {
                            try {
                              setIsConnectingDrive(true);
                              await requestGoogleDriveAuth();
                              updateSetting("storageMode", "gdrive");
                              triggerSync(notes, onNotesUpdated);
                              toast({
                                title: t("settings.gdriveConnectedTitle") || "Google Drive Connected",
                                description: t("settings.gdriveConnectedDesc") || "Luno is now synced with your Google Drive.",
                              });
                            } catch (err: any) {
                              toast({
                                title: t("settings.gdriveConnectFailed") || "Connection Failed",
                                description: err.message || "Failed to connect to Google Drive",
                                variant: "destructive",
                              });
                            } finally {
                              setIsConnectingDrive(false);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer transition-all disabled:opacity-50 shrink-0"
                        >
                          {isConnectingDrive ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plug className="h-4 w-4" />
                          )}
                          {t("settings.connect") || "Connect"}
                        </button>
                      )}
                    </div>

                    {isGoogleDriveConnected() && (
                      <div className="space-y-4 pt-2 border-t border-border/40 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                          <div>
                            <span className="text-muted-foreground font-medium block text-[11px] uppercase tracking-wider">{t("settings.account") || "Account"}</span>
                            <span className="font-semibold text-foreground truncate block mt-0.5">{userProfile?.email || "Connected"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block text-[11px] uppercase tracking-wider">{t("settings.location") || "Location"}</span>
                            <span className="font-semibold text-foreground block mt-0.5">Google Drive / Luno / Workspaces</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block text-[11px] uppercase tracking-wider">{t("settings.lastSynced") || "Last Synced"}</span>
                            <span className="font-semibold text-foreground block mt-0.5">
                              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : (t("settings.justNow") || "Just now")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block text-[11px] uppercase tracking-wider">{t("settings.syncState") || "Sync State"}</span>
                            <span className="font-semibold text-primary capitalize block mt-0.5">
                              {syncStatus === "idle"
                                ? t("settings.syncStatusIdle") || "Idle"
                                : syncStatus === "saving"
                                ? t("settings.syncStatusSaving") || "Saving..."
                                : syncStatus === "syncing"
                                ? t("settings.syncStatusSyncing") || "Syncing..."
                                : syncStatus === "synced"
                                ? t("settings.syncStatusSynced") || "Synced"
                                : syncStatus === "offline"
                                ? t("settings.syncStatusOffline") || "Offline"
                                : syncStatus === "error"
                                ? t("settings.syncStatusError") || "Error"
                                : syncStatus === "conflict"
                                ? t("settings.syncStatusConflict") || "Conflict"
                                : syncStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-1">
                          <div>
                            <label className="text-xs font-semibold text-foreground">{t("settings.cloudSyncActive") || "Enable Cloud Storage Mode"}</label>
                            <p className="text-xs text-muted-foreground mt-0.5">{t("settings.cloudSyncActiveDesc") || "Sync and save notes to Google Drive as primary storage."}</p>
                          </div>
                          <Switch
                            checked={settings.storageMode === "gdrive"}
                            onCheckedChange={(v) => {
                              const mode = v ? "gdrive" : "local";
                              updateSetting("storageMode", mode);
                              if (v) triggerSync(notes, onNotesUpdated);
                            }}
                            className="scale-85 origin-right cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/30">
                          <a
                            href={
                              folderStructure
                                ? `https://drive.google.com/drive/folders/${folderStructure.workspacesId || folderStructure.projectId || folderStructure.rootId}`
                                : "https://drive.google.com"
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("settings.openFolder") || "Open Folder"}
                          </a>
                          <button
                            type="button"
                            disabled={syncStatus === "syncing"}
                            onClick={() => {
                              triggerSync(notes, onNotesUpdated);
                              toast({
                                title: t("settings.syncState") || "Syncing",
                                description: t("settings.gdriveConnectedDesc") || "Syncing notes to Google Drive...",
                              });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                            {t("settings.syncNow") || "Sync Now"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisconnectModalOpen(true)}
                            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Unplug className="h-3.5 w-3.5" />
                            {t("settings.disconnect") || "Disconnect"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disconnect Google Drive Modal */}
              <Dialog open={disconnectModalOpen} onOpenChange={setDisconnectModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>{t("settings.disconnectModalTitle") || "Disconnect Google Drive"}</DialogTitle>
                    <DialogDescription className="pt-2 text-xs leading-relaxed">
                      {t("settings.disconnectModalDesc") || "Disconnecting Google Drive will stop cloud synchronization. Your files will remain in your Google Drive."}
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter className="gap-2 sm:gap-0 pt-3">
                    <button
                      type="button"
                      onClick={() => setDisconnectModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const isCloudActive = settings.storageMode === "gdrive" || openedFolderName === "Google Drive";
                        disconnectGoogleDrive();
                        updateSetting("storageMode", "local");
                        setDisconnectModalOpen(false);

                        if (isCloudActive) {
                          if (onCloseWorkspace) {
                            onCloseWorkspace();
                          }
                          toast({
                            title: t("settings.gdriveDisconnectedTitle") || "Google Drive Disconnected",
                            description: t("settings.gdriveDisconnectedWorkspaceDesc") || "Cloud workspace closed. Your files remain safe in Google Drive.",
                          });
                        } else {
                          toast({
                            title: t("settings.gdriveDisconnectedTitle") || "Google Drive Disconnected",
                            description: t("settings.gdriveDisconnectedDesc") || "Cloud sync is now disabled. Your files remain safe in Google Drive.",
                          });
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t("settings.disconnect") || "Disconnect"}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 10. BACKUP */}
              {activeCategory === "backup" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.backupGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{t("settings.exportNotes")}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.exportNotesDesc")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toast({ title: t("settings.backupStartedTitle"), description: t("settings.backupStartedDesc") })}
                        className="px-3.5 py-1.5 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" /> {t("settings.exportBackupBtn")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. PRIVACY */}
              {activeCategory === "privacy" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.privacyGroup")}</h3>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{t("settings.localProcessing")}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.localProcessingDesc")}</p>
                      </div>
                      <Switch checked={true} disabled className="scale-85 origin-right" />
                    </div>
                  </div>
                </div>
              )}

              {/* 12. ABOUT */}
              {activeCategory === "about" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Luno Note</h3>
                    <div className="text-xs text-muted-foreground">Version 2.4.0 (Build 2026.08)</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("settings.aboutAppDesc")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Bar (Matching Screenshot) */}
            <div className="px-8 py-4 border-t border-border/50 bg-card/80 backdrop-blur-xs flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-5 rounded-xl border border-border/60 hover:bg-foreground/5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground active:scale-95"
              >
                {(() => {
                  const ResetIcon = getToolbarIcon("rotateCcw", pack);
                  return <ResetIcon className="h-4 w-4" />;
                })()}
                <span>{t("settings.resetDefaults")}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                {savedSuccess ? (
                  (() => {
                    const CheckIcon = getToolbarIcon("check", pack);
                    return <CheckIcon className="h-4 w-4" />;
                  })()
                ) : null}
                <span>{savedSuccess ? t("settings.savedSuccess") : t("settings.saveChanges")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
