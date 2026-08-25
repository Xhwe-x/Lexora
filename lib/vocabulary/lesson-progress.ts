type LessonWordProgress = {
  word: {
    userWordProgress: {
      masteryLevel: number;
    }[];
  };
};

function hasStartedWord(lessonWord: LessonWordProgress) {
  return lessonWord.word.userWordProgress.some(
    (progress) => progress.masteryLevel >= 1
  );
}

export function isVocabularyLessonCompleted(lessonWords: LessonWordProgress[]) {
  return lessonWords.length > 0 && lessonWords.every(hasStartedWord);
}

export function getVocabularyLessonPercentage(
  lessonWords: LessonWordProgress[]
) {
  if (lessonWords.length === 0) return 0;

  const completedWords = lessonWords.filter(hasStartedWord).length;
  return Math.round((completedWords / lessonWords.length) * 100);
}
