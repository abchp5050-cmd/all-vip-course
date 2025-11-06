import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Mail, Phone, Send, Youtube, MessageCircle } from "lucide-react"
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
          { id: "link-community", label: "Community", type: "internal", url: "/community", isVisible: true },
          { id: "link-announcements", label: "Announcements", type: "internal", url: "/announcements", isVisible: true }
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
    <footer className="bg-card border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`grid ${mobileClass} md:${tabletClass} lg:${desktopClass} gap-10`}>
          {/* Brand Section */}
          {content?.brand?.enabled && (
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">
                {content.brand.text}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {content.brand.description}
              </p>
            </div>
          )}
          
          {/* Footer Sections */}
          {content?.sections?.map((section) => (
            <div key={section.id}>
              <h4 className="font-semibold mb-4 text-foreground">
                {section.title}
              </h4>
              <div className="flex flex-col gap-3">
                {section.links?.filter(link => link.isVisible !== false).map((link) => {
                  const IconComponent = link.icon ? iconMap[link.icon] : null
                  
                  if (link.type === 'email') {
                    return (
                      <a
                        key={link.id}
                        href={`mailto:${link.value}`}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
                      >
                        {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
                        <span className="break-all">{link.label || link.value}</span>
                      </a>
                    )
                  }
                  
                  if (link.type === 'phone') {
                    return (
                      <a
                        key={link.id}
                        href={`tel:${link.value}`}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
                      >
                        {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
                        {link.label || link.value}
                      </a>
                    )
                  }
                  
                  if (link.type === 'external') {
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    )
                  }
                  
                  return (
                    <Link
                      key={link.id}
                      to={link.url}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
          
          {/* Social Links */}
          {content?.socialLinks?.enabled && content?.socialLinks?.links?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 text-foreground">
                {content.socialLinks.title}
              </h4>
              <div className="flex gap-3">
                {content.socialLinks.links.filter(link => link.isVisible).map((link) => {
                  const IconComponent = iconMap[link.icon] || Send
                  
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-muted hover:bg-primary/20 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                      aria-label={link.platform}
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Copyright Section */}
        {content?.copyright?.enabled && (
          <div className="mt-10 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            {content.copyright.text.replace('{year}', currentYear)}
          </div>
        )}
        
        {/* Developer Credit */}
        <div className={`${content?.copyright?.enabled ? 'mt-6' : 'mt-10 pt-8 border-t border-border/50'}`}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Developed by{" "}
              <a 
                href="https://t.me/hermanoMayorBot" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Hermano Mayor
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
