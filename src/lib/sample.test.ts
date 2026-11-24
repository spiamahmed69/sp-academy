import { describe, expect, it } from 'vitest'
import { discountPercent, formatBDT, toBanglaDigits } from './format'
import { blogPosts, books, categories, courses, teachers } from '../data/sample'

describe('format helpers', () => {
  it('formats BDT prices', () => {
    expect(formatBDT(1499)).toBe('৳1,499')
    expect(formatBDT(0)).toBe('৳0')
  })

  it('computes discount percent', () => {
    expect(discountPercent(2500, 1499)).toBe(40)
    expect(discountPercent(1000)).toBe(0)
    expect(discountPercent(1000, 1000)).toBe(0)
  })

  it('converts digits to Bangla', () => {
    expect(toBanglaDigits(2026)).toBe('২০২৬')
  })
})

describe('sample data integrity (Phase 1)', () => {
  it('every course has a unique slug and a valid teacher + category', () => {
    const slugs = new Set(courses.map((c) => c.slug))
    expect(slugs.size).toBe(courses.length)
    for (const c of courses) {
      expect(categories.some((cat) => cat.id === c.categoryId)).toBe(true)
      expect(teachers.some((t) => t.id === c.instructorId)).toBe(true)
      expect(c.lessons).toBeGreaterThan(0)
      expect(c.price).toBeGreaterThanOrEqual(0)
      if (c.discountPrice) expect(c.discountPrice).toBeLessThan(c.price)
    }
  })

  it('every book has a positive price and known stock', () => {
    for (const b of books) {
      expect(b.price).toBeGreaterThan(0)
      expect(b.stock).toBeGreaterThanOrEqual(0)
    }
  })

  it('blog slugs are unique', () => {
    const slugs = new Set(blogPosts.map((b) => b.slug))
    expect(slugs.size).toBe(blogPosts.length)
  })
})
