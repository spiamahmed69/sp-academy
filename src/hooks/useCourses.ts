/**
 * Course + enrollment data hooks — Phase 3.
 *
 * Central wiring for the catalogue: the /courses list, course details,
 * free courses, dashboard and My Courses all read through these hooks, so
 * Firestore (when configured) and the labelled sample catalogue (demo mode)
 * never drift apart in the UI.
 */
import { useQuery } from '@tanstack/react-query'
import { getFirebase } from '../firebase/config'
import {
  getCourseBySlug as getCourseBySlugService,
  getCourseLessons,
  getCourses,
  type LessonView,
} from '../firebase/courses'
import { getMyEnrollments, getEnrollment, type EnrollmentDoc, type EnrollmentView } from '../firebase/enrollments'
import { getMyCertificates, type CertificateDoc } from '../firebase/certificates'
import { useAuth } from '../contexts/AuthContext'
import type { Course } from '../data/sample'

/** Catalogue: { courses, source } — source is 'firestore' live, 'sample' in demo mode. */
export function useCourses() {
  return useQuery({ queryKey: ['courses'], queryFn: getCourses })
}

/** One course by slug (null when missing/unpublished). */
export function useCourseBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: () => getCourseBySlugService(slug ?? ''),
    enabled: Boolean(slug),
  })
}

/** Lesson outline for a course (Firestore subcollection when configured, chapters otherwise). */
export function useCourseLessons(course: Course | null | undefined) {
  return useQuery<LessonView[]>({
    queryKey: ['course-lessons', course?.id],
    queryFn: () => getCourseLessons(course as Course),
    enabled: Boolean(course),
  })
}

/** The signed-in user's active enrollments, joined with course data. */
export function useMyEnrollments() {
  const { user, configured } = useAuth()
  return useQuery<EnrollmentView[]>({
    queryKey: ['my-enrollments', user?.uid],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !user) return []
      const { courses } = await getCourses()
      const byId = new Map(courses.map((c) => [c.id, c]))
      return getMyEnrollments(fb.db, user.uid, (courseId) => byId.get(courseId))
    },
    enabled: configured && Boolean(user),
  })
}

/** One enrollment for a course (null when not enrolled). Demo mode uses localStorage instead. */
export function useEnrollmentForCourse(course: Course | null | undefined) {
  const { user, configured } = useAuth()
  return useQuery<EnrollmentDoc | null>({
    queryKey: ['enrollment', user?.uid, course?.id],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !user || !course) return null
      return getEnrollment(fb.db, user.uid, course.id)
    },
    enabled: configured && Boolean(user) && Boolean(course),
  })
}

/** The signed-in user's certificates. Empty until exams (Phase 6) issue any. */
export function useMyCertificates() {
  const { user, configured } = useAuth()
  return useQuery<CertificateDoc[]>({
    queryKey: ['my-certificates', user?.uid],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !user) return []
      return getMyCertificates(fb.db, user.uid)
    },
    enabled: configured && Boolean(user),
  })
}
