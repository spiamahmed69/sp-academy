/**
 * Enrollments — Phase 3.
 *
 * Firestore collection: enrollments/{uid}_{courseId}
 *   { userId, courseId, status: 'active' | 'cancelled',
 *     paymentStatus: 'free' | 'pending' | 'paid', pricePaid,
 *     completedLessonIds: string[], progressPercent,
 *     enrolledAt, updatedAt }
 *
 * Honesty rules:
 * - Only FREE courses can be enrolled from the client. A paid course never
 *   creates an enrollment here — payment arrives in Phase 8, and until then
 *   the UI says so plainly instead of faking a successful purchase.
 * - Progress (completed lessons) lives on the enrollment doc so the
 *   dashboard can show it without a second collection.
 * - Demo mode (Firebase not configured): free-course enrollments are kept in
 *   this browser's localStorage only, clearly labelled ডেমো ভর্তি. They are
 *   not real enrollments and do not sync anywhere.
 */
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import type { Course } from '../data/sample'

export type EnrollmentStatus = 'active' | 'cancelled'
export type PaymentStatus = 'free' | 'pending' | 'paid'

export interface EnrollmentDoc {
  userId: string
  courseId: string
  status: EnrollmentStatus
  paymentStatus: PaymentStatus
  pricePaid: number
  completedLessonIds: string[]
  progressPercent: number
  enrolledAt: unknown
  updatedAt: unknown
}

/** Enrollment + its course, as shown on the dashboard / My Courses. */
export interface EnrollmentView extends EnrollmentDoc {
  id: string
  course: Course
  totalLessons: number
  completedCount: number
}

export function enrollmentDocId(uid: string, courseId: string): string {
  return `${uid}_${courseId}`
}

/** Progress percent, 0–100, safe for empty courses and over-counts. */
export function computeProgressPercent(completedCount: number, totalLessons: number): number {
  if (totalLessons <= 0 || completedCount <= 0) return 0
  return Math.min(100, Math.round((completedCount / totalLessons) * 100))
}

/** Pure builder: the enrollment doc for a FREE course. Throws for paid courses. */
export function buildFreeEnrollmentDoc(uid: string, course: Course): EnrollmentDoc {
  if (!course.isFree || course.price !== 0) {
    throw new Error('এই কোর্সটি ফ্রি নয় — পেইড কোর্স কার্টে যোগ করে চেকআউট করুন।')
  }
  return {
    userId: uid,
    courseId: course.id,
    status: 'active',
    paymentStatus: 'free',
    pricePaid: 0,
    completedLessonIds: [],
    progressPercent: 0,
    enrolledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function enrollmentFromDoc(id: string, data: Record<string, unknown>, course: Course): EnrollmentView {
  const completed = Array.isArray(data.completedLessonIds)
    ? data.completedLessonIds.filter((v): v is string => typeof v === 'string')
    : []
  const total = course.lessons
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    courseId: typeof data.courseId === 'string' ? data.courseId : course.id,
    status: data.status === 'cancelled' ? 'cancelled' : 'active',
    paymentStatus: data.paymentStatus === 'paid' ? 'paid' : data.paymentStatus === 'pending' ? 'pending' : 'free',
    pricePaid: typeof data.pricePaid === 'number' ? data.pricePaid : 0,
    completedLessonIds: completed,
    progressPercent: computeProgressPercent(completed.length, total),
    enrolledAt: data.enrolledAt ?? null,
    updatedAt: data.updatedAt ?? null,
    course,
    totalLessons: total,
    completedCount: completed.length,
  }
}

function enrolledAtMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  return 0
}

/** Enroll the signed-in user in a FREE course (Firestore). Also records it on students/{uid}. */
export async function enrollFreeCourse(db: Firestore, uid: string, course: Course): Promise<EnrollmentDoc> {
  const enrollment = buildFreeEnrollmentDoc(uid, course)
  const batch = writeBatch(db)
  batch.set(doc(db, 'enrollments', enrollmentDocId(uid, course.id)), enrollment)
  batch.set(
    doc(db, 'students', uid),
    { enrolledCourseIds: arrayUnion(course.id), updatedAt: serverTimestamp() },
    { merge: true },
  )
  await batch.commit()
  return enrollment
}

/** One enrollment doc, or null when the user is not enrolled in that course. */
export async function getEnrollment(db: Firestore, uid: string, courseId: string): Promise<EnrollmentDoc | null> {
  const snap = await getDoc(doc(db, 'enrollments', enrollmentDocId(uid, courseId)))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    userId: typeof data.userId === 'string' ? data.userId : uid,
    courseId: typeof data.courseId === 'string' ? data.courseId : courseId,
    status: data.status === 'cancelled' ? 'cancelled' : 'active',
    paymentStatus: data.paymentStatus === 'paid' ? 'paid' : data.paymentStatus === 'pending' ? 'pending' : 'free',
    pricePaid: typeof data.pricePaid === 'number' ? data.pricePaid : 0,
    completedLessonIds: Array.isArray(data.completedLessonIds)
      ? data.completedLessonIds.filter((v): v is string => typeof v === 'string')
      : [],
    progressPercent: typeof data.progressPercent === 'number' ? data.progressPercent : 0,
    enrolledAt: data.enrolledAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/** All of a user's enrollments, joined with course data, newest first. */
export async function getMyEnrollments(db: Firestore, uid: string, resolveCourse: (courseId: string) => Course | undefined): Promise<EnrollmentView[]> {
  const snap = await getDocs(query(collection(db, 'enrollments'), where('userId', '==', uid)))
  const views: EnrollmentView[] = []
  for (const d of snap.docs) {
    const course = resolveCourse(d.data().courseId as string)
    if (!course) continue // course removed/unpublished — don't show a broken row
    views.push(enrollmentFromDoc(d.id, d.data(), course))
  }
  views.sort((a, b) => enrolledAtMillis(b.enrolledAt) - enrolledAtMillis(a.enrolledAt))
  return views.filter((v) => v.status === 'active')
}

/** Toggle one lesson's completion on an enrollment; returns the new percent. */
export async function toggleLessonComplete(
  db: Firestore,
  uid: string,
  courseId: string,
  lessonId: string,
  totalLessons: number,
): Promise<number> {
  const ref = doc(db, 'enrollments', enrollmentDocId(uid, courseId))
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('এই কোর্সে ভর্তি হওয়া যায়নি — আগে ভর্তি হোন।')
    const data = snap.data()
    const completed: string[] = Array.isArray(data.completedLessonIds)
      ? data.completedLessonIds.filter((v): v is string => typeof v === 'string')
      : []
    const next = completed.includes(lessonId) ? completed.filter((id) => id !== lessonId) : [...completed, lessonId]
    const percent = computeProgressPercent(next.length, totalLessons)
    tx.update(ref, { completedLessonIds: next, progressPercent: percent, updatedAt: serverTimestamp() })
    return percent
  })
}

// ---- Demo mode: localStorage enrollments (this browser only, clearly labelled) ----

export const DEMO_ENROLLMENTS_KEY = 'sp-academy-demo-enrollments-v1'

export interface DemoEnrollment {
  courseId: string
  enrolledAt: string
  completedLessonIds: string[]
}

/** Pure parser: malformed / foreign data never crashes the page, it is ignored. */
export function parseDemoEnrollments(raw: unknown): DemoEnrollment[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        courseId: typeof item.courseId === 'string' ? item.courseId : '',
        enrolledAt: typeof item.enrolledAt === 'string' ? item.enrolledAt : new Date().toISOString(),
        completedLessonIds: Array.isArray(item.completedLessonIds)
          ? item.completedLessonIds.filter((v): v is string => typeof v === 'string')
          : [],
      }))
      .filter((item) => item.courseId.length > 0)
  } catch {
    return []
  }
}

function readDemoRaw(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    return window.localStorage.getItem(DEMO_ENROLLMENTS_KEY)
  } catch {
    return null
  }
}

function writeDemoRaw(list: DemoEnrollment[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(DEMO_ENROLLMENTS_KEY, JSON.stringify(list))
  } catch {
    // Storage full / blocked — demo enrollment just won't persist.
  }
}

export function readDemoEnrollments(): DemoEnrollment[] {
  return parseDemoEnrollments(readDemoRaw())
}

export function isDemoEnrolled(courseId: string): boolean {
  return readDemoEnrollments().some((e) => e.courseId === courseId)
}

export function addDemoEnrollment(courseId: string): DemoEnrollment[] {
  const list = readDemoEnrollments()
  if (list.some((e) => e.courseId === courseId)) return list
  const next = [...list, { courseId, enrolledAt: new Date().toISOString(), completedLessonIds: [] }]
  writeDemoRaw(next)
  return next
}

export function removeDemoEnrollment(courseId: string): DemoEnrollment[] {
  const next = readDemoEnrollments().filter((e) => e.courseId !== courseId)
  writeDemoRaw(next)
  return next
}

export function toggleDemoLessonComplete(courseId: string, lessonId: string): DemoEnrollment[] {
  const next = readDemoEnrollments().map((e) => {
    if (e.courseId !== courseId) return e
    const has = e.completedLessonIds.includes(lessonId)
    return { ...e, completedLessonIds: has ? e.completedLessonIds.filter((id) => id !== lessonId) : [...e.completedLessonIds, lessonId] }
  })
  writeDemoRaw(next)
  return next
}

/** Demo enrollments joined with course data, for the My Courses page in demo mode. */
export function demoEnrollmentViews(
  resolveCourse: (courseId: string) => Course | undefined,
  demos: DemoEnrollment[] = readDemoEnrollments(),
): EnrollmentView[] {
  const views: EnrollmentView[] = []
  for (const demo of demos) {
    const course = resolveCourse(demo.courseId)
    if (!course) continue // course removed from the catalogue — don't show a broken row
    const total = course.lessons
    views.push({
      id: `demo_${demo.courseId}`,
      userId: 'demo',
      courseId: demo.courseId,
      status: 'active',
      paymentStatus: 'free',
      pricePaid: 0,
      completedLessonIds: demo.completedLessonIds,
      progressPercent: computeProgressPercent(demo.completedLessonIds.length, total),
      enrolledAt: demo.enrolledAt,
      updatedAt: demo.enrolledAt,
      course,
      totalLessons: total,
      completedCount: demo.completedLessonIds.length,
    })
  }
  return views
}
