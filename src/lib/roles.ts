/**
 * Roles & permissions — Phase 2.
 *
 * Roles are trusted records, never self-assigned: a new registrant is always
 * `student`. Privileged roles (super_admin / admin / moderator / teacher) are
 * granted only by an existing admin through the backend / Firebase console
 * (custom claims + the `users/{uid}.role` field, kept in sync by trusted code).
 * The client enforces route guards with these helpers, but Firestore security
 * rules (firestore.rules) and the future backend are the real enforcement —
 * client-side checks alone are never trusted for security.
 */

export const ROLES = ['super_admin', 'admin', 'moderator', 'teacher', 'student'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'সুপার অ্যাডমিন',
  admin: 'অ্যাডমিন',
  moderator: 'মডারেটর',
  teacher: 'শিক্ষক',
  student: 'শিক্ষার্থী',
}

/** Higher rank = more privilege. Used only for UI guards, never for security. */
export const ROLE_RANK: Record<Role, number> = {
  student: 1,
  teacher: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5,
}

export const PRIVILEGED_ROLES: Role[] = ['super_admin', 'admin', 'moderator', 'teacher']

export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Normalise an unknown stored value to a safe role (defaults to student). */
export function normalizeRole(value: unknown): Role {
  return isValidRole(value) ? value : 'student'
}

export function isPrivilegedRole(role: Role): boolean {
  return PRIVILEGED_ROLES.includes(role)
}

/** Does `role` satisfy at least one of `allowed`? super_admin passes all. */
export function canAccess(role: Role | null | undefined, allowed: Role[]): boolean {
  if (!role) return false
  if (role === 'super_admin') return true
  return allowed.includes(role)
}

/** Does `role` meet or exceed the minimum rank? */
export function hasMinRank(role: Role | null | undefined, min: Role): boolean {
  if (!role) return false
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

/**
 * Permissions granted to each role (UI + future backend reference).
 * The authoritative enforcement lives in firestore.rules + backend middleware.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin: ['*'],
  admin: [
    'courses.manage',
    'teachers.manage',
    'students.manage',
    'exams.manage',
    'orders.manage',
    'content.manage',
    'users.view',
  ],
  moderator: ['content.moderate', 'reviews.moderate', 'support.reply'],
  teacher: [
    'courses.assigned.manage',
    'lessons.create',
    'notes.upload',
    'live-classes.schedule',
    'exams.assigned.create',
    'cq.evaluate',
    'students.assigned.view',
  ],
  student: [
    'courses.browse',
    'courses.enroll',
    'lessons.view.enrolled',
    'classes.attend',
    'exams.take.eligible',
    'results.view.own',
    'profile.manage.own',
  ],
}

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return perms.includes('*') || perms.includes(permission)
}
