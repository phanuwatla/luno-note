import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { APP_THEMES, useAppSettings, type ColorScheme } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const { t } = useTranslation();

  useEffect(() => {
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
  }, [settings.fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
  }, [settings.theme]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backToNotes")}
            </Link>
          </Button>

          <Button type="button" variant="outline" onClick={resetSettings}>
            {t("common.reset")}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
          <h1 className="mb-1 text-2xl font-semibold leading-normal pt-1">{t("settings.title")}</h1>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">{t("settings.description")}</p>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                {t("settings.colorScheme")}
              </label>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as ColorScheme[]).map((scheme) => {
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
              <label className="mb-3 block text-sm font-medium text-foreground">
                {t("settings.theme")}
              </label>
              <div className="flex flex-wrap gap-2.5 p-1">
                {APP_THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    style={{ backgroundColor: th.color }}
                    title={t(`settings.theme${th.id.charAt(0).toUpperCase()}${th.id.slice(1)}`)}
                    onClick={() => updateSetting("theme", th.id)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      settings.theme === th.id
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="language" className="text-sm font-medium text-foreground">
                  {t("settings.language")}
                </label>
              </div>

              <Select value={settings.language} onValueChange={(v) => updateSetting("language", v === "th" ? "th" : "en")}>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("settings.english")}</SelectItem>
                  <SelectItem value="th">{t("settings.thai")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="fontFamily" className="text-sm font-medium text-foreground">
                  {t("settings.fontFamily")}
                </label>
              </div>

              <Select value={settings.fontFamily} onValueChange={(v) => updateSetting("fontFamily", v as "inter" | "system" | "serif" | "mono" | "prompt")}>
                <SelectTrigger id="fontFamily" className="w-full">
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

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="editorFontSize" className="text-sm font-medium text-foreground">
                  {t("settings.editorFontSize")}
                </label>
                <span className="text-xs text-muted-foreground">{settings.editorFontSize}px</span>
              </div>
              <Select value={String(settings.editorFontSize)} onValueChange={(v) => updateSetting("editorFontSize", Number(v))}>
                <SelectTrigger id="editorFontSize" className="w-full">
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

            <div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <div>
                  <label htmlFor="autoSave" className="text-sm font-medium text-foreground">
                    {t("settings.autoSave")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">{t("settings.autoSaveDescription")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {settings.autoSave ? t("settings.enabled") : t("settings.disabled")}
                  </span>
                  <Switch
                    id="autoSave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting("autoSave", checked)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <div>
                  <label htmlFor="confirmBeforeDelete" className="text-sm font-medium text-foreground">
                    {t("settings.confirmBeforeDelete")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">{t("settings.confirmBeforeDeleteDescription")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {settings.confirmBeforeDelete ? t("settings.enabled") : t("settings.disabled")}
                  </span>
                  <Switch
                    id="confirmBeforeDelete"
                    checked={settings.confirmBeforeDelete}
                    onCheckedChange={(checked) => updateSetting("confirmBeforeDelete", checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
