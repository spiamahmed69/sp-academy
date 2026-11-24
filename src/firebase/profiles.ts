/**
 * Firestore user profiles — Phase 2.
 *
 * Collections (see firestore.rules + docs/architecture.md):
 *   users/{uid}      — one doc per auth user: role, display name, phone, timestamps
 *   students/{uid}   — student record, created at registration (role === 'student')
 *   roles/{roleId}   — role definitions (seeded by an admin, never by clients)
 *   permissions/{id} — permission definitions (seeded by an admin)
 *
 * A new registrant is ALWAYS created with role 'student'. Privileged roles are
 * granted only by an admin (console / backend with Admin SDK) — the client
 * never writes a role other than 'student' for itself.
 */
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore'
import type { Role } from '../lib/roles'
import { normalizeRole } from '../lib/roles'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  phone: string
  role: Role
  photoURL: string | null
  /** Admin-set flag (Phase 7): a disabled account cannot create enrollments or exam attempts. */
  disabled?: boolean
  createdAt: unknown
  updatedAt: unknown
}

export interface StudentRecord {
  uid: string
  email: string
  displayName: string
  phone: string
  enrolledCourseIds: string[]
  createdAt: unknown
}

export function profileFromDoc(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    role: normalizeRole(data.role),
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    disabled: data.disabled === true,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/** Create the users/{uid} doc (and students/{uid} for students) at registration. */
export async function createUserProfile(
  db: Firestore,
  input: { uid: string; email: string; displayName: string; phone: string },
): Promise<UserProfile> {
  const now = serverTimestamp()
  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: unknown; updatedAt: unknown } = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    phone: input.phone,
    role: 'student',
    photoURL: null,
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(doc(db, 'users', input.uid), profile)
  const student: StudentRecord = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    phone: input.phone,
    enrolledCourseIds: [],
    createdAt: now,
  }
  await setDoc(doc(db, 'students', input.uid), student)
  return profile as UserProfile
}

/** Read users/{uid}; returns null when no profile doc exists yet. */
export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return profileFromDoc(uid, snap.data())
}

/** Update only the owner's own editable fields (name, phone). Role is never updated here. */
export async function updateUserProfile(
  db: Firestore,
  uid: string,
  patch: { displayName?: string; phone?: string },
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...patch, updatedAt: serverTimestamp() })
}

/** Seed shape for roles/{roleId} — created by an admin, not by this client code. */
export const ROLE_SEEDS: { id: Role; label: string; permissions: string[] }[] = [
  { id: 'super_admin', label: 'সুপার অ্যাডমিন', permissions: ['*'] },
  {
    id: 'admin',
    label: 'অ্যাডমিন',
    permissions: ['courses.manage', 'teachers.manage', 'students.manage', 'exams.manage', 'orders.manage', 'content.manage', 'users.view'],
  },
  { id: 'moderator', label: 'মডারেটর', permissions: ['content.moderate', 'reviews.moderate', 'support.reply'] },
  {
    id: 'teacher',
    label: 'শিক্ষক',
    permissions: ['courses.assigned.manage', 'lessons.create', 'notes.upload', 'live-classes.schedule', 'exams.assigned.create', 'cq.evaluate', 'students.assigned.view'],
  },
  {
    id: 'student',
    label: 'শিক্ষার্থী',
    permissions: ['courses.browse', 'courses.enroll', 'lessons.view.enrolled', 'classes.attend', 'exams.take.eligible', 'results.view.own', 'profile.manage.own'],
  },
]
