import re

with open("src/pages/Courses.jsx", "r") as f:
    content = f.read()

# Fix the broken line
broken_line = 'filtered.sort((a, b) => (a.title || "").localeCompare(b.titlreturn ('
fixed = '''filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    setFilteredCourses(filtered)
  }

  return ('''

content = content.replace(broken_line, fixed)

with open("src/pages/Courses.jsx", "w") as f:
    f.write(content)
