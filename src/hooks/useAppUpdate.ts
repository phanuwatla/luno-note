import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { UpdateInfo, UpdateProgress } from "@/vite-env";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_VERSION } from "@/lib/appVersion";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateStoreState {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  errorMessage: string | null;
  currentAppVersion: string;
  showToast: boolean;
  manualCheck: boolean;
}

let storeState: UpdateStoreState = {
  status: "idle",
  updateInfo: null,
  progress: null,
  errorMessage: null,
  currentAppVersion: APP_VERSION,
  showToast: false,
  manualCheck: false,
};

const listeners = new Set<() => void>();

function updateStore(partial: Partial<UpdateStoreState>) {
  storeState = { ...storeState, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): UpdateStoreState {
  return storeState;
}

function getServerSnapshot(): UpdateStoreState {
  return storeState;
}

let tTranslator: ((key: string) => string) | null = null;

export function setUpdateTranslator(t: (key: string) => string) {
  tTranslator = t;
}

function formatUpdateError(rawMsg: string | undefined | null, t?: ((key: string) => string) | null): string {
  const tr = t || tTranslator || ((k: string) => k);
  if (!rawMsg) return tr("settings.updateError") || "Update Check Failed";
  const str = String(rawMsg);
  if (str.includes("404") || str.includes("latest.yml") || str.includes("releases/latest")) {
    return tr("settings.updateNotFoundDesc") || "No published release found on GitHub (404). Please ensure a Release is published and the repository is public.";
  }
  if (
    str.includes("ERR_INTERNET_DISCONNECTED") ||
    str.includes("ENOTFOUND") ||
    str.includes("ECONNREFUSED") ||
    str.includes("ETIMEDOUT") ||
    str.includes("fetch failed")
  ) {
    return tr("settings.updateNetworkErrorDesc") || "Could not connect to the update server. Please check your internet connection.";
  }
  if (str.includes("403") || str.includes("rate limit")) {
    return "GitHub API rate limit exceeded or access forbidden.";
  }
  if (str.length > 120) {
    return str.slice(0, 120) + "...";
  }
  return str;
}

let ipcInitialized = false;

export function resetUpdateStoreForTesting() {
  ipcInitialized = false;
  storeState = {
    status: "idle",
    updateInfo: null,
    progress: null,
    errorMessage: null,
    currentAppVersion: APP_VERSION,
    showToast: false,
    manualCheck: false,
  };
}

function ensureIpcInitialized() {
  if (ipcInitialized || typeof window === "undefined" || !window.electronAPI) return;
  ipcInitialized = true;

  if (window.electronAPI.getAppVersion) {
    window.electronAPI.getAppVersion().then((v) => {
      if (v) updateStore({ currentAppVersion: v });
    }).catch(() => {});
  }

  if (window.electronAPI.onUpdateChecking) {
    window.electronAPI.onUpdateChecking(() => {
      updateStore({ status: "checking", errorMessage: null });
    });
  }

  if (window.electronAPI.onUpdateAvailable) {
    window.electronAPI.onUpdateAvailable((info) => {
      updateStore({
        status: "available",
        updateInfo: info,
        errorMessage: null,
        showToast: true,
      });
    });
  }

  if (window.electronAPI.onUpdateNotAvailable) {
    window.electronAPI.onUpdateNotAvailable(() => {
      const wasManual = storeState.manualCheck;
      updateStore({ status: "not-available", errorMessage: null });
      if (wasManual) {
        const tr = tTranslator || ((k: string) => k);
        toast({
          title: tr("settings.updateNotAvailable") || "Up to Date",
          description: tr("settings.latestVersionInstalled") || "You are using the latest version of Luno Note.",
        });
      }
    });
  }

  if (window.electronAPI.onUpdateDownloadProgress) {
    window.electronAPI.onUpdateDownloadProgress((prog) => {
      updateStore({
        status: "downloading",
        progress: prog,
        showToast: true,
      });
    });
  }

  if (window.electronAPI.onUpdateDownloaded) {
    window.electronAPI.onUpdateDownloaded(() => {
      updateStore({
        status: "downloaded",
        showToast: true,
      });
    });
  }

  if (window.electronAPI.onUpdateError) {
    window.electronAPI.onUpdateError((err) => {
      const friendlyMsg = formatUpdateError(err?.message, tTranslator);
      const wasManual = storeState.manualCheck;
      updateStore({
        status: "error",
        errorMessage: friendlyMsg,
      });
      if (wasManual) {
        const tr = tTranslator || ((k: string) => k);
        toast({
          variant: "destructive",
          title: tr("settings.updateError") || "Update Error",
          description: friendlyMsg,
        });
      }
    });
  }
}

async function performCheckForUpdates(isManual = true, t?: (key: string) => string) {
  ensureIpcInitialized();
  if (t) setUpdateTranslator(t);
  const tr = t || tTranslator || ((k: string) => k);

  if (typeof window === "undefined" || !window.electronAPI?.checkForUpdates) {
    if (isManual) {
      toast({
        title: tr("settings.updateNotSupported") || "Desktop Only",
        description: tr("settings.updateDesktopOnlyDesc") || "Update checking is only available in the desktop application.",
      });
    }
    return;
  }

  updateStore({
    status: "checking",
    errorMessage: null,
    progress: null,
    manualCheck: isManual,
  });

  try {
    const res = await window.electronAPI.checkForUpdates();
    if (!res.success) {
      const friendlyMsg = formatUpdateError(res.error, tr);
      updateStore({
        status: "error",
        errorMessage: friendlyMsg,
      });
      if (isManual) {
        toast({
          variant: "destructive",
          title: tr("settings.updateError") || "Update Error",
          description: friendlyMsg,
        });
      }
    } else if (res.isDev) {
      if (res.updateInfo && res.updateInfo.version) {
        updateStore({
          status: "available",
          updateInfo: res.updateInfo,
          showToast: true,
        });
      } else {
        updateStore({ status: "not-available" });
        if (isManual) {
          toast({
            title: tr("settings.devModeTitle") || "Development Mode",
            description: tr("settings.devModeDesc") || "You are running in development mode. Updates are active in packaged releases.",
          });
        }
      }
    } else if (res.updateInfo && res.updateInfo.version) {
      updateStore({
        status: "available",
        updateInfo: res.updateInfo,
        showToast: true,
      });
    }
  } catch (err: any) {
    const friendlyMsg = formatUpdateError(err?.message, tr);
    updateStore({
      status: "error",
      errorMessage: friendlyMsg,
    });
    if (isManual) {
      toast({
        variant: "destructive",
        title: tr("settings.updateError") || "Update Error",
        description: friendlyMsg,
      });
    }
  }
}

async function performDownloadUpdate(t?: (key: string) => string) {
  ensureIpcInitialized();
  if (t) setUpdateTranslator(t);
  const tr = t || tTranslator || ((k: string) => k);

  if (!window.electronAPI?.downloadUpdate) return;
  updateStore({ status: "downloading", showToast: true, errorMessage: null });
  try {
    const res = await window.electronAPI.downloadUpdate();
    if (!res.success) {
      const err = res.error || "Failed to download update";
      updateStore({ status: "error", errorMessage: err });
      toast({
        variant: "destructive",
        title: tr("settings.downloadFailed") || "Download Failed",
        description: err,
      });
    }
  } catch (err: any) {
    const errMsg = err?.message || "Download error";
    updateStore({
      status: "error",
      errorMessage: errMsg,
    });
    toast({
      variant: "destructive",
      title: tr("settings.downloadFailed") || "Download Failed",
      description: errMsg,
    });
  }
}

async function performQuitAndInstall() {
  ensureIpcInitialized();
  if (!window.electronAPI?.quitAndInstallUpdate) return;
  await window.electronAPI.quitAndInstallUpdate();
}

function performDismissToast() {
  updateStore({ showToast: false });
}

function performSetShowToast(show: boolean) {
  updateStore({ showToast: show });
}

export function useAppUpdate() {
  const { t } = useTranslation();
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    setUpdateTranslator(t);
    ensureIpcInitialized();
  }, [t]);

  const checkForUpdates = useCallback(
    (isManual = true) => performCheckForUpdates(isManual, t),
    [t]
  );

  const downloadUpdate = useCallback(
    () => performDownloadUpdate(t),
    [t]
  );

  const quitAndInstall = useCallback(
    () => performQuitAndInstall(),
    []
  );

  const dismissToast = useCallback(
    () => performDismissToast(),
    []
  );

  const setShowToast = useCallback(
    (show: boolean) => performSetShowToast(show),
    []
  );

  return {
    status: current.status,
    updateInfo: current.updateInfo,
    progress: current.progress,
    errorMessage: current.errorMessage,
    currentAppVersion: current.currentAppVersion,
    showToast: current.showToast,
    isChecking: current.status === "checking",
    isDownloading: current.status === "downloading",
    isDownloaded: current.status === "downloaded",
    isAvailable: current.status === "available",
    isNotAvailable: current.status === "not-available",
    checkForUpdates,
    downloadUpdate,
    quitAndInstall,
    dismissToast,
    setShowToast,
  };
}
