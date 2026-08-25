import { describe, expect, it } from "vitest";

import {
  buildVocabularySession,
  requeueWrongExercise,
} from "./session-builder";

const demoWords = [
  {
    id: 1,
    word: "abandon",
    translationCn: "放弃；抛弃",
    examples: [
      {
        id: 11,
        sentence: "They had to abandon the plan.",
        translationCn: "他们不得不放弃这个计划。",
      },
    ],
  },
  {
    id: 2,
    word: "available",
    translationCn: "可获得的；有空的",
    examples: [
      {
        id: 22,
        sentence: "The doctor is available this afternoon.",
        translationCn: "医生今天下午有空。",
      },
    ],
  },
  {
    id: 3,
    word: "maintain",
    translationCn: "维持；保持",
    examples: [
      {
        id: 33,
        sentence: "It is important to maintain a healthy lifestyle.",
        translationCn: "保持健康的生活方式很重要。",
      },
    ],
  },
];

describe("buildVocabularySession", () => {
  it("builds all three exercise types for every word", () => {
    const exercises = buildVocabularySession(demoWords, () => 0);

    expect(exercises).toHaveLength(9);

    for (const word of demoWords) {
      expect(
        exercises
          .filter((exercise) => exercise.wordId === word.id)
          .map((exercise) => exercise.type)
          .sort()
      ).toEqual(["CONTEXT_INPUT", "MEANING_CHOICE", "SPELLING"]);
    }
  });

  it("keeps meaning options unique", () => {
    const exercises = buildVocabularySession(
      [
        ...demoWords,
        {
          id: 4,
          word: "preserve",
          translationCn: "维持；保持",
          examples: [
            {
              id: 44,
              sentence: "We preserve the original design.",
              translationCn: "我们保留原始设计。",
            },
          ],
        },
      ],
      () => 0
    );

    for (const exercise of exercises.filter(
      (item) => item.type === "MEANING_CHOICE"
    )) {
      expect(new Set(exercise.options).size).toBe(exercise.options?.length);
    }
  });

  it("includes the correct translation in every meaning choice", () => {
    const exercises = buildVocabularySession(demoWords, () => 0);

    for (const exercise of exercises.filter(
      (item) => item.type === "MEANING_CHOICE"
    )) {
      const word = demoWords.find((item) => item.id === exercise.wordId);
      expect(exercise.options).toContain(word?.translationCn);
    }
  });

  it("blanks the target word in context prompts", () => {
    const exercises = buildVocabularySession(demoWords, () => 0);
    const contextExercise = exercises.find(
      (exercise) => exercise.wordId === 2 && exercise.type === "CONTEXT_INPUT"
    );

    expect(contextExercise).toMatchObject({
      prompt: "The doctor is ______ this afternoon.",
      exampleId: 22,
    });
  });

  it("rejects context exercises without an example", () => {
    expect(() =>
      buildVocabularySession(
        [{ id: 5, word: "missing", translationCn: "缺失", examples: [] }],
        () => 0
      )
    ).toThrow("Context exercise requires an example for missing");
  });
});

describe("requeueWrongExercise", () => {
  it("inserts a retry at current index plus three when RNG is zero", () => {
    const exercises = buildVocabularySession(demoWords, () => 0);
    const wrongExercise = exercises[1];

    const requeued = requeueWrongExercise({
      exercises,
      currentIndex: 1,
      wrongExercise,
      words: demoWords,
      rng: () => 0,
    });

    expect(requeued).toHaveLength(exercises.length + 1);
    expect(requeued[4]).toMatchObject({
      wordId: wrongExercise.wordId,
      type: "CONTEXT_INPUT",
    });
  });

  it("inserts a retry at current index plus five when RNG approaches one", () => {
    const exercises = buildVocabularySession(demoWords, () => 0);
    const wrongExercise = exercises[1];

    const requeued = requeueWrongExercise({
      exercises,
      currentIndex: 1,
      wrongExercise,
      words: demoWords,
      rng: () => 0.999,
    });

    expect(requeued[6].wordId).toBe(wrongExercise.wordId);
  });

  it.each([
    ["MEANING_CHOICE", "SPELLING"],
    ["SPELLING", "CONTEXT_INPUT"],
    ["CONTEXT_INPUT", "MEANING_CHOICE"],
  ] as const)("changes %s retries to %s", (originalType, retryType) => {
    const exercises = buildVocabularySession(demoWords, () => 0);
    const wrongExercise = exercises.find(
      (exercise) => exercise.wordId === 1 && exercise.type === originalType
    );

    if (!wrongExercise) throw new Error("Missing fixture exercise");

    const requeued = requeueWrongExercise({
      exercises,
      currentIndex: 0,
      wrongExercise,
      words: demoWords,
      rng: () => 0,
    });

    expect(requeued[3].type).toBe(retryType);
  });

  it("rejects retries for a word outside the lesson", () => {
    const exercises = buildVocabularySession(demoWords, () => 0);

    expect(() =>
      requeueWrongExercise({
        exercises,
        currentIndex: 0,
        wrongExercise: { ...exercises[0], wordId: 999 },
        words: demoWords,
        rng: () => 0,
      })
    ).toThrow("Retry word is missing from the lesson");
  });
});
