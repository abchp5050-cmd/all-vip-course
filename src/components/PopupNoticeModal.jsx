"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, ArrowRight, ExternalLink } from "lucide-react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function PopupNoticeModal() {
  const [notice, setNotice] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Dismiss logic: save version to localStorage so it stays dismissed until admin updates it
  const handleDismiss = useCallback(() => {
    setIsOpen(false)
    setIsPreviewMode(false)
    if (notice?.updatedAt) {
      try {
        localStorage.setItem("vip_dismissed_notice_v", String(notice.updatedAt))
      } catch (e) {
        console.warn("[PopupNotice] Could not access localStorage:", e)
      }
    }
  }, [notice])

  // Handle CTA button click
  const handleCtaClick = (e) => {
    handleDismiss()
    // If it's an external URL, the link tag will navigate naturally
  }

  // Real-time Firestore listener + custom admin preview event
  useEffect(() => {
    const noticeRef = doc(db, "settings", "popup_notice")

    const unsubscribe = onSnapshot(
      noticeRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setNotice(null)
          setIsOpen(false)
          return
        }

        const data = docSnap.data()
        setNotice(data)

        // Smart Display Verification:
        // Enabled AND has title or message
        const hasContent = Boolean(data.title?.trim() || data.message?.trim())
        if (data.enabled && hasContent) {
          const version = String(data.updatedAt || "")
          let dismissedVersion = null
          try {
            dismissedVersion = localStorage.getItem("vip_dismissed_notice_v")
          } catch (e) {
            // ignore
          }

          // If the user hasn't dismissed this exact updated version yet:
          if (dismissedVersion !== version) {
            const timer = setTimeout(() => {
              setIsOpen(true)
            }, 600)
            return () => clearTimeout(timer)
          } else {
            setIsOpen(false)
          }
        } else {
          setIsOpen(false)
        }
      },
      (error) => {
        console.error("[PopupNotice] Firestore listener error:", error)
      }
    )

    // Admin panel preview event listener
    const handleAdminPreview = (event) => {
      if (event.detail) {
        setNotice(event.detail)
        setIsPreviewMode(true)
        setIsOpen(true)
      }
    }

    window.addEventListener("preview-vip-notice", handleAdminPreview)

    return () => {
      unsubscribe()
      window.removeEventListener("preview-vip-notice", handleAdminPreview)
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleDismiss])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  if (!isOpen || !notice) return null

  const isExternalUrl = notice.buttonLink && /^(https?:\/\/|t\.me\/|wa\.me\/|mailto:|tel:)/i.test(notice.buttonLink)
  const displayButtonText = notice.buttonText?.trim() || (notice.buttonLink ? "বিস্তারিত দেখুন →" : "")
  const hasButtonLink = Boolean(notice.buttonLink?.trim())

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-notice-title"
      >
        {/* Full-Screen Blurred Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        />

        {/* Center Obsidian-Gold Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-white backdrop-blur-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center z-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Radial Gold Glow from top */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-b from-amber-500/30 via-amber-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Amber Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

          {/* Top-Right Sleek Circular Glass Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-amber-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95 z-20 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            aria-label="Close Notice"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20 mb-4 select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span>{notice.badge || "SPECIAL NOTICE"}</span>
          </div>

          {/* Notice Title / Headline */}
          {notice.title && (
            <h2
              id="popup-notice-title"
              className="text-xl sm:text-2xl font-extrabold tracking-wide text-center bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent mb-3.5 leading-snug px-2"
            >
              {notice.title}
            </h2>
          )}

          {/* Notice Message / Details */}
          {notice.message && (
            <div className="w-full text-center px-1 sm:px-3 mb-6 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500/30 scrollbar-track-transparent">
              <p className="whitespace-pre-line text-slate-200 text-sm sm:text-base leading-relaxed font-normal selection:bg-amber-500/30 selection:text-white">
                {notice.message}
              </p>
            </div>
          )}

          {/* Bottom Action Button Area */}
          <div className="w-full mt-1 flex flex-col gap-2.5">
            {hasButtonLink ? (
              <a
                href={notice.buttonLink}
                target={isExternalUrl ? "_blank" : undefined}
                rel={isExternalUrl ? "noopener noreferrer" : undefined}
                onClick={handleCtaClick}
                className="group relative w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 active:scale-[0.98] select-none"
              >
                <span>{displayButtonText}</span>
                {isExternalUrl ? (
                  <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                ) : (
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                )}
              </a>
            ) : notice.buttonText?.trim() ? (
              <button
                onClick={handleDismiss}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/30 transition-all duration-200 active:scale-[0.98] select-none"
              >
                {notice.buttonText}
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="w-full py-3 px-5 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/40 transition-all active:scale-[0.98]"
              >
                বুঝতে পেরেছি (Got It)
              </button>
            )}

            {isPreviewMode && (
              <div className="text-[11px] text-amber-400/80 mt-1">
                ⚡ Admin Live Preview Mode (Closing will not save version to storage)
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
