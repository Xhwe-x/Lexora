import { normalizeWord } from "./normalize-word";
import type { VocabularyExerciseType } from "./types";

export type VocabularyFeedbackState =
  "answering" | "correct" | "wrong" | "correcting" | "corrected";

export function getIncorrectFeedbackState(
  type: VocabularyExerciseType
): VocabularyFeedbackState {
  return type === "MEANING_CHOICE" ? "wrong" : "correcting";
}

export function isCorrectionAnswerAccepted(
  userAnswer: string,
  correctAnswer: string
) {
  return normalizeWord(userAnswer) === normalizeWord(correctAnswer);
}

export function calculateLessonAccuracy(
  correctAttempts: number,
  totalAttempts: number
) {
  if (totalAttempts === 0) return 0;
  return Math.round((correctAttempts / totalAttempts) * 100);
}
