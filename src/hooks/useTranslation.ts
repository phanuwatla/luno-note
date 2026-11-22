import { useMemo } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { translate, type TranslationKey } from "@/translation/translate";

export type { TranslationKey };

export function useTranslation() {
  const { settings } = useAppSettings();
  const language = settings.language;

  const t = useMemo(
    () =>
      (key: TranslationKey | (string & {}), vars?: Record<string, string | number>) =>
        translate(language, key, vars),
    [language],
  );

  return {
    language,
    t,
  };
}
