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

export default function DynamicFooter() {
  const [config, setConfig] = useState(null)
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
      
      const footerConfig = await fetchActiveFooterConfig(location.pathname, userRole, deviceType)
      
      if (footerConfig) {
        setConfig(footerConfig)
      }
    } catch (error) {
      console.error("Error loading footer config:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Fallback to original Footer if no config or still loading
  if (loading || !config) {
    return <Footer />
  }
  
  const { content, styling } = config
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className={`${styling.colors.background} ${styling.effects.borderTop ? 'border-t' : ''} ${styling.colors.border} mt-auto`}>
      <div className={`${styling.layout.maxWidth === 'container' ? 'container' : ''} mx-auto px-${styling.layout.padding.left} py-${styling.layout.padding.top}`}>
        <div className={`grid grid-cols-1 md:grid-cols-${styling.layout.columns} gap-${styling.layout.gap}`}>
          {/* Brand Section */}
          {content.brand.enabled && (
            <div>
              <h3 className={`${styling.typography.headingFont} ${styling.typography.headingSize} ${styling.colors.headingText} bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4`}>
                {content.brand.text}
              </h3>
              <p className={`${styling.colors.text} ${styling.typography.linkSize}`}>
                {content.brand.description}
              </p>
            </div>
          )}
          
          {/* Footer Sections */}
          {content.sections.map((section) => (
            <div key={section.id}>
              <h4 className={`${styling.typography.headingFont} ${styling.typography.headingSize} ${styling.colors.headingText} mb-4`}>
                {section.title}
              </h4>
              <div className="flex flex-col gap-2">
                {section.links.filter(link => link.isVisible !== false).map((link) => {
                  const IconComponent = link.icon ? iconMap[link.icon] : null
                  
                  if (link.type === 'email') {
                    return (
                      <a
                        key={link.id}
                        href={`mailto:${link.value}`}
                        className={`${styling.colors.text} ${styling.colors.hoverText} transition-colors ${styling.typography.linkSize} flex items-center gap-2`}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {link.label || link.value}
                      </a>
                    )
                  }
                  
                  if (link.type === 'phone') {
                    return (
                      <a
                        key={link.id}
                        href={`tel:${link.value}`}
                        className={`${styling.colors.text} ${styling.colors.hoverText} transition-colors ${styling.typography.linkSize} flex items-center gap-2`}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
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
                        className={`${styling.colors.text} ${styling.colors.hoverText} transition-colors ${styling.typography.linkSize}`}
                      >
                        {link.label}
                      </a>
                    )
                  }
                  
                  return (
                    <Link
                      key={link.id}
                      to={link.url}
                      className={`${styling.colors.text} ${styling.colors.hoverText} transition-colors ${styling.typography.linkSize}`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
          
          {/* Social Links */}
          {content.socialLinks.enabled && content.socialLinks.links.length > 0 && (
            <div>
              <h4 className={`${styling.typography.headingFont} ${styling.typography.headingSize} ${styling.colors.headingText} mb-4`}>
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
                      className={`p-2 ${styling.colors.hoverText} transition-colors`}
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
        
        {/* Copyright */}
        {content.copyright.enabled && (
          <div className={`mt-8 pt-6 ${styling.effects.borderTop ? 'border-t' : ''} ${styling.colors.border} text-center ${styling.colors.text} ${styling.typography.linkSize}`}>
            {content.copyright.text.replace('{year}', currentYear)}
          </div>
        )}
        
        {/* Protected Developer Credit - Cannot be changed by admin */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {currentYear} All Vip Courses. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Developed by:{" "}
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
