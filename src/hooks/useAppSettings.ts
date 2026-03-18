import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AppTheme = "blue" | "violet" | "emerald" | "rose" | "orange" | "slate";

export interface AppThemeConfig {
  id: AppTheme;
  color: string;
  label: string;
}

export const APP_THEMES: AppThemeConfig[] = [
  { id: "blue",    color: "hsl(217 91% 53%)", label: "Blue" },
  { id: "violet",  color: "hsl(262 83% 58%)", label: "Violet" },
  { id: "emerald", color: "hsl(158 60% 38%)", label: "Emerald" },
  { id: "rose",    color: "hsl(347 77% 50%)", label: "Rose" },
  { id: "orange",  color: "hsl(25 95% 60%)", label: "Orange" },
  { id: "slate",   color: "hsl(215 16% 40%)", label: "Slate" },
];

export interface AppSettings {
  editorFontSize: number;
  sidebarWidth: number;
  confirmBeforeDelete: boolean;
  language: "en" | "th";
  fontFamily: "inter" | "system" | "serif" | "mono" | "prompt";
  theme: AppTheme;
}

const STORAGE_KEY = "notes-app-settings";
const FIXED_SIDEBAR_WIDTH = 320;

const VALID_THEMES: AppTheme[] = ["blue", "violet", "emerald", "rose", "orange", "slate"];

const DEFAULT_SETTINGS: AppSettings = {
  editorFontSize: 15,
  sidebarWidth: FIXED_SIDEBAR_WIDTH,
  confirmBeforeDelete: true,
  language: "en",
  fontFamily: "inter",
  theme: "blue",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const language = raw?.language === "th" ? "th" : "en";
  const fontFamily =
    raw?.fontFamily === "system" || raw?.fontFamily === "serif" || raw?.fontFamily === "mono" || raw?.fontFamily === "prompt"
      ? raw.fontFamily
      : "inter";

  const theme: AppTheme = raw?.theme && VALID_THEMES.includes(raw.theme as AppTheme) ? (raw.theme as AppTheme) : "blue";
  const confirmBeforeDelete = raw?.confirmBeforeDelete !== false;

  return {
    editorFontSize: clamp(Number(raw?.editorFontSize ?? DEFAULT_SETTINGS.editorFontSize), 13, 22),
    // Keep sidebar width fixed; users are not allowed to resize it.
    sidebarWidth: FIXED_SIDEBAR_WIDTH,
    confirmBeforeDelete,
    language,
    fontFamily,
    theme,
  };
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = normalizeSettings({ ...prev, [key]: value });
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      resetSettings,
    }),
    [settings, updateSetting, resetSettings],
  );

  return createElement(AppSettingsContext.Provider, { value }, children);
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }

  return context;
}
