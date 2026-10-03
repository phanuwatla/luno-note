import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { AppUpdateToastItem } from "./AppUpdateToastItem";
import { useAppUpdate, resetUpdateStoreForTesting } from "@/hooks/useAppUpdate";
import { AppSettingsProvider } from "@/hooks/useAppSettings";

// Mock electronAPI
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

describe("AppUpdateToastItem Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUpdateStoreForTesting();
    (window as any).electronAPI = mockElectronAPI;
  });

  function renderWithToastProvider() {
    return render(
      <AppSettingsProvider>
        <ToastProvider>
          <AppUpdateToastItem />
          <ToastViewport />
        </ToastProvider>
      </AppSettingsProvider>
    );
  }

  it("does not render when no update is available or showToast is false", () => {
    const { container } = renderWithToastProvider();
    expect(container.querySelector('[data-state]')).toBeNull();
  });

  it("does not render toast when remote version is equal to current app version (1.3.3 vs 1.3.3)", async () => {
    mockElectronAPI.getAppVersion.mockResolvedValue("1.3.3");
    let onAvailableCallback: any;
    mockElectronAPI.onUpdateAvailable.mockImplementation((cb: any) => {
      onAvailableCallback = cb;
      return () => {};
    });

    function TestComponent() {
      useAppUpdate();
      return (
        <ToastProvider>
          <AppUpdateToastItem />
          <ToastViewport />
        </ToastProvider>
      );
    }

    const { container } = render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    // Simulate update-available event with same version as app
    await act(async () => {
      if (onAvailableCallback) {
        onAvailableCallback({
          version: "1.3.3",
          releaseDate: "2026-10-03",
        });
      }
    });

    // Toast should NOT render
    expect(container.querySelector('[data-state]')).toBeNull();
    expect(screen.queryByText(/Update Available|มีเวอร์ชันใหม่อัปเดต/i)).toBeNull();
  });

  it("renders update available toast with update button when update is available", async () => {
    let onAvailableCallback: any;
    mockElectronAPI.onUpdateAvailable.mockImplementation((cb: any) => {
      onAvailableCallback = cb;
      return () => {};
    });

    function TestComponent() {
      useAppUpdate();
      return (
        <ToastProvider>
          <AppUpdateToastItem />
          <ToastViewport />
        </ToastProvider>
      );
    }

    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    // Simulate update-available event
    await act(async () => {
      if (onAvailableCallback) {
        onAvailableCallback({
          version: "1.4.0",
          releaseDate: "2026-10-03",
        });
      }
    });

    // Check that toast shows update available and version
    expect(screen.getByText(/Update Available|มีเวอร์ชันใหม่อัปเดต/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.4\.0/)).toBeInTheDocument();

    // Check that the Update action button is rendered
    const updateButton = screen.getByRole("button", { name: /Update|อัปเดต|Download Update|ดาวน์โหลดอัปเดต/i });
    expect(updateButton).toBeInTheDocument();

    // Clicking update button should call electronAPI.downloadUpdate
    mockElectronAPI.downloadUpdate.mockResolvedValue({ success: true });
    await act(async () => {
      fireEvent.click(updateButton);
    });

    expect(mockElectronAPI.downloadUpdate).toHaveBeenCalled();
  });

  it("renders progress bar and percent during downloading state", async () => {
    let onProgressCallback: any;
    mockElectronAPI.onUpdateDownloadProgress.mockImplementation((cb: any) => {
      onProgressCallback = cb;
      return () => {};
    });

    function TestComponent() {
      useAppUpdate();
      return (
        <ToastProvider>
          <AppUpdateToastItem />
          <ToastViewport />
        </ToastProvider>
      );
    }

    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    // Simulate download progress
    await act(async () => {
      if (onProgressCallback) {
        onProgressCallback({
          percent: 54,
          bytesPerSecond: 1024000,
          transferred: 5400000,
          total: 10000000,
        });
      }
    });

    // Verify progress text and percentage
    expect(screen.getAllByText(/Downloading update|กำลังดาวน์โหลดอัปเดต/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/54%/i).length).toBeGreaterThan(0);
  });

  it("renders restart button when update is downloaded", async () => {
    let onDownloadedCallback: any;
    mockElectronAPI.onUpdateDownloaded.mockImplementation((cb: any) => {
      onDownloadedCallback = cb;
      return () => {};
    });

    function TestComponent() {
      useAppUpdate();
      return (
        <ToastProvider>
          <AppUpdateToastItem />
          <ToastViewport />
        </ToastProvider>
      );
    }

    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    // Simulate downloaded event
    await act(async () => {
      if (onDownloadedCallback) {
        onDownloadedCallback({
          version: "1.4.0",
        });
      }
    });

    // Check that toast shows update downloaded
    expect(screen.getByText(/Update Ready to Install|ดาวน์โหลดเสร็จสมบูรณ์/i)).toBeInTheDocument();

    // Check restart button
    const restartButton = screen.getByRole("button", { name: /Restart|รีสตาร์ต/i });
    expect(restartButton).toBeInTheDocument();

    // Clicking restart calls quitAndInstallUpdate
    await act(async () => {
      fireEvent.click(restartButton);
    });

    expect(mockElectronAPI.quitAndInstallUpdate).toHaveBeenCalled();
  });

  it("renders error state with black text title and red icon", async () => {
    let onErrorCallback: any;
    mockElectronAPI.onUpdateError.mockImplementation((cb: any) => {
      onErrorCallback = cb;
      return () => {};
    });

    function TestComponent() {
      const { setShowToast } = useAppUpdate();
      return (
        <ToastProvider>
          <button type="button" onClick={() => setShowToast(true)}>Show Toast</button>
          <AppUpdateToastItem />
          <ToastViewport />
        </ToastProvider>
      );
    }

    render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    // Make toast visible
    act(() => {
      screen.getByText("Show Toast").click();
    });

    // Simulate error event
    await act(async () => {
      if (onErrorCallback) {
        onErrorCallback(new Error("Network connection error"));
      }
    });

    // Check title element
    const titleElement = screen.getByText(/Update Check Failed|การตรวจสอบอัปเดตล้มเหลว/i).closest('[class*="font-bold"]');
    expect(titleElement).not.toBeNull();
    // Title text class must have text-foreground (black/standard), NOT text-destructive
    expect(titleElement?.className).toContain("text-foreground");
    expect(titleElement?.className).not.toContain("text-destructive");

    // Icon inside title must have text-destructive (red)
    const icon = titleElement?.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("class")).toContain("text-destructive");

    // Retry button is present
    const retryButton = screen.getByRole("button", { name: /Retry|ลองใหม่/i });
    expect(retryButton).toBeInTheDocument();
  });
});
