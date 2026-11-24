import { describe, expect, it } from 'vitest'
import {
  buildFreeEnrollmentDoc,
  computeProgressPercent,
  enrollmentDocId,
  parseDemoEnrollments,
} from './enrollments'
import { courses } from '../data/sample'

describe('enrollmentDocId (Phase 3)', () => {
  it('builds a stable owner-scoped id', () => {
    expect(enrollmentDocId('uid1', 'c1')).toBe('uid1_c1')
  })
})

describe('computeProgressPercent (Phase 3)', () => {
  it('computes percent and clamps to 0–100', () => {
    expect(computeProgressPercent(0, 10)).toBe(0)
    expect(computeProgressPercent(1, 2)).toBe(50)
    expect(computeProgressPercent(3, 3)).toBe(100)
    expect(computeProgressPercent(5, 4)).toBe(100)
  })

  it('is 0 for an empty course (never NaN)', () => {
    expect(computeProgressPercent(0, 0)).toBe(0)
    expect(computeProgressPercent(3, 0)).toBe(0)
  })
})

describe('buildFreeEnrollmentDoc (Phase 3)', () => {
  it('builds a free enrollment for a free course', () => {
    const free = courses.find((c) => c.isFree)
    expect(free).toBeDefined()
    const enrollment = buildFreeEnrollmentDoc('uid1', free as (typeof courses)[number])
    expect(enrollment.userId).toBe('uid1')
    expect(enrollment.courseId).toBe(free?.id)
    expect(enrollment.status).toBe('active')
    expect(enrollment.paymentStatus).toBe('free')
    expect(enrollment.pricePaid).toBe(0)
    expect(enrollment.completedLessonIds).toEqual([])
    expect(enrollment.progressPercent).toBe(0)
  })

  it('refuses to build an enrollment for a paid course (no fake purchase)', () => {
    const paid = courses.find((c) => !c.isFree)
    expect(paid).toBeDefined()
    expect(() => buildFreeEnrollmentDoc('uid1', paid as (typeof courses)[number])).toThrow()
  })
})

describe('parseDemoEnrollments (Phase 3)', () => {
  it('parses valid demo enrollments', () => {
    const parsed = parseDemoEnrollments(
      JSON.stringify([{ courseId: 'c7', enrolledAt: '2026-11-24T00:00:00Z', completedLessonIds: ['a'] }]),
    )
    expect(parsed).toHaveLength(1)
    expect(parsed[0].courseId).toBe('c7')
    expect(parsed[0].completedLessonIds).toEqual(['a'])
  })

  it('ignores malformed, non-array, and foreign data instead of crashing', () => {
    expect(parseDemoEnrollments(null)).toEqual([])
    expect(parseDemoEnrollments('')).toEqual([])
    expect(parseDemoEnrollments('not json')).toEqual([])
    expect(parseDemoEnrollments(JSON.stringify({ courseId: 'c7' }))).toEqual([])
    expect(parseDemoEnrollments(JSON.stringify([{ nope: 1 }, { courseId: 'c7', completedLessonIds: 'oops' }]))).toEqual([
      expect.objectContaining({ courseId: 'c7', completedLessonIds: [] }),
    ])
  })
})
