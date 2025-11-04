"use client"

import { Link } from "react-router-dom"
import { Star, Users, Clock, ShoppingCart } from "lucide-react"
import { useCart } from "../contexts/CartContext"
import { motion } from "framer-motion"

export default function CourseCard({ course }) {
  const { addToCart } = useCart()

  const handleAddToCart = (e) => {
    e.preventDefault()
    addToCart(course)
  }

  const rating = course.rating || 4.5
  const students = course.students || Math.floor(Math.random() * 5000) + 100

  return (
    <Link to={`/course/${course.id}`} className="h-full">
      <motion.div
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="h-full bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-600 hover:shadow-2xl transition-all duration-300 flex flex-col group"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-yellow-50 aspect-video">
          {course.imageURL ? (
            <img
              src={course.imageURL || "/placeholder.svg"}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-blue-900/40">
                <div className="text-5xl mb-2">📚</div>
                <p className="text-sm">{course.category}</p>
              </div>
            </div>
          )}

          {/* Category badge */}
          {course.category && (
            <div className="absolute top-3 left-3 bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {course.category}
            </div>
          )}

          {/* Price badge */}
          {course.price && (
            <div className="absolute top-3 right-3 bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
              ৳{course.price}
            </div>
          )}
        </div>

        {/* Course content */}
        <div className="flex-1 p-5 flex flex-col">
          <h3 className="text-lg font-bold text-blue-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
            {course.description || "Learn at your own pace with industry experts"}
          </p>

          {/* Rating and students */}
          <div className="flex items-center justify-between mb-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700 ml-1">({Math.floor(rating)})</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users className="w-4 h-4" />
              {students}
            </div>
          </div>

          {/* Instructor info */}
          {course.instructor && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-xs text-gray-500">Instructor</p>
              <p className="text-sm font-semibold text-blue-900">{course.instructor}</p>
            </div>
          )}

          {/* Duration */}
          {course.duration && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
          )}

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-200 group/btn hover:shadow-lg active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </motion.div>
    </Link>
  )
}
