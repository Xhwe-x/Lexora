export type ExerciseType = 'intro' | 'choice' | 'typing'
export type SessionSource = 'new' | 'due' | 'retry'

export type SessionItem = {
  id: string
  wordId: string
  exerciseType: ExerciseType
  source: SessionSource
  attempt: number
  earliestStep: number
  core: boolean
}
