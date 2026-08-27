import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPlacementQuestions,
  isPlacementProfile,
  scorePlacement,
  type PlacementAnswer,
  type PlacementProfile,
  type PlacementSkill
} from '../../src/learning/placement.ts'

const skillOrder: PlacementSkill[] = ['meaning', 'context', 'recall', 'spelling']
const questions = getPlacementQuestions()

function answersForCorrectCounts(counts: Record<PlacementSkill, number>): PlacementAnswer[] {
  return skillOrder.flatMap(skill => {
    const skillQuestions = questions.filter(question => question.skill === skill)
    return skillQuestions.map((question, index) => {
      const correct = index < counts[skill]
      return {
        questionId: question.id,
        answer: correct ? `answer-for-${question.id}` : `wrong-answer-for-${question.id}`,
        correct,
        elapsedMs: 1000
      }
    })
  })
}

test('placement question bank contains 24 unique questions with six questions per skill', () => {
  assert.equal(questions.length, 24)
  assert.equal(new Set(questions.map(question => question.id)).size, 24)
  assert.deepEqual(
    skillOrder.reduce<Record<PlacementSkill, number>>((counts, skill) => {
      counts[skill] = questions.filter(question => question.skill === skill).length
      return counts
    }, { meaning: 0, context: 0, recall: 0, spelling: 0 }),
    { meaning: 6, context: 6, recall: 6, spelling: 6 }
  )
})

test('placement goal determines daily and exam ratios and primary track', () => {
  const expected = [
    { goal: 'daily' as const, dailyRatio: 100, examRatio: 0, primaryTrack: 'daily' as const },
    { goal: 'exam' as const, dailyRatio: 0, examRatio: 100, primaryTrack: 'exam' as const },
    { goal: 'both' as const, dailyRatio: 60, examRatio: 40, primaryTrack: 'daily' as const }
  ]

  for (const scenario of expected) {
    const profile = scorePlacement(questions, [], scenario.goal, '2026-08-27T00:00:00.000Z')
    assert.equal(profile.goal, scenario.goal)
    assert.equal(profile.dailyRatio, scenario.dailyRatio)
    assert.equal(profile.examRatio, scenario.examRatio)
    assert.equal(profile.primaryTrack, scenario.primaryTrack)
  }
})

test('scorePlacement rounds only after applying weights to raw skill percentages', () => {
  const profile = scorePlacement(
    getPlacementQuestions(),
    answersForCorrectCounts({ meaning: 1, context: 4, recall: 1, spelling: 4 }),
    'both',
    '2026-08-27T00:00:00.000Z'
  )

  assert.deepEqual(profile.skillScores, { meaning: 17, context: 67, recall: 17, spelling: 67 })
  assert.equal(profile.overallScore, 39)
  assert.equal(profile.level, 'A1')
})

const validProfile: PlacementProfile = {
  version: 1,
  completedAt: '2026-08-27T00:00:00.000Z',
  level: 'A2',
  goal: 'both',
  primaryTrack: 'daily',
  dailyRatio: 60,
  examRatio: 40,
  overallScore: 70,
  skillScores: { meaning: 67, context: 67, recall: 67, spelling: 83 },
  recommendation: '当前表现接近 A2，可以在 A2 主线中加入少量 B1 挑战。',
  answeredQuestionIds: [
    'meaning-ability',
    'meaning-arrive',
    'meaning-achieve',
    'meaning-advice',
    'meaning-common',
    'meaning-future',
    'context-achieve',
    'context-borrow',
    'context-because',
    'context-different',
    'context-improve',
    'context-understand',
    'recall-remember',
    'recall-invite',
    'recall-prepare',
    'recall-explain',
    'recall-choose',
    'recall-practice',
    'spelling-friendly',
    'spelling-question',
    'spelling-important',
    'spelling-continue',
    'spelling-usually',
    'spelling-instead'
  ]
}

test('isPlacementProfile accepts a complete internally consistent profile baseline', () => {
  assert.equal(isPlacementProfile(validProfile), true)
})

const invalidProfiles: Array<{ name: string; profile: PlacementProfile }> = [
  {
    name: 'an empty answeredQuestionIds list',
    profile: { ...validProfile, answeredQuestionIds: [] }
  },
  {
    name: 'duplicate answeredQuestionIds',
    profile: { ...validProfile, answeredQuestionIds: [...validProfile.answeredQuestionIds, 'meaning-ability'] }
  },
  {
    name: 'an unknown answeredQuestionId',
    profile: {
      ...validProfile,
      answeredQuestionIds: [...validProfile.answeredQuestionIds.slice(0, -1), 'meaning-unknown']
    }
  },
  {
    name: 'a decimal overall score',
    profile: { ...validProfile, overallScore: 70.5 }
  },
  {
    name: 'a decimal skill score',
    profile: { ...validProfile, skillScores: { ...validProfile.skillScores, meaning: 67.5 } }
  },
  {
    name: 'a level inconsistent with overallScore',
    profile: { ...validProfile, level: 'B1' }
  },
  {
    name: 'an overallScore inconsistent with skillScores',
    profile: { ...validProfile, overallScore: 71 }
  },
  {
    name: 'skillScores inconsistent with overallScore',
    profile: { ...validProfile, skillScores: { ...validProfile.skillScores, meaning: 100 } }
  }
]

for (const scenario of invalidProfiles) {
  test(`isPlacementProfile rejects ${scenario.name}`, () => {
    assert.equal(isPlacementProfile(scenario.profile), false)
  })
}

const scoreBandCases: Array<{
  name: string
  counts: Record<PlacementSkill, number>
  skillScores: Record<PlacementSkill, number>
  overallScore: number
  level: 'A1' | 'A2' | 'B1'
  recommendation: string
}> = [
  {
    name: '39 remains in A1 reinforcement',
    counts: { meaning: 0, context: 1, recall: 3, spelling: 6 },
    skillScores: { meaning: 0, context: 17, recall: 50, spelling: 100 },
    overallScore: 39,
    level: 'A1',
    recommendation: 'A1 高频基础'
  },
  {
    name: '40 enters A2 core',
    counts: { meaning: 0, context: 0, recall: 4, spelling: 6 },
    skillScores: { meaning: 0, context: 0, recall: 67, spelling: 100 },
    overallScore: 40,
    level: 'A2',
    recommendation: '推荐从 A2 开始'
  },
  {
    name: '70 enters A2 core plus B1 challenge',
    counts: { meaning: 4, context: 4, recall: 4, spelling: 5 },
    skillScores: { meaning: 67, context: 67, recall: 67, spelling: 83 },
    overallScore: 70,
    level: 'A2',
    recommendation: '加入少量 B1 挑战'
  },
  {
    name: '85 enters B1 challenge with A2 review',
    counts: { meaning: 4, context: 6, recall: 6, spelling: 4 },
    skillScores: { meaning: 67, context: 100, recall: 100, spelling: 67 },
    overallScore: 85,
    level: 'B1',
    recommendation: '以 B1 挑战为主'
  },
  {
    name: '100 remains in B1 challenge with A2 review',
    counts: { meaning: 6, context: 6, recall: 6, spelling: 6 },
    skillScores: { meaning: 100, context: 100, recall: 100, spelling: 100 },
    overallScore: 100,
    level: 'B1',
    recommendation: '以 B1 挑战为主'
  }
]

for (const scenario of scoreBandCases) {
  test(`placement score boundary ${scenario.name}`, () => {
    const profile = scorePlacement(
      questions,
      answersForCorrectCounts(scenario.counts),
      'both',
      '2026-08-27T00:00:00.000Z'
    )
    assert.deepEqual(profile.skillScores, scenario.skillScores)
    assert.equal(profile.overallScore, scenario.overallScore)
    assert.equal(profile.level, scenario.level)
    assert.match(profile.recommendation, new RegExp(scenario.recommendation))
  })
}

test('recommendation names active recall when recall is the weakest skill', () => {
  const profile = scorePlacement(
    questions,
    answersForCorrectCounts({ meaning: 6, context: 6, recall: 2, spelling: 6 }),
    'both',
    '2026-08-27T00:00:00.000Z'
  )

  assert.equal(profile.skillScores.recall, 33)
  assert.ok(profile.skillScores.recall < profile.skillScores.meaning)
  assert.ok(profile.skillScores.recall < profile.skillScores.context)
  assert.ok(profile.skillScores.recall < profile.skillScores.spelling)
  assert.match(profile.recommendation, /主动回忆/)
})
