/**
 * Wishlist — stored in this browser's localStorage only.
 *
 * There is no server-side wishlist yet, so the list lives in the browser
 * and is honestly labelled as such in the UI ("এই ব্রাউজারে সংরক্ষিত").
 * Course ids are the catalogue ids from src/data/sample.ts (or Firestore
 * course ids when configured — the toggle works with either).
 */
const KEY = 'sp-academy:wishlist:v1'

function readRaw(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function readWishlist(): string[] {
  return readRaw()
}

export function isWishlisted(courseId: string): boolean {
  return readRaw().includes(courseId)
}

/** Toggle a course in the wishlist. Returns true when it is now saved. */
export function toggleWishlist(courseId: string): boolean {
  const list = readRaw()
  const idx = list.indexOf(courseId)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(courseId)
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Storage full/blocked — the in-memory toggle still applies for this page.
  }
  return idx < 0
}
