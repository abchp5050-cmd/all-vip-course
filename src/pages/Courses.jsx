"use client"

import { useState, useEffect, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, BookOpen, ArrowRight, Star, UsersRound, CheckCircle, Clock, Play, User } from "lucide-react"
import CourseCard from "../components/CourseCard"
import { CourseGridSkeleton } from "../components/SkeletonLoader"
import { collection, query, orderBy, getDocs, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function Courses() {
  const location = useLocation()
  const { isAdmin, currentUser } = useAuth()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [subcategoryFilter, setSubcategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [paymentStatusMap, setPaymentStatusMap] = useState({})

  // Debounce search query by 200ms to eliminate typing stutter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 200)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery)
    }
    if (location.state?.categoryFilter) {
      setCategoryFilter(location.state.categoryFilter)
    }
  }, [location.state])

  useEffect(() => {
    fetchCourses()
    fetchCategories()
    if (currentUser) {
      fetchPaymentStatus()
    }
  }, [isAdmin, currentUser])

  useEffect(() => {
    if (categoryFilter && categoryFilter !== "all") {
      fetchSubcategories(categoryFilter)
    } else {
      setSubcategories([])
      setSubcategoryFilter("all")
    }
  }, [categoryFilter])

  const fetchCourses = async () => {
    try {
      const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"))
      const coursesSnapshot = await getDocs(coursesQuery)
      let coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      if (!isAdmin) {
        coursesData = coursesData.filter(course => course.publishStatus !== "draft")
      }
      
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc"))
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchSubcategories = async (categoryId) => {
    try {
      const subcategoriesQuery = query(
        collection(db, "subcategories"),
        where("categoryId", "==", categoryId),
        orderBy("order", "asc")
      )
      const subcategoriesSnapshot = await getDocs(subcategoriesQuery)
      const subcategoriesData = subcategoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setSubcategories(subcategoriesData)
    } catch (error) {
      console.error("Error fetching subcategories:", error)
      setSubcategories([])
    }
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

  // Memoized course list filtering and sorting for instant 60fps performance
  const filteredCourses = useMemo(() => {
    let result = courses ? [...courses] : []

    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim()
      result = result.filter(
        (course) => {
          const courseCategories = Array.isArray(course.categories) && course.categories.length > 0
            ? course.categories
            : (course.category ? [course.category] : [])

          return (
            course.title?.toLowerCase().includes(q) ||
            course.description?.toLowerCase().includes(q) ||
            course.category?.toLowerCase().includes(q) ||
            courseCategories.some((c) => c?.toLowerCase().includes(q)) ||
            course.subcategory?.toLowerCase().includes(q)
          )
        }
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      const selectedCategory = categories.find(cat => cat.id === categoryFilter)
      if (selectedCategory) {
        result = result.filter((course) => {
          const courseCategories = Array.isArray(course.categories) && course.categories.length > 0
            ? course.categories
            : (course.category ? [course.category] : [])

          return (
            courseCategories.includes(selectedCategory.title) ||
            courseCategories.includes(selectedCategory.id) ||
            course.category === selectedCategory.title ||
            course.category === selectedCategory.id
          )
        })
      }
    }

    if (subcategoryFilter && subcategoryFilter !== "all") {
      const selectedSubcategory = subcategories.find(sub => sub.id === subcategoryFilter)
      if (selectedSubcategory) {
        result = result.filter((course) => course.subcategory === selectedSubcategory.title)
      }
    }

    if (sortBy === "newest") {
      result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    } else if (sortBy === "oldest") {
      result.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    return result
  }, [courses, debouncedSearchQuery, categoryFilter, subcategoryFilter, sortBy, categories, subcategories])

  return (
    <div className="min-h-screen py-5 sm:py-8 md:py-10 px-2.5 sm:px-4 bg-[#F8FAFC] dark:bg-slate-950 font-sans">
      <div className="container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6 md:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-1.5 sm:mb-3 tracking-tight">Explore Premium Courses</h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl">Discover our collection of expertly crafted courses designed to help you master new skills and advance your career.</p>
        </motion.div>

        {/* Filters Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-5 sm:mb-8 shadow-sm shadow-slate-200/50 dark:shadow-none relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs sm:text-sm font-medium transition-all outline-none"
              />
            </div>

            <div className="md:col-span-3 relative">
              <Filter className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setSubcategoryFilter("all")
                }}
                className="w-full pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs sm:text-sm font-medium appearance-none transition-all cursor-pointer outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
              <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {subcategories.length > 0 && (
              <div className="md:col-span-3 relative">
                <Filter className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
                <select
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs sm:text-sm font-medium appearance-none transition-all cursor-pointer outline-none"
                >
                  <option value="all">All Subcategories</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.title}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}

            <div className={`flex items-center justify-end gap-2 ${subcategories.length > 0 ? 'md:col-span-2' : 'md:col-span-5'}`}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Sort</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                {['newest', 'oldest', 'title'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${sortBy === s ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {loading ? (
          <CourseGridSkeleton count={8} />
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2">No courses found</h2>
            <p className="text-xs sm:text-sm text-slate-500">Try adjusting your search criteria or removing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[340px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
            {filteredCourses.map((course) => {
              const paymentStatus = currentUser ? paymentStatusMap[course.id] : null
              const isEnrolled = paymentStatus === "approved" || course.status === "enrolled"
              const isPending = paymentStatus === "pending"
              
              // Simulated rating and student count (randomized based on ID for consistency if no real data)
              const hash = course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
              const rating = 4.0 + (hash % 11) / 10
              const reviewCount = 10 + (hash % 40)
              const studentsCount = 50 + (hash % 151)

              return (
                <div
                  key={course.id}
                  className="group relative bg-white dark:bg-[#111318] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.07] hover:border-indigo-500/40 dark:hover:border-indigo-400/30 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col h-full"
                >
                  {/* Thumbnail: 16:9 container, object-cover, lazy loaded */}
                  <Link to={`/${course.slug || course.id}`} className="block relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/80">
                    {course.thumbnailURL ? (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Subtle bottom gradient on thumbnail */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Floating Category Badge */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 bg-black/65 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wide uppercase text-white shadow-xs max-w-[70%] truncate">
                      {course.category || "General"}
                    </div>
                    
                    {/* Enrolled / Pending Badges */}
                    {isEnrolled && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 bg-emerald-500/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 shadow-xs">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Enrolled</span>
                      </div>
                    )}
                    {isPending && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 bg-amber-500/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 shadow-xs">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Pending</span>
                      </div>
                    )}
                  </Link>

                  {/* Card Content: Compact, readable, perfectly structured */}
                  <div className="p-2.5 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Rating & Students Meta Row */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 sm:mb-1.5">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">{rating.toFixed(1)}</span>
                          <span className="text-slate-400 dark:text-slate-500 font-normal">({reviewCount})</span>
                        </div>
                        <div className="hidden min-[400px]:flex items-center gap-1 text-slate-400 dark:text-slate-500">
                          <UsersRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span>{studentsCount}</span>
                        </div>
                      </div>

                      {/* Course Title (Maximum 2 lines) */}
                      <Link to={`/${course.slug || course.id}`} className="block">
                        <h3 className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-orange-400 dark:group-hover:text-orange-400 transition-colors">
                          {course.title}
                        </h3>
                      </Link>

                      {/* Instructor Area */}
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-200 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                          <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                        </div>
                        <span className="truncate">{course.instructorName || "Expert Instructor"}</span>
                      </div>
                    </div>

                    {/* Bottom: Price & Enroll CTA */}
                    <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-1.5 mt-auto">
                      <div className="flex flex-col min-w-0">
                        {course.price > 0 ? (
                          <span className="text-xs sm:text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none truncate">
                            ৳{course.price}
                          </span>
                        ) : (
                          <span className="text-xs sm:text-base md:text-lg font-black text-orange-500 leading-none">
                            Free
                          </span>
                        )}
                      </div>

                      <Link 
                        to={`/${course.slug || course.id}`}
                        className="shrink-0 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] sm:text-xs md:text-sm font-bold rounded-lg sm:rounded-xl shadow-[0_2px_8px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_14px_rgba(249,115,22,0.35)] active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>{isEnrolled ? "Continue" : "Enroll Now"}</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
