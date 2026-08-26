import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Volume2 } from 'lucide-react'
import type { Word } from '../features/words/types'
import { sentenceLessons } from '../features/sentences/data'
import { speak } from '../lib/speech'

function normalize(value: string) { return value.toLowerCase().replace(/[.,?!]/g, '').replace(/\s+/g, ' ').trim() }

export function Sentences({ focusWords = [] }: { focusWords?: Word[] }) {
  const lessons = useMemo(() => focusWords.length ? focusWords.slice(0, 5).map(word => ({ cn: word.exampleZh, en: word.example, note: `重点词：${word.en}（${word.zh}）` })) : sentenceLessons, [focusWords])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'idle'|'right'|'wrong'>('idle')
  const lesson = lessons[index % lessons.length]
  const check = () => { if (answer.trim()) setResult(normalize(answer) === normalize(lesson.en) ? 'right' : 'wrong') }
  const hint = lesson.en.split(/\s+/)[0]
  return <div className="pageStack"><div className="pageHeading"><div><span className="eyebrow">SENTENCE DRILL</span><h1>句子专项</h1><p>专项练习不再作为每日主导航入口；提交前的音频也不会直接泄露完整答案。</p></div></div><section className="sentenceCard"><div className="sentenceStep">{index + 1} / {lessons.length}</div><h2>{lesson.cn}</h2><input className="sentenceInput" value={answer} onChange={(e: ChangeEvent<HTMLInputElement>) => { setAnswer(e.target.value); setResult('idle') }} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && check()} placeholder="Type the English sentence..."/><div className="sentenceActions"><button className="primaryButton" onClick={check}>检查答案</button>{result === 'idle' ? <button className="secondaryButton" onClick={() => speak(hint)}><Volume2 size={17}/> 听提示</button> : <button className="secondaryButton" onClick={() => speak(lesson.en)}><Volume2 size={17}/> 听完整句子</button>}<button className="secondaryButton" onClick={() => { setIndex((index + 1) % lessons.length); setAnswer(''); setResult('idle') }}>下一句</button></div>{result === 'right' && <div className="feedback good"><strong>正确。</strong> {lesson.note}</div>}{result === 'wrong' && <div className="feedback bad"><strong>与你的目标句不同。</strong> 参考开头：{lesson.en.split(' ').slice(0,2).join(' ')} ...</div>}</section></div>
}
