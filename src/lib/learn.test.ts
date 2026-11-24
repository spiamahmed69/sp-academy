import { describe, expect, it } from 'vitest'
import {
  findLessonById,
  firstIncompleteLesson,
  isLessonAccessible,
  nextLesson,
  previousLesson,
  resolveCurrentLesson,
} from './learn'
import type { LessonView } from '../firebase/courses'

const lessons: LessonView[] = [
  { id: 'l1', chapterIndex: 0, chapterTitle: 'অধ্যায় ১', order: 0, title: 'পরিচিতি', durationMin: 10, isPreview: true },
  { id: 'l2', chapterIndex: 0, chapterTitle: 'অধ্যায় ১', order: 1, title: 'মূল আলোচনা', durationMin: 20, isPreview: false },
  { id: 'l3', chapterIndex: 1, chapterTitle: 'অধ্যায় ২', order: 2, title: 'অনুশীলন', durationMin: 15, isPreview: false },
]

describe('findLessonById (Phase 4)', () => {
  it('finds a lesson by id and returns undefined for unknown/empty ids', () => {
    expect(findLessonById(lessons, 'l2')?.title).toBe('মূল আলোচনা')
    expect(findLessonById(lessons, 'missing')).toBeUndefined()
    expect(findLessonById(lessons, null)).toBeUndefined()
    expect(findLessonById(lessons, '')).toBeUndefined()
  })
})

describe('firstIncompleteLesson (Phase 4)', () => {
  it('returns the first lesson not in the completed list', () => {
    expect(firstIncompleteLesson(lessons, [])?.id).toBe('l1')
    expect(firstIncompleteLesson(lessons, ['l1'])?.id).toBe('l2')
    expect(firstIncompleteLesson(lessons, ['l1', 'l2', 'l3'])).toBeUndefined()
  })
})

describe('nextLesson / previousLesson (Phase 4)', () => {
  it('moves in course order and stops at the ends', () => {
    expect(nextLesson(lessons, 'l1')?.id).toBe('l2')
    expect(nextLesson(lessons, 'l3')).toBeUndefined()
    expect(nextLesson(lessons, 'missing')).toBeUndefined()
    expect(previousLesson(lessons, 'l3')?.id).toBe('l2')
    expect(previousLesson(lessons, 'l1')).toBeUndefined()
  })
})

describe('isLessonAccessible (Phase 4)', () => {
  it('allows previews for everyone, other lessons only when enrolled', () => {
    expect(isLessonAccessible(lessons[0], false)).toBe(true)
    expect(isLessonAccessible(lessons[1], false)).toBe(false)
    expect(isLessonAccessible(lessons[1], true)).toBe(true)
  })
})

describe('resolveCurrentLesson (Phase 4)', () => {
  it('prefers the requested lesson, then first incomplete, then first', () => {
    expect(resolveCurrentLesson(lessons, 'l3', [])?.id).toBe('l3')
    expect(resolveCurrentLesson(lessons, 'missing', ['l1'])?.id).toBe('l2')
    expect(resolveCurrentLesson(lessons, null, ['l1', 'l2', 'l3'])?.id).toBe('l1')
    expect(resolveCurrentLesson([], null, [])).toBeUndefined()
  })
})
