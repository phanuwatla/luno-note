import { useMemo } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { translations, type TranslationSchema } from "@/translation";

interface NestedRecord {
  [key: string]: string | NestedRecord;
}

function getValue(obj: NestedRecord, path: string): string {
  const value = path.split(".").reduce<string | NestedRecord | undefined>((acc, key) => {
    if (!acc || typeof acc === "string") return undefined;
    return acc[key];
  }, obj);

  return typeof value === "string" ? value : path;
}

export function useTranslation() {
  const { settings } = useAppSettings();
  const dictionary: TranslationSchema = translations[settings.language];

  const t = useMemo(
    () =>
      (key: string, vars?: Record<string, string | number>) => {
        const template = getValue(dictionary as unknown as NestedRecord, key);
        if (!vars) return template;

        return Object.entries(vars).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), template);
      },
    [dictionary],
  );

  return {
    language: settings.language,
    t,
  };
}
