/**
 * Learn-page helpers — Phase 4.
 *
 * Pure functions only (tested in learn.test.ts): picking the current
 * lesson, moving between lessons, and deciding what a student may open.
 * No data is invented here — a lesson is accessible only when it is a
 * free preview or the student is enrolled in the course.
 */
import type { LessonView } from '../firebase/courses'

/** Find a lesson by id, or undefined when the id is missing/unknown. */
export function findLessonById(lessons: LessonView[], id: string | null | undefined): LessonView | undefined {
  if (!id) return undefined
  return lessons.find((l) => l.id === id)
}

/** First lesson the student has not completed yet (null when all done). */
export function firstIncompleteLesson(lessons: LessonView[], completedIds: string[]): LessonView | undefined {
  return lessons.find((l) => !completedIds.includes(l.id))
}

/** Next lesson after the given one, in course order. */
export function nextLesson(lessons: LessonView[], currentId: string): LessonView | undefined {
  const index = lessons.findIndex((l) => l.id === currentId)
  if (index < 0 || index + 1 >= lessons.length) return undefined
  return lessons[index + 1]
}

/** Previous lesson before the given one, in course order. */
export function previousLesson(lessons: LessonView[], currentId: string): LessonView | undefined {
  const index = lessons.findIndex((l) => l.id === currentId)
  if (index <= 0) return undefined
  return lessons[index - 1]
}

/** A lesson opens when it is a free preview or the student is enrolled. */
export function isLessonAccessible(lesson: LessonView, enrolled: boolean): boolean {
  return lesson.isPreview || enrolled
}

/**
 * Pick the lesson to show: the requested one when it exists, otherwise
 * the first incomplete lesson for an enrolled student, otherwise the
 * first lesson. Returns undefined only for a course with no lessons.
 */
export function resolveCurrentLesson(
  lessons: LessonView[],
  requestedId: string | null | undefined,
  completedIds: string[],
): LessonView | undefined {
  return findLessonById(lessons, requestedId) ?? firstIncompleteLesson(lessons, completedIds) ?? lessons[0]
}
