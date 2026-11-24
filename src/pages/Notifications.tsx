/**
 * Notifications inbox — Phase 9.
 *
 * Route: /notifications (guards itself in-page like /my-orders: signed-in
 * users see their real Firestore notifications; in demo mode this
 * browser's labelled নমুনা notifications are shown instead).
 * Marking read changes only the `read` field — the rules (v8) enforce that.
 */
import { Link } from 'react-router-dom'
import { Bell, BellRing, CheckCheck, MailOpen } from 'lucide-react'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications'
import { formatNotificationTime, notificationTypeLabel } from '../firebase/notifications'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../lib/toast'
import { Breadcrumbs, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

export default function Notifications() {
  const { user } = useAuth()
  const { push } = useToast()
  const q = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const list = q.data?.notifications ?? []
  const isDemo = q.data?.source === 'sample'

  return (
    <div>
      <PageHero eyebrow="নোটিফিকেশন" title="আমার নোটিফিকেশন" subtitle="ভর্তি, পরীক্ষা, লাইভ ক্লাস, অর্ডার ও সাপোর্টের আপডেট এখানে দেখা যাবে।" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Breadcrumbs items={[{ label: 'নোটিফিকেশন' }]} />

        {isDemo && (
          <p className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <Bell className="h-4 w-4 shrink-0" />
            ডেমো মোড: নিচের নোটিফিকেশনগুলো নমুনা — আসল লগইন চালু হলে আপনার আসল নোটিফিকেশন এখানে দেখাবে।
          </p>
        )}
        {!user && (
          <p className="mb-4 rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-body)]">
            লগইন করলে আপনার আসল নোটিফিকেশন এখানে দেখাবে। আপাতত নমুনা ইনবক্স দেখানো হচ্ছে।
          </p>
        )}

        <div className="card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <BellRing className="h-5 w-5 text-[var(--color-primary)]" /> ইনবক্স
              {isDemo && <SampleBadge label="নমুনা" />}
            </h2>
            {list.some((n) => !n.read) && (
              <button
                onClick={() =>
                  markAll.mutate(undefined, {
                    onSuccess: () => push('সব নোটিফিকেশন পড়া হয়েছে বলে চিহ্নিত করা হয়েছে।', 'success'),
                    onError: (err) => push(err instanceof Error ? err.message : 'চিহ্নিত করা যায়নি।', 'error'),
                  })
                }
                disabled={markAll.isPending}
                className="btn-outline cursor-pointer !px-3 !py-1.5 text-xs disabled:opacity-60"
              >
                <CheckCheck className="h-4 w-4" /> সব পড়া হয়েছে
              </button>
            )}
          </div>

          {q.isPending ? (
            <div className="grid gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : q.isError ? (
            <ErrorState message="নোটিফিকেশন লোড করা যায়নি। আবার চেষ্টা করুন।" onRetry={() => void q.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState title="এখনো কোনো নোটিফিকেশন নেই" message="ভর্তি, পরীক্ষা বা অর্ডারের আপডেট এলে এখানে দেখা যাবে।" />
          ) : (
            <ul className="divide-y divide-blue-100 dark:divide-slate-800">
              {list.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 py-4 ${n.read ? 'opacity-70' : ''}`}>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      n.read ? 'bg-[var(--color-primary-soft)] text-[var(--color-muted)]' : 'bg-[var(--color-primary)] text-white'
                    }`}
                  >
                    {n.read ? <MailOpen className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--color-heading)]">{n.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-body)]">{n.body}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {notificationTypeLabel(n.type)} · {formatNotificationTime(n.createdAt)}
                    </p>
                    {n.link && (
                      <Link to={n.link} className="mt-1 inline-block text-xs font-bold text-[var(--color-primary)] underline">
                        বিস্তারিত দেখুন →
                      </Link>
                    )}
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      disabled={markRead.isPending}
                      className="shrink-0 cursor-pointer rounded-full border border-blue-100 px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] disabled:opacity-60 dark:border-slate-700"
                    >
                      পড়া হয়েছে
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
