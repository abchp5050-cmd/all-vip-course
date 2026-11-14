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
    <div className="fixed bottom-5 sm:bottom-6 right-3.5 sm:right-6 z-[60] flex flex-col items-end" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Quick Help Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 sm:mb-4 w-[280px] sm:w-72 bg-slate-900/95 rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden backdrop-blur-xl"
          >
            <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 p-3 sm:p-4 text-slate-950 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                <h4 className="font-extrabold text-sm sm:text-base tracking-tight">VIP Chat Support</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors text-slate-950"
                aria-label="Close Support"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2.5 bg-slate-900/95">
              <p className="text-[10px] sm:text-xs font-semibold text-amber-400/80 uppercase tracking-wider px-3 py-1">Quick Help Options</p>
              <div className="space-y-1 mt-1">
                {quickOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={handleOpenTelegram}
                    className="w-full flex items-center justify-between p-2 sm:p-2.5 hover:bg-slate-800/80 rounded-xl transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                        <opt.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-amber-300 transition-colors">{opt.text}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
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
            className="mb-2 mr-1 max-w-[180px] sm:max-w-[210px] bg-slate-900/95 backdrop-blur-md py-2.5 px-3.5 rounded-[16px] rounded-br-sm shadow-xl shadow-amber-500/10 border border-amber-500/30 cursor-pointer relative"
            onClick={() => setIsOpen(true)}
          >
            <div className="absolute right-3 -bottom-1 w-2 h-2 bg-slate-900/95 border-r border-b border-amber-500/30 rotate-45" />
            <p className="text-[12px] sm:text-[13px] text-slate-200 font-medium leading-[1.35] tracking-tight">
              {messages[messageIndex]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        animate={{ y: [0, -4, 0], boxShadow: ["0px 0px 0px 0px rgba(245,158,11,0.4)", "0px 0px 14px 3px rgba(245,158,11,0)", "0px 0px 0px 0px rgba(245,158,11,0)"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center w-11 h-11 sm:w-auto sm:px-3.5 sm:h-[38px] bg-slate-900/95 hover:bg-slate-800 text-amber-300 rounded-full shadow-xl shadow-amber-500/15 border border-amber-500/40 hover:border-amber-400 backdrop-blur-xl transition-all"
        aria-label="Open Live Chat Support"
      >
        <div className="absolute inset-0 rounded-full bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-1.5">
          {isOpen ? (
            <X className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
          ) : (
            <>
              <div className="relative flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 border border-slate-900 rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 border border-slate-900 rounded-full" />
              </div>
              <span className="hidden sm:inline-block text-[13px] font-bold tracking-wide whitespace-nowrap text-amber-300">Support</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  )
}
