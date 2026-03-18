import en from "./en";
import th from "./th";

export type Language = "en" | "th";

export const translations = {
  en,
  th,
};

export type TranslationSchema = typeof en;
