import type { Word } from '../../features/words/types'

export function ChoiceExercise({ word, options, selected, disabled, onSelect }: { word: Word; options: string[]; selected?: string; disabled?: boolean; onSelect: (value: string) => void }) {
  return <section className="exerciseCard">
    <div className="exerciseKicker">识别</div>
    <h1 className="exercisePrompt">“{word.zh}” 对应哪个单词？</h1>
    <div className="choiceGrid">{options.map((option, index) => <button key={option} disabled={disabled} className={`choiceButton ${selected === option ? 'selected' : ''}`} onClick={() => onSelect(option)}><span>{index + 1}</span>{option}</button>)}</div>
  </section>
}
