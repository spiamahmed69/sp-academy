/**
 * Auth context — Phase 2.
 *
 * Wraps Firebase Auth (email/password, Google, password reset) with an honest
 * demo mode: when Firebase is not configured (no VITE_FIREBASE_* env vars),
 * every auth action fails with a clear Bengali message instead of faking a
 * login. When configured, auth is real — state comes from onAuthStateChanged
 * and the role from the Firestore users/{uid} doc (falling back to the
 * custom-claim role when a backend has set one).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getFirebase, isFirebaseConfigured, NOT_CONFIGURED_MESSAGE, firebaseAuthErrorMessage } from '../firebase/config'
import { createUserProfile, getUserProfile, type UserProfile } from '../firebase/profiles'
import { normalizeRole, type Role } from '../lib/roles'

export interface AuthState {
  user: FirebaseUser | null
  profile: UserProfile | null
  role: Role | null
  loading: boolean
  configured: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>
  loginWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function toError(err: unknown): Error {
  if (err instanceof Error && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return new Error(firebaseAuthErrorMessage((err as { code: string }).code))
  }
  return err instanceof Error ? err : new Error('কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।')
}

function requireServices() {
  const services = getFirebase()
  if (!services) throw new Error(NOT_CONFIGURED_MESSAGE)
  return services
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const services = getFirebase()
    if (!services) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(services.auth, async (fbUser) => {
      setUser(fbUser)
      if (!fbUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        const doc = await getUserProfile(services.db, fbUser.uid)
        if (doc) {
          setProfile(doc)
        } else {
          // Auth user without a profile doc (e.g. created in console): build a
          // local read-only view; do not invent a role — default student.
          setProfile({
            uid: fbUser.uid,
            email: fbUser.email ?? '',
            displayName: fbUser.displayName ?? '',
            phone: fbUser.phoneNumber ?? '',
            role: 'student',
            photoURL: fbUser.photoURL,
            createdAt: null,
            updatedAt: null,
          })
        }
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { auth } = requireServices()
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      throw toError(err)
    }
  }, [])

  const register = useCallback(async (input: { name: string; email: string; phone: string; password: string }) => {
    const { auth, db } = requireServices()
    try {
      const cred = await createUserWithEmailAndPassword(auth, input.email, input.password)
      await updateProfile(cred.user, { displayName: input.name })
      const created = await createUserProfile(db, {
        uid: cred.user.uid,
        email: input.email,
        displayName: input.name,
        phone: input.phone,
      })
      setProfile(created)
    } catch (err) {
      throw toError(err)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const { auth, db } = requireServices()
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      const existing = await getUserProfile(db, cred.user.uid)
      if (!existing) {
        const created = await createUserProfile(db, {
          uid: cred.user.uid,
          email: cred.user.email ?? '',
          displayName: cred.user.displayName ?? '',
          phone: cred.user.phoneNumber ?? '',
        })
        setProfile(created)
      }
    } catch (err) {
      throw toError(err)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { auth } = requireServices()
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      throw toError(err)
    }
  }, [])

  const logout = useCallback(async () => {
    const { auth } = requireServices()
    await signOut(auth)
    setProfile(null)
  }, [])

  const role: Role | null = profile ? normalizeRole(profile.role) : user ? 'student' : null

  const value = useMemo<AuthState>(
    () => ({ user, profile, role, loading, configured: isFirebaseConfigured, login, register, loginWithGoogle, resetPassword, logout }),
    [user, profile, role, loading, login, register, loginWithGoogle, resetPassword, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
