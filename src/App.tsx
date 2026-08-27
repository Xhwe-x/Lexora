import { useMemo, useState } from 'react'
import { Sidebar, type Page } from './components/Sidebar'
import { WordCard } from './components/WordCard'
import { Review } from './components/Review'
import { Reader } from './components/Reader'
import { PlacementOnboarding } from './components/PlacementOnboarding'
import { Home } from './pages/Home'
import { LearnSession } from './pages/LearnSession'
import { My } from './pages/My'
import { words } from './data/words'
import { clampDailyCount, getDailyNewWordsForProfile, getDueWords, rateWord } from './features/words/scheduler'
import type { Word, WordProgress } from './features/words/types'
import { upsertReaderInteraction, type ReaderWordInteraction } from './features/reader/state'
import type { SessionItem } from './learning/types'
import { appendReviewEvent, type ReviewEvent } from './learning/reviewHistory'
import { recordLearningDay, type LearningDayRecord } from './learning/learningHistory'
import { getPlacementQuestions, isPlacementProfile, type PlacementProfile } from './learning/placement'
import { loadJson, loadMigratedJson, saveJson, todayKey } from './lib/storage'

const PROGRESS_KEY = 'lexora:word-progress'
const SETTINGS_KEY = 'lexora:settings'
const DAILY_PLAN_KEY = 'lexora:daily-plan'
const REVIEW_HISTORY_KEY = 'lexora:review-history'
const DAILY_COMPLETION_KEY = 'lexora:daily-completion'
const LEARNING_HISTORY_KEY = 'lexora:learning-day-history'
const READER_INTERACTIONS_KEY = 'lexora:reader-interactions'
const READER_DOCUMENT_KEY = 'lexora:reader-document'
const LEGACY_PROGRESS_KEY = 'english-garden:word-progress'
const LEGACY_SETTINGS_KEY = 'english-garden:settings'
const LEGACY_DAILY_PLAN_KEY = 'english-garden:daily-plan'
const PLACEMENT_PROFILE_KEY = 'lexora:placement-profile'
const PLACEMENT_QUESTIONS = getPlacementQuestions()
const DEFAULT_PLACEMENT_RATIOS = { dailyRatio: 60, examRatio: 40 }

type SettingsState = { dailyCount: number }
type DailyPlan = { date: string; count: number; wordIds: string[] }
type DailyCompletion = { date: string; completed: boolean }
type SessionState = { mode: 'daily' } | { mode: 'review'; wordIds?: string[] } | null

function buildDailyPlan(date: string, count: number, progress: Record<string, WordProgress>, previousIds: string[] = [], priorityIds: string[] = [], placementProfile: Pick<PlacementProfile, 'dailyRatio' | 'examRatio'> | null = null): DailyPlan {
  const validPrevious = previousIds.filter(id => words.some(word => word.id === id)).slice(0, count)
  const existing = new Set(validPrevious)
  const priority = priorityIds.filter(id => !existing.has(id) && words.some(word => word.id === id) && (!progress[id] || progress[id].status === 'new'))
  const withPriority = [...validPrevious, ...priority].slice(0, count)
  const nextExisting = new Set(withPriority)
  const needed = Math.max(0, count - withPriority.length)
  const candidates = words.filter(word => !nextExisting.has(word.id))
  const additions = needed ? getDailyNewWordsForProfile(candidates, needed, date, progress, placementProfile ?? DEFAULT_PLACEMENT_RATIOS).map(word => word.id) : []
  return { date, count, wordIds: [...withPriority, ...additions] }
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [session, setSession] = useState<SessionState>(null)
  const [placementProfile, setPlacementProfile] = useState<PlacementProfile | null>(() => {
    const stored = loadJson<unknown>(PLACEMENT_PROFILE_KEY, null)
    return isPlacementProfile(stored) ? stored : null
  })
  const [progress, setProgress] = useState<Record<string, WordProgress>>(() => loadMigratedJson(PROGRESS_KEY, LEGACY_PROGRESS_KEY, {}))
  const [settings, setSettings] = useState<SettingsState>(() => loadMigratedJson(SETTINGS_KEY, LEGACY_SETTINGS_KEY, { dailyCount: 8 }))
  const [reviewHistory, setReviewHistory] = useState<ReviewEvent[]>(() => loadJson(REVIEW_HISTORY_KEY, []))
  const [learningHistory, setLearningHistory] = useState<LearningDayRecord[]>(() => loadJson(LEARNING_HISTORY_KEY, []))
  const [readerInteractions, setReaderInteractions] = useState<ReaderWordInteraction[]>(() => loadJson(READER_INTERACTIONS_KEY, []))
  const dailyCount = clampDailyCount(settings.dailyCount, words.length)
  const [dailyCompletion, setDailyCompletion] = useState<DailyCompletion>(() => loadJson(DAILY_COMPLETION_KEY, { date: todayKey(), completed: false }))
  const readerPriorityIds = readerInteractions.filter(item => item.savedToVocabulary && item.wordId).map(item => item.wordId!)
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>(() => {
    const date = todayKey()
    const stored = loadMigratedJson<DailyPlan | null>(DAILY_PLAN_KEY, LEGACY_DAILY_PLAN_KEY, null)
    const plan = buildDailyPlan(date, dailyCount, progress, stored?.date === date ? stored.wordIds : [], readerPriorityIds, placementProfile)
    saveJson(DAILY_PLAN_KEY, plan)
    return plan
  })

  const dailyWords = useMemo(() => dailyPlan.wordIds.map(id => words.find(word => word.id === id)).filter((word): word is Word => Boolean(word)), [dailyPlan])
  const dueWords = useMemo(() => getDueWords(words, progress), [progress])
  const today = todayKey()
  const completedToday = dailyCompletion.date === today && dailyCompletion.completed
  const selectedReviewWords = useMemo(() => {
    if (!session || session.mode !== 'review' || !session.wordIds?.length) return dueWords
    return session.wordIds.map(id => words.find(word => word.id === id)).filter((word): word is Word => Boolean(word))
  }, [session, dueWords])

  const persistProgress = (updater: (prev: Record<string, WordProgress>) => Record<string, WordProgress>) => {
    setProgress(prev => { const next = updater(prev); saveJson(PROGRESS_KEY, next); return next })
  }

  const recordLearning = (delta: Parameters<typeof recordLearningDay>[2]) => {
    setLearningHistory(prev => { const next = recordLearningDay(prev, todayKey(), delta); saveJson(LEARNING_HISTORY_KEY, next); return next })
  }

  const recordResult = (word: Word, correct: boolean, item: SessionItem) => {
    persistProgress(prev => ({ ...prev, [word.id]: rateWord(prev[word.id], correct) }))
    setReviewHistory(prev => {
      const event: ReviewEvent = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${word.id}-${item.attempt}`,
        wordId: word.id,
        at: new Date().toISOString(),
        source: item.source,
        exerciseType: item.exerciseType,
        result: correct ? 'pass' : 'fail',
        attempt: item.source === 'retry' ? item.attempt : 0
      }
      const next = appendReviewEvent(prev, event)
      saveJson(REVIEW_HISTORY_KEY, next)
      return next
    })
    recordLearning({ coreExercises: item.core ? 1 : 0, reviewEvents: item.source === 'new' ? 0 : 1, learnedWordId: item.source === 'new' && correct ? word.id : undefined })
  }

  const updateSettings = (patch: Partial<SettingsState>) => {
    setSettings(prev => { const next = { ...prev, ...patch }; saveJson(SETTINGS_KEY, next); return next })
  }

  const updateDailyCount = (value: number) => {
    const nextCount = clampDailyCount(value, words.length)
    updateSettings({ dailyCount: nextCount })
    setDailyPlan(prev => {
      const date = todayKey()
      const plan = buildDailyPlan(date, nextCount, progress, prev.date === date ? prev.wordIds : [], readerPriorityIds, placementProfile)
      saveJson(DAILY_PLAN_KEY, plan)
      return plan
    })
    const completion = { date: todayKey(), completed: false }
    setDailyCompletion(completion)
    saveJson(DAILY_COMPLETION_KEY, completion)
  }

  const completeDailySession = () => {
    const completion = { date: todayKey(), completed: true }
    setDailyCompletion(completion)
    saveJson(DAILY_COMPLETION_KEY, completion)
  }

  const saveReaderInteraction = (interaction: ReaderWordInteraction) => {
    setReaderInteractions(prev => { const next = upsertReaderInteraction(prev, interaction); saveJson(READER_INTERACTIONS_KEY, next); return next })
  }

  const saveReaderWord = (word: Word, interaction: ReaderWordInteraction) => {
    saveReaderInteraction({ ...interaction, savedToVocabulary: true, wordId: word.id })
    recordLearning({ readerWordId: word.id })
    if (completedToday || (progress[word.id] && progress[word.id].status !== 'new')) return
    setDailyPlan(prev => {
      if (prev.date !== todayKey() || prev.wordIds.includes(word.id)) return prev
      const plan = { ...prev, wordIds: [word.id, ...prev.wordIds.filter(id => id !== word.id)].slice(0, dailyCount) }
      saveJson(DAILY_PLAN_KEY, plan)
      return plan
    })
  }

  const startReview = (wordIds?: string[]) => {
    const validIds = wordIds?.filter(id => words.some(word => word.id === id))
    setSession({ mode: 'review', wordIds: validIds?.length ? validIds : undefined })
  }

  const completePlacement = (profile: PlacementProfile) => {
    const date = todayKey()
    const plan = buildDailyPlan(date, dailyCount, progress, [], readerPriorityIds, profile)
    setPlacementProfile(profile)
    saveJson(PLACEMENT_PROFILE_KEY, profile)
    setDailyPlan(plan)
    saveJson(DAILY_PLAN_KEY, plan)
    setPage('home')
  }

  const resetAll = () => {
    if (!confirm('确定清除所有本地学习记录吗？')) return
    ;[PLACEMENT_PROFILE_KEY, PROGRESS_KEY, SETTINGS_KEY, DAILY_PLAN_KEY, REVIEW_HISTORY_KEY, DAILY_COMPLETION_KEY, LEARNING_HISTORY_KEY, READER_INTERACTIONS_KEY, READER_DOCUMENT_KEY, LEGACY_PROGRESS_KEY, LEGACY_SETTINGS_KEY, LEGACY_DAILY_PLAN_KEY].forEach(key => localStorage.removeItem(key))
    location.reload()
  }

  if (!placementProfile) return <PlacementOnboarding questions={PLACEMENT_QUESTIONS} onComplete={completePlacement}/>

  if (session) return <LearnSession
    mode={session.mode}
    allWords={words}
    dueWords={session.mode === 'review' ? selectedReviewWords : dueWords}
    newWords={session.mode === 'daily' ? dailyWords : []}
    onExit={() => { setSession(null); setPage('home') }}
    onComplete={session.mode === 'daily' ? completeDailySession : undefined}
    onRate={recordResult}
  />

  return <div className="appShell"><Sidebar page={page} onChange={setPage} placementProfile={placementProfile}/><main className="mainArea">
    {page === 'home' && <Home dueCount={dueWords.length} newWords={dailyWords} progress={progress} completedToday={completedToday} placementProfile={placementProfile} onStart={() => setSession({ mode: 'daily' })} onReview={() => dueWords.length > 0 ? startReview(dueWords.map(word => word.id)) : setPage('review')} onWords={() => setPage('words')} onSettings={() => setPage('my')}/>}
    {page === 'words' && <div className="pageStack pageEnter"><div className="pageHeading"><div><span className="eyebrow">VOCABULARY</span><h1>单词库</h1><p>浏览词汇和当前学习状态；真正的记忆验证放在 Learn Session 里。</p></div></div><div className="wordGrid">{words.map(word => <WordCard key={word.id} word={word} progress={progress[word.id]}/>)}</div></div>}
    {page === 'review' && <Review allWords={words} progress={progress} history={reviewHistory} dueWords={dueWords} readerInteractions={readerInteractions} onStart={startReview} onGoReader={() => setPage('reader')} onGoWords={() => setPage('words')}/>}
    {page === 'reader' && <Reader allWords={words} progress={progress} interactions={readerInteractions} onInteraction={saveReaderInteraction} onSaveWord={saveReaderWord}/>}
    {page === 'my' && <My allWords={words} progress={progress} reviewHistory={reviewHistory} learningHistory={learningHistory} dailyCount={dailyCount} maxDaily={words.length} onCount={updateDailyCount} onReset={resetAll} onStartToday={() => setSession({ mode: 'daily' })} onGoReader={() => setPage('reader')}/>}
  </main></div>
}
