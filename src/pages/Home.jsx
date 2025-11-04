"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, BookOpen, Award, Infinity, ChevronRight } from "lucide-react"
import CourseCard from "../components/CourseCard"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function Home() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [trendingCourses, setTrendingCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [isAdmin])

  const fetchData = async () => {
    try {
      if (!db) {
        console.warn(" Firebase not available, skipping data fetch")
        setLoading(false)
        return
      }

      const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"), limit(20))
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
        where("showOnHomepage", "==", true),
        orderBy("order", "asc"),
        limit(8)
      )
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesData)
    } catch (error) {
      console.error(" Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate("/courses", { state: { searchQuery: searchQuery.trim() } })
      setSearchQuery("")
    }
  }

  const handleCategoryClick = (category) => {
    navigate("/courses", { state: { categoryFilter: category.title } })
  }

  return (
    <div className="min-h-screen">
      <section className="relative bg-white py-20 md:py-32 lg:py-40 px-4 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-50/20 rounded-full blur-3xl -z-10"></div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900/10 to-yellow-600/10 border border-blue-200/50 rounded-full text-sm font-semibold text-blue-900">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Trusted by 10,000+ Students
                </span>
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight text-blue-900"
            >
              All Vip Course
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Access premium education from anywhere, anytime. Learn from industry experts and advance your career with
              world-class courses.
            </motion.p>

            {/* CTA Buttons and Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all font-semibold group shadow-lg"
              >
                Start Learning
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full sm:w-80 pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-base placeholder:text-gray-400 transition-all"
                />
              </form>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">1000+ Courses</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Expert Instructors</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Infinity className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Lifetime Access</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-16 md:py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">Browse Categories</h2>
              <p className="text-gray-600 text-lg">Explore our comprehensive collection of courses</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button onClick={() => handleCategoryClick(category)} className="w-full text-left group">
                    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-600 hover:shadow-xl transition-all duration-300">
                      <div className="aspect-square bg-gradient-to-br from-blue-100 to-yellow-50 flex items-center justify-center relative overflow-hidden">
                        {category.imageURL ? (
                          <img
                            src={category.imageURL || "/placeholder.svg"}
                            alt={category.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-center">
                            <h3 className="font-bold text-lg md:text-xl text-blue-900">{category.title}</h3>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-white">
                        <h3 className="text-base font-semibold text-blue-900 group-hover:text-blue-600 transition-colors text-center">
                          {category.title}
                        </h3>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">Featured Courses</h2>
            <p className="text-gray-600 text-lg">Start your learning journey with our most popular courses</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 border border-gray-200 rounded-xl p-6 animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {trendingCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-600">
              <p className="text-lg">No courses available yet. Check back soon!</p>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all font-semibold group shadow-lg"
            >
              View All Courses
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
