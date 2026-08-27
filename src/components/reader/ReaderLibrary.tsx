import { BookOpen, Filter, Pencil, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { ReaderContent, ReaderFilters } from '../../features/reader/catalog'
import { defaultReaderFilters, filterReaderContents, readerKindLabel, readerLevelLabel, readerTrackLabel } from '../../features/reader/catalog'
import type { ReaderDocument } from '../../features/reader/state'
import { ReaderContentCard } from './ReaderContentCard'

export function ReaderLibrary({ contents, currentContent, document, onContinue, onSelectContent, onOpenEditor, onUseExample }: {
  contents: ReaderContent[]
  currentContent: ReaderContent
  document: ReaderDocument
  onContinue: () => void
  onSelectContent: (content: ReaderContent) => void
  onOpenEditor: () => void
  onUseExample: () => void
}) {
  const [filters, setFilters] = useState<ReaderFilters>(defaultReaderFilters)
  const filteredContents = filterReaderContents(contents, filters)
  const updateFilter = <K extends keyof ReaderFilters>(key: K, value: ReaderFilters[K]) => setFilters(previous => ({ ...previous, [key]: value }))

  return <div className="readerLibrary pageEnter">
    <header className="readerLibraryHeader"><div><span className="eyebrow">READER</span><h1>阅读</h1><p>选择一篇合适的短文，阅读、查词，再把真正有用的表达保存下来。</p></div><span className="readerLibraryLocal"><BookOpen size={16}/> 本地内容</span></header>
    {document.text.trim() && <section className="readerContinueCard" aria-labelledby="reader-continue-title"><div className="readerContinueIcon"><BookOpen size={22}/></div><div className="readerContinueCopy"><span className="eyebrow">继续阅读</span><h2 id="reader-continue-title">{currentContent.title}</h2><p><span className={`readerMetaBadge ${currentContent.track}`}>{readerLevelLabel(currentContent.level)}</span><span className={`readerMetaBadge ${currentContent.track}`}>{readerTrackLabel(currentContent.track)}</span><span>{currentContent.topic} · 还剩 {Math.max(0, 100 - document.scrollProgress)}%</span></p></div><button className="primaryButton" type="button" onClick={onContinue}>继续阅读 <RotateCcw size={16}/></button></section>}
    <section className="readerRecommendations" aria-labelledby="reader-recommendations-title"><div className="sectionHeading"><div><span className="eyebrow">RECOMMENDED</span><h2 id="reader-recommendations-title">推荐给你</h2></div><span>{filteredContents.length} 篇本地短文</span></div><div className="readerContentGrid">{filteredContents.map(content => <ReaderContentCard key={content.id} content={content} active={content.id === currentContent.id} onOpen={() => content.id === currentContent.id ? onContinue() : onSelectContent(content)}/>)}</div>{!filteredContents.length && <div className="readerFilterEmpty"><Filter size={20}/><p>没有符合当前筛选的内容。</p><button className="textButton" type="button" onClick={() => setFilters(defaultReaderFilters)}>清除筛选</button></div>}</section>
    <section className="readerFilterSection" aria-labelledby="reader-filter-title"><div className="sectionHeading"><div><span className="eyebrow">FILTER</span><h2 id="reader-filter-title">轻量筛选</h2></div><span>只筛选当前本地内容</span></div><div className="readerFilterBar"><label htmlFor="reader-filter-level">难度<select id="reader-filter-level" value={filters.level} onChange={event => updateFilter('level', event.target.value as ReaderFilters['level'])}><option value="all">全部难度</option><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option></select></label><label htmlFor="reader-filter-track">方向<select id="reader-filter-track" value={filters.track} onChange={event => updateFilter('track', event.target.value as ReaderFilters['track'])}><option value="all">全部方向</option><option value="daily">日常英语</option><option value="exam">考试英语</option><option value="shared">共享</option></select></label><label htmlFor="reader-filter-topic">主题<select id="reader-filter-topic" value={filters.topic} onChange={event => updateFilter('topic', event.target.value as ReaderFilters['topic'])}><option value="all">全部主题</option><option value="生活">生活</option><option value="工作">工作</option><option value="旅行">旅行</option><option value="学习">学习</option><option value="观点">观点</option></select></label><label htmlFor="reader-filter-kind">类型<select id="reader-filter-kind" value={filters.kind} onChange={event => updateFilter('kind', event.target.value as ReaderFilters['kind'])}><option value="all">全部类型</option><option value="article">短文</option><option value="dialogue">对话</option><option value="email">邮件</option><option value="story">故事</option><option value="news">新闻</option><option value="audio-transcript">音频文本</option></select></label><label htmlFor="reader-filter-minutes">时长<select id="reader-filter-minutes" value={filters.minutes} onChange={event => updateFilter('minutes', event.target.value as ReaderFilters['minutes'])}><option value="all">全部时长</option><option value="short">1–5 分钟</option><option value="medium">6–10 分钟</option><option value="long">11 分钟以上</option></select></label></div></section>
    <section className="readerCustomEntry" aria-labelledby="reader-custom-title"><div><span className="eyebrow">YOUR TEXT</span><h2 id="reader-custom-title">找不到想读的内容？</h2><p>粘贴一篇自己的英文，Lexora 会继续保存同一份阅读进度和查词记录。</p></div><div className="readerCustomActions"><button className="secondaryButton" type="button" onClick={onOpenEditor}><Pencil size={16}/> 粘贴自己的英文</button><button className="textButton" type="button" onClick={onUseExample}>使用示例文章</button></div></section>
  </div>
}
