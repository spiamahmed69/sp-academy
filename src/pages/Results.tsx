import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Award, Search, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoNotice, EmptyState, PageHero, SampleBadge } from '../components/ui'
import { useToast } from '../lib/toast'
import { toBanglaDigits } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { useMyAttempts } from '../hooks/useExams'
import { AttemptResultCard } from './ExamAttempt'
import { sampleQuestionsToViews } from '../firebase/exams'
import { sampleExamQuestions } from '../data/sample'

const rollSchema = z.object({
  roll: z.string().min(4, 'রোল নম্বর কমপক্ষে ৪ অক্ষরের হতে হবে').max(20, 'রোল নম্বর অনেক বড়'),
})

type RollForm = z.infer<typeof rollSchema>

const LEADERBOARD = [
  { rank: 1, name: 'রাফি (নমুনা)', exam: 'এইচএসসি পদার্থবিজ্ঞান মডেল টেস্ট', marks: 98 },
  { rank: 2, name: 'মীম (নমুনা)', exam: 'এসএসসি গণিত টেস্ট', marks: 96 },
  { rank: 3, name: 'সজীব (নমুনা)', exam: 'মেডিকেল মডেল টেস্ট', marks: 94 },
  { rank: 4, name: 'তানিয়া (নমুনা)', exam: 'বিসিএস মডেল টেস্ট', marks: 91 },
  { rank: 5, name: 'আরিফ (নমুনা)', exam: 'এইচএসসি রসায়ন মডেল টেস্ট', marks: 89 },
]

export default function Results() {
  const { push } = useToast()
  const { user } = useAuth()
  const { data: attempts, isLoading: attemptsLoading } = useMyAttempts()
  const [searched, setSearched] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RollForm>({ resolver: zodResolver(rollSchema) })

  const onSubmit = (data: RollForm) => {
    setSearched(data.roll)
    push('নমুনা ফলাফল দেখানো হচ্ছে — এটি আসল পরীক্ষার ফল নয়।', 'info')
  }

  return (
    <div>
      <PageHero
        eyebrow="ফলাফল"
        title="পরীক্ষার ফলাফল"
        subtitle="রোল নম্বর দিয়ে ফলাফল খুঁজুন ও মেধাতালিকা দেখুন। এই পেজের সব ফলাফল নমুনা।"
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 flex-1 flex-col">
        <DemoNotice>
          নিচের রোল-খোঁজা ও মেধাতালিকা নমুনা — যেকোনো রোল নম্বর দিলে একই নমুনা ফলাফল
          দেখাবে। আপনার আসল ফলাফল উপরে "আমার ফলাফল" অংশে আছে।
        </DemoNotice>

        {/* ---- My real results (Phase 6) ---- */}
        <h2 className="mb-4 text-xl font-extrabold">আমার ফলাফল</h2>
        {!user ? (
          <div className="card mb-10 p-6">
            <p className="text-sm leading-relaxed text-[var(--color-body)]">
              নিজের পরীক্ষার ফলাফল দেখতে লগইন করুন।{' '}
              <Link to="/login" className="font-bold text-[var(--color-primary)] hover:underline">
                লগইন করুন →
              </Link>
            </p>
          </div>
        ) : attemptsLoading ? (
          <div className="card mb-10 p-6">
            <p className="text-sm text-[var(--color-body)]">ফলাফল আনা হচ্ছে…</p>
          </div>
        ) : !attempts || attempts.length === 0 ? (
          <div className="mb-10">
            <EmptyState
              title="এখনো কোনো পরীক্ষা দেওয়া হয়নি"
              message="পরীক্ষা দিয়ে জমা দিলে ফলাফল এখানে দেখা যাবে। শিক্ষক মূল্যায়ন করলে নম্বর আসবে।"
            />
            <Link to="/exams" className="btn-primary mt-4 inline-flex text-sm">
              পরীক্ষা দিন →
            </Link>
          </div>
        ) : (
          <div className="mb-10 space-y-4">
            {attempts.map((attempt) => {
              const isDemo = attempt.source === 'demo'
              const questions = isDemo ? sampleQuestionsToViews(sampleExamQuestions[attempt.examId] ?? []) : undefined
              return (
                <AttemptResultCard
                  key={attempt.id}
                  attempt={attempt}
                  questions={questions}
                  showCorrectAnswers={isDemo}
                  sampleQuestions={isDemo ? (sampleExamQuestions[attempt.examId] ?? []) : undefined}
                />
              )
            })}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-extrabold">ফলাফল খুঁজুন</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="card p-6" noValidate>
              <label htmlFor="roll" className="mb-2 block text-sm font-bold">
                রোল নম্বর
              </label>
              <div className="flex gap-2">
                <input
                  id="roll"
                  {...register('roll')}
                  placeholder="যেমন: 2026001"
                  className="min-w-0 flex-1 rounded-full border border-blue-100 bg-[var(--color-page)] px-5 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700"
                />
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0 cursor-pointer text-sm disabled:opacity-60">
                  <Search className="h-4 w-4" /> খুঁজুন
                </button>
              </div>
              {errors.roll && <p className="mt-2 text-sm text-red-600">{errors.roll.message}</p>}
            </form>

            {searched === null ? (
              <div className="mt-6">
                <EmptyState title="এখনো কোনো ফলাফল খোঁজা হয়নি" message="উপরে রোল নম্বর লিখে খুঁজুন — নমুনা ফলাফল দেখা যাবে।" />
              </div>
            ) : (
              <div className="card mt-6 p-6" role="status">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[var(--color-cta)]" />
                  <h3 className="text-lg font-bold">নমুনা ফলাফল</h3>
                  <SampleBadge />
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                    <dt className="text-[var(--color-body)]">রোল</dt>
                    <dd className="font-bold">{searched}</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                    <dt className="text-[var(--color-body)]">পরীক্ষা</dt>
                    <dd className="font-bold">এইচএসসি পদার্থবিজ্ঞান মডেল টেস্ট ০১</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                    <dt className="text-[var(--color-body)]">প্রাপ্ত নম্বর</dt>
                    <dd className="font-bold">৮৫ / ১০০</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-body)]">গ্রেড</dt>
                    <dd className="font-bold text-green-600">A+ (নমুনা)</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
              <Trophy className="h-5 w-5 text-[var(--color-cta)]" /> মেধাতালিকা (নমুনা)
            </h2>
            <div className="card overflow-hidden">
              {LEADERBOARD.map((row) => (
                <div key={row.rank} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] font-extrabold text-[var(--color-primary)]">
                    {toBanglaDigits(row.rank)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{row.name}</p>
                    <p className="truncate text-sm text-[var(--color-body)]">{row.exam}</p>
                  </div>
                  <span className="font-extrabold text-[var(--color-cta-to)]">{toBanglaDigits(row.marks)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
  )
}
