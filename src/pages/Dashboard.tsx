/**
 * Student dashboard (overview) — Phase 2.
 * Protected route: shows the signed-in user's profile, role and a sample
 * "continue learning" list. Enrolments here are নমুনা (sample) until Phase 3
 * wires real course enrolments from Firestore.
 */
import { Link } from 'react-router-dom'
import { BookOpen, CalendarDays, GraduationCap, LogOut, Settings, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../lib/roles'
import { courses } from '../data/sample'
import { Breadcrumbs, PageHero, SampleBadge } from '../components/ui'
import { formatBDT } from '../lib/format'

export default function Dashboard() {
  const { user, profile, logout } = useAuth()
  const sampleEnrolled = courses.slice(0, 3)

  return (
    <div>
      <PageHero
        eyebrow="ড্যাশবোর্ড"
        title={`স্বাগতম, ${profile?.displayName || 'শিক্ষার্থী'}!`}
        subtitle="আপনার শেখার অগ্রগতি, আসন্ন ক্লাস ও পরীক্ষা এক জায়গায় দেখুন।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'ড্যাশবোর্ড' }]} />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, label: 'আমার কোর্স (নমুনা)', value: String(sampleEnrolled.length) },
            { icon: GraduationCap, label: 'সম্পন্ন লেসন (নমুনা)', value: '০' },
            { icon: CalendarDays, label: 'আসন্ন লাইভ ক্লাস', value: '২' },
            { icon: Trophy, label: 'সার্টিফিকেট', value: '০' },
          ].map((s) => (
            <div key={s.label} className="card flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
                <s.icon className="h-6 w-6 text-[var(--color-primary)]" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold">{s.value}</span>
                <span className="text-sm text-[var(--color-muted)]">{s.label}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold">শেখা চালিয়ে যান</h2>
              <SampleBadge />
            </div>
            <div className="space-y-3">
              {sampleEnrolled.map((c) => (
                <Link key={c.slug} to={`/courses/${c.slug}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 p-4 transition hover:border-[var(--color-primary)] dark:border-slate-700">
                  <span>
                    <span className="block font-bold">{c.title}</span>
                    <span className="text-sm text-[var(--color-muted)]">
                      {c.lessons} লেসন · {formatBDT(c.discountPrice ?? c.price)}
                    </span>
                  </span>
                  <span className="btn-primary !px-4 !py-2 text-sm">চালিয়ে যান</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              এগুলো নমুনা এনরোলমেন্ট — আসল কোর্স এনরোলমেন্ট আসছে Phase 3-এ।
            </p>
          </section>

          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="mb-3 text-lg font-extrabold">আমার অ্যাকাউন্ট</h2>
              <p className="text-sm leading-relaxed text-[var(--color-body)]">
                <strong>{profile?.displayName || '—'}</strong>
                <br />
                {user?.email}
                <br />
                রোল: <strong>{profile ? ROLE_LABELS[profile.role] : '—'}</strong>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/profile" className="btn-primary !px-4 !py-2 text-sm">
                  <Settings className="h-4 w-4" /> প্রোফাইল সেটিংস
                </Link>
                <button
                  onClick={() => void logout()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" /> লগআউট
                </button>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="mb-3 text-lg font-extrabold">দ্রুত লিংক</h2>
              <div className="grid gap-2 text-sm font-semibold">
                <Link to="/live-classes" className="text-[var(--color-primary)] hover:underline">
                  আসন্ন লাইভ ক্লাস →
                </Link>
                <Link to="/exams" className="text-[var(--color-primary)] hover:underline">
                  আমার পরীক্ষা →
                </Link>
                <Link to="/books" className="text-[var(--color-primary)] hover:underline">
                  বুক স্টোর →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
