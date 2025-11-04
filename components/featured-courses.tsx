import { CourseCard } from "./course-card"

interface FeaturedCoursesProps {
  courses: typeof sampleCourses
}

const sampleCourses = [
  {
    id: "1",
    title: "Advanced React & Next.js",
    description: "Master modern React patterns and Next.js 15 with server components",
    category: "Web Development",
    instructor: "Sarah Chen",
    rating: 4.9,
    students: 5200,
    price: 99,
    level: "Advanced" as const,
    duration: "12 weeks",
    trending: true,
  },
  {
    id: "2",
    title: "AI/ML Fundamentals",
    description: "Learn the basics of machine learning and AI with hands-on projects",
    category: "AI & Machine Learning",
    instructor: "Dr. James Park",
    rating: 4.8,
    students: 3800,
    price: 79,
    level: "Beginner" as const,
    duration: "8 weeks",
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    description: "Design beautiful user interfaces and create outstanding user experiences",
    category: "Design",
    instructor: "Maya Patel",
    rating: 4.7,
    students: 2900,
    price: 69,
    level: "Intermediate" as const,
    duration: "10 weeks",
  },
]

export function FeaturedCourses() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-4 mb-12">
          <h2 className="text-4xl font-bold text-foreground">Featured Courses</h2>
          <p className="text-xl text-muted-foreground text-balance">Handpicked courses from our top instructors</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </div>
    </section>
  )
}
