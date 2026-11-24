# SP Academy

**Learn Today, Lead Tomorrow.**

Online education platform for students, teachers, and institutions in Bangladesh —
SSC, HSC, admission, job preparation, live classes, exams, books, and an AI study
assistant. Bengali + English, prices in BDT (৳).

> **Phase 1 is done, and Phase 2 (Firebase Auth + roles) is done in code.**
> The public website + design system work, and auth is fully wired — but **no
> Firebase project exists yet**, so the live site runs in honest demo mode
> until the project is created and the `VITE_FIREBASE_*` env vars are set
> (see `docs/firebase-setup.md`). There is still **no backend, no payment,
> and no real AI**. Those arrive in Phases 3–10 (see `docs/architecture.md`).

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

## What is NOT done yet

- **Firebase project itself** — not created yet; needs the console steps in
  `docs/firebase-setup.md` + the six `VITE_FIREBASE_*` env vars (local
  `.env.local` and Vercel).
- **Phase 3** — Course management, enrollment
- **Phase 4** — Student dashboard, video learning, progress
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
  lib/                # format helpers, toast context
  hooks/              # useTheme
  components/         # Header, Footer, cards, ui states
  pages/              # Home + 23 public pages
docs/
  architecture.md     # Full 10-phase plan + ImgBB media plan
DESIGN_SYSTEM.md
```

## Reference

Inspired by the general layout/UX of https://bondipathshala.education. No proprietary
code, branding, text, logo, teachers, phone number, or exact design was copied —
SP Academy is an original brand.
