import re

with open("src/pages/CourseDetail.jsx", "r") as f:
    content = f.read()

start_index = content.find('return (\n    <div className="min-h-screen py-12')
if start_index == -1:
    start_index = content.find('return (\n    <div className="min-h-screen')

if start_index == -1:
    print("Could not find start index")
    exit(1)

new_render_logic = """return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-12 pb-32 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>
        
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm uppercase tracking-wider">
                <span>{course.category || "General"}</span>
                {course.subcategory && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                    <span>{course.subcategory}</span>
                  </>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-white">
                {course.title}
              </h1>
              
              <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white text-base">4.8</span>
                  <span className="text-slate-400">(2.4k ratings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>12,450 Students Enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <span>Bangla & English</span>
                </div>
              </div>

              {/* Instructors inline */}
              {teachers.length > 0 && (
                <div className="flex items-center gap-3 pt-4">
                  <span className="text-slate-400 text-sm">Created by:</span>
                  <div className="flex items-center gap-2">
                    {teachers.map(t => (
                      <div key={t.id} className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                        {t.imageURL ? (
                          <img src={t.imageURL} alt={t.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                            {t.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-white">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Content / Mobile hidden (handled in Sticky floating card) */}
            <div className="hidden lg:block relative">
               {/* This space is reserved for the floating card which breaks out of the container layout */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto max-w-7xl px-4 relative z-20 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column (Main Info) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* What you'll learn */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Master the core concepts from scratch",
                  "Build real-world projects and applications",
                  "Learn best practices and modern techniques",
                  "Prepare for advanced level examinations",
                  "Gain lifetime access to all course materials",
                  "Interactive community support & guidelines"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Trust Badges */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { icon: PlayCircle, title: "On-demand Video", subtitle: "Learn anywhere" },
                 { icon: Smartphone, title: "Mobile Friendly", subtitle: "Access on any device" },
                 { icon: InfinityIcon, title: "Lifetime Access", subtitle: "Never expires" },
                 { icon: Trophy, title: "Certificate", subtitle: "Upon completion" }
               ].map((feat, i) => (
                 <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                   <feat.icon className="w-8 h-8 text-indigo-500 mb-2" />
                   <h4 className="font-bold text-slate-800 dark:text-white text-sm">{feat.title}</h4>
                   <p className="text-xs text-slate-500 mt-1">{feat.subtitle}</p>
                 </div>
               ))}
            </motion.div>

            {/* Instructor Section */}
            {teachers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Meet your instructors</h2>
                <div className="space-y-6">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                      <img src={teacher.imageURL || "https://via.placeholder.com/150"} alt={teacher.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shrink-0 mx-auto sm:mx-0" />
                      <div className="text-center sm:text-left">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{teacher.name}</h3>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-3">Expert Educator</p>
                        <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9 Instructor Rating</span>
                          <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" /> 50k+ Students</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                          {teacher.bio || "Passionate educator with years of experience in helping students achieve their academic and professional goals through clear, structured, and practical learning."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dummy Reviews Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Student Feedback</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "Rakib Hasan", text: "Best course I have ever taken. Everything is explained clearly and concisely!" },
                  { name: "Sadia Islam", text: "The instructors are amazing, and the lifetime access means I can revise anytime." },
                  { name: "Fahim Ahmed", text: "Highly recommended for anyone looking to build a strong foundation." },
                  { name: "Nusrat Jahan", text: "Very premium feel. The website and course player is top notch!" }
                ].map((review, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{review.name}</p>
                        <div className="flex gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" /><Star className="w-3 h-3 fill-amber-400" /><Star className="w-3 h-3 fill-amber-400" /><Star className="w-3 h-3 fill-amber-400" /><Star className="w-3 h-3 fill-amber-400" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Right Column (Sticky Purchase Card) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              
              {/* Course Thumbnail */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                {course.thumbnailURL ? (
                  <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-16 h-16 text-slate-300" /></div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-xl">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Price Section */}
                <div>
                  {course.price > 0 ? (
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">৳{course.price}</span>
                      <span className="text-lg text-slate-400 line-through mb-1 font-medium">৳{(course.price * 1.5).toFixed(0)}</span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-2">33% OFF</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mb-2">Free</div>
                  )}
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-rose-500" /> 
                    {course.price > 0 ? "Discount ends soon!" : "Free forever"}
                  </p>
                </div>
                
                {/* CTA Button */}
                {hasAccess ? (
                  <button
                    onClick={handleGoToMyCourses}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Go to My Courses
                  </button>
                ) : hasPendingPayment ? (
                  <button
                    disabled
                    className="w-full py-4 bg-amber-500 text-white font-bold rounded-xl text-lg shadow-lg opacity-80 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Payment Pending Review
                  </button>
                ) : (
                  <button
                    onClick={course.price > 0 ? handleBuyNow : handleEnrollFree}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] relative overflow-hidden group"
                  >
                    <span className="relative z-10">{course.price > 0 ? "Get Lifetime Access" : "Enroll for Free"}</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </button>
                )}

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">This course includes:</h4>
                  <div className="flex items-center gap-3"><MonitorPlay className="w-5 h-5 text-indigo-500" /> 24+ hours on-demand video</div>
                  <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-indigo-500" /> 12 Downloadable resources</div>
                  <div className="flex items-center gap-3"><InfinityIcon className="w-5 h-5 text-indigo-500" /> Full lifetime access</div>
                  <div className="flex items-center gap-3"><Smartphone className="w-5 h-5 text-indigo-500" /> Access on mobile and TV</div>
                  <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-indigo-500" /> Certificate of completion</div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Payment & 30-Day Guarantee
                  </p>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
"""

# Import missing icons
import_match = re.search(r"import\s+{([^}]+)}\s+from\s+[\"']lucide-react[\"']", content)
if import_match:
    imports = import_match.group(1).split(",")
    imports = [i.strip() for i in imports]
    new_icons = ["ChevronRight", "Star", "Users", "Globe", "Check", "PlayCircle", "Smartphone", "Infinity as InfinityIcon", "Trophy", "Clock", "ArrowRight", "MonitorPlay", "FileText", "ShieldCheck", "Play", "CheckCircle"]
    for icon in new_icons:
        if icon not in imports:
            imports.append(icon)
    new_imports = "import { " + ", ".join(imports) + ' } from "lucide-react"'
    content = content[:import_match.start()] + new_imports + content[import_match.end():]

with open("src/pages/CourseDetail.jsx", "w") as f:
    f.write(content[:start_index] + new_render_logic)

print("CourseDetail.jsx rewritten.")
