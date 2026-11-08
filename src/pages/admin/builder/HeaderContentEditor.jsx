import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { Plus, Trash2, GripVertical, Upload, Globe, Compass, Sliders, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function HeaderContentEditor({ config, onChange, sitePages }) {
  const [uploading, setUploading] = useState(false)
  
  // Auto-sanitize legacy Home link if pointing to Telegram instead of root "/"
  useEffect(() => {
    if (!config?.content?.navigation) return
    let changed = false
    const updatedNav = config.content.navigation.map((item) => {
      if (item.label?.trim().toLowerCase() === "home" && item.url?.includes("t.me")) {
        changed = true
        return { ...item, url: "/", type: "internal" }
      }
      return item
    })
    if (changed) {
      onChange({
        ...config,
        content: {
          ...config.content,
          navigation: updatedNav
        }
      })
    }
  }, [config, onChange])

  if (!config) return null
  
  const updateLogo = (field, value) => {
    onChange({
      ...config,
      content: {
        ...config.content,
        logo: {
          ...config.content.logo,
          [field]: value
        }
      }
    })
  }
  
  const updateNavigation = (index, field, value) => {
    const newNav = [...config.content.navigation]
    newNav[index] = { ...newNav[index], [field]: value }
    onChange({
      ...config,
      content: {
        ...config.content,
        navigation: newNav
      }
    })
  }
  
  const addNavigationItem = () => {
    const newNav = [...config.content.navigation, {
      id: `nav-${Date.now()}`,
      label: "New Link",
      type: "internal",
      url: "/",
      order: config.content.navigation.length,
      isVisible: true,
      openInNewTab: false,
      children: []
    }]
    onChange({
      ...config,
      content: {
        ...config.content,
        navigation: newNav
      }
    })
  }
  
  const removeNavigationItem = (index) => {
    const newNav = config.content.navigation.filter((_, i) => i !== index)
    onChange({
      ...config,
      content: {
        ...config.content,
        navigation: newNav
      }
    })
  }
  
  const updateElements = (field, value) => {
    onChange({
      ...config,
      content: {
        ...config.content,
        elements: {
          ...config.content.elements,
          [field]: value
        }
      }
    })
  }
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error("অনুগ্রহ করে একটি ছবি (PNG/JPG/WEBP) আপলোড করুন")
      return
    }
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('https://api.imgbb.com/1/upload?key=a89c3caf5dad89237292eb634d6a0c8e', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        updateLogo('imageUrl', data.data.url)
        toast.success("লোগো সফলভাবে আপলোড হয়েছে!")
      } else {
        toast.error("লোগো আপলোড ব্যর্থ হয়েছে")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("লোগো আপলোড করতে সমস্যা হয়েছে")
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      {/* 1. Logo Section */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-base text-foreground">Logo / Brand Settings (লোগো ও ব্র্যান্ড সেটিংস)</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ওয়েবসাইটের উপরের নাম বা লোগো এবং ক্লিক করলে কোন পেজে যাবে তা এখান থেকে পরিবর্তন করুন।
          </p>
        </div>
        
        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo-type" className="text-xs font-medium">লোগোর ধরন (Logo Type)</Label>
              <Select 
                value={config.content.logo.type || 'text'} 
                onValueChange={(value) => updateLogo('type', value)}
              >
                <SelectTrigger id="logo-type" className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (লেখা - যেমন: All Vip Courses)</SelectItem>
                  <SelectItem value="image">Image (ছবি/লোগো ফাইল)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="logo-link" className="text-xs font-medium">ক্লিক করলে কোন পেজে যাবে (Logo Link)</Label>
              <Input
                id="logo-link"
                value={config.content.logo.link || '/'}
                onChange={(e) => updateLogo('link', e.target.value)}
                placeholder="/"
                className="h-9 mt-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">সাধারণত হোমপেজ অর্থাৎ / লিংক থাকে</span>
            </div>
          </div>
          
          {config.content.logo.type === 'text' ? (
            <div>
              <Label htmlFor="logo-text" className="text-xs font-medium">লোগোর টেক্সট (Brand Text)</Label>
              <Input
                id="logo-text"
                value={config.content.logo.text || ''}
                onChange={(e) => updateLogo('text', e.target.value)}
                placeholder="All Vip Courses"
                className="mt-1"
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div>
                <Label htmlFor="logo-image" className="text-xs font-medium">লোগো ছবির অনলাইন লিংক (Image URL)</Label>
                <Input
                  id="logo-image"
                  value={config.content.logo.imageUrl || ''}
                  onChange={(e) => updateLogo('imageUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="logo-upload" className="text-xs font-medium">অথবা কম্পিউটার/মোবাইল থেকে সরাসরি আপলোড করুন</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo-upload').click()}
                    size="sm"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploading ? "আপলোড হচ্ছে..." : "Upload"}
                  </Button>
                </div>
                {config.content.logo.imageUrl && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-card border border-border rounded-lg">
                    <img 
                      src={config.content.logo.imageUrl} 
                      alt="Logo preview" 
                      className="h-10 object-contain rounded"
                    />
                    <span className="text-xs text-muted-foreground">বর্তমান লোগো প্রিভিউ</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 2. Navigation Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              <h4 className="font-semibold text-base text-foreground">Navigation Menu (নেভিগেশন মেনু)</h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              উপরের মেনু বারে কোন কোন অপশন (যেমন: Home, Courses, Community) থাকবে এবং সেগুলোর লিংক কী হবে তা এখানে সেট করুন।
            </p>
          </div>
          <Button size="sm" onClick={addNavigationItem} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-1" />
            নতুন লিংক যোগ করুন
          </Button>
        </div>
        
        <div className="space-y-3">
          {config.content.navigation.map((item, index) => {
            const isHomeLink = item.label?.trim().toLowerCase() === "home"
            return (
              <div key={item.id} className="p-4 border border-border bg-card/60 hover:border-amber-500/40 rounded-xl space-y-3 transition-colors">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                  <div className="flex-1">
                    <Input
                      value={item.label}
                      onChange={(e) => updateNavigation(index, 'label', e.target.value)}
                      placeholder="মেনুর নাম (যেমন: Home, Courses)"
                      className="font-medium text-sm h-9"
                    />
                  </div>
                  {isHomeLink && item.url !== "/" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateNavigation(index, 'url', '/')}
                      title="Reset Home URL to /"
                      className="text-xs text-amber-500 hover:text-amber-400"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Fix to /
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => removeNavigationItem(index)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0 shrink-0"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs text-muted-foreground">লিংকের ধরন (Link Type)</Label>
                    <Select 
                      value={item.type} 
                      onValueChange={(value) => updateNavigation(index, 'type', value)}
                    >
                      <SelectTrigger className="h-9 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">
                          Website Page (ভেতরের পেজ - যেমন: /courses)
                        </SelectItem>
                        <SelectItem value="external">
                          External Link (বাইরের লিংক - যেমন: Telegram/Facebook)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">লিংক URL (Destination URL)</Label>
                    <Input
                      value={item.url}
                      onChange={(e) => updateNavigation(index, 'url', e.target.value)}
                      placeholder={item.type === 'internal' ? '/courses' : 'https://t.me/example'}
                      className="h-9 mt-1 text-xs font-mono"
                    />
                  </div>
                </div>
                
                {/* Toggles using Switch */}
                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2.5">
                    <Switch
                      id={`visible-${item.id}`}
                      checked={item.isVisible !== false}
                      onCheckedChange={(checked) => updateNavigation(index, 'isVisible', checked)}
                    />
                    <Label htmlFor={`visible-${item.id}`} className="text-xs cursor-pointer select-none">
                      হেডারে দেখাবে (Visible)
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <Switch
                      id={`newtab-${item.id}`}
                      checked={!!item.openInNewTab}
                      onCheckedChange={(checked) => updateNavigation(index, 'openInNewTab', checked)}
                    />
                    <Label htmlFor={`newtab-${item.id}`} className="text-xs cursor-pointer select-none flex items-center gap-1">
                      <span>নতুন ট্যাবে খুলবে (Open in new tab)</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </Label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 3. Header Elements */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-base text-foreground">Header Elements (হেডারের অতিরিক্ত ফিচার)</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            নেভিগেশন বারে সার্চ বাটন, থিম পরিবর্তন বাটন এবং প্রোফাইল মেনু দেখাতে চান কিনা তা অন/অফ করুন।
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-semibold text-foreground block">সার্চ বাটন (Search)</span>
              <p className="text-[11px] text-muted-foreground">কোর্স খোঁজার সার্চ আইকন</p>
            </div>
            <Switch
              checked={!!config.content.elements.showSearch}
              onCheckedChange={(checked) => updateElements('showSearch', checked)}
            />
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-semibold text-foreground block">থিম পরিবর্তন (Theme Toggle)</span>
              <p className="text-[11px] text-muted-foreground">ডার্ক / লাইট মোড সুইচ</p>
            </div>
            <Switch
              checked={!!config.content.elements.showThemeToggle}
              onCheckedChange={(checked) => updateElements('showThemeToggle', checked)}
            />
          </div>
          
          {/* User Menu */}
          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-semibold text-foreground block">প্রোফাইল মেনু (User Menu)</span>
              <p className="text-[11px] text-muted-foreground">লগইন ও প্রোফাইল বাটন</p>
            </div>
            <Switch
              checked={!!config.content.elements.showUserMenu}
              onCheckedChange={(checked) => updateElements('showUserMenu', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
