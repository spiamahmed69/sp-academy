import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { books, courses } from '../data/sample'
import { formatBDT } from '../lib/format'
import { BookCard, CourseCard } from '../components/cards'
import { Breadcrumbs, EmptyState, PageHero, SectionHeading } from '../components/ui'

export default function Cart() {
  const { items, totals, removeItem, setQuantity } = useCart()

  return (
    <div>
      <PageHero eyebrow="কার্ট" title="আমার কার্ট" subtitle="বই ও কোর্স একসাথে অর্ডার করুন — চেকআউটে পেমেন্টের মাধ্যম বেছে নেবেন।" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'কার্ট' }]} />
        {items.length === 0 ? (
          <>
            <EmptyState
              title="কার্ট খালি"
              message="এখনো কিছু যোগ করেননি। বইয়ের দোকান বা কোর্স থেকে পছন্দের আইটেম কার্টে যোগ করুন।"
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/books" className="btn-primary text-sm">
                    বই দেখুন
                  </Link>
                  <Link to="/courses" className="btn-outline text-sm">
                    কোর্স দেখুন
                  </Link>
                </div>
              }
            />
            <div className="mt-12">
              <SectionHeading
                eyebrow="সুপারিশ"
                title="আপনার জন্য সুপারিশ"
                subtitle="জনপ্রিয় বই ও ফ্রি কোর্স — এখান থেকে কার্টে যোগ করুন।"
              />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {books.slice(0, 2).map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
                {courses
                  .filter((c) => c.isFree)
                  .slice(0, 2)
                  .map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={`${item.kind}-${item.refId}`} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <ShoppingCart className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--color-heading)]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {item.kind === 'book' ? 'বই' : 'কোর্স'} · {formatBDT(item.unitPrice)} / প্রতিটি
                      </p>
                    </div>
                    {item.kind === 'book' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(item.kind, item.refId, item.quantity - 1)}
                          aria-label="পরিমাণ কমান"
                          className="cursor-pointer rounded-full border border-blue-100 p-1.5 hover:bg-[var(--color-primary-soft)]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.kind, item.refId, item.quantity + 1)}
                          aria-label="পরিমাণ বাড়ান"
                          className="cursor-pointer rounded-full border border-blue-100 p-1.5 hover:bg-[var(--color-primary-soft)]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        ১টি
                      </span>
                    )}
                    <p className="w-20 text-right text-sm font-extrabold text-[var(--color-heading)]">
                      {formatBDT(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.kind, item.refId)}
                      aria-label={`${item.title} কার্ট থেকে সরান`}
                      className="cursor-pointer rounded-full p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card p-6">
                <h2 className="text-lg font-extrabold">অর্ডারের হিসাব</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-body)]">সাবটোটাল</dt>
                    <dd className="font-bold">{formatBDT(totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-body)]">ডেলিভারি চার্জ</dt>
                    <dd className="font-bold">{totals.deliveryFee === 0 ? 'ফ্রি' : formatBDT(totals.deliveryFee)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-extrabold dark:border-slate-700">
                    <dt>মোট</dt>
                    <dd className="text-[var(--color-cta-to)]">{formatBDT(totals.total)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                  বইয়ের অর্ডারে ডেলিভারি ৳৬০; ৳১০০০+ বইয়ের অর্ডারে ফ্রি। কোর্সে কোনো ডেলিভারি চার্জ নেই।
                  দাম চেকআউটের সময় ক্যাটালগ থেকে আবার যাচাই করা হবে।
                </p>
                <Link to="/checkout" className="btn-cta mt-5 w-full">
                  চেকআউটে যান
                </Link>
                <Link to="/books" className="btn-outline mt-3 w-full">
                  আরও বই যোগ করুন
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
