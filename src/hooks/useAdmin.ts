/**
 * Admin data hooks — Phase 7.
 *
 * The /admin page reads everything through these hooks: Firestore when
 * configured (real counts and lists), labelled sample data in demo mode.
 */
import { useQuery } from '@tanstack/react-query'
import {
  getAdminCourses,
  getAdminExams,
  getAdminLiveClasses,
  getAdminOverview,
  getAdminUsers,
  type AdminDataResult,
  type AdminOverviewStats,
} from '../firebase/admin'
import type { UserProfile } from '../firebase/profiles'
import type { ExamView } from '../firebase/exams'
import type { LiveClassView } from '../firebase/liveClasses'
import type { Course } from '../data/sample'

export function useAdminOverview() {
  return useQuery<AdminDataResult<AdminOverviewStats>>({ queryKey: ['admin-overview'], queryFn: getAdminOverview })
}

export function useAdminUsers() {
  return useQuery<AdminDataResult<UserProfile[]>>({ queryKey: ['admin-users'], queryFn: getAdminUsers })
}

export function useAdminCourses() {
  return useQuery<AdminDataResult<Course[]>>({ queryKey: ['admin-courses'], queryFn: getAdminCourses })
}

export function useAdminExams() {
  return useQuery<AdminDataResult<ExamView[]>>({ queryKey: ['admin-exams'], queryFn: getAdminExams })
}

export function useAdminLiveClasses() {
  return useQuery<AdminDataResult<LiveClassView[]>>({ queryKey: ['admin-live-classes'], queryFn: getAdminLiveClasses })
}
