import { cache } from "react";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { buildLearningPath } from "@/lib/learning-path";

import db from "./drizzle";
import {
  challengeProgress,
  courses,
  lessons,
  lessonWords,
  units,
  userProgress,
  userSubscription,
  userWordProgress,
} from "./schema";

const DAY_IN_MS = 86_400_000;

export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();

  return data;
});

export const getUserProgress = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

export const getLearningPath = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) return null;

  const data = await db.query.units.findMany({
    where: eq(units.courseId, userProgress.activeCourseId),
    orderBy: (units, { asc }) => [asc(units.order)],
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          lessonWords: {
            orderBy: (lessonWords, { asc }) => [asc(lessonWords.order)],
            with: {
              word: {
                with: {
                  userWordProgress: {
                    where: eq(userWordProgress.userId, userId),
                  },
                },
              },
            },
          },
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  return buildLearningPath(data);
});

export const getUnits = cache(async () => {
  return (await getLearningPath())?.units ?? [];
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
          },
        },
      },
    },
  });

  return data;
});

export const getCourseProgress = cache(async () => {
  const learningPath = await getLearningPath();

  if (!learningPath) return null;

  return {
    activeLesson: learningPath.activeLesson,
    activeLessonId: learningPath.activeLessonId,
  };
});

export const getLessonMode = cache(async (lessonId: number) => {
  const vocabularyWord = await db.query.lessonWords.findFirst({
    where: eq(lessonWords.lessonId, lessonId),
    columns: { id: true },
  });

  return vocabularyWord ? ("VOCABULARY" as const) : ("LEGACY" as const);
});

export const getVocabularyLesson = cache(async (lessonId: number) => {
  const { userId } = await auth();

  if (!userId) return null;

  return db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      unit: {
        with: {
          course: true,
        },
      },
      lessonWords: {
        orderBy: (lessonWords, { asc }) => [asc(lessonWords.order)],
        with: {
          word: {
            with: {
              examples: {
                orderBy: (examples, { asc }) => [asc(examples.id)],
              },
              userWordProgress: {
                where: eq(userWordProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });
});

export const getLesson = cache(async (id?: number) => {
  const { userId } = await auth();

  if (!userId) return null;

  const courseProgress = await getCourseProgress();
  const lessonId = id || courseProgress?.activeLessonId;

  if (!lessonId) return null;

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        with: {
          challengeOptions: true,
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.challenges) return null;

  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed =
      challenge.challengeProgress &&
      challenge.challengeProgress.length > 0 &&
      challenge.challengeProgress.every((progress) => progress.completed);

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges };
});

export const getLessonPercentage = cache(async () => {
  return (await getLearningPath())?.activeLessonPercentage ?? 0;
});

export const getUserSubscription = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const data = await db.query.userSubscription.findFirst({
    where: eq(userSubscription.userId, userId),
  });

  if (!data) return null;

  const isActive =
    data.stripePriceId &&
    data.stripeCurrentPeriodEnd?.getTime() + DAY_IN_MS > Date.now();

  return {
    ...data,
    isActive: !!isActive,
  };
});

export const getTopTenUsers = cache(async () => {
  const { userId } = await auth();

  if (!userId) return [];

  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    },
  });

  return data;
});
