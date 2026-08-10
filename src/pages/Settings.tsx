import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { SettingsBody } from "@/components/SettingsBody";

export default function Settings() {
  const { settings, resetSettings } = useAppSettings();
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

          <SettingsBody idPrefix="page" />
        </div>
      </div>
    </div>
  );
}
