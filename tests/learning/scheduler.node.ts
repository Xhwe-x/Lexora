import test from 'node:test'
import assert from 'node:assert/strict'
import getDailyNewWordsForProfile from '../../src/features/words/scheduler.ts'

type Track = 'daily' | 'exam' | 'shared'
type TrackedWord = {
  id: string
  en: string
  zh: string
  example: string
  exampleZh: string
  level: 'A2'
  category: '日常'
  track: Track
}

function word(id: string, track: Track): TrackedWord {
  return {
    id,
    en: id,
    zh: id,
    example: `Practice ${id}.`,
    exampleZh: `练习 ${id}。`,
    level: 'A2',
    category: '日常',
    track
  }
}

test('profile scheduler deduplicates shared words and prioritizes the 60/40 daily/exam split', () => {
  const all = [
    word('daily-1', 'daily'),
    word('daily-2', 'daily'),
    word('daily-3', 'daily'),
    word('daily-4', 'daily'),
    word('daily-5', 'daily'),
    word('daily-6', 'daily'),
    word('exam-1', 'exam'),
    word('exam-2', 'exam'),
    word('exam-3', 'exam'),
    word('exam-4', 'exam'),
    word('shared-1', 'shared'),
    word('shared-2', 'shared')
  ]

  const result = getDailyNewWordsForProfile(
    all,
    10,
    '2026-08-27',
    {},
    { dailyRatio: 60, examRatio: 40 }
  )

  assert.equal(result.length, 10)
  assert.equal(new Set(result.map(item => item.id)).size, result.length)
  assert.equal(result.filter(item => item.track === 'daily').length, 6)
  assert.equal(result.filter(item => item.track === 'exam').length, 4)
  assert.equal(result.filter(item => item.track === 'shared').length, 0)
})
