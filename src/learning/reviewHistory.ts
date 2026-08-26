import type { ExerciseType, SessionSource } from './types'

export type ReviewEvent = {
  id: string
  wordId: string
  at: string
  source: SessionSource
  exerciseType: ExerciseType
  result: 'fail' | 'pass'
  attempt: number
}

export function appendReviewEvent(history: ReviewEvent[], event: ReviewEvent, limit = 500): ReviewEvent[] {
  const next = [...history, event]
  return next.length > limit ? next.slice(next.length - limit) : next
}
