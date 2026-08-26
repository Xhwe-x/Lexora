export function commitDailyCountDraft(draft: string, current: number, max: number) {
  if (!draft.trim()) return current
  const value = Number(draft)
  if (!Number.isFinite(value)) return current
  return Math.max(1, Math.min(Math.floor(value), max))
}
