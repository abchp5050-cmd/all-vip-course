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
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="h-full bg-white dark:bg-[#111318] border border-slate-100 dark:border-white/[0.06] rounded-xl overflow-hidden hover:border-indigo-300/30 dark:hover:border-indigo-500/20 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-250 flex flex-col relative group/card"
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800/60 aspect-[16/9] w-full flex-shrink-0">
          {course.thumbnailURL ? (
            <img
              src={course.thumbnailURL}
              alt={course.title}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <div className="text-center text-slate-400">
                <div className="text-3xl mb-1 opacity-40">📚</div>
                <p className="text-[9px] font-medium uppercase tracking-wider">{course.category}</p>
              </div>
            </div>
          )}
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/card:opacity-60 transition-opacity duration-400" />

          {/* Status badges */}
          {!showButton && hasPendingPayment && (
            <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold flex items-center gap-1 shadow backdrop-blur-sm">
              <AlertCircle className="w-2.5 h-2.5" /> Pending
            </div>
          )}
          {!showButton && hasAccess && (
            <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold flex items-center gap-1 shadow backdrop-blur-sm">
              <Check className="w-2.5 h-2.5" /> Enrolled
            </div>
          )}
          {course.category && (
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-white/10">
              {course.category}
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="flex-1 flex flex-col p-3 sm:p-3.5">

          {/* Title */}
          <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2 group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">
            {course.title}
          </h3>

          {/* Price + meta row */}
          <div className="flex items-center justify-between mt-auto">
            {/* Rating + students */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.966.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                {rating}
              </div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">· {students} students</span>
            </div>

            {/* Price */}
            {course.price !== undefined && (
              <div>
                {course.price > 0 ? (
                  <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">৳{course.price}</span>
                ) : (
                  <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Free</span>
                )}
              </div>
            )}
          </div>

          {/* Instructor row (only if present) */}
          {course.instructorName && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.05]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                {course.instructorName.charAt(0)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{course.instructorName}</span>
            </div>
          )}

          {/* CTA Button */}
          {showButton && (
            <div className="mt-2.5">
              {hasAccess && course.telegramLink ? (
                <div className="space-y-1.5">
                  <button
                    onClick={handleTelegramClick}
                    disabled={hasClickedTelegram}
                    className={`w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      hasClickedTelegram
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow hover:shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {hasClickedTelegram
                      ? <><Check className="w-3 h-3" /> Joined</>
                      : <><Send className="w-3 h-3" /> Join Telegram Group</>
                    }
                  </button>
                  {!hasClickedTelegram && (
                    <p className="text-[9px] leading-tight text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-500/20">
                      <span className="font-bold">Warning:</span> এই Button এক বার ক্লিক করলে পরে আর কাজ করবে না!
                    </p>
                  )}
                </div>
              ) : hasPendingPayment ? (
                <button
                  onClick={handleButtonClick}
                  className="w-full py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <AlertCircle className="w-3 h-3" /> Pending Payment
                </button>
              ) : (
                <button
                  onClick={handleButtonClick}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30 hover:-translate-y-0.5"
                >
                  <ShoppingCart className="w-3 h-3" /> Enroll Now
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
