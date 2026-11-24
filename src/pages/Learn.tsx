/**
 * Lesson player — Phase 4.
 *
 * Route: /courses/:slug/learn?lesson=<lessonId>
 *
 * - Sidebar: full lesson outline grouped by chapter, with completion
 *   checkmarks and lock icons. Current lesson is highlighted.
 * - Content: the lesson title + an honest video placeholder. There is NO
 *   real video hosting yet (Cloudflare Stream arrives in a later phase),
 *   so the player never pretends a video is playing — it says plainly
 *   that the video is not added yet.
 * - Lesson text / PDF notes: no lesson body exists in the data yet, so
 *   the page says so honestly instead of inventing content or fake
 *   download links. Teachers add lesson content with Phase 5 tools.
 * - Mark complete: wired to the Phase 3 enrollment progress — a
 *   Firestore transaction when configured, localStorage demo progress
 *   otherwise (labelled ডেমো).
 * - Access: free-preview lessons open for everyone; other lessons need
 *   enrollment in the course.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Circle, FileText,
  Loader2, Lock, PlayCircle, VideoOff,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebase } from '../firebase/config'
import type { LessonView } from '../firebase/courses'
import {
  computeProgressPercent,
  isDemoEnrolled,
  readDemoEnrollments,
  toggleDemoLessonComplete,
  toggleLessonComplete,
} from '../firebase/enrollments'
import { useCourseBySlug, useCourseLessons, useEnrollmentForCourse } from '../hooks/useCourses'
import { useToast } from '../lib/toast'
import {
  isLessonAccessible,
  nextLesson,
  previousLesson,
  resolveCurrentLesson,
} from '../lib/learn'
import { Breadcrumbs, DemoNotice, EmptyState, ErrorState, SkeletonCard } from '../components/ui'

function groupLessons(lessons: LessonView[]): { title: string; lessons: LessonView[] }[] {
  const groups: { title: string; lessons: LessonView[] }[] = []
  for (const lesson of lessons) {
    const existing = groups.find((g) => g.title === lesson.chapterTitle)
    if (existing) existing.lessons.push(lesson)
    else groups.push({ title: lesson.chapterTitle, lessons: [lesson] })
  }
  return groups
}

export default function Learn() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { push } = useToast()
  const { user, configured } = useAuth()
  const { data: course, isLoading, isError } = useCourseBySlug(slug)
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(course ?? null)
  const { data: enrollment, refetch: refetchEnrollment } = useEnrollmentForCourse(course ?? null)

  // Demo mode: enrollment + completed lessons live in localStorage only.
  const [demoEnrolled, setDemoEnrolled] = useState(false)
  const [demoCompleted, setDemoCompleted] = useState<string[]>([])
  const [toggleBusy, setToggleBusy] = useState(false)

  useEffect(() => {
    if (!course || configured) return
    setDemoEnrolled(isDemoEnrolled(course.id))
    setDemoCompleted(readDemoEnrollments().find((e) => e.courseId === course.id)?.completedLessonIds ?? [])
  }, [course, configured])

  const enrolled = configured ? Boolean(enrollment) : demoEnrolled
  const completedIds = configured ? (enrollment?.completedLessonIds ?? []) : demoCompleted
  const totalLessons = lessons.length > 0 ? lessons.length : (course?.lessons ?? 0)
  const progress = computeProgressPercent(completedIds.length, totalLessons)
  const grouped = useMemo(() => groupLessons(lessons), [lessons])

  const current = useMemo(
    () => resolveCurrentLesson(lessons, searchParams.get('lesson'), completedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessons, searchParams, completedIds.length, completedIds.join(',')],
  )
  const prev = current ? previousLesson(lessons, current.id) : undefined
  const next = current ? nextLesson(lessons, current.id) : undefined
  const accessible = current ? isLessonAccessible(current, enrolled) : false
  const done = current ? completedIds.includes(current.id) : false

  const goToLesson = (lessonId: string) => {
    setSearchParams({ lesson: lessonId }, { replace: true })
    window.scrollTo({ top: 0 })
  }

  const toggleComplete = async () => {
    if (!course || !current || !enrolled) return
    setToggleBusy(true)
    try {
      if (configured && user) {
        const fb = getFirebase()
        if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
        await toggleLessonComplete(fb.db, user.uid, course.id, current.id, totalLessons)
        await refetchEnrollment()
        push(done ? 'লেসনটি আবার অসম্পন্ন হিসেবে চিহ্নিত হয়েছে।' : 'লেসন সম্পন্ন হয়েছে — অভিনন্দন!', 'success')
      } else {
        const nextList = toggleDemoLessonComplete(course.id, current.id)
        setDemoCompleted(nextList.find((e) => e.courseId === course.id)?.completedLessonIds ?? [])
        push(
          done ? 'লেসনটি আবার অসম্পন্ন হিসেবে চিহ্নিত হয়েছে (ডেমো)।' : 'লেসন সম্পন্ন হয়েছে (ডেমো) — অগ্রগতি এই ব্রাউজারেই সংরক্ষিত।',
          'success',
        )
      }
    } catch (err) {
      push(err instanceof Error ? err.message : 'আপডেট করা যায়নি।', 'error')
    } finally {
      setToggleBusy(false)
    }
  }

  if (isLoading || lessonsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3" aria-busy="true" aria-label="লেসন লোড হচ্ছে">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (isError || !course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title="কোর্সটি পাওয়া যায়নি"
          message="এই লিংকের কোনো কোর্স নেই। কোর্সের তালিকা থেকে সঠিক কোর্স বেছে নিন।"
        />
        <div className="mt-6 text-center">
          <Link to="/courses" className="btn-primary text-sm">
            সব কোর্স দেখুন
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'কোর্সসমূহ', to: '/courses' }, { label: course.title, to: `/courses/${course.slug}` }, { label: 'শিখুন' }]} />
        {!configured && (
          <DemoNotice>
            ডেমো মোড — Firebase এখনো কনফিগার করা হয়নি। অগ্রগতি শুধু এই ব্রাউজারে সংরক্ষিত হবে (ডেমো ভর্তি)।
          </DemoNotice>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ---- Lesson list sidebar ---- */}
          <aside className="order-2 lg:order-1">
            <div className="card p-5 lg:sticky lg:top-24">
              <h2 className="font-extrabold">{course.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {completedIds.length}/{totalLessons} লেসন সম্পন্ন · {progress}%
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`অগ্রগতি ${progress}%`}>
                <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-5 space-y-4">
                {grouped.length === 0 && <p className="text-sm text-[var(--color-muted)]">এই কোর্সের সিলেবাস শীঘ্রই যুক্ত হবে।</p>}
                {grouped.map((group, i) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-bold text-[var(--color-heading)]">
                      অধ্যায় {i + 1}: {group.title}
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {group.lessons.map((lesson) => {
                        const isDone = completedIds.includes(lesson.id)
                        const locked = !isLessonAccessible(lesson, enrolled)
                        const isCurrent = current?.id === lesson.id
                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() => goToLesson(lesson.id)}
                              className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                                isCurrent
                                  ? 'bg-[var(--color-primary-soft)] font-bold text-[var(--color-primary)]'
                                  : 'text-[var(--color-body)] hover:bg-blue-50 dark:hover:bg-slate-800'
                              }`}
                              aria-current={isCurrent ? 'true' : undefined}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                              ) : locked ? (
                                <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                              ) : (
                                <Circle className="h-4 w-4 shrink-0" />
                              )}
                              <span className={`min-w-0 flex-1 truncate ${isDone ? 'line-through opacity-70' : ''}`}>{lesson.title}</span>
                              {lesson.isPreview && (
                                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                  ফ্রি
                                </span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <Link to={`/courses/${course.slug}`} className="btn-outline mt-5 w-full text-sm">
                কোর্সের বিস্তারিত দেখুন
              </Link>
            </div>
          </aside>

          {/* ---- Lesson content ---- */}
          <section className="order-1 lg:order-2 lg:col-span-2">
            {!current ? (
              <EmptyState
                title="এই কোর্সে এখনো কোনো লেসন নেই"
                message="শিক্ষক শীঘ্রই লেসন যুক্ত করবেন।"
                action={
                  <Link to={`/courses/${course.slug}`} className="btn-primary text-sm">
                    কোর্সের পেজে যান
                  </Link>
                }
              />
            ) : !accessible ? (
              <div className="card p-8 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted)]" />
                <h1 className="text-2xl font-extrabold">{current.title}</h1>
                <p className="mx-auto mt-3 max-w-md leading-relaxed text-[var(--color-body)]">
                  এই লেসনটি দেখতে কোর্সে ভর্তি হতে হবে। ফ্রি কোর্সে এখনই ভর্তি হওয়া যায়; পেইড কোর্স কার্টে
                  যোগ করে চেকআউট করতে হয়।
                </p>
                <Link to={`/courses/${course.slug}`} className="btn-primary mt-6 inline-flex">
                  কোর্সের পেজে গিয়ে ভর্তি হোন
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-[var(--color-primary)]">
                  {current.chapterTitle}
                  {current.isPreview ? ' · ফ্রি প্রিভিউ' : ''}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{current.title}</h1>

                {/* Honest video placeholder — no video hosting exists yet. */}
                <div className="mt-5 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-[#0b2a4a] via-[#123f6d] to-[#1e6fb8] dark:border-slate-700">
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center text-white">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                      <VideoOff className="h-8 w-8" />
                    </span>
                    <p className="text-lg font-extrabold">এই লেসনের ভিডিও এখনো যুক্ত হয়নি</p>
                    <p className="max-w-md text-sm leading-relaxed text-blue-100">
                      ভিডিও হোস্টিং (Cloudflare Stream) পরের ধাপে আসছে। ততদিন লেসনের লেখা ও রিসোর্স নিচে দেখুন —
                      এখানে কোনো ভিডিও চলছে বলে দেখানো হচ্ছে না।
                    </p>
                  </div>
                </div>

                {/* Lesson text — none exists yet; say so instead of inventing it. */}
                <div className="card mt-6 p-6">
                  <h2 className="flex items-center gap-2 text-lg font-extrabold">
                    <BookOpen className="h-5 w-5 text-[var(--color-primary)]" /> লেসনের লেখা
                  </h2>
                  <p className="mt-3 leading-relaxed text-[var(--color-body)]">
                    এই লেসনের লেখা কনটেন্ট শিক্ষক এখনো যুক্ত করেননি। শিক্ষক লেসন লেখার টুল থেকে লেখা যুক্ত
                    করলে এখানে আসল পাঠ্য, উদাহরণ ও অনুশীলনী দেখা যাবে।
                  </p>
                </div>

                {/* Resources — no fake download links. */}
                <div className="card mt-6 p-6">
                  <h2 className="flex items-center gap-2 text-lg font-extrabold">
                    <FileText className="h-5 w-5 text-[var(--color-primary)]" /> লেসনের রিসোর্স
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--color-body)]">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      PDF নোট — শিক্ষক এখনো আপলোড করেননি। আপলোড হলে এখানেই ডাউনলোড লিংক দেখা যাবে।
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      অনুশীলনী — মডেল টেস্টে অংশ নেওয়ার সুযোগ আছে; সার্টিফিকেট ব্যবস্থা এখনো চালু হয়নি।
                    </li>
                  </ul>
                </div>

                {/* Mark complete + prev/next */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => void toggleComplete()}
                    disabled={toggleBusy}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-bold disabled:opacity-60 ${
                      done ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'btn-primary'
                    }`}
                  >
                    {toggleBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    {done ? 'সম্পন্ন হয়েছে — সরাতে ক্লিক করুন' : 'লেসন সম্পন্ন হিসেবে চিহ্নিত করুন'}
                  </button>
                  <span className="text-sm text-[var(--color-muted)]">
                    অগ্রগতি {progress}% · {completedIds.length}/{totalLessons} লেসন
                  </span>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  {prev ? (
                    <button onClick={() => goToLesson(prev.id)} className="btn-outline cursor-pointer text-sm">
                      <ChevronLeft className="h-4 w-4" /> আগের লেসন
                    </button>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <button onClick={() => goToLesson(next.id)} className="btn-primary cursor-pointer text-sm">
                      পরের লেসন <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link to="/my-courses" className="btn-primary text-sm">
                      আমার কোর্সে ফিরুন
                    </Link>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
