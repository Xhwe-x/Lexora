import { describe, expect, it } from "vitest";

import { evaluateVocabularyAnswer } from "./answer-evaluator";

describe("evaluateVocabularyAnswer", () => {
  it("accepts spelling answers after trimming and lowercasing", () => {
    expect(
      evaluateVocabularyAnswer({
        type: "SPELLING",
        userAnswer: " Available ",
        correctAnswer: "available",
      })
    ).toEqual({
      correct: true,
      normalizedUserAnswer: "available",
      normalizedCorrectAnswer: "available",
    });
  });

  it("rejects misspelled answers", () => {
    expect(
      evaluateVocabularyAnswer({
        type: "SPELLING",
        userAnswer: "availble",
        correctAnswer: "available",
      }).correct
    ).toBe(false);
  });

  it("evaluates context input with the spelling rules", () => {
    expect(
      evaluateVocabularyAnswer({
        type: "CONTEXT_INPUT",
        userAnswer: " MAINTAIN ",
        correctAnswer: "maintain",
      }).correct
    ).toBe(true);
  });

  it("trims meaning choices without changing their content", () => {
    expect(
      evaluateVocabularyAnswer({
        type: "MEANING_CHOICE",
        userAnswer: " 可获得的；有空的 ",
        correctAnswer: "可获得的；有空的",
      })
    ).toEqual({
      correct: true,
      normalizedUserAnswer: "可获得的；有空的",
      normalizedCorrectAnswer: "可获得的；有空的",
    });
  });

  it.each(["", "   "])("rejects an empty answer %j", (userAnswer) => {
    expect(
      evaluateVocabularyAnswer({
        type: "SPELLING",
        userAnswer,
        correctAnswer: "abandon",
      }).correct
    ).toBe(false);
  });
});
