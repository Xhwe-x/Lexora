import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { speak } from '../../lib/speech'

export function SpeechButton({ text, size = 'normal', className = '' }: { text: string; size?: 'small' | 'normal' | 'large'; className?: string }) {
  const [state, setState] = useState<'idle' | 'playing' | 'error'>('idle')
  useEffect(() => {
    if (state !== 'error') return
    const timer = window.setTimeout(() => setState('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [state])

  const play = () => {
    setState('idle')
    speak(text, 'en-US', {
      onStart: () => setState('playing'),
      onEnd: () => setState('idle'),
      onError: () => setState('error')
    })
  }

  const label = state === 'playing' ? `正在播放 ${text} 发音` : state === 'error' ? `${text} 发音暂不可用` : `播放 ${text} 发音`
  return <button type="button" className={`speechButton ${size} ${state} ${className}`.trim()} onClick={play} aria-label={label} aria-pressed={state === 'playing'} title={label}>
    <span className="speechRing ringOne" aria-hidden="true"/><span className="speechRing ringTwo" aria-hidden="true"/>
    {state === 'error' ? <VolumeX size={size === 'small' ? 17 : size === 'large' ? 24 : 20}/> : <Volume2 size={size === 'small' ? 17 : size === 'large' ? 24 : 20}/>}<span className="srOnly">{state === 'playing' ? '播放中' : state === 'error' ? '发音不可用' : '播放发音'}</span>
  </button>
}
