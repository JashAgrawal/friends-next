"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Info, Play, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import {
  Movie,
  MovieDetails,
  getImageUrl,
} from "@/lib/tmdb-client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

interface HeroProps {
  movies: Movie[];
}

const Hero = ({ movies }: HeroProps) => {
  const [banner, setBanner] = useState<Movie | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [bannerDetails, setBannerDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [muted, setMuted] = useState(true);
  const router = useRouter();
  const videoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (movies.length > 0) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      setBanner(movies[randomIndex]);
      setCurrent(randomIndex);
    }
  }, [movies]);

  useEffect(() => {
    if (!api) return;

    api.scrollTo(current, true); // Ensures first slide is selected

    api.on("select", () => {
      const selectedIndex = api.selectedScrollSnap();
      setCurrent(selectedIndex);
      if (movies[selectedIndex]) {
        setBanner(movies[selectedIndex]);
      }
    });
  }, [api, movies, current]);

  useEffect(() => {
    if (!banner) return;
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
    }

    setShowVideo(false);
    setLogoImg(null);

    if (banner) {
      const fetchDetails = async () => {
        try {
          const mediaType =
            banner.media_type || (banner.first_air_date ? "tv" : "movie");
          setLoading(true);

          // Fetch movie details from API
          const response = await fetch("/api/tmdb", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: `https://api.themoviedb.org/3/${mediaType}/${banner.id}?append_to_response=videos,credits,similar,recommendations`,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const details = await response.json();

          // Fetch movie logos
          const logosResponse = await fetch("/api/tmdb", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: `https://api.themoviedb.org/3/${mediaType}/${banner.id}/images?include_image_language=en`,
            }),
          });

          if (!logosResponse.ok) {
            throw new Error(`HTTP error! Status: ${logosResponse.status}`);
          }

          const logosData = await logosResponse.json();

          setBannerDetails(details);
          if (logosData.logos && logosData.logos.length > 0) {
            setLogoImg(logosData.logos[0].file_path);
          }
          setLoading(false);

          if (details.videos?.results?.length > 0) {
            videoTimeoutRef.current = setTimeout(() => {
              setShowVideo(true);
            }, 5000);
          }
        } catch (error) {
          console.error("Error fetching banner details:", error);
          setLoading(false);
        }
      };

      fetchDetails();
    }

    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
    };
  }, [banner]);

  if (!banner) return null;

  const truncate = (string: string, n: number) => {
    return string?.length > n ? string.substring(0, n - 1) + "..." : string;
  };

  const handlePlay = () => {
    const mediaType =
      banner.media_type || (banner.first_air_date ? "tv" : "movie");
    router.push(`/watch/${mediaType}/${banner.id}`);
  };

  const handleMoreInfo = () => {
    const mediaType =
      banner.media_type || (banner.first_air_date ? "tv" : "movie");
    router.push(`/details/${mediaType}/${banner.id}`);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const trailer = bannerDetails?.videos?.results?.find(
    (video) => video.type === "Trailer" || video.type === "Teaser"
  );

  return (
    <Carousel
      className="relative aspect-[9/16] sm:h-[80vh] md:h-[85vh] lg:h-[90vh] xl:h-screen w-full overflow-hidden"
      setApi={setApi}
      opts={{
        align: "start",
        loop: true,
        duration: 30,
      }}
    >
      <CarouselContent>
        {movies.map((movie) => (
          <CarouselItem key={movie.id} className="pl-0">
            <div
              className={`hero relative h-[70vh] sm:h-[80vh] md:h-[85vh] lg:h-[90vh] xl:h-screen w-full overflow-hidden transition-opacity duration-500 ${
                banner.id === movie.id ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Background Image/Video Container */}
              <div className="absolute inset-0 w-full h-full">
                {showVideo && trailer && banner.id === movie.id ? (
                  <>
                    <div className="absolute inset-0 w-full h-full z-0">
                      <iframe
                        title="trailer"
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${
                          trailer.key
                        }?autoplay=1&mute=${
                          muted ? 1 : 0
                        }&controls=0&modestbranding=1&loop=1&playlist=${
                          trailer.key
                        }&rel=0&showinfo=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="w-full h-full object-cover scale-[1.2] sm:scale-[1.1]"
                      ></iframe>
                    </div>
                    <button
                      onClick={toggleMute}
                      className="absolute bottom-20 sm:bottom-24 md:bottom-28 lg:bottom-32 right-4 sm:right-6 md:right-8 z-20 bg-black/60 hover:bg-black/80 focus:bg-black/90 p-2.5 sm:p-3 md:p-3.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50"
                      tabIndex={0}
                      aria-label={muted ? "Unmute video" : "Mute video"}
                    >
                      {muted ? (
                        <VolumeX size={isMobile ? 20 : 24} />
                      ) : (
                        <Volume2 size={isMobile ? 20 : 24} />
                      )}
                    </button>
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={
                        getImageUrl(
                          isMobile && movie.poster_path
                            ? movie.poster_path
                            : movie.backdrop_path || movie.poster_path
                        ) || "/placeholder.svg"
                      }
                      alt={movie.title || movie.name || "Movie poster"}
                      fill
                      priority
                      className={`object-cover transition-transform duration-700 ${
                        isMobile ? "object-top" : "object-center"
                      }`}
                      sizes="100vw"
                    />
                  </div>
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 sm:via-black/60 md:via-black/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 sm:via-black/30 md:via-transparent to-transparent"></div>
                <div className="absolute top-0 h-16 sm:h-20 md:h-24 w-full bg-gradient-to-b from-black/80 to-transparent"></div>
              </div>

              {/* Content Container */}
              {banner.id === movie.id && (
                <div className="absolute inset-0 flex items-end z-10">
                  <div className="w-full px-16 sm:px-5 md:px-8 lg:px-12 xl:px-16 pb-4 sm:pb-8 md:pb-12 lg:pb-16">
                    <div className="max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl space-y-3 sm:space-y-4 md:space-y-6">
                      {/* Title/Logo Section */}
                      {loading ? (
                        <div className="w-3/4 sm:w-2/3 md:w-1/2 h-8 sm:h-10 md:h-12 lg:h-16 bg-gray-800/50 rounded animate-pulse"></div>
                      ) : logoImg ? (
                        <div className="relative w-full max-w-[280px] sm:max-w-[350px] md:max-w-[420px] lg:max-w-[500px] xl:max-w-[600px] h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px] xl:h-[140px] mb-2 sm:mb-3 md:mb-4 animate-fade-in">
                          <Image
                            src={getImageUrl(logoImg) || "/placeholder.svg"}
                            alt={`${movie.title || movie.name} logo`}
                            fill
                            priority
                            className="object-contain object-left"
                            sizes="(max-width: 640px) 280px, (max-width: 768px) 350px, (max-width: 1024px) 420px, (max-width: 1280px) 500px, 600px"
                          />
                        </div>
                      ) : (
                        <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white animate-fade-in leading-tight max-w-full sm:max-w-4xl">
                          {movie.title || movie.name}
                        </h1>
                      )}

                      {/* Description */}
                      <p
                        className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl animate-fade-in"
                        style={{ animationDelay: "0.1s" }}
                      >
                        {truncate(movie.overview, isMobile ? 140 : 220)}
                      </p>

                      {/* Action Buttons */}
                      <div
                        className="flex flex-row xs:flex-row gap-2 sm:gap-4 animate-fade-in pt-3 sm:pt-4"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <Button
                          onClick={handlePlay}
                          className="bg-white text-black hover:bg-white/90 focus:bg-white/80 active:bg-white/70 flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50 min-w-[120px] sm:min-w-[140px] rounded-md"
                          size={isMobile ? "default" : "lg"}
                          tabIndex={0}
                        >
                          <Play size={isMobile ? 18 : 20} fill="currentColor" />
                          <span>Play</span>
                        </Button>
                        <Button
                          onClick={handleMoreInfo}
                          className="bg-gray-600/80 hover:bg-gray-600/60 focus:bg-gray-600/70 active:bg-gray-600/50 text-white flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black/50 min-w-[120px] sm:min-w-[140px] rounded-md"
                          variant="secondary"
                          size={isMobile ? "default" : "lg"}
                          tabIndex={0}
                        >
                          <Info size={isMobile ? 18 : 20} />
                          <span>More Info</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default Hero;
