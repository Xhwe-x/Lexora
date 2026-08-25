import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useMedia, useWindowSize } from "react-use";

import { ResultCard } from "@/app/lesson/result-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

type VocabularyCompletionProps = {
  xpAwarded: number;
  hearts: number;
  hasActiveSubscription: boolean;
  accuracy: number;
  masteredCount: number;
  totalWords: number;
};

export function VocabularyCompletion({
  xpAwarded,
  hearts,
  hasActiveSubscription,
  accuracy,
  masteredCount,
  totalWords,
}: VocabularyCompletionProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { width, height } = useWindowSize();
  const reduceMotion = useMedia("(prefers-reduced-motion: reduce)");

  return (
    <>
      {!reduceMotion && (
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
      )}
      <div
        id="main-content"
        className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-y-6 px-6 text-center"
      >
        <Image
          src="/finish.svg"
          alt=""
          aria-hidden="true"
          height={110}
          width={110}
        />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-600">
            {t("common.lessonComplete")}
          </p>
          <h1 className="mt-2 text-pretty text-3xl font-bold text-neutral-800">
            {t("vocabulary.completeTitle")}
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
          <ResultCard variant="points" value={xpAwarded} />
          <ResultCard
            variant="hearts"
            value={hasActiveSubscription ? Infinity : hearts}
          />
          <SummaryCard
            label={t("vocabulary.accuracy")}
            value={`${accuracy}%`}
          />
          <SummaryCard
            label={t("vocabulary.wordStatus")}
            value={`${masteredCount} ${t("vocabulary.mastered")} · ${
              totalWords - masteredCount
            } ${t("vocabulary.learning")}`}
          />
        </div>
      </div>
      <footer className="flex h-[100px] items-center border-t-2 px-6 lg:h-[140px]">
        <div className="mx-auto flex w-full max-w-[1140px] justify-end">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => router.push("/learn")}
          >
            {t("common.continue")}
          </Button>
        </div>
      </footer>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-sky-400 bg-sky-400">
      <p className="p-1.5 text-center text-xs font-bold uppercase text-white">
        {label}
      </p>
      <div className="flex min-h-20 items-center justify-center rounded-2xl bg-white p-3 text-center text-sm font-bold text-sky-500">
        {value}
      </div>
    </div>
  );
}
