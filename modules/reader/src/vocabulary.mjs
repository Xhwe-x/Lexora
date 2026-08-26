import { createReviewState, scheduleReview } from '../../basic-core/src/srs.mjs';

export function createVocabularyEntry(word, context = '', meaning = '') {
  return {
    id: String(word).toLowerCase(),
    word: String(word),
    meaning,
    context,
    state: 'learning',
    createdAt: new Date().toISOString(),
    review: createReviewState()
  };
}

export function reviewVocabulary(entry, rating, now = new Date()) {
  const review = scheduleReview(entry.review, rating, now);
  return {
    ...entry,
    review,
    state: review.repetitions >= 3 ? 'known' : 'learning'
  };
}
