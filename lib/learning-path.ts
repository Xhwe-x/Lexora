import {
  getVocabularyLessonPercentage,
  isVocabularyLessonCompleted,
} from "./vocabulary/lesson-progress";

type ChallengeProgress = {
  completed: boolean;
};

type LearningChallenge = {
  challengeProgress: ChallengeProgress[];
};

type LearningWordProgress = {
  masteryLevel: number;
};

type LearningLessonWord = {
  word: {
    userWordProgress: LearningWordProgress[];
  };
};

export type LearningPathLesson = {
  id: number;
  title: string;
  unitId: number;
  order: number;
  challenges: LearningChallenge[];
  lessonWords: LearningLessonWord[];
};

export type LearningPathUnit = {
  id: number;
  title: string;
  description: string;
  courseId: number;
  order: number;
  lessons: LearningPathLesson[];
};

function isChallengeCompleted(challenge: LearningChallenge) {
  return (
    challenge.challengeProgress.length > 0 &&
    challenge.challengeProgress.every((progress) => progress.completed)
  );
}

function isLessonCompleted(lesson: LearningPathLesson) {
  if (lesson.lessonWords.length > 0) {
    return isVocabularyLessonCompleted(lesson.lessonWords);
  }

  return (
    lesson.challenges.length > 0 &&
    lesson.challenges.every(isChallengeCompleted)
  );
}

function getLessonPercentage(lesson: LearningPathLesson) {
  if (lesson.lessonWords.length > 0) {
    return getVocabularyLessonPercentage(lesson.lessonWords);
  }

  if (lesson.challenges.length === 0) return 0;

  const completedChallenges =
    lesson.challenges.filter(isChallengeCompleted).length;
  return Math.round((completedChallenges / lesson.challenges.length) * 100);
}

export function buildLearningPath(units: LearningPathUnit[]) {
  const normalizedUnits = units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => ({
      ...lesson,
      completed: isLessonCompleted(lesson),
    })),
  }));
  const activeEntry = normalizedUnits
    .flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, unit })))
    .find(({ lesson }) => !lesson.completed);

  if (!activeEntry) {
    return {
      units: normalizedUnits,
      activeLesson: undefined,
      activeLessonId: undefined,
      activeLessonPercentage: 0,
    };
  }

  const unit = {
    id: activeEntry.unit.id,
    title: activeEntry.unit.title,
    description: activeEntry.unit.description,
    courseId: activeEntry.unit.courseId,
    order: activeEntry.unit.order,
  };

  return {
    units: normalizedUnits,
    activeLesson: { ...activeEntry.lesson, unit },
    activeLessonId: activeEntry.lesson.id,
    activeLessonPercentage: getLessonPercentage(activeEntry.lesson),
  };
}
