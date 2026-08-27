import { useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleHelp, Target } from 'lucide-react'
import {
  getPlacementBand,
  getPlacementQuestions,
  getSkillLabel,
  getWeakestSkill,
  scorePlacement,
  type PlacementAnswer,
  type PlacementGoal,
  type PlacementProfile,
  type PlacementQuestion
} from '../learning/placement'

const goalOptions: Array<{ id: PlacementGoal; label: string; description: string }> = [
  { id: 'daily', label: '日常英语', description: '旅行、工作和真实对话，先把表达用起来。' },
  { id: 'exam', label: '考试英语', description: '高频词、阅读和听写，稳步准备通用考试场景。' },
  { id: 'both', label: '两者都要', description: '日常表达与考试能力一起推进，默认日常 60% · 考试 40%。' }
]

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ')
}

function isCorrectAnswer(question: PlacementQuestion, answer: string) {
  return normalizeAnswer(answer) === normalizeAnswer(question.answer)
}

function trackLabel(track: PlacementProfile['primaryTrack']) {
  return track === 'daily' ? '日常英语' : '考试英语'
}

function goalLabel(goal: PlacementGoal) {
  return goalOptions.find(option => option.id === goal)?.label ?? '两者都要'
}

export function PlacementOnboarding({ questions = getPlacementQuestions(), onComplete }: {
  questions?: PlacementQuestion[]
  onComplete: (profile: PlacementProfile) => void
}) {
  const [stage, setStage] = useState<'goal' | 'assessment' | 'result'>('goal')
  const [goal, setGoal] = useState<PlacementGoal>('both')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')
  const [answers, setAnswers] = useState<Record<string, PlacementAnswer>>({})
  const [profile, setProfile] = useState<PlacementProfile | null>(null)
  const questionStartedAt = useRef(0)

  const currentQuestion = questions[questionIndex]
  const submittedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const progress = questions.length ? ((questionIndex + 1) / questions.length) * 100 : 0

  const startAssessment = () => {
    setAnswers({})
    setQuestionIndex(0)
    setDraftAnswer('')
    questionStartedAt.current = Date.now()
    setStage('assessment')
  }

  const submitAnswer = () => {
    if (!currentQuestion || submittedAnswer || !draftAnswer.trim()) return
    const answer: PlacementAnswer = {
      questionId: currentQuestion.id,
      answer: draftAnswer.trim(),
      correct: isCorrectAnswer(currentQuestion, draftAnswer),
      elapsedMs: Math.max(0, Date.now() - questionStartedAt.current)
    }
    setAnswers(previous => ({ ...previous, [currentQuestion.id]: answer }))
  }

  const goToPreviousQuestion = () => {
    if (submittedAnswer || questionIndex === 0) return
    const previousIndex = questionIndex - 1
    const previousQuestion = questions[previousIndex]
    setQuestionIndex(previousIndex)
    setDraftAnswer(answers[previousQuestion.id]?.answer ?? '')
    questionStartedAt.current = Date.now()
  }

  const goToNextQuestion = () => {
    if (!currentQuestion || !submittedAnswer) return
    if (questionIndex === questions.length - 1) {
      const result = scorePlacement(questions, Object.values(answers), goal, new Date().toISOString())
      setProfile(result)
      setStage('result')
      return
    }
    const nextIndex = questionIndex + 1
    const nextQuestion = questions[nextIndex]
    setQuestionIndex(nextIndex)
    setDraftAnswer(answers[nextQuestion.id]?.answer ?? '')
    questionStartedAt.current = Date.now()
  }

  if (stage === 'result' && profile) {
    const weakestSkill = getWeakestSkill(profile.skillScores)
    return <main className="placementShell">
      <div className="placementFrame placementResultFrame">
        <div className="placementBrand"><span className="placementBrandMark">L</span><span>Lexora</span></div>
        <section className="placementCard placementResultCard" aria-labelledby="placement-result-title">
          <div className="placementResultIcon"><CheckCircle2 size={25}/></div>
          <span className="placementEyebrow">你的学习起点</span>
          <h1 id="placement-result-title">从 {profile.level} 开始</h1>
          <p className="placementBand">{getPlacementBand(profile.overallScore)}</p>
          <p className="placementRecommendation">{profile.recommendation}</p>
          <div className="placementResultStats">
            <div><span>主路径</span><strong>{trackLabel(profile.primaryTrack)}</strong></div>
            <div><span>目标</span><strong>{goalLabel(profile.goal)}</strong></div>
            <div><span>学习比例</span><strong>日常 {profile.dailyRatio}% · 考试 {profile.examRatio}%</strong></div>
            <div><span>最需要巩固</span><strong>{getSkillLabel(weakestSkill)}</strong></div>
          </div>
          <button className="primaryButton placementStartButton" type="button" onClick={() => onComplete(profile)}>开始学习 <ArrowRight size={18}/></button>
          <p className="placementFinePrint">这是根据本次短测给出的起始推荐，之后可以再调整学习比例，不代表 CEFR 认证。</p>
        </section>
      </div>
    </main>
  }

  if (stage === 'assessment' && currentQuestion) {
    return <main className="placementShell">
      <div className="placementFrame placementAssessmentFrame">
        <header className="placementAssessmentHeader">
          <div className="placementBrand"><span className="placementBrandMark">L</span><span>Lexora</span></div>
          <div className="placementProgressInfo">
            <div><span>A2 起点测评</span><strong>{questionIndex + 1} / {questions.length}</strong></div>
            <div className="placementProgress" aria-hidden="true"><span style={{ width: `${progress}%` }}/></div>
          </div>
        </header>
        <section className="placementCard placementQuestionCard" aria-labelledby="placement-question-title">
          <div className="placementQuestionMeta"><span className="placementSkillPill"><CircleHelp size={14}/>{getSkillLabel(currentQuestion.skill)}</span><span>{currentQuestion.level} · {currentQuestion.track === 'shared' ? '共同能力' : currentQuestion.track === 'daily' ? '日常场景' : '考试场景'}</span></div>
          <h1 id="placement-question-title">{currentQuestion.prompt}</h1>
          <form onSubmit={event => { event.preventDefault(); submitAnswer() }}>
            {currentQuestion.options.length ? <div className="placementChoiceGrid" role="group" aria-label="测评选项">
              {currentQuestion.options.map((option, index) => <button key={option} className={`placementChoice ${draftAnswer === option ? 'selected' : ''}`} type="button" aria-pressed={draftAnswer === option} disabled={Boolean(submittedAnswer)} onClick={() => setDraftAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}
            </div> : <label className="placementInputLabel" htmlFor="placement-answer"><span>请输入英文答案</span><input id="placement-answer" className="placementInput" value={draftAnswer} disabled={Boolean(submittedAnswer)} autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={event => setDraftAnswer(event.target.value)} /></label>}
            {submittedAnswer && <p className="placementRecorded" aria-live="polite"><CheckCircle2 size={17}/> 答案已记录，继续完成剩余题目。</p>}
            <div className="placementQuestionActions">
              {!submittedAnswer && <button className="ghostButton" type="button" disabled={questionIndex === 0} onClick={goToPreviousQuestion}>上一题</button>}
              {!submittedAnswer ? <button className="primaryButton" type="submit" disabled={!draftAnswer.trim()}>确认答案 <ArrowRight size={17}/></button> : <button className="primaryButton" type="button" onClick={goToNextQuestion}>{questionIndex === questions.length - 1 ? '查看结果' : '下一题'} <ArrowRight size={17}/></button>}
            </div>
          </form>
        </section>
        <p className="placementAssessmentNote"><Target size={15}/> 不追求一次答对，结果只用于安排更合适的起点。</p>
      </div>
    </main>
  }

  return <main className="placementShell">
    <div className="placementFrame placementGoalFrame">
      <div className="placementBrand"><span className="placementBrandMark">L</span><span>Lexora</span></div>
      <section className="placementCard placementGoalCard" aria-labelledby="placement-goal-title">
        <span className="placementEyebrow">WELCOME TO LEXORA</span>
        <h1 id="placement-goal-title">先选一个想去的方向。</h1>
        <p className="placementIntro">我们会用一组 24 题的 A2 起点测评，帮你决定今天先学什么、哪些能力值得多练一点。</p>
        <div className="placementGoalGrid" role="group" aria-label="选择学习目标">
          {goalOptions.map(option => <button key={option.id} className={`placementGoalChoice ${goal === option.id ? 'selected' : ''}`} type="button" aria-pressed={goal === option.id} onClick={() => setGoal(option.id)}><span className="placementGoalChoiceTop"><strong>{option.label}</strong>{goal === option.id && <CheckCircle2 size={18}/>}</span><span>{option.description}</span></button>)}
        </div>
        <button className="primaryButton placementStartButton" type="button" onClick={startAssessment}>开始 A2 起点测评 <ArrowRight size={18}/></button>
        <p className="placementFinePrint">大约 6–10 分钟完成。测评是学习建议，不是英语等级认证。</p>
      </section>
    </div>
  </main>
}
