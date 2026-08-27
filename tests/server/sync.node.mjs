import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createServer, loadConfig, startServer, stopServer } from '../../server/index.mjs'
import { createSyncStore, validateSyncPayload } from '../../server/store.mjs'

test('sync configuration, payload validation and file store use versioned isolated state', async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'lexora-sync-'))
  try {
    const config = loadConfig({ SYNC_TOKEN: 'secret-token', SYNC_DATA_DIR: dataDir, SYNC_PORT: '0' })
    assert.equal(config.syncToken, 'secret-token')
    assert.equal(config.dataDir, dataDir)
    assert.equal(loadConfig({ SYNC_TOKEN: ' ', SYNC_DATA_DIR: dataDir }).syncToken, null)

    const payload = { version: 1, data: { theme: 'quiet', words: ['ability'] } }
    assert.deepEqual(validateSyncPayload(payload), payload)
    assert.throws(() => validateSyncPayload({ version: 2, data: {} }), error => error?.status === 400)
    assert.throws(() => validateSyncPayload({ version: 1, data: {}, state: {} }), error => error?.status === 400)
    assert.throws(() => validateSyncPayload({ version: 1, data: [] }), error => error?.status === 400)

    const store = createSyncStore({ dataDir })
    assert.equal(await store.read('alice'), null)
    await store.write('alice', payload)
    assert.deepEqual(await store.read('alice'), payload)
    await store.remove('alice')
    assert.equal(await store.read('alice'), null)
  } finally {
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('HTTP sync fails closed without a token and binds a bearer token to one namespace', async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'lexora-sync-http-'))
  let noTokenServer
  let authServer
  try {
    noTokenServer = await startServer({ host: '127.0.0.1', port: 0, dataDir, syncToken: null, allowedOrigins: [] })
    const noTokenAddress = noTokenServer.address()
    const noTokenResponse = await fetch(`http://127.0.0.1:${noTokenAddress.port}/api/sync/state`, {
      headers: { 'X-Lexora-User-ID': 'alice' }
    })
    assert.equal(noTokenResponse.status, 503)
    await stopServer(noTokenServer)
    noTokenServer = undefined

    authServer = await startServer({ host: '127.0.0.1', port: 0, dataDir, syncToken: 'secret-token', allowedOrigins: [] })
    const authAddress = authServer.address()
    const baseUrl = `http://127.0.0.1:${authAddress.port}/api/sync/state`
    const wrongToken = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer wrong-token', 'X-Lexora-User-ID': 'alice' }
    })
    assert.equal(wrongToken.status, 401)

    const alicePayload = { version: 1, data: { owner: 'alice' } }
    const aliceWrite = await fetch(baseUrl, {
      method: 'PUT',
      headers: { Authorization: 'Bearer secret-token', 'Content-Type': 'application/json', 'X-Lexora-User-ID': 'alice' },
      body: JSON.stringify(alicePayload)
    })
    assert.equal(aliceWrite.status, 200)

    const changedHeader = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer secret-token', 'X-Lexora-User-ID': 'bob' }
    })
    if (changedHeader.status === 200) {
      assert.deepEqual(await changedHeader.json(), alicePayload)
    } else {
      assert.ok([401, 403].includes(changedHeader.status))
    }
  } finally {
    await Promise.all([
      noTokenServer ? stopServer(noTokenServer) : Promise.resolve(),
      authServer ? stopServer(authServer) : Promise.resolve()
    ])
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('createServer exposes a configured HTTP server without starting it', () => {
  const server = createServer({ host: '127.0.0.1', port: 0, syncToken: null, allowedOrigins: [] })
  assert.equal(server.listening, false)
  assert.equal(server.lexoraConfig.syncToken, null)
  server.close()
})
