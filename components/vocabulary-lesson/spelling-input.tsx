import { TypingReview, WordInputTrack } from "./word-input-track";
import { useI18n } from "@/lib/i18n/provider";

type SpellingInputProps = {
  translation: string;
  targetWord: string;
  value: string;
  disabled: boolean;
  correcting: boolean;
  submittedAnswer: string;
  correctAnswer: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function SpellingInput({
  translation,
  targetWord,
  value,
  disabled,
  correcting,
  submittedAnswer,
  correctAnswer,
  onChange,
  onSubmit,
}: SpellingInputProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 bg-slate-50 px-5 py-6 text-center text-xl font-bold text-neutral-700">
        {translation}
      </div>
      {correcting && submittedAnswer && correctAnswer && (
        <TypingReview value={submittedAnswer} correctAnswer={correctAnswer} />
      )}
      <WordInputTrack
        label={
          correcting
            ? t("vocabulary.correctionTitle")
            : t("vocabulary.inputEnglish")
        }
        value={value}
        targetLength={targetWord.length}
        disabled={disabled}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
