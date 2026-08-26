import { ArrowRight, BookOpen, Brain, CheckCircle2, Flame, Languages, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Settings } from '../components/Settings'
import type { Word, WordProgress } from '../features/words/types'
import { calculateStreak, getWeekActivity, type LearningDayRecord } from '../learning/learningHistory'
import type { ReviewEvent } from '../learning/reviewHistory'

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function findSevenDayMilestone(history: LearningDayRecord[]) {
  const active = history.filter(record => record.coreExercises > 0 || record.reviewEvents > 0 || record.learnedWordIds.length > 0 || record.readerWordIds.length > 0).map(record => record.date).sort()
  let streak = 0
  let previous = ''
  for (const date of active) {
    if (!previous) streak = 1
    else {
      const prev = new Date(`${previous}T12:00:00`); prev.setDate(prev.getDate() + 1)
      streak = prev.toISOString().slice(0, 10) === date ? streak + 1 : 1
    }
    if (streak >= 7) return date
    previous = date
  }
  return undefined
}

function formatDate(date?: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

export function My({ allWords, progress, reviewHistory, learningHistory, dailyCount, maxDaily, onCount, onReset, onStartToday, onGoReader }: {
  allWords: Word[]
  progress: Record<string, WordProgress>
  reviewHistory: ReviewEvent[]
  learningHistory: LearningDayRecord[]
  dailyCount: number
  maxDaily: number
  onCount: (value: number) => void
  onReset: () => void
  onStartToday: () => void
  onGoReader: () => void
}) {
  const week = useMemo(() => getWeekActivity(learningHistory), [learningHistory])
  const [selectedDay, setSelectedDay] = useState(() => week.find(day => day.active)?.date ?? week[0]?.date)
  const selectedRecord = learningHistory.find(record => record.date === selectedDay)
  const streak = calculateStreak(learningHistory)
  const learned = allWords.filter(word => progress[word.id]?.status === 'learning' || progress[word.id]?.status === 'known').length
  const learning = allWords.filter(word => progress[word.id]?.status === 'learning').length
  const stable = allWords.filter(word => progress[word.id]?.status === 'known').length
  const unlearned = Math.max(0, allWords.length - learned)
  const effectiveReviews = reviewHistory.filter(event => event.source === 'due' || event.source === 'retry').length
  const activeDays = week.filter(day => day.active).length
  const firstSession = learningHistory.find(record => record.coreExercises > 0)?.date
  const sevenDayDate = findSevenDayMilestone(learningHistory)
  const recallEvents = reviewHistory.filter(event => event.exerciseType === 'typing' && event.result === 'pass')
  const milestones = [
    firstSession ? { title: '完成第一次学习 Session', date: firstSession } : undefined,
    sevenDayDate ? { title: '连续学习 7 天', date: sevenDayDate } : undefined,
    recallEvents.length >= 100 ? { title: '完成 100 次主动回忆', date: recallEvents[99].at.slice(0, 10) } : undefined
  ].filter((item): item is { title: string; date: string } => Boolean(item))
  const suggestedMinutes = Math.max(6, Math.ceil(dailyCount * 1.1))

  return <div className="myPage pageEnter">
    <section className="profileHero">
      <div className="profileIdentity"><div className="profileAvatar">L</div><div><span className="eyebrow">LOCAL LEARNER</span><h1>我的学习</h1><p>Learning locally with Lexora</p></div></div>
      <div className="profileStats">
        <div><Flame size={18}/><strong>{streak}</strong><span>{streak > 0 ? '连续学习天' : '连续学习'}</span></div>
        <div><Languages size={18}/><strong>{learned}</strong><span>已学习词</span></div>
        <div><Brain size={18}/><strong>{effectiveReviews}</strong><span>有效复习</span></div>
        <div><CheckCircle2 size={18}/><strong>{activeDays}</strong><span>本周学习天</span></div>
      </div>
    </section>

    <section className="mySection weeklySection"><div className="sectionHeading"><div><span className="eyebrow">THIS WEEK</span><h2>本周</h2></div><span>{activeDays ? `已经学习 ${activeDays} 天` : '这周还没有学习记录'}</span></div>
      <div className="weekStrip">{week.map((day, index) => <button key={day.date} className={`${day.active ? 'active' : ''} ${selectedDay === day.date ? 'selected' : ''}`} onClick={() => setSelectedDay(day.date)}><span>{DAY_LABELS[index]}</span><i/><small>{day.date.slice(8)}</small></button>)}</div>
      <div className="dayDetail">{selectedRecord ? <><strong>{formatDate(selectedRecord.date)}</strong><span>{selectedRecord.coreExercises} 个核心练习 · {selectedRecord.reviewEvents} 次复习{selectedRecord.readerWordIds.length ? ` · ${selectedRecord.readerWordIds.length} 个阅读生词` : ''}</span></> : <><strong>这一天没有学习记录</strong><span>一次中断不会抹掉长期进步。</span></>}</div>
    </section>

    <div className="myTwoColumn">
      <section className="mySection learningPlanCard"><div className="sectionHeading"><div><span className="eyebrow">PLAN</span><h2>学习计划</h2></div></div><div className="planNumber"><strong>{dailyCount}</strong><span>个新词 / 天</span></div><p>按当前计划，建议为每日学习预留约 {suggestedMinutes} 分钟。实际用时由你的节奏决定，不作为考核。</p><button className="secondaryButton" onClick={onStartToday}>开始今日学习 <ArrowRight size={16}/></button></section>
      <section className="mySection vocabularyGrowth"><div className="sectionHeading"><div><span className="eyebrow">VOCABULARY</span><h2>词汇成长</h2></div></div><GrowthRow label="未学习" count={unlearned} total={allWords.length}/><GrowthRow label="学习中" count={learning} total={allWords.length}/><GrowthRow label="较稳定" count={stable} total={allWords.length}/><button className="textButton" onClick={onGoReader}><BookOpen size={15}/> 去阅读中遇见更多词</button></section>
    </div>

    {milestones.length > 0 && <section className="mySection milestones"><div className="sectionHeading"><div><span className="eyebrow">MILESTONES</span><h2>最近里程碑</h2></div></div><div className="milestoneList">{milestones.slice(-3).reverse().map(item => <div className="milestoneRow" key={item.title}><span className="milestoneIcon"><Sparkles size={17}/></span><div><strong>{item.title}</strong><span>{formatDate(item.date)} 达成</span></div></div>)}</div></section>}

    <Settings dailyCount={dailyCount} max={maxDaily} onCount={onCount} onReset={onReset}/>
  </div>
}

function GrowthRow({ label, count, total }: { label: string; count: number; total: number }) {
  const width = total > 0 ? count / total * 100 : 0
  return <div className="growthRow"><div><span>{label}</span><strong>{count}</strong></div><div><span style={{ width: `${width}%` }}/></div></div>
}
