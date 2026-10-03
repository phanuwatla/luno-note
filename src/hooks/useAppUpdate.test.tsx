import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppUpdate, resetUpdateStoreForTesting } from "./useAppUpdate";
import React from "react";
import { AppSettingsProvider } from "./useAppSettings";

const mockElectronAPI = {
  getAppVersion: vi.fn().mockResolvedValue("1.3.2"),
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

  it("handles onUpdateAvailable event properly", async () => {
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
    // status should still remain available so settings page can see it
    expect(result.current.status).toBe("available");
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
});
