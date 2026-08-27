export type ArticleReviewPrompt = {
  id: string
  type: 'comprehension' | 'fill-blank'
  prompt: string
  answer?: string
}

export type ArticleReviewPack = {
  version: 1
  contentId: string
  title: string
  savedWordIds: string[]
  prompts: ArticleReviewPrompt[]
  completedAt: string
  elapsedSeconds?: number
  progress: number
}

export type ArticleReviewPackInput = {
  contentId: string
  title: string
  savedWordIds: string[]
  completedAt?: string
  elapsedSeconds?: number
  progress?: number
  prompts?: ArticleReviewPrompt[]
}

export function createArticleReviewPack(input: ArticleReviewPackInput): ArticleReviewPack {
  const prompts: ArticleReviewPrompt[] = input.prompts?.length ? input.prompts : [
    { id: `${input.contentId}-understanding`, type: 'comprehension', prompt: '这篇文章最重要的内容是什么？' },
    { id: `${input.contentId}-expression`, type: 'fill-blank', prompt: '从文章中挑一个表达，再用自己的句子完成一次回忆。' }
  ]
  return {
    version: 1,
    contentId: input.contentId,
    title: input.title,
    savedWordIds: Array.from(new Set(input.savedWordIds)),
    prompts,
    completedAt: input.completedAt ?? new Date(0).toISOString(),
    elapsedSeconds: input.elapsedSeconds,
    progress: input.progress ?? 100
  }
}

export const buildArticleReviewPack = createArticleReviewPack

function isPromptType(value: unknown): value is ArticleReviewPrompt['type'] {
  return value === 'comprehension' || value === 'fill-blank'
}

function isValidPrompt(value: unknown): value is ArticleReviewPrompt {
  if (!value || typeof value !== 'object') return false
  const prompt = value as Partial<ArticleReviewPrompt>
  return typeof prompt.id === 'string' && Boolean(prompt.id.trim()) && isPromptType(prompt.type) && typeof prompt.prompt === 'string' && Boolean(prompt.prompt.trim()) && (prompt.answer === undefined || typeof prompt.answer === 'string')
}

function isValidCompletedAt(value: unknown) {
  return typeof value === 'string' && Boolean(value.trim()) && Number.isFinite(Date.parse(value))
}

export function isArticleReviewPack(value: unknown): value is ArticleReviewPack {
  if (!value || typeof value !== 'object') return false
  const pack = value as Partial<ArticleReviewPack>
  return pack.version === 1
    && typeof pack.contentId === 'string'
    && Boolean(pack.contentId.trim())
    && typeof pack.title === 'string'
    && Boolean(pack.title.trim())
    && Array.isArray(pack.savedWordIds)
    && pack.savedWordIds.every(id => typeof id === 'string')
    && Array.isArray(pack.prompts)
    && pack.prompts.length > 0
    && pack.prompts.every(isValidPrompt)
    && isValidCompletedAt(pack.completedAt)
    && typeof pack.progress === 'number'
    && Number.isFinite(pack.progress)
    && pack.progress >= 0
    && pack.progress <= 100
    && (pack.elapsedSeconds === undefined || (typeof pack.elapsedSeconds === 'number' && Number.isFinite(pack.elapsedSeconds) && pack.elapsedSeconds >= 0))
}

export function restoreArticleReviewPack(value: unknown, contentId: string): ArticleReviewPack {
  if (!isArticleReviewPack(value) || value.contentId !== contentId) throw new Error('当前内容没有可恢复的文章复习包。')
  return value
}

export const refreshArticleReviewPack = restoreArticleReviewPack
