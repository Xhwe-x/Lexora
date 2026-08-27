import { ArrowRight } from 'lucide-react'
import type { Word } from '../../features/words/types'
import { SpeechButton } from '../audio/SpeechButton'

export function IntroExercise({ word, onContinue }: { word: Word; onContinue: () => void }) {
  return <section className="exerciseCard introExercise">
    <div className="exerciseKicker">先理解，不用急着记住</div>
    <div className="introWordRow"><div><h1>{word.en}</h1><p>{word.zh}</p>{word.meanings?.[0]?.partOfSpeech && <span className="wordPartOfSpeech">{word.meanings[0].partOfSpeech}</span>}</div><SpeechButton text={word.en} size="large"/></div>
    {word.collocations?.length ? <p className="studyCollocations"><span>常见搭配</span>{word.collocations.slice(0, 2).join(' · ')}</p> : null}
    <div className="studyExample"><p>{word.example}</p><span>{word.exampleZh}</span></div>
    <div className="exerciseFooter"><button className="primaryButton sessionPrimary" type="button" aria-keyshortcuts="Enter" onClick={onContinue}>继续 · Enter <ArrowRight size={18}/></button></div>
  </section>
}
