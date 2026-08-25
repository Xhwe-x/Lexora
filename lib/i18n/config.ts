export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_COOKIE = "lexora-locale";

export function resolveLocale(value: string | undefined): Locale {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "en" || normalized?.startsWith("en-")) return "en";
  if (normalized === "zh" || normalized?.startsWith("zh-")) return "zh-CN";

  return DEFAULT_LOCALE;
}

export function detectBrowserLocale(languages: string[]): Locale {
  for (const language of languages) {
    const normalized = language.trim().toLowerCase();

    if (normalized === "en" || normalized.startsWith("en-")) return "en";
    if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
  }

  return DEFAULT_LOCALE;
}
