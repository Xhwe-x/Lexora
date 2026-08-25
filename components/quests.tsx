import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QUESTS } from "@/constants";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

type QuestsProps = { points: number };

export const Quests = async ({ points }: QuestsProps) => {
  const locale = await getRequestLocale();

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex w-full items-center justify-between space-y-2">
        <h3 className="text-lg font-bold">
          {translate(locale, "quests.title")}
        </h3>

        <Button size="sm" variant="primaryOutline" asChild>
          <Link href="/quests" prefetch>
            {translate(locale, "quests.viewAll")}
          </Link>
        </Button>
      </div>

      <ul className="w-full space-y-4">
        {QUESTS.map((quest) => {
          const progress = (points / quest.value) * 100;

          return (
            <div
              className="flex w-full items-center gap-x-3 pb-4"
              key={quest.title}
            >
              <Image src="/points.svg" alt="Points" width={40} height={40} />

              <div className="flex w-full flex-col gap-y-2">
                <p className="text-sm font-bold text-neutral-700">
                  {translate(locale, "quests.earn")} {quest.value} XP
                </p>

                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </ul>
    </div>
  );
};
