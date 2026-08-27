import test from 'node:test'
import assert from 'node:assert/strict'
import { htmlToText, importTextFromUrl, parseSubtitleDocument } from '../../server/import.mjs'

function fakeResponse(body, headers = {}, status = 200) {
  const normalizedHeaders = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => normalizedHeaders[name.toLowerCase()] ?? null },
    text: async () => body
  }
}

async function assertImportStatus(action, status) {
  await assert.rejects(action, error => error?.status === status)
}

test('server subtitle import parses SRT and VTT with a 5ms cue boundary', () => {
  const srt = parseSubtitleDocument('1\n00:00:00,005 --> 00:00:01,250\nHello.', 'srt')
  assert.equal(srt.format, 'srt')
  assert.deepEqual(srt.cues, [{ startMs: 5, endMs: 1250, text: 'Hello.' }])

  const vtt = parseSubtitleDocument('WEBVTT\n\n00:00:00.005 --> 00:00:01.250\nHello.', 'vtt')
  assert.equal(vtt.format, 'vtt')
  assert.deepEqual(vtt.cues, [{ startMs: 5, endMs: 1250, text: 'Hello.' }])
})

test('server HTML import removes unsafe elements and preserves readable text', () => {
  assert.equal(htmlToText('<article><h1>Title &amp; one</h1><script>bad()</script><p>Readable text.</p></article>'), 'Title & one\nReadable text.')
})

test('server URL import rejects unsupported protocols and content types', async () => {
  await assertImportStatus(importTextFromUrl('file:///tmp/secret.txt', { fetchImpl: async () => fakeResponse('secret', { 'content-type': 'text/plain' }) }), 400)
  await assertImportStatus(importTextFromUrl('https://example.test/data', {
    fetchImpl: async () => fakeResponse('{"not":"text"}', { 'content-type': 'application/json' })
  }), 415)
})

test('server URL import rejects oversized responses and timed-out fetches', async () => {
  await assertImportStatus(importTextFromUrl('https://example.test/large', {
    maxBytes: 10,
    fetchImpl: async () => fakeResponse('01234567890', { 'content-type': 'text/plain', 'content-length': '11' })
  }), 413)

  const fetchThatWaitsForAbort = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
  })
  await assertImportStatus(importTextFromUrl('https://example.test/slow', {
    timeoutMs: 5,
    fetchImpl: fetchThatWaitsForAbort
  }), 504)
})

test('server URL import rejects loopback and private targets before fetching', async () => {
  const blockedUrls = [
    'http://127.0.0.1/internal',
    'http://localhost/internal',
    'http://10.0.0.8/internal',
    'http://172.16.0.9/internal',
    'http://192.168.1.9/internal',
    'http://169.254.169.254/latest/meta-data'
  ]

  for (const url of blockedUrls) {
    await assertImportStatus(importTextFromUrl(url, {
      fetchImpl: async () => fakeResponse('private content', { 'content-type': 'text/plain' })
    }), 400)
  }
})

test('server URL import rejects redirects to private destinations without fetching them', async () => {
  const requestedUrls = []
  await assert.rejects(importTextFromUrl('https://public.example/article', {
    fetchImpl: async url => {
      requestedUrls.push(String(url))
      if (requestedUrls.length === 1) {
        return fakeResponse('', { location: 'http://127.0.0.1/private' }, 302)
      }
      return fakeResponse('private content', { 'content-type': 'text/plain' })
    }
  }), error => error?.status === 400 || error?.status === 502)
  assert.deepEqual(requestedUrls, ['https://public.example/article'])
})
