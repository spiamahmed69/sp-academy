/**
 * Certificates — Phase 4.
 *
 * Firestore collection: certificates/{certId}
 *   { userId, courseId, courseTitle, issuedAt, grade? }
 *
 * Honesty rules:
 * - Certificates are issued only by exams (Phase 6). Nothing in this
 *   phase creates a certificate, and the dashboard shows an honest empty
 *   state ("এখনো কোনো সার্টিফিকেট নেই") until one is genuinely earned.
 * - This service only READS a user's own certificates. The rules
 *   (firestore.rules v3) allow read only for the owner or an admin;
 *   writes stay blocked until Phase 6 adds the server-side issuer.
 */
import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'

export interface CertificateDoc {
  id: string
  userId: string
  courseId: string
  courseTitle: string
  issuedAt: unknown
  grade?: string
}

/** Pure parser: malformed docs never crash the page, they are skipped. */
export function certificateFromDoc(id: string, data: Record<string, unknown>): CertificateDoc | null {
  if (typeof data.userId !== 'string' || !data.userId) return null
  if (typeof data.courseId !== 'string' || !data.courseId) return null
  return {
    id,
    userId: data.userId,
    courseId: data.courseId,
    courseTitle: typeof data.courseTitle === 'string' && data.courseTitle ? data.courseTitle : 'নামহীন কোর্স',
    issuedAt: data.issuedAt ?? null,
    grade: typeof data.grade === 'string' ? data.grade : undefined,
  }
}

function issuedAtMillis(value: unknown): number {
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
  return 0
}

/** The user's certificates, newest first. Empty until Phase 6 issues any. */
export async function getMyCertificates(db: Firestore, uid: string): Promise<CertificateDoc[]> {
  const snap = await getDocs(query(collection(db, 'certificates'), where('userId', '==', uid)))
  const list = snap.docs
    .map((d) => certificateFromDoc(d.id, d.data()))
    .filter((c): c is CertificateDoc => c !== null)
  list.sort((a, b) => issuedAtMillis(b.issuedAt) - issuedAtMillis(a.issuedAt))
  return list
}

/** Format an issued-at value for display (Bengali date, or '—' when unknown). */
export function formatIssuedAt(value: unknown): string {
  const millis = issuedAtMillis(value)
  if (!millis) return '—'
  return new Date(millis).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
}
