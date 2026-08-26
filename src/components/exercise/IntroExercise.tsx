import { ArrowRight } from 'lucide-react'
import type { Word } from '../../features/words/types'
import { SpeechButton } from '../audio/SpeechButton'

export function IntroExercise({ word, onContinue }: { word: Word; onContinue: () => void }) {
  return <section className="exerciseCard introExercise">
    <div className="exerciseKicker">先理解，不用急着记住</div>
    <div className="introWordRow"><div><h1>{word.en}</h1><p>{word.zh}</p></div><SpeechButton text={word.en} size="large"/></div>
    <div className="studyExample"><p>{word.example}</p><span>{word.exampleZh}</span></div>
    <div className="exerciseFooter"><button className="primaryButton sessionPrimary" onClick={onContinue}>继续 <ArrowRight size={18}/></button></div>
  </section>
}
