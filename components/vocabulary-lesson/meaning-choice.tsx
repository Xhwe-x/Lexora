import { cn } from "@/lib/utils";
import type { VocabularyFeedbackState } from "@/lib/vocabulary/lesson-flow";

type MeaningChoiceProps = {
  prompt: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  feedbackState: VocabularyFeedbackState;
  disabled: boolean;
  onSelect: (answer: string) => void;
};

export function MeaningChoice({
  prompt,
  options,
  selectedAnswer,
  correctAnswer,
  feedbackState,
  disabled,
  onSelect,
}: MeaningChoiceProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-b from-sky-50 to-white px-6 py-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-500">
          Choose the meaning
        </p>
        <p className="mt-3 break-words text-4xl font-black tracking-wide text-neutral-800 sm:text-5xl">
          {prompt}
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((option, index) => {
          const selected = selectedAnswer === option;
          const checked = feedbackState !== "answering";
          const correct = checked && option === correctAnswer;
          const wrong = checked && selected && !correct;

          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onSelect(option)}
              className={cn(
                "flex min-h-16 items-center justify-between rounded-xl border-2 border-b-4 px-5 py-3 text-left font-semibold text-neutral-600 transition hover:bg-black/5 active:border-b-2",
                selected && "border-sky-300 bg-sky-100 text-sky-600",
                correct && "border-green-400 bg-green-100 text-green-600",
                wrong && "border-rose-400 bg-rose-100 text-rose-600",
                disabled && "cursor-default"
              )}
            >
              <span>{option}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 text-sm text-neutral-400">
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
