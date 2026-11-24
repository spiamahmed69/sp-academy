import { describe, expect, it } from 'vitest'
import {
  addCartItem,
  cartTotals,
  hasBookItem,
  hasCourseItem,
  isValidBdPhone,
  parseCart,
  removeCartItem,
  setCartItemQuantity,
  type CartItem,
} from './cart'

function book(overrides: Partial<CartItem> = {}): CartItem {
  return { kind: 'book', refId: 'b1', title: 'বই', unitPrice: 350, quantity: 1, ...overrides }
}
function course(overrides: Partial<CartItem> = {}): CartItem {
  return { kind: 'course', refId: 'c1', title: 'কোর্স', unitPrice: 1499, quantity: 1, ...overrides }
}

describe('cartTotals', () => {
  it('charges ৳60 delivery on small book orders, free at ৳1000+', () => {
    expect(cartTotals([book()])).toEqual({ subtotal: 350, booksSubtotal: 350, deliveryFee: 60, total: 410, itemCount: 1 })
    expect(cartTotals([book({ unitPrice: 1000 })])).toEqual({ subtotal: 1000, booksSubtotal: 1000, deliveryFee: 0, total: 1000, itemCount: 1 })
    expect(cartTotals([book({ unitPrice: 999 })])).toEqual({ subtotal: 999, booksSubtotal: 999, deliveryFee: 60, total: 1059, itemCount: 1 })
  })

  it('charges no delivery on course-only orders', () => {
    expect(cartTotals([course()])).toEqual({ subtotal: 1499, booksSubtotal: 0, deliveryFee: 0, total: 1499, itemCount: 1 })
  })

  it('sums quantities and mixes books + courses', () => {
    const totals = cartTotals([book({ quantity: 2 }), course()])
    expect(totals).toEqual({ subtotal: 2199, booksSubtotal: 700, deliveryFee: 60, total: 2259, itemCount: 3 })
  })

  it('empty cart totals zero', () => {
    expect(cartTotals([])).toEqual({ subtotal: 0, booksSubtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 })
  })
})

describe('addCartItem / removeCartItem / setCartItemQuantity', () => {
  it('adds a new item and merges duplicate books', () => {
    const items = addCartItem(addCartItem([], book()), book({ quantity: 2 }))
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(3)
  })

  it('keeps at most one copy of a course', () => {
    const items = addCartItem(addCartItem([], course()), course())
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
  })

  it('rejects items with a bad price or quantity', () => {
    expect(addCartItem([], book({ unitPrice: -1 }))).toHaveLength(0)
    expect(addCartItem([], book({ quantity: 0 }))).toHaveLength(0)
  })

  it('removes items and clamps quantity to removal at zero', () => {
    const items = [book(), course()]
    expect(removeCartItem(items, 'book', 'b1')).toHaveLength(1)
    expect(setCartItemQuantity(items, 'book', 'b1', 0)).toHaveLength(1)
    expect(setCartItemQuantity(items, 'book', 'b1', 3)[0].quantity).toBe(3)
  })

  it('hasBookItem / hasCourseItem detect kinds', () => {
    expect(hasBookItem([course()])).toBe(false)
    expect(hasCourseItem([course()])).toBe(true)
    expect(hasBookItem([book()])).toBe(true)
  })
})

describe('parseCart', () => {
  it('parses a valid cart and drops malformed rows', () => {
    const parsed = parseCart(JSON.stringify([book(), { kind: 'book', refId: '', title: 'x', unitPrice: 10, quantity: 1 }, 'nope', { kind: 'course', refId: 'c9', title: 'কোর্স', unitPrice: 500, quantity: 5 }]))
    expect(parsed).toHaveLength(2)
    expect(parsed[1].quantity).toBe(1) // courses are always quantity 1
  })

  it('returns [] for garbage input', () => {
    expect(parseCart('not json')).toEqual([])
    expect(parseCart(null)).toEqual([])
    expect(parseCart('{}')).toEqual([])
  })
})

describe('isValidBdPhone', () => {
  it('accepts 11-digit Bangladeshi mobiles starting 01[3-9]', () => {
    expect(isValidBdPhone('01712345678')).toBe(true)
    expect(isValidBdPhone('013-1234-5678')).toBe(true)
    expect(isValidBdPhone('019 8765 4321')).toBe(true)
  })

  it('rejects short, landline-looking and foreign numbers', () => {
    expect(isValidBdPhone('0171234567')).toBe(false)
    expect(isValidBdPhone('01212345678')).toBe(false)
    expect(isValidBdPhone('8801712345678')).toBe(false)
    expect(isValidBdPhone('')).toBe(false)
  })
})
