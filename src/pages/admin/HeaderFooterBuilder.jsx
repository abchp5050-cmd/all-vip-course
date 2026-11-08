import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Button } from "../../components/ui/button"
import { 
  Save, 
  Eye, 
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Search,
  Moon,
  User,
  ExternalLink,
  Layers,
  CheckCircle2,
  Send
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import {
  createDefaultHeaderConfig,
  createDefaultFooterConfig,
  fetchActiveHeaderConfig,
  fetchActiveFooterConfig,
  saveHeaderConfig,
  saveFooterConfig,
  createRevision,
  initializeDefaultSitePages,
  fetchSitePages
} from "../../lib/headerFooterUtils"
import HeaderContentEditor from "./builder/HeaderContentEditor"
import FooterContentEditor from "./builder/FooterContentEditor"
import StylingPanel from "./builder/StylingPanel"
import DisplayRulesPanel from "./builder/DisplayRulesPanel"
import PreviewPanel from "./builder/PreviewPanel"

export default function HeaderFooterBuilder() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("header")
  const [viewMode, setViewMode] = useState("edit") // 'edit' or 'preview'
  const [devicePreview, setDevicePreview] = useState("desktop") // 'desktop', 'tablet', 'mobile'
  
  // Header state
  const [headerConfig, setHeaderConfig] = useState(null)
  const [headerLoading, setHeaderLoading] = useState(true)
  
  // Footer state
  const [footerConfig, setFooterConfig] = useState(null)
  const [footerLoading, setFooterLoading] = useState(true)
  
  // Site pages for link picker
  const [sitePages, setSitePages] = useState([])
  
  // Save state
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadConfigurations()
    loadSitePages()
  }, [])
  
  const loadConfigurations = async () => {
    try {
      setHeaderLoading(true)
      let header = await fetchActiveHeaderConfig()
      if (!header && currentUser) {
        header = createDefaultHeaderConfig(currentUser.uid)
        await saveHeaderConfig(header)
      }
      setHeaderConfig(header)
      setHeaderLoading(false)
      
      setFooterLoading(true)
      let footer = await fetchActiveFooterConfig()
      if (!footer && currentUser) {
        footer = createDefaultFooterConfig(currentUser.uid)
        await saveFooterConfig(footer)
      }
      setFooterConfig(footer)
      setFooterLoading(false)
    } catch (error) {
      console.error("Error loading configurations:", error)
      toast.error("কনফিগারেশন লোড করা সম্ভব হয়নি")
      setHeaderLoading(false)
      setFooterLoading(false)
    }
  }
  
  const loadSitePages = async () => {
    try {
      await initializeDefaultSitePages()
      const pages = await fetchSitePages()
      setSitePages(pages)
    } catch (error) {
      console.error("Error loading site pages:", error)
    }
  }
  
  const handleSaveHeader = async (createNewRevision = false) => {
    if (!headerConfig || !currentUser) return
    
    setSaving(true)
    try {
      if (createNewRevision) {
        await createRevision("header", headerConfig.id, headerConfig, currentUser.uid, "Manual draft save")
      }
      
      const result = await saveHeaderConfig({
        ...headerConfig,
        updatedBy: currentUser.uid
      })
      
      if (result.success) {
        toast.success("হেডার ড্রাফট সফলভাবে সংরক্ষণ করা হয়েছে!")
      } else {
        toast.error(result.error || "হেডার সংরক্ষণ করতে সমস্যা হয়েছে")
      }
    } catch (error) {
      console.error("Error saving header:", error)
      toast.error("হেডার ড্রাফট সেভ ব্যর্থ হয়েছে")
    } finally {
      setSaving(false)
    }
  }
  
  const handleSaveFooter = async (createNewRevision = false) => {
    if (!footerConfig || !currentUser) return
    
    setSaving(true)
    try {
      if (createNewRevision) {
        await createRevision("footer", footerConfig.id, footerConfig, currentUser.uid, "Manual draft save")
      }
      
      const result = await saveFooterConfig({
        ...footerConfig,
        updatedBy: currentUser.uid
      })
      
      if (result.success) {
        toast.success("ফুটার ড্রাফট সফলভাবে সংরক্ষণ করা হয়েছে!")
      } else {
        toast.error(result.error || "ফুটার সংরক্ষণ করতে সমস্যা হয়েছে")
      }
    } catch (error) {
      console.error("Error saving footer:", error)
      toast.error("ফুটার ড্রাফট সেভ ব্যর্থ হয়েছে")
    } finally {
      setSaving(false)
    }
  }
  
  const handlePublishHeader = async () => {
    if (!headerConfig || !currentUser) return
    
    setSaving(true)
    try {
      const updatedConfig = {
        ...headerConfig,
        isPublished: true,
        updatedBy: currentUser.uid
      }
      
      await createRevision("header", headerConfig.id, updatedConfig, currentUser.uid, "Published")
      const result = await saveHeaderConfig(updatedConfig)
      
      if (result.success) {
        setHeaderConfig(updatedConfig)
        toast.success("হেডার সফলভাবে লাইভ পাবলিশ করা হয়েছে!")
      } else {
        toast.error(result.error || "পাবলিশ করতে সমস্যা হয়েছে")
      }
    } catch (error) {
      console.error("Error publishing header:", error)
      toast.error("হেডার পাবলিশ ব্যর্থ হয়েছে")
    } finally {
      setSaving(false)
    }
  }
  
  const handlePublishFooter = async () => {
    if (!footerConfig || !currentUser) return
    
    setSaving(true)
    try {
      const updatedConfig = {
        ...footerConfig,
        isPublished: true,
        updatedBy: currentUser.uid
      }
      
      await createRevision("footer", footerConfig.id, updatedConfig, currentUser.uid, "Published")
      const result = await saveFooterConfig(updatedConfig)
      
      if (result.success) {
        setFooterConfig(updatedConfig)
        toast.success("ফুটার সফলভাবে লাইভ পাবলিশ করা হয়েছে!")
      } else {
        toast.error(result.error || "পাবলিশ করতে সমস্যা হয়েছে")
      }
    } catch (error) {
      console.error("Error publishing footer:", error)
      toast.error("ফুটার পাবলিশ ব্যর্থ হয়েছে")
    } finally {
      setSaving(false)
    }
  }
  
  if (headerLoading || footerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">কনফিগারেশন লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 pt-3 pb-12">
      {/* Page Title & View Mode Toggle with Ample Navbar Clearance */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/70 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Header & Footer Builder (হেডার ও ফুটার)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            কোনো কোডিং ছাড়াই ড্রপডাউন ও সুইচের সাহায্যে ওয়েবসাইটের হেডার ও ফুটার সাজান।
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border self-stretch sm:self-auto justify-end">
          <Button
            variant={viewMode === "edit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("edit")}
            className={viewMode === "edit" ? "bg-amber-500 text-slate-950 font-semibold hover:bg-amber-600" : "text-muted-foreground"}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            এডিট মোড (Edit)
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
            className={viewMode === "preview" ? "bg-amber-500 text-slate-950 font-semibold hover:bg-amber-600" : "text-muted-foreground"}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            ফুল প্রিভিউ (Preview)
          </Button>
        </div>
      </div>

      {/* Live Header/Footer Mini Preview Bar (Always visible in Edit Mode) */}
      {viewMode === "edit" && (
        <div className="bg-slate-950/80 border border-amber-500/25 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>লাইভ মিনি প্রিভিউ (Live Mini Preview) — {activeTab === "header" ? "Header Bar" : "Footer Bar"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {activeTab === "header" 
                  ? (headerConfig?.styling?.layout?.sticky ? "Sticky: ফিক্সড অন" : "Sticky: অফ") 
                  : `Desktop: ${footerConfig?.styling?.layout?.columns?.desktop || 4} কলাম`
                }
              </span>
            </div>
          </div>

          {activeTab === "header" && headerConfig ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              {/* Brand Preview */}
              <div className="flex items-center gap-2">
                {headerConfig.content?.logo?.type === "image" && headerConfig.content?.logo?.imageUrl ? (
                  <img 
                    src={headerConfig.content.logo.imageUrl} 
                    alt="Logo" 
                    className="h-7 max-w-[120px] object-contain" 
                  />
                ) : (
                  <span className={`${headerConfig.styling?.typography?.logoFont || 'font-bold'} ${headerConfig.styling?.typography?.logoSize || 'text-base'} text-amber-400`}>
                    {headerConfig.content?.logo?.text || "All Vip Courses"}
                  </span>
                )}
              </div>

              {/* Nav Links Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(headerConfig.content?.navigation || [])
                  .filter(item => item.isVisible !== false)
                  .map((item) => (
                    <span 
                      key={item.id} 
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700/60 font-medium"
                    >
                      {item.label}
                    </span>
                  ))}
              </div>

              {/* Elements Status */}
              <div className="flex items-center gap-2 text-slate-400">
                {headerConfig.content?.elements?.showSearch && (
                  <span className="p-1.5 rounded-lg bg-slate-800 text-amber-400" title="সার্চ সক্রিয়">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                )}
                {headerConfig.content?.elements?.showThemeToggle && (
                  <span className="p-1.5 rounded-lg bg-slate-800 text-amber-400" title="ডার্ক মোড সুইচ সক্রিয়">
                    <Moon className="w-3.5 h-3.5" />
                  </span>
                )}
                {headerConfig.content?.elements?.showUserMenu && (
                  <span className="p-1.5 rounded-lg bg-slate-800 text-amber-400" title="প্রোফাইল মেনু সক্রিয়">
                    <User className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          ) : footerConfig ? (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-amber-400">
                    {footerConfig.content?.brand?.text || "All Vip Courses"}
                  </span>
                  <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                    {footerConfig.content?.brand?.description || "Online learning platform"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>সেকশন: <strong>{footerConfig.content?.sections?.length || 0}টি</strong></span>
                  <span>সোশ্যাল লিংক: <strong>{footerConfig.content?.socialLinks?.links?.length || 0}টি</strong></span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{footerConfig.content?.copyright?.text?.replace("{year}", new Date().getFullYear()) || "© All rights reserved"}</span>
                <span className="text-amber-500/80">ফুটার কলাম গ্রিড অ্যাক্টিভ</span>
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Device Preview Selector (shown in preview mode) */}
      {viewMode === "preview" && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">ডিভাইস ভিউ নির্বাচন করুন:</span>
            <Button
              variant={devicePreview === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setDevicePreview("desktop")}
              className={devicePreview === "desktop" ? "bg-amber-500 text-slate-950 font-semibold" : ""}
            >
              <Monitor className="w-4 h-4 mr-1.5" />
              Desktop (পিসি)
            </Button>
            <Button
              variant={devicePreview === "tablet" ? "default" : "outline"}
              size="sm"
              onClick={() => setDevicePreview("tablet")}
              className={devicePreview === "tablet" ? "bg-amber-500 text-slate-950 font-semibold" : ""}
            >
              <Tablet className="w-4 h-4 mr-1.5" />
              Tablet (ট্যাবলেট)
            </Button>
            <Button
              variant={devicePreview === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setDevicePreview("mobile")}
              className={devicePreview === "mobile" ? "bg-amber-500 text-slate-950 font-semibold" : ""}
            >
              <Smartphone className="w-4 h-4 mr-1.5" />
              Mobile (মোবাইল)
            </Button>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            সরাসরি ওয়েবসাইট যেমন দেখাবে
          </span>
        </div>
      )}
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-11 bg-muted/60 p-1 rounded-xl">
          <TabsTrigger 
            value="header" 
            className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold transition-all"
          >
            Header (হেডার সেটিংস)
          </TabsTrigger>
          <TabsTrigger 
            value="footer"
            className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold transition-all"
          >
            Footer (ফুটার সেটিংস)
          </TabsTrigger>
        </TabsList>
        
        {/* Header Tab */}
        <TabsContent value="header" className="space-y-4">
          {viewMode === "edit" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content Editor - 2 columns */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <HeaderContentEditor 
                    config={headerConfig}
                    onChange={setHeaderConfig}
                    sitePages={sitePages}
                  />
                </div>
              </div>
              
              {/* Sidebar - 1 column */}
              <div className="space-y-5">
                {/* Actions Top Box */}
                <div className="bg-card border border-amber-500/30 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">সংরক্ষণ ও পাবলিশ</h4>
                  <Button 
                    onClick={() => handleSaveHeader(true)}
                    disabled={saving}
                    variant="outline"
                    className="w-full text-xs font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "সেভ হচ্ছে..." : "ড্রাফট সেভ করুন (Save Draft)"}
                  </Button>
                  <Button 
                    onClick={handlePublishHeader}
                    disabled={saving}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {saving ? "পাবলিশ হচ্ছে..." : "ওয়েবসাইটে পাবলিশ করুন (Publish)"}
                  </Button>
                </div>

                {/* Styling Panel */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-base font-bold mb-4 text-foreground">স্টাইলিং ও থিম</h3>
                  <StylingPanel 
                    config={headerConfig}
                    onChange={setHeaderConfig}
                    type="header"
                  />
                </div>
                
                {/* Display Rules Panel */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-base font-bold mb-4 text-foreground">ডিসপ্লে নিয়মাবলী</h3>
                  <DisplayRulesPanel 
                    config={headerConfig}
                    onChange={setHeaderConfig}
                    sitePages={sitePages}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden bg-card p-4">
              <PreviewPanel 
                config={headerConfig}
                type="header"
                device={devicePreview}
              />
            </div>
          )}
        </TabsContent>
        
        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-4">
          {viewMode === "edit" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content Editor - 2 columns */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <FooterContentEditor 
                    config={footerConfig}
                    onChange={setFooterConfig}
                    sitePages={sitePages}
                  />
                </div>
              </div>
              
              {/* Sidebar - 1 column */}
              <div className="space-y-5">
                {/* Actions Top Box */}
                <div className="bg-card border border-amber-500/30 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">সংরক্ষণ ও পাবলিশ</h4>
                  <Button 
                    onClick={() => handleSaveFooter(true)}
                    disabled={saving}
                    variant="outline"
                    className="w-full text-xs font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "সেভ হচ্ছে..." : "ড্রাফট সেভ করুন (Save Draft)"}
                  </Button>
                  <Button 
                    onClick={handlePublishFooter}
                    disabled={saving}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {saving ? "পাবলিশ হচ্ছে..." : "ওয়েবসাইটে পাবলিশ করুন (Publish)"}
                  </Button>
                </div>

                {/* Styling Panel */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-base font-bold mb-4 text-foreground">স্টাইলিং ও থিম</h3>
                  <StylingPanel 
                    config={footerConfig}
                    onChange={setFooterConfig}
                    type="footer"
                  />
                </div>
                
                {/* Display Rules Panel */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-base font-bold mb-4 text-foreground">ডিসপ্লে নিয়মাবলী</h3>
                  <DisplayRulesPanel 
                    config={footerConfig}
                    onChange={setFooterConfig}
                    sitePages={sitePages}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden bg-card p-4">
              <PreviewPanel 
                config={footerConfig}
                type="footer"
                device={devicePreview}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
