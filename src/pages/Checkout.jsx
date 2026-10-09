"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, ArrowLeft, BookOpen, Copy, ShieldCheck, BadgeCheck, Lock, Phone, Loader2, CheckCircle2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { toast } from "../hooks/use-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentInstructions, setPaymentInstructions] = useState("")
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [telegramId, setTelegramId] = useState("")
  const [telegramLink, setTelegramLink] = useState("")
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

  
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const paymentSettingsRef = query(collection(db, "settings"), where("type", "==", "payment"))
        const snapshot = await getDocs(paymentSettingsRef)
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data()
          setPaymentInstructions(data.instructions || "")
          // Filter to only active methods
          const activeMethods = (data.methods || []).filter(m => m.isActive)
          
          if (activeMethods.length === 0) {
            // Fallback if none configured
            setPaymentMethods([
              { id: "1", provider: "bKash", number: "01831952349", type: "Personal" },
              { id: "2", provider: "Nagad", number: "01831952349", type: "Personal" }
            ])
          } else {
            setPaymentMethods(activeMethods)
          }
        } else {
          // Fallback if no doc exists
          setPaymentMethods([
            { id: "1", provider: "bKash", number: "01831952349", type: "Personal" },
            { id: "2", provider: "Nagad", number: "01831952349", type: "Personal" }
          ])
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error)
        // Fallback
        setPaymentMethods([
          { id: "1", provider: "bKash", number: "01831952349", type: "Personal" },
          { id: "2", provider: "Nagad", number: "01831952349", type: "Personal" }
        ])
      }
    }
    fetchPaymentSettings()
  }, [])

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
    
    if (!phoneNumber.trim() || !customerName.trim() || !telegramId.trim()) {
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
        telegramLink: telegramLink.trim() || "",
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
            telegramLink: telegramLink.trim() || "",
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

  const getProviderTheme = (provider) => {
    const p = provider?.toLowerCase() || ''
    if (p.includes('bkash')) return { bg: '#E2136E', text: 'text-white', border: 'border-[#E2136E]', name: 'বিকাশ' }
    if (p.includes('nagad')) return { bg: '#F7931E', text: 'text-white', border: 'border-[#F7931E]', name: 'নগদ' }
    if (p.includes('rocket')) return { bg: '#8C1590', text: 'text-white', border: 'border-[#8C1590]', name: 'রকেট' }
    if (p.includes('upay')) return { bg: '#FDE300', text: 'text-black', border: 'border-[#FDE300]', name: 'উপায়' }
    return { bg: '#3b82f6', text: 'text-white', border: 'border-blue-500', name: provider }
  }

  const subtotal = getTotal()

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 py-6 lg:py-16 relative overflow-hidden font-sans">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto px-5 lg:px-8 relative z-10">
        
        {/* HEADER SECTION */}
        <div id="enrollment-section" className="mb-8 lg:mb-10 pt-4">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-500 mb-6 transition-all hover:-translate-x-1 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-start lg:items-center gap-3">
              <div className="p-2.5 lg:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0 mt-0.5 lg:mt-0">
                <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Enrollment</span>
                </h1>
                <p className="text-slate-400 max-w-xl text-[13px] lg:text-base mt-2 lg:mt-1.5 leading-relaxed">
                  Submit your payment details securely to get instant access to your premium course materials.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: ORDER SUMMARY (Sticky) */}
          <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 lg:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500" />
              
              <h2 className="text-lg lg:text-xl font-bold text-white mb-5 lg:mb-6 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                Order Summary
              </h2>

              <div className="space-y-3 lg:space-y-4 mb-5 lg:mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 flex-shrink-0">
                      <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-xs lg:text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                      <p className="text-[11px] lg:text-xs text-amber-400 mt-0.5 lg:mt-1 font-medium">Premium Access</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <span className="font-bold text-base lg:text-lg text-white">৳{item.price || 0}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 lg:p-5 rounded-2xl bg-blue-950/20 border border-blue-900/30 mb-5 lg:mb-6">
                <div className="flex items-center gap-2 lg:gap-3 mb-2">
                  <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                  <span className="text-xs lg:text-sm font-medium text-blue-100">What you get:</span>
                </div>
                <ul className="space-y-1.5 lg:space-y-2 text-[11px] lg:text-xs text-slate-300 ml-6 lg:ml-8 list-disc">
                  <li>Instant access after payment approval</li>
                  <li>Premium class materials & PDFs</li>
                  <li>Dedicated student support & guidance</li>
                </ul>
              </div>

              <div className="border-t border-slate-800 pt-5 lg:pt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs lg:text-sm text-slate-400 mb-0.5 lg:mb-1">Total Payable Amount</p>
                    <p className="text-[10px] lg:text-xs text-emerald-400 font-medium">One-time payment</p>
                  </div>
                  <span className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    ৳{subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                <Lock className="w-8 h-8 text-slate-400" />
                <div className="text-xs">
                  <p className="text-white font-bold mb-0.5">Secure</p>
                  <p className="text-slate-500">256-bit Encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                <BadgeCheck className="w-8 h-8 text-amber-500" />
                <div className="text-xs">
                  <p className="text-white font-bold mb-0.5">Verified</p>
                  <p className="text-slate-500">Manual Approval</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: PAYMENT INFO */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            
            {/* Payment Methods */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 lg:p-8 shadow-2xl"
            >
              <h2 className="text-lg lg:text-xl font-bold text-white mb-1.5 lg:mb-2">Payment Methods</h2>
              <p className="text-[13px] lg:text-sm text-slate-400 mb-5 lg:mb-6">Send the total amount to any of these accounts.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
                {paymentMethods.map((method) => {
                  const theme = getProviderTheme(method.provider)
                  return (
                    <div key={method.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[${theme.bg}]/10 to-transparent border border-[${theme.bg}]/20 p-4 lg:p-5 group hover:border-[${theme.bg}]/50 transition-colors`}>
                      <div className="flex items-center gap-3 mb-3 lg:mb-4">
                        <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[${theme.bg}] flex items-center justify-center shadow-lg shrink-0`}>
                          <span className={`${theme.text} font-bold text-[10px] lg:text-xs`}>{method.provider}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-[13px] lg:text-sm leading-tight">{theme.name} ({method.type})</h3>
                          <p className="text-[11px] lg:text-xs text-slate-400 mt-0.5">
                            {method.type === 'Merchant' ? 'পেমেন্ট (Payment)' : 'সেন্ড মানি/ক্যাশ ইন'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950/50 p-2.5 lg:p-3 rounded-xl border border-slate-800">
                        <span className="text-base lg:text-lg font-mono font-bold text-white tracking-widest">{method.number}</span>
                        <button 
                          type="button"
                          onClick={() => handleCopy(method.number)}
                          className="p-1.5 lg:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group-hover:text-white"
                          title="Copy Number"
                        >
                          {copied === method.number ? <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Form Section */}
              <div className="border-t border-slate-800 pt-6 lg:pt-8">
                <h2 className="text-lg lg:text-xl font-bold text-white mb-1.5 lg:mb-2">Payment Details</h2>
                <p className="text-[13px] lg:text-sm text-slate-400 mb-6 lg:mb-8">Fill in your information carefully after completing the payment.</p>
                
                {paymentInstructions && (
                <div className="p-3 lg:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-xs lg:text-sm text-slate-400 mb-6 whitespace-pre-wrap">
                  {paymentInstructions}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ariful Islam"
                        required
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Sender Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 lg:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          required
                          className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2.5 lg:py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">যে নাম্বার থেকে টাকা পাঠিয়েছেন</p>
                    </div>

                    {/* Telegram ID */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Telegram Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        placeholder="@yourusername"
                        required
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
                      />
                    </div>

                    {/* Telegram Link */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] lg:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Telegram Profile Link <span className="text-slate-500 normal-case font-normal">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={telegramLink}
                        onChange={(e) => setTelegramLink(e.target.value)}
                        placeholder="https://t.me/yourusername"
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Email Read-only */}
                  <div className="p-3 lg:p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between mt-2">
                    <span className="text-[11px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider">Associated Email</span>
                    <span className="text-[13px] lg:text-sm font-medium text-white truncate max-w-[150px] sm:max-w-xs">{userProfile?.email || currentUser?.email}</span>
                  </div>

                  <div className="pt-4 lg:pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-3.5 lg:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base overflow-hidden group active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <div className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" />
                            Submit Payment Info
                          </>
                        )}
                      </div>
                    </button>
                    <p className="text-[11px] lg:text-xs text-center text-slate-500 mt-4 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 leading-snug">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>Your information is secure and encrypted.</span>
                      <span className="hidden sm:inline"> Access granted post-verification.</span>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
