/**
 * Cover art — original SVG/CSS artwork for course and book covers.
 *
 * There are no real cover photos yet (ImgBB upload arrives with the
 * backend), so covers are designed illustrations, not flat colour
 * blocks: gradient + decorative pattern + subject motif + real title
 * text. Nothing is copied from the reference site — these are SP
 * Academy's own compositions in SP Academy colours.
 */
import {
  BookOpen, Briefcase, Calculator, Code2, FlaskConical, GraduationCap, Languages, Target,
  type LucideIcon,
} from 'lucide-react'
import type { Book, Course, Teacher } from '../data/sample'
import { GRADIENTS, categories } from '../data/sample'

/** Category icon name (from sample data) → Lucide icon. Shared with cards.tsx. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  BookOpen, GraduationCap, Target, Briefcase, Languages, Calculator, FlaskConical, Code2,
}

/** Decorative SVG pattern: soft circles + wave, drawn over a gradient. */
export function CoverPattern() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx="330" cy="30" r="90" fill="rgba(255,255,255,0.14)" />
      <circle cx="360" cy="60" r="55" fill="rgba(255,255,255,0.10)" />
      <circle cx="40" cy="190" r="70" fill="rgba(255,255,255,0.10)" />
      <circle cx="80" cy="30" r="22" fill="rgba(255,255,255,0.12)" />
      <path d="M0,180 C80,150 160,200 240,175 C320,150 370,185 400,170 L400,220 L0,220 Z" fill="rgba(255,255,255,0.12)" />
      <path d="M0,200 C90,175 170,210 260,190 C330,175 380,200 400,190 L400,220 L0,220 Z" fill="rgba(0,0,0,0.08)" />
      <g fill="rgba(255,255,255,0.35)">
        <circle cx="300" cy="120" r="3" />
        <circle cx="322" cy="140" r="3" />
        <circle cx="278" cy="145" r="3" />
        <circle cx="120" cy="60" r="3" />
        <circle cx="145" cy="80" r="3" />
      </g>
    </svg>
  )
}

export function CourseCoverArt({ course }: { course: Course }) {
  const category = categories.find((c) => c.id === course.categoryId)
  const Icon: LucideIcon = CATEGORY_ICONS[category?.icon ?? ''] ?? BookOpen
  return (
    <span className="absolute inset-0 block" style={{ background: GRADIENTS[course.gradient] }} aria-hidden="true">
      <CoverPattern />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 shadow-lg backdrop-blur-[2px]">
          <Icon className="h-8 w-8 text-white" />
        </span>
        <span className="max-w-[85%] text-center text-sm leading-snug font-extrabold text-white drop-shadow-sm">
          {category?.name ?? course.levelBn}
        </span>
      </span>
    </span>
  )
}

/**
 * A book cover that looks like a book: spine on the left, title +
 * author set in type on the cover, SP Academy mark at the foot.
 */
export function BookCoverArt({ book, large = false }: { book: Book; large?: boolean }) {
  return (
    <span
      className="absolute inset-0 flex flex-col overflow-hidden text-left"
      style={{ background: GRADIENTS[book.gradient] }}
      aria-hidden="true"
    >
      <CoverPattern />
      {/* Spine */}
      <span className="absolute top-0 bottom-0 left-0 w-2.5 bg-black/20" />
      <span className="absolute top-0 bottom-0 left-2.5 w-px bg-white/30" />
      <span className={`relative flex flex-1 flex-col justify-between p-5 pl-7 ${large ? 'sm:p-7 sm:pl-9' : ''}`}>
        <span>
          <span className="inline-block rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white uppercase backdrop-blur-[2px]">
            SP Academy
          </span>
          <span className={`mt-3 block leading-snug font-extrabold text-white drop-shadow-sm ${large ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>
            {book.title}
          </span>
        </span>
        <span>
          <span className={`block font-semibold text-white/90 ${large ? 'text-base' : 'text-xs'}`}>{book.author}</span>
          <span className="mt-1 block h-1 w-10 rounded-full bg-white/60" />
        </span>
      </span>
    </span>
  )
}

/** Teacher avatar: initials on gradient with a decorative ring + dots. */
export function TeacherAvatar({ teacher }: { teacher: Teacher }) {
  return (
    <span className="relative flex h-20 w-20 items-center justify-center" aria-hidden="true">
      <span className="absolute inset-0 rounded-full opacity-25" style={{ background: GRADIENTS[teacher.gradient] }} />
      <span
        className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-extrabold text-white shadow-md ring-4 ring-white dark:ring-[#12233c]"
        style={{ background: GRADIENTS[teacher.gradient] }}
      >
        <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="66" cy="14" r="18" fill="rgba(255,255,255,0.18)" />
          <circle cx="12" cy="62" r="14" fill="rgba(255,255,255,0.12)" />
        </svg>
        <span className="relative">{teacher.initials}</span>
      </span>
    </span>
  )
}
