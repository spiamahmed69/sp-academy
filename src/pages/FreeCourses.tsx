import { useMemo } from 'react'
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
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {free.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
