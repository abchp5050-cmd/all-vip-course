"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Send, Check, Clock, CheckCircle, XCircle, GraduationCap, Star, Shield, Users, Sparkles, ChevronRight, AlertTriangle, X, AlertCircle, Headset, Info } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { parseTelegramLinks } from "../lib/utils"
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
    }
  }, [currentUser])

  // Real-time Firestore sync & automatic migration of localStorage clicked links
  useEffect(() => {
    if (!currentUser?.uid) return

    const storageKey = `telegram_clicks_${currentUser.uid}`
    let localCache = {}

    // 1. Immediately hydrate from localStorage for instant zero-lag rendering
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === "object") {
          localCache = parsed
          setClickedLinks(parsed)
        }
      }
    } catch (err) {
      console.error("Failed to read telegram clicks from localStorage:", err)
    }

    // 2. Real-time onSnapshot listener on users/{uid}
    const userRef = doc(db, "users", currentUser.uid)
    const unsubscribe = onSnapshot(
      userRef,
      async (docSnapshot) => {
        try {
          const userData = docSnapshot.exists() ? docSnapshot.data() : {}
          const remoteClicks = userData?.joinedTelegramLinks || {}

          // Check if any local flags exist that are not yet recorded in Firestore (migration)
          let needsMigration = false
          const migrationUpdates = {}

          for (const [key, val] of Object.entries(localCache)) {
            if (val && !remoteClicks[key]) {
              needsMigration = true
              migrationUpdates[`joinedTelegramLinks.${key}`] = true
            }
          }

          if (needsMigration) {
            try {
              await updateDoc(userRef, migrationUpdates)
            } catch (updateErr) {
              await setDoc(userRef, {
                joinedTelegramLinks: { ...localCache, ...remoteClicks }
              }, { merge: true })
            }
          }

          // Merge local and remote states
          const merged = { ...localCache, ...remoteClicks }
          setClickedLinks(merged)

          // Keep localCache and localStorage updated with latest remote truth
          localCache = merged
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged))
          } catch (e) {
            // Ignore storage quota
          }
        } catch (err) {
          console.error("Error processing telegram sync snapshot:", err)
        }
      },
      (error) => {
        console.error("Real-time telegram sync onSnapshot error:", error)
      }
    )

    return () => unsubscribe()
  }, [currentUser?.uid])

  const saveClickedLink = async (courseId, linkIndex = 0) => {
    if (!currentUser?.uid || !courseId) return

    const linkKey = `${courseId}_${linkIndex}`
    const storageKey = `telegram_clicks_${currentUser.uid}`

    // 1. Update local state immediately for zero-lag UI response
    const updated = {
      ...clickedLinks,
      [linkKey]: true,
    }
    if (Number(linkIndex) === 0) {
      updated[courseId] = true
    }
    setClickedLinks(updated)

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.error("Error saving clicked link to localStorage:", e)
    }

    // 2. Immediately persist to Firestore so all other devices reflect the change in real time
    try {
      const userRef = doc(db, "users", currentUser.uid)
      const updates = {
        [`joinedTelegramLinks.${linkKey}`]: true,
      }
      if (Number(linkIndex) === 0) {
        updates[`joinedTelegramLinks.${courseId}`] = true
      }

      await updateDoc(userRef, updates).catch(async () => {
        await setDoc(userRef, {
          joinedTelegramLinks: {
            [linkKey]: true,
            ...(Number(linkIndex) === 0 ? { [courseId]: true } : {})
          }
        }, { merge: true })
      })
    } catch (dbErr) {
      console.error("Error saving telegram click to Firestore:", dbErr)
    }
  }

  const isLinkDisabled = (courseId, linkIndex = 0) => {
    if (!courseId) return false
    const numIdx = Number(linkIndex)
    if (clickedLinks[`${courseId}_${linkIndex}`]) return true
    if (numIdx === 0 && clickedLinks[courseId]) return true
    if (numIdx === 0 && clickedLinks[`${courseId}_0`]) return true
    return false
  }

  const fetchEnrollments = async () => {
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid)
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      const paymentsList = paymentsSnapshot.docs.map(paymentDoc => ({ id: paymentDoc.id, ...paymentDoc.data() }))

      // Sort newest to oldest so latest submissions take precedence
      paymentsList.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.submittedAt?.seconds * 1000 || 0)
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.submittedAt?.seconds * 1000 || 0)
        return timeB - timeA
      })

      // Aggregate course statuses per course:
      // Priority:
      // 1. If any payment is approved, course is approved and rejectionReason is cleared.
      // 2. Else if any payment is pending, course is pending.
      // 3. Else if rejected, store paymentStatus = 'rejected' and rejectionReason.
      const courseStatusMap = new Map()

      for (const payment of paymentsList) {
        if (payment.courses && payment.courses.length > 0) {
          for (const courseInfo of payment.courses) {
            const itemStatus = courseInfo.status || payment.status || "pending"
            const itemReason = courseInfo.rejectionReason !== undefined
              ? courseInfo.rejectionReason
              : (itemStatus === "rejected" ? (payment.rejectionReason || null) : null)

            const existing = courseStatusMap.get(courseInfo.id)
            if (!existing) {
              courseStatusMap.set(courseInfo.id, {
                paymentId: payment.id,
                courseInfo,
                paymentStatus: itemStatus,
                rejectionReason: itemReason || null,
              })
            } else if (itemStatus === "approved") {
              // Approved always takes precedence; hide/clear previous rejection reason
              courseStatusMap.set(courseInfo.id, {
                paymentId: payment.id,
                courseInfo,
                paymentStatus: "approved",
                rejectionReason: null,
              })
            } else if (existing.paymentStatus === "rejected" && itemStatus === "pending") {
              // Active pending submission overrides older rejected submission
              courseStatusMap.set(courseInfo.id, {
                paymentId: payment.id,
                courseInfo,
                paymentStatus: "pending",
                rejectionReason: null,
              })
            }
          }
        }
      }

      const enrollmentsData = []

      for (const [courseId, info] of courseStatusMap.entries()) {
        try {
          const courseDoc = await getDoc(doc(db, "courses", courseId))
          if (courseDoc.exists()) {
            const enrollmentQuery = query(
              collection(db, "enrollments"),
              where("userId", "==", currentUser.uid),
              where("courseId", "==", courseId)
            )
            const enrollmentSnapshot = await getDocs(enrollmentQuery)
            const enrollmentId = !enrollmentSnapshot.empty ? enrollmentSnapshot.docs[0].id : null

            enrollmentsData.push({
              id: enrollmentId || `${info.paymentId}_${courseId}`,
              enrollmentId,
              paymentId: info.paymentId,
              userId: currentUser.uid,
              courseId,
              status: info.paymentStatus === 'approved' ? 'APPROVED' : info.paymentStatus === 'rejected' ? 'REJECTED' : 'PENDING',
              paymentStatus: info.paymentStatus,
              rejectionReason: info.rejectionReason,
              course: { id: courseDoc.id, ...courseDoc.data() }
            })
          }
        } catch (error) {
          console.error("Error fetching course:", error)
        }
      }

      // Sort: approved first, then pending, then rejected
      enrollmentsData.sort((a, b) => {
        const order = { approved: 1, pending: 2, rejected: 3 }
        return (order[a.paymentStatus] || 4) - (order[b.paymentStatus] || 4)
      })

      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramClick = (courseId, link, linkIndex = 0) => {
    if (!link || !currentUser?.uid) return
    if (isLinkDisabled(courseId, linkIndex)) return

    // Immediately record click locally and trigger Firestore background sync
    saveClickedLink(courseId, linkIndex)

    let telegramAppUrl
    // Check if it's a joinchat or + invite link (private group)
    if (link.includes('joinchat/') || link.includes('+')) {
      // Extract invite code
      let inviteCode = link
      if (inviteCode.includes('joinchat/')) {
        inviteCode = inviteCode.split('joinchat/')[1].split('?')[0]
      } else if (inviteCode.includes('+')) {
        inviteCode = inviteCode.split('+')[1].split('?')[0]
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
      <div className="min-h-screen pt-28 pb-12 px-5 sm:px-6 bg-[#050816] relative overflow-hidden">
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
      className="min-h-screen pt-28 pb-12 px-5 sm:px-6 bg-[#050816] relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Premium Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-7 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3 sm:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your Learning Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 text-white tracking-tight">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Courses</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md">
              Access your purchased courses and join exclusive Telegram communities to accelerate your learning.
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#111827] to-[#050816] rounded-2xl border border-slate-800 shadow-xl shadow-orange-500/5 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>
            <GraduationCap className="w-9 h-9 text-orange-400 relative z-10" />
          </div>
        </motion.div>

        {/* Courses Grid */}
        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-[340px] md:max-w-none mx-auto w-full">
            {enrollments.map((enrollment, index) => {
              const course = enrollment.course
              const isApproved = enrollment.paymentStatus === 'approved'
              const isRejected = enrollment.paymentStatus === 'rejected'
              const isPending = !isApproved && !isRejected

              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.4, type: "spring" }}
                  whileHover={{ y: -4 }}
                  className={`bg-[#111827] border ${
                    isRejected
                      ? 'border-rose-500/30 hover:border-rose-500/50 hover:shadow-rose-500/10'
                      : isPending
                      ? 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/10'
                      : 'border-slate-800 hover:border-orange-500/40 hover:shadow-orange-500/10'
                  } rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col w-full`}
                >
                  {/* Course Thumbnail */}
                  <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                    {course.thumbnailURL ? (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="225"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : null}
                    <div 
                      className="w-full h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
                      style={{ display: course.thumbnailURL ? 'none' : 'flex' }}
                    >
                      <BookOpen className="w-10 h-10 text-slate-700" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-75" />

                    {/* Status Badge */}
                    {isRejected ? (
                      <div className="absolute top-2.5 right-2.5 bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-400/30 flex items-center gap-1 shadow-md shadow-rose-600/25">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </div>
                    ) : isPending ? (
                      <div className="absolute top-2.5 right-2.5 bg-amber-500/95 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1 shadow-md shadow-amber-500/25">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>Pending</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 shadow-md shadow-emerald-500/20">
                        <Check className="w-3.5 h-3.5" />
                        <span>ENROLLED</span>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-4 relative flex-1 flex flex-col justify-between">
                    <div className="absolute -top-4 right-4 w-8 h-8 bg-[#111827] rounded-full border border-slate-700/80 flex items-center justify-center shadow-lg z-10">
                      {isRejected ? (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      ) : isPending ? (
                        <Clock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <GraduationCap className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div>
                      {(() => {
                        const cats = Array.isArray(course.categories) && course.categories.length > 0
                          ? course.categories
                          : (course.category ? [course.category] : [])
                        if (cats.length === 0) return null
                        return (
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 line-clamp-1 ${
                            isRejected ? 'text-rose-400' : isPending ? 'text-amber-400' : 'text-orange-400'
                          }`}>
                            {cats.join(" • ")}
                          </p>
                        )
                      })()}
                      <h3 className="font-bold text-base text-white leading-snug line-clamp-1">{course.title}</h3>
                    </div>

                    {isRejected ? (
                      <div className="space-y-2 pt-2">
                        {/* Status Tag */}
                        <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>পেমেন্ট বাতিল হয়েছে</span>
                        </div>

                        {/* Rejection Reason Box */}
                        {enrollment.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/30 space-y-1">
                            <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
                              <span>বাতিলের কারণ</span>
                            </div>
                            <p className="text-xs text-slate-200 bg-slate-950/60 p-2 rounded-lg border border-rose-500/20 leading-relaxed font-sans break-words whitespace-pre-wrap">
                              {enrollment.rejectionReason}
                            </p>
                            <div className="flex items-start gap-1 text-[9px] text-slate-400 leading-snug">
                              <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <span>সঠিক তথ্য দিয়ে পুনরায় পেমেন্ট করুন অথবা যোগাযোগ করুন।</span>
                            </div>
                          </div>
                        )}

                        {/* Admin Support CTA */}
                        <a
                          href="https://t.me/hscvip/1394"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-orange-500/40 bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <Headset className="w-4 h-4 text-orange-400" />
                          <span>Admin Support</span>
                        </a>
                      </div>
                    ) : isPending ? (
                      <div className="space-y-2 pt-2">
                        {/* Status Tag */}
                        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
                          <span>ভেরিফিকেশন চলছে</span>
                        </div>

                        {/* Pending Info Notice */}
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            অ্যাডমিন পেমেন্ট যাচাই করার পর টেলিগ্রাম এক্সেস আনলক হবে।
                          </p>
                        </div>

                        {/* Disabled Pending Button */}
                        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-400 flex items-center justify-center gap-2 text-sm font-medium">
                          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                          <span>Pending Verification</span>
                        </div>
                      </div>
                    ) : (
                      /* Telegram Group Access */
                      (() => {
                        const tgLinks = parseTelegramLinks(course.telegramLinks || course.telegramLink || course.telegramGroupLink)
                        return tgLinks.length > 0 ? (
                          <div className="space-y-2 pt-2">
                            {tgLinks.map((item, idx) => {
                              const disabled = isLinkDisabled(course.id, idx)
                              const customLabel = item.label?.trim()
                              const defaultLabel = tgLinks.length === 1 ? "Join Telegram Group" : `Join Group #${idx + 1}`
                              const label = customLabel || defaultLabel
                              const disabledLabel = tgLinks.length === 1
                                ? "Joined / Link Used"
                                : (customLabel ? `${customLabel} (Joined / Link Used)` : `Group #${idx + 1} (Joined / Link Used)`)

                              return (
                                <motion.button
                                  key={idx}
                                  whileTap={disabled ? undefined : { scale: 0.96 }}
                                  onClick={() => !disabled && handleTelegramClick(course.id, item.url, idx)}
                                  disabled={disabled}
                                  className={`w-full py-2.5 px-4 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 text-sm select-none ${
                                    disabled
                                      ? 'bg-slate-800/80 border border-slate-700/80 text-emerald-400 cursor-not-allowed opacity-90'
                                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 border border-orange-400/20 active:scale-[0.98]'
                                  }`}
                                >
                                  {disabled ? (
                                    <>
                                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                      <span className="truncate">{disabledLabel}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 shrink-0" />
                                      <span className="truncate">{label}</span>
                                    </>
                                  )}
                                </motion.button>
                              )
                            })}
                            <p className="text-[11px] text-center text-gray-400 mt-2 font-normal">
                              {tgLinks.every((_, i) => isLinkDisabled(course.id, i))
                                ? 'Joined / Link Used on this account'
                                : 'Secure access via Telegram'}
                            </p>
                          </div>
                        ) : (
                          <div className="py-2.5 px-4 bg-slate-800/50 border border-slate-800 rounded-xl text-center mt-2">
                            <p className="text-xs text-slate-400 font-medium">
                              Telegram group will be available soon
                            </p>
                          </div>
                        )
                      })()
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
