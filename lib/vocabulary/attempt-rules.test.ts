import { describe, expect, it } from "vitest";

import {
  getVocabularyMasteryLevel,
  getVocabularyProgressIncrements,
  getVocabularyXp,
  validateVocabularyAttemptInput,
} from "./attempt-rules";

describe("getVocabularyXp", () => {
  it.each([
    ["MEANING_CHOICE", 2],
    ["SPELLING", 3],
    ["CONTEXT_INPUT", 3],
  ] as const)("awards %s its configured XP", (type, expected) => {
    expect(getVocabularyXp(type, true)).toBe(expected);
  });

  it("awards no XP for an incorrect answer", () => {
    expect(getVocabularyXp("SPELLING", false)).toBe(0);
  });
});

describe("getVocabularyProgressIncrements", () => {
  it("increments only the correct counters for a correct spelling answer", () => {
    expect(getVocabularyProgressIncrements("SPELLING", true)).toEqual({
      meaningCorrect: 0,
      meaningWrong: 0,
      spellingCorrect: 1,
      spellingWrong: 0,
      contextCorrect: 0,
      contextWrong: 0,
      correctCount: 1,
      wrongCount: 0,
    });
  });

  it("increments only the wrong counters for an incorrect context answer", () => {
    expect(getVocabularyProgressIncrements("CONTEXT_INPUT", false)).toEqual({
      meaningCorrect: 0,
      meaningWrong: 0,
      spellingCorrect: 0,
      spellingWrong: 0,
      contextCorrect: 0,
      contextWrong: 1,
      correctCount: 0,
      wrongCount: 1,
    });
  });
});

describe("getVocabularyMasteryLevel", () => {
  it("keeps a word at level zero until its first correct answer", () => {
    expect(
      getVocabularyMasteryLevel({
        currentLevel: 0,
        meaningCorrect: 0,
        spellingCorrect: 0,
        correctCount: 0,
      })
    ).toBe(0);
  });

  it("raises a word to level one after its first correct answer", () => {
    expect(
      getVocabularyMasteryLevel({
        currentLevel: 0,
        meaningCorrect: 1,
        spellingCorrect: 0,
        correctCount: 1,
      })
    ).toBe(1);
  });

  it("raises a word to level two after two correct meaning answers", () => {
    expect(
      getVocabularyMasteryLevel({
        currentLevel: 1,
        meaningCorrect: 2,
        spellingCorrect: 0,
        correctCount: 2,
      })
    ).toBe(2);
  });

  it("raises a word to level three after spelling and total thresholds", () => {
    expect(
      getVocabularyMasteryLevel({
        currentLevel: 2,
        meaningCorrect: 2,
        spellingCorrect: 2,
        correctCount: 4,
      })
    ).toBe(3);
  });

  it("never lowers an existing mastery level", () => {
    expect(
      getVocabularyMasteryLevel({
        currentLevel: 3,
        meaningCorrect: 0,
        spellingCorrect: 0,
        correctCount: 0,
      })
    ).toBe(3);
  });
});

describe("validateVocabularyAttemptInput", () => {
  const validInput = {
    lessonId: 1,
    wordId: 2,
    exerciseType: "SPELLING" as const,
    userAnswer: "available",
    responseMs: 800,
  };

  it("accepts a valid attempt", () => {
    expect(() => validateVocabularyAttemptInput(validInput)).not.toThrow();
  });

  it.each([
    [{ ...validInput, lessonId: 0 }, "Invalid lesson."],
    [{ ...validInput, wordId: -1 }, "Invalid word."],
    [
      { ...validInput, exerciseType: "UNKNOWN" as never },
      "Invalid exercise type.",
    ],
    [{ ...validInput, userAnswer: 123 as never }, "Invalid answer."],
    [{ ...validInput, responseMs: -1 }, "Invalid response time."],
  ])("rejects malformed attempt input", (input, message) => {
    expect(() => validateVocabularyAttemptInput(input)).toThrow(message);
  });
});
