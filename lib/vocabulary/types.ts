export type VocabularyExerciseType =
  | "MEANING_CHOICE"
  | "SPELLING"
  | "CONTEXT_INPUT";

export type VocabularyExercise = {
  id: string;
  wordId: number;
  type: VocabularyExerciseType;
  prompt: string;
  options?: string[];
  exampleId?: number;
  source: "STATIC";
};
