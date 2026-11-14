"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BellRing,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  ExternalLink,
  ArrowRight,
  X,
  Send,
  Loader2,
  RefreshCw
} from "lucide-react"
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"
import { db } from "../../lib/firebase"

const BADGE_PRESETS = [
  "SPECIAL NOTICE",
  "HOT OFFER 🔥",
  "COMBO DEAL ⚡",
  "ADMISSION OPEN 🎓",
  "IMPORTANT UPDATE 📢",
  "VIP DISCOUNT 🎁",
]

export default function ManagePopupNotice() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [notice, setNotice] = useState({
    enabled: true,
    badge: "SPECIAL NOTICE",
    title: "",
    message: "",
    buttonText: "",
    buttonLink: "",
    updatedAt: null,
  })

  // Real-time listener for Firestore document
  useEffect(() => {
    const docRef = doc(db, "settings", "popup_notice")
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setNotice({
            enabled: data.enabled !== false,
            badge: data.badge || "SPECIAL NOTICE",
            title: data.title || "",
            message: data.message || "",
            buttonText: data.buttonText || "",
            buttonLink: data.buttonLink || "",
            updatedAt: data.updatedAt || null,
          })
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error listening to popup notice:", error)
        setErrorMessage("Failed to load popup notice data: " + error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Save changes to Firestore
  const handleSave = async (overrides = {}) => {
    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const updatedData = {
        type: "popup_notice",
        enabled: overrides.enabled !== undefined ? overrides.enabled : notice.enabled,
        badge: (overrides.badge !== undefined ? overrides.badge : notice.badge).trim() || "SPECIAL NOTICE",
        title: (overrides.title !== undefined ? overrides.title : notice.title).trim(),
        message: (overrides.message !== undefined ? overrides.message : notice.message).trim(),
        buttonText: (overrides.buttonText !== undefined ? overrides.buttonText : notice.buttonText).trim(),
        buttonLink: (overrides.buttonLink !== undefined ? overrides.buttonLink : notice.buttonLink).trim(),
        updatedAt: Date.now(), // Version stamp ensures all users see the update immediately
      }

      await setDoc(doc(db, "settings", "popup_notice"), updatedData, { merge: true })
      setNotice(updatedData)
      setSuccessMessage("Popup notice saved and published successfully!")
      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (err) {
      console.error("Error saving notice:", err)
      setErrorMessage("Failed to save notice: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Quick 1-click toggle ON/OFF
  const handleToggle = async () => {
    const nextState = !notice.enabled
    setNotice((prev) => ({ ...prev, enabled: nextState }))
    await handleSave({ enabled: nextState })
  }

  // Clear / Reset notice
  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear the notice content and disable the popup?")) {
      return
    }
    const emptyNotice = {
      enabled: false,
      badge: "SPECIAL NOTICE",
      title: "",
      message: "",
      buttonText: "",
      buttonLink: "",
    }
    setNotice(emptyNotice)
    await handleSave(emptyNotice)
  }

  // Trigger live modal on the screen for testing
  const handlePreviewOnScreen = () => {
    const previewData = {
      enabled: true,
      badge: notice.badge || "SPECIAL NOTICE",
      title: notice.title || "HSC 26 & 27 SPECIAL COMBO OFFER!",
      message:
        notice.message ||
        "সকল বিষয়ের সাইকেল এখন মাত্র ৫০০ টাকায়! অফারটি সীমিত সময়ের জন্য প্রযোজ্য।\nযেকোনো তথ্যের জন্য টেলিগ্রামে যোগাযোগ করুন: @Newvip69_bot",
      buttonText: notice.buttonText,
      buttonLink: notice.buttonLink || "https://t.me/Newvip69_bot",
      updatedAt: Date.now(),
    }
    window.dispatchEvent(new CustomEvent("preview-vip-notice", { detail: previewData }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Popup Notice configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 shrink-0">
            <BellRing className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Popup Notice Manager
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-300">
                VIP Live Modal
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Live center-screen dark-gold announcement modal. Synced real-time with both Web & Telegram VIP Bot.
            </p>
          </div>
        </div>

        {/* Live Status Toggle in Header */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl shrink-0 relative z-10">
          <span
            className={`w-3 h-3 rounded-full ${
              notice.enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-xs font-semibold text-slate-200">
            {notice.enabled ? "Live on Website" : "Popup Disabled"}
          </span>
          <button
            onClick={handleToggle}
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              notice.enabled ? "bg-amber-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notice.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Alerts */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-medium"
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Notice Content & Settings
            </h2>

            {/* Master Toggle Bar inside Card */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Enable Popup Modal
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When enabled, all visitors see this notice once per version (~600ms after load).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notice.enabled}
                  onChange={(e) => setNotice({ ...notice, enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Badge Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Top Pill Badge Text (Optional)
              </label>
              <input
                type="text"
                value={notice.badge}
                onChange={(e) => setNotice({ ...notice, badge: e.target.value })}
                placeholder="e.g. SPECIAL NOTICE, HOT OFFER 🔥, VIP COMBO"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {/* Quick Preset Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {BADGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNotice({ ...notice, badge: preset })}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                      notice.badge === preset
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-500/30"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Headline / Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Headline / Title *
              </label>
              <input
                type="text"
                value={notice.title}
                onChange={(e) => setNotice({ ...notice, title: e.target.value })}
                placeholder="e.g. HSC 26 & 27 SPECIAL COMBO OFFER!"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Message / Multiline Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Notice Body / Message (Supports Multiline, Emojis & Contact Info) *
              </label>
              <textarea
                rows={5}
                value={notice.message}
                onChange={(e) => setNotice({ ...notice, message: e.target.value })}
                placeholder={`e.g.\nসকল সাইকেল কম্বোতে ৫০% স্পেশাল ডিসকাউন্ট চলছে!\nঅফার পেতে টেলিগ্রাম বা হোয়াটসঅ্যাপে যোগাযোগ করুন:\n• Telegram: @Newvip69_bot\n• WhatsApp: +8801969752197`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed font-sans"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Line breaks are preserved cleanly on both mobile and desktop screens.
              </p>
            </div>

            {/* Button Settings (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Button Text (Optional)
                </label>
                <input
                  type="text"
                  value={notice.buttonText}
                  onChange={(e) => setNotice({ ...notice, buttonText: e.target.value })}
                  placeholder="e.g. অফারটি নিন / বিস্তারিত দেখুন"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Button Link / URL (Optional)
                </label>
                <input
                  type="text"
                  value={notice.buttonLink}
                  onChange={(e) => setNotice({ ...notice, buttonLink: e.target.value })}
                  placeholder="e.g. https://t.me/Newvip69_bot or /courses"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Clear Notice
                </button>
                <button
                  type="button"
                  onClick={handlePreviewOnScreen}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Test on Screen
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Publish Notice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Telegram VIP Bot Quick Guide Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-300 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Send className="w-4 h-4" />
              <span>Telegram VIP Bot Remote Control</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              You can also control this notice directly from Telegram without opening this dashboard. Any changes made in Telegram reflect immediately here and on the live site!
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
              <div className="text-amber-300 font-semibold">• Instant ON/OFF:</div>
              <div className="text-slate-400 pl-3"><code>/notice on</code> &bull; <code>/notice off</code></div>
              <div className="text-amber-300 font-semibold">• Post with Link & Button:</div>
              <div className="text-slate-400 pl-3"><code>/notice Title | Message | ButtonText | Link</code></div>
              <div className="text-amber-300 font-semibold">• Text only:</div>
              <div className="text-slate-400 pl-3"><code>/notice Title | Message</code></div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Glassmorphic Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-500" />
              Live Screen Preview
            </span>
            <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
              Real-Time
            </span>
          </div>

          {/* Glassmorphic Simulation Container */}
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center text-center">
            {/* Background Backdrop Blur Pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Modal Card Preview */}
            <div className="relative w-full rounded-2xl bg-slate-900/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-white p-6 flex flex-col items-center text-center overflow-hidden">
              {/* Radial Top Glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-28 bg-gradient-to-b from-amber-500/30 via-amber-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

              {/* Close Button Preview */}
              <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400">
                <X className="w-3.5 h-3.5" />
              </div>

              {/* Top Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20 mb-3">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                <span>{notice.badge || "SPECIAL NOTICE"}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-center bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent mb-2.5 leading-snug">
                {notice.title || "HSC 26 & 27 SPECIAL COMBO OFFER!"}
              </h3>

              {/* Message */}
              <p className="whitespace-pre-line text-slate-200 text-xs sm:text-sm leading-relaxed font-normal mb-5 max-h-48 overflow-y-auto">
                {notice.message ||
                  "সকল বিষয়ের সাইকেল এখন মাত্র ৫০০ টাকায়! অফারটি সীমিত সময়ের জন্য প্রযোজ্য। দ্রুত এনরোল করুন।"}
              </p>

              {/* Action Button Preview */}
              <div className="w-full">
                {notice.buttonLink?.trim() ? (
                  <div className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-md shadow-amber-500/20">
                    <span>{notice.buttonText?.trim() || "বিস্তারিত দেখুন →"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                ) : notice.buttonText?.trim() ? (
                  <div className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-md shadow-amber-500/20">
                    {notice.buttonText}
                  </div>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/60">
                    বুঝতে পেরেছি (Got It)
                  </div>
                )}
              </div>
            </div>

            {/* Note below preview */}
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              This is a live visual simulation of how the modal appears over the dark blurred website background.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
