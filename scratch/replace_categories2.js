import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.jsx', 'utf8');

const targetStrStart = '<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">';
const targetStrEnd = '</div>\n          </div>\n        </section>\n      )}';

const startIdx = content.indexOf(targetStrStart);
const endIdx = content.indexOf(targetStrEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newSection = `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                  className="h-full"
                >
                  <button 
                    onClick={() => handleCategoryClick(category)} 
                    className="w-full h-full text-left focus:outline-none group"
                  >
                    {/* Outer Wrapper for Moving Border Effect */}
                    <div className="relative h-full rounded-[28px] p-[1px] overflow-hidden transition-shadow duration-500 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.2)]">
                      
                      {/* Animated Conic Border (Visible on Hover) */}
                      <div className="absolute inset-[-100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                          className="w-full h-full"
                          style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, rgba(249,115,22,0.3) 320deg, rgba(168,85,247,0.3) 360deg)" }}
                        />
                      </div>

                      {/* Default subtle border fallback */}
                      <div className="absolute inset-0 border border-slate-800/80 rounded-[28px] group-hover:border-transparent transition-colors duration-500 z-10" />

                      {/* Inner Card */}
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative flex flex-col items-center justify-center p-6 sm:p-8 h-full rounded-[27px] bg-[#111827]/95 backdrop-blur-xl overflow-hidden z-20"
                      >
                        {/* Shimmer Light Sweep */}
                        <motion.div
                          animate={{ x: ["-200%", "200%"] }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", repeatDelay: 3 }}
                          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 z-0 pointer-events-none"
                        />
                        
                        {/* Ambient corner glows on hover */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        {/* Image Container with Pulse Glow */}
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-5 sm:mb-7 z-10 flex items-center justify-center">
                          {/* Ambient glow behind image */}
                          <div className="absolute inset-0 bg-orange-400/5 blur-xl rounded-full group-hover:bg-orange-400/15 transition-colors duration-500" />
                          
                          {/* Pulse ring */}
                          <div className="absolute inset-2 border border-orange-500/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDuration: '3s' }} />
                          
                          <div className="relative w-full h-full rounded-[22px] bg-gradient-to-br from-slate-800/60 to-slate-900/60 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 border border-slate-700/50 shadow-inner p-3 sm:p-4 backdrop-blur-sm">
                            {category.imageURL ? (
                              <img 
                                src={category.imageURL} 
                                alt={category.title} 
                                className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0px_15px_rgba(249,115,22,0.3)] transition-all duration-500" 
                              />
                            ) : (
                              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400/80 group-hover:text-orange-400 transition-colors" />
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-[15px] sm:text-[17px] font-bold text-center text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-[1.3] z-10 px-2 tracking-tight w-full">
                          {category.title}
                        </h3>
                      </motion.div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}`;

  const sectionStartStr = '{/* 3. CATEGORIES SECTION */}';
  const sectionStartIdx = content.indexOf(sectionStartStr);
  
  if (sectionStartIdx !== -1) {
    const s1 = content.substring(0, sectionStartIdx);
    const s2 = content.substring(sectionStartIdx, startIdx);
    
    const bgString = '<section className="py-16 sm:py-24 px-4 bg-background border-t border-border">';
    const modifiedS2 = s2.replace(
      bgString,
      '<section className="py-16 sm:py-24 px-4 border-t border-slate-800 relative overflow-hidden bg-[#050816]">\n        {/* Subtle Background Gradient Movement */}\n        <motion.div\n          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}\n          transition={{ repeat: Infinity, duration: 20, repeatType: "reverse", ease: "linear" }}\n          className="absolute inset-0 opacity-20 pointer-events-none z-0"\n          style={{ backgroundImage: "radial-gradient(circle at center, rgba(249,115,22,0.05) 0%, transparent 50%, rgba(168,85,247,0.05) 100%)", backgroundSize: "200% 200%" }}\n        />'
    );

    if (modifiedS2 !== s2) {
      content = s1 + modifiedS2 + newSection + content.substring(endIdx + targetStrEnd.length);
      fs.writeFileSync('src/pages/Home.jsx', content);
      console.log("Success with section bg update");
    } else {
      content = content.substring(0, startIdx) + newSection + content.substring(endIdx + targetStrEnd.length);
      fs.writeFileSync('src/pages/Home.jsx', content);
      console.log("Success without section bg update (replace failed)");
    }
  } else {
    content = content.substring(0, startIdx) + newSection + content.substring(endIdx + targetStrEnd.length);
    fs.writeFileSync('src/pages/Home.jsx', content);
    console.log("Success without section start comment");
  }
} else {
  console.log("Could not find start or end index");
}
