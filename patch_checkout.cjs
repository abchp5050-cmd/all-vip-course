const fs = require('fs');
const file = 'src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">[\s\S]*?\{paymentInstructions\s*&&\s*\([\s\S]*?\}\s*\)/;

const replacement = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 mb-6 lg:mb-8">
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

              {/* Form Section */}
              <div className="border-t border-slate-800 pt-6 lg:pt-8">
                <h2 className="text-lg lg:text-xl font-bold text-white mb-1.5 lg:mb-2">Payment Details</h2>
                <p className="text-[13px] lg:text-sm text-slate-400 mb-6 lg:mb-8">Fill in your information carefully after completing the payment.</p>`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
