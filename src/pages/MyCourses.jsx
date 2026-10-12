"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Send, Check, Clock, CheckCircle, XCircle, GraduationCap, Star, Shield, Users, Sparkles, ChevronRight, AlertTriangle, X } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import TelegramJoinButton from "../components/TelegramJoinButton"
import { MyCoursesSkeleton } from "../components/SkeletonLoader"

export default function MyCourses() {
  const { currentUser } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [clickedLinks, setClickedLinks] = useState({})
  const [showWarningModal, setShowWarningModal] = useState(false)

  useEffect(() => {
    if (currentUser) {
      fetchEnrollments()
      loadClickedLinks()
    }
  }, [currentUser])

  const loadClickedLinks = () => {
    const saved = localStorage.getItem(`telegram_clicks_${currentUser?.uid}`)
    if (saved) {
      setClickedLinks(JSON.parse(saved))
    }
  }

  const saveClickedLink = (courseId) => {
    const updated = { ...clickedLinks, [courseId]: true }
    setClickedLinks(updated)
    localStorage.setItem(`telegram_clicks_${currentUser?.uid}`, JSON.stringify(updated))
  }

  const fetchEnrollments = async () => {
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "approved")
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      const enrollmentsData = []
      
      for (const paymentDoc of paymentsSnapshot.docs) {
        const payment = paymentDoc.data()
        
        if (payment.courses && payment.courses.length > 0) {
          for (const courseInfo of payment.courses) {
            try {
              const courseDoc = await getDoc(doc(db, "courses", courseInfo.id))
              if (courseDoc.exists()) {
                const enrollmentQuery = query(
                  collection(db, "enrollments"),
                  where("userId", "==", currentUser.uid),
                  where("courseId", "==", courseInfo.id)
                )
                const enrollmentSnapshot = await getDocs(enrollmentQuery)
                const enrollmentId = !enrollmentSnapshot.empty ? enrollmentSnapshot.docs[0].id : null

                enrollmentsData.push({
                  id: enrollmentId || `${paymentDoc.id}_${courseInfo.id}`,
                  enrollmentId,
                  paymentId: paymentDoc.id,
                  userId: currentUser.uid,
                  courseId: courseInfo.id,
                  status: 'APPROVED',
                  paymentStatus: 'approved',
                  course: { id: courseDoc.id, ...courseDoc.data() }
                })
              }
            } catch (error) {
              console.error("Error fetching course:", error)
            }
          }
        }
      }

      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramClick = (enrollment) => {
    const course = enrollment.course
    if (!course.telegramLink) return
    
    let telegramAppUrl
    const link = course.telegramLink
    
    // Check if it's a joinchat or + invite link (private group)
    if (link.includes('joinchat/') || link.includes('+')) {
      // Extract invite code
      let inviteCode = link
      if (inviteCode.includes('joinchat/')) {
        inviteCode = inviteCode.split('joinchat/')[1]
      } else if (inviteCode.includes('+')) {
        inviteCode = inviteCode.split('+')[1]
      }
      // Use join protocol for private groups
      telegramAppUrl = `tg://join?invite=${inviteCode}`
    } else if (link.includes('t.me/')) {
      // Public group with username
      const username = link.split('t.me/')[1].split('/')[0].split('?')[0]
      // Use resolve protocol for public groups
      telegramAppUrl = `tg://resolve?domain=${username}`
    } else {
      // Fallback to original URL if format is unknown
      telegramAppUrl = link
    }
    
    // Open in Telegram app
    window.location.href = telegramAppUrl
    
    // Mark as clicked after a short delay
    setTimeout(() => {
      saveClickedLink(course.id)
    }, 500)
  }

  useEffect(() => {
    if (!loading && currentUser) {
      const approvedCourses = enrollments.filter(e => e.paymentStatus === 'approved')
      if (approvedCourses.length > 0) {
        setShowWarningModal(true)
      }
    }
  }, [loading, enrollments, currentUser])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-[#050816] relative overflow-hidden">
        <div className="container mx-auto max-w-5xl relative z-10">
          <MyCoursesSkeleton />
        </div>
      </div>
    )
  }


  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-24 pb-12 px-4 bg-[#050816] relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Premium Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4 sm:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Your Learning Hub</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 text-white tracking-tight">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Courses</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-md">
              Access your purchased courses and join exclusive Telegram communities to accelerate your learning.
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#111827] to-[#050816] rounded-2xl border border-slate-800 shadow-xl shadow-orange-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>
            <GraduationCap className="w-12 h-12 text-orange-400 relative z-10" />
          </div>
        </motion.div>

        {/* Courses Grid */}
        {enrollments.length > 0 && enrollments.filter(e => e.paymentStatus === 'approved').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.filter(e => e.paymentStatus === 'approved').map((enrollment, index) => {
              const course = enrollment.course
              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
                  whileHover={{ y: -5 }}
                  className="bg-[#111827] border border-slate-800 rounded-[24px] overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group"
                >
                  {/* Course Image */}
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    {course.thumbnailURL ? (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="225"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <BookOpen className="w-12 h-12 text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />
                  </div>

                  {/* Course Info */}
                  <div className="p-6 space-y-5 relative">
                    <div className="absolute -top-6 right-4 w-12 h-12 bg-[#111827] rounded-full border border-slate-800 flex items-center justify-center shadow-lg">
                      <GraduationCap className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      {course.category && (
                        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">{course.category}</p>
                      )}
                      <h3 className="font-bold text-xl text-white leading-snug line-clamp-2">{course.title}</h3>
                    </div>

                    {/* Telegram Group Access */}
                    {course.telegramLink ? (
                      <div className="space-y-3 pt-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTelegramClick(enrollment)}
                          disabled={clickedLinks[course.id]}
                          className={`w-full py-3.5 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 ${
                            clickedLinks[course.id]
                              ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25'
                          }`}
                        >
                          {clickedLinks[course.id] ? (
                            <>
                              <Check className="w-5 h-5" />
                              Opened in Telegram
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Join Telegram Group
                            </>
                          )}
                        </motion.button>
                        <p className="text-[11px] text-center text-slate-500 font-medium">
                          {clickedLinks[course.id]
                            ? 'Button disabled after opening'
                            : 'Secure access via Telegram'}
                        </p>
                      </div>
                    ) : (
                      <div className="py-3 px-4 bg-slate-800/50 border border-slate-800 rounded-xl text-center mt-2">
                        <p className="text-xs text-slate-400 font-medium">
                          Community link coming soon
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Premium Empty State Card */}
            <div className="w-full max-w-2xl bg-[#111827]/80 backdrop-blur-xl border border-slate-800/80 rounded-[28px] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden mb-8">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
              
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-xl shadow-black/50"
              >
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                <BookOpen className="w-10 h-10 text-orange-400 relative z-10" />
              </motion.div>
              
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">No Courses Yet</h3>
              <p className="text-slate-400 text-sm sm:text-base mb-10 max-w-md mx-auto leading-relaxed">
                Start your learning journey by exploring our premium courses crafted by industry experts.
              </p>
              
              <Link to="/courses" className="block w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/25 transition-all duration-300 group"
                >
                  <span>Explore Courses</span>
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>

            {/* Helpful Section Below */}
            <div className="w-full max-w-4xl mt-4">
              <h4 className="text-center text-slate-300 font-semibold mb-6">Why start learning today?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Star, title: "Expert Courses", desc: "Learn from industry leaders" },
                  { icon: Shield, title: "Lifetime Access", desc: "Learn at your own pace" },
                  { icon: Users, title: "Student Support", desc: "24/7 dedicated help" }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="bg-[#111827]/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4 flex items-start gap-4 hover:bg-[#111827] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h5 className="text-white font-semibold text-sm mb-1">{feature.title}</h5>
                      <p className="text-slate-400 text-xs">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Telegram Join Warning Popup */}
        <AnimatePresence>
          {showWarningModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowWarningModal(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm sm:max-w-md bg-[#0a0f1d]/95 backdrop-blur-2xl border border-orange-500/35 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(249,115,22,0.18)] overflow-hidden text-slate-200"
              >
                {/* Accent Top Border Glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Header: Title Icon + Title */}
                <div className="flex items-center gap-3.5 mb-4">
                  {/* Title Icon: Telegram / Send style icon with subtle blue accent & glow */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                    <Send className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-sky-400 -rotate-12 translate-x-0.5" strokeWidth={2.2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Telegram Join Notice</span>
                      <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]" strokeWidth={2.2} />
                    </h3>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setShowWarningModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/60 backdrop-blur-md text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm -mr-1 -mt-1"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Main Warning Box */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Warning Icon: AlertTriangle inside small circular glass container with soft warning glow */}
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-400/40 backdrop-blur-md flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-orange-400 font-bold text-xs sm:text-sm">
                      গুরুত্বপূর্ণ:
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-[13px] text-orange-100/90 leading-relaxed">
                    <p>
                      Telegram Join Button এ একবার ক্লিক করলে সাথে সাথে Telegram Group খুলে যাবে।
                    </p>
                    <p className="font-semibold text-orange-300">
                      Button শুধুমাত্র একবার কাজ করবে।
                    </p>
                    <p className="text-[11px] sm:text-xs text-orange-200/80 pt-1.5 border-t border-orange-500/20">
                      কোনো কারণে Join সম্পন্ন না হলে Admin এর সাথে যোগাযোগ করুন।
                    </p>
                  </div>
                </div>

                {/* Popup Footer */}
                <div className="pt-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowWarningModal(false)}
                    className="w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer tracking-wide"
                  >
                    বুঝেছি
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )

}
