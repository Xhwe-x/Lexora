import "server-only";

import { cache } from "react";

import { cookies, headers } from "next/headers";

import {
  detectBrowserLocale,
  LOCALE_COOKIE,
  resolveLocale,
  type Locale,
} from "./config";

function parseAcceptedLanguages(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((entry) => entry.split(";")[0]?.trim())
    .filter((entry): entry is string => Boolean(entry));
}

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;

  if (cookieLocale) return resolveLocale(cookieLocale);

  const acceptedLanguages = parseAcceptedLanguages(
    (await headers()).get("accept-language")
  );
  return detectBrowserLocale(acceptedLanguages);
});
