"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronDown, 
  HelpCircle, 
  Sparkles, 
  MessageSquare, 
  Send, 
  CheckCircle2,
  Headset,
  ArrowRight
} from "lucide-react"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "../lib/firebase"

export const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "পেমেন্ট করার কতক্ষণ পর কোর্সের অ্যাক্সেস ও টেলিগ্রাম গ্রুপ লিংক পাব?",
    answer: "পেমেন্ট সম্পন্ন করে অর্ডার সাবমিট করার সাথে সাথে আমাদের টিম ভেরিফাই করে দ্রুত আপনার অর্ডার Approve করে দেবে। Approve হওয়া মাত্রই ওয়েবসাইটের \"My Courses\" পেজে আপনার প্রাইভেট টেলিগ্রাম গ্রুপ ও চ্যানেলের জয়েন বাটন আনলক হয়ে যাবে।",
    order: 0,
  },
  {
    id: "faq-2",
    question: "কোর্সের মেয়াদ কতদিন থাকবে? (Course Validity)",
    answer: "আমাদের যেকোনো কোর্সে একবার এনরোল করলে সেটির মেয়াদ আজীবন (Lifetime Access) থাকবে! আপনি আপনার সুবিধামতো যেকোনো সময় সব ক্লাস, ভিডিও এবং লেকচার শিট আনলিমিটেড বার দেখতে ও ডাউনলোড করতে পারবেন।",
    order: 1,
  },
  {
    id: "faq-3",
    question: "টেলিগ্রাম প্রাইভেট গ্রুপ বা চ্যানেলে জয়েন করার নিয়ম কী?",
    answer: "প্রথমে আপনার ফোনে বা পিসিতে Telegram অ্যাপটি ইনস্টল ও লগইন করা থাকতে হবে। এরপর ওয়েবসাইটের \"My Courses\" সেকশনে গিয়ে আপনার কেনা কোর্সের নিচে থাকা বাটনে ক্লিক করলেই সরাসরি প্রাইভেট গ্রুপে জয়েন হয়ে যাবেন।",
    order: 2,
  },
  {
    id: "faq-4",
    question: "কোর্সের ক্লাস, ভিডিও এবং লেকচার শিটগুলো কীভাবে সাজানো থাকে?",
    answer: "আমাদের প্রতিটি প্রাইভেট টেলিগ্রাম চ্যানেলে অধ্যায় ও টপিক অনুযায়ী (Cycle / Chapter wise) সব রেকর্ডেড এইচডি ক্লাস, লেকচার পিডিএফ (PDF) এবং প্র্যাকটিস শিট পিন (Pin) করে খুব সুন্দরভাবে সাজানো থাকে—যাতে আপনি যেকোনো সময় সিরিয়ালি ক্লাস করতে পারেন।",
    order: 3,
  },
  {
    id: "faq-5",
    question: "আমি কীভাবে পেমেন্ট করব এবং প্রোমো কোড (Promo Code) কীভাবে ব্যবহার করব?",
    answer: "আপনার পছন্দের কোর্সের \"Buy Now\" বাটনে ক্লিক করে চেকআউট পেজে যান। সেখানে দেওয়া বিকাশ (bKash) বা নগদ (Nagad) নাম্বারে Send Money করে আপনার নাম্বার ও তথ্য দিয়ে ফর্মটি সাবমিট করুন। কোনো ডিসকাউন্ট কোড থাকলে \"Have a Promo Code?\" বক্সে লিখে Apply করলেই সাথে সাথে ছাড় পেয়ে যাবেন।",
    order: 4,
  },
]

export default function HomeFAQ() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS)
  const [openId, setOpenId] = useState("faq-1") // First FAQ open by default for rich visual
  const [faqConfig, setFaqConfig] = useState({
    enabled: true,
    badgeText: "✨ FAQ / সাধারণ জিজ্ঞাসা",
    title: "সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ",
    subtitle: "কোর্স কেনা, পেমেন্ট ও টেলিগ্রাম গ্রুপ অ্যাক্সেস সংক্রান্ত সকল প্রশ্নের তাত্ক্ষণিক সমাধান।",
    supportUrl: "https://t.me/allvipcourses"
  })

  useEffect(() => {
    try {
      const q = query(collection(db, "settings"), where("type", "==", "faqs"))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data()
            if (data.enabled === false) {
              setFaqConfig(prev => ({ ...prev, enabled: false }))
              return
            }
            if (Array.isArray(data.items) && data.items.length > 0) {
              const sorted = [...data.items].sort((a, b) => (a.order || 0) - (b.order || 0))
              setFaqs(sorted)
              if (!openId && sorted.length > 0) {
                setOpenId(sorted[0].id)
              }
            }
            setFaqConfig(prev => ({
              ...prev,
              enabled: data.enabled !== false,
              badgeText: data.badgeText || prev.badgeText,
              title: data.title || prev.title,
              subtitle: data.subtitle || prev.subtitle,
              supportUrl: data.supportUrl || prev.supportUrl
            }))
          }
        },
        (error) => {
          console.warn("[HomeFAQ] Firestore load error, falling back to defaults:", error.message)
        }
      )

      return () => unsubscribe()
    } catch (e) {
      console.warn("[HomeFAQ] Setup error:", e)
    }
  }, [])

  if (faqConfig.enabled === false) {
    return null
  }

  const toggleFAQ = (id) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <section className="relative py-12 sm:py-20 px-4 overflow-hidden bg-[#070b14] text-slate-200">
      {/* Ambient luxury spotlight glows behind FAQ */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent blur-[140px] pointer-events-none -z-0" 
      />
      <div 
        className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-blue-600/5 blur-[120px] pointer-events-none -z-0" 
      />

      <div className="container max-w-4xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          {/* Animated glowing gold badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{faqConfig.badgeText}</span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 font-bengali leading-tight mb-3"
          >
            {faqConfig.title}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-bengali leading-relaxed"
          >
            {faqConfig.subtitle}
          </motion.p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 sm:space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id
            const itemNumber = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`

            return (
              <motion.div
                key={faq.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className={`group relative rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-slate-900/90 border-amber-500/50 shadow-[0_8px_32px_rgba(245,158,11,0.14)]"
                    : "bg-slate-900/50 hover:bg-slate-900/70 border-slate-800/80 hover:border-amber-500/35 shadow-sm"
                } border backdrop-blur-xl hover:-translate-y-0.5`}
              >
                {/* Left active glowing indicator strip */}
                {isOpen && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-500" />
                )}

                {/* FAQ Question Header Button */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 text-left transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Number Badge */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs sm:text-[13px] transition-all duration-300 ${
                        isOpen
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:bg-amber-500/15 group-hover:border-amber-500/35"
                      }`}
                    >
                      {itemNumber}
                    </div>

                    {/* Question Title */}
                    <h3
                      className={`text-xs sm:text-sm md:text-[15px] font-bold font-bengali leading-snug transition-colors duration-200 ${
                        isOpen
                          ? "text-white"
                          : "text-slate-200 group-hover:text-amber-300"
                      }`}
                    >
                      {faq.question}
                    </h3>
                  </div>

                  {/* Rotating Chevron / Plus Icon */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  </div>
                </button>

                {/* FAQ Answer with smooth spring-like height/opacity animation */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        transition: {
                          duration: 0.35,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        transition: {
                          duration: 0.25,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-800/60 mt-0.5">
                        <div className="pl-10 sm:pl-12 text-xs sm:text-sm text-slate-300 font-bengali leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Support Callout Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/60 border border-amber-500/25 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-black/40"
        >
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white font-bengali">
                আরও কিছু জানার আছে কি? (Need More Help?)
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bengali mt-0.5">
                আমাদের ২৪/৭ হেল্পলাইন টেলিগ্রামে সরাসরি মেসেজ করুন, আমরা দ্রুত সমাধান দেব।
              </p>
            </div>
          </div>

          <a
            href={faqConfig.supportUrl || "https://t.me/allvipcourses"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-amber-500/25 transition-all active:scale-95 shrink-0 hover:-translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>টেলিগ্রাম সাপোর্টে নক দিন</span>
          </a>
        </motion.div>

      </div>
    </section>
  )
}
