import { Link } from 'react-router-dom'
import { categories } from '../data/sample'
import { CategoryTile } from '../components/cards'
import { PageHero } from '../components/ui'

export default function Categories() {
  return (
    <div>
      <PageHero
        eyebrow="ক্যাটাগরি"
        title="কোর্স ক্যাটাগরি"
        subtitle="আপনার লক্ষ্য অনুযায়ী ক্যাটাগরি বেছে নিয়ে কোর্স খুঁজুন। কোর্সের সংখ্যা নমুনা।"
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryTile key={c.id} category={c} />
          ))}
        </div>
        <div className="min-h-10 flex-1" aria-hidden="true" />
        <div className="rounded-3xl bg-[var(--color-primary-soft)] p-6 text-center sm:p-8">
          <h2 className="text-xl font-extrabold">ক্যাটাগরি বেছে নিতে পারছেন না?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-body)]">
            সব কোর্স একসাথে দেখুন, অথবা AI সহায়ককে জিজ্ঞেস করুন কোন ক্যাটাগরি আপনার জন্য ভালো হবে।
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/courses" className="btn-primary text-sm">
              সব কোর্স দেখুন
            </Link>
            <Link to="/ai-assistant" className="btn-outline bg-white text-sm">
              AI সহায়ককে জিজ্ঞেস করুন
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
