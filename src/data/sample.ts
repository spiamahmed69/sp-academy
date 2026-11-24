/**
 * SAMPLE DATA — Phase 1 only.
 * Every course / teacher / book / exam / testimonial / stat on this site is
 * নমুনা (sample) content for UI development. Nothing here is a real teacher,
 * a live price offer, or an official exam date. Real data arrives with
 * Firebase/Firestore in Phase 2. See README.md.
 */

export type GradientKey =
  | 'blue' | 'green' | 'purple' | 'orange' | 'violet' | 'teal' | 'pink' | 'amber'

export const GRADIENTS: Record<GradientKey, string> = {
  blue: 'var(--grad-cat-blue)',
  green: 'var(--grad-cat-green)',
  purple: 'var(--grad-cat-purple)',
  orange: 'var(--grad-cat-orange)',
  violet: 'var(--grad-cat-violet)',
  teal: 'var(--grad-cat-teal)',
  pink: 'var(--grad-cat-pink)',
  amber: 'var(--grad-cat-amber)',
}

export interface Category {
  id: string
  name: string
  nameEn: string
  description: string
  gradient: GradientKey
  courseCount: number
  icon: string
}

export const categories: Category[] = [
  { id: 'ssc', name: 'এসএসসি', nameEn: 'SSC', description: 'নবম–দশম শ্রেণির সম্পূর্ণ প্রস্তুতি', gradient: 'blue', courseCount: 12, icon: 'BookOpen' },
  { id: 'hsc', name: 'এইচএসসি', nameEn: 'HSC', description: 'বিজ্ঞান, মানবিক ও বাণিজ্য শাখা', gradient: 'green', courseCount: 14, icon: 'GraduationCap' },
  { id: 'admission', name: 'ভর্তি প্রস্তুতি', nameEn: 'Admission', description: 'বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি', gradient: 'purple', courseCount: 9, icon: 'Target' },
  { id: 'job', name: 'চাকরির প্রস্তুতি', nameEn: 'Job Prep', description: 'বিসিএস, ব্যাংক ও সরকারি চাকরি', gradient: 'orange', courseCount: 7, icon: 'Briefcase' },
  { id: 'english', name: 'ইংরেজি', nameEn: 'English', description: 'গ্রামার, স্পোকেন ও রাইটিং', gradient: 'violet', courseCount: 6, icon: 'Languages' },
  { id: 'math', name: 'গণিত', nameEn: 'Mathematics', description: 'বীজগণিত, জ্যামিতি ও ত্রিকোণমিতি', gradient: 'teal', courseCount: 8, icon: 'Calculator' },
  { id: 'science', name: 'বিজ্ঞান', nameEn: 'Science', description: 'পদার্থ, রসায়ন ও জীববিজ্ঞান', gradient: 'pink', courseCount: 10, icon: 'FlaskConical' },
  { id: 'ict', name: 'আইসিটি ও প্রোগ্রামিং', nameEn: 'ICT & Coding', description: 'আইসিটি, ওয়েব ও প্রোগ্রামিং', gradient: 'amber', courseCount: 5, icon: 'Code2' },
]

export interface Teacher {
  id: string
  name: string
  subject: string
  qualification: string
  experienceYears: number
  rating: number
  students: number
  courses: number
  initials: string
  gradient: GradientKey
  bio: string
}

export const teachers: Teacher[] = [
  { id: 't1', name: 'আরিফ হোসেন', subject: 'পদার্থবিজ্ঞান', qualification: 'এমএসসি, ঢাকা বিশ্ববিদ্যালয় (নমুনা)', experienceYears: 8, rating: 4.9, students: 12400, courses: 4, initials: 'আহ', gradient: 'blue', bio: 'নমুনা শিক্ষক প্রোফাইল — পদার্থবিজ্ঞানের জটিল বিষয় সহজ ভাষায় বোঝানোর অভিজ্ঞতা।' },
  { id: 't2', name: 'নুসরাত জাহান', subject: 'রসায়ন', qualification: 'এমএসসি, চট্টগ্রাম বিশ্ববিদ্যালয় (নমুনা)', experienceYears: 7, rating: 4.8, students: 9800, courses: 3, initials: 'নজ', gradient: 'green', bio: 'নমুনা শিক্ষক প্রোফাইল — রসায়নের প্রতিটি অধ্যায় হাতে-কলমে উদাহরণসহ শেখান।' },
  { id: 't3', name: 'তানভীর আহমেদ', subject: 'গণিত', qualification: 'বিএসসি, বুয়েট (নমুনা)', experienceYears: 10, rating: 4.9, students: 15200, courses: 5, initials: 'তআ', gradient: 'purple', bio: 'নমুনা শিক্ষক প্রোফাইল — গণিতের ভয় দূর করে ধাপে ধাপে সমাধানের কৌশল শেখান।' },
  { id: 't4', name: 'ফারহানা ইসলাম', subject: 'ইংরেজি', qualification: 'এমএ, জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (নমুনা)', experienceYears: 6, rating: 4.8, students: 8600, courses: 3, initials: 'ফই', gradient: 'orange', bio: 'নমুনা শিক্ষক প্রোফাইল — ইংরেজি গ্রামার ও স্পোকেন ইংলিশের সহজ পদ্ধতি।' },
  { id: 't5', name: 'সাকিব রহমান', subject: 'জীববিজ্ঞান', qualification: 'এমবিবিএস (নমুনা)', experienceYears: 5, rating: 4.7, students: 7300, courses: 2, initials: 'সর', gradient: 'teal', bio: 'নমুনা শিক্ষক প্রোফাইল — মেডিকেল ভর্তি প্রস্তুতি ও জীববিজ্ঞানের গভীর ধারণা।' },
  { id: 't6', name: 'মেহজাবিন চৌধুরী', subject: 'আইসিটি', qualification: 'বিএসসি, সাস্ট (নমুনা)', experienceYears: 6, rating: 4.8, students: 6400, courses: 3, initials: 'মচ', gradient: 'pink', bio: 'নমুনা শিক্ষক প্রোফাইল — আইসিটি ও প্রোগ্রামিংয়ের প্র্যাকটিক্যাল শেখানো।' },
]

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  categoryId: string
  instructorId: string
  price: number
  discountPrice?: number
  durationWeeks: number
  language: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  levelBn: string
  lessons: number
  students: number
  rating: number
  reviews: number
  isFeatured: boolean
  isNew: boolean
  isFree: boolean
  hasPreview: boolean
  gradient: GradientKey
  /** Firestore status when read live; sample courses have none (treated as published). */
  status?: 'draft' | 'published' | 'archived'
  chapters: { title: string; lessons: string[] }[]
}

export const courses: Course[] = [
  {
    id: 'c1', slug: 'hsc-physics-1st-paper', title: 'এইচএসসি পদার্থবিজ্ঞান ১ম পত্র', description: 'ভেক্টর থেকে তাপগতিবিদ্যা — প্রতিটি অধ্যায়ের লাইভ ক্লাস, নোট ও মডেল টেস্টসহ সম্পূর্ণ প্রস্তুতি।', categoryId: 'hsc', instructorId: 't1', price: 2500, discountPrice: 1499, durationWeeks: 16, language: 'বাংলা', level: 'Intermediate', levelBn: 'মধ্যম', lessons: 64, students: 3200, rating: 4.9, reviews: 412, isFeatured: true, isNew: false, isFree: false, hasPreview: true, gradient: 'blue',
    chapters: [{ title: 'ভৌত জগত ও পরিমাপ', lessons: ['ভৌত রাশি ও একক', 'মাত্রা ও ভুল', 'ফ্রি প্রিভিউ: ভেক্টর পরিচিতি'] }, { title: 'ভেক্টর', lessons: ['ভেক্টর যোগ-বিয়োগ', 'উপাংশ ও লব্ধি'] }, { title: 'গতিবিদ্যা', lessons: ['সরলরৈখিক গতি', 'প্রাসের গতি'] }],
  },
  {
    id: 'c2', slug: 'ssc-math-complete', title: 'এসএসসি গণিত সম্পূর্ণ কোর্স', description: 'বীজগণিত, জ্যামিতি, ত্রিকোণমিতি ও পরিসংখ্যান — বোর্ড পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি।', categoryId: 'ssc', instructorId: 't3', price: 1800, discountPrice: 999, durationWeeks: 20, language: 'বাংলা', level: 'Beginner', levelBn: 'প্রাথমিক', lessons: 72, students: 5400, rating: 4.8, reviews: 638, isFeatured: true, isNew: false, isFree: false, hasPreview: true, gradient: 'purple',
    chapters: [{ title: 'বীজগণিত', lessons: ['সূচক ও লগ', 'সমীকরণ সমাধান'] }, { title: 'জ্যামিতি', lessons: ['ত্রিভুজ', 'বৃত্ত'] }],
  },
  {
    id: 'c3', slug: 'medical-admission-biology', title: 'মেডিকেল ভর্তি: জীববিজ্ঞান', description: 'মেডিকেল ভর্তি পরীক্ষার জীববিজ্ঞান অংশের গভীর প্রস্তুতি — বিগত প্রশ্ন বিশ্লেষণসহ।', categoryId: 'admission', instructorId: 't5', price: 3000, discountPrice: 1999, durationWeeks: 12, language: 'বাংলা', level: 'Advanced', levelBn: 'উন্নত', lessons: 48, students: 2100, rating: 4.9, reviews: 287, isFeatured: true, isNew: true, isFree: false, hasPreview: true, gradient: 'teal',
    chapters: [{ title: 'কোষ ও এর গঠন', lessons: ['কোষ তত্ত্ব', 'কোষ অঙ্গাণু'] }, { title: 'মানবদেহ', lessons: ['পরিপাকতন্ত্র', 'রক্ত সংবহন'] }],
  },
  {
    id: 'c4', slug: 'hsc-chemistry-2nd-paper', title: 'এইচএসসি রসায়ন ২য় পত্র', description: 'জৈব রসায়ন থেকে পরিবেশ রসায়ন — হাতে-কলমে উদাহরণ ও নিয়মিত পরীক্ষাসহ।', categoryId: 'hsc', instructorId: 't2', price: 2200, discountPrice: 1399, durationWeeks: 14, language: 'বাংলা', level: 'Intermediate', levelBn: 'মধ্যম', lessons: 56, students: 2800, rating: 4.8, reviews: 356, isFeatured: true, isNew: false, isFree: false, hasPreview: false, gradient: 'green',
    chapters: [{ title: 'জৈব যৌগ', lessons: ['অ্যালকেন', 'অ্যালকিন'] }, { title: 'পরিবেশ রসায়ন', lessons: ['বায়ুমণ্ডল', 'পানি দূষণ'] }],
  },
  {
    id: 'c5', slug: 'spoken-english-beginner', title: 'স্পোকেন ইংলিশ: শূন্য থেকে শুরু', description: 'দৈনন্দিন কথোপকথন, উচ্চারণ ও আত্মবিশ্বাস — ৮ সপ্তাহে ইংরেজিতে কথা বলা শুরু করুন।', categoryId: 'english', instructorId: 't4', price: 1500, discountPrice: 899, durationWeeks: 8, language: 'বাংলা + English', level: 'Beginner', levelBn: 'প্রাথমিক', lessons: 32, students: 4100, rating: 4.7, reviews: 521, isFeatured: false, isNew: true, isFree: false, hasPreview: true, gradient: 'orange',
    chapters: [{ title: 'পরিচিতি ও অভিবাদন', lessons: ['নিজের পরিচয়', 'দৈনন্দিন বাক্য'] }],
  },
  {
    id: 'c6', slug: 'bcs-preliminary-math', title: 'বিসিএস প্রিলিমিনারি: গণিত ও মানসিক দক্ষতা', description: 'বিসিএস প্রিলির গণিত অংশের পূর্ণাঙ্গ প্রস্তুতি — শর্টকাট কৌশল ও মডেল টেস্টসহ।', categoryId: 'job', instructorId: 't3', price: 2000, discountPrice: 1299, durationWeeks: 10, language: 'বাংলা', level: 'Intermediate', levelBn: 'মধ্যম', lessons: 40, students: 3600, rating: 4.8, reviews: 298, isFeatured: false, isNew: true, isFree: false, hasPreview: true, gradient: 'violet',
    chapters: [{ title: 'পাটিগণিত', lessons: ['শতকরা', 'লাভ-ক্ষতি'] }, { title: 'মানসিক দক্ষতা', lessons: ['অনুপাত', 'ধারা'] }],
  },
  {
    id: 'c7', slug: 'free-ssc-ict-basics', title: 'ফ্রি কোর্স: এসএসসি আইসিটি বেসিক', description: 'কম্পিউটার পরিচিতি ও ইন্টারনেটের মূল ধারণা — সম্পূর্ণ ফ্রি, সবার জন্য উন্মুক্ত।', categoryId: 'ssc', instructorId: 't6', price: 0, durationWeeks: 4, language: 'বাংলা', level: 'Beginner', levelBn: 'প্রাথমিক', lessons: 16, students: 8900, rating: 4.6, reviews: 743, isFeatured: false, isNew: false, isFree: true, hasPreview: true, gradient: 'amber',
    chapters: [{ title: 'কম্পিউটার পরিচিতি', lessons: ['হার্ডওয়্যার', 'সফটওয়্যার'] }],
  },
  {
    id: 'c8', slug: 'free-hsc-english-grammar', title: 'ফ্রি কোর্স: এইচএসসি ইংরেজি গ্রামার', description: 'টেন্স, ভয়েস ও ন্যারেশন — বোর্ড পরীক্ষার জন্য অপরিহার্য গ্রামার, সম্পূর্ণ ফ্রি।', categoryId: 'hsc', instructorId: 't4', price: 0, durationWeeks: 4, language: 'বাংলা + English', level: 'Beginner', levelBn: 'প্রাথমিক', lessons: 18, students: 6700, rating: 4.7, reviews: 512, isFeatured: false, isNew: false, isFree: true, hasPreview: true, gradient: 'pink',
    chapters: [{ title: 'টেন্স', lessons: ['Present Tense', 'Past Tense'] }],
  },
]

export interface Book {
  id: string
  title: string
  author: string
  publisher: string
  category: string
  price: number
  discountPrice?: number
  rating: number
  reviews: number
  stock: number
  pages: number
  description: string
  gradient: GradientKey
}

export const books: Book[] = [
  { id: 'b1', title: 'এইচএসসি পদার্থবিজ্ঞান গাইড', author: 'আরিফ হোসেন (নমুনা)', publisher: 'SP প্রকাশনী (নমুনা)', category: 'এইচএসসি', price: 450, discountPrice: 350, rating: 4.8, reviews: 210, stock: 42, pages: 320, description: 'অধ্যায়ভিত্তিক ব্যাখ্যা, সূত্রের তালিকা ও বোর্ড প্রশ্নের সমাধানসহ।', gradient: 'blue' },
  { id: 'b2', title: 'এসএসসি গণিত সমাধান', author: 'তানভীর আহমেদ (নমুনা)', publisher: 'SP প্রকাশনী (নমুনা)', category: 'এসএসসি', price: 380, discountPrice: 299, rating: 4.9, reviews: 340, stock: 58, pages: 280, description: 'প্রতিটি অঙ্কের ধাপে ধাপে সমাধান ও শর্টকাট কৌশল।', gradient: 'purple' },
  { id: 'b3', title: 'মেডিকেল ভর্তি প্রশ্নব্যাংক', author: 'সাকিব রহমান (নমুনা)', publisher: 'SP প্রকাশনী (নমুনা)', category: 'ভর্তি', price: 550, discountPrice: 449, rating: 4.7, reviews: 156, stock: 25, pages: 410, description: 'বিগত ১০ বছরের প্রশ্ন ও ব্যাখ্যাসহ উত্তর।', gradient: 'teal' },
  { id: 'b4', title: 'বিসিএস প্রিলি মডেল টেস্ট', author: 'তানভীর আহমেদ (নমুনা)', publisher: 'SP প্রকাশনী (নমুনা)', category: 'চাকরি', price: 400, discountPrice: 320, rating: 4.6, reviews: 98, stock: 0, pages: 360, description: '৫০টি পূর্ণাঙ্গ মডেল টেস্ট ও উত্তরপত্রসহ।', gradient: 'orange' },
  { id: 'b5', title: 'ইংরেজি গ্রামার সহজে', author: 'ফারহানা ইসলাম (নমুনা)', publisher: 'SP প্রকাশনী (নমুনা)', category: 'ইংরেজি', price: 300, discountPrice: 240, rating: 4.8, reviews: 187, stock: 73, pages: 240, description: 'বাংলা ব্যাখ্যাসহ গ্রামারের সহজ নিয়ম।', gradient: 'violet' },
  { id: 'b6', title: 'এইচএসসি রসায়ন নোটবুক', author: 'নুসরাত জাহান (নমুনা)', publisher: 'SP প্রকাশনী (নমুনা)', category: 'এইচএসসি', price: 350, discountPrice: 280, rating: 4.7, reviews: 143, stock: 31, pages: 260, description: 'পরীক্ষার আগের রাতে পড়ার মতো সংক্ষিপ্ত নোট।', gradient: 'green' },
]

export interface LiveClass {
  id: string
  title: string
  teacherId: string
  subject: string
  startsAt: string
  durationMin: number
  enrolled: number
  isRecorded: boolean
}

export const liveClasses: LiveClass[] = [
  { id: 'l1', title: 'ভেক্টর: লাইভ সমস্যা সমাধান ক্লাস', teacherId: 't1', subject: 'পদার্থবিজ্ঞান', startsAt: '2026-12-02T19:00:00+06:00', durationMin: 90, enrolled: 1240, isRecorded: false },
  { id: 'l2', title: 'জৈব রসায়ন: অ্যালকেন ও অ্যালকিন', teacherId: 't2', subject: 'রসায়ন', startsAt: '2026-12-03T18:00:00+06:00', durationMin: 75, enrolled: 980, isRecorded: false },
  { id: 'l3', title: 'ত্রিকোণমিতি: বোর্ড প্রশ্নের ধরন', teacherId: 't3', subject: 'গণিত', startsAt: '2026-12-04T20:00:00+06:00', durationMin: 90, enrolled: 1560, isRecorded: false },
  { id: 'l4', title: 'ইংরেজি: ন্যারেশন সহজে', teacherId: 't4', subject: 'ইংরেজি', startsAt: '2026-12-05T17:00:00+06:00', durationMin: 60, enrolled: 720, isRecorded: false },
]

export interface ExamItem {
  id: string
  title: string
  subject: string
  type: string
  date: string
  durationMin: number
  marks: number
  questions: number
  enrolled: number
}

export const upcomingExams: ExamItem[] = [
  { id: 'e1', title: 'এইচএসসি পদার্থবিজ্ঞান মডেল টেস্ট ০১', subject: 'পদার্থবিজ্ঞান', type: 'মডেল টেস্ট', date: '২০২৬-১২-০৬', durationMin: 180, marks: 100, questions: 50, enrolled: 2340 },
  { id: 'e2', title: 'এসএসসি গণিত অধ্যায়ভিত্তিক টেস্ট', subject: 'গণিত', type: 'অধ্যায়ভিত্তিক', date: '২০২৬-১২-০৮', durationMin: 90, marks: 50, questions: 25, enrolled: 1890 },
  { id: 'e3', title: 'মেডিকেল ভর্তি পূর্ণাঙ্গ মডেল টেস্ট', subject: 'জীববিজ্ঞান', type: 'পূর্ণাঙ্গ', date: '২০২৬-১২-১২', durationMin: 180, marks: 200, questions: 100, enrolled: 3120 },
  { id: 'e4', title: 'বিসিএস প্রিলি মডেল টেস্ট ০৫', subject: 'সাধারণ জ্ঞান', type: 'মডেল টেস্ট', date: '২০২৬-১২-১৪', durationMin: 120, marks: 200, questions: 200, enrolled: 2750 },
]

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  readMin: number
  gradient: GradientKey
  body: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'hsc-routine-2026', title: 'এইচএসসি পরীক্ষার রুটিন যেভাবে সাজাবেন', excerpt: 'পরীক্ষার আগে শেষ ৩০ দিনের কার্যকর রুটিন ও রিভিশন কৌশল।', category: 'পড়াশোনার কৌশল', author: 'SP Academy টিম (নমুনা)', date: '২০২৬-১১-২০', readMin: 6, gradient: 'blue',
    body: ['পরীক্ষার আগের শেষ মাসটা সবচেয়ে গুরুত্বপূর্ণ। এই সময়ে নতুন কিছু শেখার চেয়ে রিভিশনেই বেশি মনোযোগ দেওয়া উচিত।', 'প্রতিদিনের রুটিনে তিনটি ব্লক রাখুন: সকালে কঠিন বিষয়, দুপুরে মডেল টেস্ট, রাতে হালকা রিভিশন।', 'মনে রাখবেন — এই ব্লগটি নমুনা কনটেন্ট। আসল পরীক্ষার রুটিন সবসময় শিক্ষা বোর্ডের অফিসিয়াল বিজ্ঞপ্তি থেকে যাচাই করুন।'],
  },
  {
    slug: 'math-fear-to-confidence', title: 'গণিতের ভয় দূর করার ৫টি উপায়', excerpt: 'গণিতে দুর্বল মনে হলেও ধাপে ধাপে অনুশীলনেই আত্মবিশ্বাস আসে।', category: 'পড়াশোনার কৌশল', author: 'SP Academy টিম (নমুনা)', date: '২০২৬-১১-১৮', readMin: 5, gradient: 'purple',
    body: ['গণিতের ভয় আসলে অপরিচয়ের ভয়। প্রতিদিন ৩০ মিনিট নিয়মিত অনুশীলন করলেই ধীরে ধীরে সহজ মনে হবে।', 'প্রতিটি অঙ্কের পেছনের ধারণাটা বুঝুন, শুধু সূত্র মুখস্থ করবেন না।'],
  },
  {
    slug: 'admission-mistakes', title: 'ভর্তি পরীক্ষায় যে ৭টি ভুল এড়িয়ে চলবেন', excerpt: 'ভালো প্রস্তুতি থাকলেও ছোট ভুলেই নম্বর কমে যেতে পারে।', category: 'ভর্তি প্রস্তুতি', author: 'SP Academy টিম (নমুনা)', date: '২০২৬-১১-১৫', readMin: 7, gradient: 'teal',
    body: ['সময় ব্যবস্থাপনা ভর্তি পরীক্ষার সবচেয়ে বড় চ্যালেঞ্জ। কঠিন প্রশ্নে আটকে না থেকে সহজগুলো আগে শেষ করুন।', 'পরীক্ষার আগের রাতে নতুন কিছু পড়বেন না — ঘুমই সবচেয়ে ভালো প্রস্তুতি।'],
  },
  {
    slug: 'free-resources-guide', title: 'ফ্রি রিসোর্স দিয়ে কীভাবে পড়াশোনা শুরু করবেন', excerpt: 'SP Academy-র ফ্রি কোর্স, নোট ও মডেল টেস্ট ব্যবহারের গাইড।', category: 'গাইড', author: 'SP Academy টিম (নমুনা)', date: '২০২৬-১১-১২', readMin: 4, gradient: 'orange',
    body: ['আমাদের ফ্রি কোর্সগুলো দিয়ে শুরু করুন, তারপর প্রয়োজন অনুযায়ী পেইড কোর্সে ভর্তি হোন।', 'প্রতিটি ফ্রি কোর্সেই প্রিভিউ লেসন ও নোট থাকে।'],
  },
]

export interface Testimonial {
  name: string
  role: string
  quote: string
  rating: number
  gradient: GradientKey
}

export const testimonials: Testimonial[] = [
  { name: 'রাফি (নমুনা)', role: 'এইচএসসি শিক্ষার্থী', quote: 'পদার্থবিজ্ঞান আমার সবচেয়ে কঠিন বিষয় ছিল। লাইভ ক্লাস আর নোটগুলো পড়ে এখন আত্মবিশ্বাস অনেক বেড়েছে।', rating: 5, gradient: 'blue' },
  { name: 'মীম (নমুনা)', role: 'এসএসসি শিক্ষার্থী', quote: 'গণিতের প্রতিটি অধ্যায় ধাপে ধাপে বোঝানো হয়। মডেল টেস্ট দিয়ে নিজের প্রস্তুতি যাচাই করতে পারি।', rating: 5, gradient: 'green' },
  { name: 'সজীব (নমুনা)', role: 'ভর্তি পরীক্ষার্থী', quote: 'মেডিকেল ভর্তির প্রশ্নব্যাংক আর মডেল টেস্টগুলো খুব কাজে দিয়েছে। সময়মতো সিলেবাস শেষ করতে পেরেছি।', rating: 4, gradient: 'purple' },
  { name: 'তানিয়া (নমুনা)', role: 'চাকরি প্রার্থী', quote: 'অফিসের পর রাতে রেকর্ডেড ক্লাস দেখে বিসিএসের প্রস্তুতি নিচ্ছি। নিজের সময়মতো পড়া যায় বলে সুবিধা।', rating: 5, gradient: 'orange' },
]

/** Sample platform statistics — নমুনা সংখ্যা, আসল ড্যাশবোর্ডে Firestore থেকে আসবে। */
export const sampleStats = [
  { label: 'নমুনা শিক্ষার্থী', value: '৫০,০০০+', valueEn: 50000 },
  { label: 'নমুনা কোর্স', value: '১২০+', valueEn: 120 },
  { label: 'নমুনা শিক্ষক', value: '৮০+', valueEn: 80 },
  { label: 'নমুনা সফলতার হার', value: '৯২%', valueEn: 92 },
]

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug)
}
export function getTeacherById(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id)
}
export function getBookById(id: string): Book | undefined {
  return books.find((b) => b.id === id)
}
export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((b) => b.slug === slug)
}
export function coursesByCategory(categoryId: string): Course[] {
  return courses.filter((c) => c.categoryId === categoryId)
}
export function coursesByTeacher(teacherId: string): Course[] {
  return courses.filter((c) => c.instructorId === teacherId)
}
