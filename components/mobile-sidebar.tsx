"use client";

import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/provider";

import { Sidebar } from "./sidebar";

export const MobileSidebar = () => {
  const { t } = useI18n();

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t("common.openMenu")}
        className="rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-white"
      >
        <Menu aria-hidden="true" className="text-white" />
      </SheetTrigger>

      <SheetContent className="z-[100] p-0" side="left">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
