import admin from 'firebase-admin'

// Initialize Firebase Admin without credentials for now (will use default)
// This bypasses Firestore security rules
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "all-vip-courses"
  })
}

const db = admin.firestore()

// Helper to convert timestamp
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp()

const defaultHeaderConfig = {
  name: "Default Header",
  isActive: true,
  isPublished: true,
  content: {
    logo: {
      type: "text",
      text: "All Vip Courses",
      link: "/",
      alt: "All Vip Courses Logo"
    },
    navigation: [
      {
        id: "nav-home",
        label: "Home",
        type: "internal",
        url: "/",
        order: 0,
        isVisible: true,
        openInNewTab: false,
        children: []
      },
      {
        id: "nav-courses",
        label: "Courses",
        type: "internal",
        url: "/courses",
        order: 1,
        isVisible: true,
        openInNewTab: false,
        children: []
      },
      {
        id: "nav-community",
        label: "Community",
        type: "internal",
        url: "/community",
        order: 2,
        isVisible: true,
        openInNewTab: false,
        children: []
      },
      {
        id: "nav-announcements",
        label: "Announcements",
        type: "internal",
        url: "/announcements",
        order: 3,
        isVisible: true,
        openInNewTab: false,
        children: []
      }
    ],
    elements: {
      showSearch: true,
      showThemeToggle: true,
      showUserMenu: true,
      showInstallButton: true,
      customButtons: []
    },
    mobileMenu: {
      enabled: true,
      position: "left",
      showIcons: true
    }
  },
  styling: {
    layout: {
      height: "auto",
      maxWidth: "container",
      padding: {
        top: "0.75rem",
        bottom: "0.75rem",
        left: "1rem",
        right: "1rem"
      },
      sticky: true,
      zIndex: 50
    },
    colors: {
      background: "bg-card",
      text: "text-foreground",
      border: "border-border",
      hoverBackground: "hover:bg-accent",
      hoverText: "hover:text-accent-foreground"
    },
    typography: {
      logoFont: "font-bold",
      logoSize: "text-xl",
      navFont: "font-medium",
      navSize: "text-sm"
    },
    effects: {
      shadow: "shadow-sm",
      borderRadius: "rounded-none",
      animation: "fade-in"
    }
  },
  displayRules: {
    pages: {
      type: "all",
      pages: []
    },
    userRoles: {
      type: "all",
      roles: []
    },
    devices: {
      showOnMobile: true,
      showOnTablet: true,
      showOnDesktop: true
    }
  },
  version: 1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "system",
  updatedBy: "system",
  revisions: []
}

const defaultFooterConfig = {
  name: "Default Footer",
  isActive: true,
  isPublished: true,
  content: {
    brand: {
      enabled: true,
      type: "text",
      text: "All Vip Courses",
      description: "HSC academic & admission courses at low price.",
      order: 0
    },
    sections: [
      {
        id: "section-quick-links",
        title: "Quick Links",
        order: 1,
        links: [
          {
            id: "link-home",
            label: "Home",
            type: "internal",
            url: "/",
            order: 0,
            isVisible: true,
            openInNewTab: false
          },
          {
            id: "link-courses",
            label: "Courses",
            type: "internal",
            url: "/courses",
            order: 1,
            isVisible: true,
            openInNewTab: false
          },
          {
            id: "link-community",
            label: "Community",
            type: "internal",
            url: "/community",
            order: 2,
            isVisible: true,
            openInNewTab: false
          },
          {
            id: "link-announcements",
            label: "Announcements",
            type: "internal",
            url: "/announcements",
            order: 3,
            isVisible: true,
            openInNewTab: false
          }
        ]
      },
      {
        id: "section-contact",
        title: "Contact",
        order: 2,
        links: [
          {
            id: "contact-email",
            label: "Email",
            type: "email",
            value: "easyeducation556644@gmail.com",
            icon: "Mail",
            order: 0,
            isVisible: true
          },
          {
            id: "contact-phone",
            label: "Phone",
            type: "phone",
            value: "+8801969752197",
            icon: "Phone",
            order: 1,
            isVisible: true
          }
        ]
      }
    ],
    socialLinks: {
      enabled: true,
      title: "Connect",
      order: 3,
      links: [
        {
          id: "social-telegram",
          platform: "telegram",
          url: "https://t.me/Chatbox67_bot",
          icon: "Send",
          order: 0,
          isVisible: true
        },
        {
          id: "social-youtube",
          platform: "youtube",
          url: "https://youtube.com/@allvipcourses",
          icon: "Youtube",
          order: 1,
          isVisible: true
        },
        {
          id: "social-whatsapp",
          platform: "whatsapp",
          url: "https://wa.me/8801969752197",
          icon: "MessageCircle",
          order: 2,
          isVisible: true
        }
      ]
    },
    copyright: {
      enabled: true,
      text: "© {year} All Vip Courses. All rights reserved."
    }
  },
  styling: {
    layout: {
      maxWidth: "container",
      padding: {
        top: "3rem",
        bottom: "2rem",
        left: "1rem",
        right: "1rem"
      },
      columns: 4,
      gap: "2rem"
    },
    colors: {
      background: "bg-card",
      text: "text-muted-foreground",
      headingText: "text-foreground",
      border: "border-border",
      hoverText: "hover:text-primary"
    },
    typography: {
      headingFont: "font-semibold",
      headingSize: "text-base",
      linkFont: "font-normal",
      linkSize: "text-sm"
    },
    effects: {
      borderTop: true,
      shadow: "none"
    }
  },
  displayRules: {
    pages: {
      type: "all",
      pages: []
    },
    userRoles: {
      type: "all",
      roles: []
    },
    devices: {
      showOnMobile: true,
      showOnTablet: true,
      showOnDesktop: true
    }
  },
  version: 1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "system",
  updatedBy: "system",
  revisions: []
}

async function initConfigs() {
  try {
    console.log('🔧 Initializing header and footer configs in Firestore...')
    
    await setDoc(doc(db, 'headerConfigs', 'default'), defaultHeaderConfig)
    console.log('✅ Default header config created')
    
    await setDoc(doc(db, 'footerConfigs', 'default'), defaultFooterConfig)
    console.log('✅ Default footer config created')
    
    console.log('🎉 All configs initialized successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error initializing configs:', error)
    process.exit(1)
  }
}

initConfigs()
