"use client";

import { useTransition } from "react";

import Image from "next/image";
import { toast } from "sonner";

import { refillHearts } from "@/actions/user-progress";
import { createStripeUrl } from "@/actions/user-subscription";
import { Button } from "@/components/ui/button";
import { MAX_HEARTS, POINTS_TO_REFILL } from "@/constants";
import { useI18n } from "@/lib/i18n/provider";

type ItemsProps = {
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
  stripeEnabled: boolean;
};

export const Items = ({
  hearts,
  points,
  hasActiveSubscription,
  stripeEnabled,
}: ItemsProps) => {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const onRefillHearts = () => {
    if (pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL) return;

    startTransition(() => {
      refillHearts().catch(() => toast.error(t("common.errorRetry")));
    });
  };

  const onUpgrade = () => {
    if (!stripeEnabled) {
      toast.error(t("shop.stripeUnavailable"));
      return;
    }

    toast.loading(t("shop.redirecting"));
    startTransition(() => {
      createStripeUrl()
        .then((response) => {
          if ("error" in response && response.error === "stripe_unavailable") {
            toast.error(t("shop.stripeUnavailable"));
            return;
          }

          if ("data" in response && response.data) {
            window.location.href = response.data;
          }
        })
        .catch(() => toast.error(t("common.errorRetry")));
    });
  };

  return (
    <ul className="w-full">
      <li className="flex w-full items-center gap-x-4 border-t-2 p-4">
        <Image src="/heart.svg" alt="Heart" height={60} width={60} />

        <div className="flex-1">
          <p className="text-base font-bold text-neutral-700 lg:text-xl">
            {t("shop.refillHearts")}
          </p>
        </div>

        <Button
          onClick={onRefillHearts}
          disabled={
            pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL
          }
          aria-disabled={
            pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL
          }
        >
          {hearts === MAX_HEARTS ? (
            t("common.full")
          ) : (
            <div className="flex items-center">
              <Image src="/points.svg" alt="Points" height={20} width={20} />

              <p>{POINTS_TO_REFILL}</p>
            </div>
          )}
        </Button>
      </li>

      <li className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
        <Image src="/unlimited.svg" alt="Unlimited" height={60} width={60} />

        <div className="flex-1">
          <p className="text-base font-bold text-neutral-700 lg:text-xl">
            {t("shop.unlimitedHearts")}
          </p>
        </div>

        <Button
          onClick={onUpgrade}
          disabled={pending || !stripeEnabled}
          aria-disabled={pending || !stripeEnabled}
        >
          {!stripeEnabled
            ? t("common.unavailable")
            : hasActiveSubscription
              ? t("common.settings")
              : t("common.upgrade")}
        </Button>
      </li>
    </ul>
  );
};
