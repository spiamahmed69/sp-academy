import { Link } from 'react-router-dom'
import {
  BookOpen, Clock,
  PlayCircle, Star, Users,
} from 'lucide-react'
import type { Book, BlogPost, Category, Course, Teacher } from '../data/sample'
import { GRADIENTS, getTeacherById } from '../data/sample'
import { discountPercent, formatBDT, toBanglaDigits } from '../lib/format'
import { SampleBadge } from './ui'
import { BookCoverArt, CATEGORY_ICONS, CourseCoverArt, CoverPattern, TeacherAvatar } from './CoverArt'

export function CategoryTile({ category }: { category: Category }) {
  const Icon = CATEGORY_ICONS[category.icon] ?? BookOpen
  return (
    <Link
      to={`/courses?category=${category.id}`}
      className="group relative block overflow-hidden rounded-3xl p-5 pb-8 text-white shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1.5"
      style={{ background: GRADIENTS[category.gradient] }}
    >
      <CoverPattern />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="relative mt-4 text-lg font-bold text-white">{category.name}</h3>
      <p className="relative mt-1 text-sm text-white/85">{category.description}</p>
      <p className="relative mt-3 text-xs font-bold text-white/90">{toBanglaDigits(category.courseCount)}টি কোর্স (নমুনা)</p>
      <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-3 w-full" aria-hidden="true">
        <path d="M0,12 Q12,2 25,10 T50,8 T75,10 T100,6 L100,12 Z" fill="rgba(255,255,255,0.35)" />
      </svg>
    </Link>
  )
}

export function CourseCard({ course }: { course: Course }) {
  const teacher = getTeacherById(course.instructorId)
  const off = discountPercent(course.price, course.discountPrice)
  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <Link to={`/courses/${course.slug}`} className="relative block h-40 overflow-hidden" aria-label={course.title}>
        <CourseCoverArt course={course} />
        <span className="absolute inset-0 flex flex-col items-start justify-end p-4">
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <PlayCircle className="h-4 w-4" /> {toBanglaDigits(course.lessons)}টি লেসন
          </span>
        </span>
        {off > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">
            {toBanglaDigits(off)}% ছাড়
          </span>
        )}
        {course.isFree && (
          <span className="absolute top-3 right-3 rounded-full bg-green-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">ফ্রি</span>
        )}
        <span className="absolute top-3 left-3">
          <SampleBadge />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[var(--color-primary)]">
            {course.levelBn}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {toBanglaDigits(course.rating)} ({toBanglaDigits(course.reviews)})
          </span>
        </div>
        <h3 className="mt-3 text-[17px] leading-snug font-bold">
          <Link to={`/courses/${course.slug}`} className="hover:text-[var(--color-primary)]">
            {course.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--color-body)]">{course.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--color-body)]">
          <Users className="h-4 w-4" /> {teacher?.name ?? 'নমুনা শিক্ষক'} · {course.students.toLocaleString('bn-BD')} শিক্ষার্থী
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
          <div>
            {course.isFree ? (
              <span className="text-lg font-extrabold text-green-600">ফ্রি</span>
            ) : (
              <>
                <span className="text-lg font-extrabold text-[var(--color-cta-to)]">
                  {formatBDT(course.discountPrice ?? course.price)}
                </span>
                {course.discountPrice && (
                  <span className="ml-2 text-sm text-[var(--color-muted)] line-through">{formatBDT(course.price)}</span>
                )}
              </>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Clock className="h-3.5 w-3.5" /> {toBanglaDigits(course.durationWeeks)} সপ্তাহ
          </span>
        </div>
        <Link to={`/courses/${course.slug}`} className="btn-cta mt-4 w-full !py-2.5 text-sm">
          বিস্তারিত দেখুন
        </Link>
      </div>
    </article>
  )
}

export function TeacherCard({ teacher }: { teacher: Teacher }) {
  return (
    <article className="card card-hover overflow-hidden text-center">
      <div className="flex flex-col items-center px-5 pt-6">
        <TeacherAvatar teacher={teacher} />
        <span className="mt-3">
          <SampleBadge />
        </span>
        <h3 className="mt-2 text-lg font-bold">
          <Link to={`/teachers/${teacher.id}`} className="hover:text-[var(--color-primary)]">
            {teacher.name}
          </Link>
        </h3>
        <p className="text-sm font-semibold text-[var(--color-primary)]">{teacher.subject}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{teacher.qualification}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 py-3 text-center dark:divide-slate-700 dark:border-slate-700">
        <div>
          <p className="text-sm font-extrabold">{toBanglaDigits(teacher.experienceYears)} বছর</p>
          <p className="text-[11px] text-[var(--color-muted)]">অভিজ্ঞতা</p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {toBanglaDigits(teacher.rating)}
          </p>
          <p className="text-[11px] text-[var(--color-muted)]">রেটিং</p>
        </div>
        <div>
          <p className="text-sm font-extrabold">{toBanglaDigits(teacher.courses)}টি</p>
          <p className="text-[11px] text-[var(--color-muted)]">কোর্স</p>
        </div>
      </div>
    </article>
  )
}

export function BookCard({ book }: { book: Book & { coverImageUrl?: string | null } }) {
  const off = discountPercent(book.price, book.discountPrice)
  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <Link to={`/books/${book.id}`} className="relative flex h-44 items-center justify-center overflow-hidden" aria-label={book.title}>
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={`${book.title} — বইয়ের প্রচ্ছদ`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <BookCoverArt book={book} />
        )}
        {off > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">
            {toBanglaDigits(off)}% ছাড়
          </span>
        )}
        <span className="absolute top-3 left-3">
          <SampleBadge />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[16px] leading-snug font-bold">
          <Link to={`/books/${book.id}`} className="hover:text-[var(--color-primary)]">
            {book.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[var(--color-body)]">{book.author}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {toBanglaDigits(book.rating)} ({toBanglaDigits(book.reviews)} রিভিউ) · {toBanglaDigits(book.pages)} পৃষ্ঠা
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
          <div>
            <span className="text-lg font-extrabold text-[var(--color-cta-to)]">{formatBDT(book.discountPrice ?? book.price)}</span>
            {book.discountPrice && (
              <span className="ml-2 text-sm text-[var(--color-muted)] line-through">{formatBDT(book.price)}</span>
            )}
          </div>
          <span className={`text-xs font-bold ${book.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {book.stock > 0 ? 'স্টকে আছে' : 'স্টক শেষ'}
          </span>
        </div>
        <Link to={`/books/${book.id}`} className="btn-primary mt-4 w-full !py-2.5 text-sm">
          বিস্তারিত দেখুন
        </Link>
      </div>
    </article>
  )
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="card card-hover overflow-hidden">
      <Link to={`/blog/${post.slug}`} className="relative block h-36 overflow-hidden p-5" style={{ background: GRADIENTS[post.gradient] }} aria-label={post.title}>
        <CoverPattern />
        <span className="relative inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">{post.category}</span>
      </Link>
      <div className="p-5">
        <p className="text-xs text-[var(--color-muted)]">
          {post.date} · {toBanglaDigits(post.readMin)} মিনিট পড়া
        </p>
        <h3 className="mt-2 text-[17px] leading-snug font-bold">
          <Link to={`/blog/${post.slug}`} className="hover:text-[var(--color-primary)]">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-body)]">{post.excerpt}</p>
        <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">{post.author}</p>
      </div>
    </article>
  )
}
