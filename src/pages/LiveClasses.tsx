import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Radio, Users, Video } from 'lucide-react'
import { getTeacherById, liveClasses, teachers } from '../data/sample'
import { DemoNotice, PageHero, SampleBadge } from '../components/ui'
import { useToast } from '../lib/toast'

function useCountdown(targetIso: string) {
  const calc = () => {
    const diff = Math.max(0, new Date(targetIso).getTime() - Date.now())
    const d = Math.floor(diff / 86_400_000)
    const h = Math.floor((diff % 86_400_000) / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1000)
    return { d, h, m, s }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = window.setInterval(() => setT(calc()), 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso])
  return t
}

function LiveClassRow({ cls }: { cls: (typeof liveClasses)[number] }) {
  const teacher = getTeacherById(cls.teacherId)
  const cd = useCountdown(cls.startsAt)
  const { push } = useToast()
  return (
    <article className="card card-hover p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/30">
            <Radio className="h-6 w-6" />
          </span>
          <div>
            <span className="mb-1.5 inline-block">
              <SampleBadge />
            </span>
            <h3 className="text-lg font-bold">{cls.title}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-body)]">
              <span>{teacher?.name} · {cls.subject}</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {new Date(cls.startsAt).toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
                {new Date(cls.startsAt).toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {cls.durationMin} মিনিট
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {cls.enrolled.toLocaleString('en-IN')} জন ভর্তি (নমুনা)
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" aria-label="ক্লাস শুরুর কাউন্টডাউন">
          {[
            { v: cd.d, l: 'দিন' },
            { v: cd.h, l: 'ঘণ্টা' },
            { v: cd.m, l: 'মিনিট' },
            { v: cd.s, l: 'সেকেন্ড' },
          ].map((u) => (
            <span key={u.l} className="rounded-xl bg-[var(--color-primary-soft)] px-2.5 py-2 text-center">
              <span className="block text-base leading-none font-extrabold text-[var(--color-primary)]">{u.v}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{u.l}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => push('লাইভ ক্লাসে যোগদান Phase 2-এ চালু হবে — এটি ডেমো।', 'info')} className="btn-cta !py-2.5 text-sm">
          <Video className="h-4 w-4" /> রিমাইন্ডার দিন
        </button>
        <button onClick={() => push('রেকর্ডিং Phase 2-এ পাওয়া যাবে।', 'info')} className="btn-outline text-sm">
          রেকর্ডিং দেখুন
        </button>
      </div>
    </article>
  )
}

export default function LiveClasses() {
  const past = liveClasses.slice(0, 2)
  return (
    <div>
      <PageHero
        eyebrow="লাইভ ক্লাস"
        title="লাইভ ক্লাস"
        subtitle="সরাসরি শিক্ষকের সঙ্গে প্রশ্নোত্তর ও সমস্যা সমাধান। সময়সূচি নমুনা — আসল ক্লাস Phase 2-এ চালু হবে।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <DemoNotice>লাইভ ক্লাসের সময়সূচি, শিক্ষক ও ভর্তির সংখ্যা — সবই নমুনা। আসল লাইভ স্ট্রিমিং ইন্টিগ্রেশন Phase 5-এ আসবে।</DemoNotice>
        <h2 className="mb-4 text-xl font-extrabold">আসন্ন ক্লাস</h2>
        <div className="space-y-5">
          {liveClasses.map((lc) => (
            <LiveClassRow key={lc.id} cls={lc} />
          ))}
        </div>

        <h2 className="mt-12 mb-4 text-xl font-extrabold">পূর্বের ক্লাসের রেকর্ডিং</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {past.map((lc) => {
            const teacher = teachers.find((t) => t.id === lc.teacherId)
            return (
              <div key={`past-${lc.id}`} className="card flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Video className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold">{lc.title}</h3>
                  <p className="text-sm text-[var(--color-body)]">
                    {teacher?.name} · রেকর্ডেড (নমুনা)
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
