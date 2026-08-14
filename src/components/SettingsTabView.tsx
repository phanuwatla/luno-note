import { useState } from "react";
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
  Key
} from "lucide-react";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_THEMES, useAppSettings } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

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

interface SettingsTabViewProps {
  onClose?: () => void;
}

export default function SettingsTabView({ onClose }: SettingsTabViewProps) {
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Additional local state for general preferences matching the design
  const [onStartup, setOnStartup] = useState<string>("home");
  const [reopenTabs, setReopenTabs] = useState<boolean>(true);
  const [checkUpdates, setCheckUpdates] = useState<boolean>(true);
  const [dateFormat, setDateFormat] = useState<string>("YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState<string>("24h");
  const [startWeekOn, setStartWeekOn] = useState<string>("monday");
  const [enableAnimations, setEnableAnimations] = useState<boolean>(true);
  const [sendUsageData, setSendUsageData] = useState<boolean>(false);
  const [aiModel, setAiModel] = useState<string>("gemini-2.5-flash");

  const categories: CategoryMeta[] = [
    { id: "general", label: t("settings.catGeneralTitle"), icon: SlidersHorizontal, desc: t("settings.catGeneralDesc") },
    { id: "appearance", label: t("settings.catAppearanceTitle"), icon: Palette, desc: t("settings.catAppearanceDesc") },
    { id: "editor", label: t("settings.catEditorTitle"), icon: Pencil, desc: t("settings.catEditorDesc") },
    { id: "files", label: t("settings.catFilesTitle"), icon: Folder, desc: t("settings.catFilesDesc") },
    { id: "markdown", label: t("settings.catMarkdownTitle"), icon: FileCode, desc: t("settings.catMarkdownDesc") },
    { id: "templates", label: t("settings.catTemplatesTitle"), icon: LayoutTemplate, desc: t("settings.catTemplatesDesc") },
    { id: "ai", label: t("settings.catAiTitle"), icon: SparklesIcon, isPro: true, desc: t("settings.catAiDesc") },
    { id: "shortcuts", label: t("settings.catShortcutsTitle"), icon: Keyboard, desc: t("settings.catShortcutsDesc") },
    { id: "storage", label: t("settings.catStorageTitle"), icon: Database, desc: t("settings.catStorageDesc") },
    { id: "backup", label: t("settings.catBackupTitle"), icon: Cloud, desc: t("settings.catBackupDesc") },
    { id: "privacy", label: t("settings.catPrivacyTitle"), icon: Lock, desc: t("settings.catPrivacyDesc") },
    { id: "about", label: t("settings.catAboutTitle"), icon: Info, desc: t("settings.catAboutDesc") },
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
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
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

                    {cat.isPro && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                        Pro
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Panel View */}
          <div className="flex-1 flex flex-col bg-background/50 overflow-hidden">
            {/* Category Header */}
            <div className="px-8 py-5 border-b border-border/40 bg-card/20 shrink-0">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{currentCategory.label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.desc}</p>
            </div>

            {/* Scrollable Category Options Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar max-w-4xl">
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
                      <Select value={onStartup} onValueChange={setOnStartup}>
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
                      <Switch checked={reopenTabs} onCheckedChange={setReopenTabs} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.checkUpdates")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.checkUpdatesDesc")}</p>
                      </div>
                      <Switch checked={checkUpdates} onCheckedChange={setCheckUpdates} className="scale-85 origin-right" />
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
                      <Select value={settings.language} onValueChange={(v) => updateSetting("language", v === "th" ? "th" : "en")}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">{t("settings.english")}</SelectItem>
                          <SelectItem value="th">{t("settings.thai")}</SelectItem>
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
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger className="w-52 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">2026-08-01 (YYYY-MM-DD)</SelectItem>
                          <SelectItem value="DD/MM/YYYY">01/08/2026 (DD/MM/YYYY)</SelectItem>
                          <SelectItem value="MM/DD/YYYY">08/01/2026 (MM/DD/YYYY)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.timeFormat")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.timeFormatDesc")}</p>
                      </div>
                      <Select value={timeFormat} onValueChange={setTimeFormat}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">{t("settings.opt24h")}</SelectItem>
                          <SelectItem value="12h">{t("settings.opt12h")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.startWeekOn")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.startWeekOnDesc")}</p>
                      </div>
                      <Select value={startWeekOn} onValueChange={setStartWeekOn}>
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
                      <Switch checked={enableAnimations} onCheckedChange={setEnableAnimations} className="scale-85 origin-right" />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.sendUsageData")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.sendUsageDataDesc")}</p>
                      </div>
                      <Switch checked={sendUsageData} onCheckedChange={setSendUsageData} className="scale-85 origin-right" />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. APPEARANCE */}
              {/* 2. APPEARANCE */}
              {activeCategory === "appearance" && (
                <div className="space-y-6">
                  {/* Theme & Colors */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.colorSchemeGroup")}</h3>

                    <div>
                      <label className="text-xs font-semibold text-foreground mb-2 block">{t("settings.schemeLabel")}</label>
                      <div className="flex gap-2">
                        {(["light", "dark", "system"] as const).map((scheme) => {
                          const Icon = scheme === "light" ? Sun : scheme === "dark" ? Moon : Monitor;
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
                            <TooltipContent>{th.label}</TooltipContent>
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
                  </div>

                  {/* Typography */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.typographyGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.fontFamily")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.fontFamilyDesc")}</p>
                      </div>
                      <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v as any)}>
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inter">Inter</SelectItem>
                          <SelectItem value="system">{t("settings.fontSystem")}</SelectItem>
                          <SelectItem value="serif">{t("settings.fontSerif")}</SelectItem>
                          <SelectItem value="mono">{t("settings.fontMono")}</SelectItem>
                          <SelectItem value="prompt">{t("settings.fontPrompt")}</SelectItem>
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
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.layoutGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
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
                          <SelectItem value="date">{t("settings.optDatePattern")}</SelectItem>
                          <SelectItem value="daily">{t("settings.optDailyPattern")}</SelectItem>
                        </SelectContent>
                      </Select>
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

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.defaultTemplate")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.defaultTemplateDesc")}</p>
                      </div>
                      <Select defaultValue="blank">
                        <SelectTrigger className="w-48 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optBlankDocument")}</SelectItem>
                          <SelectItem value="meeting">{t("settings.optMeetingNotes")}</SelectItem>
                          <SelectItem value="daily">{t("settings.optDailyJournal")}</SelectItem>
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
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
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
                        className="w-full rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 shadow-2xs pr-10"
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
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("settings.kbShortcutsGroup")}</h3>

                    <div className="divide-y divide-border/30 text-xs">
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbNewNote")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + N</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSearch")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + K</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSave")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + S</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleCalc")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + C</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbToggleClock")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + T</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbBold")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + B</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbItalic")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + I</kbd></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. STORAGE */}
              {activeCategory === "storage" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.storageGroup")}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{t("settings.localStorageLabel")}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.localStorageDesc")}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">{t("settings.connected")}</span>
                    </div>
                  </div>
                </div>
              )}

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
                <RotateCcw className="h-4 w-4" />
                <span>{t("settings.resetDefaults")}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                {savedSuccess ? <Check className="h-4 w-4" /> : null}
                <span>{savedSuccess ? t("settings.savedSuccess") : t("settings.saveChanges")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
