import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
        <SearchX className="h-10 w-10 text-[var(--color-primary)]" />
      </span>
      <h1 className="mt-6 text-5xl font-extrabold">৪০৪</h1>
      <h2 className="mt-2 text-2xl font-bold">এই পেজটি পাওয়া যায়নি</h2>
      <p className="mt-3 leading-relaxed text-[var(--color-body)]">
        লিংকটি ভুল হতে পারে, অথবা পেজটি সরিয়ে নেওয়া হয়েছে। হোমপেজে ফিরে গিয়ে আবার চেষ্টা করুন।
      </p>
      <Link to="/" className="btn-cta mt-6">
        <Home className="h-4 w-4" /> হোমপেজে যান
      </Link>
    </div>
  )
}
