import test from 'node:test'
import assert from 'node:assert/strict'
import { getActiveCue, getAudioProgress } from '../../src/features/reader/audioSync.ts'

const cues = [
  { id: 'first', startMs: 0, endMs: 1000, text: 'First sentence.' },
  { id: 'second', startMs: 1000, endMs: 3000, text: 'Second sentence.' }
]

test('getActiveCue selects the first, middle and final cue while excluding out-of-range times', () => {
  assert.equal(getActiveCue(cues, -1), undefined)
  assert.equal(getActiveCue(cues, 0)?.id, 'first')
  assert.equal(getActiveCue(cues, 1500)?.id, 'second')
  assert.equal(getActiveCue(cues, 3000), undefined)
  assert.equal(getActiveCue(cues, 10_000), undefined)
})

test('getAudioProgress clamps before, during and after the cue range', () => {
  assert.equal(getAudioProgress(cues, -1), 0)
  assert.equal(getAudioProgress(cues, 0), 0)
  assert.equal(getAudioProgress(cues, 1500), 50)
  assert.equal(getAudioProgress(cues, 3000), 100)
  assert.equal(getAudioProgress(cues, 10_000), 100)
})
