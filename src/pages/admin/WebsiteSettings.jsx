"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings, Save, AlertCircle, Bell, BellOff, CheckCircle, Upload, Smartphone, Loader2, Megaphone, Plus, Trash2, GripVertical, HelpCircle, ChevronUp, ChevronDown as ChevronDownIcon, Eye, EyeOff, MessageSquare } from "lucide-react" 
import { collection, getDocs, query, where, updateDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import { saveAdminFCMToken } from "../../lib/notifications"
import { requestNotificationPermission } from "../../lib/pwa"
import { uploadImageToImgBB } from "../../lib/imgbb"

export default function WebsiteSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [notificationStatus, setNotificationStatus] = useState('default')
  const [enablingNotifications, setEnablingNotifications] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [announcements, setAnnouncements] = useState({
    enabled: true,
    items: []
  })

  // FAQ State
  const [faqSettings, setFaqSettings] = useState({
    enabled: true,
    badgeText: "✨ FAQ / সাধারণ জিজ্ঞাসা",
    title: "সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ",
    subtitle: "কোর্স কেনা, পেমেন্ট ও টেলিগ্রাম গ্রুপ অ্যাক্সেস সংক্রান্ত সকল প্রশ্নের তাত্ক্ষণিক সমাধান।",
    supportUrl: "https://t.me/allvipcourses",
    items: []
  })
  const [faqDocId, setFaqDocId] = useState(null)
  const [savingFaq, setSavingFaq] = useState(false)
  const [faqSuccessMessage, setFaqSuccessMessage] = useState("")
  const [faqExpanded, setFaqExpanded] = useState(null) // which FAQ card is expanded in editor


  const [settings, setSettings] = useState({
    communityEnabled: true,
    siteName: "All Vip Courses",
    siteDescription: "Learn from the best educators",
    appName: "All Vip Courses",
    appShortName: "AllVipCrs",
    appIcon: "",
    appLogo: "",
    themeColor: "#0ea5e9",
    backgroundColor: "#ffffff",
  })

  useEffect(() => {
    fetchSettings()
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = () => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission)
    }
  }

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true)
    setErrorMessage("")
    
    try {
      const permission = await requestNotificationPermission()
      
      if (!permission) {
        setErrorMessage("Notification permission denied. Please enable notifications in your browser settings.")
        setNotificationStatus('denied')
        return
      }

      const userId = auth.currentUser?.uid
      if (!userId) {
        setErrorMessage("You must be logged in to enable notifications")
        return
      }

      const token = await saveAdminFCMToken(userId)
      
      if (token) {
        setSuccessMessage("Push notifications enabled successfully!")
        setNotificationStatus('granted')
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrorMessage("Failed to get notification token. Please try again.")
      }
    } catch (error) {
      console.error("Error enabling notifications:", error)
      setErrorMessage("Failed to enable notifications. Check console for details.")
    } finally {
      setEnablingNotifications(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const settingsRef = collection(db, "settings")
      const snapshot = await getDocs(settingsRef)

      if (!snapshot.empty) {
        const settingsData = {}
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.type === "general") {
            settingsData.siteName = data.siteName || "All Vip Courses"
            settingsData.siteDescription = data.siteDescription || "Learn from the best educators"
            settingsData.communityEnabled = data.communityEnabled !== false
          } else if (data.type === "pwa") {
            settingsData.appName = data.appName || "All Vip Courses"
            settingsData.appShortName = data.appShortName || "AllVipCrs"
            settingsData.appIcon = data.appIcon || ""
            settingsData.appLogo = data.appLogo || ""
            settingsData.themeColor = data.themeColor || "#0ea5e9"
            settingsData.backgroundColor = data.backgroundColor || "#ffffff"
          } else if (data.type === "announcements") {
            setAnnouncements({
              enabled: data.enabled !== false,
              items: data.items || []
            })
          } else if (data.type === "faqs") {
            setFaqDocId(doc.id)
            setFaqSettings({
              enabled: data.enabled !== false,
              badgeText: data.badgeText || "✨ FAQ / সাধারণ জিজ্ঞাসা",
              title: data.title || "সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ",
              subtitle: data.subtitle || "কোর্স কেনা, পেমেন্ট ও টেলিগ্রাম গ্রুপ অ্যাক্সেস সংক্রান্ত সকল প্রশ্নের তাত্ক্ষণিক সমাধান।",
              supportUrl: data.supportUrl || "https://t.me/allvipcourses",
              items: data.items || []
            })
          }
        })
        setSettings((prev) => ({ ...prev, ...settingsData }))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setErrorMessage("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  
  const addAnnouncement = () => {
    setAnnouncements(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), text: "", order: prev.items.length }]
    }))
  }

  const updateAnnouncement = (index, text) => {
    const newItems = [...announcements.items]
    newItems[index].text = text
    setAnnouncements({ ...announcements, items: newItems })
  }

  const removeAnnouncement = (index) => {
    const newItems = announcements.items.filter((_, i) => i !== index)
    setAnnouncements({ ...announcements, items: newItems })
  }

  // ── FAQ Handlers ──────────────────────────────────────────────────────────
  const DEFAULT_FAQ_ITEMS = [
    { id: "faq-1", question: "পেমেন্ট করার কতক্ষণ পর কোর্সের অ্যাক্সেস ও টেলিগ্রাম গ্রুপ লিংক পাব?", answer: "পেমেন্ট সম্পন্ন করে অর্ডার সাবমিট করার সাথে সাথে আমাদের টিম ভেরিফাই করে দ্রুত আপনার অর্ডার Approve করে দেবে। Approve হওয়া মাত্রই ওয়েবসাইটের \"My Courses\" পেজে আপনার প্রাইভেট টেলিগ্রাম গ্রুপ ও চ্যানেলের জয়েন বাটন আনলক হয়ে যাবে।", order: 0 },
    { id: "faq-2", question: "কোর্সের মেয়াদ কতদিন থাকবে? (Course Validity)", answer: "আমাদের যেকোনো কোর্সে একবার এনরোল করলে সেটির মেয়াদ আজীবন (Lifetime Access) থাকবে! আপনি যেকোনো সময় সব ক্লাস, ভিডিও এবং লেকচার শিট আনলিমিটেড বার দেখতে পারবেন।", order: 1 },
    { id: "faq-3", question: "টেলিগ্রাম প্রাইভেট গ্রুপ বা চ্যানেলে জয়েন করার নিয়ম কী?", answer: "প্রথমে আপনার ফোনে বা পিসিতে Telegram অ্যাপটি ইনস্টল ও লগইন করা থাকতে হবে। এরপর ওয়েবসাইটের \"My Courses\" সেকশনে গিয়ে কোর্সের নিচে থাকা বাটনে ক্লিক করলেই জয়েন হয়ে যাবেন।", order: 2 },
    { id: "faq-4", question: "কোর্সের ক্লাস, ভিডিও এবং লেকচার শিটগুলো কীভাবে সাজানো থাকে?", answer: "আমাদের প্রতিটি প্রাইভেট টেলিগ্রাম চ্যানেলে অধ্যায় ও টপিক অনুযায়ী (Cycle / Chapter wise) সব রেকর্ডেড এইচডি ক্লাস, লেকচার পিডিএফ এবং প্র্যাকটিস শিট পিন করে সুন্দরভাবে সাজানো থাকে।", order: 3 },
    { id: "faq-5", question: "আমি কীভাবে পেমেন্ট করব এবং প্রোমো কোড কীভাবে ব্যবহার করব?", answer: "আপনার পছন্দের কোর্সের \"Buy Now\" বাটনে ক্লিক করে চেকআউট পেজে যান। সেখানে বিকাশ বা নগদ নাম্বারে Send Money করে ফর্ম সাবমিট করুন। ডিসকাউন্ট কোড থাকলে \"Have a Promo Code?\" বক্সে লিখে Apply করুন।", order: 4 },
  ]

  const addFaqItem = () => {
    const newItem = {
      id: `faq-${Date.now()}`,
      question: "",
      answer: "",
      order: faqSettings.items.length
    }
    setFaqSettings(prev => ({ ...prev, items: [...prev.items, newItem] }))
    setFaqExpanded(newItem.id)
  }

  const updateFaqItem = (id, field, value) => {
    setFaqSettings(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }))
  }

  const removeFaqItem = (id) => {
    setFaqSettings(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id).map((item, i) => ({ ...item, order: i }))
    }))
    if (faqExpanded === id) setFaqExpanded(null)
  }

  const moveFaqItem = (index, direction) => {
    const items = [...faqSettings.items]
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    setFaqSettings(prev => ({ ...prev, items: items.map((item, i) => ({ ...item, order: i })) }))
  }

  const handleSaveFaqs = async () => {
    setSavingFaq(true)
    setFaqSuccessMessage("")
    try {
      const payload = {
        type: "faqs",
        enabled: faqSettings.enabled,
        badgeText: faqSettings.badgeText,
        title: faqSettings.title,
        subtitle: faqSettings.subtitle,
        supportUrl: faqSettings.supportUrl,
        items: faqSettings.items.length > 0 ? faqSettings.items : DEFAULT_FAQ_ITEMS,
        updatedAt: serverTimestamp(),
      }
      if (faqDocId) {
        await updateDoc(doc(db, "settings", faqDocId), payload)
      } else {
        const { addDoc } = await import("firebase/firestore")
        const newRef = await addDoc(collection(db, "settings"), payload)
        setFaqDocId(newRef.id)
      }
      setFaqSuccessMessage("✅ FAQ Settings saved successfully!")
      setTimeout(() => setFaqSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Error saving FAQ settings:", err)
      setFaqSuccessMessage("❌ Failed to save. Please try again.")
    } finally {
      setSavingFaq(false)
    }
  }

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIcon(true)
    setErrorMessage("")
    
    try {
      const imageUrl = await uploadImageToImgBB(file)
      setSettings({ ...settings, appIcon: imageUrl })
      setSuccessMessage("App icon uploaded successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error uploading app icon:", error)
      setErrorMessage("Failed to upload app icon. Please try again.")
    } finally {
      setUploadingIcon(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setErrorMessage("")
    
    try {
      const imageUrl = await uploadImageToImgBB(file)
      setSettings({ ...settings, appLogo: imageUrl })
      setSuccessMessage("App logo uploaded successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error uploading app logo:", error)
      setErrorMessage("Failed to upload app logo. Please try again.")
    } finally {
      setUploadingLogo(false)
    }
  }

  

  const handleSave = async () => {

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const generalSettingsRef = query(collection(db, "settings"), where("type", "==", "general"))
      const generalSnapshot = await getDocs(generalSettingsRef)

      const generalData = {
        type: "general",
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        communityEnabled: settings.communityEnabled,
        updatedAt: serverTimestamp(),
      }

      if (!generalSnapshot.empty) {
        await updateDoc(doc(db, "settings", generalSnapshot.docs[0].id), generalData)
      } else {
        await setDoc(doc(collection(db, "settings")), generalData)
      }


      const pwaSettingsRef = query(collection(db, "settings"), where("type", "==", "pwa"))
      const pwaSnapshot = await getDocs(pwaSettingsRef)

      const pwaData = {
        type: "pwa",
        appName: settings.appName,
        appShortName: settings.appShortName,
        appIcon: settings.appIcon,
        appLogo: settings.appLogo,
        themeColor: settings.themeColor,
        backgroundColor: settings.backgroundColor,
        updatedAt: serverTimestamp(),
      }

      if (!pwaSnapshot.empty) {
        await updateDoc(doc(db, "settings", pwaSnapshot.docs[0].id), pwaData)
      } else {
        await setDoc(doc(collection(db, "settings")), pwaData)
      }

      setSuccessMessage("Settings saved successfully! Please reload the page to see PWA changes take effect.")
      
      if (settings.appIcon || settings.appLogo || settings.appName || settings.themeColor) {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Website Settings
        </h1>
        <p className="text-muted-foreground">Configure your platform settings</p>
      </motion.div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {successMessage}
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* General Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Community Page</h3>
                <p className="text-sm text-muted-foreground">Enable or disable the community page for users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.communityEnabled}
                  onChange={(e) => setSettings({ ...settings, communityEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-start gap-3 mb-3">
                {notificationStatus === 'granted' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : notificationStatus === 'denied' ? (
                  <BellOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Bell className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Admin Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enable push notifications to receive alerts for new payments, user registrations, and important updates
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium">Status:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      notificationStatus === 'granted' 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                        : notificationStatus === 'denied'
                        ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                        : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                    }`}>
                      {notificationStatus === 'granted' ? 'Enabled' : notificationStatus === 'denied' ? 'Blocked' : 'Not enabled'}
                    </span>
                  </div>
                  {notificationStatus !== 'granted' && (
                    <button
                      onClick={handleEnableNotifications}
                      disabled={enablingNotifications}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      {enablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                    </button>
                  )}
                  {notificationStatus === 'granted' && (
                    <p className="text-xs text-green-600 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      You'll receive push notifications for important updates
                    </p>
                  )}
                </div>
              </div>
              {notificationStatus === 'denied' && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-600">
                    <strong>Notifications blocked:</strong> To enable notifications, please allow them in your browser settings for this site.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PWA Configuration */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">App Configuration (PWA)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Configure how your platform appears when installed as an app on mobile devices
          </p>
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> After changing app icon, logo, or name, the page will automatically reload. Users may need to reinstall the app to see the new icon on their home screen.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">App Name</label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                  placeholder="All Vip Courses"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                />
                <p className="text-xs text-muted-foreground mt-1">Full name displayed in the app</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">App Short Name</label>
                <input
                  type="text"
                  value={settings.appShortName}
                  onChange={(e) => setSettings({ ...settings, appShortName: e.target.value })}
                  placeholder="EasyEdu"
                  maxLength={12}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                />
                <p className="text-xs text-muted-foreground mt-1">Short name for home screen (max 12 characters)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.themeColor}
                    onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                    placeholder="#0ea5e9"
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Browser toolbar color on mobile</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Splash screen background color</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">App Icon (512x512 recommended)</label>
                <div className="space-y-2">
                  {settings.appIcon && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <img 
                        src={settings.appIcon} 
                        alt="App Icon" 
                        loading="lazy"
                        decoding="async"
                        width="64"
                        height="64"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-16 h-16 rounded-lg object-cover border border-border"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Current app icon</p>
                      </div>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer border border-border">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                      disabled={uploadingIcon}
                    />
                    {uploadingIcon ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload Icon</span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for app icon on home screen</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">App Logo (any size)</label>
                <div className="space-y-2">
                  {settings.appLogo && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <img 
                        src={settings.appLogo} 
                        alt="App Logo" 
                        loading="lazy"
                        decoding="async"
                        width="64"
                        height="64"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-16 h-16 rounded-lg object-contain border border-border bg-white"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Current app logo</p>
                      </div>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer border border-border">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload Logo</span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for splash screen and branding</p>
              </div>
            </div>
          </div>
        </div>

        
        {/* Announcement Bar Settings */}
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              Announcement Manager
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Enable Bar</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={announcements.enabled}
                  onChange={(e) => setAnnouncements({ ...announcements, enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-4">
            {announcements.items.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-border shadow-sm">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab shrink-0" />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateAnnouncement(index, e.target.value)}
                      placeholder="e.g. 🔥 HSC-27 All Courses Available Now | Special Offer চলছে"
                      className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0 p-0"
                    />
                    <button 
                      onClick={() => removeAnnouncement(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={addAnnouncement}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Announcement
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Announcements will rotate automatically every 5 seconds on the frontend header.
          </p>
        </div>

        {/* ── FAQ MANAGER SECTION ─────────────────────────────────────── */}
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              Homepage FAQ Manager
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Show FAQ Section</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={faqSettings.enabled}
                  onChange={(e) => setFaqSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Section Text Config */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-4 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Section Header</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Badge Label</label>
                <input
                  type="text"
                  value={faqSettings.badgeText}
                  onChange={(e) => setFaqSettings(prev => ({ ...prev, badgeText: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="✨ FAQ / সাধারণ জিজ্ঞাসা"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Support Telegram URL</label>
                <input
                  type="url"
                  value={faqSettings.supportUrl}
                  onChange={(e) => setFaqSettings(prev => ({ ...prev, supportUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                  placeholder="https://t.me/allvipcourses"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Section Heading</label>
              <input
                type="text"
                value={faqSettings.title}
                onChange={(e) => setFaqSettings(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Subtitle / Description</label>
              <input
                type="text"
                value={faqSettings.subtitle}
                onChange={(e) => setFaqSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="Section subtitle text..."
              />
            </div>
          </div>

          {/* FAQ Items List */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                FAQ Items ({faqSettings.items.length === 0 ? "Using defaults" : `${faqSettings.items.length} custom`})
              </h3>
              {faqSettings.items.length === 0 && (
                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                  5 built-in defaults active
                </span>
              )}
            </div>

            {faqSettings.items.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm mb-1">No custom FAQs yet.</p>
                <p className="text-xs text-muted-foreground">The 5 built-in default FAQs are shown on the homepage. Click below to customise them.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {faqSettings.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-950 border border-border rounded-xl overflow-hidden shadow-sm"
                  >
                    {/* FAQ Item Header */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveFaqItem(index, -1)}
                          disabled={index === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFaqItem(index, 1)}
                          disabled={index === faqSettings.items.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => setFaqExpanded(faqExpanded === item.id ? null : item.id)}
                        className="flex-1 text-left text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2"
                      >
                        {item.question || <span className="italic text-slate-400">Untitled question...</span>}
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setFaqExpanded(faqExpanded === item.id ? null : item.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                          title={faqExpanded === item.id ? "Collapse" : "Expand to edit"}
                        >
                          {faqExpanded === item.id ? <ChevronUp className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Edit Area */}
                    {faqExpanded === item.id && (
                      <div className="border-t border-border px-3 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Question</label>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => updateFaqItem(item.id, "question", e.target.value)}
                            placeholder="প্রশ্নটি এখানে লিখুন..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Answer</label>
                          <textarea
                            value={item.answer}
                            onChange={(e) => updateFaqItem(item.id, "answer", e.target.value)}
                            placeholder="উত্তরটি এখানে লিখুন..."
                            rows={4}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-y"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={addFaqItem}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add FAQ Item
              </button>
              {faqSettings.items.length === 0 && (
                <button
                  type="button"
                  onClick={() => setFaqSettings(prev => ({ ...prev, items: DEFAULT_FAQ_ITEMS }))}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Load Defaults to Edit
                </button>
              )}
            </div>
          </div>

          {faqSuccessMessage && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${faqSuccessMessage.startsWith("✅") ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
              {faqSuccessMessage}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleSaveFaqs}
              disabled={savingFaq}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {savingFaq ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving FAQ...</>
              ) : (
                <><Save className="w-4 h-4" /> Save FAQ Settings</>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Changes are live immediately on the homepage. If no custom FAQs are added, the 5 default built-in FAQs will be displayed automatically.
          </p>
        </div>

{/* Save Button */}
        <div className="border-t border-border pt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 font-medium smooth-transition"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
