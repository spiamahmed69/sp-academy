import { describe, expect, it } from 'vitest'
import { certificateFromDoc, formatIssuedAt } from './certificates'

describe('certificateFromDoc (Phase 4)', () => {
  it('parses a valid certificate doc with defaults', () => {
    const cert = certificateFromDoc('cert1', {
      userId: 'u1',
      courseId: 'c1',
      courseTitle: 'এইচএসসি পদার্থবিজ্ঞান ১ম পত্র',
      issuedAt: '2026-11-20T00:00:00.000Z',
      grade: 'A',
    })
    expect(cert).not.toBeNull()
    expect(cert?.courseTitle).toBe('এইচএসসি পদার্থবিজ্ঞান ১ম পত্র')
    expect(cert?.grade).toBe('A')
  })

  it('falls back to a placeholder title when the title is missing', () => {
    const cert = certificateFromDoc('cert1', { userId: 'u1', courseId: 'c1' })
    expect(cert?.courseTitle).toBe('নামহীন কোর্স')
  })

  it('rejects docs without a user or course id instead of inventing one', () => {
    expect(certificateFromDoc('cert1', { courseId: 'c1' })).toBeNull()
    expect(certificateFromDoc('cert1', { userId: 'u1' })).toBeNull()
    expect(certificateFromDoc('cert1', {})).toBeNull()
  })
})

describe('formatIssuedAt (Phase 4)', () => {
  it('formats an ISO date in Bengali and shows — when unknown', () => {
    expect(formatIssuedAt('2026-11-20T00:00:00.000Z')).toContain('২০২৬')
    expect(formatIssuedAt(null)).toBe('—')
    expect(formatIssuedAt('not-a-date')).toBe('—')
  })
})
