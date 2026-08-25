import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import {
  getLearningPath,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";

import { Header } from "./header";
import { Unit } from "./unit";

const LearnPage = async () => {
  await auth.protect();

  const userProgressData = getUserProgress();
  const learningPathData = getLearningPath();
  const userSubscriptionData = getUserSubscription();

  const [userProgress, learningPath, userSubscription] = await Promise.all([
    userProgressData,
    learningPathData,
    userSubscriptionData,
  ]);

  if (!learningPath || !userProgress || !userProgress.activeCourse)
    redirect("/courses");

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

        {!isPro && <Promo />}
        <Quests points={userProgress.points} />
      </StickyWrapper>
      <FeedWrapper>
        <Header title={userProgress.activeCourse.title} />
        {learningPath.units.map((unit) => (
          <div key={unit.id} className="mb-10">
            <Unit
              id={unit.id}
              order={unit.order}
              description={unit.description}
              title={unit.title}
              lessons={unit.lessons}
              activeLesson={learningPath.activeLesson}
              activeLessonPercentage={learningPath.activeLessonPercentage}
            />
          </div>
        ))}
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
