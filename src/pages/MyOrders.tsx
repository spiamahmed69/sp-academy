import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../firebase/orders'
import { formatBDT } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { useMyOrders } from '../hooks/useBooks'
import { Breadcrumbs, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

function formatDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return new Date((value as { toMillis: () => number }).toMillis()).toLocaleString('bn-BD', {
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('bn-BD', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
    }
  }
  return '—'
}

export default function MyOrders() {
  const { user, configured, loading } = useAuth()
  const { data, isPending, isError, refetch } = useMyOrders()
  const orders = data?.orders ?? []
  const source = data?.source ?? 'sample'

  // Real mode (Firebase configured) needs a signed-in user; demo mode shows
  // this browser's demo orders without a login.
  if (!loading && configured && !user) {
    return (
      <div>
        <PageHero eyebrow="আমার অর্ডার" title="লগইন প্রয়োজন" subtitle="আপনার অর্ডার দেখতে লগইন করুন।" />
        <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
          <div className="mx-auto flex w-full max-w-2xl px-4 py-10 sm:px-6 flex-1 flex-col">
          <div className="card p-6 text-center">
            <Link to="/login" className="btn-primary inline-flex">
              লগইন পেজে যান
            </Link>
          </div>
        </div>
      </div>
        </div>
    )
  }

  return (
    <div>
      <PageHero
        eyebrow="আমার অর্ডার"
        title="আমার অর্ডার"
        subtitle={
          source === 'firestore'
            ? 'আপনার বই ও কোর্সের অর্ডারের অবস্থা এখানে দেখা যাবে।'
            : 'ডেমো অর্ডার — এখানকার অর্ডার শুধু এই ব্রাউজারে সংরক্ষিত। আসল অর্ডার Firebase সেটআপের পর চালু হবে।'
        }
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 flex-1 flex-col">
        <Breadcrumbs items={[{ label: 'আমার অর্ডার' }]} />
        {isPending && (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="অর্ডার লোড হচ্ছে">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isPending && !isError && orders.length === 0 && (
          <EmptyState
            title="এখনো কোনো অর্ডার নেই"
            message="বইয়ের দোকান থেকে অর্ডার করলে সেটি এখানে দেখা যাবে।"
            action={
              <Link to="/books" className="btn-primary text-sm">
                বই দেখুন
              </Link>
            }
          />
        )}
        {!isPending && !isError && orders.length > 0 && (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <Package className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--color-heading)]">অর্ডার {order.orderNo}</p>
                      <p className="text-xs text-[var(--color-muted)]">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.source === 'sample' && <SampleBadge label="ডেমো অর্ডার" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                      {orderStatusLabel(order.orderStatus)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {order.items.map((item) => (
                    <li key={`${item.kind}-${item.refId}`} className="flex justify-between gap-3">
                      <span className="text-[var(--color-body)]">
                        {item.kind === 'book' ? 'বই' : 'কোর্স'}: {item.title} × {item.quantity}
                      </span>
                      <span className="shrink-0 font-bold">{formatBDT(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-700">
                  <span className="text-[var(--color-body)]">
                    পেমেন্ট: {paymentMethodLabel(order.paymentMethod)}
                    {order.paymentStatus === 'pending_verification' && ' — যাচাইয়ের অপেক্ষায়, এখনো কোনো পেমেন্ট নিশ্চিত হয়নি'}
                  </span>
                  <span className="font-extrabold text-[var(--color-cta-to)]">মোট {formatBDT(order.total)}</span>
                </div>
                {order.items.some((it) => it.kind === 'course') && order.orderStatus === 'pending' && (
                  <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-relaxed text-[var(--color-body)] dark:bg-slate-800">
                    এই অর্ডারে কোর্স আছে — পেমেন্ট যাচাইয়ের পর ব্যাকএন্ড থেকে ভর্তি সক্রিয় করা হবে।
                  </p>
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
