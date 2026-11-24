import { Link } from 'react-router-dom'
import { CalendarDays, Clock, FileText, ListChecks, Trophy } from 'lucide-react'
import { upcomingExams } from '../data/sample'
import { DemoNotice, PageHero, SampleBadge } from '../components/ui'

const EXAM_TYPES = [
  { icon: ListChecks, title: 'MCQ পরীক্ষা', text: 'বহুনির্বাচনী প্রশ্ন, স্বয়ংক্রিয় মূল্যায়ন।' },
  { icon: FileText, title: 'CQ পরীক্ষা', text: 'সৃজনশীল প্রশ্ন, শিক্ষকের হাতে মূল্যায়ন।' },
  { icon: Trophy, title: 'মডেল টেস্ট', text: 'পূর্ণাঙ্গ সিলেবাসের মডেল টেস্ট ও মেধাতালিকা।' },
  { icon: Clock, title: 'প্র্যাকটিস টেস্ট', text: 'অধ্যায়ভিত্তিক ছোট টেস্ট, যেকোনো সময়।' },
]

export default function Exams() {
  return (
    <div>
      <PageHero
        eyebrow="পরীক্ষা"
        title="অনলাইন পরীক্ষা"
        subtitle="MCQ, CQ, মডেল টেস্ট ও প্র্যাকটিস টেস্ট — পরীক্ষার ব্যবস্থা Phase 6-এ চালু হবে। এখানে সময়সূচি নমুনা।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <DemoNotice>
          পরীক্ষার তারিখ, নম্বর ও ভর্তির সংখ্যা নমুনা — অফিসিয়াল পরীক্ষার সূচি নয়। উত্তরপত্র সার্ভারেই মূল্যায়ন
          হবে; Phase 1-এ কোনো পরীক্ষা দেওয়া যায় না।
        </DemoNotice>

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
        <div className="space-y-4">
          {upcomingExams.map((ex) => (
            <article key={ex.id} className="card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="mb-1.5 inline-flex items-center gap-2">
                  <SampleBadge />
                  <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                    {ex.type}
                  </span>
                </span>
                <h3 className="text-lg font-bold">{ex.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-body)]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> {ex.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {ex.durationMin} মিনিট
                  </span>
                  <span>{ex.marks} নম্বর · {ex.questions}টি প্রশ্ন</span>
                  <span>{ex.enrolled.toLocaleString('en-IN')} জন ভর্তি (নমুনা)</span>
                </p>
              </div>
              <Link to="/results" className="btn-outline shrink-0 text-sm">
                ফলাফল দেখুন
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
