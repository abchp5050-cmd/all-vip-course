import { useState } from "react"
import { Label } from "../../../components/ui/label"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { ChevronDown, ChevronUp, Palette, Sparkles, Layers, Sliders } from "lucide-react"

const COLOR_PRESETS = [
  {
    id: "default_dark_glass",
    name: "Default Dark Glass (ডিফল্ট ডার্ক গ্লাস)",
    background: "bg-slate-900/80 backdrop-blur-md",
    text: "text-white",
    border: "border-slate-800",
    shadow: "shadow-md",
    previewColor: "bg-slate-900 border-slate-700"
  },
  {
    id: "golden_accent",
    name: "Golden Accent Border (গোল্ডেন বর্ডার)",
    background: "bg-slate-950/90 backdrop-blur-lg",
    text: "text-amber-100",
    border: "border-amber-500/30",
    shadow: "shadow-lg",
    previewColor: "bg-slate-950 border-amber-500/50"
  },
  {
    id: "deep_obsidian",
    name: "Deep Obsidian (গাঢ় কালো)",
    background: "bg-[#0B0F19]",
    text: "text-slate-100",
    border: "border-slate-800/80",
    shadow: "shadow-lg",
    previewColor: "bg-[#0B0F19] border-slate-800"
  },
  {
    id: "slate_dark",
    name: "Slate Minimal (মিনিমাল স্লেট)",
    background: "bg-slate-900",
    text: "text-slate-200",
    border: "border-slate-700/60",
    shadow: "shadow-sm",
    previewColor: "bg-slate-800 border-slate-600"
  },
  {
    id: "pure_black",
    name: "OLED Pure Black (পিওর ব্ল্যাক)",
    background: "bg-black",
    text: "text-white",
    border: "border-zinc-800",
    shadow: "shadow-none",
    previewColor: "bg-black border-zinc-800"
  }
]

export default function StylingPanel({ config, onChange, type }) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!config) return null
  
  const updateLayoutStyling = (field, value) => {
    onChange({
      ...config,
      styling: {
        ...config.styling,
        layout: {
          ...config.styling?.layout,
          [field]: value
        }
      }
    })
  }
  
  const updateColorStyling = (field, value) => {
    onChange({
      ...config,
      styling: {
        ...config.styling,
        colors: {
          ...config.styling?.colors,
          [field]: value
        }
      }
    })
  }
  
  const updateTypographyStyling = (field, value) => {
    onChange({
      ...config,
      styling: {
        ...config.styling,
        typography: {
          ...config.styling?.typography,
          [field]: value
        }
      }
    })
  }
  
  const updateEffectsStyling = (field, value) => {
    onChange({
      ...config,
      styling: {
        ...config.styling,
        effects: {
          ...config.styling?.effects,
          [field]: value
        }
      }
    })
  }

  const applyColorPreset = (presetId) => {
    const preset = COLOR_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    onChange({
      ...config,
      styling: {
        ...config.styling,
        colors: {
          ...config.styling?.colors,
          background: preset.background,
          text: preset.text,
          border: preset.border
        },
        effects: {
          ...config.styling?.effects,
          shadow: preset.shadow
        }
      }
    })
  }

  // Detect which preset matches currently (if any)
  const currentBg = config.styling?.colors?.background || ""
  const activePreset = COLOR_PRESETS.find(p => p.background === currentBg)

  const fontField = type === 'header' ? 'logoFont' : 'headingFont'
  const currentFont = config.styling?.typography?.[fontField] || "font-bold"

  const sizeField = type === 'header' ? 'logoSize' : 'headingSize'
  const currentSize = config.styling?.typography?.[sizeField] || "text-xl"

  return (
    <div className="space-y-6">
      {/* Helper Intro Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-amber-400">ডিজাইন ও স্টাইলিং সেটিংস (Styling Controls)</p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            কোনো কোডিং ছাড়া ড্রপডাউন এবং প্রিসেট ব্যবহার করে সহজেই রঙ, সাইজ ও লেআউট পরিবর্তন করুন।
          </p>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-500" />
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            কালার থিম প্রিসেট (Color Theme)
          </Label>
        </div>

        <Select 
          value={activePreset?.id || "custom"} 
          onValueChange={(val) => {
            if (val !== "custom") applyColorPreset(val)
          }}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="সিলেক্ট করুন থিম" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            {COLOR_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full border ${preset.previewColor}`} />
                  <span>{preset.name}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="custom" disabled={!activePreset}>
              Custom / কাস্টম কালার
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Typography Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {type === 'header' ? 'লোগো ফন্ট ও সাইজ (Logo Typography)' : 'হেডিং ফন্ট ও সাইজ (Heading Typography)'}
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-slate-400 block mb-1.5">ফন্ট কতটুকু মোটা (Font Weight)</Label>
            <Select 
              value={currentFont} 
              onValueChange={(val) => updateTypographyStyling(fontField, val)}
            >
              <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                <SelectItem value="font-normal">Normal (স্বাভাবিক)</SelectItem>
                <SelectItem value="font-medium">Medium (মাঝারি)</SelectItem>
                <SelectItem value="font-semibold">Semi-Bold (অর্ধ-মোটা)</SelectItem>
                <SelectItem value="font-bold">Bold (মোটা)</SelectItem>
                <SelectItem value="font-extrabold">Extra Bold (অনেক মোটা)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[11px] text-slate-400 block mb-1.5">টেক্সট সাইজ (Font Size)</Label>
            <Select 
              value={currentSize} 
              onValueChange={(val) => updateTypographyStyling(sizeField, val)}
            >
              <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                <SelectItem value="text-sm">Small (ছোট - 14px)</SelectItem>
                <SelectItem value="text-base">Medium (মাঝারি - 16px)</SelectItem>
                <SelectItem value="text-lg">Large (বড় - 18px)</SelectItem>
                <SelectItem value="text-xl">Extra Large (অনেক বড় - 20px)</SelectItem>
                <SelectItem value="text-2xl">Huge (খুব বড় - 24px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Layout & Behavior */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            লেআউট ও ডিসপ্লে (Layout & Display)
          </Label>
        </div>

        {type === 'header' && (
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-semibold text-slate-200 block">Sticky Header (ফিক্সড হেডার)</span>
              <p className="text-[11px] text-slate-400 leading-tight">
                স্ক্রোল করলেও হেডারটি স্ক্রিনের উপরে স্থির থাকবে
              </p>
            </div>
            <Switch
              checked={!!config.styling?.layout?.sticky}
              onCheckedChange={(checked) => updateLayoutStyling('sticky', checked)}
            />
          </div>
        )}

        {type === 'footer' && (
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-semibold text-slate-200 block">Top Divider Border (উপরের বর্ডার)</span>
              <p className="text-[11px] text-slate-400 leading-tight">
                ফুটারের একদম উপরে একটি বিভাজক বর্ডার লাইন দেখাবে
              </p>
            </div>
            <Switch
              checked={!!config.styling?.effects?.borderTop}
              onCheckedChange={(checked) => updateEffectsStyling('borderTop', checked)}
            />
          </div>
        )}

        <div>
          <Label className="text-[11px] text-slate-400 block mb-1.5">কন্টেইনারের প্রস্থ (Max Width)</Label>
          <Select 
            value={config.styling?.layout?.maxWidth || "container"} 
            onValueChange={(value) => updateLayoutStyling('maxWidth', value)}
          >
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
              <SelectItem value="full">Full Width (পুরো স্ক্রিন জুড়ে)</SelectItem>
              <SelectItem value="container">Container (মাঝখানে সীমাবদ্ধ - 1200px)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[11px] text-slate-400 block mb-1.5">শ্যাডো ইফেক্ট (Shadow Depth)</Label>
          <Select 
            value={config.styling?.effects?.shadow || "shadow-md"} 
            onValueChange={(value) => updateEffectsStyling('shadow', value)}
          >
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
              <SelectItem value="none">None (কোনো শ্যাডো নেই)</SelectItem>
              <SelectItem value="shadow-sm">Small (হালকা শ্যাডো)</SelectItem>
              <SelectItem value="shadow">Medium (মাঝারি শ্যাডো)</SelectItem>
              <SelectItem value="shadow-lg">Large (গভীর শ্যাডো)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Section Toggle */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-amber-400 py-1 transition-colors"
        >
          <span>Advanced CSS Classes (উন্নত ডেভেলপার অপশন)</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <p className="text-[11px] text-slate-400">
              প্রয়োজনে এখানে সরাসরি Tailwind CSS ক্লাস লিখতে পারেন:
            </p>

            <div>
              <Label className="text-[10px] text-slate-400">Background Class</Label>
              <Input
                value={config.styling?.colors?.background || ""}
                onChange={(e) => updateColorStyling('background', e.target.value)}
                placeholder="bg-slate-900/80"
                className="h-8 text-xs font-mono bg-slate-900 border-slate-800 mt-1"
              />
            </div>

            <div>
              <Label className="text-[10px] text-slate-400">Text Color Class</Label>
              <Input
                value={config.styling?.colors?.text || ""}
                onChange={(e) => updateColorStyling('text', e.target.value)}
                placeholder="text-white"
                className="h-8 text-xs font-mono bg-slate-900 border-slate-800 mt-1"
              />
            </div>

            <div>
              <Label className="text-[10px] text-slate-400">Border Color Class</Label>
              <Input
                value={config.styling?.colors?.border || ""}
                onChange={(e) => updateColorStyling('border', e.target.value)}
                placeholder="border-slate-800"
                className="h-8 text-xs font-mono bg-slate-900 border-slate-800 mt-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
