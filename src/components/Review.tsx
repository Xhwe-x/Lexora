import { ArrowRight, BookOpen, Brain, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'
import type { Word, WordProgress } from '../features/words/types'
import type { ReaderWordInteraction } from '../features/reader/state'
import { buildReviewInsights } from '../learning/reviewInsights'
import type { ReviewEvent } from '../learning/reviewHistory'

function uniqueWords(words: Word[]) { return [...new Map(words.map(word => [word.id, word])).values()] }
function dateLabel(date: string) {
  const today = new Date(); const key = today.toISOString().slice(0, 10)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  if (date === key) return '今天'
  if (date === yesterdayKey) return '昨天'
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

export function Review({ allWords, progress, history, dueWords, readerInteractions, onStart, onGoReader, onGoWords }: {
  allWords: Word[]
  progress: Record<string, WordProgress>
  history: ReviewEvent[]
  dueWords: Word[]
  readerInteractions: ReaderWordInteraction[]
  onStart: (wordIds?: string[]) => void
  onGoReader: () => void
  onGoWords: () => void
}) {
  const insights = buildReviewInsights(allWords, progress, history)
  const recentErrorWords = insights.weak
  const focusWords = uniqueWords([...dueWords, ...recentErrorWords])
  const dueSet = new Set(dueWords.map(word => word.id))
  const recentErrorExtra = recentErrorWords.filter(word => !dueSet.has(word.id)).length
  const readerWordIds = [...new Set(readerInteractions.filter(item => item.savedToVocabulary && item.wordId && progress[item.wordId]?.status && progress[item.wordId]?.status !== 'new').map(item => item.wordId!))]
  const maxBucket = Math.max(1, insights.weak.length, insights.learning.length, insights.stable.length)
  const estimate = Math.max(2, Math.ceil(focusWords.length * .45))
  const activity = history.filter(event => event.source === 'due' || event.source === 'retry').reduce<Record<string, number>>((acc, event) => { const date = new Date(event.at); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; acc[key] = (acc[key] ?? 0) + 1; return acc }, {})
  const recentActivity = Object.entries(activity).sort(([a], [b]) => b.localeCompare(a)).slice(0, 4)

  return <div className="reviewCenter pageEnter">
    <div className="pageHeading compactHeading"><div><span className="eyebrow">REVIEW</span><h1>复习</h1><p>让快要忘记的内容及时回来。Lexora 会优先处理到期内容和最近真正出错的词。</p></div></div>

    {focusWords.length > 0 ? <section className="reviewHero">
      <div className="reviewHeroIcon"><Brain size={25}/></div>
      <div className="reviewHeroCopy"><span className="eyebrow">TODAY REVIEW</span><h2>{focusWords.length} 个词现在值得复习</h2><p>约 {estimate} 分钟 · {dueWords.length} 个到期{recentErrorExtra > 0 ? ` · ${recentErrorExtra} 个最近易错` : ''}</p></div>
      <button className="primaryButton reviewPrimary" onClick={() => onStart(focusWords.map(word => word.id))}>开始复习 <ArrowRight size={18}/></button>
    </section> : <section className="reviewEmpty">
      <div className="emptyIcon"><CheckCircle2 size={23}/></div><h2>今天没有到期复习</h2><p>说明你的复习队列现在很干净。不需要为了完成数字继续刷旧词。</p><button className="primaryButton" onClick={onGoReader}><BookOpen size={17}/> 去阅读一会儿</button><button className="textButton" onClick={onGoWords}>看看最近学过的词 <ArrowRight size={15}/></button>
    </section>}

    <section className="reviewSection"><div className="sectionHeading"><div><span className="eyebrow">MEMORY</span><h2>记忆状态</h2></div><span>只展示可解释的分组，不给出伪精确百分比。</span></div>
      <div className="memoryRows">
        <MemoryRow label="需加强" count={insights.weak.length} width={insights.weak.length / maxBucket * 100} tone="weak"/>
        <MemoryRow label="学习中" count={insights.learning.length} width={insights.learning.length / maxBucket * 100} tone="learning"/>
        <MemoryRow label="较稳定" count={insights.stable.length} width={insights.stable.length / maxBucket * 100} tone="stable"/>
      </div>
    </section>

    {(recentErrorWords.length > 0 || readerWordIds.length > 0) && <section className="reviewSection"><div className="sectionHeading"><div><span className="eyebrow">FOCUS</span><h2>专项复习</h2></div><span>只出现真正有数据的入口。</span></div><div className="reviewFocusGrid">
      {recentErrorWords.length > 0 && <button className="focusCard" onClick={() => onStart(recentErrorWords.map(word => word.id))}><span className="focusIcon"><RotateCcw size={19}/></span><div><strong>最近错词</strong><small>{recentErrorWords.length} 个 · 重新主动回忆</small></div><ArrowRight size={17}/></button>}
      {readerWordIds.length > 0 && <button className="focusCard" onClick={() => onStart(readerWordIds)}><span className="focusIcon warm"><BookOpen size={19}/></span><div><strong>阅读生词</strong><small>{readerWordIds.length} 个待巩固</small></div><ArrowRight size={17}/></button>}
    </div></section>}

    {recentActivity.length > 0 && <section className="reviewSection"><div className="sectionHeading"><div><span className="eyebrow">RECENT</span><h2>最近复习</h2></div></div><div className="recentReviewList">{recentActivity.map(([date, count]) => <div className="recentReviewRow" key={date}><span>{dateLabel(date)}</span><strong>{count} 次</strong><Sparkles size={16}/></div>)}</div></section>}
  </div>
}

function MemoryRow({ label, count, width, tone }: { label: string; count: number; width: number; tone: string }) {
  return <div className="memoryRow"><div><strong>{label}</strong><span>{count} 个</span></div><div className="memoryTrack"><span className={tone} style={{ width: `${count === 0 ? 0 : Math.max(8, width)}%` }}/></div></div>
}
