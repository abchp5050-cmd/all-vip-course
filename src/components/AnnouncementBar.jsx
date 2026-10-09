import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Megaphone, X } from "lucide-react"

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const settingsRef = collection(db, "settings")
        const snapshot = await getDocs(settingsRef)
        
        let found = false
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.type === "announcements" && data.enabled) {
            if (data.items && data.items.length > 0) {
              // Sort by priority (lower number = higher priority, or just keep order)
              const sorted = [...data.items].sort((a, b) => (a.order || 0) - (b.order || 0))
              setAnnouncements(sorted)
              setIsVisible(true)
              found = true
            }
          }
        })
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnnouncements()
  }, [])

  useEffect(() => {
    if (announcements.length <= 1 || isHovered || !isVisible) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [announcements.length, isHovered, isVisible])

  if (loading) {
    return (
      <div className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse w-full border-b border-slate-200 dark:border-slate-700" />
    )
  }

  if (!isVisible || announcements.length === 0) return null

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 border-b border-indigo-500 shadow-sm z-30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-white/90 shrink-0 pr-4 border-r border-white/20">
          <Megaphone className="w-4 h-4 animate-pulse text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block text-amber-300">Update</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative h-full flex items-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full text-center sm:text-left text-sm font-medium text-white line-clamp-1"
            >
              <div 
                className={`inline-block ${announcements[currentIndex].text.length > 80 ? 'animate-marquee whitespace-nowrap' : ''}`}
                style={isHovered ? { animationPlayState: 'paused' } : {}}
              >
                {announcements[currentIndex].text}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(50%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}} />
    </div>
  )
}
