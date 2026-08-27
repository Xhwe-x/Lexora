import test from 'node:test'
import assert from 'node:assert/strict'
import { examRoutes, getExamRoute, getExamRouteLabel } from '../../src/features/exams/routes.ts'

test('exam routes expose all five routes with stable labels and starter levels', () => {
  const expected = [
    { id: 'general', label: '通用考试英语', starterLevel: 'A2' },
    { id: 'cet4', label: 'CET-4', starterLevel: 'A2' },
    { id: 'cet6', label: 'CET-6', starterLevel: 'B1' },
    { id: 'kaoyan', label: '考研英语', starterLevel: 'B1' },
    { id: 'ielts', label: 'IELTS', starterLevel: 'A2' }
  ] as const

  assert.deepEqual(examRoutes.map(route => ({ id: route.id, label: route.label, starterLevel: route.starterLevel })), expected)
  for (const route of expected) {
    assert.equal(getExamRoute(route.id)?.label, route.label)
    assert.equal(getExamRoute(route.id)?.starterLevel, route.starterLevel)
    assert.equal(getExamRouteLabel(route.id), route.label)
  }
})
