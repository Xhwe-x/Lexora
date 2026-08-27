import { ArrowRight, CheckCircle2, Clock3, RotateCcw, Sparkles } from 'lucide-react'
import type { Word, WordProgress } from '../features/words/types'
import { getSkillLabel, getWeakestSkill, type PlacementProfile } from '../learning/placement'

function trackLabel(track: PlacementProfile['primaryTrack']) {
  return track === 'daily' ? '日常英语' : '考试英语'
}

export function Home({ dueCount, newWords, progress, completedToday, placementProfile, onStart, onReview, onWords, onSettings }: {
  dueCount: number
  newWords: Word[]
  progress: Record<string, WordProgress>
  completedToday: boolean
  placementProfile: PlacementProfile
  onStart: () => void
  onReview: () => void
  onWords: () => void
  onSettings: () => void
}) {
  const estimate = Math.max(3, Math.ceil(dueCount * 0.45 + newWords.length * 1.1))
  const weakWords = newWords
    .filter(word => progress[word.id]?.wrong > 0)
    .sort((a, b) => (progress[b.id]?.wrong ?? 0) - (progress[a.id]?.wrong ?? 0))
    .slice(0, 3)
  const weakestSkill = getWeakestSkill(placementProfile.skillScores)
  const secondaryTrack = placementProfile.primaryTrack === 'daily' ? 'exam' : 'daily'
  const secondaryAction = secondaryTrack === 'exam' ? onWords : onReview
  const secondaryActionLabel = secondaryTrack === 'exam' ? '打开单词库' : '进入复习'

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
    <section className="placementOverview" aria-labelledby="placement-overview-title">
      <div className="placementOverviewTop">
        <div>
          <span className="brandEyebrow">LEXORA · PLACEMENT</span>
          <h2 id="placement-overview-title">当前起点：{placementProfile.level}</h2>
          <p>{placementProfile.recommendation}</p>
        </div>
        <span className="placementLevelPill">{placementProfile.level}</span>
      </div>
      <div className="placementOverviewMeta">
        <span><b>主路径</b>{trackLabel(placementProfile.primaryTrack)}</span>
        <span><b>学习比例</b>日常 {placementProfile.dailyRatio}% · 考试 {placementProfile.examRatio}%</span>
        <span><b>薄弱能力</b>{getSkillLabel(weakestSkill)}</span>
      </div>
    </section>
    <section className="trackSection" aria-labelledby="track-section-title">
      <div className="sectionHeading"><div><span className="eyebrow">DUAL TRACK</span><h2 id="track-section-title">一套词库，两条学习路径</h2></div><span>今天先做主路径</span></div>
      <div className="trackGrid">
        <article className={`trackCard trackCardDaily ${placementProfile.primaryTrack === 'daily' ? 'isPrimary' : ''}`}>
          <div className="trackCardTop"><div><span className="trackBadge">日常英语</span><span className="trackRole">{placementProfile.primaryTrack === 'daily' ? '主路径' : '辅助路径'}</span></div><strong>{placementProfile.dailyRatio}%</strong></div>
          <h3>在真实场景里用起来</h3>
          <p>围绕生活、工作与旅行表达，在句子里把新词真正用起来。</p>
          {secondaryTrack === 'daily' ? <button className="secondaryButton trackCardAction" type="button" onClick={secondaryAction}>{secondaryActionLabel} <ArrowRight size={16}/></button> : <span className="trackCardHint"><CheckCircle2 size={16}/> 今日主线由上方任务带你开始</span>}
        </article>
        <article className={`trackCard trackCardExam ${placementProfile.primaryTrack === 'exam' ? 'isPrimary' : ''}`}>
          <div className="trackCardTop"><div><span className="trackBadge">考试英语</span><span className="trackRole">{placementProfile.primaryTrack === 'exam' ? '主路径' : '辅助路径'}</span></div><strong>{placementProfile.examRatio}%</strong></div>
          <h3>稳住高频表达与理解</h3>
          <p>围绕高频词、书面表达与听写，逐步建立通用考试基础。</p>
          {secondaryTrack === 'exam' ? <button className="secondaryButton trackCardAction" type="button" onClick={secondaryAction}>{secondaryActionLabel} <ArrowRight size={16}/></button> : <span className="trackCardHint"><CheckCircle2 size={16}/> 主路径建议已保存</span>}
        </article>
      </div>
    </section>
  </div>
}
