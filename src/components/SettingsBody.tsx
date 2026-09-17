import { useState, useEffect, useCallback, useRef } from "react";
import { Sun, Moon, Monitor, Wand, Key, Eye, EyeOff, ExternalLink, Palette, Check, Loader2, Upload, Pencil, Trash2 } from "lucide-react";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { APP_THEMES, APPEARANCE_STYLE_OPTIONS, FONT_OPTIONS, FontFamilyOption, useAppSettings, useCustomFonts } from "@/hooks/useAppSettings";
import { saveCustomFont, renameCustomFont, deleteCustomFont, type CustomFont } from "@/lib/customFontStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { getDatePatternLabel } from "@/lib/dateTimeFormatter";
import { fetchAvailableModels, type AvailableModelOption } from "@/lib/geminiApi";

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

interface SettingsBodyProps {
  idPrefix?: string;
}

export function SettingsBody({ idPrefix = "set" }: SettingsBodyProps) {
  const { settings, updateSetting, applyAppearanceStyle } = useAppSettings();
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<AvailableModelOption[]>([
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", isExhausted: false },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", isExhausted: false },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", isExhausted: false },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", isExhausted: false },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isExhausted: false },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isExhausted: false },
  ]);

  const loadAiModels = useCallback(async () => {
    try {
      const models = await fetchAvailableModels(settings.geminiApiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
      }
    } catch {}
  }, [settings.geminiApiKey]);

  useEffect(() => {
    void loadAiModels();
  }, [loadAiModels]);

  useEffect(() => {
    const handleQuotaChange = () => {
      void loadAiModels();
    };
    window.addEventListener("luno_gemini_quota_changed", handleQuotaChange);
    return () => {
      window.removeEventListener("luno_gemini_quota_changed", handleQuotaChange);
    };
  }, [loadAiModels]);

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto space-y-7 px-1 py-1.5">
      {/* 1. General & Theme */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5">
          {t("settings.sectionGeneral")}
        </h3>

        <div>
          <label className="mb-2.5 block text-sm font-medium text-foreground">
            {t("settings.colorScheme")}
          </label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((scheme) => {
              const Icon = scheme === "light" ? Sun : scheme === "dark" ? Moon : Monitor;
              const label = t(`settings.colorScheme${scheme.charAt(0).toUpperCase()}${scheme.slice(1)}`);
              return (
                <button
                  key={scheme}
                  type="button"
                  onClick={() => updateSetting("colorScheme", scheme)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    settings.colorScheme === scheme
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Appearance Themes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("settings.visualAppearanceGroup")}
          </label>
          <p className="text-xs text-muted-foreground mb-2.5">{t("settings.visualAppearanceDesc")}</p>
          <div className="grid grid-cols-2 gap-2">
            {APPEARANCE_STYLE_OPTIONS.map((style) => {
              const isSelected = (settings.appearanceStyle || "default") === style.id;
              const isDark = style.recommendedColorScheme === "dark" || (style.id === "default" && settings.colorScheme === "dark");
              const bgPreview = isDark ? style.darkBg : style.lightBg;
              const sbPreview = isDark ? style.darkSidebar : style.lightSidebar;
              const accentColor = APP_THEMES.find((th) => th.id === style.recommendedTheme)?.color || style.accentPreview;

              const getInnerRadiusClass = () => {
                switch (style.id) {
                  case "catppuccin":
                    return "rounded-full";
                  case "neumorphism":
                    return "rounded-md";
                  case "glass":
                    return "rounded-md";
                  case "nord":
                    return "rounded-sm";
                  case "default":
                    return "rounded-sm";
                  case "paper":
                    return "rounded-xs";
                  case "midnight":
                  case "cyberpunk":
                    return "rounded-none";
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
                  className={`flex flex-col rounded-xl border p-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-2xs"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  <div
                    className="w-full h-10 overflow-hidden flex mb-1.5 relative rounded-lg border border-border/40"
                    style={{ background: bgPreview }}
                  >
                    <div
                      className="w-1/3 h-full border-r border-border/20 p-1 flex flex-col gap-0.5"
                      style={{
                        background: sbPreview,
                        ...(style.id === "glass" ? { backdropFilter: "blur(12px)", backgroundColor: isDark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)" } : {}),
                        ...(style.id === "cyberpunk" ? { borderRight: `1px solid ${accentColor}` } : {}),
                      }}
                    >
                      <div className={`h-1 w-full ${innerRadiusClass} ${isDark ? "bg-white/35" : "bg-black/25"}`} />
                      <div className={`h-0.5 w-3/4 ${innerRadiusClass} ${isDark ? "bg-white/20" : "bg-black/15"}`} />
                    </div>
                    <div className="flex-1 p-1 flex flex-col gap-0.5 justify-center">
                      {style.id === "glass" ? (
                        <div
                          className="p-0.5 rounded-md flex flex-col gap-0.5"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.7)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                          }}
                        >
                          <div className="h-1 w-2/3 rounded-md" style={{ backgroundColor: accentColor }} />
                          <div className={`h-0.5 w-full rounded-md ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                        </div>
                      ) : style.id === "cyberpunk" ? (
                        <div
                          className="p-0.5 rounded-none flex flex-col gap-0.5"
                          style={{
                            border: `1px solid ${accentColor}`,
                            boxShadow: `inset 0 0 3px ${accentColor}`,
                            background: "rgba(11, 5, 20, 0.8)",
                          }}
                        >
                          <div className="h-1 w-2/3 rounded-none" style={{ backgroundColor: accentColor, boxShadow: `0 0 3px ${accentColor}` }} />
                          <div className="h-0.5 w-full rounded-none bg-white/30" />
                        </div>
                      ) : style.id === "catppuccin" ? (
                        <div
                          className="p-0.5 rounded-lg flex flex-col gap-0.5 border border-white/10"
                          style={{ background: isDark ? "#181825" : "#e6e9ef" }}
                        >
                          <div className="h-1 w-2/3 rounded-full" style={{ backgroundColor: accentColor }} />
                          <div className={`h-0.5 w-full rounded-full ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                        </div>
                      ) : style.id === "neumorphism" ? (
                        <div
                          className="p-0.5 rounded-md flex flex-col gap-0.5"
                          style={{
                            background: isDark ? "#242831" : "#e5e9ef",
                            boxShadow: isDark
                              ? "1px 1px 3px rgba(0,0,0,0.5), -1px -1px 3px rgba(255,255,255,0.05)"
                              : "1px 1px 3px rgba(163,170,181,0.5), -1px -1px 3px rgba(255,255,255,0.9)",
                          }}
                        >
                          <div className="h-1 w-2/3 rounded-full" style={{ backgroundColor: accentColor }} />
                          <div className={`h-0.5 w-full rounded-full ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                        </div>
                      ) : style.id === "midnight" ? (
                        <div
                          className="p-0.5 rounded-none flex flex-col gap-0.5 border border-zinc-800"
                          style={{ background: "#050505" }}
                        >
                          <div className="h-1 w-2/3 rounded-none" style={{ backgroundColor: accentColor }} />
                          <div className="h-0.5 w-full rounded-none bg-white/30" />
                        </div>
                      ) : style.id === "paper" ? (
                        <div
                          className="p-0.5 rounded-xs flex flex-col gap-0.5 border border-amber-900/15"
                          style={{ background: isDark ? "#161311" : "#f4ede0" }}
                        >
                          <div className="h-1 w-2/3 rounded-xs" style={{ backgroundColor: accentColor }} />
                          <div className={`h-0.5 w-full rounded-xs ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                        </div>
                      ) : style.id === "nord" ? (
                        <div
                          className="p-0.5 rounded-sm flex flex-col gap-0.5 border border-slate-700/40"
                          style={{ background: isDark ? "#1e222a" : "#e5e9f0" }}
                        >
                          <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: accentColor }} />
                          <div className={`h-0.5 w-full rounded-sm ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                        </div>
                      ) : (
                        <div
                          className="p-0.5 rounded-sm flex flex-col gap-0.5 border border-border/40"
                          style={{ background: isDark ? "#090d16" : "#f8fafc" }}
                        >
                          <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: accentColor }} />
                          <div className={`h-0.5 w-full rounded-sm ${isDark ? "bg-white/30" : "bg-black/20"}`} />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold line-clamp-1 ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {t(style.nameKey as any) || style.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-medium text-foreground">
            {t("settings.theme")}
          </label>
          <div className="flex flex-wrap items-center gap-2.5 p-1">
            {APP_THEMES.map((th) => (
              <Tooltip key={th.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    style={{ backgroundColor: th.color }}
                    onClick={() => updateSetting("theme", th.id)}
                    className={`h-7 w-7 rounded-full transition-all cursor-pointer ${
                      settings.theme === th.id
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>{t(`settings.theme${th.id.charAt(0).toUpperCase()}${th.id.slice(1)}` as any) || th.label}</TooltipContent>
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
                      className={`h-7 w-7 rounded-full transition-all cursor-pointer flex items-center justify-center relative ${
                        settings.theme === "custom"
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <Palette className="w-3 h-3 text-white drop-shadow-md" />
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

        <div>
          <label htmlFor={`${idPrefix}-tagColorStyle`} className="mb-2 block text-sm font-medium text-foreground">
            {t("settings.tagColorStyle")}
          </label>
          <Select value={settings.tagColorStyle} onValueChange={(v) => updateSetting("tagColorStyle", v as "multicolor" | "accent")}>
            <SelectTrigger id={`${idPrefix}-tagColorStyle`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multicolor">{t("settings.tagColorStyleMulticolor")}</SelectItem>
              <SelectItem value="accent">{t("settings.tagColorStyleAccent")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${idPrefix}-language`} className="mb-2 block text-sm font-medium text-foreground">
              {t("settings.language")}
            </label>
            <Select value={settings.language} onValueChange={(v) => updateSetting("language", v === "th" ? "th" : "en")}>
              <SelectTrigger id={`${idPrefix}-language`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="th">ภาษาไทย</SelectItem>
              </SelectContent>
            </Select>
          </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{t("settings.typographyGroup") || "Typography"}</h4>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${idPrefix}-fontFamily`} className="mb-2 block text-sm font-medium text-foreground">
                {t("settings.interfaceFontFamily") || "Interface Font"}
              </label>
              <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v as FontFamilyOption)}>
                <SelectTrigger id={`${idPrefix}-fontFamily`} className="w-full">
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

            <div>
              <label htmlFor={`${idPrefix}-editorFontFamily`} className="mb-2 block text-sm font-medium text-foreground">
                {t("settings.editorFontFamily") || "Editor Font"}
              </label>
              <Select value={settings.editorFontFamily || settings.fontFamily} onValueChange={(v) => updateSetting("editorFontFamily", v as FontFamilyOption)}>
                <SelectTrigger id={`${idPrefix}-editorFontFamily`} className="w-full">
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
          </div>

          {/* Custom Workspace Fonts Management */}
          {customFonts && customFonts.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{t("settings.customFonts") || "Workspace Fonts"}</span>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {customFonts.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {customFonts.map((font) => (
                  <div
                    key={font.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-xs font-medium truncate text-foreground" style={{ fontFamily: font.css }}>
                        {font.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {font.format.toUpperCase()} · {(font.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-colors"
                            onClick={() => {
                              setFontToRename(font);
                              setFontRenameValue(font.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">{t("settings.renameFont") || "Rename"}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settings.renameFont") || "Rename font"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                            onClick={() => setFontToDelete(font)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">{t("settings.deleteFont") || "Delete"}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settings.deleteFont") || "Delete font"}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor={`${idPrefix}-editorFontSize`} className="text-sm font-medium text-foreground">
              {t("settings.editorFontSize")}
            </label>
            <span className="text-xs text-muted-foreground">{settings.editorFontSize}px</span>
          </div>
          <Select value={String(settings.editorFontSize)} onValueChange={(v) => updateSetting("editorFontSize", Number(v))}>
            <SelectTrigger id={`${idPrefix}-editorFontSize`} className="w-full">
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

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-autoSave`} className="text-sm font-medium text-foreground">
              {t("settings.autoSave")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.autoSaveDescription")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.autoSave ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-autoSave`}
              checked={settings.autoSave}
              onCheckedChange={(checked) => updateSetting("autoSave", checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-confirmBeforeDelete`} className="text-sm font-medium text-foreground">
              {t("settings.confirmBeforeDelete")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.confirmBeforeDeleteDescription")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.confirmBeforeDelete ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-confirmBeforeDelete`}
              checked={settings.confirmBeforeDelete}
              onCheckedChange={(checked) => updateSetting("confirmBeforeDelete", checked)}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-trashRetentionDays`} className="mb-1.5 block text-sm font-medium text-foreground">
            {t("trash.trashRetention")}
          </label>
          <p className="mb-2 text-xs text-muted-foreground">{t("trash.trashRetentionDesc")}</p>
          <Select
            value={String(settings.trashRetentionDays ?? 30)}
            onValueChange={(v) => updateSetting("trashRetentionDays", Number(v))}
          >
            <SelectTrigger id={`${idPrefix}-trashRetentionDays`} className="w-full">
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
      </div>

      {/* 2. File Settings */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5">
          {t("settings.sectionFile")}
        </h3>

        <div>
          <label htmlFor={`${idPrefix}-defaultExtension`} className="mb-1.5 block text-sm font-medium text-foreground">
            {t("settings.defaultExtension")}
          </label>
          <p className="mb-2 text-xs text-muted-foreground">{t("settings.defaultExtensionDesc")}</p>
          <Select value={settings.defaultExtension} onValueChange={(v) => updateSetting("defaultExtension", v as "md" | "txt" | "html")}>
            <SelectTrigger id={`${idPrefix}-defaultExtension`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="md">{t("settings.extMd")}</SelectItem>
              <SelectItem value="txt">{t("settings.extTxt")}</SelectItem>
              <SelectItem value="html">{t("settings.extHtml")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-newFilePattern`} className="mb-1.5 block text-sm font-medium text-foreground">
            {t("settings.newFilePattern")}
          </label>
          <p className="mb-2 text-xs text-muted-foreground">{t("settings.newFilePatternDesc")}</p>
          <Select value={settings.newFilePattern} onValueChange={(v) => updateSetting("newFilePattern", v as "untitled" | "date" | "daily")}>
            <SelectTrigger id={`${idPrefix}-newFilePattern`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="untitled">{t("settings.patternUntitled")}</SelectItem>
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
      </div>

      {/* 3. Appearance & Layout */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5">
          {t("settings.sectionAppearance")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${idPrefix}-editorWidth`} className="mb-2 block text-sm font-medium text-foreground">
              {t("settings.editorWidth")}
            </label>
            <Select value={settings.editorWidth} onValueChange={(v) => updateSetting("editorWidth", v as "compact" | "standard" | "full")}>
              <SelectTrigger id={`${idPrefix}-editorWidth`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">{t("settings.widthCompact")}</SelectItem>
                <SelectItem value="standard">{t("settings.widthStandard")}</SelectItem>
                <SelectItem value="full">{t("settings.widthFull")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-lineHeight`} className="mb-2 block text-sm font-medium text-foreground">
              {t("settings.lineHeight")}
            </label>
            <Select value={settings.lineHeight} onValueChange={(v) => updateSetting("lineHeight", v as "1.4" | "1.6" | "1.8")}>
              <SelectTrigger id={`${idPrefix}-lineHeight`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.4">{t("settings.lineHeight14")}</SelectItem>
                <SelectItem value="1.6">{t("settings.lineHeight16")}</SelectItem>
                <SelectItem value="1.8">{t("settings.lineHeight18")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-sidebarDensity`} className="mb-2 block text-sm font-medium text-foreground">
            {t("settings.sidebarDensity")}
          </label>
          <Select value={settings.sidebarDensity} onValueChange={(v) => updateSetting("sidebarDensity", v as "compact" | "comfortable")}>
            <SelectTrigger id={`${idPrefix}-sidebarDensity`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">{t("settings.densityComfortable")}</SelectItem>
              <SelectItem value="compact">{t("settings.densityCompact")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-appLayout`} className="mb-2 block text-sm font-medium text-foreground">
            {t("settings.appLayout")}
          </label>
          <Select value={settings.appLayout || "default"} onValueChange={(v) => updateSetting("appLayout", v as "default" | "compact")}>
            <SelectTrigger id={`${idPrefix}-appLayout`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t("settings.layoutDefault")}</SelectItem>
              <SelectItem value="compact">{t("settings.layoutCompact")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-showGuideLines`} className="text-sm font-medium text-foreground">
              {t("settings.showGuideLines")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.showGuideLinesDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.showGuideLines ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-showGuideLines`}
              checked={settings.showGuideLines}
              onCheckedChange={(checked) => updateSetting("showGuideLines", checked)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-accentHeadings`} className="text-sm font-medium text-foreground">
              {t("settings.accentHeadings")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.accentHeadingsDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.accentHeadings ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-accentHeadings`}
              checked={settings.accentHeadings}
              onCheckedChange={(checked) => updateSetting("accentHeadings", checked)}
            />
          </div>
        </div>
      </div>

      {/* 4. Editor & Writing */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5">
          {t("settings.sectionEditor")}
        </h3>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-highlightInlineCode`} className="text-sm font-medium text-foreground">
              {t("settings.highlightInlineCode")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.highlightInlineCodeDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.highlightInlineCode ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-highlightInlineCode`}
              checked={settings.highlightInlineCode}
              onCheckedChange={(checked) => updateSetting("highlightInlineCode", checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-showWordCount`} className="text-sm font-medium text-foreground">
              {t("settings.showWordCount")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.showWordCountDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.showWordCount ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-showWordCount`}
              checked={settings.showWordCount}
              onCheckedChange={(checked) => updateSetting("showWordCount", checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-autoPairBrackets`} className="text-sm font-medium text-foreground">
              {t("settings.autoPairBrackets")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.autoPairBracketsDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.autoPairBrackets ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-autoPairBrackets`}
              checked={settings.autoPairBrackets}
              onCheckedChange={(checked) => updateSetting("autoPairBrackets", checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-showCodeLineNumbers`} className="text-sm font-medium text-foreground">
              {t("settings.showCodeLineNumbers")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.showCodeLineNumbersDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.showCodeLineNumbers ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-showCodeLineNumbers`}
              checked={settings.showCodeLineNumbers}
              onCheckedChange={(checked) => updateSetting("showCodeLineNumbers", checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-spellCheck`} className="text-sm font-medium text-foreground">
              {t("settings.spellCheckSetting") || "Spell Check"}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.spellCheckSettingDesc") || "Check and underline misspelled words in Thai and English"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.spellCheck !== false ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-spellCheck`}
              checked={settings.spellCheck !== false}
              onCheckedChange={(checked) => updateSetting("spellCheck", checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <div>
            <label htmlFor={`${idPrefix}-wrongLanguageSuggestion`} className="text-sm font-medium text-foreground">
              {t("settings.wrongLanguageSuggestion") || "Wrong language layout suggestion"}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.wrongLanguageSuggestionDesc") || "Show inline ghost text when typing in the wrong layout"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {settings.wrongLanguageSuggestion !== false ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch
              id={`${idPrefix}-wrongLanguageSuggestion`}
              checked={settings.wrongLanguageSuggestion !== false}
              onCheckedChange={(checked) => updateSetting("wrongLanguageSuggestion", checked)}
            />
          </div>
        </div>
      </div>

      {/* 5. AI Assistant */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5 flex items-center gap-1.5">
          {t("settings.aiAssistant")}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={`${idPrefix}-geminiApiKey`} className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-primary" />
              {t("settings.geminiApiKey")}
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Get Gemini API Key <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground pb-0.5">{t("settings.geminiApiKeyDesc")}</p>
          <div className="relative flex items-center">
            <input
              id={`${idPrefix}-geminiApiKey`}
              type={showApiKey ? "text" : "password"}
              placeholder="AIzaSy..."
              value={settings.geminiApiKey}
              onChange={(e) => updateSetting("geminiApiKey", e.target.value)}
              className="w-full rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-0 shadow-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label htmlFor={`${idPrefix}-aiModel`} className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <SparklesIcon className="h-3.5 w-3.5 text-primary" />
            {t("settings.aiModelLabel")}
          </label>
          <p className="text-xs text-muted-foreground pb-0.5">{t("settings.aiModelDesc")}</p>
          <Select
            value={settings.aiModel || "auto"}
            onValueChange={(val) => updateSetting("aiModel", val)}
          >
            <SelectTrigger id={`${idPrefix}-aiModel`} className="w-full h-10 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
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

      {/* Custom Font File Input */}
      <input
        ref={fontFileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        className="hidden"
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
            <label htmlFor={`${idPrefix}-rename-font-name`} className="mb-2 block text-sm font-medium text-foreground">
              {t("sidebar.fileNameLabel") || "Font Name"}
            </label>
            <input
              id={`${idPrefix}-rename-font-name`}
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
    </div>
  );
}
