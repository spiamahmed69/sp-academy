# SP Academy — Design System (Phase 1 + Bondi-style landing v2, 2026-11-27)

Original SP Academy identity, inspired by the layout language of
[bondipathshala.education](https://bondipathshala.education) (pill navbar, light-blue
hero with wavy edge, vivid category tiles, white course cards with orange CTA).
No proprietary code, branding, text, logo, teacher, phone number, or exact design
was copied. Tokens below are screenshot-pixel samples taken 2026-11-24 and
re-measured 2026-11-27 from the live reference site — close
tokens, not computed-style verified.

**Bondi-style v2 (2026-11-27):** every public page now follows the reference
landing pattern with SP Academy's own content — floating pill header (active
link = pale-blue pill, blue Login + orange "ভর্তি হোন"), pale-blue page
`#F2F7FF`, pill filter chips + scrolling promo marquee on listings, horizontal
carousels with arrow buttons (popular courses, publications, testimonials),
programme split sections (text/CTA + 2×2 course grid), tab-filtered teachers,
free-classes featured-video + list layout, 8 free-resource icon cards,
AI-assistant split section with chat mockup, deep-navy `#0B1B3A` footer (4
columns incl. contact) and dark-navy login with orange heading. Shared pieces
live in `src/components/ui.tsx` (`PageHero`, `PromoMarquee`, `FilterChips`,
`CarouselRow`, `SectionHeading`, `Breadcrumbs`) so all 23 public pages share
the same landing system.

> **Rejected theme (do NOT use):** navy-blue + gold `#182C4C` / `#F0B84B`.
> The user explicitly rejected it.

## Tokens

Source of truth: `src/styles/tokens.css` (CSS variables) + Tailwind v4 `@theme inline`
in the same file. All components must use these variables — no raw hex in components.

| Token | Value | Usage |
| --- | --- | --- |
| `--color-page` | `#F2F7FF` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-surface-2` | `#E3EDFF` | Soft blue tint |
| `--color-primary` | `#2F6BFF` | Primary blue (tabs, links, login) |
| `--color-primary-dark` | `#1D4ED8` | Primary hover |
| `--color-primary-light` | `#60A5FA` | Light blue accent |
| `--color-primary-soft` | `#E3EDFF` | Soft blue backgrounds |
| `--color-navy` | `#0B1B3A` | Deep navy (footer, login backdrop) |
| `--color-teal` | `#14B8A6` | Teal accent (detail-page titles) |
| `--color-cta` / from / to | `#FF7A1A` / `#FF8A1E` → `#F97316` | Primary CTA gradient |
| `--color-heading` | `#12283F` (deep `#0B1B3A`) | Headings |
| `--color-body` | `#5B6B82` | Body text |
| `--color-muted` | `#7B8AA0` | Secondary text |
| `--color-footer` | `#0B1B3A` | Dark navy footer |
| `--color-wave-top` | `#CAEEFF` | Footer wave top |
| `--color-wave-band` | `#2F6BFF` | Footer wave band |
| `--color-hero-from` → `--to` | `#EAF2FF` → `#DCE9FF` | Hero gradient |
| `--radius-card` | `20px` | Cards |
| `--radius-pill` | `9999px` | Buttons, nav, inputs |
| `--radius-lg` | `24px` | Large panels |
| `--shadow-card` / `-hover` | `0 6px 24px rgba(18,40,63,.08)` / `0 14px 36px rgba(18,40,63,.14)` | Card shadows |
| `--shadow-pill` | `0 8px 30px rgba(18,40,63,.10)` | Floating nav shadow |
| `--section-y` | `clamp(4rem, 8vw, 6rem)` | Section vertical spacing |
| `--container` | `80rem` (1280px) | Max container width |

### Category gradients

`--grad-cat-blue/green/purple/orange/violet/teal/pink/amber` — vivid 135° gradients,
white text, wavy/scalloped bottom edge (inline SVG in `CategoryTile`).

### Dark theme

`.dark` on `<html>` redefines page/surface/heading/body tokens
(`--color-page: #0B1526`, surface `#12233C`, heading `#EAF2FB`). Toggle in the
header, persisted to `localStorage` (`sp-academy-theme`), respects
`prefers-color-scheme` on first visit. Tailwind dark variant is enabled via
`@custom-variant dark` in `src/index.css`.

### Typography

- Bengali: **Hind Siliguri** (400/500/600/700)
- English: **Inter** (400/500/600/700/800)
- Headings 700–800; hero 44–56px; H2 30–36px; body 15–16px; line-height ~1.6.
- Base font stack: `var(--font-bn)` — Hind Siliguri first so Bengali renders correctly.

## Components

| Component | File | Notes |
| --- | --- | --- |
| Pill nav | `src/components/Header.tsx` | White floating pill, sticky, soft shadow, large radius; active link = solid primary pill; mobile menu + search |
| Hero | `src/pages/Home.tsx` | Light-blue gradient, wavy SVG bottom edge, CTA + search, stat chips |
| Category tile | `src/components/cards.tsx` | Gradient tile, white icon chip, wavy bottom edge, hover lift |
| Course card | `src/components/cards.tsx` | White, 16px radius, subtle shadow, orange/red %-off badge, full-width orange pill CTA, `নমুনা` badge |
| Teacher card | `src/components/cards.tsx` | Initials avatar on gradient, 3-stat footer row |
| Book card | `src/components/cards.tsx` | Gradient cover area, tilted book mock, price + stock state |
| Blog card | `src/components/cards.tsx` | Gradient header, category chip, read time |
| Buttons | `src/index.css` | `.btn-cta` (orange gradient pill), `.btn-primary` (blue pill), `.btn-outline` |
| Card | `src/index.css` | `.card` + `.card-hover` (lift + shadow on hover) |
| Footer | `src/components/Footer.tsx` | Wave-top SVG (pale cyan + blue band), dark navy `#01367F` body |
| Skeleton | `src/components/ui.tsx` | `.skeleton` shimmer + `SkeletonCard` |
| Empty / Error states | `src/components/ui.tsx` | `EmptyState`, `ErrorState` (with retry) |
| Toasts | `src/lib/toast.tsx` + `src/App.tsx` | `ToastProvider` + `useToast()`, auto-dismiss 4s |
| Sample badge | `src/components/ui.tsx` | `SampleBadge` — amber `নমুনা` pill, used on all sample content |
| Demo notice | `src/components/ui.tsx` | `DemoNotice` — amber callout on auth/demo pages |

## Usage rules

1. Never hard-code a hex color in a component — use a CSS variable or Tailwind token.
2. Icons: **Lucide only** — no emoji as icons anywhere.
3. Touch targets ≥ 44px on mobile; focus rings visible (`:focus-visible` in `index.css`).
4. `prefers-reduced-motion` disables animation (see `index.css`).
5. All sample content carries a `নমুনা` badge or a demo notice — never present sample
   prices, teachers, or exam dates as real.
6. Mobile-first: base 375px, `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
   No horizontal scroll at 375px (body has `overflow-x: hidden` as a guard; layouts
   must still be genuinely responsive).

## Images (Phase 1)

Phase 1 uses **no external images** — covers, avatars, and hero art are CSS gradients
+ typography + Lucide icons. Real image hosting is planned centrally via ImgBB
(see `docs/architecture.md` § Media / ImgBB — backend-only, key never in the frontend).
