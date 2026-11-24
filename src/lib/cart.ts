/**
 * Cart — pure helpers + localStorage persistence — Phase 8.
 *
 * The cart lives in this browser's localStorage and, when the user is
 * signed in with Firebase configured, is also synced to Firestore
 * `carts/{uid}` (see src/firebase/cart.ts) so it survives device changes.
 * The cart NEVER contains prices the server trusts: the order service
 * re-derives every line total from the catalogue at checkout, and the
 * backend (Phase 10) re-validates prices + stock before any payment.
 *
 * Delivery: ৳60 per book order, FREE when the books subtotal is ৳1000 or
 * more. Course-only orders have no delivery fee (digital delivery).
 */
export type CartItemKind = 'book' | 'course'

export interface CartItem {
  kind: CartItemKind
  /** Book id or course id. */
  refId: string
  title: string
  /** Unit price in BDT at the time it was added (re-validated at checkout). */
  unitPrice: number
  quantity: number
}

export const CART_STORAGE_KEY = 'sp-academy-cart-v1'
export const FREE_DELIVERY_MIN = 1000
export const DELIVERY_FEE = 60

export interface CartTotals {
  /** Sum of unitPrice × quantity over all items. */
  subtotal: number
  /** Books subtotal only (delivery is charged on books, not courses). */
  booksSubtotal: number
  deliveryFee: number
  total: number
  itemCount: number
}

/** Pure totals: delivery ৳60 on book orders, free at ৳1000+ books subtotal. */
export function cartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((n, it) => n + it.unitPrice * it.quantity, 0)
  const booksSubtotal = items
    .filter((it) => it.kind === 'book')
    .reduce((n, it) => n + it.unitPrice * it.quantity, 0)
  const hasBooks = items.some((it) => it.kind === 'book')
  const deliveryFee = !hasBooks ? 0 : booksSubtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE
  return {
    subtotal,
    booksSubtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    itemCount: items.reduce((n, it) => n + it.quantity, 0),
  }
}

/** A course can appear at most once in the cart (one enrollment per course). */
export function addCartItem(items: CartItem[], next: CartItem): CartItem[] {
  if (next.quantity < 1 || next.unitPrice < 0) return items
  const existing = items.find((it) => it.kind === next.kind && it.refId === next.refId)
  if (!existing) return [...items, { ...next, quantity: next.kind === 'course' ? 1 : next.quantity }]
  if (existing.kind === 'course') return items
  return items.map((it) =>
    it.kind === next.kind && it.refId === next.refId ? { ...it, quantity: it.quantity + next.quantity } : it,
  )
}

export function removeCartItem(items: CartItem[], kind: CartItemKind, refId: string): CartItem[] {
  return items.filter((it) => !(it.kind === kind && it.refId === refId))
}

export function setCartItemQuantity(items: CartItem[], kind: CartItemKind, refId: string, quantity: number): CartItem[] {
  if (quantity < 1) return removeCartItem(items, kind, refId)
  return items.map((it) => (it.kind === kind && it.refId === refId ? { ...it, quantity } : it))
}

export function hasCourseItem(items: CartItem[]): boolean {
  return items.some((it) => it.kind === 'course')
}

export function hasBookItem(items: CartItem[]): boolean {
  return items.some((it) => it.kind === 'book')
}

/** Pure parser: malformed / foreign data never crashes the page, it is ignored. */
export function parseCart(raw: unknown): CartItem[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        kind: item.kind === 'course' ? 'course' : item.kind === 'book' ? 'book' : null,
        refId: typeof item.refId === 'string' ? item.refId : '',
        title: typeof item.title === 'string' ? item.title : '',
        unitPrice: typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) && item.unitPrice >= 0 ? item.unitPrice : -1,
        quantity: typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? Math.floor(item.quantity) : 0,
      }))
      .filter((item): item is CartItem => item.kind !== null && item.refId.length > 0 && item.title.length > 0 && item.unitPrice >= 0 && item.quantity >= 1)
      .map((item) => (item.kind === 'course' ? { ...item, quantity: 1 } : item))
  } catch {
    return []
  }
}

export function readCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return []
  }
}

export function writeCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full / blocked — the cart just won't persist.
  }
}

/**
 * Bangladeshi mobile number: 11 digits starting with 01[3-9].
 * Spaces / dashes are ignored.
 */
export function isValidBdPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, '')
  return /^01[3-9]\d{8}$/.test(digits)
}
