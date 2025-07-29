"use client"

import { useRouter } from "next/navigation"
import { useRef, useEffect } from "react"
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Movie } from "@/lib/tmdb-client"
import { MovieCard } from "@/components/ui/movie-card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { FadeTransition } from "@/components/ui/page-transition"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export interface MovieRowProps {
  title: string;
  movies?: Movie[];
  isLoading?: boolean;
  isLarge?: boolean;
  error?: boolean;
  seeMoreHref?: string;
  className?: string;
}

export function MovieRow({
  title,
  movies = [],
  isLoading = false,
  isLarge = false,
  error = false,
  seeMoreHref,
  className,
}: MovieRowProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = React.useState<CarouselApi>()

  const handleSeeMore = () => {
    if (seeMoreHref) {
      router.push(seeMoreHref)
    }
  }

  // Keyboard navigation for desktop
  useEffect(() => {
    if (isMobile || !api) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          api.scrollPrev()
          break
        case 'ArrowRight':
          event.preventDefault()
          api.scrollNext()
          break
        case 'Home':
          event.preventDefault()
          api.scrollTo(0)
          break
        case 'End':
          event.preventDefault()
          api.scrollTo(movies.length - 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [api, isMobile, movies.length])

  if (isLoading) {
    return (
      <div className="space-y-4 my-6 md:my-8">
        <div className="flex items-center justify-between px-6">
          <LoadingSkeleton variant="text" className="w-48 h-6" />
        </div>
        <div className="flex space-x-4 pl-6 overflow-x-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              className={cn(
                "flex-shrink-0",
                isLarge
                  ? "h-64 w-44 md:h-80 md:w-52"
                  : "h-48 w-32 md:h-60 md:w-40"
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || movies.length === 0) {
    return null
  }

  return (
    <FadeTransition className={cn("space-y-2 my-6 md:my-8 group", className)}>
      <div className="flex items-center justify-between px-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white/90 group-hover:text-white transition-colors">
          {title}
        </h2>
        {seeMoreHref && (
          <button
            onClick={handleSeeMore}
            className="flex items-center text-sm md:text-base text-white/70 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-md px-2 py-1 transition-all"
            tabIndex={0}
          >
            <span>See more</span>
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 ml-1" />
          </button>
        )}
      </div>

      <div ref={carouselRef}>
        <Carousel 
          className="w-full pl-2 focus-within:outline-none" 
          setApi={setApi}
          opts={{
            align: "start",
            skipSnaps: false,
            dragFree: !isMobile,
          }}
        >
          <CarouselContent className="pl-6">
            {movies.map((movie, index) => (
              <CarouselItem
                key={movie.id}
                className={cn(
                  "transition-all duration-300 overflow-visible pl-2 focus-within:z-10",
                  isLarge
                    ? "basis-[160px] md:basis-[200px] lg:basis-[250px] xl:basis-[280px]"
                    : "basis-[150px] md:basis-[180px] lg:basis-[220px] xl:basis-[250px]"
                )}
              >
                <FadeTransition delay={index * 50}>
                  <MovieCard movie={movie} isLarge={isLarge} />
                </FadeTransition>
              </CarouselItem>
            ))}
          </CarouselContent>

          {!isMobile && (
            <>
              <CarouselPrevious 
                className="hidden md:flex h-16 lg:h-20 w-8 lg:w-10 bg-black/20 hover:bg-black/50 focus:bg-black/60 border-none rounded-r-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black" 
                tabIndex={0}
              />
              <CarouselNext 
                className="hidden md:flex h-16 lg:h-20 w-8 lg:w-10 bg-black/20 hover:bg-black/50 focus:bg-black/60 border-none rounded-l-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black" 
                tabIndex={0}
              />
            </>
          )}
        </Carousel>
      </div>
    </FadeTransition>
  )
}