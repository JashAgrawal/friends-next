"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Play, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl, Movie } from "@/lib/tmdb-client";
import { LazyImage } from "./lazy-image";
import { useIsMobile } from "@/hooks/use-mobile";

export interface MovieCardProps {
  movie: Movie;
  isLarge?: boolean;
  className?: string;
  mediaType?: string;
}

export function MovieCard({
  movie,
  isLarge = false,
  className,
  mediaType: propMediaType,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

  const mediaType =
    propMediaType ||
    movie.media_type ||
    (movie.first_air_date ? "tv" : "movie");
  const title = movie.title || movie.name || "";
  const imagePath = isLarge ? movie.poster_path : movie.poster_path;
  const imageUrl = imagePath
    ? getImageUrl(imagePath, isLarge ? "w500" : "w342")
    : null;
  const year = (movie.release_date || movie.first_air_date || "").substring(
    0,
    4
  );

  // If no image path is available, don't render the card
  if (!imagePath) return null;

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    router.push(`/watch/${mediaType}/${movie.id}`);
  };

  const handleInfoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    router.push(`/details/${mediaType}/${movie.id}`);
  };

  const handleCardClick = () => {
    router.push(`/details/${mediaType}/${movie.id}`);
  };

  const handleTouchStart = () => {
    if (isMobile) {
      setIsTouched(true);
      setIsHovered(true);
    }
  };

  const handleTouchEnd = () => {
    if (isMobile) {
      setTimeout(() => {
        setIsTouched(false);
        setIsHovered(false);
      }, 300);
    }
  };

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xs bg-gray-800 border border-gray-950/80 touch-manipulation transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black focus:z-10",
        isLarge ? "aspect-[2/3] w-full" : "aspect-[2/3] w-full",
        isMobile && isTouched ? "scale-95" : "",
        !isMobile
          ? "hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-black/50"
          : "",
        className
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${title}`}
    >
      {/* Image */}
      {imageUrl ? (
        <LazyImage
          src={imageUrl}
          alt={title}
          fill
          sizes={
            isLarge
              ? "(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          }
          className={cn(
            "object-cover transition-all duration-300 h-full ease-in-out",
            isHovered ? "scale-105 brightness-75" : "scale-100"
          )}
          priority={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
          <span className="text-xs">No image</span>
        </div>
      )}

      {/* Hover/Touch overlay with details */}
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 animate-fade-in pb-2 md:pb-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={handlePlayClick}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-white hover:bg-white/90 focus:bg-white/80 active:bg-white/80 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white",
                    isMobile ? "h-10 w-10" : "h-8 w-8 hover:h-10 hover:w-10"
                  )}
                  aria-label={`Play ${title}`}
                  tabIndex={0}
                >
                  <Play
                    size={isMobile ? 20 : 16}
                    className="text-black ml-0.5"
                  />
                </button>
                <button
                  onClick={handleInfoClick}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-gray-700/80 hover:bg-gray-600/80 focus:bg-gray-500/80 active:bg-gray-500/80 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-700",
                    isMobile ? "h-10 w-10" : "h-8 w-8 hover:h-10 hover:w-10"
                  )}
                  aria-label={`More info about ${title}`}
                  tabIndex={0}
                >
                  <Info size={isMobile ? 20 : 16} className="text-white" />
                </button>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-1",
                  isMobile ? "text-sm" : "text-xs"
                )}
              >
                <Star size={isMobile ? 16 : 14} className="text-yellow-400" />
                <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
              </div>
            </div>

            <h3
              className={cn(
                "truncate font-medium",
                isMobile ? "text-lg" : "text-xl"
              )}
            >
              {title}
            </h3>

            <div
              className={cn(
                "flex items-center space-x-2 text-gray-300",
                isMobile ? "text-sm" : "text-xs"
              )}
            >
              <span>{year || "N/A"}</span>
              {mediaType === "tv" && (
                <span className="rounded bg-red-600/90 px-1 py-0.5 text-white">
                  Series
                </span>
              )}
              {mediaType === "movie" && (
                <span className="flex items-center">
                  <Clock size={isMobile ? 14 : 12} className="mr-1" />
                  90m
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
