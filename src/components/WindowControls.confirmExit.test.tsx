import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WindowControls from "./WindowControls";
import { AppSettingsProvider } from "@/hooks/useAppSettings";

describe("WindowControls Confirm Before Exit", () => {
  let mockClose: ReturnType<typeof vi.fn>;
  const storageMap = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, String(value));
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
    clear: () => {
      storageMap.clear();
    },
    key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
    get length() {
      return storageMap.size;
    },
  };

  beforeEach(() => {
    storageMap.clear();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    mockClose = vi.fn();
    window.electronAPI = {
      isElectron: true,
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: mockClose,
      isMaximized: vi.fn().mockResolvedValue(false),
    };
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    storageMap.clear();
  });

  it("closes immediately when confirmBeforeExit is false (default)", async () => {
    render(
      <AppSettingsProvider>
        <WindowControls />
      </AppSettingsProvider>
    );

    const closeBtn = screen.getByRole("button", { name: /close|ปิด/i });
    fireEvent.click(closeBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Exit Luno Note\?|ปิดโปรแกรม Luno Note\?/i)).toBeNull();
  });

  it("shows confirmation dialog and prevents immediate exit when confirmBeforeExit is true", async () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({ confirmBeforeExit: true })
    );

    render(
      <AppSettingsProvider>
        <WindowControls />
      </AppSettingsProvider>
    );

    const closeBtn = screen.getByRole("button", { name: /close|ปิด/i });
    fireEvent.click(closeBtn);

    // Should NOT call electron close immediately
    expect(mockClose).not.toHaveBeenCalled();

    // Confirmation dialog should be visible
    expect(
      await screen.findByText(/Exit Luno Note\?|ปิดโปรแกรม Luno Note\?/i)
    ).toBeInTheDocument();

    // Cancel exit
    const cancelBtn = screen.getByRole("button", { name: /cancel|ยกเลิก/i });
    fireEvent.click(cancelBtn);

    expect(mockClose).not.toHaveBeenCalled();
  });

  it("exits when user confirms in the dialog", async () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({ confirmBeforeExit: true })
    );

    render(
      <AppSettingsProvider>
        <WindowControls />
      </AppSettingsProvider>
    );

    const closeBtn = screen.getByRole("button", { name: /close|ปิด/i });
    fireEvent.click(closeBtn);

    // Verify dialog opened
    expect(
      await screen.findByText(/Exit Luno Note\?|ปิดโปรแกรม Luno Note\?/i)
    ).toBeInTheDocument();

    // Click confirm Exit button inside dialog
    const confirmExitBtn = screen.getByRole("button", { name: /^Exit$|^ปิดโปรแกรม$/i });
    fireEvent.click(confirmExitBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("triggers exit confirmation on Alt+F4 or Ctrl+Q when confirmBeforeExit is true", async () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({ confirmBeforeExit: true })
    );

    render(
      <AppSettingsProvider>
        <WindowControls />
      </AppSettingsProvider>
    );

    fireEvent.keyDown(window, { key: "F4", altKey: true });

    expect(
      await screen.findByText(/Exit Luno Note\?|ปิดโปรแกรม Luno Note\?/i)
    ).toBeInTheDocument();

    expect(mockClose).not.toHaveBeenCalled();
  });
});
