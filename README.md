# SP Academy

**Learn Today, Lead Tomorrow.**

Online education platform for students, teachers, and institutions in Bangladesh —
SSC, HSC, admission, job preparation, live classes, exams, books, and an AI study
assistant. Bengali + English, prices in BDT (৳).

> **Phases 1–4 are done in code.** The public website + design system work,
> auth is fully wired, courses + enrollment are wired to Firestore, and the
> student dashboard + lesson player work — but **no Firebase project exists
> yet**, so the live site runs in honest demo mode until the project is
> created and the `VITE_FIREBASE_*` env vars are set (see
> `docs/firebase-setup.md`). There is still **no backend, no payment, and no
> real AI**. Those arrive in Phases 5–10 (see `docs/architecture.md`).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # serve the production build locally
npm run test       # vitest
npm run typecheck  # tsc --noEmit
```

Requirements: Node.js 20+ and npm.

## Tech stack (Phase 1)

- React 19 + Vite 6 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router v7, TanStack Query v5, React Hook Form + Zod, Lucide Icons

## What is built (Phase 1)

- **Design system** — `src/styles/tokens.css` + `DESIGN_SYSTEM.md`. Reference-inspired
  tokens (page `#F5FAFE`, primary blue `#2396F6`, CTA orange `#FD9A2A`, headings
  `#213549`, footer `#01367F`, Hind Siliguri + Inter). The old navy + gold theme
  (`#182C4C` / `#F0B84B`) was explicitly rejected — do not reintroduce it.
- **Header / Footer** — floating pill nav with search + theme toggle; dark-navy footer
  with wave top.
- **Homepage** — hero + search, categories, featured & new courses, teachers, why us,
  statistics, live classes, exams, testimonials, books, blog, promo banner, newsletter.
- **Public pages (all routable)** — `/courses`, `/courses/:slug`, `/categories`,
  `/teachers`, `/teachers/:id`, `/free-courses`, `/live-classes`, `/exams`, `/results`,
  `/books`, `/books/:id`, `/blog`, `/blog/:slug`, `/about`, `/contact`, `/faq`,
  `/privacy`, `/terms`, `/refund`, `/login`, `/register`, `/forgot-password`, plus a 404 page.
- **States** — skeleton loading on course/book/free-course lists, empty states,
  error states with retry, toast notifications, accessible labelled forms with Zod
  validation, light + dark themes, responsive from 375px up.

## Honesty: demo / sample content

**Everything on the site right now is নমুনা (sample).** Courses, teachers, books,
exams, results, testimonials, and statistics are placeholder content for UI
development — no real teacher names, no live price offers, no official exam dates.
Sample content is labelled in the UI with a `নমুনা` badge or a demo notice, and the
auth pages state clearly that login/registration do not work yet (Phase 2).

Do not present this Phase 1 site to users as a live, purchasable platform.

## What is built (Phase 2)

- **Firebase config** — `src/firebase/config.ts`, env-only (`VITE_FIREBASE_*`),
  lazy init, honest "not configured" demo mode (never a fake login).
- **Authentication** — email/password register + login, Google sign-in, password
  reset, logout, `AuthContext` with auth state; `/login`, `/register`,
  `/forgot-password` are real when Firebase is configured.
- **Profiles + roles** — `users/{uid}` + `students/{uid}` in Firestore, new users
  are always `student`; roles `super_admin / admin / moderator / teacher /
  student` with guards (`src/lib/roles.ts`, `ProtectedRoute`); roles are never
  self-assigned — only an admin grants them (see `docs/firebase-setup.md` §6).
- **Dashboard + profile** — `/dashboard` (protected overview, sample enrolments
  labelled নমুনা) and `/profile` (edit own name/phone; email + role read-only).
- **Firestore rules** — `firestore.rules` v1 draft (own-doc only, role locked to
  `student` on create, admin-only role/permission writes).
- **Docs** — `docs/firebase-setup.md` (exact console steps to create the project).

## What is built (Phase 3)

- **Course model** — `src/firebase/courses.ts`: Firestore `courses/{id}` +
  `lessons` subcollection + `courseCategories/{id}` schemas, mapping to the
  UI `Course` shape, teacher/admin create/update service functions (UI for
  course management arrives with the teacher/admin dashboards).
- **Catalogue service** — `src/hooks/useCourses.ts`: `/courses` (filters/search/
  sort), `/courses/:slug`, `/free-courses` read Firestore (`status ==
  'published'`) when configured, labelled নমুনা data otherwise.
- **Enrollment** — `src/firebase/enrollments.ts`: `enrollments/{uid}_{courseId}`
  docs; **free courses only** from the client (paid enrollment waits for
  Phase 8 payments — the UI says so, never fakes a purchase). Free enrollment
  works in demo mode too, stored in this browser's localStorage and labelled
  ডেমো ভর্তি. Lesson completion + progress % live on the enrollment doc
  (Firestore) or locally (demo).
- **My Courses** — `/my-courses` (public page): real enrollments with progress
  bars when signed in, demo enrollments in demo mode, login prompt otherwise.
  `/dashboard` now shows real enrollments instead of the sample list.
- **Course details** — syllabus/lesson outline with preview + locked lessons,
  teacher, ৳ price, what is included, enrollment button with honest paid-course
  notice, enrolled progress bar + lesson check-off.
- **Firestore rules** — `firestore.rules` v2: published-only public course reads,
  admin/owning-teacher writes, free-only self-enrollment, owners update progress
  fields only.
- **Seed** — `src/firebase/seed.ts`: builds the 8 sample courses/categories/
  lesson outlines as Firestore docs for an admin to seed (see
  `docs/firebase-setup.md` §8). Never runs on its own.
- **Progress file** — `docs/progress.json`: machine-readable phase statuses
  (`done` / `in_progress` / `pending`) for the SP Academy progress graph page.
  Every future phase must update this file's statuses in its own commit
  (see `docs/architecture.md`).

## What is built (Phase 4)

- **Student dashboard overhaul** — `/dashboard`: enrolled-course count,
  completed lessons, overall progress %, certificates count; a Continue
  Learning card that resumes at the first incomplete lesson; all enrollments
  with progress bars; upcoming live-class + exam teasers (still নমুনা sample
  data until their phases land).
- **Lesson player** — `/courses/:slug/learn?lesson=<id>`: chapter-grouped
  lesson sidebar with completion checkmarks + locks, prev/next navigation,
  mark-complete toggle wired to the Phase 3 enrollment progress (Firestore
  transaction when configured, localStorage demo progress otherwise).
  Course-details "শেখা চালিয়ে যান" and My Courses buttons now open the
  player.
- **Honest video state** — there is NO real video hosting yet (Cloudflare
  Stream arrives in a later phase), so the player shows a clear "ভিডিও
  এখনো যুক্ত হয়নি" placeholder and never pretends a video is playing.
  Lesson text and PDF notes do not exist in the data yet — the page says
  so instead of inventing content or fake download links.
- **Certificates** — `src/firebase/certificates.ts`: read-only
  `certificates/{id}` service; the dashboard shows an honest empty state
  ("এখনো কোনো সার্টিফিকেট নেই") until exams (Phase 6) genuinely issue one.
  `firestore.rules` v3: certificates readable only by owner/admin, writes blocked.

## What is NOT done yet

- **Firebase project itself** — not created yet; needs the console steps in
  `docs/firebase-setup.md` + the six `VITE_FIREBASE_*` env vars (local
  `.env.local` and Vercel). Until then, enrollment is demo-only and the
  catalogue shows নমুনা data.
- **Phase 5** — Teacher dashboard, live-class scheduling
- **Phase 6** — Examination system, results, leaderboard
- **Phase 7** — Admin dashboard, reports, settings
- **Phase 8** — Payments (bKash/Nagad/SSLCommerz/Card/COD), bookstore orders, coupons
- **Phase 9** — AI Study Assistant, notifications, support tickets
- **Phase 10** — Security audit, testing, SEO, performance, production deployment

## Environment variables

Copy `.env.example` to `.env.local` when the Firebase project exists (see
`docs/firebase-setup.md`). Without the six `VITE_FIREBASE_*` vars the app runs
in honest demo mode. The `.env.example` contains empty placeholders only —
including `IMGBB_API_KEY=`, which is a **backend server-side placeholder**
(see `docs/architecture.md` § Media / ImgBB). Never put a real key in the frontend,
in a `VITE_*` variable, in browser requests, or in GitHub.

## Project structure

```
src/
  main.tsx            # QueryClient, Router, Toast providers
  App.tsx             # Routes, layout, toasts
  index.css           # Tailwind + reusable component classes
  styles/tokens.css   # Design tokens (source of truth)
  data/sample.ts      # Sample data (labelled নমুনা)
  firebase/           # config, courses, enrollments, certificates, seed, profiles
  lib/                # format helpers, toast context, roles, learn helpers
  hooks/              # useTheme, useCourses (catalogue + enrollments)
  components/         # Header, Footer, cards, ui states
  pages/              # Home + public pages + Dashboard, Learn, Profile, MyCourses
docs/
  architecture.md     # Full 10-phase plan + ImgBB media plan
  firebase-setup.md   # Firebase console steps (Phases 2–3)
  progress.json       # Machine-readable phase statuses (update every phase!)
DESIGN_SYSTEM.md
```

## Reference

Inspired by the general layout/UX of https://bondipathshala.education. No proprietary
code, branding, text, logo, teachers, phone number, or exact design was copied —
SP Academy is an original brand.
