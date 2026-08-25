type ContextInputProps = {
  prompt: string;
  translation: string | null;
  value: string;
  disabled: boolean;
  correcting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ContextInput({
  prompt,
  translation,
  value,
  disabled,
  correcting,
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
      <label className="block space-y-2">
        <span className="text-sm font-bold text-neutral-500">
          {correcting ? "请重新输入正确单词" : "填写空缺单词"}
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
          placeholder="Type the missing word"
        />
      </label>
    </div>
  );
}
