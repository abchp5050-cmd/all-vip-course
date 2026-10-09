"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadImageToImgBB } from "../../lib/imgbb"
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react"

export default function ManageBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
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

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const q = query(collection(db, "banners"), orderBy("displayOrder", "asc"))
      const snapshot = await getDocs(q)
      const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setBanners(bannersData)
    } catch (error) {
      console.error("Error fetching banners:", error)
      alert("Failed to load banners.")
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
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
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
      } else {
        bannerData.createdAt = serverTimestamp()
        await addDoc(collection(db, "banners"), bannerData)
      }

      await fetchBanners()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error saving banner:", error)
      alert("Failed to save banner. Please check console for details.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await deleteDoc(doc(db, "banners", id))
        setBanners(banners.filter(b => b.id !== id))
      } catch (error) {
        console.error("Error deleting banner:", error)
        alert("Failed to delete banner.")
      }
    }
  }

  const toggleStatus = async (banner) => {
    try {
      const newStatus = banner.status === "active" ? "inactive" : "active"
      await updateDoc(doc(db, "banners", banner.id), { status: newStatus })
      setBanners(banners.map(b => b.id === banner.id ? { ...b, status: newStatus } : b))
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Banners</h2>
          <p className="text-sm text-muted-foreground mt-1">Add and reorder dynamic homepage banners.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 w-16">Order</th>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Title & Subtitle</th>
                  <th className="px-4 py-3">Button</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No banners found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono">{banner.displayOrder}</td>
                      <td className="px-4 py-3">
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt="Banner" className="w-20 h-12 object-cover rounded shadow-sm border border-border" />
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground line-clamp-1">{banner.title || "-"}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{banner.subtitle || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs bg-muted inline-block px-2 py-1 rounded border border-border">
                          {banner.buttonText || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStatus(banner)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            banner.status === "active"
                              ? "bg-green-500/10 text-green-600 border border-green-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {banner.status === "active" ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(banner)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-bold">{editingId ? "Edit Banner" : "Add New Banner"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Trash2 className="w-5 h-5 hidden" /> {/* Just spacing or use X instead */}
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="bannerForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium mb-1">Banner Image (Required)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                    {...(!editingId && !imageFile && !formData.imageUrl ? { required: true } : {})}
                  />
                  {formData.imageUrl && !imageFile && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                      <img src={formData.imageUrl} className="w-16 h-10 object-cover rounded" alt="Current" />
                      Current Image
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground"
                    placeholder="e.g. Master Your HSC Preparation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle / Description</label>
                  <textarea
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground resize-none"
                    placeholder="e.g. Complete courses with expert guidance"
                    rows="2"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-lg bg-background"
                      placeholder="e.g. Explore Courses"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Button Link</label>
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-lg bg-background"
                      placeholder="e.g. /courses"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-lg bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-lg bg-background"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Disabled</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bannerForm"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Banner"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
