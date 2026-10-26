import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsTabView from "./SettingsTabView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";

// Polyfill localStorage for Node/JSDOM
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => { storageMap.set(key, String(val)); },
  removeItem: (key: string) => { storageMap.delete(key); },
  clear: () => { storageMap.clear(); },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  get length() { return storageMap.size; },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("SettingsTabView - User Profile & Display Name", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).electronAPI;
  });

  it("shows OS username as placeholder when custom userName is not set", async () => {
    (window as any).electronAPI = {
      getOsUserInfo: vi.fn().mockResolvedValue({ username: "LENOVO_HOST" }),
    };

    render(
      <AppSettingsProvider>
        <SettingsTabView initialCategory="general" />
      </AppSettingsProvider>
    );

    const input = await screen.findByPlaceholderText("LENOVO_HOST");
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("shows custom userName and allows resetting it back to default", async () => {
    localStorage.setItem(
      "notes-app-settings",
      JSON.stringify({ userName: "AliceCustom" })
    );

    (window as any).electronAPI = {
      getOsUserInfo: vi.fn().mockResolvedValue({ username: "LENOVO_HOST" }),
    };

    render(
      <AppSettingsProvider>
        <SettingsTabView initialCategory="general" />
      </AppSettingsProvider>
    );

    const input = await screen.findByDisplayValue("AliceCustom");
    expect(input).toBeInTheDocument();

    // Reset button should be visible when userName is set
    const resetButtons = screen.getAllByRole("button");
    const resetBtn = resetButtons.find((btn) => btn.querySelector("svg.lucide-rotate-ccw"));
    expect(resetBtn).toBeDefined();

    if (resetBtn) {
      fireEvent.click(resetBtn);
    }

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("");
      expect(input).toHaveAttribute("placeholder", "LENOVO_HOST");
    });
  });
});
