import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Bot, X, ExternalLink, Book, CreditCard, Key, UserCheck } from "lucide-react"

const defaultMessages = [
  "👋 কোন কোর্স খুঁজছেন?",
  "📚 আপনার প্রয়োজনীয় কোর্স খুঁজে না পেলে Admin কে জানান",
  "💳 Payment করতে সমস্যা হলে আমাদের জানান",
  "🚀 Course access পেতে সাহায্য লাগলে মেসেজ করুন",
  "😊 যেকোনো সমস্যায় আমরা আছি আপনার পাশে"
]

export default function SupportWidget() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [messages, setMessages] = useState(defaultMessages)

  const telegramUrl = "https://t.me/Newvip69_bot"

  useEffect(() => {
    const path = location.pathname
    let newMessages = [...defaultMessages]
    
    if (path === '/checkout') {
      newMessages = ["Payment করতে সমস্যা হচ্ছে? আমরা সাহায্য করতে প্রস্তুত", ...defaultMessages]
    } else if (path === '/courses') {
      newMessages = ["আপনার পছন্দের কোর্স খুঁজে পাচ্ছেন না?", ...defaultMessages]
    } else if (
      path !== '/' && 
      path !== '/login' && 
      !path.startsWith('/admin') && 
      !path.startsWith('/dashboard') && 
      !path.startsWith('/profile') && 
      !path.startsWith('/my-courses') && 
      !path.startsWith('/payment-history') &&
      !path.startsWith('/category') &&
      path !== '/checkout-complete'
    ) {
      newMessages = ["এই কোর্স সম্পর্কে জানতে চান? Admin কে মেসেজ করুন", ...defaultMessages]
    }
    
    setMessages(newMessages)
    setMessageIndex(0)
    setShowMessage(false)
  }, [location.pathname])

  useEffect(() => {
    // When the chat is explicitly open, hide the small message popup
    if (isOpen) {
      setShowMessage(false)
      localStorage.setItem('support_last_interacted', Date.now().toString())
      return
    }

    let showTimer
    let hideTimer

    const checkAndSchedule = (isInitial = false) => {
      const now = Date.now()
      const lastShown = parseInt(localStorage.getItem('support_last_shown') || '0', 10)
      const lastInteracted = parseInt(localStorage.getItem('support_last_interacted') || '0', 10)
      
      const INTERACTION_COOLDOWN = 5 * 60 * 1000 // 5 minutes cooldown after interaction
      const NORMAL_COOLDOWN = 3 * 60 * 1000      // 3 minutes between normal popups
      const INITIAL_DELAY = 15000                // 15 seconds before first popup
      
      const timeSinceInteracted = now - lastInteracted
      const timeSinceShown = now - lastShown

      if (timeSinceInteracted < INTERACTION_COOLDOWN) {
        showTimer = setTimeout(() => checkAndSchedule(), INTERACTION_COOLDOWN - timeSinceInteracted)
        return
      }

      if (timeSinceShown < NORMAL_COOLDOWN) {
        showTimer = setTimeout(() => checkAndSchedule(), NORMAL_COOLDOWN - timeSinceShown)
        return
      }

      if (isInitial) {
        showTimer = setTimeout(() => {
          setShowMessage(true)
          localStorage.setItem('support_last_shown', Date.now().toString())
          
          hideTimer = setTimeout(() => {
            setShowMessage(false)
            setMessageIndex(prev => (prev + 1) % messages.length)
            checkAndSchedule() 
          }, 8000) // Keep message visible for 8 seconds
        }, INITIAL_DELAY)
      } else {
        setShowMessage(true)
        localStorage.setItem('support_last_shown', Date.now().toString())
        
        hideTimer = setTimeout(() => {
          setShowMessage(false)
          setMessageIndex(prev => (prev + 1) % messages.length)
          checkAndSchedule()
        }, 8000)
      }
    }

    checkAndSchedule(true)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [isOpen, messages.length])

  const handleOpenTelegram = (e) => {
    e.preventDefault()
    window.open(telegramUrl, "_blank", "noopener,noreferrer")
    setIsOpen(false)
  }

  const quickOptions = [
    { icon: Book, text: "Course Information" },
    { icon: CreditCard, text: "Payment Help" },
    { icon: Key, text: "Course Access Problem" },
    { icon: UserCheck, text: "Talk With Admin" }
  ]

  return (
    <div className="fixed bottom-[112px] sm:bottom-8 right-4 sm:right-6 z-[60] flex flex-col items-end" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Quick Help Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 sm:mb-4 w-[280px] sm:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-3 sm:p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                <h4 className="font-bold text-sm sm:text-base">Chat Support</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-1 sm:py-2">Quick Help Options</p>
              <div className="space-y-1">
                {quickOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={handleOpenTelegram}
                    className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <opt.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{opt.text}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Message Bubble */}
      <AnimatePresence>
        {!isOpen && showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 mr-1 max-w-[170px] sm:max-w-[200px] bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md py-2 px-3.5 rounded-[14px] rounded-br-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-700/50 cursor-pointer relative"
            onClick={() => setIsOpen(true)}
          >
            <div className="absolute right-3 -bottom-1 w-2 h-2 bg-white/90 dark:bg-[#111827]/90 border-r border-b border-slate-200/50 dark:border-slate-700/50 rotate-45 z-[-1]" />
            <p className="text-[13px] sm:text-[14px] text-slate-700 dark:text-slate-200 font-medium leading-[1.3] tracking-tight">
              {messages[messageIndex]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        animate={{ y: [0, -4, 0], boxShadow: ["0px 0px 0px 0px rgba(99,102,241,0.5)", "0px 0px 15px 4px rgba(99,102,241,0)", "0px 0px 0px 0px rgba(99,102,241,0)"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center w-10 h-10 sm:w-auto sm:px-3 sm:h-[36px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/30 border border-white/20 backdrop-blur-md"
      >
        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-1.5">
          {isOpen ? (
            <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          ) : (
            <>
              <div className="relative flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 border-2 border-indigo-600 rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 border-2 border-indigo-600 rounded-full" />
              </div>
              <span className="hidden sm:inline-block text-[13px] font-semibold tracking-wide whitespace-nowrap text-white">Chat</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  )
}
