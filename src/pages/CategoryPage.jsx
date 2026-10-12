"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { motion } from "framer-motion"
import { ChevronRight, Folder, BookOpen } from "lucide-react"
import CourseCard from "../components/CourseCard"
import { CourseGridSkeleton } from "../components/SkeletonLoader"
import { useAuth } from "../contexts/AuthContext"

export default function CategoryPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()
  const [category, setCategory] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [courses, setCourses] = useState([])
  const [paymentStatusMap, setPaymentStatusMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    if (currentUser) {
      fetchPaymentStatus()
    }
  }, [categoryId, currentUser])

  const fetchData = async () => {
    try {
      const categoryDoc = await getDoc(doc(db, "categories", categoryId))
      
      if (categoryDoc.exists()) {
        setCategory({ id: categoryDoc.id, ...categoryDoc.data() })
        
        const subcategoriesQuery = query(
          collection(db, "subcategories"),
          where("categoryId", "==", categoryId)
        )
        const subcategoriesSnapshot = await getDocs(subcategoriesQuery)
        const subcategoriesData = subcategoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSubcategories(subcategoriesData)
        
        if (subcategoriesData.length === 0) {
          const categoryTitle = categoryDoc.data().title
          const coursesQuery = query(
            collection(db, "courses"),
            where("category", "==", categoryTitle)
          )
          const coursesSnapshot = await getDocs(coursesQuery)
          let coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          
          if (!isAdmin) {
            coursesData = coursesData.filter((course) => course.publishStatus !== "draft")
          }
          
          setCourses(coursesData)
        }
      }
    } catch (error) {
      console.error("Error fetching category data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubcategoryClick = (subcategoryId) => {
    navigate(`/category/${categoryId}/subcategory/${subcategoryId}`)
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
        payment.courses?.forEach((course) => {
          if (payment.status === "pending" && !statusMap[course.id]) {
            statusMap[course.id] = "pending"
          } else if (payment.status === "approved") {
            statusMap[course.id] = "approved"
          }
        })
      })

      setPaymentStatusMap(statusMap)
    } catch (error) {
      console.error("Error fetching payment status:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-background">
        <div className="container mx-auto max-w-6xl space-y-8 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-48" />
          <div className="h-10 bg-slate-800 rounded w-64" />
          <CourseGridSkeleton count={6} />
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
          <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">
              Home
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{category.title}</span>
          </div>

          {category.imageURL && (
            <div className="mb-6 rounded-xl overflow-hidden aspect-[16/6] max-h-64">
              <img 
                src={category.imageURL} 
                alt={category.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.title}</h1>
          {category.description && (
            <p className="text-muted-foreground text-lg">{category.description}</p>
          )}
        </motion.div>

        {subcategories.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Subcategories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory, index) => (
                <motion.button
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                  className="group text-left"
                >
                  <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all p-6">
                    {subcategory.imageURL ? (
                      <div className="mb-4 rounded-lg overflow-hidden aspect-video">
                        <img 
                          src={subcategory.imageURL} 
                          alt={subcategory.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex items-center justify-center aspect-video bg-primary/5 rounded-lg">
                        <Folder className="w-12 h-12 text-primary/50" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {subcategory.title}
                    </h3>
                    {subcategory.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {subcategory.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : courses.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CourseCard course={course} paymentStatus={paymentStatusMap[course.id]} showButton={true} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
            <p className="text-muted-foreground">
              There are no subcategories or courses in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
