/**
 * Firestore seed helpers — Phase 3.
 *
 * Builds Firestore documents from the labelled sample catalogue so an ADMIN
 * can seed a fresh project (console / admin script). This module never runs
 * on its own and never writes from the public site — call `seedSampleCourses`
 * only after the Firebase project exists and the caller is an admin
 * (see docs/firebase-setup.md §8). Seeding is idempotent: existing docs are
 * left untouched.
 */
import { collection, doc, getDoc, getDocs, query, setDoc, where, type Firestore } from 'firebase/firestore'
import { books, categories, courses, type Book, type Course } from '../data/sample'
import { bookToDoc, type BookDoc } from './books'
import { courseToDoc, type CourseCategoryDoc, type LessonDoc } from './courses'

/** The 8 sample courses as Firestore docs (status 'published'). */
export function buildCourseSeedDocs(): { id: string; doc: Omit<import('./courses').CourseDoc, 'createdAt' | 'updatedAt'> }[] {
  return courses.map((course) => ({ id: course.id, doc: courseToDoc(course, 'published') }))
}

/** The 8 sample categories as Firestore docs. */
export function buildCategorySeedDocs(): { id: string; doc: Omit<CourseCategoryDoc, 'createdAt'> }[] {
  return categories.map((category) => ({
    id: category.id,
    doc: {
      name: category.name,
      nameEn: category.nameEn,
      description: category.description,
      gradient: category.gradient,
      icon: category.icon,
      courseCount: category.courseCount,
    },
  }))
}

/** Flatten a course's chapters into lesson seed docs (for the lessons subcollection). */
export function buildLessonSeedDocs(course: Course): Omit<LessonDoc, 'id' | 'createdAt'>[] {
  const lessons: Omit<LessonDoc, 'id' | 'createdAt'>[] = []
  course.chapters.forEach((chapter, chapterIndex) => {
    chapter.lessons.forEach((title, lessonIndex) => {
      lessons.push({
        courseId: course.id,
        chapterIndex,
        order: lessons.length,
        title,
        durationMin: 0,
        isPreview: title.startsWith('ফ্রি প্রিভিউ') || (course.hasPreview && chapterIndex === 0 && lessonIndex === 0),
        videoUrl: null,
      })
    })
  })
  return lessons
}

/** The 6 sample books as Firestore docs (status 'published'). */
export function buildBookSeedDocs(): { id: string; doc: Omit<BookDoc, 'createdAt' | 'updatedAt'> }[] {
  return books.map((book: Book) => ({ id: book.id, doc: bookToDoc(book, 'published') }))
}

/** Seed books only. Skips docs that already exist. */
export async function seedSampleBooks(db: Firestore): Promise<{ books: number }> {
  let bookCount = 0
  for (const { id, doc: bookDoc } of buildBookSeedDocs()) {
    const ref = doc(db, 'books', id)
    if ((await getDoc(ref)).exists()) continue
    await setDoc(ref, { ...bookDoc, createdAt: new Date(), updatedAt: new Date() })
    bookCount++
  }
  return { books: bookCount }
}

/** Seed courses + categories + their lesson outlines. Skips docs that already exist. */
export async function seedSampleCourses(db: Firestore): Promise<{ courses: number; categories: number; lessons: number }> {
  let courseCount = 0
  let categoryCount = 0
  let lessonCount = 0

  for (const { id, doc: courseDoc } of buildCourseSeedDocs()) {
    const ref = doc(db, 'courses', id)
    if ((await getDoc(ref)).exists()) continue
    await setDoc(ref, { ...courseDoc, createdAt: new Date(), updatedAt: new Date() })
    courseCount++
    const course = courses.find((c) => c.id === id)
    if (!course) continue
    const existingLessons = await getDocs(collection(db, 'courses', id, 'lessons'))
    if (existingLessons.empty) {
      for (const lesson of buildLessonSeedDocs(course)) {
        await setDoc(doc(collection(db, 'courses', id, 'lessons')), { ...lesson, createdAt: new Date() })
        lessonCount++
      }
    }
  }

  for (const { id, doc: categoryDoc } of buildCategorySeedDocs()) {
    const ref = doc(db, 'courseCategories', id)
    if ((await getDoc(ref)).exists()) continue
    await setDoc(ref, { ...categoryDoc, createdAt: new Date() })
    categoryCount++
  }

  return { courses: courseCount, categories: categoryCount, lessons: lessonCount }
}

/** Check whether the catalogue is already seeded (any published course exists). */
export async function isCatalogueSeeded(db: Firestore): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'published')))
  return !snap.empty
}
