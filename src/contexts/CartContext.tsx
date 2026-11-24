/**
 * Cart context — Phase 8.
 *
 * Cart state lives here so the header badge, book/course pages, cart page
 * and checkout all see the same cart. Persistence: localStorage always;
 * when Firebase is configured and the user is signed in, the cart is
 * also mirrored to Firestore `carts/{uid}` (and loaded from there once
 * when this browser's cart is empty).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  addCartItem,
  cartTotals,
  readCartFromStorage,
  removeCartItem,
  setCartItemQuantity,
  writeCartToStorage,
  type CartItem,
  type CartItemKind,
  type CartTotals,
} from '../lib/cart'
import { fetchCartDoc, saveCartDoc } from '../firebase/cart'
import { getFirebase } from '../firebase/config'
import { useAuth } from './AuthContext'

export interface CartState {
  items: CartItem[]
  totals: CartTotals
  count: number
  addItem: (item: CartItem) => void
  removeItem: (kind: CartItemKind, refId: string) => void
  setQuantity: (kind: CartItemKind, refId: string, quantity: number) => void
  clearCart: () => void
  hasItem: (kind: CartItemKind, refId: string) => boolean
}

const CartContext = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth()
  const [items, setItems] = useState<CartItem[]>(() => readCartFromStorage())
  const syncedForUid = useRef<string | null>(null)

  // Persist locally on every change; mirror to Firestore when signed in.
  useEffect(() => {
    writeCartToStorage(items)
    if (!configured || !user) return
    const fb = getFirebase()
    if (!fb) return
    void saveCartDoc(fb.db, user.uid, items).catch(() => {
      // Sync failure must never break the cart — localStorage is the fallback.
    })
  }, [items, configured, user])

  // Once per sign-in: if this browser's cart is empty, pull the synced one.
  useEffect(() => {
    if (!configured || !user || syncedForUid.current === user.uid) return
    syncedForUid.current = user.uid
    const fb = getFirebase()
    if (!fb) return
    void fetchCartDoc(fb.db, user.uid)
      .then((remote) => {
        setItems((current) => (current.length === 0 && remote.length > 0 ? remote : current))
      })
      .catch(() => undefined)
  }, [configured, user])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => addCartItem(prev, item))
  }, [])

  const removeItem = useCallback((kind: CartItemKind, refId: string) => {
    setItems((prev) => removeCartItem(prev, kind, refId))
  }, [])

  const setQuantity = useCallback((kind: CartItemKind, refId: string, quantity: number) => {
    setItems((prev) => setCartItemQuantity(prev, kind, refId, quantity))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const hasItem = useCallback(
    (kind: CartItemKind, refId: string) => items.some((it) => it.kind === kind && it.refId === refId),
    [items],
  )

  const value = useMemo<CartState>(() => {
    const totals = cartTotals(items)
    return { items, totals, count: totals.itemCount, addItem, removeItem, setQuantity, clearCart, hasItem }
  }, [items, addItem, removeItem, setQuantity, clearCart, hasItem])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>.')
  return ctx
}
