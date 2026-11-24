import { useQuery } from '@tanstack/react-query'
import { courses, type Course } from '../data/sample'
import { fakeDelay } from '../lib/format'
import { CourseCard } from '../components/cards'
import { EmptyState, ErrorState, PageHero, SkeletonCard } from '../components/ui'

async function fetchFreeCourses(): Promise<Course[]> {
  await fakeDelay(500)
  return courses.filter((c) => c.isFree)
}

export default function FreeCourses() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['free-courses'], queryFn: fetchFreeCourses })

  return (
    <div>
      <PageHero
        eyebrow="ফ্রি কোর্স"
        title="সম্পূর্ণ ফ্রি কোর্স"
        subtitle="কোনো পেমেন্ট ছাড়াই শুরু করুন — ফ্রি কোর্সগুলো নমুনা, আসল ফ্রি কনটেন্ট Phase 2-এ আসবে।"
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
        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState title="এখন কোনো ফ্রি কোর্স নেই" message="নতুন ফ্রি কোর্স যুক্ত হলে এখানে দেখা যাবে।" />
        )}
        {!isLoading && !isError && data && data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
