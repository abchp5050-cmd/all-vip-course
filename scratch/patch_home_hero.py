import re

with open('src/pages/Home.jsx', 'r') as f:
    content = f.read()

# Add import
import_statement = 'import CourseCard from "../components/CourseCard"\nimport BannerCarousel from "../components/BannerCarousel"'
content = content.replace('import CourseCard from "../components/CourseCard"', import_statement)

# Replace Hero section
hero_pattern = r'      \{/\* 1\. HERO SECTION \*/\}.*?</section>'
content = re.sub(hero_pattern, '      {/* 1. HERO BANNER CAROUSEL */}\n      <BannerCarousel />', content, flags=re.DOTALL)

with open('src/pages/Home.jsx', 'w') as f:
    f.write(content)
