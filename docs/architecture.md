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

## Phase 8 — DONE (this repo)

**Scope:** bookstore + payments — Firestore book model (`books/{id}`,
`src/firebase/books.ts` — title, author, publisher, category, price,
discountPrice, rating, reviewsCount, stock, pages, description,
coverImageUrl (URL field only — ImgBB uploads go through the backend ONLY
in Phase 10, no upload and no key here), gradient, status), `/books` list +
`/books/:id` details wired to Firestore when configured (labelled নমুনা
sample otherwise), cart (`src/lib/cart.ts` pure helpers + `src/contexts/CartContext.tsx` —
localStorage always, mirrored to Firestore `carts/{uid}` when signed in),
checkout (`/checkout`: Zod-validated delivery form, payment method choice),
orders (`orders/{id}`, `src/firebase/orders.ts`), order history (`/my-orders`),
admin orders tab (`/admin` → অর্ডার: fulfilment status change), paid-course
purchase via the cart (the course-details "ভর্তি হোন" button adds the
course to the cart instead of faking a purchase), `firestore.rules` v7,
seed helper (`seedSampleBooks`, admin-only, never auto-runs).

**Honest payment state:** there is NO backend yet (Phase 10), so online
payments (bKash / Nagad / card) CANNOT be verified — an order placed with
one is created with paymentStatus `pending_verification` and the UI says
plainly that no money has been taken, no payment is confirmed, and no
transaction id exists. COD orders are created with `cod_due`. The client
can NEVER set paymentStatus to `paid` (rules v7 block it) — only the
backend may mark an order paid after gateway verification in Phase 10.
A course in an order does NOT enroll the student; enrollment is activated
server-side after verification (Phase 10). COD is not offered for
course-only orders. Prices are re-derived from the catalogue at checkout
(the cart's stored prices are never trusted) and stock is re-checked;
the backend re-validates both in Phase 10. In demo mode orders are kept
in this browser's localStorage only, labelled ডেমো অর্ডার.

**Files:** `src/firebase/books.ts`, `src/firebase/books.test.ts`,
`src/firebase/orders.ts`, `src/firebase/orders.test.ts`,
`src/firebase/cart.ts`, `src/lib/cart.ts`, `src/lib/cart.test.ts`,
`src/contexts/CartContext.tsx`, `src/hooks/useBooks.ts`,
`src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/pages/MyOrders.tsx`,
`src/pages/Books.tsx`, `src/pages/Courses.tsx`, `src/components/cards.tsx`
(BookCard renders a cover image when `coverImageUrl` exists),
`src/components/Header.tsx` (cart badge), `src/pages/AdminDashboard.tsx`
(orders tab), `src/pages/Dashboard.tsx` (আমার অর্ডার link),
`src/pages/MyOrders.tsx`, `src/App.tsx`, `src/firebase/seed.ts`
(`buildBookSeedDocs` / `seedSampleBooks`), `firestore.rules`,
`docs/architecture.md`, `README.md`.

## Phase 9 — DONE (this repo)

**Scope:** AI study assistant (`/ai-assistant`), notifications (header bell
with unread count + dropdown, `/notifications` inbox, mark-read), support
tickets (contact form wires to tickets, `/admin` → রিপোর্ট tab shows the
real ticket list with admin reply + status change), `firestore.rules` v8.

**Honest AI state:** there is NO real AI yet (no backend, Phase 10), so the
assistant page is a chat shell around a local keyword helper
(`src/lib/assistant.ts`) that answers ONLY from the site's own FAQ +
course catalogue (title / price / duration / lessons, Bengali digits) and
says plainly when it does not know — it never invents an answer. The page
labels the helper "সহজ সহায়ক — আসল AI নয়" in the hero notice, the chat
header and the suggestion area, and says the real AI assistant (backend,
server-side key, rate limits) arrives in Phase 10.

**Honest notifications state:** notifications are created server-side
(Phase 10) or by an admin (e.g. when replying to a ticket) — a client can
NEVER create one (rules v8 block client creates), so no fake notification
can be invented from a browser. The client only reads its own notifications
and marks them read (only the `read` field may change). In demo mode the
inbox + bell show labelled নমুনা sample notifications from this browser's
localStorage.

**Honest support state:** a ticket is created only by a signed-in user, for
themselves, always `open` with an empty replies list; only an admin /
moderator may reply or change the status (rules v8 — the owner can never
change their own ticket's status or fake an admin reply). The admin reports
tab shows ONLY tickets users really submitted; when there are none it keeps
its honest empty state. The contact form creates a ticket when signed in
(Firestore, or a labelled ডেমো টিকিট in demo mode) and honestly refuses
when not signed in — it never pretends a message was sent. In demo mode
admin replies are not possible and the admin page says so.

**Files:** `src/lib/assistant.ts`, `src/lib/assistant.test.ts`,
`src/firebase/notifications.ts`, `src/firebase/notifications.test.ts`,
`src/firebase/support.ts`, `src/firebase/support.test.ts`,
`src/hooks/useNotifications.ts`, `src/hooks/useSupport.ts`,
`src/pages/AiAssistant.tsx`, `src/pages/Notifications.tsx`,
`src/pages/Info.tsx` (contact form → ticket + my-tickets list),
`src/pages/AdminDashboard.tsx` (reports tab → real ticket list + reply),
`src/components/Header.tsx` (notification bell + "AI সহকারী" nav link),
`src/App.tsx`, `firestore.rules` v8, `docs/architecture.md`, `README.md`.

## Phase 10 — DONE (FINAL phase, this repo)

**Scope:** security audit, code-splitting, SEO/prerendering, full test +
smoke pass, launch checklist. No backend was built in this phase and no
integration was faked.

**Code-splitting:** every route page in `src/App.tsx` is `React.lazy` +
`Suspense` (one shared `PageFallback`). First-load JS fell from a single
1,596 kB chunk to a 1,103 kB main chunk + per-page chunks of 7–61 kB loaded
on demand. The remaining bulk is the Firebase SDK, which every page needs.

**SEO / prerendering:** `src/entry-server.tsx` renders routes with
`renderToReadableStream` + `StaticRouter`, prefetching the demo-mode
catalogue queries (`courses`, `books`, `exams`, `live-classes`, per-course
and per-book detail queries) into one shared QueryClient so `useQuery`
returns the labelled নমুনা data synchronously during render.
`scripts/prerender.mjs` writes static HTML for all 48 public routes
(`scripts/routes.mjs` is the single route list, shared with the sitemap);
per-route `<title>`, meta description, canonical, Open Graph and JSON-LD
(`WebPage` + `BreadcrumbList`) are swapped into the `dist/index.html`
template. `scripts/generate-sitemap.mjs` writes `dist/sitemap.xml`;
`public/robots.txt` allows crawling. Canonical host corrected to
`https://sp-academy-rouge.vercel.app/`. Build command:
`tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir
dist-server && node scripts/prerender.mjs && node scripts/generate-sitemap.mjs`.
Protected/app routes (dashboard, teacher, admin, learn, exam attempt /
manage, profile, notifications) are NOT prerendered — they are auth-gated
and served by the SPA shell.

**Security audit (firestore.rules v9):** end-to-end review — no public
writes, no answer-key leaks (`examKeys` teacher/admin only), no payment
`paid` from clients, no role self-assignment, default-deny catch-all.
One least-privilege gap fixed: `students/{uid}` owner updates were
unrestricted (any field, including `enrolledCourseIds`); they are now
limited to displayName/phone. Full secret scan clean (no keys in source,
docs, scripts or the built bundle; `.env.example` placeholders only).
Security headers added to `vercel.json` (HSTS, nosniff, SAMEORIGIN,
strict-origin-when-cross-origin referrer, camera/mic/geolocation off).
Known documented limits (not fixable without a backend): order totals /
catalogue prices are re-derived client-side at checkout and re-validated
only by the Phase 10 backend; the last-super-admin guard lives in the
client + backend because rules cannot count documents; full Auth-level
account deactivation needs the Admin SDK.

**Bug found by the audit:** sample exam dates are stored in Bengali digits
(`'২০২৬-১২-০৬'`); `sampleExamToView` parsed them with `new Date(...)`,
which threw `Invalid time value` — `getExams()` in demo mode always
crashed and the exams list showed an error state. Fixed with
`toAsciiDigits` (`src/lib/format.ts`) + graceful `null` on unparseable
dates, with 2 regression tests.

**Verification:** `npm run test` **158/158 pass** (incl. 2 exam-date
regression tests + 3 prerender smoke tests in `src/entry-server.test.ts`),
`npm run typecheck` clean, full `npm run build` green (48/48 routes
prerendered, 48-URL sitemap), preview smoke of all 38 routes (23 public +
dashboard/teacher/admin/learn/attempt/manage/cart/checkout/my-orders/
notifications/ai-assistant + an unknown path) — every route 200.
`docs/progress.json` untouched (user instruction).

**Files:** `src/App.tsx` (lazy routes), `src/entry-server.tsx`,
`src/entry-server.test.ts`, `scripts/routes.mjs`,
`scripts/prerender.mjs`, `scripts/generate-sitemap.mjs`,
`public/robots.txt`, `src/lib/format.ts` (`toAsciiDigits`),
`src/firebase/exams.ts` (date fix), `src/firebase/exams.test.ts`,
`firestore.rules` v9, `vercel.json` (headers), `index.html` (canonical +
og:url), `package.json` (build script), `.gitignore` (dist-server),
`docs/architecture.md`, `README.md`.

## Launch checklist (needs the user — after all 10 phases)

The code is complete and live, but the site still runs in honest demo mode
until these one-time steps are done (details in `docs/firebase-setup.md`):

1. Create the Firebase project `sp-academy` in the console.
2. Enable Auth — Email/Password + Google.
3. Create Firestore (`asia-southeast1`, Singapore) and publish
   `firestore.rules` (v9).
4. Set the six `VITE_FIREBASE_*` vars in `.env.local` + Vercel, redeploy.
5. First admin via custom claim (console / Admin SDK) — never from the client.
6. Seed the catalogue (`seedSampleCourses` / `seedSampleBooks`, admin-only).

**Phase 10-backend follow-ups (NOT built, NOT faked — need Firebase +
secrets):** payment-gateway verification (bKash/Nagad/card → mark orders
`paid`), real AI assistant (server-side key), ImgBB upload endpoint
(server-side key only), server-side exam timer + auto-evaluation,
certificate issuance, Admin-SDK role sync + Auth-level account
deactivation, real live-class video integration.

## Progress tracking — docs/progress.json (NO LONGER UPDATED)

`docs/progress.json` was the machine-readable source for the SP Academy
progress graph page. **2026-11-24 the user said the progress graph no longer
needs updating — from Phase 5 onward, phases do NOT update
`docs/progress.json` and do NOT touch the sp-academy-progress artifact.**
The file stays in the repo at its Phase 4 state (phases 1–3 done, 4
in_progress, 5–10 pending) as a historical record only. Phase status is
tracked in this document (`docs/architecture.md`) and in `README.md` instead.

## Phases 4–10 (status — all DONE)

| Phase | Scope | Key deliverables |
| --- | --- | --- |
| 4 | Student dashboard — DONE | Overview, My Courses, Continue Learning, lesson player + progress, notes/PDFs, certificates |
| 5 | Teacher dashboard — DONE | Own courses, enrollment stats, live-class scheduling, add-lesson form |
| 6 | Examination system — DONE | Exam model (keys never reach students), attempt page + timer, submit-once, teacher evaluation, results wired to real attempts |
| 7 | Admin dashboard — DONE | Users/roles, real-DB overview stats, course/exam/live-class moderation, reports (honest empty state) |
| 8 | Payments + Bookstore — DONE | Book catalogue, cart, checkout (bKash/Nagad/card/COD — honest pending state, no fake payment), orders, admin orders tab |
| 9 | AI + Support — DONE | Simple local study helper (labelled "not real AI"), notifications (bell + inbox), support tickets (contact form + admin reports tab) |
| 10 | Hardening + Launch — DONE | Code-splitting (1,596 → 1,103 kB main chunk), prerendering 48 routes + sitemap/robots, rules v9 audit, 158 tests, launch checklist |

## Firestore collections (planned + live)

Live since Phase 2–9: `users, roles, permissions, students, teachers,
courses, courseCategories, enrollments, certificates, liveClasses, exams,
examKeys, examAttempts, books, orders, carts, notifications, supportTickets`, plus the `lessons` subcollection under each course
and the `questions` subcollection under each exam. Lesson progress lives on the enrollment doc
(`completedLessonIds`, `progressPercent`) — no separate `lessonProgress`
collection was needed. Certificates are read-only for the owner/admin
until the backend (Phase 10) issues them server-side. `classAttendance` is reserved in
the rules (writes blocked) until a real live session exists to mark
attendance against. Remaining planned collections: `chapters,
questions, examAnswers, examResults,
authors, publishers, payments, coupons,
reviews, blogs, banners, settings, auditLogs`

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

## SEO & performance (DONE, Phase 10)

Unique titles/meta, canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`,
JSON-LD structured data, search-friendly course/book URLs, prerendering
(48 public routes rendered to static HTML at build time — see Phase 10
above), lazy images, code splitting, route-based loading. The site is a
Vite SPA, so prerendered HTML is the SEO surface; crawlers without JS see
the static content, and the client bundle hydrates (replaces) it on load.
Core Web Vitals work (image optimisation, font loading) is a follow-up
once real images exist — there are no real photos yet, only gradients and
labelled sample covers.
