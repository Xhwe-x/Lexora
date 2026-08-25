import { describe, expect, it } from "vitest";

import {
  getVocabularyLessonPercentage,
  isVocabularyLessonCompleted,
} from "./lesson-progress";

const lessonWords = [
  { word: { userWordProgress: [{ masteryLevel: 1 }] } },
  { word: { userWordProgress: [{ masteryLevel: 2 }] } },
  { word: { userWordProgress: [] } },
];

describe("isVocabularyLessonCompleted", () => {
  it("completes only when every lesson word reaches mastery level one", () => {
    expect(isVocabularyLessonCompleted(lessonWords)).toBe(false);
    expect(
      isVocabularyLessonCompleted([
        ...lessonWords.slice(0, 2),
        { word: { userWordProgress: [{ masteryLevel: 1 }] } },
      ])
    ).toBe(true);
  });

  it("does not complete an empty vocabulary lesson", () => {
    expect(isVocabularyLessonCompleted([])).toBe(false);
  });
});

describe("getVocabularyLessonPercentage", () => {
  it("calculates the percentage of words at mastery level one", () => {
    expect(getVocabularyLessonPercentage(lessonWords)).toBe(67);
  });

  it("returns zero for an empty vocabulary lesson", () => {
    expect(getVocabularyLessonPercentage([])).toBe(0);
  });
});
