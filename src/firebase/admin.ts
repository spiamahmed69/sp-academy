/**
 * Admin dashboard service — Phase 7.
 *
 * Firestore reads (admin only — see firestore.rules v6):
 *   - overview: live counts from users / courses / enrollments / exams /
 *     liveClasses / examAttempts. NOTHING is hardcoded — every number on
 *     the overview comes from a real query (getDocs for breakdowns,
 *     getCountFromServer for attempts).
 *   - users: all users/{uid} docs (admin read).
 *   - courses: all courses (any status — drafts included).
 *   - exams / live classes: the full lists (admin read).
 *
 * Role changes (client-side guards + rules):
 *   - Only an admin / super_admin may change a role, and NEVER their own
 *     (no self-assignment, no self-demotion).
 *   - Only a super_admin may grant super_admin.
 *   - The LAST super_admin cannot be demoted — demote someone else first.
 *   - Changing a role updates the Firestore profile doc. The custom claim
 *     the security rules actually enforce is set via console / Admin SDK
 *     (Phase 10 backend keeps the two in sync) — the UI says this plainly.
 *
 * Disable / enable:
 *   - Sets users/{uid}.disabled. The rules block a disabled account from
 *     creating enrollments or exam attempts (v6). Full Auth-level
 *     deactivation (blocking login entirely) needs the Admin SDK and
 *     arrives with the backend in Phase 10 — the UI says so.
 *
 * Demo mode (Firebase not configured): labelled নমুনা sample data —
 * sample users, the sample catalogue, sample exams/classes. Write buttons
 * are replaced by a note that real changes need Firebase + an admin login.
 * No fake users, no fake stats, no fake reports.
 */
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { getFirebase } from './config'
import { courseFromDoc, type CourseDoc } from './courses'
import { fetchExamsFromFirestore, type ExamView } from './exams'
import { fetchLiveClassesFromFirestore, type LiveClassView } from './liveClasses'
import { profileFromDoc, type UserProfile } from './profiles'
import { courses as sampleCourses, liveClasses as sampleLiveClasses, upcomingExams, type Course } from '../data/sample'
import { fakeDelay } from '../lib/format'
import { isValidRole, type Role } from '../lib/roles'

// ---- Overview stats ----

export interface AdminOverviewStats {
  totalUsers: number
  usersByRole: Record<Role, number>
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  totalEnrollments: number
  activeEnrollments: number
  totalExams: number
  publishedExams: number
  totalLiveClasses: number
  upcomingLiveClasses: number
  totalAttempts: number
}

export interface StatsInput {
  users: Pick<UserProfile, 'role'>[]
  courses: Pick<Course, 'status'>[]
  enrollments: { status: string }[]
  exams: Pick<ExamView, 'status'>[]
  liveClasses: Pick<LiveClassView, 'status' | 'startsAt'>[]
  attempts: unknown[]
}

/** Aggregate admin overview stats from real query results. Never invents numbers. */
export function summarizeAdminStats(input: StatsInput, now = Date.now()): AdminOverviewStats {
  const usersByRole: Record<Role, number> = {
    super_admin: 0,
    admin: 0,
    moderator: 0,
    teacher: 0,
    student: 0,
  }
  for (const u of input.users) usersByRole[u.role] += 1
  return {
    totalUsers: input.users.length,
    usersByRole,
    totalCourses: input.courses.length,
    publishedCourses: input.courses.filter((c) => c.status !== 'draft' && c.status !== 'archived').length,
    draftCourses: input.courses.filter((c) => c.status === 'draft').length,
    archivedCourses: input.courses.filter((c) => c.status === 'archived').length,
    totalEnrollments: input.enrollments.length,
    activeEnrollments: input.enrollments.filter((e) => e.status === 'active').length,
    totalExams: input.exams.length,
    publishedExams: input.exams.filter((e) => e.status === 'published').length,
    totalLiveClasses: input.liveClasses.length,
    upcomingLiveClasses: input.liveClasses.filter(
      (c) => c.status === 'scheduled' && Date.parse(c.startsAt) > now,
    ).length,
    totalAttempts: input.attempts.length,
  }
}

/** Live overview: every number from a real Firestore query. */
export async function fetchAdminOverview(db: Firestore): Promise<AdminOverviewStats> {
  const [usersSnap, coursesSnap, enrollmentsSnap, examsSnap, classesSnap, attemptsCount] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'courses')),
    getDocs(collection(db, 'enrollments')),
    getDocs(collection(db, 'exams')),
    getDocs(collection(db, 'liveClasses')),
    getCountFromServer(collection(db, 'examAttempts')),
  ])
  return summarizeAdminStats({
    users: usersSnap.docs.map((d) => profileFromDoc(d.id, d.data())),
    courses: coursesSnap.docs.map((d) => courseFromDoc(d.id, d.data() as Record<string, unknown>)),
    enrollments: enrollmentsSnap.docs.map((d) => ({ status: typeof d.data().status === 'string' ? d.data().status : '' })),
    exams: examsSnap.docs.map((d) => ({ status: d.data().status === 'published' ? 'published' : 'draft' as const })),
    liveClasses: classesSnap.docs.map((d) => ({
      status: (typeof d.data().status === 'string' ? d.data().status : 'scheduled') as LiveClassView['status'],
      startsAt: (d.data() as { startsAt?: { toDate?: () => Date } }).startsAt?.toDate?.().toISOString() ?? '',
    })),
    attempts: Array.from({ length: attemptsCount.data().count }),
  })
}

// ---- Role guards (pure, tested) ----

export function canManageUsers(role: Role | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function countSuperAdmins(users: Pick<UserProfile, 'role'>[]): number {
  return users.filter((u) => u.role === 'super_admin').length
}

export interface RoleChangeContext {
  actorUid: string
  actorRole: Role
  targetUid: string
  targetRole: Role
  newRole: Role
  superAdminCount: number
}

/**
 * Validate a role change. Returns a Bengali error message, or null when allowed.
 * Rules mirror firestore.rules v6 (which blocks self role-changes for real);
 * the last-super-admin guard lives here + the backend (Phase 10), because
 * Firestore rules cannot count documents.
 */
export function validateRoleChange(ctx: RoleChangeContext): string | null {
  if (ctx.actorUid === ctx.targetUid) return 'নিজের রোল নিজে বদলানো যায় না।'
  if (!canManageUsers(ctx.actorRole)) return 'শুধু অ্যাডমিন রোল বদলাতে পারে।'
  if (!isValidRole(ctx.newRole)) return 'সঠিক রোল বেছে নিন।'
  if (ctx.newRole === ctx.targetRole) return 'এই ব্যবহারকারীর রোল ইতিমধ্যে এটাই।'
  if (ctx.newRole === 'super_admin' && ctx.actorRole !== 'super_admin') {
    return 'শুধু সুপার অ্যাডমিন কাউকে সুপার অ্যাডমিন করতে পারে।'
  }
  if (ctx.targetRole === 'super_admin' && ctx.newRole !== 'super_admin' && ctx.superAdminCount <= 1) {
    return 'শেষ সুপার অ্যাডমিনকে রোল থেকে সরানো যাবে না। আগে আরেকজন সুপার অ্যাডমিন বানান।'
  }
  return null
}

/** Validate disabling an account: never your own, never the last super_admin. */
export function validateDisableUser(ctx: {
  actorUid: string
  actorRole: Role
  targetUid: string
  targetRole: Role
  superAdminCount: number
}): string | null {
  if (ctx.actorUid === ctx.targetUid) return 'নিজের অ্যাকাউন্ট নিজে নিষ্ক্রিয় করা যায় না।'
  if (!canManageUsers(ctx.actorRole)) return 'শুধু অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয় করতে পারে।'
  if (ctx.targetRole === 'super_admin' && ctx.superAdminCount <= 1) {
    return 'শেষ সুপার অ্যাডমিনকে নিষ্ক্রিয় করা যাবে না। আগে আরেকজন সুপার অ্যাডমিন বানান।'
  }
  return null
}

// ---- Admin reads ----

/** All user profiles (admin read). Newest first by creation time where known. */
export async function fetchAllUsers(db: Firestore): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'))
  const list = snap.docs.map((d) => profileFromDoc(d.id, d.data()))
  list.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email, 'bn'))
  return list
}

/** All courses, any status — drafts and archived included. */
export async function fetchAllCoursesAdmin(db: Firestore): Promise<Course[]> {
  const snap = await getDocs(collection(db, 'courses'))
  const list = snap.docs.map((d) => ({
    course: courseFromDoc(d.id, d.data() as Record<string, unknown>),
    created: timestampMillis((d.data() as CourseDoc).createdAt),
  }))
  list.sort((a, b) => b.created - a.created || a.course.title.localeCompare(b.course.title, 'bn'))
  return list.map((item) => item.course)
}

function timestampMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: unknown }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000
  }
  return 0
}

/** All exams (admin read — drafts included). */
export async function fetchAdminExams(db: Firestore): Promise<ExamView[]> {
  return fetchExamsFromFirestore(db)
}

/** All live classes (admin read — cancelled included). */
export async function fetchAdminLiveClasses(db: Firestore): Promise<LiveClassView[]> {
  return fetchLiveClassesFromFirestore(db)
}

// ---- Admin writes ----

/** Change a user's role in their profile doc. Callers must run validateRoleChange first. */
export async function setUserRole(db: Firestore, targetUid: string, newRole: Role): Promise<void> {
  await updateDoc(doc(db, 'users', targetUid), { role: newRole, updatedAt: serverTimestamp() })
}

/** Disable / enable an account (Firestore flag; rules block its new enrollments/attempts). */
export async function setUserDisabled(db: Firestore, targetUid: string, disabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', targetUid), { disabled, updatedAt: serverTimestamp() })
}

/** Delete a course (admin only; rules enforce). Lessons stay orphaned until Phase 10 cleanup. */
export async function deleteCourseAdmin(db: Firestore, courseId: string): Promise<void> {
  await deleteDoc(doc(db, 'courses', courseId))
}

// ---- Demo mode (labelled নমুনা) ----

/** Sample users for the demo preview — openly labelled নমুনা, never real accounts. */
export const SAMPLE_ADMIN_USERS: UserProfile[] = [
  { uid: 'demo-super-admin', email: 'superadmin@spacademy.example', displayName: 'সুপার অ্যাডমিন (নমুনা)', phone: '', role: 'super_admin', photoURL: null, createdAt: null, updatedAt: null },
  { uid: 'demo-admin', email: 'admin@spacademy.example', displayName: 'অ্যাডমিন (নমুনা)', phone: '', role: 'admin', photoURL: null, createdAt: null, updatedAt: null },
  { uid: 'demo-teacher-t1', email: 'arif@spacademy.example', displayName: 'আরিফ হোসেন (নমুনা)', phone: '', role: 'teacher', photoURL: null, createdAt: null, updatedAt: null },
  { uid: 'demo-teacher-t2', email: 'nusrat@spacademy.example', displayName: 'নুসরাত জাহান (নমুনা)', phone: '', role: 'teacher', photoURL: null, createdAt: null, updatedAt: null },
  { uid: 'demo-student-1', email: 'student1@spacademy.example', displayName: 'নমুনা শিক্ষার্থী ১', phone: '', role: 'student', photoURL: null, createdAt: null, updatedAt: null },
  { uid: 'demo-student-2', email: 'student2@spacademy.example', displayName: 'নমুনা শিক্ষার্থী ২', phone: '', role: 'student', photoURL: null, createdAt: null, updatedAt: null },
]

/** Demo overview computed from the sample catalogue — labelled নমুনা, never real stats. */
export async function getDemoAdminOverview(): Promise<AdminOverviewStats> {
  await fakeDelay(300)
  return summarizeAdminStats({
    users: SAMPLE_ADMIN_USERS,
    courses: sampleCourses,
    // Sample data has no enrollments — honestly 0, not an invented number.
    enrollments: [],
    exams: upcomingExams.map(() => ({ status: 'published' as const })),
    liveClasses: sampleLiveClasses.map((c) => ({ status: 'scheduled', startsAt: c.startsAt })),
    attempts: [],
  })
}

export interface AdminDataResult<T> {
  data: T
  /** 'firestore' when read live, 'sample' for the labelled demo preview. */
  source: 'firestore' | 'sample'
}

export async function getAdminOverview(): Promise<AdminDataResult<AdminOverviewStats>> {
  const fb = getFirebase()
  if (!fb) return { data: await getDemoAdminOverview(), source: 'sample' }
  return { data: await fetchAdminOverview(fb.db), source: 'firestore' }
}

export async function getAdminUsers(): Promise<AdminDataResult<UserProfile[]>> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    return { data: SAMPLE_ADMIN_USERS, source: 'sample' }
  }
  return { data: await fetchAllUsers(fb.db), source: 'firestore' }
}

export async function getAdminCourses(): Promise<AdminDataResult<Course[]>> {
  const fb = getFirebase()
  if (!fb) {
    await fakeDelay(300)
    return { data: sampleCourses, source: 'sample' }
  }
  return { data: await fetchAllCoursesAdmin(fb.db), source: 'firestore' }
}

export async function getAdminExams(): Promise<AdminDataResult<ExamView[]>> {
  const fb = getFirebase()
  if (!fb) {
    const { getExams } = await import('./exams')
    const { exams } = await getExams()
    return { data: exams, source: 'sample' }
  }
  return { data: await fetchAdminExams(fb.db), source: 'firestore' }
}

export async function getAdminLiveClasses(): Promise<AdminDataResult<LiveClassView[]>> {
  const fb = getFirebase()
  if (!fb) {
    const { getLiveClasses } = await import('./liveClasses')
    const { classes } = await getLiveClasses()
    return { data: classes, source: 'sample' }
  }
  return { data: await fetchAdminLiveClasses(fb.db), source: 'firestore' }
}
