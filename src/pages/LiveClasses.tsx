/**
 * Live classes — Phase 5.
 *
 * Reads the schedule through `useLiveClasses`: Firestore when configured,
 * labelled নমুনা data otherwise. The join button renders a REAL link only
 * when the class document has a joinUrl; without one the UI says the link
 * will appear before the class starts. A recording link renders only when
 * a recordingUrl exists — no fake "watch recording" button, no fake live
 * session, no pretend video call.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, Radio, Users, Video } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  classifyLiveClass,
  joinAvailability,
  liveClassPhaseLabel,
  type LiveClassView,
} from '../firebase/liveClasses'
import { useLiveClasses } from '../hooks/useLiveClasses'
import { canScheduleLiveClass } from '../firebase/liveClasses'
import { DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

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

function formatClassDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'long' })} · ${d.toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' })}`
}

function JoinArea({ cls }: { cls: LiveClassView }) {
  const join = joinAvailability(cls)
  const phase = classifyLiveClass(cls)
  if (!join.available) {
    return <p className="text-sm leading-relaxed text-[var(--color-muted)]">{join.message}</p>
  }
  if (!cls.joinUrl) {
    return <p className="text-sm leading-relaxed text-[var(--color-muted)]">যোগদানের লিংক এখনো যুক্ত হয়নি।</p>
  }
  return (
    <a href={cls.joinUrl} target="_blank" rel="noreferrer" className="btn-cta !py-2.5 text-sm">
      <Video className="h-4 w-4" /> {phase === 'live' ? 'লাইভ ক্লাসে যোগ দিন' : 'যোগদানের লিংক খুলুন'}
    </a>
  )
}

function LiveClassRow({ cls, source }: { cls: LiveClassView; source: 'firestore' | 'sample' }) {
  const cd = useCountdown(cls.startsAt)
  const phase = classifyLiveClass(cls)
  return (
    <article className="card card-hover p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/30">
            <Radio className="h-6 w-6" />
          </span>
          <div>
            <span className="mb-1.5 flex flex-wrap items-center gap-2">
              {source === 'sample' && <SampleBadge />}
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {liveClassPhaseLabel(phase)}
              </span>
            </span>
            <h3 className="text-lg font-bold">{cls.title}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-body)]">
              <span>{cls.teacherName} · {cls.subject}</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {formatClassDate(cls.startsAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {cls.durationMin} মিনিট
              </span>
              {cls.enrolledCount !== null && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {cls.enrolledCount.toLocaleString('bn-BD')} জন ভর্তি
                  {source === 'sample' ? ' (নমুনা)' : ''}
                </span>
              )}
            </p>
            {cls.description && <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">{cls.description}</p>}
          </div>
        </div>
        {phase === 'upcoming' && (
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
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <JoinArea cls={cls} />
        {phase === 'ended' &&
          (cls.recordingUrl ? (
            <a href={cls.recordingUrl} target="_blank" rel="noreferrer" className="btn-outline text-sm">
              রেকর্ডিং দেখুন
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-2 text-sm text-[var(--color-muted)]">
              রেকর্ডিং এখনো যুক্ত হয়নি
            </span>
          ))}
      </div>
    </article>
  )
}

export default function LiveClasses() {
  const { user, role, configured } = useAuth()
  const { data, isLoading, isError, refetch } = useLiveClasses()
  const classes = data?.classes ?? []
  const source = data?.source ?? 'sample'

  const upcoming = classes
    .filter((c) => {
      const phase = classifyLiveClass(c)
      return phase === 'upcoming' || phase === 'live'
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const past = classes
    .filter((c) => classifyLiveClass(c) === 'ended' || classifyLiveClass(c) === 'cancelled')
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))

  return (
    <div>
      <PageHero
        eyebrow="লাইভ ক্লাস"
        title="লাইভ ক্লাস"
        subtitle="সরাসরি শিক্ষকের সঙ্গে প্রশ্নোত্তর ও সমস্যা সমাধান। যোগদানের লিংক ক্লাস শুরুর আগে এখানে দেখা যাবে।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {source === 'sample' && (
          <DemoNotice>
            লাইভ ক্লাসের সময়সূচি, শিক্ষক ও ভর্তির সংখ্যা — সবই নমুনা। আসল ক্লাস শিডিউল করতে Firebase সেটআপ
            শেষ করে শিক্ষক অ্যাকাউন্টে লগইন করতে হবে।
          </DemoNotice>
        )}

        {configured && user && canScheduleLiveClass(role) && (
          <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="font-bold">আপনি শিক্ষক — নতুন লাইভ ক্লাস শিডিউল করতে পারেন।</p>
            <Link to="/teacher" className="btn-cta !py-2.5 text-sm">
              <Video className="h-4 w-4" /> ক্লাস শিডিউল করুন
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="space-y-5" aria-busy="true" aria-label="লাইভ ক্লাস লোড হচ্ছে">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {isError && <ErrorState message="লাইভ ক্লাসের সময়সূচি লোড করা যায়নি।" onRetry={() => void refetch()} />}

        {!isLoading && !isError && (
          <>
            <h2 className="mb-4 text-xl font-extrabold">আসন্ন ক্লাস</h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="আসন্ন কোনো লাইভ ক্লাস নেই"
                message="নতুন ক্লাস শিডিউল হলে এখানে দেখা যাবে।"
              />
            ) : (
              <div className="space-y-5">
                {upcoming.map((lc) => (
                  <LiveClassRow key={lc.id} cls={lc} source={source} />
                ))}
              </div>
            )}

            {past.length > 0 && (
              <>
                <h2 className="mt-12 mb-4 text-xl font-extrabold">পূর্বের ক্লাস</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {past.map((lc) => (
                    <div key={`past-${lc.id}`} className="card flex items-center gap-4 p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                        <Video className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="font-bold">{lc.title}</h3>
                        <p className="text-sm text-[var(--color-body)]">
                          {lc.teacherName} · {classifyLiveClass(lc) === 'cancelled' ? 'বাতিল হয়েছে' : 'শেষ হয়েছে'}
                          {source === 'sample' ? ' (নমুনা)' : ''}
                        </p>
                        {lc.recordingUrl ? (
                          <a href={lc.recordingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-bold text-[var(--color-primary)] hover:underline">
                            রেকর্ডিং দেখুন →
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-[var(--color-muted)]">রেকর্ডিং এখনো যুক্ত হয়নি</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
