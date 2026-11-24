/**
 * Live-class data hooks — Phase 5.
 *
 * The public /live-classes page and the student dashboard teaser read
 * through `useLiveClasses`, so Firestore (when configured) and the
 * labelled sample schedule (demo mode) never drift apart in the UI.
 */
import { useQuery } from '@tanstack/react-query'
import { getFirebase } from '../firebase/config'
import {
  fetchTeacherLiveClasses,
  getLiveClasses,
  type LiveClassesResult,
  type LiveClassView,
} from '../firebase/liveClasses'
import { useAuth } from '../contexts/AuthContext'

/** All live classes + their source ('firestore' live, 'sample' in demo mode). */
export function useLiveClasses() {
  return useQuery<LiveClassesResult>({ queryKey: ['live-classes'], queryFn: getLiveClasses })
}

/** One teacher's live classes. Demo mode: sample classes for that teacher. */
export function useTeacherLiveClasses(teacherId: string | null | undefined) {
  const { user, configured } = useAuth()
  return useQuery<LiveClassView[]>({
    queryKey: ['teacher-live-classes', teacherId ?? 'demo'],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !teacherId) {
        const { classes } = await getLiveClasses()
        return classes.filter((c) => c.teacherId === (teacherId ?? 't1'))
      }
      return fetchTeacherLiveClasses(fb.db, teacherId)
    },
    enabled: configured ? Boolean(user && teacherId) : Boolean(teacherId),
  })
}
