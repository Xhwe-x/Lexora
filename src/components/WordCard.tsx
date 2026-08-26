import type { Word, WordProgress } from '../features/words/types'
import { SpeechButton } from './audio/SpeechButton'

export function WordCard({ word, progress }: { word: Word; progress?: WordProgress }) {
  const label = progress?.status === 'known' ? '已掌握' : progress?.status === 'learning' ? '学习中' : '未学习'
  return <article className="wordCard">
    <div className="wordMeta"><span>{word.level}</span><span>{word.category}</span><span className={progress?.status === 'known' ? 'knownTag' : ''}>{label}</span></div>
    <div className="wordTitleRow"><div><h3>{word.en}</h3><p>{word.zh}</p></div><SpeechButton text={word.en} size="small"/></div>
    <div className="example"><p>{word.example}</p><span>{word.exampleZh}</span></div>
  </article>
}
