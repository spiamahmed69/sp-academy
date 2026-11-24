/**
 * Route guards — Phase 2.
 *
 * `ProtectedRoute` requires a signed-in user (redirects to /login otherwise).
 * `RoleRoute` additionally requires one of the given roles. These are UI
 * guards only — real enforcement lives in firestore.rules + the backend.
 */
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { canAccess, ROLE_LABELS, type Role } from '../lib/roles'
import { PageHero, SkeletonCard } from './ui'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!configured) {
    return (
      <div>
        <PageHero eyebrow="অ্যাকাউন্ট" title="লগইন প্রয়োজন" subtitle="এই পেজটি দেখতে লগইন করতে হবে।" />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="card p-6 text-center">
            <p className="leading-relaxed text-[var(--color-body)]">
              Firebase এখনো কনফিগার করা হয়নি, তাই আসল লগইন চালু হয়নি। সেটআপ শেষ হলে এখানে লগইন করে ড্যাশবোর্ড
              ব্যবহার করা যাবে।
            </p>
            <Link to="/login" className="btn-primary mt-5 inline-flex">
              লগইন পেজে যান
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

export function RoleRoute({ allowed, children }: { allowed: Role[]; children: ReactNode }) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SkeletonCard />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      {canAccess(role, allowed) ? (
        <>{children}</>
      ) : (
        <div>
          <PageHero eyebrow="অনুমতি নেই" title="এই পেজটি আপনার জন্য নয়" subtitle="আপনার রোল দিয়ে এই পেজটি দেখা যাবে না।" />
          <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
            <div className="card flex flex-col items-center px-6 py-10 text-center" role="alert">
              <ShieldAlert className="mb-4 h-10 w-10 text-amber-500" />
              <p className="leading-relaxed text-[var(--color-body)]">
                এই পেজটি শুধু {allowed.map((r) => ROLE_LABELS[r]).join(', ')} রোলের জন্য। আপনার রোল:{' '}
                <strong>{role ? ROLE_LABELS[role] : '—'}</strong>। রোল পরিবর্তন করতে অ্যাডমিনের সাথে যোগাযোগ করুন —
                নিজে নিজে রোল বদলানো যায় না।
              </p>
              <Link to="/dashboard" className="btn-primary mt-5 inline-flex">
                ড্যাশবোর্ডে যান
              </Link>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
