import { describe, expect, it } from 'vitest'
import { isWishlisted, readWishlist, toggleWishlist } from './wishlist'

// Vitest runs in a node environment (no localStorage) — stub a minimal one.
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => {
      store.clear()
    },
  },
  configurable: true,
})

describe('wishlist (localStorage)', () => {
  it('toggles a course id in and out', () => {
    localStorage.clear()
    expect(isWishlisted('c1')).toBe(false)
    expect(toggleWishlist('c1')).toBe(true)
    expect(isWishlisted('c1')).toBe(true)
    expect(readWishlist()).toEqual(['c1'])
    expect(toggleWishlist('c1')).toBe(false)
    expect(isWishlisted('c1')).toBe(false)
    expect(readWishlist()).toEqual([])
  })

  it('keeps multiple ids and ignores corrupt stored data', () => {
    localStorage.clear()
    toggleWishlist('c1')
    toggleWishlist('c2')
    expect(readWishlist()).toEqual(['c1', 'c2'])
    localStorage.setItem('sp-academy:wishlist:v1', 'not-json')
    expect(readWishlist()).toEqual([])
    expect(isWishlisted('c1')).toBe(false)
  })
})
