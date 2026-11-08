"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Shield, ShieldOff, Trash2, Ban, BookOpen, X } from "lucide-react"
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { toast } from "../../hooks/use-toast"
import ConfirmDialog from "../../components/ConfirmDialog"

// Helper function to extract 2-letter uppercase initials cleanly
function getInitials(name) {
  if (!name || typeof name !== "string") return "U"
  const clean = name.trim()
  if (!clean) return "U"
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Fixed-dimension Avatar component with robust onError fallback
function UserAvatar({ src, name, size = "w-10 h-10" }) {
  const [hasError, setHasError] = useState(false)
  const initials = getInitials(name)
  const isValidSrc = src && typeof src === "string" && src.trim().length > 0 && !src.includes("/placeholder.svg")

  if (!isValidSrc || hasError) {
    return (
      <div
        className={`${size} shrink-0 rounded-full bg-gradient-to-br from-amber-500/25 via-amber-600/15 to-slate-900 border border-amber-500/40 flex items-center justify-center shadow-sm select-none`}
        title={name || "User"}
      >
        <span className="text-amber-400 font-bold text-xs tracking-wider">
          {initials}
        </span>
      </div>
    )
  }

  return (
    <div className={`${size} shrink-0 rounded-full overflow-hidden border border-amber-500/30 bg-slate-900 relative shadow-sm`}>
      <img
        src={src}
        alt=""
        width="40"
        height="40"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover block"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [courses, setCourses] = useState([])
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [userEnrollments, setUserEnrollments] = useState({})
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} })

  // 200ms search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 200)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    fetchUsers()
    fetchCourses()
    fetchUserEnrollments()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, "courses"))
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchUserEnrollments = async () => {
    try {
      const paymentsSnapshot = await getDocs(
        query(collection(db, "payments"), where("status", "==", "approved"))
      )
      
      const enrollments = {}
      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data()
        const userId = payment.userId
        
        if (!enrollments[userId]) {
          enrollments[userId] = []
        }
        
        payment.courses?.forEach((course) => {
          if (!enrollments[userId].find(c => c.id === course.id)) {
            enrollments[userId].push({
              ...course,
              paymentId: doc.id,
              enrolledAt: payment.submittedAt,
            })
          }
        })
      })
      
      setUserEnrollments(enrollments)
    } catch (error) {
      console.error("Error fetching user enrollments:", error)
    }
  }

  const filteredUsers = useMemo(() => {
    if (!debouncedSearchQuery || !debouncedSearchQuery.trim()) {
      return users
    }
    const q = debouncedSearchQuery.toLowerCase().trim()
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q),
    )
  }, [users, debouncedSearchQuery])

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handlePromoteToAdmin = async (userId) => {
    try {
      console.log(" Promoting user to admin:", userId)
      await updateDoc(doc(db, "users", userId), { role: "admin" })
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: "admin" } : u)))
      showSuccess("User promoted to admin successfully!")
      console.log(" User promoted successfully")
    } catch (error) {
      console.error(" Error promoting user:", error)
      toast({
        variant: "error",
        title: "Promotion Failed",
        description: error.message || "Failed to promote user",
      })
    }
  }

  const handleDemoteToUser = async (userId) => {
    try {
      console.log(" Demoting user to regular user:", userId)
      await updateDoc(doc(db, "users", userId), { role: "user" })
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: "user" } : u)))
      showSuccess("User demoted to regular user successfully!")
      console.log(" User demoted successfully")
    } catch (error) {
      console.error(" Error demoting user:", error)
      toast({
        variant: "error",
        title: "Demotion Failed",
        description: error.message || "Failed to demote user",
      })
    }
  }

  const handleBanUser = async (userId, currentBanStatus) => {
    try {
      console.log(" Toggling ban status for user:", userId, "Current status:", currentBanStatus)
      await updateDoc(doc(db, "users", userId), { banned: !currentBanStatus })
      setUsers(users.map((u) => (u.id === userId ? { ...u, banned: !currentBanStatus } : u)))
      showSuccess(!currentBanStatus ? "User banned successfully!" : "User unbanned successfully!")
      console.log(" Ban status updated successfully")
    } catch (error) {
      console.error(" Error banning user:", error)
      toast({
        variant: "error",
        title: "Ban Status Update Failed",
        description: error.message || "Failed to update ban status",
      })
    }
  }

  const handleDeleteUser = async (userId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          console.log(" Deleting user:", userId)
          await deleteDoc(doc(db, "users", userId))
          setUsers(users.filter((u) => u.id !== userId))
          showSuccess("User deleted successfully!")
          console.log(" User deleted successfully")
        } catch (error) {
          console.error(" Error deleting user:", error)
          toast({
            variant: "error",
            title: "Deletion Failed",
            description: error.message || "Failed to delete user",
          })
        }
      }
    })
  }

  const handleRemoveFromCourse = async (courseId) => {
    if (!selectedUser || !courseId) {
      toast({
        variant: "warning",
        title: "Selection Required",
        description: "Please select both user and course",
      })
      return
    }

    setConfirmDialog({
      isOpen: true,
      title: "Remove from Course",
      message: `Are you sure you want to remove ${selectedUser.name} from this course?`,
      variant: "destructive",
      onConfirm: async () => {
        try {
          console.log(" Removing user from course:", selectedUser.id, courseId)

          const paymentsQuery = query(
            collection(db, "payments"),
            where("userId", "==", selectedUser.id),
            where("status", "==", "approved"),
          )
          const paymentsSnapshot = await getDocs(paymentsQuery)

          for (const paymentDoc of paymentsSnapshot.docs) {
            const payment = paymentDoc.data()
            const updatedCourses = payment.courses?.filter((c) => c.id !== courseId) || []

            await updateDoc(doc(db, "payments", paymentDoc.id), {
              courses: updatedCourses,
            })
          }

          showSuccess("Student removed from course successfully!")
          await fetchUserEnrollments()
          
          if (!userEnrollments[selectedUser.id] || userEnrollments[selectedUser.id].length <= 1) {
            setShowRemoveModal(false)
            setSelectedUser(null)
          }
        } catch (error) {
          console.error(" Error removing student from course:", error)
          toast({
            variant: "error",
            title: "Removal Failed",
            description: error.message || "Failed to remove student from course",
          })
        }
      }
    })
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
        <p className="text-muted-foreground">View and manage all platform users</p>
      </motion.div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm"
        >
          {successMessage}
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    User
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Role
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-3 sm:px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={user.photoURL} name={user.name} />
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate max-w-[140px] sm:max-w-xs block">
                            {user.name || "Unnamed User"}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden truncate block max-w-[140px]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm text-muted-foreground">
                      <span className="truncate block max-w-[180px] sm:max-w-none">{user.email}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                          user.role === "admin"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm shadow-amber-500/10"
                            : "bg-slate-800/60 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {user.role === "admin" ? "admin" : "user"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3.5">
                      {user.banned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Banned
                        </span>
                      ) : user.online ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)] whitespace-nowrap">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                          </span>
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.role === "admin" ? (
                          <button
                            onClick={() => handleDemoteToUser(user.id)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 flex items-center justify-center transition-all duration-200 text-orange-400 hover:text-orange-300"
                            title="Demote to User"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteToAdmin(user.id)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 text-amber-400 hover:text-amber-300"
                            title="Promote to Admin"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBanUser(user.id, user.banned)}
                          className={`w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center transition-all duration-200 ${
                            user.banned
                              ? "hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                              : "hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400 hover:text-amber-300"
                          }`}
                          title={user.banned ? "Unban User" : "Ban User"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        {userEnrollments[user.id] && userEnrollments[user.id].length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowRemoveModal(true)
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 flex items-center justify-center transition-all duration-200 text-sky-400 hover:text-sky-300 relative"
                            title={`Manage Courses (${userEnrollments[user.id].length})`}
                          >
                            <BookOpen className="w-4 h-4" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                              {userEnrollments[user.id].length}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 flex items-center justify-center transition-all duration-200 text-rose-400 hover:text-rose-300"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {showRemoveModal && selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Manage Course Enrollments</h2>
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-3.5">
                <UserAvatar src={selectedUser.photoURL} name={selectedUser.name} size="w-12 h-12" />
                <div>
                  <p className="font-bold text-base sm:text-lg text-foreground">{selectedUser.name || "Unnamed User"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {userEnrollments[selectedUser.id] && userEnrollments[selectedUser.id].length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Enrolled in {userEnrollments[selectedUser.id].length} course(s)
                </p>
                {userEnrollments[selectedUser.id].map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{enrollment.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Price: ৳{enrollment.price || 0}</span>
                        {enrollment.enrolledAt && (
                          <span>
                            Enrolled: {new Date(enrollment.enrolledAt.seconds * 1000).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCourse(enrollment.id)}
                      className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>This user is not enrolled in any courses</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedUser(null)
                }}
                className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
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
    </div>
  )
}
