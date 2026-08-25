"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { toast } from "sonner";

import { submitVocabularyAttempt } from "@/actions/vocabulary-attempt";
import { useI18n } from "@/lib/i18n/provider";
import {
  calculateLessonAccuracy,
  getIncorrectFeedbackState,
  isCorrectionAnswerAccepted,
  type VocabularyFeedbackState,
} from "@/lib/vocabulary/lesson-flow";
import {
  requeueWrongExercise,
  type VocabularySessionWord,
} from "@/lib/vocabulary/session-builder";
import type { VocabularyExercise } from "@/lib/vocabulary/types";

type UseVocabularyLessonInput = {
  lessonId: number;
  initialHearts: number;
  initialExercises: VocabularyExercise[];
  words: VocabularySessionWord[];
  initialMasteryLevels: Record<number, number>;
  onCorrect: () => void;
  onIncorrect: () => void;
};

export function useVocabularyLesson({
  lessonId,
  initialHearts,
  initialExercises,
  words,
  initialMasteryLevels,
  onCorrect,
  onIncorrect,
}: UseVocabularyLessonInput) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const [exercises, setExercises] = useState(initialExercises);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [feedbackState, setFeedbackState] =
    useState<VocabularyFeedbackState>("answering");
  const [hearts, setHearts] = useState(initialHearts);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [lastXpAwarded, setLastXpAwarded] = useState(0);
  const [formalAttempts, setFormalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [masteryLevels, setMasteryLevels] = useState(initialMasteryLevels);

  const exercise = exercises[activeIndex];
  const currentWord = words.find((word) => word.id === exercise?.wordId);
  const currentExample = currentWord?.examples.find(
    (example) => example.id === exercise?.exampleId
  );
  const percentage =
    exercises.length === 0
      ? 0
      : Math.min(100, (activeIndex / exercises.length) * 100);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const resetForNextExercise = () => {
    setActiveIndex((index) => index + 1);
    setAnswer("");
    setSubmittedAnswer("");
    setCorrectAnswer("");
    setFeedbackState("answering");
    setLastXpAwarded(0);
    startedAt.current = Date.now();
  };

  const handleAction = () => {
    if (pending || !exercise || !currentWord) return;

    if (["correct", "wrong", "corrected"].includes(feedbackState)) {
      resetForNextExercise();
      return;
    }

    if (feedbackState === "correcting") {
      if (!isCorrectionAnswerAccepted(answer, correctAnswer)) {
        toast.error(t("vocabulary.correctionError"));
        return;
      }

      setFeedbackState("corrected");
      onCorrect();
      return;
    }

    if (!answer.trim()) return;

    const formalAnswer = answer;
    setSubmittedAnswer(formalAnswer);

    startTransition(async () => {
      try {
        const response = await submitVocabularyAttempt({
          lessonId,
          wordId: exercise.wordId,
          exerciseType: exercise.type,
          exampleId: exercise.exampleId,
          userAnswer: formalAnswer,
          responseMs: Date.now() - startedAt.current,
        });

        setFormalAttempts((count) => count + 1);
        setHearts(response.hearts);
        setXpAwarded((total) => total + response.xpAwarded);
        setLastXpAwarded(response.xpAwarded);
        setMasteryLevels((levels) => ({
          ...levels,
          [exercise.wordId]: response.masteryLevel,
        }));
        setCorrectAnswer(response.correctAnswer);

        if (response.correct) {
          setCorrectAttempts((count) => count + 1);
          setFeedbackState("correct");
          onCorrect();
          return;
        }

        setExercises((currentExercises) =>
          requeueWrongExercise({
            exercises: currentExercises,
            currentIndex: activeIndex,
            wrongExercise: exercise,
            words,
          })
        );
        setFeedbackState(getIncorrectFeedbackState(exercise.type));
        setAnswer(exercise.type === "MEANING_CHOICE" ? formalAnswer : "");
        onIncorrect();
      } catch {
        toast.error(t("vocabulary.submitError"));
      }
    });
  };

  const masteredCount = words.filter(
    (word) => (masteryLevels[word.id] ?? 0) >= 1
  ).length;

  return {
    answer,
    setAnswer,
    submittedAnswer,
    correctAnswer,
    feedbackState,
    hearts,
    xpAwarded,
    lastXpAwarded,
    pending,
    exercise,
    currentWord,
    currentExample,
    percentage,
    correcting: feedbackState === "correcting",
    canSubmit: answer.trim().length > 0,
    completed: !exercise,
    accuracy: calculateLessonAccuracy(correctAttempts, formalAttempts),
    masteredCount,
    handleAction,
  };
}
