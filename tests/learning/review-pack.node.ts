import test from 'node:test'
import assert from 'node:assert/strict'
import { createArticleReviewPack, isArticleReviewPack } from '../../src/features/reader/reviewPack.ts'

test('createArticleReviewPack deduplicates saved words and keeps prompts, progress and elapsed time', () => {
  const pack = createArticleReviewPack({
    contentId: 'article-1',
    title: 'A short article',
    savedWordIds: ['ability', 'ability', 'improve'],
    completedAt: '2026-08-28T10:00:00.000Z',
    elapsedSeconds: 87,
    progress: 100
  })

  assert.deepEqual(pack.savedWordIds, ['ability', 'improve'])
  assert.equal(pack.prompts.length, 2)
  assert.deepEqual(pack.prompts.map(prompt => prompt.type), ['comprehension', 'fill-blank'])
  assert.equal(pack.progress, 100)
  assert.equal(pack.elapsedSeconds, 87)
  assert.equal(isArticleReviewPack(pack), true)
})

const validPack = createArticleReviewPack({
  contentId: 'article-1',
  title: 'A short article',
  savedWordIds: ['ability'],
  completedAt: '2026-08-28T10:00:00.000Z',
  elapsedSeconds: 40,
  progress: 80
})

const invalidValues = [
  { name: 'null', value: null },
  { name: 'unsupported version', value: { ...validPack, version: 2 } },
  { name: 'empty contentId', value: { ...validPack, contentId: '' } },
  { name: 'non-string title', value: { ...validPack, title: 42 } },
  { name: 'non-string saved word ID', value: { ...validPack, savedWordIds: ['ability', 7] } },
  { name: 'empty prompts', value: { ...validPack, prompts: [] } },
  { name: 'malformed prompt', value: { ...validPack, prompts: [{ id: 'bad', type: 'unknown', prompt: '' }] } },
  { name: 'empty completedAt', value: { ...validPack, completedAt: '' } },
  { name: 'non-finite progress', value: { ...validPack, progress: Number.NaN } }
]

for (const scenario of invalidValues) {
  test(`isArticleReviewPack rejects ${scenario.name}`, () => {
    assert.equal(isArticleReviewPack(scenario.value), false)
  })
}

test('optional review-pack restore or refresh helper enforces the requested contentId', async t => {
  const module = await import('../../src/features/reader/reviewPack.ts')
  const helper = module.restoreArticleReviewPack ?? module.refreshArticleReviewPack
  if (typeof helper !== 'function') {
    t.skip('no review-pack restore/refresh helper is currently provided')
    return
  }

  const restored = helper(validPack, 'article-1')
  assert.equal(isArticleReviewPack(restored), true)
  assert.throws(() => helper(validPack, 'different-article'))
})
