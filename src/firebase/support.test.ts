import { describe, expect, it } from 'vitest'
import {
  openTicketCount,
  sortTickets,
  ticketFromDoc,
  ticketSchema,
  ticketStatusLabel,
  type SupportTicket,
} from './support'

function makeTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: 't1',
    userId: 'u1',
    userName: 'পরীক্ষার্থী',
    userEmail: 'a@b.com',
    subject: 'কোর্সে ভর্তি হচ্ছে না',
    category: 'course',
    message: 'ভর্তি বোতামে ক্লিক করলে কিছু হয় না।',
    status: 'open',
    replies: [],
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
    ...overrides,
  }
}

describe('ticketSchema', () => {
  it('accepts a valid ticket', () => {
    expect(ticketSchema.safeParse({ subject: 'ভর্তি সমস্যা', category: 'course', message: 'ভর্তি হতে পারছি না, সাহায্য দরকার।' }).success).toBe(true)
  })

  it('rejects a too-short subject and message', () => {
    expect(ticketSchema.safeParse({ subject: 'হাই', category: 'course', message: 'সাহায্য চাই।' }).success).toBe(false)
    expect(ticketSchema.safeParse({ subject: 'ভর্তি সমস্যা', category: 'course', message: 'ছোট' }).success).toBe(false)
  })

  it('rejects an unknown category', () => {
    expect(ticketSchema.safeParse({ subject: 'ভর্তি সমস্যা', category: 'mystery', message: 'ভর্তি হতে পারছি না, সাহায্য দরকার।' }).success).toBe(false)
  })

  it('trims whitespace before validating', () => {
    const r = ticketSchema.safeParse({ subject: '  ভর্তি সমস্যা  ', category: 'general', message: '  দীর্ঘ বার্তা লিখছি এখানে।  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.subject).toBe('ভর্তি সমস্যা')
  })
})

describe('ticketFromDoc', () => {
  it('parses a valid doc and keeps replies', () => {
    const t = ticketFromDoc('t1', {
      userId: 'u1',
      userName: 'রহিম',
      userEmail: 'r@x.com',
      subject: 'পেমেন্ট সমস্যা',
      category: 'payment',
      message: 'বিকাশে টাকা কেটেছে।',
      status: 'in_progress',
      replies: [{ by: 'অ্যাডমিন', byRole: 'admin', message: 'যাচাই করছি।', createdAt: '2026-11-24T11:00:00.000Z' }],
      createdAt: '2026-11-24T10:00:00.000Z',
    })
    expect(t?.status).toBe('in_progress')
    expect(t?.replies).toHaveLength(1)
    expect(t?.replies[0].message).toBe('যাচাই করছি।')
  })

  it('rejects docs without userId or subject', () => {
    expect(ticketFromDoc('t1', { subject: 'x' })).toBeNull()
    expect(ticketFromDoc('t1', { userId: 'u1' })).toBeNull()
  })

  it('falls back to open + general for bad status/category', () => {
    const t = ticketFromDoc('t1', { userId: 'u1', subject: 'x', status: 'weird', category: 'weird' })
    expect(t?.status).toBe('open')
    expect(t?.category).toBe('general')
  })

  it('drops empty replies', () => {
    const t = ticketFromDoc('t1', {
      userId: 'u1',
      subject: 'x',
      replies: [{ by: 'a', byRole: 'admin', message: '' }, { by: 'a', byRole: 'admin', message: 'উত্তর' }],
    })
    expect(t?.replies).toHaveLength(1)
  })
})

describe('sortTickets / openTicketCount', () => {
  it('sorts newest first and counts open tickets', () => {
    const list = [
      makeTicket({ id: 'old', createdAt: '2026-11-20T10:00:00.000Z', status: 'resolved' }),
      makeTicket({ id: 'new', createdAt: '2026-11-24T10:00:00.000Z', status: 'open' }),
      makeTicket({ id: 'mid', createdAt: '2026-11-22T10:00:00.000Z', status: 'in_progress' }),
    ]
    expect(sortTickets(list)[0].id).toBe('new')
    expect(openTicketCount(list)).toBe(2)
  })
})

describe('ticketStatusLabel', () => {
  it('labels known statuses in Bengali', () => {
    expect(ticketStatusLabel('resolved')).toBe('সমাধান হয়েছে')
    expect(ticketStatusLabel('closed')).toBe('বন্ধ')
  })
})
