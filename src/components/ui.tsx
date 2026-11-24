import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, FlaskConical, SearchX } from 'lucide-react'

export function SampleBadge({ label = 'নমুনা' }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      {label}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-bold tracking-wide text-[var(--color-primary)] uppercase">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-body)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <section className="hero-wave border-b border-blue-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {eyebrow && (
          <p className="mb-2 text-sm font-bold tracking-wide text-[var(--color-primary)] uppercase">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-body)]">{subtitle}</p>}
      </div>
    </section>
  )
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-4" aria-hidden="true">
      <div className="skeleton h-36 w-full" />
      <div className="skeleton mt-4 h-5 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/2" />
      <div className="skeleton mt-4 h-9 w-full" />
    </div>
  )
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
        <SearchX className="h-7 w-7 text-[var(--color-primary)]" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-body)]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'কিছু একটা ভুল হয়েছে',
  message = 'তথ্য লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center" role="alert">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-body)]">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-5 cursor-pointer">
          আবার চেষ্টা করুন
        </button>
      )}
    </div>
  )
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200" role="note">
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        {children ?? (
          <>
            এটি <strong>ডেমো পেজ</strong> — এখানকার তথ্য নমুনা। আসল লগইন, পেমেন্ট ও ড্যাশবোর্ড আসছে Phase 2–এ।
          </>
        )}
      </p>
    </div>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
      <Link to="/" className="hover:text-[var(--color-primary)]">
        হোম
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span aria-hidden="true">/</span>
          {item.to ? (
            <Link to={item.to} className="hover:text-[var(--color-primary)]">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[var(--color-heading)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
