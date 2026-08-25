import { TypingReview, WordInputTrack } from "./word-input-track";

type ContextInputProps = {
  prompt: string;
  translation: string | null;
  targetWord: string;
  value: string;
  disabled: boolean;
  correcting: boolean;
  submittedAnswer: string;
  correctAnswer: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ContextInput({
  prompt,
  translation,
  targetWord,
  value,
  disabled,
  correcting,
  submittedAnswer,
  correctAnswer,
  onChange,
  onSubmit,
}: ContextInputProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 bg-slate-50 px-5 py-6">
        <p className="text-center text-xl font-bold text-neutral-700">
          {prompt}
        </p>
        {translation && (
          <p className="mt-3 text-center text-sm text-neutral-500">
            {translation}
          </p>
        )}
      </div>
      {correcting && submittedAnswer && correctAnswer && (
        <TypingReview value={submittedAnswer} correctAnswer={correctAnswer} />
      )}
      <WordInputTrack
        label={correcting ? "请重新输入正确单词" : "填写空缺单词"}
        value={value}
        targetLength={targetWord.length}
        disabled={disabled}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
