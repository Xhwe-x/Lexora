"use client";

import { ClerkLoading, ClerkLoaded, UserButton } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

import { SidebarItem } from "./sidebar-item";

type SidebarProps = {
  className?: string;
};

export const Sidebar = ({ className }: SidebarProps) => {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "left-0 top-0 flex h-full flex-col border-r border-slate-200/80 bg-white/90 px-4 shadow-[12px_0_40px_-32px_hsl(var(--lexora-shadow)/0.45)] backdrop-blur-xl lg:fixed lg:w-[256px]",
        className
      )}
    >
      <Link href="/learn" prefetch>
        <div className="flex items-center gap-x-3 pb-7 pl-4 pt-8">
          <Image src="/mascot.svg" alt="Mascot" height={40} width={40} />

          <h1 className="text-2xl font-extrabold tracking-wide text-green-600">
            Lexora
          </h1>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-y-2">
        <SidebarItem
          label={t("navigation.learn")}
          href="/learn"
          iconSrc="/learn.svg"
        />
        <SidebarItem
          label={t("navigation.leaderboard")}
          href="/leaderboard"
          iconSrc="/leaderboard.svg"
        />
        <SidebarItem
          label={t("navigation.quests")}
          href="/quests"
          iconSrc="/quests.svg"
        />
        <SidebarItem
          label={t("navigation.shop")}
          href="/shop"
          iconSrc="/shop.svg"
        />
      </div>

      <div className="space-y-4 p-4">
        <LocaleSwitcher className="w-full justify-center" />
        <ClerkLoading>
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </ClerkLoading>

        <ClerkLoaded>
          <UserButton
            appearance={{
              elements: { userButtonPopoverCard: { pointerEvents: "initial" } },
            }}
          />
        </ClerkLoaded>
      </div>
    </div>
  );
};
