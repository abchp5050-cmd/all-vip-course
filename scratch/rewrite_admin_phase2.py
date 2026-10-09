import os

courses_content = """import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadImageToImgBB } from "../../lib/imgbb"
import { generateSlug } from "../../lib/slug"
import ConfirmDialog from "../../components/ConfirmDialog"
import { toast } from "../../hooks/use-toast"
import { 
  Plus, Search, Edit2, Trash2, X, BookOpen, Upload, 
  Link as LinkIcon, Tag, Filter, Clock, Users, DollarSign,
  CheckCircle, MoreVertical, LayoutGrid, List
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
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // grid | list
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} })
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructors: [],
    category: "",
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
      setFormData({
        title: course.title || "",
        description: course.description || "",
        instructors: course.instructors || (course.instructorName ? [course.instructorName] : []),
        category: course.category || "",
        subcategory: course.subcategory || "",
        price: course.price || "",
        status: course.status || "running",
        publishStatus: course.publishStatus || "published",
        imageType: course.thumbnailURL ? "link" : "upload",
        imageLink: course.thumbnailURL || "",
        telegramLink: course.telegramLink || "",
        tags: course.tags || [],
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: "",
        description: "",
        instructors: [],
        category: "",
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

      const courseData = {
        title: formData.title,
        description: formData.description,
        instructors: formData.instructors,
        instructorName: formData.instructors.join(", "),
        category: formData.category,
        subcategory: formData.subcategory || "",
        price: Number(formData.price) || 0,
        status: formData.status,
        publishStatus: formData.publishStatus,
        thumbnailURL: thumbnailURL || "",
        telegramLink: formData.telegramLink || "",
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
  
  // Computed values
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.category?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })
  
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const currentCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Courses</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and organize your platform's courses</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow transition-all font-medium text-sm w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Create Course
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="ongoing">Ongoing</option>
            <option value="complete">Complete</option>
          </select>
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
      </div>

      {/* Courses Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(n => (
            <div key={n} className="bg-slate-100 dark:bg-slate-800 h-[320px] rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 py-16 px-6 text-center rounded-2xl border border-slate-100 dark:border-slate-800">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No courses found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search or filters, or create a new course.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentCourses.map((course) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {course.thumbnailURL ? (
                      <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm text-slate-700 dark:text-slate-300">
                      {course.category || "Uncategorized"}
                    </div>
                    {course.publishStatus === "draft" && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        Draft
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2 mb-2 leading-tight">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 mt-auto">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.instructors?.length > 0 ? course.instructors.length + ' Teacher' : 'No teacher'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="capitalize">{course.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                        {course.price > 0 ? `৳${course.price}` : "Free"}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal(course)} className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                              {course.thumbnailURL ? (
                                <img src={course.thumbnailURL} alt="" className="w-full h-full object-cover" />
                              ) : <BookOpen className="w-6 h-6 text-slate-400 m-3" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white text-sm">{course.title}</p>
                              <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{course.instructorName || "No instructor"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {course.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                          {course.price > 0 ? `৳${course.price}` : "Free"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${course.status === 'running' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <span className="capitalize">{course.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenModal(course)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(course.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
                >
                  {i + 1}
                </button>
              ))}
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
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Organization</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: "" })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => <option key={c.id} value={c.title}>{c.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subcategory</label>
                        <select
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          disabled={!formData.category}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm disabled:opacity-50"
                        >
                          <option value="">Select Subcategory</option>
                          {subcategories.filter(s => s.categoryId === categories.find(c => c.title === formData.category)?.id).map(s => (
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
"""

with open("src/pages/admin/ManageCourses.jsx", "w") as f:
    f.write(courses_content)

print("ManageCourses.jsx rewritten.")
