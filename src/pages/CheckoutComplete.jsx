"use client"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Clock, Sparkles, ArrowRight, BookOpen, Loader2, ShieldCheck, Check, Lock, LifeBuoy } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function CheckoutComplete() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [purchasedCourses, setPurchasedCourses] = useState([])
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { replace: true })
      return
    }
    
    if (location.state?.courses) {
      setPurchasedCourses(location.state.courses)
    }
    
    const urlParams = new URLSearchParams(location.search)
    const transactionId = urlParams.get('transaction_id') || urlParams.get('transactionId')
    
    if (transactionId && !location.state?.courses) {
      processEnrollment(transactionId)
    }
  }, [currentUser, navigate, location])
  
  const processEnrollment = async (transactionId) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/process-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          userId: currentUser.uid
        })
      })
      const data = await response.json()
      if (data.success && data.payment?.metadata?.courses) {
        setPurchasedCourses(data.payment.metadata.courses)
      }
    } catch (error) {
      console.error("Error processing enrollment:", error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const steps = [
    { number: "01", title: "Payment Received", status: "completed", icon: Check },
    { number: "02", title: "Admin Verification", status: "active", icon: Clock },
    { number: "03", title: "Course Access", status: "locked", icon: Lock },
  ]
  
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-400">Processing your enrollment...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 py-6 sm:py-12 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container max-w-3xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          {/* Main Success Card */}
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[28px] p-5 sm:p-10 shadow-2xl relative overflow-hidden mb-6">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
            
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 relative z-10" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"
              >
                Payment Submitted Successfully
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400 text-[13px] sm:text-base max-w-md mx-auto"
              >
                Your payment is received and waiting for admin verification.
              </motion.p>
            </div>

            {/* Status Pending Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-8 relative overflow-hidden flex items-center gap-4"
            >
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 w-1/2 animate-[progress_2s_ease-in-out_infinite]" />
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 relative">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-400 text-[15px] sm:text-lg">Approval Pending</h3>
                <p className="text-amber-400/70 text-[11px] sm:text-xs font-medium">Usually verified within 24 hours</p>
              </div>
            </motion.div>

            {/* Stepper Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-10 relative"
            >
              <div className="absolute top-5 sm:top-6 left-8 right-8 h-0.5 bg-slate-800 z-0 hidden sm:block" />
              <div className="absolute top-5 sm:top-6 left-8 w-1/3 h-0.5 bg-emerald-500 z-0 hidden sm:block shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              
              <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-0 relative z-10">
                {steps.map((step, idx) => {
                  const isCompleted = step.status === "completed";
                  const isActive = step.status === "active";
                  const Icon = step.icon;
                  
                  return (
                    <div key={idx} className="flex sm:flex-col items-center gap-4 sm:gap-3 flex-1">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        isCompleted ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                        isActive ? "bg-amber-500 border border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]" :
                        "bg-slate-800/50 border border-slate-700 text-slate-500"
                      }`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left sm:text-center">
                        <p className={`font-bold text-[13px] sm:text-sm ${
                          isCompleted ? "text-emerald-400" :
                          isActive ? "text-white" :
                          "text-slate-500"
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Purchased Courses */}
            {purchasedCourses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider pl-1">Purchased Items</h3>
                <div className="space-y-3">
                  {purchasedCourses.map((course, idx) => (
                    <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700 flex-shrink-0 group-hover:border-indigo-500/50 transition-colors">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] sm:text-sm font-bold text-white line-clamp-1">{course.title || "Premium Course"}</h4>
                        <div className="inline-flex items-center gap-1.5 mt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] sm:text-xs text-emerald-400 font-medium tracking-wide">Premium Access</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* What Happens Next */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-10"
            >
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider pl-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                What Happens Next
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                  <span className="text-xs font-black text-slate-600 block mb-1">01</span>
                  <p className="text-[12px] sm:text-[13px] text-slate-300 font-medium leading-snug">Payment details are sent for review</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                  <span className="text-xs font-black text-slate-600 block mb-1">02</span>
                  <p className="text-[12px] sm:text-[13px] text-slate-300 font-medium leading-snug">Admin manually verifies your transaction</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                  <span className="text-xs font-black text-slate-600 block mb-1">03</span>
                  <p className="text-[12px] sm:text-[13px] text-slate-300 font-medium leading-snug">Courses are instantly unlocked upon approval</p>
                </div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col gap-3"
            >
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 text-[15px] sm:text-base group active:scale-[0.98]"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/my-courses")}
                className="w-full h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold transition-all border border-white/10 hover:border-white/20 flex items-center justify-center text-[14px] sm:text-[15px] active:scale-[0.98]"
              >
                View My Courses
              </button>
            </motion.div>
          </div>

          {/* Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-center gap-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-[13px] sm:text-sm text-slate-300 font-medium">Need help with your payment?</p>
            </div>
            <a
              href="mailto:allviphsc@gmail.com"
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-colors border border-slate-700"
            >
              Contact Support
            </a>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
