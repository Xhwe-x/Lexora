import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const Promo = async () => {
  const locale = await getRequestLocale();

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-x-2">
          <Image src="/unlimited.svg" alt="Pro" height={26} width={26} />

          <h3 className="text-lg font-bold">
            {translate(locale, "promo.title")}
          </h3>
        </div>

        <p className="text-muted-foreground">
          {translate(locale, "promo.description")}
        </p>
      </div>

      <Button variant="super" className="w-full" size="lg" asChild>
        <Link href="/shop" prefetch>
          {translate(locale, "promo.action")}
        </Link>
      </Button>
    </div>
  );
};
