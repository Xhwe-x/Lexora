import { useEffect, useState, type KeyboardEvent } from 'react'
import { ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react'
import { commitDailyCountDraft } from '../learning/settings'

export function Settings({ dailyCount, max, onCount, onReset }: { dailyCount: number; max: number; onCount: (v: number) => void; onReset: () => void }) {
  const [draft, setDraft] = useState(String(dailyCount))
  useEffect(() => setDraft(String(dailyCount)), [dailyCount])
  const commit = () => { const next = commitDailyCountDraft(draft, dailyCount, max); setDraft(String(next)); if (next !== dailyCount) onCount(next) }

  return <section className="mySection settingsSection">
    <div className="sectionHeading"><div><span className="eyebrow">SETTINGS</span><h2>设置</h2></div></div>
    <div className="settingsList">
      <div className="settingsRow planSetting"><div><strong>每日新词</strong><span>稳定节奏比一次学很多更重要</span></div><div className="compactCount"><button aria-label="减少每日新词" onClick={() => { const next = Math.max(1, dailyCount - 1); setDraft(String(next)); onCount(next) }}>−</button><input aria-label="每日新词数量" inputMode="numeric" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { commit(); event.currentTarget.blur() } }}/><button aria-label="增加每日新词" onClick={() => { const next = Math.min(max, dailyCount + 1); setDraft(String(next)); onCount(next) }}>＋</button></div></div>
      <div className="settingsRow"><div><strong>声音</strong><span>使用浏览器本地 SpeechSynthesis 发音</span></div><span className="settingsValue">浏览器发音</span></div>
      <div className="settingsRow"><div><strong>动画</strong><span>自动遵从系统的“减少动态效果”设置</span></div><span className="settingsValue">跟随系统</span></div>
      <div className="settingsRow"><div><strong>阅读偏好</strong><span>字号、行距、正文宽度与字体</span></div><span className="settingsValue">阅读页 Aa <ChevronRight size={15}/></span></div>
    </div>
    <details className="privacyDetails"><summary><span><ShieldCheck size={18}/><b>数据与隐私</b></span><ChevronRight size={17}/></summary><div className="privacyBody"><p>你的学习数据目前只保存在这个浏览器。Lexora 不会自动上传到服务器。</p><div className="dangerPanel"><div><strong>危险操作</strong><span>重置会清除 Lexora 与旧版本 English Garden 的本地学习记录和设置。</span></div><button className="dangerOutline" onClick={onReset}><RotateCcw size={16}/> 重置所有记录</button></div></div></details>
  </section>
}
