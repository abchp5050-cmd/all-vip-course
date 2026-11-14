// In-memory + session cache to ensure zero duplicate Firestore reads across page navigations

let inMemoryCourses = null

export const setCoursesCache = (courses) => {
  if (Array.isArray(courses) && courses.length > 0) {
    inMemoryCourses = courses
    try {
      sessionStorage.setItem("vip_courses_cache", JSON.stringify(courses))
    } catch (e) {
      // ignore storage quota/security issues
    }
  }
}

export const getCoursesCache = () => {
  if (inMemoryCourses && inMemoryCourses.length > 0) {
    return inMemoryCourses
  }
  try {
    const stored = sessionStorage.getItem("vip_courses_cache")
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCourses = parsed
        return parsed
      }
    }
  } catch (e) {
    // ignore
  }
  return null
}
