"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useAudio, useWindowSize } from "react-use";
import { toast } from "sonner";

import { submitVocabularyAttempt } from "@/actions/vocabulary-attempt";
import { Header } from "@/app/lesson/header";
import { ResultCard } from "@/app/lesson/result-card";
import { Button } from "@/components/ui/button";
import {
  calculateLessonAccuracy,
  getIncorrectFeedbackState,
  isCorrectionAnswerAccepted,
  type VocabularyFeedbackState,
} from "@/lib/vocabulary/lesson-flow";
import {
  requeueWrongExercise,
  type VocabularySessionWord,
} from "@/lib/vocabulary/session-builder";
import type { VocabularyExercise } from "@/lib/vocabulary/types";
import { cn } from "@/lib/utils";

import { ContextInput } from "./context-input";
import { FeedbackPanel } from "./feedback-panel";
import { MeaningChoice } from "./meaning-choice";
import { SpellingInput } from "./spelling-input";

type VocabularyLessonProps = {
  lessonId: number;
  initialHearts: number;
  hasActiveSubscription: boolean;
  initialExercises: VocabularyExercise[];
  words: VocabularySessionWord[];
  initialMasteryLevels: Record<number, number>;
};

export function VocabularyLesson({
  lessonId,
  initialHearts,
  hasActiveSubscription,
  initialExercises,
  words,
  initialMasteryLevels,
}: VocabularyLessonProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [pending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [correctAudio, _correctAudio, correctControls] = useAudio({
    src: "/correct.wav",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incorrectAudio, _incorrectAudio, incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio, , finishControls] = useAudio({
    src: "/finish.mp3",
  });
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const [exercises, setExercises] = useState(initialExercises);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [feedbackState, setFeedbackState] =
    useState<VocabularyFeedbackState>("answering");
  const [hearts, setHearts] = useState(initialHearts);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [lastXpAwarded, setLastXpAwarded] = useState(0);
  const [formalAttempts, setFormalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [masteryLevels, setMasteryLevels] = useState(initialMasteryLevels);

  const exercise = exercises[activeIndex];
  const currentWord = words.find((word) => word.id === exercise?.wordId);
  const currentExample = currentWord?.examples.find(
    (example) => example.id === exercise?.exampleId
  );
  const percentage =
    exercises.length === 0
      ? 0
      : Math.min(100, (activeIndex / exercises.length) * 100);

  useEffect(() => {
    if (!exercise) void finishControls.play();
  }, [exercise, finishControls]);

  const resetForNextExercise = () => {
    setActiveIndex((index) => index + 1);
    setAnswer("");
    setSubmittedAnswer("");
    setCorrectAnswer("");
    setFeedbackState("answering");
    setLastXpAwarded(0);
    startedAt.current = Date.now();
  };

  const handleAction = () => {
    if (pending || !exercise || !currentWord) return;

    if (
      feedbackState === "correct" ||
      feedbackState === "wrong" ||
      feedbackState === "corrected"
    ) {
      resetForNextExercise();
      return;
    }

    if (feedbackState === "correcting") {
      if (!isCorrectionAnswerAccepted(answer, correctAnswer)) {
        toast.error("请准确输入上方显示的正确单词。");
        return;
      }

      setFeedbackState("corrected");
      void correctControls.play();
      return;
    }

    if (!answer.trim()) return;

    const formalAnswer = answer;
    setSubmittedAnswer(formalAnswer);

    startTransition(async () => {
      try {
        const response = await submitVocabularyAttempt({
          lessonId,
          wordId: exercise.wordId,
          exerciseType: exercise.type,
          exampleId: exercise.exampleId,
          userAnswer: formalAnswer,
          responseMs: Date.now() - startedAt.current,
        });

        setFormalAttempts((count) => count + 1);
        setHearts(response.hearts);
        setXpAwarded((total) => total + response.xpAwarded);
        setLastXpAwarded(response.xpAwarded);
        setMasteryLevels((levels) => ({
          ...levels,
          [exercise.wordId]: response.masteryLevel,
        }));
        setCorrectAnswer(response.correctAnswer);

        if (response.correct) {
          setCorrectAttempts((count) => count + 1);
          setFeedbackState("correct");
          void correctControls.play();
          return;
        }

        setExercises((currentExercises) =>
          requeueWrongExercise({
            exercises: currentExercises,
            currentIndex: activeIndex,
            wrongExercise: exercise,
            words,
          })
        );
        setFeedbackState(getIncorrectFeedbackState(exercise.type));
        setAnswer(exercise.type === "MEANING_CHOICE" ? formalAnswer : "");
        void incorrectControls.play();
      } catch {
        toast.error("提交失败，请稍后重试。");
      }
    });
  };

  if (!exercise) {
    const accuracy = calculateLessonAccuracy(correctAttempts, formalAttempts);
    const masteredCount = words.filter(
      (word) => (masteryLevels[word.id] ?? 0) >= 1
    ).length;

    return (
      <>
        {finishAudio}
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-y-6 px-6 text-center">
          <Image src="/finish.svg" alt="Finish" height={110} width={110} />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-green-500">
              Lesson Complete
            </p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-700">
              三个核心单词训练完成
            </h1>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
            <ResultCard variant="points" value={xpAwarded} />
            <ResultCard
              variant="hearts"
              value={hasActiveSubscription ? Infinity : hearts}
            />
            <SummaryCard label="正确率" value={`${accuracy}%`} />
            <SummaryCard
              label="词汇状态"
              value={`${masteredCount} 掌握 · ${words.length - masteredCount} 学习中`}
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
              继续
            </Button>
          </div>
        </footer>
      </>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex h-full items-center justify-center font-bold text-rose-500">
        课程单词数据不完整。
      </div>
    );
  }

  const correcting = feedbackState === "correcting";
  const canSubmit = answer.trim().length > 0;
  const title = correcting
    ? "请重新输入正确单词"
    : exercise.type === "MEANING_CHOICE"
      ? "请选择正确中文"
      : exercise.type === "SPELLING"
        ? "请输入英文"
        : "完成句子";
  const buttonLabel =
    feedbackState === "answering"
      ? "检查"
      : feedbackState === "correcting"
        ? "确认拼写"
        : "继续";

  return (
    <>
      {correctAudio}
      {incorrectAudio}
      {finishAudio}
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={hasActiveSubscription}
      />
      {hearts === 0 && !hasActiveSubscription && (
        <p className="mt-3 text-center text-sm font-semibold text-rose-500">
          Hearts 已用完，仍可继续完成本次训练。
        </p>
      )}
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[640px] space-y-8 px-6 py-8 lg:px-0">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-sky-500">
              CET-4 Vocabulary
            </p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-700 lg:text-3xl">
              {title}
            </h1>
          </div>

          {exercise.type === "MEANING_CHOICE" && (
            <MeaningChoice
              prompt={exercise.prompt}
              options={exercise.options ?? []}
              selectedAnswer={answer}
              correctAnswer={correctAnswer}
              feedbackState={feedbackState}
              disabled={pending || feedbackState !== "answering"}
              onSelect={setAnswer}
            />
          )}
          {exercise.type === "SPELLING" && (
            <SpellingInput
              translation={exercise.prompt}
              targetWord={currentWord.word}
              value={answer}
              disabled={
                pending || (!correcting && feedbackState !== "answering")
              }
              correcting={correcting}
              submittedAnswer={submittedAnswer}
              correctAnswer={correctAnswer}
              onChange={setAnswer}
              onSubmit={handleAction}
            />
          )}
          {exercise.type === "CONTEXT_INPUT" && (
            <ContextInput
              prompt={exercise.prompt}
              translation={currentExample?.translationCn ?? null}
              targetWord={currentWord.word}
              value={answer}
              disabled={
                pending || (!correcting && feedbackState !== "answering")
              }
              correcting={correcting}
              submittedAnswer={submittedAnswer}
              correctAnswer={correctAnswer}
              onChange={setAnswer}
              onSubmit={handleAction}
            />
          )}
        </div>
      </main>
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
            xpAwarded={lastXpAwarded}
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
            onClick={handleAction}
          >
            {buttonLabel}
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
