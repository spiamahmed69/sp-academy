import { describe, expect, it } from 'vitest'
import { bookFromDoc, bookSellingPrice, bookToDoc, sampleBookToView } from './books'
import { books } from '../data/sample'

describe('bookFromDoc', () => {
  it('parses a full Firestore book doc', () => {
    const view = bookFromDoc('b1', {
      title: 'পরীক্ষার বই',
      author: 'লেখক',
      publisher: 'প্রকাশনী',
      category: 'এইচএসসি',
      price: 450,
      discountPrice: 350,
      rating: 4.8,
      reviewsCount: 12,
      stock: 5,
      pages: 320,
      description: 'বর্ণনা',
      coverImageUrl: 'https://i.ibb.co/x.png',
      gradient: 'blue',
      status: 'published',
    })
    expect(view).not.toBeNull()
    expect(view?.title).toBe('পরীক্ষার বই')
    expect(view?.discountPrice).toBe(350)
    expect(view?.coverImageUrl).toBe('https://i.ibb.co/x.png')
    expect(view?.source).toBe('firestore')
  })

  it('rejects docs without a title or with a negative price', () => {
    expect(bookFromDoc('x', { price: 100 })).toBeNull()
    expect(bookFromDoc('x', { title: 'বই', price: -5 })).toBeNull()
  })

  it('drops an invalid discount and clamps stock at zero', () => {
    const view = bookFromDoc('x', { title: 'বই', price: 300, discountPrice: 400, stock: -2 })
    expect(view?.discountPrice).toBeUndefined()
    expect(view?.stock).toBe(0)
  })

  it('defaults missing fields safely', () => {
    const view = bookFromDoc('x', { title: 'বই', price: 200 })
    expect(view?.author).toBe('অজানা লেখক')
    expect(view?.coverImageUrl).toBeNull()
    expect(view?.gradient).toBe('blue')
    expect(view?.status).toBe('published')
  })
})

describe('bookSellingPrice', () => {
  it('prefers a valid discount, falls back to price otherwise', () => {
    expect(bookSellingPrice({ price: 450, discountPrice: 350 })).toBe(350)
    expect(bookSellingPrice({ price: 450, discountPrice: 500 })).toBe(450)
    expect(bookSellingPrice({ price: 450 })).toBe(450)
  })
})

describe('bookToDoc / sampleBookToView', () => {
  it('round-trips a sample book into a Firestore doc without a cover URL', () => {
    const doc = bookToDoc(books[0])
    expect(doc.title).toBe(books[0].title)
    expect(doc.coverImageUrl).toBeNull()
    expect(doc.status).toBe('published')
  })

  it('labels sample books as sample', () => {
    const view = sampleBookToView(books[0])
    expect(view.source).toBe('sample')
    expect(view.coverImageUrl).toBeNull()
  })
})
