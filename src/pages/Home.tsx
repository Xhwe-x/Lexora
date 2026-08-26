import { ArrowRight, CheckCircle2, Clock3, RotateCcw, Sparkles } from 'lucide-react'
import type { Word, WordProgress } from '../features/words/types'

export function Home({ dueCount, newWords, progress, completedToday, onStart, onReview, onSettings }: {
  dueCount: number
  newWords: Word[]
  progress: Record<string, WordProgress>
  completedToday: boolean
  onStart: () => void
  onReview: () => void
  onSettings: () => void
}) {
  const estimate = Math.max(3, Math.ceil(dueCount * 0.45 + newWords.length * 1.1))
  const weakWords = newWords
    .filter(word => progress[word.id]?.wrong > 0)
    .sort((a, b) => (progress[b.id]?.wrong ?? 0) - (progress[a.id]?.wrong ?? 0))
    .slice(0, 3)

  return <div className="homePage">
    <section className={`todayFocus ${completedToday ? 'completed' : ''}`}>
      <div className="todayFocusTop"><span className="brandEyebrow">LEXORA · TODAY</span>{completedToday ? <span className="donePill"><CheckCircle2 size={15}/> 今日目标已完成</span> : <span className="quietPill"><Clock3 size={15}/> 约 {estimate} 分钟</span>}</div>
      <div className="todayFocusBody">
        <p className="greeting">{completedToday ? '做得不错，今天的核心任务已经收尾。' : '今天先完成这一组。'}</p>
        <h1>{completedToday ? '保持节奏，比多刷几轮更重要。' : '复习旧词，再把新词真正想起来。'}</h1>
        <div className="todaySummary" aria-label="今日学习任务"><span><RotateCcw size={17}/><b>{dueCount}</b> 到期复习</span><span><Sparkles size={17}/><b>{newWords.length}</b> 今日新词</span><span><Clock3 size={17}/><b>{estimate}</b> 分钟左右</span></div>
        {!completedToday ? <button className="primaryButton homePrimary" onClick={onStart}>开始今日学习 <ArrowRight size={19}/></button> : <button className="secondaryButton homePrimary secondaryHome" onClick={onReview}>自由复习 <ArrowRight size={19}/></button>}
      </div>
      <div className="todayFocusFoot">
        {weakWords.length ? <p><span>需要留意</span>{weakWords.map(word => word.en).join(' · ')}</p> : <p><span>学习方式</span>新词先理解，再识别，最后主动回忆。</p>}
        <button className="textButton" onClick={onSettings}>调整每日新词</button>
      </div>
    </section>
  </div>
}
