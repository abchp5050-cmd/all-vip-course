import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Menu, X, User, LogOut, LayoutDashboard, Sun, Moon, Search } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { fetchActiveHeaderConfig } from "../lib/headerFooterUtils"
import Header from "./Header"

export default function DynamicHeader() {
  const [config, setConfig] = useState(null)
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
      
      const headerConfig = await fetchActiveHeaderConfig(location.pathname, userRole, deviceType)
      
      if (headerConfig) {
        setConfig(headerConfig)
      }
    } catch (error) {
      console.error("Error loading header config:", error)
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
  
  // Fallback to original Header if no config or still loading
  if (loading || !config) {
    return <Header />
  }
  
  const { content, styling } = config
  
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={content.logo.link || "/"} className="flex items-center">
            {content.logo.type === 'image' && content.logo.imageUrl ? (
              <img src={content.logo.imageUrl} alt={content.logo.alt || "Logo"} className="h-8 sm:h-10 object-contain" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {content.logo.text || "All Vip Courses"}
              </div>
            )}
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {content.navigation.filter(item => item.isVisible).map((item) => (
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
          </nav>

          
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
            
            {content.elements.showThemeToggle && (
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
              </button>
            )}
            
            {content.mobileMenu.enabled && (
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
      
      {/* Mobile Sidebar - Using AnimatePresence for smooth exit */}
      {content.mobileMenu.enabled && (
        <>
          {sidebarOpen && (
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
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Menu
                    </span>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {content.navigation.filter(item => item.isVisible).map((item) => (
                    <Link
                      key={item.id}
                      to={item.url}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-medium group-hover:text-primary transition-colors">{item.label}</span>
                    </Link>
                  ))}
                  
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
        </>
      )}
    </header>
  )
}
