import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Users,
  BookOpen,
  CreditCard,
  Menu,
  X,
  FolderTree,
  BarChart3,
  Layout,
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Star,
  Settings
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../lib/firebase"
import ManageUsers from "./ManageUsers"
import ManageCourses from "./ManageCourses"
import ManagePayments from "./ManagePayments"
import ManageCategories from "./ManageCategories"
import Overview from "./Overview"
import HeaderFooterBuilder from "./HeaderFooterBuilder"

import WebsiteSettings from "./WebsiteSettings"

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false) // Assuming standard dark mode state for now

  useEffect(() => {
    // Check dark mode
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true)
    }

    const paymentsQuery = query(
      collection(db, "payments"),
      where("status", "==", "pending")
    )
    
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      setPendingPaymentsCount(snapshot.size)
    }, (error) => {
      console.error("Error listening to pending payments:", error)
    })

    return () => unsubscribe()
  }, [])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    }
  }

  const navItems = [
    { name: "Overview", path: "/admin", icon: BarChart3 },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Categories", path: "/admin/categories", icon: FolderTree },
    { name: "Courses", path: "/admin/courses", icon: BookOpen },
    { name: "Payments", path: "/admin/payments", icon: CreditCard, badge: pendingPaymentsCount },
    { name: "Header & Footer", path: "/admin/header-footer", icon: Layout },
    { name: "Reviews", path: "/admin/reviews", icon: Star },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ]

  const currentNavItem = navItems.find((item) => item.path === location.pathname) || navItems[0]

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      <div className="flex flex-1 h-screen overflow-hidden">
        
        {/* Desktop Sidebar */}
        <motion.div 
          animate={{ width: sidebarCollapsed ? 80 : 260 }}
          className="hidden lg:flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-sm z-20 relative transition-all duration-300 ease-in-out"
        >
          {/* Logo / Brand */}
          <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
            <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight whitespace-nowrap">VIP Admin</span>
            </div>
            {sidebarCollapsed && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mx-auto">
                <span className="text-white font-bold text-lg">V</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm text-slate-500 hover:text-indigo-600 transition-colors z-30"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={sidebarCollapsed ? item.name : ""}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    
                    {!sidebarCollapsed && (
                      <span className="relative z-10 text-sm whitespace-nowrap">{item.name}</span>
                    )}

                    {!sidebarCollapsed && item.badge > 0 && (
                      <span className="relative z-10 ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    
                    {sidebarCollapsed && item.badge > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-white dark:border-slate-900" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Profile Summary Bottom */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <img 
                src={`https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff`} 
                alt="Admin" 
                className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-800 flex-shrink-0"
              />
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">Admin User</p>
                  <p className="text-xs text-slate-500 truncate">Super Admin</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile Sidebar & Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed inset-y-0 left-0 z-[70] w-72 bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
              >
                <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold">V</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">VIP Admin</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.path
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                            isActive
                              ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.name}</span>
                          {item.badge > 0 && (
                            <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden relative">
          
          {/* Top Header */}
          <header className="h-[72px] bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-10 flex-shrink-0 shadow-sm transition-colors">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-indigo-600 dark:text-indigo-400">{currentNavItem.name}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                  {currentNavItem.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              
              {/* Search Bar (Visual Only) */}
              <div className="hidden md:flex relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-900 border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {pendingPaymentsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-950" />
                  )}
                </button>
              </div>

              {/* Profile Menu Placeholder */}
              <div className="hidden sm:flex items-center pl-4 border-l border-slate-200 dark:border-slate-700">
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src={`https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff`} alt="Admin" className="w-8 h-8 rounded-full" />
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Header Title */}
          <div className="sm:hidden px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
             <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                {currentNavItem.name}
             </h1>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto pb-12"
            >
              <Routes>
                <Route index element={<Overview />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="categories" element={<ManageCategories />} />
                <Route path="courses" element={<ManageCourses />} />
                <Route path="payments" element={<ManagePayments />} />
                <Route path="header-footer" element={<HeaderFooterBuilder />} />
                {/* Fallbacks for Reviews/Settings routing if they don't exist yet */}
                <Route path="reviews" element={<div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">Reviews Manager Coming Soon</div>} />
                <Route path="settings" element={<WebsiteSettings />} />
              </Routes>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}
