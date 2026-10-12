import React from "react"

export function CourseCardSkeleton() {
  return (
    <div className="h-full bg-white dark:bg-[#111318] border border-slate-100 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm flex flex-col animate-pulse">
      {/* Thumbnail aspect-[2/1] */}
      <div className="aspect-[2/1] w-full bg-slate-200 dark:bg-slate-800/80 relative">
        <div className="absolute top-2 left-2 w-16 h-4 bg-slate-300 dark:bg-slate-700/60 rounded-full" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-3 space-y-2.5">
        {/* Title Lines */}
        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-11/12" />
        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />

        {/* Rating and Price row */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-14" />
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.05]">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        </div>
      </div>
    </div>
  )
}

export function CourseGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function MyCoursesSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero placeholder */}
      <div className="h-28 rounded-3xl bg-slate-900/60 border border-slate-800 p-6 flex items-center justify-between">
        <div className="space-y-2 w-1/2">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-7 bg-slate-800 rounded w-2/3" />
        </div>
        <div className="w-16 h-16 rounded-2xl bg-slate-800 shrink-0" />
      </div>

      {/* Grid of approved cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#111827] border border-slate-800 rounded-[24px] overflow-hidden p-0 space-y-4 shadow-xl"
          >
            <div className="aspect-video bg-slate-800/80 w-full" />
            <div className="p-6 pt-0 space-y-4">
              <div className="h-3 bg-slate-800 rounded w-1/4" />
              <div className="h-5 bg-slate-800 rounded w-4/5" />
              <div className="h-12 bg-slate-800/80 rounded-xl w-full mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-800" />
              <div className="w-6 h-6 rounded bg-slate-800" />
            </div>
            <div className="h-7 bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="h-5 bg-slate-800 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="h-5 bg-slate-800 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 animate-pulse pb-16">
      {/* Hero section */}
      <div className="bg-slate-900 border-b border-slate-800 pt-8 sm:pt-12 pb-20 sm:pb-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="h-4 bg-slate-800 rounded w-32" />
              <div className="h-10 sm:h-12 bg-slate-800 rounded-lg w-11/12" />
              <div className="h-5 bg-slate-800 rounded w-2/3" />
              <div className="flex gap-4 pt-2">
                <div className="h-5 bg-slate-800 rounded w-28" />
                <div className="h-5 bg-slate-800 rounded w-28" />
                <div className="h-5 bg-slate-800 rounded w-28" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content + Right card */}
      <div className="container mx-auto max-w-7xl px-4 -mt-10 sm:-mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48" />
              <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-32" />
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

