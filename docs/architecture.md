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

## Phase 4 — DONE (this repo)

**Scope:** student dashboard overhaul (`/dashboard`: overall progress %,
continue-learning card resuming at the first incomplete lesson, all
enrollments with progress bars, certificates section, upcoming live-class
+ exam teasers — the two teaser lists are still নমুনা sample data),
lesson player (`/courses/:slug/learn?lesson=<id>`: chapter-grouped lesson
sidebar, prev/next navigation, mark-complete toggle wired to the Phase 3
enrollment progress — Firestore transaction when configured, localStorage
demo progress otherwise), certificates service
(`src/firebase/certificates.ts`: read-only `certificates/{id}`, empty
until the backend (Phase 10) issues any), `firestore.rules` v3 (certificates
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

## Phase 5 — DONE (this repo)

**Scope:** teacher dashboard (`/teacher`: own courses with status, live
enrollment counts + average progress per course, lesson/class stats, add-lesson
form per course, student-stats table), live-class model
(`liveClasses/{id}`, `src/firebase/liveClasses.ts` — schedule list,
upcoming/past split, join-link handling, teacher scheduling form with Zod
validation), `/live-classes` rewired to Firestore when configured (labelled
নমুনা sample otherwise), student dashboard teaser rewired to the same
service, header + dashboard links to `/teacher` for teacher/admin roles,
`firestore.rules` v4 (liveClasses rules, teachers may read enrollments of
their own courses, `classAttendance` reserved).

**Honest live-class state:** there is STILL no real video-call integration,
so a class never pretends to be live. The join button renders a real link
ONLY when the class document has a `joinUrl`; otherwise the UI says the link
will appear before the class starts. A recording link renders ONLY when a
`recordingUrl` exists. Attendee counts show ONLY when known (sample counts
labelled নমুনা; Firestore classes show no invented count). No earnings, no
fake students: the demo preview shows sample counts with a নমুনা badge and
no student names; the real dashboard shows counts + average progress only,
because enrollments carry no names and teachers cannot read other users'
profile docs. Attendance marking is intentionally NOT built — without a real
live session, marking who attended would be invented data; it arrives with
a real live-class integration.

**Files:** `src/pages/TeacherDashboard.tsx`, `src/firebase/liveClasses.ts`,
`src/firebase/liveClasses.test.ts`, `src/firebase/teacherStats.ts`,
`src/firebase/teacherStats.test.ts`, `src/hooks/useLiveClasses.ts`,
`src/hooks/useTeacher.ts`, `src/pages/LiveClasses.tsx`,
`src/pages/Dashboard.tsx`, `src/components/Header.tsx`, `src/App.tsx`,
`firestore.rules`, `docs/architecture.md`, `README.md`.

## Phase 6 — DONE (this repo)

**Scope:** exam system — Firestore exam model (`exams/{id}` metadata only,
`exams/{id}/questions/{qid}` student-safe questions with NO answers,
`examKeys/{id}` answer keys readable only by the exam's teacher/admin,
`examAttempts/{uid}_{examId}` one attempt per student per exam), student
attempt page (`/exams/:id/attempt`: intro, client countdown timer with
auto-submit, question palette, submit-once), teacher/admin exam management
(`/exams/manage`: Zod-validated create/edit with questions, publish/draft,
delete, per-exam attempt list + teacher evaluation), `/exams` list wired to
Firestore-or-sample (upcoming/past split), `/results` wired to the student's
real attempts, dashboard exam teaser rewired to the same service,
`firestore.rules` v5.

**Honest exam state:** answer keys NEVER reach the student client — the
attempt page reads only the questions subcollection, and a submitted attempt
stays "মূল্যায়ন চলছে" until the exam's teacher evaluates it with the keys
(or the backend auto-scores it in Phase 10). The timer is client-side for
display; submission time is the server timestamp. In demo mode the sample
exams are openly labelled নমুনা practice questions (answers in the sample
data, not a real exam) and demo attempts are scored immediately in this
browser only, labelled ডেমো. No fake scores, no fake results, no duplicate
submissions (deterministic attempt id + rules). Certificates are still NOT
issued — that waits for the backend (Phase 10).

**Files:** `src/firebase/exams.ts`, `src/firebase/exams.test.ts`,
`src/hooks/useExams.ts`, `src/pages/ExamAttempt.tsx`,
`src/pages/ManageExams.tsx`, `src/pages/Exams.tsx`, `src/pages/Results.tsx`,
`src/pages/Dashboard.tsx`, `src/App.tsx`, `src/data/sample.ts`
(sample exam questions), `firestore.rules`, `docs/architecture.md`,
`README.md`.

## Phase 7 — DONE (this repo)

**Scope:** admin dashboard (`/admin`: admin / super_admin only — the guard
lives in the page, like `/teacher`, so the labelled demo preview still works
before Firebase is configured), overview stats computed from REAL Firestore
queries (getDocs breakdowns + getCountFromServer for attempts — never
hardcoded), user management (list users, change roles, disable/enable),
course moderation (all statuses, publish / unpublish / delete with two-step
confirm), exam moderation (publish / unpublish / delete), live-class
moderation (cancel), reports tab with an honest empty state (user reporting
arrives with Phase 9 support tickets — no fake reports), header "অ্যাডমিন"
link for admin roles, `firestore.rules` v6.

**Honest admin state:** role changes update the Firestore profile doc; the
custom claim the rules actually enforce is set via console / Admin SDK
(Phase 10 backend keeps the two in sync) — the UI says this plainly. Nobody
may change their own role (client guard + rules), only a super_admin may
grant super_admin, and the last super_admin cannot be demoted or disabled
(client guard + backend in Phase 10 — rules cannot count documents). A
disabled account cannot create enrollments or exam attempts (rules v6);
full Auth-level deactivation (blocking login) needs the Admin SDK and
arrives with the backend in Phase 10 — the UI says so. In demo mode the
page shows labelled নমুনা sample users/courses/exams/classes and the write
buttons are replaced by a note; the demo overview honestly shows 0
enrollments/attempts because the sample data has none — that is a limit of
the sample, not a real zero.

**Files:** `src/firebase/admin.ts`, `src/firebase/admin.test.ts`,
`src/hooks/useAdmin.ts`, `src/pages/AdminDashboard.tsx`, `src/App.tsx`,
`src/components/Header.tsx`, `src/firebase/profiles.ts` (`disabled` flag),
`firestore.rules`, `docs/architecture.md`, `README.md`.

## Progress tracking — docs/progress.json (NO LONGER UPDATED)

`docs/progress.json` was the machine-readable source for the SP Academy
progress graph page. **2026-11-24 the user said the progress graph no longer
needs updating — from Phase 5 onward, phases do NOT update
`docs/progress.json` and do NOT touch the sp-academy-progress artifact.**
The file stays in the repo at its Phase 4 state (phases 1–3 done, 4
in_progress, 5–10 pending) as a historical record only. Phase status is
tracked in this document (`docs/architecture.md`) and in `README.md` instead.

## Phases 5–10 (planned, not implemented)

| Phase | Scope | Key deliverables |
| --- | --- | --- |
| 4 | Student dashboard — DONE | Overview, My Courses, Continue Learning, lesson player + progress, notes/PDFs, certificates |
| 5 | Teacher dashboard — DONE | Own courses, enrollment stats, live-class scheduling, add-lesson form |
| 6 | Examination system — DONE | Exam model (keys never reach students), attempt page + timer, submit-once, teacher evaluation, results wired to real attempts |
| 7 | Admin dashboard — DONE | Users/roles, real-DB overview stats, course/exam/live-class moderation, reports (honest empty state) |
| 8 | Payments + Bookstore | bKash / Nagad / SSLCommerz / Card / COD — server-side initiation, callback + webhook verification, idempotent processing, refunds; book catalog, cart, checkout, delivery tracking |
| 9 | AI + Support | AI Study Assistant via backend (keys server-side, rate limits, validation), notifications, support tickets |
| 10 | Hardening + Launch | Security audit, automated tests (auth, roles, enrollment, exam, payments, uploads, rules), SEO/prerendering, performance, production deployment |

## Firestore collections (planned + live)

Live since Phase 2–6: `users, roles, permissions, students, teachers,
courses, courseCategories, enrollments, certificates, liveClasses, exams,
examKeys, examAttempts`, plus the `lessons` subcollection under each course
and the `questions` subcollection under each exam. Lesson progress lives on the enrollment doc
(`completedLessonIds`, `progressPercent`) — no separate `lessonProgress`
collection was needed. Certificates are read-only for the owner/admin
until the backend (Phase 10) issues them server-side. `classAttendance` is reserved in
the rules (writes blocked) until a real live session exists to mark
attendance against. Remaining planned collections: `chapters,
questions, examAnswers, examResults,
books, authors, publishers, carts, orders, payments, coupons,
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
