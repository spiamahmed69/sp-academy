/**
 * Firestore course model + catalogue service — Phase 3.
 *
 * Collections (see firestore.rules v2 + docs/architecture.md):
 *   courses/{courseId}           — one doc per course (public read when published)
 *   courses/{courseId}/lessons/{lessonId} — lesson outline (Phase 4 adds video)
 *   courseCategories/{categoryId} — category docs (mirror of the sample list)
 *
 * Source of truth for the catalogue:
 * - Firebase configured → Firestore (`status == 'published'` only).
 * - Not configured → the labelled নমুনা data in src/data/sample.ts.
 * The service never invents a course and never hides a Firestore error
 * behind sample data: on a Firestore error the caller sees the error
 * (ErrorState + retry in the UI).
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { getFirebase } from './config'
import { courses as sampleCourses, GRADIENTS, type Course, type GradientKey } from '../data/sample'
import { fakeDelay } from '../lib/format'
import { hasPermission, type Role } from '../lib/roles'

export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface CourseChapterDoc {
  title: string
  lessonTitles: string[]
}

/** Firestore shape of a course document. */
export interface CourseDoc {
  slug: string
  title: string
  description: string
  categoryId: string
  instructorId: string
  price: number
  discountPrice?: number
  durationWeeks: number
  language: string
  level: CourseLevel
  levelBn: string
  lessonsCount: number
  studentsCount: number
  rating: number
  reviewsCount: number
  isFeatured: boolean
  isNew: boolean
  isFree: boolean
  hasPreview: boolean
  gradient: GradientKey
  status: CourseStatus
  chapters: CourseChapterDoc[]
  whatIncluded: string[]
  createdAt: unknown
  updatedAt: unknown
}

/** One lesson inside courses/{courseId}/lessons/{lessonId}. */
export interface LessonDoc {
  id: string
  courseId: string
  chapterIndex: number
  order: number
  title: string
  durationMin: number
  isPreview: boolean
  videoUrl: string | null
  createdAt: unknown
}

/** Flat lesson view used by the course-details page (Firestore or sample). */
export interface LessonView {
  id: string
  chapterIndex: number
  chapterTitle: string
  order: number
  title: string
  durationMin: number
  isPreview: boolean
}

export interface CourseCategoryDoc {
  name: string
  nameEn: string
  description: string
  gradient: GradientKey
  icon: string
  courseCount: number
  createdAt: unknown
}

const VALID_GRADIENTS = Object.keys(GRADIENTS) as GradientKey[]
const VALID_LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced']

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}
function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}
function asGradient(value: unknown): GradientKey {
  return typeof value === 'string' && (VALID_GRADIENTS as string[]).includes(value) ? (value as GradientKey) : 'blue'
}
function asLevel(value: unknown): CourseLevel {
  return typeof value === 'string' && (VALID_LEVELS as string[]).includes(value) ? (value as CourseLevel) : 'Beginner'
}
function asChapters(value: unknown): CourseChapterDoc[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      title: asString(c.title),
      lessonTitles: Array.isArray(c.lessonTitles) ? c.lessonTitles.filter((t): t is string => typeof t === 'string') : [],
    }))
    .filter((c) => c.title.length > 0)
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

/** Convert a Firestore course doc into the UI `Course` shape (defaults filled). */
export function courseFromDoc(id: string, data: Record<string, unknown>): Course {
  const chapters = asChapters(data.chapters)
  const lessons = asNumber(data.lessonsCount, chapters.reduce((n, c) => n + c.lessonTitles.length, 0))
  return {
    id,
    slug: asString(data.slug, id),
    title: asString(data.title, 'নামহীন কোর্স'),
    description: asString(data.description),
    categoryId: asString(data.categoryId, 'general'),
    instructorId: asString(data.instructorId),
    price: asNumber(data.price, 0),
    discountPrice: typeof data.discountPrice === 'number' ? data.discountPrice : undefined,
    durationWeeks: asNumber(data.durationWeeks, 4),
    language: asString(data.language, 'বাংলা'),
    level: asLevel(data.level),
    levelBn: asString(data.levelBn, 'প্রাথমিক'),
    lessons,
    students: asNumber(data.studentsCount, 0),
    rating: asNumber(data.rating, 0),
    reviews: asNumber(data.reviewsCount, 0),
    isFeatured: asBoolean(data.isFeatured),
    isNew: asBoolean(data.isNew),
    isFree: asNumber(data.price, 0) === 0 || asBoolean(data.isFree),
    hasPreview: asBoolean(data.hasPreview),
    gradient: asGradient(data.gradient),
    status: data.status === 'draft' ? 'draft' : data.status === 'archived' ? 'archived' : 'published',
    chapters: chapters.map((c) => ({ title: c.title, lessons: c.lessonTitles })),
  }
}

/** Convert a UI/sample `Course` into a Firestore document (for seeding / admin). */
export function courseToDoc(course: Course, status: CourseStatus = 'published'): Omit<CourseDoc, 'createdAt' | 'updatedAt'> {
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    categoryId: course.categoryId,
    instructorId: course.instructorId,
    price: course.price,
    discountPrice: course.discountPrice,
    durationWeeks: course.durationWeeks,
    language: course.language,
    level: course.level,
    levelBn: course.levelBn,
    lessonsCount: course.lessons,
    studentsCount: course.students,
    rating: course.rating,
    reviewsCount: course.reviews,
    isFeatured: course.isFeatured,
    isNew: course.isNew,
    isFree: course.isFree,
    hasPreview: course.hasPreview,
    gradient: course.gradient,
    status,
    chapters: course.chapters.map((c) => ({ title: c.title, lessonTitles: c.lessons })),
    whatIncluded: [
      `${course.lessons}টি ভিডিও লেসন`,
      'PDF নোট ও রিসোর্স',
      'মডেল টেস্ট ও সার্টিফিকেট',
      'যেকোনো ডিভাইসে শেখা যায়',
    ],
  }
}

/** Flatten a course's chapters into ordered lesson views (sample / fallback path). */
export function lessonsFromCourse(course: Course): LessonView[] {
  const views: LessonView[] = []
  course.chapters.forEach((chapter, chapterIndex) => {
    chapter.lessons.forEach((title, lessonIndex) => {
      views.push({
        id: `${course.id}-ch${chapterIndex}-l${lessonIndex}`,
        chapterIndex,
        chapterTitle: chapter.title,
        order: views.length,
        title,
        durationMin: 0,
        isPreview: title.startsWith('ফ্রি প্রিভিউ') || (course.hasPreview && chapterIndex === 0 && lessonIndex === 0),
      })
    })
  })
  return views
}

function lessonFromDoc(courseId: string, id: string, data: Record<string, unknown>): LessonDoc {
  return {
    id,
    courseId,
    chapterIndex: asNumber(data.chapterIndex, 0),
    order: asNumber(data.order, 0),
    title: asString(data.title, 'নামহীন লেসন'),
    durationMin: asNumber(data.durationMin, 0),
    isPreview: asBoolean(data.isPreview),
    videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : null,
    createdAt: data.createdAt ?? null,
  }
}

export function lessonToView(lesson: LessonDoc, chapterTitle: string): LessonView {
  return {
    id: lesson.id,
    chapterIndex: lesson.chapterIndex,
    chapterTitle,
    order: lesson.order,
    title: lesson.title,
    durationMin: lesson.durationMin,
    isPreview: lesson.isPreview,
  }
}

/** Published courses from Firestore, newest first (client-side sort — no composite index needed). */
export async function fetchCoursesFromFirestore(db: Firestore): Promise<Course[]> {
  const snap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'published')))
  const list = snap.docs.map((d) => ({ course: courseFromDoc(d.id, d.data()), created: timestampMillis(d.data().createdAt) }))
  list.sort((a, b) => b.created - a.created || a.course.title.localeCompare(b.course.title, 'bn'))
  return list.map((item) => item.course)
}

/** One published course by slug from Firestore; null when missing/unpublished. */
export async function fetchCourseBySlugFromFirestore(db: Firestore, slug: string): Promise<Course | null> {
  const snap = await getDocs(query(collection(db, 'courses'), where('slug', '==', slug), where('status', '==', 'published'), limit(1)))
  if (snap.empty) return null
  const d = snap.docs[0]
  return courseFromDoc(d.id, d.data())
}

/** Lessons of a course from the subcollection, in `order`. Empty when none exist yet. */
export async function fetchCourseLessons(db: Firestore, courseId: string): Promise<LessonDoc[]> {
  const snap = await getDocs(collection(db, 'courses', courseId, 'lessons'))
  const list = snap.docs.map((d) => lessonFromDoc(courseId, d.id, d.data()))
  list.sort((a, b) => a.order - b.order || a.chapterIndex - b.chapterIndex)
  return list
}

export interface CatalogueResult {
  courses: Course[]
  /** 'firestore' when read live, 'sample' when Firebase is not configured yet. */
  source: 'firestore' | 'sample'
}

/** Catalogue entry point: Firestore when configured, labelled sample data otherwise. */
export async function getCourses(): Promise<CatalogueResult> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(400)
    return { courses: sampleCourses, source: 'sample' }
  }
  const list = await fetchCoursesFromFirestore(fb.db)
  return { courses: list, source: 'firestore' }
}

/** Single-course entry point: Firestore when configured, sample lookup otherwise. */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    return sampleCourses.find((c) => c.slug === slug) ?? null
  }
  return fetchCourseBySlugFromFirestore(fb.db, slug)
}

/** Lessons entry point: Firestore subcollection when configured, chapter outline otherwise. */
export async function getCourseLessons(course: Course): Promise<LessonView[]> {
  const fb = getFirebase()
  if (!fb) return lessonsFromCourse(course)
  const docs = await fetchCourseLessons(fb.db, course.id)
  if (docs.length === 0) return lessonsFromCourse(course)
  return docs.map((d) => lessonToView(d, course.chapters[d.chapterIndex]?.title ?? `অধ্যায় ${d.chapterIndex + 1}`))
}

// ---- Teacher / admin course management (service layer; UI arrives with Phase 5/7) ----

export interface CourseCreateInput {
  slug: string
  title: string
  description: string
  categoryId: string
  price: number
  discountPrice?: number
  durationWeeks: number
  language: string
  level: CourseLevel
  levelBn: string
  isFeatured: boolean
  isNew: boolean
  hasPreview: boolean
  gradient: GradientKey
  chapters: CourseChapterDoc[]
}

/** UI-only check: can this role manage this course? Rules enforce it for real. */
export function canManageCourse(role: Role | null | undefined, instructorId: string, uid: string | null | undefined): boolean {
  if (!role || !uid) return false
  if (hasPermission(role, 'courses.manage')) return true
  return hasPermission(role, 'courses.assigned.manage') && instructorId === uid
}

/** Create a course as a draft (teacher: own courses only; admin: any). Rules enforce. */
export async function createCourse(db: Firestore, input: CourseCreateInput, instructorId: string): Promise<string> {
  const slug = input.slug.trim().toLowerCase()
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error('স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন চলবে।')
  if (!input.title.trim()) throw new Error('কোর্সের নাম দিতে হবে।')
  if (input.price < 0) throw new Error('দাম শূন্য বা তার বেশি হতে হবে।')
  const now = serverTimestamp()
  const ref = await addDoc(collection(db, 'courses'), {
    ...input,
    slug,
    instructorId,
    lessonsCount: input.chapters.reduce<number>((n, c) => n + c.lessonTitles.length, 0),
    studentsCount: 0,
    rating: 0,
    reviewsCount: 0,
    isFree: input.price === 0,
    status: 'draft',
    whatIncluded: ['ভিডিও লেসন', 'PDF নোট ও রিসোর্স', 'মডেল টেস্ট ও সার্টিফিকেট', 'যেকোনো ডিভাইসে শেখা যায়'],
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

/** Update a course (teacher: own courses only; admin: any). Never changes slug/owner here. */
export async function updateCourse(
  db: Firestore,
  courseId: string,
  patch: Partial<Omit<CourseDoc, 'slug' | 'instructorId' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId), { ...patch, updatedAt: serverTimestamp() })
}

/** Add one lesson to a course's subcollection. */
export async function addLesson(
  db: Firestore,
  courseId: string,
  lesson: { chapterIndex: number; order: number; title: string; durationMin?: number; isPreview?: boolean },
): Promise<string> {
  if (!lesson.title.trim()) throw new Error('লেসনের নাম দিতে হবে।')
  const ref = await addDoc(collection(db, 'courses', courseId, 'lessons'), {
    ...lesson,
    durationMin: lesson.durationMin ?? 0,
    isPreview: lesson.isPreview ?? false,
    videoUrl: null,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Publish / unpublish / archive a course (admin, or the owning teacher for draft→published). */
export async function setCourseStatus(db: Firestore, courseId: string, status: CourseStatus): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId), { status, updatedAt: serverTimestamp() })
}

/** Read one course doc by id (any status) — used by admin/teacher flows, not the public catalogue. */
export async function getCourseDocById(db: Firestore, courseId: string): Promise<Course | null> {
  const snap = await getDoc(doc(db, 'courses', courseId))
  if (!snap.exists()) return null
  return courseFromDoc(snap.id, snap.data())
}
