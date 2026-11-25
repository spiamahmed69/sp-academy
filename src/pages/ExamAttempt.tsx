/**
 * Exam attempt page — Phase 6.
 *
 * Route: /exams/:id/attempt (protected).
 *
 * Flow: intro → running (client countdown) → submitted.
 * - The timer is client-side for display; the submission time is the
 *   server timestamp written on submit. Full server-side enforcement
 *   (server timer, server scoring) arrives with the backend —
 *   the page says so plainly instead of pretending otherwise.
 * - The attempt page NEVER contains answer keys. In Firestore mode the
 *   questions come without answers and the submitted attempt stays
 *   "মূল্যায়ন চলছে" until a teacher evaluates it. In demo mode the
 *   questions are openly labelled নমুনা sample content, so the score
 *   is shown immediately in this browser only.
 * - One attempt per student per exam: starting creates the attempt doc;
 *   an in_progress attempt can be resumed, a submitted one never re-opens.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  ClipboardList, FileCheck, Send, Timer,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useExamAttemptData } from '../hooks/useExams'
import { getFirebase } from '../firebase/config'
import {
  computeRemainingMs,
  demoAttemptToDoc,
  examPhase,
  formatCountdown,
  isExamOpen,
  startExamAttempt,
  submitDemoAttempt,
  submitExamAttempt,
  timestampMillis,
  type ExamAttemptDoc,
} from '../firebase/exams'
import { toBanglaDigits } from '../lib/format'
import { DemoNotice, EmptyState, ErrorState, PageHero, SampleBadge, SkeletonCard } from '../components/ui'
import { useToast } from '../lib/toast'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function ExamAttempt() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useExamAttemptData(id)

  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro')
  const [startedAtMs, setStartedAtMs] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [current, setCurrent] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedAttempt, setSubmittedAttempt] = useState<ExamAttemptDoc | null>(null)
  const autoSubmittedRef = useRef(false)

  const exam = data?.exam
  const questions = data?.questions ?? []
  const existingAttempt = data?.existingAttempt ?? null
  const remainingMs = phase === 'running' ? computeRemainingMs(startedAtMs, exam?.durationMin ?? 0, now) : 0

  // Countdown ticker while running.
  useEffect(() => {
    if (phase !== 'running') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  // Auto-submit when the timer hits zero.
  useEffect(() => {
    if (phase === 'running' && remainingMs <= 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      push('সময় শেষ — উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা দেওয়া হচ্ছে।', 'info')
      void handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remainingMs])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SkeletonCard />
      </div>
    )
  }

  if (isError || !data || !exam) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState title="পরীক্ষাটি পাওয়া যায়নি" message="লিংকটি যাচাই করে আবার চেষ্টা করুন, অথবা পরীক্ষার তালিকা থেকে বেছে নিন।" />
        <Link to="/exams" className="btn-primary mt-6 inline-flex text-sm">পরীক্ষার তালিকা</Link>
      </div>
    )
  }

  const isDemo = data.scorable
  const alreadyDone = existingAttempt && existingAttempt.status !== 'in_progress'
  const phaseOfExam = examPhase(exam)

  async function handleStart() {
    if (!user) return
    try {
      if (isDemo) {
        setStartedAtMs(Date.now())
      } else {
        const fb = getFirebase()
        if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
        // Resume an unfinished attempt instead of creating a second one.
        if (existingAttempt && existingAttempt.status === 'in_progress') {
          setStartedAtMs(timestampMillis(existingAttempt.startedAt) || Date.now())
          setAnswers(existingAttempt.answers ?? {})
        } else {
          const started = await startExamAttempt(fb.db, user.uid, exam!)
          setStartedAtMs(started)
        }
      }
      setPhase('running')
      setNow(Date.now())
    } catch (err) {
      push(err instanceof Error ? err.message : 'পরীক্ষা শুরু করা যায়নি।', 'error')
    }
  }

  async function handleSubmit() {
    if (submitting || !exam) return
    setSubmitting(true)
    try {
      let attempt: ExamAttemptDoc
      if (isDemo) {
        const demo = submitDemoAttempt(exam, data.sampleQuestions ?? [], answers, startedAtMs)
        attempt = demoAttemptToDoc(demo)
      } else {
        const fb = getFirebase()
        if (!fb || !user) throw new Error('Firebase কনফিগার করা হয়নি।')
        attempt = await submitExamAttempt(fb.db, user.uid, exam.id, answers)
      }
      setSubmittedAttempt(attempt)
      setPhase('done')
      await queryClient.invalidateQueries({ queryKey: ['my-attempts'] })
      await queryClient.invalidateQueries({ queryKey: ['exam-attempt-data'] })
      push(isDemo ? 'নমুনা পরীক্ষা জমা হয়েছে — ফলাফল নিচে দেখুন।' : 'উত্তরপত্র জমা হয়েছে। মূল্যায়নের পর ফলাফল দেখা যাবে।', 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'জমা দেওয়া যায়নি। আবার চেষ্টা করুন।', 'error')
      autoSubmittedRef.current = false
    } finally {
      setSubmitting(false)
      setConfirmSubmit(false)
    }
  }

  const answeredCount = Object.keys(answers).length
  const currentQuestion = questions[current]

  // ---- Done / already-submitted view ----
  const doneAttempt = submittedAttempt ?? (alreadyDone ? existingAttempt : null)
  if (phase === 'done' || alreadyDone) {
    return (
      <div>
        <PageHero eyebrow="পরীক্ষা" title={exam.title} subtitle="উত্তরপত্র জমা দেওয়া হয়েছে।" />
        <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
          <div className="mx-auto flex w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 flex-1 flex-col">
          {isDemo && (
            <DemoNotice>
              এটি নমুনা পরীক্ষার ফলাফল — প্রশ্ন ও উত্তর নমুনা, ফলাফল শুধু এই ব্রাউজারে আছে।
            </DemoNotice>
          )}
          {doneAttempt && <AttemptResultCard attempt={doneAttempt} questions={questions} showCorrectAnswers={isDemo} sampleQuestions={data.sampleQuestions} />}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/results" className="btn-primary text-sm">আমার ফলাফল দেখুন</Link>
            <Link to="/exams" className="btn-outline text-sm">আরও পরীক্ষা</Link>
          </div>
        </div>
      </div>
        </div>
    )
  }

  // ---- Not open yet / closed / draft ----
  if (!isExamOpen(exam)) {
    return (
      <div>
        <PageHero eyebrow="পরীক্ষা" title={exam.title} subtitle="এই পরীক্ষাটি এখন দেওয়া যাচ্ছে না।" />
        <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
          <div className="mx-auto flex w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 flex-1 flex-col">
          <EmptyState
            title={phaseOfExam === 'upcoming' ? 'পরীক্ষা এখনো শুরু হয়নি' : exam.status === 'draft' ? 'পরীক্ষাটি এখনো প্রকাশিত হয়নি' : 'পরীক্ষার সময় শেষ হয়ে গেছে'}
            message={
              phaseOfExam === 'upcoming' && exam.scheduledAt
                ? `পরীক্ষা শুরু হবে ${formatDate(exam.scheduledAt)}। নির্ধারিত সময়ে আবার আসুন।`
                : 'পরীক্ষার তালিকা থেকে অন্য পরীক্ষা বেছে নিন।'
            }
          />
          <Link to="/exams" className="btn-primary mt-6 inline-flex text-sm">পরীক্ষার তালিকা</Link>
        </div>
      </div>
        </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 flex-1 flex-col">
        <ErrorState title="এই পরীক্ষায় এখনো প্রশ্ন যুক্ত হয়নি" message="শিক্ষক প্রশ্ন যুক্ত করলে পরীক্ষা দেওয়া যাবে।" />
        <Link to="/exams" className="btn-primary mt-6 inline-flex text-sm">পরীক্ষার তালিকা</Link>
        </div>
      </div>
    )
  }

  // ---- Intro screen ----
  if (phase === 'intro') {
    return (
      <div>
        <PageHero eyebrow="পরীক্ষা" title={exam.title} subtitle={`${exam.subject} · ${exam.durationMin} মিনিট · ${toBanglaDigits(exam.totalMarks)} নম্বর`} />
        <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
          <div className="mx-auto flex w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 flex-1 flex-col">
          {isDemo && (
            <DemoNotice>
              এটি নমুনা পরীক্ষা — প্রশ্ন ও উত্তর নমুনা কনটেন্ট। আসল পরীক্ষা নয়; ফলাফল শুধু এই ব্রাউজারে
              থাকবে।
            </DemoNotice>
          )}
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              {exam.source !== 'firestore' && <SampleBadge label={exam.source === 'demo' ? 'ডেমো' : 'নমুনা'} />}
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                {exam.subject}
              </span>
              <span className="text-sm text-[var(--color-body)]">{toBanglaDigits(questions.length)}টি প্রশ্ন</span>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                <dt className="text-[var(--color-body)]">সময়সীমা</dt>
                <dd className="font-bold">{toBanglaDigits(exam.durationMin)} মিনিট</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                <dt className="text-[var(--color-body)]">মোট নম্বর</dt>
                <dd className="font-bold">{toBanglaDigits(exam.totalMarks)}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                <dt className="text-[var(--color-body)]">পরীক্ষা দেওয়ার সুযোগ</dt>
                <dd className="font-bold">একবারই</dd>
              </div>
              {exam.scheduledAt && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-body)]">নির্ধারিত সময়</dt>
                  <dd className="font-bold">{formatDate(exam.scheduledAt)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  শুরু করলে টাইমার চলতে থাকবে — সময় শেষ হলে উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।
                  জমা দেওয়ার পর উত্তর বদলানো যাবে না। টাইমারটি এই ডিভাইসে চলছে; জমার সময় সার্ভার
                  টাইমস্ট্যাম্পে রেকর্ড হয়। পূর্ণ সার্ভার-সাইড পরীক্ষা-নিয়ন্ত্রণ ব্যাকএন্ডে আসছে।
                </span>
              </p>
            </div>
            <button onClick={() => void handleStart()} className="btn-primary mt-6 w-full cursor-pointer justify-center py-3 text-base">
              <Timer className="h-5 w-5" />
              {existingAttempt && existingAttempt.status === 'in_progress' ? 'অসমাপ্ত পরীক্ষা চালিয়ে যান' : 'পরীক্ষা শুরু করুন'}
            </button>
          </div>
        </div>
      </div>
        </div>
    )
  }

  // ---- Running ----
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-blue-100 bg-[var(--color-page)]/95 backdrop-blur dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="truncate font-extrabold">{exam.title}</p>
            <p className="text-xs text-[var(--color-muted)]">
              {toBanglaDigits(answeredCount)} / {toBanglaDigits(questions.length)}টি প্রশ্নের উত্তর দেওয়া হয়েছে
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 font-extrabold ${remainingMs <= 5 * 60_000 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'}`}>
            <Clock className="h-5 w-5" />
            <span className="tabular-nums">{formatCountdown(remainingMs)}</span>
            <span className="text-xs font-bold">বাকি</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8 flex-1">
        <div className="card p-6">
          <p className="text-sm font-bold text-[var(--color-primary)]">
            প্রশ্ন {toBanglaDigits(current + 1)} / {toBanglaDigits(questions.length)} · {toBanglaDigits(currentQuestion.marks)} নম্বর
          </p>
          <h2 className="mt-2 text-xl leading-relaxed font-extrabold">{currentQuestion.text}</h2>
          <div className="mt-6 space-y-3" role="radiogroup" aria-label={`প্রশ্ন ${current + 1}`}>
            {currentQuestion.options.map((option, oi) => {
              const selected = answers[currentQuestion.id] === oi
              return (
                <button
                  key={oi}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: oi }))}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-left text-sm leading-relaxed font-semibold transition ${
                    selected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-slate-200 hover:border-[var(--color-primary)] dark:border-slate-700'
                  }`}
                >
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold ${selected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {option}
                </button>
              )
            })}
          </div>
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-outline cursor-pointer text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> আগের প্রশ্ন
            </button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="btn-primary cursor-pointer text-sm">
                পরের প্রশ্ন <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmSubmit(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--color-cta)] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110"
              >
                <Send className="h-4 w-4" /> জমা দিন
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold">
              <ClipboardList className="h-4 w-4 text-[var(--color-primary)]" /> প্রশ্নের তালিকা
            </h3>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const answered = answers[q.id] !== undefined
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    aria-label={`প্রশ্ন ${i + 1}${answered ? ' (উত্তর দেওয়া হয়েছে)' : ''}`}
                    className={`flex h-10 cursor-pointer items-center justify-center rounded-xl text-sm font-extrabold transition ${
                      i === current
                        ? 'bg-[var(--color-primary)] text-white'
                        : answered
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {toBanglaDigits(i + 1)}
                  </button>
                )
              })}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
              সবুজ = উত্তর দেওয়া হয়েছে। জমা দেওয়ার আগে যেকোনো প্রশ্নে ফিরে উত্তর বদলাতে পারবেন।
            </p>
          </div>

          {confirmSubmit && (
            <div className="card border-2 border-[var(--color-cta)] p-5" role="alertdialog" aria-label="জমা দেওয়ার নিশ্চিতকরণ">
              <h3 className="flex items-center gap-2 font-extrabold">
                <FileCheck className="h-5 w-5 text-[var(--color-cta)]" /> জমা দেবেন?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">
                {toBanglaDigits(answeredCount)} / {toBanglaDigits(questions.length)}টি প্রশ্নের উত্তর দেওয়া হয়েছে।
                {questions.length - answeredCount > 0 && ` ${toBanglaDigits(questions.length - answeredCount)}টি প্রশ্নের উত্তর দেওয়া হয়নি — সেগুলো ভুল হিসেবে ধরা হবে না, বাদ হিসেবে গণনা হবে।`}
                জমা দেওয়ার পর আর বদলানো যাবে না।
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => void handleSubmit()} disabled={submitting} className="btn-primary flex-1 cursor-pointer justify-center text-sm disabled:opacity-60">
                  {submitting ? 'জমা হচ্ছে…' : 'হ্যাঁ, জমা দিন'}
                </button>
                <button onClick={() => setConfirmSubmit(false)} className="btn-outline cursor-pointer text-sm">
                  বাতিল
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
      </div>
  )
}

/** Result card: score + counts + per-question status. Used here and on /results. */
export function AttemptResultCard({
  attempt,
  questions,
  showCorrectAnswers,
  sampleQuestions,
}: {
  attempt: ExamAttemptDoc
  questions?: { id: string; text: string; options: string[] }[]
  showCorrectAnswers?: boolean
  sampleQuestions?: { id: string; correctIndex: number }[]
}) {
  const evaluated = attempt.status === 'evaluated'
  const correctMap = new Map((sampleQuestions ?? []).map((q) => [q.id, q.correctIndex]))
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold">{attempt.examTitle}</h3>
        {attempt.source === 'demo' && <SampleBadge label="ডেমো" />}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            evaluated
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
          }`}
        >
          {evaluated ? 'মূল্যায়ন হয়েছে' : 'মূল্যায়ন চলছে'}
        </span>
      </div>

      {!evaluated ? (
        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-[var(--color-body)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <span>
            উত্তরপত্র জমা হয়েছে
            {attempt.submittedAt
              ? ` — ${new Date(timestampMillis(attempt.submittedAt)).toLocaleString('bn-BD', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}`
              : ''}
            । শিক্ষক মূল্যায়ন করলে এখানে নম্বর দেখা যাবে। সার্ভার-সাইড স্বয়ংক্রিয় মূল্যায়ন ব্যাকএন্ডে
            আসছে।
          </span>
        </p>
      ) : (
        <>
          <p className="mt-4 text-3xl font-extrabold">
            {toBanglaDigits(attempt.score ?? 0)}
            <span className="text-lg text-[var(--color-muted)]"> / {toBanglaDigits(attempt.totalMarks)}</span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-2xl bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-lg font-extrabold text-green-700 dark:text-green-300">{toBanglaDigits(attempt.correctCount ?? 0)}</p>
              <p className="text-xs text-[var(--color-body)]">সঠিক</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-lg font-extrabold text-red-700 dark:text-red-300">{toBanglaDigits(attempt.wrongCount ?? 0)}</p>
              <p className="text-xs text-[var(--color-body)]">ভুল</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-lg font-extrabold">{toBanglaDigits(attempt.skippedCount ?? 0)}</p>
              <p className="text-xs text-[var(--color-body)]">বাদ</p>
            </div>
          </div>
          {questions && questions.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-extrabold">প্রতিটি প্রশ্নের ফল</h4>
              {questions.map((q, i) => {
                const result = attempt.perQuestion[q.id] ?? 'skipped'
                const given = attempt.answers[q.id]
                const correctIndex = correctMap.get(q.id)
                return (
                  <div key={q.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                    <p className="flex items-start justify-between gap-2 text-sm font-bold">
                      <span>
                        {toBanglaDigits(i + 1)}. {q.text}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                          result === 'correct'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : result === 'wrong'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {result === 'correct' ? 'সঠিক' : result === 'wrong' ? 'ভুল' : 'বাদ'}
                      </span>
                    </p>
                    {given !== undefined && (
                      <p className="mt-1 text-sm text-[var(--color-body)]">আপনার উত্তর: {q.options[given] ?? '—'}</p>
                    )}
                    {showCorrectAnswers && correctIndex !== undefined && (
                      <p className="mt-1 text-sm font-bold text-green-700 dark:text-green-300">
                        সঠিক উত্তর: {q.options[correctIndex] ?? '—'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
