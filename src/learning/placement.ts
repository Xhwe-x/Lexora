// @ts-ignore Node's native strip-types runner requires the explicit extension here.
import { placementQuestions } from '../data/placement.ts'

export type PlacementGoal = 'daily' | 'exam' | 'both'
export type PlacementTrack = 'daily' | 'exam' | 'shared'
export type PlacementSkill = 'meaning' | 'context' | 'recall' | 'spelling'
export type PlacementLevel = 'A1' | 'A2' | 'B1'
export type PrimaryPlacementTrack = Exclude<PlacementTrack, 'shared'>

export type PlacementQuestion = {
  id: string
  level: PlacementLevel
  skill: PlacementSkill
  prompt: string
  options: string[]
  answer: string
  wordId: string
  track: PlacementTrack
}

export type PlacementAnswer = {
  questionId: string
  answer: string
  correct: boolean
  elapsedMs: number
}

export type PlacementSkillScores = Record<PlacementSkill, number>

export type PlacementBand =
  | 'A1 reinforcement'
  | 'A2 core'
  | 'A2 core + B1 challenge'
  | 'B1 challenge with A2 review'

export type PlacementProfile = {
  version: 1
  completedAt: string
  level: PlacementLevel
  goal: PlacementGoal
  primaryTrack: PrimaryPlacementTrack
  dailyRatio: number
  examRatio: number
  overallScore: number
  skillScores: PlacementSkillScores
  recommendation: string
  answeredQuestionIds: string[]
}

export const placementSkills: PlacementSkill[] = ['meaning', 'context', 'recall', 'spelling']

const DEFAULT_PLACEMENT_TIMESTAMP = '1970-01-01T00:00:00.000Z'
const placementQuestionIds = new Set(placementQuestions.map(question => question.id))
const placementQuestionCounts = placementSkills.reduce((counts, skill) => {
  counts[skill] = placementQuestions.filter(question => question.skill === skill).length
  return counts
}, {} as Record<PlacementSkill, number>)

const skillLabels: Record<PlacementSkill, string> = {
  meaning: '词义识别',
  context: '语境理解',
  recall: '主动回忆',
  spelling: '拼写与形式'
}

export function getPlacementQuestions(): PlacementQuestion[] {
  return placementQuestions.map(question => ({ ...question, options: [...question.options] }))
}

export function getSkillLabel(skill: PlacementSkill) {
  return skillLabels[skill]
}

export function getWeakestSkill(skillScores: PlacementSkillScores): PlacementSkill {
  return placementSkills.reduce((weakest, skill) => skillScores[skill] < skillScores[weakest] ? skill : weakest, placementSkills[0])
}

export function getPlacementBand(score: number): PlacementBand {
  if (score < 40) return 'A1 reinforcement'
  if (score < 70) return 'A2 core'
  if (score < 85) return 'A2 core + B1 challenge'
  return 'B1 challenge with A2 review'
}

function levelForBand(band: PlacementBand): PlacementLevel {
  return band === 'A1 reinforcement' ? 'A1' : band === 'B1 challenge with A2 review' ? 'B1' : 'A2'
}

function ratiosForGoal(goal: PlacementGoal) {
  if (goal === 'daily') return { dailyRatio: 100, examRatio: 0 }
  if (goal === 'exam') return { dailyRatio: 0, examRatio: 100 }
  return { dailyRatio: 60, examRatio: 40 }
}

function recommendationFor(band: PlacementBand, weakestSkill: PlacementSkill) {
  const weakLabel = getSkillLabel(weakestSkill)
  const lead = band === 'A1 reinforcement'
    ? '建议先补足 A1 高频基础，再进入 A2 主线'
    : band === 'A2 core'
      ? '推荐从 A2 开始，先稳住核心表达'
      : band === 'A2 core + B1 challenge'
        ? '当前表现接近 A2，可以在 A2 主线中加入少量 B1 挑战'
        : '建议以 B1 挑战为主，同时保留 A2 复盘'
  return `${lead}。目前最需要巩固的是${weakLabel}。这是学习起点建议，不代表 CEFR 认证。`
}

function scoreSkill(questions: PlacementQuestion[], answers: Map<string, PlacementAnswer>, skill: PlacementSkill) {
  return Math.round(skillRatio(questions, answers, skill) * 100)
}

function skillRatio(questions: PlacementQuestion[], answers: Map<string, PlacementAnswer>, skill: PlacementSkill) {
  const skillQuestions = questions.filter(question => question.skill === skill)
  if (!skillQuestions.length) return 0
  const correct = skillQuestions.filter(question => answers.get(question.id)?.correct === true).length
  return correct / skillQuestions.length
}

function weightedScore(scores: PlacementSkillScores) {
  return scores.meaning * 0.25 + scores.context * 0.25 + scores.recall * 0.3 + scores.spelling * 0.2
}

export function scorePlacement(
  questions: PlacementQuestion[],
  answers: PlacementAnswer[],
  goal: PlacementGoal,
  completedAt = DEFAULT_PLACEMENT_TIMESTAMP
): PlacementProfile {
  const answersByQuestion = new Map<string, PlacementAnswer>()
  answers.forEach(answer => {
    if (!answersByQuestion.has(answer.questionId)) answersByQuestion.set(answer.questionId, answer)
  })

  const skillScores = placementSkills.reduce((scores, skill) => {
    scores[skill] = scoreSkill(questions, answersByQuestion, skill)
    return scores
  }, {} as PlacementSkillScores)
  const rawSkillScores = placementSkills.reduce((scores, skill) => {
    scores[skill] = skillRatio(questions, answersByQuestion, skill) * 100
    return scores
  }, {} as PlacementSkillScores)
  const overallScore = Math.round(weightedScore(rawSkillScores))
  const band = getPlacementBand(overallScore)
  const weakestSkill = getWeakestSkill(skillScores)
  const ratios = ratiosForGoal(goal)
  const answeredQuestionIds = answers
    .filter((answer, index, list) => questions.some(question => question.id === answer.questionId) && list.findIndex(item => item.questionId === answer.questionId) === index)
    .map(answer => answer.questionId)

  return {
    version: 1,
    completedAt,
    level: levelForBand(band),
    goal,
    primaryTrack: ratios.dailyRatio >= ratios.examRatio ? 'daily' : 'exam',
    ...ratios,
    overallScore,
    skillScores,
    recommendation: recommendationFor(band, weakestSkill),
    answeredQuestionIds
  }
}

function isPlacementGoal(value: unknown): value is PlacementGoal {
  return value === 'daily' || value === 'exam' || value === 'both'
}

function isPlacementLevel(value: unknown): value is PlacementLevel {
  return value === 'A1' || value === 'A2' || value === 'B1'
}

function isPrimaryTrack(value: unknown): value is PrimaryPlacementTrack {
  return value === 'daily' || value === 'exam'
}

function isPercentage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
}

function isIntegerPercentage(value: unknown): value is number {
  return isPercentage(value) && Number.isInteger(value)
}

function isValidCompletedAt(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))
}

function rawPercentageForScore(skill: PlacementSkill, score: number) {
  const questionCount = placementQuestionCounts[skill]
  if (!questionCount) return null
  const correctCount = Math.round((score / 100) * questionCount)
  if (Math.round((correctCount / questionCount) * 100) !== score) return null
  return (correctCount / questionCount) * 100
}

export function isPlacementProfile(value: unknown): value is PlacementProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as Partial<PlacementProfile>
  if (profile.version !== 1 || !isValidCompletedAt(profile.completedAt)) return false
  if (!isPlacementLevel(profile.level) || !isPlacementGoal(profile.goal) || !isPrimaryTrack(profile.primaryTrack)) return false
  const expectedRatios = ratiosForGoal(profile.goal)
  if (!isPercentage(profile.dailyRatio) || !isPercentage(profile.examRatio) || profile.dailyRatio !== expectedRatios.dailyRatio || profile.examRatio !== expectedRatios.examRatio) return false
  if (profile.primaryTrack !== (profile.dailyRatio >= profile.examRatio ? 'daily' : 'exam')) return false
  if (!isIntegerPercentage(profile.overallScore) || typeof profile.recommendation !== 'string' || !profile.recommendation) return false
  if (!Array.isArray(profile.answeredQuestionIds) || profile.answeredQuestionIds.length !== placementQuestionIds.size) return false
  const answeredIds = new Set(profile.answeredQuestionIds)
  if (answeredIds.size !== profile.answeredQuestionIds.length || answeredIds.size !== placementQuestionIds.size) return false
  if (profile.answeredQuestionIds.some(questionId => typeof questionId !== 'string' || !placementQuestionIds.has(questionId))) return false
  if (!profile.skillScores || typeof profile.skillScores !== 'object' || Array.isArray(profile.skillScores)) return false
  if (!placementSkills.every(skill => isIntegerPercentage(profile.skillScores?.[skill]))) return false
  if (profile.level !== levelForBand(getPlacementBand(profile.overallScore))) return false
  const rawSkillScores = placementSkills.reduce((scores, skill) => {
    if (scores === null) return null
    const rawScore = rawPercentageForScore(skill, profile.skillScores![skill]!)
    if (rawScore === null) return null
    scores[skill] = rawScore
    return scores
  }, {} as PlacementSkillScores | null)
  return rawSkillScores !== null && Math.round(weightedScore(rawSkillScores)) === profile.overallScore
}
