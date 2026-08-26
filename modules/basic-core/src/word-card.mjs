import { createReviewState, scheduleReview } from './srs.mjs';

export function createWordCard(word) {
  if (!word?.id || !word?.term) throw new Error('word requires id and term');
  return {
    ...word,
    review: word.review ?? createReviewState(),
    status: word.status ?? 'new',
    seen: word.seen ?? 0
  };
}

export function reviewWord(card, rating, now = new Date()) {
  const review = scheduleReview(card.review, rating, now);
  return {
    ...card,
    review,
    seen: (card.seen ?? 0) + 1,
    status: rating === 'again' ? 'learning' : (review.repetitions >= 3 ? 'known' : 'learning')
  };
}
