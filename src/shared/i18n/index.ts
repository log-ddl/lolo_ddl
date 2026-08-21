import { useMemo } from "react";
import { useUIPreferencesStore, type UILanguage } from "@/shared/stores/ui-preferences-store";
import en from "./messages/en/index";
import vi from "./messages/vi/index";

const catalogs = { en, vi } as const;

type Params = Record<string, string | number>;

export type Translate = (key: string, params?: Params) => string;

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function translate(language: UILanguage, key: string, params?: Params) {
  const catalog = catalogs[language] as Record<string, string>;
  const fallback = catalogs.en as Record<string, string>;
  const message = catalog[key] ?? fallback[key] ?? key;
  return interpolate(message, params);
}

export function getLocale(language: UILanguage) {
  return language === "vi" ? "vi-VN" : "en-US";
}

export function useI18n() {
  const language = useUIPreferencesStore((state) => state.uiLanguage);

  return useMemo(
    () => ({
      language,
      locale: getLocale(language),
      t: (key: string, params?: Params) => translate(language, key, params),
    }),
    [language],
  );
}
