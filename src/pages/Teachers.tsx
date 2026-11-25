import { Link, useParams } from 'react-router-dom'
import { BookOpen, Star, Users } from 'lucide-react'
import { coursesByTeacher, getTeacherById, GRADIENTS, teachers } from '../data/sample'
import { toBanglaDigits } from '../lib/format'
import { CourseCard, TeacherCard } from '../components/cards'
import { Breadcrumbs, ErrorState, PageHero, SampleBadge } from '../components/ui'

export default function Teachers() {
  return (
    <div>
      <PageHero
        eyebrow="শিক্ষকবৃন্দ"
        title="আমাদের শিক্ষক"
        subtitle="অভিজ্ঞ ও দক্ষ শিক্ষকদের কাছ থেকে শিখুন — সব প্রোফাইল নমুনা।"
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
          <div className="min-h-10 flex-1" aria-hidden="true" />
          <div className="rounded-3xl bg-[var(--color-primary-soft)] p-6 text-center sm:p-8">
            <h2 className="text-xl font-extrabold">সঠিক শিক্ষক খুঁজে পাচ্ছেন না?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-body)]">
              সব কোর্স দেখুন, অথবা AI সহায়ককে জিজ্ঞেস করুন কোন শিক্ষকের কোর্স আপনার জন্য ভালো হবে।
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

export function TeacherProfile() {
  const { id } = useParams()
  const teacher = id ? getTeacherById(id) : undefined

  if (!teacher) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="শিক্ষক পাওয়া যায়নি" message="এই লিংকের কোনো নমুনা শিক্ষক নেই।" />
        <div className="mt-6 text-center">
          <Link to="/teachers" className="btn-primary text-sm">
            সব শিক্ষক দেখুন
          </Link>
        </div>
      </div>
    )
  }

  const taught = coursesByTeacher(teacher.id)

  return (
    <div>
      <div className="hero-wave border-b border-blue-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'শিক্ষকবৃন্দ', to: '/teachers' }, { label: teacher.name }]} />
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold text-white shadow-lg ring-4 ring-white dark:ring-[#12233c]"
              style={{ background: GRADIENTS[teacher.gradient] }}
            >
              {teacher.initials}
            </span>
            <div>
              <span className="mb-2 inline-block">
                <SampleBadge />
              </span>
              <h1 className="text-3xl font-extrabold">{teacher.name}</h1>
              <p className="mt-1 font-semibold text-[var(--color-primary)]">
                {teacher.subject} · {teacher.qualification}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--color-body)]">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {toBanglaDigits(teacher.rating)} রেটিং
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {teacher.students.toLocaleString('bn-BD')} শিক্ষার্থী
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" /> {toBanglaDigits(teacher.courses)}টি কোর্স
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-xl font-extrabold">শিক্ষক সম্পর্কে</h2>
        <p className="card mt-4 p-5 leading-relaxed text-[var(--color-body)]">{teacher.bio}</p>
        <h2 className="mt-10 text-xl font-extrabold">এই শিক্ষকের কোর্স</h2>
        {taught.length === 0 ? (
          <p className="mt-4 text-[var(--color-body)]">এই শিক্ষকের কোনো নমুনা কোর্স এখনো যুক্ত হয়নি।</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {taught.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
        <div className="min-h-10 flex-1" aria-hidden="true" />
        <div className="rounded-3xl bg-[var(--color-primary-soft)] p-6 text-center sm:p-8">
          <h2 className="text-xl font-extrabold">আরও শিক্ষক দেখুন</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-body)]">
            সব শিক্ষকের প্রোফাইল দেখুন, অথবা সব কোর্স থেকে আপনার পছন্দের কোর্স বেছে নিন।
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/teachers" className="btn-primary text-sm">
              সব শিক্ষক দেখুন
            </Link>
            <Link to="/courses" className="btn-outline bg-white text-sm">
              সব কোর্স দেখুন
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
