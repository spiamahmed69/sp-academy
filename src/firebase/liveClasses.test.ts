import { describe, expect, it } from 'vitest'
import {
  classifyLiveClass,
  joinAvailability,
  liveClassFromDoc,
  sampleLiveClassToView,
  validateLiveClassInput,
  type LiveClassView,
} from './liveClasses'

const NOW = Date.parse('2026-11-24T10:00:00+06:00')

function view(overrides: Partial<LiveClassView> = {}): LiveClassView {
  return {
    id: 'lc1',
    title: 'ভেক্টর লাইভ ক্লাস',
    description: '',
    teacherId: 't1',
    teacherName: 'আরিফ হোসেন',
    courseId: null,
    courseTitle: '',
    subject: 'পদার্থবিজ্ঞান',
    startsAt: '2026-11-25T19:00:00+06:00',
    durationMin: 90,
    joinUrl: null,
    recordingUrl: null,
    status: 'scheduled',
    enrolledCount: null,
    source: 'firestore',
    ...overrides,
  }
}

describe('classifyLiveClass', () => {
  it('upcoming before start, live during, ended after', () => {
    const cls = view()
    expect(classifyLiveClass(cls, NOW)).toBe('upcoming')
    expect(classifyLiveClass(cls, Date.parse('2026-11-25T19:30:00+06:00'))).toBe('live')
    expect(classifyLiveClass(cls, Date.parse('2026-11-25T20:31:00+06:00'))).toBe('ended')
  })

  it('stored cancelled / ended status wins over time', () => {
    expect(classifyLiveClass(view({ status: 'cancelled' }), NOW)).toBe('cancelled')
    expect(classifyLiveClass(view({ status: 'ended' }), NOW)).toBe('ended')
    // A stored 'live' status does not resurrect a long-finished class.
    expect(classifyLiveClass(view({ status: 'live' }), Date.parse('2026-11-26T10:00:00+06:00'))).toBe('ended')
  })
})

describe('joinAvailability', () => {
  it('shows a real link only when joinUrl exists', () => {
    expect(joinAvailability(view({ joinUrl: 'https://meet.example.com/abc' }), NOW)).toEqual({ available: true })
  })

  it('without a link, says the link appears before start time', () => {
    const state = joinAvailability(view(), NOW)
    expect(state.available).toBe(false)
    if (!state.available) expect(state.message).toMatch('শুরুর আগে')
  })

  it('live without a link says so plainly, ended/cancelled never join', () => {
    const liveNoLink = joinAvailability(view({ startsAt: '2026-11-24T09:30:00+06:00' }), NOW)
    expect(liveNoLink.available).toBe(false)
    expect(joinAvailability(view({ status: 'cancelled' }), NOW).available).toBe(false)
    expect(joinAvailability(view({ status: 'ended' }), NOW).available).toBe(false)
  })
})

describe('validateLiveClassInput', () => {
  const valid = {
    title: 'ভেক্টর লাইভ ক্লাস',
    subject: 'পদার্থবিজ্ঞান',
    startsAt: '2026-11-25T19:00:00+06:00',
    durationMin: 90,
    joinUrl: '',
  }

  it('accepts a valid future class', () => {
    expect(validateLiveClassInput(valid, NOW)).toEqual([])
  })

  it('rejects missing title/subject, past start, bad duration and non-https links', () => {
    expect(validateLiveClassInput({ ...valid, title: '  ' }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, subject: '' }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, startsAt: '2026-11-24T09:00:00+06:00' }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, startsAt: 'not-a-date' }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, durationMin: 3 }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, durationMin: 600 }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, joinUrl: 'http://meet.example.com/x' }, NOW)).toHaveLength(1)
    expect(validateLiveClassInput({ ...valid, joinUrl: 'https://meet.example.com/x' }, NOW)).toEqual([])
  })
})

describe('liveClassFromDoc', () => {
  it('parses a valid doc and skips malformed ones', () => {
    const parsed = liveClassFromDoc('lc1', {
      title: 'ভেক্টর লাইভ ক্লাস',
      teacherId: 't1',
      startsAt: '2026-11-25T19:00:00+06:00',
      durationMin: 90,
      status: 'scheduled',
    })
    expect(parsed?.title).toBe('ভেক্টর লাইভ ক্লাস')
    expect(parsed?.joinUrl).toBeNull()
    expect(liveClassFromDoc('lc2', { teacherId: 't1', startsAt: '2026-11-25T19:00:00+06:00' })).toBeNull()
    expect(liveClassFromDoc('lc3', { title: 'x', teacherId: 't1', startsAt: 'garbage' })).toBeNull()
  })
})

describe('sampleLiveClassToView', () => {
  it('keeps the sample count and marks the source as sample', () => {
    const v = sampleLiveClassToView(
      { id: 'l1', title: 'ভেক্টর', teacherId: 't1', subject: 'পদার্থবিজ্ঞান', startsAt: '2026-12-02T19:00:00+06:00', durationMin: 90, enrolled: 1240, isRecorded: false },
      'আরিফ হোসেন',
    )
    expect(v.enrolledCount).toBe(1240)
    expect(v.source).toBe('sample')
    expect(v.joinUrl).toBeNull()
  })
})
