import { describe, expect, it } from "vitest";

import { buildTypingFeedback } from "./typing-feedback";

describe("buildTypingFeedback", () => {
  it("shows typed, active, and empty positions before submission", () => {
    expect(buildTypingFeedback({ value: "ava", targetLength: 5 })).toEqual([
      { index: 0, value: "a", state: "TYPED" },
      { index: 1, value: "v", state: "TYPED" },
      { index: 2, value: "a", state: "TYPED" },
      { index: 3, value: "", state: "ACTIVE" },
      { index: 4, value: "", state: "EMPTY" },
    ]);
  });

  it("does not expose expected letters before review", () => {
    const feedback = buildTypingFeedback({ value: "ab", targetLength: 4 });

    expect(feedback.every((item) => item.expected === undefined)).toBe(true);
  });

  it("marks correct, wrong, and missing letters during review", () => {
    expect(
      buildTypingFeedback({
        value: "availbl",
        targetLength: 9,
        correctAnswer: "available",
        reveal: true,
      }).map(({ state }) => state)
    ).toEqual([
      "CORRECT",
      "CORRECT",
      "CORRECT",
      "CORRECT",
      "CORRECT",
      "WRONG",
      "WRONG",
      "MISSING",
      "MISSING",
    ]);
  });

  it("compares review letters without case sensitivity", () => {
    expect(
      buildTypingFeedback({
        value: "ABANDON",
        targetLength: 7,
        correctAnswer: "abandon",
        reveal: true,
      }).every(({ state }) => state === "CORRECT")
    ).toBe(true);
  });

  it("keeps overflow letters visible as wrong", () => {
    const feedback = buildTypingFeedback({
      value: "maintains",
      targetLength: 8,
      correctAnswer: "maintain",
      reveal: true,
    });

    expect(feedback).toHaveLength(9);
    expect(feedback[8]).toEqual({
      index: 8,
      value: "s",
      expected: "",
      state: "WRONG",
    });
  });
});
