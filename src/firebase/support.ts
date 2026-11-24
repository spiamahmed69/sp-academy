/**
 * Support tickets — Phase 9.
 *
 * Firestore collection: supportTickets/{id}
 *   { userId, userName, userEmail, subject, category, message,
 *     status: 'open' | 'in_progress' | 'resolved' | 'closed',
 *     replies: [{ by, byRole, message, createdAt }], createdAt, updatedAt }
 *   category: 'course' | 'payment' | 'exam' | 'technical' | 'general'
 *
 * Honesty rules:
 * - A ticket is created ONLY by a signed-in user, for themselves. Nobody
 *   can fake a ticket from another user and nobody can invent a reply from
 *   an admin — the rules (v8) enforce owner-only creation and admin-only
 *   replies / status changes. Replies are plain text, never presented as
 *   coming from anyone other than the admin who wrote them.
 * - The admin reports tab (/admin → রিপোর্ট) shows ONLY tickets that users
 *   really submitted; when there are none it keeps its honest empty state.
 * - Demo mode (Firebase not configured): tickets live in this browser's
 *   localStorage only, clearly labelled ডেমো টিকিট. Admin replies in demo
 *   mode are not possible — the admin page says so instead of faking one.
 */
import { z } from 'zod'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where, type Firestore } from 'firebase/firestore'
import { getFirebase } from './config'
import { fakeDelay } from '../lib/format'

export const TICKET_CATEGORIES = ['course', 'payment', 'exam', 'technical', 'general'] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  course: 'কোর্স',
  payment: 'পেমেন্ট / অর্ডার',
  exam: 'পরীক্ষা',
  technical: 'টেকনিক্যাল সমস্যা',
  general: 'সাধারণ প্রশ্ন',
}

export function ticketCategoryLabel(category: string): string {
  return (TICKET_CATEGORY_LABELS as Record<string, string>)[category] ?? category
}

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'খোলা',
  in_progress: 'প্রক্রিয়াধীন',
  resolved: 'সমাধান হয়েছে',
  closed: 'বন্ধ',
}

export function ticketStatusLabel(status: string): string {
  return (TICKET_STATUS_LABELS as Record<string, string>)[status] ?? status
}

export function isValidTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === 'string' && (TICKET_STATUSES as readonly string[]).includes(value)
}

export interface TicketReply {
  by: string
  byRole: string
  message: string
  createdAt: unknown
}

export interface SupportTicket {
  id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  category: TicketCategory
  message: string
  status: TicketStatus
  replies: TicketReply[]
  createdAt: unknown
  updatedAt: unknown
}

export const ticketSchema = z.object({
  subject: z.string().trim().min(5, 'বিষয় কমপক্ষে ৫ অক্ষরের হতে হবে।').max(120, 'বিষয় ১২০ অক্ষরের বেশি হতে পারবে না।'),
  category: z.enum(TICKET_CATEGORIES),
  message: z.string().trim().min(10, 'বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে।').max(2000, 'বার্তা ২০০০ অক্ষরের বেশি হতে পারবে না।'),
})

export type TicketInput = z.infer<typeof ticketSchema>

export const ticketReplySchema = z.object({
  message: z.string().trim().min(1, 'উত্তর লিখুন।').max(2000, 'উত্তর ২০০০ অক্ষরের বেশি হতে পারবে না।'),
})

/** Pure parser: malformed docs never crash the page, they are skipped. */
export function ticketFromDoc(id: string, data: Record<string, unknown>): SupportTicket | null {
  if (typeof data.userId !== 'string' || !data.userId) return null
  if (typeof data.subject !== 'string' || !data.subject) return null
  const category =
    typeof data.category === 'string' && (TICKET_CATEGORIES as readonly string[]).includes(data.category)
      ? (data.category as TicketCategory)
      : 'general'
  const replies = Array.isArray(data.replies)
    ? data.replies
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
        .map((r) => ({
          by: typeof r.by === 'string' ? r.by : 'অ্যাডমিন',
          byRole: typeof r.byRole === 'string' ? r.byRole : 'admin',
          message: typeof r.message === 'string' ? r.message : '',
          createdAt: r.createdAt ?? null,
        }))
        .filter((r) => r.message.length > 0)
    : []
  return {
    id,
    userId: data.userId,
    userName: typeof data.userName === 'string' && data.userName ? data.userName : 'নামহীন ব্যবহারকারী',
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : '',
    subject: data.subject,
    category,
    message: typeof data.message === 'string' ? data.message : '',
    status: isValidTicketStatus(data.status) ? data.status : 'open',
    replies,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

export function ticketCreatedAtMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: unknown }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  if (typeof value === 'number') return value
  return 0
}

export function sortTickets(list: SupportTicket[]): SupportTicket[] {
  return [...list].sort((a, b) => ticketCreatedAtMillis(b.createdAt) - ticketCreatedAtMillis(a.createdAt))
}

export function openTicketCount(list: SupportTicket[]): number {
  return list.filter((t) => t.status === 'open' || t.status === 'in_progress').length
}

// ---- Firestore (real mode) ----

/** Create a ticket for the signed-in user. Validated client-side AND by rules v8. */
export async function createTicket(
  db: Firestore,
  uid: string,
  userName: string,
  userEmail: string,
  input: TicketInput,
): Promise<string> {
  const parsed = ticketSchema.parse(input)
  const ref = await addDoc(collection(db, 'supportTickets'), {
    userId: uid,
    userName,
    userEmail,
    subject: parsed.subject,
    category: parsed.category,
    message: parsed.message,
    status: 'open',
    replies: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** The signed-in user's own tickets, newest first. */
export async function getMyTickets(db: Firestore, uid: string): Promise<SupportTicket[]> {
  const snap = await getDocs(query(collection(db, 'supportTickets'), where('userId', '==', uid)))
  return sortTickets(
    snap.docs.map((d) => ticketFromDoc(d.id, d.data())).filter((t): t is SupportTicket => t !== null),
  )
}

/** All tickets, newest first (admin / moderator only — enforced by rules v8). */
export async function getAllTickets(db: Firestore): Promise<SupportTicket[]> {
  const snap = await getDocs(collection(db, 'supportTickets'))
  return sortTickets(
    snap.docs.map((d) => ticketFromDoc(d.id, d.data())).filter((t): t is SupportTicket => t !== null),
  )
}

/** Admin reply: appends one reply and moves the ticket to in_progress (unless resolved/closed). */
export async function addTicketReply(
  db: Firestore,
  ticketId: string,
  ticket: SupportTicket,
  by: string,
  byRole: string,
  message: string,
): Promise<void> {
  const parsed = ticketReplySchema.parse({ message })
  const nextStatus: TicketStatus = ticket.status === 'open' ? 'in_progress' : ticket.status
  await updateDoc(doc(db, 'supportTickets', ticketId), {
    replies: [
      ...ticket.replies,
      { by, byRole, message: parsed.message, createdAt: new Date().toISOString() },
    ],
    status: nextStatus,
    updatedAt: serverTimestamp(),
  })
}

/** Admin status change (open / in_progress / resolved / closed). */
export async function setTicketStatus(db: Firestore, ticketId: string, status: TicketStatus): Promise<void> {
  if (!isValidTicketStatus(status)) throw new Error('অবৈধ টিকিট অবস্থা।')
  await updateDoc(doc(db, 'supportTickets', ticketId), { status, updatedAt: serverTimestamp() })
}

// ---- Demo mode: labelled ডেমো টিকিট in localStorage ----

export const DEMO_TICKETS_KEY = 'sp-academy-demo-tickets-v1'

function readDemoStore(): SupportTicket[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(DEMO_TICKETS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return sortTickets(
      parsed
        .map((item) => (item && typeof item === 'object' ? ticketFromDoc(String((item as { id?: unknown }).id ?? ''), item as Record<string, unknown>) : null))
        .filter((t): t is SupportTicket => t !== null),
    )
  } catch {
    return []
  }
}

function writeDemoStore(list: SupportTicket[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(DEMO_TICKETS_KEY, JSON.stringify(list))
  } catch {
    // Storage full / blocked — demo tickets just won't persist.
  }
}

export async function createDemoTicket(userName: string, userEmail: string, input: TicketInput): Promise<string> {
  const parsed = ticketSchema.parse(input)
  await fakeDelay(300)
  const id = `demo-${Date.now()}`
  const ticket: SupportTicket = {
    id,
    userId: 'demo',
    userName,
    userEmail,
    subject: parsed.subject,
    category: parsed.category,
    message: parsed.message,
    status: 'open',
    replies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  writeDemoStore([ticket, ...readDemoStore()])
  return id
}

export async function getDemoTickets(): Promise<SupportTicket[]> {
  await fakeDelay(250)
  return readDemoStore()
}

// ---- Entry points ----

export type TicketsResult = { tickets: SupportTicket[]; source: 'firestore' | 'sample' }

/** The signed-in user's tickets (Firestore) or this browser's demo tickets. */
export async function getTicketsForUser(uid: string | null): Promise<TicketsResult> {
  const fb = getFirebase()
  if (fb && uid) {
    return { tickets: await getMyTickets(fb.db, uid), source: 'firestore' }
  }
  return { tickets: await getDemoTickets(), source: 'sample' }
}

/** All tickets for the admin reports tab (Firestore) or demo tickets. */
export async function getTicketsForAdmin(): Promise<TicketsResult> {
  const fb = getFirebase()
  if (fb) {
    return { tickets: await getAllTickets(fb.db), source: 'firestore' }
  }
  return { tickets: await getDemoTickets(), source: 'sample' }
}

/** Create a ticket — Firestore when configured + signed in, demo ticket otherwise. */
export async function createTicketForUser(
  uid: string | null,
  userName: string,
  userEmail: string,
  input: TicketInput,
): Promise<string> {
  const fb = getFirebase()
  if (fb && uid) {
    return createTicket(fb.db, uid, userName, userEmail, input)
  }
  return createDemoTicket(userName, userEmail, input)
}
