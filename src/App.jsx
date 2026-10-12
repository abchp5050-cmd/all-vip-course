import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from "react-router-dom"
import { useEffect, lazy, Suspense } from "react"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { Toaster } from "./components/ui/toaster"
import DynamicHeader from "./components/DynamicHeader"
import AnnouncementBar from "./components/AnnouncementBar"
import DynamicFooter from "./components/DynamicFooter"
import ProtectedRoute from "./components/ProtectedRoute"
import PWAInstallPrompt from "./components/PWAInstallPrompt"
import SettingsLoader from "./components/SettingsLoader"
import SupportWidget from "./components/SupportWidget"
import PremiumLoader from "./components/PremiumLoader"

// Lazy loaded pages for optimal bundle splitting and performance
const Home = lazy(() => import("./pages/Home"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const Courses = lazy(() => import("./pages/Courses"))
const CourseDetail = lazy(() => import("./pages/CourseDetail"))
const CategoryPage = lazy(() => import("./pages/CategoryPage"))
const SubcategoryPage = lazy(() => import("./pages/SubcategoryPage"))
const Profile = lazy(() => import("./pages/Profile"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"))
const Checkout = lazy(() => import("./pages/Checkout"))
const CheckoutComplete = lazy(() => import("./pages/CheckoutComplete"))
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"))
const MyCourses = lazy(() => import("./pages/MyCourses"))
const NotFound = lazy(() => import("./pages/NotFound"))

// Scroll to top on route change, but respect browser back/forward buttons
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }
  }, [pathname, navigationType])
  return null
}

function App() {

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SettingsLoader />
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* ScrollToTop must be INSIDE Router to access useLocation */}
            <ScrollToTop />
            <DynamicHeader />
            <AnnouncementBar />
            <main className="flex-1">
              <Suspense fallback={<PremiumLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/category/:categoryId/subcategory/:subcategoryId" element={<SubcategoryPage />} />
                  <Route path="/:slug" element={<CourseDetail />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout-complete" element={<CheckoutComplete />} />
                  <Route
                    path="/payment-history"
                    element={
                      <ProtectedRoute>
                        <PaymentHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                      }
                  />
                  <Route
                    path="/my-courses"
                    element={
                      <ProtectedRoute>
                        <MyCourses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <PWAInstallPrompt />
            <SupportWidget />
            <Toaster />
            <DynamicFooter />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
