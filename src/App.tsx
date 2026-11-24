import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import Header from './components/Header'
import Footer from './components/Footer'
import { useToast } from './lib/toast'
import { useTheme } from './hooks/useTheme'
import Home from './pages/Home'
import Courses, { CourseDetails } from './pages/Courses'
import Teachers, { TeacherProfile } from './pages/Teachers'
import FreeCourses from './pages/FreeCourses'
import LiveClasses from './pages/LiveClasses'
import Exams from './pages/Exams'
import ExamAttempt from './pages/ExamAttempt'
import ManageExams from './pages/ManageExams'
import Results from './pages/Results'
import Books, { BookDetails } from './pages/Books'
import Blog, { BlogDetails } from './pages/Blog'
import { About, Contact, Faq } from './pages/Info'
import { Privacy, Refund, Terms } from './pages/Legal'
import { ForgotPassword, Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Learn from './pages/Learn'
import MyCourses from './pages/MyCourses'
import MyOrders from './pages/MyOrders'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CartProvider } from './contexts/CartContext'
import NotFound from './pages/NotFound'
import Categories from './pages/Categories'

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

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <CartProvider>
    <div className="flex min-h-screen flex-col bg-[var(--color-page)]">
      <ScrollToTop />
      <Header theme={theme} onToggleTheme={toggle} />
      <main className="flex-1">
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
      </main>
      <Footer />
      <Toasts />
    </div>
    </CartProvider>
  )
}
