import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ChevronDown, GraduationCap, Mail, MapPin, Target, Users } from 'lucide-react'
import { DemoNotice, PageHero } from '../components/ui'
import { useToast } from '../lib/toast'
import { useAuth } from '../contexts/AuthContext'
import { useCreateTicket, useMyTickets } from '../hooks/useSupport'
import { ticketCategoryLabel, ticketStatusLabel } from '../firebase/support'

export function About() {
  return (
    <div>
      <PageHero
        eyebrow="আমাদের সম্পর্কে"
        title="SP Academy সম্পর্কে"
        subtitle="Learn Today, Lead Tomorrow — বাংলাদেশের শিক্ষার্থীদের জন্য মানসম্মত অনলাইন শিক্ষা।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Target, title: 'আমাদের লক্ষ্য', text: 'দেশের প্রতিটি শিক্ষার্থীর কাছে মানসম্মত শিক্ষা পৌঁছে দেওয়া — শহর কিংবা গ্রাম, সবাই সমান সুযোগ পাবে।' },
            { icon: GraduationCap, title: 'আমাদের পদ্ধতি', text: 'লাইভ ক্লাস, নোট, মডেল টেস্ট ও AI সহায়তা — সব মিলিয়ে সম্পূর্ণ শেখার অভিজ্ঞতা।' },
            { icon: Users, title: 'আমাদের কমিউনিটি', text: 'শিক্ষার্থী, শিক্ষক ও অভিভাবক — একসঙ্গে শেখার একটি বন্ধুত্বপূর্ণ কমিউনিটি গড়ে তোলাই আমাদের স্বপ্ন।' },
          ].map((c) => (
            <div key={c.title} className="card card-hover p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <c.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="card mt-8 p-6 leading-relaxed text-[var(--color-body)] sm:p-8">
          <p>
            SP Academy একটি অনলাইন শিক্ষা প্ল্যাটফর্ম, যা বাংলাদেশের শিক্ষার্থীদের জন্য তৈরি। এখানে কোর্স,
            লাইভ ক্লাস, মডেল টেস্ট, বইয়ের দোকান ও AI স্টাডি সহায়তা রয়েছে। Firebase ও ব্যাকএন্ড সেটআপ শেষ
            হলে আসল লগইন, ভর্তি ও পেমেন্ট যাচাই চালু হবে।
          </p>
          <p className="mt-3">
            এই পেজের পরিসংখ্যান, শিক্ষক প্রোফাইল ও মতামত নমুনা হিসেবে দেওয়া হয়েছে; এগুলো আসল তথ্য নয়।
          </p>
        </div>
      </div>
    </div>
  )
}

const contactSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
  subject: z.string().min(3, 'বিষয় কমপক্ষে ৩ অক্ষরের হতে হবে'),
  message: z.string().min(10, 'বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে'),
})
type ContactForm = z.infer<typeof contactSchema>

export function Contact() {
  const { push } = useToast()
  const { user, configured } = useAuth()
  const createTicket = useCreateTicket()
  const myTickets = useMyTickets()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  const onSubmit = (data: ContactForm) => {
    if (!user) {
      push('সাপোর্ট টিকিট খুলতে লগইন করুন — লগইন ছাড়া বার্তা জমা দেওয়া যায় না।', 'error')
      return
    }
    createTicket.mutate(
      { subject: data.subject, category: 'general', message: data.message },
      {
        onSuccess: () => {
          push(
            configured
              ? 'সাপোর্ট টিকিট জমা হয়েছে — অ্যাডমিন উত্তর দিলে নোটিফিকেশনে জানানো হবে।'
              : 'ডেমো টিকিট জমা হয়েছে (এই ব্রাউজারে সংরক্ষিত) — আসল সাপোর্ট সিস্টেম Firebase সেটআপের পর চালু হবে।',
            'success',
          )
          reset()
        },
        onError: (err) => push(err instanceof Error ? err.message : 'টিকিট জমা দেওয়া যায়নি।', 'error'),
      },
    )
  }

  const fieldCls =
    'w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]'

  return (
    <div>
      <PageHero
        eyebrow="যোগাযোগ"
        title="আমাদের সঙ্গে যোগাযোগ করুন"
        subtitle="কোর্স, ভর্তি বা যেকোনো প্রশ্নে বার্তা পাঠান — লগইন করা থাকলে এটি সাপোর্ট টিকিট হিসেবে জমা হবে।"
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <div className="card flex items-start gap-3 p-5">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <h2 className="font-bold">ঠিকানা</h2>
              <p className="text-sm text-[var(--color-body)]">ঢাকা, বাংলাদেশ (বিস্তারিত ঠিকানা শীঘ্রই যুক্ত হচ্ছে)</p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-5">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <h2 className="font-bold">ইমেইল</h2>
              <p className="text-sm text-[var(--color-body)]">যোগাযোগের ইমেইল শীঘ্রই যুক্ত হচ্ছে</p>
            </div>
          </div>
          <DemoNotice>
            {user
              ? 'আপনার বার্তাটি সাপোর্ট টিকিট হিসেবে জমা হবে — অ্যাডমিন উত্তর দিলে নোটিফিকেশনে জানানো হবে।'
              : 'সাপোর্ট টিকিট খুলতে লগইন করুন — লগইন ছাড়া বার্তা জমা দেওয়া যায় না। ফোন নম্বর এখনো প্রকাশ করা হয়নি।'}
          </DemoNotice>
          {!user && (
            <Link to="/login" className="btn-primary inline-flex">
              লগইন করুন
            </Link>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 lg:col-span-2" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-1.5 block text-sm font-bold">
                নাম
              </label>
              <input id="contact-name" {...register('name')} className={fieldCls} placeholder="আপনার নাম" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1.5 block text-sm font-bold">
                ইমেইল
              </label>
              <input id="contact-email" type="email" {...register('email')} className={fieldCls} placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-bold">
              বিষয়
            </label>
            <input id="contact-subject" {...register('subject')} className={fieldCls} placeholder="বিষয় লিখুন" />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
          </div>
          <div className="mt-4">
            <label htmlFor="contact-message" className="mb-1.5 block text-sm font-bold">
              বার্তা
            </label>
            <textarea id="contact-message" {...register('message')} rows={5} className={fieldCls} placeholder="আপনার বার্তা লিখুন..." />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || createTicket.isPending}
            className="btn-cta mt-5 cursor-pointer disabled:opacity-60"
          >
            {createTicket.isPending ? 'টিকিট জমা হচ্ছে...' : 'টিকিট হিসেবে পাঠান'}
          </button>
          {!user && (
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
              লগইন না করলে বার্তা জমা হবে না — উপরে লগইন বোতাম থেকে লগইন করুন।
            </p>
          )}
        </form>
      </div>

      {user && (
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="card p-6">
            <h2 className="text-lg font-bold">আমার সাপোর্ট টিকিট</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              আপনার জমা দেওয়া টিকিট ও অ্যাডমিনের উত্তর এখানে দেখা যাবে।
              {myTickets.data?.source === 'sample' && ' (ডেমো টিকিট — এই ব্রাউজারে সংরক্ষিত)'}
            </p>
            {myTickets.isPending ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">লোড হচ্ছে...</p>
            ) : (myTickets.data?.tickets ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">এখনো কোনো টিকিট জমা দেননি।</p>
            ) : (
              <ul className="mt-4 divide-y divide-blue-100 dark:divide-slate-800">
                {(myTickets.data?.tickets ?? []).map((t) => (
                  <li key={t.id} className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[var(--color-heading)]">{t.subject}</p>
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                        {ticketCategoryLabel(t.category)}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {ticketStatusLabel(t.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-body)]">{t.message}</p>
                    {t.replies.map((r, i) => (
                      <div key={i} className="mt-2 rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3">
                        <p className="text-xs font-bold text-[var(--color-primary)]">
                          {r.by} ({r.byRole === 'admin' ? 'অ্যাডমিন' : r.byRole})-এর উত্তর
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-body)]">{r.message}</p>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const FAQS = [
  { q: 'SP Academy-তে কীভাবে ভর্তি হবো?', a: 'ফ্রি কোর্সে কোর্সের পেজ থেকে "ভর্তি হোন" চাপলেই ভর্তি হওয়া যায় (ডেমো মোডে ভর্তি এই ব্রাউজারেই সংরক্ষিত হয়)। পেইড কোর্স কার্টে যোগ করে চেকআউট করতে হয়; অনলাইন পেমেন্টের যাচাই ব্যাকএন্ড সেটআপের পর চালু হবে।' },
  { q: 'ফ্রি কোর্স কি সত্যিই ফ্রি?', a: 'হ্যাঁ, ফ্রি কোর্সগুলোতে কোনো পেমেন্ট লাগবে না। ডেমো মোডে ভর্তি এই ব্রাউজারেই সংরক্ষিত হয়; Firebase সেটআপ হলে আসল ভর্তি চালু হবে।' },
  { q: 'লাইভ ক্লাস মিস করলে কী হবে?', a: 'লাইভ ক্লাসের রেকর্ডিং ব্যবস্থা এখনো যুক্ত হয়নি — ক্লাসের লিংক শুরুর আগে লাইভ ক্লাস পেজে দেখা যাবে। মিস করলে লেসনের নোট ও মডেল টেস্ট দিয়ে প্রস্তুতি নিতে পারবেন।' },
  { q: 'পরীক্ষার ফলাফল কীভাবে পাবো?', a: 'নমুনা MCQ পরীক্ষার ফল ব্রাউজারেই সাথে সাথে দেখা যায়। আসল পরীক্ষার উত্তরপত্র শিক্ষক মূল্যায়ন করবেন, তারপর ফলাফল পেজে নম্বর দেখা যাবে। রোল নম্বর দিয়ে খোঁজার অংশটি এখনো নমুনা।' },
  { q: 'পেমেন্টের মাধ্যম কী কী থাকবে?', a: 'বিকাশ, নগদ, কার্ড ও ক্যাশ অন ডেলিভারি — চেকআউটে মাধ্যম বেছে নেওয়া যায়। অনলাইন পেমেন্ট এখনো সার্ভার-সাইড যাচাই হয় না (অর্ডার "পেমেন্ট যাচাইয়ের অপেক্ষায়" হিসেবে জমা হয়); যাচাই ব্যবস্থা ব্যাকএন্ডে আসছে।' },
  { q: 'সার্টিফিকেট কীভাবে পাবো?', a: 'সার্টিফিকেট ইস্যুর ব্যবস্থা এখনো চালু হয়নি — কোর্স শেষ করলে অগ্রগতি ড্যাশবোর্ডে দেখা যাবে, সার্টিফিকেট পরে যুক্ত হবে।' },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div>
      <PageHero eyebrow="সাধারণ জিজ্ঞাসা" title="FAQ" subtitle="সবচেয়ে বেশি জিজ্ঞাসা করা প্রশ্নের উত্তর।" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-bold">{f.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-[var(--color-body)] dark:border-slate-700">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
