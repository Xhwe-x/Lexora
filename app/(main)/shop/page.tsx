import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import { isStripeKeyConfigured } from "@/lib/stripe-config";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

import { Items } from "./items";

const ShopPage = async () => {
  await auth.protect();
  const locale = await getRequestLocale();

  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();

  const [userProgress, userSubscription] = await Promise.all([
    userProgressData,
    userSubscriptionData,
  ]);

  if (!userProgress || !userProgress.activeCourse) redirect("/courses");

  const isPro = !!userSubscription?.isActive;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
          hasActiveSubscription={isPro}
        />

        <Quests points={userProgress.points} />
      </StickyWrapper>

      <FeedWrapper>
        <div className="flex w-full flex-col items-center">
          <Image
            src="/shop.svg"
            alt={translate(locale, "shop.title")}
            height={90}
            width={90}
            loading="eager"
          />

          <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
            {translate(locale, "shop.title")}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {translate(locale, "shop.description")}
          </p>

          <Items
            hearts={userProgress.hearts}
            points={userProgress.points}
            hasActiveSubscription={isPro}
            stripeEnabled={isStripeKeyConfigured(
              process.env.STRIPE_API_SECRET_KEY
            )}
          />
        </div>
      </FeedWrapper>
    </div>
  );
};

export default ShopPage;
