import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Building, Phone, Facebook, Linkedin, Github, Camera, Shield, Mail, Edit3, ArrowRight } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { uploadImageToImgBB } from "../lib/imgbb"
import { useAuth } from "../contexts/AuthContext"

export default function Profile() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    phone: "",
    facebook: "",
    linkedin: "",
    github: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        institution: userProfile.institution || "",
        phone: userProfile.phone || "",
        facebook: userProfile.socialLinks?.facebook || "",
        linkedin: userProfile.socialLinks?.linkedin || "",
        github: userProfile.socialLinks?.github || "",
      })
      setPhotoPreview(userProfile.photoURL || null)
    }
  }, [userProfile])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) {
      setMessage({ type: "error", text: "You must be logged in to update your profile." })
      return
    }

    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      let photoURL = userProfile?.photoURL || ""

      if (photoFile) {
        try {
          photoURL = await uploadImageToImgBB(photoFile)
        } catch (uploadError) {
          throw new Error(uploadError.message || "Failed to upload photo. Please try again.")
        }
      }

      const userRef = doc(db, "users", currentUser.uid)
      const updateData = {
        name: formData.name,
        institution: formData.institution,
        phone: formData.phone,
        socialLinks: {
          facebook: formData.facebook,
          linkedin: formData.linkedin,
          github: formData.github,
        },
      }

      if (photoURL) {
        updateData.photoURL = photoURL
      }

      await updateDoc(userRef, updateData)
      await new Promise((resolve) => setTimeout(resolve, 500))
      await refreshUserProfile()

      setMessage({ type: "success", text: "Profile updated successfully!" })
      setPhotoFile(null)
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      let errorMessage = "Failed to update profile. "
      if (error.code === "permission-denied") {
        errorMessage += "You don't have permission to update this profile."
      } else if (error.code === "not-found") {
        errorMessage += "User profile not found."
      } else if (error.message) {
        errorMessage += error.message
      }
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-[#050816] text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-[#111827]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {message.type === "success" ? <Shield className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-red-400 flex items-center justify-center">!</div>}
              {message.text}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                  <div className="w-full h-full rounded-full bg-[#111827] overflow-hidden flex items-center justify-center relative">
                    {photoPreview ? (
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-500" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <label className="absolute bottom-1 right-1 w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 border-2 border-[#111827]">
                  <Edit3 className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
              </div>
              <div className="mt-4 text-center">
                <p className="font-semibold text-lg">{userProfile?.name || "Student"}</p>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1 justify-center">
                  <Mail className="w-3.5 h-3.5" />
                  {currentUser?.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-300 ml-1 block">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all placeholder:text-gray-600 hover:bg-white/[0.04]"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-300 ml-1 block">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all placeholder:text-gray-600 hover:bg-white/[0.04]"
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
              </div>

              {/* Institution */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="institution" className="text-sm font-medium text-gray-300 ml-1 block">
                  Institution
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building className="w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    value={formData.institution}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white transition-all placeholder:text-gray-600 hover:bg-white/[0.04]"
                    placeholder="College or University name"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-8 mt-8 border-t border-white/5 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#111827]">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Social Connections</span>
              </div>

              <div className="space-y-5 mt-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Facebook className="w-5 h-5 text-blue-500/70 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    name="facebook"
                    type="url"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="Facebook Profile URL"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white transition-all placeholder:text-gray-600 hover:bg-white/[0.04]"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Linkedin className="w-5 h-5 text-blue-400/70 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    name="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn Profile URL"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 text-white transition-all placeholder:text-gray-600 hover:bg-white/[0.04]"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Github className="w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    name="github"
                    type="url"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="GitHub Profile URL"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 text-white transition-all placeholder:text-gray-600 hover:bg-white/[0.04]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Save Profile Changes
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
