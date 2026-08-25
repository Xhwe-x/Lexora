import { CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VocabularyFeedbackState } from "@/lib/vocabulary/lesson-flow";

type FeedbackPanelProps = {
  state: VocabularyFeedbackState;
  userAnswer: string;
  correctAnswer: string;
};

export function FeedbackPanel({
  state,
  userAnswer,
  correctAnswer,
}: FeedbackPanelProps) {
  if (state === "answering") return null;

  const positive = state === "correct" || state === "corrected";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        positive ? "text-green-600" : "text-rose-600"
      )}
    >
      {positive ? (
        <CheckCircle className="mt-0.5 h-7 w-7 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 h-7 w-7 shrink-0" />
      )}
      <div>
        <p className="font-bold">
          {state === "correct" && "回答正确！"}
          {state === "corrected" && "已完成纠正，可以继续。"}
          {state === "wrong" && "回答错误"}
          {state === "correcting" && "拼写错误，请完成纠正"}
        </p>
        {!positive && (
          <div className="mt-1 text-sm">
            <p>你的答案：{userAnswer || "（空）"}</p>
            <p>正确答案：{correctAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
