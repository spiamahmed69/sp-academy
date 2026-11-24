/**
 * Orders + payments — Phase 8.
 *
 * Firestore collection: orders/{orderId}
 *   { orderNo, userId, items: [{ kind: 'book' | 'course', refId, title,
 *       unitPrice, quantity }], subtotal, deliveryFee, total,
 *     paymentMethod: 'bkash' | 'nagad' | 'card' | 'cod',
 *     paymentStatus: 'pending_verification' | 'cod_due' | 'paid' | 'failed',
 *     orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
 *     customer: { name, phone, address, district },
 *     createdAt, updatedAt }
 *
 * HONESTY — read this before touching this file:
 * - There is NO backend yet (Phase 10), so online payments CANNOT be
 *   verified. A client may create an order ONLY with paymentStatus
 *   'pending_verification' (bKash / Nagad / card) or 'cod_due' (COD).
 *   The client can NEVER set paymentStatus to 'paid' — the rules block it
 *   and only the backend may mark an order paid after verifying the
 *   payment with the gateway. The UI says this plainly and NEVER shows a
 *   fake successful payment, a fake transaction id, or a fake confirmation.
 * - A course in an order does NOT enroll the student. Enrollment is
 *   created server-side after payment verification (Phase 10) — until
 *   then the order stays 'pending' and the UI says enrollment will be
 *   activated after verification. COD is not offered for course-only
 *   orders (a digital course cannot be paid for on delivery).
 * - Prices are re-derived from the catalogue at checkout
 *   (`priceOrderItems`): the cart's stored unit prices are never trusted.
 *   Stock is checked from the book doc at checkout; the backend
 *   re-checks both in Phase 10.
 * - Demo mode (Firebase not configured): orders are kept in this
 *   browser's localStorage only, clearly labelled ডেমো অর্ডার.
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { getFirebase } from './config'
import { getBooks, type BookView } from './books'
import { getCourses } from './courses'
import type { Course } from '../data/sample'
import { cartTotals, type CartItem } from '../lib/cart'
import { fakeDelay } from '../lib/format'

export type PaymentMethod = 'bkash' | 'nagad' | 'card' | 'cod'

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; note: string }[] = [
  {
    id: 'bkash',
    label: 'বিকাশ',
    note: 'অনলাইন পেমেন্ট যাচাইকরণ ব্যাকএন্ডে আসছে — অর্ডারটি পেন্ডিং হিসেবে জমা হবে, পেমেন্ট যাচাই হলে নিশ্চিত করা হবে।',
  },
  {
    id: 'nagad',
    label: 'নগদ',
    note: 'অনলাইন পেমেন্ট যাচাইকরণ ব্যাকএন্ডে আসছে — অর্ডারটি পেন্ডিং হিসেবে জমা হবে, পেমেন্ট যাচাই হলে নিশ্চিত করা হবে।',
  },
  {
    id: 'card',
    label: 'কার্ড (ডেবিট/ক্রেডিট)',
    note: 'অনলাইন পেমেন্ট যাচাইকরণ ব্যাকএন্ডে আসছে — অর্ডারটি পেন্ডিং হিসেবে জমা হবে, পেমেন্ট যাচাই হলে নিশ্চিত করা হবে।',
  },
  {
    id: 'cod',
    label: 'ক্যাশ অন ডেলিভারি (COD)',
    note: 'পণ্য হাতে পেয়ে নগদে পরিশোধ করবেন। কোর্সের জন্য COD প্রযোজ্য নয়।',
  },
]

/** Online (gateway) methods — their payment is verified server-side only. */
export function isOnlinePaymentMethod(method: PaymentMethod): boolean {
  return method === 'bkash' || method === 'nagad' || method === 'card'
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.id === method)?.label ?? method
}

export type PaymentStatus = 'pending_verification' | 'cod_due' | 'paid' | 'failed'

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending_verification':
      return 'পেমেন্ট যাচাইয়ের অপেক্ষায়'
    case 'cod_due':
      return 'ডেলিভারিতে পরিশোধ করতে হবে'
    case 'paid':
      return 'পরিশোধিত'
    case 'failed':
      return 'পেমেন্ট ব্যর্থ'
    default:
      return status
  }
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: 'pending', label: 'পেন্ডিং' },
  { id: 'confirmed', label: 'নিশ্চিত' },
  { id: 'shipped', label: 'পাঠানো হয়েছে' },
  { id: 'delivered', label: 'ডেলিভারি সম্পন্ন' },
  { id: 'cancelled', label: 'বাতিল' },
]

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.id === status)?.label ?? status
}

export interface OrderItem {
  kind: 'book' | 'course'
  refId: string
  title: string
  unitPrice: number
  quantity: number
}

export interface OrderCustomer {
  name: string
  phone: string
  address: string
  district: string
}

export interface OrderDoc {
  orderNo: string
  userId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  customer: OrderCustomer
  createdAt: unknown
  updatedAt: unknown
}

/** One order as shown in My Orders / Admin — Firestore or labelled demo. */
export interface OrderView extends OrderDoc {
  id: string
  source: 'firestore' | 'sample'
}

export interface CheckoutInput {
  items: CartItem[]
  paymentMethod: PaymentMethod
  customer: OrderCustomer
}

/** Human-readable order number (our own reference — NOT a payment transaction id). */
export function makeOrderNo(now = Date.now()): string {
  return `SP-${now.toString(36).toUpperCase()}`
}

function asPaymentMethod(value: unknown): PaymentMethod | null {
  return value === 'bkash' || value === 'nagad' || value === 'card' || value === 'cod' ? value : null
}

function asPaymentStatus(value: unknown): PaymentStatus {
  if (value === 'cod_due' || value === 'paid' || value === 'failed') return value
  return 'pending_verification'
}

function asOrderStatus(value: unknown): OrderStatus {
  if (value === 'confirmed' || value === 'shipped' || value === 'delivered' || value === 'cancelled') return value
  return 'pending'
}

function asOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item): OrderItem => ({
      kind: item.kind === 'course' ? 'course' : 'book',
      refId: typeof item.refId === 'string' ? item.refId : '',
      title: typeof item.title === 'string' ? item.title : '',
      unitPrice: typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) && item.unitPrice >= 0 ? item.unitPrice : -1,
      quantity: typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? Math.floor(item.quantity) : 0,
    }))
    .filter((item) => item.refId.length > 0 && item.title.length > 0 && item.unitPrice >= 0 && item.quantity >= 1)
    .map((item) => (item.kind === 'course' ? { ...item, quantity: 1 } : item))
}

/** Pure parser: malformed docs never crash the page, they are skipped (null). */
export function orderFromDoc(id: string, data: Record<string, unknown>): OrderView | null {
  const method = asPaymentMethod(data.paymentMethod)
  if (!method) return null
  const items = asOrderItems(data.items)
  if (items.length === 0) return null
  const customer = data.customer as Record<string, unknown> | undefined
  return {
    id,
    orderNo: typeof data.orderNo === 'string' ? data.orderNo : id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    items,
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
    deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
    total: typeof data.total === 'number' ? data.total : 0,
    paymentMethod: method,
    paymentStatus: asPaymentStatus(data.paymentStatus),
    orderStatus: asOrderStatus(data.orderStatus),
    customer: {
      name: typeof customer?.name === 'string' ? customer.name : '',
      phone: typeof customer?.phone === 'string' ? customer.phone : '',
      address: typeof customer?.address === 'string' ? customer.address : '',
      district: typeof customer?.district === 'string' ? customer.district : '',
    },
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    source: 'firestore',
  }
}

/**
 * Re-price a cart from the live catalogue and validate it for checkout.
 * Returns Bengali error messages (empty = valid). Never trusts the cart's
 * stored prices: books come from the book doc, courses from the course doc.
 * Throws nothing — callers show the returned errors.
 */
export async function priceOrderItems(
  items: CartItem[],
): Promise<{ priced: OrderItem[]; errors: string[]; subtotal: number; deliveryFee: number; total: number }> {
  const errors: string[] = []
  if (items.length === 0) return { priced: [], errors: ['কার্ট খালি — প্রথমে কিছু যোগ করুন।'], subtotal: 0, deliveryFee: 0, total: 0 }
  const { books } = await getBooks()
  const { courses } = await getCourses()
  const bookById = new Map(books.map((b) => [b.id, b]))
  const courseById = new Map(courses.map((c) => [c.id, c]))
  const priced: OrderItem[] = []
  for (const item of items) {
    if (item.kind === 'book') {
      const book: BookView | undefined = bookById.get(item.refId)
      if (!book) {
        errors.push(`"${item.title}" বইটি আর পাওয়া যাচ্ছে না — কার্ট থেকে সরান।`)
        continue
      }
      if (book.stock <= 0) {
        errors.push(`"${book.title}" বইটি এখন স্টকে নেই।`)
        continue
      }
      if (item.quantity > book.stock) {
        errors.push(`"${book.title}" — স্টকে আছে ${book.stock}টি, আপনি ${item.quantity}টি চেয়েছেন।`)
        continue
      }
      priced.push({
        kind: 'book',
        refId: book.id,
        title: book.title,
        unitPrice: book.discountPrice && book.discountPrice > 0 && book.discountPrice < book.price ? book.discountPrice : book.price,
        quantity: item.quantity,
      })
    } else {
      const course: Course | undefined = courseById.get(item.refId)
      if (!course) {
        errors.push(`"${item.title}" কোর্সটি আর পাওয়া যাচ্ছে না — কার্ট থেকে সরান।`)
        continue
      }
      if (course.isFree) {
        errors.push(`"${course.title}" ফ্রি কোর্স — এতে ভর্তি হতে পেমেন্ট লাগে না, কোর্স পেজ থেকে ফ্রি ভর্তি হোন।`)
        continue
      }
      priced.push({
        kind: 'course',
        refId: course.id,
        title: course.title,
        unitPrice: course.discountPrice && course.discountPrice > 0 && course.discountPrice < course.price ? course.discountPrice : course.price,
        quantity: 1,
      })
    }
  }
  const totals = cartTotals(priced.map((p) => ({ kind: p.kind, refId: p.refId, title: p.title, unitPrice: p.unitPrice, quantity: p.quantity })))
  return { priced, errors, subtotal: totals.subtotal, deliveryFee: totals.deliveryFee, total: totals.total }
}

/**
 * Pure checkout validation shared by the form and the service.
 * COD is rejected when the cart has a course (digital delivery cannot be
 * paid for on delivery). Returns Bengali error messages (empty = valid).
 */
export function validateCheckout(input: CheckoutInput): string[] {
  const errors: string[] = []
  if (input.items.length === 0) errors.push('কার্ট খালি — প্রথমে কিছু যোগ করুন।')
  if (!input.customer.name.trim()) errors.push('নাম দিতে হবে।')
  const phone = input.customer.phone.replace(/[\s-]/g, '')
  if (!/^01[3-9]\d{8}$/.test(phone)) errors.push('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)।')
  if (input.paymentMethod === 'cod') {
    if (!input.customer.address.trim()) errors.push('ডেলিভারির ঠিকানা দিতে হবে।')
    if (!input.customer.district.trim()) errors.push('জেলা দিতে হবে।')
    if (input.items.some((it) => it.kind === 'course')) {
      errors.push('কোর্সের জন্য ক্যাশ অন ডেলিভারি প্রযোজ্য নয় — অনলাইন পেমেন্ট বেছে নিন।')
    }
  }
  return errors
}

// ---- Firestore writes ----

/** Build the order document. Payment is NEVER marked paid here — see the header. */
export function buildOrderDoc(
  uid: string,
  input: CheckoutInput,
  priced: OrderItem[],
  totals: { subtotal: number; deliveryFee: number; total: number },
): Omit<OrderDoc, 'createdAt' | 'updatedAt'> {
  return {
    orderNo: makeOrderNo(),
    userId: uid,
    items: priced,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === 'cod' ? 'cod_due' : 'pending_verification',
    orderStatus: 'pending',
    customer: {
      name: input.customer.name.trim(),
      phone: input.customer.phone.replace(/[\s-]/g, ''),
      address: input.customer.address.trim(),
      district: input.customer.district.trim(),
    },
  }
}

/** Place an order in Firestore (signed-in user only). Returns the new order id. */
export async function placeOrder(db: Firestore, uid: string, input: CheckoutInput): Promise<string> {
  const errors = validateCheckout(input)
  if (errors.length > 0) throw new Error(errors[0])
  const priced = await priceOrderItems(input.items)
  if (priced.errors.length > 0) throw new Error(priced.errors[0])
  const docData = buildOrderDoc(uid, input, priced.priced, priced)
  const now = serverTimestamp()
  const ref = await addDoc(collection(db, 'orders'), { ...docData, createdAt: now, updatedAt: now })
  return ref.id
}

/** The signed-in user's orders, newest first. */
export async function fetchMyOrders(db: Firestore, uid: string): Promise<OrderView[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)))
  const list = snap.docs
    .map((d) => orderFromDoc(d.id, d.data()))
    .filter((o): o is OrderView => o !== null)
  list.sort((a, b) => createdMillis(b.createdAt) - createdMillis(a.createdAt))
  return list
}

/** All orders (admin only — rules enforce). Newest first. */
export async function fetchAllOrders(db: Firestore): Promise<OrderView[]> {
  const snap = await getDocs(collection(db, 'orders'))
  const list = snap.docs
    .map((d) => orderFromDoc(d.id, d.data()))
    .filter((o): o is OrderView => o !== null)
  list.sort((a, b) => createdMillis(b.createdAt) - createdMillis(a.createdAt))
  return list
}

function createdMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  return 0
}

/**
 * Admin: change an order's fulfilment status only. Payment status is NEVER
 * changed from the client — only the backend (Phase 10) may mark an order
 * paid after gateway verification. Rules enforce this too.
 */
export async function setOrderStatus(db: Firestore, orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { orderStatus: status, updatedAt: serverTimestamp() })
}

// ---- Demo mode: localStorage orders (this browser only, clearly labelled) ----

export const DEMO_ORDERS_KEY = 'sp-academy-demo-orders-v1'

/** Pure parser: malformed / foreign data never crashes the page, it is ignored. */
export function parseDemoOrders(raw: unknown): OrderView[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => orderFromDoc(typeof item.id === 'string' ? item.id : `demo-${Date.now()}`, item))
      .filter((o): o is OrderView => o !== null)
      .map((o) => ({ ...o, source: 'sample' as const }))
  } catch {
    return []
  }
}

function readDemoRaw(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    return window.localStorage.getItem(DEMO_ORDERS_KEY)
  } catch {
    return null
  }
}

function writeDemoRaw(list: OrderView[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(list))
  } catch {
    // Storage full / blocked — demo orders just won't persist.
  }
}

export function readDemoOrders(): OrderView[] {
  return parseDemoOrders(readDemoRaw())
}

/** Place a demo order (localStorage only, labelled ডেমো অর্ডার). Returns the demo id. */
export async function placeDemoOrder(input: CheckoutInput): Promise<string> {
  const errors = validateCheckout(input)
  if (errors.length > 0) throw new Error(errors[0])
  const priced = await priceOrderItems(input.items)
  if (priced.errors.length > 0) throw new Error(priced.errors[0])
  const now = new Date().toISOString()
  const view: OrderView = {
    ...buildOrderDoc('demo', input, priced.priced, priced),
    id: `demo-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    source: 'sample',
  }
  const list = readDemoOrders()
  writeDemoRaw([view, ...list])
  return view.id
}

/** Entry point for My Orders: Firestore when configured + signed in, demo orders otherwise. */
export async function getMyOrders(uid: string | null): Promise<{ orders: OrderView[]; source: 'firestore' | 'sample' }> {
  const fb = getFirebase()
  if (!fb || !uid) {
    await fakeDelay(300)
    return { orders: readDemoOrders(), source: 'sample' }
  }
  const orders = await fetchMyOrders(fb.db, uid)
  return { orders, source: 'firestore' }
}

/** Entry point for Admin → orders: Firestore when configured, demo orders otherwise. */
export async function getAllOrders(): Promise<{ orders: OrderView[]; source: 'firestore' | 'sample' }> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    return { orders: readDemoOrders(), source: 'sample' }
  }
  const orders = await fetchAllOrders(fb.db)
  return { orders, source: 'firestore' }
}
