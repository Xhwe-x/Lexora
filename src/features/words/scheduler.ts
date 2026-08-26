import type { Familiarity, Word, WordProgress } from './types'

export function clampDailyCount(value: number, max: number) {
  if (!Number.isFinite(value)) return Math.min(10, max)
  return Math.max(1, Math.min(Math.floor(value), max))
}

function hashString(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function rankForDay(all: Word[], dateKey: string) {
  return [...all].sort((a, b) => hashString(`${dateKey}:${a.id}`) - hashString(`${dateKey}:${b.id}`))
}

export function getDailyWords(all: Word[], count: number, dateKey: string) {
  return rankForDay(all, dateKey).slice(0, clampDailyCount(count, all.length))
}

export function getDailyNewWords(
  all: Word[],
  count: number,
  dateKey: string,
  progress: Record<string, WordProgress>
) {
  const newWords = all.filter(word => !progress[word.id] || progress[word.id].status === 'new')
  return rankForDay(newWords, dateKey).slice(0, Math.min(clampDailyCount(count, all.length), newWords.length))
}

export function isDue(progress: WordProgress | undefined, now = new Date()) {
  if (!progress || progress.status === 'new') return false
  if (!progress.nextReviewAt) return true
  return new Date(progress.nextReviewAt).getTime() <= now.getTime()
}

export function getDueWords(all: Word[], progress: Record<string, WordProgress>, now = new Date()) {
  return all.filter(word => isDue(progress[word.id], now))
}

export function markFamiliarity(progress: WordProgress | undefined, familiarity: Familiarity): WordProgress {
  const base = progress ?? { status: 'new', correct: 0, wrong: 0 }
  return { ...base, familiarity }
}

const REVIEW_INTERVALS_MS = [
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
]

export function rateWord(progress: WordProgress | undefined, correct: boolean, now = new Date()): WordProgress {
  const base = progress ?? { status: 'new', correct: 0, wrong: 0 }
  const correctCount = base.correct + (correct ? 1 : 0)
  const wrongCount = base.wrong + (correct ? 0 : 1)
  const previousStreak = base.correctStreak ?? (base.status === 'known' ? 4 : Math.min(base.correct, 3))
  const correctStreak = correct ? previousStreak + 1 : 0
  const status: WordProgress['status'] = correct && correctStreak >= 4 ? 'known' : 'learning'
  const interval = correct
    ? REVIEW_INTERVALS_MS[Math.min(Math.max(correctStreak - 1, 0), REVIEW_INTERVALS_MS.length - 1)]
    : REVIEW_INTERVALS_MS[0]
  const next = new Date(now.getTime() + interval)

  return {
    ...base,
    status,
    correct: correctCount,
    wrong: wrongCount,
    correctStreak,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: next.toISOString()
  }
}
