import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { BookOpen, Check, ChevronDown, Minus, Plus, X } from 'lucide-react'
import type { Word, WordProgress } from '../features/words/types'
import { defaultReaderContent, getCurrentReaderSentence, getReaderCompletionProgress, getReaderContent, getReaderDocumentInteractions, getReaderStats, readerContents, type ReaderContent } from '../features/reader/catalog'
import { getContextSentence, makeReaderDocument, normalizeReaderToken, updateReaderProgress, type ReaderDocument, type ReaderWordInteraction } from '../features/reader/state'
import { loadJson, saveJson } from '../lib/storage'
import { SpeechButton } from './audio/SpeechButton'
import { ReaderCompletion } from './reader/ReaderCompletion'
import { ReaderLibrary } from './reader/ReaderLibrary'
import { ReaderToolbar } from './reader/ReaderToolbar'

const READER_DOCUMENT_KEY = 'lexora:reader-document'

function nextFontSize(value: number, delta: number) { return Math.max(18, Math.min(22, value + delta)) }
function widthPx(width: ReaderDocument['settings']['width']) { return width === 'narrow' ? 620 : width === 'wide' ? 760 : 690 }
function lineHeight(value: ReaderDocument['settings']['lineHeight']) { return value === 'compact' ? 1.72 : value === 'relaxed' ? 1.98 : 1.86 }

export function Reader({ allWords, progress, interactions, onInteraction, onSaveWord, onGoReview }: {
  allWords: Word[]
  progress: Record<string, WordProgress>
  interactions: ReaderWordInteraction[]
  onInteraction: (interaction: ReaderWordInteraction) => void
  onSaveWord: (word: Word, interaction: ReaderWordInteraction) => void
  onGoReview?: (wordIds?: string[]) => void
}) {
  const [document, setDocument] = useState<ReaderDocument>(() => loadJson(READER_DOCUMENT_KEY, makeReaderDocument(defaultReaderContent.text, defaultReaderContent.title)))
  const [view, setView] = useState<'library' | 'reading'>('library')
  const [editorOpen, setEditorOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draft, setDraft] = useState(document.text)
  const [editorTitle, setEditorTitle] = useState(document.title)
  const [selectedToken, setSelectedToken] = useState('')
  const [selectedContext, setSelectedContext] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)
  const sheetDragStart = useRef<number | null>(null)
  const editorTriggerRef = useRef<HTMLButtonElement>(null)
  const readingStartedAtRef = useRef<number | null>(null)
  const [sheetDrag, setSheetDrag] = useState(0)
  const [canvasSize, setCanvasSize] = useState({ scrollHeight: 0, clientHeight: 0 })
  const [elapsedSeconds, setElapsedSeconds] = useState<number | undefined>()

  const normalizedSelected = normalizeReaderToken(selectedToken)
  const selectedWord = useMemo(() => allWords.find(word => word.en.toLowerCase() === normalizedSelected), [allWords, normalizedSelected])
  const selectedInteraction = [...interactions].reverse().find(item => item.token === normalizedSelected && item.contextSentence === selectedContext)
  const isSaved = Boolean(selectedInteraction?.savedToVocabulary || (selectedWord && progress[selectedWord.id] && progress[selectedWord.id].status !== 'new'))
  const parts = useMemo(() => document.text.split(/(\b[A-Za-z][A-Za-z'-]*\b)/g), [document.text])
  const currentContent = useMemo(() => getReaderContent(document), [document])
  const currentSentence = useMemo(() => selectedContext || getCurrentReaderSentence(document.text, document.scrollProgress), [document.text, document.scrollProgress, selectedContext])
  const readerStats = useMemo(() => getReaderStats(document, interactions), [document, interactions])
  const completionProgress = getReaderCompletionProgress(canvasSize.scrollHeight, canvasSize.clientHeight, document.scrollProgress)
  const currentSavedWordIds = useMemo(() => Array.from(new Set(getReaderDocumentInteractions(document, interactions).filter(item => item.savedToVocabulary && item.wordId && allWords.some(word => word.id === item.wordId)).map(item => item.wordId!))), [allWords, document, interactions])
  const hasNextContent = readerContents.length > 1

  useEffect(() => {
    const node = canvasRef.current
    if (!node || document.scrollProgress <= 0) return
    const timer = window.setTimeout(() => {
      const range = node.scrollHeight - node.clientHeight
      if (range > 0) node.scrollTop = range * (document.scrollProgress / 100)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [document.id])

  useEffect(() => {
    if (view !== 'reading' || !document.text.trim()) {
      readingStartedAtRef.current = null
      setElapsedSeconds(undefined)
      return
    }
    const startedAt = Date.now()
    readingStartedAtRef.current = startedAt
    setElapsedSeconds(undefined)
    return () => {
      if (readingStartedAtRef.current === startedAt) readingStartedAtRef.current = null
    }
  }, [document.id, document.text, view])

  useEffect(() => {
    if (view !== 'reading' || !document.text.trim()) return
    const node = canvasRef.current
    if (!node) return
    const measure = () => setCanvasSize(previous => {
      const next = { scrollHeight: node.scrollHeight, clientHeight: node.clientHeight }
      return previous.scrollHeight === next.scrollHeight && previous.clientHeight === next.clientHeight ? previous : next
    })
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(node)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [document.id, document.text, view])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (editorOpen) { closeEditor(); return }
      if (settingsOpen) { setSettingsOpen(false); return }
      if (selectedToken) closeInspector()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const persistDocument = (next: ReaderDocument) => { setDocument(next); saveJson(READER_DOCUMENT_KEY, next) }

  const onScroll = () => {
    const node = canvasRef.current
    if (!node) return
    const range = node.scrollHeight - node.clientHeight
    if (range <= 0) return
    const percent = (node.scrollTop / range) * 100
    const next = updateReaderProgress(document, percent)
    if (next.scrollProgress !== document.scrollProgress) persistDocument(next)
    if (next.scrollProgress >= 100) finishReading()
  }

  const openWord = (event: MouseEvent<HTMLButtonElement>, token: string) => {
    const normalized = normalizeReaderToken(token)
    const contextSentence = getContextSentence(document.text, token)
    const localWord = allWords.find(word => word.en.toLowerCase() === normalized)
    const existing = [...interactions].reverse().find(item => item.token === normalized && item.contextSentence === contextSentence)
    const interaction: ReaderWordInteraction = {
      token: normalized,
      wordId: localWord?.id,
      documentId: document.id,
      contextSentence,
      lookedUpAt: new Date().toISOString(),
      savedToVocabulary: existing?.savedToVocabulary ?? false
    }
    lastTriggerRef.current = event.currentTarget
    setSelectedToken(token)
    setSelectedContext(contextSentence)
    onInteraction(interaction)
    if (window.matchMedia('(max-width: 620px)').matches) window.setTimeout(() => sheetRef.current?.focus(), 0)
  }

  const closeInspector = () => {
    setSheetDrag(0)
    setSelectedToken('')
    setSelectedContext('')
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0)
  }

  const finishReading = () => {
    if (elapsedSeconds !== undefined || readingStartedAtRef.current === null) return
    setElapsedSeconds(Math.max(0, Math.round((Date.now() - readingStartedAtRef.current) / 1000)))
  }

  const completeReading = () => {
    if (!document.text.trim() || completionProgress >= 100) return
    persistDocument(updateReaderProgress(document, 100))
    finishReading()
  }

  const saveSelectedWord = () => {
    if (!selectedWord) return
    const interaction: ReaderWordInteraction = {
      token: selectedWord.en.toLowerCase(),
      wordId: selectedWord.id,
      documentId: document.id,
      contextSentence: selectedContext,
      lookedUpAt: new Date().toISOString(),
      savedToVocabulary: true
    }
    onSaveWord(selectedWord, interaction)
  }

  const saveEditor = () => {
    const nextBase = makeReaderDocument(draft.trim(), editorTitle.trim() || '我的阅读')
    const next = { ...nextBase, settings: document.settings }
    persistDocument(next)
    closeEditor()
    setSelectedToken('')
    setView('reading')
  }

  const closeEditor = () => {
    setEditorOpen(false)
    window.setTimeout(() => editorTriggerRef.current?.focus(), 0)
  }

  const openEditor = () => {
    setDraft(document.text)
    setEditorTitle(currentContent.source === 'custom' ? document.title : '')
    setEditorOpen(true)
  }

  const openContent = (content: ReaderContent) => {
    const next = { ...makeReaderDocument(content.text, content.title), settings: document.settings }
    persistDocument(next)
    setSelectedToken('')
    setSelectedContext('')
    setView('reading')
  }

  const openNextContent = () => {
    const currentIndex = readerContents.findIndex(content => content.id === currentContent.id)
    const next = readerContents[(currentIndex + 1 + readerContents.length) % readerContents.length]
    openContent(next)
  }

  const updateSettings = (patch: Partial<ReaderDocument['settings']>) => persistDocument({ ...document, settings: { ...document.settings, ...patch }, updatedAt: new Date().toISOString() })
  const readingStyle = { '--reader-font-size': `${document.settings.fontSize}px`, '--reader-line-height': lineHeight(document.settings.lineHeight), '--reader-width': `${widthPx(document.settings.width)}px` } as CSSProperties
  const savedTokens = useMemo(() => new Set(interactions.filter(item => item.savedToVocabulary && (!item.wordId || progress[item.wordId]?.status !== 'known')).map(item => item.token)), [interactions, progress])
  const queriedTokens = useMemo(() => new Set(interactions.map(item => item.token)), [interactions])
  const beginSheetDrag = (event: PointerEvent<HTMLDivElement>) => { sheetDragStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId) }
  const moveSheetDrag = (event: PointerEvent<HTMLDivElement>) => { if (sheetDragStart.current == null) return; setSheetDrag(Math.max(0, event.clientY - sheetDragStart.current)) }
  const endSheetDrag = (event: PointerEvent<HTMLDivElement>) => { if (sheetDragStart.current == null) return; const distance = Math.max(0, event.clientY - sheetDragStart.current); sheetDragStart.current = null; if (distance > 100) closeInspector(); else setSheetDrag(0) }

  const settingsPanel = <div className="readerSettingsPopover" role="dialog" aria-label="阅读设置">
    <div className="readerSettingRow"><span>字号</span><div><button type="button" aria-label="减小字号" onClick={() => updateSettings({ fontSize: nextFontSize(document.settings.fontSize, -1) })}><Minus size={15}/></button><b>{document.settings.fontSize}</b><button type="button" aria-label="增大字号" onClick={() => updateSettings({ fontSize: nextFontSize(document.settings.fontSize, 1) })}><Plus size={15}/></button></div></div>
    <label htmlFor="reader-setting-line-height">行距<select id="reader-setting-line-height" value={document.settings.lineHeight} onChange={event => updateSettings({ lineHeight: event.target.value as ReaderDocument['settings']['lineHeight'] })}><option value="compact">紧凑</option><option value="comfortable">舒适</option><option value="relaxed">宽松</option></select></label>
    <label htmlFor="reader-setting-width">正文宽度<select id="reader-setting-width" value={document.settings.width} onChange={event => updateSettings({ width: event.target.value as ReaderDocument['settings']['width'] })}><option value="narrow">窄</option><option value="standard">标准</option><option value="wide">宽</option></select></label>
    <label htmlFor="reader-setting-font">字体<select id="reader-setting-font" value={document.settings.font} onChange={event => updateSettings({ font: event.target.value as ReaderDocument['settings']['font'] })}><option value="serif">Serif</option><option value="sans">Sans</option></select></label>
  </div>

  const readingView = <>
    <ReaderToolbar content={currentContent} progress={completionProgress} currentSentence={currentSentence} settingsOpen={settingsOpen} onToggleSettings={() => setSettingsOpen(value => !value)} onEdit={openEditor} onLibrary={() => { setSettingsOpen(false); setSelectedToken(''); setView('library') }} editorTriggerRef={editorTriggerRef} settingsPanel={settingsPanel}/>
    {!document.text.trim() ? <section className="readerEmpty"><div className="readerEmptyIcon"><BookOpen size={28}/></div><h2>开始一段英语阅读</h2><p>粘贴一篇你真正想读的英文。Lexora 会在需要时帮助处理生词，但不会打断阅读。</p><button className="primaryButton" type="button" onClick={openEditor}>粘贴 / 编辑文本</button><button className="textButton" type="button" onClick={() => openContent(defaultReaderContent)}>使用示例文章：A Small Habit</button></section> : <div className="readerWorkspace">
      <section className="readerCanvasPanel">
        <div ref={canvasRef} className={`readingCanvas ${document.settings.font}`} style={readingStyle} onScroll={onScroll}>
          <div className="readingText">{parts.map((part, index) => {
            if (!/^[A-Za-z]/.test(part)) return <span key={index}>{part}</span>
            const normalized = normalizeReaderToken(part)
            const selected = normalizedSelected === normalized
            const saved = savedTokens.has(normalized)
            const queried = queriedTokens.has(normalized)
            return <button key={index} type="button" className={`readerWord ${selected ? 'selected' : ''} ${saved ? 'saved' : ''} ${queried && !saved ? 'queried' : ''}`} onClick={event => openWord(event, part)}>{part}</button>
          })}</div>
        </div>
        <div className="readerProgressBar" aria-label={`阅读进度 ${completionProgress}%`}><span style={{ width: `${completionProgress}%` }}/></div>
        <div className="readerProgressMeta"><span>开头</span><strong>{completionProgress}%</strong><span>结尾</span></div>
      </section>
      <aside className={`readerInspector desktopInspector ${selectedToken ? 'visible' : ''}`} aria-live="polite">{selectedToken ? <WordInspector word={selectedWord} token={normalizedSelected} context={selectedContext} saved={isSaved} progress={selectedWord ? progress[selectedWord.id] : undefined} onSave={saveSelectedWord} onClose={closeInspector}/> : <div className="inspectorPlaceholder"><span className="eyebrow">WORD INSPECTOR</span><h2>点一个词，继续阅读。</h2><p>查词、发音与加入学习都放在这里，不占用正文空间。</p></div>}</aside>
    </div>}
    {document.text.trim() && completionProgress < 100 && canvasSize.scrollHeight > 0 && canvasSize.clientHeight > 0 && canvasSize.scrollHeight <= canvasSize.clientHeight && <section className="readerCompletionPrompt" aria-label="完成阅读操作"><div><span className="eyebrow">SHORT READING</span><p>这篇内容已经完整显示，可以在读完后手动标记完成。</p></div><button className="primaryButton" type="button" onClick={completeReading}>完成阅读</button></section>}
    {document.text.trim() && completionProgress >= 100 && <ReaderCompletion content={currentContent} progress={completionProgress} elapsedSeconds={elapsedSeconds} encounteredCount={readerStats.encounteredCount} savedCount={readerStats.savedCount} reviewWordCount={currentSavedWordIds.length} onReview={onGoReview ? () => onGoReview(currentSavedWordIds) : undefined} onContinue={openNextContent} hasNext={hasNextContent}/>}
  </>

  return <div className="readerPage pageEnter">
    {view === 'library' ? <ReaderLibrary contents={readerContents} currentContent={currentContent} document={document} onContinue={() => setView('reading')} onSelectContent={openContent} onOpenEditor={openEditor} onUseExample={() => openContent(defaultReaderContent)}/> : readingView}
    {selectedToken && view === 'reading' && <div className="readerSheetBackdrop" onMouseDown={event => event.target === event.currentTarget && closeInspector()}><div ref={sheetRef} tabIndex={-1} className="readerSheet" style={{ transform: sheetDrag ? `translateY(${sheetDrag}px)` : undefined }} role="dialog" aria-modal="true" aria-label={`${normalizedSelected} 词汇信息`}><div className="sheetHandle" onPointerDown={beginSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={endSheetDrag} onPointerCancel={() => { sheetDragStart.current = null; setSheetDrag(0) }}/><WordInspector word={selectedWord} token={normalizedSelected} context={selectedContext} saved={isSaved} progress={selectedWord ? progress[selectedWord.id] : undefined} onSave={saveSelectedWord} onClose={closeInspector}/></div></div>}
    {editorOpen && <div className="editorBackdrop" onMouseDown={event => event.target === event.currentTarget && closeEditor()}><section className="readerEditor" role="dialog" aria-modal="true" aria-label="编辑阅读文本"><header><div><span className="eyebrow">EDIT TEXT</span><h2>编辑阅读文本</h2></div><button className="iconOnly" type="button" onClick={closeEditor} aria-label="关闭编辑器"><X size={20}/></button></header><label className="readerEditorTitle">标题<input value={editorTitle} onChange={event => setEditorTitle(event.target.value)} placeholder="我的阅读" /></label><textarea autoFocus value={draft} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)} placeholder="粘贴你想阅读的英文文本…"/><footer><span>{draft.trim().split(/\s+/).filter(Boolean).length} words</span><button className="primaryButton" type="button" onClick={saveEditor}>保存并阅读</button></footer></section></div>}
  </div>
}

function WordInspector({ word, token, context, saved, progress, onSave, onClose }: { word?: Word; token: string; context: string; saved: boolean; progress?: WordProgress; onSave: () => void; onClose: () => void }) {
  const state = progress?.status === 'known' ? '较稳定' : progress?.status === 'learning' || saved ? '学习中' : '未加入'
  return <div className="wordInspectorContent">
    <div className="inspectorTop"><span className="eyebrow">WORD</span><button className="iconOnly inspectorClose" onClick={onClose} aria-label="关闭词卡"><X size={18}/></button></div>
    <div className="inspectorWordRow"><div><h2>{token}</h2>{word && <span>{word.level} · {word.category}{word.meanings?.[0]?.partOfSpeech ? ` · ${word.meanings[0].partOfSpeech}` : ''}</span>}</div><SpeechButton text={token}/></div>
    {word ? <><div className="inspectorMeaningBlock"><p className="inspectorMeaning">{word.zh}</p>{word.meanings?.[0]?.usageNote && <span>{word.meanings[0].usageNote}</span>}</div>{word.meanings && word.meanings.length > 1 && <details className="inspectorMoreMeanings"><summary>更多释义</summary><ol>{word.meanings.slice(1).map(meaning => <li key={meaning.text}><strong>{meaning.text}</strong>{meaning.partOfSpeech && <span>{meaning.partOfSpeech}</span>}{meaning.usageNote && <small>{meaning.usageNote}</small>}</li>)}</ol></details>}{word.collocations?.length ? <p className="inspectorCollocations"><span>常见搭配</span>{word.collocations.slice(0, 2).join(' · ')}</p> : null}<div className="contextBlock"><span>当前语境</span><p>{context || word.example}</p>{word.exampleZh && <small>{word.exampleZh}</small>}</div>{word.examExample && <details className="inspectorMoreContext"><summary>更多考试语境</summary><p>{word.examExample}</p><small>{word.examExampleZh}</small></details>}{!saved && (!progress || progress.status === 'new') ? <button className="primaryButton inspectorSave" onClick={onSave}><Plus size={17}/> 加入学习</button> : <div className="savedLearningState"><Check size={17}/><span>{state}</span></div>}<div className="inspectorStatus"><span>学习状态</span><strong>{state}</strong></div></> : <div className="dictionaryUnavailable"><p>当前本地词库尚未收录这个词。</p><span>Lexora 不会假装已经有完整词典能力；你仍然可以继续阅读和播放发音。</span></div>}
  </div>
}
