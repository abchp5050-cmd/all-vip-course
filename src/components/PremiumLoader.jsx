import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"

export default function PremiumLoader({ message = "All Vip Courses" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050816] text-white overflow-hidden select-none"
    >
      {/* Soft orange background ambient glow */}
      <div className="absolute w-[450px] h-[450px] bg-gradient-to-r from-orange-500/15 to-amber-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-6 animate-pulse" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Brand Badge Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#111827] to-[#0a0f1c] border border-orange-500/30 flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-5"
        >
          <div className="absolute inset-0 bg-orange-500/10 rounded-2xl sm:rounded-3xl animate-pulse" />
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 relative z-10" />
        </motion.div>

        {/* Center Logo / Text */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2"
        >
          All Vip <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Courses</span>
        </motion.h1>

        <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide mb-6">
          Premium Learning Hub
        </p>

        {/* Small Animated Progress Indicator Bar */}
        <div className="w-40 sm:w-48 h-1 bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full shadow-[0_0_12px_#f97316]"
          />
        </div>
      </div>
    </motion.div>
  )
}
