/**
 * Live classes — Phase 5.
 *
 * Firestore collection: liveClasses/{classId}
 *   { title, description, teacherId, teacherName, courseId, courseTitle,
 *     subject, startsAt (Timestamp), durationMin, joinUrl, recordingUrl,
 *     status: 'scheduled' | 'live' | 'ended' | 'cancelled',
 *     createdAt, updatedAt }
 *
 * Honesty rules:
 * - There is NO real video-call integration yet, so a class NEVER pretends
 *   to be live. The join button renders a real link ONLY when a joinUrl
 *   exists on the document; otherwise the UI says the link will appear
 *   before the class starts. A recording link renders ONLY when a
 *   recordingUrl exists; otherwise the UI says no recording is added yet.
 * - Attendee counts are shown ONLY when they are known: sample data is
 *   labelled নমুনা, Firestore classes show no invented count.
 * - Scheduling is teacher/admin only (firestore.rules v4 enforces it);
 *   the client checks the role first for UI purposes only.
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
import { liveClasses as sampleLiveClasses, type LiveClass } from '../data/sample'
import { fakeDelay } from '../lib/format'
import { hasPermission, type Role } from '../lib/roles'

export type LiveClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

export interface LiveClassDoc {
  id: string
  title: string
  description: string
  teacherId: string
  teacherName: string
  courseId: string | null
  courseTitle: string
  subject: string
  startsAt: unknown
  durationMin: number
  joinUrl: string | null
  recordingUrl: string | null
  status: LiveClassStatus
  createdAt: unknown
  updatedAt: unknown
}

/** UI view of a live class — Firestore or labelled sample. */
export interface LiveClassView {
  id: string
  title: string
  description: string
  teacherId: string
  teacherName: string
  courseId: string | null
  courseTitle: string
  subject: string
  /** ISO string, always parseable. */
  startsAt: string
  durationMin: number
  joinUrl: string | null
  recordingUrl: string | null
  status: LiveClassStatus
  /** Null when unknown — the UI must never invent a count. */
  enrolledCount: number | null
  source: 'firestore' | 'sample'
}

/** 'upcoming' | 'live' | 'ended' | 'cancelled' — derived from time + stored status. */
export type LiveClassPhase = 'upcoming' | 'live' | 'ended' | 'cancelled'

export function startsAtMillis(value: unknown): number {
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
  if (value instanceof Date) return value.getTime()
  return 0
}

function asStatus(value: unknown): LiveClassStatus {
  return value === 'live' || value === 'ended' || value === 'cancelled' ? value : 'scheduled'
}

/** Pure parser: malformed docs never crash the page, they are skipped. */
export function liveClassFromDoc(id: string, data: Record<string, unknown>): LiveClassDoc | null {
  if (typeof data.title !== 'string' || !data.title.trim()) return null
  if (typeof data.teacherId !== 'string' || !data.teacherId) return null
  if (startsAtMillis(data.startsAt) <= 0) return null
  return {
    id,
    title: data.title.trim(),
    description: typeof data.description === 'string' ? data.description : '',
    teacherId: data.teacherId,
    teacherName: typeof data.teacherName === 'string' && data.teacherName ? data.teacherName : 'শিক্ষক',
    courseId: typeof data.courseId === 'string' && data.courseId ? data.courseId : null,
    courseTitle: typeof data.courseTitle === 'string' ? data.courseTitle : '',
    subject: typeof data.subject === 'string' ? data.subject : '',
    startsAt: data.startsAt ?? null,
    durationMin: typeof data.durationMin === 'number' && Number.isFinite(data.durationMin) ? data.durationMin : 60,
    joinUrl: typeof data.joinUrl === 'string' && data.joinUrl ? data.joinUrl : null,
    recordingUrl: typeof data.recordingUrl === 'string' && data.recordingUrl ? data.recordingUrl : null,
    status: asStatus(data.status),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

export function liveClassDocToView(doc: LiveClassDoc): LiveClassView {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    teacherId: doc.teacherId,
    teacherName: doc.teacherName,
    courseId: doc.courseId,
    courseTitle: doc.courseTitle,
    subject: doc.subject,
    startsAt: new Date(startsAtMillis(doc.startsAt)).toISOString(),
    durationMin: doc.durationMin,
    joinUrl: doc.joinUrl,
    recordingUrl: doc.recordingUrl,
    status: doc.status,
    enrolledCount: null,
    source: 'firestore',
  }
}

/** Sample class → view. Sample counts stay labelled নমুনা in the UI. */
export function sampleLiveClassToView(cls: LiveClass, teacherName: string): LiveClassView {
  return {
    id: cls.id,
    title: cls.title,
    description: '',
    teacherId: cls.teacherId,
    teacherName,
    courseId: null,
    courseTitle: '',
    subject: cls.subject,
    startsAt: cls.startsAt,
    durationMin: cls.durationMin,
    joinUrl: null,
    recordingUrl: null,
    status: 'scheduled',
    enrolledCount: cls.enrolled,
    source: 'sample',
  }
}

/**
 * Phase of a class at `now` (defaults to Date.now()).
 * Stored 'cancelled'/'ended' win; otherwise time decides: before start →
 * upcoming, within [start, start+duration] → live, after → ended.
 */
export function classifyLiveClass(view: Pick<LiveClassView, 'status' | 'startsAt' | 'durationMin'>, now = Date.now()): LiveClassPhase {
  if (view.status === 'cancelled') return 'cancelled'
  if (view.status === 'ended') return 'ended'
  const start = Date.parse(view.startsAt)
  if (Number.isNaN(start)) return 'upcoming'
  const end = start + Math.max(0, view.durationMin) * 60_000
  if (now < start) return 'upcoming'
  if (now <= end) return 'live'
  return 'ended'
}

export type JoinState =
  | { available: true }
  | { available: false; message: string }

/**
 * When may the join button show a real link? Only when a joinUrl exists.
 * Without one, the UI must say the link appears before the class starts —
 * never render a button that goes nowhere or pretends to join.
 */
export function joinAvailability(view: LiveClassView, now = Date.now()): JoinState {
  const phase = classifyLiveClass(view, now)
  if (phase === 'cancelled') return { available: false, message: 'এই ক্লাসটি বাতিল করা হয়েছে।' }
  if (phase === 'ended') return { available: false, message: 'ক্লাসটি শেষ হয়ে গেছে।' }
  if (view.joinUrl) return { available: true }
  if (phase === 'live') return { available: false, message: 'ক্লাস চলছে, কিন্তু যোগদানের লিংক এখনো যুক্ত হয়নি — শিক্ষকের সাথে যোগাযোগ করুন।' }
  return { available: false, message: 'ক্লাসের যোগদান লিংক শুরুর আগে এখানে দেখা যাবে।' }
}

/** Phase label in Bengali, for badges. */
export function liveClassPhaseLabel(phase: LiveClassPhase): string {
  switch (phase) {
    case 'live':
      return 'লাইভ চলছে'
    case 'ended':
      return 'শেষ হয়েছে'
    case 'cancelled':
      return 'বাতিল'
    default:
      return 'আসন্ন'
  }
}

export interface LiveClassCreateInput {
  title: string
  description?: string
  courseId?: string | null
  courseTitle?: string
  subject: string
  /** ISO string from a datetime-local input. */
  startsAt: string
  durationMin: number
  joinUrl?: string | null
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Pure validation for a new live class. Returns Bengali error messages
 * (empty = valid). The service and the form share this, so the rules
 * never drift apart.
 */
export function validateLiveClassInput(input: LiveClassCreateInput, now = Date.now()): string[] {
  const errors: string[] = []
  if (!input.title.trim()) errors.push('ক্লাসের নাম দিতে হবে।')
  if (!input.subject.trim()) errors.push('বিষয় দিতে হবে।')
  const start = Date.parse(input.startsAt)
  if (Number.isNaN(start)) {
    errors.push('ক্লাস শুরুর সঠিক তারিখ ও সময় দিন।')
  } else if (start <= now) {
    errors.push('ক্লাসের সময় ভবিষ্যতের হতে হবে।')
  }
  if (!Number.isFinite(input.durationMin) || input.durationMin < 5 || input.durationMin > 480) {
    errors.push('ক্লাসের সময়সীমা ৫ থেকে ৪৮০ মিনিটের মধ্যে হতে হবে।')
  }
  const joinUrl = (input.joinUrl ?? '').trim()
  if (joinUrl && !isValidHttpsUrl(joinUrl)) {
    errors.push('যোগদানের লিংক https:// দিয়ে শুরু হওয়া সঠিক ঠিকানা হতে হবে।')
  }
  return errors
}

/** UI-only check: can this role schedule a class? Rules enforce it for real. */
export function canScheduleLiveClass(role: Role | null | undefined): boolean {
  if (!role) return false
  return hasPermission(role, 'live-classes.schedule') || hasPermission(role, 'courses.manage')
}

// ---- Firestore reads ----

/** All live classes from Firestore, soonest first. */
export async function fetchLiveClassesFromFirestore(db: Firestore): Promise<LiveClassView[]> {
  const snap = await getDocs(collection(db, 'liveClasses'))
  const list = snap.docs
    .map((d) => liveClassFromDoc(d.id, d.data()))
    .filter((c): c is LiveClassDoc => c !== null)
    .map(liveClassDocToView)
  list.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  return list
}

/** One teacher's classes from Firestore, soonest first. */
export async function fetchTeacherLiveClasses(db: Firestore, teacherId: string): Promise<LiveClassView[]> {
  const snap = await getDocs(query(collection(db, 'liveClasses'), where('teacherId', '==', teacherId)))
  const list = snap.docs
    .map((d) => liveClassFromDoc(d.id, d.data()))
    .filter((c): c is LiveClassDoc => c !== null)
    .map(liveClassDocToView)
  list.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  return list
}

export interface LiveClassesResult {
  classes: LiveClassView[]
  /** 'firestore' when read live, 'sample' when Firebase is not configured yet. */
  source: 'firestore' | 'sample'
}

/** Entry point: Firestore when configured, labelled sample data otherwise. */
export async function getLiveClasses(): Promise<LiveClassesResult> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    const { getTeacherById } = await import('../data/sample')
    return {
      classes: sampleLiveClasses.map((c) => sampleLiveClassToView(c, getTeacherById(c.teacherId)?.name ?? 'শিক্ষক')),
      source: 'sample',
    }
  }
  const classes = await fetchLiveClassesFromFirestore(fb.db)
  return { classes, source: 'firestore' }
}

// ---- Firestore writes (teacher/admin only; rules enforce) ----

/** Schedule a new class as 'scheduled'. Throws Bengali errors on bad input. */
export async function scheduleLiveClass(
  db: Firestore,
  input: LiveClassCreateInput,
  teacher: { uid: string; displayName: string },
): Promise<string> {
  const errors = validateLiveClassInput(input)
  if (errors.length > 0) throw new Error(errors[0])
  const now = serverTimestamp()
  const ref = await addDoc(collection(db, 'liveClasses'), {
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    teacherId: teacher.uid,
    teacherName: teacher.displayName || 'শিক্ষক',
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? '',
    subject: input.subject.trim(),
    startsAt: new Date(input.startsAt),
    durationMin: input.durationMin,
    joinUrl: (input.joinUrl ?? '').trim() || null,
    recordingUrl: null,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

/** Set / replace the join link of a class (teacher adds it before start time). */
export async function setLiveClassJoinUrl(db: Firestore, classId: string, joinUrl: string): Promise<void> {
  const url = joinUrl.trim()
  if (!isValidHttpsUrl(url)) throw new Error('যোগদানের লিংক https:// দিয়ে শুরু হওয়া সঠিক ঠিকানা হতে হবে।')
  await updateDoc(doc(db, 'liveClasses', classId), { joinUrl: url, updatedAt: serverTimestamp() })
}

/** Set / replace the recording link of an ended class. */
export async function setLiveClassRecordingUrl(db: Firestore, classId: string, recordingUrl: string): Promise<void> {
  const url = recordingUrl.trim()
  if (!isValidHttpsUrl(url)) throw new Error('রেকর্ডিং লিংক https:// দিয়ে শুরু হওয়া সঠিক ঠিকানা হতে হবে।')
  await updateDoc(doc(db, 'liveClasses', classId), { recordingUrl: url, updatedAt: serverTimestamp() })
}

/** Cancel a scheduled class. Ended/cancelled classes stay as history. */
export async function cancelLiveClass(db: Firestore, classId: string): Promise<void> {
  await updateDoc(doc(db, 'liveClasses', classId), { status: 'cancelled', updatedAt: serverTimestamp() })
}
