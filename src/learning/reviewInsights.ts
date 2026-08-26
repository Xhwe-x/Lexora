import type { Word, WordProgress } from '../features/words/types'
import type { ReviewEvent } from './reviewHistory'

export type ReviewInsights = {
  weak: Word[]
  learning: Word[]
  stable: Word[]
  recentFailureWordIds: string[]
}

export function buildReviewInsights(allWords: Word[], progress: Record<string, WordProgress>, history: ReviewEvent[]): ReviewInsights {
  const recent = history.slice(-80)
  const recentFailureWordIds = [...new Set(recent.filter(event => event.result === 'fail').reverse().map(event => event.wordId))]
  const weakSet = new Set(recentFailureWordIds)
  const weak: Word[] = []
  const learning: Word[] = []
  const stable: Word[] = []

  for (const word of allWords) {
    const state = progress[word.id]
    if (!state || state.status === 'new') continue
    const events = recent.filter(event => event.wordId === word.id)
    const lastFailIndex = [...events].map(event => event.result).lastIndexOf('fail')
    const passesAfterFail = lastFailIndex >= 0 ? events.slice(lastFailIndex + 1).filter(event => event.result === 'pass').length : Infinity
    if (weakSet.has(word.id) && passesAfterFail < 2) weak.push(word)
    else if (state.status === 'known' && (state.correctStreak ?? 0) >= 3) stable.push(word)
    else learning.push(word)
  }
  return { weak, learning, stable, recentFailureWordIds }
}
