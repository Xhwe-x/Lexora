import test from 'node:test'
import assert from 'node:assert/strict'
import {
  importRemoteText,
  parseHtmlText,
  parsePlainText,
  parseSrt,
  parseVtt,
  ReaderImportError
} from '../../src/features/reader/importers.ts'

function assertImportError(action: () => unknown, code: ReaderImportError['code']) {
  assert.throws(action, error => error instanceof ReaderImportError && error.code === code)
}

test('plain text and HTML importers normalize text and preserve the requested title', () => {
  assert.deepEqual(parsePlainText('\uFEFF  Hello Lexora.  ', '  Notes  '), {
    title: 'Notes',
    text: 'Hello Lexora.',
    format: 'plain-text'
  })

  const html = parseHtmlText('<p>Hello &amp; world</p><script>ignore this</script><div>Read<br>next.</div>', '  Web note  ')
  assert.equal(html.title, 'Web note')
  assert.equal(html.format, 'html')
  assert.match(html.text, /Hello & world/)
  assert.match(html.text, /Read\nnext\./)
  assert.doesNotMatch(html.text, /ignore this/)
})

test('SRT parsing preserves cue shape and converts 00:00:00,005 to exactly 5ms', () => {
  const result = parseSrt(`1
00:00:00,005 --> 00:00:01,250
Hello, world!

2
00:00:01,250 --> 00:00:02,500
Second cue.`)

  assert.equal(result.format, 'srt')
  assert.equal(result.text, 'Hello, world! Second cue.')
  assert.deepEqual(result.cues, [
    { id: 'srt-1', startMs: 5, endMs: 1250, text: 'Hello, world!' },
    { id: 'srt-2', startMs: 1250, endMs: 2500, text: 'Second cue.' }
  ])
})

test('VTT parsing preserves cue shape and converts millisecond timestamps exactly', () => {
  const result = parseVtt(`WEBVTT

00:00:00.005 --> 00:00:01.500
A <b>cue</b>.

00:01.500 --> 00:02.000
Second cue.`)

  assert.equal(result.format, 'vtt')
  assert.deepEqual(result.cues, [
    { id: 'vtt-1', startMs: 5, endMs: 1500, text: 'A cue.' },
    { id: 'vtt-2', startMs: 1500, endMs: 2000, text: 'Second cue.' }
  ])
})

test('importers reject empty and malformed input with typed errors', () => {
  assertImportError(() => parsePlainText('   '), 'empty')
  assertImportError(() => parseHtmlText('<script>only code</script>'), 'empty')
  assertImportError(() => parseSrt('not a subtitle'), 'unsupported')
  assertImportError(() => parseVtt('WEBVTT'), 'unsupported')
})

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('test timeout')), timeoutMs)
    promise.then(value => {
      clearTimeout(timer)
      resolve(value)
    }, error => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

test('importRemoteText reports an explicit error when the service is not configured', async () => {
  await assert.rejects(importRemoteText('https://example.test/article'), error => error instanceof ReaderImportError && error.code === 'service-unavailable')
})

test('importRemoteText returns a bounded explicit error when fetch hangs', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Promise(() => {})
    await assert.rejects(withTimeout(importRemoteText('https://example.test/article', 'http://service.test', { timeoutMs: 10 }), 50), error => error instanceof ReaderImportError && error.code === 'remote-failed')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('importRemoteText keeps the production default timeout long enough for a normal response', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => {
      await new Promise(resolve => setTimeout(resolve, 45))
      return { ok: true, json: async () => ({ title: 'Delayed', text: 'A delayed response.', format: 'text' }) }
    }
    const result = await importRemoteText('https://example.test/article', 'http://service.test')
    assert.equal(result.text, 'A delayed response.')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('importRemoteText returns an explicit error for an oversized remote response', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ title: 'Too large', text: 'x'.repeat(2_000_001), format: 'text' })
    })
    await assert.rejects(importRemoteText('https://example.test/article', 'http://service.test'), error => error instanceof ReaderImportError && error.code === 'remote-failed')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('VTT importer rejects malformed cues explicitly', () => {
  assertImportError(() => parseVtt('WEBVTT\n\nnot a timing line\nNo cue.'), 'unsupported')
})

test('VTT importer rejects an invalid WEBVTT header explicitly', () => {
  assertImportError(() => parseVtt('WEBVTTX\n\n00:00:00.000 --> 00:00:01.000\nWrong header.'), 'unsupported')
})
