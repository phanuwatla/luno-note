import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppTheme = "blue" | "violet" | "emerald" | "rose" | "orange" | "slate";
export type ColorScheme = "light" | "dark" | "system";

export interface AppThemeConfig {
  id: AppTheme;
  color: string;
  label: string;
}

export const APP_THEMES: AppThemeConfig[] = [
  { id: "emerald", color: "#26A295", label: "Emerald" },
  { id: "blue",    color: "hsl(217 91% 53%)", label: "Blue" },
  { id: "violet",  color: "hsl(262 83% 58%)", label: "Violet" },
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
  colorScheme: ColorScheme;
  autoSave: boolean;

  // File Settings
  defaultExtension: "md" | "txt" | "html";
  newFilePattern: "untitled" | "date" | "daily";
  defaultNoteTemplate: "blank" | "meeting" | "daily" | "project" | "todo" | "study" | "bug";

  // Appearance Settings
  editorWidth: "compact" | "standard" | "full";
  lineHeight: "1.4" | "1.6" | "1.8";
  sidebarDensity: "compact" | "comfortable";
  showGuideLines: boolean;
  tagColorStyle: "multicolor" | "accent";

  // Editor Settings
  showWordCount: boolean;
  autoPairBrackets: boolean;
  showCodeLineNumbers: boolean;

  // AI Assistant Settings
  geminiApiKey: string;

  // Cloud Storage Settings
  storageMode: "local" | "gdrive";
  googleDriveClientId: string;
}

const STORAGE_KEY = "notes-app-settings";
const FIXED_SIDEBAR_WIDTH = 280;

const VALID_THEMES: AppTheme[] = ["emerald", "blue", "violet", "rose", "orange", "slate"];
const VALID_COLOR_SCHEMES: ColorScheme[] = ["light", "dark", "system"];

const DEFAULT_SETTINGS: AppSettings = {
  editorFontSize: 15,
  sidebarWidth: FIXED_SIDEBAR_WIDTH,
  confirmBeforeDelete: true,
  language: "en",
  fontFamily: "inter",
  theme: "emerald",
  colorScheme: "system",
  autoSave: true,

  defaultExtension: "md",
  newFilePattern: "untitled",
  defaultNoteTemplate: "blank",

  editorWidth: "standard",
  lineHeight: "1.6",
  sidebarDensity: "comfortable",
  showGuideLines: true,
  tagColorStyle: "multicolor",

  showWordCount: true,
  autoPairBrackets: true,
  showCodeLineNumbers: true,

  geminiApiKey: "",

  storageMode: "local",
  googleDriveClientId: "",
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

  const theme: AppTheme = raw?.theme && VALID_THEMES.includes(raw.theme as AppTheme) ? (raw.theme as AppTheme) : "emerald";
  const colorScheme: ColorScheme = raw?.colorScheme && VALID_COLOR_SCHEMES.includes(raw.colorScheme as ColorScheme) ? (raw.colorScheme as ColorScheme) : "system";
  const confirmBeforeDelete = raw?.confirmBeforeDelete !== false;

  const defaultExtension = raw?.defaultExtension === "txt" || raw?.defaultExtension === "html" ? raw.defaultExtension : "md";
  const newFilePattern = raw?.newFilePattern === "date" || raw?.newFilePattern === "daily" ? raw.newFilePattern : "untitled";
  const validTemplates = ["blank", "meeting", "daily", "project", "todo", "study", "bug"];
  const defaultNoteTemplate = raw?.defaultNoteTemplate && validTemplates.includes(raw.defaultNoteTemplate)
    ? (raw.defaultNoteTemplate as any)
    : "blank";

  const editorWidth = raw?.editorWidth === "compact" || raw?.editorWidth === "full" ? raw.editorWidth : "standard";
  const lineHeight = raw?.lineHeight === "1.4" || raw?.lineHeight === "1.8" ? raw.lineHeight : "1.6";
  const sidebarDensity = raw?.sidebarDensity === "compact" ? "compact" : "comfortable";
  const showGuideLines = raw?.showGuideLines !== false;
  const tagColorStyle = raw?.tagColorStyle === "accent" ? "accent" : "multicolor";

  const showWordCount = raw?.showWordCount !== false;
  const autoPairBrackets = raw?.autoPairBrackets !== false;
  const showCodeLineNumbers = raw?.showCodeLineNumbers !== false;
  const geminiApiKey = typeof raw?.geminiApiKey === "string" ? raw.geminiApiKey.trim() : "";
  const storageMode = raw?.storageMode === "gdrive" ? "gdrive" : "local";
  const googleDriveClientId = typeof raw?.googleDriveClientId === "string" ? raw.googleDriveClientId.trim() : "";

  return {
    editorFontSize: clamp(Number(raw?.editorFontSize ?? DEFAULT_SETTINGS.editorFontSize), 13, 22),
    sidebarWidth: FIXED_SIDEBAR_WIDTH,
    confirmBeforeDelete,
    language,
    fontFamily,
    theme,
    colorScheme,
    autoSave: typeof raw?.autoSave === "boolean" ? raw.autoSave : DEFAULT_SETTINGS.autoSave,

    defaultExtension,
    newFilePattern,
    defaultNoteTemplate,

    editorWidth,
    lineHeight,
    sidebarDensity,
    showGuideLines,
    tagColorStyle,

    showWordCount,
    autoPairBrackets,
    showCodeLineNumbers,
    geminiApiKey,
    storageMode,
    googleDriveClientId,
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

export async function saveWorkspaceSettings(rootDirHandle: FileSystemDirectoryHandle, settings: AppSettings) {
  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: true });
    const fileHandle = await metaDir.getFileHandle("settings.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  } catch (err) {
    console.warn("Failed to write .luno/settings.json", err);
  }
}

export async function loadWorkspaceSettings(rootDirHandle: FileSystemDirectoryHandle): Promise<AppSettings | null> {
  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: false });
    const fileHandle = await metaDir.getFileHandle("settings.json", { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return normalizeSettings(JSON.parse(text));
  } catch {
    return null;
  }
}

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
  }, [settings.theme, settings.fontFamily]);

  useEffect(() => {
    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle("dark", dark);
    };
    if (settings.colorScheme === "dark") {
      apply(true);
    } else if (settings.colorScheme === "light") {
      apply(false);
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.colorScheme]);

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
