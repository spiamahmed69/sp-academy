import { describe, expect, it } from 'vitest'
import { answerQuestion, findCourseAnswer, KNOWLEDGE, NO_MATCH_TEXT, normalizeText, suggestedQuestions } from './assistant'
import { courses as COURSES } from '../data/sample'

describe('normalizeText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeText('ভর্তি কীভাবে?')).toBe('ভর্তি কীভাবে')
    expect(normalizeText('  Free   Courses! ')).toBe('free courses')
  })
})

describe('answerQuestion', () => {
  it('matches the enrollment question by keyword', () => {
    const a = answerQuestion('কোর্সে কীভাবে ভর্তি হবো?')
    expect(a.matchedId).toBe('enroll')
    expect(a.text).toContain('ফ্রি কোর্সে')
  })

  it('matches payment questions and states the honest pending state', () => {
    const a = answerQuestion('বিকাশে পেমেন্ট করবো কীভাবে?')
    expect(a.matchedId).toBe('payment')
    expect(a.text).toContain('যাচাই করা যায় না')
  })

  it('answers honestly that it is not real AI', () => {
    const a = answerQuestion('তুমি কি আসল AI?')
    expect(a.matchedId).toBe('about-ai')
    expect(a.text).toContain('আসল AI নই')
  })

  it('returns the honest no-match text for unknown questions — never invents', () => {
    const a = answerQuestion('আগামীকাল ঢাকার আবহাওয়া কেমন হবে?')
    expect(a.matchedId).toBeNull()
    expect(a.text).toBe(NO_MATCH_TEXT)
    expect(a.text).toContain('বানিয়ে কিছু বলি না')
  })

  it('handles empty input without crashing', () => {
    const a = answerQuestion('   ')
    expect(a.matchedId).toBeNull()
    expect(a.text.length).toBeGreaterThan(0)
  })

  it('answers certificate questions with the honest Phase 10 state', () => {
    const a = answerQuestion('সার্টিফিকেট কি পাবো?')
    expect(a.matchedId).toBe('certificate')
    expect(a.text).toContain('Phase 10')
  })
})

describe('findCourseAnswer', () => {
  it('returns real catalogue data for a matching course', () => {
    const a = findCourseAnswer('পদার্থবিজ্ঞান কোর্সের দাম কত?', COURSES)
    expect(a).toContain('এইচএসসি পদার্থবিজ্ঞান ১ম পত্র')
    expect(a).toContain('৳১৪৯৯')
    expect(a).toContain('৬৪টি লেসন')
  })

  it('returns null when no course matches', () => {
    expect(findCourseAnswer('মঙ্গল গ্রহের ভূগোল কোর্স?', COURSES)).toBeNull()
  })
})

describe('suggestedQuestions', () => {
  it('returns only entries that exist in the knowledge base', () => {
    const ids = KNOWLEDGE.map((e) => e.id)
    for (const s of suggestedQuestions()) {
      expect(ids).toContain(s.id)
      expect(s.question.length).toBeGreaterThan(0)
    }
    expect(suggestedQuestions().length).toBeGreaterThanOrEqual(4)
  })
})
