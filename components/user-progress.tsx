import { InfinityIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { courses } from "@/db/schema";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

type UserProgressProps = {
  activeCourse: typeof courses.$inferSelect;
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

export const UserProgress = async ({
  activeCourse,
  hearts,
  points,
  hasActiveSubscription,
}: UserProgressProps) => {
  const locale = await getRequestLocale();

  return (
    <div className="flex w-full items-center justify-between gap-x-2">
      <Button variant="ghost" asChild>
        <Link href="/courses" prefetch>
          <Image
            src={activeCourse.imageSrc}
            alt={activeCourse.title}
            className="rounded-md border"
            width={32}
            height={32}
          />
        </Link>
      </Button>

      <Button variant="ghost" className="text-orange-500" asChild>
        <Link href="/shop" prefetch>
          <Image
            src="/points.svg"
            height={28}
            width={28}
            alt={translate(locale, "common.points")}
            className="mr-2"
          />
          {points}
        </Link>
      </Button>

      <Button variant="ghost" className="text-rose-500" asChild>
        <Link href="/shop" prefetch>
          <Image
            src="/heart.svg"
            height={22}
            width={22}
            alt={translate(locale, "common.hearts")}
            className="mr-2"
          />
          {hasActiveSubscription ? (
            <InfinityIcon aria-hidden="true" className="stroke-3 h-4 w-4" />
          ) : (
            hearts
          )}
        </Link>
      </Button>
    </div>
  );
};
