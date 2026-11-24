import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, CheckCircle2, ShoppingCart, Star } from 'lucide-react'
import { bookSellingPrice } from '../firebase/books'
import { formatBDT } from '../lib/format'
import { useToast } from '../lib/toast'
import { useCart } from '../contexts/CartContext'
import { useBookById, useBooks } from '../hooks/useBooks'
import { BookCard } from '../components/cards'
import { BookCoverArt } from '../components/CoverArt'
import { Breadcrumbs, DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

export default function Books() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const { data, isLoading, isError, refetch } = useBooks()
  const books = data?.books ?? []
  const source = data?.source ?? 'sample'

  const cats = useMemo(() => ['all', ...Array.from(new Set(books.map((b) => b.category)))], [books])
  const filtered = useMemo(() => {
    let list = books
    if (category !== 'all') list = list.filter((b) => b.category === category)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    }
    return list
  }, [books, category, query])

  return (
    <div>
      <PageHero
        eyebrow="বইয়ের দোকান"
        title="বইয়ের দোকান"
        subtitle={
          source === 'firestore'
            ? 'পরীক্ষার প্রস্তুতির বই — ক্যাশ অন ডেলিভারি বা অনলাইন পেমেন্টে অর্ডার করুন।'
            : 'পরীক্ষার প্রস্তুতির বই — দাম, স্টক ও লেখক তথ্য নমুনা। অর্ডার এই ব্রাউজারেই ডেমো হিসেবে সংরক্ষিত হবে।'
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {source === 'sample' && (
          <DemoNotice>
            ডেমো মোড — Firebase এখনো কনফিগার করা হয়নি। বইয়ের তালিকা নমুনা, আর অর্ডার এই ব্রাউজারেই ডেমো
            হিসেবে সংরক্ষিত হবে (লেবেল: ডেমো অর্ডার)। আসল অর্ডার ও পেমেন্ট যাচাইকরণ Firebase + ব্যাকএন্ড
            সেটআপের পর চালু হবে।
          </DemoNotice>
        )}
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
  const navigate = useNavigate()
  const { push } = useToast()
  const { addItem, hasItem } = useCart()
  const { data: book, isLoading, isError, refetch } = useBookById(id)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="বই লোড হচ্ছে">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState onRetry={() => refetch()} />
        <div className="mt-6 text-center">
          <Link to="/books" className="btn-primary text-sm">
            সব বই দেখুন
          </Link>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="বইটি পাওয়া যায়নি" message="এই লিংকের কোনো বই নেই।" />
        <div className="mt-6 text-center">
          <Link to="/books" className="btn-primary text-sm">
            সব বই দেখুন
          </Link>
        </div>
      </div>
    )
  }

  const inCart = hasItem('book', book.id)
  const addToCart = () => {
    if (book.stock <= 0) {
      push('বইটি এখন স্টকে নেই।', 'error')
      return
    }
    addItem({ kind: 'book', refId: book.id, title: book.title, unitPrice: bookSellingPrice(book), quantity: 1 })
    push(`"${book.title}" কার্টে যোগ হয়েছে।`, 'success')
    navigate('/cart')
  }

  return (
    <div>
      <div className="hero-wave border-b border-blue-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'বইয়ের দোকান', to: '/books' }, { label: book.title }]} />
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-3xl md:h-auto">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={`${book.title} — বইয়ের প্রচ্ছদ`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <BookCoverArt book={book} large />
              )}
            </div>
            <div className="md:col-span-2">
              <span className="inline-block">
                {book.source === 'sample' ? <SampleBadge /> : <SampleBadge label="লাইভ" />}
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
                <span className="text-3xl font-extrabold text-[var(--color-cta-to)]">{formatBDT(bookSellingPrice(book))}</span>
                {book.discountPrice && <span className="text-lg text-[var(--color-muted)] line-through">{formatBDT(book.price)}</span>}
              </div>
              <p className={`mt-1 text-sm font-bold ${book.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {book.stock > 0 ? `${book.stock}টি স্টকে আছে${book.source === 'sample' ? ' (নমুনা)' : ''}` : 'স্টক শেষ'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={addToCart} className="btn-cta" disabled={book.stock === 0}>
                  {inCart ? <CheckCircle2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}{' '}
                  {inCart ? 'কার্টে আছে — কার্ট দেখুন' : 'কার্টে যোগ করুন'}
                </button>
                <Link to="/books" className="btn-outline">
                  <BookOpen className="h-4 w-4" /> আরও বই দেখুন
                </Link>
              </div>
              <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-relaxed text-[var(--color-body)] dark:bg-slate-800">
                ডেলিভারি চার্জ ৳৬০ — ৳১০০০ বা তার বেশি বইয়ের অর্ডারে ডেলিভারি ফ্রি। ক্যাশ অন ডেলিভারিতে পণ্য
                হাতে পেয়ে পরিশোধ করবেন; অনলাইন পেমেন্ট (বিকাশ/নগদ/কার্ড) যাচাইকরণ ব্যাকএন্ডে আসছে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
