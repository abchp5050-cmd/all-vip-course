import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { Users, BookOpen, CreditCard, AlertCircle, CheckCircle, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

export default function Overview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const coursesSnapshot = await getDocs(collection(db, "courses"))
      const paymentsSnapshot = await getDocs(collection(db, "payments"))

      let pendingCount = 0
      let approvedCount = 0
      let totalRevenue = 0

      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data()
        if (payment.status === "pending") {
          pendingCount++
        } else if (payment.status === "approved") {
          approvedCount++
          totalRevenue += payment.finalAmount || 0
        }
      })

      setStats({
        totalUsers: usersSnapshot.size,
        totalCourses: coursesSnapshot.size,
        totalPayments: paymentsSnapshot.size,
        pendingPayments: pendingCount,
        approvedPayments: approvedCount,
        totalRevenue: totalRevenue,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `৳${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "bg-indigo-600",
      bgSoft: "bg-indigo-50 dark:bg-indigo-500/10",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      trend: "+12.5%",
      isPositive: true,
      colSpan: "md:col-span-2 lg:col-span-2 xl:col-span-1"
    },
    {
      title: "Total Students",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-emerald-500",
      bgSoft: "bg-emerald-50 dark:bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      trend: "+8.2%",
      isPositive: true,
      colSpan: "md:col-span-1"
    },
    {
      title: "Active Courses",
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      color: "bg-amber-500",
      bgSoft: "bg-amber-50 dark:bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      trend: "Steady",
      isPositive: true,
      colSpan: "md:col-span-1"
    },
    {
      title: "Total Transactions",
      value: stats.totalPayments.toLocaleString(),
      icon: CreditCard,
      color: "bg-blue-500",
      bgSoft: "bg-blue-50 dark:bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: "+4.3%",
      isPositive: true,
      colSpan: "md:col-span-1"
    },
    {
      title: "Approved Payments",
      value: stats.approvedPayments.toLocaleString(),
      icon: CheckCircle,
      color: "bg-teal-500",
      bgSoft: "bg-teal-50 dark:bg-teal-500/10",
      iconColor: "text-teal-600 dark:text-teal-400",
      trend: "+5.1%",
      isPositive: true,
      colSpan: "md:col-span-1"
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments.toLocaleString(),
      icon: AlertCircle,
      color: "bg-rose-500",
      bgSoft: "bg-rose-50 dark:bg-rose-500/10",
      iconColor: "text-rose-600 dark:text-rose-400",
      trend: "-2.4%",
      isPositive: false,
      colSpan: "md:col-span-1"
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      {/* Alert for Pending Payments */}
      {stats.pendingPayments > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                Action Required: {stats.pendingPayments} Pending Payment{stats.pendingPayments > 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                Students are waiting for payment verification to access their courses.
              </p>
            </div>
          </div>
          <Link 
            to="/admin/payments" 
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center"
          >
            Review Payments
          </Link>
        </motion.div>
      )}

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden group ${stat.colSpan || ''}`}
            >
              {/* Decorative Background Blob */}
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl ${stat.color}`}></div>
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${stat.bgSoft}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${stat.isPositive ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                <h4 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{stat.value}</h4>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Placeholder for Charts / Recent Activity (For a real SaaS feel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center min-h-[300px]"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Revenue Analytics</h3>
            <p className="text-sm text-slate-500">Visual chart integration can be added here.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/courses" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Manage Courses</p>
                <p className="text-xs text-slate-500">Add or edit courses</p>
              </div>
            </Link>
            <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Student Directory</p>
                <p className="text-xs text-slate-500">View and manage users</p>
              </div>
            </Link>
            </div>
        </motion.div>
      </div>

    </div>
  )
}
