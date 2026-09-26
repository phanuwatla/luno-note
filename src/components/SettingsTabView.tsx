import { useState, useEffect, useCallback, useRef } from "react";
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
  Upload,
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
  Video,
  Mic,
  Wrench,
  Underline as UnderlineIcon,
  Highlighter,
  Sparkles,
  Layers,
  Feather,
  BookOpen,
  LayoutGrid,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  QrCode,
  Heading,
  Baseline,
  Type,
  ALargeSmall,
  AlignLeft,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heading1Icon } from "@/components/icons/Heading1Icon";
import { Heading2Icon } from "@/components/icons/Heading2Icon";
import { Heading3Icon } from "@/components/icons/Heading3Icon";
import { Heading4Icon } from "@/components/icons/Heading4Icon";
import { Heading5Icon } from "@/components/icons/Heading5Icon";
import { Heading6Icon } from "@/components/icons/Heading6Icon";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { FootnoteIcon } from "@/components/icons/FootnoteIcon";
import { GoogleDriveIcon } from "@/components/icons/GoogleDriveIcon";
import { requestGoogleDriveAuth, disconnectGoogleDrive, isGoogleDriveConnected, saveStoredClientId, getStoredClientId, getStoredUserProfile, getValidAccessToken, fetchGoogleUserProfile } from "@/lib/googleDriveAuth";
import { ensureWorkspacesRootOnly } from "@/lib/googleDriveApi";
import { useGoogleDriveSync } from "@/hooks/useGoogleDriveSync";
import { syncEngine } from "@/lib/googleDriveSync";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_THEMES, APPEARANCE_STYLE_OPTIONS, DEFAULT_HIDDEN_TOOLBAR_ITEMS, DEFAULT_TOOLBAR_ORDER, TOOLBAR_PRESETS, FONT_OPTIONS, useAppSettings, useCustomFonts } from "@/hooks/useAppSettings";
import { saveCustomFont, renameCustomFont, deleteCustomFont, getFontDisplayFileSize, type CustomFont } from "@/lib/customFontStore";
import { ICON_PACK_OPTIONS, IconPackId, TOOLBAR_ICON_MAP, getToolbarIcon } from "@/lib/iconPacks";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatTime, getDatePatternLabel } from "@/lib/dateTimeFormatter";
import {
  APP_VERSION,
  APP_AUTHOR,
  APP_AUTHOR_URL,
  APP_ABOUT_CREDIT,
  openExternalUrl,
} from "@/lib/appVersion";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { exportWorkspaceBackupZip } from "@/lib/backupExporter";
import { fetchAvailableModels, clearExhaustedModels, type AvailableModelOption } from "@/lib/geminiApi";

const TOOLBAR_TOOL_DEFS: Record<
  string,
  { labelKey: string; icon: any; categoryKey: string; locked?: boolean }
> = {
  undo: { labelKey: "editor.undo", icon: Undo2, categoryKey: "settings.toolCategoryHistory", locked: true },
  redo: { labelKey: "editor.redo", icon: Redo2, categoryKey: "settings.toolCategoryHistory", locked: true },
  heading: { labelKey: "editor.headings", icon: Heading, categoryKey: "settings.toolCategoryHeading" },
  fontFamily: { labelKey: "editor.fontFamily", icon: Type, categoryKey: "settings.toolCategoryInline" },
  fontSize: { labelKey: "editor.fontSize", icon: ALargeSmall, categoryKey: "settings.toolCategoryInline" },
  bold: { labelKey: "editor.bold", icon: Bold, categoryKey: "settings.toolCategoryInline" },
  italic: { labelKey: "editor.italic", icon: Italic, categoryKey: "settings.toolCategoryInline" },
  underline: { labelKey: "editor.underline", icon: UnderlineIcon, categoryKey: "settings.toolCategoryInline" },
  strike: { labelKey: "editor.strikethrough", icon: Strikethrough, categoryKey: "settings.toolCategoryInline" },
  highlight: { labelKey: "editor.highlight", icon: Highlighter, categoryKey: "settings.toolCategoryInline" },
  textColor: { labelKey: "editor.textColor", icon: Baseline, categoryKey: "settings.toolCategoryInline" },
  align: { labelKey: "editor.textAlign", icon: AlignLeft, categoryKey: "settings.toolCategoryInline" },
  superscript: { labelKey: "editor.superscript", icon: SuperscriptIcon, categoryKey: "settings.toolCategoryInline" },
  subscript: { labelKey: "editor.subscript", icon: SubscriptIcon, categoryKey: "settings.toolCategoryInline" },
  list: { labelKey: "editor.list", icon: List, categoryKey: "settings.toolCategoryList" },
  toggle: { labelKey: "editor.toggle", icon: ChevronsDownUp, categoryKey: "settings.toolCategoryBlock" },
  code: { labelKey: "editor.code", icon: CodeXml, categoryKey: "settings.toolCategoryBlock" },
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
  video: { labelKey: "editor.video", icon: Video, categoryKey: "settings.toolCategoryMedia" },
  qrCode: { labelKey: "editor.qrCode", icon: QrCode, categoryKey: "settings.toolCategoryMedia" },
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

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  "general",
  "appearance",
  "editor",
  "files",
  "markdown",
  "templates",
  "ai",
  "shortcuts",
  "storage",
  "backup",
  "privacy",
  "about",
];

export function isValidSettingsCategory(cat: unknown): cat is SettingsCategory {
  return typeof cat === "string" && (SETTINGS_CATEGORIES as string[]).includes(cat);
}

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
  folderPaths?: string[];
  isCloudWorkspace?: boolean;
  onCloseWorkspace?: () => void;
  onOpenWebTab?: (url: string, initialTitle?: string) => void;
  onOpenWhatsNew?: () => void;
}

export default function SettingsTabView({
  onClose,
  initialCategory = "general",
  onCategoryChange,
  notes = [],
  onNotesUpdated,
  openedFolderName,
  folderPaths,
  isCloudWorkspace = false,
  onCloseWorkspace,
  onOpenWebTab,
  onOpenWhatsNew,
}: SettingsTabViewProps) {
  const { settings, updateSetting, applyAppearanceStyle, resetSettings } = useAppSettings();
  const { customFonts, refresh: refreshCustomFonts } = useCustomFonts();
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const [fontToRename, setFontToRename] = useState<CustomFont | null>(null);
  const [fontRenameValue, setFontRenameValue] = useState("");
  const [fontToDelete, setFontToDelete] = useState<CustomFont | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  const handleFontFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingFont(true);
    try {
      const saved = await saveCustomFont(file);
      await refreshCustomFonts();
      toast({
        title: t("settings.fontUploadedSuccess") || "Font uploaded successfully",
        description: (t("settings.fontUploadedSuccessDesc") || 'Added font "{name}" to workspace.').replace("{name}", saved.name),
      });
    } catch (err: any) {
      console.error("[CustomFont] Upload error:", err);
      toast({
        title: t("settings.fontUploadFailed") || "Failed to upload font",
        description: err?.message || t("settings.fontUploadFailedDesc") || "Could not process font file",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFont(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleConfirmFontRename = async () => {
    if (!fontToRename) return;
    const newName = fontRenameValue.trim();
    if (!newName) return;

    try {
      await renameCustomFont(fontToRename.id, newName);
      await refreshCustomFonts();
      toast({
        title: t("settings.fontRenameSuccess") || "Font renamed successfully",
        description: (t("settings.fontRenameSuccessDesc") || 'Font renamed to "{name}".').replace("{name}", newName),
      });
      setFontToRename(null);
    } catch (err: any) {
      toast({
        title: t("settings.fontRenameFailed") || "Failed to rename font",
        description: err?.message || "Could not rename font",
        variant: "destructive",
      });
    }
  };

  const handleConfirmFontDelete = async () => {
    if (!fontToDelete) return;
    const deletedName = fontToDelete.name;
    try {
      await deleteCustomFont(fontToDelete.id);
      if (settings.fontFamily === fontToDelete.id) {
        updateSetting("fontFamily", "inter");
      }
      if (settings.editorFontFamily === fontToDelete.id) {
        updateSetting("editorFontFamily", "inter");
      }
      await refreshCustomFonts();
      toast({
        title: t("settings.fontDeletedSuccess") || "Font removed successfully",
        description: (t("settings.fontDeletedSuccessDesc") || 'Removed font "{name}" from workspace.').replace("{name}", deletedName),
      });
      setFontToDelete(null);
    } catch (err: any) {
      toast({
        title: t("settings.fontDeleteFailed") || "Failed to delete font",
        description: err?.message || "Could not delete font",
        variant: "destructive",
      });
    }
  };
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
    if (isValidSettingsCategory(initialCategory) && initialCategory !== "general") return initialCategory;
    try {
      const saved = localStorage.getItem("luno_last_settings_category");
      if (isValidSettingsCategory(saved)) return saved;
    } catch {}
    return isValidSettingsCategory(initialCategory) ? initialCategory : "general";
  });

  useEffect(() => {
    if (isValidSettingsCategory(initialCategory)) {
      setActiveCategory(initialCategory);
      try {
        localStorage.setItem("luno_last_settings_category", initialCategory);
      } catch {}
    }
  }, [initialCategory]);

  const handleSelectCategory = (catId: SettingsCategory) => {
    if (!isValidSettingsCategory(catId)) return;
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
  const appUpdate = useAppUpdate();

  // Whenever user navigates to storage category, ensure userProfile matches latest Google userinfo
  useEffect(() => {
    if (activeCategory === "storage" && isGoogleDriveConnected()) {
      const stored = getStoredUserProfile();
      if (stored?.email && !userProfile?.email) {
        syncEngine.setUserProfile(stored);
      }
      void (async () => {
        try {
          const token = await getValidAccessToken();
          if (token) {
            const freshProfile = await fetchGoogleUserProfile(token);
            if (freshProfile?.email) {
              syncEngine.setUserProfile(freshProfile);
            }
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [activeCategory]);

  // Additional local state matching the design
  const [draggedToolbarIndex, setDraggedToolbarIndex] = useState<number | null>(null);
  const [dragOverToolbarIndex, setDragOverToolbarIndex] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModelOption[]>([
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", isExhausted: false },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", isExhausted: false },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", isExhausted: false },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", isExhausted: false },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isExhausted: false },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isExhausted: false },
  ]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  const loadAiModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableModels(settings.geminiApiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.geminiApiKey]);

  useEffect(() => {
    if (activeCategory === "ai") {
      void loadAiModels();
    }
  }, [activeCategory, loadAiModels]);

  useEffect(() => {
    const handleQuotaChange = () => {
      void loadAiModels();
    };
    window.addEventListener("luno_gemini_quota_changed", handleQuotaChange);
    return () => {
      window.removeEventListener("luno_gemini_quota_changed", handleQuotaChange);
    };
  }, [loadAiModels]);

  const handleExportBackup = async () => {
    if (isExportingBackup) return;
    if (!notes || notes.length === 0) {
      toast({
        variant: "destructive",
        title: t("settings.backupFailedTitle") || "Export Failed",
        description: "ไม่มีโน้ตใน Workspace สำหรับการส่งออก",
      });
      return;
    }

    setIsExportingBackup(true);
    toast({
      title: t("settings.backupStartedTitle") || "Backup Started",
      description: t("settings.backupStartedDesc") || "Creating and compressing ZIP archive...",
    });

    try {
      const result = await exportWorkspaceBackupZip({
        notes,
        workspaceName: openedFolderName || undefined,
        folderPaths,
      });

      if (result.success) {
        toast({
          title: t("settings.backupSuccessTitle") || "Backup Exported Successfully",
          description: t("settings.backupSuccessDesc", { count: result.count }) || `Backup exported (${result.count} files)`,
        });
      } else if (!result.canceled) {
        toast({
          variant: "destructive",
          title: t("settings.backupFailedTitle") || "Export Failed",
          description: result.error || "Failed to create backup archive.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("settings.backupFailedTitle") || "Export Failed",
        description: err?.message || "Failed to export backup archive.",
      });
    } finally {
      setIsExportingBackup(false);
    }
  };

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

  const safeActiveCategory: SettingsCategory = isValidSettingsCategory(activeCategory)
    ? activeCategory
    : isValidSettingsCategory(initialCategory)
    ? initialCategory
    : "general";

  const currentCategory = categories.find((c) => c.id === safeActiveCategory) || categories[0];

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
      <div className="flex-1 min-h-0 h-full w-full max-h-full flex flex-col bg-background text-foreground overflow-hidden select-none">
        {/* Main 2-Column Content View */}
        <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
          {/* Left Navigation Category Column (Matching Screenshot) */}
          <div className="w-60 border-r border-border/50 bg-card/30 flex flex-col shrink-0 select-none">
            <div className="px-5 py-4 border-b border-border/40 font-bold text-lg text-foreground flex items-center justify-between">
              <span>{t("settings.title") || "Settings"}</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1 no-scrollbar overscroll-contain">
              {categories.map((cat) => {
                const Icon = getToolbarIcon(cat.iconKey, pack);
                const isActive = safeActiveCategory === cat.id;

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
          <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-background/50 overflow-hidden">
            {/* Category Header */}
            <div className="px-8 py-5 border-b border-border/40 bg-card/20 shrink-0">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{currentCategory.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.desc}</p>
              </div>
            </div>

            {/* Scrollable Category Options Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 no-scrollbar w-full overscroll-contain">
              {/* 1. GENERAL */}
              {safeActiveCategory === "general" && (
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home" disabled={settings.appLayout === "compact"}>
                            <span className={settings.appLayout === "compact" ? "line-through opacity-60 text-muted-foreground" : ""}>
                              {t("settings.optOpenHome")}
                            </span>
                          </SelectItem>
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
                      <Select value={settings.language || "en"} onValueChange={(v) => updateSetting("language", v as "en" | "th")}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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
              {safeActiveCategory === "appearance" && (
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
                      <div className="flex flex-wrap items-center gap-3">
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
                                    : "opacity-75 hover:opacity-100 hover:scale-105"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>{t(`settings.theme${th.id.charAt(0).toUpperCase() + th.id.slice(1)}` as any) || th.label}</TooltipContent>
                          </Tooltip>
                        ))}

                        {/* Custom Accent Color Picker */}
                        <Popover>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  style={{
                                    backgroundColor: settings.theme === "custom" ? (settings.customAccentColor || "#26A295") : undefined,
                                    backgroundImage: settings.theme !== "custom" ? "conic-gradient(from 0deg, #f43f5e, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #c084fc, #f43f5e)" : undefined,
                                  }}
                                  onClick={() => {
                                    if (settings.theme !== "custom") {
                                      updateSetting("theme", "custom");
                                    }
                                  }}
                                  className={`h-8 w-8 rounded-full transition-all cursor-pointer flex items-center justify-center relative shadow-xs ${
                                    settings.theme === "custom"
                                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                                      : "opacity-80 hover:opacity-100 hover:scale-105"
                                  }`}
                                >
                                  <Palette className="w-3.5 h-3.5 text-white drop-shadow-md" />
                                </button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>{t("settings.themeCustom")}</TooltipContent>
                          </Tooltip>
                          <PopoverContent align="start" className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <Palette className="w-3.5 h-3.5 text-primary" />
                                  {t("settings.customAccentColor")}
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                  {settings.customAccentColor || "#26A295"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-xs flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                                  <input
                                    type="color"
                                    value={settings.customAccentColor || "#26A295"}
                                    onChange={(e) => {
                                      updateSetting("customAccentColor", e.target.value);
                                      if (settings.theme !== "custom") updateSetting("theme", "custom");
                                    }}
                                    className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                                  />
                                </div>
                                <Input
                                  value={settings.customAccentColor || "#26A295"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateSetting("customAccentColor", val);
                                    if (/^#[0-9A-Fa-f]{6}$/.test(val) && settings.theme !== "custom") {
                                      updateSetting("theme", "custom");
                                    }
                                  }}
                                  placeholder="#26A295"
                                  className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-xs focus-visible:ring-1 focus-visible:ring-primary"
                                  maxLength={7}
                                />
                              </div>

                              <div>
                                <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                                  {t("settings.quickPresets")}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    "#26A295", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
                                    "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308",
                                    "#84cc16", "#10b981", "#14b8a6", "#64748b"
                                  ].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      style={{ backgroundColor: color }}
                                      onClick={() => {
                                        updateSetting("customAccentColor", color);
                                        updateSetting("theme", "custom");
                                      }}
                                      className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                                        settings.customAccentColor?.toLowerCase() === color.toLowerCase() && settings.theme === "custom"
                                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                                          : "hover:scale-115 opacity-85 hover:opacity-100"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-border/40">
                                <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                                  {t("settings.previewExample")}
                                </span>
                                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
                                  <span className="font-medium text-primary text-xs">
                                    {t("settings.previewAccentText")}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-white shadow-xs transition-colors"
                                    style={{ backgroundColor: settings.customAccentColor || "#26A295" }}
                                  >
                                    {t("settings.previewActive")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.tagColorStyle")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.tagStyleDesc")}</p>
                      </div>
                      <Select value={settings.tagColorStyle} onValueChange={(v) => updateSetting("tagColorStyle", v as any)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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

                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.showFileIcons")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.showFileIconsDesc")}</p>
                      </div>
                      <Switch
                        checked={settings.showFileIcons !== false}
                        onCheckedChange={(checked) => updateSetting("showFileIcons", checked)}
                        className="scale-85 origin-right"
                      />
                    </div>
                  </div>

                    {/* Typography */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.typographyGroup")}</h3>
                      <button
                        type="button"
                        onClick={() => fontFileInputRef.current?.click()}
                        disabled={isUploadingFont}
                        className="h-8 flex items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-[10px] transition-colors cursor-pointer border border-border/40 disabled:opacity-50"
                      >
                        {isUploadingFont ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        <span>{t("settings.uploadFont") || "Upload Font"}</span>
                      </button>
                    </div>

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
                          {customFonts && customFonts.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>{t("settings.customFonts") || "Workspace Fonts"}</SelectLabel>
                              {customFonts.map((font) => (
                                <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.css }}>
                                  <span style={{ fontFamily: font.css }}>{font.name}</span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          <SelectGroup>
                            {customFonts && customFonts.length > 0 && (
                              <SelectLabel>{t("settings.systemFonts") || "System Fonts"}</SelectLabel>
                            )}
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.css }}>
                                <span style={{ fontFamily: font.css }}>{t(font.nameKey)}</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
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
                          {customFonts && customFonts.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>{t("settings.customFonts") || "Workspace Fonts"}</SelectLabel>
                              {customFonts.map((font) => (
                                <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.css }}>
                                  <span style={{ fontFamily: font.css }}>{font.name}</span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          <SelectGroup>
                            {customFonts && customFonts.length > 0 && (
                              <SelectLabel>{t("settings.systemFonts") || "System Fonts"}</SelectLabel>
                            )}
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.css }}>
                                <span style={{ fontFamily: font.css }}>{t(font.nameKey)}</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.editorFontSize")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.fontSizeDesc")} ({settings.editorFontSize}px)</p>
                      </div>
                      <Select value={String(settings.editorFontSize)} onValueChange={(v) => updateSetting("editorFontSize", Number(v))}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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

                    {/* Custom Workspace Fonts Management */}
                    {customFonts && customFonts.length > 0 && (
                      <div className="pt-3 border-t border-border/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-semibold text-foreground">{t("settings.customFonts") || "Workspace Fonts"}</label>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t("settings.manageFontsDesc") || "Manage uploaded custom fonts for current workspace"}</p>
                          </div>
                          <span className="text-xs font-normal text-muted-foreground">
                            {customFonts.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {customFonts.map((font) => {
                            const sizeText = getFontDisplayFileSize(font);
                            return (
                              <div
                                key={font.id}
                                className="group flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                              >
                                <div className="min-w-0 flex-1 mr-2">
                                  <p
                                    className="text-xs font-medium truncate text-foreground"
                                    style={{ fontFamily: font.css || font.name }}
                                  >
                                    {font.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate mt-1">
                                    {font.format.toUpperCase()}{sizeText ? ` · ${sizeText}` : ""}
                                  </p>
                                </div>
                                <div className="flex items-center shrink-0">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 cursor-pointer transition-opacity"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-md">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setFontToRename(font);
                                          setFontRenameValue(font.name);
                                        }}
                                        className="gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer text-[13px]"
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span>{t("settings.renameFont") || "Rename"}</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setFontToDelete(font)}
                                        className="gap-2.5 py-1.5 px-3 rounded-lg text-destructive focus:text-destructive cursor-pointer text-[13px]"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span>{t("settings.deleteFont") || "Delete"}</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comfortable">{t("settings.densityComfortable")}</SelectItem>
                          <SelectItem value="compact">{t("settings.densityCompact")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.appLayout")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.appLayoutDesc")}</p>
                      </div>
                      <Select value={settings.appLayout || "default"} onValueChange={(v) => updateSetting("appLayout", v as any)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">{t("settings.layoutDefault")}</SelectItem>
                          <SelectItem value="compact">{t("settings.layoutCompact")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. EDITOR */}
              {safeActiveCategory === "editor" && (
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
                        <label className="text-xs font-semibold text-foreground">{t("settings.showToolbar")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.showToolbarDesc")}</p>
                      </div>
                      <Switch checked={settings.showToolbar !== false} onCheckedChange={(v) => updateSetting("showToolbar", v)} className="scale-85 origin-right" />
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

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.wrongLanguageSuggestion") || "Wrong language layout suggestion"}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.wrongLanguageSuggestionDesc") || "Show inline ghost text when typing in the wrong layout"}</p>
                      </div>
                      <Switch checked={settings.wrongLanguageSuggestion !== false} onCheckedChange={(v) => updateSetting("wrongLanguageSuggestion", v)} className="scale-85 origin-right" />
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
                        <label className="text-xs font-semibold text-foreground">{t("settings.enableSlashCommands") || "Slash commands menu (/)"}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.enableSlashCommandsDesc") || "Type / in the editor to open quick command palette"}</p>
                      </div>
                      <Switch checked={settings.enableSlashCommand !== false} onCheckedChange={(v) => updateSetting("enableSlashCommand", v)} className="scale-85 origin-right cursor-pointer" />
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
                        className="h-8 flex items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-[10px] transition-colors cursor-pointer border border-border/40"
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
              {safeActiveCategory === "files" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.fileCreationGroup")}</h3>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.defaultExtension")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.defaultExtensionDesc")}</p>
                      </div>
                      <Select value={settings.defaultExtension} onValueChange={(v) => updateSetting("defaultExtension", v as any)}>
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
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
              {safeActiveCategory === "markdown" && (
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
                      <Switch
                        checked={settings.smartTypography !== false}
                        onCheckedChange={(val) => updateSetting("smartTypography", val)}
                        className="scale-85 origin-right cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. TEMPLATES */}
              {safeActiveCategory === "templates" && (
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optBlankDocument")}</SelectItem>
                          <SelectItem value="daily">{t("settings.optDailyNote")}</SelectItem>
                          <SelectItem value="weekly-review">{t("settings.optWeeklyReview") || "Weekly Review"}</SelectItem>
                          <SelectItem value="todo">{t("settings.optTodoList")}</SelectItem>
                          <SelectItem value="meeting">{t("settings.optMeetingNotes")}</SelectItem>
                          <SelectItem value="project">{t("settings.optProjectPlan")}</SelectItem>
                          <SelectItem value="study">{t("settings.optIdeaBrainstorm")}</SelectItem>
                          <SelectItem value="book-notes">{t("settings.optBookNotes") || "Book Notes"}</SelectItem>
                          <SelectItem value="cornell-notes">{t("settings.optCornellNotes") || "Cornell Notes"}</SelectItem>
                          <SelectItem value="content-planner">{t("settings.optContentPlanner") || "Content & Video Planner"}</SelectItem>
                          <SelectItem value="api-doc">{t("settings.optApiDoc") || "API Specification"}</SelectItem>
                          <SelectItem value="bug">{t("settings.optBugReport") || "Bug Report"}</SelectItem>
                          <SelectItem value="habit-tracker">{t("settings.optHabitTracker") || "Habit & Wellness Tracker"}</SelectItem>
                          <SelectItem value="monthly-budget">{t("settings.optMonthlyBudget") || "Monthly Budget Planner"}</SelectItem>
                          <SelectItem value="travel-itinerary">{t("settings.optTravelItinerary") || "Travel Itinerary"}</SelectItem>
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optTxtBlank") || "Blank Text"}</SelectItem>
                          <SelectItem value="notes">{t("settings.optTxtNotes") || "Notes"}</SelectItem>
                          <SelectItem value="todo">{t("settings.optTxtTodoList") || "To-Do List"}</SelectItem>
                          <SelectItem value="meeting">{t("settings.optTxtMeetingNotes") || "Meeting Notes"}</SelectItem>
                          <SelectItem value="journal">{t("settings.optTxtJournal") || "Journal"}</SelectItem>
                          <SelectItem value="work-log">{t("settings.optTxtWorkLog") || "Work Log"}</SelectItem>
                          <SelectItem value="readme">{t("settings.optTxtReadme") || "README"}</SelectItem>
                          <SelectItem value="changelog">{t("settings.optTxtChangelog") || "Changelog"}</SelectItem>
                          <SelectItem value="lecture-notes">{t("settings.optTxtLectureNotes") || "Lecture Notes"}</SelectItem>
                          <SelectItem value="server-config">{t("settings.optTxtServerConfig") || "Server Config"}</SelectItem>
                          <SelectItem value="incident-report">{t("settings.optTxtIncidentReport") || "Incident Postmortem"}</SelectItem>
                          <SelectItem value="shopping-list">{t("settings.optTxtShoppingList") || "Shopping List"}</SelectItem>
                          <SelectItem value="recipe-txt">{t("settings.optTxtRecipe") || "Recipe"}</SelectItem>
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
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">{t("settings.optHtmlBlank") || "Blank HTML"}</SelectItem>
                          <SelectItem value="basic-website">{t("settings.optHtmlBasic") || "Basic Website"}</SelectItem>
                          <SelectItem value="landing-page">{t("settings.optHtmlLanding") || "Landing Page"}</SelectItem>
                          <SelectItem value="portfolio">{t("settings.optHtmlPortfolio") || "Portfolio"}</SelectItem>
                          <SelectItem value="blog">{t("settings.optHtmlBlog") || "Blog"}</SelectItem>
                          <SelectItem value="dashboard">{t("settings.optHtmlDashboard") || "Dashboard"}</SelectItem>
                          <SelectItem value="documentation">{t("settings.optHtmlDoc") || "Documentation"}</SelectItem>
                          <SelectItem value="link-tree">{t("settings.optHtmlLinks") || "Link in Bio"}</SelectItem>
                          <SelectItem value="invoice">{t("settings.optHtmlInvoice") || "Invoice & Receipt"}</SelectItem>
                          <SelectItem value="pricing-table">{t("settings.optHtmlPricingTable") || "Pricing Plans Table"}</SelectItem>
                          <SelectItem value="event-invite">{t("settings.optHtmlEventInvite") || "Event Invitation & RSVP"}</SelectItem>
                          <SelectItem value="restaurant-menu">{t("settings.optHtmlRestaurantMenu") || "Restaurant & Cafe Menu"}</SelectItem>
                          <SelectItem value="faq-page">{t("settings.optHtmlFaqPage") || "Help Center & FAQ"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. AI ASSISTANT */}
              {safeActiveCategory === "ai" && (
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.aiModelGroup")}</h3>
                      <div className="flex items-center gap-2">
                        {availableModels.some((m) => m.isExhausted) && (
                          <button
                            type="button"
                            onClick={() => {
                              clearExhaustedModels();
                              void loadAiModels();
                              toast({
                                title: t("settings.aiModelResetQuota"),
                                description: "ล้างสถานะโควตาเรียบร้อยแล้ว ทุกโมเดลกลับมาพร้อมใช้งาน",
                              });
                            }}
                            className="text-[11px] text-primary hover:underline transition-colors cursor-pointer"
                          >
                            {t("settings.aiModelResetQuota")}
                          </button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => void loadAiModels()}
                              disabled={isLoadingModels}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingModels ? "animate-spin" : ""}`} />
                              <span className="sr-only">{t("settings.aiModelRefresh")}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {t("settings.aiModelRefresh")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground">{t("settings.aiModelLabel")}</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("settings.aiModelDesc")}</p>
                      </div>
                      <Select
                        value={settings.aiModel || "auto"}
                        onValueChange={(val) => updateSetting("aiModel", val)}
                      >
                        <SelectTrigger className="w-56 h-10 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 w-auto min-w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="auto">
                            {t("settings.aiModelAuto")}
                          </SelectItem>
                          {availableModels.map((m) => (
                            <SelectItem key={m.id} value={m.id} disabled={m.isExhausted}>
                              <span className={m.isExhausted ? "line-through opacity-60 text-muted-foreground" : ""}>
                                {m.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. SHORTCUTS */}
              {safeActiveCategory === "shortcuts" && (
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
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSuperscript")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + .</kbd></div>
                      <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("settings.kbSubscript")}</span><kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">Ctrl + Shift + ,</kbd></div>
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
              {safeActiveCategory === "storage" && (
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
                              const authResult = await requestGoogleDriveAuth();
                              updateSetting("storageMode", "gdrive");
                              syncEngine.setUserProfile(authResult.profile);
                              await syncEngine.initializeSync();
                              triggerSync(notes, onNotesUpdated, folderPaths);
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-semibold text-foreground truncate block mt-0.5 cursor-default">
                                  {userProfile?.email || getStoredUserProfile()?.email || "Connected"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="text-xs">
                                {userProfile?.email || getStoredUserProfile()?.email || "Connected"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block text-[11px] uppercase tracking-wider">{t("settings.location") || "Location"}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    let targetId = folderStructure?.workspacesId || folderStructure?.projectId || folderStructure?.rootId;
                                    if (!targetId) {
                                      const token = await getValidAccessToken();
                                      if (token) {
                                        try {
                                          targetId = await ensureWorkspacesRootOnly(token);
                                        } catch {}
                                      }
                                    }
                                    const driveUrl = targetId
                                      ? `https://drive.google.com/drive/folders/${targetId}`
                                      : "https://drive.google.com";
                                    if (onOpenWebTab) {
                                      onOpenWebTab(driveUrl, "Google Drive - Workspaces");
                                    } else {
                                      window.open(driveUrl, "_blank", "noopener,noreferrer");
                                    }
                                  }}
                                  className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-0.5 group cursor-pointer text-left no-underline hover:no-underline"
                                >
                                  <span>Google Drive / Luno / Workspaces</span>
                                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 shrink-0" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="text-xs">
                                Google Drive / Luno / Workspaces
                              </TooltipContent>
                            </Tooltip>
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
                              if (v) triggerSync(notes, onNotesUpdated, folderPaths);
                            }}
                            className="scale-85 origin-right cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/30">
                          <button
                            type="button"
                            onClick={() => {
                              const targetId = folderStructure?.workspacesId || folderStructure?.projectId || folderStructure?.rootId;
                              const driveUrl = targetId
                                ? `https://drive.google.com/drive/folders/${targetId}`
                                : "https://drive.google.com";
                              if (onOpenWebTab) {
                                onOpenWebTab(driveUrl, "Google Drive - Workspaces");
                              } else {
                                window.open(driveUrl, "_blank", "noopener,noreferrer");
                              }
                            }}
                            className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("settings.openFolder") || "Open Folder"}
                          </button>
                          <button
                            type="button"
                            disabled={syncStatus === "syncing"}
                            onClick={() => {
                              triggerSync(notes, onNotesUpdated, folderPaths);
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
                      onClick={async () => {
                        const isPureCloud = isCloudWorkspace === true || (openedFolderName === "Google Drive" && (!folderPaths || folderPaths.length === 0));
                        await disconnectGoogleDrive();
                        syncEngine.disconnect();
                        updateSetting("storageMode", "local");
                        setDisconnectModalOpen(false);

                        if (isPureCloud) {
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
                            description: t("settings.gdriveDisconnectedDesc") || "Cloud sync is now disabled. Your local workspace files remain intact.",
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
              {safeActiveCategory === "backup" && (
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
                        disabled={isExportingBackup || !notes || notes.length === 0}
                        onClick={handleExportBackup}
                        className="px-3.5 py-1.5 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExportingBackup ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {isExportingBackup ? (t("settings.exportingBackup") || "Creating ZIP...") : t("settings.exportBackupBtn")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. PRIVACY */}
              {safeActiveCategory === "privacy" && (
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
              {safeActiveCategory === "about" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-1.5 max-w-xl">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Luno Note</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onOpenWhatsNew?.()}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left block mt-0.5 focus:outline-none"
                              >
                                Version {APP_VERSION} ({appUpdate.currentAppVersion ? `App v${appUpdate.currentAppVersion}` : "Desktop"})
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {settings.language === "th" ? "ดูรายการอัปเดตเวอร์ชันนี้" : "View release notes for this version"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                          {t("settings.aboutAppDesc")}
                        </p>
                        <p className="text-xs text-muted-foreground pt-1">
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
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {APP_ABOUT_CREDIT}
                          </a>
                        </p>
                      </div>

                      {/* Vertically Centered Check for Updates in Middle of Card */}
                      <div className="flex items-center gap-2 shrink-0 sm:self-center">
                        {appUpdate.isAvailable && (
                          <button
                            type="button"
                            onClick={appUpdate.downloadUpdate}
                            disabled={appUpdate.isDownloading}
                            className="w-48 h-10 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{t("settings.downloadUpdate") || "Download Update"}</span>
                          </button>
                        )}

                        {appUpdate.isDownloaded && (
                          <button
                            type="button"
                            onClick={appUpdate.quitAndInstall}
                            className="w-48 h-10 px-3 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>{t("settings.installAndRestart") || "Restart & Install"}</span>
                          </button>
                        )}

                        {!appUpdate.isAvailable && !appUpdate.isDownloaded && (
                          <button
                            type="button"
                            onClick={() => appUpdate.checkForUpdates(true)}
                            disabled={appUpdate.isChecking || appUpdate.isDownloading}
                            className="w-48 h-10 px-3 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {appUpdate.isChecking ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span>
                              {appUpdate.isChecking
                                ? (t("settings.checkingForUpdates") || "Checking...")
                                : (t("settings.checkUpdatesNow") || "Check for Updates")}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Show download progress if downloading */}
                    {appUpdate.isDownloading && appUpdate.progress && (
                      <div className="pt-2 border-t border-border/30 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t("settings.downloadingUpdate") || "Downloading..."}</span>
                          <span className="font-semibold text-foreground">{appUpdate.progress.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${appUpdate.progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
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

      {/* Custom Font File Input */}
      <input
        ref={fontFileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        className="hidden"
        style={{ display: "none" }}
        onChange={handleFontFileUpload}
      />

      {/* Rename Font Dialog */}
      <Dialog open={Boolean(fontToRename)} onOpenChange={(open) => !open && setFontToRename(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("settings.renameFont") || "Rename Font"}</DialogTitle>
            <DialogDescription>
              {fontToRename?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <label htmlFor="settings-tab-rename-font-name" className="mb-2 block text-sm font-medium text-foreground">
              {t("sidebar.fileNameLabel") || "Font Name"}
            </label>
            <input
              id="settings-tab-rename-font-name"
              type="text"
              value={fontRenameValue}
              onChange={(e) => setFontRenameValue(e.target.value)}
              placeholder="Font name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleConfirmFontRename();
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              className="h-9 px-4 rounded-xl border border-border/60 hover:bg-foreground/5 text-xs font-semibold transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setFontToRename(null)}
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button
              type="button"
              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => void handleConfirmFontRename()}
              disabled={!fontRenameValue.trim()}
            >
              {t("sidebar.renameAction") || t("common.save") || "Rename"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Font Confirmation Dialog */}
      <AlertDialog open={Boolean(fontToDelete)} onOpenChange={(open) => !open && setFontToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deleteFont") || "Delete Font"}</AlertDialogTitle>
            <AlertDialogDescription>
              {(t("settings.deleteFontConfirm") || 'Are you sure you want to delete font "{name}"?').replace("{name}", fontToDelete?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFontToDelete(null)} className="rounded-xl">
              {t("common.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmFontDelete()}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.deleteFont") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
