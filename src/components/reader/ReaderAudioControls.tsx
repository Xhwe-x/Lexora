import { Pause, Play, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReaderCue } from '../../features/reader/state'
import { getActiveCue, getAudioProgress } from '../../features/reader/audioSync'
import { SpeechButton } from '../audio/SpeechButton'

export function ReaderAudioControls({ audioUrl, cues = [], fallbackText, initialTimeMs = 0, onCueChange, onProgress }: {
  audioUrl?: string
  cues?: ReaderCue[]
  fallbackText: string
  initialTimeMs?: number
  onCueChange: (cue?: ReaderCue) => void
  onProgress: (progress: number, currentTimeMs: number) => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
  }, [rate])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const restoreTime = () => {
      if (initialTimeMs > 0 && Number.isFinite(audio.duration)) audio.currentTime = Math.min(initialTimeMs / 1000, audio.duration)
    }
    if (audio.readyState >= 1) restoreTime()
    else audio.addEventListener('loadedmetadata', restoreTime, { once: true })
    return () => { audio.removeEventListener('loadedmetadata', restoreTime); audio.pause() }
  }, [audioUrl, initialTimeMs])

  if (!audioUrl) return <div className="readerAudioControls readerAudioFallback"><SpeechButton text={fallbackText} size="small"/><span>使用浏览器语音播放</span></div>

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    setError(false)
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => { setError(true); setPlaying(false) })
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const updateTime = () => {
    const audio = audioRef.current
    if (!audio) return
    const currentTimeMs = Math.round(audio.currentTime * 1000)
    const progress = cues.length ? getAudioProgress(cues, currentTimeMs) : audio.duration > 0 ? Math.round((audio.currentTime / audio.duration) * 100) : 0
    onCueChange(cues.length ? getActiveCue(cues, currentTimeMs) : undefined)
    onProgress(progress, currentTimeMs)
  }

  return <div className="readerAudioControls"><audio ref={audioRef} src={audioUrl} preload="metadata" onTimeUpdate={updateTime} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); onCueChange(undefined); onProgress(100, Math.round((audioRef.current?.duration ?? 0) * 1000)) }} aria-label="文章音频"/><button className="readerAudioPlay" type="button" onClick={togglePlayback} aria-label={playing ? '暂停文章音频' : '播放文章音频'}>{playing ? <Pause size={15}/> : <Play size={15}/>}<span>{playing ? '暂停' : '播放'}</span></button><label className="readerAudioRate">速度<select value={rate} onChange={event => setRate(Number(event.target.value))}><option value="0.8">0.8×</option><option value="1">1.0×</option><option value="1.2">1.2×</option></select></label>{error && <span className="readerAudioError">音频暂时无法播放</span>}<Volume2 size={15} aria-hidden="true"/></div>
}
