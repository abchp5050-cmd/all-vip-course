"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { AlertCircle, Check, ShoppingCart, Send } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function CourseCard({ course, paymentStatus, showButton = false }) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const hasPendingPayment = paymentStatus === "pending"
  const hasAccess = paymentStatus === "approved"
  const [hasClickedTelegram, setHasClickedTelegram] = useState(false)

  useEffect(() => {
    if (showButton && currentUser) {
      console.log(`CourseCard [${course.title}]:`, {
        courseId: course.id,
        paymentStatus,
        hasPendingPayment,
        hasAccess
      })
    }
  }, [course.id, paymentStatus, showButton, currentUser])

  useEffect(() => {
    if (hasAccess && currentUser && course.id) {
      const clickedLinks = JSON.parse(localStorage.getItem(`telegram_clicks_${currentUser.uid}`) || '{}')
      setHasClickedTelegram(!!clickedLinks[course.id])
    }
  }, [hasAccess, currentUser, course.id])

  const handleButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (hasAccess && course.telegramLink) {
      return
    } else if (hasPendingPayment) {
      navigate('/payment-history')
    } else {
      const tempCartItem = {
        id: course.id,
        title: course.title,
        price: course.price || 0,
        thumbnailURL: course.thumbnailURL
      }
      localStorage.setItem("tempCheckoutItem", JSON.stringify([tempCartItem]))
      navigate('/checkout')
    }
  }

  const handleTelegramClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!course.telegramLink || !currentUser || hasClickedTelegram) return
    
    let telegramAppUrl
    const link = course.telegramLink
    
    if (link.includes('joinchat/') || link.includes('+')) {
      let inviteCode = link
      if (inviteCode.includes('joinchat/')) {
        inviteCode = inviteCode.split('joinchat/')[1].split('?')[0]
      } else if (inviteCode.includes('+')) {
        inviteCode = inviteCode.split('+')[1].split('?')[0]
      }
      telegramAppUrl = `tg://join?invite=${inviteCode}`
    } else if (link.includes('t.me/')) {
      const username = link.split('t.me/')[1].split('/')[0].split('?')[0]
      telegramAppUrl = `tg://resolve?domain=${username}`
    } else {
      telegramAppUrl = link
    }
    
    window.location.href = telegramAppUrl
    
    setTimeout(() => {
      const clickedLinks = JSON.parse(localStorage.getItem(`telegram_clicks_${currentUser.uid}`) || '{}')
      clickedLinks[course.id] = true
      localStorage.setItem(`telegram_clicks_${currentUser.uid}`, JSON.stringify(clickedLinks))
      setHasClickedTelegram(true)
    }, 500)
  }

// Add some dummy stars and students count for visual upgrade
  const rating = (Math.random() * (5 - 4.2) + 4.2).toFixed(1)
  const students = Math.floor(Math.random() * 500) + 50

  return (
    <Link to={`/${course.slug || course.id}`} className="h-full block group relative">
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col relative group/card"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video w-full">
          {course.thumbnailURL ? (
            <img
              src={course.thumbnailURL || "/placeholder.svg"}
              alt={course.title}
              className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <div className="text-center text-slate-400">
                <div className="text-5xl mb-2 opacity-50 group-hover/card:scale-110 transition-transform duration-300">📚</div>
                <p className="text-xs font-medium uppercase tracking-wider">{course.category}</p>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity duration-500" />

          {!showButton && hasPendingPayment && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] uppercase font-extrabold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5" />
              Pending
            </div>
          )}
          
          {!showButton && hasAccess && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] uppercase font-extrabold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <Check className="w-3.5 h-3.5" />
              Enrolled
            </div>
          )}
          
          {course.category && (
             <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-md text-slate-900 dark:text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-lg border border-white/20 dark:border-white/10">
               {course.category}
             </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-5 flex flex-col relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <div className="flex items-center gap-1 sm:gap-1.5 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.966.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              {rating}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
              {students} Students
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 sm:mb-3 group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors leading-tight">
            {course.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-5 line-clamp-2 flex-1 leading-relaxed">
            {course.description || "Comprehensive curriculum designed by experts to help you master the skills."}
          </p>

          <div className="flex items-end justify-between mt-auto pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800">
            {course.instructorName ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                  {course.instructorName.charAt(0)}
                </div>
                <div className="text-[10px] sm:text-xs">
                  <span className="block text-slate-400 font-medium">Instructor</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{course.instructorName}</span>
                </div>
              </div>
            ) : (
              <div />
            )}
            
            {course.price !== undefined && (
              <div className="text-right">
                <span className="text-[9px] sm:text-[10px] tracking-wider text-slate-400 font-bold uppercase block mb-0.5">Price</span>
                {course.price > 0 ? (
                   <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 whitespace-nowrap">৳{course.price}</span>
                ) : (
                   <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 whitespace-nowrap">Free</span>
                )}
              </div>
            )}
          </div>

          {showButton && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              {hasAccess && course.telegramLink ? (
                <div className="space-y-2">
                  <button
                    onClick={handleTelegramClick}
                    disabled={hasClickedTelegram}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      hasClickedTelegram
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5'
                    }`}
                  >
                    {hasClickedTelegram ? (
                      <>
                        <Check className="w-4 h-4" />
                        Joined Telegram Group
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Join Telegram Group
                      </>
                    )}
                  </button>
                  {!hasClickedTelegram && (
                    <p className="text-[10px] leading-tight text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 mt-3">
                      <span className="font-bold">Warning:</span> এই লিংকে ক্লিক করলে তোমাকে সরাসরি পেইড চ্যনেলে নিয়ে যাবে, সেখানে জয়েন করে নিবে! এই Button এক বার ক্লিক করলে পরে আর কাজ করবে না! তাই ১ম ক্লিকেই প্রাইভেট চ্যানেলে জয়েন হয়ে যাবে।
                    </p>
                  )}
                </div>
              ) : hasPendingPayment ? (
                <button
                  onClick={handleButtonClick}
                  className="w-full py-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <AlertCircle className="w-4 h-4" />
                  Pending Payment
                </button>
              ) : (
                <button
                  onClick={handleButtonClick}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 hover:scale-[1.02]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Enroll Now
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
