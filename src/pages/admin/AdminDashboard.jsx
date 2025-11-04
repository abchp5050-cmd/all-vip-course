"use client"

import { Routes, Route, Link, useLocation } from "react-router-dom"
import { useState } from "react"
import {
  Users,
  BookOpen,
  CreditCard,
  Send,
  Menu,
  X,
  FolderTree,
  UserCheck,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ManageUsers from "./ManageUsers"
import ManageCourses from "./ManageCourses"
import ManagePayments from "./ManagePayments"
import ManageTelegramSubmissions from "./ManageTelegramSubmissions"
import ManageCategories from "./ManageCategories"
import ManageEnrollments from "./ManageEnrollments"

export default function AdminDashboard() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Enrollments", path: "/admin/enrollments", icon: UserCheck },
    { name: "Categories", path: "/admin/categories", icon: FolderTree },
    { name: "Courses", path: "/admin/courses", icon: BookOpen },
    { name: "Payments", path: "/admin/payments", icon: CreditCard },
    { name: "Telegram Submissions", path: "/admin/telegram", icon: Send },
  ]

  const currentPage = navItems.find((item) => item.path === location.pathname)?.name || "Admin Panel"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header */}
      <div className="hidden lg:block border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground font-medium">{currentPage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground font-medium">{currentPage}</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-col w-56 bg-card border-r border-border overflow-y-auto">
          <div className="p-3">
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 text-xs ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-medium"
                        : "hover:bg-muted text-foreground hover:text-primary font-normal"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border shadow-lg overflow-y-auto"
            >
              <div className="p-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm font-medium"
                            : "hover:bg-muted text-foreground hover:text-primary font-normal"
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="p-3 sm:p-4 lg:p-4">
            <Routes>
              <Route index element={<ManageUsers />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="enrollments" element={<ManageEnrollments />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="courses" element={<ManageCourses />} />
              <Route path="payments" element={<ManagePayments />} />
              <Route path="telegram" element={<ManageTelegramSubmissions />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}
