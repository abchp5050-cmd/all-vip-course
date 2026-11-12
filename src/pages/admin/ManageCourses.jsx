import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadImageToImgBB } from "../../lib/imgbb"
import { generateSlug } from "../../lib/slug"
import { parseTelegramLinks } from "../../lib/utils"
import ConfirmDialog from "../../components/ConfirmDialog"
import { toast } from "../../hooks/use-toast"
import { 
  Plus, Search, Edit2, Trash2, X, BookOpen, Upload, 
  Link as LinkIcon, Tag, Filter, Clock, Users, DollarSign,
  CheckCircle, MoreVertical, LayoutGrid, List, Send,
  ChevronLeft, ChevronRight, Check
} from "lucide-react"

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [teachers, setTeachers] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // grid | list
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 200ms debounce on search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 200)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, categoryFilter, statusFilter])
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} })
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructors: [],
    category: "",
    categories: [],
    subcategory: "",
    price: "",
    status: "running",
    publishStatus: "published",
    imageType: "upload",
    imageLink: "",
    telegramLink: "",
    tags: [],
  })
  const [tagInput, setTagInput] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [telegramLinks, setTelegramLinks] = useState([{ label: "", url: "" }])
  
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [coursesSnap, categoriesSnap, subcategoriesSnap, teachersSnap] = await Promise.all([
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "subcategories")),
        getDocs(collection(db, "teachers")),
      ])

      setCourses(
        coursesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      )
      setCategories(categoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setSubcategories(subcategoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course)
      const existingTgLinks = parseTelegramLinks(course.telegramLinks || course.telegramLink || course.telegramGroupLink)
      setTelegramLinks(existingTgLinks.length > 0 ? existingTgLinks : [{ label: "", url: "" }])
      
      const courseCategories = Array.isArray(course.categories) && course.categories.length > 0
        ? course.categories.filter(Boolean)
        : (course.category ? [course.category] : [])

      setFormData({
        title: course.title || "",
        description: course.description || "",
        instructors: course.instructors || (course.instructorName ? [course.instructorName] : []),
        category: courseCategories[0] || course.category || "",
        categories: courseCategories,
        subcategory: course.subcategory || "",
        price: course.price !== undefined && course.price !== null ? course.price : "",
        status: course.status || "running",
        publishStatus: course.publishStatus || "published",
        imageType: course.thumbnailURL ? "link" : "upload",
        imageLink: course.thumbnailURL || "",
        telegramLink: course.telegramLink || course.telegramGroupLink || "",
        tags: course.tags || [],
      })
    } else {
      setEditingCourse(null)
      setTelegramLinks([{ label: "", url: "" }])
      setFormData({
        title: "",
        description: "",
        instructors: [],
        category: "",
        categories: [],
        subcategory: "",
        price: "",
        status: "running",
        publishStatus: "published",
        imageType: "upload",
        imageLink: "",
        telegramLink: "",
        tags: [],
      })
    }
    setImageFile(null)
    setTagInput("")
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
    setImageFile(null)
  }

  const handleToggleCategory = (catTitle) => {
    setFormData((prev) => {
      const currentCats = Array.isArray(prev.categories)
        ? prev.categories
        : (prev.category ? [prev.category] : [])
      const exists = currentCats.includes(catTitle)
      const nextCats = exists
        ? currentCats.filter((c) => c !== catTitle)
        : [...currentCats, catTitle]

      // Check if current subcategory is still valid under remaining categories
      const matchingCatIds = categories
        .filter((c) => nextCats.includes(c.title) || nextCats.includes(c.id))
        .map((c) => c.id)
      const currentSubcatValid = subcategories.some(
        (s) => s.title === prev.subcategory && matchingCatIds.includes(s.categoryId)
      )

      return {
        ...prev,
        categories: nextCats,
        category: nextCats[0] || "",
        subcategory: currentSubcatValid ? prev.subcategory : "",
      }
    })
  }

  const handleTelegramLinkChange = (index, field, value) => {
    setTelegramLinks((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...(updated[index] || { label: "", url: "" }),
        [field]: value
      }
      return updated
    })
  }

  const handleAddTelegramLink = () => {
    setTelegramLinks((prev) => [...prev, { label: "", url: "" }])
  }

  const handleRemoveTelegramLink = (index) => {
    setTelegramLinks((prev) => {
      if (prev.length <= 1) return [{ label: "", url: "" }]
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast({ variant: "destructive", title: "Title Required", description: "Course title is required" })
      return
    }

    setSubmitting(true)
    try {
      let thumbnailURL = formData.imageLink

      if (formData.imageType === "upload" && imageFile) {
        thumbnailURL = await uploadImageToImgBB(imageFile)
      }

      const validTelegramLinks = telegramLinks
        .map((l) => ({
          label: (l.label || "").trim(),
          url: (l.url || "").trim()
        }))
        .filter((l) => l.url.length > 0)

      const finalTelegramLinkString = validTelegramLinks.map((l) => l.url).join("\n")
      const primaryTelegramLink = validTelegramLinks.length > 0 ? validTelegramLinks[0].url : ""

      const selectedCategories = Array.isArray(formData.categories)
        ? formData.categories.filter(Boolean)
        : (formData.category ? [formData.category] : [])

      const primaryCategory = selectedCategories[0] || formData.category || ""

      const courseData = {
        title: formData.title,
        description: formData.description,
        instructors: formData.instructors,
        instructorName: formData.instructors.join(", "),
        category: primaryCategory,
        categories: selectedCategories,
        subcategory: formData.subcategory || "",
        price: Number(formData.price) || 0,
        status: formData.status,
        publishStatus: formData.publishStatus,
        thumbnailURL: thumbnailURL || "",
        telegramLinks: validTelegramLinks,
        telegramLink: finalTelegramLinkString,
        telegramGroupLink: primaryTelegramLink,
        tags: formData.tags || [],
        slug: editingCourse?.slug || generateSlug(formData.title),
        updatedAt: serverTimestamp(),
      }

      if (editingCourse) {
        await updateDoc(doc(db, "courses", editingCourse.id), courseData)
      } else {
        courseData.createdAt = serverTimestamp()
        await addDoc(collection(db, "courses"), courseData)
      }

      await fetchData()
      handleCloseModal()
      toast({
        title: "Success",
        description: editingCourse ? "Course updated successfully" : "Course created successfully",
      })
    } catch (error) {
      console.error("Error saving course:", error)
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (courseId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Course",
      message: "Are you sure you want to delete this course? This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "courses", courseId))
          await fetchData()
          toast({ title: "Success", description: "Course deleted successfully" })
        } catch (error) {
          console.error("Error deleting course:", error)
          toast({ variant: "destructive", title: "Error", description: error.message })
        }
      }
    })
  }
  
  // Memoized filtered courses
  const filteredCourses = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim()
    return courses.filter(course => {
      const courseCategories = Array.isArray(course.categories) && course.categories.length > 0
        ? course.categories
        : (course.category ? [course.category] : [])

      const matchesSearch = !q || 
                            course.title?.toLowerCase().includes(q) || 
                            courseCategories.some(c => c?.toLowerCase().includes(q)) ||
                            course.category?.toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "all" || 
                              courseCategories.includes(categoryFilter) || 
                              course.category === categoryFilter
      const matchesStatus = statusFilter === "all" || course.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [courses, debouncedSearchQuery, categoryFilter, statusFilter])
  
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage))
  const currentCourses = useMemo(() => {
    return filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredCourses, currentPage, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-[#0b0f19] p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Courses</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage your courses ({filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found)
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl shadow-sm hover:shadow-orange-500/20 transition-all font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          <span>Create Course</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-[#0b0f19] p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/[0.08] flex flex-col md:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search courses by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-orange-500/40 min-w-[120px]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-orange-500/40 min-w-[110px]"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="ongoing">Ongoing</option>
            <option value="complete">Complete</option>
          </select>
          <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-white/[0.05]">
            <button 
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Courses Display */}
      {loading ? (
        <>
          {/* Mobile loading skeleton */}
          <div className="block md:hidden space-y-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2.5 flex items-center gap-2.5 animate-pulse h-[82px]">
                <div className="w-[75px] h-[60px] rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
                <div className="w-16 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
          {/* Desktop loading skeleton */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/[0.08] h-[260px] rounded-xl animate-pulse" />
            ))}
          </div>
        </>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-[#0b0f19] py-12 px-6 text-center rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">No courses found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Try adjusting your search or filters, or create a new course.</p>
        </div>
      ) : (
        <>
          {/* Mobile View (< md): Professional Compact Row (height ~85-110px) */}
          <div className="block md:hidden space-y-2">
            {currentCourses.map((course) => {
              const courseImage = course.thumbnailURL || course.imageURL || course.image || course.coverImage
              return (
                <div
                  key={course.id}
                  className="relative bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/[0.08] hover:border-orange-500/30 rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm transition-all overflow-hidden"
                >
                  {/* LEFT: Real Course Thumbnail (75x60px) */}
                  <div className="w-[75px] h-[60px] min-w-[75px] max-w-[75px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-850 flex-shrink-0 relative border border-black/5 dark:border-white/5">
                    {courseImage ? (
                      <img
                        src={courseImage}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        width="75"
                        height="60"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div 
                      className="w-full h-full items-center justify-center text-slate-400"
                      style={{ display: courseImage ? 'none' : 'flex' }}
                    >
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    </div>
                    {course.publishStatus === "draft" && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-[9px] font-bold text-white px-1 py-0.5 rounded shadow-sm">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* CENTER: Title (max 2 lines with ellipsis), Price & Status */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-1" title={course.title}>
                      {course.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                      <span className="font-bold text-orange-500 dark:text-orange-400">
                        {course.price > 0 ? `৳${course.price}` : "Free"}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          course.status === "running"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${course.status === "running" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className="capitalize">{course.status || "Running"}</span>
                      </span>
                      {(() => {
                        const cats = Array.isArray(course.categories) && course.categories.length > 0 
                          ? course.categories 
                          : (course.category ? [course.category] : [])
                        if (cats.length === 0) return null
                        return (
                          <span className="hidden min-[380px]:inline-block text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]" title={cats.join(", ")}>
                            {cats[0]}{cats.length > 1 ? ` (+${cats.length - 1})` : ""}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  {/* RIGHT: Edit and Delete Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenModal(course)}
                      title="Edit Course"
                      className="p-2 rounded-lg text-slate-500 hover:text-orange-500 hover:bg-orange-500/10 dark:text-slate-400 dark:hover:text-orange-400 dark:hover:bg-orange-500/15 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      title="Delete Course"
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/15 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop View (>= md): Grid or List toggle */}
          <div className="hidden md:block">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentCourses.map((course) => {
                  const courseImage = course.thumbnailURL || course.imageURL || course.image || course.coverImage
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={course.id}
                      className="bg-white dark:bg-[#0b0f19] rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all flex flex-col group"
                    >
                      <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {courseImage ? (
                          <img
                            src={courseImage}
                            alt={course.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        {(() => {
                          const cats = Array.isArray(course.categories) && course.categories.length > 0 
                            ? course.categories 
                            : (course.category ? [course.category] : [])
                          if (cats.length === 0) {
                            return (
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded text-white">
                                Uncategorized
                              </div>
                            )
                          }
                          return (
                            <div className="absolute top-2 left-2 flex items-center gap-1 max-w-[80%]">
                              <div className="bg-black/60 backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded text-white truncate">
                                {cats[0]}
                              </div>
                              {cats.length > 1 && (
                                <div className="bg-indigo-600/85 backdrop-blur-sm text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" title={cats.slice(1).join(", ")}>
                                  +{cats.length - 1}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        {course.publishStatus === "draft" && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            Draft
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col">
                        <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white line-clamp-2 mb-2 leading-snug" title={course.title}>
                          {course.title}
                        </h3>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3 mt-auto">
                          <span
                            className={`inline-flex items-center gap-1 font-medium capitalize ${
                              course.status === "running" ? "text-emerald-500" : "text-amber-500"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${course.status === "running" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {course.status || "Running"}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {course.instructors?.length > 0
                              ? `${course.instructors.length} Teacher(s)`
                              : course.instructorName || "No teacher"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/[0.05]">
                          <div className="font-bold text-orange-500 dark:text-orange-400 text-sm sm:text-base">
                            {course.price > 0 ? `৳${course.price}` : "Free"}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenModal(course)}
                              title="Edit Course"
                              className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 dark:hover:bg-orange-500/15 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              title="Delete Course"
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0b0f19] rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-white/[0.08] text-xs uppercase font-semibold text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">Course</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Price</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {currentCourses.map((course) => {
                      const courseImage = course.thumbnailURL || course.imageURL || course.image || course.coverImage
                      return (
                        <tr key={course.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/25 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-[60px] h-[45px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative border border-black/5 dark:border-white/5">
                                {courseImage ? (
                                  <img src={courseImage} alt={course.title} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                {course.publishStatus === "draft" && (
                                  <span className="absolute bottom-0.5 left-0.5 bg-amber-500 text-[8px] font-bold text-white px-1 py-0.2 rounded">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug">
                                  {course.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[240px]">
                                  {course.instructors?.length > 0
                                    ? course.instructors.join(", ")
                                    : course.instructorName || "No instructor"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const cats = Array.isArray(course.categories) && course.categories.length > 0 
                                ? course.categories 
                                : (course.category ? [course.category] : [])
                              if (cats.length === 0) {
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    Uncategorized
                                  </span>
                                )
                              }
                              return (
                                <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                  {cats.map((c, i) => (
                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-3 font-bold text-xs sm:text-sm text-orange-500 dark:text-orange-400">
                            {course.price > 0 ? `৳${course.price}` : "Free"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                course.status === "running"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${course.status === "running" ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <span className="capitalize">{course.status || "Running"}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenModal(course)}
                                title="Edit Course"
                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 dark:hover:bg-orange-500/15 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(course.id)}
                                title="Delete Course"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination: [Previous] Page X of Y [Next] */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between sm:justify-center gap-3 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{" "}
                <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Course Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingCourse ? "Edit Course" : "Create New Course"}
                </h3>
                <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="course-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Info Section */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Course Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                          placeholder="e.g. Master HSC Physics"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                          placeholder="Detailed course description..."
                        />
                      </div>
                    </div>
                  </section>

                  {/* Organization Section */}
                  <section>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Organization</h4>
                      {formData.categories.length > 0 && (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                          {formData.categories.length} {formData.categories.length === 1 ? "category" : "categories"} selected
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Categories Multi-Select */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Categories <span className="text-xs font-normal text-slate-500">(select one or multiple)</span>
                          </label>
                          {formData.categories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, categories: [], category: "", subcategory: "" })}
                              className="text-xs text-rose-500 hover:text-rose-600 transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {/* Selected Categories as removable tags */}
                        {formData.categories.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 mb-2.5 min-h-[46px]">
                            {formData.categories.map((catTitle, idx) => (
                              <span
                                key={catTitle}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                                  idx === 0
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <span>{catTitle}</span>
                                {idx === 0 && (
                                  <span className="text-[9px] bg-white/20 uppercase tracking-wider px-1.5 py-0.5 rounded font-bold">
                                    Primary
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategory(catTitle)}
                                  className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                                  title="Remove category"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 mb-2.5 text-center">
                            <p className="text-xs text-slate-400">No categories selected. Click the badges below to choose categories.</p>
                          </div>
                        )}

                        {/* Clickable Pill Badges for All Categories */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Available Categories:
                          </span>
                          <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 max-h-36 overflow-y-auto">
                            {categories.length === 0 ? (
                              <p className="text-xs text-slate-400">No categories found in system</p>
                            ) : (
                              categories.map((c) => {
                                const isSelected = formData.categories.includes(c.title)
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleToggleCategory(c.title)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 select-none ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                                    <span>{c.title}</span>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subcategory */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Subcategory <span className="text-xs font-normal text-slate-500">(Optional)</span>
                        </label>
                        <select
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          disabled={formData.categories.length === 0}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm disabled:opacity-50"
                        >
                          <option value="">Select Subcategory</option>
                          {subcategories
                            .filter((s) => {
                              const matchingCatIds = categories
                                .filter((c) => formData.categories.includes(c.title) || formData.categories.includes(c.id))
                                .map((c) => c.id)
                              return matchingCatIds.includes(s.categoryId)
                            })
                            .map((s) => (
                              <option key={s.id} value={s.title}>{s.title}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </section>
                  
                  {/* Media Section */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Media & Pricing</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Course Thumbnail</label>
                        <div className="flex gap-2 mb-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageType: "upload" })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${formData.imageType === "upload" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageType: "link" })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${formData.imageType === "link" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                          >
                            <LinkIcon className="w-3.5 h-3.5" /> Image URL
                          </button>
                        </div>
                        
                        {formData.imageType === "upload" ? (
                           <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                             <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                           </div>
                        ) : (
                          <input type="url" value={formData.imageLink} onChange={(e) => setFormData({ ...formData, imageLink: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Price (৳)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                            placeholder="0 for free"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                        >
                          <option value="running">Running</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Telegram Group Links
                          </label>
                          {telegramLinks.filter((l) => l.url?.trim()).length > 0 && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                              {telegramLinks.filter((l) => l.url?.trim()).length} configured
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2.5">
                          {telegramLinks.map((link, idx) => (
                            <div key={idx} className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Send className="w-3.5 h-3.5 text-indigo-500" />
                                  Link #{idx + 1}
                                </span>
                                {telegramLinks.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTelegramLink(idx)}
                                    className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                    title="Remove this link"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Button Name / Label
                                  </label>
                                  <input
                                    type="text"
                                    value={link.label || ""}
                                    onChange={(e) => handleTelegramLinkChange(idx, "label", e.target.value)}
                                    placeholder="Button Name (e.g., Join Main Group / Cycle 1 / PDF Channel)"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Telegram URL
                                  </label>
                                  <div className="relative">
                                    <Send className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                      type="url"
                                      value={link.url || ""}
                                      onChange={(e) => handleTelegramLinkChange(idx, "url", e.target.value)}
                                      placeholder="https://t.me/+..."
                                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs text-slate-900 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleAddTelegramLink}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200/50 dark:border-indigo-800/50 w-fit"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Another Link</span>
                          </button>
                          <p className="text-xs text-slate-500">
                            {telegramLinks.filter((l) => l.url?.trim()).length > 1
                              ? `${telegramLinks.filter((l) => l.url?.trim()).length} links configured (each shown with its custom button name)`
                              : "Students will see this button to join the course Telegram community"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="course-form" 
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Saving...</>
                  ) : editingCourse ? "Save Changes" : "Publish Course"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  )
}
