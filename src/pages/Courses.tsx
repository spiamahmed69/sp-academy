import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, CheckCircle2, Clock, GraduationCap, Heart, PlayCircle, Share2,
  ShoppingCart, Star, Users,
} from 'lucide-react'
import { categories, courses, coursesByTeacher, getCourseBySlug, getTeacherById, type Course } from '../data/sample'
import { fakeDelay, formatBDT } from '../lib/format'
import { useToast } from '../lib/toast'
import { CourseCard } from '../components/cards'
import { Breadcrumbs, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

async function fetchCourses(): Promise<Course[]> {
  await fakeDelay(600)
  return courses
}

export default function Courses() {
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState(params.get('category') ?? 'all')
  const [level, setLevel] = useState('all')
  const [sort, setSort] = useState('popular')
  const [query, setQuery] = useState(params.get('q') ?? '')
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })

  const filtered = useMemo(() => {
    let list = data ?? []
    if (category !== 'all') list = list.filter((c) => c.categoryId === category)
    if (level !== 'all') list = list.filter((c) => c.level === level)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    }
    const sorted = [...list]
    if (sort === 'price-low') sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price))
    if (sort === 'price-high') sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price))
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    if (sort === 'popular') sorted.sort((a, b) => b.students - a.students)
    return sorted
  }, [data, category, level, query, sort])

  const applyCategory = (id: string) => {
    setCategory(id)
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('category')
    else next.set('category', id)
    setParams(next, { replace: true })
  }

  return (
    <div>
      <PageHero
        eyebrow="কোর্সসমূহ"
        title="সব কোর্স"
        subtitle="এসএসসি থেকে চাকরির প্রস্তুতি — সব কোর্স নমুনা, দাম নমুনা হিসেবে দেখানো হয়েছে।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label htmlFor="course-search" className="sr-only">
            কোর্স খুঁজুন
          </label>
          <input
            id="course-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="কোর্সের নাম লিখুন..."
            className="flex-1 rounded-full border border-blue-100 bg-white px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]"
          />
          <div className="flex flex-wrap gap-2">
            <label htmlFor="level-filter" className="sr-only">
              লেভেল
            </label>
            <select id="level-filter" value={level} onChange={(e) => setLevel(e.target.value)} className="cursor-pointer rounded-full border border-blue-100 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-[#12233c]">
              <option value="all">সব লেভেল</option>
              <option value="Beginner">প্রাথমিক</option>
              <option value="Intermediate">মধ্যম</option>
              <option value="Advanced">উন্নত</option>
            </select>
            <label htmlFor="sort" className="sr-only">
              সাজান
            </label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer rounded-full border border-blue-100 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-[#12233c]">
              <option value="popular">জনপ্রিয়তা</option>
              <option value="rating">রেটিং</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
            </select>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist" aria-label="ক্যাটাগরি ফিল্টার">
          <button onClick={() => applyCategory('all')} className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-[var(--color-heading)] shadow-sm dark:bg-[#12233c]'}`}>
            সবগুলো
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => applyCategory(c.id)} className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold ${category === c.id ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-[var(--color-heading)] shadow-sm dark:bg-[#12233c]'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="কোর্স লোড হচ্ছে">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title="কোনো কোর্স পাওয়া যায়নি"
            message="আপনার খোঁজা নাম বা ফিল্টারের সঙ্গে মিলে এমন কোনো নমুনা কোর্স নেই। ফিল্টার বদলে আবার চেষ্টা করুন।"
            action={
              <button
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                  setLevel('all')
                }}
                className="btn-primary cursor-pointer text-sm"
              >
                ফিল্টার মুছে ফেলুন
              </button>
            }
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <p className="mb-4 text-sm text-[var(--color-body)]">{filtered.length}টি কোর্স পাওয়া গেছে (নমুনা)</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function CourseDetails() {
  const { slug } = useParams()
  const { push } = useToast()
  const course = slug ? getCourseBySlug(slug) : undefined

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title="কোর্সটি পাওয়া যায়নি"
          message="এই লিংকের কোনো নমুনা কোর্স নেই। কোর্সের তালিকা থেকে সঠিক কোর্স বেছে নিন।"
        />
        <div className="mt-6 text-center">
          <Link to="/courses" className="btn-primary text-sm">
            সব কোর্স দেখুন
          </Link>
        </div>
      </div>
    )
  }

  const teacher = getTeacherById(course.instructorId)
  const related = coursesByTeacher(course.instructorId).filter((c) => c.id !== course.id)

  const enroll = () => push('ভর্তি ও পেমেন্ট Phase 2-এ চালু হবে — এটি ডেমো পেজ।', 'info')
  const wishlist = () => push('উইশলিস্টে যোগ হয়েছে (ডেমো) — লগইনের পর সংরক্ষিত হবে।', 'success')

  return (
    <div>
      <div className="hero-wave border-b border-blue-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'কোর্সসমূহ', to: '/courses' }, { label: course.title }]} />
          <div className="flex flex-wrap items-center gap-2">
            <SampleBadge />
            {course.hasPreview && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <PlayCircle className="h-3.5 w-3.5" /> ফ্রি প্রিভিউ লেসন আছে
              </span>
            )}
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-[var(--color-body)]">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-body)]">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {course.rating} ({course.reviews} রিভিউ)
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {course.students.toLocaleString('en-IN')} শিক্ষার্থী
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {course.durationWeeks} সপ্তাহ · {course.lessons} লেসন
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> {course.language} · {course.levelBn}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-extrabold">কোর্সের অধ্যায়সমূহ</h2>
          <div className="mt-4 space-y-4">
            {course.chapters.map((ch, i) => (
              <div key={ch.title} className="card p-5">
                <h3 className="font-bold">
                  অধ্যায় {i + 1}: {ch.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {ch.lessons.map((lesson) => (
                    <li key={lesson} className="flex items-center gap-2 text-sm text-[var(--color-body)]">
                      <PlayCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" /> {lesson}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-extrabold">শিক্ষক</h2>
          {teacher && (
            <div className="card mt-4 flex items-center gap-4 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-extrabold text-white">
                {teacher.initials}
              </span>
              <div className="min-w-0 flex-1">
                <Link to={`/teachers/${teacher.id}`} className="font-bold hover:text-[var(--color-primary)]">
                  {teacher.name}
                </Link>
                <p className="text-sm text-[var(--color-body)]">
                  {teacher.subject} · {teacher.experienceYears} বছরের অভিজ্ঞতা (নমুনা)
                </p>
              </div>
              <Link to={`/teachers/${teacher.id}`} className="btn-outline shrink-0 text-sm">
                প্রোফাইল
              </Link>
            </div>
          )}

          {related.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-extrabold">একই শিক্ষকের আরও কোর্স</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {related.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="flex items-baseline gap-2">
              {course.isFree ? (
                <span className="text-3xl font-extrabold text-green-600">ফ্রি</span>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-[var(--color-cta-to)]">
                    {formatBDT(course.discountPrice ?? course.price)}
                  </span>
                  {course.discountPrice && (
                    <span className="text-lg text-[var(--color-muted)] line-through">{formatBDT(course.price)}</span>
                  )}
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)]">নমুনা দাম — আসল পেমেন্ট Phase 2-এ চালু হবে।</p>
            <button onClick={enroll} className="btn-cta mt-5 w-full">
              <ShoppingCart className="h-4 w-4" /> {course.isFree ? 'ফ্রি ভর্তি হোন' : 'এখনই ভর্তি হোন'}
            </button>
            <button onClick={wishlist} className="btn-outline mt-3 w-full">
              <Heart className="h-4 w-4" /> উইশলিস্টে রাখুন
            </button>
            <button onClick={() => push('লিংক কপি হয়েছে (ডেমো)।', 'success')} className="btn-outline mt-3 w-full">
              <Share2 className="h-4 w-4" /> শেয়ার করুন
            </button>
            <ul className="mt-6 space-y-2.5 text-sm text-[var(--color-body)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> {course.lessons}টি ভিডিও লেসন
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> PDF নোট ও রিসোর্স
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> মডেল টেস্ট ও সার্টিফিকেট
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[var(--color-primary)]" /> যেকোনো ডিভাইসে শেখা যায়
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
