"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { ChevronLeft, ChevronRight, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

export default function BannerCarousel() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for right, -1 for left

  // Default fallback banners if DB is empty
  const defaultBanners = [
    {
      id: "default-1",
      title: "Master Your HSC Preparation",
      subtitle: "Complete courses with expert guidance from top mentors in Bangladesh.",
      buttonText: "Explore Courses",
      buttonLink: "/courses",
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    },
    {
      id: "default-2",
      title: "Admission Preparation Made Easy",
      subtitle: "Learn from anywhere at an affordable cost and secure your dream university.",
      buttonText: "Start Learning",
      buttonLink: "/courses",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    }
  ]

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const q = query(
        collection(db, "banners"),
        where("status", "==", "active"),
        orderBy("displayOrder", "asc")
      )
      const snapshot = await getDocs(q)
      const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      if (bannersData.length > 0) {
        setBanners(bannersData)
      } else {
        setBanners(defaultBanners) // Fallback
      }
    } catch (error) {
      console.error("Error fetching banners:", error)
      setBanners(defaultBanners) // Fallback
    } finally {
      setLoading(false)
    }
  }

  // Auto-play timer
  useEffect(() => {
    if (banners.length <= 1) return
    
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    
    return () => clearInterval(timer)
  }, [banners.length])

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-background/50 flex items-center justify-center border-b border-border">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (banners.length === 0) return null

  const currentBanner = banners[currentIndex]

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? "10%" : "-10%",
      opacity: 0,
      scale: 1.05
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 },
        scale: { duration: 0.8, ease: "easeOut" }
      }
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? "10%" : "-10%",
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 },
        scale: { duration: 0.6 }
      }
    })
  }

  return (
    <section className="relative w-full h-[60vh] min-h-[500px] max-h-[800px] overflow-hidden bg-background border-b border-border group">
      
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image with Parallax & Zoom */}
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          {/* Gradients and Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30 z-10" />
          <div className="absolute inset-0 backdrop-blur-[2px] z-10" />

          {/* Content Container */}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
                    {currentBanner.title}
                  </h1>
                </motion.div>
                
                {currentBanner.subtitle && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    <p className="text-lg md:text-xl text-white/90 mb-6 max-w-lg leading-relaxed drop-shadow-md font-medium">
                      {currentBanner.subtitle}
                    </p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 w-full"
                >
                  <div className="flex items-start gap-3 text-white/90 bg-black/20 p-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium leading-snug">প্রায় ৩ বছর ধরে বিশ্বস্ততার সাথে নিরবিচ্ছিন্ন সার্ভিস দিয়ে আসছে আমাদের টিম।</span>
                  </div>
                  <div className="flex items-start gap-3 text-white/90 bg-black/20 p-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium leading-snug">আমরাই নিশ্চিত করে থাকি টেলিগ্রামের মাঝে সব থেকে কম টাকায় বেস্ট সার্ভিস।</span>
                  </div>
                  <div className="flex items-start gap-3 text-white/90 bg-black/20 p-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium leading-snug">হাজারো শিক্ষার্থীর আস্থার সাথে নিয়মিত সেবা দিয়ে যাচ্ছে আমাদের প্ল্যাটফর্ম।</span>
                  </div>
                  <div className="flex items-start gap-3 text-white/90 bg-black/20 p-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium leading-snug">দ্রুত ডেলিভারি, নির্ভরযোগ্য সার্ভিস এবং সেরা দামের নিশ্চয়তা আমাদের প্রতিশ্রুতি।</span>
                  </div>
                  <div className="flex items-start gap-3 text-white/90 bg-black/20 p-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium leading-snug">সহজ পেমেন্ট, দ্রুত অ্যাক্সেস এবং ঝামেলামুক্ত অভিজ্ঞতা নিশ্চিত করি আমরা।</span>
                  </div>
                  <div className="flex items-start gap-3 text-white/90 bg-black/20 p-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium leading-snug">শিক্ষার্থীদের প্রয়োজন অনুযায়ী সঠিক সমাধান দিতে সবসময় প্রস্তুত আমাদের টিম।</span>
                  </div>
                </motion.div>

                {currentBanner.buttonText && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                  >
                    <Link
                      to={currentBanner.buttonLink || "/courses"}
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 hover:scale-105 border border-white/10 backdrop-blur-md"
                    >
                      {currentBanner.buttonText}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-background/20 hover:bg-primary backdrop-blur-md text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-background/20 hover:bg-primary backdrop-blur-md text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? "w-8 h-2.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" 
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
    </section>
  )
}
