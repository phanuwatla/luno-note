import { translations, type TranslationSchema } from "@/translation";
export type AppLanguage = "th" | "en";

type Join<K extends string, P extends string> = `${K}.${P}`;

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? Join<K, NestedKeyOf<T[K]>>
      : never;
}[keyof T & string];

/**
 * Dot-path union of all valid translation keys in `TranslationSchema`.
 */
export type TranslationKey = NestedKeyOf<TranslationSchema>;

interface NestedRecord {
  [key: string]: string | NestedRecord;
}

function resolveKey(obj: NestedRecord, fallbackObj: NestedRecord, path: string): string {
  const getFrom = (source: NestedRecord) =>
    path.split(".").reduce<string | NestedRecord | undefined>((acc, key) => {
      if (!acc || typeof acc === "string") return undefined;
      return acc[key];
    }, source);

  const value = getFrom(obj);
  if (typeof value === "string") return value;

  const fallbackValue = getFrom(fallbackObj);
  if (typeof fallbackValue === "string") return fallbackValue;

  return path;
}

/**
 * Pure translation helper for non-React utilities and services (LN-I18N-01).
 */
export function translate(
  language: AppLanguage | string,
  key: TranslationKey | (string & {}),
  vars?: Record<string, string | number>,
): string {
  const dictionary = (translations[language as AppLanguage] || translations.en) as unknown as NestedRecord;
  const fallbackDictionary = translations.en as unknown as NestedRecord;
  const template = resolveKey(dictionary, fallbackDictionary, key);
  if (!vars) return template;

  return Object.entries(vars).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

/**
 * Reads active user language from persisted app settings for non-React helpers that don't receive `language` directly.
 */
export function getActiveAppLanguage(): AppLanguage {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("notes-app-settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.language === "th" || parsed?.language === "en") {
          return parsed.language;
        }
      }
    }
  } catch {
    /* ignore storage errors */
  }
  return "en";
}
