import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, CheckCircle2, Circle, Clock, GraduationCap, Heart, Loader2, Lock,
  PlayCircle, Share2, ShoppingCart, Star, Users,
} from 'lucide-react'
import { categories, coursesByTeacher, getTeacherById } from '../data/sample'
import { formatBDT } from '../lib/format'
import { useToast } from '../lib/toast'
import { useAuth } from '../contexts/AuthContext'
import { getFirebase } from '../firebase/config'
import type { LessonView } from '../firebase/courses'
import {
  addDemoEnrollment,
  computeProgressPercent,
  enrollFreeCourse,
  getEnrollment,
  isDemoEnrolled,
  readDemoEnrollments,
  toggleDemoLessonComplete,
  toggleLessonComplete,
} from '../firebase/enrollments'
import { useCourseBySlug, useCourses, useCourseLessons } from '../hooks/useCourses'
import { CourseCard } from '../components/cards'
import { Breadcrumbs, DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

export default function Courses() {
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState(params.get('category') ?? 'all')
  const [level, setLevel] = useState('all')
  const [sort, setSort] = useState('popular')
  const [query, setQuery] = useState(params.get('q') ?? '')
  const { data, isLoading, isError, refetch } = useCourses()

  const list = data?.courses ?? []
  const source = data?.source ?? 'sample'

  const filtered = useMemo(() => {
    let result = list
    if (category !== 'all') result = result.filter((c) => c.categoryId === category)
    if (level !== 'all') result = result.filter((c) => c.level === level)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    }
    const sorted = [...result]
    if (sort === 'price-low') sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price))
    if (sort === 'price-high') sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price))
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    if (sort === 'popular') sorted.sort((a, b) => b.students - a.students)
    return sorted
  }, [list, category, level, query, sort])

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
        subtitle={
          source === 'firestore'
            ? 'এসএসসি থেকে চাকরির প্রস্তুতি — লাইভ কোর্স তালিকা।'
            : 'এসএসসি থেকে চাকরির প্রস্তুতি — সব কোর্স নমুনা, দাম নমুনা হিসেবে দেখানো হয়েছে।'
        }
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
            message="আপনার খোঁজা নাম বা ফিল্টারের সঙ্গে মিলে এমন কোনো কোর্স নেই। ফিল্টার বদলে আবার চেষ্টা করুন।"
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
            <p className="mb-4 text-sm text-[var(--color-body)]">
              {filtered.length}টি কোর্স পাওয়া গেছে{source === 'sample' ? ' (নমুনা)' : ''}
            </p>
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
  const navigate = useNavigate()
  const { push } = useToast()
  const { user, configured } = useAuth()
  const { data: course, isLoading, isError, refetch } = useCourseBySlug(slug)
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(course ?? null)

  // ---- Enrollment state: Firestore when configured + signed in, demo localStorage otherwise ----
  const { data: enrollment, refetch: refetchEnrollment } = useQuery({
    queryKey: ['enrollment', user?.uid, course?.id],
    queryFn: async () => {
      const fb = getFirebase()
      if (!fb || !user || !course) return null
      return getEnrollment(fb.db, user.uid, course.id)
    },
    enabled: configured && Boolean(user) && Boolean(course),
  })
  const [demoEnrolled, setDemoEnrolled] = useState(false)
  const [demoCompleted, setDemoCompleted] = useState<string[]>([])
  const [enrollBusy, setEnrollBusy] = useState(false)
  const [toggleBusy, setToggleBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!course || configured) return
    setDemoEnrolled(isDemoEnrolled(course.id))
    setDemoCompleted(readDemoEnrollments().find((e) => e.courseId === course.id)?.completedLessonIds ?? [])
  }, [course, configured])

  // Group the flat lesson list back into chapters (before any early return —
  // hooks must run in the same order on every render).
  const groupedLessons = useMemo(() => {
    const groups: { title: string; lessons: LessonView[] }[] = []
    for (const lesson of lessons) {
      const existing = groups.find((g) => g.title === lesson.chapterTitle)
      if (existing) existing.lessons.push(lesson)
      else groups.push({ title: lesson.chapterTitle, lessons: [lesson] })
    }
    return groups
  }, [lessons])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="কোর্স লোড হচ্ছে">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState onRetry={() => refetch()} />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title="কোর্সটি পাওয়া যায়নি"
          message="এই লিংকের কোনো কোর্স নেই। কোর্সের তালিকা থেকে সঠিক কোর্স বেছে নিন।"
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
  const enrolled = configured ? Boolean(enrollment) : demoEnrolled
  const completedIds = configured ? (enrollment?.completedLessonIds ?? []) : demoCompleted
  const totalLessons = lessons.length > 0 ? lessons.length : course.lessons
  const progress = computeProgressPercent(completedIds.length, totalLessons)

  const enroll = async () => {
    if (!course.isFree) {
      push('পেমেন্ট Phase 8-এ আসছে — এই কোর্সে এখন ভর্তি করা যাচ্ছে না। ভর্তি চালু হলে জানানো হবে।', 'info')
      return
    }
    if (configured && !user) {
      push('ফ্রি কোর্সে ভর্তি হতে আগে লগইন করুন।', 'info')
      navigate('/login', { state: { from: `/courses/${course.slug}` } })
      return
    }
    setEnrollBusy(true)
    try {
      if (configured && user) {
        const fb = getFirebase()
        if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
        await enrollFreeCourse(fb.db, user.uid, course)
        await refetchEnrollment()
        push(`"${course.title}" কোর্সে ভর্তি হয়েছেন — শুভকামনা!`, 'success')
      } else {
        addDemoEnrollment(course.id)
        setDemoEnrolled(true)
        setDemoCompleted([])
        push('ডেমো ভর্তি হয়েছে — এটি শুধু এই ব্রাউজারে সংরক্ষিত। Firebase সেটআপের পর আসল ভর্তি চালু হবে।', 'success')
      }
    } catch (err) {
      push(err instanceof Error ? err.message : 'ভর্তি করা যায়নি। আবার চেষ্টা করুন।', 'error')
    } finally {
      setEnrollBusy(false)
    }
  }

  const wishlist = () => push('উইশলিস্টে যোগ হয়েছে (ডেমো) — লগইনের পর সংরক্ষিত হবে।', 'success')

  const openLesson = (lesson: LessonView) => {
    if (lesson.isPreview || enrolled) {
      push('ভিডিও প্লেয়ার Phase 4-এ আসছে — এই লেসনটি এখনো দেখা যাবে না।', 'info')
    } else {
      push('এই লেসন দেখতে কোর্সে ভর্তি হতে হবে।', 'info')
    }
  }

  const toggleLesson = async (lesson: LessonView) => {
    if (!enrolled) return
    setToggleBusy(lesson.id)
    try {
      if (configured && user) {
        const fb = getFirebase()
        if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
        await toggleLessonComplete(fb.db, user.uid, course.id, lesson.id, totalLessons)
        await refetchEnrollment()
      } else {
        const next = toggleDemoLessonComplete(course.id, lesson.id)
        setDemoCompleted(next.find((e) => e.courseId === course.id)?.completedLessonIds ?? [])
      }
    } catch (err) {
      push(err instanceof Error ? err.message : 'আপডেট করা যায়নি।', 'error')
    } finally {
      setToggleBusy(null)
    }
  }

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
            {enrolled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary)]">
                <CheckCircle2 className="h-3.5 w-3.5" /> ভর্তি হয়েছেন
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
          {!configured && (
            <DemoNotice>
              ডেমো মোড — Firebase এখনো কনফিগার করা হয়নি। ফ্রি কোর্সে ভর্তি এখানে ডেমো হিসেবে এই ব্রাউজারেই
              সংরক্ষিত হবে; পেইড কোর্সে ভর্তি Phase 8-এ (পেমেন্ট) চালু হবে।
            </DemoNotice>
          )}

          {enrolled && (
            <div className="card mb-6 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-extrabold">আপনার অগ্রগতি</h2>
                <span className="text-sm font-bold text-[var(--color-primary)]">
                  {completedIds.length}/{totalLessons} লেসন · {progress}%
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`অগ্রগতি ${progress}%`}>
                <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                লেসন শেষ হলে পাশের টিক চিহ্ন দিন — অগ্রগতি{configured ? ' আপনার অ্যাকাউন্টে' : ' এই ব্রাউজারে (ডেমো)'} সংরক্ষিত হবে।
              </p>
            </div>
          )}

          <h2 className="text-xl font-extrabold">কোর্সের অধ্যায়সমূহ</h2>
          {lessonsLoading ? (
            <div className="mt-4 grid gap-4" aria-busy="true" aria-label="লেসন লোড হচ্ছে">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : groupedLessons.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-muted)]">এই কোর্সের সিলেবাস শীঘ্রই যুক্ত হবে।</p>
          ) : (
            <div className="mt-4 space-y-4">
              {groupedLessons.map((group, i) => (
                <div key={group.title} className="card p-5">
                  <h3 className="font-bold">
                    অধ্যায় {i + 1}: {group.title}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {group.lessons.map((lesson) => {
                      const done = completedIds.includes(lesson.id)
                      const locked = !lesson.isPreview && !enrolled
                      return (
                        <li key={lesson.id} className="flex items-center gap-2 text-sm">
                          {enrolled ? (
                            <button
                              onClick={() => void toggleLesson(lesson)}
                              disabled={toggleBusy === lesson.id}
                              aria-label={done ? `${lesson.title} — সম্পন্ন হিসেবে চিহ্নিত, সরাতে ক্লিক করুন` : `${lesson.title} — সম্পন্ন হিসেবে চিহ্নিত করুন`}
                              className="cursor-pointer text-[var(--color-primary)] disabled:opacity-50"
                            >
                              {toggleBusy === lesson.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : done ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                          ) : locked ? (
                            <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                          ) : (
                            <PlayCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                          )}
                          <button
                            onClick={() => openLesson(lesson)}
                            className={`min-w-0 flex-1 text-left hover:text-[var(--color-primary)] ${done ? 'text-[var(--color-muted)] line-through' : 'text-[var(--color-body)]'}`}
                          >
                            {lesson.title}
                          </button>
                          {lesson.isPreview && (
                            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              ফ্রি প্রিভিউ
                            </span>
                          )}
                          {locked && <span className="shrink-0 text-xs text-[var(--color-muted)]">ভর্তি প্রয়োজন</span>}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

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
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {course.isFree ? 'সম্পূর্ণ ফ্রি — কোনো পেমেন্ট লাগবে না।' : 'নমুনা দাম — আসল পেমেন্ট Phase 8-এ চালু হবে।'}
            </p>
            {enrolled ? (
              <>
                <Link to="/my-courses" className="btn-primary mt-5 w-full">
                  <PlayCircle className="h-4 w-4" /> শেখা চালিয়ে যান
                </Link>
                <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
                  {configured ? 'আপনি এই কোর্সে ভর্তি আছেন।' : 'ডেমো ভর্তি — শুধু এই ব্রাউজারে সংরক্ষিত।'}
                </p>
              </>
            ) : (
              <button onClick={() => void enroll()} disabled={enrollBusy} className="btn-cta mt-5 w-full disabled:opacity-60">
                {enrollBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}{' '}
                {course.isFree ? 'ফ্রি ভর্তি হোন' : 'এখনই ভর্তি হোন'}
              </button>
            )}
            {!course.isFree && !enrolled && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs leading-relaxed text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                পেইড কোর্সে ভর্তি এখনো চালু হয়নি — পেমেন্ট (বিকাশ/নগদ/কার্ড) Phase 8-এ আসছে।
              </p>
            )}
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
