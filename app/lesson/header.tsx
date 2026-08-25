import { InfinityIcon, X } from "lucide-react";
import Image from "next/image";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/provider";
import { useExitModal } from "@/store/use-exit-modal";

type HeaderProps = {
  hearts: number;
  percentage: number;
  hasActiveSubscription: boolean;
};

export const Header = ({
  hearts,
  percentage,
  hasActiveSubscription,
}: HeaderProps) => {
  const { t } = useI18n();
  const { open } = useExitModal();

  return (
    <header className="mx-auto flex w-full max-w-[1140px] items-center justify-between gap-x-7 px-10 pt-[20px] lg:pt-[50px]">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={open}
        className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <X aria-hidden="true" />
      </button>

      <Progress value={percentage} />

      <LocaleSwitcher compact className="shrink-0" />

      <div className="flex items-center font-bold text-rose-500">
        <Image
          src="/heart.svg"
          height={28}
          width={28}
          alt={t("common.hearts")}
          className="mr-2"
        />
        {hasActiveSubscription ? (
          <InfinityIcon
            aria-hidden="true"
            className="h-6 w-6 shrink-0 stroke-[3]"
          />
        ) : (
          hearts
        )}
      </div>
    </header>
  );
};
