import re

with open('src/pages/Home.jsx', 'r') as f:
    content = f.read()

# 1. Replace the testimonials array
new_testimonials_array = """
  const testimonials = [
    {
      name: "আরিফুল ইসলাম",
      location: "ঢাকা",
      role: "HSC 2026 শিক্ষার্থী",
      image: "https://i.pravatar.cc/150?img=11",
      content: "All VIP Courses থেকে HSC ও Admission এর কোর্স নিয়েছিলাম। কম খরচে এত সুন্দর সাজানো ক্লাস, PDF এবং গাইডলাইন পাবো ভাবিনি। পরীক্ষার প্রস্তুতিতে অনেক সাহায্য পেয়েছি। ধন্যবাদ All VIP Courses টিমকে। সবাইকে এই প্ল্যাটফর্ম থেকে কোর্স নেওয়ার পরামর্শ দিব।"
    },
    {
      name: "জান্নাতুল ফেরদৌস",
      location: "রাজশাহী",
      role: "HSC শিক্ষার্থী",
      image: "https://i.pravatar.cc/150?img=5",
      content: "Admission preparation এর জন্য All VIP Courses আমার জন্য অনেক উপকারী ছিল। ভালো মানের ক্লাস এবং সহজভাবে বুঝানোর কারণে পড়াশোনা অনেক সহজ হয়েছে। কম বাজেটে ভালো একটা learning platform পেয়েছি।"
    },
    {
      name: "তানভীর আহমেদ",
      location: "চট্টগ্রাম",
      role: "HSC 2026 Candidate",
      image: "https://i.pravatar.cc/150?img=13",
      content: "আগে অনেক জায়গায় কোর্স খুঁজেছি, কিন্তু All VIP Courses এর মতো organized course পাইনি। HSC revision এবং admission preparation দুইটার জন্যই অনেক সাহায্য পেয়েছি।"
    },
    {
      name: "মেহেদী হাসান",
      location: "কুমিল্লা",
      role: "Admission Aspirant",
      image: "https://i.pravatar.cc/150?img=14",
      content: "কম টাকায় এত বেশি resource পাওয়া সত্যিই অবাক করার মতো। নিয়মিত practice এবং guideline আমাকে অনেক confidence দিয়েছে।"
    },
    {
      name: "সাদিয়া ইসলাম",
      location: "খুলনা",
      role: "HSC শিক্ষার্থী",
      image: "https://i.pravatar.cc/150?img=9",
      content: "All VIP Courses এর সবচেয়ে ভালো দিক হলো সহজ ভাষায় শেখানো এবং প্রয়োজনীয় সব material এক জায়গায় পাওয়া যায়।"
    },
    {
      name: "রাকিবুল হাসান",
      location: "বরিশাল",
      role: "HSC Candidate",
      image: "https://i.pravatar.cc/150?img=15",
      content: "Admission এর সময় সঠিক direction পাচ্ছিলাম না। এই কোর্স নেওয়ার পর preparation অনেক গোছানো হয়েছে।"
    },
    {
      name: "নুসরাত জাহান",
      location: "ময়মনসিংহ",
      role: "HSC Student",
      image: "https://i.pravatar.cc/150?img=20",
      content: "Premium quality content এত affordable price এ পাওয়া সত্যিই ভালো লেগেছে।"
    },
    {
      name: "ইমরান হোসেন",
      location: "সিলেট",
      role: "Admission Student",
      image: "https://i.pravatar.cc/150?img=33",
      content: "যারা HSC এবং Admission নিয়ে সিরিয়াস, তাদের জন্য All VIP Courses অনেক helpful."
    }
  ]
"""

content = re.sub(
    r'  const testimonials = \[.*?\]\n',
    new_testimonials_array.lstrip() + '\n',
    content,
    flags=re.DOTALL
)

# 2. Replace the 6. TESTIMONIALS section
new_testimonials_section = """
      {/* 6. TESTIMONIALS */}
      <section className="py-24 px-4 bg-muted/10 relative overflow-hidden border-t border-border">
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(calc(-50% - 1rem)); } 
            }
            .animate-marquee {
              animation: marquee 50s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}
        </style>
        
        <div className="container mx-auto max-w-6xl mb-16 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-bengali">শিক্ষার্থীদের মতামত</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-bengali">
            All VIP Courses-এর সাথে হাজারো শিক্ষার্থীর সাফল্য ও অভিজ্ঞতার গল্প শুনুন।
          </p>
        </div>

        <div className="relative w-full max-w-full overflow-hidden flex group">
          {/* Edge gradients for smooth fade in/out */}
          <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex w-max animate-marquee gap-8 px-4">
            {[...testimonials, ...testimonials].map((t, index) => (
              <div
                key={index}
                className="w-[320px] md:w-[400px] flex-shrink-0 bg-card border border-border rounded-2xl p-8 shadow-sm relative hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group/card"
              >
                <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10 group-hover/card:text-primary/20 transition-colors" />
                <div className="flex gap-1 mb-6 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-8 text-[15px] italic leading-relaxed font-bengali min-h-[100px]">"{t.content}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="relative">
                    <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
                    <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-green-500 bg-background rounded-full border-2 border-background" />
                  </div>
                  <div className="font-bengali">
                    <div className="font-bold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role} • {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
"""

content = re.sub(
    r'      \{/\* 6\. TESTIMONIALS \*/\}.*?      </section>',
    new_testimonials_section.strip() + '\n',
    content,
    flags=re.DOTALL
)

with open('src/pages/Home.jsx', 'w') as f:
    f.write(content)
