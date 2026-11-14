import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {  Mail, Phone, Send, Youtube, MessageCircle , ChevronRight } from "lucide-react"
import { fetchActiveFooterConfig } from "../lib/headerFooterUtils"
import { useAuth } from "../contexts/AuthContext"
import Footer from "./Footer"

const iconMap = {
  Mail,
  Phone,
  Send,
  Youtube,
  MessageCircle
}

// Default configuration when Firestore config is not available
const DEFAULT_FOOTER_CONFIG = {
  content: {
    brand: {
      enabled: true,
      text: "All Vip Courses",
      description: "HSC academic & admission courses at low price."
    },
    sections: [
      {
        id: "section-quick-links",
        title: "Quick Links",
        links: [
          { id: "link-home", label: "Home", type: "internal", url: "/", isVisible: true },
          { id: "link-courses", label: "Courses", type: "internal", url: "/courses", isVisible: true },
          { id: "link-community", label: "Community", type: "internal", url: "/community", isVisible: true }
        ]
      },
      {
        id: "section-contact",
        title: "Contact",
        links: [
          { id: "contact-email", label: "Email", type: "email", value: "easyeducation556644@gmail.com", icon: "Mail", isVisible: true },
          { id: "contact-phone", label: "Phone", type: "phone", value: "+8801969752197", icon: "Phone", isVisible: true }
        ]
      }
    ],
    socialLinks: {
      enabled: true,
      title: "Connect",
      links: [
        { id: "social-telegram", platform: "telegram", url: "https://t.me/Chatbox67_bot", icon: "Send", isVisible: true },
        { id: "social-youtube", platform: "youtube", url: "https://youtube.com/@allvipcourses", icon: "Youtube", isVisible: true },
        { id: "social-whatsapp", platform: "whatsapp", url: "https://wa.me/8801969752197", icon: "MessageCircle", isVisible: true }
      ]
    },
    copyright: {
      enabled: true,
      text: "© {year} All Vip Courses. All rights reserved."
    }
  }
}

export default function DynamicFooter() {
  const [config, setConfig] = useState(DEFAULT_FOOTER_CONFIG)
  const [loading, setLoading] = useState(true)
  const { currentUser, isAdmin } = useAuth()
  const location = useLocation()
  
  useEffect(() => {
    loadFooterConfig()
  }, [location.pathname, currentUser])
  
  const loadFooterConfig = async () => {
    try {
      const userRole = currentUser ? (isAdmin ? 'admin' : 'user') : 'guest'
      const deviceType = window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile'
      
      console.log('🔍 Loading footer config from Firestore...')
      const footerConfig = await fetchActiveFooterConfig(location.pathname, userRole, deviceType)
      
      if (footerConfig) {
        console.log('✅ Firestore footer config loaded')
        setConfig(footerConfig)
      } else {
        console.log('⚠️ No Firestore footer config found, using default config')
        // Keep using DEFAULT_FOOTER_CONFIG (already set in state)
      }
    } catch (error) {
      console.error("❌ Error loading footer config:", error)
      // Keep using DEFAULT_FOOTER_CONFIG on error
    } finally {
      setLoading(false)
    }
  }
  
  // Show loading state briefly
  if (loading) {
    return <Footer />
  }
  
  const { content, styling } = config
  const currentYear = new Date().getFullYear()
  
  const columns = styling?.layout?.columns || { mobile: 1, tablet: 2, desktop: 4 }
  
  const gridColsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }
  
  const mobileClass = gridColsMap[columns.mobile] || 'grid-cols-1'
  const tabletClass = gridColsMap[columns.tablet] || 'grid-cols-2'
  const desktopClass = gridColsMap[columns.desktop] || 'grid-cols-4'
  

  return (
    <footer className="mt-auto relative overflow-hidden bg-[#050816] pt-1">
      {/* Premium Top Divider */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent blur-sm" />
      
      {/* Background Animated Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/50 to-[#050816] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(249,115,22,0.15) 0%, transparent 60%)' }} />

      <div className="container mx-auto px-5 sm:px-8 pt-12 pb-[140px] sm:pb-12 relative z-10">
        <div className={`grid ${mobileClass} md:${tabletClass} lg:${desktopClass} gap-10 sm:gap-12`}>
          
          {/* Brand Section */}
          {content?.brand?.enabled && (
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="inline-block relative mb-3 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-purple-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <h3 className="relative text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  All Vip <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Courses</span>
                </h3>
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4 inline-flex">
                <p className="text-[11px] sm:text-xs text-orange-400/90 font-medium tracking-wide">
                  Affordable HSC Academic & Admission Courses
                </p>
              </div>
              <p className="text-slate-400 text-[13px] sm:text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
                {content.brand.description}
              </p>
            </div>
          )}
          
          {/* Footer Sections */}
          {content?.sections?.map((section) => (
            <div key={section.id} className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h4 className="text-[15px] font-bold mb-5 text-white tracking-wide uppercase">
                {section.title}
              </h4>
              <div className="flex flex-col gap-2.5 w-full max-w-[240px] sm:max-w-none">
                {section.links?.filter(link => {
                  if (link.isVisible === false) return false
                  const lbl = (link.label || "").toLowerCase()
                  const url = (link.url || "").toLowerCase()
                  return !lbl.includes("announc") && !url.includes("announc")
                }).map((link) => {
                  const IconComponent = link.icon ? iconMap[link.icon] : null
                  
                  if (link.type === 'email' || link.type === 'phone') {
                    return (
                      <a
                        key={link.id}
                        href={link.type === 'email' ? `mailto:${link.value}` : `tel:${link.value}`}
                        className="group flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700/30 hover:border-orange-500/30 transition-all duration-300"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          {IconComponent ? <IconComponent className="w-4 h-4" /> : (link.type === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />)}
                        </div>
                        <span className="text-[13px] font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                          {link.label || link.value}
                        </span>
                      </a>
                    )
                  }
                  
                  const linkClass = "group flex items-center gap-2 py-2 text-slate-400 hover:text-white transition-all duration-300 relative justify-center sm:justify-start w-full"
                  const linkInner = (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300 absolute left-0 sm:relative sm:left-auto opacity-0 sm:opacity-100 group-hover:opacity-100" />
                      <span className="text-[14px] font-medium group-hover:translate-x-1 transition-transform duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{link.label}</span>
                    </>
                  )

                  if (link.type === 'external') {
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                        className={linkClass}
                      >
                        {linkInner}
                      </a>
                    )
                  }
                  
                  return (
                    <Link
                      key={link.id}
                      to={link.url}
                      className={linkClass}
                    >
                      {linkInner}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
          
          {/* Social Links */}
          {content?.socialLinks?.enabled && content?.socialLinks?.links?.length > 0 && (
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="text-[15px] font-bold mb-5 text-white tracking-wide uppercase">
                {content.socialLinks.title}
              </h4>
              <div className="flex gap-4">
                {content.socialLinks.links.filter(link => link.isVisible).map((link) => {
                  const IconComponent = iconMap[link.icon] || Send
                  
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group w-11 h-11 flex items-center justify-center rounded-2xl bg-[#111827]/80 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-5px_rgba(249,115,22,0.3)] overflow-hidden"
                      aria-label={link.platform}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <IconComponent className="w-5 h-5 text-slate-400 group-hover:text-white relative z-10 transition-colors duration-300 group-hover:scale-110" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Copyright Section */}
        {content?.copyright?.enabled && (
          <div className="mt-14 pt-6 border-t border-slate-800/60 flex justify-center relative">
            <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
            <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium tracking-wide text-center">
              {content.copyright.text.replace('{year}', currentYear)}
            </p>
          </div>
        )}
      </div>
    </footer>
  )

}
