import { useMemo } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { translations, type TranslationSchema } from "@/translation";

interface NestedRecord {
  [key: string]: string | NestedRecord;
}

function getValue(obj: NestedRecord, fallbackObj: NestedRecord, path: string): string {
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

export function useTranslation() {
  const { settings } = useAppSettings();
  const dictionary: TranslationSchema = translations[settings.language] || translations.en;
  const fallbackDictionary: TranslationSchema = translations.en;

  const t = useMemo(
    () =>
      (key: string, vars?: Record<string, string | number>) => {
        const template = getValue(
          dictionary as unknown as NestedRecord,
          fallbackDictionary as unknown as NestedRecord,
          key
        );
        if (!vars) return template;

        return Object.entries(vars).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), template);
      },
    [dictionary, fallbackDictionary],
  );

  return {
    language: settings.language,
    t,
  };
}
