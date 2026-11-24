/**
 * Bookstore + orders hooks — Phase 8.
 *
 * The shop, book details, checkout, My Orders and the admin orders tab
 * all read through these hooks, so Firestore (when configured) and the
 * labelled sample catalogue / demo orders (demo mode) never drift apart.
 */
import { useQuery } from '@tanstack/react-query'
import { getBookById, getBooks, type BooksResult, type BookView } from '../firebase/books'
import { getAllOrders, getMyOrders, type OrderView } from '../firebase/orders'
import { useAuth } from '../contexts/AuthContext'

/** Book catalogue: { books, source } — 'firestore' live, 'sample' in demo mode. */
export function useBooks() {
  return useQuery<BooksResult>({ queryKey: ['books'], queryFn: getBooks })
}

/** One book by id (null when missing/unpublished). */
export function useBookById(id: string | undefined) {
  return useQuery<BookView | null>({
    queryKey: ['book', id],
    queryFn: () => getBookById(id ?? ''),
    enabled: Boolean(id),
  })
}

/** The signed-in user's orders (demo orders in demo mode). */
export function useMyOrders() {
  const { user, configured } = useAuth()
  return useQuery<{ orders: OrderView[]; source: 'firestore' | 'sample' }>({
    queryKey: ['my-orders', user?.uid ?? 'demo'],
    queryFn: () => getMyOrders(configured ? (user?.uid ?? null) : null),
  })
}

/** All orders (admin only — rules enforce; demo orders in demo mode). */
export function useAllOrders() {
  return useQuery<{ orders: OrderView[]; source: 'firestore' | 'sample' }>({
    queryKey: ['admin-orders'],
    queryFn: getAllOrders,
  })
}
