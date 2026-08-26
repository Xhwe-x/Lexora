import test from 'node:test'
import assert from 'node:assert/strict'

type QueueModule = typeof import('../../src/learning/sessionQueue.ts')

async function loadModule(): Promise<Partial<QueueModule>> {
  try {
    return await import('../../src/learning/sessionQueue.ts')
  } catch {
    return {}
  }
}

const newWord = { id: 'ability', en: 'ability', zh: '能力', example: '', exampleZh: '', level: 'A2', category: '学习' } as const
const secondWord = { id: 'achieve', en: 'achieve', zh: '达到', example: '', exampleZh: '', level: 'A2', category: '动作' } as const
const thirdWord = { id: 'improve', en: 'improve', zh: '提高', example: '', exampleZh: '', level: 'A2', category: '学习' } as const

test('new words are introduced before productive typing', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.createDailySessionItems, 'function', 'createDailySessionItems should exist')
  const items = mod.createDailySessionItems!([], [newWord, secondWord, thirdWord])
  const abilityItems = items.filter(item => item.wordId === 'ability')
  assert.deepEqual(abilityItems.map(item => item.exerciseType), ['intro', 'choice', 'typing'])
  assert.ok(items.findIndex(item => item.wordId === 'ability' && item.exerciseType === 'typing') - items.findIndex(item => item.wordId === 'ability' && item.exerciseType === 'intro') >= 2)
})

test('failed work is delayed when other eligible items exist', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.enqueueRetry, 'function', 'enqueueRetry should exist')
  assert.equal(typeof mod.selectNextItem, 'function', 'selectNextItem should exist')
  const base = mod.createDailySessionItems!([], [newWord, secondWord, thirdWord])
  const failed = base.find(item => item.wordId === 'ability' && item.exerciseType === 'typing')!
  const queue = mod.enqueueRetry!(base.filter(item => item.id !== failed.id), failed, 4)
  const next = mod.selectNextItem!(queue, 4, 'ability')
  assert.notEqual(next?.source, 'retry')
  assert.notEqual(next?.wordId, 'ability')
})

test('a word receives at most two retry items', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.enqueueRetry, 'function', 'enqueueRetry should exist')
  const original = { id: 'x', wordId: 'ability', exerciseType: 'typing', source: 'new', attempt: 0, earliestStep: 0, core: true } as const
  let queue = mod.enqueueRetry!([], original, 2)
  const retry1 = queue[0]
  queue = mod.enqueueRetry!(queue, retry1, 5)
  const retry2 = queue.find(item => item.attempt === 2)!
  queue = mod.enqueueRetry!(queue, retry2, 8)
  assert.equal(queue.filter(item => item.wordId === 'ability' && item.source === 'retry').length, 2)
})

test('retry cap applies across multiple failed core exercises for the same word', async () => {
  const mod = await loadModule()
  const choice = { id: 'choice-core', wordId: 'ability', exerciseType: 'choice', source: 'new', attempt: 0, earliestStep: 0, core: true } as const
  const typing = { id: 'typing-core', wordId: 'ability', exerciseType: 'typing', source: 'new', attempt: 0, earliestStep: 0, core: true } as const
  let queue = mod.enqueueRetry!([typing], choice, 2)
  const retry1 = queue.find(item => item.source === 'retry')!
  const queuedTyping = queue.find(item => item.id === 'typing-core')!
  queue = queue.filter(item => item.id !== queuedTyping.id)
  queue = mod.enqueueRetry!(queue, queuedTyping, 4)
  const retry2 = queue.find(item => item.source === 'retry' && item.id !== retry1.id)!
  queue = queue.filter(item => item.id !== retry1.id)
  queue = mod.enqueueRetry!(queue, retry1, 6)
  assert.equal(queue.filter(item => item.wordId === 'ability' && item.source === 'retry').length, 1)
  assert.equal(retry2.attempt, 2)
})

test('retry items never increase the core progress denominator', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.coreProgress, 'function', 'coreProgress should exist')
  const base = mod.createDailySessionItems!([], [newWord, secondWord])
  const originalTotal = mod.coreProgress!(base, new Set()).total
  const failed = base.find(item => item.exerciseType === 'typing')!
  const withRetry = mod.enqueueRetry!(base, failed, 3)
  assert.equal(mod.coreProgress!(withRetry, new Set()).total, originalTotal)
})
