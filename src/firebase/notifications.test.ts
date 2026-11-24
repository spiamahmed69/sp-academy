import { describe, expect, it } from 'vitest'
import {
  buildDemoNotifications,
  createdAtMillis,
  notificationFromDoc,
  notificationTypeLabel,
  sortNotifications,
  unreadCount,
} from './notifications'

describe('notificationFromDoc', () => {
  it('parses a valid doc', () => {
    const n = notificationFromDoc('n1', {
      userId: 'u1',
      title: 'পরীক্ষার ফল',
      body: 'ফল প্রকাশ হয়েছে',
      type: 'exam',
      read: false,
      createdAt: '2026-11-24T10:00:00.000Z',
    })
    expect(n?.id).toBe('n1')
    expect(n?.type).toBe('exam')
    expect(n?.read).toBe(false)
  })

  it('rejects docs without userId or title', () => {
    expect(notificationFromDoc('n1', { title: 'x' })).toBeNull()
    expect(notificationFromDoc('n1', { userId: 'u1' })).toBeNull()
  })

  it('falls back to system type for unknown types', () => {
    const n = notificationFromDoc('n1', { userId: 'u1', title: 'x', type: 'mystery' })
    expect(n?.type).toBe('system')
  })
})

describe('unreadCount', () => {
  it('counts only unread notifications', () => {
    const list = buildDemoNotifications()
    expect(unreadCount(list)).toBe(2)
    expect(unreadCount(list.map((n) => ({ ...n, read: true })))).toBe(0)
  })
})

describe('sortNotifications', () => {
  it('sorts newest first', () => {
    const list = buildDemoNotifications()
    const sorted = sortNotifications([...list].reverse())
    expect(sorted[0].id).toBe('demo-n1')
    expect(sorted[sorted.length - 1].id).toBe('demo-n3')
  })
})

describe('createdAtMillis', () => {
  it('parses ISO strings and numbers, returns 0 for unknown', () => {
    expect(createdAtMillis('2026-11-24T10:00:00.000Z')).toBe(Date.parse('2026-11-24T10:00:00.000Z'))
    expect(createdAtMillis(12345)).toBe(12345)
    expect(createdAtMillis(null)).toBe(0)
    expect(createdAtMillis('not-a-date')).toBe(0)
  })
})

describe('notificationTypeLabel', () => {
  it('labels known types in Bengali and passes unknown through', () => {
    expect(notificationTypeLabel('exam')).toBe('পরীক্ষা')
    expect(notificationTypeLabel('support')).toBe('সাপোর্ট')
    expect(notificationTypeLabel('weird')).toBe('weird')
  })
})

describe('buildDemoNotifications', () => {
  it('builds labelled sample notifications with real links', () => {
    const list = buildDemoNotifications()
    expect(list.length).toBe(3)
    for (const n of list) {
      expect(n.title.length).toBeGreaterThan(0)
      expect(n.link?.startsWith('/')).toBe(true)
    }
  })
})
