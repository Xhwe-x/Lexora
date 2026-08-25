import { describe, expect, it } from "vitest";

import {
  calculateLessonAccuracy,
  getIncorrectFeedbackState,
  isCorrectionAnswerAccepted,
} from "./lesson-flow";

describe("getIncorrectFeedbackState", () => {
  it.each(["SPELLING", "CONTEXT_INPUT"] as const)(
    "requires correction for %s",
    (type) => {
      expect(getIncorrectFeedbackState(type)).toBe("correcting");
    }
  );

  it("lets a wrong meaning choice continue after feedback", () => {
    expect(getIncorrectFeedbackState("MEANING_CHOICE")).toBe("wrong");
  });
});

describe("isCorrectionAnswerAccepted", () => {
  it("accepts the correct word after trimming and lowercasing", () => {
    expect(isCorrectionAnswerAccepted(" Available ", "available")).toBe(true);
  });

  it("rejects another misspelling", () => {
    expect(isCorrectionAnswerAccepted("availble", "available")).toBe(false);
  });
});

describe("calculateLessonAccuracy", () => {
  it("calculates accuracy from formal attempts", () => {
    expect(calculateLessonAccuracy(7, 9)).toBe(78);
  });

  it("returns zero before the first formal attempt", () => {
    expect(calculateLessonAccuracy(0, 0)).toBe(0);
  });
});
