import type { Word } from '../features/words/types'

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.?!,;:]/g, '').replace(/\s+/g, ' ')
}

export function isTypingCorrect(answer: string, expected: string) {
  return normalizeAnswer(answer) === normalizeAnswer(expected)
}

function hash(input: string) {
  let value = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

export function createChoiceOptions(word: Word, allWords: Word[], count = 4) {
  const distractors = allWords
    .filter(candidate => candidate.id !== word.id && candidate.en !== word.en)
    .sort((a, b) => hash(`${word.id}:${a.id}`) - hash(`${word.id}:${b.id}`))
    .map(candidate => candidate.en)
  const options = [word.en, ...distractors].slice(0, Math.max(1, count))
  return options.sort((a, b) => hash(`${word.id}:option:${a}`) - hash(`${word.id}:option:${b}`))
}
