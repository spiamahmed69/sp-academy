import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ShoppingCart, Star } from 'lucide-react'
import { books, getBookById, type Book } from '../data/sample'
import { fakeDelay, formatBDT } from '../lib/format'
import { useToast } from '../lib/toast'
import { BookCard } from '../components/cards'
import { Breadcrumbs, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

async function fetchBooks(): Promise<Book[]> {
  await fakeDelay(500)
  return books
}

export default function Books() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['books'], queryFn: fetchBooks })

  const cats = useMemo(() => ['all', ...Array.from(new Set((data ?? []).map((b) => b.category)))], [data])
  const filtered = useMemo(() => {
    let list = data ?? []
    if (category !== 'all') list = list.filter((b) => b.category === category)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    }
    return list
  }, [data, category, query])

  return (
    <div>
      <PageHero
        eyebrow="বইয়ের দোকান"
        title="বইয়ের দোকান"
        subtitle="পরীক্ষার প্রস্তুতির বই — দাম, স্টক ও লেখক তথ্য নমুনা। অর্ডার ও পেমেন্ট Phase 8-এ চালু হবে।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="book-search" className="sr-only">
            বই খুঁজুন
          </label>
          <input
            id="book-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="বই বা লেখকের নাম লিখুন..."
            className="flex-1 rounded-full border border-blue-100 bg-white px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]"
          />
          <label htmlFor="book-category" className="sr-only">
            ক্যাটাগরি
          </label>
          <select id="book-category" value={category} onChange={(e) => setCategory(e.target.value)} className="cursor-pointer rounded-full border border-blue-100 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-[#12233c]">
            {cats.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'সব ক্যাটাগরি' : c}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="বই লোড হচ্ছে">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="কোনো বই পাওয়া যায়নি" message="অন্য নাম বা ক্যাটাগরি দিয়ে খুঁজে দেখুন।" />
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BookDetails() {
  const { id } = useParams()
  const { push } = useToast()
  const book = id ? getBookById(id) : undefined

  if (!book) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="বইটি পাওয়া যায়নি" message="এই লিংকের কোনো নমুনা বই নেই।" />
        <div className="mt-6 text-center">
          <Link to="/books" className="btn-primary text-sm">
            সব বই দেখুন
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="hero-wave border-b border-blue-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'বইয়ের দোকান', to: '/books' }, { label: book.title }]} />
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex h-64 items-center justify-center rounded-3xl bg-[var(--color-primary)] md:h-auto">
              <span className="flex h-44 w-32 rotate-[-4deg] flex-col justify-between rounded-r-lg rounded-l-sm bg-white p-4 shadow-xl">
                <span className="text-sm leading-snug font-extrabold text-[var(--color-heading)]">{book.title}</span>
                <span className="text-xs text-[var(--color-muted)]">{book.author}</span>
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="inline-block">
                <SampleBadge />
              </span>
              <h1 className="mt-2 text-3xl font-extrabold">{book.title}</h1>
              <p className="mt-2 text-[var(--color-body)]">
                লেখক: {book.author} · প্রকাশক: {book.publisher} · {book.pages} পৃষ্ঠা
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {book.rating} ({book.reviews} রিভিউ)
              </p>
              <p className="mt-4 leading-relaxed text-[var(--color-body)]">{book.description}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--color-cta-to)]">{formatBDT(book.discountPrice ?? book.price)}</span>
                {book.discountPrice && <span className="text-lg text-[var(--color-muted)] line-through">{formatBDT(book.price)}</span>}
              </div>
              <p className={`mt-1 text-sm font-bold ${book.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {book.stock > 0 ? `${book.stock}টি স্টকে আছে (নমুনা)` : 'স্টক শেষ (নমুনা)'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => push(book.stock > 0 ? 'কার্ট ও অর্ডার Phase 8-এ চালু হবে — এটি ডেমো।' : 'বইটি এখন স্টকে নেই (নমুনা)।', 'info')}
                  className="btn-cta"
                  disabled={book.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4" /> কার্টে যোগ করুন
                </button>
                <Link to="/books" className="btn-outline">
                  <BookOpen className="h-4 w-4" /> আরও বই দেখুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
