/**
 * Firebase configuration — Phase 2.
 *
 * Values come ONLY from Vite env vars (`.env.local`, never committed).
 * No Firebase project exists yet for SP Academy, so by default this module
 * reports "not configured" and the app runs in honest demo mode: auth pages
 * say so clearly and never fake a successful login.
 *
 * See docs/firebase-setup.md for the exact console steps.
 */
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export interface FirebaseEnv {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function readEnv(): FirebaseEnv | null {
  const env = import.meta.env
  const apiKey = (env.VITE_FIREBASE_API_KEY ?? '').trim()
  const authDomain = (env.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim()
  const projectId = (env.VITE_FIREBASE_PROJECT_ID ?? '').trim()
  const storageBucket = (env.VITE_FIREBASE_STORAGE_BUCKET ?? '').trim()
  const messagingSenderId = (env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '').trim()
  const appId = (env.VITE_FIREBASE_APP_ID ?? '').trim()
  if (!apiKey || !authDomain || !projectId || !appId) return null
  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
}

/** True only when every required VITE_FIREBASE_* variable is present. */
export const firebaseEnv: FirebaseEnv | null = readEnv()
export const isFirebaseConfigured = firebaseEnv !== null

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

let services: FirebaseServices | null = null

/**
 * Lazily initialise Firebase on first use. Returns null (without throwing)
 * when Firebase is not configured, so the UI can show the honest
 * "not configured yet" state instead of crashing.
 */
export function getFirebase(): FirebaseServices | null {
  if (!firebaseEnv) return null
  if (services) return services
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseEnv)
  services = { app, auth: getAuth(app), db: getFirestore(app) }
  return services
}

/** Short Bengali message for common Firebase Auth error codes. */
export function firebaseAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।'
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন।'
    case 'auth/weak-password':
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
    case 'auth/invalid-email':
      return 'সঠিক ইমেইল ঠিকানা দিন।'
    case 'auth/too-many-requests':
      return 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।'
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। সংযোগ যাচাই করে আবার চেষ্টা করুন।'
    case 'auth/popup-closed-by-user':
      return 'Google লগইন বাতিল করা হয়েছে।'
    case 'auth/account-exists-with-different-credential':
      return 'এই ইমেইল অন্য পদ্ধতিতে রেজিস্টার করা আছে। সেই পদ্ধতিতে লগইন করুন।'
    default:
      return 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।'
  }
}

export const NOT_CONFIGURED_MESSAGE =
  'Firebase এখনো কনফিগার করা হয়নি — আসল লগইন/রেজিস্ট্রেশন চালু হয়নি। সেটআপের নির্দেশনা docs/firebase-setup.md-এ আছে।'
