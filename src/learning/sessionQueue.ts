import type { Word } from '../features/words/types'
import type { ExerciseType, SessionItem } from './types'

const MAX_RETRIES = 2
const RETRY_GAP = 2

function itemId(wordId: string, exerciseType: ExerciseType, source: SessionItem['source'], attempt: number, order: number) {
  return `${source}:${wordId}:${exerciseType}:${attempt}:${order}`
}

export function createDailySessionItems(dueWords: Word[], newWords: Word[]): SessionItem[] {
  const items: SessionItem[] = []
  let order = 0

  for (const word of dueWords) {
    items.push({ id: itemId(word.id, 'typing', 'due', 0, order++), wordId: word.id, exerciseType: 'typing', source: 'due', attempt: 0, earliestStep: 0, core: true })
  }

  for (let start = 0; start < newWords.length; start += 3) {
    const batch = newWords.slice(start, start + 3)
    for (const word of batch) {
      items.push({ id: itemId(word.id, 'intro', 'new', 0, order++), wordId: word.id, exerciseType: 'intro', source: 'new', attempt: 0, earliestStep: 0, core: true })
    }
    for (const word of batch) {
      items.push({ id: itemId(word.id, 'choice', 'new', 0, order++), wordId: word.id, exerciseType: 'choice', source: 'new', attempt: 0, earliestStep: 0, core: true })
    }
    for (const word of batch) {
      items.push({ id: itemId(word.id, 'typing', 'new', 0, order++), wordId: word.id, exerciseType: 'typing', source: 'new', attempt: 0, earliestStep: 0, core: true })
    }
  }

  return items
}

export function createReviewSessionItems(words: Word[]): SessionItem[] {
  return words.map((word, index) => ({
    id: itemId(word.id, 'typing', 'due', 0, index),
    wordId: word.id,
    exerciseType: 'typing',
    source: 'due',
    attempt: 0,
    earliestStep: 0,
    core: true
  }))
}

export function enqueueRetry(queue: SessionItem[], failed: SessionItem, currentStep: number): SessionItem[] {
  const retriesAlreadyUsed = Math.max(failed.attempt, ...queue.filter(item => item.wordId === failed.wordId).map(item => item.attempt), 0)
  const nextAttempt = retriesAlreadyUsed + 1
  if (nextAttempt > MAX_RETRIES) return queue
  const exerciseType: ExerciseType = nextAttempt >= 2 ? 'choice' : failed.exerciseType === 'intro' ? 'choice' : failed.exerciseType
  const updatedQueue = queue.map(item => item.wordId === failed.wordId && item.source !== 'retry' && item.attempt < nextAttempt ? { ...item, attempt: nextAttempt } : item)
  const retry: SessionItem = {
    id: itemId(failed.wordId, exerciseType, 'retry', nextAttempt, currentStep),
    wordId: failed.wordId,
    exerciseType,
    source: 'retry',
    attempt: nextAttempt,
    earliestStep: currentStep + RETRY_GAP,
    core: false
  }
  return [...updatedQueue, retry]
}

export function selectNextItem(queue: SessionItem[], currentStep: number, lastWordId?: string): SessionItem | undefined {
  const eligible = queue.filter(item => item.earliestStep <= currentStep)
  const differentWord = eligible.find(item => item.wordId !== lastWordId)
  if (differentWord) return differentWord
  if (eligible.length > 0) return eligible[0]
  return queue.length > 0 ? queue.reduce((best, item) => item.earliestStep < best.earliestStep ? item : best) : undefined
}

export function coreProgress(items: SessionItem[], completedIds: Set<string>) {
  const coreItems = items.filter(item => item.core)
  return {
    completed: coreItems.filter(item => completedIds.has(item.id)).length,
    total: coreItems.length
  }
}
