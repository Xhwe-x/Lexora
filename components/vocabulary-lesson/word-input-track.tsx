import { cn } from "@/lib/utils";
import {
  buildTypingFeedback,
  type TypingFeedbackCell,
} from "@/lib/vocabulary/typing-feedback";
import { useI18n } from "@/lib/i18n/provider";

type WordInputTrackProps = {
  label: string;
  value: string;
  targetLength: number;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function WordInputTrack({
  label,
  value,
  targetLength,
  disabled,
  onChange,
  onSubmit,
}: WordInputTrackProps) {
  const { t } = useI18n();
  const cells = buildTypingFeedback({ value, targetLength });

  return (
    <label className="block space-y-3">
      <span className="text-sm font-bold text-neutral-500">{label}</span>
      <div className="group relative rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-3 py-5 shadow-sm transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
        <div
          aria-hidden
          className="flex min-h-12 flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        >
          {cells.map((cell) => (
            <LetterCell key={cell.index} cell={cell} />
          ))}
        </div>
        <input
          aria-label={label}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-default"
        />
      </div>
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-400">
        <span>
          {value.length} {t("vocabulary.lettersTyped")}
        </span>
        <span>{t("vocabulary.pressEnter")}</span>
      </div>
    </label>
  );
}

type TypingReviewProps = {
  value: string;
  correctAnswer: string;
};

export function TypingReview({ value, correctAnswer }: TypingReviewProps) {
  const { t } = useI18n();
  const cells = buildTypingFeedback({
    value,
    targetLength: correctAnswer.length,
    correctAnswer,
    reveal: true,
  });

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-rose-500">
        {t("vocabulary.firstReview")}
      </p>
      <div
        className="flex flex-wrap justify-center gap-1.5"
        aria-label={t("vocabulary.spellingReview")}
      >
        {cells.map((cell) => (
          <LetterCell key={cell.index} cell={cell} compact />
        ))}
      </div>
    </div>
  );
}

function LetterCell({
  cell,
  compact = false,
}: {
  cell: TypingFeedbackCell;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-lg border-2 font-mono font-black uppercase transition",
        compact
          ? "h-9 w-7 text-sm"
          : "h-11 w-7 text-lg sm:h-12 sm:w-10 sm:text-xl",
        cell.state === "EMPTY" && "border-slate-200 bg-slate-50 text-slate-300",
        cell.state === "ACTIVE" &&
          "animate-pulse border-sky-400 bg-sky-50 text-sky-500",
        cell.state === "TYPED" && "border-slate-400 bg-white text-neutral-800",
        cell.state === "CORRECT" &&
          "border-green-400 bg-green-100 text-green-700",
        cell.state === "WRONG" && "border-rose-400 bg-rose-100 text-rose-700",
        cell.state === "MISSING" &&
          "border-dashed border-amber-400 bg-amber-50 text-amber-700"
      )}
    >
      {cell.value || (cell.state === "MISSING" ? cell.expected : "")}
      {cell.state === "ACTIVE" && (
        <span className="absolute -bottom-0.5 h-0.5 w-3 rounded-full bg-sky-500" />
      )}
      {cell.state === "WRONG" && cell.expected && (
        <span className="absolute -bottom-4 text-[9px] font-bold lowercase text-green-600">
          {cell.expected}
        </span>
      )}
    </span>
  );
}
