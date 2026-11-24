/**
 * Simple study helper — Phase 9.
 *
 * HONESTY — read this before touching this file:
 * - There is NO real AI here (no backend yet). This is a
 *   keyword matcher that answers ONLY from the site's own data: the FAQ,
 *   the course catalogue (title / price / duration / lessons) and the
 *   platform's honestly-stated current state. It NEVER invents an answer.
 * - Every reply the UI renders is labelled "সহজ সহায়ক — আসল AI নয়" and
 *   the page says plainly that the real AI assistant arrives with the
 *   backend.
 * - When no knowledge entry matches, the helper says so and points at the
 *   FAQ page or at opening a support ticket — it never guesses.
 */
import { courses as COURSES, type Course } from '../data/sample'
import { toBanglaDigits } from './format'

export interface KnowledgeEntry {
  id: string
  /** Keywords (Bengali + English) that trigger this entry. */
  keywords: string[]
  question: string
  answer: string
  link?: { to: string; label: string }
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'enroll',
    keywords: ['ভর্তি', 'enroll', 'ভর্তি হবো', 'ভর্তি হব', 'কোর্সে ভর্তি', 'ভর্তির', 'ভর্তি প্রক্রিয়া', 'ভর্তি করবো'],
    question: 'কোর্সে কীভাবে ভর্তি হবো?',
    answer:
      'ফ্রি কোর্সে কোর্সের পেজ থেকে "ভর্তি হোন" বোতামে ক্লিক করলেই ভর্তি হওয়া যায়। পেইড কোর্সের ক্ষেত্রে কোর্সটি কার্টে যোগ করে চেকআউট করতে হয় — অনলাইন পেমেন্টের যাচাইকরণ ব্যাকএন্ডে আসছে, তাই আপাতত পেমেন্ট যাচাই না হওয়া পর্যন্ত ভর্তি সক্রিয় হয় না।',
    link: { to: '/courses', label: 'কোর্সসমূহ দেখুন' },
  },
  {
    id: 'free-courses',
    keywords: ['ফ্রি', 'free', 'বিনামূল্যে', 'ফ্রি কোর্স', 'টাকা ছাড়া'],
    question: 'ফ্রি কোর্স কি সত্যিই ফ্রি?',
    answer:
      'হ্যাঁ — ফ্রি কোর্সগুলোতে কোনো পেমেন্ট লাগে না। ফ্রি কোর্সের তালিকা "ফ্রি কোর্স" পেজে আছে, যেমন এসএসসি আইসিটি বেসিক ও এইচএসসি ইংরেজি গ্রামার।',
    link: { to: '/free-courses', label: 'ফ্রি কোর্স দেখুন' },
  },
  {
    id: 'live-class',
    keywords: ['লাইভ ক্লাস', 'live class', 'লাইভ', 'ক্লাস কখন', 'জয়েন', 'join'],
    question: 'লাইভ ক্লাস কখন, কীভাবে জয়েন করবো?',
    answer:
      'লাইভ ক্লাসের সময়সূচি "লাইভ ক্লাস" পেজে দেখা যায়। ক্লাসের জয়েন লিংক শুধু তখনই দেখায় যখন শিক্ষক লিংক যুক্ত করেছেন — লিংক না থাকলে লেখা থাকে শুরুর আগে এখানে দেখা যাবে। রেকর্ডিংও শুধু থাকলে দেখায়।',
    link: { to: '/live-classes', label: 'লাইভ ক্লাসের সময়সূচি' },
  },
  {
    id: 'exam',
    keywords: ['পরীক্ষা', 'exam', 'মডেল টেস্ট', 'মডেল পরীক্ষা', 'ফলাফল', 'রেজাল্ট', 'result'],
    question: 'পরীক্ষা কীভাবে দেবো, ফলাফল কোথায় পাবো?',
    answer:
      'পরীক্ষার পেজ থেকে "পরীক্ষা দিন" বোতামে ক্লিক করে টাইমারসহ পরীক্ষা দেওয়া যায় — একজন শিক্ষার্থী একটাই চেষ্টা করতে পারে, সময় শেষ হলে উত্তর অটো-জমা হয়। ফলাফল "ফলাফল" পেজে দেখা যায়; MCQ-র ফল শিক্ষকের মূল্যায়নের পর প্রকাশ হয়। সৃজনশীল (CQ) প্রশ্ন এখনো আসেনি — আপাতত শুধু MCQ।',
    link: { to: '/exams', label: 'পরীক্ষার তালিকা' },
  },
  {
    id: 'payment',
    keywords: ['পেমেন্ট', 'payment', 'বিকাশ', 'bkash', 'নগদ', 'nagad', 'কার্ড', 'card', 'টাকা দেবো', 'টাকা দিবো', 'মূল্য পরিশোধ'],
    question: 'পেমেন্টের মাধ্যম কী কী?',
    answer:
      'বিকাশ, নগদ, কার্ড ও ক্যাশ অন ডেলিভারি (COD) আছে। তবে সৎভাবে জানাচ্ছি: ব্যাকএন্ড না থাকায় অনলাইন পেমেন্ট এখনো যাচাই করা যায় না — অনলাইন পেমেন্টে অর্ডার "পেমেন্ট যাচাইয়ের অপেক্ষায়" হিসেবে জমা হয়, কোনো টাকা নেওয়া হয় না এবং কোনো ট্রানজাকশন আইডি দেখানো হয় না। যাচাইকরণ ব্যাকএন্ডে আসছে।',
    link: { to: '/books', label: 'বই ও অর্ডার দেখুন' },
  },
  {
    id: 'books',
    keywords: ['বই', 'book', 'বই কিনবো', 'বই কিনতে', 'ডেলিভারি', 'delivery', 'ডেলিভারি চার্জ'],
    question: 'বই কীভাবে কিনবো, ডেলিভারি চার্জ কত?',
    answer:
      'বইয়ের পেজ থেকে বই কার্টে যোগ করে চেকআউট করা যায়। বইয়ের অর্ডারে ডেলিভারি চার্জ ৳৬০, তবে বইয়ের মোট ৳১০০০ বা তার বেশি হলে ডেলিভারি ফ্রি। COD-তে পণ্য হাতে পেয়ে নগদে পরিশোধ করা যায়।',
    link: { to: '/books', label: 'বই দেখুন' },
  },
  {
    id: 'certificate',
    keywords: ['সার্টিফিকেট', 'certificate', 'সনদ'],
    question: 'কোর্স শেষে কি সার্টিফিকেট পাবো?',
    answer:
      'সার্টিফিকেট দেওয়ার ব্যবস্থা এখনো চালু হয়নি — সার্টিফিকেট ইস্যু হয় ব্যাকএন্ড থেকে। কোর্স শেষ করলেও আপাতত কোনো সার্টিফিকেট দেখাবে না, ড্যাশবোর্ডে সৎভাবে "এখনো কোনো সার্টিফিকেট নেই" লেখা থাকে।',
    link: { to: '/dashboard', label: 'ড্যাশবোর্ড' },
  },
  {
    id: 'account',
    keywords: ['লগইন', 'login', 'রেজিস্টার', 'register', 'অ্যাকাউন্ট', 'account', 'পাসওয়ার্ড', 'password', 'সাইন আপ', 'signup'],
    question: 'অ্যাকাউন্ট / লগইন কীভাবে করবো?',
    answer:
      'রেজিস্টার পেজ থেকে ইমেইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট খোলা যায়, Google দিয়েও লগইন করা যায়। তবে সৎভাবে জানাচ্ছি: Firebase প্রজেক্ট এখনো তৈরি হয়নি, তাই আসল লগইন চালু হয়নি — পুরো সাইট শেষ হলে একবারে সেটআপ করা হবে, তখন আসল লগইন কাজ করবে।',
    link: { to: '/login', label: 'লগইন পেজ' },
  },
  {
    id: 'teacher',
    keywords: ['শিক্ষক', 'teacher', 'শিক্ষক কারা', 'শিক্ষকদের'],
    question: 'শিক্ষক কারা, শিক্ষকদের তালিকা কোথায়?',
    answer: 'শিক্ষকদের তালিকা "শিক্ষক" পেজে আছে — সেখানে প্রত্যেক শিক্ষকের বিষয় ও কোর্স দেখা যায়। শিক্ষকরা নিজেদের ড্যাশবোর্ড থেকে কোর্স, লাইভ ক্লাস ও পরীক্ষা পরিচালনা করেন।',
    link: { to: '/teachers', label: 'শিক্ষকদের দেখুন' },
  },
  {
    id: 'refund',
    keywords: ['রিফান্ড', 'refund', 'টাকা ফেরত', 'ফেরত'],
    question: 'রিফান্ডের নিয়ম কী?',
    answer: 'রিফান্ডের বিস্তারিত নিয়ম "রিফান্ড নীতিমালা" পেজে লেখা আছে। কোনো সমস্যা হলে সাপোর্ট টিকিট খুলে জানাতে পারেন।',
    link: { to: '/refund', label: 'রিফান্ড নীতিমালা' },
  },
  {
    id: 'support',
    keywords: ['সাপোর্ট', 'support', 'যোগাযোগ', 'contact', 'সাহায্য', 'help', 'সমস্যা', 'অভিযোগ'],
    question: 'কোনো সমস্যা হলে কাকে জানাবো?',
    answer:
      'যোগাযোগ পেজের ফর্ম থেকে সাপোর্ট টিকিট খোলা যায় — লগইন করা থাকলে টিকিটটি আপনার অ্যাকাউন্টে জমা হবে, আর অ্যাডমিন উত্তর দিলে নোটিফিকেশনে জানানো হবে। টিকিট খুলতে লগইন করা লাগবে।',
    link: { to: '/contact', label: 'যোগাযোগ পেজ' },
  },
  {
    id: 'about-ai',
    keywords: ['তুমি কে', 'তুমি কি ai', 'আসল ai', 'আসল এআই', 'তুমি কি আসল', 'ai কিনা', 'বট', 'চ্যাটবট'],
    question: 'তুমি কি আসল AI?',
    answer:
      'না — আমি আসল AI নই। আমি একটি সহজ সহায়ক: আপনার প্রশ্নের সঙ্গে SP Academy-র নিজের তথ্য (FAQ ও কোর্সের তালিকা) মিলিয়ে উত্তর দিই। এর বাইরে কিছু জানি না, আর বানিয়ে কিছু বলি না। আসল AI সহকারী ব্যাকএন্ডসহ আসছে।',
  },
]

/** Normalise Bengali/English text for keyword matching. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[।?!.,;:()""''«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreEntry(normalizedQuery: string, entry: KnowledgeEntry): number {
  let score = 0
  for (const keyword of entry.keywords) {
    const kw = normalizeText(keyword)
    if (!kw) continue
    if (normalizedQuery.includes(kw)) score += kw.length > 6 ? 3 : 2
  }
  return score
}

/** Find a course whose title/description matches the query (for price/details answers). */
export function findCourseAnswer(query: string, courses: Course[] = COURSES): string | null {
  const normalized = normalizeText(query)
  if (!normalized) return null
  // Match on distinctive words from the course title (skip tiny/common words).
  let best: Course | null = null
  let bestScore = 0
  for (const course of courses) {
    const titleWords = normalizeText(course.title)
      .split(' ')
      .filter((w) => w.length >= 4 && !['ফ্রি', 'কোর্স', 'সম্পূর্ণ', 'থেকে', 'শুরু'].includes(w))
    let score = 0
    for (const word of titleWords) {
      if (normalized.includes(word)) score += word.length
    }
    if (score > bestScore) {
      bestScore = score
      best = course
    }
  }
  if (!best || bestScore < 4) return null
  const price = best.isFree
    ? 'ফ্রি'
    : `৳${toBanglaDigits(best.discountPrice ?? best.price)} (আগে ৳${toBanglaDigits(best.price)})`
  return `“${best.title}” — মূল্য ${price}, মেয়াদ ${toBanglaDigits(best.durationWeeks)} সপ্তাহ, মোট ${toBanglaDigits(best.lessons)}টি লেসন, ভাষা ${best.language}। ${best.description}`
}

export interface HelperAnswer {
  /** The reply text — always from the knowledge base or a course, never invented. */
  text: string
  /** Id of the matched knowledge entry, or 'course' / null (no match). */
  matchedId: string | null
  link?: { to: string; label: string }
}

export const NO_MATCH_TEXT =
  'এই প্রশ্নের উত্তর আমার কাছে নেই — আমি শুধু SP Academy-র FAQ ও কোর্সের তথ্য থেকে উত্তর দিতে পারি, বানিয়ে কিছু বলি না। নিচের সাধারণ প্রশ্নগুলো দেখতে পারেন, অথবা সাপোর্ট টিকিট খুলে জানাতে পারেন।'

/**
 * Answer a question from the local knowledge base only.
 * Returns the best-matching entry, a course detail, or the honest no-match text.
 */
export function answerQuestion(query: string, courses: Course[] = COURSES): HelperAnswer {
  const normalized = normalizeText(query)
  if (!normalized) {
    return { text: 'প্রশ্ন লিখে পাঠান — আমি SP Academy-র কোর্স, পরীক্ষা, পেমেন্ট ও সাপোর্ট নিয়ে উত্তর দিতে পারি।', matchedId: null }
  }
  let best: KnowledgeEntry | null = null
  let bestScore = 0
  for (const entry of KNOWLEDGE) {
    const score = scoreEntry(normalized, entry)
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }
  if (best && bestScore >= 2) {
    return { text: best.answer, matchedId: best.id, link: best.link }
  }
  const courseAnswer = findCourseAnswer(query, courses)
  if (courseAnswer) {
    return { text: courseAnswer, matchedId: 'course', link: { to: '/courses', label: 'সব কোর্স দেখুন' } }
  }
  return { text: NO_MATCH_TEXT, matchedId: null, link: { to: '/contact', label: 'সাপোর্ট টিকিট খুলুন' } }
}

/** Suggested questions shown as chips under the chat input. */
export function suggestedQuestions(): { id: string; question: string }[] {
  return KNOWLEDGE.filter((e) => ['enroll', 'free-courses', 'exam', 'payment', 'live-class', 'books'].includes(e.id)).map((e) => ({
    id: e.id,
    question: e.question,
  }))
}
