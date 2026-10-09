"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Play, BookOpen, Clock, Users, Tag, Check, AlertCircle, ChevronRight, Star, Globe, PlayCircle, Smartphone, Infinity as InfinityIcon, Trophy, ArrowRight, MonitorPlay, FileText, ShieldCheck, CheckCircle, Zap, Layers } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { isFirebaseId } from "../lib/slug"
import TelegramJoinButton from "../components/TelegramJoinButton"

const generateStats = (id) => {
  if (!id) return { rating: "4.8", reviewCount: 24, studentsCount: 124 };
  const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.0 + (hash % 11) / 10).toFixed(1);
  const reviewCount = 10 + (hash % 40);
  const studentsCount = 40 + (hash % 161);
  return { rating, reviewCount, studentsCount };
};

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [hasPendingPayment, setHasPendingPayment] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [enrollmentId, setEnrollmentId] = useState(null)

  useEffect(() => {
    fetchCourseData()
  }, [slug, currentUser])

  const fetchCourseData = async () => {
    try {
      let courseData = null
      
      if (isFirebaseId(slug)) {
        const courseDoc = await getDoc(doc(db, "courses", slug))
        if (courseDoc.exists()) {
          courseData = { id: courseDoc.id, ...courseDoc.data() }
        }
      } else {
        const q = query(collection(db, "courses"), where("slug", "==", slug))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const courseDoc = snapshot.docs[0]
          courseData = { id: courseDoc.id, ...courseDoc.data() }
        }
      }
      
      if (courseData) {
        setCourse(courseData)

        if (courseData.instructors && courseData.instructors.length > 0) {
          const teachersQuery = query(
            collection(db, "teachers"),
            where("name", "in", courseData.instructors.slice(0, 10))
          )
          const teachersSnapshot = await getDocs(teachersQuery)
          const teachersData = teachersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setTeachers(teachersData)
        }

        if (currentUser) {
          const paymentsQuery = query(
            collection(db, "payments"),
            where("userId", "==", currentUser.uid),
            where("status", "==", "approved"),
          )
          const paymentsSnapshot = await getDocs(paymentsQuery)

          const hasApprovedCourse = paymentsSnapshot.docs.some((doc) => {
            const payment = doc.data()
            return payment.courses?.some((c) => c.id === courseData.id)
          })
          setHasAccess(hasApprovedCourse)

          if (hasApprovedCourse) {
            const enrollmentsQuery = query(
              collection(db, "enrollments"),
              where("userId", "==", currentUser.uid),
              where("courseId", "==", courseData.id),
              where("status", "==", "APPROVED")
            )
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
            if (!enrollmentsSnapshot.empty) {
              const enrollId = enrollmentsSnapshot.docs[0].id
              console.log("✅ Enrollment ID found:", enrollId)
              setEnrollmentId(enrollId)
            } else {
              console.log("⚠️ No enrollment found for this course")
            }
          }

          const pendingPaymentQuery = query(
            collection(db, "payments"),
            where("userId", "==", currentUser.uid),
            where("status", "==", "pending"),
          )
          const pendingPaymentSnapshot = await getDocs(pendingPaymentQuery)

          const hasPendingCourse = pendingPaymentSnapshot.docs.some((doc) => {
            const payment = doc.data()
            return payment.courses?.some((c) => c.id === courseData.id)
          })
          setHasPendingPayment(hasPendingCourse)
        }
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (!course) return
    
    if (!currentUser) {
      navigate("/login")
      return
    }

    try {
      const tempCartItem = {
        id: course.id,
        title: course.title,
        price: course.price || 0,
        thumbnailURL: course.thumbnailURL
      }
      
      localStorage.setItem("tempCheckoutItem", JSON.stringify([tempCartItem]))
      navigate("/checkout")
    } catch (error) {
      console.error("Error navigating to checkout:", error)
    }
  }

  const handleGoToMyCourses = () => {
    navigate("/my-courses")
  }

  const handleEnrollFree = async () => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    try {
      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        userEmail: currentUser.email,
        courses: [
          {
            id: course.id,
            title: course.title,
            price: 0,
          },
        ],
        subtotal: 0,
        discount: 0,
        finalAmount: 0,
        status: "approved",
        submittedAt: serverTimestamp(),
        isFreeEnrollment: true,
      })

      await addDoc(collection(db, "enrollments"), {
        userId: currentUser.uid,
        courseId: course.id,
        status: "APPROVED",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        telegramJoinedAt: null
      })

      await fetchCourseData()
    } catch (error) {
      console.error("Error enrolling in free course:", error)
      alert("Failed to enroll. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const courseStats = generateStats(course.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans pb-16 sm:pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-8 sm:pt-12 pb-20 sm:pb-32 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>
        
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                <span>{course.category || "General"}</span>
                {course.subcategory && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                    <span>{course.subcategory}</span>
                  </>
                )}
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-white">
                {course.title}
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 pt-2 sm:pt-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white text-sm sm:text-base">{courseStats.rating}</span>
                  <span className="text-slate-400">({courseStats.reviewCount} ratings)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  <span>{courseStats.studentsCount} Students Enrolled</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  <span>Bangla & English</span>
                </div>
              </div>

              {/* Instructors inline */}
              {teachers.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-4 flex-wrap">
                  <span className="text-slate-400 text-xs sm:text-sm">Created by:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {teachers.map(t => (
                      <div key={t.id} className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-700">
                        {t.imageURL ? (
                          <img src={t.imageURL} alt={t.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">
                            {t.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-white">{t.name}</span>
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
      <div className="container mx-auto max-w-7xl px-4 relative z-20 -mt-10 sm:-mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          
          {/* Left Column (Main Info) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            

            {/* Instructor Section */}
            {teachers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Meet your instructors</h2>
                <div className="space-y-4 sm:space-y-6">
                  {teachers.map(teacher => {
                    const teacherStats = generateStats(teacher.id);
                    return (
                      <div key={teacher.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                        <img src={teacher.imageURL || "https://via.placeholder.com/150"} alt={teacher.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shrink-0 mx-auto sm:mx-0" />
                        <div className="text-center sm:text-left">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{teacher.name}</h3>
                          <p className="text-indigo-600 dark:text-indigo-400 font-medium text-xs sm:text-sm mb-2 sm:mb-3">Expert Educator</p>
                          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 mb-2 sm:mb-3">
                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" /> {teacherStats.rating} Instructor Rating</span>
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" /> {teacherStats.studentsCount} Students</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                            {teacher.bio || "Passionate educator with years of experience in helping students achieve their academic and professional goals through clear, structured, and practical learning."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}


          </div>
          
          {/* Right Column (Sticky Purchase Card) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 sm:top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              
              {/* Course Thumbnail */}
              <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                {course.thumbnailURL ? (
                  <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" /></div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-xl">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* Price Section */}
                <div>
                  {course.price > 0 ? (
                    <div className="flex items-end gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">৳{course.price}</span>
                      <span className="text-sm sm:text-lg text-slate-400 line-through mb-1 font-medium">৳{(course.price * 1.5).toFixed(0)}</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500 mb-1.5 sm:mb-2">33% OFF</span>
                    </div>
                  ) : (
                    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mb-1 sm:mb-2">Free</div>
                  )}
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" /> 
                    {course.price > 0 ? "Discount ends soon!" : "Free forever"}
                  </p>
                </div>
                
                {/* CTA Button */}
                {hasAccess ? (
                  <button
                    onClick={handleGoToMyCourses}
                    className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base sm:text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Go to My Courses
                  </button>
                ) : hasPendingPayment ? (
                  <button
                    disabled
                    className="w-full py-3.5 sm:py-4 bg-amber-500 text-white font-bold rounded-xl text-base sm:text-lg shadow-lg opacity-80 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    Payment Pending Review
                  </button>
                ) : (
                  <button
                    onClick={course.price > 0 ? handleBuyNow : handleEnrollFree}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-base sm:text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] relative overflow-hidden group"
                  >
                    <span className="relative z-10">{course.price > 0 ? "Get Lifetime Access" : "Enroll for Free"}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </button>
                )}

                <div className="pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
                    এই কোর্সে যা যা থাকছে:
                  </h4>
                  <ul className="space-y-2.5 sm:space-y-3">
                    {[
                      { icon: MonitorPlay, text: "Archive Classes", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                      { icon: FileText, text: "ক্লাস এর লেকচার শীট", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                      { icon: BookOpen, text: "Practice Sheet", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                      { icon: Zap, text: "Super Fast Uploading", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                      { icon: InfinityIcon, text: "লাইফটাইম এক্সেস", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
                      { icon: Layers, text: "ক্লাস সাজানো থাকবে টপিক অনুযায়ী", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
                      { icon: ShieldCheck, text: "আগের আইডি নষ্ট হলে নতুন আইডি এড করা হবে", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-500/10" }
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 sm:gap-3 group">
                        <div className={`mt-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${feature.bg}`}>
                          <feature.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${feature.color}`} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug group-hover:text-slate-900 dark:group-hover:text-white transition-colors pt-1 sm:pt-1.5">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] sm:text-xs text-slate-500 flex items-center justify-center gap-1 sm:gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> Secure Payment & 30-Day Guarantee
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
