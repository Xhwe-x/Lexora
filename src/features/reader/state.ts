export type ReaderSettings = {
  fontSize: number
  lineHeight: 'compact' | 'comfortable' | 'relaxed'
  width: 'narrow' | 'standard' | 'wide'
  font: 'serif' | 'sans'
}

export type ReaderDocument = {
  id: string
  title: string
  text: string
  updatedAt: string
  scrollProgress: number
  settings: ReaderSettings
}

export type ReaderWordInteraction = {
  token: string
  wordId?: string
  contextSentence: string
  lookedUpAt: string
  savedToVocabulary: boolean
}

function hash(input: string) {
  let value = 2166136261
  for (let i = 0; i < input.length; i += 1) { value ^= input.charCodeAt(i); value = Math.imul(value, 16777619) }
  return (value >>> 0).toString(36)
}

export function normalizeReaderToken(token: string) { return token.trim().toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, '') }

export function makeReaderDocument(text: string, title = '我的阅读'): ReaderDocument {
  return {
    id: `reader-${hash(text)}`,
    title,
    text,
    updatedAt: new Date().toISOString(),
    scrollProgress: 0,
    settings: { fontSize: 20, lineHeight: 'comfortable', width: 'standard', font: 'serif' }
  }
}

export function updateReaderProgress(document: ReaderDocument, percent: number): ReaderDocument {
  return { ...document, scrollProgress: Math.max(0, Math.min(100, Math.round(percent))) }
}

export function getContextSentence(text: string, token: string) {
  const normalized = normalizeReaderToken(token)
  if (!normalized) return ''
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]
  return sentences.map(sentence => sentence.trim()).find(sentence => sentence.toLowerCase().includes(normalized)) ?? ''
}

export function upsertReaderInteraction(interactions: ReaderWordInteraction[], interaction: ReaderWordInteraction) {
  const normalized = normalizeReaderToken(interaction.token)
  const next = { ...interaction, token: normalized }
  const index = interactions.findIndex(item => normalizeReaderToken(item.token) === normalized && item.contextSentence === interaction.contextSentence)
  if (index < 0) return [...interactions, next]
  return interactions.map((item, itemIndex) => itemIndex === index ? { ...item, ...next, savedToVocabulary: item.savedToVocabulary || next.savedToVocabulary } : item)
}
