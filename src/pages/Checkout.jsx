"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, ArrowLeft, Phone, Hash, Loader2, CheckCircle2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { toast } from "../hooks/use-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const { cartItems, getTotal, clearCart, isLoaded: isCartLoaded } = useCart()
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [transactionId, setTransactionId] = useState("")

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    if (!isCartLoaded) return

    if (cartItems.length === 0) {
      navigate("/courses")
      return
    }
  }, [currentUser, cartItems, navigate, isCartLoaded])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!phoneNumber.trim() || !transactionId.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both phone number and transaction ID",
      })
      return
    }

    setLoading(true)

    try {
      const subtotal = getTotal()
      
      // Create payment record
      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || "User",
        userEmail: userProfile?.email || currentUser.email,
        phoneNumber: phoneNumber.trim(),
        transactionId: transactionId.trim(),
        courses: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price) || 0,
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: 0,
        finalAmount: parseFloat(subtotal.toFixed(2)),
        status: "pending",
        submittedAt: serverTimestamp(),
      })

      // Create PENDING enrollment for each course
      for (const course of cartItems) {
        await addDoc(collection(db, "enrollments"), {
          userId: currentUser.uid,
          courseId: course.id,
          status: "PENDING",
          paymentInfo: {
            phoneNumber: phoneNumber.trim(),
            transactionId: transactionId.trim(),
            amount: parseFloat(course.price) || 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          telegramJoinedAt: null
        })
      }

      clearCart()
      toast({
        variant: "success",
        title: "Payment Submitted!",
        description: "Your payment is pending admin approval. You'll get access once approved.",
      })
      
      navigate("/checkout-complete", {
        state: {
          phoneNumber: phoneNumber.trim(),
          transactionId: transactionId.trim(),
          amount: subtotal.toFixed(2),
          courses: cartItems
        }
      })
    } catch (error) {
      console.error("Error submitting payment:", error)
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit payment information. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const subtotal = getTotal()

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate mr-2">{item.title}</span>
                      <span className="font-medium flex-shrink-0">৳{item.price || 0}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>৳{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Form */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-6">Payment Information</h2>

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">Payment Instructions</h3>
                  <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Send ৳{subtotal.toFixed(2)} via bKash/Nagad/Rocket to our payment number</li>
                    <li>Enter your phone number below (from which you sent money)</li>
                    <li>Enter the transaction ID you received</li>
                    <li>Click Submit - Admin will approve your payment shortly</li>
                  </ol>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Phone Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the phone number from which you sent the payment
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Transaction ID
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the transaction ID from your payment receipt
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Customer Name:</span>
                      <span className="text-sm">{userProfile?.name || currentUser?.displayName || "User"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{userProfile?.email || currentUser?.email}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 lg:py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Payment Info
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    Your payment information will be verified by admin. You'll get access after approval.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
