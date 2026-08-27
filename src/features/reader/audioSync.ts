import type { ReaderCue } from './state'

export type AudioCue = ReaderCue

function orderedCues(cues: AudioCue[]) {
  return [...cues].filter(cue => cue.endMs > cue.startMs).sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs)
}

export function getActiveCue(cues: AudioCue[], currentTimeMs: number) {
  return orderedCues(cues).find(cue => currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs)
}

export const getCueAtTime = getActiveCue
export const getAudioCueAtTime = getActiveCue

export function getAudioProgress(cues: AudioCue[], currentTimeMs: number) {
  const ordered = orderedCues(cues)
  if (!ordered.length) return 0
  const start = ordered[0].startMs
  const end = ordered[ordered.length - 1].endMs
  if (end <= start) return 0
  return Math.round(Math.max(0, Math.min(100, ((currentTimeMs - start) / (end - start)) * 100)))
}

export const getCueProgress = getAudioProgress
export const getCueProgressPercent = getAudioProgress
