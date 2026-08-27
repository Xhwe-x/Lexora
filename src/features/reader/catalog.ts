// @ts-ignore Node's native strip-types runner requires the explicit extension here.
import { readingText } from './data.ts'
import type { ReaderDocument, ReaderWordInteraction } from './state'

export type ReaderLevel = 'A1' | 'A2' | 'B1' | 'custom'
export type ReaderTrack = 'daily' | 'exam' | 'shared'
export type ReaderTopic = '生活' | '工作' | '旅行' | '学习' | '观点' | '自定义'
export type ReaderKind = 'article' | 'dialogue' | 'email' | 'story' | 'news' | 'audio-transcript'
export type ReaderSource = 'built-in' | 'custom'
export type ReaderMinutes = 'all' | 'short' | 'medium' | 'long'

export type ReaderContent = {
  id: string
  title: string
  text: string
  level: ReaderLevel
  track: ReaderTrack
  topic: ReaderTopic
  kind: ReaderKind
  estimatedMinutes: number
  description: string
  skills: string[]
  source: ReaderSource
}

export type ReaderFilters = {
  level: 'all' | ReaderLevel
  track: 'all' | ReaderTrack
  topic: 'all' | ReaderTopic
  kind: 'all' | ReaderKind
  minutes: ReaderMinutes
}

export const defaultReaderFilters: ReaderFilters = { level: 'all', track: 'all', topic: 'all', kind: 'all', minutes: 'all' }

function estimateMinutes(text: string) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 120))
}

const dailyDialogue = `A good morning does not have to be perfect. I open the window, drink some water, and write down one thing I want to finish. If I have time, I walk to the station instead of taking the bus. This small routine helps me start the day with a clear mind.`
const workEmail = `Hi Maya,\n\nThank you for your advice about the new project. I agree that we should start with a simple plan and review it each Friday. Could you explain which task is most important this week? I will prepare a short update and send it before our meeting.\n\nBest,\nLena`
const sharedIdeas = `People often believe that learning needs a lot of free time, but a useful habit can be much smaller. You can read one page, notice one new expression, and try to use it in a sentence. During a busy week, this simple plan is enough to continue. The important part is to choose a clear goal and remember why it matters.`
const localNews = `A small community library opened a quiet study room this week. The room has simple desks, clear signs, and a place for people to share useful books. Visitors can use it during the day, and students say the new space helps them continue their work.`
const audioTranscript = `Welcome to the travel desk. If you are visiting the city for the first time, choose a short walk near the river. You can ask for a map, check the bus times, and stop at a small cafe. Please remember to keep your ticket until you leave.`

export const readerContents: ReaderContent[] = [
  {
    id: 'small-habit',
    title: 'A Small Habit',
    text: readingText,
    level: 'A2',
    track: 'daily',
    topic: '生活',
    kind: 'story',
    estimatedMinutes: estimateMinutes(readingText),
    description: '从一个小习惯开始，让每天的英语输入变得可持续。',
    skills: ['理解语境', '发现有用表达'],
    source: 'built-in'
  },
  {
    id: 'morning-routine',
    title: 'A Calm Morning',
    text: dailyDialogue,
    level: 'A2',
    track: 'daily',
    topic: '生活',
    kind: 'dialogue',
    estimatedMinutes: estimateMinutes(dailyDialogue),
    description: '练习描述日常安排，以及 instead of 的自然用法。',
    skills: ['描述安排', '理解替代关系'],
    source: 'built-in'
  },
  {
    id: 'project-email',
    title: 'A Short Project Email',
    text: workEmail,
    level: 'A2',
    track: 'shared',
    topic: '工作',
    kind: 'email',
    estimatedMinutes: estimateMinutes(workEmail),
    description: '在一封简短工作邮件里练习请求说明与确认下一步。',
    skills: ['抓住请求', '识别工作表达'],
    source: 'built-in'
  },
  {
    id: 'small-study-idea',
    title: 'Make the Habit Smaller',
    text: sharedIdeas,
    level: 'A2',
    track: 'shared',
    topic: '学习',
    kind: 'article',
    estimatedMinutes: estimateMinutes(sharedIdeas),
    description: '用短文理解如何把学习目标拆成可以重复的小步骤。',
    skills: ['理解主旨', '连接观点'],
    source: 'built-in'
  },
  {
    id: 'community-study-news',
    title: 'A New Study Room',
    text: localNews,
    level: 'A2',
    track: 'shared',
    topic: '观点',
    kind: 'news',
    estimatedMinutes: estimateMinutes(localNews),
    description: '用一则简短本地新闻理解公共空间与学习安排。',
    skills: ['抓住事实', '理解因果'],
    source: 'built-in'
  },
  {
    id: 'travel-desk-transcript',
    title: 'At the Travel Desk',
    text: audioTranscript,
    level: 'A2',
    track: 'daily',
    topic: '旅行',
    kind: 'audio-transcript',
    estimatedMinutes: estimateMinutes(audioTranscript),
    description: '把一段可读的旅行服务文本当作听力前的阅读准备。',
    skills: ['识别指令', '理解顺序'],
    source: 'built-in'
  }
]

export const defaultReaderContent = readerContents[0]

export function getReaderContent(document: ReaderDocument): ReaderContent {
  const builtIn = readerContents.find(content => content.id === document.id || content.text === document.text)
  if (builtIn) return builtIn
  return {
    id: document.id,
    title: document.title || '我的阅读',
    text: document.text,
    level: 'custom',
    track: 'shared',
    topic: '自定义',
    kind: 'article',
    estimatedMinutes: estimateMinutes(document.text),
    description: '这是你自己的阅读文本。Lexora 只保存文本与阅读进度。',
    skills: [],
    source: 'custom'
  }
}

export function filterReaderContents(contents: ReaderContent[], filters: ReaderFilters) {
  const minutes = filters.minutes ?? 'all'
  return contents.filter(content => (
    (filters.level === 'all' || content.level === filters.level)
    && (filters.track === 'all' || content.track === filters.track)
    && (filters.topic === 'all' || content.topic === filters.topic)
    && (filters.kind === 'all' || content.kind === filters.kind)
    && (minutes === 'all' || getReaderMinutesBucket(content.estimatedMinutes) === minutes)
  ))
}

export function getReaderMinutesBucket(minutes: number): Exclude<ReaderMinutes, 'all'> {
  if (minutes <= 5) return 'short'
  if (minutes <= 10) return 'medium'
  return 'long'
}

export function getReaderSentences(text: string) {
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]).map(sentence => sentence.trim()).filter(Boolean)
}

export function getCurrentReaderSentence(text: string, progress: number) {
  const sentences = getReaderSentences(text)
  if (!sentences.length) return ''
  const index = Math.min(sentences.length - 1, Math.floor((Math.max(0, Math.min(100, progress)) / 100) * sentences.length))
  return sentences[index]
}

export function getReaderCompletionProgress(scrollHeight: number, clientHeight: number, currentProgress: number) {
  const progress = Number.isFinite(currentProgress) ? Math.max(0, Math.min(100, Math.round(currentProgress))) : 0
  const hasMeasuredLayout = Number.isFinite(scrollHeight) && Number.isFinite(clientHeight) && scrollHeight > 0 && clientHeight > 0
  if (hasMeasuredLayout && scrollHeight <= clientHeight) return progress >= 100 ? 100 : 0
  return progress
}

export function getReaderDocumentInteractions(document: ReaderDocument, interactions: ReaderWordInteraction[]) {
  return interactions.filter(item => item.documentId === document.id || (!item.documentId && Boolean(item.contextSentence && document.text.includes(item.contextSentence))))
}

export function getReaderStats(document: ReaderDocument, interactions: ReaderWordInteraction[]) {
  const documentInteractions = getReaderDocumentInteractions(document, interactions)
  return {
    encounteredCount: new Set(documentInteractions.map(item => item.token)).size,
    savedCount: new Set(documentInteractions.filter(item => item.savedToVocabulary).map(item => item.token)).size
  }
}

export function readerTrackLabel(track: ReaderTrack) {
  return track === 'daily' ? '日常英语' : track === 'exam' ? '考试英语' : '共享'
}

export function readerLevelLabel(level: ReaderLevel) {
  return level === 'custom' ? '自定义' : level
}

export function readerKindLabel(kind: ReaderKind) {
  return kind === 'dialogue' ? '对话' : kind === 'email' ? '邮件' : kind === 'story' ? '故事' : kind === 'news' ? '新闻' : kind === 'audio-transcript' ? '音频文本' : '短文'
}
