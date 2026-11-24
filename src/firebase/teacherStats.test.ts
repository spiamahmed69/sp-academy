import { describe, expect, it } from 'vitest'
import {
  sampleCourseEnrollmentStat,
  summarizeTeacherStats,
  type CourseEnrollmentStat,
} from './teacherStats'
import type { Course } from '../data/sample'

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    slug: 'hsc-physics-1st-paper',
    title: 'এইচএসসি পদার্থবিজ্ঞান ১ম পত্র',
    description: '',
    categoryId: 'hsc',
    instructorId: 't1',
    price: 2500,
    durationWeeks: 16,
    language: 'বাংলা',
    level: 'Intermediate',
    levelBn: 'মধ্যম',
    lessons: 64,
    students: 3200,
    rating: 4.9,
    reviews: 412,
    isFeatured: true,
    isNew: false,
    isFree: false,
    hasPreview: true,
    gradient: 'blue',
    chapters: [],
    ...overrides,
  }
}

describe('summarizeTeacherStats', () => {
  it('sums students/lessons and averages progress only over courses with students', () => {
    const courses = [course(), course({ id: 'c2', lessons: 36, status: 'draft' })]
    const stats: CourseEnrollmentStat[] = [
      { courseId: 'c1', enrolledCount: 10, avgProgress: 50, totalCompletedLessons: 120 },
      { courseId: 'c2', enrolledCount: 0, avgProgress: 0, totalCompletedLessons: 0 },
    ]
    const s = summarizeTeacherStats(courses, stats)
    expect(s.totalCourses).toBe(2)
    expect(s.publishedCourses).toBe(1)
    expect(s.draftCourses).toBe(1)
    expect(s.totalStudents).toBe(10)
    expect(s.totalLessons).toBe(100)
    expect(s.overallAvgProgress).toBe(50)
  })

  it('returns zeros for an empty course list — never invents numbers', () => {
    const s = summarizeTeacherStats([], [])
    expect(s).toEqual({
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      totalStudents: 0,
      totalLessons: 0,
      overallAvgProgress: 0,
    })
  })

  it('treats a missing stat row as zero students', () => {
    const s = summarizeTeacherStats([course()], [])
    expect(s.totalStudents).toBe(0)
    expect(s.overallAvgProgress).toBe(0)
  })
})

describe('sampleCourseEnrollmentStat', () => {
  it('uses the sample students count for the demo preview', () => {
    const stat = sampleCourseEnrollmentStat(course())
    expect(stat.enrolledCount).toBe(3200)
    expect(stat.avgProgress).toBe(0)
  })
})
