import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Plus, Trash2, GripVertical, Upload } from "lucide-react"
import { toast } from "sonner"

export default function HeaderContentEditor({ config, onChange, sitePages }) {
  const [uploading, setUploading] = useState(false)
  
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
      toast.error("Please upload an image file")
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
        toast.success("Logo uploaded successfully!")
      } else {
        toast.error("Failed to upload logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Logo</h4>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="logo-type">Logo Type</Label>
            <Select 
              value={config.content.logo.type} 
              onValueChange={(value) => updateLogo('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {config.content.logo.type === 'text' ? (
            <div>
              <Label htmlFor="logo-text">Logo Text</Label>
              <Input
                id="logo-text"
                value={config.content.logo.text || ''}
                onChange={(e) => updateLogo('text', e.target.value)}
                placeholder="Site Name"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="logo-image">Logo Image URL</Label>
                <Input
                  id="logo-image"
                  value={config.content.logo.imageUrl || ''}
                  onChange={(e) => updateLogo('imageUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <Label htmlFor="logo-upload">Or Upload Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo-upload').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                {config.content.logo.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={config.content.logo.imageUrl} 
                      alt="Logo preview" 
                      className="h-12 object-contain border border-border rounded p-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="logo-link">Logo Link</Label>
            <Input
              id="logo-link"
              value={config.content.logo.link}
              onChange={(e) => updateLogo('link', e.target.value)}
              placeholder="/"
            />
          </div>
        </div>
      </div>
      
      {/* Navigation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Navigation Menu</h4>
          <Button size="sm" onClick={addNavigationItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </div>
        
        <div className="space-y-3">
          {config.content.navigation.map((item, index) => (
            <div key={item.id} className="p-3 border border-border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                <Input
                  value={item.label}
                  onChange={(e) => updateNavigation(index, 'label', e.target.value)}
                  placeholder="Link Label"
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeNavigationItem(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select 
                    value={item.type} 
                    onValueChange={(value) => updateNavigation(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">URL</Label>
                  <Input
                    value={item.url}
                    onChange={(e) => updateNavigation(index, 'url', e.target.value)}
                    placeholder="/page"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Header Elements */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Header Elements</h4>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.elements.showSearch}
              onChange={(e) => updateElements('showSearch', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show Search</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.elements.showThemeToggle}
              onChange={(e) => updateElements('showThemeToggle', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show Theme Toggle</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.elements.showUserMenu}
              onChange={(e) => updateElements('showUserMenu', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show User Menu</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.elements.showInstallButton}
              onChange={(e) => updateElements('showInstallButton', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show Install Button (PWA)</span>
          </label>
        </div>
      </div>
    </div>
  )
}
