import { useEffect, useState, type KeyboardEvent } from 'react'
import { ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react'
import { commitDailyCountDraft } from '../learning/settings'
import { downloadSyncState, getSyncServiceUrl, uploadSyncState, type SyncState } from '../features/sync/client'

export function Settings({ dailyCount, max, onCount, onReset, syncSnapshot, onSyncDownload }: { dailyCount: number; max: number; onCount: (v: number) => void; onReset: () => void; syncSnapshot?: SyncState; onSyncDownload?: (state: SyncState) => void }) {
  const [draft, setDraft] = useState(String(dailyCount))
  const [serviceUrl, setServiceUrl] = useState(() => getSyncServiceUrl((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_LEXORA_SERVICE_URL))
  const [token, setToken] = useState('')
  const [syncStatus, setSyncStatus] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  useEffect(() => setDraft(String(dailyCount)), [dailyCount])
  const commit = () => { const next = commitDailyCountDraft(draft, dailyCount, max); setDraft(String(next)); if (next !== dailyCount) onCount(next) }
  const sync = async (action: 'upload' | 'download') => {
    if (!syncSnapshot && action === 'upload') { setSyncStatus('当前没有可同步的本地状态。'); return }
    setSyncBusy(true)
    setSyncStatus('同步中…')
    try {
      const options = { serviceUrl, token }
      if (action === 'upload') await uploadSyncState(syncSnapshot!, options)
      else {
        const result = await downloadSyncState(options)
        onSyncDownload?.(result.data)
      }
      setSyncStatus(action === 'upload' ? '已上传当前本地状态。' : '已下载并应用同步状态。')
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : '同步失败，请检查服务地址与 token。')
    } finally {
      setSyncBusy(false)
    }
  }

  return <section className="mySection settingsSection">
    <div className="sectionHeading"><div><span className="eyebrow">SETTINGS</span><h2>设置</h2></div></div>
    <div className="settingsList">
      <div className="settingsRow planSetting"><div><strong>每日新词</strong><span>稳定节奏比一次学很多更重要</span></div><div className="compactCount"><button aria-label="减少每日新词" onClick={() => { const next = Math.max(1, dailyCount - 1); setDraft(String(next)); onCount(next) }}>−</button><input aria-label="每日新词数量" inputMode="numeric" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { commit(); event.currentTarget.blur() } }}/><button aria-label="增加每日新词" onClick={() => { const next = Math.min(max, dailyCount + 1); setDraft(String(next)); onCount(next) }}>＋</button></div></div>
      <div className="settingsRow"><div><strong>声音</strong><span>使用浏览器本地 SpeechSynthesis 发音</span></div><span className="settingsValue">浏览器发音</span></div>
      <div className="settingsRow"><div><strong>动画</strong><span>自动遵从系统的“减少动态效果”设置</span></div><span className="settingsValue">跟随系统</span></div>
      <div className="settingsRow"><div><strong>阅读偏好</strong><span>字号、行距、正文宽度与字体</span></div><span className="settingsValue">阅读页 Aa <ChevronRight size={15}/></span></div>
      <div className="settingsRow syncSettingRow"><div><strong>可选同步</strong><span>默认只保存在本地；点击按钮后才会访问同步服务。</span></div><div className="syncControls"><label htmlFor="sync-service-url">服务地址<input id="sync-service-url" value={serviceUrl} onChange={event => setServiceUrl(event.target.value)} placeholder="http://localhost:8787" /></label><label htmlFor="sync-token">Token<input id="sync-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="仅保存在当前页面" /></label><div className="syncActions"><button className="secondaryButton" type="button" disabled={syncBusy} onClick={() => sync('upload')}>上传状态</button><button className="secondaryButton" type="button" disabled={syncBusy} onClick={() => sync('download')}>下载状态</button></div>{syncStatus && <span className="syncStatus" role="status">{syncStatus}</span>}</div></div>
    </div>
    <details className="privacyDetails"><summary><span><ShieldCheck size={18}/><b>数据与隐私</b></span><ChevronRight size={17}/></summary><div className="privacyBody"><p>学习数据默认只保存在此浏览器；只有你手动点击上传时，才会发送到配置的同步服务。</p><div className="dangerPanel"><div><strong>危险操作</strong><span>重置会清除 Lexora 与旧版本 English Garden 的本地学习记录和设置。</span></div><button className="dangerOutline" onClick={onReset}><RotateCcw size={16}/> 重置所有记录</button></div></div></details>
  </section>
}
