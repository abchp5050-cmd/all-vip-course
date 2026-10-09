import re

with open('src/pages/Checkout.jsx', 'r') as f:
    content = f.read()

# Add transactionId state
content = content.replace(
    'const [customerName, setCustomerName] = useState("")',
    'const [customerName, setCustomerName] = useState("")\n  const [transactionId, setTransactionId] = useState("")\n  const [copied, setCopied] = useState(null)'
)

# Add import for Copy icon
if 'Copy,' not in content:
    content = content.replace('ArrowLeft,', 'ArrowLeft, Copy, ShieldCheck, Clock, FileText, BadgeCheck, Lock,')

# Add transactionId to payment record
payment_record_str = """telegramLink: telegramLink.trim() || "",
        transactionId: transactionId.trim(),"""
content = content.replace('telegramLink: telegramLink.trim() || "",\n        courses:', payment_record_str + '\n        courses:')

enrollment_record_str = """telegramLink: telegramLink.trim() || "",
            transactionId: transactionId.trim(),"""
content = content.replace('telegramLink: telegramLink.trim() || "",\n            customerName:', enrollment_record_str + '\n            customerName:')

# Handle copy function
handle_copy_logic = """
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
    toast({
      title: "Copied!",
      description: "Number copied to clipboard.",
    })
  }

  const subtotal = getTotal()
"""
content = content.replace('const subtotal = getTotal()', handle_copy_logic)

# Re-write the return block
new_return = """
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 py-8 lg:py-16 relative overflow-hidden font-sans">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="mb-10">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-500 mb-6 transition-all hover:-translate-x-1"
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
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Enrollment</span>
              </h1>
            </div>
            <p className="text-slate-400 max-w-xl text-sm lg:text-base ml-12">
              Submit your payment details securely to get instant access to your premium course materials.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: ORDER SUMMARY (Sticky) */}
          <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500" />
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                      <p className="text-xs text-amber-400 mt-1 font-medium">Premium Access</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <span className="font-bold text-lg text-white">৳{item.price || 0}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-900/30 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-100">What you get:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 ml-8 list-disc">
                  <li>Instant access after payment approval</li>
                  <li>Premium class materials & PDFs</li>
                  <li>Dedicated student support & guidance</li>
                </ul>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Total Payable Amount</p>
                    <p className="text-xs text-emerald-400 font-medium">One-time payment</p>
                  </div>
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
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
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-2">Payment Methods</h2>
              <p className="text-sm text-slate-400 mb-6">Send the total amount to any of these accounts.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* bKash Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E2136E]/10 to-transparent border border-[#E2136E]/20 p-5 group hover:border-[#E2136E]/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E2136E] flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xs">bKash</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">বিকাশ (Personal)</h3>
                        <p className="text-xs text-slate-400">সেন্ড মানি/ক্যাশ ইন</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-lg font-mono font-bold text-white tracking-widest">01831952349</span>
                    <button 
                      onClick={() => handleCopy("01831952349")}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group-hover:text-white"
                      title="Copy Number"
                    >
                      {copied === "01831952349" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nagad Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F7931E]/10 to-transparent border border-[#F7931E]/20 p-5 group hover:border-[#F7931E]/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F7931E] flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xs">নগদ</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">নগদ (Personal)</h3>
                        <p className="text-xs text-slate-400">সেন্ড মানি/ক্যাশ ইন</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-lg font-mono font-bold text-white tracking-widest">01815307903</span>
                    <button 
                      onClick={() => handleCopy("01815307903")}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group-hover:text-white"
                      title="Copy Number"
                    >
                      {copied === "01815307903" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="border-t border-slate-800 pt-8">
                <h2 className="text-xl font-bold text-white mb-2">Payment Details</h2>
                <p className="text-sm text-slate-400 mb-8">Fill in your information carefully after completing the payment.</p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ariful Islam"
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-sm"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Sender Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-sm font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">যে নাম্বার থেকে টাকা পাঠিয়েছেন</p>
                    </div>

                    {/* Telegram ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Telegram Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        placeholder="@yourusername"
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-sm font-mono"
                      />
                    </div>

                    {/* Transaction ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Transaction ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="TrxID (e.g. 8A7B6C5D)"
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-sm font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Telegram Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Telegram Profile Link <span className="text-slate-500 normal-case font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={telegramLink}
                      onChange={(e) => setTelegramLink(e.target.value)}
                      placeholder="https://t.me/yourusername"
                      className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-sm font-mono"
                    />
                  </div>

                  {/* Email Read-only */}
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Associated Email</span>
                    <span className="text-sm font-medium text-white">{userProfile?.email || currentUser?.email}</span>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed text-base overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <div className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Submit Payment Info
                          </>
                        )}
                      </div>
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Your information is secure and encrypted. Access granted post-verification.
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
"""

content = re.sub(r'  return \(\n    <div className="min-h-screen.*', new_return, content, flags=re.DOTALL)

with open('src/pages/Checkout.jsx', 'w') as f:
    f.write(content)

