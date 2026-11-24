import { describe, expect, it } from 'vitest'
import {
  courseFromDoc,
  courseToDoc,
  lessonsFromCourse,
} from './courses'
import { buildCourseSeedDocs, buildCategorySeedDocs, buildLessonSeedDocs } from './seed'
import { courses } from '../data/sample'

describe('courseFromDoc (Phase 3)', () => {
  it('maps a full Firestore doc to the UI Course shape', () => {
    const course = courseFromDoc('c1', {
      slug: 'hsc-physics-1st-paper',
      title: 'এইচএসসি পদার্থবিজ্ঞান ১ম পত্র',
      description: 'desc',
      categoryId: 'hsc',
      instructorId: 't1',
      price: 2500,
      discountPrice: 1499,
      durationWeeks: 16,
      language: 'বাংলা',
      level: 'Intermediate',
      levelBn: 'মধ্যম',
      lessonsCount: 64,
      studentsCount: 3200,
      rating: 4.9,
      reviewsCount: 412,
      isFeatured: true,
      isNew: false,
      isFree: false,
      hasPreview: true,
      gradient: 'blue',
      chapters: [{ title: 'ভেক্টর', lessonTitles: ['ভেক্টর যোগ-বিয়োগ'] }],
    })
    expect(course.id).toBe('c1')
    expect(course.slug).toBe('hsc-physics-1st-paper')
    expect(course.lessons).toBe(64)
    expect(course.students).toBe(3200)
    expect(course.reviews).toBe(412)
    expect(course.chapters).toEqual([{ title: 'ভেক্টর', lessons: ['ভেক্টর যোগ-বিয়োগ'] }])
  })

  it('fills safe defaults for missing / invalid fields (never crashes)', () => {
    const course = courseFromDoc('x1', { title: 'টেস্ট' })
    expect(course.slug).toBe('x1')
    expect(course.price).toBe(0)
    expect(course.isFree).toBe(true)
    expect(course.level).toBe('Beginner')
    expect(course.gradient).toBe('blue')
    expect(course.lessons).toBe(0)
    expect(course.chapters).toEqual([])
  })

  it('falls back on an unknown gradient / level instead of passing it through', () => {
    const course = courseFromDoc('x2', { gradient: 'neon', level: 'Expert', price: 100 })
    expect(course.gradient).toBe('blue')
    expect(course.level).toBe('Beginner')
  })

  it('derives the lesson count from chapters when lessonsCount is missing', () => {
    const course = courseFromDoc('x3', {
      chapters: [
        { title: 'A', lessonTitles: ['a1', 'a2'] },
        { title: 'B', lessonTitles: ['b1'] },
      ],
    })
    expect(course.lessons).toBe(3)
  })
})

describe('courseToDoc (Phase 3)', () => {
  it('round-trips a sample course (published by default)', () => {
    const sample = courses[0]
    const doc = courseToDoc(sample)
    expect(doc.slug).toBe(sample.slug)
    expect(doc.status).toBe('published')
    expect(doc.lessonsCount).toBe(sample.lessons)
    expect(doc.studentsCount).toBe(sample.students)
    expect(doc.chapters).toEqual(sample.chapters.map((c) => ({ title: c.title, lessonTitles: c.lessons })))
    const back = courseFromDoc(sample.id, doc as unknown as Record<string, unknown>)
    expect(back.title).toBe(sample.title)
    expect(back.price).toBe(sample.price)
  })

  it('marks a draft when asked', () => {
    expect(courseToDoc(courses[0], 'draft').status).toBe('draft')
  })
})

describe('lessonsFromCourse (Phase 3)', () => {
  it('flattens chapters into ordered lesson views', () => {
    const lessons = lessonsFromCourse(courses[0])
    const expected = courses[0].chapters.reduce((n, c) => n + c.lessons.length, 0)
    expect(lessons).toHaveLength(expected)
    expect(lessons[0].chapterTitle).toBe(courses[0].chapters[0].title)
    expect(lessons[0].order).toBe(0)
    expect(lessons[lessons.length - 1].order).toBe(expected - 1)
  })

  it('marks "ফ্রি প্রিভিউ" lessons as preview', () => {
    const lessons = lessonsFromCourse(courses[0])
    const preview = lessons.find((l) => l.title.startsWith('ফ্রি প্রিভিউ'))
    expect(preview?.isPreview).toBe(true)
  })
})

describe('seed builders (Phase 3)', () => {
  it('builds one published seed doc per sample course, with unique slugs', () => {
    const seeds = buildCourseSeedDocs()
    expect(seeds).toHaveLength(courses.length)
    const slugs = seeds.map((s) => s.doc.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(seeds.every((s) => s.doc.status === 'published')).toBe(true)
  })

  it('builds one seed doc per sample category', () => {
    expect(buildCategorySeedDocs()).toHaveLength(8)
  })

  it('builds lesson seeds matching the chapter outline', () => {
    const course = courses[0]
    const lessons = buildLessonSeedDocs(course)
    const expected = course.chapters.reduce((n, c) => n + c.lessons.length, 0)
    expect(lessons).toHaveLength(expected)
    expect(lessons[0].courseId).toBe(course.id)
    expect(lessons.map((l) => l.order)).toEqual(lessons.map((_, i) => i))
  })
})
