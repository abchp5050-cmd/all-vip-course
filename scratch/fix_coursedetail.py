import re

with open("src/pages/CourseDetail.jsx", "r") as f:
    content = f.read()

broken_line = '          <h2 className="text-2xl font-bold mb-2">Course not foreturn ('
fixed = '''          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return ('''

content = content.replace(broken_line, fixed)

with open("src/pages/CourseDetail.jsx", "w") as f:
    f.write(content)
