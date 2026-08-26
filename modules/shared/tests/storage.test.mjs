import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonStore, createMemoryStorage } from '../src/storage.mjs';

test('JsonStore reads, writes and updates isolated keys', () => {
  const store = new JsonStore('demo', createMemoryStorage());
  assert.deepEqual(store.get('progress', { score: 0 }), { score: 0 });
  store.set('progress', { score: 1 });
  assert.deepEqual(store.get('progress'), { score: 1 });
  store.update('progress', {}, value => ({ ...value, score: value.score + 1 }));
  assert.equal(store.get('progress').score, 2);
});
