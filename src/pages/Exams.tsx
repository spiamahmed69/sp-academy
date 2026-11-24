import { Link } from 'react-router-dom'
import { CalendarDays, Clock, FileText, ListChecks, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useExams } from '../hooks/useExams'
import { examPhase, EXAM_TYPE_LABELS } from '../firebase/exams'
import { canManageExams } from '../firebase/exams'
import { toBanglaDigits } from '../lib/format'
import { DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'

const EXAM_TYPES = [
  { icon: ListChecks, title: 'MCQ পরীক্ষা', text: 'বহুনির্বাচনী প্রশ্ন; নমুনা পরীক্ষার ফল সাথে সাথে দেখা যায়, আসল পরীক্ষা শিক্ষক মূল্যায়ন করেন।' },
  { icon: FileText, title: 'CQ পরীক্ষা', text: 'সৃজনশীল প্রশ্ন, শিক্ষকের হাতে মূল্যায়ন। (CQ প্রশ্ন তৈরি এখনো যুক্ত হয়নি — শুধু MCQ তৈরি করা যায়।)' },
  { icon: Trophy, title: 'মডেল টেস্ট', text: 'পূর্ণাঙ্গ সিলেবাসের মডেল টেস্ট ও মেধাতালিকা।' },
  { icon: Clock, title: 'প্র্যাকটিস টেস্ট', text: 'অধ্যায়ভিত্তিক ছোট টেস্ট, যেকোনো সময়।' },
]

function formatExamDate(iso: string | null): string {
  if (!iso) return 'যেকোনো সময়'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function Exams() {
  const { role } = useAuth()
  const { data, isLoading, isError } = useExams()
  const exams = (data?.exams ?? []).filter((e) => e.status === 'published')
  const upcoming = exams.filter((e) => examPhase(e) !== 'closed')
  const past = exams.filter((e) => examPhase(e) === 'closed')

  return (
    <div>
      <PageHero
        eyebrow="পরীক্ষা"
        title="অনলাইন পরীক্ষা"
        subtitle="MCQ, মডেল টেস্ট ও প্র্যাকটিস টেস্ট — এখন পরীক্ষা দেওয়া যায়। আসল পরীক্ষার উত্তরপত্র শিক্ষক মূল্যায়ন করেন; উত্তর-চাবি শিক্ষার্থীর কাছে কখনো যায় না।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {data?.source === 'sample' && (
          <DemoNotice>
            Firebase এখনো কনফিগার করা হয়নি — নিচের পরীক্ষাগুলো নমুনা। নমুনা পরীক্ষার ফলাফল সাথে
            সাথেই দেখা যায়, শুধু এই ব্রাউজারে থাকে।
          </DemoNotice>
        )}
        {canManageExams(role) && (
          <div className="mb-8">
            <Link to="/exams/manage" className="btn-primary text-sm">
              পরীক্ষা তৈরি ও পরিচালনা করুন →
            </Link>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EXAM_TYPES.map((t) => (
            <div key={t.title} className="card card-hover p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <t.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">{t.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 mb-4 text-xl font-extrabold">আসন্ন পরীক্ষা</h2>
        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <ErrorState title="পরীক্ষার তালিকা আনা যায়নি" message="ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।" />
        ) : upcoming.length === 0 ? (
          <EmptyState title="আপাতত কোনো আসন্ন পরীক্ষা নেই" message="নতুন পরীক্ষা প্রকাশিত হলে এখানে দেখা যাবে।" />
        ) : (
          <div className="space-y-4">
            {upcoming.map((ex) => {
              const phase = examPhase(ex)
              return (
                <article key={ex.id} className="card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <span className="mb-1.5 inline-flex flex-wrap items-center gap-2">
                      {ex.source !== 'firestore' && <SampleBadge label={ex.source === 'demo' ? 'ডেমো' : 'নমুনা'} />}
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                        {EXAM_TYPE_LABELS[ex.type]}
                      </span>
                      {phase === 'upcoming' && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          শীঘ্রই শুরু হবে
                        </span>
                      )}
                    </span>
                    <h3 className="text-lg font-bold">{ex.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-body)]">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" /> {formatExamDate(ex.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {toBanglaDigits(ex.durationMin)} মিনিট
                      </span>
                      <span>{toBanglaDigits(ex.totalMarks)} নম্বর · {toBanglaDigits(ex.questionCount)}টি প্রশ্ন</span>
                      {ex.enrolledCount !== null && (
                        <span>{toBanglaDigits(ex.enrolledCount)} জন ভর্তি (নমুনা)</span>
                      )}
                    </p>
                  </div>
                  {phase === 'open' ? (
                    <Link to={`/exams/${ex.id}/attempt`} className="btn-primary shrink-0 text-sm">
                      পরীক্ষা দিন
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[var(--color-muted)] dark:border-slate-700">
                      নির্ধারিত সময়ে দেওয়া যাবে
                    </span>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mt-12 mb-4 text-xl font-extrabold">পূর্ববর্তী পরীক্ষা</h2>
            <div className="space-y-4">
              {past.map((ex) => (
                <article key={ex.id} className="card flex flex-col gap-4 p-5 opacity-80 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <span className="mb-1.5 inline-flex items-center gap-2">
                      {ex.source !== 'firestore' && <SampleBadge label={ex.source === 'demo' ? 'ডেমো' : 'নমুনা'} />}
                      <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                        {EXAM_TYPE_LABELS[ex.type]}
                      </span>
                    </span>
                    <h3 className="text-lg font-bold">{ex.title}</h3>
                    <p className="mt-1 text-sm text-[var(--color-body)]">
                      {formatExamDate(ex.scheduledAt)} · {toBanglaDigits(ex.durationMin)} মিনিট · {toBanglaDigits(ex.totalMarks)} নম্বর
                    </p>
                  </div>
                  <Link to="/results" className="btn-outline shrink-0 text-sm">
                    ফলাফল দেখুন
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
