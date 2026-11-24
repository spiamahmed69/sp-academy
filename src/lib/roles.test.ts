import { describe, expect, it } from 'vitest'
import {
  canAccess,
  hasMinRank,
  hasPermission,
  isPrivilegedRole,
  isValidRole,
  normalizeRole,
  ROLE_PERMISSIONS,
  ROLES,
} from './roles'

describe('roles', () => {
  it('lists all five roles', () => {
    expect(ROLES).toEqual(['super_admin', 'admin', 'moderator', 'teacher', 'student'])
  })

  it('normalizes unknown values to student (never a privileged role)', () => {
    expect(normalizeRole(undefined)).toBe('student')
    expect(normalizeRole('admin')).toBe('admin')
    expect(normalizeRole('hacker')).toBe('student')
    expect(normalizeRole(null)).toBe('student')
  })

  it('validates role strings', () => {
    expect(isValidRole('teacher')).toBe(true)
    expect(isValidRole('superuser')).toBe(false)
  })

  it('super_admin can access any role-guarded route', () => {
    expect(canAccess('super_admin', ['teacher'])).toBe(true)
    expect(canAccess('super_admin', [])).toBe(true)
  })

  it('canAccess respects the allowed list', () => {
    expect(canAccess('teacher', ['teacher', 'admin'])).toBe(true)
    expect(canAccess('student', ['teacher'])).toBe(false)
    expect(canAccess(null, ['student'])).toBe(false)
    expect(canAccess(undefined, ['student'])).toBe(false)
  })

  it('rank ordering: admin outranks teacher, student is lowest', () => {
    expect(hasMinRank('admin', 'teacher')).toBe(true)
    expect(hasMinRank('teacher', 'admin')).toBe(false)
    expect(hasMinRank('student', 'student')).toBe(true)
  })

  it('only student is non-privileged', () => {
    expect(isPrivilegedRole('student')).toBe(false)
    for (const r of ['super_admin', 'admin', 'moderator', 'teacher'] as const) {
      expect(isPrivilegedRole(r)).toBe(true)
    }
  })

  it('students cannot manage courses; teachers cannot manage users', () => {
    expect(hasPermission('student', 'courses.manage')).toBe(false)
    expect(hasPermission('student', 'courses.browse')).toBe(true)
    expect(hasPermission('teacher', 'users.view')).toBe(false)
    expect(hasPermission('super_admin', 'anything.at.all')).toBe(true)
  })

  it('every role has a permission list', () => {
    for (const r of ROLES) {
      expect(Array.isArray(ROLE_PERMISSIONS[r])).toBe(true)
      expect(ROLE_PERMISSIONS[r].length).toBeGreaterThan(0)
    }
  })
})
