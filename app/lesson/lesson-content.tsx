import { redirect } from "next/navigation";

import { VocabularyLesson } from "@/components/vocabulary-lesson/vocabulary-lesson";
import {
  getCourseProgress,
  getLesson,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";
import { getVocabularyLesson } from "@/db/vocabulary-queries";
import { buildVocabularySession } from "@/lib/vocabulary/session-builder";

import { Quiz } from "./quiz";

type LessonContentProps = {
  lessonId?: number;
};

export async function LessonContent({ lessonId }: LessonContentProps) {
  const [courseProgress, userProgress, userSubscription] = await Promise.all([
    lessonId ? Promise.resolve(null) : getCourseProgress(),
    getUserProgress(),
    getUserSubscription(),
  ]);
  const resolvedLessonId = lessonId ?? courseProgress?.activeLessonId;

  if (!resolvedLessonId || !userProgress) redirect("/learn");

  const vocabularyLesson = await getVocabularyLesson(resolvedLessonId);

  if (vocabularyLesson?.lessonWords.length) {
    const words = vocabularyLesson.lessonWords.map(({ word }) => ({
      id: word.id,
      word: word.word,
      translationCn: word.translationCn,
      examples: word.examples.map((example) => ({
        id: example.id,
        sentence: example.sentence,
        translationCn: example.translationCn,
      })),
    }));
    const initialMasteryLevels = Object.fromEntries(
      vocabularyLesson.lessonWords.map(({ word }) => [
        word.id,
        word.userWordProgress[0]?.masteryLevel ?? 0,
      ])
    );

    return (
      <VocabularyLesson
        lessonId={vocabularyLesson.id}
        initialHearts={userProgress.hearts}
        hasActiveSubscription={!!userSubscription?.isActive}
        initialExercises={buildVocabularySession(words)}
        words={words}
        initialMasteryLevels={initialMasteryLevels}
      />
    );
  }

  const lesson = await getLesson(resolvedLessonId);

  if (!lesson) redirect("/learn");

  const initialPercentage =
    lesson.challenges.length === 0
      ? 0
      : (lesson.challenges.filter((challenge) => challenge.completed).length /
          lesson.challenges.length) *
        100;

  return (
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={lesson.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      userSubscription={userSubscription}
    />
  );
}
