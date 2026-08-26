import test from 'node:test'
import assert from 'node:assert/strict'

type ExercisesModule = typeof import('../../src/learning/exercises.ts')
async function loadModule(): Promise<Partial<ExercisesModule>> { try { return await import('../../src/learning/exercises.ts') } catch { return {} } }

const words = [
  { id: '1', en: 'ability', zh: '能力', example: '', exampleZh: '', level: 'A2', category: '学习' },
  { id: '2', en: 'achieve', zh: '达到', example: '', exampleZh: '', level: 'A2', category: '动作' },
  { id: '3', en: 'advice', zh: '建议', example: '', exampleZh: '', level: 'A1', category: '交流' },
  { id: '4', en: 'agree', zh: '同意', example: '', exampleZh: '', level: 'A1', category: '交流' },
  { id: '5', en: 'improve', zh: '提高', example: '', exampleZh: '', level: 'A2', category: '学习' }
] as any[]

test('typing grading ignores case and light punctuation but not spelling', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.isTypingCorrect, 'function', 'isTypingCorrect should exist')
  assert.equal(mod.isTypingCorrect!(' Ability! ', 'ability'), true)
  assert.equal(mod.isTypingCorrect!('abilty', 'ability'), false)
})

test('choice options are unique and always include the answer', async () => {
  const mod = await loadModule()
  assert.equal(typeof mod.createChoiceOptions, 'function', 'createChoiceOptions should exist')
  const options = mod.createChoiceOptions!(words[0], words, 4)
  assert.equal(options.length, 4)
  assert.equal(new Set(options).size, 4)
  assert.ok(options.includes('ability'))
})
