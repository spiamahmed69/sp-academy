// Public routes of SP Academy — the single source of truth for
// scripts/prerender.mjs (static HTML per route) and
// scripts/generate-sitemap.mjs (sitemap.xml).
// Slugs/ids come from src/data/sample.ts so the list can never drift from
// the catalogue the pages actually render. Node 24 runs this file with
// built-in type stripping, so importing the .ts sample data works directly.
//
// Protected/app routes (dashboard, teacher, admin, learn, exam attempt /
// manage, profile, notifications) are intentionally NOT listed: they render
// auth-gated content and are served by the SPA shell at runtime.
import { blogPosts, books, courses, teachers } from '../src/data/sample.ts'

export const SITE_URL = 'https://sp-academy-rouge.vercel.app'

const STATIC_SEO = {
  '/': {
    title: 'SP Academy — Learn Today, Lead Tomorrow',
    description:
      'SP Academy — এসএসসি, এইচএসসি, এডমিশন ও চাকরির প্রস্তুতি, লাইভ ক্লাস, মডেল টেস্ট, বই ও AI স্টাডি সহায়তা — এক প্ল্যাটফর্মে।',
    priority: '1.0',
    changefreq: 'daily',
  },
  '/courses': {
    title: 'সব কোর্স',
    description: 'এসএসসি, এইচএসসি, ভর্তি প্রস্তুতি, চাকরির প্রস্তুতি ও ইংরেজি — SP Academy-র সব কোর্স এক জায়গায়।',
    priority: '0.9',
    changefreq: 'daily',
  },
  '/categories': {
    title: 'কোর্স ক্যাটাগরি',
    description: 'এসএসসি, এইচএসসি, ভর্তি প্রস্তুতি, চাকরি, ইংরেজি, গণিত, বিজ্ঞান ও আইসিটি — ক্যাটাগরি অনুযায়ী কোর্স খুঁজুন।',
    priority: '0.7',
    changefreq: 'weekly',
  },
  '/teachers': {
    title: 'আমাদের শিক্ষকরা',
    description: 'অভিজ্ঞ শিক্ষকদের কাছ থেকে শিখুন — পদার্থবিজ্ঞান, রসায়ন, গণিত, ইংরেজি, জীববিজ্ঞান ও আইসিটি।',
    priority: '0.7',
    changefreq: 'weekly',
  },
  '/free-courses': {
    title: 'ফ্রি কোর্স',
    description: 'সম্পূর্ণ ফ্রি কোর্স — এসএসসি আইসিটি বেসিক, এইচএসসি ইংরেজি গ্রামারসহ সবার জন্য উন্মুক্ত ক্লাস।',
    priority: '0.8',
    changefreq: 'weekly',
  },
  '/live-classes': {
    title: 'লাইভ ক্লাস',
    description: 'আসন্ন লাইভ ক্লাসের সময়সূচি — সরাসরি শিক্ষকের সাথে প্রশ্নোত্তর ও সমস্যা সমাধান।',
    priority: '0.8',
    changefreq: 'daily',
  },
  '/exams': {
    title: 'পরীক্ষা ও মডেল টেস্ট',
    description: 'মডেল টেস্ট ও পরীক্ষার তালিকা — টাইমারসহ পরীক্ষা দিন, ফলাফল দেখুন।',
    priority: '0.8',
    changefreq: 'weekly',
  },
  '/results': {
    title: 'ফলাফল',
    description: 'আপনার পরীক্ষার ফলাফল ও মেধাতালিকা দেখুন।',
    priority: '0.6',
    changefreq: 'weekly',
  },
  '/books': {
    title: 'বই',
    description: 'এইচএসসি গাইড, গণিত সমাধান, প্রশ্নব্যাংক ও মডেল টেস্টের বই — SP Academy বুকস্টোর।',
    priority: '0.8',
    changefreq: 'weekly',
  },
  '/cart': {
    title: 'কার্ট',
    description: 'আপনার কার্ট — বই ও কোর্সের অর্ডার দেখুন।',
    priority: '0.4',
    changefreq: 'monthly',
  },
  '/checkout': {
    title: 'চেকআউট',
    description: 'অর্ডার সম্পূর্ণ করুন — বিকাশ, নগদ, কার্ড বা ক্যাশ অন ডেলিভারি।',
    priority: '0.4',
    changefreq: 'monthly',
  },
  '/my-courses': {
    title: 'আমার কোর্স',
    description: 'আপনার ভর্তি হওয়া কোর্সগুলো ও শেখার অগ্রগতি।',
    priority: '0.5',
    changefreq: 'weekly',
  },
  '/my-orders': {
    title: 'আমার অর্ডার',
    description: 'আপনার বই ও কোর্সের অর্ডারের অবস্থা দেখুন।',
    priority: '0.4',
    changefreq: 'weekly',
  },
  '/blog': {
    title: 'ব্লগ',
    description: 'পড়াশোনার কৌশল, রুটিন ও ভর্তি প্রস্তুতির গাইড — SP Academy ব্লগ।',
    priority: '0.7',
    changefreq: 'weekly',
  },
  '/about': {
    title: 'আমাদের সম্পর্কে',
    description: 'SP Academy সম্পর্কে জানুন — Learn Today, Lead Tomorrow।',
    priority: '0.6',
    changefreq: 'monthly',
  },
  '/contact': {
    title: 'যোগাযোগ',
    description: 'SP Academy-র সাথে যোগাযোগ করুন — প্রশ্ন, মতামত বা সাহায্যের জন্য বার্তা পাঠান।',
    priority: '0.6',
    changefreq: 'monthly',
  },
  '/faq': {
    title: 'সচরাচর জিজ্ঞাসা',
    description: 'ভর্তি, পেমেন্ট, লাইভ ক্লাস ও পরীক্ষা নিয়ে সচরাচর প্রশ্নের উত্তর।',
    priority: '0.6',
    changefreq: 'monthly',
  },
  '/privacy': {
    title: 'গোপনীয়তা নীতি',
    description: 'SP Academy-র গোপনীয়তা নীতি — আপনার তথ্য কীভাবে ব্যবহার করা হয়।',
    priority: '0.3',
    changefreq: 'monthly',
  },
  '/terms': {
    title: 'শর্তাবলি',
    description: 'SP Academy ব্যবহারের শর্তাবলি।',
    priority: '0.3',
    changefreq: 'monthly',
  },
  '/refund': {
    title: 'রিফান্ড নীতি',
    description: 'SP Academy-র রিফান্ড নীতি — কোর্স ও বইয়ের অর্ডারের ক্ষেত্রে।',
    priority: '0.3',
    changefreq: 'monthly',
  },
  '/login': {
    title: 'লগইন',
    description: 'SP Academy অ্যাকাউন্টে লগইন করুন।',
    priority: '0.5',
    changefreq: 'monthly',
  },
  '/register': {
    title: 'রেজিস্ট্রেশন',
    description: 'SP Academy-তে নতুন অ্যাকাউন্ট খুলুন — বিনামূল্যে।',
    priority: '0.5',
    changefreq: 'monthly',
  },
  '/forgot-password': {
    title: 'পাসওয়ার্ড ভুলে গেছেন',
    description: 'SP Academy অ্যাকাউন্টের পাসওয়ার্ড রিসেট করুন।',
    priority: '0.3',
    changefreq: 'monthly',
  },
  '/ai-assistant': {
    title: 'AI স্টাডি সহায়ক',
    description: 'পড়াশোনার প্রশ্নের উত্তর পান — কোর্স ও সচরাচর প্রশ্ন থেকে সহজ সহায়তা।',
    priority: '0.6',
    changefreq: 'weekly',
  },
}

export const routes = [
  ...Object.entries(STATIC_SEO).map(([path, seo]) => ({ path, ...seo })),
  ...courses.map((c) => ({
    path: `/courses/${c.slug}`,
    title: c.title,
    description: c.description,
    priority: '0.8',
    changefreq: 'weekly',
  })),
  ...teachers.map((t) => ({
    path: `/teachers/${t.id}`,
    title: `${t.name} — ${t.subject}`,
    description: t.bio,
    priority: '0.6',
    changefreq: 'monthly',
  })),
  ...books.map((b) => ({
    path: `/books/${b.id}`,
    title: b.title,
    description: b.description,
    priority: '0.7',
    changefreq: 'weekly',
  })),
  ...blogPosts.map((p) => ({
    path: `/blog/${p.slug}`,
    title: p.title,
    description: p.excerpt,
    priority: '0.6',
    changefreq: 'monthly',
  })),
]
