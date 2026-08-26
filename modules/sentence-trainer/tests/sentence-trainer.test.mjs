import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEnglish, evaluateSentence, buildHint, SentenceSession } from '../src/sentence-trainer.mjs';

test('normalizeEnglish makes comparison learner-friendly', () => {
  assert.equal(normalizeEnglish('  Hello,   WORLD! '), 'hello world');
});

test('evaluateSentence reports first mismatched token', () => {
  const result = evaluateSentence('I like apple', 'I like apples');
  assert.equal(result.correct, false);
  assert.equal(result.firstMismatch, 2);
  assert.equal(result.tokens[2].expected, 'apples');
});

test('buildHint progressively reveals words', () => {
  assert.equal(buildHint('I like green apples', 2), 'I like g____ a_____');
});

test('SentenceSession tracks streak and resets hint on next', () => {
  const session = new SentenceSession([{ prompt: '我喜欢苹果。', answer: 'I like apples.' }, { prompt: '她很开心。', answer: 'She is happy.' }]);
  assert.equal(session.submit('I like apples').correct, true);
  assert.equal(session.streak, 1);
  assert.ok(session.hint());
  session.next();
  assert.equal(session.hintLevel, 0);
  assert.equal(session.current.prompt, '她很开心。');
});
