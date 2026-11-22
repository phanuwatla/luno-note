import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppUpdate, resetUpdateStoreForTesting, isNewerVersion, formatUpdateError } from "./useAppUpdate";
import React from "react";
import { AppSettingsProvider } from "./useAppSettings";

const mockElectronAPI = {
  getAppVersion: vi.fn().mockResolvedValue("1.3.3"),
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  quitAndInstallUpdate: vi.fn(),
  onUpdateChecking: vi.fn(),
  onUpdateAvailable: vi.fn(),
  onUpdateNotAvailable: vi.fn(),
  onUpdateDownloadProgress: vi.fn(),
  onUpdateDownloaded: vi.fn(),
  onUpdateError: vi.fn(),
};

describe("isNewerVersion helper", () => {
  it("correctly identifies newer, equal, and older versions", () => {
    expect(isNewerVersion("1.3.3", "1.3.3")).toBe(false);
    expect(isNewerVersion("v1.3.3", "1.3.3")).toBe(false);
    expect(isNewerVersion("1.3.3", "v1.3.3")).toBe(false);
    expect(isNewerVersion("1.3.2", "1.3.3")).toBe(false);
    expect(isNewerVersion("1.3.4", "1.3.3")).toBe(true);
    expect(isNewerVersion("v1.4.0", "1.3.3")).toBe(true);
    expect(isNewerVersion("2.0.0", "1.9.9")).toBe(true);
    expect(isNewerVersion("", "1.3.3")).toBe(false);
    expect(isNewerVersion(null, "1.3.3")).toBe(false);
    expect(isNewerVersion("1.3.3", null)).toBe(false);
  });
});

describe("useAppUpdate Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUpdateStoreForTesting();
    (window as any).electronAPI = mockElectronAPI;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppSettingsProvider>{children}</AppSettingsProvider>
  );

  it("initializes with idle status and correct default values", () => {
    const { result } = renderHook(() => useAppUpdate(), { wrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.isDownloaded).toBe(false);
    expect(result.current.showToast).toBe(false);
  });

  it("does NOT mark as available when remote version is equal to current app version (e.g. 1.3.3 vs 1.3.3)", async () => {
    let onAvailableCb: any;
    mockElectronAPI.onUpdateAvailable.mockImplementation((cb: any) => {
      onAvailableCb = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      if (onAvailableCb) {
        onAvailableCb({
          version: "1.3.3",
          releaseDate: "2026-10-03",
        });
      }
    });

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.showToast).toBe(false);
    expect(result.current.status).toBe("not-available");
  });

  it("handles onUpdateAvailable event properly when remote version is newer", async () => {
    let onAvailableCb: any;
    mockElectronAPI.onUpdateAvailable.mockImplementation((cb: any) => {
      onAvailableCb = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      if (onAvailableCb) {
        onAvailableCb({
          version: "1.5.0",
          releaseDate: "2026-10-03",
        });
      }
    });

    expect(result.current.status).toBe("available");
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.updateInfo?.version).toBe("1.5.0");
    expect(result.current.showToast).toBe(true);
  });

  it("handles dismissToast properly", async () => {
    let onAvailableCb: any;
    mockElectronAPI.onUpdateAvailable.mockImplementation((cb: any) => {
      onAvailableCb = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      if (onAvailableCb) {
        onAvailableCb({ version: "1.5.0" });
      }
    });

    expect(result.current.showToast).toBe(true);

    act(() => {
      result.current.dismissToast();
    });

    expect(result.current.showToast).toBe(false);
  });

  it("syncs state across multiple hook instances", async () => {
    let onAvailableCb: any;
    mockElectronAPI.onUpdateAvailable.mockImplementation((cb: any) => {
      onAvailableCb = cb;
      return () => {};
    });

    const { result: instance1 } = renderHook(() => useAppUpdate(), { wrapper });
    const { result: instance2 } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      if (onAvailableCb) {
        onAvailableCb({ version: "1.5.0" });
      }
    });

    expect(instance1.current.status).toBe("available");
    expect(instance2.current.status).toBe("available");
    expect(instance1.current.showToast).toBe(true);
    expect(instance2.current.showToast).toBe(true);
  });

  it("does NOT show toast when checking manually via About Luno (isManual = true)", async () => {
    mockElectronAPI.checkForUpdates.mockResolvedValue({
      success: true,
      isUpdateAvailable: true,
      updateInfo: { version: "1.4.0", releaseDate: "2026-10-03" },
      currentVersion: "1.3.3",
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      await result.current.checkForUpdates(true);
    });

    expect(result.current.status).toBe("available");
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.showToast).toBe(false);
  });

  it("shows toast when checking automatically in background (isManual = false) and newer update is found", async () => {
    mockElectronAPI.checkForUpdates.mockResolvedValue({
      success: true,
      isUpdateAvailable: true,
      updateInfo: { version: "1.4.0", releaseDate: "2026-10-03" },
      currentVersion: "1.3.3",
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      await result.current.checkForUpdates(false);
    });

    expect(result.current.status).toBe("available");
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.showToast).toBe(true);
  });

  it("classifies wrapped GitHubProvider network and rate-limit errors accurately instead of 404", () => {
    const tMock = (k: string) => k;
    expect(
      formatUpdateError(
        "Unable to find latest version on GitHub (https://github.com/phanuwatla/luno-note/releases/latest): net::ERR_CONNECTION_RESET",
        tMock
      )
    ).toBe("settings.updateNetworkErrorDesc");
    expect(
      formatUpdateError(
        "Unable to find latest version on GitHub (https://github.com/phanuwatla/luno-note/releases/latest): HttpError: 429",
        tMock
      )
    ).toBe("appUpdateErrors.rateLimit");
    expect(
      formatUpdateError(
        "Cannot find latest.yml in the latest release artifacts (404)",
        tMock
      )
    ).toBe("settings.updateNotFoundDesc");
  });

  it("handles fallback downloadUpdate opening browser externally without getting stuck in downloading state", async () => {
    mockElectronAPI.checkForUpdates.mockResolvedValue({
      success: true,
      isUpdateAvailable: true,
      updateInfo: {
        version: "9.9.9",
        releaseDate: "2026-10-27",
        downloadUrl: "https://github.com/phanuwatla/luno-note/releases/download/v9.9.9/luno-note-setup-9.9.9.exe",
        isFallback: true,
      },
      currentVersion: "1.3.5",
    });
    mockElectronAPI.downloadUpdate.mockResolvedValue({
      success: true,
      openedExternally: true,
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      await result.current.checkForUpdates(false);
    });
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.showToast).toBe(true);

    await act(async () => {
      await result.current.downloadUpdate(true);
    });
    expect(result.current.status).toBe("available");
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.showToast).toBe(false);
  });
});
