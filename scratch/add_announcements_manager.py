import os

with open("src/pages/admin/WebsiteSettings.jsx", "r") as f:
    content = f.read()

import_statement = """import { Settings, Save, AlertCircle, Bell, BellOff, CheckCircle, Upload, Smartphone, Loader2, Megaphone, Plus, Trash2, GripVertical } from "lucide-react" """
content = content.replace(
    'import { Settings, Save, AlertCircle, Bell, BellOff, CheckCircle, Upload, Smartphone, Loader2 } from "lucide-react"',
    import_statement
)

announcement_state = """
  const [announcements, setAnnouncements] = useState({
    enabled: true,
    items: []
  })
"""
content = content.replace(
    "const [uploadingLogo, setUploadingLogo] = useState(false)",
    "const [uploadingLogo, setUploadingLogo] = useState(false)" + announcement_state
)

fetch_logic = """
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
          }
"""

# Replace fetch logic properly
content = content.replace("""          } else if (data.type === "pwa") {
            settingsData.appName = data.appName || "All Vip Courses"
            settingsData.appShortName = data.appShortName || "AllVipCrs"
            settingsData.appIcon = data.appIcon || ""
            settingsData.appLogo = data.appLogo || ""
            settingsData.themeColor = data.themeColor || "#0ea5e9"
            settingsData.backgroundColor = data.backgroundColor || "#ffffff"
          }""", fetch_logic)


save_logic = """
      await setDoc(doc(settingsRef, "general"), { type: "general", siteName: settings.siteName, siteDescription: settings.siteDescription, communityEnabled: settings.communityEnabled, updatedAt: serverTimestamp() })
      await setDoc(doc(settingsRef, "payment"), { type: "payment", instructions: settings.paymentInstructions, updatedAt: serverTimestamp() })
      await setDoc(doc(settingsRef, "pwa"), { type: "pwa", appName: settings.appName, appShortName: settings.appShortName, appIcon: settings.appIcon, appLogo: settings.appLogo, themeColor: settings.themeColor, backgroundColor: settings.backgroundColor, updatedAt: serverTimestamp() })
      await setDoc(doc(settingsRef, "announcements"), { type: "announcements", enabled: announcements.enabled, items: announcements.items, updatedAt: serverTimestamp() })
"""

content = content.replace("""      await setDoc(doc(settingsRef, "general"), {
        type: "general",
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        communityEnabled: settings.communityEnabled,
        updatedAt: serverTimestamp()
      })

      await setDoc(doc(settingsRef, "payment"), {
        type: "payment",
        instructions: settings.paymentInstructions,
        updatedAt: serverTimestamp()
      })

      await setDoc(doc(settingsRef, "pwa"), {
        type: "pwa",
        appName: settings.appName,
        appShortName: settings.appShortName,
        appIcon: settings.appIcon,
        appLogo: settings.appLogo,
        themeColor: settings.themeColor,
        backgroundColor: settings.backgroundColor,
        updatedAt: serverTimestamp()
      })""", save_logic)


add_announcement_fn = """
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
"""

content = content.replace("const handleIconUpload = async (e) => {", add_announcement_fn + "\n  const handleIconUpload = async (e) => {")

announcement_ui = """
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
"""

content = content.replace("{/* Payment Settings */}", announcement_ui + "\n        {/* Payment Settings */}")

with open("src/pages/admin/WebsiteSettings.jsx", "w") as f:
    f.write(content)

