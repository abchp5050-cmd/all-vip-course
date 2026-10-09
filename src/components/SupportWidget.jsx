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
    // Start after 5 seconds
    const initialTimer = setTimeout(() => {
      setShowMessage(true)
    }, 5000)

    return () => clearTimeout(initialTimer)
  }, [location.pathname])

  useEffect(() => {
    if (!showMessage && !isOpen) {
      // If message is hidden, wait a bit then show next
      const nextTimer = setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length)
        setShowMessage(true)
      }, 2000)
      return () => clearTimeout(nextTimer)
    } else if (showMessage && !isOpen) {
      // If message is shown, hide it after 6 seconds
      const hideTimer = setTimeout(() => {
        setShowMessage(false)
      }, 6000)
      return () => clearTimeout(hideTimer)
    }
  }, [showMessage, messages.length, isOpen])

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Quick Help Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <h4 className="font-bold">Chat Support</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">Quick Help Options</p>
              <div className="space-y-1">
                {quickOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={handleOpenTelegram}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <opt.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{opt.text}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
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
            className="mb-4 mr-2 max-w-[250px] bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-br-sm shadow-xl border border-slate-100 dark:border-slate-700 cursor-pointer relative"
            onClick={() => setIsOpen(true)}
          >
            <div className="absolute -right-2 bottom-0 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-100 dark:border-slate-700 rotate-45 transform translate-y-1/2 -translate-x-1/2 rounded-sm z-[-1]" />
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              {messages[messageIndex]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 border border-white/20 backdrop-blur-md"
      >
        <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-2">
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <div className="relative">
                <MessageCircle className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
              </div>
              <span className="font-bold tracking-wide">Chat With Admin</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  )
}
