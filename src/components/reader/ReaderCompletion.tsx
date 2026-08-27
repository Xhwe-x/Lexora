import { ArrowRight, BookOpenCheck, RotateCcw } from 'lucide-react'
import type { ReaderContent } from '../../features/reader/catalog'
import { readerLevelLabel, readerTrackLabel } from '../../features/reader/catalog'

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder ? `${minutes} 分 ${remainder} 秒` : `${minutes} 分钟`
}

export function ReaderCompletion({ content, progress, elapsedSeconds, encounteredCount, savedCount, reviewWordCount, onReview, onContinue, hasNext }: {
  content: ReaderContent
  progress: number
  elapsedSeconds?: number
  encounteredCount: number
  savedCount: number
  reviewWordCount: number
  onReview?: () => void
  onContinue: () => void
  hasNext: boolean
}) {
  return <section className="readerCompletion" aria-labelledby="reader-completion-title">
    <div className="readerCompletionIcon"><BookOpenCheck size={23}/></div>
    <div className="readerCompletionCopy"><span className="eyebrow">READING COMPLETE</span><h2 id="reader-completion-title">这篇读完了</h2><p>{readerLevelLabel(content.level)} · {readerTrackLabel(content.track)} · {content.title}</p></div>
    <div className="readerCompletionStats" aria-label="阅读完成统计"><div><strong>{progress}%</strong><span>阅读进度</span></div><div><strong>{encounteredCount}</strong><span>遇到的词</span></div><div><strong>{savedCount}</strong><span>已保存</span></div>{elapsedSeconds !== undefined && <div><strong>{formatElapsed(elapsedSeconds)}</strong><span>本次用时</span></div>}</div>
    <div className="readerCompletionActions">{onReview && <button className="secondaryButton" type="button" onClick={onReview}><RotateCcw size={16}/>{reviewWordCount ? `复习本文已保存词（${reviewWordCount}）` : '打开复习中心'}</button>}<button className="primaryButton" type="button" onClick={onContinue}>{hasNext ? '继续下一篇' : '继续浏览'} <ArrowRight size={16}/></button></div>
  </section>
}
