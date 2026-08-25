"use client";

import { Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/config";

type LocaleSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LocaleSwitcher({
  className,
  compact = false,
}: LocaleSwitcherProps) {
  const { locale, setLocale, isPending, t } = useI18n();

  const choices: Array<{ locale: Locale; label: string }> = [
    { locale: "zh-CN", label: t("locale.zh") },
    { locale: "en", label: t("locale.en") },
  ];

  return (
    <div
      role="group"
      aria-label={t("locale.switcherLabel")}
      className={cn(
        "inline-flex items-center rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm",
        className
      )}
    >
      {!compact && (
        <Languages
          aria-hidden="true"
          className="ml-1 mr-1.5 h-4 w-4 text-teal-700"
        />
      )}
      {choices.map((choice) => (
        <button
          key={choice.locale}
          type="button"
          aria-pressed={locale === choice.locale}
          disabled={isPending}
          onClick={() => setLocale(choice.locale)}
          className={cn(
            "min-h-8 rounded-lg px-2.5 text-xs font-black transition-colors focus-visible:ring-2 focus-visible:ring-sky-400",
            locale === choice.locale
              ? "bg-teal-700 text-white"
              : "text-slate-500 hover:bg-teal-50 hover:text-teal-800"
          )}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
