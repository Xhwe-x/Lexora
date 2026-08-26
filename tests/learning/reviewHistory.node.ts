import test from 'node:test'
import assert from 'node:assert/strict'

type HistoryModule = typeof import('../../src/learning/reviewHistory.ts')
type StorageModule = typeof import('../../src/lib/storage.ts')

async function loadHistory(): Promise<Partial<HistoryModule>> { try { return await import('../../src/learning/reviewHistory.ts') } catch { return {} } }
async function loadStorage(): Promise<Partial<StorageModule>> { try { return await import('../../src/lib/storage.ts') } catch { return {} } }

class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

test('review history keeps the newest events within the configured cap', async () => {
  const mod = await loadHistory()
  assert.equal(typeof mod.appendReviewEvent, 'function', 'appendReviewEvent should exist')
  const events = [0, 1, 2].reduce((history, index) => mod.appendReviewEvent!(history, {
    id: String(index), wordId: 'ability', at: `2026-08-26T00:00:0${index}.000Z`, source: 'new', exerciseType: 'typing', result: 'pass', attempt: 0
  }, 2), [] as any[])
  assert.deepEqual(events.map(event => event.id), ['1', '2'])
})

test('migration loader reads legacy data once and writes the Lexora key', async () => {
  const mod = await loadStorage()
  assert.equal(typeof mod.loadMigratedJson, 'function', 'loadMigratedJson should exist')
  const storage = new MemoryStorage()
  storage.setItem('english-garden:settings', JSON.stringify({ dailyCount: 12 }))
  const result = mod.loadMigratedJson!('lexora:settings', 'english-garden:settings', { dailyCount: 8 }, storage)
  assert.deepEqual(result, { dailyCount: 12 })
  assert.equal(storage.getItem('lexora:settings'), JSON.stringify({ dailyCount: 12 }))
  assert.notEqual(storage.getItem('english-garden:settings'), null)
})

test('migration loader prefers existing Lexora data over legacy data', async () => {
  const mod = await loadStorage()
  const storage = new MemoryStorage()
  storage.setItem('lexora:settings', JSON.stringify({ dailyCount: 6 }))
  storage.setItem('english-garden:settings', JSON.stringify({ dailyCount: 12 }))
  const result = mod.loadMigratedJson!('lexora:settings', 'english-garden:settings', { dailyCount: 8 }, storage)
  assert.deepEqual(result, { dailyCount: 6 })
})
