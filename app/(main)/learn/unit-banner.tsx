import { NotebookText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

type UnitBannerProps = {
  title: string;
  description: string;
};

export const UnitBanner = async ({ title, description }: UnitBannerProps) => {
  const locale = await getRequestLocale();

  return (
    <div className="flex w-full items-center justify-between rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-700 to-emerald-600 p-6 text-white shadow-[0_20px_50px_-30px_hsl(var(--lexora-shadow)/0.8)]">
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-lg">{description}</p>
      </div>

      <Button
        size="lg"
        variant="default"
        className="hidden border-white/70 bg-white text-teal-800 hover:bg-teal-50 xl:flex"
        asChild
      >
        <Link href="/lesson" prefetch>
          <NotebookText aria-hidden="true" className="mr-2" />
          {translate(locale, "learn.continue")}
        </Link>
      </Button>
    </div>
  );
};
