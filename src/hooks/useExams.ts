/**
 * Exam data hooks — Phase 6.
 *
 * The /exams list, the attempt page, the Results page and the student
 * dashboard teaser all read through these hooks, so Firestore (when
 * configured) and the labelled sample data (demo mode) never drift
 * apart in the UI.
 */
import { doc, getDoc } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { getFirebase } from '../firebase/config'
import {
  demoAttemptToDoc,
  examDocToView,
  examFromDoc,
  fetchExamQuestions,
  fetchTeacherExams,
  getAttempt,
  getDemoAttempt,
  getExamAttempts,
  getExams,
  getMyAttempts,
  readDemoAttempts,
  readDemoExams,
  sampleExamToView,
  sampleQuestionsToViews,
  type ExamAttemptDoc,
  type ExamQuestionView,
  type ExamsResult,
  type ExamView,
} from '../firebase/exams'
import { sampleExamQuestions, upcomingExams, type SampleExamQuestion } from '../data/sample'
import { useAuth } from '../contexts/AuthContext'

/** Exam list + source ('firestore' live, 'sample' in demo mode). */
export function useExams() {
  return useQuery<ExamsResult>({ queryKey: ['exams'], queryFn: getExams })
}

/** One teacher's exams (demo mode: the teacher's demo exams). */
export function useTeacherExams(teacherId: string | null | undefined) {
  const { user, configured } = useAuth()
  return useQuery<ExamView[]>({
    queryKey: ['teacher-exams', teacherId ?? 'demo'],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !teacherId) {
        return readDemoExams().map((e) => ({
          id: e.id,
          title: e.title,
          subject: e.subject,
          type: e.type,
          courseId: e.courseId,
          courseTitle: e.courseTitle,
          teacherId: '',
          teacherName: '',
          durationMin: e.durationMin,
          totalMarks: e.questions.reduce((n, q) => n + q.marks, 0),
          questionCount: e.questions.length,
          status: e.status,
          scheduledAt: e.scheduledAt,
          enrolledCount: null,
          source: 'demo' as const,
        }))
      }
      return fetchTeacherExams(fb.db, teacherId)
    },
    enabled: configured ? Boolean(user && teacherId) : true,
  })
}

export interface ExamAttemptData {
  exam: ExamView
  /** Student-safe questions (no answers in Firestore mode). */
  questions: ExamQuestionView[]
  /** Demo/sample mode only: the attempt is scored immediately in-browser. */
  scorable: boolean
  /** Sample questions WITH answers — demo scoring only, never a real exam. */
  sampleQuestions?: SampleExamQuestion[]
  existingAttempt: ExamAttemptDoc | null
}

/** Exam + questions + any existing attempt, for the attempt page. */
export function useExamAttemptData(examId: string | undefined) {
  const { user } = useAuth()
  return useQuery<ExamAttemptData | null>({
    queryKey: ['exam-attempt-data', examId, user?.uid ?? 'anon'],
    queryFn: async () => {
      if (!examId) return null
      const fb = getFirebase()
      if (!fb) {
        // Demo mode: sample exam or a teacher-created demo exam.
        const demo = readDemoExams().find((e) => e.id === examId)
        if (demo) {
          return {
            exam: {
              id: demo.id,
              title: demo.title,
              subject: demo.subject,
              type: demo.type,
              courseId: demo.courseId,
              courseTitle: demo.courseTitle,
              teacherId: '',
              teacherName: '',
              durationMin: demo.durationMin,
              totalMarks: demo.questions.reduce((n, q) => n + q.marks, 0),
              questionCount: demo.questions.length,
              status: demo.status,
              scheduledAt: demo.scheduledAt,
              enrolledCount: null,
              source: 'demo',
            },
            questions: sampleQuestionsToViews(demo.questions),
            scorable: true,
            sampleQuestions: demo.questions,
            existingAttempt: getDemoAttempt(examId) ? demoAttemptToDoc(getDemoAttempt(examId)!) : null,
          }
        }
        const item = upcomingExams.find((e) => e.id === examId)
        if (!item) return null
        const questions = sampleExamQuestions[item.id] ?? []
        return {
          exam: sampleExamToView(item),
          questions: sampleQuestionsToViews(questions),
          scorable: true,
          sampleQuestions: questions,
          existingAttempt: getDemoAttempt(examId) ? demoAttemptToDoc(getDemoAttempt(examId)!) : null,
        }
      }
      // Firestore mode: metadata + student-safe questions + existing attempt.
      const examSnap = await getDoc(doc(fb.db, 'exams', examId))
      if (!examSnap.exists()) return null
      const examDoc = examFromDoc(examSnap.id, examSnap.data())
      if (!examDoc) return null
      const [questions, existingAttempt] = await Promise.all([
        fetchExamQuestions(fb.db, examId),
        user ? getAttempt(fb.db, user.uid, examId) : Promise.resolve(null),
      ])
      return {
        exam: examDocToView(examDoc),
        questions,
        scorable: false,
        existingAttempt,
      }
    },
    enabled: Boolean(examId),
  })
}

/** The signed-in user's attempts (Firestore, or demo attempts in demo mode). */
export function useMyAttempts() {
  const { user, configured } = useAuth()
  return useQuery<ExamAttemptDoc[]>({
    queryKey: ['my-attempts', user?.uid ?? 'demo'],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !user) return readDemoAttempts().map(demoAttemptToDoc)
      return getMyAttempts(fb.db, user.uid)
    },
    enabled: configured ? Boolean(user) : true,
  })
}

/** Attempts of one exam (teacher/admin evaluation view). */
export function useExamAttempts(examId: string | null | undefined) {
  const { user, configured } = useAuth()
  return useQuery<ExamAttemptDoc[]>({
    queryKey: ['exam-attempts', examId],
    queryFn: async () => {
      if (!examId) return []
      const fb = getFirebase()
      if (!fb) return readDemoAttempts().filter((a) => a.examId === examId).map(demoAttemptToDoc)
      return getExamAttempts(fb.db, examId)
    },
    enabled: Boolean(examId) && (configured ? Boolean(user) : true),
  })
}
