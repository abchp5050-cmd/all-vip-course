"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadImageToImgBB } from "../../lib/imgbb"
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, AlertCircle, X, Check, GripHorizontal } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

export default function ManageBanners() {
  const { toast } = useToast()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [bannerToDelete, setBannerToDelete] = useState(null)
  
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    status: "active",
    displayOrder: 0,
    imageUrl: ""
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, "banners"), orderBy("displayOrder", "asc"))
      const snapshot = await getDocs(q)
      const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setBanners(bannersData)
    } catch (error) {
      console.error("Error fetching banners:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load banners. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        buttonText: banner.buttonText || "",
        buttonLink: banner.buttonLink || "",
        status: banner.status || "active",
        displayOrder: banner.displayOrder || 0,
        imageUrl: banner.imageUrl || ""
      })
      setEditingId(banner.id)
      setImagePreview(banner.imageUrl)
    } else {
      setFormData({
        title: "",
        subtitle: "",
        buttonText: "",
        buttonLink: "",
        status: "active",
        displayOrder: banners.length,
        imageUrl: ""
      })
      setEditingId(null)
      setImagePreview(null)
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      let finalImageUrl = formData.imageUrl
      
      if (imageFile) {
        finalImageUrl = await uploadImageToImgBB(imageFile)
      }
      
      if (!finalImageUrl) {
         toast({
          variant: "destructive",
          title: "Missing Image",
          description: "Please select a banner image."
        })
        setSaving(false)
        return
      }

      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        status: formData.status,
        displayOrder: Number(formData.displayOrder),
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp()
      }

      if (editingId) {
        await updateDoc(doc(db, "banners", editingId), bannerData)
        toast({ title: "Success", description: "Banner updated successfully!" })
      } else {
        bannerData.createdAt = serverTimestamp()
        await addDoc(collection(db, "banners"), bannerData)
        toast({ title: "Success", description: "Banner added successfully!" })
      }

      await fetchBanners()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error saving banner:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save banner. Please check console for details."
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (banner) => {
    setBannerToDelete(banner)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!bannerToDelete) return
    try {
      await deleteDoc(doc(db, "banners", bannerToDelete.id))
      toast({ title: "Deleted", description: "Banner deleted successfully." })
      await fetchBanners()
      setIsDeleteModalOpen(false)
      setBannerToDelete(null)
    } catch (error) {
      console.error("Error deleting banner:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete banner."
      })
    }
  }

  const toggleStatus = async (banner) => {
    try {
      const newStatus = banner.status === "active" ? "inactive" : "active"
      await updateDoc(doc(db, "banners", banner.id), { status: newStatus })
      setBanners(banners.map(b => b.id === banner.id ? { ...b, status: newStatus } : b))
      toast({ title: "Status Updated", description: `Banner is now ${newStatus}.` })
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update banner status."
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banner Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your homepage hero banners. Drag-and-drop coming soon, use order numbers to sort.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      {/* Banner Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-card rounded-2xl border border-border h-[300px] animate-pulse flex flex-col overflow-hidden">
               <div className="h-[140px] bg-muted/50 w-full" />
               <div className="p-5 space-y-3">
                 <div className="h-5 bg-muted rounded w-3/4" />
                 <div className="h-4 bg-muted rounded w-1/2" />
                 <div className="flex justify-between mt-4">
                    <div className="h-8 bg-muted rounded w-20" />
                    <div className="h-8 bg-muted rounded w-20" />
                 </div>
               </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Banners Found</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            You haven't created any banners yet. The homepage will show default fallback banners until you add one here.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create Your First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={banner.id} 
              className="group bg-card rounded-2xl border border-white/5 shadow-lg overflow-hidden hover:border-primary/30 hover:shadow-primary/10 transition-all duration-300 flex flex-col"
            >
              {/* Image Header */}
              <div className="relative h-[160px] w-full overflow-hidden bg-muted">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md backdrop-blur-md border ${
                    banner.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                  }`}>
                    {banner.status === 'active' ? 'Active' : 'Disabled'}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-black/40 text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
                    <GripHorizontal className="w-3 h-3" /> Order: {banner.displayOrder}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold line-clamp-1 mb-1">{banner.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {banner.subtitle || "No subtitle"}
                </p>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <button
                      onClick={() => toggleStatus(banner)}
                      className={`text-sm font-medium transition-colors ${
                        banner.status === 'active' ? 'text-amber-500 hover:text-amber-400' : 'text-green-500 hover:text-green-400'
                      }`}
                    >
                      {banner.status === 'active' ? 'Disable' : 'Enable'}
                   </button>
                   <div className="flex items-center gap-2">
                     <button
                        onClick={() => handleOpenModal(banner)}
                        className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(banner)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !saving && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-muted/20">
                <h3 className="text-xl font-bold">{editingId ? "Edit Banner" : "Add New Banner"}</h3>
                <button onClick={() => !saving && setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="bannerForm" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Image Upload Area */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Banner Image <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        {...(!editingId && !imageFile && !formData.imageUrl ? { required: true } : {})}
                      />
                      <div className={`w-full h-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${imagePreview ? 'border-primary/50' : 'border-border hover:border-primary/50 bg-muted/30'}`}>
                        {imagePreview ? (
                           <>
                             <img src={imagePreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Preview" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                               <div className="px-4 py-2 bg-black/60 rounded-lg text-white text-sm font-medium backdrop-blur-sm border border-white/10 flex items-center gap-2">
                                 <Edit2 className="w-4 h-4" /> Change Image
                               </div>
                             </div>
                           </>
                        ) : (
                          <div className="text-center p-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                              <ImageIcon className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium mb-1">Click or drag image to upload</p>
                            <p className="text-xs text-muted-foreground">High quality 16:9 image recommended</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 md:col-span-2">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full p-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                          placeholder="e.g. Master Your HSC Preparation"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Subtitle / Description</label>
                        <textarea
                          value={formData.subtitle}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          className="w-full p-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground resize-none"
                          placeholder="e.g. Complete courses with expert guidance"
                          rows="2"
                        ></textarea>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">Button Text</label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                        className="w-full p-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="e.g. Explore Courses"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Button Link</label>
                      <input
                        type="text"
                        value={formData.buttonLink}
                        onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                        className="w-full p-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="e.g. /courses"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">Display Order <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                        className="w-full p-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full p-3 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Disabled</option>
                      </select>
                    </div>
                  </div>

                </form>
              </div>
              
              <div className="p-6 border-t border-white/5 bg-muted/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-semibold bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="bannerForm"
                  disabled={saving}
                  className="flex items-center justify-center min-w-[140px] gap-2 px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Banner
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsDeleteModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-card border border-white/10 shadow-2xl rounded-3xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Banner?</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete <span className="font-semibold text-foreground">"{bannerToDelete?.title}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                   <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-6 py-2.5 font-semibold bg-secondary hover:bg-secondary/80 rounded-xl transition-colors w-full"
                   >
                    Cancel
                   </button>
                   <button
                    onClick={handleDelete}
                    className="px-6 py-2.5 font-semibold bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors w-full shadow-lg shadow-red-500/20"
                   >
                    Delete
                   </button>
                </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  )
}
