import { useState } from "react";
import { Sun, Moon, Monitor, Wand, Key, Eye, EyeOff, ExternalLink } from "lucide-react";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_THEMES, useAppSettings } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

interface SettingsBodyProps {
  idPrefix?: string;
}

export function SettingsBody({ idPrefix = "set" }: SettingsBodyProps) {
  const { settings, updateSetting } = useAppSettings();
  const { t } = useTranslation();
  const [showApiKey, setShowApiKey] = useState(false);

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

        <div>
          <label className="mb-2.5 block text-sm font-medium text-foreground">
            {t("settings.theme")}
          </label>
          <div className="flex flex-wrap gap-2.5 p-1">
            {APP_THEMES.map((th) => (
              <Tooltip key={th.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    style={{ backgroundColor: th.color }}
                    onClick={() => updateSetting("theme", th.id)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      settings.theme === th.id
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>{t(`settings.theme${th.id.charAt(0).toUpperCase()}${th.id.slice(1)}`)}</TooltipContent>
              </Tooltip>
            ))}
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
                <SelectItem value="en">{t("settings.english")}</SelectItem>
                <SelectItem value="th">{t("settings.thai")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-fontFamily`} className="mb-2 block text-sm font-medium text-foreground">
              {t("settings.fontFamily")}
            </label>
            <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v as "inter" | "system" | "serif" | "mono" | "prompt")}>
              <SelectTrigger id={`${idPrefix}-fontFamily`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">{t("settings.fontInter")}</SelectItem>
                <SelectItem value="system">{t("settings.fontSystem")}</SelectItem>
                <SelectItem value="serif">{t("settings.fontSerif")}</SelectItem>
                <SelectItem value="mono">{t("settings.fontMono")}</SelectItem>
                <SelectItem value="prompt">{t("settings.fontPrompt")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              <SelectItem value="date">{t("settings.patternDate")}</SelectItem>
              <SelectItem value="daily">{t("settings.patternDaily")}</SelectItem>
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
      </div>

      {/* 4. Editor & Writing */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5">
          {t("settings.sectionEditor")}
        </h3>

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
      </div>

      {/* 5. AI Assistant */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-1.5 flex items-center gap-1.5">
          {t("settings.aiAssistant")}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={`${idPrefix}-geminiApiKey`} className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              {t("settings.geminiApiKey")}
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[hsl(var(--accent))] hover:underline flex items-center gap-1 font-medium"
            >
              Get Gemini API Key <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">{t("settings.geminiApiKeyDesc")}</p>
          <div className="relative flex items-center">
            <input
              id={`${idPrefix}-geminiApiKey`}
              type={showApiKey ? "text" : "password"}
              placeholder="AIzaSy..."
              value={settings.geminiApiKey}
              onChange={(e) => updateSetting("geminiApiKey", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
