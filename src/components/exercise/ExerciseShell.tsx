import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function ExerciseShell({ completed, total, onExit, children }: { completed: number; total: number; onExit: () => void; children: ReactNode }) {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 100
  return <div className="sessionShell">
    <header className="sessionHeader">
      <button className="sessionExit" onClick={onExit} aria-label="退出学习"><X size={22}/></button>
      <div className="sessionProgressWrap" aria-label={`今日核心任务已完成 ${completed} / ${total}`}>
        <div className="sessionProgressMeta"><span>今日学习</span><strong>{completed} / {total}</strong></div>
        <div className="sessionProgress"><span style={{ width: `${percent}%` }}/></div>
      </div>
    </header>
    <main className="exerciseStage">{children}</main>
  </div>
}
