import type { SessionItem } from './types'

export type SessionWordResult = {
  wordId: string
  coreAttempts: number
  corePasses: number
  retryAttempts: number
  retryPasses: number
  errorAttempts: number
  hadError: boolean
  finalState: 'passed' | 'needs-review'
}

export type SessionResults = Record<string, SessionWordResult>

export function recordSessionAttempt(results: SessionResults, item: SessionItem, correct: boolean): SessionResults {
  const previous = results[item.wordId] ?? {
    wordId: item.wordId,
    coreAttempts: 0,
    corePasses: 0,
    retryAttempts: 0,
    retryPasses: 0,
    errorAttempts: 0,
    hadError: false,
    finalState: 'passed' as const
  }
  const isRetry = item.source === 'retry'
  const next: SessionWordResult = {
    ...previous,
    coreAttempts: previous.coreAttempts + (item.core ? 1 : 0),
    corePasses: previous.corePasses + (item.core && correct ? 1 : 0),
    retryAttempts: previous.retryAttempts + (isRetry ? 1 : 0),
    retryPasses: previous.retryPasses + (isRetry && correct ? 1 : 0),
    errorAttempts: previous.errorAttempts + (correct ? 0 : 1),
    hadError: previous.hadError || !correct,
    finalState: correct ? 'passed' : 'needs-review'
  }
  return { ...results, [item.wordId]: next }
}

export function summarizeSessionResults(results: SessionResults) {
  const rows = Object.values(results)
  return {
    coreAttempts: rows.reduce((sum, row) => sum + row.coreAttempts, 0),
    firstTryCorrect: rows.reduce((sum, row) => sum + row.corePasses, 0),
    errorAttempts: rows.reduce((sum, row) => sum + row.errorAttempts, 0),
    retryAttempts: rows.reduce((sum, row) => sum + row.retryAttempts, 0),
    retriedWords: rows.filter(row => row.retryAttempts > 0).length,
    weakWordIds: rows.filter(row => row.hadError).map(row => row.wordId)
  }
}
