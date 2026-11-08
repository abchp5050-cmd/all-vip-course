"use client"
import { toast } from "../../hooks/use-toast"

import { useState, useEffect, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Check, X, Clock, Download, Trash2, AlertCircle } from "lucide-react"
import { collection, getDocs, updateDoc, doc, setDoc, serverTimestamp, query, orderBy, deleteDoc, where } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { sendPaymentConfirmationEmail } from "../../lib/email"
import ConfirmDialog from "../../components/ConfirmDialog"

export default function ManagePayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} })
  const [rejectModal, setRejectModal] = useState({ isOpen: false, payment: null, targetCourse: null })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const q = query(collection(db, "payments"), orderBy("submittedAt", "desc"))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setPayments(data)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (payment, targetCourse = null) => {
    const courseTitle = targetCourse ? targetCourse.title : (payment.courses?.map(c => c.title).join(", ") || "course")
    setConfirmDialog({
      isOpen: true,
      title: "Approve Payment",
      message: `Approve payment and grant access to ${courseTitle}?`,
      variant: "default",
      onConfirm: async () => {
        try {
          if (targetCourse && payment.courses && payment.courses.length > 1) {
            // Target specific course in multi-course order
            const updatedCourses = payment.courses.map((c) =>
              c.id === targetCourse.id
                ? {
                    ...c,
                    status: "approved",
                    rejectionReason: null,
                    approvedAt: new Date().toISOString(),
                  }
                : c
            )

            const allApproved = updatedCourses.every((c) => c.status === "approved")
            const anyPending = updatedCourses.some((c) => !c.status || c.status === "pending")
            const overallStatus = allApproved ? "approved" : anyPending ? "pending" : "partially_processed"

            await updateDoc(doc(db, "payments", payment.id), {
              courses: updatedCourses,
              status: overallStatus,
              ...(allApproved ? { approvedAt: serverTimestamp(), rejectionReason: null } : {}),
            })

            // Grant access only to targetCourse
            await setDoc(doc(db, "userCourses", `${payment.userId}_${targetCourse.id}`), {
              userId: payment.userId,
              courseId: targetCourse.id,
              enrolledAt: serverTimestamp(),
              progress: 0,
            })

            // Update enrollment status only for targetCourse
            try {
              const eq = query(
                collection(db, "enrollments"),
                where("userId", "==", payment.userId),
                where("courseId", "==", targetCourse.id)
              )
              const snap = await getDocs(eq)
              for (const d of snap.docs) {
                await updateDoc(doc(db, "enrollments", d.id), {
                  status: "APPROVED",
                  rejectionReason: null,
                  approvedAt: serverTimestamp(),
                })
              }
            } catch (enrErr) {
              console.error("Error updating enrollment status on approve:", enrErr)
            }
          } else {
            // Single-course payment or approve entire payment
            const updatedCourses = (payment.courses || []).map((c) => ({
              ...c,
              status: "approved",
              rejectionReason: null,
            }))

            await updateDoc(doc(db, "payments", payment.id), {
              status: "approved",
              approvedAt: serverTimestamp(),
              rejectionReason: null,
              courses: updatedCourses,
            })

            for (const course of payment.courses || []) {
              await setDoc(doc(db, "userCourses", `${payment.userId}_${course.id}`), {
                userId: payment.userId,
                courseId: course.id,
                enrolledAt: serverTimestamp(),
                progress: 0,
              })
            }

            try {
              for (const course of payment.courses || []) {
                const eq = query(
                  collection(db, "enrollments"),
                  where("userId", "==", payment.userId),
                  where("courseId", "==", course.id)
                )
                const snap = await getDocs(eq)
                for (const d of snap.docs) {
                  await updateDoc(doc(db, "enrollments", d.id), {
                    status: "APPROVED",
                    rejectionReason: null,
                    approvedAt: serverTimestamp(),
                  })
                }
              }
            } catch (enrErr) {
              console.error("Error updating enrollment status on approve:", enrErr)
            }

            try {
              await sendPaymentConfirmationEmail(payment.userEmail, payment.userName, {
                courses: payment.courses,
                subtotal: payment.subtotal,
                discount: payment.discount || 0,
                finalAmount: payment.finalAmount,
                transactionId: payment.transactionId,
              })
            } catch (error) {
              console.error("Email notification failed:", error)
            }
          }

          toast({
            title: "Success",
            description: "Payment approved and course access granted!",
          })
          fetchPayments()
        } catch (error) {
          console.error("Error approving payment:", error)
          toast({
            variant: "error",
            title: "Error",
            description: "Failed to approve payment. Check console for details.",
          })
        }
      },
    })
  }

  const handleOpenRejectModal = (payment, targetCourse = null) => {
    setRejectModal({
      isOpen: true,
      payment,
      targetCourse,
    })
  }

  const handleCloseRejectModal = () => {
    setRejectModal({
      isOpen: false,
      payment: null,
      targetCourse: null,
    })
  }

  const handleConfirmReject = async (payment, trimmedReason, targetCourse = null) => {
    try {
      const paymentId = payment.id

      // If a specific course in a multi-course payment is targeted:
      if (targetCourse && payment.courses && payment.courses.length > 1) {
        const updatedCourses = payment.courses.map((c) =>
          c.id === targetCourse.id
            ? {
                ...c,
                status: "rejected",
                rejectionReason: trimmedReason || null,
                rejectedAt: new Date().toISOString(),
              }
            : c
        )

        const allRejected = updatedCourses.every((c) => c.status === "rejected")
        const anyPending = updatedCourses.some((c) => !c.status || c.status === "pending")
        const overallStatus = allRejected ? "rejected" : anyPending ? "pending" : "partially_processed"

        await updateDoc(doc(db, "payments", paymentId), {
          courses: updatedCourses,
          status: overallStatus,
          ...(allRejected
            ? {
                rejectedAt: serverTimestamp(),
                rejectionReason: trimmedReason || null,
              }
            : {}),
        })

        // Update enrollment ONLY for targetCourse
        try {
          const eq = query(
            collection(db, "enrollments"),
            where("userId", "==", payment.userId),
            where("courseId", "==", targetCourse.id)
          )
          const snap = await getDocs(eq)
          for (const d of snap.docs) {
            if (d.data().status !== "APPROVED") {
              await updateDoc(doc(db, "enrollments", d.id), {
                status: "REJECTED",
                rejectionReason: trimmedReason || null,
                rejectedAt: serverTimestamp(),
              })
            }
          }
        } catch (err) {
          console.error("Error updating enrollment status on reject:", err)
        }
      } else {
        // Single course or rejecting entire payment
        const updatedCourses = (payment.courses || []).map((c) => ({
          ...c,
          status: "rejected",
          rejectionReason: trimmedReason || null,
        }))

        await updateDoc(doc(db, "payments", paymentId), {
          status: "rejected",
          rejectedAt: serverTimestamp(),
          rejectionReason: trimmedReason || null,
          courses: updatedCourses,
        })

        // Update matching enrollments for this payment's courses only
        try {
          for (const course of payment.courses || []) {
            const eq = query(
              collection(db, "enrollments"),
              where("userId", "==", payment.userId),
              where("courseId", "==", course.id)
            )
            const snap = await getDocs(eq)
            for (const d of snap.docs) {
              if (d.data().status !== "APPROVED") {
                await updateDoc(doc(db, "enrollments", d.id), {
                  status: "REJECTED",
                  rejectionReason: trimmedReason || null,
                  rejectedAt: serverTimestamp(),
                })
              }
            }
          }
        } catch (err) {
          console.error("Error updating enrollment status on reject:", err)
        }
      }

      toast({
        title: "Payment Rejected",
        description: trimmedReason
          ? "Payment rejected with reason."
          : "Payment rejected without reason.",
      })
      handleCloseRejectModal()
      fetchPayments()
    } catch (error) {
      console.error("Error rejecting payment:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to reject payment",
      })
      throw error
    }
  }

  const handleDelete = async (paymentId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Payment",
      message: "Are you sure you want to permanently delete this rejected payment? This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "payments", paymentId))

          toast({
            title: "Success",
            description: "Payment deleted successfully!",
          })
          fetchPayments()
        } catch (error) {
          console.error("Error deleting payment:", error)
          toast({
            variant: "error",
            title: "Error",
            description: "Failed to delete payment",
          })
        }
      }
    })
  }

  const exportToCSV = () => {
    const approvedPayments = payments.filter(p => p.status === "approved")
    
    if (approvedPayments.length === 0) {
      toast({
        variant: "error",
        title: "No Data",
        description: "No completed payments to export",
      })
      return
    }

    const headers = ["Name", "Email", "Sender Number", "Transaction ID", "Amount", "Courses", "Approved At"]
    const rows = approvedPayments.map(payment => [
      payment.userName,
      payment.userEmail,
      payment.senderNumber,
      payment.transactionId,
      payment.finalAmount,
      payment.courses?.map(c => c.title).join("; ") || "",
      payment.approvedAt?.toDate?.()?.toLocaleString() || ""
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `completed_payments_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: `Exported ${approvedPayments.length} completed payments`,
    })
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (filter === "all") return true
      return payment.status === filter
    })
  }, [payments, filter])

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    }
    const icons = {
      pending: Clock,
      approved: Check,
      rejected: X,
    }
    const Icon = icons[status] || Clock

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || styles.pending} flex items-center gap-1 w-fit`}
      >
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          Manage Payments
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors capitalize text-xs sm:text-sm font-medium ${
                  filter === status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {status} ({payments.filter((p) => status === "all" || p.status === status).length})
              </button>
            ))}
          </div>
          <button
            onClick={exportToCSV}
            className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Completed
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPayments.map((payment) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{payment.userName}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{payment.userEmail}</p>
                </div>
                {getStatusBadge(payment.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Phone Number</p>
                  <p className="font-medium text-sm sm:text-base break-all">{payment.phoneNumber || payment.senderNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <p className="font-medium font-mono text-xs sm:text-sm break-all">{payment.transactionId}</p>
                </div>
                {payment.telegramId && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Telegram ID</p>
                    <p className="font-medium text-sm sm:text-base break-all">{payment.telegramId}</p>
                  </div>
                )}
                {payment.telegramLink && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Telegram Link</p>
                    <a 
                      href={payment.telegramLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-sm sm:text-base text-blue-600 hover:text-blue-700 break-all underline"
                    >
                      {payment.telegramLink}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Submitted At</p>
                  <p className="font-medium text-xs sm:text-sm">
                    {payment.submittedAt?.toDate?.()?.toLocaleString() || "Recently"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="font-bold text-primary text-base sm:text-lg">৳{payment.finalAmount}</p>
                  {payment.couponCode && (
                    <p className="text-xs text-green-600">
                      Coupon: {payment.couponCode} (-{payment.discountPercent}%)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Courses ({payment.courses?.length || 0})
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {payment.courses?.map((course, index) => {
                    const courseStatus = course.status || payment.status || "pending"
                    const courseReason = course.rejectionReason || (courseStatus === "rejected" ? payment.rejectionReason : null)
                    const isMulti = (payment.courses?.length || 0) > 1

                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg text-xs sm:text-sm ${
                          isMulti ? "bg-muted/40 border border-border/60" : "flex justify-between gap-2"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{course.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-muted-foreground">৳{course.price}</span>
                            {isMulti && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  courseStatus === "approved"
                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                    : courseStatus === "rejected"
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                    : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                                }`}
                              >
                                {courseStatus}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Individual course rejection reason if multi-course */}
                        {isMulti && courseReason && (
                          <p className="text-[11px] text-red-500 mt-1">
                            <strong>Reason:</strong> {courseReason}
                          </p>
                        )}

                        {/* Individual course action buttons for multi-course orders */}
                        {isMulti && courseStatus === "pending" && (
                          <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-border/40 justify-end">
                            <button
                              type="button"
                              onClick={() => handleApprove(payment, course)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Approve Course
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(payment, course)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3 h-3" /> Reject Course
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment-level Rejection Reason (shown if single course or overall payment rejected) */}
              {payment.rejectionReason && (payment.courses?.length || 0) <= 1 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600">
                    <strong>Rejection Reason:</strong> {payment.rejectionReason}
                  </p>
                </div>
              )}

              {payment.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleApprove(payment)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    {(payment.courses?.length || 0) > 1 ? "Approve All" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleOpenRejectModal(payment)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    {(payment.courses?.length || 0) > 1 ? "Reject All" : "Reject"}
                  </button>
                </div>
              )}

              {payment.status === "rejected" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">No {filter !== "all" && filter} payments found</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />

      {/* Standalone Lightweight Rejection Modal to Eliminate Lag */}
      <RejectPaymentModal
        isOpen={rejectModal.isOpen}
        payment={rejectModal.payment}
        targetCourse={rejectModal.targetCourse}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}

const RejectPaymentModal = memo(function RejectPaymentModal({
  isOpen,
  payment,
  targetCourse,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Reset internal reason draft when opened
  useEffect(() => {
    if (isOpen) {
      setReason("")
      setSubmitting(false)
    }
  }, [isOpen, payment, targetCourse])

  if (!isOpen || !payment) return null

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm(payment, reason.trim(), targetCourse)
    } catch {
      setSubmitting(false)
    }
  }

  const coursesToDisplay = targetCourse ? [targetCourse] : (payment.courses || [])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => !submitting && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0e1322] border border-rose-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/80 relative overflow-hidden text-slate-200"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {targetCourse ? `Reject Course: ${targetCourse.title}` : "Reject Payment"}
                  </h3>
                  <p className="text-xs text-slate-400">পেমেন্ট বাতিল নিশ্চিত করুন</p>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student & Payment Summary */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-semibold text-white">{payment.userName || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono font-medium text-slate-200">
                  {payment.phoneNumber || payment.senderNumber || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-rose-400">
                  ৳{targetCourse ? targetCourse.price || 0 : payment.finalAmount || 0}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-800/60 flex justify-between">
                <span className="text-slate-400">Course:</span>
                <span className="font-medium text-slate-300 truncate max-w-[220px]">
                  {coursesToDisplay.map((c) => c.title).join(", ") || "N/A"}
                </span>
              </div>
            </div>

            {/* Rejection Reason Textarea */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rejection Reason{" "}
                  <span className="text-slate-500 font-normal normal-case">(Optional / ঐচ্ছিক)</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="পেমেন্ট বাতিলের কারণ লিখুন..."
                disabled={submitting}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 focus:border-rose-500/60 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400">
                এই কারণটি শিক্ষার্থীর My Courses পেজে দেখানো হবে। ফাঁকা রাখলেও বাতিল হবে।
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-medium text-xs sm:text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Confirm Reject</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})
