import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import type { IconPackId } from "@/lib/iconPacks";

export type AppTheme =
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "lavender"
  | "fuchsia"
  | "rose"
  | "ruby"
  | "crimson"
  | "coral"
  | "orange"
  | "amber"
  | "gold"
  | "lime"
  | "mint"
  | "slate"
  | "custom";
export type ColorScheme = "light" | "dark" | "system";

export interface AppThemeConfig {
  id: AppTheme;
  color: string;
  label: string;
}

export const APP_THEMES: AppThemeConfig[] = [
  { id: "emerald",  color: "#26A295", label: "Emerald" },
  { id: "teal",     color: "hsl(166 72% 36%)", label: "Teal" },
  { id: "cyan",     color: "hsl(189 94% 43%)", label: "Cyan" },
  { id: "sky",      color: "hsl(199 89% 48%)", label: "Sky Blue" },
  { id: "blue",     color: "hsl(217 91% 53%)", label: "Blue" },
  { id: "indigo",   color: "hsl(239 84% 67%)", label: "Indigo" },
  { id: "violet",   color: "hsl(262 83% 58%)", label: "Violet" },
  { id: "lavender", color: "hsl(255 92% 76%)", label: "Lavender" },
  { id: "fuchsia",  color: "hsl(292 84% 61%)", label: "Fuchsia" },
  { id: "rose",     color: "hsl(347 77% 50%)", label: "Rose" },
  { id: "ruby",     color: "hsl(346 84% 50%)", label: "Ruby" },
  { id: "crimson",  color: "hsl(350 89% 60%)", label: "Crimson" },
  { id: "coral",    color: "hsl(14 90% 63%)", label: "Coral" },
  { id: "orange",   color: "hsl(25 95% 60%)", label: "Orange" },
  { id: "amber",    color: "hsl(38 92% 50%)", label: "Amber" },
  { id: "gold",     color: "hsl(45 93% 47%)", label: "Gold" },
  { id: "lime",     color: "hsl(84 81% 44%)", label: "Lime" },
  { id: "mint",     color: "hsl(158 64% 52%)", label: "Mint" },
  { id: "slate",    color: "hsl(215 16% 40%)", label: "Slate" },
];

export function hexToHsl(hex: string): { h: number; s: number; l: number; hslString: string } {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) {
    return { h: 174, s: 62, l: 39, hslString: "174 62% 39%" };
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return { h, s: sPct, l: lPct, hslString: `${h} ${sPct}% ${lPct}%` };
}

export function getThemeLogoFilter(theme: AppTheme = "emerald", customAccentColor?: string): string {
  switch (theme) {
    case "teal":
      return "hue-rotate(352deg) saturate(1.1)";
    case "cyan":
      return "hue-rotate(15deg) saturate(1.1)";
    case "sky":
      return "hue-rotate(25deg) saturate(1.15)";
    case "blue":
      return "hue-rotate(43deg) saturate(1.15)";
    case "indigo":
      return "hue-rotate(65deg) saturate(1.2)";
    case "violet":
      return "hue-rotate(88deg) saturate(1.2)";
    case "lavender":
      return "hue-rotate(81deg) saturate(1.1)";
    case "fuchsia":
      return "hue-rotate(118deg) saturate(1.2)";
    case "rose":
      return "hue-rotate(173deg) saturate(1.1)";
    case "ruby":
      return "hue-rotate(172deg) saturate(1.25)";
    case "crimson":
      return "hue-rotate(176deg) saturate(1.3)";
    case "coral":
      return "hue-rotate(200deg) saturate(1.25)";
    case "orange":
      return "hue-rotate(211deg) saturate(1.3)";
    case "amber":
      return "hue-rotate(224deg) saturate(1.3)";
    case "gold":
      return "hue-rotate(231deg) saturate(1.3)";
    case "lime":
      return "hue-rotate(270deg) saturate(1.2)";
    case "mint":
      return "hue-rotate(344deg) saturate(1.15)";
    case "slate":
      return "grayscale(0.85) brightness(1.1)";
    case "custom": {
      if (customAccentColor) {
        const { h, s } = hexToHsl(customAccentColor);
        if (s < 18) {
          return "grayscale(0.85) brightness(1.1)";
        }
        const hueDiff = ((h - 174) % 360 + 360) % 360;
        const sat = Math.max(0.85, Math.min(1.4, s / 65)).toFixed(2);
        return `hue-rotate(${hueDiff}deg) saturate(${sat})`;
      }
      return "none";
    }
    case "emerald":
    default:
      return "none";
  }
}

export const DEFAULT_TOOLBAR_ORDER: string[] = [
  "undo",
  "redo",
  "heading",
  "fontFamily",
  "fontSize",
  "bold",
  "italic",
  "underline",
  "strike",
  "highlight",
  "textColor",
  "align",
  "superscript",
  "subscript",
  "list",
  "toggle",
  "code",
  "blockquote",
  "horizontalRule",
  "footnote",
  "table",
  "link",
  "image",
  "qrCode",
  "emoji",
  "audio",
  "calculator",
  "translator",
  "clock",
  "fixLanguage",
  "aiAssistant",
];

export const DEFAULT_HIDDEN_TOOLBAR_ITEMS: string[] = [
  "superscript",
  "subscript",
  "footnote",
  "qrCode",
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
      "heading",
      "bold",
      "italic",
      "highlight",
      "textColor",
      "list",
      "aiAssistant",
      "fontFamily",
      "fontSize",
      "underline",
      "strike",
      "align",
      "superscript",
      "subscript",
      "toggle",
      "code",
      "blockquote",
      "horizontalRule",
      "footnote",
      "table",
      "link",
      "image",
      "qrCode",
      "emoji",
      "audio",
      "calculator",
      "translator",
      "clock",
      "fixLanguage",
    ],
    hidden: [
      "fontFamily",
      "fontSize",
      "underline",
      "strike",
      "align",
      "superscript",
      "subscript",
      "toggle",
      "code",
      "blockquote",
      "horizontalRule",
      "footnote",
      "table",
      "link",
      "image",
      "qrCode",
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
      "heading",
      "bold",
      "highlight",
      "list",
      "toggle",
      "table",
      "horizontalRule",
      "clock",
      "calculator",
      "audio",
      "aiAssistant",
      "fontFamily",
      "fontSize",
      "textColor",
      "align",
      "italic",
      "underline",
      "strike",
      "superscript",
      "subscript",
      "code",
      "blockquote",
      "footnote",
      "link",
      "image",
      "qrCode",
      "emoji",
      "translator",
      "fixLanguage",
    ],
    hidden: [
      "fontFamily",
      "fontSize",
      "textColor",
      "align",
      "italic",
      "underline",
      "strike",
      "superscript",
      "subscript",
      "code",
      "blockquote",
      "footnote",
      "link",
      "image",
      "qrCode",
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
      "heading",
      "fontFamily",
      "fontSize",
      "bold",
      "italic",
      "underline",
      "highlight",
      "textColor",
      "align",
      "superscript",
      "subscript",
      "list",
      "blockquote",
      "footnote",
      "table",
      "toggle",
      "link",
      "image",
      "translator",
      "aiAssistant",
      "strike",
      "code",
      "horizontalRule",
      "qrCode",
      "emoji",
      "audio",
      "calculator",
      "clock",
      "fixLanguage",
    ],
    hidden: [
      "strike",
      "code",
      "horizontalRule",
      "qrCode",
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
      "heading",
      "code",
      "list",
      "toggle",
      "table",
      "horizontalRule",
      "link",
      "image",
      "fixLanguage",
      "aiAssistant",
      "fontFamily",
      "fontSize",
      "textColor",
      "align",
      "bold",
      "italic",
      "underline",
      "strike",
      "highlight",
      "superscript",
      "subscript",
      "blockquote",
      "footnote",
      "qrCode",
      "emoji",
      "audio",
      "calculator",
      "translator",
      "clock",
    ],
    hidden: [
      "fontFamily",
      "fontSize",
      "textColor",
      "align",
      "bold",
      "italic",
      "underline",
      "strike",
      "highlight",
      "superscript",
      "subscript",
      "blockquote",
      "footnote",
      "qrCode",
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

export type BuiltInFontOption =
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

export type FontFamilyOption = BuiltInFontOption | (string & {});

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

export type AppLayout = "default" | "compact";

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
  appLayout: AppLayout;

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
  customAccentColor?: string;

  // Editor Settings
  showWordCount: boolean;
  autoPairBrackets: boolean;
  showCodeLineNumbers: boolean;
  highlightInlineCode: boolean;
  spellCheck: boolean;
  wrongLanguageSuggestion: boolean;
  smartTypography: boolean;
  toolbarItemsOrder: string[];
  hiddenToolbarItems: string[];

  // AI Assistant Settings
  geminiApiKey: string;
  aiModel: string;

  // Cloud Storage Settings
  storageMode: "local" | "gdrive";
  googleDriveClientId: string;
}

const STORAGE_KEY = "notes-app-settings";
const FIXED_SIDEBAR_WIDTH = 280;

const VALID_THEMES: AppTheme[] = [
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "lavender",
  "fuchsia",
  "rose",
  "ruby",
  "crimson",
  "coral",
  "orange",
  "amber",
  "gold",
  "lime",
  "mint",
  "slate",
  "custom",
];
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

function detectSystemLanguage(): "th" | "en" {
  try {
    if (typeof navigator !== "undefined" && navigator.language) {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith("th")) {
        return "th";
      }
    }
  } catch {}
  return "en";
}

const DEFAULT_SETTINGS: AppSettings = {
  editorFontSize: 15,
  sidebarWidth: FIXED_SIDEBAR_WIDTH,
  confirmBeforeDelete: true,
  language: detectSystemLanguage(),
  fontFamily: "inter",
  editorFontFamily: "inter",
  theme: "emerald",
  appearanceStyle: "default",
  colorScheme: "system",
  autoSave: true,
  reopenTabs: true,
  appLayout: "default",

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
  customAccentColor: "#26A295",

  showWordCount: true,
  autoPairBrackets: true,
  showCodeLineNumbers: false,
  highlightInlineCode: false,
  spellCheck: true,
  wrongLanguageSuggestion: true,
  smartTypography: true,
  toolbarItemsOrder: DEFAULT_TOOLBAR_ORDER,
  hiddenToolbarItems: DEFAULT_HIDDEN_TOOLBAR_ITEMS,

  geminiApiKey: "",
  aiModel: "auto",

  storageMode: "local",
  googleDriveClientId: "",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const defaultLang = detectSystemLanguage();
  const language = raw?.language === "th" || raw?.language === "en" ? raw.language : defaultLang;
  const fontFamily: FontFamilyOption =
    raw?.fontFamily && (VALID_FONT_FAMILIES.includes(raw.fontFamily as any) || typeof raw.fontFamily === "string")
      ? (raw.fontFamily as FontFamilyOption)
      : "inter";

  const editorFontFamily: FontFamilyOption =
    raw?.editorFontFamily && (VALID_FONT_FAMILIES.includes(raw.editorFontFamily as any) || typeof raw.editorFontFamily === "string")
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
  const appLayout: AppLayout = raw?.appLayout === "compact" ? "compact" : "default";
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

  const mapLegacyToolId = (id: string) => {
    if (/^h[1-6]$/.test(id)) return "heading";
    if (id === "bulletList" || id === "orderedList" || id === "taskList") return "list";
    if (id === "codeBlock") return "code";
    return id;
  };

  let toolbarItemsOrder: string[];
  if (Array.isArray(raw?.toolbarItemsOrder) && raw.toolbarItemsOrder.length > 0) {
    const mappedRaw = raw.toolbarItemsOrder.map(mapLegacyToolId);
    const validRaw = Array.from(new Set(mappedRaw.filter((id) => DEFAULT_TOOLBAR_ORDER.includes(id))));
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
    ? Array.from(
        new Set(
          raw.hiddenToolbarItems
            .map(mapLegacyToolId)
            .filter((id) => DEFAULT_TOOLBAR_ORDER.includes(id) && id !== "undo" && id !== "redo")
        )
      )
    : null;

  let hiddenToolbarItems: string[];
  if (rawHidden) {
    hiddenToolbarItems = [...rawHidden];
    // If heading was derived from legacy hidden items, only keep heading hidden if h1 AND h2 were both explicitly hidden
    const rawHiddenSet = new Set(raw.hiddenToolbarItems);
    if (!rawHiddenSet.has("h1") && !rawHiddenSet.has("heading")) {
      hiddenToolbarItems = hiddenToolbarItems.filter((id) => id !== "heading");
    }
    const rawOrderSet = new Set(Array.isArray(raw?.toolbarItemsOrder) ? raw.toolbarItemsOrder : []);
    if (
      (rawHiddenSet.has("bulletList") || rawHiddenSet.has("orderedList") || rawHiddenSet.has("taskList")) &&
      (!rawHiddenSet.has("bulletList") || !rawHiddenSet.has("orderedList") || !rawHiddenSet.has("taskList")) &&
      !rawHiddenSet.has("list")
    ) {
      hiddenToolbarItems = hiddenToolbarItems.filter((id) => id !== "list");
    }
    if (
      (rawHiddenSet.has("code") || rawHiddenSet.has("codeBlock")) &&
      (!rawHiddenSet.has("code") || !rawHiddenSet.has("codeBlock")) &&
      !rawHiddenSet.has("code")
    ) {
      hiddenToolbarItems = hiddenToolbarItems.filter((id) => id !== "code");
    }
    if (!rawOrderSet.has("superscript") && !hiddenToolbarItems.includes("superscript")) {
      hiddenToolbarItems.push("superscript");
    }
    if (!rawOrderSet.has("subscript") && !hiddenToolbarItems.includes("subscript")) {
      hiddenToolbarItems.push("subscript");
    }
    if (!rawOrderSet.has("qrCode") && !hiddenToolbarItems.includes("qrCode")) {
      hiddenToolbarItems.push("qrCode");
    }
  } else {
    hiddenToolbarItems = DEFAULT_HIDDEN_TOOLBAR_ITEMS;
  }

  const geminiApiKey = typeof raw?.geminiApiKey === "string" ? raw.geminiApiKey.trim() : "";
  const storageMode = raw?.storageMode === "gdrive" ? "gdrive" : "local";
  const googleDriveClientId = typeof raw?.googleDriveClientId === "string" ? raw.googleDriveClientId.trim() : "";

  const iconPack: IconPackId = ["lucide", "tabler", "phosphor"].includes(raw?.iconPack as any)
    ? (raw?.iconPack as IconPackId)
    : "lucide";
  const folderIcons = typeof raw?.folderIcons === "object" && raw?.folderIcons !== null ? raw.folderIcons : {};
  const fileIcons = typeof raw?.fileIcons === "object" && raw?.fileIcons !== null ? raw.fileIcons : {};
  const customAccentColor =
    typeof raw?.customAccentColor === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(raw.customAccentColor.trim())
      ? raw.customAccentColor.trim()
      : "#26A295";

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

    onStartup:
      appLayout === "compact" && (raw?.onStartup === "home" || !raw?.onStartup)
        ? "lastNote"
        : raw?.onStartup === "lastNote" || raw?.onStartup === "blank"
        ? raw.onStartup
        : "home",
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
    appLayout,
    iconPack,
    folderIcons,
    fileIcons,
    editorWidth,
    lineHeight,
    sidebarDensity,
    showGuideLines,
    tagColorStyle,
    accentHeadings,
    customAccentColor,

    showWordCount,
    autoPairBrackets,
    showCodeLineNumbers,
    highlightInlineCode,
    spellCheck: raw?.spellCheck !== undefined ? Boolean(raw.spellCheck) : DEFAULT_SETTINGS.spellCheck,
    wrongLanguageSuggestion: raw?.wrongLanguageSuggestion !== undefined ? Boolean(raw.wrongLanguageSuggestion) : DEFAULT_SETTINGS.wrongLanguageSuggestion,
    smartTypography: raw?.smartTypography !== undefined ? Boolean(raw.smartTypography) : DEFAULT_SETTINGS.smartTypography,
    toolbarItemsOrder,
    hiddenToolbarItems,
    geminiApiKey,
    aiModel: typeof raw?.aiModel === "string" && raw.aiModel.trim() ? raw.aiModel.trim() : DEFAULT_SETTINGS.aiModel,
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
  moveFolderIcons: (oldFolderPath: string, newFolderPath: string) => void;
  removeFolderIconsTree: (folderPath: string) => void;
  setFileIcon: (filePath: string, icon: string, color?: string) => void;
  removeFileIcon: (filePath: string) => void;
  applyAppearanceStyle: (styleId: AppearanceStyle) => void;
  resetSettings: () => void;
  keyboardLanguage: "th" | "en";
  setKeyboardLanguage: (lang: "th" | "en") => void;
  toggleKeyboardLanguage: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [keyboardLanguage, setKeyboardLanguageState] = useState<"th" | "en">(() => {
    return detectSystemLanguage() === "th" ? "th" : "en";
  });

  const setKeyboardLanguage = useCallback((lang: "th" | "en") => {
    setKeyboardLanguageState(lang);
  }, []);

  const toggleKeyboardLanguage = useCallback(() => {
    setKeyboardLanguageState((prev) => (prev === "th" ? "en" : "th"));
  }, []);

  useEffect(() => {
    let lastToggleTime = 0;
    const triggerToggle = () => {
      const now = Date.now();
      if (now - lastToggleTime < 200) return;
      lastToggleTime = now;
      setKeyboardLanguageState((prev) => (prev === "th" ? "en" : "th"));
    };

    const handleSwitchKey = (e: KeyboardEvent) => {
      // 1. ตัวหนอน (Grave Accent / Backquote / ~ / ` / KeyCode 192 / Windows IME toggle)
      if (
        e.code === "Backquote" ||
        e.key === "`" ||
        e.key === "~" ||
        e.keyCode === 192 ||
        (e as any).which === 192 ||
        (e.code === "Backquote" && (e.key === "Process" || e.key === "Unidentified" || e.key === "Dead"))
      ) {
        triggerToggle();
        return;
      }

      // 2. Win + Spacebar
      if (
        (e.metaKey || e.code === "OSLeft" || e.code === "OSRight" || e.key === "Meta") &&
        (e.code === "Space" || e.key === " " || e.keyCode === 32)
      ) {
        triggerToggle();
        return;
      }
      if (e.metaKey && e.code === "Space") {
        triggerToggle();
        return;
      }

      // 3. Real-time key character detection
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key && e.key.length === 1) {
        if (/[\u0E00-\u0E7F]/.test(e.key)) {
          setKeyboardLanguageState("th");
        } else if (/[A-Za-z]/.test(e.key)) {
          setKeyboardLanguageState("en");
        }
      }
    };

    const handleInputChar = (e: Event) => {
      const inputEvent = e as InputEvent;
      const data = inputEvent.data;
      if (data && data.length > 0) {
        if (/[\u0E00-\u0E7F]/.test(data)) {
          setKeyboardLanguageState("th");
        } else if (/[A-Za-z]/.test(data)) {
          setKeyboardLanguageState("en");
        }
      }
    };

    window.addEventListener("keydown", handleSwitchKey, true);
    window.addEventListener("keyup", handleSwitchKey, true);
    window.addEventListener("beforeinput", handleInputChar, true);
    window.addEventListener("input", handleInputChar, true);

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    let unsubNative: (() => void) | undefined;
    if (electronAPI?.onNativeKeyboardLanguageChanged) {
      unsubNative = electronAPI.onNativeKeyboardLanguageChanged((lang: string) => {
        if (lang === "th" || lang === "en") {
          setKeyboardLanguageState(lang);
        }
      });
      electronAPI.getNativeKeyboardLanguage?.().then((lang: string) => {
        if (lang === "th" || lang === "en") {
          setKeyboardLanguageState(lang);
        }
      });
    }

    const handleFocus = () => {
      electronAPI?.getNativeKeyboardLanguage?.().then((lang: string) => {
        if (lang === "th" || lang === "en") {
          setKeyboardLanguageState(lang);
        }
      });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleSwitchKey, true);
      window.removeEventListener("keyup", handleSwitchKey, true);
      window.removeEventListener("beforeinput", handleInputChar, true);
      window.removeEventListener("input", handleInputChar, true);
      window.removeEventListener("focus", handleFocus);
      if (typeof unsubNative === "function") {
        unsubNative();
      }
    };
  }, []);

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

  const moveFolderIcons = useCallback((oldFolderPath: string, newFolderPath: string) => {
    if (!oldFolderPath || !newFolderPath || oldFolderPath === newFolderPath) return;
    setSettings((prev) => {
      const currentFolderIcons = { ...(prev.folderIcons || {}) };
      const currentFileIcons = { ...(prev.fileIcons || {}) };
      let changed = false;

      // Update folder icons for this folder and all nested subfolders
      const nextFolderIcons: Record<string, { icon: string; color?: string }> = {};
      for (const [path, val] of Object.entries(currentFolderIcons)) {
        if (path === oldFolderPath) {
          nextFolderIcons[newFolderPath] = val;
          changed = true;
        } else if (path.startsWith(`${oldFolderPath}/`)) {
          const suffix = path.slice(oldFolderPath.length);
          nextFolderIcons[`${newFolderPath}${suffix}`] = val;
          changed = true;
        } else {
          nextFolderIcons[path] = val;
        }
      }

      // Update file icons inside the moved folder
      const nextFileIcons: Record<string, { icon: string; color?: string }> = {};
      for (const [path, val] of Object.entries(currentFileIcons)) {
        if (path.startsWith(`${oldFolderPath}/`)) {
          const suffix = path.slice(oldFolderPath.length);
          nextFileIcons[`${newFolderPath}${suffix}`] = val;
          changed = true;
        } else {
          nextFileIcons[path] = val;
        }
      }

      if (!changed) return prev;

      const next = normalizeSettings({
        ...prev,
        folderIcons: nextFolderIcons,
        fileIcons: nextFileIcons,
      });
      saveSettings(next);
      return next;
    });
  }, []);

  const removeFolderIconsTree = useCallback((folderPath: string) => {
    if (!folderPath) return;
    setSettings((prev) => {
      const currentFolderIcons = { ...(prev.folderIcons || {}) };
      const currentFileIcons = { ...(prev.fileIcons || {}) };
      let changed = false;

      for (const path of Object.keys(currentFolderIcons)) {
        if (path === folderPath || path.startsWith(`${folderPath}/`)) {
          delete currentFolderIcons[path];
          changed = true;
        }
      }

      for (const path of Object.keys(currentFileIcons)) {
        if (path.startsWith(`${folderPath}/`)) {
          delete currentFileIcons[path];
          changed = true;
        }
      }

      if (!changed) return prev;

      const next = normalizeSettings({
        ...prev,
        folderIcons: currentFolderIcons,
        fileIcons: currentFileIcons,
      });
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
    setSettings((prev) => {
      const next: AppSettings = {
        ...DEFAULT_SETTINGS,
        folderIcons: prev.folderIcons || {},
        fileIcons: prev.fileIcons || {},
        geminiApiKey: prev.geminiApiKey || "",
        googleDriveClientId: prev.googleDriveClientId || "",
      };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
    document.documentElement.setAttribute("data-app-style", settings.appearanceStyle || "default");
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
    document.documentElement.setAttribute("data-editor-font", settings.editorFontFamily || settings.fontFamily);

    const logoFilter = getThemeLogoFilter(settings.theme, settings.customAccentColor);
    document.documentElement.style.setProperty("--logo-filter", logoFilter);

    if (settings.theme === "custom") {
      const hex = settings.customAccentColor || "#26A295";
      document.documentElement.setAttribute("data-custom-accent-color", hex);
      const { h, s, l, hslString } = hexToHsl(hex);
      const isDark = document.documentElement.classList.contains("dark");
      const effectiveHsl = isDark
        ? `${h} ${Math.min(s + 5, 100)}% ${Math.min(Math.max(l, 55), 70)}%`
        : hslString;

      document.documentElement.style.setProperty("--primary", effectiveHsl);
      document.documentElement.style.setProperty("--accent", effectiveHsl);
      document.documentElement.style.setProperty("--ring", effectiveHsl);
      document.documentElement.style.setProperty("--sidebar-primary", effectiveHsl);
      document.documentElement.style.setProperty("--sidebar-ring", effectiveHsl);
      document.documentElement.style.setProperty("--hl-tag", hex);
      document.documentElement.style.setProperty("--hl-keyword", hex);
    } else {
      document.documentElement.removeAttribute("data-custom-accent-color");
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--sidebar-primary");
      document.documentElement.style.removeProperty("--sidebar-ring");
      document.documentElement.style.removeProperty("--hl-tag");
      document.documentElement.style.removeProperty("--hl-keyword");
    }
  }, [settings.theme, settings.customAccentColor, settings.appearanceStyle, settings.fontFamily, settings.editorFontFamily, settings.colorScheme]);

  // Dynamically update document favicon to match theme accent color
  useEffect(() => {
    try {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!link) return;
      const img = new Image();
      img.src = "./luno-logo.png";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 64;
        canvas.height = img.naturalHeight || img.height || 64;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const filter = getThemeLogoFilter(settings.theme, settings.customAccentColor);
        if (filter && filter !== "none") {
          ctx.filter = filter;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        link.href = canvas.toDataURL("image/png");
      };
    } catch {}
  }, [settings.theme, settings.customAccentColor]);

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
      moveFolderIcons,
      removeFolderIconsTree,
      setFileIcon,
      removeFileIcon,
      applyAppearanceStyle,
      resetSettings,
      keyboardLanguage,
      setKeyboardLanguage,
      toggleKeyboardLanguage,
    }),
    [settings, updateSetting, updateSettings, setFolderIcon, removeFolderIcon, moveFolderIcons, removeFolderIconsTree, setFileIcon, removeFileIcon, applyAppearanceStyle, resetSettings, keyboardLanguage, setKeyboardLanguage, toggleKeyboardLanguage],
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

export { type CustomFont, loadCustomFonts, saveCustomFont, renameCustomFont, deleteCustomFont } from "@/lib/customFontStore";

export function useCustomFonts() {
  const [customFonts, setCustomFonts] = useState<import("@/lib/customFontStore").CustomFont[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { loadCustomFonts } = await import("@/lib/customFontStore");
      const fonts = await loadCustomFonts();
      setCustomFonts(fonts);
    } catch (e) {
      console.warn("Failed to load custom fonts:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleChanged = () => refresh();
    window.addEventListener("luno:custom-fonts-changed", handleChanged);
    return () => window.removeEventListener("luno:custom-fonts-changed", handleChanged);
  }, [refresh]);

  return { customFonts, isLoading, refresh };
}
