import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import type { IconPackId } from "@/lib/iconPacks";

export type AppTheme =
  | "emerald"
  | "blue"
  | "indigo"
  | "violet"
  | "fuchsia"
  | "rose"
  | "ruby"
  | "orange"
  | "amber"
  | "lime"
  | "cyan"
  | "slate";
export type ColorScheme = "light" | "dark" | "system";

export interface AppThemeConfig {
  id: AppTheme;
  color: string;
  label: string;
}

export const APP_THEMES: AppThemeConfig[] = [
  { id: "emerald", color: "#26A295", label: "Emerald" },
  { id: "cyan",    color: "hsl(189 94% 43%)", label: "Cyan" },
  { id: "blue",    color: "hsl(217 91% 53%)", label: "Blue" },
  { id: "indigo",  color: "hsl(239 84% 67%)", label: "Indigo" },
  { id: "violet",  color: "hsl(262 83% 58%)", label: "Violet" },
  { id: "fuchsia", color: "hsl(292 84% 61%)", label: "Fuchsia" },
  { id: "rose",    color: "hsl(347 77% 50%)", label: "Rose" },
  { id: "ruby",    color: "hsl(346 84% 50%)", label: "Ruby" },
  { id: "orange",  color: "hsl(25 95% 60%)", label: "Orange" },
  { id: "amber",   color: "hsl(38 92% 50%)", label: "Amber" },
  { id: "lime",    color: "hsl(84 81% 44%)", label: "Lime" },
  { id: "slate",   color: "hsl(215 16% 40%)", label: "Slate" },
];

export const DEFAULT_TOOLBAR_ORDER: string[] = [
  "undo",
  "redo",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "bold",
  "italic",
  "underline",
  "strike",
  "highlight",
  "bulletList",
  "orderedList",
  "taskList",
  "toggle",
  "code",
  "codeBlock",
  "blockquote",
  "horizontalRule",
  "footnote",
  "table",
  "link",
  "image",
  "emoji",
  "audio",
  "calculator",
  "translator",
  "clock",
  "fixLanguage",
  "aiAssistant",
];

export const DEFAULT_HIDDEN_TOOLBAR_ITEMS: string[] = [
  "h3",
  "h4",
  "h5",
  "h6",
  "footnote",
  "calculator",
  "translator",
  "clock",
  "fixLanguage",
];

export type ToolbarPresetId = "standard" | "minimal" | "tasks" | "academic" | "technical" | "all";

export interface ToolbarPreset {
  id: ToolbarPresetId;
  nameKey: string;
  order: string[];
  hidden: string[];
}

export const TOOLBAR_PRESETS: ToolbarPreset[] = [
  {
    id: "standard",
    nameKey: "settings.presetStandard",
    order: DEFAULT_TOOLBAR_ORDER,
    hidden: DEFAULT_HIDDEN_TOOLBAR_ITEMS,
  },
  {
    id: "minimal",
    nameKey: "settings.presetMinimal",
    order: [
      "undo",
      "redo",
      "h1",
      "h2",
      "bold",
      "italic",
      "highlight",
      "bulletList",
      "taskList",
      "aiAssistant",
      "h3",
      "h4",
      "h5",
      "h6",
      "underline",
      "strike",
      "orderedList",
      "toggle",
      "code",
      "codeBlock",
      "blockquote",
      "horizontalRule",
      "footnote",
      "table",
      "link",
      "image",
      "emoji",
      "audio",
      "calculator",
      "translator",
      "clock",
      "fixLanguage",
    ],
    hidden: [
      "h3",
      "h4",
      "h5",
      "h6",
      "underline",
      "strike",
      "orderedList",
      "toggle",
      "code",
      "codeBlock",
      "blockquote",
      "horizontalRule",
      "footnote",
      "table",
      "link",
      "image",
      "emoji",
      "audio",
      "calculator",
      "translator",
      "clock",
      "fixLanguage",
    ],
  },
  {
    id: "tasks",
    nameKey: "settings.presetTasks",
    order: [
      "undo",
      "redo",
      "h1",
      "h2",
      "bold",
      "highlight",
      "taskList",
      "bulletList",
      "orderedList",
      "toggle",
      "table",
      "horizontalRule",
      "clock",
      "calculator",
      "audio",
      "aiAssistant",
      "h3",
      "h4",
      "h5",
      "h6",
      "italic",
      "underline",
      "strike",
      "code",
      "codeBlock",
      "blockquote",
      "footnote",
      "link",
      "image",
      "emoji",
      "translator",
      "fixLanguage",
    ],
    hidden: [
      "h3",
      "h4",
      "h5",
      "h6",
      "italic",
      "underline",
      "strike",
      "code",
      "codeBlock",
      "blockquote",
      "footnote",
      "link",
      "image",
      "emoji",
      "translator",
      "fixLanguage",
    ],
  },
  {
    id: "academic",
    nameKey: "settings.presetAcademic",
    order: [
      "undo",
      "redo",
      "h1",
      "h2",
      "h3",
      "bold",
      "italic",
      "underline",
      "highlight",
      "orderedList",
      "bulletList",
      "blockquote",
      "footnote",
      "table",
      "toggle",
      "link",
      "image",
      "translator",
      "aiAssistant",
      "h4",
      "h5",
      "h6",
      "strike",
      "taskList",
      "code",
      "codeBlock",
      "horizontalRule",
      "emoji",
      "audio",
      "calculator",
      "clock",
      "fixLanguage",
    ],
    hidden: [
      "h4",
      "h5",
      "h6",
      "strike",
      "taskList",
      "code",
      "codeBlock",
      "horizontalRule",
      "emoji",
      "audio",
      "calculator",
      "clock",
      "fixLanguage",
    ],
  },
  {
    id: "technical",
    nameKey: "settings.presetTechnical",
    order: [
      "undo",
      "redo",
      "h1",
      "h2",
      "code",
      "codeBlock",
      "taskList",
      "bulletList",
      "toggle",
      "table",
      "horizontalRule",
      "link",
      "image",
      "fixLanguage",
      "aiAssistant",
      "h3",
      "h4",
      "h5",
      "h6",
      "bold",
      "italic",
      "underline",
      "strike",
      "highlight",
      "orderedList",
      "blockquote",
      "footnote",
      "emoji",
      "audio",
      "calculator",
      "translator",
      "clock",
    ],
    hidden: [
      "h3",
      "h4",
      "h5",
      "h6",
      "bold",
      "italic",
      "underline",
      "strike",
      "highlight",
      "orderedList",
      "blockquote",
      "footnote",
      "emoji",
      "audio",
      "calculator",
      "translator",
      "clock",
    ],
  },
  {
    id: "all",
    nameKey: "settings.presetAll",
    order: DEFAULT_TOOLBAR_ORDER,
    hidden: [],
  },
];

export type FontFamilyOption =
  | "inter"
  | "system"
  | "serif"
  | "mono"
  | "prompt"
  | "sarabun"
  | "kanit"
  | "mitr"
  | "ibmPlexThai"
  | "notoSansThai"
  | "notoSerifThai"
  | "chakraPetch"
  | "mali"
  | "itim"
  | "sriracha"
  | "chonburi";

export type AppearanceStyle = "default" | "paper" | "midnight" | "nord" | "glass" | "cyberpunk" | "catppuccin" | "neumorphism";

export const VALID_APPEARANCE_STYLES: AppearanceStyle[] = [
  "default",
  "paper",
  "midnight",
  "nord",
  "glass",
  "cyberpunk",
  "catppuccin",
  "neumorphism",
];

export interface AppearanceStyleOption {
  id: AppearanceStyle;
  nameKey: string;
  descKey: string;
  lightBg: string;
  darkBg: string;
  lightSidebar: string;
  darkSidebar: string;
  accentPreview: string;
  recommendedTheme: AppTheme;
  recommendedColorScheme?: ColorScheme;
  recommendedFontFamily?: FontFamilyOption;
  recommendedEditorFontFamily?: FontFamilyOption;
}

export const APPEARANCE_STYLE_OPTIONS: AppearanceStyleOption[] = [
  {
    id: "default",
    nameKey: "settings.styleDefault",
    descKey: "settings.styleDefaultDesc",
    lightBg: "#ffffff",
    darkBg: "#0f172a",
    lightSidebar: "#f8fafc",
    darkSidebar: "#090d16",
    accentPreview: "#26A295",
    recommendedTheme: "emerald",
    recommendedColorScheme: "system",
    recommendedFontFamily: "inter",
    recommendedEditorFontFamily: "inter",
  },
  {
    id: "paper",
    nameKey: "settings.stylePaper",
    descKey: "settings.stylePaperDesc",
    lightBg: "#fbf7ee",
    darkBg: "#1c1815",
    lightSidebar: "#f4ede0",
    darkSidebar: "#161311",
    accentPreview: "hsl(38 92% 50%)",
    recommendedTheme: "amber",
    recommendedColorScheme: "light",
    recommendedFontFamily: "serif",
    recommendedEditorFontFamily: "serif",
  },
  {
    id: "midnight",
    nameKey: "settings.styleMidnight",
    descKey: "settings.styleMidnightDesc",
    lightBg: "#ffffff",
    darkBg: "#000000",
    lightSidebar: "#f4f4f5",
    darkSidebar: "#080808",
    accentPreview: "hsl(189 94% 43%)",
    recommendedTheme: "cyan",
    recommendedColorScheme: "dark",
    recommendedFontFamily: "inter",
    recommendedEditorFontFamily: "inter",
  },
  {
    id: "nord",
    nameKey: "settings.styleNord",
    descKey: "settings.styleNordDesc",
    lightBg: "#eceff4",
    darkBg: "#242933",
    lightSidebar: "#e5e9f0",
    darkSidebar: "#1e222a",
    accentPreview: "hsl(217 91% 53%)",
    recommendedTheme: "blue",
    recommendedColorScheme: "dark",
    recommendedFontFamily: "ibmPlexThai",
    recommendedEditorFontFamily: "ibmPlexThai",
  },
  {
    id: "glass",
    nameKey: "settings.styleGlass",
    descKey: "settings.styleGlassDesc",
    lightBg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    darkBg: "linear-gradient(135deg, #090e17 0%, #030712 100%)",
    lightSidebar: "rgba(255,255,255,0.7)",
    darkSidebar: "rgba(15,23,42,0.7)",
    accentPreview: "hsl(189 94% 43%)",
    recommendedTheme: "cyan",
    recommendedColorScheme: "dark",
    recommendedFontFamily: "prompt",
    recommendedEditorFontFamily: "prompt",
  },
  {
    id: "cyberpunk",
    nameKey: "settings.styleCyberpunk",
    descKey: "settings.styleCyberpunkDesc",
    lightBg: "#fdf4ff",
    darkBg: "#08040f",
    lightSidebar: "#fae8ff",
    darkSidebar: "#0d0618",
    accentPreview: "hsl(292 84% 61%)",
    recommendedTheme: "fuchsia",
    recommendedColorScheme: "dark",
    recommendedFontFamily: "chakraPetch",
    recommendedEditorFontFamily: "mono",
  },
  {
    id: "catppuccin",
    nameKey: "settings.styleCatppuccin",
    descKey: "settings.styleCatppuccinDesc",
    lightBg: "#eff1f5",
    darkBg: "#1e1e2e",
    lightSidebar: "#e6e9ef",
    darkSidebar: "#181825",
    accentPreview: "hsl(262 83% 58%)",
    recommendedTheme: "violet",
    recommendedColorScheme: "dark",
    recommendedFontFamily: "mitr",
    recommendedEditorFontFamily: "mitr",
  },
  {
    id: "neumorphism",
    nameKey: "settings.styleNeumorphism",
    descKey: "settings.styleNeumorphismDesc",
    lightBg: "#e5e9ef",
    darkBg: "#242831",
    lightSidebar: "#dde2ea",
    darkSidebar: "#1c2028",
    accentPreview: "#3b82f6",
    recommendedTheme: "blue",
    recommendedColorScheme: "system",
    recommendedFontFamily: "inter",
    recommendedEditorFontFamily: "inter",
  },
];

export interface AppSettings {
  editorFontSize: number;
  sidebarWidth: number;
  confirmBeforeDelete: boolean;
  language: "en" | "th";
  fontFamily: FontFamilyOption;
  editorFontFamily: FontFamilyOption;
  theme: AppTheme;
  appearanceStyle: AppearanceStyle;
  colorScheme: ColorScheme;
  autoSave: boolean;
  reopenTabs: boolean;

  // General Settings
  onStartup: string;
  checkUpdates: boolean;
  dateFormat: string;
  timeFormat: string;
  startWeekOn: string;
  enableAnimations: boolean;
  sendUsageData: boolean;

  // Trash & Deletion Settings
  trashRetentionDays: number;
  autoEmptyTrash: boolean;

  defaultExtension: "md" | "txt" | "html";
  newFilePattern: "untitled" | "date" | "daily";
  defaultNoteTemplate: "blank" | "meeting" | "daily" | "project" | "todo" | "study" | "bug";
  defaultTemplateMd: "blank" | "meeting" | "daily" | "project" | "todo" | "study" | "bug";
  defaultTemplateTxt: "blank" | "notes" | "todo" | "meeting" | "journal" | "readme" | "daily" | "project" | "study" | "bug";
  defaultTemplateHtml: "blank" | "basic-website" | "landing-page" | "portfolio" | "blog" | "dashboard" | "meeting" | "daily" | "project" | "todo" | "study" | "bug";
  autoFolderIcons: boolean;

  // Appearance Settings
  interfaceScale: number;
  iconPack: IconPackId;
  folderIcons?: Record<string, { icon: string; color?: string }>;
  fileIcons?: Record<string, { icon: string; color?: string }>;
  editorWidth: "compact" | "standard" | "full";
  lineHeight: "1.4" | "1.6" | "1.8";
  sidebarDensity: "compact" | "comfortable";
  showGuideLines: boolean;
  tagColorStyle: "multicolor" | "accent";
  accentHeadings: boolean;

  // Editor Settings
  showWordCount: boolean;
  autoPairBrackets: boolean;
  showCodeLineNumbers: boolean;
  highlightInlineCode: boolean;
  spellCheck: boolean;
  toolbarItemsOrder: string[];
  hiddenToolbarItems: string[];

  // AI Assistant Settings
  geminiApiKey: string;

  // Cloud Storage Settings
  storageMode: "local" | "gdrive";
  googleDriveClientId: string;
}

const STORAGE_KEY = "notes-app-settings";
const FIXED_SIDEBAR_WIDTH = 280;

const VALID_THEMES: AppTheme[] = ["emerald", "cyan", "blue", "indigo", "violet", "fuchsia", "rose", "ruby", "orange", "amber", "lime", "slate"];
const VALID_COLOR_SCHEMES: ColorScheme[] = ["light", "dark", "system"];
export const VALID_FONT_FAMILIES: FontFamilyOption[] = [
  "inter",
  "system",
  "serif",
  "mono",
  "prompt",
  "sarabun",
  "kanit",
  "mitr",
  "ibmPlexThai",
  "notoSansThai",
  "notoSerifThai",
  "chakraPetch",
  "mali",
  "itim",
  "sriracha",
  "chonburi",
];

export const FONT_FAMILY_CSS: Record<FontFamilyOption, string> = {
  inter: "'Inter', sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', 'Leelawadee UI', 'Thonburi', sans-serif",
  serif: "'Noto Serif Thai', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  prompt: "'Prompt', 'Inter', sans-serif",
  sarabun: "'Sarabun', 'Inter', sans-serif",
  kanit: "'Kanit', 'Inter', sans-serif",
  mitr: "'Mitr', 'Inter', sans-serif",
  ibmPlexThai: "'IBM Plex Sans Thai', 'Inter', sans-serif",
  notoSansThai: "'Noto Sans Thai', 'Inter', sans-serif",
  notoSerifThai: "'Noto Serif Thai', Georgia, 'Times New Roman', serif",
  chakraPetch: "'Chakra Petch', 'Inter', sans-serif",
  mali: "'Mali', cursive, sans-serif",
  itim: "'Itim', cursive, sans-serif",
  sriracha: "'Sriracha', cursive, sans-serif",
  chonburi: "'Chonburi', cursive, serif",
};

export const FONT_OPTIONS: { id: FontFamilyOption; nameKey: string; css: string }[] = [
  { id: "inter", nameKey: "settings.fontInter", css: FONT_FAMILY_CSS.inter },
  { id: "system", nameKey: "settings.fontSystem", css: FONT_FAMILY_CSS.system },
  { id: "serif", nameKey: "settings.fontSerif", css: FONT_FAMILY_CSS.serif },
  { id: "mono", nameKey: "settings.fontMono", css: FONT_FAMILY_CSS.mono },
  { id: "prompt", nameKey: "settings.fontPrompt", css: FONT_FAMILY_CSS.prompt },
  { id: "sarabun", nameKey: "settings.fontSarabun", css: FONT_FAMILY_CSS.sarabun },
  { id: "kanit", nameKey: "settings.fontKanit", css: FONT_FAMILY_CSS.kanit },
  { id: "mitr", nameKey: "settings.fontMitr", css: FONT_FAMILY_CSS.mitr },
  { id: "ibmPlexThai", nameKey: "settings.fontIbmPlexThai", css: FONT_FAMILY_CSS.ibmPlexThai },
  { id: "notoSansThai", nameKey: "settings.fontNotoSansThai", css: FONT_FAMILY_CSS.notoSansThai },
  { id: "notoSerifThai", nameKey: "settings.fontNotoSerifThai", css: FONT_FAMILY_CSS.notoSerifThai },
  { id: "chakraPetch", nameKey: "settings.fontChakraPetch", css: FONT_FAMILY_CSS.chakraPetch },
  { id: "mali", nameKey: "settings.fontMali", css: FONT_FAMILY_CSS.mali },
  { id: "itim", nameKey: "settings.fontItim", css: FONT_FAMILY_CSS.itim },
  { id: "sriracha", nameKey: "settings.fontSriracha", css: FONT_FAMILY_CSS.sriracha },
  { id: "chonburi", nameKey: "settings.fontChonburi", css: FONT_FAMILY_CSS.chonburi },
];

const DEFAULT_SETTINGS: AppSettings = {
  editorFontSize: 15,
  sidebarWidth: FIXED_SIDEBAR_WIDTH,
  confirmBeforeDelete: true,
  language: "en",
  fontFamily: "inter",
  editorFontFamily: "inter",
  theme: "emerald",
  appearanceStyle: "default",
  colorScheme: "system",
  autoSave: true,
  reopenTabs: true,

  onStartup: "home",
  checkUpdates: true,
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  startWeekOn: "monday",
  enableAnimations: true,
  sendUsageData: false,

  trashRetentionDays: 30,
  autoEmptyTrash: true,

  defaultExtension: "md",
  newFilePattern: "untitled",
  defaultNoteTemplate: "blank",
  defaultTemplateMd: "blank",
  defaultTemplateTxt: "blank",
  defaultTemplateHtml: "blank",
  autoFolderIcons: true,

  interfaceScale: 100,
  iconPack: "lucide",
  folderIcons: {},
  fileIcons: {},
  editorWidth: "standard",
  lineHeight: "1.6",
  sidebarDensity: "comfortable",
  showGuideLines: true,
  tagColorStyle: "multicolor",
  accentHeadings: false,

  showWordCount: true,
  autoPairBrackets: true,
  showCodeLineNumbers: false,
  highlightInlineCode: false,
  spellCheck: true,
  toolbarItemsOrder: DEFAULT_TOOLBAR_ORDER,
  hiddenToolbarItems: DEFAULT_HIDDEN_TOOLBAR_ITEMS,

  geminiApiKey: "",

  storageMode: "local",
  googleDriveClientId: "",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const language = raw?.language === "th" ? "th" : "en";
  const fontFamily: FontFamilyOption =
    raw?.fontFamily && VALID_FONT_FAMILIES.includes(raw.fontFamily as FontFamilyOption)
      ? (raw.fontFamily as FontFamilyOption)
      : "inter";

  const editorFontFamily: FontFamilyOption =
    raw?.editorFontFamily && VALID_FONT_FAMILIES.includes(raw.editorFontFamily as FontFamilyOption)
      ? (raw.editorFontFamily as FontFamilyOption)
      : fontFamily;

  const theme: AppTheme = raw?.theme && VALID_THEMES.includes(raw.theme as AppTheme) ? (raw.theme as AppTheme) : "emerald";
  const appearanceStyle: AppearanceStyle =
    raw?.appearanceStyle && VALID_APPEARANCE_STYLES.includes(raw.appearanceStyle as AppearanceStyle)
      ? (raw.appearanceStyle as AppearanceStyle)
      : "default";
  const colorScheme: ColorScheme = raw?.colorScheme && VALID_COLOR_SCHEMES.includes(raw.colorScheme as ColorScheme) ? (raw.colorScheme as ColorScheme) : "system";
  const confirmBeforeDelete = raw?.confirmBeforeDelete !== false;

  const defaultExtension = raw?.defaultExtension === "txt" || raw?.defaultExtension === "html" ? raw.defaultExtension : "md";
  const newFilePattern = raw?.newFilePattern === "date" || raw?.newFilePattern === "daily" ? raw.newFilePattern : "untitled";
  const defaultTemplateMd = ["blank", "meeting", "daily", "project", "todo", "study", "bug"].includes(raw?.defaultTemplateMd as any)
    ? (raw.defaultTemplateMd as any)
    : (["blank", "meeting", "daily", "project", "todo", "study", "bug"].includes(raw?.defaultNoteTemplate as any)
      ? (raw.defaultNoteTemplate as any)
      : "blank");
  const defaultTemplateTxt = ["blank", "notes", "todo", "meeting", "journal", "readme", "daily", "project", "study", "bug"].includes(raw?.defaultTemplateTxt as any)
    ? (raw.defaultTemplateTxt as any)
    : "blank";
  const defaultTemplateHtml = ["blank", "basic-website", "landing-page", "portfolio", "blog", "dashboard", "meeting", "daily", "project", "todo", "study", "bug"].includes(raw?.defaultTemplateHtml as any)
    ? (raw.defaultTemplateHtml as any)
    : "blank";
  const defaultNoteTemplate = defaultTemplateMd;

  const interfaceScale = [80, 90, 100, 110, 125, 150].includes(Number(raw?.interfaceScale)) ? Number(raw?.interfaceScale) : 100;
  const editorWidth = raw?.editorWidth === "compact" || raw?.editorWidth === "full" ? raw.editorWidth : "standard";
  const lineHeight = raw?.lineHeight === "1.4" || raw?.lineHeight === "1.8" ? raw.lineHeight : "1.6";
  const sidebarDensity = raw?.sidebarDensity === "compact" ? "compact" : "comfortable";
  const showGuideLines = raw?.showGuideLines !== false;
  const tagColorStyle = raw?.tagColorStyle === "accent" ? "accent" : "multicolor";
  const accentHeadings = raw?.accentHeadings === true;

  const showWordCount = raw?.showWordCount !== false;
  const autoPairBrackets = raw?.autoPairBrackets !== false;
  const showCodeLineNumbers = raw?.showCodeLineNumbers === true;
  const highlightInlineCode = raw?.highlightInlineCode === true;

  let toolbarItemsOrder: string[];
  if (Array.isArray(raw?.toolbarItemsOrder) && raw.toolbarItemsOrder.length > 0) {
    const validRaw = raw.toolbarItemsOrder.filter((id) => DEFAULT_TOOLBAR_ORDER.includes(id));
    const existing = new Set(validRaw);
    toolbarItemsOrder = [...validRaw];
    for (const defaultItem of DEFAULT_TOOLBAR_ORDER) {
      if (!existing.has(defaultItem)) {
        const defaultIdx = DEFAULT_TOOLBAR_ORDER.indexOf(defaultItem);
        let inserted = false;
        for (let i = defaultIdx - 1; i >= 0; i--) {
          const prevItem = DEFAULT_TOOLBAR_ORDER[i];
          const currPos = toolbarItemsOrder.indexOf(prevItem);
          if (currPos !== -1) {
            toolbarItemsOrder.splice(currPos + 1, 0, defaultItem);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          toolbarItemsOrder.push(defaultItem);
        }
      }
    }
  } else {
    toolbarItemsOrder = DEFAULT_TOOLBAR_ORDER;
  }

  const rawHidden = Array.isArray(raw?.hiddenToolbarItems)
    ? raw.hiddenToolbarItems.filter((id) => DEFAULT_TOOLBAR_ORDER.includes(id) && id !== "undo" && id !== "redo")
    : null;

  const hiddenToolbarItems: string[] = rawHidden ?? DEFAULT_HIDDEN_TOOLBAR_ITEMS;

  const geminiApiKey = typeof raw?.geminiApiKey === "string" ? raw.geminiApiKey.trim() : "";
  const storageMode = raw?.storageMode === "gdrive" ? "gdrive" : "local";
  const googleDriveClientId = typeof raw?.googleDriveClientId === "string" ? raw.googleDriveClientId.trim() : "";

  const iconPack: IconPackId = ["lucide", "tabler", "phosphor"].includes(raw?.iconPack as any)
    ? (raw?.iconPack as IconPackId)
    : "lucide";
  const folderIcons = typeof raw?.folderIcons === "object" && raw?.folderIcons !== null ? raw.folderIcons : {};
  const fileIcons = typeof raw?.fileIcons === "object" && raw?.fileIcons !== null ? raw.fileIcons : {};

  return {
    editorFontSize: clamp(Number(raw?.editorFontSize ?? DEFAULT_SETTINGS.editorFontSize), 13, 22),
    sidebarWidth: FIXED_SIDEBAR_WIDTH,
    confirmBeforeDelete,
    language,
    fontFamily,
    editorFontFamily,
    theme,
    appearanceStyle,
    colorScheme,
    autoSave: typeof raw?.autoSave === "boolean" ? raw.autoSave : DEFAULT_SETTINGS.autoSave,
    reopenTabs: typeof raw?.reopenTabs === "boolean" ? raw.reopenTabs : DEFAULT_SETTINGS.reopenTabs,

    onStartup: raw?.onStartup === "lastNote" || raw?.onStartup === "blank" ? raw.onStartup : "home",
    checkUpdates: raw?.checkUpdates !== false,
    dateFormat: raw?.dateFormat === "DD/MM/YYYY" || raw?.dateFormat === "MM/DD/YYYY" ? raw.dateFormat : "YYYY-MM-DD",
    timeFormat: raw?.timeFormat === "12h" ? "12h" : "24h",
    startWeekOn: raw?.startWeekOn === "sunday" ? "sunday" : "monday",
    enableAnimations: raw?.enableAnimations !== false,
    sendUsageData: raw?.sendUsageData === true,

    trashRetentionDays: typeof raw?.trashRetentionDays === "number" ? raw.trashRetentionDays : DEFAULT_SETTINGS.trashRetentionDays,
    autoEmptyTrash: raw?.autoEmptyTrash !== false,

    defaultExtension,
    newFilePattern,
    defaultNoteTemplate,
    defaultTemplateMd,
    defaultTemplateTxt,
    defaultTemplateHtml,
    autoFolderIcons: raw?.autoFolderIcons !== false,

    interfaceScale,
    iconPack,
    folderIcons,
    fileIcons,
    editorWidth,
    lineHeight,
    sidebarDensity,
    showGuideLines,
    tagColorStyle,
    accentHeadings,

    showWordCount,
    autoPairBrackets,
    showCodeLineNumbers,
    highlightInlineCode,
    spellCheck: raw?.spellCheck !== undefined ? Boolean(raw.spellCheck) : DEFAULT_SETTINGS.spellCheck,
    toolbarItemsOrder,
    hiddenToolbarItems,
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

export async function saveWorkspaceSettings(rootDirHandle: FileSystemDirectoryHandle | null, settings: AppSettings) {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/settings.json`;
        await electronAPI.writeFileContent({ fullPath, content: JSON.stringify(settings, null, 2) });
        return;
      }
    } catch (err) {
      console.warn("Failed to write .luno/settings.json in Electron", err);
    }
  }

  if (!rootDirHandle) return;

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

export async function loadWorkspaceSettings(rootDirHandle: FileSystemDirectoryHandle | null): Promise<AppSettings | null> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/settings.json`;
        const content = await electronAPI.readFileContent(fullPath);
        if (content) {
          return normalizeSettings(JSON.parse(content));
        }
      }
    } catch (err) {
      console.warn("Failed to read .luno/settings.json in Electron", err);
    }
  }

  if (!rootDirHandle) return null;

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
  updateSettings: (partial: Partial<AppSettings>) => void;
  setFolderIcon: (folderPath: string, icon: string, color?: string) => void;
  removeFolderIcon: (folderPath: string) => void;
  applyAppearanceStyle: (styleId: AppearanceStyle) => void;
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

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = normalizeSettings({ ...prev, ...partial });
      saveSettings(next);
      return next;
    });
  }, []);

  const setFolderIcon = useCallback((folderPath: string, icon: string, color?: string) => {
    setSettings((prev) => {
      const current = prev.folderIcons || {};
      const nextIcons = { ...current, [folderPath]: { icon, color } };
      const next = normalizeSettings({ ...prev, folderIcons: nextIcons });
      saveSettings(next);
      return next;
    });
  }, []);

  const removeFolderIcon = useCallback((folderPath: string) => {
    setSettings((prev) => {
      const current = { ...(prev.folderIcons || {}) };
      delete current[folderPath];
      const next = normalizeSettings({ ...prev, folderIcons: current });
      saveSettings(next);
      return next;
    });
  }, []);

  const setFileIcon = useCallback((filePath: string, icon: string, color?: string) => {
    setSettings((prev) => {
      const current = prev.fileIcons || {};
      const nextIcons = { ...current, [filePath]: { icon, color } };
      const next = normalizeSettings({ ...prev, fileIcons: nextIcons });
      saveSettings(next);
      return next;
    });
  }, []);

  const removeFileIcon = useCallback((filePath: string) => {
    setSettings((prev) => {
      const current = { ...(prev.fileIcons || {}) };
      delete current[filePath];
      const next = normalizeSettings({ ...prev, fileIcons: current });
      saveSettings(next);
      return next;
    });
  }, []);

  const applyAppearanceStyle = useCallback((styleId: AppearanceStyle) => {
    const opt = APPEARANCE_STYLE_OPTIONS.find((o) => o.id === styleId);
    if (!opt) {
      updateSetting("appearanceStyle", styleId);
      return;
    }
    const update: Partial<AppSettings> = {
      appearanceStyle: styleId,
      theme: opt.recommendedTheme,
    };
    if (opt.recommendedColorScheme) {
      update.colorScheme = opt.recommendedColorScheme;
    }
    if (opt.recommendedFontFamily) {
      update.fontFamily = opt.recommendedFontFamily;
      update.editorFontFamily = opt.recommendedEditorFontFamily || opt.recommendedFontFamily;
    }
    updateSettings(update);
  }, [updateSetting, updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
    document.documentElement.setAttribute("data-app-style", settings.appearanceStyle || "default");
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
    document.documentElement.setAttribute("data-editor-font", settings.editorFontFamily || settings.fontFamily);
  }, [settings.theme, settings.appearanceStyle, settings.fontFamily, settings.editorFontFamily]);

  useEffect(() => {
    const scale = settings.interfaceScale || 100;
    const factor = scale / 100;
    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    if (electronAPI?.setZoomFactor) {
      electronAPI.setZoomFactor(factor);
      (document.documentElement.style as any).zoom = "";
    } else {
      if (scale === 100) {
        (document.documentElement.style as any).zoom = "";
      } else {
        (document.documentElement.style as any).zoom = `${scale}%`;
      }
    }
  }, [settings.interfaceScale]);

  // Global shortcut to reset or adjust UI scale (Ctrl+0 / Ctrl+Plus / Ctrl+Minus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl or Meta (Cmd on Mac)
      if (!e.ctrlKey && !e.metaKey) return;

      // Ctrl + 0: Reset scale to 100%
      if (e.key === "0" || e.code === "Digit0" || e.code === "Numpad0") {
        e.preventDefault();
        const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
        if (electronAPI?.resetZoom) {
          electronAPI.resetZoom();
        }
        (document.documentElement.style as any).zoom = "";
        updateSetting("interfaceScale", 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [updateSetting]);

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

  useEffect(() => {
    const isAnim = settings.enableAnimations !== false;
    document.documentElement.setAttribute("data-animations", isAnim ? "true" : "false");
    if (!isAnim) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [settings.enableAnimations]);

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      updateSettings,
      setFolderIcon,
      removeFolderIcon,
      setFileIcon,
      removeFileIcon,
      applyAppearanceStyle,
      resetSettings,
    }),
    [settings, updateSetting, updateSettings, setFolderIcon, removeFolderIcon, setFileIcon, removeFileIcon, applyAppearanceStyle, resetSettings],
  );

  return createElement(
    AppSettingsContext.Provider,
    { value },
    createElement(
      MotionConfig,
      {
        reducedMotion: settings.enableAnimations !== false ? "never" : "always",
        transition: settings.enableAnimations === false ? { duration: 0 } : undefined,
      },
      children
    )
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }

  return context;
}
