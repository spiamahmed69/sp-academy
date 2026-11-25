/**
 * AI study assistant — Phase 9.
 *
 * HONESTY: there is NO real AI here. The chat shell below answers ONLY
 * through the local keyword helper (src/lib/assistant.ts), which matches
 * questions against the site's own FAQ + course catalogue and says plainly
 * when it does not know. The page labels the helper "সহজ সহায়ক — আসল AI
 * নয়" everywhere and says the real AI assistant arrives with the backend
 * in Phase 10. No answer is ever invented.
 */
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import { answerQuestion, suggestedQuestions, type HelperAnswer } from '../lib/assistant'
import { Breadcrumbs, DemoNotice, PageHero } from '../components/ui'

interface ChatMessage {
  id: number
  from: 'user' | 'helper'
  text: string
  link?: HelperAnswer['link']
}

let nextId = 1

export default function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      from: 'helper',
      text: 'আসসালামু আলাইকুম! আমি SP Academy-র সহজ সহায়ক। কোর্স, ভর্তি, পরীক্ষা, পেমেন্ট বা বই নিয়ে প্রশ্ন করুন — আমি সাইটের নিজের তথ্য থেকে উত্তর দেবো। যা জানি না, তা বানিয়ে বলবো না।',
    },
  ])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const ask = (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return
    const answer = answerQuestion(trimmed)
    setMessages((prev) => [
      ...prev,
      { id: nextId++, from: 'user', text: trimmed },
      { id: nextId++, from: 'helper', text: answer.text, link: answer.link },
    ])
    setInput('')
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    })
  }

  const suggestions = suggestedQuestions()

  return (
    <div>
      <PageHero
        eyebrow="AI সহকারী"
        title="পড়াশোনার সহায়ক"
        subtitle="কোর্স, ভর্তি, পরীক্ষা ও পেমেন্ট নিয়ে প্রশ্ন করুন — সহজ সহায়ক সাইটের নিজের তথ্য থেকে উত্তর দেবে।"
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
          <Breadcrumbs items={[{ label: 'AI সহকারী' }]} />

        <DemoNotice>
          এটি <strong>আসল AI নয়</strong> — একটি সহজ সহায়ক, যা শুধু SP Academy-র FAQ ও কোর্সের তালিকা থেকে উত্তর
          দেয়। আসল AI সহকারী (ব্যাকএন্ড, সার্ভার-সাইড কী, রেট লিমিটসহ) ব্যাকএন্ডে আসছে।
        </DemoNotice>

        <div className="card mt-4 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-blue-100 p-4 dark:border-slate-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-[var(--color-heading)]">সহজ সহায়ক</p>
              <p className="text-xs text-[var(--color-muted)]">আসল AI নয় — FAQ ও কোর্সের তথ্য থেকে উত্তর দেয়</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <Sparkles className="h-3 w-3" /> সহজ সহায়ক
            </span>
          </div>

          <div ref={listRef} className="max-h-[480px] space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.from === 'user' ? 'bg-[var(--color-cta-to)] text-white' : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  }`}
                >
                  {m.from === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.from === 'user'
                      ? 'rounded-tr-sm bg-[var(--color-primary)] text-white'
                      : 'rounded-tl-sm bg-[var(--color-primary-soft)] text-[var(--color-body)]'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.from === 'helper' && m.link && (
                    <Link to={m.link.to} className="mt-2 inline-block font-bold text-[var(--color-primary)] underline">
                      {m.link.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-blue-100 p-4 dark:border-slate-700">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => ask(s.question)}
                  className="cursor-pointer rounded-full border border-blue-100 bg-[var(--color-page)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] dark:border-slate-700"
                >
                  {s.question}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ask(input)
              }}
              className="flex gap-2"
            >
              <label htmlFor="assistant-input" className="sr-only">
                প্রশ্ন লিখুন
              </label>
              <input
                id="assistant-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="আপনার প্রশ্ন লিখুন... (যেমন: ফ্রি কোর্স কোনগুলো?)"
                className="flex-1 rounded-full border border-blue-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-slate-900"
              />
              <button type="submit" aria-label="পাঠান" className="btn-cta shrink-0 !px-5 !py-2.5 text-sm">
                <Send className="h-4 w-4" /> পাঠান
              </button>
            </form>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
              উত্তর না মিললে সহায়ক সৎভাবে জানিয়ে দেবে — তখন{' '}
              <Link to="/contact" className="font-bold text-[var(--color-primary)] underline">
                সাপোর্ট টিকিট খুলুন
              </Link>{' '}
              অথবা{' '}
              <Link to="/faq" className="font-bold text-[var(--color-primary)] underline">
                সাধারণ প্রশ্ন
              </Link>{' '}
              দেখুন।
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
