import { useEffect, useRef } from 'react'
import type { Word } from '../../features/words/types'

export function ChoiceExercise({ word, options, selected, disabled, onSelect, onSubmit }: { word: Word; options: string[]; selected?: string; disabled?: boolean; onSelect: (value: string) => void; onSubmit: () => void }) {
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!disabled) firstOptionRef.current?.focus() }, [disabled, word.id])

  return <section className="exerciseCard">
    <div className="exerciseKicker">识别</div>
    <p className="exerciseInstruction">选择最符合中文含义的英文表达。</p>
    <h1 className="exercisePrompt">“{word.zh}”</h1>
    <form onSubmit={event => { event.preventDefault(); if (selected) onSubmit() }}>
      <div className="choiceGrid" role="group" aria-label="英文选项">{options.map((option, index) => <button key={option} ref={index === 0 ? firstOptionRef : undefined} type="button" disabled={disabled} aria-pressed={selected === option} className={`choiceButton ${selected === option ? 'selected' : ''}`} onClick={() => onSelect(option)} onKeyDown={event => { if (event.key === 'Enter' && selected === option && !disabled) { event.preventDefault(); onSubmit() } }}><span>{index + 1}</span>{option}</button>)}</div>
      <div className="exerciseFooter"><button className="primaryButton sessionPrimary" type="submit" aria-keyshortcuts="Enter" disabled={!selected || disabled}>确认答案 · Enter</button></div>
    </form>
  </section>
}
