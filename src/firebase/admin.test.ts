import { describe, expect, it } from 'vitest'
import {
  countSuperAdmins,
  canManageUsers,
  summarizeAdminStats,
  validateDisableUser,
  validateRoleChange,
  type AdminOverviewStats,
} from './admin'
import type { UserProfile } from './profiles'

function profile(uid: string, role: UserProfile['role']): UserProfile {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: uid,
    phone: '',
    role,
    photoURL: null,
    createdAt: null,
    updatedAt: null,
  }
}

describe('summarizeAdminStats', () => {
  it('aggregates real query results without inventing numbers', () => {
    const stats: AdminOverviewStats = summarizeAdminStats({
      users: [profile('u1', 'super_admin'), profile('u2', 'admin'), profile('u3', 'teacher'), profile('u4', 'student'), profile('u5', 'student')],
      courses: [
        { status: 'published' },
        { status: 'published' },
        { status: 'draft' },
        { status: 'archived' },
      ],
      enrollments: [{ status: 'active' }, { status: 'active' }, { status: 'cancelled' }],
      exams: [{ status: 'published' }, { status: 'draft' }],
      liveClasses: [
        { status: 'scheduled', startsAt: new Date(Date.now() + 3600_000).toISOString() },
        { status: 'scheduled', startsAt: new Date(Date.now() - 3600_000).toISOString() },
        { status: 'ended', startsAt: new Date(Date.now() - 7200_000).toISOString() },
      ],
      attempts: [{}, {}],
    })
    expect(stats.totalUsers).toBe(5)
    expect(stats.usersByRole).toEqual({ super_admin: 1, admin: 1, moderator: 0, teacher: 1, student: 2 })
    expect(stats.totalCourses).toBe(4)
    expect(stats.publishedCourses).toBe(2)
    expect(stats.draftCourses).toBe(1)
    expect(stats.archivedCourses).toBe(1)
    expect(stats.totalEnrollments).toBe(3)
    expect(stats.activeEnrollments).toBe(2)
    expect(stats.totalExams).toBe(2)
    expect(stats.publishedExams).toBe(1)
    expect(stats.totalLiveClasses).toBe(3)
    // Only the future scheduled class counts as upcoming.
    expect(stats.upcomingLiveClasses).toBe(1)
    expect(stats.totalAttempts).toBe(2)
  })

  it('returns all zeros for empty input', () => {
    const stats = summarizeAdminStats({ users: [], courses: [], enrollments: [], exams: [], liveClasses: [], attempts: [] })
    expect(stats.totalUsers).toBe(0)
    expect(stats.usersByRole.student).toBe(0)
    expect(stats.upcomingLiveClasses).toBe(0)
  })
})

describe('canManageUsers', () => {
  it('allows only admin and super_admin', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('super_admin')).toBe(true)
    expect(canManageUsers('moderator')).toBe(false)
    expect(canManageUsers('teacher')).toBe(false)
    expect(canManageUsers('student')).toBe(false)
    expect(canManageUsers(null)).toBe(false)
    expect(canManageUsers(undefined)).toBe(false)
  })
})

describe('countSuperAdmins', () => {
  it('counts super_admins only', () => {
    expect(countSuperAdmins([profile('a', 'super_admin'), profile('b', 'admin'), profile('c', 'super_admin')])).toBe(2)
    expect(countSuperAdmins([])).toBe(0)
  })
})

describe('validateRoleChange', () => {
  const base = {
    actorUid: 'admin-1',
    actorRole: 'admin' as const,
    targetUid: 'user-1',
    targetRole: 'student' as const,
    newRole: 'teacher' as const,
    superAdminCount: 2,
  }

  it('allows a valid admin role change', () => {
    expect(validateRoleChange(base)).toBeNull()
  })

  it('blocks changing your own role (no self-assignment)', () => {
    expect(validateRoleChange({ ...base, targetUid: 'admin-1', targetRole: 'admin' })).toMatch(/নিজের রোল/)
  })

  it('blocks non-admins from changing roles', () => {
    expect(validateRoleChange({ ...base, actorRole: 'teacher' })).toMatch(/শুধু অ্যাডমিন/)
  })

  it('blocks granting super_admin unless the actor is super_admin', () => {
    expect(validateRoleChange({ ...base, newRole: 'super_admin' })).toMatch(/সুপার অ্যাডমিন/)
    expect(validateRoleChange({ ...base, actorRole: 'super_admin', newRole: 'super_admin' })).toBeNull()
  })

  it('blocks demoting the last super_admin', () => {
    expect(
      validateRoleChange({ ...base, targetRole: 'super_admin', newRole: 'admin', superAdminCount: 1 }),
    ).toMatch(/শেষ সুপার অ্যাডমিন/)
    expect(
      validateRoleChange({ ...base, targetRole: 'super_admin', newRole: 'admin', superAdminCount: 2 }),
    ).toBeNull()
  })

  it('blocks a no-op role change', () => {
    expect(validateRoleChange({ ...base, newRole: 'student' })).toMatch(/ইতিমধ্যে/)
  })
})

describe('validateDisableUser', () => {
  const base = {
    actorUid: 'admin-1',
    actorRole: 'admin' as const,
    targetUid: 'user-1',
    targetRole: 'student' as const,
    superAdminCount: 2,
  }

  it('allows disabling a student', () => {
    expect(validateDisableUser(base)).toBeNull()
  })

  it('blocks disabling your own account', () => {
    expect(validateDisableUser({ ...base, targetUid: 'admin-1' })).toMatch(/নিজের অ্যাকাউন্ট/)
  })

  it('blocks disabling the last super_admin', () => {
    expect(
      validateDisableUser({ ...base, targetRole: 'super_admin', superAdminCount: 1 }),
    ).toMatch(/শেষ সুপার অ্যাডমিন/)
  })

  it('blocks non-admins', () => {
    expect(validateDisableUser({ ...base, actorRole: 'moderator' })).toMatch(/শুধু অ্যাডমিন/)
  })
})
