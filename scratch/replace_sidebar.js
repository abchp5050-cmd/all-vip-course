import fs from 'fs';

let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

const oldSidebarStart = content.indexOf('{/* Mobile Sidebar - now uses dynamic navLinks */}');
const oldSidebarEnd = content.indexOf('{/* Install Modal */}');

if (oldSidebarStart !== -1 && oldSidebarEnd !== -1) {
  const newSidebar = `{/* Premium Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[#050816]/90 z-[60] backdrop-blur-md"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-4/5 max-w-[320px] bg-[#111827] border-r border-slate-800 z-[70] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Decorative top gradient */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 z-10" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 bg-[#111827]/50 relative">
                <Link to="/" onClick={() => setSidebarOpen(false)} className="relative z-10">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    Easy Ed
                  </motion.div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-full smooth-transition active:scale-95 text-slate-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Area */}
              {currentUser && (
                <div className="px-6 py-6 border-b border-slate-800/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      {userProfile?.photoURL ? (
                        <img
                          src={userProfile.photoURL || "/placeholder.svg"}
                          alt={userProfile.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 shadow-xl"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center ring-2 ring-slate-700 shadow-xl">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#111827] rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-lg truncate leading-tight mb-1">{userProfile?.name || "Student"}</p>
                      <p className="text-xs text-slate-400 truncate font-medium">{userProfile?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links Area */}
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
                
                {/* Main Nav */}
                <div className="space-y-2">
                  <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Menu</p>
                  {navLinks.map((link, index) => {
                    const Icon = link.icon
                    const isExternal = link.type === 'external'
                    const isActive = window.location.pathname === link.path
                    
                    const linkClassName = \`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium \${isActive ? 'bg-orange-500/10 text-orange-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}\`
                    const iconClassName = \`w-5 h-5 transition-colors \${isActive ? 'text-orange-400' : 'text-slate-500'}\`

                    const linkContent = (
                      <>
                        <Icon className={iconClassName} />
                        <span className="flex-1">{link.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                      </>
                    )
                    
                    return isExternal ? (
                      <a
                        key={\`mobile-\${link.path}-\${index}\`}
                        href={link.path}
                        target={link.openInNewTab ? "_blank" : "_self"}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={linkClassName}
                      >
                        {linkContent}
                      </a>
                    ) : (
                      <Link
                        key={\`mobile-\${link.path}-\${index}\`}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={linkClassName}
                      >
                        {linkContent}
                      </Link>
                    )
                  })}
                </div>

                {/* Account / Dashboard */}
                {currentUser && (
                  <div className="space-y-2">
                    <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Account</p>
                    
                    <Link
                      to={isAdmin ? "/admin" : "/dashboard"}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all font-medium"
                    >
                      <LayoutDashboard className="w-5 h-5 text-slate-500" />
                      <span>Dashboard</span>
                    </Link>
                    
                    <Link
                      to="/my-courses"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all font-medium"
                    >
                      <BookOpen className="w-5 h-5 text-slate-500" />
                      <span>My Courses</span>
                    </Link>

                    {!isAdmin && (
                      <Link
                        to="/payment-history"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all font-medium"
                      >
                        <CreditCard className="w-5 h-5 text-slate-500" />
                        <span>Payment History</span>
                      </Link>
                    )}
                    
                    <Link
                      to="/profile"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all font-medium"
                    >
                      <User className="w-5 h-5 text-slate-500" />
                      <span>Profile</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-slate-800 bg-[#0f1523]">
                {currentUser ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all font-bold group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-orange-500/20 font-bold transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In to Learn</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      `;
  content = content.substring(0, oldSidebarStart) + newSidebar + content.substring(oldSidebarEnd);
  fs.writeFileSync('src/components/Header.jsx', content);
} else {
  console.log("Could not find start/end comments");
}
