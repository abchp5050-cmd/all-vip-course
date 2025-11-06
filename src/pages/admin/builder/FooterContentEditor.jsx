import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Plus, Trash2, GripVertical } from "lucide-react"

export default function FooterContentEditor({ config, onChange, sitePages }) {
  if (!config) return null
  
  const updateBrand = (field, value) => {
    onChange({
      ...config,
      content: {
        ...config.content,
        brand: {
          ...config.content.brand,
          [field]: value
        }
      }
    })
  }
  
  const updateSection = (sectionIndex, field, value) => {
    const newSections = [...config.content.sections]
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value }
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const updateSectionLink = (sectionIndex, linkIndex, field, value) => {
    const newSections = [...config.content.sections]
    const newLinks = [...newSections[sectionIndex].links]
    newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value }
    newSections[sectionIndex] = { ...newSections[sectionIndex], links: newLinks }
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const addSection = () => {
    const newSections = [...config.content.sections, {
      id: `section-${Date.now()}`,
      title: "New Section",
      order: config.content.sections.length,
      links: []
    }]
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const removeSection = (index) => {
    const newSections = config.content.sections.filter((_, i) => i !== index)
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const addLinkToSection = (sectionIndex) => {
    const newSections = [...config.content.sections]
    const newLinks = [...newSections[sectionIndex].links, {
      id: `link-${Date.now()}`,
      label: "New Link",
      type: "internal",
      url: "/",
      order: newSections[sectionIndex].links.length,
      isVisible: true
    }]
    newSections[sectionIndex] = { ...newSections[sectionIndex], links: newLinks }
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const removeLinkFromSection = (sectionIndex, linkIndex) => {
    const newSections = [...config.content.sections]
    const newLinks = newSections[sectionIndex].links.filter((_, i) => i !== linkIndex)
    newSections[sectionIndex] = { ...newSections[sectionIndex], links: newLinks }
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const updateSocialLink = (linkIndex, field, value) => {
    const newLinks = [...config.content.socialLinks.links]
    newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value }
    onChange({
      ...config,
      content: {
        ...config.content,
        socialLinks: {
          ...config.content.socialLinks,
          links: newLinks
        }
      }
    })
  }
  
  const addSocialLink = () => {
    const newLinks = [...config.content.socialLinks.links, {
      id: `social-${Date.now()}`,
      platform: "custom",
      url: "",
      icon: "Link",
      order: config.content.socialLinks.links.length,
      isVisible: true
    }]
    onChange({
      ...config,
      content: {
        ...config.content,
        socialLinks: {
          ...config.content.socialLinks,
          links: newLinks
        }
      }
    })
  }
  
  const removeSocialLink = (index) => {
    const newLinks = config.content.socialLinks.links.filter((_, i) => i !== index)
    onChange({
      ...config,
      content: {
        ...config.content,
        socialLinks: {
          ...config.content.socialLinks,
          links: newLinks
        }
      }
    })
  }
  
  const updateColumnCount = (device, value) => {
    onChange({
      ...config,
      styling: {
        ...config.styling,
        layout: {
          ...config.styling.layout,
          columns: {
            ...config.styling.layout.columns,
            [device]: parseInt(value)
          }
        }
      }
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Layout Configuration */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Footer Layout</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="mobile-columns" className="text-xs">Mobile Columns</Label>
            <Select 
              value={config.styling?.layout?.columns?.mobile?.toString() || "1"}
              onValueChange={(value) => updateColumnCount('mobile', value)}
            >
              <SelectTrigger id="mobile-columns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="2">2 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="tablet-columns" className="text-xs">Tablet Columns</Label>
            <Select 
              value={config.styling?.layout?.columns?.tablet?.toString() || "2"}
              onValueChange={(value) => updateColumnCount('tablet', value)}
            >
              <SelectTrigger id="tablet-columns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="desktop-columns" className="text-xs">Desktop Columns</Label>
            <Select 
              value={config.styling?.layout?.columns?.desktop?.toString() || "4"}
              onValueChange={(value) => updateColumnCount('desktop', value)}
            >
              <SelectTrigger id="desktop-columns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
                <SelectItem value="5">5 Columns</SelectItem>
                <SelectItem value="6">6 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure how many columns the footer should display on different screen sizes. This includes brand section, footer sections, and social links.
        </p>
      </div>
      
      {/* Brand Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Brand Section</h4>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.brand.enabled}
              onChange={(e) => updateBrand('enabled', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show Brand Section</span>
          </label>
          
          {config.content.brand.enabled && (
            <>
              <div>
                <Label htmlFor="brand-text">Brand Name</Label>
                <Input
                  id="brand-text"
                  value={config.content.brand.text}
                  onChange={(e) => updateBrand('text', e.target.value)}
                  placeholder="Your Brand Name"
                />
              </div>
              
              <div>
                <Label htmlFor="brand-description">Description</Label>
                <Textarea
                  id="brand-description"
                  value={config.content.brand.description}
                  onChange={(e) => updateBrand('description', e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Footer Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Footer Sections</h4>
          <Button size="sm" onClick={addSection}>
            <Plus className="w-4 h-4 mr-1" />
            Add Section
          </Button>
        </div>
        
        <div className="space-y-4">
          {config.content.sections.map((section, sectionIndex) => (
            <div key={section.id} className="p-4 border border-border rounded-lg space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  placeholder="Section Title"
                  className="flex-1 font-medium"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeSection(sectionIndex)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Links</Label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => addLinkToSection(sectionIndex)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Link
                  </Button>
                </div>
                
                {section.links.map((link, linkIndex) => (
                  <div key={link.id} className="p-2 border border-border rounded bg-card space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => updateSectionLink(sectionIndex, linkIndex, 'label', e.target.value)}
                        placeholder="Link Label"
                        className="flex-1"
                        size="sm"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeLinkFromSection(sectionIndex, linkIndex)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Select 
                        value={link.type} 
                        onValueChange={(value) => updateSectionLink(sectionIndex, linkIndex, 'type', value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        value={link.url || link.value || ''}
                        onChange={(e) => {
                          const field = link.type === 'email' || link.type === 'phone' ? 'value' : 'url'
                          updateSectionLink(sectionIndex, linkIndex, field, e.target.value)
                        }}
                        placeholder={link.type === 'email' ? 'email@example.com' : link.type === 'phone' ? '+123456789' : '/page'}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Social Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Social Links</h4>
          <Button size="sm" onClick={addSocialLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add Social
          </Button>
        </div>
        
        <div className="space-y-2">
          {config.content.socialLinks.links.map((link, index) => (
            <div key={link.id} className="p-3 border border-border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  placeholder="Platform Name"
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeSocialLink(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              
              <Input
                value={link.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Copyright */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Copyright</h4>
        
        <div>
          <Label htmlFor="copyright-text">Copyright Text</Label>
          <Input
            id="copyright-text"
            value={config.content.copyright.text}
            onChange={(e) => onChange({
              ...config,
              content: {
                ...config.content,
                copyright: {
                  ...config.content.copyright,
                  text: e.target.value
                }
              }
            })}
            placeholder="© {year} Your Company. All rights reserved."
          />
          <p className="text-xs text-muted-foreground mt-1">Use {"{year}"} for current year</p>
        </div>
      </div>
    </div>
  )
}
