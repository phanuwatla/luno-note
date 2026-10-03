export type HelpCategory =
  | "features"
  | "markdown"
  | "shortcuts"
  | "faq"
  | "about";

export const HELP_CATEGORIES: HelpCategory[] = [
  "features",
  "markdown",
  "shortcuts",
  "faq",
  "about",
];

export function isValidHelpCategory(cat: unknown): cat is HelpCategory {
  return typeof cat === "string" && (HELP_CATEGORIES as string[]).includes(cat);
}
