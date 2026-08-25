type SpellingInputProps = {
  translation: string;
  value: string;
  disabled: boolean;
  correcting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function SpellingInput({
  translation,
  value,
  disabled,
  correcting,
  onChange,
  onSubmit,
}: SpellingInputProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 bg-slate-50 px-5 py-6 text-center text-xl font-bold text-neutral-700">
        {translation}
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-neutral-500">
          {correcting ? "请重新输入正确单词" : "请输入英文"}
        </span>
        <input
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
          className="h-14 w-full rounded-xl border-2 border-b-4 px-4 text-lg font-semibold text-neutral-700 outline-none transition focus:border-sky-400 disabled:bg-slate-50"
          placeholder="Type the word"
        />
      </label>
    </div>
  );
}
