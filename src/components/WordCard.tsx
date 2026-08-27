import type { Word, WordProgress } from '../features/words/types'
import { SpeechButton } from './audio/SpeechButton'

export function WordCard({ word, progress }: { word: Word; progress?: WordProgress }) {
  const label = progress?.status === 'known' ? '已掌握' : progress?.status === 'learning' ? '学习中' : '未学习'
  const primaryMeaning = word.meanings?.[0]
  const dailyExample = word.dailyExample ?? word.example
  const dailyExampleZh = word.dailyExampleZh ?? word.exampleZh
  return <article className="wordCard">
    <div className="wordMeta"><span>{word.level}</span><span>{word.category}</span>{word.track && <span className={`wordTrackTag ${word.track}`}>{word.track === 'exam' ? '考试' : word.track === 'daily' ? '日常' : '共享'}</span>}<span className={progress?.status === 'known' ? 'knownTag' : ''}>{label}</span></div>
    <div className="wordTitleRow"><div><h3>{word.en}</h3><p>{word.zh}</p>{primaryMeaning?.partOfSpeech && <span className="wordPartOfSpeech">{primaryMeaning.partOfSpeech}</span>}</div><SpeechButton text={word.en} size="small"/></div>
    {word.collocations?.length ? <p className="wordCollocations"><span>常见搭配</span>{word.collocations.slice(0, 2).join(' · ')}</p> : null}
    {word.meanings && word.meanings.length > 1 && <details className="wordMeanings"><summary>更多释义</summary><ol>{word.meanings.slice(1).map(meaning => <li key={meaning.text}><strong>{meaning.text}</strong>{meaning.partOfSpeech && <span>{meaning.partOfSpeech}</span>}{meaning.usageNote && <small>{meaning.usageNote}</small>}</li>)}</ol></details>}
    <div className="example"><p>{dailyExample}</p><span>{dailyExampleZh}</span></div>
    {word.examExample && <details className="wordMoreContext"><summary>查看考试语境</summary><p>{word.examExample}</p><span>{word.examExampleZh}</span></details>}
  </article>
}
