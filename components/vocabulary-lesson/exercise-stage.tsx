import { useI18n } from "@/lib/i18n/provider";
import type { VocabularyFeedbackState } from "@/lib/vocabulary/lesson-flow";
import type { VocabularySessionWord } from "@/lib/vocabulary/session-builder";
import type { VocabularyExercise } from "@/lib/vocabulary/types";

import { ContextInput } from "./context-input";
import { MeaningChoice } from "./meaning-choice";
import { SpellingInput } from "./spelling-input";

type ExerciseStageProps = {
  exercise: VocabularyExercise;
  currentWord: VocabularySessionWord;
  currentExample: VocabularySessionWord["examples"][number] | undefined;
  answer: string;
  submittedAnswer: string;
  correctAnswer: string;
  feedbackState: VocabularyFeedbackState;
  pending: boolean;
  correcting: boolean;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
};

export function ExerciseStage({
  exercise,
  currentWord,
  currentExample,
  answer,
  submittedAnswer,
  correctAnswer,
  feedbackState,
  pending,
  correcting,
  onAnswerChange,
  onSubmit,
}: ExerciseStageProps) {
  const { t } = useI18n();
  const title = correcting
    ? t("vocabulary.correctionTitle")
    : exercise.type === "MEANING_CHOICE"
      ? t("vocabulary.meaningTitle")
      : exercise.type === "SPELLING"
        ? t("vocabulary.spellingTitle")
        : t("vocabulary.contextTitle");
  const inputDisabled =
    pending || (!correcting && feedbackState !== "answering");

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-[640px] space-y-8 px-6 py-8 lg:px-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-teal-600">
            CET-4 Vocabulary
          </p>
          <h1 className="mt-2 text-pretty text-2xl font-bold text-neutral-800 lg:text-3xl">
            {title}
          </h1>
        </div>

        {exercise.type === "MEANING_CHOICE" && (
          <MeaningChoice
            prompt={exercise.prompt}
            options={exercise.options ?? []}
            selectedAnswer={answer}
            correctAnswer={correctAnswer}
            feedbackState={feedbackState}
            disabled={pending || feedbackState !== "answering"}
            onSelect={onAnswerChange}
          />
        )}
        {exercise.type === "SPELLING" && (
          <SpellingInput
            translation={exercise.prompt}
            targetWord={currentWord.word}
            value={answer}
            disabled={inputDisabled}
            correcting={correcting}
            submittedAnswer={submittedAnswer}
            correctAnswer={correctAnswer}
            onChange={onAnswerChange}
            onSubmit={onSubmit}
          />
        )}
        {exercise.type === "CONTEXT_INPUT" && (
          <ContextInput
            prompt={exercise.prompt}
            translation={currentExample?.translationCn ?? null}
            targetWord={currentWord.word}
            value={answer}
            disabled={inputDisabled}
            correcting={correcting}
            submittedAnswer={submittedAnswer}
            correctAnswer={correctAnswer}
            onChange={onAnswerChange}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </main>
  );
}
