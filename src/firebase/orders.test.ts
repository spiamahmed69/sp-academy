import { describe, expect, it } from 'vitest'
import {
  buildOrderDoc,
  isOnlinePaymentMethod,
  makeOrderNo,
  orderFromDoc,
  orderStatusLabel,
  parseDemoOrders,
  paymentMethodLabel,
  paymentStatusLabel,
  priceOrderItems,
  validateCheckout,
  type CheckoutInput,
} from './orders'

function checkout(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    items: [{ kind: 'book', refId: 'b1', title: 'এইচএসসি পদার্থবিজ্ঞান গাইড', unitPrice: 350, quantity: 1 }],
    paymentMethod: 'cod',
    customer: { name: 'রাফি', phone: '01712345678', address: 'ঢাকা', district: 'ঢাকা' },
    ...overrides,
  }
}

describe('payment labels', () => {
  it('labels methods and statuses in Bengali', () => {
    expect(paymentMethodLabel('bkash')).toBe('বিকাশ')
    expect(paymentMethodLabel('cod')).toContain('ক্যাশ অন ডেলিভারি')
    expect(paymentStatusLabel('pending_verification')).toContain('যাচাইয়ের অপেক্ষায়')
    expect(paymentStatusLabel('cod_due')).toContain('ডেলিভারিতে')
    expect(orderStatusLabel('shipped')).toBe('পাঠানো হয়েছে')
  })

  it('marks bKash/Nagad/card as online, COD as offline', () => {
    expect(isOnlinePaymentMethod('bkash')).toBe(true)
    expect(isOnlinePaymentMethod('nagad')).toBe(true)
    expect(isOnlinePaymentMethod('card')).toBe(true)
    expect(isOnlinePaymentMethod('cod')).toBe(false)
  })
})

describe('makeOrderNo', () => {
  it('produces an SP- reference (our own order number, never a payment txn id)', () => {
    expect(makeOrderNo(1795526400000)).toMatch(/^SP-[0-9A-Z]+$/)
  })
})

describe('validateCheckout', () => {
  it('accepts a valid COD book order', () => {
    expect(validateCheckout(checkout())).toEqual([])
  })

  it('rejects an empty cart, missing name, bad phone and missing address', () => {
    expect(validateCheckout(checkout({ items: [] }))).toContain('কার্ট খালি — প্রথমে কিছু যোগ করুন।')
    expect(validateCheckout(checkout({ customer: { name: '', phone: '01712345678', address: 'ঢাকা', district: 'ঢাকা' } }))).toContain('নাম দিতে হবে।')
    expect(validateCheckout(checkout({ customer: { name: 'রাফি', phone: '12345', address: 'ঢাকা', district: 'ঢাকা' } }))).toContain('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)।')
    expect(validateCheckout(checkout({ customer: { name: 'রাফি', phone: '01712345678', address: '', district: 'ঢাকা' } }))).toContain('ডেলিভারির ঠিকানা দিতে হবে।')
  })

  it('rejects COD for course orders — digital courses cannot be paid on delivery', () => {
    const input = checkout({
      items: [{ kind: 'course', refId: 'c1', title: 'কোর্স', unitPrice: 1499, quantity: 1 }],
      paymentMethod: 'cod',
    })
    expect(validateCheckout(input)).toContain('কোর্সের জন্য ক্যাশ অন ডেলিভারি প্রযোজ্য নয় — অনলাইন পেমেন্ট বেছে নিন।')
  })

  it('accepts online payment for course orders', () => {
    const input = checkout({
      items: [{ kind: 'course', refId: 'c1', title: 'কোর্স', unitPrice: 1499, quantity: 1 }],
      paymentMethod: 'bkash',
      customer: { name: 'রাফি', phone: '01712345678', address: '', district: '' },
    })
    expect(validateCheckout(input)).toEqual([])
  })

  it('requires a delivery address for book orders even with online payment', () => {
    const input = checkout({
      paymentMethod: 'bkash',
      customer: { name: 'রাফি', phone: '01712345678', address: '', district: '' },
    })
    expect(validateCheckout(input)).toContain('ডেলিভারির ঠিকানা দিতে হবে।')
    expect(validateCheckout(input)).toContain('জেলা দিতে হবে।')
    const withAddress = checkout({
      paymentMethod: 'bkash',
      customer: { name: 'রাফি', phone: '01712345678', address: 'ঢাকা', district: 'ঢাকা' },
    })
    expect(validateCheckout(withAddress)).toEqual([])
  })
})

describe('buildOrderDoc', () => {
  it('never marks an order paid — online is pending_verification, COD is cod_due', async () => {
    const priced = await priceOrderItems(checkout().items)
    expect(priced.errors).toEqual([])
    const cod = buildOrderDoc('u1', checkout(), priced.priced, priced)
    expect(cod.paymentStatus).toBe('cod_due')
    expect(cod.orderStatus).toBe('pending')
    expect(cod.total).toBe(410) // 350 + ৳60 delivery
    const online = buildOrderDoc('u1', checkout({ paymentMethod: 'bkash' }), priced.priced, priced)
    expect(online.paymentStatus).toBe('pending_verification')
  })
})

describe('priceOrderItems', () => {
  it('re-prices from the catalogue (never trusts cart prices) and adds delivery', async () => {
    // Cart claims ৳10 — the catalogue price (৳350) must win.
    const priced = await priceOrderItems([{ kind: 'book', refId: 'b1', title: 'বই', unitPrice: 10, quantity: 1 }])
    expect(priced.errors).toEqual([])
    expect(priced.priced[0].unitPrice).toBe(350)
    expect(priced.total).toBe(410)
  })

  it('rejects out-of-stock books and unknown refs', async () => {
    const outOfStock = await priceOrderItems([{ kind: 'book', refId: 'b4', title: 'বিসিএস প্রিলি মডেল টেস্ট', unitPrice: 320, quantity: 1 }])
    expect(outOfStock.errors.length).toBeGreaterThan(0)
    const unknown = await priceOrderItems([{ kind: 'book', refId: 'nope', title: 'নেই', unitPrice: 100, quantity: 1 }])
    expect(unknown.errors.length).toBeGreaterThan(0)
  })

  it('rejects a free course in the cart — it needs no payment', async () => {
    const free = await priceOrderItems([{ kind: 'course', refId: 'c7', title: 'ফ্রি কোর্স', unitPrice: 0, quantity: 1 }])
    expect(free.errors.length).toBeGreaterThan(0)
  })

  it('prices a paid course with no delivery fee', async () => {
    const priced = await priceOrderItems([{ kind: 'course', refId: 'c1', title: 'এইচএসসি পদার্থবিজ্ঞান ১ম পত্র', unitPrice: 999, quantity: 1 }])
    expect(priced.errors).toEqual([])
    expect(priced.priced[0].unitPrice).toBe(1499)
    expect(priced.deliveryFee).toBe(0)
    expect(priced.total).toBe(1499)
  })
})

describe('orderFromDoc / parseDemoOrders', () => {
  it('parses a Firestore order doc and skips malformed ones', () => {
    const view = orderFromDoc('o1', {
      orderNo: 'SP-ABC',
      userId: 'u1',
      items: [{ kind: 'book', refId: 'b1', title: 'বই', unitPrice: 350, quantity: 2 }],
      subtotal: 700,
      deliveryFee: 60,
      total: 760,
      paymentMethod: 'cod',
      paymentStatus: 'cod_due',
      orderStatus: 'confirmed',
      customer: { name: 'রাফি', phone: '01712345678', address: 'ঢাকা', district: 'ঢাকা' },
    })
    expect(view?.orderNo).toBe('SP-ABC')
    expect(view?.source).toBe('firestore')
    expect(orderFromDoc('o2', { paymentMethod: 'nope', items: [] })).toBeNull()
    expect(orderFromDoc('o3', { paymentMethod: 'cod', items: [] })).toBeNull()
  })

  it('parses demo orders and ignores garbage', () => {
    expect(parseDemoOrders('not json')).toEqual([])
    expect(parseDemoOrders(null)).toEqual([])
    const parsed = parseDemoOrders(
      JSON.stringify([
        {
          id: 'demo-1',
          orderNo: 'SP-X',
          userId: 'demo',
          items: [{ kind: 'book', refId: 'b1', title: 'বই', unitPrice: 350, quantity: 1 }],
          subtotal: 350,
          deliveryFee: 60,
          total: 410,
          paymentMethod: 'bkash',
          paymentStatus: 'pending_verification',
          orderStatus: 'pending',
          customer: { name: 'রাফি', phone: '01712345678', address: '', district: '' },
        },
      ]),
    )
    expect(parsed).toHaveLength(1)
    expect(parsed[0].source).toBe('sample')
  })
})
