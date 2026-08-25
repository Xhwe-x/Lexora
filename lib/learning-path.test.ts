import { describe, expect, it } from "vitest";

import { buildLearningPath } from "./learning-path";

const vocabularyLesson = {
  id: 1,
  title: "Vocabulary",
  unitId: 10,
  order: 1,
  challenges: [],
  lessonWords: [
    { word: { userWordProgress: [{ masteryLevel: 1 }] } },
    { word: { userWordProgress: [] } },
    { word: { userWordProgress: [] } },
  ],
};

const legacyLesson = {
  id: 2,
  title: "Legacy",
  unitId: 10,
  order: 2,
  lessonWords: [],
  challenges: [
    { challengeProgress: [{ completed: true }] },
    { challengeProgress: [] },
  ],
};

const unit = {
  id: 10,
  title: "Unit 1",
  description: "Core",
  courseId: 5,
  order: 1,
  lessons: [vocabularyLesson, legacyLesson],
};

describe("buildLearningPath", () => {
  it("selects an unfinished vocabulary lesson and calculates word progress", () => {
    const result = buildLearningPath([unit]);

    expect(result.activeLessonId).toBe(1);
    expect(result.activeLessonPercentage).toBe(33);
    expect(result.units[0].lessons[0].completed).toBe(false);
  });

  it("moves to the legacy lesson after vocabulary completion", () => {
    const completedVocabulary = {
      ...vocabularyLesson,
      lessonWords: vocabularyLesson.lessonWords.map(() => ({
        word: { userWordProgress: [{ masteryLevel: 1 }] },
      })),
    };
    const result = buildLearningPath([
      { ...unit, lessons: [completedVocabulary, legacyLesson] },
    ]);

    expect(result.activeLessonId).toBe(2);
    expect(result.activeLessonPercentage).toBe(50);
    expect(result.units[0].lessons[0].completed).toBe(true);
  });

  it("treats an empty lesson as unfinished instead of skipping it", () => {
    const emptyLesson = {
      ...legacyLesson,
      id: 3,
      challenges: [],
    };
    const result = buildLearningPath([{ ...unit, lessons: [emptyLesson] }]);

    expect(result.activeLessonId).toBe(3);
    expect(result.activeLessonPercentage).toBe(0);
  });

  it("returns no active lesson when every lesson is complete", () => {
    const completedLegacy = {
      ...legacyLesson,
      challenges: legacyLesson.challenges.map(() => ({
        challengeProgress: [{ completed: true }],
      })),
    };
    const completedVocabulary = {
      ...vocabularyLesson,
      lessonWords: vocabularyLesson.lessonWords.map(() => ({
        word: { userWordProgress: [{ masteryLevel: 1 }] },
      })),
    };
    const result = buildLearningPath([
      { ...unit, lessons: [completedVocabulary, completedLegacy] },
    ]);

    expect(result.activeLesson).toBeUndefined();
    expect(result.activeLessonId).toBeUndefined();
    expect(result.activeLessonPercentage).toBe(0);
  });
});
