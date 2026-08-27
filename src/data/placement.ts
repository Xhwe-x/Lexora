import type { PlacementQuestion, PlacementTrack } from '../learning/placement'
import type { Word } from '../features/words/types'
// @ts-ignore Node's native strip-types runner requires the explicit extension here.
import { words } from './words.ts'

const wordById = new Map(words.map(word => [word.id, word]))

function getWord(id: string): Word {
  const word = wordById.get(id)
  if (!word) throw new Error(`Placement question references missing word: ${id}`)
  return word
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function blankExample(id: string) {
  const word = getWord(id)
  return word.example.replace(new RegExp(`\\b${escapeRegExp(word.en)}\\b`, 'i'), '_____')
}

function meaningQuestion(id: string, options: string[], track: PlacementTrack): PlacementQuestion {
  const word = getWord(id)
  return {
    id: `meaning-${id}`,
    level: word.level,
    skill: 'meaning',
    prompt: `“${word.en}” 最接近哪个意思？`,
    options,
    answer: word.zh,
    wordId: word.id,
    track
  }
}

function contextQuestion(id: string, options: string[], track: PlacementTrack): PlacementQuestion {
  const word = getWord(id)
  return {
    id: `context-${id}`,
    level: word.level,
    skill: 'context',
    prompt: blankExample(id),
    contextHint: word.exampleZh,
    options,
    answer: word.en,
    wordId: word.id,
    track
  }
}

function recallQuestion(id: string, track: PlacementTrack): PlacementQuestion {
  const word = getWord(id)
  return {
    id: `recall-${id}`,
    level: word.level,
    skill: 'recall',
    prompt: `根据中文例句写出英文：${word.exampleZh}`,
    options: [],
    answer: word.en,
    wordId: word.id,
    track
  }
}

function spellingQuestion(id: string, track: PlacementTrack): PlacementQuestion {
  const word = getWord(id)
  return {
    id: `spelling-${id}`,
    level: word.level,
    skill: 'spelling',
    prompt: `根据句意写出完整单词：${blankExample(id)}（${word.zh}）`,
    options: [],
    answer: word.en,
    wordId: word.id,
    track
  }
}

export const placementQuestions: PlacementQuestion[] = [
  meaningQuestion('ability', ['能力', '建议', '目标', '答案'], 'shared'),
  meaningQuestion('arrive', ['到达', '离开', '等待', '加入'], 'daily'),
  meaningQuestion('achieve', ['实现；达到', '接受', '解释', '重复'], 'exam'),
  meaningQuestion('advice', ['建议', '错误', '未来', '含义'], 'daily'),
  meaningQuestion('common', ['常见的', '困难的', '足够的', '清楚的'], 'shared'),
  meaningQuestion('future', ['未来', '期间', '答案', '改变'], 'daily'),

  contextQuestion('achieve', ['achieve', 'accept', 'borrow', 'repeat'], 'exam'),
  contextQuestion('borrow', ['borrow', 'bring', 'leave', 'join'], 'daily'),
  contextQuestion('because', ['because', 'during', 'instead', 'maybe'], 'shared'),
  contextQuestion('different', ['different', 'difficult', 'friendly', 'useful'], 'shared'),
  contextQuestion('improve', ['improve', 'forget', 'notice', 'spend'], 'exam'),
  contextQuestion('understand', ['understand', 'wonder', 'watch', 'write'], 'exam'),

  recallQuestion('remember', 'shared'),
  recallQuestion('invite', 'daily'),
  recallQuestion('prepare', 'daily'),
  recallQuestion('explain', 'exam'),
  recallQuestion('choose', 'exam'),
  recallQuestion('practice', 'daily'),

  spellingQuestion('friendly', 'daily'),
  spellingQuestion('question', 'exam'),
  spellingQuestion('important', 'shared'),
  spellingQuestion('continue', 'shared'),
  spellingQuestion('usually', 'daily'),
  spellingQuestion('instead', 'exam')
]
