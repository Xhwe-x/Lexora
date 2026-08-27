import type { ReaderCue, ReaderImportFormat } from './state'

export type ReaderImportResult = {
  title: string
  text: string
  format: ReaderImportFormat
  cues?: ReaderCue[]
  audioUrl?: string
}

export class ReaderImportError extends Error {
  code: 'empty' | 'unsupported' | 'invalid-url' | 'service-unavailable' | 'remote-failed'

  constructor(code: ReaderImportError['code'], message: string) {
    super(message)
    this.name = 'ReaderImportError'
    this.code = code
  }
}

export type RemoteImportOptions = {
  timeoutMs?: number
  maxResponseBytes?: number
}

const DEFAULT_REMOTE_TIMEOUT_MS = 8_000
const DEFAULT_MAX_RESPONSE_BYTES = 2_000_000

function byteLength(value: string) {
  return typeof TextEncoder === 'undefined' ? value.length : new TextEncoder().encode(value).byteLength
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
}

export function parsePlainText(input: string, title = '我的阅读'): ReaderImportResult {
  const text = input.replace(/^\uFEFF/, '').trim()
  if (!text) throw new ReaderImportError('empty', '没有可导入的文本。')
  return { title: title.trim() || '我的阅读', text, format: 'plain-text' }
}

export function parseHtmlText(input: string, title = '我的阅读'): ReaderImportResult {
  const text = decodeHtmlEntities(input.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|article|section|h[1-6])\s*>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\s+([,.!?;:])/g, '$1').replace(/\n\s*\n+/g, '\n').trim()
  if (!text) throw new ReaderImportError('empty', '网页中没有可导入的文本。')
  return { title: title.trim() || '网页文本', text, format: 'html' }
}

function parseTimestamp(value: string) {
  const match = value.match(/^(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})$/)
  if (!match) return null
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  const milliseconds = Number(match[4])
  if (minutes >= 60 || seconds >= 60) return null
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds
}

function parseSubtitle(input: string, format: 'srt' | 'vtt'): ReaderCue[] {
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r/g, '').trim()
  if (format === 'vtt' && !/^WEBVTT(?:\s|$)/i.test(normalized.split('\n')[0]?.trim() ?? '')) {
    throw new ReaderImportError('unsupported', 'VTT 必须以 WEBVTT 头开始。')
  }
  const blocks = normalized.split(/\n{2,}/).map(block => block.trim()).filter(Boolean)
  const cues: ReaderCue[] = []
  let malformedCue = false
  for (const block of blocks) {
    if (format === 'vtt' && /^(WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/i.test(block)) continue
    const lines = block.split('\n')
    const timingIndex = lines.findIndex(line => line.includes('-->'))
    if (timingIndex < 0) {
      malformedCue = true
      continue
    }
    const timing = lines[timingIndex].match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{3}|\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3}|\d{2}:\d{2}[,.]\d{3})/)
    if (!timing) {
      malformedCue = true
      continue
    }
    const startValue = timing[1].split(':').length === 2 ? `00:${timing[1]}` : timing[1]
    const endValue = timing[2].split(':').length === 2 ? `00:${timing[2]}` : timing[2]
    const startMs = parseTimestamp(startValue)
    const endMs = parseTimestamp(endValue)
    const text = lines.slice(timingIndex + 1).join(' ').replace(/<[^>]+>/g, '').trim()
    if (startMs === null || endMs === null || endMs <= startMs || !text) {
      malformedCue = true
      continue
    }
    cues.push({ id: `${format}-${cues.length + 1}`, startMs, endMs, text })
  }
  if (malformedCue || !cues.length) throw new ReaderImportError('unsupported', `没有识别到完整有效的 ${format.toUpperCase()} 字幕 cue。`)
  return cues
}

export function parseSrt(input: string, title = 'SRT 字幕'): ReaderImportResult {
  const cues = parseSubtitle(input, 'srt')
  return { title: title.trim() || 'SRT 字幕', text: cues.map(cue => cue.text).join(' '), format: 'srt', cues }
}

export function parseVtt(input: string, title = 'VTT 字幕'): ReaderImportResult {
  const cues = parseSubtitle(input, 'vtt')
  return { title: title.trim() || 'VTT 字幕', text: cues.map(cue => cue.text).join(' '), format: 'vtt', cues }
}

export function parseReaderImport(input: string, format: 'plain-text' | 'html' | 'srt' | 'vtt', title = ''): ReaderImportResult {
  if (format === 'html') return parseHtmlText(input, title)
  if (format === 'srt') return parseSrt(input, title)
  if (format === 'vtt') return parseVtt(input, title)
  return parsePlainText(input, title)
}

export async function importRemoteText(url: string, serviceUrl?: string, options: RemoteImportOptions = {}): Promise<ReaderImportResult> {
  let parsedUrl: URL
  try { parsedUrl = new URL(url.trim()) } catch { throw new ReaderImportError('invalid-url', '请输入有效的 http(s) URL。') }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new ReaderImportError('invalid-url', '只支持 http(s) URL，不抓取视频二进制。')
  if (!serviceUrl?.trim()) throw new ReaderImportError('service-unavailable', '未配置远程导入服务；你仍可以粘贴纯文本或 SRT/VTT。')
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_REMOTE_TIMEOUT_MS)
  const maxResponseBytes = Math.max(1, options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES)
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const request = fetch(`${serviceUrl.replace(/\/$/, '')}/api/import/text`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: parsedUrl.toString() }), signal: controller.signal })
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new ReaderImportError('remote-failed', '远程导入请求超时；请改用纯文本或字幕粘贴。'))
      }, timeoutMs)
    })
    const response = await Promise.race([request, timeout])
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const contentLength = Number(response.headers?.get?.('content-length'))
    if (Number.isFinite(contentLength) && contentLength > maxResponseBytes) throw new Error('response too large')
    let payload: Partial<ReaderImportResult>
    if (typeof response.text === 'function') {
      const responseText = await response.text()
      if (byteLength(responseText) > maxResponseBytes) throw new Error('response too large')
      payload = JSON.parse(responseText) as Partial<ReaderImportResult>
    } else {
      payload = await response.json() as Partial<ReaderImportResult>
      if (byteLength(JSON.stringify(payload)) > maxResponseBytes) throw new Error('response too large')
    }
    if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('empty response')
    return { title: typeof payload.title === 'string' && payload.title.trim() ? payload.title : parsedUrl.hostname, text: payload.text.trim(), format: payload.format === 'html' ? 'html' : 'url', cues: payload.cues, audioUrl: typeof payload.audioUrl === 'string' ? payload.audioUrl : undefined }
  } catch (error) {
    if (error instanceof ReaderImportError) throw error
    throw new ReaderImportError('remote-failed', '远程导入服务不可用或被 CORS 拒绝；请改用纯文本或字幕粘贴。')
  } finally {
    if (timer) clearTimeout(timer)
  }
}
