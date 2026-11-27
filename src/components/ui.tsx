import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, FlaskConical, SearchX } from 'lucide-react'

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
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[var(--color-primary)] uppercase">
            <span className="h-2 w-2 rounded-full bg-[var(--color-cta)]" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold sm:text-3xl lg:text-[34px] lg:leading-[1.2]">{title}</h2>
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
  crumbs,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  crumbs?: { label: string; to?: string }[]
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="hero-wave border-b border-blue-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--color-cta)]" aria-hidden="true" />
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-[44px] lg:leading-[1.2]">{title}</h1>
        <span className="mt-4 block h-1.5 w-16 rounded-full bg-gradient-to-r from-[#ff8a1e] to-[#f97316]" aria-hidden="true" />
        {subtitle && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-body)] sm:text-base">{subtitle}</p>
        )}
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        {children}
      </div>
    </section>
  )
}

/** Bondi-style scrolling promo pill (landing pages + listings). Items are
 *  SP Academy's own offers/notices — never a copied promo code. */
export function PromoMarquee({ items }: { items: string[] }) {
  if (items.length === 0) return null
  const doubled = [...items, ...items]
  return (
    <div className="promo-marquee mt-6 overflow-hidden rounded-full border border-orange-200 bg-white/80 py-2 shadow-sm dark:border-slate-700 dark:bg-[#12233c]" role="note" aria-label="অফার ও ঘোষণা">
      <div className="promo-marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2 px-4 text-sm font-bold whitespace-nowrap text-[var(--color-heading)]" aria-hidden={i >= items.length}>
            <span className="h-2 w-2 rounded-full bg-[var(--color-cta)]" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Bondi-style pill filter chips. Active chip is solid blue; the rest are
 *  white outline pills. */
export function FilterChips({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  label?: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label ?? 'ফিল্টার'}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            value === o.id
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'bg-white text-[var(--color-heading)] shadow-sm hover:bg-[var(--color-primary-soft)] dark:bg-[#12233c]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Bondi-style horizontal carousel with arrow buttons (popular courses,
 *  publications, testimonials). Children should be fixed-width cards. */
export function CarouselRow({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }
  return (
    <div className="relative">
      <div ref={ref} className="carousel-row no-scrollbar -mx-1 flex gap-6 overflow-x-auto px-1 pb-2" aria-label={label}>
        {children}
      </div>
      <div className="mt-4 hidden justify-end gap-2 sm:flex">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label={`${label} — আগেরগুলো দেখুন`}
          className="cursor-pointer rounded-full border border-blue-100 bg-white p-2.5 text-[var(--color-primary)] shadow-sm hover:bg-[var(--color-primary-soft)] dark:border-slate-700 dark:bg-[#12233c]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={`${label} — পরেরগুলো দেখুন`}
          className="cursor-pointer rounded-full border border-blue-100 bg-white p-2.5 text-[var(--color-primary)] shadow-sm hover:bg-[var(--color-primary-soft)] dark:border-slate-700 dark:bg-[#12233c]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
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
            এটি <strong>ডেমো পেজ</strong> — এখানকার তথ্য নমুনা। Firebase সেটআপ শেষ হলে আসল লগইন, পেমেন্ট ও ড্যাশবোর্ড চালু হবে।
          </>
        )}
      </p>
    </div>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm text-[var(--color-muted)] shadow-sm dark:bg-[#12233c]">
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
