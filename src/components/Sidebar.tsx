import { BookOpen, Brain, Home, Languages, ListChecks, UserRound } from 'lucide-react'

export type Page = 'home' | 'words' | 'review' | 'reader' | 'my'

const items: Array<{ id: Page; label: string; icon: typeof Home }> = [
  { id: 'home', label: '今日', icon: Home },
  { id: 'words', label: '单词', icon: Languages },
  { id: 'reader', label: '阅读', icon: BookOpen },
  { id: 'review', label: '复习', icon: Brain },
  { id: 'my', label: '我的', icon: UserRound }
]

export function Sidebar({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brandMark">L</div><div><strong>Lexora</strong><span>Learn in one flow</span></div></div>
    <nav aria-label="主要导航">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={page === id ? 'active' : ''}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <div className="sidebarNote"><ListChecks size={17}/><span>学习记录只保存在当前浏览器。</span></div>
  </aside>
}
