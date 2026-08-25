import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import type { VocabularyFeedbackState } from "@/lib/vocabulary/lesson-flow";
import { cn } from "@/lib/utils";

import { FeedbackPanel } from "./feedback-panel";

type VocabularyFooterProps = {
  feedbackState: VocabularyFeedbackState;
  submittedAnswer: string;
  correctAnswer: string;
  xpAwarded: number;
  hearts: number;
  pending: boolean;
  canSubmit: boolean;
  correcting: boolean;
  onAction: () => void;
};

export function VocabularyFooter({
  feedbackState,
  submittedAnswer,
  correctAnswer,
  xpAwarded,
  hearts,
  pending,
  canSubmit,
  correcting,
  onAction,
}: VocabularyFooterProps) {
  const { t } = useI18n();
  const buttonLabel =
    feedbackState === "answering"
      ? t("common.check")
      : feedbackState === "correcting"
        ? t("vocabulary.confirmSpelling")
        : t("common.continue");

  return (
    <footer
      className={cn(
        "min-h-[110px] border-t-2 px-6 py-5 lg:min-h-[140px] lg:px-10",
        (feedbackState === "correct" || feedbackState === "corrected") &&
          "border-transparent bg-green-100",
        (feedbackState === "wrong" || feedbackState === "correcting") &&
          "border-transparent bg-rose-100"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1140px] items-center gap-6">
        <FeedbackPanel
          state={feedbackState}
          userAnswer={submittedAnswer}
          correctAnswer={correctAnswer}
          xpAwarded={xpAwarded}
          hearts={hearts}
        />
        <Button
          className="ml-auto shrink-0"
          size="lg"
          variant={
            feedbackState === "wrong" || feedbackState === "correcting"
              ? "danger"
              : "secondary"
          }
          disabled={
            pending ||
            ((feedbackState === "answering" || correcting) && !canSubmit)
          }
          onClick={onAction}
        >
          {pending ? t("common.working") : buttonLabel}
        </Button>
      </div>
    </footer>
  );
}
