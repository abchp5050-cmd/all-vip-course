import { useState, useEffect, memo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { AlertCircle, UsersRound, Check, ShoppingCart, Send, Star, BookOpen } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { parseTelegramLinks } from "../lib/utils"

function CourseCard({ course, paymentStatus, showButton = false, variant = "default" }) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const hasPendingPayment = paymentStatus === "pending"
  const hasAccess = paymentStatus === "approved"
  const [clickedMap, setClickedMap] = useState({})

  useEffect(() => {
    if (hasAccess && currentUser && course.id) {
      const stored = JSON.parse(localStorage.getItem(`telegram_clicks_${currentUser.uid}`) || '{}')
      setClickedMap(stored)
    }
  }, [hasAccess, currentUser, course.id])

  const handleButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (hasAccess && (course.telegramLinks?.length > 0 || course.telegramLink || course.telegramGroupLink)) {
      return
    } else if (hasPendingPayment) {
      navigate('/payment-history')
    } else {
      // Save the intended checkout item regardless
      const tempCartItem = {
        id: course.id,
        title: course.title,
        price: course.price || 0,
        thumbnailURL: course.thumbnailURL
      }
      localStorage.setItem("tempCheckoutItem", JSON.stringify([tempCartItem]))

      if (!currentUser) {
        // Not logged in — redirect to login, saving /checkout as the return destination
        navigate('/login', { state: { from: '/checkout' }, replace: false })
      } else {
        navigate('/checkout')
      }
    }
  }

  const handleTelegramClick = (e, link, linkIndex = 0) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!link || !currentUser) return
    const isClicked = !!(clickedMap[`${course.id}_${linkIndex}`] || (linkIndex === 0 && clickedMap[course.id]))
    if (isClicked) return

    let telegramAppUrl
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
      const stored = JSON.parse(localStorage.getItem(`telegram_clicks_${currentUser.uid}`) || '{}')
      stored[`${course.id}_${linkIndex}`] = true
      if (linkIndex === 0) {
        stored[course.id] = true
      }
      localStorage.setItem(`telegram_clicks_${currentUser.uid}`, JSON.stringify(stored))
      setClickedMap(stored)
    }, 500)
  }

  // Deterministic rating and students count based on course id
  const hash = course.id ? course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42
  const rating = course.rating || (4.2 + (hash % 8) / 10).toFixed(1)
  const students = course.studentsCount || course.enrolledCount || (60 + (hash % 140))

  if (variant === "compact") {
    return (
      <Link to={`/${course.slug || course.id}`} className="h-full block group relative">
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="h-full bg-[#0c101c] border border-slate-800/90 hover:border-orange-500/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-[0_4px_20px_rgba(255,121,0,0.18)] transition-all duration-300 flex flex-col relative group/card"
        >
          {/* Subtle top edge border glow highlight on hover */}
          <div className="absolute top-0 inset-x-2 sm:inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-orange-400/30 to-transparent group-hover/card:via-orange-400/80 transition-all duration-300 pointer-events-none z-10" />

          {/* 16:9 Thumbnail container */}
          <div className="relative overflow-hidden bg-slate-900 aspect-[16/9] w-full flex-shrink-0">
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
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950"
              style={{ display: course.thumbnailURL ? 'none' : 'flex' }}
            >
              <BookOpen className="w-6 h-6 text-slate-600" />
            </div>
            
            {/* Subtle bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-40 group-hover/card:opacity-60 transition-opacity duration-300 pointer-events-none" />

            {/* Category badge */}
            {(() => {
              const cats = Array.isArray(course.categories) && course.categories.length > 0 
                ? course.categories 
                : (course.category ? [course.category] : [])
              const primary = cats[0]
              const extraCount = cats.length - 1
              if (!primary) return null

              return (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 max-w-[68%] z-10 pointer-events-none">
                  <div className="bg-black/65 backdrop-blur-md text-white text-[8px] sm:text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-white/10 truncate">
                    {primary}
                  </div>
                  {extraCount > 0 && (
                    <div 
                      title={cats.slice(1).join(", ")}
                      className="bg-indigo-600/80 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded border border-white/10 shrink-0"
                    >
                      +{extraCount}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Status badges */}
            {!showButton && hasPendingPayment && (
              <div className="absolute top-1.5 right-1.5 bg-amber-500/90 text-white px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] uppercase font-bold flex items-center gap-0.5 shadow backdrop-blur-sm">
                <AlertCircle className="w-2.5 h-2.5" /> Pending
              </div>
            )}
            {!showButton && hasAccess && (
              <div className="absolute top-1.5 right-1.5 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] uppercase font-bold flex items-center gap-0.5 shadow backdrop-blur-sm">
                <Check className="w-2.5 h-2.5" /> Enrolled
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="flex-1 flex flex-col p-2 sm:p-2.5 md:p-3 justify-between">
            <div>
              {/* Title: 2 lines max */}
              <h3 className="text-[11px] sm:text-[13px] font-bold text-white line-clamp-2 leading-snug group-hover/card:text-orange-400 transition-colors h-[2.6em] mb-1.5">
                {course.title}
              </h3>

              {/* Single Compact Metadata Row: Rating + Enrolled on LEFT, Price on RIGHT */}
              <div className="flex items-center justify-between gap-1 mb-2">
                {/* Left: Rating and Enrolled */}
                <div className="flex items-center gap-1.5 min-w-0 text-[10px] sm:text-[11px] whitespace-nowrap">
                  <div className="flex items-center gap-0.5 text-amber-400 font-bold shrink-0">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                    <span>{rating}</span>
                  </div>
                  
                  <span className="text-slate-600 text-[9px] shrink-0">|</span>

                  <div className="flex items-center gap-0.5 text-slate-400 font-medium truncate">
                    <UsersRound className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{students} Enrolled</span>
                  </div>
                </div>

                {/* Right: Price */}
                {course.price !== undefined && (
                  <div className="shrink-0 text-right">
                    {course.price > 0 ? (
                      <span className="text-[12px] sm:text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                        ৳{course.price}
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs font-extrabold text-emerald-400">
                        Free
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            {showButton && (
              <div className="mt-auto pt-1">
                {(() => {
                  const tgLinks = parseTelegramLinks(course.telegramLinks || course.telegramLink || course.telegramGroupLink)
                  if (!hasAccess || tgLinks.length === 0) {
                    if (hasPendingPayment) {
                      return (
                        <button
                          onClick={handleButtonClick}
                          className="w-full py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span className="truncate">Pending Payment</span>
                        </button>
                      )
                    }
                    return (
                      <button
                        onClick={handleButtonClick}
                        className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-[0_2px_8px_rgba(255,121,0,0.25)] hover:shadow-[0_4px_12px_rgba(255,121,0,0.4)] active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-3 h-3 shrink-0" />
                        <span className="truncate">Enroll Now</span>
                      </button>
                    )
                  }

                  return (
                    <div className="space-y-1">
                      {tgLinks.map((item, idx) => {
                        const isClicked = !!(clickedMap[`${course.id}_${idx}`] || (idx === 0 && clickedMap[course.id]))
                        const customLabel = item.label?.trim()
                        const defaultLabel = tgLinks.length === 1 ? "Join Telegram" : `Join Group #${idx + 1}`
                        const label = customLabel || defaultLabel
                        const doneLabel = customLabel ? `${customLabel} (Joined)` : (tgLinks.length === 1 ? "Joined" : `Group #${idx + 1} Joined`)

                        return (
                          <button
                            key={idx}
                            onClick={(e) => handleTelegramClick(e, item.url, idx)}
                            disabled={isClicked}
                            className={`w-full py-1.5 px-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                              isClicked
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow hover:shadow-indigo-500/25 active:scale-[0.98]'
                            }`}
                          >
                            {isClicked ? (
                              <>
                                <Check className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{doneLabel}</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{label}</span>
                              </>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <Link to={`/${course.slug || course.id}`} className="h-full block group relative">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="h-full bg-white dark:bg-[#111318] border border-slate-100 dark:border-white/[0.06] rounded-xl overflow-hidden hover:border-indigo-300/30 dark:hover:border-indigo-500/20 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-250 flex flex-col relative group/card"
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800/60 aspect-[2/1] w-full flex-shrink-0">
          {course.thumbnailURL ? (
            <img
              src={course.thumbnailURL}
              alt={course.title}
              loading="lazy"
              decoding="async"
              width="400"
              height="200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900"
            style={{ display: course.thumbnailURL ? 'none' : 'flex' }}
          >
            <div className="text-center text-slate-400">
              <div className="text-3xl mb-1 opacity-40">📚</div>
              <p className="text-[9px] font-medium uppercase tracking-wider">{course.categories?.[0] || course.category}</p>
            </div>
          </div>
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/card:opacity-60 transition-opacity duration-400" />

          {/* Status badges */}
          {!showButton && hasPendingPayment && (
            <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold flex items-center gap-1 shadow backdrop-blur-sm">
              <AlertCircle className="w-2.5 h-2.5" /> Pending
            </div>
          )}
          {!showButton && hasAccess && (
            <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold flex items-center gap-1 shadow backdrop-blur-sm">
              <Check className="w-2.5 h-2.5" /> Enrolled
            </div>
          )}
          {/* Category badges */}
          {(() => {
            const cats = Array.isArray(course.categories) && course.categories.length > 0 
              ? course.categories 
              : (course.category ? [course.category] : [])
            const primary = cats[0]
            const extraCount = cats.length - 1
            if (!primary) return null

            return (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 max-w-[70%] z-10 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-white/10 truncate">
                  {primary}
                </div>
                {extraCount > 0 && (
                  <div 
                    title={cats.slice(1).join(", ")}
                    className="bg-indigo-600/85 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 shrink-0"
                  >
                    +{extraCount}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Card body */}
        <div className="flex-1 flex flex-col p-2.5 sm:p-3">

          {/* Title + Meta Row */}
          <div className="flex flex-col gap-1 mt-auto">
            <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">
              {course.title}
            </h3>

            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                  <span>⭐</span>
                  {rating}
                </div>
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[10px]"><UsersRound className="w-3 h-3" /> {students} students</span>
              </div>

              {course.price !== undefined && (
                <div>
                  {course.price > 0 ? (
                    <span className="text-[12px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">৳{course.price}</span>
                  ) : (
                    <span className="text-[12px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Free</span>
                  )}
                </div>
              )}
            </div>
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
              {(() => {
                const tgLinks = parseTelegramLinks(course.telegramLinks || course.telegramLink || course.telegramGroupLink)
                if (!hasAccess || tgLinks.length === 0) {
                  if (hasPendingPayment) {
                    return (
                      <button
                        onClick={handleButtonClick}
                        className="w-full py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <AlertCircle className="w-3 h-3" /> Pending Payment
                      </button>
                    )
                  }
                  return (
                    <button
                      onClick={handleButtonClick}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30 hover:-translate-y-0.5"
                    >
                      <ShoppingCart className="w-3 h-3" /> Enroll Now
                    </button>
                  )
                }

                return (
                  <div className="space-y-1.5">
                    {tgLinks.map((item, idx) => {
                      const isClicked = !!(clickedMap[`${course.id}_${idx}`] || (idx === 0 && clickedMap[course.id]))
                      const customLabel = item.label?.trim()
                      const defaultLabel = tgLinks.length === 1 ? "Join Telegram Group" : `Join Group #${idx + 1}`
                      const label = customLabel || defaultLabel
                      const doneLabel = customLabel ? `${customLabel} (Joined)` : (tgLinks.length === 1 ? "Joined" : `Group #${idx + 1} Joined`)

                      return (
                        <button
                          key={idx}
                          onClick={(e) => handleTelegramClick(e, item.url, idx)}
                          disabled={isClicked}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isClicked
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow hover:shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5'
                          }`}
                        >
                          {isClicked ? (
                            <>
                              <Check className="w-3 h-3" /> {doneLabel}
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" /> {label}
                            </>
                          )}
                        </button>
                      )
                    })}
                    {!tgLinks.every((_, i) => clickedMap[`${course.id}_${i}`] || (i === 0 && clickedMap[course.id])) && (
                      <p className="text-[9px] leading-tight text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-500/20">
                        <span className="font-bold">Warning:</span> এই Button এক বার ক্লিক করলে পরে আর কাজ করবে না!
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

export default memo(CourseCard)
