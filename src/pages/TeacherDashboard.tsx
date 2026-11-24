/**
 * Teacher dashboard — Phase 5.
 *
 * Route: /teacher (teacher / admin / super_admin only).
 *
 * Real mode (Firebase configured + teacher signed in): the teacher's own
 * courses from Firestore, live enrollment counts + average progress per
 * course, their scheduled live classes, a form to schedule a new class,
 * a join-link editor, and an add-lesson form per course. No earnings are
 * shown anywhere — there is no payment data in this phase.
 *
 * Demo mode (Firebase not configured): a labelled নমুনা preview for the
 * demo teacher (t1) — sample courses and counts with a নমুনা badge, and
 * the write forms replaced by a note that scheduling needs Firebase +
 * a teacher login. No fake students are ever shown as real.
 *
 * Attendance marking is intentionally NOT here: without a real live
 * session, marking who attended would be invented data. It arrives with
 * a real live-class integration.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookOpen, CalendarDays, Clock, GraduationCap, Link2, Plus, Radio,
  ShieldAlert, TrendingUp, Users, Video, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebase } from '../firebase/config'
import { addLesson } from '../firebase/courses'
import {
  canScheduleLiveClass,
  cancelLiveClass,
  classifyLiveClass,
  joinAvailability,
  liveClassPhaseLabel,
  scheduleLiveClass,
  setLiveClassJoinUrl,
  validateLiveClassInput,
  type LiveClassView,
} from '../firebase/liveClasses'
import { summarizeTeacherStats } from '../firebase/teacherStats'
import { useTeacherLiveClasses } from '../hooks/useLiveClasses'
import { useCourseEnrollmentStats, useTeacherCourses } from '../hooks/useTeacher'
import { canAccess, ROLE_LABELS } from '../lib/roles'
import { getTeacherById, type Course } from '../data/sample'
import { useToast } from '../lib/toast'
import { Breadcrumbs, DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

const inputCls =
  'w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 dark:border-slate-700 dark:bg-slate-900'

function formatClassTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
}

const scheduleSchema = z.object({
  title: z.string().trim().min(1, 'ক্লাসের নাম দিতে হবে।'),
  courseId: z.string().optional(),
  subject: z.string().trim().min(1, 'বিষয় দিতে হবে।'),
  startsAt: z
    .string()
    .min(1, 'ক্লাস শুরুর তারিখ ও সময় দিন।')
    .refine((v) => !Number.isNaN(Date.parse(v)) && Date.parse(v) > Date.now(), 'ক্লাসের সময় ভবিষ্যতের হতে হবে।'),
  durationMin: z.coerce.number().int().min(5, 'সময়সীমা কমপক্ষে ৫ মিনিট হতে হবে।').max(480, 'সময়সীমা সর্বোচ্চ ৪৮০ মিনিট।'),
  joinUrl: z.string().trim().optional(),
  description: z.string().trim().max(500, 'বিবরণ সর্বোচ্চ ৫০০ অক্ষর।').optional(),
})
type ScheduleForm = z.infer<typeof scheduleSchema>

const lessonSchema = z.object({
  title: z.string().trim().min(1, 'লেসনের নাম দিতে হবে।'),
  chapterIndex: z.coerce.number().int().min(0, 'অধ্যায় নম্বর ০ বা তার বেশি হতে হবে।').max(50, 'অধ্যায় নম্বর সর্বোচ্চ ৫০।'),
  durationMin: z.coerce.number().int().min(0, 'সময় শূন্য বা তার বেশি হতে হবে।').max(600, 'সময় সর্বোচ্চ ৬০০ মিনিট।'),
})
type LessonForm = z.infer<typeof lessonSchema>

/** Inline add-lesson form inside a course card (real mode only). */
function AddLessonForm({ course, onDone }: { course: Course; onDone: () => void }) {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LessonForm>({ resolver: zodResolver(lessonSchema), defaultValues: { chapterIndex: 0, durationMin: 0 } })

  const mutation = useMutation({
    mutationFn: async (values: LessonForm) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      return addLesson(fb.db, course.id, {
        chapterIndex: values.chapterIndex,
        order: course.lessons,
        title: values.title,
        durationMin: values.durationMin,
        isPreview: false,
      })
    },
    onSuccess: () => {
      push('লেসন যোগ করা হয়েছে।', 'success')
      void queryClient.invalidateQueries({ queryKey: ['course-lessons', course.id] })
      onDone()
    },
    onError: (err) => push(err instanceof Error ? err.message : 'লেসন যোগ করা যায়নি।', 'error'),
  })

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_110px_110px]">
        <div>
          <label htmlFor={`lesson-title-${course.id}`} className="mb-1 block text-xs font-bold">লেসনের নাম</label>
          <input id={`lesson-title-${course.id}`} {...register('title')} className={inputCls} placeholder="যেমন: ভেক্টর যোগ-বিয়োগ" />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor={`lesson-chapter-${course.id}`} className="mb-1 block text-xs font-bold">অধ্যায় নম্বর</label>
          <input id={`lesson-chapter-${course.id}`} type="number" min={0} {...register('chapterIndex')} className={inputCls} />
          {errors.chapterIndex && <p className="mt-1 text-xs text-red-600">{errors.chapterIndex.message}</p>}
        </div>
        <div>
          <label htmlFor={`lesson-duration-${course.id}`} className="mb-1 block text-xs font-bold">সময় (মিনিট)</label>
          <input id={`lesson-duration-${course.id}`} type="number" min={0} {...register('durationMin')} className={inputCls} />
          {errors.durationMin && <p className="mt-1 text-xs text-red-600">{errors.durationMin.message}</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50">
          <Plus className="h-4 w-4" /> লেসন যোগ করুন
        </button>
        <button type="button" onClick={onDone} className="btn-outline cursor-pointer !px-4 !py-2 text-sm">
          বাতিল
        </button>
      </div>
    </form>
  )
}

/** Join-link editor for one of the teacher's classes (real mode only). */
function JoinLinkEditor({ cls }: { cls: LiveClassView }) {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState(cls.joinUrl ?? '')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const phase = classifyLiveClass(cls)
  const join = joinAvailability(cls)

  const setLink = useMutation({
    mutationFn: async () => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await setLiveClassJoinUrl(fb.db, cls.id, url)
    },
    onSuccess: () => {
      push('যোগদানের লিংক সংরক্ষণ করা হয়েছে।', 'success')
      void queryClient.invalidateQueries({ queryKey: ['teacher-live-classes'] })
      void queryClient.invalidateQueries({ queryKey: ['live-classes'] })
    },
    onError: (err) => push(err instanceof Error ? err.message : 'লিংক সংরক্ষণ করা যায়নি।', 'error'),
  })

  const cancel = useMutation({
    mutationFn: async () => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await cancelLiveClass(fb.db, cls.id)
    },
    onSuccess: () => {
      push('ক্লাসটি বাতিল করা হয়েছে।', 'success')
      void queryClient.invalidateQueries({ queryKey: ['teacher-live-classes'] })
      void queryClient.invalidateQueries({ queryKey: ['live-classes'] })
    },
    onError: (err) => push(err instanceof Error ? err.message : 'ক্লাস বাতিল করা যায়নি।', 'error'),
  })

  return (
    <div className="mt-3 space-y-2">
      <p className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
        <Clock className="h-3.5 w-3.5" /> {formatClassTime(cls.startsAt)} · {cls.durationMin} মিনিট · {liveClassPhaseLabel(phase)}
      </p>
      {!join.available ? (
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">{join.message}</p>
      ) : cls.joinUrl ? (
        <a href={cls.joinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-primary)] hover:underline">
          <Video className="h-4 w-4" /> যোগদানের লিংক খুলুন
        </a>
      ) : (
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">যোগদানের লিংক এখনো যুক্ত হয়নি।</p>
      )}
      {phase !== 'ended' && phase !== 'cancelled' && (
        <div className="flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
            className={`${inputCls} !w-auto flex-1`}
            aria-label="যোগদানের লিংক"
          />
          <button
            onClick={() => setLink.mutate()}
            disabled={setLink.isPending || !url.trim()}
            className="btn-primary cursor-pointer !px-3 !py-2 text-xs disabled:opacity-50"
          >
            <Link2 className="h-3.5 w-3.5" /> লিংক সংরক্ষণ
          </button>
          {phase === 'upcoming' && (
            <button
              onClick={() => {
                if (confirmCancel) cancel.mutate()
                else setConfirmCancel(true)
              }}
              disabled={cancel.isPending}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              <X className="h-3.5 w-3.5" /> {confirmCancel ? 'বাতিল নিশ্চিত করুন?' : 'ক্লাস বাতিল'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Schedule-a-class form (real mode only). */
function ScheduleClassForm({ courses }: { courses: Course[] }) {
  const { push } = useToast()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { durationMin: 60, joinUrl: '', description: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: ScheduleForm) => {
      const fb = getFirebase()
      if (!fb || !user) throw new Error('Firebase কনফিগার করা হয়নি।')
      const selected = courses.find((c) => c.id === values.courseId)
      const input = {
        title: values.title,
        description: values.description ?? '',
        courseId: values.courseId || null,
        courseTitle: selected?.title ?? '',
        subject: values.subject,
        startsAt: values.startsAt,
        durationMin: values.durationMin,
        joinUrl: values.joinUrl || null,
      }
      const serviceErrors = validateLiveClassInput(input)
      if (serviceErrors.length > 0) throw new Error(serviceErrors[0])
      return scheduleLiveClass(fb.db, input, { uid: user.uid, displayName: profile?.displayName || user.displayName || 'শিক্ষক' })
    },
    onSuccess: () => {
      push('লাইভ ক্লাস শিডিউল করা হয়েছে।', 'success')
      reset()
      void queryClient.invalidateQueries({ queryKey: ['teacher-live-classes'] })
      void queryClient.invalidateQueries({ queryKey: ['live-classes'] })
    },
    onError: (err) => push(err instanceof Error ? err.message : 'ক্লাস শিডিউল করা যায়নি।', 'error'),
  })

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
      <div>
        <label htmlFor="sc-title" className="mb-1 block text-xs font-bold">ক্লাসের নাম</label>
        <input id="sc-title" {...register('title')} className={inputCls} placeholder="যেমন: ভেক্টর লাইভ সমস্যা সমাধান" />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="sc-course" className="mb-1 block text-xs font-bold">কোর্স (ঐচ্ছিক)</label>
          <select id="sc-course" {...register('courseId')} className={inputCls} defaultValue="">
            <option value="">— কোনো কোর্স নয় —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sc-subject" className="mb-1 block text-xs font-bold">বিষয়</label>
          <input id="sc-subject" {...register('subject')} className={inputCls} placeholder="যেমন: পদার্থবিজ্ঞান" />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="sc-starts" className="mb-1 block text-xs font-bold">শুরুর তারিখ ও সময়</label>
          <input id="sc-starts" type="datetime-local" {...register('startsAt')} className={inputCls} />
          {errors.startsAt && <p className="mt-1 text-xs text-red-600">{errors.startsAt.message}</p>}
        </div>
        <div>
          <label htmlFor="sc-duration" className="mb-1 block text-xs font-bold">সময়সীমা (মিনিট)</label>
          <input id="sc-duration" type="number" min={5} max={480} {...register('durationMin')} className={inputCls} />
          {errors.durationMin && <p className="mt-1 text-xs text-red-600">{errors.durationMin.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="sc-join" className="mb-1 block text-xs font-bold">যোগদানের লিংক (ঐচ্ছিক — পরে যোগ করা যাবে)</label>
        <input id="sc-join" {...register('joinUrl')} className={inputCls} placeholder="https://meet.google.com/..." />
        {errors.joinUrl && <p className="mt-1 text-xs text-red-600">{errors.joinUrl.message}</p>}
      </div>
      <div>
        <label htmlFor="sc-desc" className="mb-1 block text-xs font-bold">বিবরণ (ঐচ্ছিক)</label>
        <textarea id="sc-desc" {...register('description')} rows={2} className={inputCls} placeholder="ক্লাসে কী কী থাকবে" />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-cta text-sm disabled:opacity-50">
        <Radio className="h-4 w-4" /> ক্লাস শিডিউল করুন
      </button>
    </form>
  )
}

export default function TeacherDashboard() {
  const { user, profile, role, loading, configured } = useAuth()
  const [lessonFormCourseId, setLessonFormCourseId] = useState<string | null>(null)

  // Demo mode: preview for the sample teacher t1. Real mode: the signed-in teacher.
  const demoTeacher = getTeacherById('t1')
  const teacherId = configured ? (user?.uid ?? null) : 't1'
  const teacherName = configured ? (profile?.displayName || user?.displayName || 'শিক্ষক') : (demoTeacher?.name ?? 'শিক্ষক')

  const { data: coursesResult, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useTeacherCourses()
  const courses = coursesResult?.courses ?? []
  const source = coursesResult?.source ?? 'sample'
  const courseIds = courses.map((c) => c.id)
  const { data: stats = [], isLoading: statsLoading } = useCourseEnrollmentStats(courseIds)
  const { data: myClasses = [], isLoading: classesLoading } = useTeacherLiveClasses(teacherId)

  const summary = summarizeTeacherStats(courses, stats)
  const upcomingClasses = myClasses.filter((c) => classifyLiveClass(c) !== 'ended' && classifyLiveClass(c) !== 'cancelled')
  const isDemo = !configured

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Real mode needs a signed-in teacher/admin; demo mode shows the preview.
  if (configured && !user) {
    return <Navigate to="/login" state={{ from: '/teacher' }} replace />
  }
  if (configured && user && !canAccess(role, ['teacher', 'admin', 'super_admin'])) {
    return (
      <div>
        <PageHero eyebrow="অনুমতি নেই" title="এই পেজটি আপনার জন্য নয়" subtitle="আপনার রোল দিয়ে এই পেজটি দেখা যাবে না।" />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="card flex flex-col items-center px-6 py-10 text-center" role="alert">
            <ShieldAlert className="mb-4 h-10 w-10 text-amber-500" />
            <p className="leading-relaxed text-[var(--color-body)]">
              এই পেজটি শুধু শিক্ষক, অ্যাডমিন ও সুপার অ্যাডমিনের জন্য। আপনার রোল:{' '}
              <strong>{role ? ROLE_LABELS[role] : '—'}</strong>। শিক্ষক রোল পেতে অ্যাডমিনের সাথে যোগাযোগ করুন —
              নিজে নিজে রোল বদলানো যায় না।
            </p>
            <Link to="/dashboard" className="btn-primary mt-5 inline-flex">
              ড্যাশবোর্ডে যান
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        eyebrow="শিক্ষক ড্যাশবোর্ড"
        title={`স্বাগতম, ${teacherName}!`}
        subtitle="আপনার কোর্স, শিক্ষার্থী ও লাইভ ক্লাস — সব এক জায়গায়।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'ড্যাশবোর্ড', to: '/dashboard' }, { label: 'শিক্ষক ড্যাশবোর্ড' }]} />
        {isDemo && (
          <DemoNotice>
            এটি <strong>ডেমো প্রিভিউ</strong> — দেখানো কোর্স, শিক্ষার্থীর সংখ্যা ও ক্লাসের সময়সূচি সবই নমুনা
            (শিক্ষক: {demoTeacher?.name ?? 't1'})। আসল তথ্য দেখতে Firebase সেটআপ শেষ করে শিক্ষক অ্যাকাউন্টে লগইন
            করতে হবে। এখানে কোনো আসল শিক্ষার্থীর তথ্য দেখানো হচ্ছে না।
          </DemoNotice>
        )}

        {/* ---- Stats ---- */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, label: 'আমার কোর্স', value: String(summary.totalCourses), sub: summary.draftCourses > 0 ? `${summary.draftCourses}টি ড্রাফট` : undefined },
            { icon: Users, label: 'মোট শিক্ষার্থী', value: String(summary.totalStudents), sub: isDemo ? 'নমুনা সংখ্যা' : 'আসল ভর্তি' },
            { icon: Radio, label: 'আসন্ন লাইভ ক্লাস', value: String(upcomingClasses.length), sub: undefined },
            { icon: TrendingUp, label: 'গড় অগ্রগতি', value: isDemo ? '—' : `${summary.overallAvgProgress}%`, sub: isDemo ? 'ডেমোতে অগ্রগতি নেই' : undefined },
          ].map((s) => (
            <div key={s.label} className="card flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
                <s.icon className="h-6 w-6 text-[var(--color-primary)]" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold">
                  {s.value}
                  {isDemo && s.label === 'মোট শিক্ষার্থী' && <SampleBadge />}
                </span>
                <span className="text-sm text-[var(--color-muted)]">{s.label}</span>
                {s.sub && <span className="block text-xs text-[var(--color-muted)]">{s.sub}</span>}
              </span>
            </div>
          ))}
        </div>

        {coursesError && <ErrorState message="আপনার কোর্স লোড করা যায়নি।" onRetry={() => void refetchCourses()} />}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* ---- Schedule a class ---- */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">নতুন লাইভ ক্লাস শিডিউল করুন</h2>
                {isDemo && <SampleBadge label="ডেমোতে বন্ধ" />}
              </div>
              {isDemo ? (
                <p className="text-sm leading-relaxed text-[var(--color-body)]">
                  ডেমো মোডে ক্লাস শিডিউল করা যায় না — শিডিউল সংরক্ষণ করতে Firebase সেটআপ শেষ করে শিক্ষক
                  অ্যাকাউন্টে লগইন করতে হবে। তখন এখান থেকেই ক্লাসের নাম, সময় ও যোগদানের লিংক দেওয়া যাবে।
                </p>
              ) : canScheduleLiveClass(role) ? (
                <ScheduleClassForm courses={courses} />
              ) : (
                <p className="text-sm leading-relaxed text-[var(--color-body)]">
                  আপনার রোল দিয়ে ক্লাস শিডিউল করা যায় না।
                </p>
              )}
            </section>

            {/* ---- My courses ---- */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">আমার কোর্স</h2>
                {source === 'sample' && <SampleBadge />}
              </div>
              {coursesLoading || statsLoading ? (
                <div className="grid gap-3" aria-busy="true" aria-label="কোর্স লোড হচ্ছে">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : courses.length === 0 ? (
                <EmptyState
                  title="এখনো কোনো কোর্স নেই"
                  message="আপনার নামে এখনো কোনো কোর্স তৈরি হয়নি। কোর্স তৈরি অ্যাডমিন ড্যাশবোর্ডে (Phase 7) আসছে।"
                />
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => {
                    const stat = stats.find((s) => s.courseId === course.id)
                    return (
                      <article key={course.id} className="rounded-2xl border border-blue-100 p-4 dark:border-slate-700">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Link to={`/courses/${course.slug}`} className="font-bold hover:text-[var(--color-primary)]">
                              {course.title}
                            </Link>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-muted)]">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-4 w-4" /> {course.lessons}টি লেসন
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" /> {stat?.enrolledCount ?? 0} জন শিক্ষার্থী
                                {isDemo && ' (নমুনা)'}
                              </span>
                              <span>{course.status === 'draft' ? 'ড্রাফট' : 'প্রকাশিত'}</span>
                            </p>
                            {!isDemo && stat && stat.enrolledCount > 0 && (
                              <p className="mt-2 flex items-center gap-3 text-xs">
                                <span className="h-2 w-32 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700">
                                  <span className="block h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${stat.avgProgress}%` }} />
                                </span>
                                <span className="font-bold">গড় অগ্রগতি {stat.avgProgress}%</span>
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/courses/${course.slug}`} className="btn-outline !px-3 !py-2 text-xs">
                              কোর্স দেখুন
                            </Link>
                            {!isDemo && (
                              <button
                                onClick={() => setLessonFormCourseId(lessonFormCourseId === course.id ? null : course.id)}
                                className="btn-primary cursor-pointer !px-3 !py-2 text-xs"
                              >
                                <Plus className="h-3.5 w-3.5" /> লেসন যোগ করুন
                              </button>
                            )}
                          </div>
                        </div>
                        {!isDemo && lessonFormCourseId === course.id && (
                          <AddLessonForm course={course} onDone={() => setLessonFormCourseId(null)} />
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ---- Student stats ---- */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">শিক্ষার্থী পরিসংখ্যান</h2>
                {isDemo && <SampleBadge />}
              </div>
              {courses.length === 0 ? (
                <p className="text-sm text-[var(--color-body)]">কোর্স না থাকায় শিক্ষার্থীর পরিসংখ্যান দেখানো যাচ্ছে না।</p>
              ) : isDemo ? (
                <p className="text-sm leading-relaxed text-[var(--color-body)]">
                  ডেমো প্রিভিউতে আসল শিক্ষার্থীর নাম বা অগ্রগতি দেখানো হয় না — নমুনা সংখ্যা শুধু উপরের কার্ডে
                  দেখানো হয়েছে। আসল ভর্তির সংখ্যা ও গড় অগ্রগতি Firebase চালু হলে এখানে দেখা যাবে।
                </p>
              ) : summary.totalStudents === 0 ? (
                <EmptyState
                  title="এখনো কোনো শিক্ষার্থী ভর্তি হয়নি"
                  message="আপনার কোর্সে কেউ ভর্তি হলে এখানে প্রতি কোর্সের ভর্তির সংখ্যা ও গড় অগ্রগতি দেখা যাবে।"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-blue-100 text-[var(--color-muted)] dark:border-slate-700">
                        <th className="py-2 pr-3 font-bold">কোর্স</th>
                        <th className="py-2 pr-3 font-bold">ভর্তি</th>
                        <th className="py-2 pr-3 font-bold">গড় অগ্রগতি</th>
                        <th className="py-2 font-bold">সম্পন্ন লেসন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => {
                        const stat = stats.find((s) => s.courseId === course.id)
                        return (
                          <tr key={course.id} className="border-b border-blue-50 last:border-0 dark:border-slate-800">
                            <td className="py-3 pr-3 font-semibold">{course.title}</td>
                            <td className="py-3 pr-3">{stat?.enrolledCount ?? 0} জন</td>
                            <td className="py-3 pr-3">{stat?.avgProgress ?? 0}%</td>
                            <td className="py-3">{stat?.totalCompletedLessons ?? 0}টি</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            {/* ---- My live classes ---- */}
            <div className="card p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">আমার লাইভ ক্লাস</h2>
                {isDemo && <SampleBadge />}
              </div>
              {classesLoading ? (
                <SkeletonCard />
              ) : myClasses.length === 0 ? (
                <EmptyState
                  title="এখনো কোনো লাইভ ক্লাস নেই"
                  message="উপরের ফর্ম থেকে প্রথম ক্লাসটি শিডিউল করুন — লিংক শুরুর আগে যোগ করা যাবে।"
                />
              ) : (
                <ul className="space-y-4">
                  {myClasses.map((cls) => (
                    <li key={cls.id} className="border-b border-blue-50 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
                      <p className="font-bold">{cls.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {cls.subject}
                        {cls.courseTitle ? ` · ${cls.courseTitle}` : ''}
                      </p>
                      {isDemo ? (
                        <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                          <CalendarDays className="h-3.5 w-3.5" /> {formatClassTime(cls.startsAt)} · {cls.durationMin} মিনিট (নমুনা)
                        </p>
                      ) : (
                        <JoinLinkEditor cls={cls} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/live-classes" className="mt-4 inline-block text-sm font-bold text-[var(--color-primary)] hover:underline">
                সব লাইভ ক্লাস →
              </Link>
            </div>

            <div className="card p-6">
              <h2 className="mb-3 text-lg font-extrabold">দ্রুত লিংক</h2>
              <div className="grid gap-2 text-sm font-semibold">
                <Link to="/live-classes" className="text-[var(--color-primary)] hover:underline">
                  লাইভ ক্লাসের সময়সূচি →
                </Link>
                <Link to="/courses" className="text-[var(--color-primary)] hover:underline">
                  সব কোর্স দেখুন →
                </Link>
                <Link to="/dashboard" className="text-[var(--color-primary)] hover:underline">
                  ছাত্র ড্যাশবোর্ড →
                </Link>
                <Link to="/profile" className="text-[var(--color-primary)] hover:underline">
                  প্রোফাইল সেটিংস →
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="mb-3 text-lg font-extrabold">মনে রাখবেন</h2>
              <p className="text-sm leading-relaxed text-[var(--color-body)]">
                লাইভ ক্লাসের যোগদানের লিংক ক্লাস শুরুর আগে যোগ করুন — লিংক না থাকলে শিক্ষার্থীরা শুধু
                &ldquo;লিংক শুরুর আগে দেখা যাবে&rdquo; বার্তাটি দেখবে, কোনো ভুয়া যোগদান বোতাম দেখবে না।
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
