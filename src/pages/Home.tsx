import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, Clock, GraduationCap, Mail,
  PlayCircle, Radio, Search, ShieldCheck, Star, TrendingUp, Users, Video,
} from 'lucide-react'
import { blogPosts, books, categories, courses, liveClasses, sampleStats, teachers, testimonials, upcomingExams } from '../data/sample'
import { BlogCard, BookCard, CategoryTile, CourseCard, TeacherCard } from '../components/cards'
import { SampleBadge, SectionHeading } from '../components/ui'
import { toBanglaDigits } from '../lib/format'
import { useToast } from '../lib/toast'

function HeroWaveBottom() {
  return (
    <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className="wave-bottom" aria-hidden="true">
      <path d="M0,45 C240,5 480,65 720,35 C960,10 1200,60 1440,30 L1440,70 L0,70 Z" fill="var(--color-page)" />
    </svg>
  )
}

export default function Home() {
  const [q, setQ] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const { push } = useToast()

  const featured = courses.filter((c) => c.isFeatured)
  const newCourses = courses.filter((c) => c.isNew || c.isFree).slice(0, 4)

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : '/courses')
  }

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      push('সঠিক ইমেইল ঠিকানা দিন।', 'error')
      return
    }
    push('নিউজলেটারে সাবস্ক্রাইব হয়েছে (ডেমো) — ধন্যবাদ!', 'success')
    setEmail('')
  }

  return (
    <div>
      {/* Hero */}
      <section className="hero-wave">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-16">
          <div className="animate-fade-up">
            <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[var(--color-primary)] shadow-sm">
              <GraduationCap className="h-4 w-4" /> বাংলাদেশের শিক্ষার্থীদের অনলাইন পাঠশালা <SampleBadge />
            </span>
            <h1 className="mt-5 text-4xl leading-[1.2] font-extrabold sm:text-5xl lg:text-[56px]">
              শিখুন আজ,
              <br />
              <span className="text-[var(--color-primary)]">নেতৃত্ব দিন</span> আগামীকাল।
            </h1>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[var(--color-body)]">
              এসএসসি, এইচএসসি, ভর্তি ও চাকরির প্রস্তুতি — লাইভ ক্লাস, মডেল টেস্ট, বই ও AI স্টাডি সহায়তা,
              সব এক প্ল্যাটফর্মে।
            </p>
            <form onSubmit={submitSearch} className="mt-6 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 shadow-[var(--shadow-pill)]" role="search">
              <label htmlFor="hero-search" className="sr-only">
                কোর্স খুঁজুন
              </label>
              <Search className="ml-3 h-5 w-5 shrink-0 text-[var(--color-muted)]" />
              <input
                id="hero-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="কোন কোর্স খুঁজছেন? যেমন: পদার্থবিজ্ঞান"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--color-muted)]"
              />
              <button type="submit" className="btn-cta shrink-0 !px-5 !py-2.5 text-sm">
                খুঁজুন
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/courses" className="btn-cta">
                কোর্স দেখুন <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/free-courses" className="btn-outline bg-white">
                <PlayCircle className="h-4 w-4" /> ফ্রি ক্লাস দেখুন
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {['ফ্রি কোর্স দিয়ে শুরু করুন', 'বাংলা মাধ্যমে শেখা', 'সরাসরি লাইভ ক্লাস'].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {b}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-[var(--color-body)]">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[var(--color-primary)]" /> ৫০,০০০+ শিক্ষার্থী (নমুনা)
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> ৪.৮ গড় রেটিং (নমুনা)
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-[var(--color-primary)]" /> লাইভ ক্লাস ও মডেল টেস্ট
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] bg-white/70 p-6 shadow-[var(--shadow-card)] backdrop-blur">
              {/* Original hero illustration — open book, graduation cap,
                  sun and hills in SP Academy colours (no stock photo, no
                  reference artwork copied). */}
              <div className="relative overflow-hidden rounded-2xl">
                <svg viewBox="0 0 480 220" className="block h-auto w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="heroSky" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#d6ecfc" />
                      <stop offset="100%" stopColor="#eaf6ff" />
                    </linearGradient>
                  </defs>
                  <rect width="480" height="220" fill="url(#heroSky)" />
                  <circle cx="410" cy="42" r="36" fill="#fd9a2a" opacity="0.2" />
                  <circle cx="410" cy="42" r="26" fill="#fd9a2a" opacity="0.9" />
                  <ellipse cx="110" cy="52" rx="46" ry="16" fill="#ffffff" opacity="0.9" />
                  <ellipse cx="150" cy="64" rx="34" ry="12" fill="#ffffff" opacity="0.7" />
                  <path d="M0,190 C120,150 260,200 480,165 L480,220 L0,220 Z" fill="#2396f6" opacity="0.15" />
                  <path d="M0,205 C140,175 300,215 480,190 L480,220 L0,220 Z" fill="#2396f6" opacity="0.22" />
                  <g>
                    <path d="M150,120 C185,100 215,100 240,120 C265,100 295,100 330,120 L330,168 C295,148 265,148 240,168 C215,148 185,148 150,168 Z" fill="#ffffff" stroke="#2396f6" strokeWidth="3" />
                    <path d="M240,120 L240,168" stroke="#2396f6" strokeWidth="3" />
                    <path d="M168,132 C188,124 205,124 222,130 M168,146 C188,138 205,138 222,144 M258,130 C275,124 292,124 312,132 M258,144 C275,138 292,138 312,146" stroke="#cbd5e1" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </g>
                  <g transform="translate(330,58)">
                    <path d="M0,0 L52,20 L0,40 L-52,20 Z" fill="#12283f" />
                    <path d="M-28,26 L-28,48 C-28,58 28,58 28,48 L28,26 L0,38 Z" fill="#213549" />
                    <path d="M52,20 L52,52" stroke="#f97316" strokeWidth="3" />
                    <circle cx="52" cy="56" r="5" fill="#f97316" />
                  </g>
                  <g transform="translate(96,118) rotate(-24)">
                    <rect x="0" y="0" width="72" height="14" rx="3" fill="#f97316" />
                    <path d="M72,0 L88,7 L72,14 Z" fill="#fbbf24" />
                    <path d="M83,4.5 L88,7 L83,9.5 Z" fill="#213549" />
                    <rect x="0" y="0" width="10" height="14" rx="3" fill="#2396f6" />
                  </g>
                </svg>
                <span className="animate-float absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] shadow-md">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> লাইভ ক্লাস চলছে
                </span>
                <span className="animate-float-slow absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] shadow-md">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> ৪.৮ রেটিং (নমুনা)
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--color-primary-soft)] p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
                  <Radio className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold">আজকের লাইভ ক্লাস</p>
                  <p className="text-sm text-[var(--color-body)]">ভেক্টর: লাইভ সমস্যা সমাধান — সন্ধ্যা ৭টা (নমুনা)</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-blue-100 p-4">
                  <p className="text-2xl font-extrabold text-[var(--color-primary)]">১২০+</p>
                  <p className="text-sm text-[var(--color-body)]">কোর্স (নমুনা)</p>
                </div>
                <div className="rounded-2xl border border-blue-100 p-4">
                  <p className="text-2xl font-extrabold text-[var(--color-cta-to)]">৯২%</p>
                  <p className="text-sm text-[var(--color-body)]">সফলতার হার (নমুনা)</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
                <Award className="h-8 w-8 shrink-0 text-[var(--color-cta)]" />
                <p className="text-sm leading-relaxed text-[var(--color-body)]">
                  মডেল টেস্টে মেধাতালিকায় স্থান পাওয়ার সুযোগ — নিয়মিত পরীক্ষা দিয়ে নিজের প্রস্তুতি যাচাই করুন।
                </p>
              </div>
            </div>
          </div>
        </div>
        <HeroWaveBottom />
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="ক্যাটাগরি"
          title="জনপ্রিয় ক্যাটাগরি"
          subtitle="আপনার লক্ষ্য অনুযায়ী সঠিক ক্যাটাগরি বেছে নিন।"
          action={
            <Link to="/categories" className="btn-outline text-sm">
              সব ক্যাটাগরি <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryTile key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="bg-[var(--color-page-2)] py-12 sm:py-16 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="ফিচার্ড"
            title="জনপ্রিয় কোর্সসমূহ"
            subtitle="শিক্ষার্থীদের পছন্দের কোর্স — নমুনা তালিকা, দাম নমুনা হিসেবে দেখানো হয়েছে।"
            action={
              <Link to="/courses" className="btn-outline bg-white text-sm">
                সব কোর্স <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* New courses */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="নতুন" title="নতুন কোর্স" subtitle="সদ্য যুক্ত হওয়া কোর্স ও ফ্রি কোর্সসমূহ।" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newCourses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* Teachers */}
      <section className="bg-[var(--color-page-2)] py-12 sm:py-16 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="শিক্ষকবৃন্দ"
            title="জনপ্রিয় শিক্ষক"
            subtitle="অভিজ্ঞ শিক্ষকদের কাছ থেকে শিখুন — প্রোফাইলগুলো নমুনা।"
            action={
              <Link to="/teachers" className="btn-outline bg-white text-sm">
                সব শিক্ষক <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.slice(0, 3).map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Why + stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="কেন SP Academy" title="কেন SP Academy বেছে নেবেন?" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Video, title: 'লাইভ ক্লাস', text: 'সরাসরি প্রশ্ন করার সুযোগ, আর লেসনের নোট যেকোনো সময় দেখার সুবিধা।' },
            { icon: BookOpen, title: 'নোট ও অনুশীলনী', text: 'প্রতিটি লেসনের সঙ্গে সাজানো নোট ও অনুশীলনী।' },
            { icon: TrendingUp, title: 'মডেল টেস্ট ও অ্যানালিটিকস', text: 'নিয়মিত পরীক্ষা দিয়ে নিজের দুর্বল জায়গা খুঁজে বের করুন।' },
            { icon: ShieldCheck, title: 'নিরাপদ পেমেন্ট', text: 'বিকাশ, নগদ, কার্ড ও ক্যাশ অন ডেলিভারি।' },
          ].map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Explicit hex gradient (not a var-based utility) so the white
            numbers can never sit on a white background. */}
        <div className="mt-10 grid grid-cols-2 gap-4 rounded-3xl bg-gradient-to-r from-[#1b7fe6] via-[#2396f6] to-[#1e9ff2] p-6 text-white sm:p-8 lg:grid-cols-4">
          {sampleStats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-white sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-blue-100">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live classes + exams */}
      <section className="bg-[var(--color-page-2)] py-12 sm:py-16 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading eyebrow="লাইভ ক্লাস" title="আসন্ন লাইভ ক্লাস" subtitle="সময়সূচি নমুনা — আসল ক্লাসের লিংক শুরুর আগে এখানে দেখা যাবে।" />
            <div className="space-y-4">
              {liveClasses.slice(0, 3).map((lc) => {
                const teacher = teachers.find((t) => t.id === lc.teacherId)
                return (
                  <div key={lc.id} className="card flex items-center gap-4 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/30">
                      <Radio className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{lc.title}</h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-[var(--color-body)]">
                        <span>{teacher?.name}</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(lc.startsAt).toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' })} ·{' '}
                          {new Date(lc.startsAt).toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {toBanglaDigits(lc.durationMin)} মিনিট
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link to="/live-classes" className="btn-primary mt-5 text-sm">
              সব লাইভ ক্লাস <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <SectionHeading eyebrow="পরীক্ষা" title="আসন্ন পরীক্ষা" subtitle="মডেল টেস্টের সময়সূচি নমুনা — অফিসিয়াল নয়।" />
            <div className="space-y-4">
              {upcomingExams.slice(0, 3).map((ex) => (
                <div key={ex.id} className="card flex items-center gap-4 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <GraduationCap className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{ex.title}</h3>
                    <p className="mt-0.5 text-sm text-[var(--color-body)]">
                      {ex.date} · {toBanglaDigits(ex.marks)} নম্বর · {toBanglaDigits(ex.questions)}টি প্রশ্ন · {toBanglaDigits(ex.durationMin)} মিনিট
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/exams" className="btn-primary mt-5 text-sm">
              সব পরীক্ষা <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="শিক্ষার্থীদের কথা" title="শিক্ষার্থীরা যা বলছেন" subtitle="মতামতগুলো নমুনা — আসল রিভিউ এখনো যুক্ত হয়নি।" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <figure key={t.name} className="card card-hover p-6">
              <div className="flex gap-0.5" aria-label={`${t.rating} স্টার রেটিং`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-[var(--color-body)]">“{t.quote}”</blockquote>
              <figcaption className="mt-4">
                <p className="font-bold">{t.name}</p>
                <p className="text-xs text-[var(--color-muted)]">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Books */}
      <section className="bg-[var(--color-page-2)] py-12 sm:py-16 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="বইয়ের দোকান"
            title="বইয়ের সুপারিশ"
            subtitle="পরীক্ষার প্রস্তুতির জন্য বই — দাম ও স্টক নমুনা।"
            action={
              <Link to="/books" className="btn-outline bg-white text-sm">
                সব বই <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {books.slice(0, 4).map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="ব্লগ"
          title="সাম্প্রতিক ব্লগ"
          subtitle="পড়াশোনার কৌশল ও প্রস্তুতির গাইড।"
          action={
            <Link to="/blog" className="btn-outline text-sm">
              সব ব্লগ <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      {/* Promo + newsletter */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#ff8a1e] to-[#f97316] p-8 text-white shadow-lg sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">নতুন শিক্ষার্থীদের জন্য বিশেষ ছাড়!</h2>
              <p className="mt-2 max-w-xl text-white/90">
                প্রথম কোর্সে ভর্তিতে নমুনা ছাড়ের অফার — আসল কুপন ব্যবস্থা এখনো চালু হয়নি। এখনই ফ্রি কোর্স
                দিয়ে শুরু করুন।
              </p>
            </div>
            <Link to="/free-courses" className="w-full text-center sm:w-auto shrink-0 rounded-full bg-white px-6 py-3 font-bold text-[#f97316] shadow transition-transform hover:-translate-y-0.5">
              ফ্রি শুরু করুন
            </Link>
          </div>
        </div>

        <div className="card mt-8 flex flex-col items-start justify-between gap-5 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-extrabold sm:text-2xl">নিউজলেটার সাবস্ক্রাইব করুন</h2>
            <p className="mt-1 text-sm text-[var(--color-body)]">
              নতুন কোর্স, লাইভ ক্লাস ও মডেল টেস্টের খবর ইমেইলে পান। (ডেমো ফর্ম — ইমেইল সংরক্ষণ করা হয় না।)
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              ইমেইল ঠিকানা
            </label>
            <div className="relative flex-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল"
                className="w-full rounded-full border border-blue-100 bg-[var(--color-page)] py-3 pr-4 pl-10 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
              />
            </div>
            <button type="submit" className="btn-cta shrink-0 !px-5 !py-3 text-sm">
              সাবস্ক্রাইব
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
