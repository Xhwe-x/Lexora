import type { VocabularyExerciseType } from "./types";

export type VocabularyAttemptInput = {
  lessonId: number;
  wordId: number;
  exerciseType: VocabularyExerciseType;
  exampleId?: number;
  userAnswer: string;
  responseMs?: number;
};

const exerciseTypes: VocabularyExerciseType[] = [
  "MEANING_CHOICE",
  "SPELLING",
  "CONTEXT_INPUT",
];

const xpByType: Record<VocabularyExerciseType, number> = {
  MEANING_CHOICE: 2,
  SPELLING: 3,
  CONTEXT_INPUT: 3,
};

export function getVocabularyXp(
  type: VocabularyExerciseType,
  correct: boolean
) {
  return correct ? xpByType[type] : 0;
}

export function getVocabularyProgressIncrements(
  type: VocabularyExerciseType,
  correct: boolean
) {
  return {
    meaningCorrect: type === "MEANING_CHOICE" && correct ? 1 : 0,
    meaningWrong: type === "MEANING_CHOICE" && !correct ? 1 : 0,
    spellingCorrect: type === "SPELLING" && correct ? 1 : 0,
    spellingWrong: type === "SPELLING" && !correct ? 1 : 0,
    contextCorrect: type === "CONTEXT_INPUT" && correct ? 1 : 0,
    contextWrong: type === "CONTEXT_INPUT" && !correct ? 1 : 0,
    correctCount: correct ? 1 : 0,
    wrongCount: correct ? 0 : 1,
  };
}

export function getVocabularyMasteryLevel(input: {
  currentLevel: number;
  meaningCorrect: number;
  spellingCorrect: number;
  correctCount: number;
}) {
  const { currentLevel, meaningCorrect, spellingCorrect, correctCount } = input;

  if (spellingCorrect >= 2 && correctCount >= 4) {
    return Math.max(currentLevel, 3);
  }

  if (meaningCorrect >= 2) return Math.max(currentLevel, 2);
  if (correctCount >= 1) return Math.max(currentLevel, 1);

  return currentLevel;
}

export function validateVocabularyAttemptInput(input: VocabularyAttemptInput) {
  if (!Number.isInteger(input.lessonId) || input.lessonId <= 0) {
    throw new Error("Invalid lesson.");
  }

  if (!Number.isInteger(input.wordId) || input.wordId <= 0) {
    throw new Error("Invalid word.");
  }

  if (!exerciseTypes.includes(input.exerciseType)) {
    throw new Error("Invalid exercise type.");
  }

  if (typeof input.userAnswer !== "string") {
    throw new Error("Invalid answer.");
  }

  if (
    input.responseMs !== undefined &&
    (!Number.isInteger(input.responseMs) || input.responseMs < 0)
  ) {
    throw new Error("Invalid response time.");
  }
}
