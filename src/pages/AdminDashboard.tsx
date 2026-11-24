/**
 * Admin dashboard — Phase 7.
 *
 * Route: /admin (admin / super_admin only — the guard lives here so the
 * demo preview still works when Firebase is not configured, like /teacher).
 *
 * Real mode (Firebase configured + admin signed in): overview stats are
 * live Firestore counts (never hardcoded), user list from users/{uid},
 * course moderation (publish / unpublish / delete), exam moderation
 * (publish / unpublish / delete), live-class moderation (cancel).
 * Role changes update the Firestore profile doc — the custom claim the
 * security rules enforce is set via console / Admin SDK (Phase 10 backend
 * keeps the two in sync); the UI says this plainly.
 *
 * Demo mode (Firebase not configured): a labelled নমুনা preview — sample
 * users, the sample catalogue, sample exams/classes. Write buttons are
 * replaced by a note that real changes need Firebase + an admin login.
 * No fake users, no fake stats, no fake reports: the reports tab honestly
 * says no reports exist yet (user reporting arrives with Phase 9).
 */
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Ban, BookOpen, CalendarDays, CheckCircle2, FileText, Flag, LayoutDashboard,
  Radio, Search, ShieldAlert, ShieldCheck, Trash2, Users,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebase } from '../firebase/config'
import {
  canManageUsers,
  countSuperAdmins,
  setUserDisabled,
  setUserRole,
  validateDisableUser,
  validateRoleChange,
  type AdminOverviewStats,
} from '../firebase/admin'
import { setCourseStatus } from '../firebase/courses'
import { deleteCourseAdmin } from '../firebase/admin'
import { deleteExam, setExamStatus } from '../firebase/exams'
import { cancelLiveClass } from '../firebase/liveClasses'
import { useAdminCourses, useAdminExams, useAdminLiveClasses, useAdminOverview, useAdminUsers } from '../hooks/useAdmin'
import { ROLE_LABELS, ROLES, type Role } from '../lib/roles'
import { useToast } from '../lib/toast'
import { Breadcrumbs, DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'
import type { UserProfile } from '../firebase/profiles'

type Tab = 'overview' | 'users' | 'courses' | 'exams' | 'classes' | 'reports'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'সারসংক্ষেপ', icon: LayoutDashboard },
  { id: 'users', label: 'ব্যবহারকারী', icon: Users },
  { id: 'courses', label: 'কোর্স', icon: BookOpen },
  { id: 'exams', label: 'পরীক্ষা', icon: FileText },
  { id: 'classes', label: 'লাইভ ক্লাস', icon: Radio },
  { id: 'reports', label: 'রিপোর্ট', icon: Flag },
]

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('bn-BD', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-bold text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-[var(--color-heading)]">{value.toLocaleString('bn-BD')}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { user, role, loading, configured } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [userQuery, setUserQuery] = useState('')
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState<string | null>(null)
  const [confirmDeleteExam, setConfirmDeleteExam] = useState<string | null>(null)
  const [confirmCancelClass, setConfirmCancelClass] = useState<string | null>(null)

  const overview = useAdminOverview()
  const usersQ = useAdminUsers()
  const coursesQ = useAdminCourses()
  const examsQ = useAdminExams()
  const classesQ = useAdminLiveClasses()

  const isDemo = !configured
  const isAdmin = canManageUsers(role)
  const users = usersQ.data?.data ?? []
  const superAdminCount = useMemo(() => countSuperAdmins(users), [users])
  const source = overview.data?.source ?? 'sample'

  const invalidate = (keys: string[][]) => {
    void Promise.all(keys.map((k) => queryClient.invalidateQueries({ queryKey: k })))
  }

  const roleMutation = useMutation({
    mutationFn: async ({ targetUid, newRole }: { targetUid: string; newRole: Role }) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await setUserRole(fb.db, targetUid, newRole)
    },
    onSuccess: () => {
      push('রোল পরিবর্তন করা হয়েছে।', 'success')
      invalidate([['admin-users'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'রোল পরিবর্তন করা যায়নি।', 'error'),
  })

  const disableMutation = useMutation({
    mutationFn: async ({ targetUid, disabled }: { targetUid: string; disabled: boolean }) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await setUserDisabled(fb.db, targetUid, disabled)
    },
    onSuccess: (_d, vars) => {
      push(vars.disabled ? 'অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে।' : 'অ্যাকাউন্ট আবার সক্রিয় করা হয়েছে।', 'success')
      invalidate([['admin-users'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'অ্যাকাউন্টের অবস্থা বদলানো যায়নি।', 'error'),
  })

  const courseStatusMutation = useMutation({
    mutationFn: async ({ courseId, status }: { courseId: string; status: 'published' | 'draft' | 'archived' }) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await setCourseStatus(fb.db, courseId, status)
    },
    onSuccess: () => {
      push('কোর্সের অবস্থা বদলানো হয়েছে।', 'success')
      invalidate([['admin-courses'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'কোর্সের অবস্থা বদলানো যায়নি।', 'error'),
  })

  const courseDeleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await deleteCourseAdmin(fb.db, courseId)
    },
    onSuccess: () => {
      push('কোর্স মুছে ফেলা হয়েছে।', 'success')
      setConfirmDeleteCourse(null)
      invalidate([['admin-courses'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'কোর্স মোছা যায়নি।', 'error'),
  })

  const examStatusMutation = useMutation({
    mutationFn: async ({ examId, status }: { examId: string; status: 'draft' | 'published' }) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await setExamStatus(fb.db, examId, status)
    },
    onSuccess: () => {
      push('পরীক্ষার অবস্থা বদলানো হয়েছে।', 'success')
      invalidate([['admin-exams'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'পরীক্ষার অবস্থা বদলানো যায়নি।', 'error'),
  })

  const examDeleteMutation = useMutation({
    mutationFn: async (examId: string) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await deleteExam(fb.db, examId)
    },
    onSuccess: () => {
      push('পরীক্ষা মুছে ফেলা হয়েছে।', 'success')
      setConfirmDeleteExam(null)
      invalidate([['admin-exams'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'পরীক্ষা মোছা যায়নি।', 'error'),
  })

  const classCancelMutation = useMutation({
    mutationFn: async (classId: string) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await cancelLiveClass(fb.db, classId)
    },
    onSuccess: () => {
      push('লাইভ ক্লাস বাতিল করা হয়েছে।', 'success')
      setConfirmCancelClass(null)
      invalidate([['admin-live-classes'], ['admin-overview']])
    },
    onError: (err) => push(err instanceof Error ? err.message : 'ক্লাস বাতিল করা যায়নি।', 'error'),
  })

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Real mode: must be signed in as an admin.
  if (!isDemo && !user) {
    return (
      <div>
        <PageHero eyebrow="অ্যাডমিন" title="লগইন প্রয়োজন" subtitle="অ্যাডমিন ড্যাশবোর্ড দেখতে অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।" />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="card p-6 text-center">
            <Link to="/login" className="btn-primary inline-flex">
              লগইন পেজে যান
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isDemo && user && !isAdmin) {
    return (
      <div>
        <PageHero eyebrow="অনুমতি নেই" title="এই পেজটি আপনার জন্য নয়" subtitle="অ্যাডমিন ড্যাশবোর্ড শুধু অ্যাডমিন ও সুপার অ্যাডমিনদের জন্য।" />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="card flex flex-col items-center px-6 py-10 text-center" role="alert">
            <ShieldAlert className="mb-4 h-10 w-10 text-amber-500" />
            <p className="leading-relaxed text-[var(--color-body)]">
              আপনার রোল: <strong>{role ? ROLE_LABELS[role] : '—'}</strong>। অ্যাডমিন হতে হলে একজন সুপার অ্যাডমিনকে
              আপনার রোল বদলাতে হবে — নিজে নিজে রোল বদলানো যায় না।
            </p>
            <Link to="/dashboard" className="btn-primary mt-5 inline-flex">
              ড্যাশবোর্ডে যান
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const stats: AdminOverviewStats | null = overview.data?.data ?? null
  const filteredUsers = users.filter((u) => {
    const q = userQuery.trim().toLowerCase()
    if (!q) return true
    return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  function handleRoleChange(target: UserProfile, newRole: Role) {
    if (!user || !role) return
    const error = validateRoleChange({
      actorUid: user.uid,
      actorRole: role,
      targetUid: target.uid,
      targetRole: target.role,
      newRole,
      superAdminCount,
    })
    if (error) {
      push(error, 'error')
      return
    }
    roleMutation.mutate({ targetUid: target.uid, newRole })
  }

  function handleDisable(target: UserProfile) {
    if (!user || !role) return
    const error = validateDisableUser({
      actorUid: user.uid,
      actorRole: role,
      targetUid: target.uid,
      targetRole: target.role,
      superAdminCount,
    })
    if (error) {
      push(error, 'error')
      return
    }
    disableMutation.mutate({ targetUid: target.uid, disabled: !target.disabled })
  }

  return (
    <div>
      <PageHero
        eyebrow="অ্যাডমিন"
        title="অ্যাডমিন ড্যাশবোর্ড"
        subtitle={
          isDemo
            ? 'ডেমো প্রিভিউ — এখানকার সব তথ্য নমুনা। আসল পরিসংখ্যান ও ব্যবস্থাপনা Firebase সেটআপের পর চালু হবে।'
            : 'প্ল্যাটফর্মের আসল তথ্য — ব্যবহারকারী, কোর্স, পরীক্ষা ও লাইভ ক্লাস এক জায়গায়।'
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'অ্যাডমিন' }]} />

        {isDemo && (
          <DemoNotice>
            এটি <strong>ডেমো প্রিভিউ</strong> — নমুনা ব্যবহারকারী, কোর্স, পরীক্ষা ও ক্লাস দেখানো হচ্ছে। রোল বদল, প্রকাশনা
            বা মোছার মতো আসল পরিবর্তন করতে Firebase সেটআপ + অ্যাডমিন লগইন দরকার।
          </DemoNotice>
        )}

        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="অ্যাডমিন বিভাগ">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                tab === t.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)] dark:bg-[#12233c]'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {source === 'sample' && <SampleBadge />}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            {overview.isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : overview.isError || !stats ? (
              <ErrorState onRetry={() => void overview.refetch()} />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatCard label="মোট ব্যবহারকারী" value={stats.totalUsers} sub={`শিক্ষার্থী ${stats.usersByRole.student.toLocaleString('bn-BD')} · শিক্ষক ${stats.usersByRole.teacher.toLocaleString('bn-BD')} · অ্যাডমিন ${stats.usersByRole.admin.toLocaleString('bn-BD')} · সুপার অ্যাডমিন ${stats.usersByRole.super_admin.toLocaleString('bn-BD')}`} />
                  <StatCard label="মোট কোর্স" value={stats.totalCourses} sub={`প্রকাশিত ${stats.publishedCourses.toLocaleString('bn-BD')} · ড্রাফট ${stats.draftCourses.toLocaleString('bn-BD')} · আর্কাইভ ${stats.archivedCourses.toLocaleString('bn-BD')}`} />
                  <StatCard label="মোট ভর্তি" value={stats.totalEnrollments} sub={`সক্রিয় ${stats.activeEnrollments.toLocaleString('bn-BD')}টি ভর্তি`} />
                  <StatCard label="মোট পরীক্ষা" value={stats.totalExams} sub={`প্রকাশিত ${stats.publishedExams.toLocaleString('bn-BD')}টি`} />
                  <StatCard label="লাইভ ক্লাস" value={stats.totalLiveClasses} sub={`আসন্ন ${stats.upcomingLiveClasses.toLocaleString('bn-BD')}টি`} />
                  <StatCard label="পরীক্ষার চেষ্টা" value={stats.totalAttempts} sub="জমা দেওয়া মোট চেষ্টা" />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                  {source === 'firestore'
                    ? 'উপরের প্রতিটি সংখ্যা Firestore থেকে সরাসরি গোনা — কোনো সংখ্যা আগে থেকে লেখা নয়।'
                    : 'উপরের সংখ্যাগুলো নমুনা ডেটা থেকে গোনা। নমুনা ডেটায় ভর্তি ও পরীক্ষার চেষ্টার তথ্য নেই বলে সেখানে ০ দেখাচ্ছে — এটা আসল শূন্য নয়, নমুনার সীমা।'}
                </p>
              </>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 p-4 dark:border-slate-700">
              <h2 className="text-lg font-bold">ব্যবহারকারী ({users.length.toLocaleString('bn-BD')})</h2>
              <label className="relative">
                <span className="sr-only">ব্যবহারকারী খুঁজুন</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="নাম বা ইমেইল খুঁজুন..."
                  className="rounded-full border border-blue-100 bg-[var(--color-page)] py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
                />
              </label>
            </div>
            <p className="border-b border-blue-100 bg-blue-50/50 px-4 py-3 text-xs leading-relaxed text-[var(--color-body)] dark:border-slate-700 dark:bg-slate-800/50">
              রোল বদলালে ব্যবহারকারীর Firestore প্রোফাইল আপডেট হয়। নিরাপত্তা নিয়মে ব্যবহৃত custom claim console / Admin
              SDK দিয়ে সেট করতে হয় — Phase 10-এর ব্যাকএন্ডে দুটো একসাথে আপডেট হবে। নিজের রোল নিজে বদলানো যায় না, আর
              শেষ সুপার অ্যাডমিনকে সরানো যায় না।
            </p>
            {usersQ.isPending ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : usersQ.isError ? (
              <div className="p-4">
                <ErrorState onRetry={() => void usersQ.refetch()} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4">
                <EmptyState title="কেউ পাওয়া যায়নি" message="এই খোঁজের সাথে মেলে এমন কোনো ব্যবহারকারী নেই।" />
              </div>
            ) : (
              <ul className="divide-y divide-blue-100 dark:divide-slate-700">
                {filteredUsers.map((u) => (
                  <li key={u.uid} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-white">
                      {(u.displayName || u.email || '?').trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--color-heading)]">
                        {u.displayName || 'নাম নেই'} {u.disabled && <span className="text-red-600">(নিষ্ক্রিয়)</span>}
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted)]">{u.email}</p>
                    </div>
                    {isDemo ? (
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                        {ROLE_LABELS[u.role]}
                      </span>
                    ) : (
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <span className="sr-only">রোল</span>
                        <select
                          value={u.role}
                          disabled={roleMutation.isPending || u.uid === user?.uid}
                          onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                          className="cursor-pointer rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {!isDemo && (
                      <button
                        onClick={() => handleDisable(u)}
                        disabled={disableMutation.isPending || u.uid === user?.uid}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-900/20"
                      >
                        {u.disabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        {u.disabled ? 'সক্রিয় করুন' : 'নিষ্ক্রিয় করুন'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!isDemo && (
              <p className="border-t border-blue-100 px-4 py-3 text-xs leading-relaxed text-[var(--color-muted)] dark:border-slate-700">
                নিষ্ক্রিয় অ্যাকাউন্ট নতুন ভর্তি বা পরীক্ষার চেষ্টা করতে পারে না (Firestore নিয়মে আটকানো)। সম্পূর্ণভাবে
                লগইন বন্ধ করতে (Auth-level) ব্যাকএন্ড দরকার — Phase 10-এ আসছে।
              </p>
            )}
          </div>
        )}

        {tab === 'courses' && (
          <div className="card overflow-hidden">
            <div className="border-b border-blue-100 p-4 dark:border-slate-700">
              <h2 className="text-lg font-bold">কোর্স মডারেশন ({(coursesQ.data?.data ?? []).length.toLocaleString('bn-BD')})</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">ড্রাফটসহ সব কোর্স — প্রকাশ, ড্রাফটে ফেরত বা মোছা যায়।</p>
            </div>
            {coursesQ.isPending ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : coursesQ.isError ? (
              <div className="p-4">
                <ErrorState onRetry={() => void coursesQ.refetch()} />
              </div>
            ) : (coursesQ.data?.data ?? []).length === 0 ? (
              <div className="p-4">
                <EmptyState title="কোনো কোর্স নেই" message="এখনো কোনো কোর্স তৈরি হয়নি।" />
              </div>
            ) : (
              <ul className="divide-y divide-blue-100 dark:divide-slate-700">
                {(coursesQ.data?.data ?? []).map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--color-heading)]">{c.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {c.status === 'draft' ? 'ড্রাফট' : c.status === 'archived' ? 'আর্কাইভ' : 'প্রকাশিত'} ·{' '}
                        {c.isFree ? 'ফ্রি' : `৳${c.price.toLocaleString('bn-BD')}`} · {c.lessons.toLocaleString('bn-BD')} লেসন ·{' '}
                        {c.students.toLocaleString('bn-BD')} শিক্ষার্থী
                      </p>
                    </div>
                    {isDemo ? (
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                        {c.status === 'draft' ? 'ড্রাফট' : 'প্রকাশিত'}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {c.status === 'published' ? (
                          <button
                            onClick={() => courseStatusMutation.mutate({ courseId: c.id, status: 'draft' })}
                            disabled={courseStatusMutation.isPending}
                            className="cursor-pointer rounded-full border border-blue-100 px-3 py-1.5 text-xs font-bold hover:bg-[var(--color-primary-soft)] disabled:opacity-50"
                          >
                            ড্রাফটে ফেরান
                          </button>
                        ) : (
                          <button
                            onClick={() => courseStatusMutation.mutate({ courseId: c.id, status: 'published' })}
                            disabled={courseStatusMutation.isPending}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            প্রকাশ করুন
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirmDeleteCourse === c.id) courseDeleteMutation.mutate(c.id)
                            else setConfirmDeleteCourse(c.id)
                          }}
                          disabled={courseDeleteMutation.isPending}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                            confirmDeleteCourse === c.id
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDeleteCourse === c.id ? 'নিশ্চিত করুন' : 'মুছুন'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'exams' && (
          <div className="card overflow-hidden">
            <div className="border-b border-blue-100 p-4 dark:border-slate-700">
              <h2 className="text-lg font-bold">পরীক্ষা মডারেশন ({(examsQ.data?.data ?? []).length.toLocaleString('bn-BD')})</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">ড্রাফটসহ সব পরীক্ষা — প্রকাশ, ড্রাফটে ফেরত বা মোছা যায়।</p>
            </div>
            {examsQ.isPending ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : examsQ.isError ? (
              <div className="p-4">
                <ErrorState onRetry={() => void examsQ.refetch()} />
              </div>
            ) : (examsQ.data?.data ?? []).length === 0 ? (
              <div className="p-4">
                <EmptyState title="কোনো পরীক্ষা নেই" message="এখনো কোনো পরীক্ষা তৈরি হয়নি।" />
              </div>
            ) : (
              <ul className="divide-y divide-blue-100 dark:divide-slate-700">
                {(examsQ.data?.data ?? []).map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--color-heading)]">{e.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {e.status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'} · {e.durationMin.toLocaleString('bn-BD')} মিনিট ·{' '}
                        {e.totalMarks.toLocaleString('bn-BD')} নম্বর · {e.questionCount.toLocaleString('bn-BD')} প্রশ্ন
                      </p>
                    </div>
                    {isDemo ? (
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                        {e.status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {e.status === 'published' ? (
                          <button
                            onClick={() => examStatusMutation.mutate({ examId: e.id, status: 'draft' })}
                            disabled={examStatusMutation.isPending}
                            className="cursor-pointer rounded-full border border-blue-100 px-3 py-1.5 text-xs font-bold hover:bg-[var(--color-primary-soft)] disabled:opacity-50"
                          >
                            ড্রাফটে ফেরান
                          </button>
                        ) : (
                          <button
                            onClick={() => examStatusMutation.mutate({ examId: e.id, status: 'published' })}
                            disabled={examStatusMutation.isPending}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            প্রকাশ করুন
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirmDeleteExam === e.id) examDeleteMutation.mutate(e.id)
                            else setConfirmDeleteExam(e.id)
                          }}
                          disabled={examDeleteMutation.isPending}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                            confirmDeleteExam === e.id
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDeleteExam === e.id ? 'নিশ্চিত করুন' : 'মুছুন'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'classes' && (
          <div className="card overflow-hidden">
            <div className="border-b border-blue-100 p-4 dark:border-slate-700">
              <h2 className="text-lg font-bold">লাইভ ক্লাস ({(classesQ.data?.data ?? []).length.toLocaleString('bn-BD')})</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">বাতিলসহ সব ক্লাস — আসন্ন ক্লাস বাতিল করা যায়।</p>
            </div>
            {classesQ.isPending ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : classesQ.isError ? (
              <div className="p-4">
                <ErrorState onRetry={() => void classesQ.refetch()} />
              </div>
            ) : (classesQ.data?.data ?? []).length === 0 ? (
              <div className="p-4">
                <EmptyState title="কোনো লাইভ ক্লাস নেই" message="এখনো কোনো লাইভ ক্লাস শিডিউল করা হয়নি।" />
              </div>
            ) : (
              <ul className="divide-y divide-blue-100 dark:divide-slate-700">
                {(classesQ.data?.data ?? []).map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--color-heading)]">{c.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {c.teacherName} · {formatDate(c.startsAt)} ·{' '}
                        {c.status === 'scheduled' ? 'আসন্ন' : c.status === 'live' ? 'চলছে' : c.status === 'ended' ? 'শেষ' : 'বাতিল'}
                      </p>
                    </div>
                    {!isDemo && c.status === 'scheduled' && (
                      <button
                        onClick={() => {
                          if (confirmCancelClass === c.id) classCancelMutation.mutate(c.id)
                          else setConfirmCancelClass(c.id)
                        }}
                        disabled={classCancelMutation.isPending}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                          confirmCancelClass === c.id
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {confirmCancelClass === c.id ? 'বাতিল নিশ্চিত করুন' : 'বাতিল করুন'}
                      </button>
                    )}
                    {isDemo && <SampleBadge />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="card p-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Flag className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">ব্যবহারকারীর রিপোর্ট</h2>
                <p className="text-xs text-[var(--color-muted)]">আপত্তিকর কনটেন্ট বা সমস্যার রিপোর্ট এখানে দেখা যাবে।</p>
              </div>
            </div>
            <EmptyState
              title="এখনো কোনো রিপোর্ট জমা হয়নি"
              message="ব্যবহারকারীরা এখনো কোনো কনটেন্ট বা অ্যাকাউন্টের বিরুদ্ধে রিপোর্ট করেনি। রিপোর্ট জমা দেওয়ার ব্যবস্থা (সাপোর্ট টিকিট) Phase 9-এ আসছে — তখন রিপোর্ট এলে সেগুলো এখানেই দেখা ও ব্যবস্থা নেওয়া যাবে।"
            />
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-muted)]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              এখানে কোনো বানানো রিপোর্ট দেখানো হয় না — রিপোর্ট তখনই দেখাবে যখন কোনো ব্যবহারকারী আসলেই জমা দেবে।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
