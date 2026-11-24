/**
 * Footer — dark navy (#01367F) with readable white text.
 *
 * Structure follows the reference site's footer pattern (dark navy wavy
 * footer, brand + link columns + social icons + payment strip + bottom
 * bar) with SP Academy's own branding, links and text — nothing copied
 * from the reference (no copied text, logo, teachers or phone).
 *
 * Honesty: there is no real SP Academy phone, email or social page yet,
 * so no contact line is invented — social icons show a plain
 * "শীঘ্রই যুক্ত হচ্ছে" toast instead of linking to generic homepages,
 * and the payment strip lists only the methods checkout actually offers
 * (labels only, no payment integration here).
 */
import { Link } from 'react-router-dom'
import { Facebook, GraduationCap, Instagram, MapPin, Youtube } from 'lucide-react'
import { useToast } from '../lib/toast'

const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'কোর্স',
    links: [
      { to: '/courses', label: 'সব কোর্স' },
      { to: '/free-courses', label: 'ফ্রি কোর্স' },
      { to: '/live-classes', label: 'লাইভ ক্লাস' },
      { to: '/exams', label: 'পরীক্ষা' },
      { to: '/results', label: 'ফলাফল' },
    ],
  },
  {
    title: 'প্ল্যাটফর্ম',
    links: [
      { to: '/teachers', label: 'শিক্ষকবৃন্দ' },
      { to: '/books', label: 'বইয়ের দোকান' },
      { to: '/blog', label: 'ব্লগ' },
      { to: '/about', label: 'আমাদের সম্পর্কে' },
      { to: '/contact', label: 'যোগাযোগ' },
    ],
  },
  {
    title: 'সহায়তা',
    links: [
      { to: '/faq', label: 'সাধারণ জিজ্ঞাসা' },
      { to: '/privacy', label: 'গোপনীয়তা নীতি' },
      { to: '/terms', label: 'শর্তাবলি' },
      { to: '/refund', label: 'রিফান্ড নীতি' },
      { to: '/login', label: 'লগইন' },
    ],
  },
]

const PAYMENT_METHODS = ['বিকাশ', 'নগদ', 'কার্ড', 'ক্যাশ অন ডেলিভারি']

const SOCIALS = [
  { label: 'ফেসবুক', icon: Facebook },
  { label: 'ইউটিউব', icon: Youtube },
  { label: 'ইনস্টাগ্রাম', icon: Instagram },
]

function WaveTop() {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="wave-bottom" aria-hidden="true">
      <path d="M0,60 C240,10 480,90 720,55 C960,20 1200,80 1440,45 L1440,90 L0,90 Z" fill="#caeeff" />
      <path d="M0,75 C240,35 480,95 720,70 C960,45 1200,90 1440,60 L1440,90 L0,90 Z" fill="#1e9ff2" opacity="0.55" />
    </svg>
  )
}

export default function Footer() {
  const { push } = useToast()

  return (
    <footer className="mt-16">
      <WaveTop />
      {/* Explicit hex background (not a var-based utility) so the navy
          footer can never render white-on-white. */}
      <div className="bg-[#01367f] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#01367f]">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-xl leading-tight font-extrabold text-white">SP Academy</span>
                <span className="block text-[11px] font-medium text-blue-200">Learn Today, Lead Tomorrow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
              বাংলাদেশের শিক্ষার্থীদের জন্য অনলাইন শিক্ষা প্ল্যাটফর্ম — কোর্স, লাইভ ক্লাস, পরীক্ষা, বই ও AI
              স্টাডি সহায়তা এক জায়গায়।
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-blue-100">
              <MapPin className="h-4 w-4 shrink-0" /> ঢাকা, বাংলাদেশ
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => push(`${s.label} পেজ শীঘ্রই যুক্ত হচ্ছে।`, 'info')}
                  aria-label={`${s.label} (শীঘ্রই আসছে)`}
                  title={`${s.label} — শীঘ্রই যুক্ত হচ্ছে`}
                  className="cursor-pointer rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
                >
                  <s.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-base font-bold text-white">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-blue-100 transition-colors hover:text-white hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p className="shrink-0 text-xs font-bold tracking-wide text-blue-200 uppercase">পেমেন্টের মাধ্যম</p>
            <ul className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <li
                  key={m}
                  className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white"
                >
                  {m}
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-blue-200">অনলাইন পেমেন্ট সার্ভার-সাইড যাচাইসহ চালু হবে।</p>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-blue-200 sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <p>© ২০২৬ SP Academy — সর্বস্বত্ব সংরক্ষিত।</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="আইনি লিংক">
              <Link to="/privacy" className="transition-colors hover:text-white hover:underline">
                গোপনীয়তা নীতি
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white hover:underline">
                শর্তাবলি
              </Link>
              <Link to="/refund" className="transition-colors hover:text-white hover:underline">
                রিফান্ড নীতি
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
