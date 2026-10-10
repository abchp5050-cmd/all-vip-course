import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { GraduationCap, LogIn } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function Login() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle, userProfile, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where to send the user after login — defaults to /dashboard
  const redirectTo = location.state?.from || null

  // Removed local scrollTo as it is handled by global ScrollToTop

  useEffect(() => {
    if (currentUser && userProfile) {
      console.log(" User already logged in, redirecting...")
      if (userProfile.role === "admin") {
        navigate("/admin", { replace: true })
      } else {
        navigate(redirectTo || "/dashboard", { replace: true })
      }
    }
  }, [currentUser, userProfile, navigate, redirectTo])

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)

    try {
      console.log(" Attempting Google login...")
      const { profile } = await signInWithGoogle()
      console.log(" Google login successful, profile:", profile)

      setTimeout(() => {
        if (profile?.role === "admin") {
          console.log(" Redirecting to admin dashboard")
          navigate("/admin", { replace: true })
        } else {
          // Redirect to intended page or dashboard
          const destination = redirectTo || "/dashboard"
          console.log(" Redirecting to:", destination)
          navigate(destination, { replace: true })
        }
      }, 200)
    } catch (err) {
      console.error(" Google login error:", err)
      if (err.message === "BANNED_USER") {
        setError("Your account has been banned. Please contact support.")
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.")
      } else if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups and try again.")
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Another sign-in popup is already open.")
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.")
      } else if (err.code === "auth/internal-error") {
        setError("Google Sign-in is not configured properly. Please contact support.")
      } else {
        setError(`Failed to sign in with Google: ${err.message || "Unknown error"}`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0d18] relative overflow-hidden font-sans">
      {/* Premium Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // smooth ease-out
        className="w-full max-w-[440px] z-10 relative"
      >
        {/* Soft Glowing Border Animation around the card */}
        <motion.div 
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-[1px] bg-gradient-to-r from-orange-500/30 via-transparent to-blue-500/30 rounded-[24px] blur-sm -z-10"
        ></motion.div>

        <div className="bg-[#13182b]/90 backdrop-blur-xl border border-slate-700/50 rounded-[24px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-8">
            {/* Floating Icon */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/5 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
            >
              <GraduationCap className="w-8 h-8 text-orange-400" />
            </motion.div>

            {/* Heading with delayed fade */}
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-[26px] sm:text-[28px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 mb-4 leading-tight"
            >
              কোর্সটি কিনতে হলে প্রথমে লগইন করুন
            </motion.h1>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-slate-400 text-[15px] leading-relaxed max-w-[90%] mx-auto"
            >
              আপনার অ্যাকাউন্টে লগইন করার পর পছন্দের কোর্সটি সহজেই Enroll করতে পারবেন।
            </motion.p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center shadow-inner"
            >
              {error}
            </motion.div>
          )}

          {/* Google Login Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-[18px] px-6 bg-white hover:bg-slate-50 text-slate-900 rounded-[16px] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(255,255,255,0.05)] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            {/* Google G Logo SVG */}
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="relative z-10 text-[15px]">{loading ? "Signing in..." : "Continue with Google"}</span>
          </motion.button>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-6 text-center space-y-1"
          >
            <p className="text-[13px] text-slate-400/90 font-medium tracking-wide">
              অ্যাকাউন্টে লগইন অথবা রেজিস্ট্রেশন করে
            </p>
            <p className="text-[13px] text-slate-400/90 font-medium tracking-wide">
              <span className="text-slate-300">Continue with Google</span> এ ক্লিক করুন
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
