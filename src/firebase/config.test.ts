import { describe, expect, it } from 'vitest'
import { getFirebase, isFirebaseConfigured } from './config'

describe('firebase config (Phase 2)', () => {
  it('is not configured without VITE_FIREBASE_* env vars', () => {
    // No .env.local is loaded in tests and no vars are set here, so the app
    // must report demo mode instead of initialising Firebase with blanks.
    expect(isFirebaseConfigured).toBe(false)
  })

  it('getFirebase returns null when not configured (never throws)', () => {
    expect(getFirebase()).toBeNull()
  })
})
