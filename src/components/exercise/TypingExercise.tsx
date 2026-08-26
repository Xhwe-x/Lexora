import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { Word } from '../../features/words/types'

export function TypingExercise({ word, value, disabled, onChange, onSubmit }: { word: Word; value: string; disabled?: boolean; onChange: (value: string) => void; onSubmit: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (!disabled) ref.current?.focus() }, [disabled, word.id])
  return <section className="exerciseCard typingExercise">
    <div className="exerciseKicker">主动回忆</div>
    <p className="exerciseInstruction">根据中文写出英文，不用追求速度。</p>
    <h1 className="exercisePrompt">{word.zh}</h1>
    <input ref={ref} className="sessionInput" value={value} disabled={disabled} onChange={event => onChange(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => event.key === 'Enter' && onSubmit()} placeholder="输入英文单词" autoComplete="off" spellCheck={false}/>
    <button className="primaryButton sessionPrimary" disabled={!value.trim() || disabled} onClick={onSubmit}>检查答案</button>
  </section>
}
