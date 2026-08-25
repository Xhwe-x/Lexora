"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type PropsWithChildren,
} from "react";

import { useRouter } from "next/navigation";

import { LOCALE_COOKIE, type Locale } from "./config";
import { translate, type MessageKey } from "./messages";

type I18nContextValue = {
  locale: Locale;
  isPending: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type LocaleProviderProps = PropsWithChildren<{
  initialLocale: Locale;
}>;

export function LocaleProvider({
  initialLocale,
  children,
}: LocaleProviderProps) {
  const router = useRouter();
  const [locale, setCurrentLocale] = useState(initialLocale);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      setCurrentLocale(nextLocale);
      document.documentElement.lang = nextLocale;
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      startTransition(() => router.refresh());
    },
    [locale, router]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isPending,
      setLocale,
      t: (key) => translate(locale, key),
    }),
    [isPending, locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside LocaleProvider");
  }

  return context;
}
