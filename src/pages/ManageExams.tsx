/**
 * Manage exams — Phase 6.
 *
 * Route: /exams/manage (teacher / admin only; students are turned away).
 *
 * Teachers create exams as drafts with questions (Zod-validated form),
 * publish / unpublish them, edit them, and evaluate submitted attempts.
 * The answer key is written to examKeys/{examId} — a doc the student
 * client can never read — and evaluation runs on the teacher's client
 * with those keys. In demo mode (Firebase not configured) exams live in
 * this browser's localStorage, labelled ডেমো.
 */
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ClipboardList, Eye, EyeOff, Pencil, Plus, Trash2, Users, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCourses } from '../hooks/useCourses'
import { useExamAttempts, useExams, useTeacherExams } from '../hooks/useExams'
import { getFirebase } from '../firebase/config'
import {
  EXAM_TYPE_LABELS,
  canManageExams,
  createExam,
  deleteDemoExam,
  deleteExam,
  evaluateExamAttempt,
  fetchExamQuestionsWithKeys,
  readDemoExams,
  saveDemoExam,
  setDemoExamStatus,
  setExamStatus,
  updateDemoExam,
  updateExam,
  validateExamInput,
  type ExamCreateInput,
  type ExamStatus,
  type ExamView,
} from '../firebase/exams'
import { toBanglaDigits } from '../lib/format'
import { DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'
import { useToast } from '../lib/toast'

const questionSchema = z.object({
  text: z.string().min(1, 'প্রশ্নের লেখা দিতে হবে।'),
  options: z.array(z.string().min(1, 'অপশন দিতে হবে।')).length(4, 'চারটি অপশন দিতে হবে।'),
  correctIndex: z.number().int().min(0).max(3),
  marks: z.number().int().min(1, 'নম্বর ১ থেকে ১০০-এর মধ্যে হতে হবে।').max(100, 'নম্বর ১ থেকে ১০০-এর মধ্যে হতে হবে।'),
})

const examFormSchema = z.object({
  title: z.string().min(3, 'পরীক্ষার নাম কমপক্ষে ৩ অক্ষরের হতে হবে।'),
  subject: z.string().min(1, 'বিষয় দিতে হবে।'),
  type: z.enum(['mcq', 'chapter', 'model', 'practice']),
  courseId: z.string(),
  durationMin: z.number().int().min(5, 'সময়সীমা ৫ থেকে ৪৮০ মিনিটের মধ্যে হতে হবে।').max(480, 'সময়সীমা ৫ থেকে ৪৮০ মিনিটের মধ্যে হতে হবে।'),
  scheduledAt: z.string(),
  questions: z.array(questionSchema).min(1, 'কমপক্ষে ১টি প্রশ্ন দিতে হবে।').max(100, 'সর্বোচ্চ ১০০টি প্রশ্ন দেওয়া যাবে।'),
})

type ExamForm = z.infer<typeof examFormSchema>

const EMPTY_QUESTION = { text: '', options: ['', '', '', ''], correctIndex: 0, marks: 5 }

const DEFAULT_VALUES: ExamForm = {
  title: '',
  subject: '',
  type: 'mcq',
  courseId: '',
  durationMin: 60,
  scheduledAt: '',
  questions: [{ ...EMPTY_QUESTION }],
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return iso.slice(0, 16)
}

export default function ManageExams() {
  const { user, role, configured } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const { data: coursesData } = useCourses()
  const isAdmin = role === 'admin' || role === 'super_admin'
  const { data: allExams, isLoading: allLoading } = useExams()
  const { data: ownExams, isLoading: ownLoading } = useTeacherExams(user?.uid)
  const exams = ((isAdmin ? (allExams?.exams ?? []) : (ownExams ?? [])) as ExamView[])
    // Sample catalogue exams are not manageable — only real/demo exams.
    .filter((e) => e.source !== 'sample')
  const examsLoading = isAdmin ? allLoading : ownLoading

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { data: attempts } = useExamAttempts(selectedExamId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamForm>({ resolver: zodResolver(examFormSchema), defaultValues: DEFAULT_VALUES })

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })

  if (!canManageExams(role)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState title="শুধু শিক্ষক ও অ্যাডমিনের জন্য" message="পরীক্ষা তৈরি ও পরিচালনা করতে শিক্ষক বা অ্যাডমিন হতে হবে। শিক্ষার্থীরা /exams পেজ থেকে পরীক্ষা দিতে পারবেন।" />
      </div>
    )
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['exams'] })
    void queryClient.invalidateQueries({ queryKey: ['teacher-exams'] })
    void queryClient.invalidateQueries({ queryKey: ['exam-attempt-data'] })
    void queryClient.invalidateQueries({ queryKey: ['exam-attempts'] })
  }

  function openCreate() {
    setEditingId(null)
    reset(DEFAULT_VALUES)
    setShowForm(true)
  }

  async function openEdit(exam: ExamView) {
    try {
      const fb = getFirebase()
      let values: ExamForm
      if (!fb) {
        const demo = readDemoExams().find((e) => e.id === exam.id)
        if (!demo) throw new Error('ডেমো পরীক্ষাটি পাওয়া যায়নি।')
        values = {
          title: demo.title,
          subject: demo.subject,
          type: demo.type,
          courseId: demo.courseId ?? '',
          durationMin: demo.durationMin,
          scheduledAt: demo.scheduledAt ? toDatetimeLocal(demo.scheduledAt) : '',
          questions: demo.questions.map((q) => ({
            text: q.text,
            options: [...q.options],
            correctIndex: q.correctIndex,
            marks: q.marks,
          })),
        }
      } else {
        const withKeys = await fetchExamQuestionsWithKeys(fb.db, exam.id)
        values = {
          title: exam.title,
          subject: exam.subject,
          type: exam.type,
          courseId: exam.courseId ?? '',
          durationMin: exam.durationMin,
          scheduledAt: toDatetimeLocal(exam.scheduledAt),
          questions: withKeys.map((q) => ({
            text: q.text,
            options: [...q.options],
            correctIndex: q.correctIndex,
            marks: q.marks,
          })),
        }
      }
      setEditingId(exam.id)
      reset(values)
      setShowForm(true)
    } catch (err) {
      push(err instanceof Error ? err.message : 'পরীক্ষা খোলা যায়নি।', 'error')
    }
  }

  async function onSubmit(data: ExamForm) {
    const courses = coursesData?.courses ?? []
    const course = courses.find((c) => c.id === data.courseId)
    const input: ExamCreateInput = {
      title: data.title,
      subject: data.subject,
      type: data.type,
      courseId: data.courseId || null,
      courseTitle: course?.title ?? '',
      durationMin: data.durationMin,
      scheduledAt: data.scheduledAt,
      questions: data.questions.map((q) => ({
        text: q.text,
        options: [q.options[0], q.options[1], q.options[2], q.options[3]],
        correctIndex: q.correctIndex,
        marks: q.marks,
      })),
    }
    const errors = validateExamInput(input)
    if (errors.length > 0) {
      push(errors[0], 'error')
      return
    }
    try {
      const fb = getFirebase()
      if (!fb) {
        if (editingId) {
          updateDemoExam(editingId, input)
          push('ডেমো পরীক্ষা আপডেট হয়েছে।', 'success')
        } else {
          saveDemoExam(input)
          push('ডেমো পরীক্ষা তৈরি হয়েছে (ড্রাফট)। প্রকাশ করলে শিক্ষার্থীরা দেখতে পাবে।', 'success')
        }
      } else {
        if (!user) throw new Error('লগইন করা নেই।')
        if (editingId) {
          await updateExam(fb.db, editingId, input)
          push('পরীক্ষা আপডেট হয়েছে।', 'success')
        } else {
          await createExam(fb.db, input, { uid: user.uid, displayName: user.displayName ?? '' })
          push('পরীক্ষা তৈরি হয়েছে (ড্রাফট)। প্রকাশ করলে শিক্ষার্থীরা দেখতে পাবে।', 'success')
        }
      }
      setShowForm(false)
      setEditingId(null)
      reset(DEFAULT_VALUES)
      invalidate()
    } catch (err) {
      push(err instanceof Error ? err.message : 'সংরক্ষণ করা যায়নি।', 'error')
    }
  }

  async function toggleStatus(exam: ExamView) {
    const next: ExamStatus = exam.status === 'published' ? 'draft' : 'published'
    setBusyId(exam.id)
    try {
      const fb = getFirebase()
      if (!fb) setDemoExamStatus(exam.id, next)
      else await setExamStatus(fb.db, exam.id, next)
      push(next === 'published' ? 'পরীক্ষা প্রকাশিত হয়েছে।' : 'পরীক্ষা ড্রাফটে ফেরত নেওয়া হয়েছে।', 'success')
      invalidate()
    } catch (err) {
      push(err instanceof Error ? err.message : 'অবস্থা বদলানো যায়নি।', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(exam: ExamView) {
    if (!window.confirm(`"${exam.title}" পরীক্ষাটি মুছে ফেলবেন? প্রশ্ন ও উত্তর-চাবিও মুছে যাবে। জমা দেওয়া উত্তরপত্র ইতিহাস হিসেবে থাকবে।`)) return
    setBusyId(exam.id)
    try {
      const fb = getFirebase()
      if (!fb) deleteDemoExam(exam.id)
      else await deleteExam(fb.db, exam.id)
      push('পরীক্ষা মুছে ফেলা হয়েছে।', 'success')
      invalidate()
    } catch (err) {
      push(err instanceof Error ? err.message : 'মোছা যায়নি।', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleEvaluate(attemptId: string, examId: string) {
    if (!user) return
    setBusyId(attemptId)
    try {
      const fb = getFirebase()
      if (!fb) throw new Error('ডেমো পরীক্ষার ফলাফল জমার সাথে সাথেই মূল্যায়ন হয়ে যায়।')
      await evaluateExamAttempt(fb.db, examId, attemptId, user.uid)
      push('মূল্যায়ন হয়েছে — শিক্ষার্থী এখন নম্বর দেখতে পাবে।', 'success')
      invalidate()
    } catch (err) {
      push(err instanceof Error ? err.message : 'মূল্যায়ন করা যায়নি।', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId) ?? null
  const courses = coursesData?.courses ?? []

  return (
    <div>
      <PageHero
        eyebrow="পরীক্ষা পরিচালনা"
        title="পরীক্ষা তৈরি ও মূল্যায়ন"
        subtitle="প্রশ্ন তৈরি করুন, প্রকাশ করুন, আর জমা দেওয়া উত্তরপত্র মূল্যায়ন করুন।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!configured && (
          <DemoNotice>
            Firebase এখনো কনফিগার করা হয়নি — এখানে তৈরি পরীক্ষা ডেমো হিসেবে শুধু এই ব্রাউজারে
            থাকবে (ডেমো লেবেলসহ)।
          </DemoNotice>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">আমার পরীক্ষা ({toBanglaDigits(exams.length)})</h2>
          <button onClick={openCreate} className="btn-primary cursor-pointer text-sm">
            <Plus className="h-4 w-4" /> নতুন পরীক্ষা তৈরি করুন
          </button>
        </div>

        {examsLoading ? (
          <SkeletonCard />
        ) : exams.length === 0 ? (
          <EmptyState title="এখনো কোনো পরীক্ষা তৈরি করেননি" message="উপরে 'নতুন পরীক্ষা তৈরি করুন' চাপ দিয়ে প্রথম পরীক্ষাটি বানান।" />
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <article key={exam.id} className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="mb-1.5 inline-flex items-center gap-2">
                      {exam.source !== 'firestore' && <SampleBadge label={exam.source === 'demo' ? 'ডেমো' : 'নমুনা'} />}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${exam.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {exam.status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'}
                      </span>
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                        {EXAM_TYPE_LABELS[exam.type]}
                      </span>
                    </span>
                    <h3 className="text-lg font-bold">{exam.title}</h3>
                    <p className="mt-1 text-sm text-[var(--color-body)]">
                      {exam.subject} · {toBanglaDigits(exam.durationMin)} মিনিট · {toBanglaDigits(exam.totalMarks)} নম্বর · {toBanglaDigits(exam.questionCount)}টি প্রশ্ন
                      {exam.courseTitle ? ` · ${exam.courseTitle}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button onClick={() => void openEdit(exam)} className="btn-outline cursor-pointer !px-3 !py-2 text-xs">
                      <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                    </button>
                    <button
                      onClick={() => void toggleStatus(exam)}
                      disabled={busyId === exam.id}
                      className="btn-outline cursor-pointer !px-3 !py-2 text-xs disabled:opacity-50"
                    >
                      {exam.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {exam.status === 'published' ? 'ড্রাফট করুন' : 'প্রকাশ করুন'}
                    </button>
                    <button
                      onClick={() => setSelectedExamId(selectedExamId === exam.id ? null : exam.id)}
                      className="btn-outline cursor-pointer !px-3 !py-2 text-xs"
                    >
                      <Users className="h-3.5 w-3.5" /> উত্তরপত্র
                    </button>
                    <button
                      onClick={() => void handleDelete(exam)}
                      disabled={busyId === exam.id}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> মুছুন
                    </button>
                  </div>
                </div>

                {selectedExamId === exam.id && (
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                      <ClipboardList className="h-4 w-4 text-[var(--color-primary)]" /> জমা দেওয়া উত্তরপত্র
                    </h4>
                    {!attempts ? (
                      <SkeletonCard />
                    ) : attempts.length === 0 ? (
                      <p className="text-sm text-[var(--color-body)]">এখনো কেউ এই পরীক্ষাটি জমা দেয়নি।</p>
                    ) : (
                      <div className="space-y-3">
                        {attempts.map((a) => (
                          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                            <div className="text-sm">
                              <p className="font-bold">{a.examTitle}</p>
                              <p className="text-[var(--color-body)]">
                                {a.status === 'evaluated'
                                  ? `নম্বর: ${toBanglaDigits(a.score ?? 0)} / ${toBanglaDigits(a.totalMarks)} · সঠিক ${toBanglaDigits(a.correctCount ?? 0)} · ভুল ${toBanglaDigits(a.wrongCount ?? 0)}`
                                  : a.status === 'submitted'
                                    ? 'জমা হয়েছে — মূল্যায়ন বাকি'
                                    : 'পরীক্ষা চলছে'}
                              </p>
                            </div>
                            {a.status === 'submitted' && (
                              <button
                                onClick={() => void handleEvaluate(a.id, exam.id)}
                                disabled={busyId === a.id}
                                className="btn-primary cursor-pointer !px-4 !py-2 text-xs disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> মূল্যায়ন করুন
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="card mt-8 p-6" noValidate>
            <h2 className="text-xl font-extrabold">{editingId ? 'পরীক্ষা সম্পাদনা করুন' : 'নতুন পরীক্ষা'}</h2>
            <p className="mt-1 text-sm text-[var(--color-body)]">
              উত্তর-চাবি (সঠিক উত্তর) আলাদাভাবে সংরক্ষণ হয় — শিক্ষার্থীরা কখনো তা দেখতে পায় না।
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="exam-title" className="mb-2 block text-sm font-bold">পরীক্ষার নাম *</label>
                <input id="exam-title" {...register('title')} placeholder="যেমন: পদার্থবিজ্ঞান মডেল টেস্ট ০১" className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700" />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="exam-subject" className="mb-2 block text-sm font-bold">বিষয় *</label>
                <input id="exam-subject" {...register('subject')} placeholder="যেমন: পদার্থবিজ্ঞান" className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700" />
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
              </div>
              <div>
                <label htmlFor="exam-type" className="mb-2 block text-sm font-bold">ধরন *</label>
                <select id="exam-type" {...register('type')} className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700">
                  {(Object.keys(EXAM_TYPE_LABELS) as (keyof typeof EXAM_TYPE_LABELS)[]).map((t) => (
                    <option key={t} value={t}>{EXAM_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="exam-course" className="mb-2 block text-sm font-bold">কোর্স (ঐচ্ছিক)</label>
                <select id="exam-course" {...register('courseId')} className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700">
                  <option value="">কোর্স ছাড়া</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="exam-duration" className="mb-2 block text-sm font-bold">সময়সীমা (মিনিট) *</label>
                <input id="exam-duration" type="number" min={5} max={480} {...register('durationMin', { valueAsNumber: true })} className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700" />
                {errors.durationMin && <p className="mt-1 text-sm text-red-600">{errors.durationMin.message}</p>}
              </div>
              <div>
                <label htmlFor="exam-scheduled" className="mb-2 block text-sm font-bold">শুরুর সময় (ঐচ্ছিক)</label>
                <input id="exam-scheduled" type="datetime-local" {...register('scheduledAt')} className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700" />
                <p className="mt-1 text-xs text-[var(--color-muted)]">খালি রাখলে প্রকাশের সাথে সাথেই দেওয়া যাবে।</p>
              </div>
            </div>

            <h3 className="mt-8 mb-3 text-lg font-extrabold">প্রশ্ন ({toBanglaDigits(fields.length)})</h3>
            {errors.questions && <p className="mb-3 text-sm text-red-600">{errors.questions.message as string}</p>}
            <div className="space-y-5">
              {fields.map((field, i) => (
                <div key={field.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold">প্রশ্ন {toBanglaDigits(i + 1)}</p>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
                        <Trash2 className="h-3.5 w-3.5" /> মুছুন
                      </button>
                    )}
                  </div>
                  <label htmlFor={`q-${i}-text`} className="mt-3 mb-2 block text-sm font-bold">প্রশ্নের লেখা *</label>
                  <textarea
                    id={`q-${i}-text`}
                    {...register(`questions.${i}.text`)}
                    rows={2}
                    className="w-full rounded-2xl border border-blue-100 bg-[var(--color-page)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
                  />
                  {errors.questions?.[i]?.text && <p className="mt-1 text-sm text-red-600">{errors.questions[i]?.text?.message}</p>}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((oi) => (
                      <div key={oi}>
                        <label htmlFor={`q-${i}-opt-${oi}`} className="mb-1.5 flex items-center gap-2 text-sm font-bold">
                          <input
                            type="radio"
                            id={`q-${i}-correct-${oi}`}
                            value={oi}
                            {...register(`questions.${i}.correctIndex`, { valueAsNumber: true })}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                            aria-label={`প্রশ্ন ${i + 1}-এর সঠিক উত্তর হিসেবে অপশন ${oi + 1} বেছে নিন`}
                          />
                          অপশন {String.fromCharCode(65 + oi)} {oi === 0 ? '(সঠিক হলে টিক দিন)' : ''}
                        </label>
                        <input
                          id={`q-${i}-opt-${oi}`}
                          {...register(`questions.${i}.options.${oi}`)}
                          placeholder={`অপশন ${String.fromCharCode(65 + oi)}`}
                          className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                  {errors.questions?.[i]?.options && <p className="mt-1 text-sm text-red-600">চারটি অপশনই দিতে হবে।</p>}
                  <div className="mt-3 max-w-40">
                    <label htmlFor={`q-${i}-marks`} className="mb-1.5 block text-sm font-bold">নম্বর *</label>
                    <input
                      id={`q-${i}-marks`}
                      type="number"
                      min={1}
                      max={100}
                      {...register(`questions.${i}.marks`, { valueAsNumber: true })}
                      className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append({ ...EMPTY_QUESTION, options: ['', '', '', ''] })}
              disabled={fields.length >= 100}
              className="btn-outline mt-4 cursor-pointer text-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> প্রশ্ন যোগ করুন
            </button>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary cursor-pointer text-sm disabled:opacity-60">
                {isSubmitting ? 'সংরক্ষণ হচ্ছে…' : editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'পরীক্ষা তৈরি করুন (ড্রাফট)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  reset(DEFAULT_VALUES)
                }}
                className="btn-outline cursor-pointer text-sm"
              >
                বাতিল
              </button>
            </div>
          </form>
        )}

        {selectedExam && (
          <p className="mt-4 text-xs text-[var(--color-muted)]">
            উত্তরপত্র দেখছেন: {selectedExam.title} — মূল্যায়নের পর শিক্ষার্থী তার ফলাফল /results পেজে দেখতে পাবে।
          </p>
        )}
      </div>
    </div>
  )
}
