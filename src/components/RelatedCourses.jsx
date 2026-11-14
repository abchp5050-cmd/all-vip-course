"use client"

import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  FolderOpen, 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ShoppingCart, 
  Star, 
  UsersRound, 
  BookOpen,
  GraduationCap
} from "lucide-react"
import { collection, getDocs, query, limit } from "firebase/firestore"
import { db } from "../lib/firebase"
import { getCoursesCache, setCoursesCache } from "../utils/coursesCache"

// Common subject and batch keywords for intelligent relevance matching
const KEYWORDS = [
  "hsc 26", "hsc 27", "hsc 28", "hsc-26", "hsc-27", "hsc-28", "hsc 2026", "hsc 2027", "hsc 2028",
  "physics", "chemistry", "higher math", "math", "biology",
  "medical", "engineering", "varsity", "admission", "buet", "ckruet",
  "acs", "cps", "combo", "cycle", "academic", "pre-admission"
]

const generateStats = (id) => {
  if (!id) return { rating: "4.9", students: 142 }
  const hash = String(id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = (4.5 + (hash % 6) / 10).toFixed(1)
  const students = 80 + (hash % 220)
  return { rating, students }
}

export default function RelatedCourses({ currentCourse }) {
  const navigate = useNavigate()
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("best_match") // 'best_match' | 'same_category' | 'popular'
  const [currentPage, setCurrentPage] = useState(0)
  const [displayCount, setDisplayCount] = useState(4)

  // 1. Fetch courses or reuse in-memory / session cache
  useEffect(() => {
    let isMounted = true

    const loadCourses = async () => {
      // Check cache first (zero database reads if navigated from Home or Courses)
      const cached = getCoursesCache()
      if (cached && cached.length > 0) {
        if (isMounted) {
          setAllCourses(cached)
          setLoading(false)
        }
        return
      }

      // Fallback: Fetch once and cache if user directly landed on CourseDetail via URL
      try {
        const q = query(collection(db, "courses"), limit(80))
        const snapshot = await getDocs(q)
        const coursesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setCoursesCache(coursesData)
        if (isMounted) {
          setAllCourses(coursesData)
        }
      } catch (err) {
        console.error("[RelatedCourses] Error loading courses for suggestions:", err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCourses()
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Extract current course category and keywords
  const currentCategories = useMemo(() => {
    if (!currentCourse) return []
    const cats = Array.isArray(currentCourse.categories) && currentCourse.categories.length > 0
      ? currentCourse.categories
      : (currentCourse.category ? [currentCourse.category] : [])
    return cats.map((c) => String(c).trim().toLowerCase()).filter(Boolean)
  }, [currentCourse])

  const primaryCategoryName = useMemo(() => {
    if (!currentCourse) return ""
    if (Array.isArray(currentCourse.categories) && currentCourse.categories[0]) {
      return currentCourse.categories[0]
    }
    return currentCourse.category || ""
  }, [currentCourse])

  const currentTitleLower = useMemo(() => {
    return (currentCourse?.title || "").toLowerCase()
  }, [currentCourse])

  const matchedKeywords = useMemo(() => {
    return KEYWORDS.filter((kw) => currentTitleLower.includes(kw))
  }, [currentTitleLower])

  // 3. Multi-tier scoring and grouping engine
  const { bestMatchCourses, sameCategoryCourses, popularCourses } = useMemo(() => {
    if (!currentCourse || !allCourses.length) {
      return { bestMatchCourses: [], sameCategoryCourses: [], popularCourses: [] }
    }

    // Exclude current course and hidden/draft items
    const candidates = allCourses.filter((c) => {
      if (c.id === currentCourse.id) return false
      if (c.publishStatus === "draft" || c.isHidden === true || c.status === "inactive") return false
      return true
    })

    // Compute scores for each candidate
    const scoredList = candidates.map((c) => {
      let score = 0
      let matchType = "popular"

      const cCats = (Array.isArray(c.categories) ? c.categories : [c.category])
        .filter(Boolean)
        .map((x) => String(x).trim().toLowerCase())

      // Tier 1: Category Match (+100)
      const hasCategoryMatch = currentCategories.some((cat) => cCats.includes(cat))
      if (hasCategoryMatch) {
        score += 100
        matchType = "matched"
      }

      // Tier 2: Subject & Batch Keyword Matches (+30 each)
      const cTitleLower = (c.title || "").toLowerCase()
      matchedKeywords.forEach((kw) => {
        if (cTitleLower.includes(kw)) {
          score += 30
          matchType = "matched"
        }
      })

      // Tier 3: Popularity points (student count or hash)
      const stats = generateStats(c.id)
      const students = Number(c.studentsCount) || stats.students
      score += students * 0.05

      return {
        ...c,
        _score: score,
        _matchType: matchType,
        _students: students,
        _rating: stats.rating,
      }
    })

    // Sort by relevance score
    const sortedByRelevance = [...scoredList].sort((a, b) => b._score - a._score)

    // A. Best Match: Take top scored, fill up to 16
    const bestMatch = sortedByRelevance.slice(0, 16)

    // B. Same Category: Strictly courses sharing category
    const sameCategory = scoredList
      .filter((c) => {
        const cCats = (Array.isArray(c.categories) ? c.categories : [c.category])
          .filter(Boolean)
          .map((x) => String(x).trim().toLowerCase())
        return currentCategories.some((cat) => cCats.includes(cat))
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 16)

    // C. Most Popular: Ranked strictly by students / enrollment
    const popular = [...scoredList]
      .sort((a, b) => b._students - a._students)
      .slice(0, 16)

    return {
      bestMatchCourses: bestMatch.length > 0 ? bestMatch : popular.slice(0, 16),
      sameCategoryCourses: sameCategory.length > 0 ? sameCategory : bestMatch.slice(0, 16),
      popularCourses: popular.slice(0, 16),
    }
  }, [allCourses, currentCourse, currentCategories, matchedKeywords])

  // Active courses based on tab selection
  const activeCourses = useMemo(() => {
    if (activeTab === "same_category") return sameCategoryCourses
    if (activeTab === "popular") return popularCourses
    return bestMatchCourses
  }, [activeTab, bestMatchCourses, sameCategoryCourses, popularCourses])

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(0)
    setDisplayCount(4)
  }, [activeTab])

  // Pagination calculations for Carousel mode
  const PAGE_SIZE = 4
  const totalPages = Math.ceil(activeCourses.length / PAGE_SIZE) || 1

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
    setDisplayCount(4)
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
    setDisplayCount(4)
  }

  // Handle "Show More" expansion
  const handleShowMore = () => {
    setDisplayCount((prev) => Math.min(activeCourses.length, prev + 4))
  }

  const handleShowLess = () => {
    setDisplayCount(4)
    setCurrentPage(0)
  }

  // Slice displayed courses:
  // If displayCount > 4 (user clicked Load More), show up to displayCount from start
  // Else show current carousel page of 4 items
  const displayedCourses = useMemo(() => {
    if (displayCount > 4) {
      return activeCourses.slice(0, displayCount)
    }
    const start = currentPage * PAGE_SIZE
    return activeCourses.slice(start, start + PAGE_SIZE)
  }, [activeCourses, displayCount, currentPage])

  // Handle smooth navigation to another course
  const handleCourseClick = (course) => {
    const targetUrl = `/${course.slug || course.id}`
    navigate(targetUrl)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading || activeCourses.length === 0) {
    return null
  }

  return (
    <section className="border-t border-slate-800/80 pt-10 sm:pt-14 mt-12 sm:mt-16 relative">
      {/* Subtle background ambient gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7 relative z-10">
        <div>
          {/* Top glowing amber pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20 mb-3 select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span>RECOMMENDED FOR YOU</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
            এই ক্যাটাগরির আরও জনপ্রিয় কোর্সসমূহ
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            আপনার নির্বাচিত কোর্সের সাথে মিল রেখে সেরা সাজেস্টেড ও জনপ্রিয় কোর্সগুলো নিচে দেওয়া হলো:
          </p>
        </div>

        {/* Carousel Prev/Next & Page Indicator Controls */}
        {totalPages > 1 && displayCount === 4 && (
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-xs font-semibold text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-amber-400 font-bold">{currentPage + 1}</span> / {totalPages}
            </span>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="w-9 h-9 rounded-full bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="w-9 h-9 rounded-full bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Interactive Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none relative z-10">
        <button
          onClick={() => setActiveTab("best_match")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 select-none ${
            activeTab === "best_match"
              ? "bg-gradient-to-r from-amber-500/25 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/15"
              : "bg-slate-900/80 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>সেরা ম্যাচ (Best Match)</span>
        </button>

        {primaryCategoryName && (
          <button
            onClick={() => setActiveTab("same_category")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 select-none ${
              activeTab === "same_category"
                ? "bg-gradient-to-r from-amber-500/25 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/15"
                : "bg-slate-900/80 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[200px]">একই ক্যাটাগরি ({primaryCategoryName})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("popular")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 select-none ${
            activeTab === "popular"
              ? "bg-gradient-to-r from-amber-500/25 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/15"
              : "bg-slate-900/80 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>জনপ্রিয় কোর্স (Most Popular)</span>
        </button>
      </div>

      {/* Course Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${currentPage}-${displayCount}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 relative z-10"
        >
          {displayedCourses.map((c) => {
            const stats = generateStats(c.id)
            const rating = c.rating || stats.rating
            const students = c._students || c.studentsCount || stats.students
            const categoryBadge = Array.isArray(c.categories) && c.categories[0] ? c.categories[0] : (c.category || "")

            return (
              <div
                key={c.id}
                onClick={() => handleCourseClick(c)}
                className="group relative bg-slate-900/90 dark:bg-slate-900/95 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Thumbnail Area with Zoom */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
                  {c.thumbnailURL ? (
                    <img
                      src={c.thumbnailURL}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = "flex"
                        }
                      }}
                    />
                  ) : null}

                  {/* Fallback Thumbnail */}
                  <div
                    className="w-full h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
                    style={{ display: c.thumbnailURL ? "none" : "flex" }}
                  >
                    <GraduationCap className="w-10 h-10 text-amber-400/40" />
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Category Pill Badge (Top Left) */}
                  {categoryBadge && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-black/60 backdrop-blur-md text-slate-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 max-w-[120px] truncate block">
                        {categoryBadge}
                      </span>
                    </div>
                  )}

                  {/* Match / Popular Badge (Top Right) */}
                  <div className="absolute top-2 right-2 z-10">
                    {c._matchType === "matched" ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>Matched</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <Flame className="w-2.5 h-2.5 text-orange-400" />
                        <span>Popular</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    {/* Course Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                      {c.title}
                    </h3>

                    {/* Rating & Students Row */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rating}</span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1 text-slate-400 truncate">
                        <UsersRound className="w-3 h-3 shrink-0" />
                        <span>{students} students</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA Button Row */}
                  <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      {c.price > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm sm:text-base font-extrabold text-amber-400 tracking-tight">
                            ৳{c.price}
                          </span>
                          <span className="text-[10px] text-slate-500 line-through">
                            ৳{Math.round(c.price * 1.4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                          Free
                        </span>
                      )}
                    </div>

                    {/* Enroll CTA Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCourseClick(c)
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Enroll</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Interactive "Load More Suggestions" Bar */}
      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 relative z-10">
        {displayCount < activeCourses.length ? (
          <button
            onClick={handleShowMore}
            className="group px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-300 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>আরও সাজেস্টেড কোর্স দেখুন (+4 More)</span>
            <ChevronDown className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
          </button>
        ) : null}

        {displayCount > 4 && (
          <button
            onClick={handleShowLess}
            className="px-5 py-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/70 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <ChevronUp className="w-4 h-4" />
            <span>সংক্ষিপ্ত করুন (Show Less)</span>
          </button>
        )}

        <Link
          to="/courses"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          <span>সব কোর্স দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  )
}
