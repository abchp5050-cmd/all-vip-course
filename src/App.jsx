import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { Toaster } from "./components/ui/toaster"
import Header from "./components/Header"
import Footer from "./components/Footer"
import CartDrawer from "./components/CartDrawer"
import FloatingCartButton from "./components/FloatingCartButton"
import ProtectedRoute from "./components/ProtectedRoute"
import PWAInstallPrompt from "./components/PWAInstallPrompt"
import SettingsLoader from "./components/SettingsLoader"

// Pages
import Home from "./pages/Home"
import Login from "./pages/Login"
import Courses from "./pages/Courses"
import CourseDetail from "./pages/CourseDetail"
import Profile from "./pages/Profile"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/admin/AdminDashboard"
import Checkout from "./pages/Checkout"
import CheckoutComplete from "./pages/CheckoutComplete"
import PaymentHistory from "./pages/PaymentHistory"
import MyCourses from "./pages/MyCourses"
import NotFound from "./pages/NotFound"

console.log(" App.jsx loaded")

function App() {
  console.log(" App component rendering")

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SettingsLoader />
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:courseId" element={<CourseDetail />} />
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
            </main>
            <CartDrawer />
            <FloatingCartButton />
            <PWAInstallPrompt />
            <Toaster />
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
