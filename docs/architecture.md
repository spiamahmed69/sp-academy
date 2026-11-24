# SP Academy — Architecture

Tagline: **"Learn Today, Lead Tomorrow."** Audience: students, teachers, and
educational institutions in Bangladesh. Languages: Bengali + English. Currency: BDT (৳).

## Target stack (full platform)

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4, React Router v7, TanStack Query, React Hook Form + Zod, Lucide Icons |
| Backend | Node.js + Express.js + Firebase Admin SDK, REST API, Zod validation, auth middleware |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (email/password, phone where supported, Google Sign-in) |
| Media | ImgBB (public images, via backend only) · Cloudflare R2 / Stream (videos) · Firebase Storage (private files only) |
| Hosting | Frontend: Vercel · Backend: Node.js hosting · DB: Firestore |

## Phase 1 — DONE (this repo)

**Scope:** project setup, design system, header/footer, homepage, all 23 responsive
public pages, sample data (labelled নমুনা), skeleton/empty/error states, toasts,
accessible forms, light/dark themes. **Local only** — no Firebase, no backend, no
GitHub push, no Vercel deploy.

**Files:** `src/` (see README.md), `DESIGN_SYSTEM.md`, `docs/architecture.md`.

## Phase 2 — DONE (this repo)

**Scope:** Firebase config (env-only, `src/firebase/config.ts`), Auth wiring
(email/password, Google, password reset, logout, `AuthContext`), user profiles
(`users/{uid}` + `students/{uid}`, always `student` at registration), roles
(`super_admin, admin, moderator, teacher, student` — `src/lib/roles.ts`),
protected + role-based route guards, `/dashboard` overview and `/profile`
settings pages, `firestore.rules` v1 draft, `docs/firebase-setup.md`.

**Honest demo mode:** no Firebase project exists yet, so without
`VITE_FIREBASE_*` env vars the auth pages say so clearly and never fake a
login. To go live, follow `docs/firebase-setup.md` (create project, enable
Email/Password + Google, create Firestore in `asia-southeast1`, publish
`firestore.rules`, set the first admin via custom claim) and add the six
`VITE_FIREBASE_*` vars to `.env.local` + Vercel.

**Files:** `src/firebase/`, `src/contexts/AuthContext.tsx`,
`src/components/ProtectedRoute.tsx`, `src/pages/Dashboard.tsx`,
`src/pages/Profile.tsx`, `firestore.rules`, `docs/firebase-setup.md`.

## Phase 3 — DONE (this repo)

**Scope:** Firestore course model (`courses/{id}` + `lessons` subcollection +
`courseCategories/{id}`, `src/firebase/courses.ts`), catalogue service
(`src/hooks/useCourses.ts`) wiring `/courses`, `/courses/:slug` and
`/free-courses` to Firestore when configured (labelled নমুনা data otherwise),
enrollment (`src/firebase/enrollments.ts`, `enrollments/{uid}_{courseId}` —
free courses only from the client; paid waits for Phase 8), lesson completion
+ progress % on the enrollment doc (localStorage in demo mode, labelled
ডেমো ভর্তি), `/my-courses` page, real enrollments on `/dashboard`,
`firestore.rules` v2 (published-only reads, admin/owning-teacher writes,
free-only self-enrollment), seed helper (`src/firebase/seed.ts`),
`docs/progress.json`.

**Honest demo mode:** still no Firebase project, so without
`VITE_FIREBASE_*` env vars the catalogue shows নমুনা data and free-course
enrollment is demo-only (this browser's localStorage). Paid courses never
enroll and never fake a payment — the UI says payment arrives in Phase 8.

**Files:** `src/firebase/courses.ts`, `src/firebase/enrollments.ts`,
`src/firebase/seed.ts`, `src/hooks/useCourses.ts`, `src/pages/MyCourses.tsx`,
`src/pages/Courses.tsx`, `src/pages/FreeCourses.tsx`, `src/pages/Dashboard.tsx`,
`firestore.rules`, `docs/progress.json`, `docs/firebase-setup.md` §8.

## Phase 4 — IN PROGRESS (this repo)

**Scope:** student dashboard overhaul (`/dashboard`: overall progress %,
continue-learning card resuming at the first incomplete lesson, all
enrollments with progress bars, certificates section, upcoming live-class
+ exam teasers — the two teaser lists are still নমুনা sample data),
lesson player (`/courses/:slug/learn?lesson=<id>`: chapter-grouped lesson
sidebar, prev/next navigation, mark-complete toggle wired to the Phase 3
enrollment progress — Firestore transaction when configured, localStorage
demo progress otherwise), certificates service
(`src/firebase/certificates.ts`: read-only `certificates/{id}`, empty
until exams in Phase 6 issue any), `firestore.rules` v3 (certificates
readable only by owner/admin, writes blocked).

**Honest video state:** there is NO real video hosting yet (Cloudflare
Stream arrives in a later phase), so the player shows a clear "ভিডিও
এখনো যুক্ত হয়নি" placeholder and never pretends a video is playing.
Lesson text and PDF notes do not exist in the data yet either — the page
says so instead of inventing content or fake download links. No fake
certificates: the dashboard shows "এখনো কোনো সার্টিফিকেট নেই" until one
is genuinely earned.

**Files:** `src/pages/Learn.tsx`, `src/lib/learn.ts`,
`src/firebase/certificates.ts`, `src/pages/Dashboard.tsx`,
`src/pages/Courses.tsx`, `src/pages/MyCourses.tsx`, `src/App.tsx`,
`src/hooks/useCourses.ts`, `firestore.rules`, `docs/progress.json`.

## Progress tracking — docs/progress.json (every phase must update it)

`docs/progress.json` is the machine-readable source for the SP Academy
progress graph page: `{ "updated_at": "<ISO date>", "phases": [{ "id", "name",
"status": "done" | "in_progress" | "pending", "note" }] }` — one entry per
phase, 1–10. **Rule: every future phase must update this file's statuses in
its own commit** — mark the phase `in_progress` when work starts and `done`
(with a short note, e.g. the live URL) when it ships. Never leave a shipped
phase as `pending` or `in_progress`.

## Phases 5–10 (planned, not implemented)

| Phase | Scope | Key deliverables |
| --- | --- | --- |
| 4 | Student dashboard — IN PROGRESS | Overview, My Courses, Continue Learning, lesson player + progress, notes/PDFs, certificates |
| 5 | Teacher dashboard | Assigned courses/lessons, live-class scheduling, attendance |
| 6 | Examination system | MCQ/CQ, chapter/subject/model/full tests, server-side answer keys, auto + manual evaluation, results, leaderboard, analytics |
| 7 | Admin dashboard | Users/roles, courses, exams, books, orders, payments, banners, notifications, reports, settings, audit logs — real DB values only |
| 8 | Payments + Bookstore | bKash / Nagad / SSLCommerz / Card / COD — server-side initiation, callback + webhook verification, idempotent processing, refunds; book catalog, cart, checkout, delivery tracking |
| 9 | AI + Support | AI Study Assistant via backend (keys server-side, rate limits, validation), notifications, support tickets |
| 10 | Hardening + Launch | Security audit, automated tests (auth, roles, enrollment, exam, payments, uploads, rules), SEO/prerendering, performance, production deployment |

## Firestore collections (planned + live)

Live since Phase 2–4: `users, roles, permissions, students, teachers,
courses, courseCategories, enrollments, certificates`, plus the `lessons` subcollection
under each course. Lesson progress lives on the enrollment doc
(`completedLessonIds`, `progressPercent`) — no separate `lessonProgress`
collection was needed. Certificates are read-only for the owner/admin
until Phase 6 issues them server-side. Remaining planned collections: `chapters, liveClasses,
classAttendance, exams, questions, examAttempts, examAnswers, examResults,
certificates, books, authors, publishers, carts, orders, payments, coupons,
reviews, blogs, banners, notifications, supportTickets, settings, auditLogs`

Rules: pagination on large collections, batched writes/transactions where needed,
server timestamps on important records, no unbounded queries, no duplicated
sensitive data. Roles verified by backend logic + security rules; users can never
assign themselves privileged roles.

## Backend API (planned)

REST by module under `/api/`: `auth, users, students, teachers, courses, categories,
enrollments, chapters, lessons, live-classes, exams, exam-attempts, results,
certificates, books, orders, payments, coupons, reviews, blogs, notifications,
support, admin, ai` — with auth middleware, role authorization, Zod validation,
error handling, rate limiting, request logging, secure CORS, consistent responses.

## Media / ImgBB — centralized public-image hosting (SPEC — Phase 1 records only)

> **Status:** specification only. Phase 1 implements **no upload** and embeds **no
> API key anywhere**. Uploads arrive with the Node.js + Express backend (Phase 2+).

### What ImgBB is for (public images only)

Hero/promotional banners, course thumbnails/covers, teacher/author/publisher images,
book covers, blog images, category/logo/event images.

### What ImgBB is NEVER for

Private student documents, exam sheets/answer scripts, or any private file.
Private files use Firebase Storage with access rules.

### How uploads will work (future backend)

1. Admin/teacher uploads from the dashboard → request goes to the **Node.js +
   Express backend** (authenticated + role-checked).
2. Backend validates the file, then uploads to ImgBB with the key from **server-side
   environment variables only**.
3. Backend stores the returned URL + metadata in Firestore and returns the URL to
   the client.
4. The key **never** appears in React source, browser requests, `VITE_*` env vars,
   public env files, or GitHub. `.env.example` carries only the empty placeholder
   `IMGBB_API_KEY=` (backend server env, not a Vite variable).

### Firestore image metadata fields

Every uploaded public image gets a Firestore record with:

| Field | Type | Meaning |
| --- | --- | --- |
| `imageId` | string | ImgBB image id (delete-hash kept server-side only, never in the client) |
| `imageUrl` | string | Public `https://i.ibb.co/...` URL used by the frontend |
| `imageType` | string | Purpose: `hero` \| `banner` \| `course-thumbnail` \| `teacher` \| `author` \| `publisher` \| `book-cover` \| `blog` \| `category` \| `logo` \| `event` |
| `uploadedBy` | string (uid) | UID of the admin/teacher who uploaded |
| `uploadedAt` | Timestamp | Server timestamp |
| `relatedDocumentId` | string | ID of the linked Firestore document (course, book, blog post, teacher, …) |

### Rules

- **Formats:** JPG / JPEG / PNG / WebP only. Reject anything else with a clear error.
- **Validation:** MIME-type check (not just extension) + file-size limit enforced on
  the backend before upload.
- **UX:** image preview before upload, upload progress indicator, clear error
  messages, retry support.
- **Rendering:** lazy loading (`loading="lazy"`) for below-the-fold images, a
  fallback image/gradient when a URL fails, responsive sizes where sensible.
- **Lifecycle:** deleting a Firestore image record does **not** delete the ImgBB
  original — cleanup is a separate, deliberate backend action (ImgBB delete URL
  with the server-held delete hash). Do not expose delete hashes to the client.
- **Security:** uploads are authenticated + role-checked; no direct browser → ImgBB
  calls; no key in any client bundle.

## Security principles (all phases)

Firebase Auth verification, Admin SDK on the backend, Firestore rules, server-side
role + ownership checks, input validation, output sanitization, rate limiting,
secure headers, secret management, payment verification, protected media access,
audit logging, App Check where appropriate. Never commit credentials or service
account JSON. Exam answer keys stay server-side; frontend timers are never trusted
for exam security. Payments are never trusted from frontend success messages.
No card numbers / CVV stored.

## SEO & performance (planned, Phase 10)

Unique titles/meta, canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`,
structured data, search-friendly course/book URLs, prerendering/SSR strategy
(standard Vite SPA alone is not assumed to be SEO-complete), optimized + lazy
images, code splitting, route-based loading, caching, accessibility, Core Web Vitals.
