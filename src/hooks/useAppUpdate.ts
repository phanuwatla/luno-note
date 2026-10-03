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

export function isNewerVersion(
  remoteVersion: string | undefined | null,
  currentVersion: string | undefined | null
): boolean {
  if (!remoteVersion || !currentVersion) return false;

  const clean = (v: string) => String(v).replace(/^v/i, "").trim();
  const vRemote = clean(remoteVersion);
  const vCurrent = clean(currentVersion);

  if (!vRemote || !vCurrent || vRemote === vCurrent) return false;

  const remoteParts = vRemote.split(/[-+]/)[0].split(".").map((p) => parseInt(p, 10) || 0);
  const currentParts = vCurrent.split(/[-+]/)[0].split(".").map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(remoteParts.length, currentParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = remoteParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return false;
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
      const curVer = storeState.currentAppVersion || APP_VERSION;
      if (!isNewerVersion(info?.version, curVer)) {
        updateStore({
          status: "not-available",
          updateInfo: null,
          showToast: false,
          errorMessage: null,
        });
        return;
      }
      updateStore({
        status: "available",
        updateInfo: info,
        errorMessage: null,
        showToast: !storeState.manualCheck,
      });
    });
  }

  if (window.electronAPI.onUpdateNotAvailable) {
    window.electronAPI.onUpdateNotAvailable(() => {
      const wasManual = storeState.manualCheck;
      updateStore({ status: "not-available", updateInfo: null, showToast: false, errorMessage: null });
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
        showToast: !storeState.manualCheck,
      });
    });
  }

  if (window.electronAPI.onUpdateDownloaded) {
    window.electronAPI.onUpdateDownloaded(() => {
      updateStore({
        status: "downloaded",
        showToast: !storeState.manualCheck,
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
        showToast: !wasManual && storeState.showToast,
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
    showToast: isManual ? false : storeState.showToast,
  });

  try {
    const res = await window.electronAPI.checkForUpdates();
    const curVer = res?.currentVersion || storeState.currentAppVersion || APP_VERSION;
    const remoteVer = res?.updateInfo?.version;
    const isNewer = (res?.isUpdateAvailable ?? true) && isNewerVersion(remoteVer, curVer);

    if (!res.success) {
      const friendlyMsg = formatUpdateError(res.error, tr);
      updateStore({
        status: "error",
        errorMessage: friendlyMsg,
        showToast: false,
      });
      if (isManual) {
        toast({
          variant: "destructive",
          title: tr("settings.updateError") || "Update Error",
          description: friendlyMsg,
        });
      }
    } else if (res.isDev) {
      if (isNewer && res.updateInfo) {
        updateStore({
          status: "available",
          updateInfo: res.updateInfo,
          showToast: !isManual,
        });
      } else {
        updateStore({ status: "not-available", updateInfo: null, showToast: false });
        if (isManual) {
          toast({
            title: tr("settings.devModeTitle") || "Development Mode",
            description: tr("settings.devModeDesc") || "You are running in development mode. Updates are active in packaged releases.",
          });
        }
      }
    } else if (isNewer && res.updateInfo) {
      updateStore({
        status: "available",
        updateInfo: res.updateInfo,
        showToast: !isManual,
      });
    } else {
      updateStore({
        status: "not-available",
        updateInfo: null,
        showToast: false,
      });
      if (isManual) {
        toast({
          title: tr("settings.updateNotAvailable") || "Up to Date",
          description: tr("settings.latestVersionInstalled") || "You are using the latest version of Luno Note.",
        });
      }
    }
  } catch (err: any) {
    const friendlyMsg = formatUpdateError(err?.message, tr);
    updateStore({
      status: "error",
      errorMessage: friendlyMsg,
      showToast: false,
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

async function performDownloadUpdate(fromToast = false, t?: (key: string) => string) {
  ensureIpcInitialized();
  if (t) setUpdateTranslator(t);
  const tr = t || tTranslator || ((k: string) => k);

  if (!window.electronAPI?.downloadUpdate) return;
  updateStore({
    status: "downloading",
    manualCheck: !fromToast,
    showToast: fromToast,
    errorMessage: null,
  });
  try {
    const res = await window.electronAPI.downloadUpdate();
    if (!res.success) {
      const err = res.error || "Failed to download update";
      updateStore({
        status: "error",
        errorMessage: err,
        showToast: fromToast,
      });
      if (!fromToast) {
        toast({
          variant: "destructive",
          title: tr("settings.downloadFailed") || "Download Failed",
          description: err,
        });
      }
    }
  } catch (err: any) {
    const errMsg = err?.message || "Download error";
    updateStore({
      status: "error",
      errorMessage: errMsg,
      showToast: fromToast,
    });
    if (!fromToast) {
      toast({
        variant: "destructive",
        title: tr("settings.downloadFailed") || "Download Failed",
        description: errMsg,
      });
    }
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
    (isManual: boolean | unknown = true) => {
      const manual = isManual === false ? false : true;
      return performCheckForUpdates(manual, t);
    },
    [t]
  );

  const downloadUpdate = useCallback(
    (fromToast: boolean | unknown = false) => {
      const isFromToast = fromToast === true;
      return performDownloadUpdate(isFromToast, t);
    },
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

  const curVer = current.currentAppVersion || APP_VERSION;
  const isActuallyAvailable = current.status === "available" && isNewerVersion(current.updateInfo?.version, curVer);
  const shouldShowToast = current.showToast && (isActuallyAvailable || current.status === "downloading" || current.status === "downloaded" || (current.status === "error" && current.errorMessage !== null));

  return {
    status: current.status,
    updateInfo: current.updateInfo,
    progress: current.progress,
    errorMessage: current.errorMessage,
    currentAppVersion: current.currentAppVersion,
    showToast: shouldShowToast,
    isChecking: current.status === "checking",
    isDownloading: current.status === "downloading",
    isDownloaded: current.status === "downloaded",
    isAvailable: isActuallyAvailable,
    isNotAvailable: current.status === "not-available" || (!isActuallyAvailable && current.status !== "downloading" && current.status !== "downloaded" && current.status !== "checking"),
    checkForUpdates,
    downloadUpdate,
    quitAndInstall,
    dismissToast,
    setShowToast,
  };
}
