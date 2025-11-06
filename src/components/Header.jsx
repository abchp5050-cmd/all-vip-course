"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { fetchActiveHeaderConfig } from "../lib/headerFooterUtils"

// CRITICAL: Define deferredPrompt at module level to capture event early
let deferredPrompt = null
let isInstallListenerSet = false

// Define default navigation links outside the component
const DEFAULT_NAV_LINKS = [
    { name: "Home", path: "/", icon: Home, type: "internal" },
    { name: "Courses", path: "/courses", icon: BookOpen, type: "internal" },
    // Removed Community/Announcement as user only wants Home/Courses by default
]

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { currentUser, userProfile, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [communityEnabled, setCommunityEnabled] = useState(true)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [headerConfig, setHeaderConfig] = useState(null)
  
  // Initialize with DEFAULT_NAV_LINKS
  const [navLinks, setNavLinks] = useState(DEFAULT_NAV_LINKS)

  // Set up beforeinstallprompt listener IMMEDIATELY (before any other effects)
  useEffect(() => {
    if (isInstallListenerSet) return

    const handleBeforeInstallPrompt = (e) => {
      console.log('✅ beforeinstallprompt fired!')
      e.preventDefault()
      deferredPrompt = e
      setCanInstall(true)
      
      // Check if already dismissed
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
    const fetchSettings = async () => {
      try {
        if (!db) {
          console.warn("Firebase not available, skipping settings fetch")
          return
        }
        const settingsQuery = query(collection(db, "settings"), where("type", "==", "general"))
        const snapshot = await getDocs(settingsQuery)
        if (!snapshot.empty) {
          const settings = snapshot.docs[0].data()
          setCommunityEnabled(settings.communityEnabled !== false)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }
    fetchSettings()
  }, [])

  // 🛠️ CRITICAL FIX: Ensure proper fallback and link filtering
  useEffect(() => {
    const loadHeaderConfig = async () => {
      // Start with a clone of the default links to ensure Home and Courses are always present
      let finalNavLinks = [...DEFAULT_NAV_LINKS] 
      const existingLinkNames = new Set(DEFAULT_NAV_LINKS.map(link => link.name))

      try {
        const config = await fetchActiveHeaderConfig()
        console.log('🔍 Header Config:', config)
        
        if (config && config.content && config.content.navigation) {
          setHeaderConfig(config)
          
          const iconMap = {
            Home,
            BookOpen,
            Newspaper,
            Users,
            Download,
            CreditCard,
            BarChart3
          }
          
          const dynamicNavLinks = config.content.navigation
            .filter(item => item.isVisible !== false) // Only take visible items
            .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order
            .map(item => {
              // Default icon based on label or use Home as fallback
              let defaultIcon = Home
              if (item.label?.toLowerCase().includes('course')) defaultIcon = BookOpen
              else if (item.label?.toLowerCase().includes('news') || item.label?.toLowerCase().includes('blog')) defaultIcon = Newspaper
              else if (item.label?.toLowerCase().includes('community') || item.label?.toLowerCase().includes('user')) defaultIcon = Users
              else if (item.label?.toLowerCase().includes('payment') || item.label?.toLowerCase().includes('price')) defaultIcon = CreditCard
              
              const link = {
                name: item.label,
                path: item.url,
                icon: item.icon ? (iconMap[item.icon] || defaultIcon) : defaultIcon,
                openInNewTab: item.openInNewTab || false,
                type: item.type || 'internal'
              }
              
              // Only add dynamic link if it's not a duplicate of a default link
              // This ensures the default Home/Courses are not duplicated, but can be customized if they are in config.
              if (!existingLinkNames.has(link.name)) {
                  return link
              }
              
              // If it's a duplicate, we allow the dynamic one to overwrite the properties, 
              // but we rely on the final combination logic below.
              return link
            })
            .filter(link => !existingLinkNames.has(link.name)); // Filter out Home/Courses if they are dynamically loaded

          
          // Combine: Default links + unique dynamic links
          finalNavLinks = [...DEFAULT_NAV_LINKS, ...dynamicNavLinks];

          console.log('🔍 Dynamic Nav Links (Combined):', finalNavLinks)
          
        } else {
          // If no valid config is found, finalNavLinks remains as DEFAULT_NAV_LINKS (Home, Courses)
          console.log('⚠️ No config found, using safe default navLinks')
        }
      } catch (error) {
        console.error("❌ Error loading header config, falling back to defaults:", error)
        // On error, finalNavLinks remains as DEFAULT_NAV_LINKS
      }
      
      // Update state with the final, safe list of links
      setNavLinks(finalNavLinks)

    }
    loadHeaderConfig()
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

    const checkInIframe = () => {
      return window.self !== window.top
    }

    const iosDevice = checkIsIOS()
    setIsIOS(iosDevice)
    
    const isInstalled = checkIfInstalled()

    console.log('🔍 PWA Install Debug:', {
      isIOS: iosDevice,
      isInstalled: isInstalled,
      inIframe: checkInIframe(),
      hasLocalStorageDismiss: !!localStorage.getItem('pwaInstallDismissed'),
      deferredPromptExists: !!deferredPrompt
    })

    if (isInstalled) {
      console.log('✅ App is already installed - hiding install button')
      setShowInstallButton(false)
      localStorage.removeItem('pwaInstallDismissed')
      return
    }

    const dismissed = localStorage.getItem('pwaInstallDismissed')
    const dismissTime = dismissed ? parseInt(dismissed) : 0
    const hoursSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60)
    
    if (iosDevice) {
      if (!dismissed || hoursSinceDismiss >= 1) {
        console.log('📱 Showing iOS install button')
        setTimeout(() => {
          setShowInstallButton(true)
        }, 1000)
      } else {
        console.log('⏰ Install button dismissed recently, will show again in 1 hour')
      }
    }

    if (!iosDevice) {
      if (!dismissed || hoursSinceDismiss >= 1) {
        console.log('📱 Showing install button (non-iOS)')
        setTimeout(() => {
          if (!deferredPrompt) {
            console.log('🔔 No beforeinstallprompt received - showing button anyway')
          }
          console.log('🎯 Setting showInstallButton to TRUE')
          setShowInstallButton(true)
        }, 1000)
      } else {
        console.log('⏰ Install button dismissed recently, will show again in 1 hour')
      }
    }
    
    window.resetPWAInstall = handleResetInstallPrompt

    const handleAppInstalled = () => {
      console.log('✅ PWA was installed')
      setShowInstallButton(false)
      setShowInstallModal(false)
      localStorage.removeItem('pwaInstallDismissed')
      deferredPrompt = null
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setSidebarOpen(false)
      navigate("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleInstallClick = () => {
    console.log('📱 Install button clicked, deferredPrompt:', !!deferredPrompt)
    setShowInstallModal(true)
  }

  const handleInstallConfirm = async () => {
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available - showing manual instructions')
      return
    }

    try {
      console.log('📱 Showing install prompt...')
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to install prompt: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt')
        setShowInstallButton(false)
        setShowInstallModal(false)
      } else {
        console.log('❌ User dismissed the install prompt')
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
  
  const handleResetInstallPrompt = () => {
    localStorage.removeItem('pwaInstallDismissed')
    setShowInstallButton(true)
    console.log('✅ Install prompt reset - button will show again')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

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
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [sidebarOpen])

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>

              <Link to="/" className="flex items-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  All Vip Courses
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks && navLinks.length > 0 && navLinks.map((link, index) => {
                const isExternal = link.type === 'external'
                const linkClassName = "px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium text-foreground hover:text-primary"
                
                if (isExternal) {
                  return (
                    <a
                      key={`desktop-${link.path}-${index}`}
                      href={link.path}
                      className={linkClassName}
                      target={link.openInNewTab ? "_blank" : "_self"}
                      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    >
                      {link.name}
                    </a>
                  )
                }
                
                return (
                  <Link
                    key={`desktop-${link.path}-${index}`}
                    to={link.path}
                    className={linkClassName}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>

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

              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
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
                    className="text-2xl font-bold text-primary"
                  >
                    All Vip Courses
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
                      <div className="w-12 h-12 rounded-full bg-gradient-blue-purple flex items-center justify-center ring-2 ring-primary/50">
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

              {/* Mobile Main Navigation Links (Now guaranteed to have Home/Courses) */}
              <div className="p-4 space-y-1">
                {navLinks && navLinks.length > 0 && navLinks.map((link, index) => {
                  const Icon = link.icon || Home
                  const isExternal = link.type === 'external'
                  const linkClassName = "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  
                  if (isExternal) {
                    return (
                      <a
                        key={`mobile-${link.path}-${index}`}
                        href={link.path}
                        target={link.openInNewTab ? "_blank" : "_self"}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={linkClassName}
                      >
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                        <span className="font-medium group-hover:text-primary smooth-transition">{link.name}</span>
                      </a>
                    )
                  }
                  
                  return (
                    <Link
                      key={`mobile-${link.path}-${index}`}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={linkClassName}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                      <span className="font-medium group-hover:text-primary smooth-transition">{link.name}</span>
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

      {/* Install Modal (rest of the component is unchanged) */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:p-4 sm:items-center"
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

