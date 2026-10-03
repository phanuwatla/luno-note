export type SettingsCategory =
  | "general"
  | "appearance"
  | "editor"
  | "files"
  | "markdown"
  | "templates"
  | "ai"
  | "shortcuts"
  | "storage"
  | "backup"
  | "privacy"
  | "about";

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  "general",
  "appearance",
  "editor",
  "files",
  "markdown",
  "templates",
  "ai",
  "shortcuts",
  "storage",
  "backup",
  "privacy",
  "about",
];

export function isValidSettingsCategory(cat: unknown): cat is SettingsCategory {
  return typeof cat === "string" && (SETTINGS_CATEGORIES as string[]).includes(cat);
}
