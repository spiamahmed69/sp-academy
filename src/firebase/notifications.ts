/**
 * Notifications — Phase 9.
 *
 * Firestore collection: notifications/{id}
 *   { userId, title, body, type, link?, read, createdAt }
 *   type: 'enrollment' | 'exam' | 'class' | 'order' | 'support' | 'system'
 *
 * Honesty rules:
 * - Notifications are created server-side (Phase 10 backend) or by an admin
 *   (e.g. when replying to a support ticket). A client can NEVER create a
 *   notification for itself or anyone else — the rules block client creates
 *   except for admins, so no fake notification can be invented from the
 *   browser. This service only READS the user's own notifications and marks
 *   them read (only the `read` field may change, enforced by rules v8).
 * - Demo mode (Firebase not configured): labelled নমুনা notifications in
 *   this browser's localStorage only. They are samples that show how the
 *   inbox will look — never presented as real notifications.
 */
import { collection, getDocs, query, updateDoc, doc, where, type Firestore } from 'firebase/firestore'
import { getFirebase } from './config'
import { fakeDelay } from '../lib/format'

export const NOTIFICATION_TYPES = ['enrollment', 'exam', 'class', 'order', 'support', 'system'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  enrollment: 'ভর্তি',
  exam: 'পরীক্ষা',
  class: 'লাইভ ক্লাস',
  order: 'অর্ডার',
  support: 'সাপোর্ট',
  system: 'সিস্টেম',
}

export function notificationTypeLabel(type: string): string {
  return (NOTIFICATION_TYPE_LABELS as Record<string, string>)[type] ?? type
}

export function isValidNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value)
}

export interface NotificationDoc {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  link?: string
  read: boolean
  createdAt: unknown
}

/** Pure parser: malformed docs never crash the page, they are skipped. */
export function notificationFromDoc(id: string, data: Record<string, unknown>): NotificationDoc | null {
  if (typeof data.userId !== 'string' || !data.userId) return null
  if (typeof data.title !== 'string' || !data.title) return null
  return {
    id,
    userId: data.userId,
    title: data.title,
    body: typeof data.body === 'string' ? data.body : '',
    type: isValidNotificationType(data.type) ? data.type : 'system',
    link: typeof data.link === 'string' && data.link ? data.link : undefined,
    read: data.read === true,
    createdAt: data.createdAt ?? null,
  }
}

export function createdAtMillis(value: unknown): number {
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

/** Unread count — pure, used by the header bell and the inbox. */
export function unreadCount(list: NotificationDoc[]): number {
  return list.filter((n) => !n.read).length
}

export function sortNotifications(list: NotificationDoc[]): NotificationDoc[] {
  return [...list].sort((a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt))
}

/** Format a created-at value for display (Bengali, or '—' when unknown). */
export function formatNotificationTime(value: unknown): string {
  const millis = createdAtMillis(value)
  if (!millis) return '—'
  return new Date(millis).toLocaleString('bn-BD', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
}

// ---- Firestore (real mode) ----

/** The signed-in user's notifications, newest first. */
export async function getMyNotifications(db: Firestore, uid: string): Promise<NotificationDoc[]> {
  const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)))
  return sortNotifications(
    snap.docs.map((d) => notificationFromDoc(d.id, d.data())).filter((n): n is NotificationDoc => n !== null),
  )
}

/** Mark one notification read (owner only; rules allow changing `read` only). */
export async function markNotificationRead(db: Firestore, id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true })
}

/** Mark every notification of this user read. */
export async function markAllNotificationsRead(db: Firestore, uid: string): Promise<void> {
  const list = await getMyNotifications(db, uid)
  await Promise.all(list.filter((n) => !n.read).map((n) => markNotificationRead(db, n.id)))
}

// ---- Demo mode: labelled নমুনা notifications in localStorage ----

export const DEMO_NOTIFICATIONS_KEY = 'sp-academy-demo-notifications-v1'

/** Sample notifications that show how the inbox will look — clearly labelled নমুনা. */
export function buildDemoNotifications(): NotificationDoc[] {
  const now = Date.now()
  return [
    {
      id: 'demo-n1',
      userId: 'demo',
      title: 'লাইভ ক্লাসের সময়সূচি প্রকাশিত হয়েছে',
      body: 'আগামী শনিবার সকাল ১০টায় এইচএসসি পদার্থবিজ্ঞান ১ম পত্রের লাইভ ক্লাস হবে।',
      type: 'class',
      link: '/live-classes',
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-n2',
      userId: 'demo',
      title: 'মডেল টেস্টের ফল প্রকাশ হয়েছে',
      body: 'এসএসসি গণিত মডেল টেস্টের ফলাফল দেখা যাচ্ছে — ফলাফল পেজে দেখুন।',
      type: 'exam',
      link: '/results',
      read: false,
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-n3',
      userId: 'demo',
      title: 'SP Academy-তে স্বাগতম',
      body: 'আপনার অ্যাকাউন্ট তৈরি হয়েছে। ফ্রি কোর্স দিয়ে শুরু করতে পারেন।',
      type: 'system',
      link: '/free-courses',
      read: true,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

function readDemoStore(): NotificationDoc[] {
  if (typeof window === 'undefined' || !window.localStorage) return buildDemoNotifications()
  try {
    const raw = window.localStorage.getItem(DEMO_NOTIFICATIONS_KEY)
    if (!raw) {
      const seed = buildDemoNotifications()
      window.localStorage.setItem(DEMO_NOTIFICATIONS_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return buildDemoNotifications()
    return parsed
      .map((item) => (item && typeof item === 'object' ? notificationFromDoc(String((item as { id?: unknown }).id ?? ''), item as Record<string, unknown>) : null))
      .filter((n): n is NotificationDoc => n !== null)
  } catch {
    return buildDemoNotifications()
  }
}

function writeDemoStore(list: NotificationDoc[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(DEMO_NOTIFICATIONS_KEY, JSON.stringify(list))
  } catch {
    // Storage full / blocked — demo notifications just won't persist.
  }
}

export async function getDemoNotifications(): Promise<NotificationDoc[]> {
  await fakeDelay(250)
  return sortNotifications(readDemoStore())
}

export async function markDemoNotificationRead(id: string): Promise<void> {
  await fakeDelay(150)
  writeDemoStore(readDemoStore().map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export async function markAllDemoNotificationsRead(): Promise<void> {
  await fakeDelay(150)
  writeDemoStore(readDemoStore().map((n) => ({ ...n, read: true })))
}

// ---- Entry point: Firestore when configured + signed in, demo otherwise ----

export type NotificationsResult = { notifications: NotificationDoc[]; source: 'firestore' | 'sample' }

export async function getNotifications(uid: string | null): Promise<NotificationsResult> {
  const fb = getFirebase()
  if (fb && uid) {
    return { notifications: await getMyNotifications(fb.db, uid), source: 'firestore' }
  }
  return { notifications: await getDemoNotifications(), source: 'sample' }
}

export async function markRead(id: string, uid: string | null): Promise<void> {
  const fb = getFirebase()
  if (fb && uid) {
    await markNotificationRead(fb.db, id)
    return
  }
  await markDemoNotificationRead(id)
}

export async function markAllRead(uid: string | null): Promise<void> {
  const fb = getFirebase()
  if (fb && uid) {
    await markAllNotificationsRead(fb.db, uid)
    return
  }
  await markAllDemoNotificationsRead()
}
