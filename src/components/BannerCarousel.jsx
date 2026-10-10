"use client"

import { useState, useEffect } from "react"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export default function BannerCarousel() {
  const banners = [
    { id: "banner-1", imageUrl: "/banners/banner1.png" },
    { id: "banner-2", imageUrl: "/banners/banner2.png" },
    { id: "banner-3", imageUrl: "/banners/banner3.png" }
  ]

  if (banners.length === 0) return null

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-3 sm:pt-6 pb-2">
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] shadow-primary/20 bg-slate-900 border border-white/10 group">
        
        {/* Premium ambient glow behind the swiper */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none z-0" />

        <Swiper
          modules={[Autoplay, EffectFade, Pagination, Navigation]}
          effect={'fade'}
          speed={1000}
          spaceBetween={0}
          slidesPerView={1}
          loop={banners.length > 1}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          pagination={{ 
            clickable: true,
            dynamicBullets: true
          }}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          className="w-full aspect-[16/9] sm:aspect-[21/9] md:h-[400px] lg:h-[480px] z-10 relative rounded-2xl md:rounded-3xl overflow-hidden"
        >
          {banners.map((banner, index) => (
            <SwiperSlide key={banner.id || index}>
              <div className="relative w-full h-full overflow-hidden">
                {/* Background Image with slight zoom animation on slide */}
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover object-center swiper-zoom-target transition-transform duration-[8000ms] ease-out scale-100 hover:scale-105"
                />
                {/* Subtle gradient overlay to make text/UI pop if any */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              </div>
            </SwiperSlide>
          ))}
          
          {/* Custom Navigation */}
          {banners.length > 1 && (
            <>
              <div className="swiper-button-prev-custom absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer -translate-x-2 group-hover:translate-x-0 shadow-lg">
                <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </div>
              <div className="swiper-button-next-custom absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer translate-x-2 group-hover:translate-x-0 shadow-lg">
                <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </>
          )}
        </Swiper>
      </div>
      
      {/* Custom styles for Swiper pagination dots to match premium feel */}
      <style dangerouslySetInnerHTML={{__html: `
        .swiper-pagination-bullets {
          bottom: 12px !important;
        }
        @media (min-width: 768px) {
          .swiper-pagination-bullets {
            bottom: 24px !important;
          }
        }
        .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5);
          opacity: 1;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 6px;
          height: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        @media (min-width: 768px) {
          .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            margin: 0 8px !important;
          }
        }
        .swiper-pagination-bullet-active {
          background-color: hsl(var(--primary));
          width: 20px;
          border-radius: 6px;
          box-shadow: 0 0 12px hsl(var(--primary) / 0.6);
        }
        @media (min-width: 768px) {
          .swiper-pagination-bullet-active {
            width: 32px;
            border-radius: 8px;
          }
        }
        .swiper-pagination-bullet-active-main {
           background-color: hsl(var(--primary));
        }
        .swiper-button-disabled {
          opacity: 0 !important;
          cursor: auto;
          pointer-events: none;
        }
      `}} />
    </section>
  )
}
