import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { Monitor, Tablet, Smartphone, ShieldCheck, Eye, Layers } from "lucide-react"

export default function DisplayRulesPanel({ config, onChange, sitePages }) {
  if (!config) return null
  
  const updatePageRules = (field, value) => {
    onChange({
      ...config,
      displayRules: {
        ...config.displayRules,
        pages: {
          ...config.displayRules?.pages,
          [field]: value
        }
      }
    })
  }
  
  const updateUserRoles = (field, value) => {
    onChange({
      ...config,
      displayRules: {
        ...config.displayRules,
        userRoles: {
          ...config.displayRules?.userRoles,
          [field]: value
        }
      }
    })
  }
  
  const updateDeviceRules = (field, value) => {
    onChange({
      ...config,
      displayRules: {
        ...config.displayRules,
        devices: {
          ...config.displayRules?.devices,
          [field]: value
        }
      }
    })
  }
  
  const devices = config.displayRules?.devices || {
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true
  }

  return (
    <div className="space-y-6">
      {/* Helper Intro Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
        <Eye className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-amber-400">ডিসপ্লে রুলস (Display Rules)</p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            হেডারটি কোন পেজে এবং কোন ডিভাইসে (মোবাইল, ট্যাবলেট, কম্পিউটার) দেখা যাবে তা নির্ধারণ করুন।
          </p>
        </div>
      </div>

      {/* Device Visibility */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            ডিভাইস ভিজিবিলিটি (Device Display)
          </Label>
        </div>

        <div className="space-y-2">
          {/* Desktop Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">কম্পিউটার (Desktop/PC)</span>
                <span className="text-[10px] text-slate-400">বড় স্ক্রিনে দেখাবে</span>
              </div>
            </div>
            <Switch
              checked={devices.showOnDesktop !== false}
              onCheckedChange={(checked) => updateDeviceRules('showOnDesktop', checked)}
            />
          </div>

          {/* Tablet Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2.5">
              <Tablet className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">ট্যাবলেট (Tablet / iPad)</span>
                <span className="text-[10px] text-slate-400">মাঝারি স্ক্রিনে দেখাবে</span>
              </div>
            </div>
            <Switch
              checked={devices.showOnTablet !== false}
              onCheckedChange={(checked) => updateDeviceRules('showOnTablet', checked)}
            />
          </div>

          {/* Mobile Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">স্মার্টফোন (Mobile Screens)</span>
                <span className="text-[10px] text-slate-400">মোবাইল ভিউতে দেখাবে</span>
              </div>
            </div>
            <Switch
              checked={devices.showOnMobile !== false}
              onCheckedChange={(checked) => updateDeviceRules('showOnMobile', checked)}
            />
          </div>
        </div>
      </div>

      {/* Page Rules */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-500" />
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            পেজ সিলেকশন (Page Visibility)
          </Label>
        </div>
        
        <div>
          <Select 
            value={config.displayRules?.pages?.type || 'all'} 
            onValueChange={(value) => updatePageRules('type', value)}
          >
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
              <SelectItem value="all">সকল পেজে দেখাবে (All Pages)</SelectItem>
              <SelectItem value="specific">নির্দিষ্ট পেজে দেখাবে (Specific Pages Only)</SelectItem>
              <SelectItem value="exclude">নির্দিষ্ট পেজ বাদে সব পেজে (All Except Specific)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {config.displayRules?.pages?.type !== 'all' && (
          <p className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            নির্দিষ্ট পেজ ফিল্টারিং শীঘ্রই আসছে। বর্তমানে এটি সব পেজেই সক্রিয় রয়েছে।
          </p>
        )}
      </div>
      
      {/* User Role Rules */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            ব্যবহারকারী রোল (User Roles)
          </Label>
        </div>
        
        <div>
          <Select 
            value={config.displayRules?.userRoles?.type || 'all'} 
            onValueChange={(value) => updateUserRoles('type', value)}
          >
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
              <SelectItem value="all">সকল ভিজিটর ও ব্যবহারকারী (All Users)</SelectItem>
              <SelectItem value="specific">নির্দিষ্ট রোল (Specific Roles Only)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
