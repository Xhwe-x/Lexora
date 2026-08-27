import { ArrowRight, Clock3 } from 'lucide-react'
import type { ReaderContent } from '../../features/reader/catalog'
import { readerKindLabel, readerLevelLabel, readerTrackLabel } from '../../features/reader/catalog'
import { getExamRouteLabel } from '../../features/exams/routes'

export function ReaderContentCard({ content, active, onOpen }: { content: ReaderContent; active?: boolean; onOpen: () => void }) {
  return <button className={`readerContentCard ${content.track} ${active ? 'active' : ''}`} type="button" onClick={onOpen} aria-label={`${active ? '继续阅读' : '打开'} ${content.title}`}>
    <div className="readerContentCardTop"><div><span className="readerContentBadge">{readerLevelLabel(content.level)}</span><span className="readerContentBadge">{readerTrackLabel(content.track)}</span></div><span className="readerContentTime"><Clock3 size={13}/>{content.estimatedMinutes} 分钟</span></div>
    <h3>{content.title}</h3>
    <p>{content.description}</p>
    <div className="readerContentCardFoot"><span>{readerKindLabel(content.kind)} · {content.topic}{content.examId ? ` · ${getExamRouteLabel(content.examId)}` : ''}</span><ArrowRight size={16}/></div>
  </button>
}
