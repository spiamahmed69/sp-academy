/**
 * Teacher course + enrollment stats — Phase 5.
 *
 * Firestore reads:
 *   - the teacher's own courses: courses where instructorId == uid
 *     (any status — drafts included; the teacher owns them).
 *   - per-course enrollment stats: active enrollments for that course,
 *     counted live from Firestore (getDocs, so average progress is real
 *     too). No student names are read here — enrollments carry only a
 *     userId, and teachers may not read other users' profile docs, so
 *     the dashboard shows honest counts, never invented names.
 *
 * Demo mode (Firebase not configured): the teacher preview uses the
 * labelled নমুনা catalogue — counts come from the sample course's
 * `students` field and are always shown with a নমুনা badge.
 */
import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { getFirebase } from './config'
import { courseFromDoc, type CourseDoc } from './courses'
import { courses as sampleCourses, type Course } from '../data/sample'
import { fakeDelay } from '../lib/format'

export interface CourseEnrollmentStat {
  courseId: string
  enrolledCount: number
  /** Average progress % across active enrollments, 0 when nobody enrolled. */
  avgProgress: number
  /** Total lessons completed across all active enrollments. */
  totalCompletedLessons: number
}

/** The teacher's own courses from Firestore, newest first. */
export async function fetchTeacherCourses(db: Firestore, uid: string): Promise<Course[]> {
  const snap = await getDocs(query(collection(db, 'courses'), where('instructorId', '==', uid)))
  const list = snap.docs.map((d) => ({
    course: courseFromDoc(d.id, d.data() as Record<string, unknown>),
    created: timestampMillis((d.data() as CourseDoc).createdAt),
  }))
  list.sort((a, b) => b.created - a.created || a.course.title.localeCompare(b.course.title, 'bn'))
  return list.map((item) => item.course)
}

function timestampMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: unknown }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000
  }
  return 0
}

/** Live enrollment stats for one course: count + average progress. */
export async function fetchCourseEnrollmentStat(db: Firestore, courseId: string): Promise<CourseEnrollmentStat> {
  const snap = await getDocs(
    query(collection(db, 'enrollments'), where('courseId', '==', courseId), where('status', '==', 'active')),
  )
  const percents = snap.docs.map((d) => {
    const p = (d.data() as { progressPercent?: unknown }).progressPercent
    return typeof p === 'number' && Number.isFinite(p) ? p : 0
  })
  const completed = snap.docs.map((d) => {
    const ids = (d.data() as { completedLessonIds?: unknown }).completedLessonIds
    return Array.isArray(ids) ? ids.length : 0
  })
  return {
    courseId,
    enrolledCount: snap.size,
    avgProgress: percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0,
    totalCompletedLessons: completed.reduce((a, b) => a + b, 0),
  }
}

/** Live enrollment stats for several courses at once. */
export async function fetchCourseEnrollmentStats(db: Firestore, courseIds: string[]): Promise<CourseEnrollmentStat[]> {
  return Promise.all(courseIds.map((id) => fetchCourseEnrollmentStat(db, id)))
}

export interface TeacherCoursesResult {
  courses: Course[]
  /** 'firestore' when read live, 'sample' for the labelled demo preview. */
  source: 'firestore' | 'sample'
}

/**
 * Teacher courses entry point. Demo mode returns the sample catalogue for
 * the demo teacher (t1) — the preview page labels it নমুনা.
 */
export async function getTeacherCourses(uid: string | null): Promise<TeacherCoursesResult> {
  const fb = getFirebase()
  if (!fb || !uid) {
    await fakeDelay(300)
    return { courses: sampleCourses.filter((c) => c.instructorId === 't1'), source: 'sample' }
  }
  return { courses: await fetchTeacherCourses(fb.db, uid), source: 'firestore' }
}

/** Demo-mode stats for a sample course: the sample `students` count, labelled নমুনা. */
export function sampleCourseEnrollmentStat(course: Course): CourseEnrollmentStat {
  return { courseId: course.id, enrolledCount: course.students, avgProgress: 0, totalCompletedLessons: 0 }
}

// ---- Pure summary helpers (tested) ----

export interface TeacherSummary {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalStudents: number
  totalLessons: number
  /** Average progress across courses that have students, 0 otherwise. */
  overallAvgProgress: number
}

/** Summarise a teacher's courses + per-course stats. Never invents numbers. */
export function summarizeTeacherStats(courses: Course[], stats: CourseEnrollmentStat[]): TeacherSummary {
  const byId = new Map(stats.map((s) => [s.courseId, s]))
  const totalStudents = courses.reduce((n, c) => n + (byId.get(c.id)?.enrolledCount ?? 0), 0)
  const totalLessons = courses.reduce((n, c) => n + c.lessons, 0)
  const withStudents = courses.filter((c) => (byId.get(c.id)?.enrolledCount ?? 0) > 0)
  const overallAvgProgress =
    withStudents.length > 0
      ? Math.round(withStudents.reduce((n, c) => n + (byId.get(c.id)?.avgProgress ?? 0), 0) / withStudents.length)
      : 0
  return {
    totalCourses: courses.length,
    // Sample courses carry no status — they count as published in the preview.
    publishedCourses: courses.filter((c) => c.status !== 'draft' && c.status !== 'archived').length,
    draftCourses: courses.filter((c) => c.status === 'draft').length,
    totalStudents,
    totalLessons,
    overallAvgProgress,
  }
}
