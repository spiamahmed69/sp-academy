/**
 * My Courses — Phase 3.
 *
 * Public page (works in both modes):
 * - Firebase configured + signed in → real Firestore enrollments with progress.
 * - Firebase configured + signed out → login prompt (no fake data).
 * - Demo mode → this browser's localStorage demo enrollments, clearly
 *   labelled ডেমো ভর্তি. They live only in this browser and are not real
 *   enrollments; the real flow starts once Firebase is set up.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CheckCircle2, GraduationCap, PlayCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMyEnrollments } from '../hooks/useCourses'
import { getCourses } from '../firebase/courses'
import {
  demoEnrollmentViews,
  readDemoEnrollments,
  removeDemoEnrollment,
  type DemoEnrollment,
  type EnrollmentView,
} from '../firebase/enrollments'
import { Breadcrumbs, DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'
import { formatBDT } from '../lib/format'

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`অগ্রগতি ${percent}%`}>
      <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

function EnrollmentCard({ view, isDemo, onRemoved }: { view: EnrollmentView; isDemo: boolean; onRemoved?: () => void }) {
  const { course } = view
  return (
    <article className="card flex flex-col p-5 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">
            <Link to={`/courses/${course.slug}`} className="hover:text-[var(--color-primary)]">
              {course.title}
            </Link>
          </h3>
          {isDemo ? <SampleBadge label="ডেমো ভর্তি" /> : <SampleBadge label="ভর্তি" />}
        </div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {course.lessons} লেসন · {course.durationWeeks} সপ্তাহ · {formatBDT(course.discountPrice ?? course.price)}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar percent={view.progressPercent} />
          <span className="shrink-0 text-sm font-bold">{view.progressPercent}%</span>
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          {view.completedCount}/{view.totalLessons}টি লেসন সম্পন্ন
        </p>
      </div>
      <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:flex-col">
        <Link to={`/courses/${course.slug}/learn`} className="btn-primary !px-4 !py-2 text-sm">
          <PlayCircle className="h-4 w-4" /> {view.progressPercent > 0 ? 'চালিয়ে যান' : 'শেখা শুরু করুন'}
        </Link>
        {isDemo && onRemoved && (
          <button
            onClick={onRemoved}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" /> ডেমো ভর্তি মুছুন
          </button>
        )}
      </div>
    </article>
  )
}

export default function MyCourses() {
  const { user, configured } = useAuth()
  const { data: enrollments, isLoading, isError, refetch } = useMyEnrollments()
  // Demo mode keeps its enrollments in component state (seeded from
  // localStorage on mount) so removing one refreshes the list immediately.
  const [demoList, setDemoList] = useState<DemoEnrollment[]>(() => readDemoEnrollments())

  // Demo mode: catalogue (sample) for joining demo enrollments to courses.
  const demoCatalogue = useQuery({
    queryKey: ['courses', 'demo-join'],
    queryFn: getCourses,
    enabled: !configured,
  })
  const demoViews: EnrollmentView[] = !configured
    ? demoEnrollmentViews((courseId) => demoCatalogue.data?.courses.find((c) => c.id === courseId), demoList)
    : []

  return (
    <div>
      <PageHero eyebrow="আমার কোর্স" title="আমার কোর্সসমূহ" subtitle="আপনি যে কোর্সগুলোতে ভর্তি হয়েছেন — অগ্রগতিসহ এক জায়গায়।" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'আমার কোর্স' }]} />

        {!configured && (
          <DemoNotice>
            ডেমো মোড — Firebase এখনো কনফিগার করা হয়নি। নিচের ভর্তিগুলো শুধু এই ব্রাউজারে সংরক্ষিত (ডেমো ভর্তি),
            আসল ভর্তি নয়। Firebase সেটআপ হলে (docs/firebase-setup.md) লগইন করে আসল ভর্তি চালু হবে।
          </DemoNotice>
        )}

        {configured && !user && (
          <div className="card mx-auto max-w-2xl p-6 text-center">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-[var(--color-primary)]" />
            <h2 className="text-lg font-extrabold">আপনার কোর্স দেখতে লগইন করুন</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">
              ভর্তি হওয়া কোর্স ও অগ্রগতি শুধু লগইন করা শিক্ষার্থীরা দেখতে পারে।
            </p>
            <Link to="/login" className="btn-primary mt-5 inline-flex text-sm">
              লগইন করুন
            </Link>
          </div>
        )}

        {configured && user && (
          <>
            {isLoading && (
              <div className="grid gap-4" aria-busy="true" aria-label="আমার কোর্স লোড হচ্ছে">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}
            {isError && <ErrorState onRetry={() => refetch()} />}
            {!isLoading && !isError && (!enrollments || enrollments.length === 0) && (
              <EmptyState
                title="এখনো কোনো কোর্সে ভর্তি হননি"
                message="ফ্রি কোর্স দিয়ে শুরু করুন — পেইড কোর্স কার্টে যোগ করে চেকআউট করতে হয়।"
                action={
                  <Link to="/free-courses" className="btn-primary text-sm">
                    ফ্রি কোর্স দেখুন
                  </Link>
                }
              />
            )}
            {!isLoading && !isError && enrollments && enrollments.length > 0 && (
              <div className="grid gap-4">
                <p className="text-sm text-[var(--color-body)]">
                  {enrollments.length}টি কোর্সে ভর্তি আছেন · মোট {enrollments.reduce((n, e) => n + e.completedCount, 0)}টি লেসন সম্পন্ন
                </p>
                {enrollments.map((view) => (
                  <EnrollmentCard key={view.id} view={view} isDemo={false} />
                ))}
              </div>
            )}
          </>
        )}

        {!configured && (
          <>
            {demoCatalogue.isLoading && (
              <div className="grid gap-4" aria-busy="true" aria-label="ডেমো ভর্তি লোড হচ্ছে">
                <SkeletonCard />
              </div>
            )}
            {!demoCatalogue.isLoading && demoViews.length === 0 && (
              <EmptyState
                title="এখনো কোনো ডেমো ভর্তি নেই"
                message="ফ্রি কোর্সে ভর্তি হোন — ডেমো ভর্তি এই ব্রাউজারেই সংরক্ষিত হবে। পেইড কোর্স কার্টে যোগ করে চেকআউট করতে হয়।"
                action={
                  <Link to="/free-courses" className="btn-primary text-sm">
                    <BookOpen className="h-4 w-4" /> ফ্রি কোর্স দেখুন
                  </Link>
                }
              />
            )}
            {!demoCatalogue.isLoading && demoViews.length > 0 && (
              <div className="grid gap-4">
                <p className="text-sm text-[var(--color-body)]">
                  {demoViews.length}টি ডেমো ভর্তি ·{' '}
                  <CheckCircle2 className="inline h-4 w-4 text-green-600" /> মোট {demoViews.reduce((n, e) => n + e.completedCount, 0)}টি লেসন সম্পন্ন
                </p>
                {demoViews.map((view) => (
                  <EnrollmentCard
                    key={view.id}
                    view={view}
                    isDemo
                    onRemoved={() => {
                      setDemoList(removeDemoEnrollment(view.courseId))
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
