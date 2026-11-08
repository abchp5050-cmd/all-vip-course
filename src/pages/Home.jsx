"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  ChevronRight, 
  ChevronDown,
  Mouse,
  UsersRound, 
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
  ArrowRight,
  Headset,
  PlayCircle
} from "lucide-react"
import CourseCard from "../components/CourseCard"
import BannerCarousel from "../components/BannerCarousel"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
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

      // Sort courses by creation date (newest to oldest)
      coursesData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds * 1000 || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds * 1000 || 0);
        return timeB - timeA;
      })

      setTrendingCourses(coursesData.slice(0, 12))

      const categoriesQuery = query(collection(db, "categories"))
      const categoriesSnapshot = await getDocs(categoriesQuery)
      let categoriesData = categoriesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((category) => !category.isHidden)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      
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
    { Icon: BookOpen, count: "250+", label: "Premium Courses" },
    { Icon: UsersRound, count: "2000+", label: "Students Enrolled" },
    { Icon: Headset, count: "24/7", label: "Learning Support" }
  ]

  const features = [
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Premium Learning",
      description: "High quality courses"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Updated Content",
      description: "Latest materials"
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: "Expert Guidance",
      description: "Learn from experts"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Community",
      description: "Connect with learners"
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
      {/* 1. HERO BANNER CAROUSEL & SCROLL CUE */}
      <div className="relative">
        <BannerCarousel />

        {/* SCROLL CUE: Completely hidden on mobile screens to prevent overlapping statistics cards; on desktop, positioned cleanly inside the bottom area of the hero banner */}
        <div className="hidden md:flex absolute bottom-8 lg:bottom-10 inset-x-0 z-20 justify-center pointer-events-none">
          <div className="pointer-events-auto">
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
                <div className="mt-2.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-foreground bg-background/90 px-4 py-1.5 rounded-full border border-border shadow-md backdrop-blur-md group-hover:border-primary/50 group-hover:text-primary transition-all font-bengali">
                  আরও কোর্স দেখতে নিচে যান <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 2. TRUST SECTION */}
      <section id="explore-courses" className="py-3 md:py-10 relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.03] to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 relative z-10 mt-1 md:mt-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {trustStats.map((stat, index) => {
              const Icon = stat.Icon
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                  style={{ animationDelay: `${index * 0.5}s` }}
                  className="stat-card-glow group relative flex flex-col items-center text-center p-2.5 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl backdrop-blur-xl overflow-hidden hover:-translate-y-0.5"
                >
                  {/* Inner ambient radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,121,0,0.12)_0%,transparent_70%)] pointer-events-none rounded-[inherit]" />

                  {/* Always-on slow breathing ambient glow */}
                  <div 
                    style={{ animationDelay: `${index * 0.5}s` }}
                    className="ambient-glow-breathe absolute inset-0 bg-gradient-to-b from-orange-500/[0.08] via-transparent to-orange-500/[0.03] pointer-events-none rounded-[inherit]" 
                  />
                  
                  {/* Subtle top edge border glow highlight */}
                  <div className="absolute top-0 inset-x-3 sm:inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-orange-400/50 to-transparent group-hover:via-orange-400/80 transition-all duration-300" />
                  
                  {/* Icon Container: Rounded dark background with glowing orange border and radial glow */}
                  <div 
                    style={{ animationDelay: `${index * 0.5}s` }}
                    className="icon-glow-box relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl bg-[#0f1424] border border-orange-500/30 flex items-center justify-center mb-1.5 sm:mb-2.5 md:mb-3.5 shadow-[0_0_14px_rgba(255,121,0,0.22)] group-hover:border-orange-500/60 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent rounded-[inherit] pointer-events-none" />
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400 group-hover:text-orange-300 transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_6px_rgba(255,121,0,0.45)]" strokeWidth={1.8} />
                  </div>
                  
                  {/* Bold Stat Numbers */}
                  <div className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-0.5 sm:mb-1 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-amber-300 transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    {stat.count}
                  </div>
                  
                  {/* Label */}
                  <div className="text-[9px] leading-[1.15] sm:text-xs md:text-sm text-slate-400 font-semibold uppercase tracking-wider group-hover:text-slate-200 transition-colors duration-300">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Help / How to Buy Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="mt-4 sm:mt-6 max-w-3xl mx-auto"
          >
            <div className="help-box-glow relative overflow-hidden rounded-[20px] p-[1px] bg-gradient-to-r from-orange-500/35 via-amber-500/20 to-orange-500/35 hover:from-orange-500/50 hover:via-amber-500/30 hover:to-orange-500/50 transition-all duration-300">
              <div className="bg-[#0b0f19]/95 backdrop-blur-xl rounded-[19px] p-3.5 sm:p-5 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 relative overflow-hidden">
                {/* Subtle illuminated background spotlight */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent blur-2xl pointer-events-none rounded-full" />
                <div className="ambient-glow-breathe absolute inset-0 bg-gradient-to-r from-orange-500/[0.05] via-transparent to-orange-500/[0.03] pointer-events-none" />
                
                {/* Premium Orange Play Icon with Always-on Glow */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className="ambient-glow-breathe absolute -inset-1 rounded-full bg-orange-500/30 blur-md pointer-events-none" />
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 p-[1.5px] shadow-[0_0_18px_rgba(255,121,0,0.5)]">
                    <div className="w-full h-full rounded-full bg-[#0b0f19] flex items-center justify-center bg-gradient-to-br from-[#161a29] to-[#0b0f19]">
                      <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 drop-shadow-[0_0_8px_rgba(255,121,0,0.6)]" />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 text-center sm:text-left z-10">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">কোর্স কিনতে সমস্যা হচ্ছে?</h3>
                  <p className="text-[12px] sm:text-sm text-slate-400">ওয়েবসাইট থেকে কোর্স কেনার নিয়ম জানতে ভিডিওটি দেখুন</p>
                </div>

                {/* Button with Elegant Orange CTA Shadow */}
                <motion.a 
                  href="https://t.me/hscvip/1394"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="z-10 shrink-0 w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full font-bold text-[13px] sm:text-sm shadow-[0_4px_18px_rgba(255,121,0,0.35)] hover:shadow-[0_6px_24px_rgba(255,121,0,0.55)] border border-orange-400/30 hover:border-orange-300/50 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  কীভাবে কিনবেন দেখুন 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. COURSE CATEGORIES */}
      {categories.length > 0 && (
        <section className="pt-4 pb-6 md:py-12 px-4 relative overflow-hidden bg-[#07080f]">
          {/* Warm ambient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.04)_0%,transparent_60%)] pointer-events-none" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-5 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2 text-white tracking-tight">Top Categories</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">Explore our wide range of professional courses.</p>
            </div>

            <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                  className="h-full"
                >
                  <button 
                    onClick={() => handleCategoryClick(category)} 
                    className="w-full h-full text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group block"
                  >
                    {/* Premium Always-On Glowing Card Container */}
                    <div 
                      style={{ animationDelay: `${(index % 6) * 0.4}s` }}
                      className="category-card-glow h-full relative flex flex-col items-center justify-between pt-2 pb-1.5 px-1.5 sm:pt-3 sm:pb-2 sm:px-3 rounded-[14px] sm:rounded-2xl overflow-hidden"
                    >
                      {/* Inner ambient radial glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,121,0,0.08)_0%,transparent_70%)] pointer-events-none rounded-[inherit]" />

                      {/* Always-on subtle breathing ambient glow */}
                      <div 
                        style={{ animationDelay: `${(index % 6) * 0.4}s` }}
                        className="ambient-glow-breathe absolute inset-0 bg-gradient-to-b from-orange-500/[0.05] via-transparent to-orange-500/[0.02] pointer-events-none rounded-[inherit]" 
                      />

                      {/* Subtle warm top-edge accent line on hover */}
                      <div className="absolute top-0 inset-x-3 sm:inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent group-hover:via-orange-400/80 transition-all duration-300 rounded-full pointer-events-none" />

                      {/* Image — full width, natural height, perfectly centered, no blur/glow on image */}
                      <div className="w-full flex-1 flex items-center justify-center mb-1 sm:mb-2 transition-transform duration-300 group-hover:scale-[1.04] z-10 aspect-[4/3] max-h-[70px] min-[380px]:max-h-[85px] sm:max-h-[110px] md:max-h-[130px]">
                        {category.imageURL ? (
                          <img 
                            src={category.imageURL} 
                            alt={category.title}
                            loading="lazy"
                            decoding="async"
                            width="120"
                            height="85"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                            className="w-full h-full object-contain"
                          />
                        ) : null}
                        <div 
                          className="w-full h-full items-center justify-center py-2"
                          style={{ display: category.imageURL ? 'none' : 'flex' }}
                        >
                          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500 group-hover:text-orange-400 transition-colors duration-300" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-[10px] sm:text-[12px] md:text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300 line-clamp-2 leading-snug text-center w-full z-10">
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

      {/* 4. LATEST COURSES */}
      <section className="py-6 sm:py-10 md:py-12 px-3 sm:px-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 sm:mb-6 md:mb-8 gap-2.5 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] sm:text-xs font-bold tracking-wide uppercase border border-orange-500/20">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Latest Courses
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Latest Courses
              </h2>
              <p className="text-[11px] sm:text-[13px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Start your learning journey with our newly added and highly-rated premium courses.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-4 lg:gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-[#0c101c] border border-slate-800/80 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 animate-pulse flex flex-col justify-between h-[230px] sm:h-[260px]">
                  <div>
                    <div className="aspect-[16/9] bg-slate-800/80 rounded-lg mb-2"></div>
                    <div className="h-3.5 bg-slate-800 rounded w-3/4 mb-1.5"></div>
                    <div className="h-3 bg-slate-800/60 rounded w-1/2 mb-2"></div>
                  </div>
                  <div className="h-7 bg-slate-800 rounded-lg mt-auto"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-4 lg:gap-5 mb-6 sm:mb-10">
              {trendingCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="h-full"
                >
                  <CourseCard course={course} paymentStatus={paymentStatusMap[course.id]} showButton={true} variant="compact" />
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

        {/* PREMIUM VIEW ALL COURSES CTA */}
        <div className="container mx-auto max-w-6xl mt-4 sm:mt-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Link to="/courses" className="block relative group overflow-hidden rounded-[20px] sm:rounded-3xl bg-[#0a0f1c] border border-slate-800 shadow-2xl hover:shadow-[0_0_40px_rgba(79,70,229,0.2)] transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2">
              
              {/* Animated Background Gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -inset-x-40 -top-40 h-[300%] w-[300%] bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              
              <div className="relative p-5 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 backdrop-blur-xl z-10">
                <div className="flex flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/30 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <div className="w-full h-full bg-[#0a0f1c] rounded-[15px] flex items-center justify-center">
                      <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-indigo-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div className="text-left flex-1 min-w-0 pr-8 sm:pr-0">
                    <h3 className="text-[17px] sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-2 tracking-tight">
                      সব কোর্স একসাথে দেখুন
                    </h3>
                    <p className="text-[12px] sm:text-base text-slate-400 line-clamp-2 sm:line-clamp-none max-w-lg leading-snug sm:leading-relaxed">
                      আপনার পছন্দের কোর্স খুঁজে নিতে এখানে ক্লিক করুন।
                    </p>
                  </div>
                </div>
                
                {/* Arrow Button - Desktop */}
                <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 group-hover:bg-indigo-500 transition-colors duration-300 flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Arrow - Mobile Absolute */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 sm:hidden text-slate-500 group-hover:text-indigo-400 transition-colors">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-6 sm:py-16 px-4 border-t border-white/5 bg-[#07080f]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-4 sm:mb-10">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white">Why Choose Us</h2>
            <p className="text-[10px] sm:text-sm text-slate-500 max-w-2xl mx-auto">Experience the difference with our premium platform.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="bg-[#111318]/80 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 sm:p-4 hover:border-orange-500/30 transition-all duration-300 group relative flex flex-col justify-center min-h-[75px] sm:min-h-[90px]"
              >
                <div className="absolute top-0 inset-x-3 h-px bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/30 transition-all duration-300" />
                
                <div className="flex items-center gap-2 mb-1">
                  <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                    <div className="scale-75 sm:scale-100">{feature.icon}</div>
                  </div>
                  <h3 className="text-[11px] sm:text-[13px] font-bold text-slate-200 leading-tight truncate">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-400 text-[9px] sm:text-[11px] leading-snug line-clamp-1 ml-8 sm:ml-10">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS — Infinite Marquee */}
      <section className="py-6 sm:py-16 px-0 bg-[#0a0d14] relative border-t border-white/5 overflow-hidden">
        <style>{`
          @keyframes marquee-scroll {
            0%   { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee-scroll 38s linear infinite;
            will-change: transform;
          }
          .marquee-track:hover,
          .marquee-track:has(.testimonial-card:active) {
            animation-play-state: paused;
          }
          .testimonial-card {
            transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            cursor: default;
          }
          .testimonial-card:hover {
            transform: translateY(-4px);
            border-color: rgba(245, 158, 11, 0.6) !important;
            box-shadow: 0 8px 32px -2px rgba(245, 158, 11, 0.28), 0 0 0 1px rgba(245, 158, 11, 0.15) !important;
          }
          .marquee-stars svg {
            filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.45));
          }
          .marquee-quote-icon {
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.35));
          }
        `}</style>

        {/* Section heading */}
        <div className="container mx-auto px-4 max-w-6xl mb-6 sm:mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 text-white font-bengali">শিক্ষার্থীদের মতামত</h2>
            <p className="text-[10px] sm:text-sm text-slate-500 max-w-2xl mx-auto font-bengali">
              All VIP Courses-এর সাথে হাজারো শিক্ষার্থীর সাফল্য ও অভিজ্ঞতার গল্প শুনুন।
            </p>
          </motion.div>
        </div>

        {/* Marquee viewport — fade masks on edges */}
        <div
          className="relative w-full"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="marquee-track">
            {/* Original set */}
            {[...testimonials, ...testimonials].map((t, index) => (
              <div
                key={`${t.name || 'testimonial'}-${index}`}
                className="testimonial-card flex-shrink-0 mx-2.5 w-[280px] sm:w-[310px] rounded-2xl p-4 sm:p-5 flex flex-col relative"
                style={{
                  background: "rgba(17, 24, 39, 0.75)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  boxShadow: "0 4px 25px -4px rgba(245, 158, 11, 0.12)",
                }}
              >
                {/* Amber quote mark */}
                <Quote
                  className="marquee-quote-icon absolute top-3 right-3 w-5 h-5"
                  style={{ color: "rgba(245, 158, 11, 0.4)" }}
                />

                {/* 5-star row */}
                <div className="marquee-stars flex gap-0.5 mb-2.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-current"
                      style={{ color: "#FBBF24" }}
                    />
                  ))}
                </div>

                {/* Review text */}
                <p
                  className="mb-4 text-[11px] sm:text-[13px] italic leading-relaxed font-bengali line-clamp-3 flex-1"
                  style={{ color: "#94A3B8" }}
                >
                  "{t.content}"
                </p>

                {/* Author row */}
                <div
                  className="flex items-center gap-2.5 mt-auto pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #1e293b, #0f172a)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        boxShadow: "0 0 8px rgba(245, 158, 11, 0.15)",
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: "#64748B" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 bg-[#0a0d14] rounded-full" />
                  </div>
                  <div className="font-bengali min-w-0">
                    <div className="font-bold text-[11px] sm:text-xs truncate" style={{ color: "#E2E8F0" }}>{t.name}</div>
                    <div className="text-[9px] sm:text-[10px] truncate" style={{ color: "#475569" }}>{t.role} • {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="py-6 sm:py-12 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#111318] to-[#0a0d14] border border-orange-500/20 rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-500/5 relative overflow-hidden"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="text-center sm:text-left z-10 flex-1">
              <h2 className="text-lg sm:text-2xl font-bold mb-1 text-white">Start Your Journey Today</h2>
              <p className="text-[11px] sm:text-sm text-slate-400 max-w-md mx-auto sm:mx-0">
                Join our premium community and get access to top-tier courses and expert mentors.
              </p>
            </div>
            
            <div className="z-10 shrink-0 w-full sm:w-auto">
              <Link
                to="/courses"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-bold text-[12px] sm:text-sm shadow-md hover:shadow-orange-500/25 transition-all"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
