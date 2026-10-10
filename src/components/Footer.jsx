import { Link } from "react-router-dom"
import {  Send, Youtube, MessageCircle, Mail, Phone , ChevronRight } from "lucide-react"

export default function Footer() {

  return (
    <footer className="mt-auto relative overflow-hidden bg-[#050816] pt-1">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent blur-sm" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/50 to-[#050816] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(249,115,22,0.15) 0%, transparent 60%)' }} />

      <div className="container mx-auto px-5 sm:px-8 pt-8 pb-[100px] sm:pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="inline-block relative mb-2 group">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-purple-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <h3 className="relative text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                All Vip <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Courses</span>
              </h3>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3 inline-flex">
              <p className="text-[10px] sm:text-xs text-orange-400/90 font-medium tracking-wide">
                Affordable HSC Academic & Admission Courses
              </p>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-[13px] leading-relaxed max-w-xs mx-auto sm:mx-0">
              Transform your future with our premium educational courses. Learn from industry experts and achieve your goals.
            </p>
          </div>
          
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-[13px] sm:text-[14px] font-bold mb-3 text-white tracking-wide uppercase">Quick Links</h4>
            <div className="flex flex-col gap-1.5 w-full max-w-[240px] sm:max-w-none">
              {[
                { to: "/courses", label: "Browse Courses" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact Support" },
                { to: "/faq", label: "FAQ" }
              ].map((link, idx) => (
                <Link key={idx} to={link.to} className="group flex items-center gap-2 py-1.5 text-slate-400 hover:text-white transition-all duration-300 relative justify-center sm:justify-start w-full">
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500/50 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300 absolute left-0 sm:relative sm:left-auto opacity-0 sm:opacity-100 group-hover:opacity-100" />
                  <span className="text-[12px] sm:text-[13px] font-medium group-hover:translate-x-1 transition-transform duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-[13px] sm:text-[14px] font-bold mb-3 text-white tracking-wide uppercase">Contact</h4>
            <div className="flex flex-col gap-2 w-full max-w-[240px] sm:max-w-none">
              <a href="mailto:easyeducation556644@gmail.com" className="group flex items-center justify-center sm:justify-start gap-2.5 p-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700/30 hover:border-orange-500/30 transition-all duration-300">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] sm:text-[12px] font-medium text-slate-300 group-hover:text-white transition-colors truncate">easyeducation556644@gmail.com</span>
              </a>
              <a href="tel:+8801969752197" className="group flex items-center justify-center sm:justify-start gap-2.5 p-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700/30 hover:border-orange-500/30 transition-all duration-300">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] sm:text-[12px] font-medium text-slate-300 group-hover:text-white transition-colors">+880 1969 752197</span>
              </a>
            </div>
          </div>
          
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="text-[13px] sm:text-[14px] font-bold mb-3 text-white tracking-wide uppercase">Connect</h4>
            <div className="flex gap-3">
              {[
                { url: "https://t.me/Chatbox67_bot", Icon: Send },
                { url: "https://youtube.com/@allvipcourses", Icon: Youtube },
                { url: "https://wa.me/8801969752197", Icon: MessageCircle }
              ].map((social, idx) => (
                <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="relative group w-9 h-9 flex items-center justify-center rounded-2xl bg-[#111827]/80 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-5px_rgba(249,115,22,0.3)] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <social.Icon className="w-4 h-4 text-slate-400 group-hover:text-white relative z-10 transition-colors duration-300 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-800/60 flex justify-center relative">
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <p className="text-[10px] sm:text-[12px] text-slate-500 font-medium tracking-wide text-center">
            © {new Date().getFullYear()} All Vip Courses. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )

}
