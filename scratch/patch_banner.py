import re

file_path = 'src/components/BannerCarousel.jsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove firebase imports
content = re.sub(r'import { collection, query, where, getDocs } from "firebase/firestore"\n', '', content)
content = re.sub(r'import { db } from "\.\./lib/firebase"\n', '', content)

# Remove unused Loader2 from lucide-react if present
content = re.sub(r'Loader2,?\s*', '', content)

new_component_start = """export default function BannerCarousel() {
  const banners = [
    {
      id: "default-1",
      title: "Premium Courses For Your Success",
      subtitle: "Learn smarter with quality academic and admission courses",
      buttonText: "Explore Courses",
      buttonLink: "/courses",
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80",
    },
    {
      id: "default-2",
      title: "Start Your Learning Journey",
      subtitle: "Affordable courses designed for HSC students",
      buttonText: "View Courses",
      buttonLink: "/courses",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80",
    },
    {
      id: "default-3",
      title: "Learn From Anywhere",
      subtitle: "Access premium study materials anytime",
      buttonText: "Join Now",
      buttonLink: "/register",
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1920&q=80",
    }
  ]

  if (banners.length === 0) return null"""

old_component_start_regex = re.compile(r'export default function BannerCarousel\(\) \{.*?if \(banners\.length === 0\) return null', re.DOTALL)

content = old_component_start_regex.sub(new_component_start, content)

with open(file_path, 'w') as f:
    f.write(content)

print('Patched BannerCarousel.jsx')
