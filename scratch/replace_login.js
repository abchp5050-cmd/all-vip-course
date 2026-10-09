import fs from 'fs';

let content = fs.readFileSync('src/pages/Login.jsx', 'utf8');

const newLogin = `
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050816] relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="bg-[#111827]/80 backdrop-blur-2xl border border-slate-800/80 rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Card Top Highlight */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-10 mt-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-slate-700/50 shadow-inner"
            >
              <Chrome className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-sm font-medium">Sign in to continue your learning journey</p>
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-white/5 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <Chrome className="w-5 h-5" />
            <span className="relative z-10">{loading ? "Signing in..." : "Continue with Google"}</span>
          </motion.button>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Don't have an account?{" "}
              <Link to="/register" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-300 hover:to-purple-300 font-bold ml-1 transition-all">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
`

const returnIndex = content.indexOf('  return (');
if (returnIndex !== -1) {
  content = content.substring(0, returnIndex) + newLogin + '\n}\n';
}

fs.writeFileSync('src/pages/Login.jsx', content);
