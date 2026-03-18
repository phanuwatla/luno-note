import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { APP_THEMES, useAppSettings } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";

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

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h1 className="mb-1 text-2xl font-semibold">{t("settings.title")}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{t("settings.description")}</p>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                {t("settings.theme")}
              </label>
              <div className="flex flex-wrap gap-2.5">
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

              <select
                id="language"
                value={settings.language}
                onChange={(e) => updateSetting("language", e.target.value === "th" ? "th" : "en")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">{t("settings.english")}</option>
                <option value="th">{t("settings.thai")}</option>
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="fontFamily" className="text-sm font-medium text-foreground">
                  {t("settings.fontFamily")}
                </label>
              </div>

              <select
                id="fontFamily"
                value={settings.fontFamily}
                onChange={(e) => updateSetting("fontFamily", e.target.value as "inter" | "system" | "serif" | "mono" | "prompt")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="inter">{t("settings.fontInter")}</option>
                <option value="system">{t("settings.fontSystem")}</option>
                <option value="serif">{t("settings.fontSerif")}</option>
                <option value="mono">{t("settings.fontMono")}</option>
                <option value="prompt">{t("settings.fontPrompt")}</option>
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="editorFontSize" className="text-sm font-medium text-foreground">
                  {t("settings.editorFontSize")}
                </label>
                <span className="text-xs text-muted-foreground">{settings.editorFontSize}px</span>
              </div>
              <select
                id="editorFontSize"
                value={settings.editorFontSize}
                onChange={(e) => updateSetting("editorFontSize", Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
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
