import { describe, expect, it } from 'vitest'
import { clampDailyCount, getDailyNewWords, getDueWords, isDue, markFamiliarity, rateWord } from './scheduler'
import type { Word, WordProgress } from './types'

const sample = Array.from({ length: 20 }, (_, i) => ({
  id: String(i), en: `word${i}`, zh: `词${i}`, example: '', exampleZh: '', level: 'A1', category: '日常'
})) as Word[]

describe('daily learning scheduler', () => {
  it('clamps user count', () => {
    expect(clampDailyCount(0, 20)).toBe(1)
    expect(clampDailyCount(100, 20)).toBe(20)
  })

  it('selects only truly new words for the daily new-word plan', () => {
    const progress: Record<string, WordProgress> = {
      '0': { status: 'known', correct: 4, wrong: 0 },
      '1': { status: 'learning', correct: 1, wrong: 0 },
      '2': { status: 'new', correct: 0, wrong: 0 }
    }
    const result = getDailyNewWords(sample, 10, '2026-08-26', progress)
    expect(result).toHaveLength(10)
    expect(result.some(word => word.id === '0')).toBe(false)
    expect(result.some(word => word.id === '1')).toBe(false)
  })

  it('keeps familiarity separate from a correct recall', () => {
    const progress = markFamiliarity(undefined, 'familiar')
    expect(progress.status).toBe('new')
    expect(progress.correct).toBe(0)
    expect(progress.familiarity).toBe('familiar')
  })

  it('reviews only words whose nextReviewAt has arrived', () => {
    const now = new Date('2026-08-26T00:00:00Z')
    const progress: Record<string, WordProgress> = {
      '0': { status: 'learning', correct: 1, wrong: 0, nextReviewAt: '2026-08-25T23:59:00Z' },
      '1': { status: 'learning', correct: 1, wrong: 0, nextReviewAt: '2026-08-27T00:00:00Z' },
      '2': { status: 'new', correct: 0, wrong: 0 }
    }
    expect(getDueWords(sample, progress, now).map(word => word.id)).toEqual(['0'])
    expect(isDue(progress['1'], now)).toBe(false)
  })

  it('uses consecutive recall instead of lifetime wrong count to reach known', () => {
    let progress: WordProgress = { status: 'learning', correct: 10, wrong: 8, correctStreak: 0 }
    const now = new Date('2026-01-01T00:00:00Z')
    progress = rateWord(progress, true, now)
    progress = rateWord(progress, true, now)
    progress = rateWord(progress, true, now)
    progress = rateWord(progress, true, now)
    expect(progress.status).toBe('known')
    expect(progress.correctStreak).toBe(4)
  })

  it('resets the streak and shortens the interval after a wrong answer', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const progress = rateWord({ status: 'known', correct: 8, wrong: 1, correctStreak: 5 }, false, now)
    expect(progress.status).toBe('learning')
    expect(progress.correctStreak).toBe(0)
    expect(progress.nextReviewAt).toBe('2026-01-01T00:10:00.000Z')
  })
})
