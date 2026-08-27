import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ChoiceExercise } from '../components/exercise/ChoiceExercise'
import { ExerciseShell } from '../components/exercise/ExerciseShell'
import { IntroExercise } from '../components/exercise/IntroExercise'
import { TypingExercise } from '../components/exercise/TypingExercise'
import { ExerciseFeedback } from '../components/feedback/ExerciseFeedback'
import type { Word } from '../features/words/types'
import { createChoiceOptions, isTypingCorrect } from '../learning/exercises'
import { recordSessionAttempt, summarizeSessionResults, type SessionResults } from '../learning/sessionResults'
import { createDailySessionItems, createReviewSessionItems, enqueueRetry, selectNextItem } from '../learning/sessionQueue'
import type { SessionItem } from '../learning/types'

function buildInitialQueue(mode: 'daily' | 'review', dueWords: Word[], newWords: Word[]) {
  return mode === 'review' ? createReviewSessionItems(dueWords) : createDailySessionItems(dueWords, newWords)
}

export function LearnSession({ mode, allWords, dueWords, newWords, onExit, onComplete, onRate }: {
  mode: 'daily' | 'review'
  allWords: Word[]
  dueWords: Word[]
  newWords: Word[]
  onExit: () => void
  onComplete?: () => void
  onRate: (word: Word, correct: boolean, item: SessionItem) => void
}) {
  const initial = useMemo(() => buildInitialQueue(mode, dueWords, newWords), [mode, dueWords, newWords])
  const [queue, setQueue] = useState<SessionItem[]>(initial)
  const [coreTotal, setCoreTotal] = useState(() => initial.filter(item => item.core).length)
  const [completedCore, setCompletedCore] = useState(0)
  const [step, setStep] = useState(0)
  const [lastWordId, setLastWordId] = useState<string>()
  const [answer, setAnswer] = useState('')
  const [selected, setSelected] = useState<string>()
  const [feedback, setFeedback] = useState<'right' | 'wrong'>()
  const [results, setResults] = useState<SessionResults>({})
  const [finished, setFinished] = useState(false)
  const [completionNotified, setCompletionNotified] = useState(false)
  const [focusedRetry, setFocusedRetry] = useState(false)

  const current = useMemo(() => selectNextItem(queue, step, lastWordId), [queue, step, lastWordId])
  const word = current ? allWords.find(item => item.id === current.wordId) : undefined
  const options = useMemo(() => word ? createChoiceOptions(word, allWords) : [], [word, allWords])
  const summary = useMemo(() => summarizeSessionResults(results), [results])
  const weakWords = useMemo(() => summary.weakWordIds.map(id => allWords.find(wordItem => wordItem.id === id)).filter((item): item is Word => Boolean(item)), [summary.weakWordIds, allWords])

  useEffect(() => {
    if (queue.length !== 0 || completionNotified) return
    onComplete?.()
    setCompletionNotified(true)
    setFinished(true)
  }, [completionNotified, onComplete, queue.length])

  const resetAnswerState = () => { setAnswer(''); setSelected(undefined); setFeedback(undefined) }

  const finishIfNeeded = (remaining: SessionItem[]) => {
    if (remaining.length > 0) return
    setFinished(true)
    if (!completionNotified) {
      onComplete?.()
      setCompletionNotified(true)
    }
  }

  const advance = (correct?: boolean) => {
    if (!current) return
    let remaining = queue.filter(item => item.id !== current.id)
    const nextStep = step + 1
    if (correct === false) remaining = enqueueRetry(remaining, current, nextStep)
    if (current.core) setCompletedCore(value => value + 1)
    setQueue(remaining)
    setStep(nextStep)
    setLastWordId(current.wordId)
    resetAnswerState()
    finishIfNeeded(remaining)
  }

  const judge = (correct: boolean) => {
    if (!current || !word || feedback) return
    onRate(word, correct, current)
    setResults(previous => recordSessionAttempt(previous, current, correct))
    setFeedback(correct ? 'right' : 'wrong')
  }

  const choose = (value: string) => {
    if (!word || feedback) return
    setSelected(value)
  }

  const submitChoice = () => {
    if (!word || !selected || feedback) return
    judge(selected === word.en)
  }

  const submitTyping = () => {
    if (!word || !answer.trim() || feedback) return
    judge(isTypingCorrect(answer, word.en))
  }

  const requestExit = () => {
    if (step === 0 || confirm('退出当前学习？已提交的学习记录会保留。')) onExit()
  }

  const retryWeakWords = () => {
    if (!weakWords.length) return
    const next = createReviewSessionItems(weakWords)
    setQueue(next)
    setCoreTotal(next.filter(item => item.core).length)
    setCompletedCore(0)
    setStep(0)
    setLastWordId(undefined)
    setResults({})
    setFocusedRetry(true)
    setFinished(false)
    resetAnswerState()
  }

  if (finished || (!current && queue.length === 0) || (!word && current)) return <ExerciseShell completed={coreTotal} total={coreTotal} onExit={onExit}>
    <section className="sessionSummary exerciseCard">
      <div className="summaryIcon"><Check size={28}/></div>
      <span className="exerciseKicker">SESSION COMPLETE</span>
      <h1>{focusedRetry ? '错词加练完成了' : mode === 'daily' ? '今天这一组完成了' : '本轮复习完成了'}</h1>
      <p className="summaryLead">{summary.coreAttempts || coreTotal} 个核心练习已经完成。错误也已经进入后续复习记录，不需要为了数字继续反复刷题。</p>
      <div className="summaryMetrics" aria-label="本轮学习总结">
        <div><strong>{summary.firstTryCorrect}</strong><span>首次答对</span></div>
        <div><strong>{summary.weakWordIds.length}</strong><span>曾答错</span></div>
        <div><strong>{summary.retryAttempts}</strong><span>已重试</span></div>
      </div>
      {weakWords.length > 0 && <div className="summaryWeak"><span>需要再留意</span><p>{weakWords.slice(0, 5).map(item => item.en).join(' · ')}</p></div>}
      <div className="summaryActions"><button className="primaryButton sessionPrimary" onClick={onExit}>返回今日 <ArrowRight size={18}/></button>{weakWords.length > 0 && <button className="textButton summaryRetry" onClick={retryWeakWords}><RotateCcw size={16}/> 再练错词</button>}</div>
    </section>
  </ExerciseShell>

  if (!current) return <ExerciseShell completed={completedCore} total={coreTotal} onExit={requestExit}>
    <section className="sessionWaiting exerciseCard" aria-live="polite">
      <span className="exerciseKicker">稍后再练</span>
      <h1>下一步正在准备。</h1>
      <p>这组内容已经完成，错词会在合适的步骤再次出现。</p>
      <button className="primaryButton sessionPrimary" type="button" onClick={() => { setStep(value => value + 1); setLastWordId(undefined) }}>继续 · Enter <ArrowRight size={18}/></button>
    </section>
  </ExerciseShell>

  if (!word) return <ExerciseShell completed={completedCore} total={coreTotal} onExit={requestExit}>
    <section className="sessionWaiting exerciseCard" aria-live="polite"><span className="exerciseKicker">内容不可用</span><h1>这组内容已更新。</h1><p>当前词条暂时无法加载，请返回后重新开始。</p><button className="primaryButton sessionPrimary" type="button" onClick={onExit}>返回今日 <ArrowRight size={18}/></button></section>
  </ExerciseShell>

  const submittedAnswer = current.exerciseType === 'choice' ? selected : current.exerciseType === 'typing' ? answer : undefined

  return <ExerciseShell completed={completedCore} total={coreTotal} onExit={requestExit}>
    <div className={`exerciseWithFeedback ${feedback ? 'hasFeedback' : ''}`}>
      {current.exerciseType === 'intro' && <IntroExercise word={word} onContinue={() => advance()}/>}
      {current.exerciseType === 'choice' && <ChoiceExercise word={word} options={options} selected={selected} disabled={Boolean(feedback)} onSelect={choose} onSubmit={submitChoice}/>}
      {current.exerciseType === 'typing' && <TypingExercise word={word} value={answer} disabled={Boolean(feedback)} onChange={setAnswer} onSubmit={submitTyping}/>}
      {feedback && <ExerciseFeedback result={feedback} word={word} submittedAnswer={submittedAnswer} item={current} onContinue={() => advance(feedback === 'right')}/>}
    </div>
  </ExerciseShell>
}
