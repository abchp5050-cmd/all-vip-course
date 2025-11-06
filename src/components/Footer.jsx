import { Link } from "react-router-dom"
import { Send, Youtube, MessageCircle, Mail, Phone } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              All Vip Courses
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              HSC academic & admission courses at low price.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </Link>
              <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Courses
              </Link>
              <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Community 
              </Link>
              <Link to="/announcements" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Announcements
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contact</h4>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:easyeducation556644@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="break-all">easyeducation556644@gmail.com</span>
              </a>
              <a
                href="tel:+8801969752197"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                +8801969752197
              </a>
              <a
                href="https://t.me/Chatbox67_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                Support Bot
              </a>
              <a
                href="https://t.me/eesupport01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4 flex-shrink-0" />
                Support ID
              </a>
              <a
                href="https://t.me/Easy_Education_01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4 flex-shrink-0" />
                Telegram
              </a>
            </div>
          </div>
          
          {/* Follow Us */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Follow Us</h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://youtube.com/@easyeducation19"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Youtube className="w-4 h-4 flex-shrink-0" />
                YouTube 01
              </a>
              <a
                href="https://youtube.com/@easyeducation-01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Youtube className="w-4 h-4 flex-shrink-0" />
                YouTube 02
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All Vip Courses. All rights reserved.
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
