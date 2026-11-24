# SP Academy

**Learn Today, Lead Tomorrow.**

Online education platform for students, teachers, and institutions in Bangladesh —
SSC, HSC, admission, job preparation, live classes, exams, books, and an AI study
assistant. Bengali + English, prices in BDT (৳).

> **Phase 1 is done.** This repo currently contains the **public website + design
> system only** — a real, working React codebase with routing, search/filters,
> forms, loading/empty/error states, toasts, and light/dark themes. There is **no
> backend, no Firebase, no auth, no payment, and no real AI yet**. Those arrive in
> Phases 2–10 (see `docs/architecture.md`).

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

## What is NOT done yet

- **Phase 2** — Firebase Auth, Firestore, roles, student registration
- **Phase 3** — Course management, enrollment
- **Phase 4** — Student dashboard, video learning, progress
- **Phase 5** — Teacher dashboard, live-class scheduling
- **Phase 6** — Examination system, results, leaderboard
- **Phase 7** — Admin dashboard, reports, settings
- **Phase 8** — Payments (bKash/Nagad/SSLCommerz/Card/COD), bookstore orders, coupons
- **Phase 9** — AI Study Assistant, notifications, support tickets
- **Phase 10** — Security audit, testing, SEO, performance, production deployment
- No GitHub push and no Vercel deployment have been done in Phase 1 (local only).

## Environment variables

Copy `.env.example` to `.env.local` when Phase 2 starts. Phase 1 uses **no**
environment variables at runtime. The `.env.example` contains empty placeholders
only — including `IMGBB_API_KEY=`, which is a **backend server-side placeholder**
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
