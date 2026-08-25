"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import {
  exerciseAttempts,
  lessonWords,
  userProgress,
  userWordProgress,
  wordExamples,
} from "@/db/schema";
import { evaluateVocabularyAnswer } from "@/lib/vocabulary/answer-evaluator";
import {
  getVocabularyProgressIncrements,
  getVocabularyXp,
  validateVocabularyAttemptInput,
  type VocabularyAttemptInput,
} from "@/lib/vocabulary/attempt-rules";

export async function submitVocabularyAttempt(input: VocabularyAttemptInput) {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  validateVocabularyAttemptInput(input);

  const lessonWord = await db.query.lessonWords.findFirst({
    where: and(
      eq(lessonWords.lessonId, input.lessonId),
      eq(lessonWords.wordId, input.wordId)
    ),
    with: { word: true },
  });

  if (!lessonWord) throw new Error("Word is not part of this lesson.");

  if (input.exerciseType === "CONTEXT_INPUT") {
    if (!input.exampleId) throw new Error("Context example is required.");

    const example = await db.query.wordExamples.findFirst({
      where: and(
        eq(wordExamples.id, input.exampleId),
        eq(wordExamples.wordId, input.wordId)
      ),
      columns: { id: true },
    });

    if (!example) throw new Error("Example is not part of this word.");
  }

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { userId: true },
  });

  if (!currentUserProgress) throw new Error("User progress not found.");

  const correctAnswer =
    input.exerciseType === "MEANING_CHOICE"
      ? lessonWord.word.translationCn
      : lessonWord.word.word;
  const evaluation = evaluateVocabularyAnswer({
    type: input.exerciseType,
    userAnswer: input.userAnswer,
    correctAnswer,
  });
  const increments = getVocabularyProgressIncrements(
    input.exerciseType,
    evaluation.correct
  );
  const xpAwarded = getVocabularyXp(input.exerciseType, evaluation.correct);
  const now = new Date();

  const insertAttemptQuery = db.insert(exerciseAttempts).values({
    userId,
    wordId: input.wordId,
    lessonId: input.lessonId,
    exerciseType: input.exerciseType,
    userAnswer: input.userAnswer,
    correctAnswer,
    correct: evaluation.correct,
    responseMs: input.responseMs,
  });

  const progressUpdates = {
    meaningCorrect: sql`${userWordProgress.meaningCorrect} + ${increments.meaningCorrect}`,
    meaningWrong: sql`${userWordProgress.meaningWrong} + ${increments.meaningWrong}`,
    spellingCorrect: sql`${userWordProgress.spellingCorrect} + ${increments.spellingCorrect}`,
    spellingWrong: sql`${userWordProgress.spellingWrong} + ${increments.spellingWrong}`,
    contextCorrect: sql`${userWordProgress.contextCorrect} + ${increments.contextCorrect}`,
    contextWrong: sql`${userWordProgress.contextWrong} + ${increments.contextWrong}`,
    correctCount: sql`${userWordProgress.correctCount} + ${increments.correctCount}`,
    wrongCount: sql`${userWordProgress.wrongCount} + ${increments.wrongCount}`,
    lastAnsweredAt: now,
    updatedAt: now,
    ...(evaluation.correct ? {} : { lastWrongAt: now }),
  };
  const upsertProgressQuery = db
    .insert(userWordProgress)
    .values({
      userId,
      wordId: input.wordId,
      meaningCorrect: increments.meaningCorrect,
      meaningWrong: increments.meaningWrong,
      spellingCorrect: increments.spellingCorrect,
      spellingWrong: increments.spellingWrong,
      contextCorrect: increments.contextCorrect,
      contextWrong: increments.contextWrong,
      correctCount: increments.correctCount,
      wrongCount: increments.wrongCount,
      lastWrongAt: evaluation.correct ? null : now,
      lastAnsweredAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userWordProgress.userId, userWordProgress.wordId],
      set: progressUpdates,
    });
  const updateMasteryQuery = db
    .update(userWordProgress)
    .set({
      masteryLevel: sql<number>`greatest(
        ${userWordProgress.masteryLevel},
        case
          when ${userWordProgress.spellingCorrect} >= 2
            and ${userWordProgress.correctCount} >= 4 then 3
          when ${userWordProgress.meaningCorrect} >= 2 then 2
          when ${userWordProgress.correctCount} >= 1 then 1
          else 0
        end
      )`,
      updatedAt: now,
    })
    .where(
      and(
        eq(userWordProgress.userId, userId),
        eq(userWordProgress.wordId, input.wordId)
      )
    )
    .returning({ masteryLevel: userWordProgress.masteryLevel });
  const updateUserProgressQuery = db
    .update(userProgress)
    .set(
      evaluation.correct
        ? { points: sql`${userProgress.points} + ${xpAwarded}` }
        : { hearts: sql`greatest(${userProgress.hearts} - 1, 0)` }
    )
    .where(eq(userProgress.userId, userId))
    .returning({ hearts: userProgress.hearts });

  const [, , masteryRows, userProgressRows] = await db.batch([
    insertAttemptQuery,
    upsertProgressQuery,
    updateMasteryQuery,
    updateUserProgressQuery,
  ]);
  const masteryLevel = masteryRows[0]?.masteryLevel;
  const hearts = userProgressRows[0]?.hearts;

  if (masteryLevel === undefined || hearts === undefined) {
    throw new Error("Failed to update vocabulary progress.");
  }

  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath("/lesson");
  revalidatePath(`/lesson/${input.lessonId}`);

  return {
    correct: evaluation.correct,
    correctAnswer,
    xpAwarded,
    hearts,
    masteryLevel,
  };
}
