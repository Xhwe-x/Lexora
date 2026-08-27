export type ExamRouteId = 'general' | 'cet4' | 'cet6' | 'kaoyan' | 'ielts'

export type ExamRoute = {
  id: ExamRouteId
  label: string
  description: string
  starterLevel: 'A2' | 'B1'
}

export const examRoutes: ExamRoute[] = [
  { id: 'general', label: '通用考试英语', description: '先稳住高频词、句子和阅读基础。', starterLevel: 'A2' },
  { id: 'cet4', label: 'CET-4', description: '从 A2 基础进入四级常见表达。', starterLevel: 'A2' },
  { id: 'cet6', label: 'CET-6', description: '从 A2 复盘逐步加入 B1 挑战。', starterLevel: 'B1' },
  { id: 'kaoyan', label: '考研英语', description: '先建立书面表达与阅读耐力。', starterLevel: 'B1' },
  { id: 'ielts', label: 'IELTS', description: '从 A2 语境理解过渡到 B1 任务。', starterLevel: 'A2' }
]

export function getExamRoute(id: ExamRouteId | string | undefined) {
  return examRoutes.find(route => route.id === id)
}

export function getExamRouteLabel(id: ExamRouteId | string | undefined) {
  return getExamRoute(id)?.label ?? '考试英语'
}
