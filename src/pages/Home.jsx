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
  ArrowRight,
  Headset
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
    { icon: <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-transform duration-500 group-hover:scale-110" />, count: "100+", label: "Premium Courses" },
    { icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-transform duration-500 group-hover:scale-110" />, count: "10K+", label: "Students Enrolled" },
    { icon: <Headset className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-transform duration-500 group-hover:scale-110" />, count: "24/7", label: "Learning Support" }
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
      <section id="explore-courses" className="py-5 md:py-24 relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl px-4 relative z-10 mt-8 md:mt-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-8">
            {trustStats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
                className="group relative flex flex-col items-center text-center p-3 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-white/5 shadow-xl shadow-black/20 hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-2 sm:p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-2 sm:mb-4 md:mb-5 shadow-lg shadow-primary/10 group-hover:shadow-primary/30 transition-all duration-500 border border-primary/10 group-hover:border-primary/30">
                  {stat.icon}
                </div>
                
                <div className="text-lg sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-1 md:mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/70 transition-colors duration-500">
                  {stat.count}
                </div>
                <div className="text-[10px] leading-tight sm:text-sm md:text-base text-muted-foreground font-bold sm:font-semibold uppercase tracking-wider group-hover:text-foreground transition-colors duration-500">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COURSE CATEGORIES */}
      {categories.length > 0 && (
        <section className="pt-5 pb-10 md:py-16 px-4 relative overflow-hidden bg-[#07080f]">
          {/* Warm ambient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.04)_0%,transparent_60%)] pointer-events-none" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-5 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2 text-white tracking-tight">Top Categories</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">Explore our wide range of professional courses.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                >
                  <button 
                    onClick={() => handleCategoryClick(category)} 
                    className="w-full text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group block"
                  >
                    {/* Floating premium card — warm dark bg, no border, gold glow on hover */}
                    <div className="relative flex flex-col items-center pt-3.5 pb-2.5 px-2.5 sm:pt-5 sm:pb-3.5 sm:px-4 rounded-2xl bg-[#111318] group-hover:bg-[#16181f] transition-all duration-300 group-hover:-translate-y-0.5 shadow-sm group-hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.7),0_0_20px_-8px_rgba(251,146,60,0.18)]">

                      {/* Subtle warm top-edge accent line on hover */}
                      <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-orange-400/0 to-transparent group-hover:via-orange-400/30 transition-all duration-500 rounded-full" />

                      {/* Image — full width, natural height, no frame */}
                      <div className="w-full flex items-center justify-center mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-[1.05]">
                        {category.imageURL ? (
                          <img 
                            src={category.imageURL} 
                            alt={category.title} 
                            className="w-full h-auto object-contain max-h-[110px] sm:max-h-[145px] md:max-h-[160px]"
                          />
                        ) : (
                          <div className="w-full flex items-center justify-center py-5">
                            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 group-hover:text-orange-400/70 transition-colors duration-300" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-[11px] sm:text-[13px] md:text-sm font-medium text-slate-400 group-hover:text-slate-100 transition-colors duration-300 line-clamp-2 leading-snug text-center w-full">
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
      <section className="py-10 sm:py-16 px-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-10 gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-bold tracking-wide uppercase border border-indigo-100 dark:border-indigo-500/20">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recommended
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Featured Courses
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Start your learning journey with our most popular and highly-rated premium courses.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-3 animate-pulse h-64">
                  <div className="aspect-[16/9] bg-muted rounded-xl mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-muted rounded-lg mt-auto"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
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
                      Explore All Courses
                    </h3>
                    <p className="text-[12px] sm:text-base text-slate-400 line-clamp-2 sm:line-clamp-none max-w-lg leading-snug sm:leading-relaxed">
                      Discover 100+ premium courses designed for your success
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
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-primary/20 shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
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
