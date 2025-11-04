"use client"

import { useState } from "react"
import { CourseCard } from "./course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  category: string
  instructor: string
  rating: number
  students: number
  price: number
  image?: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  trending?: boolean
}

interface CourseGridProps {
  courses: Course[]
  title?: string
  description?: string
}

export function CourseGrid({
  courses,
  title = "Explore Courses",
  description = "Discover our curated selection of expertly-crafted courses",
}: CourseGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(courses.map((c) => c.category)))
  const levels = ["Beginner", "Intermediate", "Advanced"]

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = !selectedLevel || course.level === selectedLevel
    const matchesCategory = !selectedCategory || course.category === selectedCategory

    return matchesSearch && matchesLevel && matchesCategory
  })

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <h2 className="text-4xl font-bold text-foreground">{title}</h2>
          <p className="text-xl text-muted-foreground text-balance">{description}</p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-12">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Filter Buttons */}
          <div className="space-y-4">
            {/* Level Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Difficulty Level</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLevel === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(null)}
                >
                  All Levels
                </Button>
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => <CourseCard key={course.id} {...course} />)
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-muted-foreground">No courses found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </div>
    </section>
  )
}
