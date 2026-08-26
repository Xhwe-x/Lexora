export type LearningDayRecord = {
  date: string
  coreExercises: number
  reviewEvents: number
  learnedWordIds: string[]
  readerWordIds: string[]
}

type LearningDelta = {
  coreExercises?: number
  reviewEvents?: number
  learnedWordId?: string
  readerWordId?: string
}

function unique(values: string[]) { return [...new Set(values)] }

export function recordLearningDay(history: LearningDayRecord[], date: string, delta: LearningDelta, limit = 120): LearningDayRecord[] {
  const existing = history.find(record => record.date === date)
  const nextRecord: LearningDayRecord = {
    date,
    coreExercises: (existing?.coreExercises ?? 0) + (delta.coreExercises ?? 0),
    reviewEvents: (existing?.reviewEvents ?? 0) + (delta.reviewEvents ?? 0),
    learnedWordIds: unique([...(existing?.learnedWordIds ?? []), ...(delta.learnedWordId ? [delta.learnedWordId] : [])]),
    readerWordIds: unique([...(existing?.readerWordIds ?? []), ...(delta.readerWordId ? [delta.readerWordId] : [])])
  }
  const next = [...history.filter(record => record.date !== date), nextRecord].sort((a, b) => a.date.localeCompare(b.date))
  return next.length > limit ? next.slice(next.length - limit) : next
}

function localDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isActiveDay(record?: LearningDayRecord) {
  return Boolean(record && (record.coreExercises > 0 || record.reviewEvents > 0 || record.learnedWordIds.length > 0 || record.readerWordIds.length > 0))
}

export function getWeekActivity(history: LearningDayRecord[], now = new Date()) {
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index)
    const key = localDateKey(date)
    const record = history.find(item => item.date === key)
    return { date: key, record, active: isActiveDay(record) }
  })
}

export function calculateStreak(history: LearningDayRecord[], now = new Date()) {
  const active = new Set(history.filter(isActiveDay).map(record => record.date))
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!active.has(localDateKey(cursor))) cursor = addDays(cursor, -1)
  let streak = 0
  while (active.has(localDateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}
