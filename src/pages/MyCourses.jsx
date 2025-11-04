"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { BookOpen, Send, Check, Clock, CheckCircle, XCircle } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import TelegramJoinButton from "../components/TelegramJoinButton"

export default function MyCourses() {
  const { currentUser } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [clickedLinks, setClickedLinks] = useState({})

  useEffect(() => {
    if (currentUser) {
      fetchEnrollments()
      loadClickedLinks()
    }
  }, [currentUser])

  const loadClickedLinks = () => {
    const saved = localStorage.getItem(`telegram_clicks_${currentUser?.uid}`)
    if (saved) {
      setClickedLinks(JSON.parse(saved))
    }
  }

  const saveClickedLink = (courseId) => {
    const updated = { ...clickedLinks, [courseId]: true }
    setClickedLinks(updated)
    localStorage.setItem(`telegram_clicks_${currentUser?.uid}`, JSON.stringify(updated))
  }

  const fetchEnrollments = async () => {
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "approved")
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      const enrollmentsData = []
      
      for (const paymentDoc of paymentsSnapshot.docs) {
        const payment = paymentDoc.data()
        
        if (payment.courses && payment.courses.length > 0) {
          for (const courseInfo of payment.courses) {
            try {
              const courseDoc = await getDoc(doc(db, "courses", courseInfo.id))
              if (courseDoc.exists()) {
                const enrollmentQuery = query(
                  collection(db, "enrollments"),
                  where("userId", "==", currentUser.uid),
                  where("courseId", "==", courseInfo.id)
                )
                const enrollmentSnapshot = await getDocs(enrollmentQuery)
                const enrollmentId = !enrollmentSnapshot.empty ? enrollmentSnapshot.docs[0].id : null

                enrollmentsData.push({
                  id: enrollmentId || `${paymentDoc.id}_${courseInfo.id}`,
                  enrollmentId,
                  paymentId: paymentDoc.id,
                  userId: currentUser.uid,
                  courseId: courseInfo.id,
                  status: 'APPROVED',
                  paymentStatus: 'approved',
                  course: { id: courseDoc.id, ...courseDoc.data() }
                })
              }
            } catch (error) {
              console.error("Error fetching course:", error)
            }
          }
        }
      }

      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramClick = (enrollment) => {
    const course = enrollment.course
    if (!course.telegramLink) return
    
    let telegramAppUrl
    const link = course.telegramLink
    
    // Check if it's a joinchat or + invite link (private group)
    if (link.includes('joinchat/') || link.includes('+')) {
      // Extract invite code
      let inviteCode = link
      if (inviteCode.includes('joinchat/')) {
        inviteCode = inviteCode.split('joinchat/')[1]
      } else if (inviteCode.includes('+')) {
        inviteCode = inviteCode.split('+')[1]
      }
      // Use join protocol for private groups
      telegramAppUrl = `tg://join?invite=${inviteCode}`
    } else if (link.includes('t.me/')) {
      // Public group with username
      const username = link.split('t.me/')[1].split('/')[0].split('?')[0]
      // Use resolve protocol for public groups
      telegramAppUrl = `tg://resolve?domain=${username}`
    } else {
      // Fallback to original URL if format is unknown
      telegramAppUrl = link
    }
    
    // Open in Telegram app
    window.location.href = telegramAppUrl
    
    // Mark as clicked after a short delay
    setTimeout(() => {
      saveClickedLink(course.id)
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Courses</h1>
          <p className="text-muted-foreground">Access your purchased courses and join Telegram groups</p>
        </motion.div>

        {/* Courses Grid */}
        {enrollments.length > 0 && enrollments.filter(e => e.paymentStatus === 'approved').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.filter(e => e.paymentStatus === 'approved').map((enrollment, index) => {
              const course = enrollment.course
              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Course Image */}
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    {course.thumbnailURL ? (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/50" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-1">{course.title}</h3>
                      {course.category && (
                        <p className="text-xs text-muted-foreground">{course.category}</p>
                      )}
                    </div>

                    {/* Telegram Group Access */}
                    {course.telegramLink ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleTelegramClick(enrollment)}
                          disabled={clickedLinks[course.id]}
                          className={`w-full py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                            clickedLinks[course.id]
                              ? 'bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          {clickedLinks[course.id] ? (
                            <>
                              <Check className="w-5 h-5" />
                              Opened in Telegram
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Join Telegram Group
                            </>
                          )}
                        </button>
                        <p className="text-xs text-center text-muted-foreground">
                          {clickedLinks[course.id]
                            ? 'Button disabled after opening'
                            : 'Opens directly in Telegram app'}
                        </p>
                      </div>
                    ) : (
                      <div className="py-3 px-4 bg-muted/50 border border-border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Telegram link not available yet
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-12 text-center"
          >
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't purchased any courses yet. Browse our course library to get started!
            </p>
            <Link
              to="/courses"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
            >
              Browse Courses
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
