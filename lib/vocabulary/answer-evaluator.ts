import { normalizeWord } from "./normalize-word";
import type { VocabularyExerciseType } from "./types";

type EvaluateVocabularyAnswerInput = {
  type: VocabularyExerciseType;
  userAnswer: string;
  correctAnswer: string;
};

export function evaluateVocabularyAnswer({
  type,
  userAnswer,
  correctAnswer,
}: EvaluateVocabularyAnswerInput) {
  const normalizeAnswer =
    type === "MEANING_CHOICE" ? (value: string) => value.trim() : normalizeWord;
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);

  return {
    correct: normalizedUserAnswer === normalizedCorrectAnswer,
    normalizedUserAnswer,
    normalizedCorrectAnswer,
  };
}
