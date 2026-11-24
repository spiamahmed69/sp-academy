import { Link } from 'react-router-dom'
import { Facebook, GraduationCap, Mail, MapPin, Youtube } from 'lucide-react'

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

function WaveTop() {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="wave-bottom" aria-hidden="true">
      <path
        d="M0,60 C240,10 480,90 720,55 C960,20 1200,80 1440,45 L1440,90 L0,90 Z"
        fill="#caeeff"
      />
      <path
        d="M0,75 C240,35 480,95 720,70 C960,45 1200,90 1440,60 L1440,90 L0,90 Z"
        fill="#1e9ff2"
        opacity="0.55"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="mt-16">
      <WaveTop />
      <div className="bg-[var(--color-footer)] text-blue-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-footer)]">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span className="text-xl font-extrabold text-white">SP Academy</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-blue-200">Learn Today, Lead Tomorrow.</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-200">
              বাংলাদেশের শিক্ষার্থীদের জন্য অনলাইন শিক্ষা প্ল্যাটফর্ম — কোর্স, লাইভ ক্লাস, পরীক্ষা, বই ও AI
              স্টাডি সহায়তা এক জায়গায়।
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-blue-200">
              <MapPin className="h-4 w-4 shrink-0" /> ঢাকা, বাংলাদেশ
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-blue-200">
              <Mail className="h-4 w-4 shrink-0" /> যোগাযোগের ইমেইল শীঘ্রই যুক্ত হচ্ছে
            </p>
            <div className="mt-4 flex gap-2">
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="ফেসবুক" className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-white/20">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="ইউটিউব" className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-white/20">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-base font-bold text-white">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-blue-200 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-blue-300 sm:flex-row sm:px-6 lg:px-8">
            <p>© ২০২৬ SP Academy — সর্বস্বত্ব সংরক্ষিত।</p>
            <p>Phase 1: পাবলিক ওয়েবসাইট ও ডিজাইন সিস্টেম (নমুনা কনটেন্ট)।</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
