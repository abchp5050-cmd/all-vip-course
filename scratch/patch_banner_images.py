import re

file_path = 'src/components/BannerCarousel.jsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the static banners array
new_banners = """  const banners = [
    { id: "banner-1", imageUrl: "/banners/banner1.png" },
    { id: "banner-2", imageUrl: "/banners/banner2.png" },
    { id: "banner-3", imageUrl: "/banners/banner3.png" }
  ]"""

content = re.sub(r'  const banners = \[.*?\]\n', new_banners + '\n', content, flags=re.DOTALL)

# Remove the content overlay (the text, buttons, and gradient overlays)
# We will use regex to carefully remove the absolute inset content blocks inside SwiperSlide
# Look for {/* Gradient Overlays */} and remove down to the end of {/* Content */}
content = re.sub(r'\s*\{\/\* Gradient Overlays \*\/\}.*?\{\/\* Content \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>', '', content, flags=re.DOTALL)

# The image tag needs to be adjusted slightly to not be cropped awkwardly, maybe 'object-contain' or keep 'object-cover' but with a nice aspect ratio.
# I'll let object-cover stay but adjust the container height.
# Let's adjust height classes: "w-full aspect-[16/9] md:aspect-[21/9] lg:h-[500px]" or similar.
# Currently it is: className="w-full h-[240px] sm:h-[360px] md:h-[440px] lg:h-[500px] z-10"
# This is responsive height and is usually fine.

with open(file_path, 'w') as f:
    f.write(content)

print('Patched BannerCarousel images')
