import { ArrowRight, BookOpenCheck, RotateCcw } from 'lucide-react'
import type { ReaderContent } from '../../features/reader/catalog'
import { readerLevelLabel, readerTrackLabel } from '../../features/reader/catalog'

export function ReaderCompletion({ content, progress, encounteredCount, savedCount, onReview, onContinue, hasNext }: {
  content: ReaderContent
  progress: number
  encounteredCount: number
  savedCount: number
  onReview?: () => void
  onContinue: () => void
  hasNext: boolean
}) {
  return <section className="readerCompletion" aria-labelledby="reader-completion-title">
    <div className="readerCompletionIcon"><BookOpenCheck size={23}/></div>
    <div className="readerCompletionCopy"><span className="eyebrow">READING COMPLETE</span><h2 id="reader-completion-title">这篇读完了</h2><p>{readerLevelLabel(content.level)} · {readerTrackLabel(content.track)} · {content.title}</p></div>
    <div className="readerCompletionStats" aria-label="阅读完成统计"><div><strong>{progress}%</strong><span>阅读进度</span></div><div><strong>{encounteredCount}</strong><span>遇到的词</span></div><div><strong>{savedCount}</strong><span>已保存</span></div></div>
    <div className="readerCompletionActions">{onReview && <button className="secondaryButton" type="button" onClick={onReview}><RotateCcw size={16}/>打开复习中心</button>}<button className="primaryButton" type="button" onClick={onContinue}>{hasNext ? '继续下一篇' : '继续浏览'} <ArrowRight size={16}/></button></div>
  </section>
}
