"use client";

import { useEffect } from "react";

import { useAudio } from "react-use";

import { Header } from "@/app/lesson/header";
import { useI18n } from "@/lib/i18n/provider";
import type { VocabularySessionWord } from "@/lib/vocabulary/session-builder";
import type { VocabularyExercise } from "@/lib/vocabulary/types";

import { ExerciseStage } from "./exercise-stage";
import { useVocabularyLesson } from "./use-vocabulary-lesson";
import { VocabularyCompletion } from "./vocabulary-completion";
import { VocabularyFooter } from "./vocabulary-footer";

type VocabularyLessonProps = {
  lessonId: number;
  initialHearts: number;
  hasActiveSubscription: boolean;
  initialExercises: VocabularyExercise[];
  words: VocabularySessionWord[];
  initialMasteryLevels: Record<number, number>;
};

export function VocabularyLesson({
  lessonId,
  initialHearts,
  hasActiveSubscription,
  initialExercises,
  words,
  initialMasteryLevels,
}: VocabularyLessonProps) {
  const { t } = useI18n();
  const [correctAudio, , correctControls] = useAudio({ src: "/correct.wav" });
  const [incorrectAudio, , incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio, , finishControls] = useAudio({ src: "/finish.mp3" });
  const lesson = useVocabularyLesson({
    lessonId,
    initialHearts,
    initialExercises,
    words,
    initialMasteryLevels,
    onCorrect: () => void correctControls.play(),
    onIncorrect: () => void incorrectControls.play(),
  });

  useEffect(() => {
    if (lesson.completed) void finishControls.play();
  }, [finishControls, lesson.completed]);

  const audio = (
    <>
      {correctAudio}
      {incorrectAudio}
      {finishAudio}
    </>
  );

  if (lesson.completed) {
    return (
      <>
        {audio}
        <VocabularyCompletion
          xpAwarded={lesson.xpAwarded}
          hearts={lesson.hearts}
          hasActiveSubscription={hasActiveSubscription}
          accuracy={lesson.accuracy}
          masteredCount={lesson.masteredCount}
          totalWords={words.length}
        />
      </>
    );
  }

  if (!lesson.exercise || !lesson.currentWord) {
    return (
      <>
        {audio}
        <div
          id="main-content"
          className="flex h-full items-center justify-center font-bold text-rose-500"
        >
          {t("vocabulary.dataMissing")}
        </div>
      </>
    );
  }

  return (
    <>
      {audio}
      <Header
        hearts={lesson.hearts}
        percentage={lesson.percentage}
        hasActiveSubscription={hasActiveSubscription}
      />
      {lesson.hearts === 0 && !hasActiveSubscription && (
        <p className="mt-3 text-center text-sm font-semibold text-rose-500">
          {t("vocabulary.heartsEmpty")}
        </p>
      )}
      <ExerciseStage
        exercise={lesson.exercise}
        currentWord={lesson.currentWord}
        currentExample={lesson.currentExample}
        answer={lesson.answer}
        submittedAnswer={lesson.submittedAnswer}
        correctAnswer={lesson.correctAnswer}
        feedbackState={lesson.feedbackState}
        pending={lesson.pending}
        correcting={lesson.correcting}
        onAnswerChange={lesson.setAnswer}
        onSubmit={lesson.handleAction}
      />
      <VocabularyFooter
        feedbackState={lesson.feedbackState}
        submittedAnswer={lesson.submittedAnswer}
        correctAnswer={lesson.correctAnswer}
        xpAwarded={lesson.lastXpAwarded}
        hearts={lesson.hearts}
        pending={lesson.pending}
        canSubmit={lesson.canSubmit}
        correcting={lesson.correcting}
        onAction={lesson.handleAction}
      />
    </>
  );
}
