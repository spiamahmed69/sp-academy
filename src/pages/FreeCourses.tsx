import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCourses } from '../hooks/useCourses'
import { CourseCard } from '../components/cards'
import { EmptyState, ErrorState, PageHero, SkeletonCard } from '../components/ui'

export default function FreeCourses() {
  const { data, isLoading, isError, refetch } = useCourses()
  const free = useMemo(() => (data?.courses ?? []).filter((c) => c.isFree), [data])
  const source = data?.source ?? 'sample'

  return (
    <div>
      <PageHero
        eyebrow="ফ্রি কোর্স"
        title="সম্পূর্ণ ফ্রি কোর্স"
        subtitle={
          source === 'firestore'
            ? 'কোনো পেমেন্ট ছাড়াই শুরু করুন — লগইন করে ফ্রি কোর্সে ভর্তি হোন।'
            : 'কোনো পেমেন্ট ছাড়াই শুরু করুন — ফ্রি কোর্সগুলো নমুনা, ডেমো ভর্তি এই ব্রাউজারেই সংরক্ষিত হবে।'
        }
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="ফ্রি কোর্স লোড হচ্ছে">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && (!free || free.length === 0) && (
          <EmptyState title="এখন কোনো ফ্রি কোর্স নেই" message="নতুন ফ্রি কোর্স যুক্ত হলে এখানে দেখা যাবে।" />
        )}
        {!isLoading && !isError && free && free.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {free.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
        <div className="min-h-10 flex-1" aria-hidden="true" />
        <div className="rounded-3xl bg-[var(--color-primary-soft)] p-6 text-center sm:p-8">
          <h2 className="text-xl font-extrabold">আরও শিখতে চান?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-body)]">
            সব কোর্স দেখুন, অথবা AI সহায়ককে জিজ্ঞেস করুন পরের ধাপে কোন কোর্স করবেন।
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
          </>
        )}
        </div>
      </div>
    </div>
  )
}
