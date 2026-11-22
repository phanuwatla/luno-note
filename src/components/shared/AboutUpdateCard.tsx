import React from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import {
  APP_VERSION,
  APP_AUTHOR,
  APP_AUTHOR_URL,
  APP_ABOUT_CREDIT,
  openExternalUrl,
} from "@/lib/appVersion";

export interface AboutUpdateCardProps {
  onOpenWebTab?: (url: string, title?: string) => void;
  onOpenWhatsNew?: () => void;
  appUpdate?: ReturnType<typeof useAppUpdate>;
}

/**
 * Standardized About Luno Note & Auto-Update card (LN-REUSE-01).
 * Shared by SettingsTabView and HelpTabView to eliminate duplication and drift.
 */
export function AboutUpdateCard({
  onOpenWebTab,
  onOpenWhatsNew,
  appUpdate: externalAppUpdate,
}: AboutUpdateCardProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const internalAppUpdate = useAppUpdate();
  const appUpdate = externalAppUpdate ?? internalAppUpdate;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-foreground">Luno Note</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onOpenWhatsNew?.()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left block mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                  >
                    {t("uiMisc.versionLabel", {
                      version: APP_VERSION,
                      platform: appUpdate.currentAppVersion
                        ? `App v${appUpdate.currentAppVersion}`
                        : "Desktop",
                    })}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("uiMisc.viewReleaseNotesTooltip")}
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
                className="w-48 h-10 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t("settings.downloadUpdate")}</span>
              </button>
            )}

            {appUpdate.isDownloaded && (
              <button
                type="button"
                onClick={appUpdate.quitAndInstall}
                className="w-48 h-10 px-3 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{t("settings.installAndRestart")}</span>
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
                    ? t("settings.checkingForUpdates")
                    : t("settings.checkUpdatesNow")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Show download progress if downloading */}
        {appUpdate.isDownloading && appUpdate.progress && (
          <div className="pt-2 border-t border-border/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("settings.downloadingUpdate")}</span>
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
  );
}

export default AboutUpdateCard;
