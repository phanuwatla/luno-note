import { useState, useEffect, useCallback, useRef } from "react";
import type { UpdateInfo, UpdateProgress } from "@/vite-env";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export function useAppUpdate() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAppVersion, setCurrentAppVersion] = useState<string>("1.1.1");
  const manualCheckRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    if (window.electronAPI.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => {
        if (v) setCurrentAppVersion(v);
      }).catch(() => {});
    }

    const unsubs: Array<() => void> = [];

    if (window.electronAPI.onUpdateChecking) {
      const unsub = window.electronAPI.onUpdateChecking(() => {
        setStatus("checking");
        setErrorMessage(null);
      });
      if (unsub) unsubs.push(unsub);
    }

    if (window.electronAPI.onUpdateAvailable) {
      const unsub = window.electronAPI.onUpdateAvailable((info) => {
        setStatus("available");
        setUpdateInfo(info);
        setErrorMessage(null);
        if (manualCheckRef.current) {
          toast({
            title: t("settings.updateAvailable") || "Update Available",
            description: `${t("settings.newVersion") || "Version"} ${info.version} ${t("settings.isReadyToDownload") || "is available."}`,
          });
        }
      });
      if (unsub) unsubs.push(unsub);
    }

    if (window.electronAPI.onUpdateNotAvailable) {
      const unsub = window.electronAPI.onUpdateNotAvailable(() => {
        setStatus("not-available");
        setErrorMessage(null);
        if (manualCheckRef.current) {
          toast({
            title: t("settings.updateNotAvailable") || "Up to Date",
            description: t("settings.latestVersionInstalled") || "You are using the latest version of Luno Note.",
          });
        }
      });
      if (unsub) unsubs.push(unsub);
    }

    if (window.electronAPI.onUpdateDownloadProgress) {
      const unsub = window.electronAPI.onUpdateDownloadProgress((prog) => {
        setStatus("downloading");
        setProgress(prog);
      });
      if (unsub) unsubs.push(unsub);
    }

    if (window.electronAPI.onUpdateDownloaded) {
      const unsub = window.electronAPI.onUpdateDownloaded(() => {
        setStatus("downloaded");
        toast({
          title: t("settings.updateDownloaded") || "Update Ready",
          description: t("settings.restartToInstallDesc") || "Restart the application to install the update.",
        });
      });
      if (unsub) unsubs.push(unsub);
    }

    if (window.electronAPI.onUpdateError) {
      const unsub = window.electronAPI.onUpdateError((err) => {
        setStatus("error");
        setErrorMessage(err.message || "Update check failed");
        if (manualCheckRef.current) {
          toast({
            variant: "destructive",
            title: t("settings.updateError") || "Update Error",
            description: err.message || "Failed to check for updates.",
          });
        }
      });
      if (unsub) unsubs.push(unsub);
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [t]);

  const checkForUpdates = useCallback(async (isManual = true) => {
    if (typeof window === "undefined" || !window.electronAPI?.checkForUpdates) {
      toast({
        title: t("settings.updateNotSupported") || "Desktop Only",
        description: t("settings.updateDesktopOnlyDesc") || "Update checking is only available in the desktop application.",
      });
      return;
    }

    manualCheckRef.current = isManual;
    setStatus("checking");
    setErrorMessage(null);
    setProgress(null);

    try {
      const res = await window.electronAPI.checkForUpdates();
      if (!res.success) {
        setStatus("error");
        setErrorMessage(res.error || "Failed to check for updates");
        if (isManual) {
          toast({
            variant: "destructive",
            title: t("settings.updateError") || "Update Error",
            description: res.error || "Failed to check for updates.",
          });
        }
      } else if (res.isDev) {
        setStatus("not-available");
        if (isManual) {
          toast({
            title: t("settings.devModeTitle") || "Development Mode",
            description: t("settings.devModeDesc") || "You are running in development mode. Updates are active in packaged releases.",
          });
        }
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Unexpected error");
      if (isManual) {
        toast({
          variant: "destructive",
          title: t("settings.updateError") || "Update Error",
          description: err?.message || "Could not reach update server.",
        });
      }
    }
  }, [t]);

  const downloadUpdate = useCallback(async () => {
    if (!window.electronAPI?.downloadUpdate) return;
    setStatus("downloading");
    try {
      const res = await window.electronAPI.downloadUpdate();
      if (!res.success) {
        setStatus("error");
        setErrorMessage(res.error || "Failed to download update");
        toast({
          variant: "destructive",
          title: t("settings.downloadFailed") || "Download Failed",
          description: res.error || "Unable to download update package.",
        });
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Download error");
    }
  }, [t]);

  const quitAndInstall = useCallback(async () => {
    if (!window.electronAPI?.quitAndInstallUpdate) return;
    await window.electronAPI.quitAndInstallUpdate();
  }, []);

  return {
    status,
    updateInfo,
    progress,
    errorMessage,
    currentAppVersion,
    isChecking: status === "checking",
    isDownloading: status === "downloading",
    isDownloaded: status === "downloaded",
    isAvailable: status === "available",
    isNotAvailable: status === "not-available",
    checkForUpdates,
    downloadUpdate,
    quitAndInstall,
  };
}
