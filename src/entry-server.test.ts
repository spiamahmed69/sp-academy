/**
 * Prerender smoke test (Phase 10).
 *
 * The build-time prerender step (scripts/prerender.mjs) renders public
 * routes through src/entry-server.tsx. This test proves the same render
 * path works: the homepage and catalogue pages contain real Bengali
 * content — not just the loading skeleton — so a prerender regression
 * (e.g. a service throwing during render) fails the suite, not the deploy.
 */
import { describe, expect, it } from 'vitest'
import { render } from './entry-server'

describe('entry-server prerender', () => {
  it(
    'renders the homepage with real Bengali content',
    async () => {
      const html = await render('/')
      expect(html).toContain('শিখুন আজ')
      expect(html).toContain('SP Academy')
      // Note: the Suspense fallback string legitimately appears in streamed
      // SSR output alongside the resolved content, so it is NOT asserted
      // absent here — the real-content assertions above are the guard.
    },
    30_000,
  )

  it(
    'renders the course catalogue and a course page with real content',
    async () => {
      const list = await render('/courses')
      expect(list).toContain('এইচএসসি পদার্থবিজ্ঞান ১ম পত্র')
      const details = await render('/courses/hsc-physics-1st-paper')
      expect(details).toContain('ভেক্টর থেকে তাপগতিবিদ্যা')
    },
    30_000,
  )

  it(
    'renders the exams list (Bengali-digit sample dates must not crash it)',
    async () => {
      const html = await render('/exams')
      expect(html).toContain('মডেল টেস্ট ০১')
    },
    30_000,
  )
})
