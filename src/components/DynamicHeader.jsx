"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  User,
  UserCheck,
  LogOut,
  LayoutDashboard,
  LayoutGrid,
  Sun,
  Moon,
  Search,
  Home,
  BookOpen,
  PlayCircle,
  Newspaper,
  Users,
  MessageSquare,
  Download,
  CreditCard,
  BarChart3,
  Bell,
  GraduationCap,
  ChevronRight,
  Megaphone,
  Crown,
  Sparkles,
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

// Icon map for dynamic links — each nav label gets a distinct, meaningful icon
const iconMap = {
  Home,
  BookOpen,
  Newspaper,
  Users,
  MessageSquare,
  Download,
  CreditCard,
  BarChart3,
  GraduationCap,
  Bell,
  Megaphone,
  PlayCircle,
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
          .map(item => {
            const isHome = item.label?.toLowerCase() === 'home';
            const isCourses = item.label?.toLowerCase() === 'courses';
            return {
              ...item,
              url: isHome ? '/' : (isCourses ? '/courses' : item.url),
              type: isHome || isCourses ? 'internal' : item.type,
              openInNewTab: isHome || isCourses ? false : item.openInNewTab,
              Icon: iconMap[item.icon] || Home // Fallback to Home icon
            };
          })
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
  const visibleNavItems = (content.navigation || [])
    .filter(item => {
      if (!item.isVisible) return false
      const lbl = (item.label || "").toLowerCase()
      const url = (item.url || "").toLowerCase()
      return !lbl.includes("announc") && !url.includes("announc")
    })
  
  const headerClass = `sticky top-0 z-50 transition-all duration-300`
  const headerStyle = {
    background: "rgba(11, 15, 23, 0.82)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.3)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }
  
  const containerClass = `container mx-auto max-w-7xl px-${getPaddingValue(styling?.layout?.padding?.left)} sm:px-6 lg:px-${getPaddingValue(styling?.layout?.padding?.right)} py-${getPaddingValue(styling?.layout?.padding?.top)}`
  
  const logoClass = `${styling?.typography?.logoSize || 'text-xl sm:text-2xl'} ${styling?.typography?.logoFont || 'font-bold'} ${content?.logo?.color || 'text-primary'}`
  
  const getNavLinkClass = (path) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `relative px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
      isActive 
        ? 'text-primary' 
        : 'text-foreground/80 hover:text-primary hover:bg-accent/50'
    }`;
  }

  return (
    <>
      <header className={headerClass} style={headerStyle}>
        <nav className={containerClass}>
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
              {content?.mobileMenu?.enabled && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"; e.currentTarget.style.transform = "scale(1.05)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1)" }}
                  aria-label="Open menu"
                >
                  <Menu className="w-4.5 h-4.5" style={{ color: "#CBD5E1" }} />
                </button>
              )}

              {/* Premium Brand Logo */}
              <Link to={content?.logo?.link || "/"} className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
                {content?.logo?.type === 'image' && content?.logo?.imageUrl ? (
                  <img 
                    src={content.logo.imageUrl} 
                    alt={content.logo.alt || "Logo"} 
                    loading="eager"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="h-8 sm:h-10 object-contain" 
                  />
                ) : (
                  <>
                    {/* Gold emblem badge - hidden on mobile, visible on desktop/PC */}
                    <div
                      className="hidden md:flex flex-shrink-0 w-8 h-8 rounded-xl items-center justify-center transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.12) 100%)",
                        border: "1px solid rgba(245,158,11,0.35)",
                        boxShadow: "0 0 14px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <Crown className="w-4 h-4" style={{ color: "#FBBF24", filter: "drop-shadow(0 0 6px rgba(251,191,36,0.5))" }} />
                    </div>

                    {/* Brand text */}
                    <span
                      className="font-extrabold leading-none select-none whitespace-nowrap"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(0.9rem, 2.5vw, 1.15rem)",
                        letterSpacing: "-0.02em",
                        background: "linear-gradient(135deg, #FFFBEB 0%, #FBBF24 50%, #D97706 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 2px 10px rgba(245,158,11,0.25))",
                      }}
                    >
                      {content?.logo?.text || "All Vip Courses"}
                    </span>
                  </>
                )}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {visibleNavItems.map((link, index) => {
                const isActive = location.pathname === link.url || (link.url !== '/' && location.pathname.startsWith(link.url))
                const isExternal = link.type === 'external'

                const navItemStyle = {
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "7px 14px",
                  borderRadius: 10,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  color: isActive ? "#FBBF24" : "#94A3B8",
                  background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                  border: isActive ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                }

                const content_inner = (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                        style={{ background: "#F59E0B", boxShadow: "0 0 12px #F59E0B" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )

                if (isExternal) {
                  return (
                    <a
                      key={`desktop-${link.url}-${index}`}
                      href={link.url}
                      style={navItemStyle}
                      target={link.openInNewTab ? "_blank" : "_self"}
                      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#FBBF24"; e.currentTarget.style.background = "rgba(245,158,11,0.07)" } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "transparent" } }}
                    >
                      {content_inner}
                    </a>
                  )
                }

                return (
                  <Link
                    key={`desktop-${link.url}-${index}`}
                    to={link.url}
                    style={navItemStyle}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#FBBF24"; e.currentTarget.style.background = "rgba(245,158,11,0.07)" } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "transparent" } }}
                  >
                    {content_inner}
                  </Link>
                )
              })}
            </nav>

            {/* Right Section: Search, User/Login, Theme */}
            <div className="flex items-center gap-2">

              {/* Search — glassmorphic squircle */}
              {content?.elements?.showSearch !== false && (
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="Toggle Search"
                  className="flex items-center justify-center transition-all duration-200"
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"; e.currentTarget.style.transform = "scale(1.07)"; e.currentTarget.style.background = "rgba(245,158,11,0.07)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                >
                  <Search className="w-4 h-4" style={{ color: "#94A3B8" }} />
                </button>
              )}

              {currentUser ? (
                <>
                  {/* Dashboard — luxury gradient pill */}
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    className="hidden sm:flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: "7px 16px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      letterSpacing: "0.01em",
                      boxShadow: "0 4px 20px -2px rgba(245,158,11,0.4)",
                      textDecoration: "none",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 28px -2px rgba(245,158,11,0.6)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px -2px rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "translateY(0)" }}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Dashboard
                  </Link>

                  {/* Sign Out — subtle glass → crimson hover */}
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: "7px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#94A3B8",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "#F87171" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#94A3B8" }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 transition-all duration-200"
                  style={{
                    padding: "7px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#0B0F17",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 16px -2px rgba(245,158,11,0.35)",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px -2px rgba(245,158,11,0.5)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px -2px rgba(245,158,11,0.35)"; e.currentTarget.style.transform = "translateY(0)" }}
                >
                  Login
                </Link>
              )}

              {/* Theme Toggle — glassmorphic squircle */}
              {content?.elements?.showThemeToggle && (
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="flex items-center justify-center transition-all duration-200"
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"; e.currentTarget.style.transform = "scale(1.07)"; e.currentTarget.style.background = "rgba(245,158,11,0.07)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                >
                  {isDark
                    ? <Sun className="w-4 h-4" style={{ color: "#FBBF24" }} />
                    : <Moon className="w-4 h-4" style={{ color: "#94A3B8" }} />
                  }
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

      {/* Mobile Sidebar — Premium Obsidian Drawer */}
      <AnimatePresence>
        {content?.mobileMenu?.enabled && sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[300px] sm:w-[320px] z-50 overflow-y-auto lg:hidden flex flex-col"
              style={{
                background: "linear-gradient(160deg, #0B0F17 0%, #0f1420 50%, #111827 100%)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(16px)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: "4px 0 32px rgba(0,0,0,0.6), 1px 0 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* ── Header ── */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 group">
                  <motion.span
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: "linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {content?.logo?.text || "All Vip Courses"}
                  </motion.span>
                </Link>

                {/* Glass Close Button */}
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  aria-label="Close menu"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  className="hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-shadow duration-200"
                >
                  <X className="w-4 h-4 text-slate-300" />
                </motion.button>
              </div>

              {/* ── User Profile Card ── */}
              {currentUser && (
                <div className="px-4 pt-4 pb-3 flex-shrink-0">
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                    }}
                  >
                    {/* Avatar with amber glow ring */}
                    <div className="relative flex-shrink-0">
                      <div
                        style={{
                          position: "absolute",
                          inset: -2,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #F59E0B, #FBBF24, #D97706)",
                          zIndex: 0,
                          boxShadow: "0 0 12px rgba(245,158,11,0.5)",
                        }}
                      />
                      {userProfile?.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt={userProfile.name || "Profile"}
                          loading="lazy"
                          decoding="async"
                          width="44"
                          height="44"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                          className="w-11 h-11 rounded-full object-cover relative z-10"
                          style={{ border: "2px solid #0B0F17" }}
                        />
                      ) : null}
                      <div
                        className="w-11 h-11 rounded-full items-center justify-center relative z-10"
                        style={{
                          display: userProfile?.photoURL ? 'none' : 'flex',
                          background: "linear-gradient(135deg, #1e293b, #0f172a)",
                          border: "2px solid #0B0F17",
                        }}
                      >
                          <User className="w-5 h-5 text-amber-400" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontWeight: 700, fontSize: "0.875rem", color: "#F1F5F9", letterSpacing: "-0.01em" }}
                      >
                        {userProfile?.name || "User"}
                      </p>
                      <p className="truncate" style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>
                        {userProfile?.email}
                      </p>
                    </div>

                    {isAdmin && (
                      <span
                        className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(245,158,11,0.15)",
                          color: "#F59E0B",
                          border: "1px solid rgba(245,158,11,0.3)",
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Main Navigation ── */}
              <div className="px-3 pt-2 pb-1 flex-1">
                {/* Dynamic nav links from config */}
                <div className="space-y-0.5">
                  {visibleNavItems.map((link, index) => {
                    const isActive = location.pathname === link.url || (link.url !== "/" && location.pathname.startsWith(link.url))

                    // Distinct icon override per label
                    let NavIcon = link.Icon || Home
                    const lbl = link.label?.toLowerCase() || ""
                    if (lbl === "home") NavIcon = Home
                    else if (lbl === "courses") NavIcon = GraduationCap
                    else if (lbl.includes("communit")) NavIcon = MessageSquare
                    else if (lbl.includes("announc")) NavIcon = Megaphone
                    else if (lbl.includes("news")) NavIcon = Bell

                    const isExternal = link.type === "external"

                    const itemContent = (
                      <>
                        {/* Active bar */}
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-bar"
                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                            style={{ background: "linear-gradient(180deg, #F59E0B, #FBBF24)" }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}

                        {/* Icon container */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                          style={{
                            background: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)",
                            border: isActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <NavIcon
                            className="w-4 h-4 transition-colors duration-200"
                            style={{ color: isActive ? "#F59E0B" : "#64748B" }}
                          />
                        </div>

                        <span
                          className="flex-1 transition-colors duration-200"
                          style={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: "0.875rem",
                            color: isActive ? "#F1F5F9" : "#94A3B8",
                            letterSpacing: "0.005em",
                          }}
                        >
                          {link.label}
                        </span>

                        <ChevronRight
                          className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5"
                          style={{ color: "#64748B" }}
                        />
                      </>
                    )

                    const sharedStyle = {
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 10px 10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "background 0.15s, transform 0.1s",
                      background: isActive ? "rgba(245,158,11,0.09)" : "transparent",
                    }

                    if (isExternal) {
                      return (
                        <a
                          key={`mobile-${link.url}-${index}`}
                          href={link.url}
                          target={link.openInNewTab ? "_blank" : "_self"}
                          rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                          onClick={() => setSidebarOpen(false)}
                          className="group flex items-center gap-3 hover:bg-white/[0.04] active:scale-[0.98]"
                          style={sharedStyle}
                        >
                          {itemContent}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={`mobile-${link.url}-${index}`}
                        to={link.url}
                        onClick={() => setSidebarOpen(false)}
                        className="group flex items-center gap-3 hover:bg-white/[0.04] active:scale-[0.98]"
                        style={sharedStyle}
                      >
                        {itemContent}
                      </Link>
                    )
                  })}
                </div>

                {/* ── Logged-in user links ── */}
                {currentUser && (
                  <>
                    <div
                      className="my-3 mx-1"
                      style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
                    />
                    <div className="space-y-0.5">
                      {/* Dashboard */}
                      {(() => {
                        const path = isAdmin ? "/admin" : "/dashboard"
                        const isActive = location.pathname === path || location.pathname.startsWith(path)
                        return (
                          <Link
                            to={path}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center gap-3 hover:bg-white/[0.04] active:scale-[0.98]"
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 10px 10px 14px",
                              borderRadius: 10,
                              cursor: "pointer",
                              transition: "background 0.15s",
                              background: isActive ? "rgba(245,158,11,0.09)" : "transparent",
                            }}
                          >
                            {isActive && (
                              <motion.div layoutId="sidebar-active-bar" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg,#F59E0B,#FBBF24)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                            )}
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)", border: isActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <LayoutGrid className="w-4 h-4" style={{ color: isActive ? "#F59E0B" : "#64748B" }} />
                            </div>
                            <span style={{ fontWeight: isActive ? 600 : 500, fontSize: "0.875rem", color: isActive ? "#F1F5F9" : "#94A3B8", letterSpacing: "0.005em", flex: 1 }}>Dashboard</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" style={{ color: "#64748B" }} />
                          </Link>
                        )
                      })()}

                      {/* My Courses */}
                      {(() => {
                        const path = "/my-courses"
                        const isActive = location.pathname === path
                        return (
                          <Link to={path} onClick={() => setSidebarOpen(false)} className="group flex items-center gap-3 hover:bg-white/[0.04] active:scale-[0.98]" style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 10px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", background: isActive ? "rgba(245,158,11,0.09)" : "transparent" }}>
                            {isActive && <motion.div layoutId="sidebar-active-bar" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg,#F59E0B,#FBBF24)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)", border: isActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <PlayCircle className="w-4 h-4" style={{ color: isActive ? "#F59E0B" : "#64748B" }} />
                            </div>
                            <span style={{ fontWeight: isActive ? 600 : 500, fontSize: "0.875rem", color: isActive ? "#F1F5F9" : "#94A3B8", letterSpacing: "0.005em", flex: 1 }}>My Courses</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" style={{ color: "#64748B" }} />
                          </Link>
                        )
                      })()}

                      {/* Payment History (non-admin) */}
                      {!isAdmin && (() => {
                        const path = "/payment-history"
                        const isActive = location.pathname === path
                        return (
                          <Link to={path} onClick={() => setSidebarOpen(false)} className="group flex items-center gap-3 hover:bg-white/[0.04] active:scale-[0.98]" style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 10px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", background: isActive ? "rgba(245,158,11,0.09)" : "transparent" }}>
                            {isActive && <motion.div layoutId="sidebar-active-bar" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg,#F59E0B,#FBBF24)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)", border: isActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <CreditCard className="w-4 h-4" style={{ color: isActive ? "#F59E0B" : "#64748B" }} />
                            </div>
                            <span style={{ fontWeight: isActive ? 600 : 500, fontSize: "0.875rem", color: isActive ? "#F1F5F9" : "#94A3B8", letterSpacing: "0.005em", flex: 1 }}>Payment History</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" style={{ color: "#64748B" }} />
                          </Link>
                        )
                      })()}

                      {/* Profile */}
                      {(() => {
                        const path = "/profile"
                        const isActive = location.pathname === path
                        return (
                          <Link to={path} onClick={() => setSidebarOpen(false)} className="group flex items-center gap-3 hover:bg-white/[0.04] active:scale-[0.98]" style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 10px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", background: isActive ? "rgba(245,158,11,0.09)" : "transparent" }}>
                            {isActive && <motion.div layoutId="sidebar-active-bar" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg,#F59E0B,#FBBF24)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)", border: isActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <UserCheck className="w-4 h-4" style={{ color: isActive ? "#F59E0B" : "#64748B" }} />
                            </div>
                            <span style={{ fontWeight: isActive ? 600 : 500, fontSize: "0.875rem", color: isActive ? "#F1F5F9" : "#94A3B8", letterSpacing: "0.005em", flex: 1 }}>Profile</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" style={{ color: "#64748B" }} />
                          </Link>
                        )
                      })()}
                    </div>
                  </>
                )}
              </div>

              {/* ── Footer: Sign Out / Login ── */}
              <div
                className="px-3 py-4 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                {currentUser ? (
                  <motion.button
                    onClick={handleSignOut}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 group"
                    style={{
                      padding: "10px 10px 10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      background: "transparent",
                      border: "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                  >
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-red-500/20 group-hover:border-red-500/30"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <LogOut className="w-4 h-4 transition-colors duration-200 group-hover:text-red-400" style={{ color: "#64748B" }} />
                    </div>
                    <span
                      className="flex-1 text-left transition-colors duration-200 group-hover:text-red-400"
                      style={{ fontWeight: 500, fontSize: "0.875rem", color: "#94A3B8" }}
                    >
                      Sign Out
                    </span>
                  </motion.button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
                      color: "#0B0F17",
                      fontWeight: 700,
                      letterSpacing: "0.01em",
                      boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                    }}
                  >
                    Login
                  </Link>
                )}
              </div>
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
