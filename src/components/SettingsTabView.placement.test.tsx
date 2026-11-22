import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import SettingsTabView from "./SettingsTabView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => {
    storageMap.set(key, String(val));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  get length() {
    return storageMap.size;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("SettingsTabView - Single-Source Setting Placement", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).electronAPI;
  });

  it("renders Live Preview exclusively in Markdown settings (not duplicated in Editor)", () => {
    const { rerender } = render(
      <AppSettingsProvider>
        <SettingsTabView initialCategory="markdown" />
      </AppSettingsProvider>
    );

    expect(screen.getByTestId("markdown-reading-mode-live-preview-switch")).toBeInTheDocument();

    rerender(
      <AppSettingsProvider>
        <SettingsTabView initialCategory="editor" />
      </AppSettingsProvider>
    );

    expect(screen.queryByTestId("markdown-reading-mode-live-preview-switch")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reading-mode-live-preview-switch")).not.toBeInTheDocument();
  });

  it("renders Sidebar folder guide lines exclusively in Appearance settings (not in Editor)", () => {
    const { rerender } = render(
      <AppSettingsProvider>
        <SettingsTabView initialCategory="appearance" />
      </AppSettingsProvider>
    );

    expect(screen.getByTestId("sidebar-guide-lines-switch")).toBeInTheDocument();

    rerender(
      <AppSettingsProvider>
        <SettingsTabView initialCategory="editor" />
      </AppSettingsProvider>
    );

    expect(screen.queryByTestId("sidebar-guide-lines-switch")).not.toBeInTheDocument();
  });

  it("never duplicates any updateSetting(key) control across multiple categories in SettingsTabView.tsx", () => {
    const filePath = path.resolve(__dirname, "SettingsTabView.tsx");
    const source = fs.readFileSync(filePath, "utf-8");

    // Split JSX by category panels: `{safeActiveCategory === "<id>" && (`
    const categoryRegex = /\{safeActiveCategory === "([a-z]+)" &&/g;
    const matches: { id: string; index: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = categoryRegex.exec(source)) !== null) {
      matches.push({ id: match[1], index: match.index });
    }

    expect(matches.length).toBeGreaterThanOrEqual(10);

    const keyToCategories = new Map<string, Set<string>>();

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end =
        i + 1 < matches.length
          ? matches[i + 1].index
          : source.indexOf("Bottom Sticky Action Bar");
      const block = source.slice(start, end > start ? end : source.length);
      const settingKeyRegex = /updateSetting\(\s*"([^"]+)"/g;
      let keyMatch: RegExpExecArray | null;
      while ((keyMatch = settingKeyRegex.exec(block)) !== null) {
        const settingKey = keyMatch[1];
        if (!keyToCategories.has(settingKey)) {
          keyToCategories.set(settingKey, new Set());
        }
        keyToCategories.get(settingKey)!.add(matches[i].id);
      }
    }

    const duplicates = [...keyToCategories.entries()]
      .filter(([, cats]) => cats.size > 1)
      .map(([key, cats]) => `${key}: [${[...cats].join(", ")}]`);

    expect(
      duplicates,
      `Settings must live in only one category, found duplicates: ${duplicates.join("; ")}`
    ).toEqual([]);
  });
});
