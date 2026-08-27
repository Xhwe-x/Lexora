import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react'
import type { Word } from '../../features/words/types'
import type { SessionItem } from '../../learning/types'

function differenceHint(answer: string, expected: string) {
  if (!answer) return ''
  const a = answer.trim().toLowerCase()
  const e = expected.trim().toLowerCase()
  let prefix = 0
  while (prefix < a.length && prefix < e.length && a[prefix] === e[prefix]) prefix += 1
  if (a.length + 1 === e.length && a.slice(prefix) === e.slice(prefix + 1)) return `这里少了 “${e[prefix]}”`
  if (a.length === e.length + 1 && a.slice(prefix + 1) === e.slice(prefix)) return `这里多了 “${a[prefix]}”`
  if (prefix < a.length && prefix < e.length) return `这里应为 “${e[prefix]}”，你写成了 “${a[prefix]}”`
  return ''
}

export function ExerciseFeedback({ result, word, submittedAnswer, item, onContinue }: {
  result: 'right' | 'wrong'
  word: Word
  submittedAnswer?: string
  item: SessionItem
  onContinue: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const continueRef = useRef<HTMLButtonElement>(null)
  const wrong = result === 'wrong'
  const hint = wrong && item.exerciseType === 'typing' ? differenceHint(submittedAnswer ?? '', word.en) : ''
  const retryMessage = item.source === 'retry' && item.attempt >= 2 ? '系统会在后续复习再次安排这个词' : '稍后会再次练到这个词'

  useEffect(() => { continueRef.current?.focus() }, [item.id, result])

  return <section className={`feedbackDock ${result}`} role="status" aria-live="polite">
    <div className="feedbackDockMain">
      <div className="feedbackStateIcon" aria-hidden="true">{wrong ? <X size={20}/> : <Check size={20}/>}</div>
      <div className="feedbackDockBody">
        <span className="feedbackEyebrow">{wrong ? '继续纠正' : '保持节奏'}</span>
        <h2>{wrong ? '这次差一点' : '回忆正确'}</h2>
        {!wrong ? <p className="feedbackWordLine"><b>{word.en}</b><span>·</span>{word.zh}</p> : <>
          <div className="answerCompare">
            <div><span>你的答案</span><strong className="answerWrong">{submittedAnswer || '未选择正确答案'}</strong></div>
            <div><span>正确答案</span><strong>{word.en}</strong></div>
          </div>
          {hint && <p className="differenceHint">{hint}</p>}
          <p className="retryPromise"><RotateCcw size={15}/>{retryMessage}</p>
        </>}
      </div>
      <button ref={continueRef} className="primaryButton feedbackContinue" type="button" aria-keyshortcuts="Enter" onClick={onContinue} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onContinue() } }}>继续 · Enter <ArrowRight size={17}/></button>
    </div>
    {wrong && <div className="feedbackExplain">
      <button type="button" className="feedbackExplainToggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>为什么？ {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
      {expanded && <div className="feedbackExplainBody"><div><b>{word.en}</b><span>{word.level} · {word.category}{word.meanings?.[0]?.partOfSpeech ? ` · ${word.meanings[0].partOfSpeech}` : ''}</span></div><p>{word.zh}</p>{word.meanings?.[0]?.usageNote && <p className="feedbackUsage">{word.meanings[0].usageNote}</p>}{word.meanings && word.meanings.length > 1 && <details className="feedbackMeanings"><summary>更多释义</summary><ol>{word.meanings.slice(1).map(meaning => <li key={meaning.text}>{meaning.text}{meaning.usageNote && <small>{meaning.usageNote}</small>}</li>)}</ol></details>}{word.collocations?.length ? <p className="feedbackUsage">常见搭配：{word.collocations.slice(0, 2).join(' · ')}</p> : null}<blockquote>{word.example}<span>{word.exampleZh}</span></blockquote></div>}
    </div>}
  </section>
}
