"use client";

import { useI18n } from "@/lib/i18n/provider";

export function SkipLink() {
  const { t } = useI18n();

  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-xl bg-teal-800 px-4 py-2 font-bold text-white shadow-lg transition-transform focus:translate-y-0"
    >
      {t("common.skipToContent")}
    </a>
  );
}
