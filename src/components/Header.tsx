import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, LayoutDashboard, LogIn, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import { useAuth } from '../contexts/AuthContext'
import { canAccess } from '../lib/roles'

const NAV_LINKS = [
  { to: '/courses', label: 'কোর্সসমূহ' },
  { to: '/categories', label: 'ক্যাটাগরি' },
  { to: '/teachers', label: 'শিক্ষক' },
  { to: '/free-courses', label: 'ফ্রি কোর্স' },
  { to: '/live-classes', label: 'লাইভ ক্লাস' },
  { to: '/exams', label: 'পরীক্ষা' },
  { to: '/books', label: 'বই' },
  { to: '/blog', label: 'ব্লগ' },
]

export default function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { user, profile, role, logout } = useAuth()
  const isTeacher = canAccess(role, ['teacher', 'admin', 'super_admin'])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : '/courses')
    setOpen(false)
  }

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="mx-auto flex max-w-7xl items-center gap-2 rounded-full border border-blue-100/70 bg-white/90 px-3 py-2 shadow-[var(--shadow-pill)] backdrop-blur-md dark:border-slate-700 dark:bg-[#12233c]/90 sm:gap-3 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="SP Academy হোম">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold text-[var(--color-heading)]">SP Academy</span>
            <span className="hidden text-[11px] font-medium text-[var(--color-muted)] sm:block">Learn Today, Lead Tomorrow</span>
          </span>
        </Link>

        <nav className="ml-2 hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="প্রধান নেভিগেশন">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden items-center md:flex" role="search">
          <label htmlFor="header-search" className="sr-only">
            কোর্স খুঁজুন
          </label>
          <input
            id="header-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="কোর্স খুঁজুন..."
            className="w-36 rounded-full border border-blue-100 bg-[var(--color-page)] px-4 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] lg:w-44 dark:border-slate-700"
          />
          <button type="submit" aria-label="খুঁজুন" className="-ml-9 cursor-pointer rounded-full p-1.5 text-[var(--color-primary)] hover:bg-blue-100">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'লাইট মোডে যান' : 'ডার্ক মোডে যান'}
          className="cursor-pointer rounded-full p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {user ? (
          <>
            <Link to="/dashboard" className="btn-primary hidden !px-4 !py-2 text-sm sm:inline-flex">
              <LayoutDashboard className="h-4 w-4" /> ড্যাশবোর্ড
            </Link>
            {isTeacher && (
              <Link to="/teacher" className="btn-outline hidden !px-4 !py-2 text-sm sm:inline-flex">
                শিক্ষক ড্যাশবোর্ড
              </Link>
            )}
            <Link
              to="/profile"
              aria-label="প্রোফাইল"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-white"
            >
              {(profile?.displayName || user.email || '?').trim().charAt(0).toUpperCase()}
            </Link>
            <button
              onClick={() => void logout()}
              aria-label="লগআউট"
              className="cursor-pointer rounded-full p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary hidden !px-4 !py-2 text-sm sm:inline-flex">
            <LogIn className="h-4 w-4" /> লগইন
          </Link>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
          aria-expanded={open}
          className="cursor-pointer rounded-full p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)] lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-blue-100 bg-white p-4 shadow-[var(--shadow-pill)] lg:hidden dark:border-slate-700 dark:bg-[#12233c]">
          <form onSubmit={submitSearch} className="mb-3 flex gap-2 md:hidden" role="search">
            <label htmlFor="mobile-search" className="sr-only">
              কোর্স খুঁজুন
            </label>
            <input
              id="mobile-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="কোর্স খুঁজুন..."
              className="flex-1 rounded-full border border-blue-100 bg-[var(--color-page)] px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
            />
            <button type="submit" className="btn-primary !px-4 !py-2 text-sm">
              খুঁজুন
            </button>
          </form>
          <nav className="grid gap-1" aria-label="মোবাইল নেভিগেশন">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    isActive ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-primary mt-2 justify-center text-sm">
                  <LayoutDashboard className="h-4 w-4" /> ড্যাশবোর্ড
                </Link>
                {isTeacher && (
                  <Link
                    to="/teacher"
                    onClick={() => setOpen(false)}
                    className="mt-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
                  >
                    শিক্ষক ড্যাশবোর্ড
                  </Link>
                )}
                <Link
                  to="/my-courses"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
                >
                  আমার কোর্স
                </Link>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary mt-2 justify-center text-sm">
                <LogIn className="h-4 w-4" /> লগইন / রেজিস্টার
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
