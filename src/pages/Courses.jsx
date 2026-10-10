"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, BookOpen, ArrowRight, Star, UsersRound, CheckCircle, Clock, Play, User } from "lucide-react"
import CourseCard from "../components/CourseCard"
import { collection, query, orderBy, getDocs, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function Courses() {
  const location = useLocation()
  const { isAdmin, currentUser } = useAuth()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [subcategoryFilter, setSubcategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [paymentStatusMap, setPaymentStatusMap] = useState({})

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

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchQuery, categoryFilter, subcategoryFilter, sortBy])

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
        console.log("[Courses] Payment data:", payment)
        
        if (payment.courses && Array.isArray(payment.courses)) {
          payment.courses.forEach((course) => {
            console.log(`[Courses] Course ${course.id} - Payment status: ${payment.status}`)
            if (payment.status === "pending" && !statusMap[course.id]) {
              statusMap[course.id] = "pending"
            } else if (payment.status === "approved") {
              statusMap[course.id] = "approved"
            }
          })
        }
      })

      console.log("[Courses] Final payment status map:", statusMap)
      setPaymentStatusMap(statusMap)
    } catch (error) {
      console.error("Error fetching payment status:", error)
    }
  }

  const filterAndSortCourses = () => {
    let filtered = courses ? [...courses] : []

    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      const selectedCategory = categories.find(cat => cat.id === categoryFilter)
      if (selectedCategory) {
        filtered = filtered.filter((course) => course.category === selectedCategory.title)
      }
    }

    if (subcategoryFilter && subcategoryFilter !== "all") {
      const selectedSubcategory = subcategories.find(sub => sub.id === subcategoryFilter)
      if (selectedSubcategory) {
        filtered = filtered.filter((course) => course.subcategory === selectedSubcategory.title)
      }
    }

    if (sortBy === "newest") {
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
    } else if (sortBy === "title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    setFilteredCourses(filtered)
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-[#F8FAFC] dark:bg-slate-950 font-sans">
      <div className="container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Explore Premium Courses</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">Discover our collection of expertly crafted courses designed to help you master new skills and advance your career.</p>
        </motion.div>

        {/* Filters Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-10 shadow-sm shadow-slate-200/50 dark:shadow-none relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            <div className="md:col-span-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium transition-all outline-none"
              />
            </div>

            <div className="md:col-span-3 relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setSubcategoryFilter("all")
                }}
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium appearance-none transition-all cursor-pointer outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {subcategories.length > 0 && (
              <div className="md:col-span-3 relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium appearance-none transition-all cursor-pointer outline-none"
                >
                  <option value="all">All Subcategories</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.title}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-[20px] overflow-hidden border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800"></div>
                <div className="p-5 space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-16 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">No courses found</h2>
            <p className="text-slate-500">Try adjusting your search criteria or removing filters.</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
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
                <motion.div
                  key={course.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5 }}
                  className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[20px] overflow-hidden border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
                >
                  <Link to={`/${course.slug || course.id}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {course.thumbnailURL ? (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    
                    {/* Dark gradient overlay at bottom of image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 shadow-sm">
                      {course.category || "General"}
                    </div>
                    
                    {isEnrolled && (
                      <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                      </div>
                    )}
                    {isPending && (
                      <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-slate-700 dark:text-slate-300">{rating.toFixed(1)} ({reviewCount} ratings)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersRound className="w-4 h-4" />
                        <span>{studentsCount} Students</span>
                      </div>
                    </div>

                    <Link to={`/${course.slug || course.id}`}>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="mt-auto">
                      {/* Instructor Area */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-white dark:border-slate-600">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                          {course.instructorName || "Expert Instructor"}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-col">
                          {course.price > 0 ? (
                            <>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</span>
                              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 leading-none tracking-tight">৳{course.price}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</span>
                              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 leading-none">Free</span>
                            </>
                          )}
                        </div>

                        <Link 
                          to={`/${course.slug || course.id}`}
                          className="relative overflow-hidden px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:scale-105 group/btn flex items-center gap-1.5"
                        >
                          <span className="relative z-10">{isEnrolled ? "Continue" : "Enroll Now"}</span>
                          <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
