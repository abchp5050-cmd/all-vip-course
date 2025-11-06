"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Search,
  Home,
  BookOpen,
  Newspaper,
  Users,
  Download,
  CreditCard,
  BarChart3,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { fetchActiveHeaderConfig } from "../lib/headerFooterUtils"

// CRITICAL: Define deferredPrompt at module level to capture event early
let deferredPrompt = null
let isInstallListenerSet = false

// Helper function to convert rem/px to Tailwind class value
const getPaddingValue = (value) => {
  if (!value) return '4'
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (value.includes('rem')) {
      return Math.round(num * 4).toString()
    } else if (value.includes('px')) {
      return Math.round(num / 4).toString()
    }
  }
  return '4'
}

// Icon map for dynamic links
const iconMap = {
  Home,
  BookOpen,
  Newspaper,
  Users,
  Download,
  CreditCard,
  BarChart3,
}

// Default configuration when Firestore config is not available
const DEFAULT_CONFIG = {
  content: {
    logo: {
      type: "text",
      text: "All Vip Courses",
      link: "/",
      alt: "All Vip Courses Logo",
      color: "text-primary"
    },
    navigation: [
      { id: "nav-home", label: "Home", url: "/", icon: "Home", isVisible: true, openInNewTab: false },
      { id: "nav-courses", label: "Courses", url: "/courses", icon: "BookOpen", isVisible: true, openInNewTab: false },
    ],
    elements: {
      showThemeToggle: true,
      showUserMenu: true,
      showSearch: true, // Assuming search is a default element
    },
    mobileMenu: {
      enabled: true
    }
  },
  styling: {
    layout: {
      padding: { top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" },
      sticky: true,
      zIndex: 50
    },
    colors: {
      background: "bg-card/95",
      text: "text-foreground",
      border: "border-border",
      hoverBackground: "hover:bg-accent",
      hoverText: "hover:text-primary"
    },
    typography: {
      logoFont: "font-bold",
      logoSize: "text-xl sm:text-2xl",
      navFont: "font-medium",
      navSize: "text-sm"
    },
    effects: {
      shadow: "shadow-sm",
      backdropBlur: "backdrop-blur-md"
    }
  }
}

export default function DynamicHeader() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { currentUser, userProfile, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)
  
  // PWA States
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [canInstall, setCanInstall] = useState(false) // State for deferredPrompt availability

  // --- PWA Installation Logic (From old Header.jsx) ---
  useEffect(() => {
    if (isInstallListenerSet) return

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredPrompt = e
      setCanInstall(true)
      
      const dismissed = localStorage.getItem('pwaInstallDismissed')
      const dismissTime = dismissed ? parseInt(dismissed) : 0
      const daysSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24)
      
      if (!dismissed || daysSinceDismiss >= 7) {
        setShowInstallButton(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    isInstallListenerSet = true

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  useEffect(() => {
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = window.navigator.standalone === true
      return isStandalone || isIOSStandalone
    }

    const checkIsIOS = () => {
      const isIOSUserAgent = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints >= 1
      return isIOSUserAgent || isIPadOS
    }

    const iosDevice = checkIsIOS()
    setIsIOS(iosDevice)
    
    const isInstalled = checkIfInstalled()

    if (isInstalled) {
      setShowInstallButton(false)
      localStorage.removeItem('pwaInstallDismissed')
      return
    }

    const dismissed = localStorage.getItem('pwaInstallDismissed')
    const dismissTime = dismissed ? parseInt(dismissed) : 0
    const hoursSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60)
    
    // Only show button if not dismissed recently
    if (!dismissed || hoursSinceDismiss >= 1) {
      setTimeout(() => {
        // Show button if it's iOS or if we received the deferred prompt (canInstall)
        // For non-iOS, we rely on deferredPrompt being set, but show button as fallback if time passed
        if (iosDevice || canInstall || !dismissed) { 
           setShowInstallButton(true)
        }
      }, 1000)
    }
    
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setShowInstallModal(false)
      localStorage.removeItem('pwaInstallDismissed')
      deferredPrompt = null
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [canInstall]) // Dependency on canInstall ensures check runs after prompt is captured

  const handleInstallClick = () => {
    setShowInstallModal(true)
  }

  const handleInstallConfirm = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallButton(false)
        setShowInstallModal(false)
      } else {
        setShowInstallModal(false)
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
      setShowInstallModal(false)
    } finally {
      deferredPrompt = null
    }
  }

  const handleOpenInNewTab = () => {
    const currentUrl = window.location.origin
    window.open(currentUrl, '_blank')
  }

  const handleInstallDismiss = () => {
    setShowInstallModal(false)
    setShowInstallButton(false)
    const dismissedAt = Date.now()
    localStorage.setItem('pwaInstallDismissed', dismissedAt.toString())
  }
  
  // --- Header Config Loading Logic ---
  
  useEffect(() => {
    loadHeaderConfig()
  }, [location.pathname, currentUser])
  
  const loadHeaderConfig = async () => {
    try {
      const userRole = currentUser ? (isAdmin ? 'admin' : 'user') : 'guest'
      const deviceType = window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile'
      
      const headerConfig = await fetchActiveHeaderConfig(location.pathname, userRole, deviceType)
      
      if (headerConfig) {
        // Map dynamic icon string to actual Lucide-react component
        const mappedNavigation = (headerConfig.content.navigation || [])
          .map(item => ({
            ...item,
            Icon: iconMap[item.icon] || Home // Fallback to Home icon
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort
          
        setConfig({
            ...headerConfig,
            content: {
                ...headerConfig.content,
                navigation: mappedNavigation
            }
        })
      } else {
        // Use default config with mapped icons
        const defaultMappedNavigation = DEFAULT_CONFIG.content.navigation.map(item => ({
            ...item,
            Icon: iconMap[item.icon] || Home
        }))
        setConfig({
            ...DEFAULT_CONFIG,
            content: {
                ...DEFAULT_CONFIG.content,
                navigation: defaultMappedNavigation
            }
        })
      }
    } catch (error) {
      console.error("❌ Error loading header config, falling back to defaults:", error)
      // Use default config on error
      const defaultMappedNavigation = DEFAULT_CONFIG.content.navigation.map(item => ({
          ...item,
          Icon: iconMap[item.icon] || Home
      }))
      setConfig({
          ...DEFAULT_CONFIG,
          content: {
              ...DEFAULT_CONFIG.content,
              navigation: defaultMappedNavigation
          }
      })
    }
  }
  
  // --- General Handlers ---

  const handleSignOut = async () => {
    try {
      await signOut()
      setSidebarOpen(false)
      navigate("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }
  
  // --- Effects for UI/UX ---

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchOpen])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [sidebarOpen])
  
  // --- Dynamic Class Generation ---
  
  const { content, styling } = config
  const visibleNavItems = (content.navigation || []).filter(item => item.isVisible)
  
  const headerClass = `${styling?.layout?.sticky ? 'sticky top-0' : ''} ${styling?.layout?.zIndex ? `z-${styling.layout.zIndex}` : 'z-50'} ${styling?.colors?.background || 'bg-card/95'} ${styling?.effects?.backdropBlur || 'backdrop-blur-md'} border-b ${styling?.colors?.border || 'border-border'} ${styling?.effects?.shadow || 'shadow-sm'}`
  
  const containerClass = `container mx-auto max-w-7xl px-${getPaddingValue(styling?.layout?.padding?.left)} sm:px-6 lg:px-${getPaddingValue(styling?.layout?.padding?.right)} py-${getPaddingValue(styling?.layout?.padding?.top)}`
  
  const logoClass = `${styling?.typography?.logoSize || 'text-xl sm:text-2xl'} ${styling?.typography?.logoFont || 'font-bold'} ${content?.logo?.color || 'text-primary'}`
  
  const navLinkClass = `px-4 py-2 rounded-lg ${styling?.colors?.hoverBackground || 'hover:bg-accent'} transition-colors ${styling?.typography?.navSize || 'text-sm'} ${styling?.typography?.navFont || 'font-medium'} ${styling?.colors?.text || 'text-foreground'} ${styling?.colors?.hoverText || 'hover:text-primary'}`

  return (
    <>
      <header className={headerClass}>
        <nav className={containerClass}>
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
              {content?.mobileMenu?.enabled && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              )}

              <Link to={content?.logo?.link || "/"} className="flex items-center">
                {content?.logo?.type === 'image' && content?.logo?.imageUrl ? (
                  <img src={content.logo.imageUrl} alt={content.logo.alt || "Logo"} className="h-8 sm:h-10 object-contain" />
                ) : (
                  <div className={logoClass}>
                    {content?.logo?.text || "All Vip Courses"}
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {visibleNavItems.map((link, index) => {
                const isExternal = link.type === 'external'
                
                if (isExternal) {
                  return (
                    <a
                      key={`desktop-${link.url}-${index}`}
                      href={link.url}
                      className={navLinkClass}
                      target={link.openInNewTab ? "_blank" : "_self"}
                      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    >
                      {link.label}
                    </a>
                  )
                }
                
                return (
                  <Link
                    key={`desktop-${link.url}-${index}`}
                    to={link.url}
                    className={navLinkClass}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right Section: Search, PWA, User/Login, Theme */}
            <div className="flex items-center gap-2">
              
              {/* Search Toggle (Optional based on config, but keeping it visible for courses) */}
              {content?.elements?.showSearch !== false && (
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Toggle Search"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </button>
              )}

              {/* Install PWA Button (Will be hidden if modal is open or app installed) */}
              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              )}
              
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
            </div>
          </div>
        </nav>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[49] bg-black/50 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
        )}
        {searchOpen && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 p-4"
          >
            <form onSubmit={handleSearch} ref={searchRef} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search for courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-card text-foreground shadow-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  autoFocus
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
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
              className="fixed left-0 top-0 bottom-0 w-full sm:w-80 bg-card border-r border-border z-50 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
                <Link to="/" onClick={() => setSidebarOpen(false)}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={logoClass}
                  >
                    {content?.logo?.text || "All Vip Courses"}
                  </motion.div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg smooth-transition hover:scale-105 active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {currentUser && (
                <div className="p-4 border-b border-border/50 bg-primary/5">
                  <div className="flex items-center gap-3">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL || "/placeholder.svg"}
                        alt={userProfile.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center ring-2 ring-primary/50">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{userProfile?.name || "User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Main Navigation Links (Dynamic) */}
              <div className="p-4 space-y-1">
                {visibleNavItems.map((link, index) => {
                  const Icon = link.Icon || Home
                  const isExternal = link.type === 'external'
                  const linkClassName = "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  
                  if (isExternal) {
                    return (
                      <a
                        key={`mobile-${link.url}-${index}`}
                        href={link.url}
                        target={link.openInNewTab ? "_blank" : "_self"}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={linkClassName}
                      >
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                        <span className="font-medium group-hover:text-primary smooth-transition">{link.label}</span>
                      </a>
                    )
                  }
                  
                  return (
                    <Link
                      key={`mobile-${link.url}-${index}`}
                      to={link.url}
                      onClick={() => setSidebarOpen(false)}
                      className={linkClassName}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                      <span className="font-medium group-hover:text-primary smooth-transition">{link.label}</span>
                    </Link>
                  )
                })}
              </div>

              {currentUser && (
                <div className="p-4 border-t border-border/50 space-y-1">
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                    <span className="font-medium group-hover:text-primary smooth-transition">Dashboard</span>
                  </Link>
                  <Link
                    to="/my-courses"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                    <span className="font-medium group-hover:text-primary smooth-transition">My Courses</span>
                  </Link>
                  {!isAdmin && (
                    <Link
                      to="/payment-history"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                      <span className="font-medium group-hover:text-primary smooth-transition">Payment History</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <User className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                    <span className="font-medium group-hover:text-primary smooth-transition">Profile</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}

              {!currentUser && (
                <div className="p-4 border-t border-border/50 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg smooth-transition text-center font-medium hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Login
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Install Modal (Kept from old Header.jsx for PWA logic) */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:p-4 sm:items-center"
            onClick={handleInstallDismiss}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border-t sm:border border-border sm:rounded-2xl rounded-t-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-4 sm:p-6">
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4 sm:hidden" />
                
                <button
                  onClick={handleInstallDismiss}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors sm:top-4 sm:right-4"
                  aria-label="Close"
                >
                <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col sm:items-center sm:text-center">
                  <div className="flex items-center gap-3 mb-3 sm:flex-col sm:gap-2">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold mb-0.5">Install All Vip Courses</h2>
                      <p className="text-sm text-muted-foreground">
                        Quick access & offline learning
                      </p>
                    </div>
                  </div>

                  <div className="w-full space-y-2 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-left p-2.5 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-xs">✓</span>
                      </div>
                      <span>Launch from home screen</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-left p-2.5 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-xs">✓</span>
                      </div>
                      <span>Works without internet</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-left p-2.5 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-xs">✓</span>
                      </div>
                      <span>No app store needed</span>
                    </div>
                  </div>

                  {isIOS ? (
                    <div className="w-full space-y-3">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left space-y-3">
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          📱 iPhone/iPad এ App Install করার নিয়ম:
                        </p>
                        <ol className="text-sm space-y-2.5 text-foreground">
                          <li className="flex items-start gap-3">
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-base flex-shrink-0">১.</span>
                            <span>সবার নিচে <strong className="text-blue-600 dark:text-blue-400">Share বাটন</strong> খুঁজুন (□↑ এই আইকন)</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-base flex-shrink-0">২.</span>
                            <span>নিচের দিকে scroll করে <strong className="text-blue-600 dark:text-blue-400">"Add to Home Screen"</strong> অপশন খুঁজুন</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-base flex-shrink-0">৩.</span>
                            <span>উপরে ডানপাশে <strong className="text-blue-600 dark:text-blue-400">"Add"</strong> বাটনে ট্যাপ করুন</span>
                          </li>
                        </ol>
                        <div className="pt-2 border-t border-blue-500/20">
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            ✅ এরপর আপনার Home Screen এ App icon দেখতে পাবেন
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleInstallDismiss}
                        className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium text-sm"
                      >
                        বুঝেছি
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      {deferredPrompt ? (
                        <button
                          onClick={handleInstallConfirm}
                          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
                        >
                          <Download className="w-4 h-4" />
                          এখনই Install করুন
                        </button>
                      ) : (
                        <>
                          {window.self !== window.top && (
                            <button
                              onClick={handleOpenInNewTab}
                              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
                            >
                              <Download className="w-4 h-4" />
                              নতুন Tab এ খুলুন
                            </button>
                          )}
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              📱 Android Phone এ App Install করার নিয়ম:
                            </p>
                            <ol className="text-sm space-y-2.5 text-foreground">
                              <li className="flex items-start gap-3">
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-base flex-shrink-0">১.</span>
                                <span>Browser এর উপরে ডান কোণায় <strong className="text-blue-600 dark:text-blue-400">তিন বিন্দু (⋮)</strong> বা <strong className="text-blue-600 dark:text-blue-400">তিন লাইন (≡)</strong> মেনুতে ক্লিক করুন</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-base flex-shrink-0">২.</span>
                                <div className="flex-1">
                                  <p><strong className="text-blue-600 dark:text-blue-400">"Add to Home Screen"</strong> অপশন খুঁজুন</p>
                                  <p className="text-xs mt-1 text-muted-foreground">(Chrome: "Install App" / "Add to Home Screen")</p>
                                  <p className="text-xs text-muted-foreground">(Firefox: "Install" / "Add to Home Screen")</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-base flex-shrink-0">৩.</span>
                                <span>পপআপে <strong className="text-blue-600 dark:text-blue-400">"Install"</strong> বা <strong className="text-blue-600 dark:text-blue-400">"Add"</strong> বাটনে ক্লিক করুন</span>
                              </li>
                            </ol>
                            <div className="pt-2 border-t border-blue-500/20 space-y-1">
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                ✅ সফলভাবে install হলে আপনার Home Screen এ App icon দেখতে পাবেন
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                💡 <strong>Best Browser:</strong> Chrome, Edge, বা Samsung Internet
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      <button
                        onClick={handleInstallDismiss}
                        className="w-full py-2.5 px-4 bg-muted/50 hover:bg-muted text-foreground rounded-lg transition-colors font-medium text-sm"
                      >
                        পরে করব
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
