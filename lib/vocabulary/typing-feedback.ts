export type TypingFeedbackState =
  "EMPTY" | "ACTIVE" | "TYPED" | "CORRECT" | "WRONG" | "MISSING";

export type TypingFeedbackCell = {
  index: number;
  value: string;
  expected?: string;
  state: TypingFeedbackState;
};

type BuildTypingFeedbackInput = {
  value: string;
  targetLength: number;
  correctAnswer?: string;
  reveal?: boolean;
};

export function buildTypingFeedback({
  value,
  targetLength,
  correctAnswer = "",
  reveal = false,
}: BuildTypingFeedbackInput): TypingFeedbackCell[] {
  const length = Math.max(targetLength, value.length, correctAnswer.length);

  return Array.from({ length }, (_, index) => {
    const typedLetter = value[index] ?? "";

    if (!reveal) {
      return {
        index,
        value: typedLetter,
        state:
          typedLetter.length > 0
            ? "TYPED"
            : index === value.length
              ? "ACTIVE"
              : "EMPTY",
      };
    }

    const expectedLetter = correctAnswer[index] ?? "";
    const matches =
      typedLetter.length > 0 &&
      typedLetter.toLowerCase() === expectedLetter.toLowerCase();

    return {
      index,
      value: typedLetter,
      expected: expectedLetter,
      state: matches ? "CORRECT" : typedLetter ? "WRONG" : "MISSING",
    };
  });
}
