/**
 * Exam system — Phase 6.
 *
 * Firestore collections:
 *   exams/{examId} — metadata ONLY, no questions, no answers:
 *     { title, subject, type: 'mcq' | 'chapter' | 'model' | 'practice',
 *       courseId, courseTitle, teacherId, teacherName, durationMin,
 *       totalMarks, questionCount, status: 'draft' | 'published',
 *       scheduledAt (Timestamp | null), createdAt, updatedAt }
 *   exams/{examId}/questions/{questionId} — question text + options + marks.
 *     NEVER contains correctAnswer: students read these during an attempt.
 *   examKeys/{examId} — { answers: { [questionId]: correctOptionIndex } }.
 *     Readable ONLY by the exam's teacher / an admin. The student client
 *     NEVER receives this document — that is the whole point.
 *   examAttempts/{uid}_{examId} — one attempt per student per exam:
 *     { userId, examId, examTitle, answers: { [questionId]: optionIndex },
 *       startedAt, submittedAt (serverTimestamp), status: 'in_progress' |
 *       'submitted' | 'evaluated', score, totalMarks, correctCount,
 *       wrongCount, skippedCount, perQuestion: { [qid]: 'correct' |
 *       'wrong' | 'skipped' }, evaluatedAt, evaluatedBy }
 *
 * How scoring works without leaking answers:
 * - The student submits answers only. The attempt stays 'submitted'
 *   (মূল্যায়ন চলছে) until a teacher/admin evaluates it — evaluation
 *   runs on the teacher's client, which CAN read examKeys, and writes
 *   only the score fields back. Full server-side auto-scoring arrives
 *   with the backend in Phase 10; until then the UI says so plainly.
 * - Demo / sample mode: the sample questions are openly labelled নমুনা
 *   content (answers included in the sample data, not a real exam), so a
 *   demo attempt is scored immediately in this browser and stored in
 *   localStorage, labelled ডেমো.
 *
 * Duplicate submissions: the attempt doc id is deterministic
 * (`{uid}_{examId}`) and Firestore `create` fails when the doc already
 * exists; the rules also reject a second create and reject any owner
 * update except in_progress → submitted. The client checks first too.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { getFirebase } from './config'
import {
  upcomingExams,
  type ExamItem,
  type SampleExamQuestion,
} from '../data/sample'
import { fakeDelay, toBanglaDigits } from '../lib/format'
import { hasPermission, type Role } from '../lib/roles'

export type ExamType = 'mcq' | 'chapter' | 'model' | 'practice'
export type ExamStatus = 'draft' | 'published'

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  mcq: 'MCQ পরীক্ষা',
  chapter: 'অধ্যায়ভিত্তিক',
  model: 'মডেল টেস্ট',
  practice: 'প্র্যাকটিস টেস্ট',
}

export function isExamType(value: unknown): value is ExamType {
  return value === 'mcq' || value === 'chapter' || value === 'model' || value === 'practice'
}

/** Metadata doc — no questions, no answers. */
export interface ExamDoc {
  id: string
  title: string
  subject: string
  type: ExamType
  courseId: string | null
  courseTitle: string
  teacherId: string
  teacherName: string
  durationMin: number
  totalMarks: number
  questionCount: number
  status: ExamStatus
  scheduledAt: unknown
  createdAt: unknown
  updatedAt: unknown
}

/** One question as the STUDENT sees it — text + options + marks, never the answer. */
export interface ExamQuestionView {
  id: string
  text: string
  options: string[]
  marks: number
  order: number
}

/** One question as the TEACHER sees it — includes the correct option index. */
export interface ExamQuestionWithKey extends ExamQuestionView {
  correctIndex: number
}

/** Exam as shown in lists. */
export interface ExamView {
  id: string
  title: string
  subject: string
  type: ExamType
  courseId: string | null
  courseTitle: string
  teacherId: string
  teacherName: string
  durationMin: number
  totalMarks: number
  questionCount: number
  status: ExamStatus
  /** ISO string, or null when no fixed schedule. */
  scheduledAt: string | null
  /** Null when unknown — the UI must never invent an enrollment count. */
  enrolledCount: number | null
  source: 'firestore' | 'sample' | 'demo'
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluated'
export type PerQuestionResult = 'correct' | 'wrong' | 'skipped'

export interface ExamAttemptDoc {
  id: string
  userId: string
  examId: string
  examTitle: string
  answers: Record<string, number>
  startedAt: unknown
  submittedAt: unknown
  status: AttemptStatus
  score: number | null
  totalMarks: number
  correctCount: number | null
  wrongCount: number | null
  skippedCount: number | null
  perQuestion: Record<string, PerQuestionResult>
  evaluatedAt: unknown
  evaluatedBy: string | null
  /** 'demo' when stored in this browser only, never synced. */
  source: 'firestore' | 'demo'
}

/** Deterministic attempt id — one attempt per student per exam, by construction. */
export function attemptDocId(uid: string, examId: string): string {
  return `${uid}_${examId}`
}

/** Milliseconds left on the timer; never below 0. */
export function computeRemainingMs(startedAtMs: number, durationMin: number, nowMs: number): number {
  if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return Math.max(0, durationMin) * 60_000
  return Math.max(0, startedAtMs + Math.max(0, durationMin) * 60_000 - nowMs)
}

/** "mm:ss" countdown with Bengali digits. */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return toBanglaDigits(`${minutes}:${String(seconds).padStart(2, '0')}`)
}

/** Pure scoring: answers + keys + question marks → score + per-question results. */
export function scoreAttempt(
  answers: Record<string, number>,
  questions: Pick<ExamQuestionView, 'id' | 'marks'>[],
  keys: Record<string, number>,
): {
  score: number
  totalMarks: number
  correctCount: number
  wrongCount: number
  skippedCount: number
  perQuestion: Record<string, PerQuestionResult>
} {
  let score = 0
  let totalMarks = 0
  let correctCount = 0
  let wrongCount = 0
  let skippedCount = 0
  const perQuestion: Record<string, PerQuestionResult> = {}
  for (const q of questions) {
    totalMarks += q.marks
    const given = answers[q.id]
    if (given === undefined || given === null || !Number.isInteger(given)) {
      skippedCount += 1
      perQuestion[q.id] = 'skipped'
    } else if (keys[q.id] !== undefined && given === keys[q.id]) {
      correctCount += 1
      score += q.marks
      perQuestion[q.id] = 'correct'
    } else {
      wrongCount += 1
      perQuestion[q.id] = 'wrong'
    }
  }
  return { score, totalMarks, correctCount, wrongCount, skippedCount, perQuestion }
}

/** Timestamp / ISO / Date → millis, 0 when unreadable. */
export function timestampMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: unknown }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  if (value instanceof Date) return value.getTime()
  return 0
}

/** 'upcoming' (scheduled in the future) | 'open' | 'closed' (window passed). */
export type ExamPhase = 'upcoming' | 'open' | 'closed'

export function examPhase(view: Pick<ExamView, 'status' | 'scheduledAt' | 'durationMin'>, now = Date.now()): ExamPhase {
  if (view.status !== 'published') return 'upcoming'
  if (!view.scheduledAt) return 'open'
  const start = Date.parse(view.scheduledAt)
  if (Number.isNaN(start)) return 'open'
  if (now < start) return 'upcoming'
  if (now > start + Math.max(0, view.durationMin) * 60_000) return 'closed'
  return 'open'
}

/** May the student start (or resume) this exam now? Drafts and closed exams: no. */
export function isExamOpen(view: Pick<ExamView, 'status' | 'scheduledAt' | 'durationMin'>, now = Date.now()): boolean {
  return examPhase(view, now) === 'open'
}

/** Pure parser: malformed exam docs never crash the page, they are skipped. */
export function examFromDoc(id: string, data: Record<string, unknown>): ExamDoc | null {
  if (typeof data.title !== 'string' || !data.title.trim()) return null
  if (typeof data.teacherId !== 'string' || !data.teacherId) return null
  const durationMin = typeof data.durationMin === 'number' && Number.isFinite(data.durationMin) ? data.durationMin : 0
  if (durationMin <= 0) return null
  return {
    id,
    title: data.title.trim(),
    subject: typeof data.subject === 'string' ? data.subject : '',
    type: isExamType(data.type) ? data.type : 'mcq',
    courseId: typeof data.courseId === 'string' && data.courseId ? data.courseId : null,
    courseTitle: typeof data.courseTitle === 'string' ? data.courseTitle : '',
    teacherId: data.teacherId,
    teacherName: typeof data.teacherName === 'string' && data.teacherName ? data.teacherName : 'শিক্ষক',
    durationMin,
    totalMarks: typeof data.totalMarks === 'number' && Number.isFinite(data.totalMarks) ? data.totalMarks : 0,
    questionCount: typeof data.questionCount === 'number' && Number.isFinite(data.questionCount) ? data.questionCount : 0,
    status: data.status === 'published' ? 'published' : 'draft',
    scheduledAt: data.scheduledAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

export function examDocToView(doc: ExamDoc): ExamView {
  const start = timestampMillis(doc.scheduledAt)
  return {
    id: doc.id,
    title: doc.title,
    subject: doc.subject,
    type: doc.type,
    courseId: doc.courseId,
    courseTitle: doc.courseTitle,
    teacherId: doc.teacherId,
    teacherName: doc.teacherName,
    durationMin: doc.durationMin,
    totalMarks: doc.totalMarks,
    questionCount: doc.questionCount,
    status: doc.status,
    scheduledAt: start > 0 ? new Date(start).toISOString() : null,
    enrolledCount: null,
    source: 'firestore',
  }
}

/** Sample catalogue item → view. Sample counts stay labelled নমুনা in the UI. */
export function sampleExamToView(item: ExamItem): ExamView {
  return {
    id: item.id,
    title: item.title,
    subject: item.subject,
    type: item.type === 'পূর্ণাঙ্গ' || item.type === 'মডেল টেস্ট' ? 'model' : item.type === 'অধ্যায়ভিত্তিক' ? 'chapter' : 'mcq',
    courseId: null,
    courseTitle: '',
    teacherId: '',
    teacherName: '',
    durationMin: item.durationMin,
    totalMarks: item.marks,
    questionCount: item.questions,
    status: 'published',
    scheduledAt: item.date ? new Date(`${item.date}T00:00:00+06:00`).toISOString() : null,
    enrolledCount: item.enrolled,
    source: 'sample',
  }
}

/** Sample questions → student-safe views (answers stripped here too, for uniformity). */
export function sampleQuestionsToViews(questions: SampleExamQuestion[]): ExamQuestionView[] {
  return [...questions]
    .sort((a, b) => a.order - b.order)
    .map((q) => ({ id: q.id, text: q.text, options: [...q.options], marks: q.marks, order: q.order }))
}

/** Sample questions → answer-key map (demo scoring only — sample content, openly labelled). */
export function sampleQuestionsToKeys(questions: SampleExamQuestion[]): Record<string, number> {
  const keys: Record<string, number> = {}
  for (const q of questions) keys[q.id] = q.correctIndex
  return keys
}

/** Pure parser for a question doc (student-safe fields only). */
export function questionFromDoc(id: string, data: Record<string, unknown>): ExamQuestionView | null {
  if (typeof data.text !== 'string' || !data.text.trim()) return null
  if (!Array.isArray(data.options) || data.options.length !== 4) return null
  if (!data.options.every((o) => typeof o === 'string' && o.trim())) return null
  return {
    id,
    text: data.text.trim(),
    options: data.options as string[],
    marks: typeof data.marks === 'number' && Number.isFinite(data.marks) && data.marks > 0 ? data.marks : 1,
    order: typeof data.order === 'number' && Number.isFinite(data.order) ? data.order : 0,
  }
}

// ---- Exam create / edit input + validation (shared by form and service) ----

export interface ExamQuestionInput {
  text: string
  options: [string, string, string, string]
  correctIndex: number
  marks: number
}

export interface ExamCreateInput {
  title: string
  subject: string
  type: ExamType
  courseId?: string | null
  courseTitle?: string
  durationMin: number
  /** ISO string from a datetime-local input, or '' for no fixed schedule. */
  scheduledAt: string
  questions: ExamQuestionInput[]
}

/**
 * Pure validation for an exam. Returns Bengali error messages (empty = valid).
 * The service and the form share this, so the rules never drift apart.
 */
export function validateExamInput(input: ExamCreateInput): string[] {
  const errors: string[] = []
  if (!input.title.trim() || input.title.trim().length < 3) errors.push('পরীক্ষার নাম কমপক্ষে ৩ অক্ষরের হতে হবে।')
  if (!input.subject.trim()) errors.push('বিষয় দিতে হবে।')
  if (!isExamType(input.type)) errors.push('পরীক্ষার ধরন সঠিক নয়।')
  if (!Number.isFinite(input.durationMin) || input.durationMin < 5 || input.durationMin > 480) {
    errors.push('পরীক্ষার সময়সীমা ৫ থেকে ৪৮০ মিনিটের মধ্যে হতে হবে।')
  }
  if (input.scheduledAt && Number.isNaN(Date.parse(input.scheduledAt))) {
    errors.push('পরীক্ষা শুরুর সঠিক তারিখ ও সময় দিন।')
  }
  if (!Array.isArray(input.questions) || input.questions.length < 1) {
    errors.push('কমপক্ষে ১টি প্রশ্ন দিতে হবে।')
  } else if (input.questions.length > 100) {
    errors.push('এক পরীক্ষায় সর্বোচ্চ ১০০টি প্রশ্ন দেওয়া যাবে।')
  } else {
    input.questions.forEach((q, i) => {
      const n = i + 1
      if (!q.text.trim()) errors.push(`প্রশ্ন ${toBanglaDigits(n)}: প্রশ্নের লেখা দিতে হবে।`)
      if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !o.trim())) {
        errors.push(`প্রশ্ন ${toBanglaDigits(n)}: চারটি অপশনই দিতে হবে।`)
      }
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
        errors.push(`প্রশ্ন ${toBanglaDigits(n)}: সঠিক উত্তর কোনটি তা বেছে নিন।`)
      }
      if (!Number.isFinite(q.marks) || q.marks < 1 || q.marks > 100) {
        errors.push(`প্রশ্ন ${toBanglaDigits(n)}: নম্বর ১ থেকে ১০০-এর মধ্যে হতে হবে।`)
      }
    })
  }
  return errors
}

/** Total marks = sum of question marks. */
export function examTotalMarks(questions: Pick<ExamQuestionInput, 'marks'>[]): number {
  return questions.reduce((n, q) => n + (Number.isFinite(q.marks) ? q.marks : 0), 0)
}

/** UI-only check: can this role create / manage exams? Rules enforce it for real. */
export function canManageExams(role: Role | null | undefined): boolean {
  if (!role) return false
  return hasPermission(role, 'exams.manage') || hasPermission(role, 'exams.assigned.create')
}

// ---- Firestore reads ----

/** All exams from Firestore, soonest scheduled first. */
export async function fetchExamsFromFirestore(db: Firestore): Promise<ExamView[]> {
  const snap = await getDocs(collection(db, 'exams'))
  const list = snap.docs
    .map((d) => examFromDoc(d.id, d.data()))
    .filter((d): d is ExamDoc => d !== null)
    .map(examDocToView)
  list.sort((a, b) => {
    const aTime = a.scheduledAt ? Date.parse(a.scheduledAt) : 0
    const bTime = b.scheduledAt ? Date.parse(b.scheduledAt) : 0
    return aTime - bTime
  })
  return list
}

/** One teacher's exams (admins read all via fetchExamsFromFirestore). */
export async function fetchTeacherExams(db: Firestore, teacherId: string): Promise<ExamView[]> {
  const snap = await getDocs(query(collection(db, 'exams'), where('teacherId', '==', teacherId)))
  const list = snap.docs
    .map((d) => examFromDoc(d.id, d.data()))
    .filter((d): d is ExamDoc => d !== null)
    .map(examDocToView)
  list.sort((a, b) => {
    const aTime = a.scheduledAt ? Date.parse(a.scheduledAt) : 0
    const bTime = b.scheduledAt ? Date.parse(b.scheduledAt) : 0
    return aTime - bTime
  })
  return list
}

/** Questions of an exam, student-safe (no answers — the subcollection has none). */
export async function fetchExamQuestions(db: Firestore, examId: string): Promise<ExamQuestionView[]> {
  const snap = await getDocs(collection(db, 'exams', examId, 'questions'))
  return snap.docs
    .map((d) => questionFromDoc(d.id, d.data()))
    .filter((q): q is ExamQuestionView => q !== null)
    .sort((a, b) => a.order - b.order)
}

/** Answer keys — teacher/admin only (rules enforce). Never call from student UI. */
export async function fetchExamKeys(db: Firestore, examId: string): Promise<Record<string, number>> {
  const snap = await getDoc(doc(db, 'examKeys', examId))
  if (!snap.exists()) return {}
  const data = snap.data()
  const answers = (data.answers ?? {}) as Record<string, unknown>
  const keys: Record<string, number> = {}
  for (const [qid, value] of Object.entries(answers)) {
    if (typeof value === 'number' && Number.isInteger(value)) keys[qid] = value
  }
  return keys
}

/** Questions WITH keys — teacher/admin only (manage page). */
export async function fetchExamQuestionsWithKeys(db: Firestore, examId: string): Promise<ExamQuestionWithKey[]> {
  const [questions, keys] = await Promise.all([fetchExamQuestions(db, examId), fetchExamKeys(db, examId)])
  return questions.map((q) => ({ ...q, correctIndex: keys[q.id] ?? 0 }))
}

export interface ExamsResult {
  exams: ExamView[]
  /** 'firestore' when read live, 'sample' when Firebase is not configured yet. */
  source: 'firestore' | 'sample'
}

/** Entry point for the /exams list: Firestore when configured, labelled sample otherwise. */
export async function getExams(): Promise<ExamsResult> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    const demoExams = readDemoExams().map(demoExamToView)
    return { exams: [...demoExams, ...upcomingExams.map(sampleExamToView)], source: 'sample' }
  }
  const exams = await fetchExamsFromFirestore(fb.db)
  return { exams, source: 'firestore' }
}

// ---- Attempts (Firestore) ----

function attemptFromDoc(id: string, data: Record<string, unknown>): ExamAttemptDoc | null {
  if (typeof data.userId !== 'string' || !data.userId) return null
  if (typeof data.examId !== 'string' || !data.examId) return null
  const answers: Record<string, number> = {}
  if (data.answers && typeof data.answers === 'object') {
    for (const [qid, value] of Object.entries(data.answers as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isInteger(value)) answers[qid] = value
    }
  }
  const perQuestion: Record<string, PerQuestionResult> = {}
  if (data.perQuestion && typeof data.perQuestion === 'object') {
    for (const [qid, value] of Object.entries(data.perQuestion as Record<string, unknown>)) {
      if (value === 'correct' || value === 'wrong' || value === 'skipped') perQuestion[qid] = value
    }
  }
  const status = data.status === 'evaluated' ? 'evaluated' : data.status === 'submitted' ? 'submitted' : 'in_progress'
  return {
    id,
    userId: data.userId,
    examId: data.examId,
    examTitle: typeof data.examTitle === 'string' ? data.examTitle : '',
    answers,
    startedAt: data.startedAt ?? null,
    submittedAt: data.submittedAt ?? null,
    status,
    score: typeof data.score === 'number' ? data.score : null,
    totalMarks: typeof data.totalMarks === 'number' ? data.totalMarks : 0,
    correctCount: typeof data.correctCount === 'number' ? data.correctCount : null,
    wrongCount: typeof data.wrongCount === 'number' ? data.wrongCount : null,
    skippedCount: typeof data.skippedCount === 'number' ? data.skippedCount : null,
    perQuestion,
    evaluatedAt: data.evaluatedAt ?? null,
    evaluatedBy: typeof data.evaluatedBy === 'string' ? data.evaluatedBy : null,
    source: 'firestore',
  }
}

/** One attempt, or null when the student never started this exam. */
export async function getAttempt(db: Firestore, uid: string, examId: string): Promise<ExamAttemptDoc | null> {
  const snap = await getDoc(doc(db, 'examAttempts', attemptDocId(uid, examId)))
  if (!snap.exists()) return null
  return attemptFromDoc(snap.id, snap.data())
}

/** All attempts of one student, newest submitted first. */
export async function getMyAttempts(db: Firestore, uid: string): Promise<ExamAttemptDoc[]> {
  const snap = await getDocs(query(collection(db, 'examAttempts'), where('userId', '==', uid)))
  const list = snap.docs
    .map((d) => attemptFromDoc(d.id, d.data()))
    .filter((a): a is ExamAttemptDoc => a !== null)
  list.sort((a, b) => timestampMillis(b.submittedAt) - timestampMillis(a.submittedAt))
  return list
}

/** All attempts of one exam (teacher/admin view, for evaluation). */
export async function getExamAttempts(db: Firestore, examId: string): Promise<ExamAttemptDoc[]> {
  const snap = await getDocs(query(collection(db, 'examAttempts'), where('examId', '==', examId)))
  const list = snap.docs
    .map((d) => attemptFromDoc(d.id, d.data()))
    .filter((a): a is ExamAttemptDoc => a !== null)
  list.sort((a, b) => timestampMillis(b.submittedAt) - timestampMillis(a.submittedAt))
  return list
}

/**
 * Start an attempt: creates examAttempts/{uid}_{examId} with status
 * 'in_progress'. Throws when an attempt already exists (one attempt only).
 * Returns the server start time in millis for the countdown timer.
 */
export async function startExamAttempt(db: Firestore, uid: string, exam: ExamView): Promise<number> {
  const ref = doc(db, 'examAttempts', attemptDocId(uid, exam.id))
  const startedAtMs = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists()) throw new Error('এই পরীক্ষাটি ইতিমধ্যে দেওয়া হয়েছে — একবারই দেওয়া যায়।')
    tx.set(ref, {
      userId: uid,
      examId: exam.id,
      examTitle: exam.title,
      answers: {},
      startedAt: serverTimestamp(),
      submittedAt: null,
      status: 'in_progress',
      score: null,
      totalMarks: exam.totalMarks,
      correctCount: null,
      wrongCount: null,
      skippedCount: null,
      perQuestion: {},
      evaluatedAt: null,
      evaluatedBy: null,
    })
    return Date.now()
  })
  return startedAtMs
}

/**
 * Submit answers. Only an in_progress attempt of the owner may submit
 * (rules enforce); after this the attempt can never be edited by the student.
 * Returns the updated attempt — status 'submitted', score still null:
 * evaluation happens separately (teacher) or with the backend (Phase 10).
 */
export async function submitExamAttempt(
  db: Firestore,
  uid: string,
  examId: string,
  answers: Record<string, number>,
): Promise<ExamAttemptDoc> {
  const ref = doc(db, 'examAttempts', attemptDocId(uid, examId))
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('পরীক্ষা শুরু করা হয়নি — আগে শুরু করুন।')
    if (snap.data().status !== 'in_progress') throw new Error('এই পরীক্ষাটি ইতিমধ্যে জমা দেওয়া হয়েছে।')
    tx.update(ref, {
      answers,
      status: 'submitted',
      submittedAt: serverTimestamp(),
    })
  })
  const after = await getAttempt(db, uid, examId)
  if (!after) throw new Error('জমা দেওয়ার পর ফলাফল পড়া যায়নি। আবার চেষ্টা করুন।')
  return after
}

/**
 * Evaluate a submitted attempt (teacher/admin only — reads examKeys, which
 * the student client can never read). Writes score + per-question results.
 */
export async function evaluateExamAttempt(
  db: Firestore,
  examId: string,
  attemptId: string,
  evaluatorUid: string,
): Promise<ExamAttemptDoc> {
  const [questions, keys] = await Promise.all([fetchExamQuestions(db, examId), fetchExamKeys(db, examId)])
  const ref = doc(db, 'examAttempts', attemptId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('এই প্রচেষ্টাটি পাওয়া যায়নি।')
    const data = snap.data()
    if (data.status === 'evaluated') throw new Error('এটি ইতিমধ্যে মূল্যায়ন করা হয়েছে।')
    if (data.status !== 'submitted') throw new Error('এখনো জমা দেওয়া হয়নি — মূল্যায়ন করা যাবে না।')
    const scored = scoreAttempt((data.answers ?? {}) as Record<string, number>, questions, keys)
    tx.update(ref, {
      status: 'evaluated',
      score: scored.score,
      totalMarks: scored.totalMarks,
      correctCount: scored.correctCount,
      wrongCount: scored.wrongCount,
      skippedCount: scored.skippedCount,
      perQuestion: scored.perQuestion,
      evaluatedAt: serverTimestamp(),
      evaluatedBy: evaluatorUid,
    })
  })
  const after = await getDoc(ref)
  if (!after.exists()) throw new Error('মূল্যায়নের পর ফলাফল পড়া যায়নি।')
  return attemptFromDoc(after.id, after.data()) as ExamAttemptDoc
}

// ---- Exam writes (teacher/admin only; rules enforce) ----

/** Create an exam as 'draft' with its questions + answer keys. Returns the exam id. */
export async function createExam(
  db: Firestore,
  input: ExamCreateInput,
  teacher: { uid: string; displayName: string },
): Promise<string> {
  const errors = validateExamInput(input)
  if (errors.length > 0) throw new Error(errors[0])
  const totalMarks = examTotalMarks(input.questions)
  const ref = await addDoc(collection(db, 'exams'), {
    title: input.title.trim(),
    subject: input.subject.trim(),
    type: input.type,
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? '',
    teacherId: teacher.uid,
    teacherName: teacher.displayName || 'শিক্ষক',
    durationMin: input.durationMin,
    totalMarks,
    questionCount: input.questions.length,
    status: 'draft',
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const batch = writeBatch(db)
  const keys: Record<string, number> = {}
  input.questions.forEach((q, i) => {
    const qRef = doc(collection(db, 'exams', ref.id, 'questions'))
    keys[qRef.id] = q.correctIndex
    batch.set(qRef, {
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
      marks: q.marks,
      order: i,
    })
  })
  batch.set(doc(db, 'examKeys', ref.id), { answers: keys, updatedAt: serverTimestamp() })
  await batch.commit()
  return ref.id
}

/** Update an exam's metadata + replace its questions and keys (draft or published). */
export async function updateExam(db: Firestore, examId: string, input: ExamCreateInput): Promise<void> {
  const errors = validateExamInput(input)
  if (errors.length > 0) throw new Error(errors[0])
  const totalMarks = examTotalMarks(input.questions)
  const batch = writeBatch(db)
  batch.update(doc(db, 'exams', examId), {
    title: input.title.trim(),
    subject: input.subject.trim(),
    type: input.type,
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? '',
    durationMin: input.durationMin,
    totalMarks,
    questionCount: input.questions.length,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    updatedAt: serverTimestamp(),
  })
  const oldQuestions = await getDocs(collection(db, 'exams', examId, 'questions'))
  for (const d of oldQuestions.docs) batch.delete(d.ref)
  const keys: Record<string, number> = {}
  input.questions.forEach((q, i) => {
    const qRef = doc(collection(db, 'exams', examId, 'questions'))
    keys[qRef.id] = q.correctIndex
    batch.set(qRef, {
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
      marks: q.marks,
      order: i,
    })
  })
  batch.set(doc(db, 'examKeys', examId), { answers: keys, updatedAt: serverTimestamp() })
  await batch.commit()
}

/** Publish a draft or unpublish back to draft. */
export async function setExamStatus(db: Firestore, examId: string, status: ExamStatus): Promise<void> {
  await updateDoc(doc(db, 'exams', examId), { status, updatedAt: serverTimestamp() })
}

/** Delete an exam + its questions + its keys. Attempts stay as history. */
export async function deleteExam(db: Firestore, examId: string): Promise<void> {
  const batch = writeBatch(db)
  const questions = await getDocs(collection(db, 'exams', examId, 'questions'))
  for (const d of questions.docs) batch.delete(d.ref)
  batch.delete(doc(db, 'examKeys', examId))
  batch.delete(doc(db, 'exams', examId))
  await batch.commit()
}

// ---- Demo mode: localStorage exams + attempts (this browser only, clearly labelled) ----

export const DEMO_EXAMS_KEY = 'sp-academy-demo-exams-v1'
export const DEMO_ATTEMPTS_KEY = 'sp-academy-demo-exam-attempts-v1'

export interface DemoExam {
  id: string
  title: string
  subject: string
  type: ExamType
  courseId: string | null
  courseTitle: string
  durationMin: number
  scheduledAt: string | null
  status: ExamStatus
  questions: SampleExamQuestion[]
}

export interface DemoAttempt {
  examId: string
  examTitle: string
  answers: Record<string, number>
  startedAt: string
  submittedAt: string
  status: 'evaluated'
  score: number
  totalMarks: number
  correctCount: number
  wrongCount: number
  skippedCount: number
  perQuestion: Record<string, PerQuestionResult>
}

function readDemoRaw(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeDemoRaw(key: string, value: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage full / blocked — demo data just won't persist.
  }
}

/** Pure parser: malformed / foreign data never crashes the page, it is ignored. */
export function parseDemoExams(raw: unknown): DemoExam[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        const questions = Array.isArray(item.questions)
          ? (item.questions as Record<string, unknown>[])
              .filter((q) => typeof q === 'object' && q !== null && typeof q.text === 'string' && Array.isArray(q.options) && q.options.length === 4)
              .map((q, i) => ({
                id: typeof q.id === 'string' ? q.id : `q${i}`,
                text: q.text as string,
                options: (q.options as unknown[]).map((o) => String(o)),
                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                marks: typeof q.marks === 'number' ? q.marks : 1,
                order: typeof q.order === 'number' ? q.order : i,
              }))
          : []
        return {
          id: typeof item.id === 'string' ? item.id : '',
          title: typeof item.title === 'string' ? item.title : '',
          subject: typeof item.subject === 'string' ? item.subject : '',
          type: isExamType(item.type) ? item.type : 'mcq',
          courseId: typeof item.courseId === 'string' ? item.courseId : null,
          courseTitle: typeof item.courseTitle === 'string' ? item.courseTitle : '',
          durationMin: typeof item.durationMin === 'number' ? item.durationMin : 30,
          scheduledAt: typeof item.scheduledAt === 'string' ? item.scheduledAt : null,
          status: (item.status === 'published' ? 'published' : 'draft') as ExamStatus,
          questions,
        }
      })
      .filter((e) => e.id && e.title)
  } catch {
    return []
  }
}

export function readDemoExams(): DemoExam[] {
  return parseDemoExams(readDemoRaw(DEMO_EXAMS_KEY))
}

export function saveDemoExam(input: ExamCreateInput): DemoExam {
  const list = readDemoExams()
  const exam: DemoExam = {
    id: `demo_${Date.now()}`,
    title: input.title.trim(),
    subject: input.subject.trim(),
    type: input.type,
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? '',
    durationMin: input.durationMin,
    scheduledAt: input.scheduledAt || null,
    status: 'draft',
    questions: input.questions.map((q, i) => ({
      id: `q${i + 1}`,
      text: q.text.trim(),
      options: [...q.options],
      correctIndex: q.correctIndex,
      marks: q.marks,
      order: i,
    })),
  }
  writeDemoRaw(DEMO_EXAMS_KEY, JSON.stringify([...list, exam]))
  return exam
}

export function updateDemoExam(examId: string, input: ExamCreateInput): DemoExam | null {
  const list = readDemoExams()
  const idx = list.findIndex((e) => e.id === examId)
  if (idx < 0) return null
  const updated: DemoExam = {
    ...list[idx],
    title: input.title.trim(),
    subject: input.subject.trim(),
    type: input.type,
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? '',
    durationMin: input.durationMin,
    scheduledAt: input.scheduledAt || null,
    questions: input.questions.map((q, i) => ({
      id: `q${i + 1}`,
      text: q.text.trim(),
      options: [...q.options],
      correctIndex: q.correctIndex,
      marks: q.marks,
      order: i,
    })),
  }
  list[idx] = updated
  writeDemoRaw(DEMO_EXAMS_KEY, JSON.stringify(list))
  return updated
}

export function setDemoExamStatus(examId: string, status: ExamStatus): void {
  const list = readDemoExams().map((e) => (e.id === examId ? { ...e, status } : e))
  writeDemoRaw(DEMO_EXAMS_KEY, JSON.stringify(list))
}

export function deleteDemoExam(examId: string): void {
  writeDemoRaw(DEMO_EXAMS_KEY, JSON.stringify(readDemoExams().filter((e) => e.id !== examId)))
}

export function demoExamToView(exam: DemoExam): ExamView {
  return {
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    type: exam.type,
    courseId: exam.courseId,
    courseTitle: exam.courseTitle,
    teacherId: '',
    teacherName: '',
    durationMin: exam.durationMin,
    totalMarks: examTotalMarks(exam.questions),
    questionCount: exam.questions.length,
    status: exam.status,
    scheduledAt: exam.scheduledAt,
    enrolledCount: null,
    source: 'demo',
  }
}

/** Pure parser for demo attempts. */
export function parseDemoAttempts(raw: unknown): DemoAttempt[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        examId: typeof item.examId === 'string' ? item.examId : '',
        examTitle: typeof item.examTitle === 'string' ? item.examTitle : '',
        answers: (item.answers ?? {}) as Record<string, number>,
        startedAt: typeof item.startedAt === 'string' ? item.startedAt : new Date().toISOString(),
        submittedAt: typeof item.submittedAt === 'string' ? item.submittedAt : new Date().toISOString(),
        status: 'evaluated' as const,
        score: typeof item.score === 'number' ? item.score : 0,
        totalMarks: typeof item.totalMarks === 'number' ? item.totalMarks : 0,
        correctCount: typeof item.correctCount === 'number' ? item.correctCount : 0,
        wrongCount: typeof item.wrongCount === 'number' ? item.wrongCount : 0,
        skippedCount: typeof item.skippedCount === 'number' ? item.skippedCount : 0,
        perQuestion: (item.perQuestion ?? {}) as Record<string, PerQuestionResult>,
      }))
      .filter((a) => a.examId && a.examTitle)
  } catch {
    return []
  }
}

export function readDemoAttempts(): DemoAttempt[] {
  return parseDemoAttempts(readDemoRaw(DEMO_ATTEMPTS_KEY))
}

export function getDemoAttempt(examId: string): DemoAttempt | null {
  return readDemoAttempts().find((a) => a.examId === examId) ?? null
}

/** Score + store a demo attempt (sample content — openly labelled, not a real exam). */
export function submitDemoAttempt(
  exam: ExamView,
  questions: SampleExamQuestion[],
  answers: Record<string, number>,
  startedAtMs: number,
): DemoAttempt {
  const views = sampleQuestionsToViews(questions)
  const scored = scoreAttempt(answers, views, sampleQuestionsToKeys(questions))
  const attempt: DemoAttempt = {
    examId: exam.id,
    examTitle: exam.title,
    answers,
    startedAt: new Date(startedAtMs).toISOString(),
    submittedAt: new Date().toISOString(),
    status: 'evaluated',
    score: scored.score,
    totalMarks: scored.totalMarks,
    correctCount: scored.correctCount,
    wrongCount: scored.wrongCount,
    skippedCount: scored.skippedCount,
    perQuestion: scored.perQuestion,
  }
  const list = readDemoAttempts().filter((a) => a.examId !== exam.id)
  writeDemoRaw(DEMO_ATTEMPTS_KEY, JSON.stringify([...list, attempt]))
  return attempt
}

/** Demo attempt → the same shape as a Firestore attempt, for the Results page. */
export function demoAttemptToDoc(attempt: DemoAttempt): ExamAttemptDoc {
  return {
    id: `demo_${attempt.examId}`,
    userId: 'demo',
    examId: attempt.examId,
    examTitle: attempt.examTitle,
    answers: attempt.answers,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    status: 'evaluated',
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    skippedCount: attempt.skippedCount,
    perQuestion: attempt.perQuestion,
    evaluatedAt: attempt.submittedAt,
    evaluatedBy: null,
    source: 'demo',
  }
}
