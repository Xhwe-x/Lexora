export type WordTrack = 'daily' | 'exam' | 'shared'

export type Word = {
  id: string
  en: string
  zh: string
  example: string
  exampleZh: string
  level: 'A1' | 'A2' | 'B1'
  category: '日常' | '学习' | '交流' | '动作' | '描述'
  track?: WordTrack
}

export type Familiarity = 'unknown' | 'fuzzy' | 'familiar'

export type WordProgress = {
  status: 'new' | 'learning' | 'known'
  correct: number
  wrong: number
  correctStreak?: number
  familiarity?: Familiarity
  nextReviewAt?: string
  lastReviewedAt?: string
}

export type ReviewDirection = 'en-zh' | 'zh-en'
