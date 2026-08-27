import { Pencil, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import type { ReaderContent } from '../../features/reader/catalog'
import { readerKindLabel, readerLevelLabel, readerTrackLabel } from '../../features/reader/catalog'
import { SpeechButton } from '../audio/SpeechButton'

export function ReaderToolbar({ content, progress, currentSentence, audioControls, examRouteLabel, settingsOpen, onToggleSettings, onEdit, onLibrary, editorTriggerRef, settingsPanel }: {
  content: ReaderContent
  progress: number
  currentSentence: string
  audioControls?: ReactNode
  examRouteLabel?: string
  settingsOpen: boolean
  onToggleSettings: () => void
  onEdit: () => void
  onLibrary: () => void
  editorTriggerRef?: RefObject<HTMLButtonElement | null>
  settingsPanel?: ReactNode
}) {
  const settingsTriggerRef = useRef<HTMLButtonElement>(null)
  const wasSettingsOpen = useRef(false)

  useEffect(() => {
    if (wasSettingsOpen.current && !settingsOpen) settingsTriggerRef.current?.focus()
    wasSettingsOpen.current = settingsOpen
  }, [settingsOpen])

  return <header className="readerToolbar">
    <div className="readerToolbarTitle"><span className="eyebrow">READING</span><div><h1>{content.title}</h1><div className="readerMetaLine"><span className={`readerMetaBadge ${content.track}`}>{readerLevelLabel(content.level)}</span><span className={`readerMetaBadge ${content.track}`}>{readerTrackLabel(content.track)}</span>{examRouteLabel && <span className="readerMetaBadge exam">{examRouteLabel}</span>}<span>{content.topic} · {readerKindLabel(content.kind)}</span></div></div></div>
    <div className="readerToolbarProgress"><span>阅读进度</span><strong>{progress}%</strong><div className="readerToolbarProgressTrack"><span style={{ width: `${progress}%` }}/></div></div>
    <div className="readerTools"><div className="readerCurrentSentence">{audioControls ?? (currentSentence ? <><SpeechButton text={currentSentence} size="small" className="readerSentenceSpeech"/><span>播放当前句</span></> : <span>暂无可播放句子</span>)}</div><button className="toolButton" type="button" onClick={onLibrary}>内容库</button><div className="readerSettingsWrap"><button ref={settingsTriggerRef} className={`toolButton ${settingsOpen ? 'active' : ''}`} type="button" onClick={onToggleSettings} aria-expanded={settingsOpen}><SlidersHorizontal size={17}/> 阅读设置</button>{settingsOpen && settingsPanel}</div><button ref={editorTriggerRef} className="toolButton" type="button" onClick={onEdit}><Pencil size={17}/> 编辑文本</button></div>
  </header>
}
