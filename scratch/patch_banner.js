const fs = require('fs');
const file = 'src/components/BannerCarousel.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove firebase imports
content = content.replace(/import { collection, query, where, getDocs } from "firebase\/firestore"\n/, '');
content = content.replace(/import { db } from "\.\.\/lib\/firebase"\n/, '');

// Replace state and fetch logic with static data
const newComponentStart = `export default function BannerCarousel() {
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

  if (banners.length === 0) return null`;

const oldComponentStartRegex = /export default function BannerCarousel\(\) \{[\s\S]*?if \(banners\.length === 0\) return null/;

content = content.replace(oldComponentStartRegex, newComponentStart);

fs.writeFileSync(file, content);
console.log('Patched BannerCarousel.jsx');
