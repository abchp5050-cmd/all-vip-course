"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  ChevronRight, 
  ChevronDown,
  Mouse,
  Users, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Video, 
  MessageSquare,
  Star,
  Quote,
  Sparkles,
  ArrowRight
} from "lucide-react"
import CourseCard from "../components/CourseCard"
import BannerCarousel from "../components/BannerCarousel"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function Home() {
  const navigate = useNavigate()
  const { isAdmin, currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [trendingCourses, setTrendingCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentStatusMap, setPaymentStatusMap] = useState({})

  useEffect(() => {
    fetchData()
    if (currentUser) {
      fetchPaymentStatus()
    }
  }, [isAdmin, currentUser])

  const fetchData = async () => {
    try {
      if (!db) {
        console.error("Firebase db is not initialized")
        setLoading(false)
        return
      }

      let coursesQuery = query(collection(db, "courses"))
      const coursesSnapshot = await getDocs(coursesQuery)
      let coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      if (!isAdmin) {
        coursesData = coursesData.filter((course) => course.publishStatus !== "draft")
      }

      setTrendingCourses(coursesData.slice(0, 6))

      const categoriesQuery = query(
        collection(db, "categories"), 
        where("showOnHomepage", "==", true)
      )
      const categoriesSnapshot = await getDocs(categoriesQuery)
      let categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      categoriesData = categoriesData
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 8)
      
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.id}`)
  }

  const fetchPaymentStatus = async () => {
    if (!currentUser) return
    
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid)
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      const statusMap = {}
      
      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data()
        
        if (payment.courses && Array.isArray(payment.courses)) {
          payment.courses.forEach((course) => {
            if (payment.status === "pending" && !statusMap[course.id]) {
              statusMap[course.id] = "pending"
            } else if (payment.status === "approved") {
              statusMap[course.id] = "approved"
            }
          })
        }
      })

      setPaymentStatusMap(statusMap)
    } catch (error) {
      console.error("Error fetching payment status:", error)
    }
  }

  const trustStats = [
    { icon: <Users className="w-6 h-6" />, count: "10k+", label: "Active Students" },
    { icon: <BookOpen className="w-6 h-6" />, count: "100+", label: "Premium Courses" },
    { icon: <Award className="w-6 h-6" />, count: "50+", label: "Expert Instructors" },
    { icon: <CheckCircle2 className="w-6 h-6" />, count: "99%", label: "Success Rate" }
  ]

  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Premium Learning Experience",
      description: "High-quality video content and structured curriculum designed by industry experts."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Updated Content",
      description: "Stay ahead with the latest industry trends and continuously updated course materials."
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Expert Guidance",
      description: "Learn from top professionals who bring real-world experience to your screen."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Community Support",
      description: "Join a thriving community of learners, share ideas, and grow together."
    }
  ]

const testimonials = [
    {
      name: "আরিফুল ইসলাম",
      location: "ঢাকা",
      role: "HSC 2026 শিক্ষার্থী",
      image: "https://i.pravatar.cc/150?img=11",
      content: "All VIP Courses থেকে HSC ও Admission এর কোর্স নিয়েছিলাম। কম খরচে এত সুন্দর সাজানো ক্লাস, PDF এবং গাইডলাইন পাবো ভাবিনি। পরীক্ষার প্রস্তুতিতে অনেক সাহায্য পেয়েছি। ধন্যবাদ All VIP Courses টিমকে। সবাইকে এই প্ল্যাটফর্ম থেকে কোর্স নেওয়ার পরামর্শ দিব।"
    },
    {
      name: "জান্নাতুল ফেরদৌস",
      location: "রাজশাহী",
      role: "HSC শিক্ষার্থী",
      image: "https://i.pravatar.cc/150?img=5",
      content: "Admission preparation এর জন্য All VIP Courses আমার জন্য অনেক উপকারী ছিল। ভালো মানের ক্লাস এবং সহজভাবে বুঝানোর কারণে পড়াশোনা অনেক সহজ হয়েছে। কম বাজেটে ভালো একটা learning platform পেয়েছি।"
    },
    {
      name: "তানভীর আহমেদ",
      location: "চট্টগ্রাম",
      role: "HSC 2026 Candidate",
      image: "https://i.pravatar.cc/150?img=13",
      content: "আগে অনেক জায়গায় কোর্স খুঁজেছি, কিন্তু All VIP Courses এর মতো organized course পাইনি। HSC revision এবং admission preparation দুইটার জন্যই অনেক সাহায্য পেয়েছি।"
    },
    {
      name: "মেহেদী হাসান",
      location: "কুমিল্লা",
      role: "Admission Aspirant",
      image: "https://i.pravatar.cc/150?img=14",
      content: "কম টাকায় এত বেশি resource পাওয়া সত্যিই অবাক করার মতো। নিয়মিত practice এবং guideline আমাকে অনেক confidence দিয়েছে।"
    },
    {
      name: "সাদিয়া ইসলাম",
      location: "খুলনা",
      role: "HSC শিক্ষার্থী",
      image: "https://i.pravatar.cc/150?img=9",
      content: "All VIP Courses এর সবচেয়ে ভালো দিক হলো সহজ ভাষায় শেখানো এবং প্রয়োজনীয় সব material এক জায়গায় পাওয়া যায়।"
    },
    {
      name: "রাকিবুল হাসান",
      location: "বরিশাল",
      role: "HSC Candidate",
      image: "https://i.pravatar.cc/150?img=15",
      content: "Admission এর সময় সঠিক direction পাচ্ছিলাম না। এই কোর্স নেওয়ার পর preparation অনেক গোছানো হয়েছে।"
    },
    {
      name: "নুসরাত জাহান",
      location: "ময়মনসিংহ",
      role: "HSC Student",
      image: "https://i.pravatar.cc/150?img=20",
      content: "Premium quality content এত affordable price এ পাওয়া সত্যিই ভালো লেগেছে।"
    },
    {
      name: "ইমরান হোসেন",
      location: "সিলেট",
      role: "Admission Student",
      image: "https://i.pravatar.cc/150?img=33",
      content: "যারা HSC এবং Admission নিয়ে সিরিয়াস, তাদের জন্য All VIP Courses অনেক helpful."
    }
  ]


  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* 1. HERO BANNER CAROUSEL */}
      <BannerCarousel />

      {/* SCROLL CUE */}
      <div className="relative z-40 w-full flex justify-center h-0 pointer-events-none">
        <div className="absolute -top-6 sm:-top-8 pointer-events-auto">
          <motion.button
            onClick={() => {
              const exploreSection = document.getElementById('explore-courses');
              if (exploreSection) {
                const y = exploreSection.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="group cursor-pointer flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <div className="w-8 h-12 rounded-full border-2 border-primary/50 flex justify-center p-1 bg-background shadow-lg backdrop-blur-sm group-hover:border-primary transition-all group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                <motion.div 
                  animate={{ y: [0, 16, 0], opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1.5 h-3 bg-primary rounded-full mt-1"
                />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-foreground bg-background/90 px-4 py-2 rounded-full border border-border shadow-md backdrop-blur-md group-hover:border-primary/50 group-hover:text-primary transition-all font-bengali">
                আরও কোর্স দেখতে নিচে যান <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* 2. TRUST SECTION */}
      <section id="explore-courses" className="py-12 sm:py-16 border-y border-border bg-muted/10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {trustStats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center space-y-1 sm:space-y-2"
              >
                <div className="p-2 sm:p-3 bg-primary/10 rounded-full text-primary mb-1 sm:mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.count}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COURSE CATEGORIES */}
      {categories.length > 0 && (
        <section className="py-16 sm:py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Top Categories</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">Explore our wide range of professional courses designed to elevate your expertise.</p>
            </div>

            <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
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
                    <div className="flex flex-col items-center justify-center p-3 sm:p-5 h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-500/50 relative overflow-hidden group-hover:-translate-y-1">
                      {/* Soft glass effect background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 sm:mb-4 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all duration-300 z-10">
                        {category.imageURL ? (
                           <img src={category.imageURL} alt={category.title} className="w-full h-full object-cover rounded-full p-0.5 bg-white/50 dark:bg-slate-800/50" />
                        ) : (
                           <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>
                      
                      <h3 className="text-[11px] sm:text-sm font-bold text-center text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight z-10 px-1">
                        {category.title}
                      </h3>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED COURSES */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-14 gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-bold tracking-wide uppercase border border-indigo-100 dark:border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Recommended
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Featured Courses
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Start your learning journey with our most popular and highly-rated premium courses.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm sm:text-base font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
            >
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-80">
                  <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-muted rounded-md mt-auto"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-12">
              {trendingCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <CourseCard course={course} paymentStatus={paymentStatusMap[course.id]} showButton={true} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-card border border-border rounded-xl">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-lg text-muted-foreground">No courses available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-16 sm:py-24 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Why Choose Us</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">Experience the difference with our premium educational platform designed for your success.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card/50 border border-border rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group backdrop-blur-sm"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

{/* 6. TESTIMONIALS */}
      <section className="py-16 sm:py-24 px-4 bg-muted/10 relative overflow-hidden border-t border-border">
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(calc(-50% - 1rem)); } 
            }
            .animate-marquee {
              animation: marquee 50s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}
        </style>
        
        <div className="container mx-auto max-w-6xl mb-10 sm:mb-16 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 font-bengali">শিক্ষার্থীদের মতামত</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-bengali">
            All VIP Courses-এর সাথে হাজারো শিক্ষার্থীর সাফল্য ও অভিজ্ঞতার গল্প শুনুন।
          </p>
        </div>

        <div className="relative w-full max-w-full overflow-hidden flex group">
          {/* Edge gradients for smooth fade in/out */}
          <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex w-max animate-marquee gap-4 sm:gap-8 px-4">
            {[...testimonials, ...testimonials].map((t, index) => (
              <div
                key={index}
                className="w-[280px] sm:w-[320px] md:w-[400px] flex-shrink-0 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm relative hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group/card"
              >
                <Quote className="absolute top-4 right-4 sm:top-6 sm:right-6 w-6 h-6 sm:w-8 sm:h-8 text-primary/10 group-hover/card:text-primary/20 transition-colors" />
                <div className="flex gap-1 mb-4 sm:mb-6 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-[15px] italic leading-relaxed font-bengali min-h-[80px] sm:min-h-[100px]">"{t.content}"</p>
                <div className="flex items-center gap-3 sm:gap-4 mt-auto">
                  <div className="relative">
                    <img src={t.image} alt={t.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/20" />
                    <CheckCircle2 className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-green-500 bg-background rounded-full border-2 border-background" />
                  </div>
                  <div className="font-bengali">
                    <div className="font-bold text-xs sm:text-sm text-foreground">{t.name}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{t.role} • {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 7. CALL TO ACTION */}
      <section id="community" className="py-16 sm:py-24 px-4 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-10" />
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-background/80 backdrop-blur-md border border-border p-8 sm:p-12 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              Start Your Learning Journey Today
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join our community of premium learners and get unlimited access to top-tier courses, expert mentors, and a supportive network.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all font-bold text-sm sm:text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
