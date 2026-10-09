import fs from 'fs';

let content = fs.readFileSync('src/pages/Home.jsx', 'utf8');

const targetStrStart = '<div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">';
const targetStrEnd = '</div>\n          </div>\n        </section>\n      )}';

const startIdx = content.indexOf(targetStrStart);
const endIdx = content.indexOf(targetStrEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newSection = `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="h-full"
                >
                  <button 
                    onClick={() => handleCategoryClick(category)} 
                    className="w-full h-full text-left group block focus:outline-none"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex flex-col items-center justify-center p-5 sm:p-8 h-full rounded-[28px] bg-[#111827]/80 backdrop-blur-xl border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-2xl hover:shadow-orange-500/15 transition-all duration-300 hover:border-orange-500/30 relative overflow-hidden"
                    >
                      {/* Premium glow effects */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Large Image Container */}
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[22px] bg-gradient-to-br from-slate-800/80 to-slate-900 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-105 transition-transform duration-500 z-10 border border-slate-700/50 shadow-inner p-3 sm:p-4">
                        {category.imageURL ? (
                           <img src={category.imageURL} alt={category.title} className="w-full h-full object-contain filter drop-shadow-lg" />
                        ) : (
                           <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400" />
                        )}
                      </div>
                      
                      <h3 className="text-[14px] sm:text-[17px] font-extrabold text-center text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-amber-500 transition-colors line-clamp-2 leading-[1.3] z-10 px-2 tracking-tight w-full">
                        {category.title}
                      </h3>
                    </motion.div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}`;

  content = content.substring(0, startIdx) + newSection + content.substring(endIdx + targetStrEnd.length);
  fs.writeFileSync('src/pages/Home.jsx', content);
  console.log("Success");
} else {
  console.log("Could not find start or end index");
}
