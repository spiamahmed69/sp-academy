/**
 * Bookstore — books model + catalogue service — Phase 8.
 *
 * Firestore collection: books/{bookId}
 *   { title, author, publisher, category, price, discountPrice, rating,
 *     reviewsCount, stock, pages, description, coverImageUrl (string | null),
 *     gradient, status: 'published' | 'draft', createdAt, updatedAt }
 *
 * Source of truth for the shop:
 * - Firebase configured → Firestore (`status == 'published'` only).
 * - Not configured → the labelled নমুনা data in src/data/sample.ts.
 * The service never invents a book and never hides a Firestore error
 * behind sample data: on a Firestore error the caller sees the error
 * (ErrorState + retry in the UI).
 *
 * Honesty rules:
 * - Book covers are URL fields only. ImgBB uploads go through the backend
 *   ONLY (Phase 10) — this phase implements NO upload and embeds NO key.
 *   A book without a coverImageUrl renders the gradient cover art, never a
 *   fake photo.
 * - Prices/stock shown from Firestore are the document's own values; sample
 *   prices/stock are labelled নমুনা in the UI.
 */
import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { getFirebase } from './config'
import { books as sampleBooks, GRADIENTS, type Book, type GradientKey } from '../data/sample'
import { fakeDelay } from '../lib/format'

export type BookStatus = 'published' | 'draft'

/** Firestore shape of a book document. */
export interface BookDoc {
  title: string
  author: string
  publisher: string
  category: string
  price: number
  discountPrice?: number
  rating: number
  reviewsCount: number
  stock: number
  pages: number
  description: string
  /** ImgBB URL set by the backend (Phase 10). Null = gradient cover art. */
  coverImageUrl: string | null
  gradient: GradientKey
  status: BookStatus
  createdAt: unknown
  updatedAt: unknown
}

/** One book as shown in the shop — Firestore or labelled sample. */
export interface BookView extends Book {
  /** ImgBB URL when the doc has one; null = gradient cover art. */
  coverImageUrl: string | null
  status: BookStatus
  source: 'firestore' | 'sample'
}

const VALID_GRADIENTS = Object.keys(GRADIENTS) as GradientKey[]

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}
function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
function asGradient(value: unknown): GradientKey {
  return typeof value === 'string' && (VALID_GRADIENTS as string[]).includes(value) ? (value as GradientKey) : 'blue'
}

/** Pure parser: malformed docs never crash the page, they are skipped (null). */
export function bookFromDoc(id: string, data: Record<string, unknown>): BookView | null {
  if (typeof data.title !== 'string' || !data.title.trim()) return null
  const price = asNumber(data.price, 0)
  if (price < 0) return null
  return {
    id,
    title: data.title.trim(),
    author: asString(data.author, 'অজানা লেখক'),
    publisher: asString(data.publisher, ''),
    category: asString(data.category, 'সাধারণ'),
    price,
    discountPrice:
      typeof data.discountPrice === 'number' && data.discountPrice > 0 && data.discountPrice < price
        ? data.discountPrice
        : undefined,
    rating: asNumber(data.rating, 0),
    reviews: asNumber(data.reviewsCount, 0),
    stock: Math.max(0, Math.floor(asNumber(data.stock, 0))),
    pages: Math.max(0, Math.floor(asNumber(data.pages, 0))),
    description: asString(data.description),
    gradient: asGradient(data.gradient),
    coverImageUrl: typeof data.coverImageUrl === 'string' && data.coverImageUrl ? data.coverImageUrl : null,
    status: data.status === 'draft' ? 'draft' : 'published',
    source: 'firestore',
  }
}

/** Convert a UI/sample `Book` into a Firestore document (for seeding / admin). */
export function bookToDoc(book: Book, status: BookStatus = 'published'): Omit<BookDoc, 'createdAt' | 'updatedAt'> {
  return {
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    category: book.category,
    price: book.price,
    discountPrice: book.discountPrice,
    rating: book.rating,
    reviewsCount: book.reviews,
    stock: book.stock,
    pages: book.pages,
    description: book.description,
    coverImageUrl: null,
    gradient: book.gradient,
    status,
  }
}

/** Sample book → view (labelled নমুনা in the UI). */
export function sampleBookToView(book: Book): BookView {
  return { ...book, coverImageUrl: null, status: 'published', source: 'sample' }
}

/** Published books from Firestore, title order. */
export async function fetchBooksFromFirestore(db: Firestore): Promise<BookView[]> {
  const snap = await getDocs(query(collection(db, 'books'), where('status', '==', 'published')))
  const list = snap.docs
    .map((d) => bookFromDoc(d.id, d.data()))
    .filter((b): b is BookView => b !== null)
  list.sort((a, b) => a.title.localeCompare(b.title, 'bn'))
  return list
}

export interface BooksResult {
  books: BookView[]
  /** 'firestore' when read live, 'sample' when Firebase is not configured yet. */
  source: 'firestore' | 'sample'
}

/** Shop entry point: Firestore when configured, labelled sample data otherwise. */
export async function getBooks(): Promise<BooksResult> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(400)
    return { books: sampleBooks.map(sampleBookToView), source: 'sample' }
  }
  const books = await fetchBooksFromFirestore(fb.db)
  return { books, source: 'firestore' }
}

/** One book by id (Firestore when configured, sample lookup otherwise). */
export async function getBookById(id: string): Promise<BookView | null> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    const found = sampleBooks.find((b) => b.id === id)
    return found ? sampleBookToView(found) : null
  }
  const { books } = await getBooks()
  return books.find((b) => b.id === id) ?? null
}

/** Effective selling price of a book (discount wins when valid). */
export function bookSellingPrice(book: Pick<Book, 'price' | 'discountPrice'>): number {
  return book.discountPrice && book.discountPrice > 0 && book.discountPrice < book.price
    ? book.discountPrice
    : book.price
}
