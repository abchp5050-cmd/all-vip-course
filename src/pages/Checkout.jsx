"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, ArrowLeft, ArrowRight, BookOpen, Copy, ShieldCheck, BadgeCheck, Lock, Phone, Loader2, CheckCircle2, Info, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { toast } from "../hooks/use-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [telegramId, setTelegramId] = useState("")
  const [telegramName, setTelegramName] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (userProfile?.name || currentUser?.displayName) {
      setCustomerName(userProfile?.name || currentUser?.displayName || "")
    }
  }, [userProfile, currentUser])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    const tempItem = localStorage.getItem("tempCheckoutItem")
    if (tempItem) {
      try {
        setCartItems(JSON.parse(tempItem))
      } catch (error) {
        console.error("Error loading checkout items:", error)
        navigate("/courses")
      }
    } else {
      navigate("/courses")
    }
  }, [currentUser, navigate])

  useEffect(() => {
    // Scroll to enrollment section on load with offset for fixed header
    const element = document.getElementById('enrollment-section');
    if (element) {
      setTimeout(() => {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);
  

  

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0)
  }

  const clearCart = () => {
    localStorage.removeItem("tempCheckoutItem")
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
    toast({
      title: "Copied!",
      description: "Number copied to clipboard.",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!phoneNumber.trim() || !customerName.trim() || !telegramName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields",
      })
      return
    }

    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid Bangladeshi phone number (e.g. 018XXXXXXXX)",
      })
      return
    }

    setLoading(true)

    try {
      const subtotal = getTotal()

      
      // Create payment record
      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        userName: customerName.trim(),
        userEmail: userProfile?.email || currentUser.email,
        phoneNumber: phoneNumber.trim(),
        telegramId: telegramId.trim(),
        telegramName: telegramName.trim() || "",
        courses: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price) || 0,
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: 0,
        finalAmount: parseFloat(subtotal.toFixed(2)),
        status: "pending",
        submittedAt: serverTimestamp(),
      })

      // Create PENDING enrollment for each course
      for (const course of cartItems) {
        await addDoc(collection(db, "enrollments"), {
          userId: currentUser.uid,
          courseId: course.id,
          status: "PENDING",
          paymentInfo: {
            phoneNumber: phoneNumber.trim(),
            amount: parseFloat(course.price) || 0,
            telegramId: telegramId.trim(),
            telegramName: telegramName.trim() || "",
            customerName: customerName.trim()
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          telegramJoinedAt: null
        })
      }

      clearCart()
      toast({
        variant: "success",
        title: "Payment Submitted!",
        description: "Your payment is pending admin approval. You'll get access once approved.",
      })
      
      navigate("/checkout-complete", {
        state: {
          phoneNumber: phoneNumber.trim(),
          amount: subtotal.toFixed(2),
          courses: cartItems
        }
      })
    } catch (error) {
      console.error("Error submitting payment:", error)
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit payment information. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const subtotal = getTotal()

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 py-4 lg:py-10 relative overflow-hidden font-sans">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* HEADER SECTION */}
        <div id="enrollment-section" className="mb-5 lg:mb-8 pt-2">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-amber-500 mb-4 transition-all hover:-translate-x-1 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 lg:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
                <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Enrollment</span>
                </h1>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mt-1.5 flex flex-col"
                >
                  <span className="text-[13px] lg:text-[15px] font-bold text-white leading-tight">
                    পেমেন্ট তথ্য পূরণ করুন
                  </span>
                  <span className="text-slate-400 max-w-xl text-[11px] lg:text-[13px] mt-0.5 leading-snug">
                    সঠিক তথ্য দিয়ে সাবমিট করুন এবং <span className="text-amber-500 font-medium">দ্রুত কোর্স অ্যাক্সেস পান</span>।
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 lg:space-y-6 pb-8">
          
          {/* 1. ORDER SUMMARY (TOP) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500" />
            
            <h2 className="text-base lg:text-xl font-bold text-white mb-3 lg:mb-5 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400" />
              Order Summary
            </h2>

            <div className="space-y-2.5 lg:space-y-3 mb-4 lg:mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 lg:gap-4 p-2.5 lg:p-4 rounded-xl lg:rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 flex-shrink-0">
                    <BookOpen className="w-4 h-4 lg:w-6 lg:h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-xs lg:text-sm font-bold text-white line-clamp-1 leading-tight">{item.title}</h3>
                    <p className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[9px] lg:text-xs text-amber-400 bg-amber-400/10 mt-1 font-medium border border-amber-400/20">Premium Access</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <span className="font-bold text-sm lg:text-lg text-white">৳{item.price || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 lg:pt-5">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] lg:text-sm text-slate-400 mb-0.5">Total Payable Amount</p>
                  <p className="text-[9px] lg:text-xs text-emerald-400 font-medium">One-time payment</p>
                </div>
                <span className="text-xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  ৳{subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* 2. PAYMENT METHODS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-xl"
          >
            <h2 className="text-base lg:text-xl font-bold text-white mb-1 lg:mb-2">Payment Methods</h2>
            <p className="text-[11px] lg:text-sm text-slate-400 mb-3 lg:mb-6">Send the total amount to any of these accounts.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-5">
              {/* bKash Card */}
              <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#E2136E]/10 to-transparent border border-[#E2136E]/30 p-3 lg:p-5 group hover:border-[#E2136E]/60 transition-all duration-300">
                <div className="absolute inset-0 bg-[#E2136E]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center gap-2.5 lg:gap-3 mb-2.5 lg:mb-4 z-10">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#E2136E] flex items-center justify-center shadow-md shrink-0">
                    <span className="text-white font-bold text-[8px] lg:text-[10px] tracking-wider">bKash</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs lg:text-sm leading-tight">✿ বিকাশ ✿</h3>
                    <p className="text-[9px] lg:text-[11px] text-[#E2136E] mt-0.5 font-medium tracking-wide">
                      (সেন্ড মানি/ক্যাশ ইন)
                    </p>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between bg-slate-950/60 p-2 lg:p-3 rounded-lg lg:rounded-xl border border-slate-800/80 z-10">
                  <span className="text-sm lg:text-lg font-mono font-bold text-white tracking-widest">01831952349</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy("01831952349")}
                    className="p-1.5 lg:p-2 bg-slate-800/80 hover:bg-[#E2136E] rounded-md lg:rounded-lg transition-colors group-hover:text-white"
                    title="Copy bKash Number"
                  >
                    {copied === "01831952349" ? <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                  </button>
                </div>
              </div>

              {/* Nagad Card */}
              <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#F7931E]/10 to-transparent border border-[#F7931E]/30 p-3 lg:p-5 group hover:border-[#F7931E]/60 transition-all duration-300">
                <div className="absolute inset-0 bg-[#F7931E]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center gap-2.5 lg:gap-3 mb-2.5 lg:mb-4 z-10">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#F7931E] flex items-center justify-center shadow-md shrink-0">
                    <span className="text-white font-bold text-[8px] lg:text-[10px] tracking-wider">Nagad</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs lg:text-sm leading-tight">✿ নগদ ✿</h3>
                    <p className="text-[9px] lg:text-[11px] text-[#F7931E] mt-0.5 font-medium tracking-wide">
                      (সেন্ড মানি/ক্যাশ ইন)
                    </p>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between bg-slate-950/60 p-2 lg:p-3 rounded-lg lg:rounded-xl border border-slate-800/80 z-10">
                  <span className="text-sm lg:text-lg font-mono font-bold text-white tracking-widest">01815307903</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy("01815307903")}
                    className="p-1.5 lg:p-2 bg-slate-800/80 hover:bg-[#F7931E] rounded-md lg:rounded-lg transition-colors group-hover:text-white"
                    title="Copy Nagad Number"
                  >
                    {copied === "01815307903" ? <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. PAYMENT DETAILS FORM */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-xl"
          >
            <h2 className="text-base lg:text-xl font-bold text-white mb-1 lg:mb-2">Payment Details</h2>
            <p className="text-[11px] lg:text-sm text-slate-400 mb-4 lg:mb-8">Fill in your information carefully after completing the payment.</p>
            
            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ariful Islam"
                    required
                    className="w-full h-12 px-3 lg:px-4 bg-slate-950/50 border border-slate-700/50 rounded-xl lg:rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Sender Phone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 lg:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                      className="w-full h-12 pl-9 lg:pl-10 pr-3 lg:pr-4 bg-slate-950/50 border border-slate-700/50 rounded-xl lg:rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
                    />
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-start gap-1.5 pt-0.5"
                  >
                    <Info className="w-3 h-3 text-amber-500 shrink-0 mt-[2px]" />
                    <p className="text-[9px] lg:text-[10px] text-slate-400 leading-snug">
                      যে bKash/Nagad নম্বর থেকে পেমেন্ট করেছেন, সেই নম্বরটি সঠিকভাবে লিখুন। ভুল তথ্য দিলে <span className="text-amber-500 font-medium">Payment Approval</span> দেওয়া সম্ভব হবে না।
                    </p>
                  </motion.div>
                </div>

                {/* Telegram Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Telegram Username <span className="text-slate-500 normal-case font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="@yourusername"
                    className="w-full h-12 px-3 lg:px-4 bg-slate-950/50 border border-slate-700/50 rounded-xl lg:rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
                  />
                </div>

                {/* Telegram ID Name */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Telegram ID Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 lg:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={telegramName}
                      onChange={(e) => setTelegramName(e.target.value)}
                      placeholder="Enter your Telegram name"
                      required
                      className="w-full h-12 pl-9 lg:pl-10 pr-3 lg:pr-4 bg-slate-950/50 border border-slate-700/50 rounded-xl lg:rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm"
                    />
                  </div>
                </motion.div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-[1px] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <div className="relative h-12 lg:h-14 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin text-white" />
                        <span className="font-bold text-white text-[13px] lg:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-white text-[13px] lg:text-base">Submit Payment</span>
                        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
                <p className="text-[10px] lg:text-xs text-center text-slate-500 mt-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 leading-snug">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Your information is secure and encrypted.</span>
                  <span className="hidden sm:inline"> Access granted post-verification.</span>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
