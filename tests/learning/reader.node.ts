import test from 'node:test'
import assert from 'node:assert/strict'
import {
  defaultReaderContent,
  filterReaderContents,
  getCurrentReaderSentence,
  getReaderContent,
  getReaderMinutesBucket,
  getReaderSentences,
  getReaderStats,
  readerContents,
  readerKindLabel,
  type ReaderFilters,
  type ReaderKind
} from '../../src/features/reader/catalog.ts'
import {
  makeReaderDocument,
  updateReaderProgress,
  upsertReaderInteraction,
  type ReaderWordInteraction
} from '../../src/features/reader/state.ts'

const allowedLevels = ['A1', 'A2', 'B1', 'custom']
const allowedTracks = ['daily', 'exam', 'shared']
const allowedTopics = ['生活', '工作', '旅行', '学习', '观点', '自定义']
const allowedKinds = ['article', 'dialogue', 'email', 'story', 'news', 'audio-transcript']

test('reader catalog has enough classified content and defaults to A2', () => {
  assert.ok(readerContents.length >= 4)
  for (const content of readerContents) {
    assert.ok(allowedLevels.includes(content.level))
    assert.ok(allowedTracks.includes(content.track))
    assert.ok(allowedTopics.includes(content.topic))
    assert.ok(allowedKinds.includes(content.kind))
    assert.ok(content.estimatedMinutes > 0)
  }
  assert.equal(defaultReaderContent.level, 'A2')
})

test('filterReaderContents applies level, track, topic and kind filters', () => {
  const byLevel = filterReaderContents(readerContents, { level: 'A2', track: 'all', topic: 'all', kind: 'all' })
  const byTrack = filterReaderContents(readerContents, { level: 'all', track: 'daily', topic: 'all', kind: 'all' })
  const byTopic = filterReaderContents(readerContents, { level: 'all', track: 'all', topic: '工作', kind: 'all' })
  const byKind = filterReaderContents(readerContents, { level: 'all', track: 'all', topic: 'all', kind: 'email' })

  assert.ok(byLevel.length > 0)
  assert.ok(byLevel.every(content => content.level === 'A2'))
  assert.ok(byTrack.length > 0)
  assert.ok(byTrack.every(content => content.track === 'daily'))
  assert.ok(byTopic.length > 0)
  assert.ok(byTopic.every(content => content.topic === '工作'))
  assert.ok(byKind.length > 0)
  assert.ok(byKind.every(content => content.kind === 'email'))
})

type ReaderMinutes = 'all' | 'short' | 'medium' | 'long'
type ReaderFiltersWithMinutes = ReaderFilters & { minutes: ReaderMinutes }

function minutesFilter(minutes: ReaderMinutes): ReaderFiltersWithMinutes {
  return { level: 'all', track: 'all', topic: 'all', kind: 'all', minutes }
}

test('reader minute buckets use explicit 1-5, 6-10 and 11-plus minute ranges', () => {
  const expectedBuckets = [
    { minutes: 1, bucket: 'short' },
    { minutes: 5, bucket: 'short' },
    { minutes: 10, bucket: 'medium' },
    { minutes: 11, bucket: 'long' }
  ] as const

  for (const scenario of expectedBuckets) {
    assert.equal(getReaderMinutesBucket(scenario.minutes), scenario.bucket)
  }

  const fixtures = readerContents.slice(0, 4).map((content, index) => ({
    ...content,
    id: `minutes-fixture-${index}`,
    estimatedMinutes: [1, 5, 10, 11][index]
  }))
  assert.deepEqual(filterReaderContents(fixtures, minutesFilter('short')).map(content => content.estimatedMinutes), [1, 5])
  assert.deepEqual(filterReaderContents(fixtures, minutesFilter('medium')).map(content => content.estimatedMinutes), [10])
  assert.deepEqual(filterReaderContents(fixtures, minutesFilter('long')).map(content => content.estimatedMinutes), [11])
})

test('reader kind labels cover news and audio transcripts', () => {
  assert.equal(readerKindLabel('news' as unknown as ReaderKind), '新闻')
  assert.equal(readerKindLabel('audio-transcript' as unknown as ReaderKind), '音频文本')
})

test('getReaderContent recognizes built-in documents and preserves custom document metadata', () => {
  const builtIn = readerContents[0]
  const builtInDocument = makeReaderDocument(builtIn.text, 'A copied title')
  const recognized = getReaderContent(builtInDocument)
  assert.equal(recognized.id, builtIn.id)
  assert.equal(recognized.source, 'built-in')
  assert.equal(recognized.level, builtIn.level)

  const customText = 'This is my saved note. It has two short sentences.'
  const customDocument = makeReaderDocument(customText, 'My saved note')
  const custom = getReaderContent(customDocument)
  assert.equal(custom.level, 'custom')
  assert.equal(custom.track, 'shared')
  assert.equal(custom.topic, '自定义')
  assert.equal(custom.title, 'My saved note')
  assert.equal(custom.text, customText)
})

test('reader sentence helpers handle short text, punctuation and 0/100 progress', () => {
  const text = 'Short text, okay. Are you ready? Go!'
  assert.deepEqual(getReaderSentences(text), ['Short text, okay.', 'Are you ready?', 'Go!'])
  assert.equal(getCurrentReaderSentence(text, 0), 'Short text, okay.')
  assert.equal(getCurrentReaderSentence(text, 100), 'Go!')

  assert.deepEqual(getReaderSentences('Hi!'), ['Hi!'])
  assert.equal(getCurrentReaderSentence('Hi!', 0), 'Hi!')
  assert.equal(getCurrentReaderSentence('Hi!', 100), 'Hi!')
})

function interaction(overrides: Partial<ReaderWordInteraction> = {}): ReaderWordInteraction {
  return {
    token: 'word',
    contextSentence: 'A sentence outside the current document.',
    lookedUpAt: '2026-08-27T10:00:00.000Z',
    savedToVocabulary: false,
    ...overrides
  }
}

test('getReaderStats isolates document interactions and keeps legacy context matches', () => {
  const currentDocument = { ...makeReaderDocument('Current document has ability. It is short.'), id: 'doc-current' }
  const otherDocument = { ...makeReaderDocument('Other document has a different word.'), id: 'doc-other' }
  const currentSentence = 'Current document has ability.'

  const stats = getReaderStats(currentDocument, [
    interaction({ token: 'ability', documentId: currentDocument.id, contextSentence: currentSentence }),
    interaction({ token: 'saved', documentId: currentDocument.id, contextSentence: currentSentence, savedToVocabulary: true }),
    interaction({ token: 'other', documentId: otherDocument.id, contextSentence: 'Other document has a different word.', savedToVocabulary: true }),
    interaction({ token: 'legacy', contextSentence: currentSentence, savedToVocabulary: true }),
    interaction({ token: 'stale', contextSentence: 'Other document has a different word.', savedToVocabulary: true }),
    interaction({ token: 'wrong-document', documentId: otherDocument.id, contextSentence: currentSentence, savedToVocabulary: true })
  ])

  assert.deepEqual(stats, { encounteredCount: 3, savedCount: 2 })
})

test('completed reader summary keeps 100 percent progress, estimated duration and interaction stats', () => {
  const content = readerContents[0]
  const document = updateReaderProgress(makeReaderDocument(content.text, content.title), 100)
  const stats = getReaderStats(document, [
    interaction({ token: 'ability', documentId: document.id, contextSentence: 'Current document has ability.' }),
    interaction({ token: 'saved', documentId: document.id, contextSentence: 'Current document has ability.', savedToVocabulary: true })
  ])
  const custom = getReaderContent(makeReaderDocument('One short sentence.', 'One minute note'))

  assert.equal(document.scrollProgress, 100)
  assert.ok(content.estimatedMinutes > 0)
  assert.equal(custom.estimatedMinutes, 1)
  assert.deepEqual(
    { progress: document.scrollProgress, estimatedMinutes: content.estimatedMinutes, ...stats },
    { progress: 100, estimatedMinutes: content.estimatedMinutes, encounteredCount: 2, savedCount: 1 }
  )
})

test('upsertReaderInteraction preserves a previous savedToVocabulary value', () => {
  const first = upsertReaderInteraction([], interaction({
    token: 'Ability',
    documentId: 'doc-current',
    contextSentence: 'Current document has ability.',
    savedToVocabulary: true
  }))
  const merged = upsertReaderInteraction(first, interaction({
    token: 'ability',
    documentId: 'doc-current',
    contextSentence: 'Current document has ability.',
    lookedUpAt: '2026-08-27T11:00:00.000Z',
    savedToVocabulary: false
  }))

  assert.equal(merged.length, 1)
  assert.equal(merged[0].token, 'ability')
  assert.equal(merged[0].lookedUpAt, '2026-08-27T11:00:00.000Z')
  assert.equal(merged[0].savedToVocabulary, true)
})
