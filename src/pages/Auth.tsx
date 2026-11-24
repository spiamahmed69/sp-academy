/**
 * Auth pages — Phase 2: wired to Firebase Auth via AuthContext.
 *
 * When Firebase is configured, login / registration / Google sign-in /
 * password reset are REAL. When it is not configured, every submit shows a
 * clear Bengali message and never fakes a successful login.
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Chrome, GraduationCap, LogIn, Mail, UserPlus } from 'lucide-react'
import { DemoNotice, PageHero } from '../components/ui'
import { useToast } from '../lib/toast'
import { useAuth } from '../contexts/AuthContext'
import { isValidBdPhone } from '../lib/cart'

const inputCls =
  'w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]'

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { configured } = useAuth()
  return (
    <div>
      <PageHero eyebrow="অ্যাকাউন্ট" title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        {configured ? (
          <DemoNotice>
            আসল লগইন চালু আছে — আপনার অ্যাকাউন্ট Firebase Authentication দিয়ে নিরাপদে পরিচালিত হয়।
          </DemoNotice>
        ) : (
          <DemoNotice>
            এটি <strong>ডেমো ফর্ম</strong> — Firebase এখনো কনফিগার করা হয়নি, তাই কোনো আসল লগইন বা অ্যাকাউন্ট তৈরি
            হয় না। সেটআপের নির্দেশনা <code>docs/firebase-setup.md</code>-এ আছে।
          </DemoNotice>
        )}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <p className="font-extrabold">SP Academy</p>
              <p className="text-xs text-[var(--color-muted)]">Learn Today, Lead Tomorrow</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {message}
    </p>
  ) : null
}

function GoogleButton({ label, onDone }: { label: string; onDone: () => void }) {
  const { loginWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div>
      <div className="my-5 flex items-center gap-3 text-xs font-bold text-[var(--color-muted)]">
        <span className="h-px flex-1 bg-blue-100 dark:bg-slate-700" />
        অথবা
        <span className="h-px flex-1 bg-blue-100 dark:bg-slate-700" />
      </div>
      <FormError message={error} />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setError(null)
          setBusy(true)
          try {
            await loginWithGoogle()
            onDone()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Google লগইন করা যায়নি।')
          } finally {
            setBusy(false)
          }
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-page)] disabled:opacity-60 dark:border-slate-700 dark:bg-[#12233c]"
      >
        <Chrome className="h-4 w-4" /> {busy ? 'অপেক্ষা করুন...' : label}
      </button>
    </div>
  )
}

function useRedirectAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  return () => navigate(from, { replace: true })
}

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
})
type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { push } = useToast()
  const { login } = useAuth()
  const goNext = useRedirectAfterAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  return (
    <AuthCard title="লগইন" subtitle="আপনার অ্যাকাউন্টে প্রবেশ করুন।">
      <form
        onSubmit={handleSubmit(async (data) => {
          setError(null)
          try {
            await login(data.email, data.password)
            push('স্বাগতম! লগইন সফল হয়েছে।', 'success')
            goNext()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'লগইন করা যায়নি।')
          }
        })}
        noValidate
        className="space-y-4"
      >
        <FormError message={error} />
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold">
            ইমেইল
          </label>
          <input id="login-email" type="email" {...register('email')} className={inputCls} placeholder="you@example.com" autoComplete="email" />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold">
            পাসওয়ার্ড
          </label>
          <input id="login-password" type="password" {...register('password')} className={inputCls} placeholder="••••••••" autoComplete="current-password" />
          <FieldError message={errors.password?.message} />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-cta w-full cursor-pointer disabled:opacity-60">
          <LogIn className="h-4 w-4" /> লগইন করুন
        </button>
      </form>
      <GoogleButton label="Google দিয়ে লগইন করুন" onDone={goNext} />
      <p className="mt-5 text-center text-sm text-[var(--color-body)]">
        অ্যাকাউন্ট নেই?{' '}
        <Link to="/register" className="font-bold text-[var(--color-primary)] hover:underline">
          রেজিস্টার করুন
        </Link>
      </p>
    </AuthCard>
  )
}

const registerSchema = z
  .object({
    name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
    email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
    phone: z.string().trim().refine((v) => isValidBdPhone(v), 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)।'),
    password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'পাসওয়ার্ড মিলছে না',
    path: ['confirmPassword'],
  })
type RegisterForm = z.infer<typeof registerSchema>

export function Register() {
  const { push } = useToast()
  const { register: registerUser } = useAuth()
  const goNext = useRedirectAfterAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  return (
    <AuthCard title="রেজিস্ট্রেশন" subtitle="ফ্রি অ্যাকাউন্ট তৈরি করুন — আপনি শিক্ষার্থী হিসেবে রেজিস্টার হবেন।">
      <form
        onSubmit={handleSubmit(async (data) => {
          setError(null)
          try {
            await registerUser({ name: data.name, email: data.email, phone: data.phone, password: data.password })
            push('অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!', 'success')
            goNext()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'রেজিস্ট্রেশন করা যায়নি।')
          }
        })}
        noValidate
        className="space-y-4"
      >
        <FormError message={error} />
        <div>
          <label htmlFor="reg-name" className="mb-1.5 block text-sm font-bold">
            পুরো নাম
          </label>
          <input id="reg-name" {...register('name')} className={inputCls} placeholder="আপনার নাম" autoComplete="name" />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-bold">
            ইমেইল
          </label>
          <input id="reg-email" type="email" {...register('email')} className={inputCls} placeholder="you@example.com" autoComplete="email" />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-bold">
            মোবাইল নম্বর
          </label>
          <input id="reg-phone" type="tel" {...register('phone')} className={inputCls} placeholder="01XXXXXXXXX" autoComplete="tel" />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-bold">
            পাসওয়ার্ড
          </label>
          <input id="reg-password" type="password" {...register('password')} className={inputCls} placeholder="কমপক্ষে ৬ অক্ষর" autoComplete="new-password" />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-bold">
            পাসওয়ার্ড আবার লিখুন
          </label>
          <input id="reg-confirm" type="password" {...register('confirmPassword')} className={inputCls} placeholder="পাসওয়ার্ড আবার লিখুন" autoComplete="new-password" />
          <FieldError message={errors.confirmPassword?.message} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-cta w-full cursor-pointer disabled:opacity-60">
          <UserPlus className="h-4 w-4" /> রেজিস্টার করুন
        </button>
      </form>
      <GoogleButton label="Google দিয়ে রেজিস্টার করুন" onDone={goNext} />
      <p className="mt-5 text-center text-sm text-[var(--color-body)]">
        অ্যাকাউন্ট আছে?{' '}
        <Link to="/login" className="font-bold text-[var(--color-primary)] hover:underline">
          লগইন করুন
        </Link>
      </p>
    </AuthCard>
  )
}

const forgotSchema = z.object({
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
})
type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPassword() {
  const { push } = useToast()
  const { resetPassword } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  return (
    <AuthCard title="পাসওয়ার্ড ভুলে গেছেন?" subtitle="ইমেইল দিন — পাসওয়ার্ড রিসেট লিংক পাঠানো হবে।">
      {sent ? (
        <p role="status" className="rounded-2xl bg-green-50 px-4 py-4 text-sm leading-relaxed font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-300">
          রিসেট লিংক পাঠানো হয়েছে। আপনার ইনবক্স (এবং স্প্যাম ফোল্ডার) যাচাই করুন।
        </p>
      ) : (
        <form
          onSubmit={handleSubmit(async (data) => {
            setError(null)
            try {
              await resetPassword(data.email)
              setSent(true)
              push('পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।', 'success')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'রিসেট লিংক পাঠানো যায়নি।')
            }
          })}
          noValidate
          className="space-y-4"
        >
          <FormError message={error} />
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-bold">
              ইমেইল
            </label>
            <input id="forgot-email" type="email" {...register('email')} className={inputCls} placeholder="you@example.com" autoComplete="email" />
            <FieldError message={errors.email?.message} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-cta w-full cursor-pointer disabled:opacity-60">
            <Mail className="h-4 w-4" /> রিসেট লিংক পাঠান
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-[var(--color-body)]">
        <Link to="/login" className="font-bold text-[var(--color-primary)] hover:underline">
          লগইন পেজে ফিরে যান
        </Link>
      </p>
    </AuthCard>
  )
}
