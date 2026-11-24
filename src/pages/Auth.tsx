import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, LogIn, Mail, UserPlus } from 'lucide-react'
import { DemoNotice, PageHero } from '../components/ui'
import { useToast } from '../lib/toast'

const inputCls =
  'w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]'

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <PageHero eyebrow="অ্যাকাউন্ট" title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <DemoNotice>
          এটি <strong>ডেমো ফর্ম</strong> — কোনো আসল লগইন বা অ্যাকাউন্ট তৈরি হয় না। Firebase Authentication আসছে
          Phase 2-এ।
        </DemoNotice>
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

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
})
type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { push } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  return (
    <AuthCard title="লগইন" subtitle="আপনার অ্যাকাউন্টে প্রবেশ করুন।">
      <form
        onSubmit={handleSubmit(() => push('ডেমো ফর্ম — আসল লগইন Phase 2-এ চালু হবে।', 'info'))}
        noValidate
        className="space-y-4"
      >
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
    phone: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)').max(14, 'সঠিক মোবাইল নম্বর দিন'),
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  return (
    <AuthCard title="রেজিস্ট্রেশন" subtitle="ফ্রি অ্যাকাউন্ট তৈরি করুন।">
      <form
        onSubmit={handleSubmit(() => push('ডেমো ফর্ম — আসল রেজিস্ট্রেশন Phase 2-এ চালু হবে।', 'info'))}
        noValidate
        className="space-y-4"
      >
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  return (
    <AuthCard title="পাসওয়ার্ড ভুলে গেছেন?" subtitle="ইমেইল দিন — রিসেট লিংক পাঠানো হবে (Phase 2-এ চালু হবে)।">
      <form
        onSubmit={handleSubmit(() => push('ডেমো ফর্ম — পাসওয়ার্ড রিসেট Phase 2-এ চালু হবে।', 'info'))}
        noValidate
        className="space-y-4"
      >
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
      <p className="mt-5 text-center text-sm text-[var(--color-body)]">
        <Link to="/login" className="font-bold text-[var(--color-primary)] hover:underline">
          লগইন পেজে ফিরে যান
        </Link>
      </p>
    </AuthCard>
  )
}
