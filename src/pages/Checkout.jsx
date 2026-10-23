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
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentMethodError, setPaymentMethodError] = useState(false)
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
    
    if (!paymentMethod) {
      setPaymentMethodError(true)
      toast({
        variant: "destructive",
        title: "অনুগ্রহ করে পেমেন্ট মাধ্যম নির্বাচন করুন।",
      })
      return
    }

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
      const paymentDocRef = await addDoc(collection(db, "payments"), {
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
          status: "pending",
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
          paymentId: paymentDocRef.id,
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

      // Send Telegram notification (failsafe, runs in background without blocking user)
      try {
        fetch("/api/send-order-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            course_name: cartItems.map((c) => c.title).join(", "),
            student_name: customerName.trim(),
            payment_number: phoneNumber.trim(),
            payment_method: paymentMethod || "bKash",
            telegram_id_name: telegramName.trim(),
            telegram_username: telegramId.trim() || "Not provided",
            amount: `৳${subtotal.toFixed(2)}`,
            date_time: new Date().toLocaleString("en-US", {
              timeZone: "Asia/Dhaka",
              dateStyle: "medium",
              timeStyle: "short",
            }),
          }),
        }).catch((err) => {
          console.error("Telegram notification delivery error:", err);
        });
      } catch (err) {
        console.error("Failed to send Telegram notification:", err);
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
        <div id="enrollment-section" className="mb-3 lg:mb-5 pt-2">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-amber-500 mb-3 transition-all hover:-translate-x-1 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            কোর্সে ফিরে যান
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-extrabold tracking-tight text-white leading-tight">
                  আপনার কোর্স অর্ডার <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">সম্পন্ন করুন</span>
                </h1>
                <span className="text-slate-400 text-[11px] lg:text-[13px] mt-0.5 leading-snug block">
                  সঠিক তথ্য দিয়ে সাবমিট করুন এবং <span className="text-amber-500 font-medium">দ্রুত কোর্স অ্যাক্সেস পান</span>।
                </span>
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
              {cartItems.map((item) => {
                const itemImage = item.thumbnailURL || item.imageURL || item.image || item.coverImage
                return (
                  <div key={item.id} className="flex items-center gap-3 lg:gap-4 p-2.5 lg:p-3.5 rounded-xl lg:rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                    {/* Course Thumbnail: 65x50px with rounded corners and object-cover */}
                    <div className="w-[65px] h-[50px] min-w-[65px] max-w-[65px] rounded-lg lg:rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 flex-shrink-0 overflow-hidden relative shadow-sm">
                      {itemImage ? (
                        <img 
                          src={itemImage} 
                          alt={item.title} 
                          loading="eager"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = "flex"
                            }
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full items-center justify-center ${itemImage ? "hidden" : "flex"}`}>
                        <BookOpen className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-xs lg:text-sm font-bold text-white line-clamp-1 leading-tight">{item.title}</h3>
                      <p className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[9px] lg:text-xs text-amber-400 bg-amber-400/10 mt-1 font-medium border border-amber-400/20">Premium Access</p>
                    </div>

                    <div className="flex-shrink-0 flex items-center">
                      <span className="font-bold text-sm lg:text-lg text-white">৳{item.price || 0}</span>
                    </div>
                  </div>
                )
              })}
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
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-xl"
          >
            <h2 className="text-base lg:text-lg font-bold text-white mb-0.5">পেমেন্ট মাধ্যম নির্বাচন করুন</h2>
            <p className="text-[11px] lg:text-[13px] text-slate-400 mb-3">কোন মাধ্যমে টাকা পাঠাবেন সেটি সিলেক্ট করুন।</p>

            {/* Selection Buttons — always visible */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {/* bKash Select Button */}
              <button
                type="button"
                onClick={() => { setPaymentMethod("bKash"); if (paymentMethodError) setPaymentMethodError(false) }}
                className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                  paymentMethod === "bKash"
                    ? "bg-[#E2136E]/12 border-[#E2136E]/80 shadow-[0_0_16px_rgba(226,19,110,0.3)] ring-1 ring-[#E2136E]/30"
                    : paymentMethodError
                    ? "bg-slate-950/50 border-red-500/50 hover:border-[#E2136E]/50"
                    : "bg-slate-950/40 border-slate-700/60 hover:border-[#E2136E]/50 hover:bg-[#E2136E]/5"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-white p-1 border flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
                  paymentMethod === "bKash"
                    ? "border-[#E2136E]/60 shadow-[0_0_10px_rgba(226,19,110,0.3)]"
                    : "border-[#E2136E]/30"
                }`}>
                  <img
                    src="/bkash.jpg"
                    alt="bKash"
                    loading="eager"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = "flex"
                      }
                    }}
                  />
                  <div className="hidden w-full h-full bg-[#E2136E] rounded-lg items-center justify-center">
                    <span className="text-white font-bold text-[8px]">bKash</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[16px] font-semibold leading-tight ${paymentMethod === "bKash" ? "text-white" : "text-slate-300"}`}>বিকাশ</p>
                  <p className="text-[9px] text-[#E2136E] font-medium mt-0.5 tracking-wide">(সেন্ড মানি/ক্যাশ ইন)</p>
                </div>
                {paymentMethod === "bKash" && (
                  <CheckCircle2 className="w-4 h-4 text-[#E2136E] shrink-0" />
                )}
              </button>

              {/* Nagad Select Button */}
              <button
                type="button"
                onClick={() => { setPaymentMethod("Nagad"); if (paymentMethodError) setPaymentMethodError(false) }}
                className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                  paymentMethod === "Nagad"
                    ? "bg-[#F7931E]/12 border-[#F7931E]/80 shadow-[0_0_16px_rgba(247,147,30,0.3)] ring-1 ring-[#F7931E]/30"
                    : paymentMethodError
                    ? "bg-slate-950/50 border-red-500/50 hover:border-[#F7931E]/50"
                    : "bg-slate-950/40 border-slate-700/60 hover:border-[#F7931E]/50 hover:bg-[#F7931E]/5"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-white p-1 border flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
                  paymentMethod === "Nagad"
                    ? "border-[#F7931E]/60 shadow-[0_0_10px_rgba(247,147,30,0.3)]"
                    : "border-[#F7931E]/30"
                }`}>
                  <img
                    src="/nagad.jpg"
                    alt="Nagad"
                    loading="eager"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = "flex"
                      }
                    }}
                  />
                  <div className="hidden w-full h-full bg-[#F7931E] rounded-lg items-center justify-center">
                    <span className="text-white font-bold text-[8px]">Nagad</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[16px] font-semibold leading-tight ${paymentMethod === "Nagad" ? "text-white" : "text-slate-300"}`}>নগদ</p>
                  <p className="text-[9px] text-[#F7931E] font-medium mt-0.5 tracking-wide">(সেন্ড মানি/ক্যাশ ইন)</p>
                </div>
                {paymentMethod === "Nagad" && (
                  <CheckCircle2 className="w-4 h-4 text-[#F7931E] shrink-0" />
                )}
              </button>
            </div>

            {/* Revealed payment number — shown ONLY after selection */}
            {paymentMethod === "bKash" && (
              <motion.div
                key="bkash-number"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-[#E2136E]/40 bg-[#E2136E]/5 p-3"
              >
                <p className="text-[10px] text-[#E2136E] font-semibold mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E2136E]" />
                  বিকাশ নম্বরে টাকা পাঠান
                </p>
                <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2.5 rounded-lg border border-[#E2136E]/25">
                  <span className="text-base font-mono font-bold text-white tracking-widest">01831952349</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("01831952349")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      copied === "01831952349"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#E2136E] hover:bg-[#c4105f] text-white"
                    }`}
                  >
                    {copied === "01831952349" ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> কপি হয়েছে</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> কপি করুন</>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  এই নম্বরে টাকা পাঠিয়ে নিচে পেমেন্টের তথ্য দিন।
                </p>
              </motion.div>
            )}

            {paymentMethod === "Nagad" && (
              <motion.div
                key="nagad-number"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-[#F7931E]/40 bg-[#F7931E]/5 p-3"
              >
                <p className="text-[10px] text-[#F7931E] font-semibold mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F7931E]" />
                  নগদ নম্বরে টাকা পাঠান
                </p>
                <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2.5 rounded-lg border border-[#F7931E]/25">
                  <span className="text-base font-mono font-bold text-white tracking-widest">01815307903</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("01815307903")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      copied === "01815307903"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#F7931E] hover:bg-[#d97c12] text-white"
                    }`}
                  >
                    {copied === "01815307903" ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> কপি হয়েছে</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> কপি করুন</>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  এই নম্বরে টাকা পাঠিয়ে নিচে পেমেন্টের তথ্য দিন।
                </p>
              </motion.div>
            )}

            {/* Prompt when nothing selected yet */}
            {!paymentMethod && (
              <div className="flex items-center gap-1.5 pt-0.5 text-amber-400/90 text-[11px] sm:text-[12px] font-medium leading-snug">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>উপরে একটি পেমেন্ট মাধ্যম সিলেক্ট করুন — তারপর নম্বর দেখাবে।</span>
              </div>
            )}

            {/* Validation error */}
            {paymentMethodError && (
              <div className="mt-2 flex items-center gap-1.5 text-red-400 text-[11px] font-medium">
                <Info className="w-3 h-3 shrink-0" />
                অনুগ্রহ করে পেমেন্ট মাধ্যম সিলেক্ট করুন।
              </div>
            )}
          </motion.div>

          {/* 3. PAYMENT DETAILS FORM */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-xl"
          >
            <h2 className="text-base lg:text-lg font-bold text-white mb-0.5">পেমেন্টের তথ্য লিখুন</h2>
            <p className="text-[11px] lg:text-[13px] text-slate-400 mb-3">পেমেন্ট করার পরে নিচের তথ্যগুলো সঠিকভাবে পূরণ করুন।</p>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    আপনার নাম <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ariful Islam"
                    required
                    className="w-full h-11 px-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Sender Phone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                      className="w-full h-11 pl-9 pr-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
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
                    className="w-full h-11 px-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
                  />
                </div>

                {/* Telegram ID Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Telegram ID Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={telegramName}
                      onChange={(e) => setTelegramName(e.target.value)}
                      placeholder="Enter your Telegram name"
                      required
                      className="w-full h-11 pl-9 pr-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-[1px] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <div className="relative h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin text-white" />
                        <span className="font-bold text-white text-[13px] lg:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-white text-[13px] lg:text-base">পেমেন্টের তথ্য জমা দিন</span>
                        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
