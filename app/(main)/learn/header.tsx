import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

type HeaderProps = {
  title: string;
};

export const Header = async ({ title }: HeaderProps) => {
  const locale = await getRequestLocale();

  return (
    <div className="sticky top-0 mb-5 flex items-center justify-between border-b-2 bg-white pb-3 text-neutral-400 lg:z-50 lg:mt-[-28px] lg:pt-[28px]">
      <Button size="sm" variant="ghost" asChild>
        <Link
          href="/courses"
          prefetch
          aria-label={translate(locale, "common.backToCourses")}
        >
          <ArrowLeft className="h-5 w-5 stroke-2 text-neutral-400" />
        </Link>
      </Button>

      <h1 className="text-lg font-bold">{title}</h1>
      <div aria-hidden />
    </div>
  );
};
