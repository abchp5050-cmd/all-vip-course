import os

cats_content = """import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { toast } from "../../hooks/use-toast"
import ConfirmDialog from "../../components/ConfirmDialog"
import { 
  FolderTree, Plus, Edit2, Trash2, X, Upload, Save, 
  Eye, EyeOff, LayoutGrid, List, Search, Folder, Move, Link as LinkIcon
} from "lucide-react"

export default function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [courses, setCourses] = useState([]) // to count courses per category
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  
  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} })

  // Forms state
  const [categoryForm, setCategoryForm] = useState({
    title: "", description: "", imageURL: "", order: 0, isHidden: false
  })
  
  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: "", title: "", description: "", imageURL: "", order: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catsSnap, subcatsSnap, coursesSnap] = await Promise.all([
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "subcategories")),
        getDocs(collection(db, "courses"))
      ])

      let cats = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      cats.sort((a, b) => (a.order || 0) - (b.order || 0))
      
      let subcats = subcatsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      subcats.sort((a, b) => (a.order || 0) - (b.order || 0))

      setCategories(cats)
      setSubcategories(subcats)
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to load categories." })
    } finally {
      setLoading(false)
    }
  }

  // ---- CATEGORY HANDLERS ----
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat)
      setCategoryForm({
        title: cat.title || "",
        description: cat.description || "",
        imageURL: cat.imageURL || "",
        order: cat.order || 0,
        isHidden: cat.isHidden || false
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ title: "", description: "", imageURL: "", order: categories.length, isHidden: false })
    }
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    try {
      const data = {
        title: categoryForm.title,
        description: categoryForm.description,
        imageURL: categoryForm.imageURL,
        order: Number(categoryForm.order),
        isHidden: categoryForm.isHidden,
        updatedAt: serverTimestamp()
      }

      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), data)
        toast({ title: "Success", description: "Category updated" })
      } else {
        data.createdAt = serverTimestamp()
        await addDoc(collection(db, "categories"), data)
        toast({ title: "Success", description: "Category created" })
      }
      setShowCategoryModal(false)
      fetchData()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleDeleteCategory = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Category",
      message: "Are you sure? This will not delete the courses inside it, but they will lose their category association.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "categories", id))
          toast({ title: "Success", description: "Category deleted" })
          fetchData()
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: error.message })
        }
      }
    })
  }

  // ---- SUBCATEGORY HANDLERS ----
  const handleOpenSubcategoryModal = (subcat = null) => {
    if (subcat) {
      setEditingSubcategory(subcat)
      setSubcategoryForm({
        categoryId: subcat.categoryId || "",
        title: subcat.title || "",
        description: subcat.description || "",
        imageURL: subcat.imageURL || "",
        order: subcat.order || 0
      })
    } else {
      setEditingSubcategory(null)
      setSubcategoryForm({ categoryId: categories[0]?.id || "", title: "", description: "", imageURL: "", order: subcategories.length })
    }
    setShowSubcategoryModal(true)
  }

  const handleSaveSubcategory = async (e) => {
    e.preventDefault()
    if (!subcategoryForm.categoryId) {
      toast({ variant: "destructive", title: "Required", description: "Please select a parent category" })
      return
    }
    try {
      const data = {
        categoryId: subcategoryForm.categoryId,
        title: subcategoryForm.title,
        description: subcategoryForm.description,
        imageURL: subcategoryForm.imageURL,
        order: Number(subcategoryForm.order),
        updatedAt: serverTimestamp()
      }

      if (editingSubcategory) {
        await updateDoc(doc(db, "subcategories", editingSubcategory.id), data)
        toast({ title: "Success", description: "Subcategory updated" })
      } else {
        data.createdAt = serverTimestamp()
        await addDoc(collection(db, "subcategories"), data)
        toast({ title: "Success", description: "Subcategory created" })
      }
      setShowSubcategoryModal(false)
      fetchData()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleDeleteSubcategory = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Subcategory",
      message: "Are you sure you want to delete this subcategory?",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "subcategories", id))
          toast({ title: "Success", description: "Subcategory deleted" })
          fetchData()
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: error.message })
        }
      }
    })
  }

  const filteredCategories = categories.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Categories</h2>
          <p className="text-slate-500 text-sm mt-1">Organize your courses into structured categories</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleOpenSubcategoryModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl transition-colors font-medium text-sm"
          >
            <FolderTree size={18} /> Add Subcategory
          </button>
          <button
            onClick={() => handleOpenCategoryModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow transition-all font-medium text-sm"
          >
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(n => <div key={n} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredCategories.map((category) => {
            const catSubcategories = subcategories.filter(s => s.categoryId === category.id)
            const catCourses = courses.filter(c => c.category === category.title)
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={category.id}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="p-5 flex items-start gap-4 border-b border-slate-50 dark:border-slate-800/50">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {category.imageURL ? (
                      <img src={category.imageURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Folder className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">{category.title}</h3>
                      {category.isHidden ? (
                        <span className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg" title="Hidden">
                          <EyeOff className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg" title="Visible">
                          <Eye className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{category.description || "No description"}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><FolderTree className="w-3.5 h-3.5" /> {catSubcategories.length} Subs</span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                        {catCourses.length} Courses
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subcategories preview list inside card */}
                {catSubcategories.length > 0 && viewMode === 'grid' && (
                  <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-900/50 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Subcategories</p>
                    <div className="space-y-1.5">
                      {catSubcategories.slice(0, 3).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between group/sub">
                          <span className="text-sm text-slate-600 dark:text-slate-300 truncate pr-4">{sub.title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenSubcategoryModal(sub)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeleteSubcategory(sub.id)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded text-rose-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                      {catSubcategories.length > 3 && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">+{catSubcategories.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto px-5 py-3 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Move className="w-3 h-3" /> Order: {category.order}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenCategoryModal(category)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors shadow-sm bg-transparent hover:shadow">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600 transition-colors shadow-sm bg-transparent hover:shadow">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Category Form Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <h3 className="text-lg font-bold">{editingCategory ? "Edit Category" : "New Category"}</h3>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveCategory} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title</label>
                  <input type="text" value={categoryForm.title} onChange={e => setCategoryForm({...categoryForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} rows={2} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Image URL</label>
                    <input type="url" value={categoryForm.imageURL} onChange={e => setCategoryForm({...categoryForm, imageURL: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Display Order</label>
                    <input type="number" value={categoryForm.order} onChange={e => setCategoryForm({...categoryForm, order: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" id="hideCat" checked={categoryForm.isHidden} onChange={e => setCategoryForm({...categoryForm, isHidden: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300" />
                  <label htmlFor="hideCat" className="text-sm font-medium">Hide from public frontend</label>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Subcategory Form Modal */}
      <AnimatePresence>
        {showSubcategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSubcategoryModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <h3 className="text-lg font-bold">{editingSubcategory ? "Edit Subcategory" : "New Subcategory"}</h3>
                <button onClick={() => setShowSubcategoryModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveSubcategory} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Parent Category</label>
                  <select value={subcategoryForm.categoryId} onChange={e => setSubcategoryForm({...subcategoryForm, categoryId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title</label>
                  <input type="text" value={subcategoryForm.title} onChange={e => setSubcategoryForm({...subcategoryForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Image URL</label>
                    <input type="url" value={subcategoryForm.imageURL} onChange={e => setSubcategoryForm({...subcategoryForm, imageURL: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Display Order</label>
                    <input type="number" value={subcategoryForm.order} onChange={e => setSubcategoryForm({...subcategoryForm, order: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowSubcategoryModal(false)} className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} variant={confirmDialog.variant} />
    </div>
  )
}
"""

with open("src/pages/admin/ManageCategories.jsx", "w") as f:
    f.write(cats_content)

print("ManageCategories.jsx rewritten.")
