import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

// Default Header Configuration based on current Header.jsx
export const createDefaultHeaderConfig = (userId) => ({
  id: "default",
  name: "Default Header",
  isActive: true,
  isPublished: true,
  content: {
    logo: {
      type: "text",
      text: "All Vip Courses",
      link: "/",
      alt: "All Vip Courses Logo",
      color: "text-primary"
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
  createdBy: userId,
  updatedBy: userId,
  revisions: []
})

// Default Footer Configuration based on current Footer.jsx
export const createDefaultFooterConfig = (userId) => ({
  id: "default",
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
            order: 0
          },
          {
            id: "contact-phone",
            label: "Phone",
            type: "phone",
            value: "+8801969752197",
            icon: "Phone",
            order: 1
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
      text: "© {year} All Vip Courses. All rights reserved.",
      links: []
    }
  },
  styling: {
    layout: {
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 4
      },
      gap: "2rem",
      padding: {
        top: "2rem",
        bottom: "2rem",
        left: "1rem",
        right: "1rem"
      }
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
  createdBy: userId,
  updatedBy: userId,
  revisions: []
})

// Fetch Active Header Configuration with conditional display logic
export const fetchActiveHeaderConfig = async (currentPath, userRole = 'guest', deviceType = 'desktop') => {
  try {
    // First try to get the default config directly
    const defaultDoc = await getDoc(doc(db, "headerConfigs", "default"))
    if (defaultDoc.exists()) {
      const defaultConfig = { id: defaultDoc.id, ...defaultDoc.data() }
      if (defaultConfig.isActive && defaultConfig.isPublished) {
        if (shouldDisplayConfig(defaultConfig, currentPath, userRole, deviceType)) {
          return defaultConfig
        }
        return defaultConfig // Return even if doesn't match rules as ultimate fallback
      }
    }
    
    // If default doesn't work, try querying (may need index)
    try {
      const q = query(
        collection(db, "headerConfigs"),
        where("isActive", "==", true),
        where("isPublished", "==", true)
      )
      
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const configs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.() || new Date(0)
            const bTime = b.updatedAt?.toDate?.() || new Date(0)
            return bTime - aTime
          })
        
        // Find the first config that matches display rules for current context
        const matchingConfig = configs.find(config => 
          shouldDisplayConfig(config, currentPath, userRole, deviceType)
        )
        
        if (matchingConfig) {
          return matchingConfig
        }
        
        // Fallback to first active config if no match
        return configs[0]
      }
    } catch (queryError) {
      console.error("Error querying header configs (may need index):", queryError)
      // Fall through to return null
    }
    
    return null
  } catch (error) {
    console.error("Error fetching header config:", error)
    return null
  }
}

// Fetch Active Footer Configuration with conditional display logic
export const fetchActiveFooterConfig = async (currentPath, userRole = 'guest', deviceType = 'desktop') => {
  try {
    // First try to get the default config directly
    const defaultDoc = await getDoc(doc(db, "footerConfigs", "default"))
    if (defaultDoc.exists()) {
      const defaultConfig = { id: defaultDoc.id, ...defaultDoc.data() }
      if (defaultConfig.isActive && defaultConfig.isPublished) {
        if (shouldDisplayConfig(defaultConfig, currentPath, userRole, deviceType)) {
          return defaultConfig
        }
        return defaultConfig // Return even if doesn't match rules as ultimate fallback
      }
    }
    
    // If default doesn't work, try querying (may need index)
    try {
      const q = query(
        collection(db, "footerConfigs"),
        where("isActive", "==", true),
        where("isPublished", "==", true)
      )
      
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const configs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.() || new Date(0)
            const bTime = b.updatedAt?.toDate?.() || new Date(0)
            return bTime - aTime
          })
        
        // Find the first config that matches display rules for current context
        const matchingConfig = configs.find(config => 
          shouldDisplayConfig(config, currentPath, userRole, deviceType)
        )
        
        if (matchingConfig) {
          return matchingConfig
        }
        
        // Fallback to first active config if no match
        return configs[0]
      }
    } catch (queryError) {
      console.error("Error querying footer configs (may need index):", queryError)
      // Fall through to return null
    }
    
    return null
  } catch (error) {
    console.error("Error fetching footer config:", error)
    return null
  }
}

// Save Header Configuration
export const saveHeaderConfig = async (config) => {
  try {
    const configRef = doc(db, "headerConfigs", config.id)
    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return { success: true }
  } catch (error) {
    console.error("Error saving header config:", error)
    return { success: false, error: error.message }
  }
}

// Save Footer Configuration
export const saveFooterConfig = async (config) => {
  try {
    const configRef = doc(db, "footerConfigs", config.id)
    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return { success: true }
  } catch (error) {
    console.error("Error saving footer config:", error)
    return { success: false, error: error.message }
  }
}

// Create Revision - saves complete snapshot including all configuration data
export const createRevision = async (configType, configId, currentConfig, userId, notes = "") => {
  try {
    const configRef = doc(db, `${configType}Configs`, configId)
    const configDoc = await getDoc(configRef)
    
    if (!configDoc.exists()) {
      throw new Error("Configuration not found")
    }
    
    const existingRevisions = configDoc.data().revisions || []
    const newVersion = (configDoc.data().version || 0) + 1
    
    // Create complete snapshot including content, styling, displayRules, and status
    // Note: Using new Date() instead of serverTimestamp() because serverTimestamp() 
    // is not supported inside arrays in Firestore
    const newRevision = {
      version: newVersion,
      content: currentConfig.content,
      styling: currentConfig.styling,
      displayRules: currentConfig.displayRules,
      isActive: currentConfig.isActive,
      isPublished: currentConfig.isPublished,
      updatedAt: new Date(),
      updatedBy: userId,
      notes
    }
    
    await updateDoc(configRef, {
      version: newVersion,
      revisions: [...existingRevisions, newRevision],
      updatedAt: serverTimestamp()
    })
    
    return { success: true, version: newVersion }
  } catch (error) {
    console.error("Error creating revision:", error)
    return { success: false, error: error.message }
  }
}

// Check if config matches current page and user
export const shouldDisplayConfig = (config, currentPath, userRole, deviceType) => {
  if (!config || !config.displayRules) return true
  
  const { pages, userRoles, devices } = config.displayRules
  
  // Check page rules
  if (pages.type === "specific" && !pages.pages.includes(currentPath)) {
    return false
  }
  if (pages.type === "exclude" && pages.pages.includes(currentPath)) {
    return false
  }
  
  // Check user role rules
  if (userRoles.type === "specific" && !userRoles.roles.includes(userRole)) {
    return false
  }
  
  // Check device rules
  if (deviceType === "mobile" && !devices.showOnMobile) return false
  if (deviceType === "tablet" && !devices.showOnTablet) return false
  if (deviceType === "desktop" && !devices.showOnDesktop) return false
  
  return true
}

// Initialize default site pages for internal link picker
export const initializeDefaultSitePages = async () => {
  const defaultPages = [
    { id: "page-home", title: "Home", slug: "/", type: "static", isVisible: true, order: 0 },
    { id: "page-courses", title: "Courses", slug: "/courses", type: "static", isVisible: true, order: 1 },
    { id: "page-community", title: "Community", slug: "/community", type: "static", isVisible: true, order: 2 },
    { id: "page-announcements", title: "Announcements", slug: "/announcements", type: "static", isVisible: true, order: 3 },
    { id: "page-my-courses", title: "My Courses", slug: "/my-courses", type: "static", isVisible: true, order: 4 },
    { id: "page-profile", title: "Profile", slug: "/profile", type: "static", isVisible: true, order: 5 },
    { id: "page-admin", title: "Admin Dashboard", slug: "/admin", type: "static", isVisible: true, order: 6 }
  ]
  
  try {
    for (const page of defaultPages) {
      const pageRef = doc(db, "sitePages", page.id)
      await setDoc(pageRef, {
        ...page,
        createdAt: serverTimestamp()
      }, { merge: true })
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error initializing site pages:", error)
    return { success: false, error: error.message }
  }
}

// Fetch all site pages for link picker
export const fetchSitePages = async () => {
  try {
    const q = query(collection(db, "sitePages"), orderBy("order", "asc"))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching site pages:", error)
    return []
  }
}
