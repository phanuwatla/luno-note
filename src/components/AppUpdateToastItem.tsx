import { useAppUpdate } from "@/hooks/useAppUpdate";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "@/components/ui/toast";
import {
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function AppUpdateToastItem() {
  const { t } = useTranslation();
  const {
    status,
    updateInfo,
    progress,
    errorMessage,
    showToast,
    dismissToast,
    downloadUpdate,
    quitAndInstall,
    isDownloading,
    isDownloaded,
    isAvailable,
  } = useAppUpdate();

  if (!showToast || status === "idle" || status === "checking" || status === "not-available") {
    return null;
  }

  const isError = status === "error";

  return (
    <Toast
      open={showToast}
      onOpenChange={(open) => {
        if (!open) dismissToast();
      }}
      duration={Infinity}
      className="flex-col items-stretch gap-2.5 p-4 pr-8 min-w-[320px] max-w-[420px] sm:max-w-[440px]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5 min-w-0 flex-1">
          {isAvailable && (
            <>
              <ToastTitle className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground leading-tight">
                <Download className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{t("settings.updateAvailable") || "Update Available"}</span>
              </ToastTitle>
              <ToastDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate max-w-full">
                {t("settings.newVersion") || "Version"} {updateInfo?.version || ""} {t("settings.isReadyToDownload") || "is ready to download."}
              </ToastDescription>
            </>
          )}

          {isDownloading && (
            <>
              <ToastTitle className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground leading-tight">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>{t("settings.downloadingUpdate") || "Downloading update..."}</span>
              </ToastTitle>
              <ToastDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate max-w-full">
                {t("settings.newVersion") || "Version"} {updateInfo?.version || ""}
              </ToastDescription>
            </>
          )}

          {isDownloaded && (
            <>
              <ToastTitle className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{t("settings.updateDownloaded") || "Update Ready to Install"}</span>
              </ToastTitle>
              <ToastDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate max-w-full">
                {t("settings.restartToInstallDesc") || "Restart Luno Note to install the latest version."}
              </ToastDescription>
            </>
          )}

          {isError && (
            <>
              <ToastTitle className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-destructive leading-tight">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{t("settings.updateError") || "Update Failed"}</span>
              </ToastTitle>
              <ToastDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate max-w-full">
                {errorMessage || t("settings.downloadFailed") || "Download failed. Please try again."}
              </ToastDescription>
            </>
          )}
        </div>

        {/* Action Button: Matches trash undo button style (<ToastAction>) */}
        {isAvailable && (
          <ToastAction
            altText={t("settings.downloadUpdate") || "Update"}
            onClick={() => {
              downloadUpdate();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-transparent gap-1.5 shadow-2xs font-medium cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t("settings.updateNow") || t("settings.downloadUpdate") || "Update"}</span>
          </ToastAction>
        )}

        {isDownloading && (
          <div className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/60 px-2.5 text-xs font-semibold text-foreground shadow-2xs">
            <span>{progress?.percent ?? 0}%</span>
          </div>
        )}

        {isDownloaded && (
          <ToastAction
            altText={t("settings.installAndRestart") || "Restart & Install"}
            onClick={() => {
              quitAndInstall();
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-transparent gap-1.5 shadow-2xs font-medium cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t("settings.installAndRestart") || "Restart"}</span>
          </ToastAction>
        )}

        {isError && (
          <ToastAction
            altText="Retry"
            onClick={() => {
              downloadUpdate();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-transparent gap-1.5 shadow-2xs font-medium cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </ToastAction>
        )}
      </div>

      {/* Show download progress if downloading - EXACT SAME AS ABOUT LUNO! */}
      {isDownloading && progress && (
        <div className="pt-2 border-t border-border/30 space-y-1.5 w-full">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("settings.downloadingUpdate") || "Downloading..."}</span>
            <span className="font-semibold text-foreground">{progress.percent}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      <ToastClose onClick={dismissToast} />
    </Toast>
  );
}
