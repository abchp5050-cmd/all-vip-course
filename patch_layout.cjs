const fs = require('fs');
const file = 'src/pages/Checkout.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('</form>')) + 4; // closing tags

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `        <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8 pb-10">
          
          {/* 1. ORDER SUMMARY (TOP) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 lg:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500" />
            
            <h2 className="text-lg lg:text-xl font-bold text-white mb-5 lg:mb-6 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              Order Summary
            </h2>

            <div className="space-y-3 lg:space-y-4 mb-5 lg:mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 flex-shrink-0">
                    <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-xs lg:text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                    <p className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] lg:text-xs text-amber-400 bg-amber-400/10 mt-1.5 font-medium border border-amber-400/20">Premium Access</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <span className="font-bold text-base lg:text-lg text-white">৳{item.price || 0}</span>
                  </div>
                </div>
              ))}
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

          {/* 2. PAYMENT METHODS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 lg:p-8 shadow-2xl"
          >
            <h2 className="text-lg lg:text-xl font-bold text-white mb-1.5 lg:mb-2">Payment Methods</h2>
            <p className="text-[13px] lg:text-sm text-slate-400 mb-5 lg:mb-6">Send the total amount to any of these accounts.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {/* bKash Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E2136E]/10 to-transparent border border-[#E2136E]/30 p-5 group hover:border-[#E2136E]/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(226,19,110,0.15)]">
                <div className="absolute inset-0 bg-[#E2136E]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center gap-3 mb-4 z-10">
                  <div className="w-10 h-10 rounded-full bg-[#E2136E] flex items-center justify-center shadow-lg shrink-0">
                    <span className="text-white font-bold text-[10px] tracking-wider">bKash</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">✿ বিকাশ ✿</h3>
                    <p className="text-[11px] text-[#E2136E] mt-0.5 font-medium tracking-wide">
                      (সেন্ড মানি/ক্যাশ ইন)
                    </p>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 z-10">
                  <span className="text-base lg:text-lg font-mono font-bold text-white tracking-widest">➛ 01831952349</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy("01831952349")}
                    className="p-2 bg-slate-800/80 hover:bg-[#E2136E] rounded-lg transition-colors group-hover:text-white"
                    title="Copy bKash Number"
                  >
                    {copied === "01831952349" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nagad Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F7931E]/10 to-transparent border border-[#F7931E]/30 p-5 group hover:border-[#F7931E]/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(247,147,30,0.15)]">
                <div className="absolute inset-0 bg-[#F7931E]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center gap-3 mb-4 z-10">
                  <div className="w-10 h-10 rounded-full bg-[#F7931E] flex items-center justify-center shadow-lg shrink-0">
                    <span className="text-white font-bold text-[10px] tracking-wider">Nagad</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">✿ নগদ ✿</h3>
                    <p className="text-[11px] text-[#F7931E] mt-0.5 font-medium tracking-wide">
                      (সেন্ড মানি/ক্যাশ ইন)
                    </p>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 z-10">
                  <span className="text-base lg:text-lg font-mono font-bold text-white tracking-widest">➛ 01815307903</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy("01815307903")}
                    className="p-2 bg-slate-800/80 hover:bg-[#F7931E] rounded-lg transition-colors group-hover:text-white"
                    title="Copy Nagad Number"
                  >
                    {copied === "01815307903" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 lg:p-8 shadow-2xl"
          >
            <h2 className="text-lg lg:text-xl font-bold text-white mb-1.5 lg:mb-2">Payment Details</h2>
            <p className="text-[13px] lg:text-sm text-slate-400 mb-6 lg:mb-8">Fill in your information carefully after completing the payment.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
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
                    className="w-full px-3 lg:px-4 py-2.5 lg:py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-slate-600 transition-all text-[13px] lg:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-[1px] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <div className="relative px-4 py-3.5 lg:py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span className="font-bold text-white text-sm lg:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-white text-sm lg:text-base">Submit Payment</span>
                        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:translate-x-1 transition-transform" />
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
          </motion.div>
        </div>`;
  
  lines.splice(startIndex, endIndex - startIndex + 1, replacement);
  fs.writeFileSync(file, lines.join('\n'));
  console.log("Successfully replaced layout");
} else {
  console.log("Could not find start or end index", {startIndex, endIndex});
}
