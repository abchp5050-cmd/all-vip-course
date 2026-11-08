import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { Plus, Trash2, GripVertical, LayoutGrid, Building2, Share2, Copyright, Link as LinkIcon } from "lucide-react"

export default function FooterContentEditor({ config, onChange, sitePages }) {
  if (!config) return null
  
  const updateBrand = (field, value) => {
    onChange({
      ...config,
      content: {
        ...config.content,
        brand: {
          ...config.content?.brand,
          [field]: value
        }
      }
    })
  }
  
  const updateSection = (sectionIndex, field, value) => {
    const newSections = [...(config.content?.sections || [])]
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
    const newSections = [...(config.content?.sections || [])]
    const newLinks = [...(newSections[sectionIndex].links || [])]
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
    const currentSections = config.content?.sections || []
    const newSections = [...currentSections, {
      id: `section-${Date.now()}`,
      title: "নতুন সেকশন",
      order: currentSections.length,
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
    const newSections = (config.content?.sections || []).filter((_, i) => i !== index)
    onChange({
      ...config,
      content: {
        ...config.content,
        sections: newSections
      }
    })
  }
  
  const addLinkToSection = (sectionIndex) => {
    const newSections = [...(config.content?.sections || [])]
    const currentLinks = newSections[sectionIndex].links || []
    const newLinks = [...currentLinks, {
      id: `link-${Date.now()}`,
      label: "নতুন লিংক",
      type: "internal",
      url: "/",
      order: currentLinks.length,
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
    const newSections = [...(config.content?.sections || [])]
    const newLinks = (newSections[sectionIndex].links || []).filter((_, i) => i !== linkIndex)
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
    const currentLinks = config.content?.socialLinks?.links || []
    const newLinks = [...currentLinks]
    newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value }
    onChange({
      ...config,
      content: {
        ...config.content,
        socialLinks: {
          ...config.content?.socialLinks,
          links: newLinks
        }
      }
    })
  }
  
  const addSocialLink = () => {
    const currentLinks = config.content?.socialLinks?.links || []
    const newLinks = [...currentLinks, {
      id: `social-${Date.now()}`,
      platform: "Telegram",
      url: "",
      icon: "Link",
      order: currentLinks.length,
      isVisible: true
    }]
    onChange({
      ...config,
      content: {
        ...config.content,
        socialLinks: {
          ...config.content?.socialLinks,
          links: newLinks
        }
      }
    })
  }
  
  const removeSocialLink = (index) => {
    const currentLinks = config.content?.socialLinks?.links || []
    const newLinks = currentLinks.filter((_, i) => i !== index)
    onChange({
      ...config,
      content: {
        ...config.content,
        socialLinks: {
          ...config.content?.socialLinks,
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
          ...config.styling?.layout,
          columns: {
            ...config.styling?.layout?.columns,
            [device]: parseInt(value)
          }
        }
      }
    })
  }
  
  return (
    <div className="space-y-8">
      {/* 1. Layout Configuration */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-base text-foreground">Footer Layout & Grid (ফুটার কলাম বিন্যাস)</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ওয়েবসাইটের একদম নিচের অংশে (Footer) কী লেখা থাকবে এবং কী কী দরকারি লিংক দেখাবে তা এখান থেকে সাজান।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div>
            <Label htmlFor="mobile-columns" className="text-xs font-medium">মোবাইল কলাম (Mobile Columns)</Label>
            <Select 
              value={config.styling?.layout?.columns?.mobile?.toString() || "1"}
              onValueChange={(value) => updateColumnCount('mobile', value)}
            >
              <SelectTrigger id="mobile-columns" className="h-9 mt-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">১ কলাম (1 Column - উপরে নিচে)</SelectItem>
                <SelectItem value="2">২ কলাম (2 Columns - পাশাপাশি)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="tablet-columns" className="text-xs font-medium">ট্যাবলেট কলাম (Tablet Columns)</Label>
            <Select 
              value={config.styling?.layout?.columns?.tablet?.toString() || "2"}
              onValueChange={(value) => updateColumnCount('tablet', value)}
            >
              <SelectTrigger id="tablet-columns" className="h-9 mt-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">১ কলাম (1 Column)</SelectItem>
                <SelectItem value="2">২ কলাম (2 Columns)</SelectItem>
                <SelectItem value="3">৩ কলাম (3 Columns)</SelectItem>
                <SelectItem value="4">৪ কলাম (4 Columns)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="desktop-columns" className="text-xs font-medium">কম্পিউটার কলাম (Desktop Columns)</Label>
            <Select 
              value={config.styling?.layout?.columns?.desktop?.toString() || "4"}
              onValueChange={(value) => updateColumnCount('desktop', value)}
            >
              <SelectTrigger id="desktop-columns" className="h-9 mt-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">২ কলাম (2 Columns)</SelectItem>
                <SelectItem value="3">৩ কলাম (3 Columns)</SelectItem>
                <SelectItem value="4">৪ কলাম (4 Columns - প্রস্তাবিত)</SelectItem>
                <SelectItem value="5">৫ কলাম (5 Columns)</SelectItem>
                <SelectItem value="6">৬ কলাম (6 Columns)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* 2. Brand Section */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-base text-foreground">Brand Details (ব্র্যান্ড তথ্য ও বিবরণ)</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ফুটারে প্ল্যাটফর্মের নাম ও ছোট পরিচিতি বা স্লোগান দেখানোর অপশন।
          </p>
        </div>
        
        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground block">Show Brand Section (ব্র্যান্ড সেকশন অন রাখুন)</span>
              <p className="text-[11px] text-muted-foreground">বন্ধ করলে ফুটারের প্রথম কলামে ব্র্যান্ড বিবরণটি লুকানো থাকবে</p>
            </div>
            <Switch
              checked={!!config.content?.brand?.enabled}
              onCheckedChange={(checked) => updateBrand('enabled', checked)}
            />
          </div>
          
          {config.content?.brand?.enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="brand-text" className="text-xs font-medium">ব্র্যান্ডের নাম (Brand Name)</Label>
                <Input
                  id="brand-text"
                  value={config.content?.brand?.text || ''}
                  onChange={(e) => updateBrand('text', e.target.value)}
                  placeholder="All Vip Courses"
                  className="h-9 mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="brand-description" className="text-xs font-medium">ছোট বিবরণী বা স্লোগান (Brief Description)</Label>
                <Textarea
                  id="brand-description"
                  value={config.content?.brand?.description || ''}
                  onChange={(e) => updateBrand('description', e.target.value)}
                  placeholder="বাংলাদেশে সেরা প্রিমিয়াম অনলাইন লার্নিং প্ল্যাটফর্ম..."
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 3. Footer Link Columns/Sections */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
          <div>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-amber-500" />
              <h4 className="font-semibold text-base text-foreground">Footer Sections & Links (ফুটার সেকশন ও লিংক)</h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              যেমন: "Quick Links", "Policies", "Community" ইত্যাদি সেকশন এবং সেগুলোর ভেতরের লিংকসমূহ।
            </p>
          </div>
          <Button size="sm" onClick={addSection} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-1" />
            নতুন সেকশন যোগ করুন
          </Button>
        </div>
        
        <div className="space-y-4">
          {(config.content?.sections || []).map((section, sectionIndex) => (
            <div key={section.id} className="p-4 border border-border bg-card/60 hover:border-amber-500/40 rounded-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  placeholder="সেকশন শিরোনাম (যেমন: Useful Links)"
                  className="flex-1 font-semibold text-sm h-9"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeSection(sectionIndex)}
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0 shrink-0"
                  title="সেকশন মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">লিংক তালিকা ({section.links?.length || 0})</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => addLinkToSection(sectionIndex)}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    লিংক যোগ করুন
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {(section.links || []).map((link, linkIndex) => (
                    <div key={link.id} className="p-3 border border-border rounded-lg bg-background space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={link.label}
                          onChange={(e) => updateSectionLink(sectionIndex, linkIndex, 'label', e.target.value)}
                          placeholder="লিংকের নাম (যেমন: Terms & Conditions)"
                          className="flex-1 h-8 text-xs font-medium"
                        />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeLinkFromSection(sectionIndex, linkIndex)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Select 
                          value={link.type || 'internal'} 
                          onValueChange={(value) => updateSectionLink(sectionIndex, linkIndex, 'type', value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">Website Page (ভেতরের পেজ - যেমন: /terms)</SelectItem>
                            <SelectItem value="external">External Link (বাইরের লিংক - যেমন: Telegram)</SelectItem>
                            <SelectItem value="email">Email (ইমেইল - যেমন: info@domain.com)</SelectItem>
                            <SelectItem value="phone">Phone (মোবাইল - যেমন: +880...)</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={link.url || link.value || ''}
                          onChange={(e) => {
                            const field = link.type === 'email' || link.type === 'phone' ? 'value' : 'url'
                            updateSectionLink(sectionIndex, linkIndex, field, e.target.value)
                          }}
                          placeholder={link.type === 'email' ? 'support@vip.com' : link.type === 'phone' ? '+8801700000000' : '/courses'}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 4. Social Links */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-500" />
              <h4 className="font-semibold text-base text-foreground">Social Links (সোশ্যাল মিডিয়া লিংক)</h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              টেলিগ্রাম চ্যানেল, ফেসবুক গ্রুপ, ইউটিউব ইত্যাদি কমিউনিটি লিংক যোগ করুন।
            </p>
          </div>
          <Button size="sm" onClick={addSocialLink} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-1" />
            সোশ্যাল লিংক যোগ করুন
          </Button>
        </div>
        
        <div className="space-y-2">
          {(config.content?.socialLinks?.links || []).map((link, index) => (
            <div key={link.id} className="p-3 border border-border rounded-xl bg-card/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="w-full sm:w-44">
                <Input
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  placeholder="প্ল্যাটফর্ম (Telegram/FB)"
                  className="h-9 text-xs font-medium"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                  placeholder="https://t.me/yourgroup"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => removeSocialLink(index)}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0 shrink-0 self-end sm:self-center"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 5. Copyright */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Copyright className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-base text-foreground">Copyright Notice (কপিরাইট নোটিশ)</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ফুটারের একদম নিচে কপিরাইট টেক্সট সেট করুন।
          </p>
        </div>
        
        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-2">
          <Label htmlFor="copyright-text" className="text-xs font-medium">কপিরাইট টেক্সট</Label>
          <Input
            id="copyright-text"
            value={config.content?.copyright?.text || ''}
            onChange={(e) => onChange({
              ...config,
              content: {
                ...config.content,
                copyright: {
                  ...config.content?.copyright,
                  text: e.target.value
                }
              }
            })}
            placeholder="© {year} All Vip Courses. All rights reserved."
            className="h-9"
          />
          <p className="text-[11px] text-muted-foreground">
            টিপস: টেক্সটের ভেতর <code>{"{year}"}</code> লিখলে সেটি স্বয়ংক্রিয়ভাবে চলতি বছর (যেমন ২০২৬) হিসেবে প্রদর্শিত হবে।
          </p>
        </div>
      </div>
    </div>
  )
}
