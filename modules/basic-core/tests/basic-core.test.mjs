import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewState, scheduleReview, isDue } from '../src/srs.mjs';
import { createWordCard, reviewWord } from '../src/word-card.mjs';
import { checkGrammarAnswer } from '../src/grammar.mjs';

test('SRS moves a good review into the future', () => {
  const now = new Date('2026-08-26T00:00:00Z');
  const next = scheduleReview(createReviewState(now), 'good', now);
  assert.equal(next.repetitions, 1);
  assert.equal(isDue(next, now), false);
});

test('word review moves card into learning state', () => {
  const card = createWordCard({ id: 'learn', term: 'learn', meaning: '学习' });
  const next = reviewWord(card, 'good', new Date('2026-08-26T00:00:00Z'));
  assert.equal(next.status, 'learning');
  assert.equal(next.seen, 1);
});

test('grammar answer accepts harmless punctuation and case', () => {
  assert.equal(checkGrammarAnswer({ answer: 'Because' }, 'because.').correct, true);
});
