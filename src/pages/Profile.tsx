/**
 * Profile settings — Phase 2.
 * Signed-in users can edit their own name and phone. Email and role are
 * read-only here: email changes need re-authentication, and roles are
 * granted only by an admin (never self-assigned).
 */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebase } from '../firebase/config'
import { updateUserProfile } from '../firebase/profiles'
import { ROLE_LABELS } from '../lib/roles'
import { Breadcrumbs, PageHero, SampleBadge } from '../components/ui'
import { useToast } from '../lib/toast'

const profileSchema = z.object({
  displayName: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  phone: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)').max(14, 'সঠিক মোবাইল নম্বর দিন'),
})
type ProfileForm = z.infer<typeof profileSchema>

export default function Profile() {
  const { user, profile } = useAuth()
  const { push } = useToast()
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: profile?.displayName ?? '', phone: profile?.phone ?? '' },
  })

  useEffect(() => {
    reset({ displayName: profile?.displayName ?? '', phone: profile?.phone ?? '' })
  }, [profile, reset])

  const onSubmit = async (data: ProfileForm) => {
    const services = getFirebase()
    if (!services || !user) {
      push('Firebase কনফিগার করা হয়নি — প্রোফাইল সংরক্ষণ করা যাবে না।', 'error')
      return
    }
    try {
      await updateUserProfile(services.db, user.uid, data)
      setSaved(true)
      push('প্রোফাইল সংরক্ষণ করা হয়েছে।', 'success')
    } catch {
      push('প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।', 'error')
    }
  }

  return (
    <div>
      <PageHero eyebrow="অ্যাকাউন্ট" title="প্রোফাইল সেটিংস" subtitle="আপনার নাম ও মোবাইল নম্বর আপডেট করুন।" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Breadcrumbs items={[{ label: 'ড্যাশবোর্ড', to: '/dashboard' }, { label: 'প্রোফাইল' }]} />
        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-extrabold text-white">
              {(profile?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-lg font-extrabold">{profile?.displayName || '—'}</p>
              <p className="text-sm text-[var(--color-muted)]">{user?.email}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                  <ShieldCheck className="h-4 w-4" /> {profile ? ROLE_LABELS[profile.role] : '—'}
                </span>
                <SampleBadge label="নমুনা প্রোফাইল" />
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-sm font-bold">
                পুরো নাম
              </label>
              <input
                id="profile-name"
                {...register('displayName')}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]"
                autoComplete="name"
              />
              {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>}
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-bold">
                মোবাইল নম্বর
              </label>
              <input
                id="profile-phone"
                type="tel"
                {...register('phone')}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]"
                autoComplete="tel"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold">ইমেইল (পরিবর্তন করা যায় না)</label>
              <input value={user?.email ?? ''} disabled className="w-full cursor-not-allowed rounded-2xl border border-blue-100 bg-[var(--color-page)] px-4 py-3 text-sm opacity-70" />
            </div>
            <button type="submit" disabled={isSubmitting || !isDirty} className="btn-cta cursor-pointer disabled:opacity-60">
              <Save className="h-4 w-4" /> সংরক্ষণ করুন
            </button>
            {saved && (
              <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <UserRound className="h-4 w-4" /> প্রোফাইল আপডেট হয়েছে।
              </p>
            )}
          </form>

          <p className="mt-6 text-sm leading-relaxed text-[var(--color-muted)]">
            রোল পরিবর্তন করতে অ্যাডমিনের সাথে যোগাযোগ করুন। নিরাপত্তার জন্য কোনো ব্যবহারকারী নিজে নিজের রোল বদলাতে
            পারে না — রোল শুধু অ্যাডমিন দিতে পারে।
          </p>
        </div>
      </div>
    </div>
  )
}
