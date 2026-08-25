import { CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VocabularyFeedbackState } from "@/lib/vocabulary/lesson-flow";
import { useI18n } from "@/lib/i18n/provider";

type FeedbackPanelProps = {
  state: VocabularyFeedbackState;
  userAnswer: string;
  correctAnswer: string;
  xpAwarded: number;
  hearts: number;
};

export function FeedbackPanel({
  state,
  userAnswer,
  correctAnswer,
  xpAwarded,
  hearts,
}: FeedbackPanelProps) {
  const { t } = useI18n();

  if (state === "answering") return null;

  const positive = state === "correct" || state === "corrected";

  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
      <div
        className={cn(
          "flex items-start gap-3",
          positive ? "text-green-600" : "text-rose-600"
        )}
      >
        {positive ? (
          <CheckCircle aria-hidden="true" className="mt-0.5 h-7 w-7 shrink-0" />
        ) : (
          <XCircle aria-hidden="true" className="mt-0.5 h-7 w-7 shrink-0" />
        )}
        <div>
          <p className="text-lg font-black">
            {state === "correct" && t("vocabulary.perfect")}
            {state === "corrected" && t("vocabulary.corrected")}
            {state === "wrong" && t("vocabulary.wrong")}
            {state === "correcting" && t("vocabulary.spellingWrong")}
          </p>
          {!positive && (
            <div className="mt-1 text-sm">
              <p>
                {t("vocabulary.yourAnswer")}：{userAnswer || "—"}
              </p>
              <p>
                {t("vocabulary.correctAnswer")}：{correctAnswer}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-black">
        {xpAwarded > 0 && (
          <span className="rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1 text-orange-600">
            +{xpAwarded} XP
          </span>
        )}
        <span className="rounded-full border-2 border-rose-200 bg-white/70 px-3 py-1 text-rose-500">
          ❤️ {hearts}
        </span>
      </div>
    </div>
  );
}
