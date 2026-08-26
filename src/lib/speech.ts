export type SpeechCallbacks = {
  onStart?: () => void
  onEnd?: () => void
  onError?: () => void
}

let stopActive: (() => void) | undefined

export function cancelSpeech() {
  stopActive?.()
  stopActive = undefined
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function speak(text: string, lang = 'en-US', callbacks: SpeechCallbacks = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    callbacks.onError?.()
    return false
  }

  cancelSpeech()
  let settled = false
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.9

  const finish = (kind: 'end' | 'error') => {
    if (settled) return
    settled = true
    stopActive = undefined
    if (kind === 'error') callbacks.onError?.()
    else callbacks.onEnd?.()
  }

  utterance.onstart = () => callbacks.onStart?.()
  utterance.onend = () => finish('end')
  utterance.onerror = () => finish('error')
  stopActive = () => {
    if (settled) return
    settled = true
    callbacks.onEnd?.()
  }
  window.speechSynthesis.speak(utterance)
  return true
}
