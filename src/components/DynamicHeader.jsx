import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Menu, X, User, LogOut, LayoutDashboard, Sun, Moon, Search } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { fetchActiveHeaderConfig } from "../lib/headerFooterUtils"
import Header from "./Header"

// Default configuration when Firestore config is not available
const DEFAULT_CONFIG = {
  content: {
    logo: {
      type: "text",
      text: "All Vip Courses",
      link: "/",
      alt: "All Vip Courses Logo"
    },
    navigation: [
      { id: "nav-home", label: "Home", url: "/", isVisible: true, openInNewTab: false },
      { id: "nav-courses", label: "Courses", url: "/courses", isVisible: true, openInNewTab: false },
      { id: "nav-community", label: "Community", url: "/community", isVisible: true, openInNewTab: false },
      { id: "nav-announcements", label: "Announcements", url: "/announcements", isVisible: true, openInNewTab: false }
    ],
    elements: {
      showThemeToggle: true,
      showUserMenu: true
    },
    mobileMenu: {
      enabled: true
    }
  }
}

export default function DynamicHeader() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentUser, userProfile, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  useEffect(() => {
    loadHeaderConfig()
  }, [location.pathname, currentUser])
  
  const loadHeaderConfig = async () => {
    try {
      const userRole = currentUser ? (isAdmin ? 'admin' : 'user') : 'guest'
      const deviceType = window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile'
      
      console.log('🔍 Loading header config from Firestore...')
      const headerConfig = await fetchActiveHeaderConfig(location.pathname, userRole, deviceType)
      
      if (headerConfig) {
        console.log('✅ Firestore config loaded, navigation items:', headerConfig.content?.navigation?.length)
        setConfig(headerConfig)
      } else {
        console.log('⚠️ No Firestore config found, using default config')
        // Keep using DEFAULT_CONFIG (already set in state)
      }
    } catch (error) {
      console.error("❌ Error loading header config:", error)
      // Keep using DEFAULT_CONFIG on error
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }
  
  // Show loading state briefly
  if (loading) {
    return <Header />
  }
  
  const { content } = config
  
  const visibleNavItems = (content.navigation || []).filter(item => item.isVisible)
  
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={content?.logo?.link || "/"} className="flex items-center">
            {content?.logo?.type === 'image' && content?.logo?.imageUrl ? (
              <img src={content.logo.imageUrl} alt={content.logo.alt || "Logo"} className="h-8 sm:h-10 object-contain" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {content?.logo?.text || "All Vip Courses"}
              </div>
            )}
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {visibleNavItems.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                className="px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium text-foreground hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-lg transition-colors text-sm font-medium text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium shadow-sm"
              >
                Login
              </Link>
            )}
            
            {content?.elements?.showThemeToggle && (
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
              </button>
            )}
            
            {content?.mobileMenu?.enabled && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Mobile Sidebar */}
      {content?.mobileMenu?.enabled && sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm lg:hidden"
          />
          
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 w-full sm:w-80 bg-card border-r border-border z-50 overflow-y-auto shadow-2xl lg:hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                <span className="text-xl font-bold text-primary">
                  {content?.logo?.text || "Menu"}
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-1">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.url}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors group"
                  >
                    <span className="font-medium group-hover:text-primary transition-colors">{item.label}</span>
                  </Link>
                ))}
              </div>
              
              {currentUser && (
                <div className="border-t border-border pt-4 space-y-1">
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors group"
                  >
                    <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium group-hover:text-primary transition-colors">Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors group"
                  >
                    <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium group-hover:text-primary transition-colors">Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setSidebarOpen(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors group"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
              
              {!currentUser && (
                <div className="border-t border-border pt-4">
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-center font-medium transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </header>
  )
}
