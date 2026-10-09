"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { CreditCard, ArrowLeft, Calendar, Banknote, CheckCircle, Clock, XCircle, BookOpen, Receipt } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function PaymentHistory() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    fetchPayments()
  }, [currentUser, navigate])

  const fetchPayments = async () => {
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid)
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)
      let paymentsData = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      paymentsData.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.submittedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
      
      setPayments(paymentsData)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-green-500/10",
          text: "text-green-500",
          border: "border-green-500/20",
          glow: "shadow-[0_0_15px_rgba(34,197,94,0.15)]",
          icon: <CheckCircle className="w-4 h-4" />
        }
      case "pending":
        return {
          bg: "bg-orange-500/10",
          text: "text-orange-500",
          border: "border-orange-500/20",
          glow: "shadow-[0_0_15px_rgba(249,115,22,0.15)]",
          icon: <Clock className="w-4 h-4 animate-pulse" />
        }
      case "rejected":
        return {
          bg: "bg-red-500/10",
          text: "text-red-500",
          border: "border-red-500/20",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
          icon: <XCircle className="w-4 h-4" />
        }
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-400",
          border: "border-gray-500/20",
          glow: "",
          icon: <Clock className="w-4 h-4" />
        }
    }
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-[#050816] text-white overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group text-sm font-medium"
        >
          <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Payment History
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-16">Track your purchases and transaction status</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]"></div>
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-6">
            {payments.map((payment, index) => {
              const statusConfig = getStatusConfig(payment.status)
              
              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Banknote className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white tracking-tight">৳{payment.finalAmount?.toFixed(2) || 0}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{payment.submittedAt?.toDate?.()?.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} ${statusConfig.glow}`}>
                        {statusConfig.icon}
                        <span className="capitalize">{payment.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">
                        ID: {payment.transactionId}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-5">
                    <p className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Purchased Courses ({payment.courses?.length || 0})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {payment.courses?.map((course, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-gray-200 truncate">{course.title}</p>
                          </div>
                          <span className="text-sm font-semibold text-primary/90 flex-shrink-0">৳{course.price || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {payment.couponCode && (
                    <div className="mt-4 p-3 bg-green-500/5 border border-green-500/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-md border border-green-500/20 uppercase tracking-wider">
                          {payment.couponCode}
                        </div>
                        <span className="text-sm text-gray-400">applied</span>
                      </div>
                      <span className="text-sm font-bold text-green-400">-৳{payment.discount?.toFixed(2) || 0}</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-[#111827]/50 backdrop-blur-sm border border-white/5 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative">
              <CreditCard className="w-10 h-10 text-gray-500" />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">No Transactions Yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Your payment history is currently empty. Explore our premium courses to begin your learning journey.</p>
            
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all hover:-translate-y-0.5"
            >
              Explore Courses
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
