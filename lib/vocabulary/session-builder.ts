import type { VocabularyExercise, VocabularyExerciseType } from "./types";

export type VocabularySessionWord = {
  id: number;
  word: string;
  translationCn: string;
  examples: {
    id: number;
    sentence: string;
    translationCn: string | null;
  }[];
};

const exerciseTypes: VocabularyExerciseType[] = [
  "MEANING_CHOICE",
  "SPELLING",
  "CONTEXT_INPUT",
];

const retryTypes: Record<VocabularyExerciseType, VocabularyExerciseType> = {
  MEANING_CHOICE: "SPELLING",
  SPELLING: "CONTEXT_INPUT",
  CONTEXT_INPUT: "MEANING_CHOICE",
};

function shuffle<T>(values: T[], rng: () => number) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function blankWord(sentence: string, word: string) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(`\\b${escapedWord}\\b`, "i"), "______");
}

function buildExercise(input: {
  word: VocabularySessionWord;
  words: VocabularySessionWord[];
  type: VocabularyExerciseType;
  idSuffix: string;
  rng: () => number;
}): VocabularyExercise {
  const { word, words, type, idSuffix, rng } = input;
  const id = `${word.id}:${type}:${idSuffix}`;

  if (type === "MEANING_CHOICE") {
    const options = shuffle(
      Array.from(new Set(words.map((item) => item.translationCn))),
      rng
    );

    return {
      id,
      wordId: word.id,
      type,
      prompt: word.word,
      options,
      source: "STATIC",
    };
  }

  if (type === "SPELLING") {
    return {
      id,
      wordId: word.id,
      type,
      prompt: word.translationCn,
      source: "STATIC",
    };
  }

  const example = word.examples[0];

  if (!example) {
    throw new Error(`Context exercise requires an example for ${word.word}`);
  }

  return {
    id,
    wordId: word.id,
    type,
    prompt: blankWord(example.sentence, word.word),
    exampleId: example.id,
    source: "STATIC",
  };
}

export function buildVocabularySession(
  words: VocabularySessionWord[],
  rng: () => number = Math.random
) {
  return words.flatMap((word) =>
    exerciseTypes.map((type, index) =>
      buildExercise({
        word,
        words,
        type,
        idSuffix: String(index + 1),
        rng,
      })
    )
  );
}

export function requeueWrongExercise(input: {
  exercises: VocabularyExercise[];
  currentIndex: number;
  wrongExercise: VocabularyExercise;
  words: VocabularySessionWord[];
  rng?: () => number;
}) {
  const {
    exercises,
    currentIndex,
    wrongExercise,
    words,
    rng = Math.random,
  } = input;
  const word = words.find((item) => item.id === wrongExercise.wordId);

  if (!word) throw new Error("Retry word is missing from the lesson");

  const retryType = retryTypes[wrongExercise.type];
  const retryCount =
    exercises.filter(
      (exercise) => exercise.wordId === word.id && exercise.type === retryType
    ).length + 1;
  const retryExercise = buildExercise({
    word,
    words,
    type: retryType,
    idSuffix: `retry-${retryCount}`,
    rng,
  });
  const offset = 3 + Math.floor(rng() * 3);
  const insertionIndex = Math.min(currentIndex + offset, exercises.length);
  const result = [...exercises];

  result.splice(insertionIndex, 0, retryExercise);

  return result;
}
