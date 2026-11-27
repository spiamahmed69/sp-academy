import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, LayoutDashboard, LogIn, LogOut, Menu, Moon, Search, ShoppingCart, Sun, UserPlus, X } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from '../hooks/useNotifications'
import { formatNotificationTime } from '../firebase/notifications'
import { toBanglaDigits } from '../lib/format'
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
  { to: '/ai-assistant', label: 'AI সহকারী' },
]

export default function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { user, profile, role, logout } = useAuth()
  const { count: cartCount } = useCart()
  const notificationsQ = useNotifications()
  const unread = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const isDemoNotifications = notificationsQ.data?.source === 'sample'
  const latestNotifications = (notificationsQ.data?.notifications ?? []).slice(0, 5)
  const isTeacher = canAccess(role, ['teacher', 'admin', 'super_admin'])
  const isAdmin = canAccess(role, ['admin', 'super_admin'])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : '/courses')
    setOpen(false)
  }

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 rounded-[24px] border border-blue-100/70 bg-white px-2 py-2 shadow-[var(--shadow-pill)] sm:gap-3 sm:px-4 dark:border-slate-700 dark:bg-[#12233c]">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="SP Academy হোম">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f6bff] to-[#2563eb] text-base font-extrabold text-white shadow-md sm:h-10 sm:w-10 sm:text-lg" aria-hidden="true">
            SP
          </span>
          <span className="leading-tight">
            <span className="block text-base sm:text-[17px] font-extrabold text-[var(--color-heading)]">SP Academy</span>
            <span className="hidden text-[11px] font-medium text-[var(--color-muted)] sm:block">Learn Today, Lead Tomorrow</span>
          </span>
        </Link>

        <nav className="ml-1 hidden flex-1 items-center justify-center gap-0.5 xl:flex" aria-label="প্রধান নেভিগেশন">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                    : 'text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden items-center 2xl:flex" role="search">
          <label htmlFor="header-search" className="sr-only">
            কোর্স খুঁজুন
          </label>
          <input
            id="header-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="কোর্স খুঁজুন..."
            className="w-28 rounded-full border border-blue-100 bg-[var(--color-page)] px-4 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] 2xl:w-36 dark:border-slate-700"
          />
          <button type="submit" aria-label="খুঁজুন" className="-ml-9 cursor-pointer rounded-full p-1.5 text-[var(--color-primary)] hover:bg-blue-100">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <Link to="/cart" aria-label={`কার্ট — ${toBanglaDigits(cartCount)}টি আইটেম`} className="relative cursor-pointer rounded-full p-1.5 sm:p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cta-to)] px-1 text-[11px] font-extrabold text-white">
              {toBanglaDigits(cartCount)}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            aria-label={`নোটিফিকেশন — ${unread}টি অপঠিত`}
            aria-expanded={bellOpen}
            className="relative cursor-pointer rounded-full p-1.5 sm:p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cta-to)] px-1 text-[11px] font-extrabold text-white">
                {unread > 9 ? '৯+' : unread.toLocaleString('bn-BD')}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-blue-100 bg-white p-3 shadow-[var(--shadow-pill)] dark:border-slate-700 dark:bg-[#12233c]">
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="text-sm font-bold text-[var(--color-heading)]">
                  নোটিফিকেশন {isDemoNotifications && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">নমুনা</span>}
                </p>
                <Link to="/notifications" onClick={() => setBellOpen(false)} className="text-xs font-bold text-[var(--color-primary)] underline">
                  সব দেখুন
                </Link>
              </div>
              {notificationsQ.isPending ? (
                <p className="px-2 py-4 text-sm text-[var(--color-muted)]">লোড হচ্ছে...</p>
              ) : latestNotifications.length === 0 ? (
                <p className="px-2 py-4 text-sm text-[var(--color-muted)]">এখনো কোনো নোটিফিকেশন নেই।</p>
              ) : (
                <ul className="divide-y divide-blue-100 dark:divide-slate-800">
                  {latestNotifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        to={n.link ?? '/notifications'}
                        onClick={() => {
                          if (!n.read) markRead.mutate(n.id)
                          setBellOpen(false)
                        }}
                        className="block rounded-2xl px-2 py-2.5 hover:bg-[var(--color-primary-soft)]"
                      >
                        <p className={`text-sm ${n.read ? 'font-medium text-[var(--color-body)]' : 'font-bold text-[var(--color-heading)]'}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]">{n.body}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{formatNotificationTime(n.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'লাইট মোডে যান' : 'ডার্ক মোডে যান'}
          className="cursor-pointer rounded-full p-1.5 sm:p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
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
            {isAdmin && (
              <Link to="/admin" className="btn-outline hidden !px-4 !py-2 text-sm sm:inline-flex">
                অ্যাডমিন
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
              className="cursor-pointer rounded-full p-1.5 sm:p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-primary hidden shrink-0 !px-4 !py-2 text-sm sm:inline-flex">
              <LogIn className="h-4 w-4" /> লগইন
            </Link>
            <Link to="/register" className="btn-cta hidden shrink-0 !px-4 !py-2 text-sm sm:inline-flex">
              <UserPlus className="h-4 w-4" /> ভর্তি হোন
            </Link>
          </>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
          aria-expanded={open}
          className="cursor-pointer rounded-full p-1.5 sm:p-2 text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)] xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-blue-100 bg-white p-4 shadow-[var(--shadow-pill)] xl:hidden dark:border-slate-700 dark:bg-[#12233c]">
          <form onSubmit={submitSearch} className="mb-3 flex gap-2 xl:hidden" role="search">
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
                    isActive ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
            >
              নোটিফিকেশন
              {unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cta-to)] px-1.5 text-[11px] font-extrabold text-white">
                  {unread.toLocaleString('bn-BD')}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Link to="/cart" onClick={() => setOpen(false)} className="mt-1 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]">
                  আমার কার্ট
                  {cartCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cta-to)] px-1.5 text-[11px] font-extrabold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/my-orders" onClick={() => setOpen(false)} className="mt-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]">
                  আমার অর্ডার
                </Link>
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
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]"
                  >
                    অ্যাডমিন
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
              <>
                <Link to="/cart" onClick={() => setOpen(false)} className="mt-1 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-primary-soft)]">
                  আমার কার্ট
                  {cartCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cta-to)] px-1.5 text-[11px] font-extrabold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary mt-2 justify-center text-sm">
                  <LogIn className="h-4 w-4" /> লগইন / রেজিস্টার
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
