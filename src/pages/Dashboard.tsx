/**
 * Student dashboard (overview) — Phase 4.
 *
 * Protected route: shows the signed-in user's profile, role and real
 * enrollments from Firestore (Phase 3), lesson progress (Phase 4),
 * certificates (honest empty state until the backend (Phase 10) issues any),
 * and teasers for upcoming live classes + exams — both wired to their
 * services (Firestore when configured, labelled sample otherwise).
 */
import { Link } from 'react-router-dom'
import {
  Award, BookOpen, CalendarDays, ClipboardList, GraduationCap, LogOut,
  PlayCircle, Settings, Trophy,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCourseLessons, useMyCertificates, useMyEnrollments } from '../hooks/useCourses'
import { useLiveClasses } from '../hooks/useLiveClasses'
import { useExams } from '../hooks/useExams'
import { examPhase } from '../firebase/exams'
import { classifyLiveClass } from '../firebase/liveClasses'
import { firstIncompleteLesson } from '../lib/learn'
import { canAccess, ROLE_LABELS } from '../lib/roles'
import { formatIssuedAt } from '../firebase/certificates'
import { Breadcrumbs, EmptyState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'
import { formatBDT, toBanglaDigits } from '../lib/format'

function formatLiveClassTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('bn-BD', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
}

export default function Dashboard() {
  const { user, profile, role, logout } = useAuth()
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments()
  const { data: certificates, isLoading: certificatesLoading } = useMyCertificates()
  const { data: liveData } = useLiveClasses()
  const { data: examsData } = useExams()
  const isTeacher = canAccess(role, ['teacher', 'admin', 'super_admin'])

  // Upcoming exams — Firestore when configured, labelled sample otherwise.
  const upcomingExams = (examsData?.exams ?? [])
    .filter((e) => e.status === 'published' && examPhase(e) !== 'closed')
    .sort((a, b) => {
      const aTime = a.scheduledAt ? Date.parse(a.scheduledAt) : 0
      const bTime = b.scheduledAt ? Date.parse(b.scheduledAt) : 0
      return aTime - bTime
    })
    .slice(0, 3)
  const examsAreSample = examsData?.source === 'sample'

  // Upcoming live classes — Firestore when configured, labelled sample otherwise.
  const upcomingLiveClasses = (liveData?.classes ?? [])
    .filter((c) => {
      const phase = classifyLiveClass(c)
      return phase === 'upcoming' || phase === 'live'
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, 3)

  const enrolled = enrollments ?? []
  const completedLessons = enrolled.reduce((n, e) => n + e.completedCount, 0)
  const totalLessons = enrolled.reduce((n, e) => n + e.totalLessons, 0)
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Continue learning: the most recently enrolled course (Phase 3 sorts newest first).
  const continueEnrollment = enrolled[0]
  const { data: continueLessons = [] } = useCourseLessons(continueEnrollment?.course ?? null)
  const nextLesson = continueEnrollment
    ? firstIncompleteLesson(continueLessons, continueEnrollment.completedLessonIds)
    : undefined
  const continueHref = continueEnrollment
    ? `/courses/${continueEnrollment.course.slug}/learn${nextLesson ? `?lesson=${nextLesson.id}` : ''}`
    : '/free-courses'

  return (
    <div>
      <PageHero
        eyebrow="ড্যাশবোর্ড"
        title={`স্বাগতম, ${profile?.displayName || 'শিক্ষার্থী'}!`}
        subtitle="আপনার শেখার অগ্রগতি, আসন্ন ক্লাস ও পরীক্ষা এক জায়গায় দেখুন।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'ড্যাশবোর্ড' }]} />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, label: 'আমার কোর্স', value: String(enrolled.length) },
            { icon: GraduationCap, label: 'সম্পন্ন লেসন', value: String(completedLessons) },
            { icon: Trophy, label: 'সামগ্রিক অগ্রগতি', value: `${overallProgress}%` },
            { icon: Award, label: 'সার্টিফিকেট', value: String(certificates?.length ?? 0) },
          ].map((s) => (
            <div key={s.label} className="card flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
                <s.icon className="h-6 w-6 text-[var(--color-primary)]" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold">{s.value}</span>
                <span className="text-sm text-[var(--color-muted)]">{s.label}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* ---- Continue learning ---- */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">শেখা চালিয়ে যান</h2>
                <Link to="/my-courses" className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                  সবগুলো দেখুন →
                </Link>
              </div>
              {enrollmentsLoading && (
                <div className="grid gap-3" aria-busy="true" aria-label="আমার কোর্স লোড হচ্ছে">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}
              {!enrollmentsLoading && enrolled.length === 0 && (
                <EmptyState
                  title="এখনো কোনো কোর্সে ভর্তি হননি"
                  message="ফ্রি কোর্স দিয়ে শুরু করুন — পেইড কোর্সে ভর্তি Phase 8-এ (পেমেন্ট) চালু হবে।"
                  action={
                    <Link to="/free-courses" className="btn-primary text-sm">
                      ফ্রি কোর্স দেখুন
                    </Link>
                  }
                />
              )}
              {!enrollmentsLoading && continueEnrollment && (
                <div>
                  <Link to={continueHref} className="block rounded-2xl border border-blue-100 p-4 transition hover:border-[var(--color-primary)] dark:border-slate-700">
                    <span className="flex flex-wrap items-center justify-between gap-3">
                      <span>
                        <span className="block font-bold">{continueEnrollment.course.title}</span>
                        <span className="text-sm text-[var(--color-muted)]">
                          {nextLesson ? `পরবর্তী লেসন: ${nextLesson.title}` : 'সব লেসন সম্পন্ন হয়েছে — অভিনন্দন!'} ·{' '}
                          {continueEnrollment.completedCount}/{continueEnrollment.totalLessons} লেসন ·{' '}
                          {formatBDT(continueEnrollment.course.discountPrice ?? continueEnrollment.course.price)}
                        </span>
                      </span>
                      <span className="btn-primary inline-flex !px-4 !py-2 text-sm">
                        <PlayCircle className="h-4 w-4" /> {continueEnrollment.progressPercent > 0 ? 'চালিয়ে যান' : 'শেখা শুরু করুন'}
                      </span>
                    </span>
                    <span className="mt-3 flex items-center gap-3">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700">
                        <span className="block h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${continueEnrollment.progressPercent}%` }} />
                      </span>
                      <span className="text-xs font-bold">{continueEnrollment.progressPercent}%</span>
                    </span>
                  </Link>

                  {/* ---- My courses (all enrollments) ---- */}
                  {enrolled.length > 1 && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-sm font-bold text-[var(--color-heading)]">আমার অন্যান্য কোর্স</h3>
                      {enrolled.slice(1).map((e) => (
                        <Link key={e.id} to={`/courses/${e.course.slug}/learn`} className="block rounded-2xl border border-blue-100 p-4 transition hover:border-[var(--color-primary)] dark:border-slate-700">
                          <span className="flex flex-wrap items-center justify-between gap-3">
                            <span>
                              <span className="block font-bold">{e.course.title}</span>
                              <span className="text-sm text-[var(--color-muted)]">
                                {e.completedCount}/{e.totalLessons} লেসন সম্পন্ন
                              </span>
                            </span>
                            <span className="text-sm font-bold text-[var(--color-primary)]">{e.progressPercent}%</span>
                          </span>
                          <span className="mt-3 block h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700">
                            <span className="block h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${e.progressPercent}%` }} />
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ---- Certificates (honest empty state until the backend issues any) ---- */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">আমার সার্টিফিকেট</h2>
                <SampleBadge label="ব্যাকএন্ডে আসছে" />
              </div>
              {certificatesLoading && <SkeletonCard />}
              {!certificatesLoading && (!certificates || certificates.length === 0) && (
                <EmptyState
                  title="এখনো কোনো সার্টিফিকেট নেই"
                  message="পরীক্ষায় উত্তীর্ণ হলে সার্টিফিকেট এখানে দেখা যাবে — সার্টিফিকেট ইস্যু ব্যাকএন্ডে (Phase 10) আসছে। এখানে কোনো নমুনা সার্টিফিকেট দেখানো হচ্ছে না।"
                  action={
                    <Link to="/exams" className="btn-primary text-sm">
                      পরীক্ষা দেখুন
                    </Link>
                  }
                />
              )}
              {!certificatesLoading && certificates && certificates.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                      <Award className="mb-2 h-8 w-8 text-amber-500" />
                      <p className="font-bold">{cert.courseTitle}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        ইস্যু: {formatIssuedAt(cert.issuedAt)}
                        {cert.grade ? ` · গ্রেড: ${cert.grade}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            {/* ---- Upcoming live classes (Firestore when configured, নমুনা otherwise) ---- */}
            <div className="card p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">আসন্ন লাইভ ক্লাস</h2>
                {liveData?.source === 'sample' && <SampleBadge />}
              </div>
              {upcomingLiveClasses.length === 0 ? (
                <p className="text-sm text-[var(--color-body)]">আসন্ন কোনো লাইভ ক্লাস নেই।</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingLiveClasses.map((lc) => (
                    <li key={lc.id} className="border-b border-blue-50 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                      <Link to="/live-classes" className="font-bold hover:text-[var(--color-primary)]">
                        {lc.title}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <CalendarDays className="h-3.5 w-3.5" /> {formatLiveClassTime(lc.startsAt)} · {lc.durationMin} মিনিট
                        {liveData?.source === 'sample' ? ' (নমুনা)' : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/live-classes" className="mt-4 inline-block text-sm font-bold text-[var(--color-primary)] hover:underline">
                সব লাইভ ক্লাস →
              </Link>
            </div>

            {/* ---- Upcoming exams (Firestore when configured, নমুনা otherwise) ---- */}
            <div className="card p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">আসন্ন পরীক্ষা</h2>
                {examsAreSample && <SampleBadge />}
              </div>
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-[var(--color-body)]">আপাতত কোনো আসন্ন পরীক্ষা নেই।</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingExams.map((ex) => (
                    <li key={ex.id} className="border-b border-blue-50 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                      <Link to={`/exams/${ex.id}/attempt`} className="font-bold hover:text-[var(--color-primary)]">
                        {ex.title}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <ClipboardList className="h-3.5 w-3.5" />{' '}
                        {ex.scheduledAt
                          ? new Date(ex.scheduledAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })
                          : 'যেকোনো সময়'}{' '}
                        · {toBanglaDigits(ex.totalMarks)} নম্বর · {toBanglaDigits(ex.questionCount)}টি প্রশ্ন
                        {examsAreSample ? ' (নমুনা)' : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/exams" className="mt-4 inline-block text-sm font-bold text-[var(--color-primary)] hover:underline">
                সব পরীক্ষা →
              </Link>
            </div>

            <div className="card p-6">
              <h2 className="mb-3 text-lg font-extrabold">আমার অ্যাকাউন্ট</h2>
              <p className="text-sm leading-relaxed text-[var(--color-body)]">
                <strong>{profile?.displayName || '—'}</strong>
                <br />
                {user?.email}
                <br />
                রোল: <strong>{profile ? ROLE_LABELS[profile.role] : '—'}</strong>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/profile" className="btn-primary !px-4 !py-2 text-sm">
                  <Settings className="h-4 w-4" /> প্রোফাইল সেটিংস
                </Link>
                <button
                  onClick={() => void logout()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" /> লগআউট
                </button>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="mb-3 text-lg font-extrabold">দ্রুত লিংক</h2>
              <div className="grid gap-2 text-sm font-semibold">
                <Link to="/my-courses" className="text-[var(--color-primary)] hover:underline">
                  আমার কোর্স →
                </Link>
                {isTeacher && (
                  <Link to="/teacher" className="text-[var(--color-primary)] hover:underline">
                    শিক্ষক ড্যাশবোর্ড →
                  </Link>
                )}
                <Link to="/live-classes" className="text-[var(--color-primary)] hover:underline">
                  আসন্ন লাইভ ক্লাস →
                </Link>
                <Link to="/exams" className="text-[var(--color-primary)] hover:underline">
                  আমার পরীক্ষা →
                </Link>
                <Link to="/books" className="text-[var(--color-primary)] hover:underline">
                  বুক স্টোর →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
