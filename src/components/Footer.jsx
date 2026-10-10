import { Link } from "react-router-dom"
import {  Send, Youtube, MessageCircle, Mail, Phone , ChevronRight } from "lucide-react"

export default function Footer() {

  return (
    <footer className="mt-auto relative overflow-hidden bg-[#050816] pt-1">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent blur-sm" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/50 to-[#050816] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(249,115,22,0.15) 0%, transparent 60%)' }} />

      <div className="w-full px-4 pt-5 pb-[76px] sm:pb-6 relative z-10 mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center gap-4 w-full">
          
          {/* Header */}
          <div className="flex flex-col items-center w-full">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              All Vip <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Courses</span>
            </h3>
            <p className="text-slate-400 text-[11px] sm:text-[12px] leading-snug mt-1.5 w-[92%] sm:w-full">
              Premium educational courses. Learn from industry experts and achieve your goals.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 w-full">
            {[
              { to: "/", label: "Home" },
              { to: "/courses", label: "Courses" },
              { to: "/about", label: "About" },
              { to: "/contact", label: "Support" }
            ].map((link, idx, arr) => (
              <div key={idx} className="flex items-center gap-3">
                <Link to={link.to} className="text-[12px] sm:text-[13px] text-slate-300 hover:text-white transition-colors font-medium">
                  {link.label}
                </Link>
                {idx !== arr.length - 1 && <span className="text-slate-700 text-[10px]">•</span>}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="flex items-center justify-center gap-3 w-[96%] sm:w-full">
            <a href="mailto:easyeducation556644@gmail.com" className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-orange-500/50 transition-all group">
              <Mail className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium text-slate-200">Email</span>
            </a>
            <a href="tel:+8801969752197" className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-orange-500/50 transition-all group">
              <Phone className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium text-slate-200">Phone</span>
            </a>
          </div>

          {/* Connect Section */}
          <div className="flex items-center justify-center gap-3">
            {[
              { url: "https://t.me/Chatbox67_bot", Icon: Send },
              { url: "https://youtube.com/@allvipcourses", Icon: Youtube },
              { url: "https://wa.me/8801969752197", Icon: MessageCircle }
            ].map((social, idx) => (
              <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all group">
                <social.Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
          
          {/* Copyright */}
          <div className="w-full pt-4 mt-1 border-t border-slate-800/60 flex justify-center">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide text-center">
              © {new Date().getFullYear()} All Vip Courses. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  )

}
