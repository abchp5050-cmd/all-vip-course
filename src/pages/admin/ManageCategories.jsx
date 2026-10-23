import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadImageToImgBB } from "../../lib/imgbb"
import { toast } from "../../hooks/use-toast"
import ConfirmDialog from "../../components/ConfirmDialog"
import { 
  FolderTree, Plus, Edit2, Trash2, X, Upload, Save, 
  Eye, EyeOff, LayoutGrid, List, Search, Folder, Move, Link as LinkIcon,
  Loader2, Image as ImageIcon
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

  // Image Upload state for Category
  const [categorySourceType, setCategorySourceType] = useState("upload") // "upload" | "url"
  const [categoryImageFile, setCategoryImageFile] = useState(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState(null)
  const [uploadingCategory, setUploadingCategory] = useState(false)
  const [isCategoryDragging, setIsCategoryDragging] = useState(false)
  const categoryFileInputRef = useRef(null)
  const categoryUrlInputRef = useRef(null)

  // Image Upload state for Subcategory
  const [subcategorySourceType, setSubcategorySourceType] = useState("upload") // "upload" | "url"
  const [subcategoryImageFile, setSubcategoryImageFile] = useState(null)
  const [subcategoryImagePreview, setSubcategoryImagePreview] = useState(null)
  const [uploadingSubcategory, setUploadingSubcategory] = useState(false)
  const [isSubcategoryDragging, setIsSubcategoryDragging] = useState(false)
  const subcategoryFileInputRef = useRef(null)
  const subcategoryUrlInputRef = useRef(null)

  // File validation constants
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

  const validateImageFile = (file) => {
    if (!file) return false

    const extension = "." + (file.name.split(".").pop() || "").toLowerCase()
    const isTypeValid = ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension)

    if (!isTypeValid) {
      toast({
        variant: "destructive",
        title: "Unsupported Image Format",
        description: "Please select a JPG, PNG, or WebP image."
      })
      return false
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1)
      toast({
        variant: "destructive",
        title: "Image Too Large",
        description: `Image size is ${sizeInMB}MB. Maximum allowed size is 5MB.`
      })
      return false
    }

    return true
  }

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
      setCategoryImagePreview(cat.imageURL || null)
      setCategorySourceType("upload")
    } else {
      setEditingCategory(null)
      setCategoryForm({ title: "", description: "", imageURL: "", order: categories.length, isHidden: false })
      setCategoryImagePreview(null)
      setCategorySourceType("upload")
    }
    setCategoryImageFile(null)
    setIsCategoryDragging(false)
    if (categoryFileInputRef.current) categoryFileInputRef.current.value = ""
    setShowCategoryModal(true)
  }

  const handleCloseCategoryModal = () => {
    if (categoryImagePreview && categoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(categoryImagePreview)
    }
    setCategoryImageFile(null)
    setCategoryImagePreview(null)
    setIsCategoryDragging(false)
    setShowCategoryModal(false)
    setEditingCategory(null)
  }

  const handleCategoryImageSelect = (file) => {
    if (!validateImageFile(file)) return

    if (categoryImagePreview && categoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(categoryImagePreview)
    }

    const preview = URL.createObjectURL(file)
    setCategoryImageFile(file)
    setCategoryImagePreview(preview)
  }

  const handleRemoveCategoryImage = () => {
    if (categoryImagePreview && categoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(categoryImagePreview)
    }
    setCategoryImageFile(null)
    setCategoryImagePreview(null)
    setCategoryForm(prev => ({ ...prev, imageURL: "" }))
    if (categoryFileInputRef.current) categoryFileInputRef.current.value = ""
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    if (!categoryForm.title.trim()) {
      toast({ variant: "destructive", title: "Title Required", description: "Category title is required" })
      return
    }

    setUploadingCategory(true)
    try {
      let finalImageURL = categoryForm.imageURL.trim()

      if (categorySourceType === "upload" && categoryImageFile) {
        try {
          finalImageURL = await uploadImageToImgBB(categoryImageFile)
        } catch (uploadError) {
          throw new Error(uploadError.message || "Failed to upload image. Please try again.")
        }
      }

      const data = {
        title: categoryForm.title.trim(),
        description: categoryForm.description.trim(),
        imageURL: finalImageURL,
        order: Number(categoryForm.order) || 0,
        isHidden: Boolean(categoryForm.isHidden),
        updatedAt: serverTimestamp()
      }

      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), data)
        toast({ title: "Success", description: "Category updated successfully" })
      } else {
        data.createdAt = serverTimestamp()
        await addDoc(collection(db, "categories"), data)
        toast({ title: "Success", description: "Category created successfully" })
      }

      handleCloseCategoryModal()
      fetchData()
    } catch (error) {
      console.error("Error saving category:", error)
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save category" })
    } finally {
      setUploadingCategory(false)
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
      setSubcategoryImagePreview(subcat.imageURL || null)
      setSubcategorySourceType("upload")
    } else {
      setEditingSubcategory(null)
      setSubcategoryForm({ categoryId: categories[0]?.id || "", title: "", description: "", imageURL: "", order: subcategories.length })
      setSubcategoryImagePreview(null)
      setSubcategorySourceType("upload")
    }
    setSubcategoryImageFile(null)
    setIsSubcategoryDragging(false)
    if (subcategoryFileInputRef.current) subcategoryFileInputRef.current.value = ""
    setShowSubcategoryModal(true)
  }

  const handleCloseSubcategoryModal = () => {
    if (subcategoryImagePreview && subcategoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(subcategoryImagePreview)
    }
    setSubcategoryImageFile(null)
    setSubcategoryImagePreview(null)
    setIsSubcategoryDragging(false)
    setShowSubcategoryModal(false)
    setEditingSubcategory(null)
  }

  const handleSubcategoryImageSelect = (file) => {
    if (!validateImageFile(file)) return

    if (subcategoryImagePreview && subcategoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(subcategoryImagePreview)
    }

    const preview = URL.createObjectURL(file)
    setSubcategoryImageFile(file)
    setSubcategoryImagePreview(preview)
  }

  const handleRemoveSubcategoryImage = () => {
    if (subcategoryImagePreview && subcategoryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(subcategoryImagePreview)
    }
    setSubcategoryImageFile(null)
    setSubcategoryImagePreview(null)
    setSubcategoryForm(prev => ({ ...prev, imageURL: "" }))
    if (subcategoryFileInputRef.current) subcategoryFileInputRef.current.value = ""
  }

  const handleSaveSubcategory = async (e) => {
    e.preventDefault()
    if (!subcategoryForm.categoryId) {
      toast({ variant: "destructive", title: "Required", description: "Please select a parent category" })
      return
    }
    if (!subcategoryForm.title.trim()) {
      toast({ variant: "destructive", title: "Title Required", description: "Subcategory title is required" })
      return
    }

    setUploadingSubcategory(true)
    try {
      let finalImageURL = subcategoryForm.imageURL.trim()

      if (subcategorySourceType === "upload" && subcategoryImageFile) {
        try {
          finalImageURL = await uploadImageToImgBB(subcategoryImageFile)
        } catch (uploadError) {
          throw new Error(uploadError.message || "Failed to upload image. Please try again.")
        }
      }

      const data = {
        categoryId: subcategoryForm.categoryId,
        title: subcategoryForm.title.trim(),
        description: subcategoryForm.description.trim(),
        imageURL: finalImageURL,
        order: Number(subcategoryForm.order) || 0,
        updatedAt: serverTimestamp()
      }

      if (editingSubcategory) {
        await updateDoc(doc(db, "subcategories", editingSubcategory.id), data)
        toast({ title: "Success", description: "Subcategory updated successfully" })
      } else {
        data.createdAt = serverTimestamp()
        await addDoc(collection(db, "subcategories"), data)
        toast({ title: "Success", description: "Subcategory created successfully" })
      }

      handleCloseSubcategoryModal()
      fetchData()
    } catch (error) {
      console.error("Error saving subcategory:", error)
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save subcategory" })
    } finally {
      setUploadingSubcategory(false)
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseCategoryModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingCategory ? "Edit Category" : "New Category"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="p-6 space-y-4 overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={e => setCategoryForm({...categoryForm, title: e.target.value})}
                    placeholder="e.g. Web Development"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                    placeholder="Brief description of this category..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white transition-all resize-none"
                  />
                </div>

                {/* Category Image Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Category Image
                    </label>
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setCategorySourceType("upload")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          categorySourceType === "upload"
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategorySourceType("url")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          categorySourceType === "url"
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Image URL</span>
                      </button>
                    </div>
                  </div>

                  <input
                    ref={categoryFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCategoryImageSelect(file)
                    }}
                    className="hidden"
                  />

                  {categoryImagePreview ? (
                    <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 relative">
                        <img
                          src={categoryImagePreview}
                          alt="Category Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = "https://placehold.co/160x160/1e293b/ffffff?text=Image"
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                            {categoryImageFile ? "Ready to upload" : "Current Image"}
                          </span>
                          {categoryImageFile && (
                            <span className="text-xs text-slate-500">
                              {(categoryImageFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                          {categoryImageFile ? categoryImageFile.name : (categoryForm.imageURL || "Direct image URL")}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          JPG, PNG, or WebP (max 5MB)
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (categorySourceType === "upload") {
                              categoryFileInputRef.current?.click()
                            } else {
                              categoryUrlInputRef.current?.focus()
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                          title="Change image"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveCategoryImage}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 border border-rose-200/50 dark:border-rose-900/50"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {categorySourceType === "upload" ? (
                        <div
                          onClick={() => categoryFileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsCategoryDragging(true) }}
                          onDragLeave={() => setIsCategoryDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setIsCategoryDragging(false)
                            const file = e.dataTransfer.files?.[0]
                            if (file) handleCategoryImageSelect(file)
                          }}
                          className={`group cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                            isCategoryDragging
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/70 dark:hover:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600"
                          }`}
                        >
                          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Click to upload photo
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Mobile gallery or computer • JPG, PNG, WebP (max 5MB)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              ref={categoryUrlInputRef}
                              type="url"
                              value={categoryForm.imageURL}
                              onChange={(e) => {
                                const url = e.target.value
                                setCategoryForm({ ...categoryForm, imageURL: url })
                                setCategoryImagePreview(url.trim() ? url.trim() : null)
                              }}
                              placeholder="https://example.com/image.jpg"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Paste a direct link to an image (JPG, PNG, WebP).
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {categoryImagePreview && categorySourceType === "url" && (
                    <div className="mt-2">
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={categoryUrlInputRef}
                          type="url"
                          value={categoryForm.imageURL}
                          onChange={(e) => {
                            const url = e.target.value
                            setCategoryForm({ ...categoryForm, imageURL: url })
                            setCategoryImagePreview(url.trim() ? url.trim() : null)
                          }}
                          placeholder="https://example.com/image.jpg"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-900 dark:text-white transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Order & Hide Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={categoryForm.order}
                      onChange={e => setCategoryForm({...categoryForm, order: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center sm:pt-6">
                    <label htmlFor="hideCat" className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="hideCat"
                        checked={categoryForm.isHidden}
                        onChange={e => setCategoryForm({...categoryForm, isHidden: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hide from public frontend
                      </span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseCategoryModal}
                    disabled={uploadingCategory}
                    className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingCategory}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingCategory ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{categoryImageFile ? "Uploading image..." : "Saving..."}</span>
                      </>
                    ) : (
                      <span>Save Category</span>
                    )}
                  </button>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseSubcategoryModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingSubcategory ? "Edit Subcategory" : "New Subcategory"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseSubcategoryModal}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubcategory} className="p-6 space-y-4 overflow-y-auto">
                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Parent Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subcategoryForm.categoryId}
                    onChange={e => setSubcategoryForm({...subcategoryForm, categoryId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subcategoryForm.title}
                    onChange={e => setSubcategoryForm({...subcategoryForm, title: e.target.value})}
                    placeholder="e.g. React & Next.js"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>

                {/* Subcategory Image Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Subcategory Image
                    </label>
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setSubcategorySourceType("upload")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          subcategorySourceType === "upload"
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubcategorySourceType("url")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          subcategorySourceType === "url"
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Image URL</span>
                      </button>
                    </div>
                  </div>

                  <input
                    ref={subcategoryFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleSubcategoryImageSelect(file)
                    }}
                    className="hidden"
                  />

                  {subcategoryImagePreview ? (
                    <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 relative">
                        <img
                          src={subcategoryImagePreview}
                          alt="Subcategory Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = "https://placehold.co/160x160/1e293b/ffffff?text=Image"
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                            {subcategoryImageFile ? "Ready to upload" : "Current Image"}
                          </span>
                          {subcategoryImageFile && (
                            <span className="text-xs text-slate-500">
                              {(subcategoryImageFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                          {subcategoryImageFile ? subcategoryImageFile.name : (subcategoryForm.imageURL || "Direct image URL")}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          JPG, PNG, or WebP (max 5MB)
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (subcategorySourceType === "upload") {
                              subcategoryFileInputRef.current?.click()
                            } else {
                              subcategoryUrlInputRef.current?.focus()
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                          title="Change image"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSubcategoryImage}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 border border-rose-200/50 dark:border-rose-900/50"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {subcategorySourceType === "upload" ? (
                        <div
                          onClick={() => subcategoryFileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsSubcategoryDragging(true) }}
                          onDragLeave={() => setIsSubcategoryDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setIsSubcategoryDragging(false)
                            const file = e.dataTransfer.files?.[0]
                            if (file) handleSubcategoryImageSelect(file)
                          }}
                          className={`group cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                            isSubcategoryDragging
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/70 dark:hover:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600"
                          }`}
                        >
                          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Click to upload photo
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Mobile gallery or computer • JPG, PNG, WebP (max 5MB)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              ref={subcategoryUrlInputRef}
                              type="url"
                              value={subcategoryForm.imageURL}
                              onChange={(e) => {
                                const url = e.target.value
                                setSubcategoryForm({ ...subcategoryForm, imageURL: url })
                                setSubcategoryImagePreview(url.trim() ? url.trim() : null)
                              }}
                              placeholder="https://example.com/image.jpg"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white transition-all"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Paste a direct link to an image (JPG, PNG, WebP).
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {subcategoryImagePreview && subcategorySourceType === "url" && (
                    <div className="mt-2">
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={subcategoryUrlInputRef}
                          type="url"
                          value={subcategoryForm.imageURL}
                          onChange={(e) => {
                            const url = e.target.value
                            setSubcategoryForm({ ...subcategoryForm, imageURL: url })
                            setSubcategoryImagePreview(url.trim() ? url.trim() : null)
                          }}
                          placeholder="https://example.com/image.jpg"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-900 dark:text-white transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={subcategoryForm.order}
                    onChange={e => setSubcategoryForm({...subcategoryForm, order: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseSubcategoryModal}
                    disabled={uploadingSubcategory}
                    className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingSubcategory}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingSubcategory ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{subcategoryImageFile ? "Uploading image..." : "Saving..."}</span>
                      </>
                    ) : (
                      <span>Save Subcategory</span>
                    )}
                  </button>
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
