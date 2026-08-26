import test from 'node:test'
import assert from 'node:assert/strict'
import { recordSessionAttempt, summarizeSessionResults } from '../../src/learning/sessionResults.ts'
import { recordLearningDay, getWeekActivity, calculateStreak } from '../../src/learning/learningHistory.ts'
import { buildReviewInsights } from '../../src/learning/reviewInsights.ts'
import { getContextSentence, makeReaderDocument, updateReaderProgress, upsertReaderInteraction } from '../../src/features/reader/state.ts'

const coreChoice = { id: 'a-choice', wordId: 'ability', exerciseType: 'choice', source: 'new', attempt: 0, earliestStep: 0, core: true } as const
const coreTyping = { id: 'a-typing', wordId: 'ability', exerciseType: 'typing', source: 'new', attempt: 0, earliestStep: 2, core: true } as const
const retryTyping = { id: 'a-retry', wordId: 'ability', exerciseType: 'typing', source: 'retry', attempt: 1, earliestStep: 4, core: false } as const

test('session summary distinguishes first-pass success, errors and retries using real attempts', () => {
  let results = {}
  results = recordSessionAttempt(results, coreChoice, true)
  results = recordSessionAttempt(results, coreTyping, false)
  results = recordSessionAttempt(results, retryTyping, true)
  const summary = summarizeSessionResults(results)
  assert.equal(summary.coreAttempts, 2)
  assert.equal(summary.firstTryCorrect, 1)
  assert.equal(summary.errorAttempts, 1)
  assert.equal(summary.retryAttempts, 1)
  assert.deepEqual(summary.weakWordIds, ['ability'])
})

test('learning day history aggregates real activity and streak is non-punitive', () => {
  let history = []
  history = recordLearningDay(history, '2026-08-24', { coreExercises: 3, reviewEvents: 1, learnedWordId: 'ability' })
  history = recordLearningDay(history, '2026-08-24', { coreExercises: 2, reviewEvents: 2, learnedWordId: 'ability' })
  history = recordLearningDay(history, '2026-08-25', { coreExercises: 4, reviewEvents: 4, learnedWordId: 'achieve' })
  assert.deepEqual(history[0], { date: '2026-08-24', coreExercises: 5, reviewEvents: 3, learnedWordIds: ['ability'], readerWordIds: [] })
  assert.equal(calculateStreak(history, new Date('2026-08-26T12:00:00Z')), 2)
  const week = getWeekActivity(history, new Date('2026-08-26T12:00:00Z'))
  assert.equal(week.length, 7)
  assert.equal(week.filter(day => day.active).length, 2)
})

test('review insights use conservative human-readable buckets rather than fake precision', () => {
  const allWords = [
    { id: 'ability', en: 'ability', zh: '能力' },
    { id: 'achieve', en: 'achieve', zh: '实现' },
    { id: 'improve', en: 'improve', zh: '提高' }
  ] as any[]
  const progress = {
    ability: { status: 'learning', correct: 1, wrong: 2 },
    achieve: { status: 'learning', correct: 2, wrong: 0 },
    improve: { status: 'known', correct: 6, wrong: 1, correctStreak: 4 }
  } as any
  const history = [
    { id: '1', wordId: 'ability', at: '2026-08-25T10:00:00.000Z', source: 'due', exerciseType: 'typing', result: 'fail', attempt: 0 },
    { id: '2', wordId: 'improve', at: '2026-08-25T11:00:00.000Z', source: 'due', exerciseType: 'typing', result: 'pass', attempt: 0 }
  ] as any
  const insights = buildReviewInsights(allWords, progress, history)
  assert.deepEqual(insights.weak.map(word => word.id), ['ability'])
  assert.deepEqual(insights.learning.map(word => word.id), ['achieve'])
  assert.deepEqual(insights.stable.map(word => word.id), ['improve'])
  assert.deepEqual(insights.recentFailureWordIds, ['ability'])
})

test('reader state persists document progress and deduplicates word interactions', () => {
  const document = makeReaderDocument('Practice improves your ability to speak.')
  assert.equal(document.scrollProgress, 0)
  assert.equal(updateReaderProgress(document, 44).scrollProgress, 44)
  assert.equal(getContextSentence(document.text, 'ability'), 'Practice improves your ability to speak.')
  let interactions = []
  interactions = upsertReaderInteraction(interactions, { token: 'Ability', wordId: 'ability', contextSentence: 'Ability matters.', lookedUpAt: '2026-08-26T10:00:00.000Z', savedToVocabulary: false })
  interactions = upsertReaderInteraction(interactions, { token: 'ability', wordId: 'ability', contextSentence: 'Ability matters.', lookedUpAt: '2026-08-26T11:00:00.000Z', savedToVocabulary: true })
  assert.equal(interactions.length, 1)
  assert.equal(interactions[0].savedToVocabulary, true)
  assert.equal(interactions[0].token, 'ability')
})
