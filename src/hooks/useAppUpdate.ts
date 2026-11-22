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

export function formatUpdateError(rawMsg: string | undefined | null, t?: ((key: string) => string) | null): string {
  const tr = t || tTranslator || ((k: string) => k);
  if (!rawMsg) return tr("settings.updateError");
  const str = String(rawMsg);
  const lower = str.toLowerCase();
  if (
    str.includes("ERR_INTERNET_DISCONNECTED") ||
    str.includes("ENOTFOUND") ||
    str.includes("ECONNREFUSED") ||
    str.includes("ECONNRESET") ||
    str.includes("ETIMEDOUT") ||
    str.includes("ERR_TIMED_OUT") ||
    str.includes("ERR_CONNECTION_") ||
    str.includes("ERR_NAME_NOT_RESOLVED") ||
    str.includes("ERR_NETWORK_") ||
    lower.includes("fetch failed") ||
    lower.includes("network error") ||
    lower.includes("socket hang up")
  ) {
    return tr("settings.updateNetworkErrorDesc");
  }
  if (str.includes("403") || str.includes("429") || lower.includes("rate limit")) {
    return tr("appUpdateErrors.rateLimit");
  }
  if (
    str.includes("404") ||
    str.includes("ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") ||
    str.includes("ERR_UPDATER_NO_PUBLISHED_VERSIONS") ||
    str.includes("Cannot find latest.yml")
  ) {
    return tr("settings.updateNotFoundDesc");
  }
  if (str.length > 120) {
    return str.slice(0, 120) + "...";
  }
  return str;
}

let ipcInitialized = false;
let checkInFlight = false;

export function resetUpdateStoreForTesting() {
  ipcInitialized = false;
  checkInFlight = false;
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
      if (checkInFlight) return;
      const wasManual = storeState.manualCheck;
      updateStore({ status: "not-available", updateInfo: null, showToast: false, errorMessage: null });
      if (wasManual) {
        const tr = tTranslator || ((k: string) => k);
        toast({
          title: tr("settings.updateNotAvailable"),
          description: tr("settings.latestVersionInstalled"),
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
      if (checkInFlight) return;
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
          title: tr("settings.updateError"),
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
        title: tr("settings.updateNotSupported"),
        description: tr("settings.updateDesktopOnlyDesc"),
      });
    }
    return;
  }

  checkInFlight = true;
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
    if (res?.currentVersion && res.currentVersion !== storeState.currentAppVersion) {
      updateStore({ currentAppVersion: res.currentVersion });
    }
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
          title: tr("settings.updateError"),
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
            title: tr("settings.devModeTitle"),
            description: tr("settings.devModeDesc"),
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
          title: tr("settings.updateNotAvailable"),
          description: tr("settings.latestVersionInstalled"),
        });
      }
    }
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err ?? "");
    const friendlyMsg = formatUpdateError(rawMsg, tr);
    updateStore({
      status: "error",
      errorMessage: friendlyMsg,
      showToast: false,
    });
    if (isManual) {
      toast({
        variant: "destructive",
        title: tr("settings.updateError"),
        description: friendlyMsg,
      });
    }
  } finally {
    checkInFlight = false;
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
    if (res.success && res.openedExternally) {
      updateStore({
        status: "available",
        showToast: false,
        errorMessage: null,
      });
      return;
    }
    if (!res.success) {
      const err = res.error || tr("settings.downloadFailed");
      updateStore({
        status: "error",
        errorMessage: err,
        showToast: fromToast,
      });
      if (!fromToast) {
        toast({
          variant: "destructive",
          title: tr("settings.downloadFailed"),
          description: err,
        });
      }
    }
  } catch (err: unknown) {
    const errMsg = (err instanceof Error ? err.message : String(err ?? "")) || tr("settings.downloadFailed");
    updateStore({
      status: "error",
      errorMessage: errMsg,
      showToast: fromToast,
    });
    if (!fromToast) {
      toast({
        variant: "destructive",
        title: tr("settings.downloadFailed"),
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
