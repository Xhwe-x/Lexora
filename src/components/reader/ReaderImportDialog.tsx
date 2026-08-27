import { useEffect, useRef, useState } from 'react'
import { FileText, Link2, X } from 'lucide-react'
import { importRemoteText, parseReaderImport, type ReaderImportResult } from '../../features/reader/importers'

export function ReaderImportDialog({ open, serviceUrl, onClose, onImported }: { open: boolean; serviceUrl?: string; onClose: () => void; onImported: (result: ReaderImportResult) => void }) {
  const [format, setFormat] = useState<'url' | 'plain-text' | 'srt' | 'vtt'>('plain-text')
  const [title, setTitle] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => dialogRef.current?.focus(), 0)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])
  if (!open) return null

  const submit = async () => {
    if (!input.trim()) { setError('请先粘贴内容。'); return }
    setError('')
    setLoading(true)
    try {
      const result = format === 'url' ? await importRemoteText(input, serviceUrl, { timeoutMs: 8000 }) : parseReaderImport(input, format, title)
      onImported(format === 'url' || !audioUrl.trim() ? result : { ...result, audioUrl: audioUrl.trim() })
      setInput('')
      setTitle('')
      setAudioUrl('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导入失败，请检查输入格式。')
    } finally {
      setLoading(false)
    }
  }

  return <div className="readerImportBackdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className="readerImportDialog" role="dialog" aria-modal="true" aria-labelledby="reader-import-title" tabIndex={-1}><header><div><span className="eyebrow">LOCAL IMPORT</span><h2 id="reader-import-title">导入阅读内容</h2></div><button className="iconOnly" type="button" onClick={onClose} aria-label="关闭导入"><X size={19}/></button></header><div className="readerImportModes" role="tablist" aria-label="导入格式"><button className={format === 'plain-text' ? 'active' : ''} type="button" onClick={() => setFormat('plain-text')}><FileText size={15}/>纯文本</button><button className={format === 'srt' ? 'active' : ''} type="button" onClick={() => setFormat('srt')}>SRT</button><button className={format === 'vtt' ? 'active' : ''} type="button" onClick={() => setFormat('vtt')}>VTT</button><button className={format === 'url' ? 'active' : ''} type="button" onClick={() => setFormat('url')}><Link2 size={15}/>URL</button></div><label className="readerImportTitle">标题<input value={title} onChange={event => setTitle(event.target.value)} placeholder={format === 'url' ? '远程服务返回标题' : '我的阅读'}/></label>{format !== 'url' && <label className="readerImportTitle">可选音频 URL<input value={audioUrl} onChange={event => setAudioUrl(event.target.value)} placeholder="https://…/audio.mp3" inputMode="url"/></label>}<label className="readerImportInput">{format === 'url' ? '粘贴文章 URL' : format === 'plain-text' ? '粘贴纯文本' : `粘贴 ${format.toUpperCase()} 字幕`}<textarea value={input} onChange={event => setInput(event.target.value)} placeholder={format === 'url' ? 'https://…' : format === 'plain-text' ? '粘贴一段你想读的英文…' : '粘贴字幕内容…'} autoFocus /></label>{format === 'url' && <p className="readerImportNote">URL 只通过已配置的 Lexora 服务处理；服务不可用或被 CORS 拒绝时会明确提示，不抓取任意视频二进制。</p>}{error && <p className="readerImportError" role="alert">{error}</p>}<footer><button className="secondaryButton" type="button" onClick={onClose}>取消</button><button className="primaryButton" type="button" disabled={loading} onClick={submit}>{loading ? '导入中…' : '导入并阅读'}</button></footer></section></div>
}
