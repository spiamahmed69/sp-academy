import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import Header from './components/Header'
import Footer from './components/Footer'
import { useToast } from './lib/toast'
import { useTheme } from './hooks/useTheme'
// Route code-splitting (Phase 10): every page is lazy-loaded so the first
// paint only downloads the shell + the page the visitor actually opened.
// The prerender step (scripts/prerender.mjs) renders each public route to
// static HTML at build time, so crawlers still see full content.
const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses').then((m) => ({ default: m.default })))
const CourseDetails = lazy(() => import('./pages/Courses').then((m) => ({ default: m.CourseDetails })))
const Teachers = lazy(() => import('./pages/Teachers').then((m) => ({ default: m.default })))
const TeacherProfile = lazy(() => import('./pages/Teachers').then((m) => ({ default: m.TeacherProfile })))
const FreeCourses = lazy(() => import('./pages/FreeCourses'))
const LiveClasses = lazy(() => import('./pages/LiveClasses'))
const Exams = lazy(() => import('./pages/Exams'))
const ExamAttempt = lazy(() => import('./pages/ExamAttempt'))
const ManageExams = lazy(() => import('./pages/ManageExams'))
const Results = lazy(() => import('./pages/Results'))
const Books = lazy(() => import('./pages/Books').then((m) => ({ default: m.default })))
const BookDetails = lazy(() => import('./pages/Books').then((m) => ({ default: m.BookDetails })))
const Blog = lazy(() => import('./pages/Blog').then((m) => ({ default: m.default })))
const BlogDetails = lazy(() => import('./pages/Blog').then((m) => ({ default: m.BlogDetails })))
const About = lazy(() => import('./pages/Info').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('./pages/Info').then((m) => ({ default: m.Contact })))
const Faq = lazy(() => import('./pages/Info').then((m) => ({ default: m.Faq })))
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })))
const Refund = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Refund })))
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })))
const ForgotPassword = lazy(() => import('./pages/Auth').then((m) => ({ default: m.ForgotPassword })))
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AiAssistant = lazy(() => import('./pages/AiAssistant'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Learn = lazy(() => import('./pages/Learn'))
const MyCourses = lazy(() => import('./pages/MyCourses'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Categories = lazy(() => import('./pages/Categories'))
import { ProtectedRoute } from './components/ProtectedRoute'
import { CartProvider } from './contexts/CartContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Toasts() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="card animate-fade-up flex items-start gap-3 p-4">
          {t.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          ) : t.kind === 'error' ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
          )}
          <p className="flex-1 text-sm text-[var(--color-body)]">{t.message}</p>
          <button onClick={() => dismiss(t.id)} aria-label="বন্ধ করুন" className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-heading)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-[var(--color-muted)]" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>পেজ লোড হচ্ছে…</span>
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <CartProvider>
    <div className="flex min-h-screen flex-col bg-[var(--color-page)]">
      <ScrollToTop />
      <Header theme={theme} onToggleTheme={toggle} />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/courses/:slug/learn" element={<Learn />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/free-courses" element={<FreeCourses />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/live-classes" element={<LiveClasses />} />
          <Route path="/exams" element={<Exams />} />
          <Route
            path="/exams/:id/attempt"
            element={
              <ProtectedRoute>
                <ExamAttempt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/manage"
            element={
              <ProtectedRoute>
                <ManageExams />
              </ProtectedRoute>
            }
          />
          <Route path="/results" element={<Results />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          {/* /my-orders guards itself in-page: in demo mode it shows this browser's demo orders. */}
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/teacher" element={<TeacherDashboard />} />
          {/* /admin guards itself in-page (like /teacher) so the labelled demo preview works before Firebase is configured. */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          {/* /notifications guards itself in-page: signed-in users see real notifications, demo mode shows labelled samples. */}
          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toasts />
    </div>
    </CartProvider>
  )
}
