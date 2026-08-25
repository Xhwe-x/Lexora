import { cache } from "react";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import db from "./drizzle";
import { lessons, userWordProgress } from "./schema";

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
