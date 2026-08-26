import test from 'node:test'
import assert from 'node:assert/strict'

type SettingsModule = typeof import('../../src/learning/settings.ts')
async function loadModule(): Promise<Partial<SettingsModule>> { try { return await import('../../src/learning/settings.ts') } catch { return {} } }

test('daily-count draft can be temporarily empty and falls back only on commit', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.commitDailyCountDraft, 'function', 'commitDailyCountDraft should exist')
  assert.equal(mod.commitDailyCountDraft!('', 8, 30), 8)
  assert.equal(mod.commitDailyCountDraft!('15', 8, 30), 15)
})

test('daily-count commit clamps to valid bounds', async () => {
  const mod = await loadModule()
  assert.equal(mod.commitDailyCountDraft!('0', 8, 30), 1)
  assert.equal(mod.commitDailyCountDraft!('99', 8, 30), 30)
})
