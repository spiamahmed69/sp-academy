/**
 * Teacher data hooks — Phase 5.
 *
 * The teacher dashboard reads its courses and per-course enrollment stats
 * through these hooks. Firestore when configured (real counts), labelled
 * sample data in demo mode (the preview page badges it নমুনা).
 */
import { useQuery } from '@tanstack/react-query'
import { getFirebase } from '../firebase/config'
import {
  fetchCourseEnrollmentStats,
  getTeacherCourses,
  sampleCourseEnrollmentStat,
  type CourseEnrollmentStat,
  type TeacherCoursesResult,
} from '../firebase/teacherStats'
import { useAuth } from '../contexts/AuthContext'

/** The teacher's own courses + source. Demo mode: sample courses for t1. */
export function useTeacherCourses() {
  const { user, configured } = useAuth()
  return useQuery<TeacherCoursesResult>({
    queryKey: ['teacher-courses', user?.uid ?? 'demo'],
    queryFn: () => getTeacherCourses(configured ? (user?.uid ?? null) : null),
  })
}

/** Per-course enrollment stats for the given course ids. */
export function useCourseEnrollmentStats(courseIds: string[]) {
  const { configured } = useAuth()
  const key = [...courseIds].sort().join(',')
  return useQuery<CourseEnrollmentStat[]>({
    queryKey: ['course-enrollment-stats', key],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !configured) {
        const { courses } = await getTeacherCourses(null)
        return courses.filter((c) => courseIds.includes(c.id)).map(sampleCourseEnrollmentStat)
      }
      return fetchCourseEnrollmentStats(fb.db, courseIds)
    },
    enabled: courseIds.length > 0,
  })
}
