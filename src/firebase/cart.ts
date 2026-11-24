/**
 * Firestore cart sync — Phase 8.
 *
 * Collection: carts/{uid} — { items: CartItem[], updatedAt }.
 * The cart's source of truth is this browser's localStorage (see
 * src/lib/cart.ts); this module only mirrors it to Firestore when the
 * user is signed in, so the cart survives a device change. Prices in the
 * cart are never trusted — the order service re-derives them from the
 * catalogue at checkout, and the backend re-validates them in Phase 10.
 */
import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import { parseCart, type CartItem } from '../lib/cart'

export interface CartDoc {
  items: CartItem[]
  updatedAt: unknown
}

/** Read the signed-in user's synced cart (empty when none exists). */
export async function fetchCartDoc(db: Firestore, uid: string): Promise<CartItem[]> {
  const snap = await getDoc(doc(db, 'carts', uid))
  if (!snap.exists()) return []
  const data = snap.data()
  if (!Array.isArray(data.items)) return []
  return parseCart(JSON.stringify(data.items))
}

/** Overwrite the signed-in user's synced cart. Fire-and-forget from the UI. */
export async function saveCartDoc(db: Firestore, uid: string, items: CartItem[]): Promise<void> {
  await setDoc(
    doc(db, 'carts', uid),
    { items, updatedAt: serverTimestamp() },
    { merge: true },
  )
}
