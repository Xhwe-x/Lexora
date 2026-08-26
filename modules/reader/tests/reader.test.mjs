import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeText, splitSentences, wordFrequency } from '../src/tokenizer.mjs';
import { nextWordState, setWordState, getWordState } from '../src/word-state.mjs';
import { createCloze, checkCloze } from '../src/cloze.mjs';

test('tokenizer preserves punctuation while identifying English words', () => {
  const tokens = tokenizeText("Hello, learner!");
  assert.equal(tokens.filter(t => t.type === 'word').length, 2);
  assert.equal(tokens.map(t => t.value).join(''), 'Hello, learner!');
});

test('word states cycle new -> learning -> known -> new', () => {
  assert.equal(nextWordState('new'), 'learning');
  assert.equal(nextWordState('learning'), 'known');
  assert.equal(nextWordState('known'), 'new');
  const dict = setWordState({}, 'Hello', 'known');
  assert.equal(getWordState(dict, 'hello'), 'known');
});

test('cloze hides target and checks answer', () => {
  const cloze = createCloze('Reading improves your vocabulary.', 'improves', ['changes']);
  assert.equal(cloze.prompt, 'Reading _____ your vocabulary.');
  assert.equal(checkCloze(cloze, 'Improves'), true);
});

test('sentence splitter and frequency work on a short text', () => {
  assert.equal(splitSentences('I read. I learn!').length, 2);
  assert.deepEqual(wordFrequency('read read learn')[0], { word: 'read', count: 2 });
});
