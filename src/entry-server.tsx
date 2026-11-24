// Server entry used ONLY by scripts/prerender.mjs (never shipped to the browser).
// Renders one route to static HTML with react-dom/server + StaticRouter, the
// same approach as the sibling sp-calculator project.
//
// Difference from sp-calculator: SP Academy loads its catalogue through
// TanStack Query (async), so before rendering we prefetch the demo-mode
// queries into one shared QueryClient — that way useQuery returns the
// labelled নমুনা catalogue synchronously during render and the prerendered
// HTML contains real Bengali content instead of loading skeletons.
// When Firebase IS configured the build has no credentials, so prefetching
// still resolves to the same labelled sample data.
//
// Routes are lazy-loaded (React.lazy) in App.tsx; renderToReadableStream
// waits for the lazy chunks, so the full stream — fallback included — is
// collected before the HTML is written.
import { renderToReadableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ToastProvider } from './lib/toast'
import { AuthProvider } from './contexts/AuthContext'
import { getCourses, getCourseBySlug, getCourseLessons } from './firebase/courses'
import { getBooks, getBookById } from './firebase/books'
import { getExams } from './firebase/exams'
import { getLiveClasses } from './firebase/liveClasses'
import { books, courses } from './data/sample'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

let prepared = false

/** Prefetch every demo-mode catalogue query once; shared across renders. */
export async function prepare(): Promise<void> {
  if (prepared) return
  const { courses: catalogue } = await queryClient.fetchQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })
  await Promise.all([
    queryClient.fetchQuery({ queryKey: ['books'], queryFn: getBooks }),
    queryClient.fetchQuery({ queryKey: ['exams'], queryFn: getExams }),
    queryClient.fetchQuery({ queryKey: ['live-classes'], queryFn: getLiveClasses }),
    ...catalogue.map((course) =>
      queryClient.fetchQuery({
        queryKey: ['course', course.slug],
        queryFn: () => getCourseBySlug(course.slug),
      }),
    ),
    ...catalogue.map((course) =>
      queryClient.fetchQuery({
        queryKey: ['course-lessons', course.id],
        queryFn: () => getCourseLessons(course),
      }),
    ),
    ...books.map((book) =>
      queryClient.fetchQuery({ queryKey: ['book', book.id], queryFn: () => getBookById(book.id) }),
    ),
  ])
  prepared = true
}

/** Render one route to a complete HTML string (awaits lazy chunks). */
export async function render(url: string): Promise<string> {
  await prepare()
  const stream = await renderToReadableStream(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
    {
      onError(err) {
        console.error(`prerender render error for ${url}:`, err)
      },
    },
  )
  await stream.allReady
  return new Response(stream as unknown as BodyInit).text()
}

// Keep the sample imports referenced (course slugs / book ids drive the
// prerender route list in scripts/routes.mjs); this also guards against
// the sample catalogue drifting from the prefetched queries.
export const PRERENDER_COURSE_SLUGS = courses.map((c) => c.slug)
export const PRERENDER_BOOK_IDS = books.map((b) => b.id)
