import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore"
import { db } from "../../lib/firebase"
import { toast } from "../../hooks/use-toast"
import ConfirmDialog from "../../components/ConfirmDialog"
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  X,
  Search,
  Filter,
  Percent,
  DollarSign,
  TrendingUp,
  Tag,
  AlertCircle,
  Loader2,
  Power,
  Calendar,
  Sparkles
} from "lucide-react"

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // "all" | "active" | "inactive"
  const [copiedCode, setCopiedCode] = useState(null)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    type: "fixed", // "fixed" | "percentage"
    value: "",
    usageLimit: "",
    minPurchase: "",
    active: true
  })

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  })

  // Real-time listener for coupons collection
  useEffect(() => {
    setLoading(true)
    const couponsRef = collection(db, "coupons")
    const q = query(couponsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
        setCoupons(list)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching coupons:", error)
        // Fallback without orderBy in case index isn't ready
        getDocs(couponsRef).then((snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setCoupons(list)
          setLoading(false)
        }).catch((err) => {
          console.error("Fallback error:", err)
          setLoading(false)
        })
      }
    )

    return () => unsubscribe()
  }, [])

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast({
      title: "Copied!",
      description: `Promo code ${code} copied to clipboard.`
    })
  }

  const handleOpenModal = () => {
    setFormData({
      code: "",
      type: "fixed",
      value: "",
      usageLimit: "",
      minPurchase: "",
      active: true
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleToggleActive = async (coupon) => {
    const newStatus = !coupon.active
    try {
      await updateDoc(doc(db, "coupons", coupon.id), {
        active: newStatus,
        updatedAt: serverTimestamp()
      })
      toast({
        title: newStatus ? "Coupon Activated" : "Coupon Deactivated",
        description: `Promo code ${coupon.code} is now ${newStatus ? "ACTIVE" : "INACTIVE"}.`
      })
    } catch (error) {
      console.error("Error toggling coupon status:", error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to toggle status."
      })
    }
  }

  const handleDeleteCoupon = (coupon) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Promo Code",
      message: `Are you sure you want to delete promo code "${coupon.code}"? This action cannot be undone.`,
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "coupons", coupon.id))
          toast({
            title: "Coupon Deleted",
            description: `Promo code ${coupon.code} was successfully removed.`
          })
        } catch (error) {
          console.error("Error deleting coupon:", error)
          toast({
            variant: "destructive",
            title: "Delete Failed",
            description: error.message || "Failed to delete coupon."
          })
        }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cleanCode = formData.code.trim().toUpperCase()
    if (!cleanCode) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a promo code name."
      })
      return
    }

    const numericValue = parseFloat(formData.value)
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid discount value greater than 0."
      })
      return
    }

    if (formData.type === "percentage" && numericValue > 100) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Percentage discount cannot exceed 100%."
      })
      return
    }

    // Check if code already exists
    const existing = coupons.find((c) => c.code.toUpperCase() === cleanCode)
    if (existing) {
      toast({
        variant: "destructive",
        title: "Duplicate Code",
        description: `Promo code "${cleanCode}" already exists. Please choose a different code name.`
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: cleanCode,
        type: formData.type,
        value: numericValue,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        active: Boolean(formData.active),
        usedCount: 0,
        createdBy: "admin_panel",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, "coupons"), payload)

      toast({
        variant: "success",
        title: "🎉 Promo Code Created!",
        description: `Code ${cleanCode} is now live and ready to use.`
      })

      handleCloseModal()
    } catch (error) {
      console.error("Error creating coupon:", error)
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || "Failed to save promo code."
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? c.active !== false
        : c.active === false

    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter((c) => c.active !== false).length
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                Promo Codes & Coupons
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Create and manage instant discounts for checkout
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Promo Code</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Promo Codes</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalCoupons}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Coupons</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCoupons}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Redemptions</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalRedemptions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Coupons Table / Cards */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading promo codes...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
            {coupons.length === 0 ? "No Promo Codes Yet" : "No Matching Promo Codes"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {coupons.length === 0
              ? "Create your first discount coupon to incentivize your students and boost sales."
              : "Try adjusting your search query or status filter to find the code."}
          </p>
          {coupons.length === 0 && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              + Create First Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/80 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Usage Stats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs sm:text-sm">
                {filteredCoupons.map((coupon) => {
                  const isActive = coupon.active !== false
                  const isMaxedOut = coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors rounded"
                            title="Copy Code"
                          >
                            {copiedCode === coupon.code ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-xs">
                          {coupon.type === "percentage" ? (
                            <>
                              <Percent className="w-3 h-3" />
                              {coupon.value}% OFF
                            </>
                          ) : (
                            <>
                              <span>৳{coupon.value} Flat OFF</span>
                            </>
                          )}
                        </span>
                        {coupon.minPurchase > 0 && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Min. order: ৳{coupon.minPurchase}
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <span>{coupon.usedCount || 0} used</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">
                            {coupon.usageLimit ? `${coupon.usageLimit} max` : "Unlimited"}
                          </span>
                        </div>
                        {isMaxedOut && (
                          <span className="text-[10px] font-bold text-red-500">Limit Reached</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(coupon)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Created By */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        <span className="capitalize">
                          {coupon.createdBy ? coupon.createdBy.replace("_", " ") : "Admin"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    Create New Promo Code
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Code Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Promo Code Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "") })
                    }
                    placeholder="e.g. VIP20, EID50, HSC2025"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono uppercase tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <p className="text-[10px] text-slate-400">Uppercase letters and numbers only, no spaces.</p>
                </div>

                {/* Discount Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "fixed" })}
                      className={`h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                        formData.type === "fixed"
                          ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-bold">৳</span>
                      <span>Fixed BDT (৳)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "percentage" })}
                      className={`h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                        formData.type === "percentage"
                          ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Percentage (%)</span>
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formData.type === "percentage" ? "Discount Percentage (%)" : "Discount Amount (৳)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={formData.type === "percentage" ? "100" : undefined}
                      required
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === "percentage" ? "e.g. 20 (for 20% off)" : "e.g. 50 (for ৳50 off)"}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {formData.type === "percentage" ? "%" : "৳"}
                    </span>
                  </div>
                </div>

                {/* Optional Limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Usage Limit <span className="text-[10px] text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="e.g. 100"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Min. Purchase <span className="text-[10px] text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                      placeholder="e.g. 200"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                {/* Active Switch */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Activate Immediately
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Students can immediately apply this code at checkout.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Promo Code</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  )
}
