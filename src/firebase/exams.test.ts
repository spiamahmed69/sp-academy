import { describe, expect, it } from 'vitest'
import {
  attemptDocId,
  computeRemainingMs,
  examFromDoc,
  examPhase,
  examTotalMarks,
  formatCountdown,
  isExamOpen,
  parseDemoAttempts,
  parseDemoExams,
  questionFromDoc,
  sampleExamToView,
  scoreAttempt,
  validateExamInput,
  type ExamCreateInput,
} from './exams'

const QUESTIONS = [
  { id: 'q1', marks: 5 },
  { id: 'q2', marks: 5 },
  { id: 'q3', marks: 10 },
]

describe('scoreAttempt', () => {
  it('scores all-correct answers with full marks', () => {
    const result = scoreAttempt({ q1: 0, q2: 1, q3: 2 }, QUESTIONS, { q1: 0, q2: 1, q3: 2 })
    expect(result.score).toBe(20)
    expect(result.totalMarks).toBe(20)
    expect(result.correctCount).toBe(3)
    expect(result.wrongCount).toBe(0)
    expect(result.skippedCount).toBe(0)
    expect(result.perQuestion).toEqual({ q1: 'correct', q2: 'correct', q3: 'correct' })
  })

  it('counts wrong and skipped separately, and never awards marks for them', () => {
    const result = scoreAttempt({ q1: 0, q2: 3 }, QUESTIONS, { q1: 0, q2: 1, q3: 2 })
    expect(result.score).toBe(5)
    expect(result.correctCount).toBe(1)
    expect(result.wrongCount).toBe(1)
    expect(result.skippedCount).toBe(1)
    expect(result.perQuestion).toEqual({ q1: 'correct', q2: 'wrong', q3: 'skipped' })
  })

  it('ignores answers for questions with no key (no invented marks)', () => {
    const result = scoreAttempt({ q1: 0 }, QUESTIONS, { q1: 0 })
    expect(result.score).toBe(5)
    expect(result.wrongCount).toBe(0)
    expect(result.skippedCount).toBe(2)
  })

  it('scores an empty answer sheet as zero', () => {
    const result = scoreAttempt({}, QUESTIONS, { q1: 0, q2: 1, q3: 2 })
    expect(result.score).toBe(0)
    expect(result.skippedCount).toBe(3)
  })
})

describe('computeRemainingMs + formatCountdown', () => {
  it('counts down from the start time and floors at zero', () => {
    expect(computeRemainingMs(1_000_000, 30, 1_000_000 + 10 * 60_000)).toBe(20 * 60_000)
    expect(computeRemainingMs(1_000_000, 30, 1_000_000 + 60 * 60_000)).toBe(0)
    expect(computeRemainingMs(0, 30, Date.now())).toBe(30 * 60_000)
  })

  it('formats mm:ss with Bengali digits', () => {
    expect(formatCountdown(12 * 60_000 + 34_000)).toBe('১২:৩৪')
    expect(formatCountdown(5_000)).toBe('০:০৫')
    expect(formatCountdown(-100)).toBe('০:০০')
  })
})

describe('attemptDocId', () => {
  it('is deterministic — one attempt per student per exam', () => {
    expect(attemptDocId('u1', 'e1')).toBe('u1_e1')
    expect(attemptDocId('u1', 'e1')).toBe(attemptDocId('u1', 'e1'))
    expect(attemptDocId('u1', 'e2')).not.toBe(attemptDocId('u1', 'e1'))
  })
})

describe('examPhase + isExamOpen', () => {
  const now = Date.parse('2026-12-06T10:00:00+06:00')
  it('draft is never open', () => {
    expect(isExamOpen({ status: 'draft', scheduledAt: null, durationMin: 60 }, now)).toBe(false)
  })
  it('published without a schedule is open', () => {
    expect(isExamOpen({ status: 'published', scheduledAt: null, durationMin: 60 }, now)).toBe(true)
  })
  it('future schedule is upcoming, past window is closed', () => {
    expect(examPhase({ status: 'published', scheduledAt: '2026-12-06T12:00:00+06:00', durationMin: 60 }, now)).toBe('upcoming')
    expect(examPhase({ status: 'published', scheduledAt: '2026-12-06T08:00:00+06:00', durationMin: 60 }, now)).toBe('closed')
    expect(examPhase({ status: 'published', scheduledAt: '2026-12-06T09:30:00+06:00', durationMin: 60 }, now)).toBe('open')
  })
})

const validInput: ExamCreateInput = {
  title: 'পদার্থবিজ্ঞান মডেল টেস্ট',
  subject: 'পদার্থবিজ্ঞান',
  type: 'model',
  durationMin: 60,
  scheduledAt: '',
  questions: [
    { text: 'আলোর বেগ কত?', options: ['৩×১০⁸ মি/সে', '৩×১০⁶ মি/সে', '৩×১০⁵ মি/সে', '৩×১০⁷ মি/সে'], correctIndex: 0, marks: 5 },
    { text: 'পানির সংকেত কী?', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], correctIndex: 1, marks: 5 },
  ],
}

describe('validateExamInput', () => {
  it('accepts a valid exam', () => {
    expect(validateExamInput(validInput)).toEqual([])
  })
  it('rejects a short title, missing subject and bad duration', () => {
    const errors = validateExamInput({ ...validInput, title: 'ক', subject: '', durationMin: 2 })
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
  it('rejects an exam with no questions', () => {
    expect(validateExamInput({ ...validInput, questions: [] }).length).toBeGreaterThan(0)
  })
  it('rejects a question with an empty option or no correct answer', () => {
    const bad: ExamCreateInput = {
      ...validInput,
      questions: [{ text: 'প্রশ্ন?', options: ['ক', '', 'গ', 'ঘ'], correctIndex: 4, marks: 5 }],
    }
    expect(validateExamInput(bad).length).toBeGreaterThanOrEqual(2)
  })
  it('rejects a bad scheduledAt', () => {
    expect(validateExamInput({ ...validInput, scheduledAt: 'not-a-date' }).length).toBe(1)
  })
})

describe('examTotalMarks', () => {
  it('sums question marks', () => {
    expect(examTotalMarks(validInput.questions)).toBe(10)
    expect(examTotalMarks([])).toBe(0)
  })
})

describe('questionFromDoc + examFromDoc', () => {
  it('rejects questions without exactly 4 non-empty options', () => {
    expect(questionFromDoc('q1', { text: 'ক?', options: ['ক', 'খ'], marks: 1 })).toBeNull()
    expect(questionFromDoc('q1', { text: 'ক?', options: ['ক', 'খ', 'গ', 'ঘ'], marks: 1 })).not.toBeNull()
  })
  it('rejects exams without a title or teacher', () => {
    expect(examFromDoc('e1', { title: '', teacherId: 't1', durationMin: 30 })).toBeNull()
    expect(examFromDoc('e1', { title: 'পরীক্ষা', teacherId: '', durationMin: 30 })).toBeNull()
    expect(examFromDoc('e1', { title: 'পরীক্ষা', teacherId: 't1', durationMin: 30 })).not.toBeNull()
  })
})

describe('demo parsers', () => {
  it('parseDemoExams ignores malformed / foreign data', () => {
    expect(parseDemoExams('not json')).toEqual([])
    expect(parseDemoExams(JSON.stringify([{ id: 'x' }]))).toEqual([])
    expect(parseDemoExams(null)).toEqual([])
    const parsed = parseDemoExams(
      JSON.stringify([
        {
          id: 'd1',
          title: 'ডেমো পরীক্ষা',
          subject: 'গণিত',
          type: 'mcq',
          durationMin: 30,
          status: 'published',
          questions: [{ id: 'q1', text: '২+২=?', options: ['৩', '৪', '৫', '৬'], correctIndex: 1, marks: 5, order: 0 }],
        },
      ]),
    )
    expect(parsed).toHaveLength(1)
    expect(parsed[0].questions).toHaveLength(1)
  })

  it('parseDemoAttempts ignores malformed / foreign data', () => {
    expect(parseDemoAttempts('garbage')).toEqual([])
    expect(parseDemoAttempts(JSON.stringify([{ examId: 'e1' }]))).toEqual([])
    const parsed = parseDemoAttempts(
      JSON.stringify([{ examId: 'e1', examTitle: 'পরীক্ষা', score: 5, totalMarks: 10, correctCount: 1, wrongCount: 0, skippedCount: 1 }]),
    )
    expect(parsed).toHaveLength(1)
    expect(parsed[0].status).toBe('evaluated')
  })
})

describe('sampleExamToView (Phase 10 regression)', () => {
  const base = {
    id: 'e1',
    title: 'এইচএসসি পদার্থবিজ্ঞান মডেল টেস্ট ০১',
    subject: 'পদার্থবিজ্ঞান',
    type: 'মডেল টেস্ট',
    durationMin: 180,
    marks: 100,
    questions: 50,
    enrolled: 2340,
  }
  it('parses Bengali-digit sample dates instead of throwing', () => {
    const view = sampleExamToView({ ...base, date: '২০২৬-১২-০৬' })
    expect(view.scheduledAt).toBe('2026-12-05T18:00:00.000Z')
    expect(view.source).toBe('sample')
  })
  it('degrades an unparseable date to null, never a crash', () => {
    const view = sampleExamToView({ ...base, date: 'not-a-date' })
    expect(view.scheduledAt).toBeNull()
  })
})
