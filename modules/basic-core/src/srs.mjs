export const RATINGS = ['again', 'hard', 'good', 'easy'];

const baseIntervals = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 7
};

export function createReviewState(now = new Date()) {
  return {
    repetitions: 0,
    intervalDays: 0,
    ease: 2.3,
    dueAt: now.toISOString(),
    lastReviewedAt: null
  };
}

export function scheduleReview(state = createReviewState(), rating = 'good', now = new Date()) {
  if (!RATINGS.includes(rating)) throw new Error(`Unknown rating: ${rating}`);
  const current = { ...createReviewState(now), ...state };
  let repetitions = current.repetitions;
  let intervalDays = current.intervalDays;
  let ease = current.ease;

  if (rating === 'again') {
    repetitions = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    repetitions += 1;
    const minimum = baseIntervals[rating];
    const multiplier = rating === 'hard' ? 1.2 : rating === 'easy' ? ease + 0.25 : ease;
    intervalDays = Math.max(minimum, repetitions === 1 ? minimum : Math.round(Math.max(1, intervalDays) * multiplier));
    if (rating === 'hard') ease = Math.max(1.3, ease - 0.05);
    if (rating === 'easy') ease = Math.min(3.0, ease + 0.1);
  }

  const due = new Date(now);
  if (rating === 'again') due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + intervalDays);

  return {
    repetitions,
    intervalDays,
    ease: Number(ease.toFixed(2)),
    lastReviewedAt: now.toISOString(),
    dueAt: due.toISOString()
  };
}

export function isDue(state, now = new Date()) {
  return !state?.dueAt || new Date(state.dueAt).getTime() <= now.getTime();
}
