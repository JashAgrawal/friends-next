"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { tmdbClient, Movie } from "@/lib/tmdb-client";
import { MovieCard } from "@/components/ui/movie-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import {  FilterCategory } from "@/components/ui/filter-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Media type mapping
const mediaTypeOptions = [
  { id: "movie", name: "Movies" },
  { id: "tv", name: "TV Shows" },
];

// Movie genre mapping
const movieGenreMapping: Record<string, { title: string; id: string }> = {
  "trending": { title: "Trending Movies", id: "" },
  "popular": { title: "Popular Movies", id: "" },
  "top-rated": { title: "Top Rated Movies", id: "" },
  "now-playing": { title: "Now Playing", id: "" },
  "upcoming": { title: "Upcoming Movies", id: "" },
  "28": { title: "Action Movies", id: "28" },
  "35": { title: "Comedy Movies", id: "35" },
  "18": { title: "Drama Movies", id: "18" },
  "27": { title: "Horror Movies", id: "27" },
  "10749": { title: "Romance Movies", id: "10749" },
  "878": { title: "Science Fiction", id: "878" },
  "53": { title: "Thriller", id: "53" },
  "16": { title: "Animation", id: "16" },
  "80": { title: "Crime", id: "80" },
  "99": { title: "Documentary", id: "99" },
  "10751": { title: "Family", id: "10751" },
  "14": { title: "Fantasy", id: "14" },
  "36": { title: "History", id: "36" },
  "10402": { title: "Music", id: "10402" },
  "9648": { title: "Mystery", id: "9648" },
  "10752": { title: "War", id: "10752" },
  "37": { title: "Western", id: "37" },
};

// TV show genre mapping
const tvGenreMapping: Record<string, { title: string; id: string }> = {
  "trending": { title: "Trending TV Shows", id: "" },
  "popular": { title: "Popular TV Shows", id: "" },
  "top-rated": { title: "Top Rated TV Shows", id: "" },
  "on-the-air": { title: "Currently Airing", id: "" },
  "10759": { title: "Action & Adventure", id: "10759" },
  "16": { title: "Animation", id: "16" },
  "35": { title: "Comedy", id: "35" },
  "80": { title: "Crime", id: "80" },
  "99": { title: "Documentary", id: "99" },
  "18": { title: "Drama", id: "18" },
  "10751": { title: "Family", id: "10751" },
  "10762": { title: "Kids", id: "10762" },
  "9648": { title: "Mystery", id: "9648" },
  "10763": { title: "News", id: "10763" },
  "10764": { title: "Reality", id: "10764" },
  "10765": { title: "Sci-Fi & Fantasy", id: "10765" },
  "10766": { title: "Soap", id: "10766" },
  "10767": { title: "Talk", id: "10767" },
  "10768": { title: "War & Politics", id: "10768" },
  "37": { title: "Western", id: "37" },
};

// Common filter categories (removed year filter as requested)
const commonFilterCategories: FilterCategory[] = [
  {
    id: "sort_by",
    name: "Sort By",
    options: [
      { id: "popularity.desc", name: "Most Popular" },
      { id: "vote_average.desc", name: "Highest Rated" },
      { id: "release_date.desc", name: "Newest First" },
      { id: "release_date.asc", name: "Oldest First" },
      { id: "title.asc", name: "A-Z" },
      { id: "title.desc", name: "Z-A" },
    ],
  },
];

// TV-specific filter categories
const tvFilterCategories: FilterCategory[] = [
  {
    id: "sort_by",
    name: "Sort By",
    options: [
      { id: "popularity.desc", name: "Most Popular" },
      { id: "vote_average.desc", name: "Highest Rated" },
      { id: "first_air_date.desc", name: "Newest First" },
      { id: "first_air_date.asc", name: "Oldest First" },
      { id: "name.asc", name: "A-Z" },
      { id: "name.desc", name: "Z-A" },
    ],
  },
  {
    id: "with_status",
    name: "Status",
    options: [
      { id: "0", name: "Returning Series" },
      { id: "1", name: "Planned" },
      { id: "2", name: "In Production" },
      { id: "3", name: "Ended" },
      { id: "4", name: "Cancelled" },
      { id: "5", name: "Pilot" },
    ],
  },
];

interface ExplorePageClientProps {
  initialMediaType: string;
  initialGenre: string;
  initialSortBy: string;
  initialStatus: string;
}

export function ExplorePageClient({
  initialMediaType,
  initialGenre,
  initialSortBy,
  initialStatus,
}: ExplorePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [content, setContent] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Extract filters from URL
  const mediaType = searchParams.get("mediaType") || initialMediaType;
  const genre = searchParams.get("genre") || initialGenre;
  const sortBy = searchParams.get("sort_by") || initialSortBy;
  const status = searchParams.get("with_status") || initialStatus;

  // Get the appropriate genre mapping based on media type
  const genreMapping = mediaType === "movie" ? movieGenreMapping : tvGenreMapping;
  const genreInfo = genreMapping[genre] || { 
    title: mediaType === "movie" ? "Explore Movies" : "Explore TV Shows", 
    id: "" 
  };
  
  // Get the appropriate filter categories based on media type
  const filterCategories = mediaType === "movie" ? commonFilterCategories : tvFilterCategories;
  
  // Create active filters object for the FilterBar component
  const activeFilters: Record<string, string[]> = {
    sort_by: [sortBy],
  };
  
  if (mediaType === "tv" && status) {
    activeFilters.with_status = [status];
  }

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data;
        const queryParams: Record<string, string> = {};
        
        // Add sort parameter
        if (sortBy) {
          queryParams.sort_by = sortBy;
        }
        
        // Add status filter if present (TV shows only)
        if (mediaType === "tv" && status) {
          queryParams.with_status = status;
        }
        
        // Determine if we should use discover endpoint or specific endpoints
        const shouldUseDiscover = sortBy !== "popularity.desc" || (mediaType === "tv" && status);
        
        // Fetch based on media type and category
        if (mediaType === "movie") {
          if (shouldUseDiscover || genreInfo.id) {
            // Use discover endpoint for filtering and sorting
            if (genreInfo.id) {
              queryParams.with_genres = genreInfo.id;
            }
            
            // Map special categories to discover parameters
            if (genre === "now-playing") {
              const now = new Date();
              const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
              queryParams.primary_release_date_gte = fourWeeksAgo.toISOString().split('T')[0];
              queryParams.primary_release_date_lte = now.toISOString().split('T')[0];
            } else if (genre === "upcoming") {
              const now = new Date();
              const sixMonthsFromNow = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000));
              queryParams.primary_release_date_gte = now.toISOString().split('T')[0];
              queryParams.primary_release_date_lte = sixMonthsFromNow.toISOString().split('T')[0];
            }
            
            data = await tmdbClient.discoverMovies(queryParams, page);
          } else {
            // Use specific endpoints for better performance when no custom sorting
            if (genre === "trending") {
              data = await tmdbClient.getTrendingMovies("week", page);
            } else if (genre === "popular") {
              data = await tmdbClient.getPopularMovies(page);
            } else if (genre === "top-rated") {
              data = await tmdbClient.getTopRatedMovies(page);
            } else if (genre === "now-playing") {
              data = await tmdbClient.getNowPlayingMovies(page);
            } else if (genre === "upcoming") {
              data = await tmdbClient.getUpcomingMovies(page);
            } else {
              // Fallback to discover
              data = await tmdbClient.discoverMovies(queryParams, page);
            }
          }
        } else {
          // TV Shows
          if (shouldUseDiscover || genreInfo.id) {
            // Use discover endpoint for filtering and sorting
            if (genreInfo.id) {
              queryParams.with_genres = genreInfo.id;
            }
            
            // Map special categories to discover parameters
            if (genre === "on-the-air") {
              const now = new Date();
              const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
              queryParams.first_air_date_gte = oneMonthAgo.toISOString().split('T')[0];
              queryParams.first_air_date_lte = now.toISOString().split('T')[0];
            }
            
            data = await tmdbClient.discoverTVShows(queryParams, page);
          } else {
            // Use specific endpoints for better performance when no custom sorting
            if (genre === "trending") {
              data = await tmdbClient.getTrendingTVShows("week", page);
            } else if (genre === "popular") {
              data = await tmdbClient.getPopularTVShows(page);
            } else if (genre === "top-rated") {
              data = await tmdbClient.getTopRatedTVShows(page);
            } else if (genre === "on-the-air") {
              data = await tmdbClient.getOnTheAirTVShows(page);
            } else {
              // Fallback to discover
              data = await tmdbClient.discoverTVShows(queryParams, page);
            }
          }
        }
        
        setContent(prev => page === 1 ? data.results : [...prev, ...data.results]);
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages); // TMDB API limits to 500 pages
      } catch (err) {
        console.error(`Error fetching ${mediaType}:`, err);
        setError(`Failed to load ${mediaType === "movie" ? "movies" : "TV shows"}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [mediaType, genre, page, genreInfo.id, sortBy, status]);

  const loadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (filters: Record<string, string[]>) => {
    // Update URL with filters
    const params = new URLSearchParams(searchParams.toString());
    
    // Keep the media type and genre parameters
    params.set("mediaType", mediaType);
    params.set("genre", genre);
    
    // Add sort filter
    if (filters.sort_by && filters.sort_by.length > 0) {
      params.set("sort_by", filters.sort_by[0]);
    } else {
      params.set("sort_by", "popularity.desc");
    }
    
    // Add status filter if present (TV shows only)
    if (mediaType === "tv") {
      if (filters.with_status && filters.with_status.length > 0) {
        params.set("with_status", filters.with_status[0]);
      } else {
        params.delete("with_status");
      }
    }
    
    // Reset to page 1 when filters change
    setPage(1);
    
    // Update URL
    const queryString = params.toString();
    const url = `/explore${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  const handleGenreChange = (newGenre: string) => {
    // Update URL with new genre
    const params = new URLSearchParams(searchParams.toString());
    params.set("genre", newGenre);
    
    // Reset to page 1 when genre changes
    setPage(1);
    
    // Update URL
    const queryString = params.toString();
    const url = `/explore${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  const handleMediaTypeChange = (newMediaType: string) => {
    // Update URL with new media type
    const params = new URLSearchParams();
    params.set("mediaType", newMediaType);
    params.set("genre", "popular"); // Reset to popular when changing media type
    
    // Reset to page 1 when media type changes
    setPage(1);
    
    // Update URL
    const queryString = params.toString();
    const url = `/explore${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{genreInfo.title}</h1>
        
        {/* Consolidated Filter Bar */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="flex flex-wrap gap-3">
            {/* Media Type Selector */}
            <div className="flex flex-col">
              <span className="text-xs text-white/70 uppercase mb-1">Media Type</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-32 justify-between">
                    {mediaType === "movie" ? "Movies" : "TV Shows"}
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32 bg-gray-900 border-white/10">
                  <DropdownMenuRadioGroup value={mediaType} onValueChange={handleMediaTypeChange}>
                    {mediaTypeOptions.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id} className="text-white">
                        {option.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Genre Selector */}
            <div className="flex flex-col">
              <span className="text-xs text-white/70 uppercase mb-1">Category</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-40 justify-between">
                    <span className="truncate">
                      {genreMapping[genre]?.title.replace(mediaType === "movie" ? " Movies" : " TV Shows", "").replace("TV Shows", "").trim() || "Popular"}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-gray-900 border-white/10 max-h-[70vh] overflow-y-auto">
                  <DropdownMenuRadioGroup value={genre} onValueChange={handleGenreChange}>
                    <h3 className="px-2 py-1.5 text-sm font-semibold text-white/70">Featured</h3>
                    <DropdownMenuRadioItem value="trending" className="text-white">Trending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="popular" className="text-white">Popular</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="top-rated" className="text-white">Top Rated</DropdownMenuRadioItem>
                    
                    {mediaType === "movie" ? (
                      <>
                        <DropdownMenuRadioItem value="now-playing" className="text-white">Now Playing</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="upcoming" className="text-white">Upcoming</DropdownMenuRadioItem>
                      </>
                    ) : (
                      <DropdownMenuRadioItem value="on-the-air" className="text-white">Currently Airing</DropdownMenuRadioItem>
                    )}
                    
                    <Separator className="my-1 bg-white/10" />
                    <h3 className="px-2 py-1.5 text-sm font-semibold text-white/70">Genres</h3>
                    
                    {Object.entries(genreMapping)
                      .filter(([key]) => !isNaN(Number(key)))
                      .map(([key, value]) => (
                        <DropdownMenuRadioItem key={key} value={key} className="text-white">
                          {mediaType === "movie" 
                            ? value.title.replace(" Movies", "") 
                            : value.title.replace(" TV Shows", "")}
                        </DropdownMenuRadioItem>
                      ))
                    }
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Sort By Filter */}
            <div className="flex flex-col">
              <span className="text-xs text-white/70 uppercase mb-1">Sort By</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-40 justify-between">
                    <span className="truncate">
                      {filterCategories.find(c => c.id === "sort_by")?.options.find(o => o.id === sortBy)?.name || "Most Popular"}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-gray-900 border-white/10">
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(value) => handleFilterChange({ 
                      sort_by: [value],
                      ...(mediaType === "tv" && status ? { with_status: [status] } : {})
                    })}
                  >
                    {filterCategories.find(c => c.id === "sort_by")?.options.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id} className="text-white">
                        {option.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Filter (TV Shows only) */}
            {mediaType === "tv" && (
              <div className="flex flex-col">
                <span className="text-xs text-white/70 uppercase mb-1">Status</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-36 justify-between">
                      <span className="truncate">
                        {status ? filterCategories.find(c => c.id === "with_status")?.options.find(o => o.id === status)?.name || "Any" : "Any"}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-gray-900 border-white/10">
                    <DropdownMenuRadioGroup
                      value={status}
                      onValueChange={(value) => handleFilterChange({ 
                        sort_by: [sortBy],
                        with_status: value ? [value] : []
                      })}
                    >
                      <DropdownMenuRadioItem value="" className="text-white">
                        Any Status
                      </DropdownMenuRadioItem>
                      {filterCategories.find(c => c.id === "with_status")?.options.map((option) => (
                        <DropdownMenuRadioItem key={option.id} value={option.id} className="text-white">
                          {option.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Clear Filters Button */}
            {(sortBy !== "popularity.desc" || (mediaType === "tv" && status)) && (
              <div className="flex flex-col justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                  onClick={() => handleFilterChange({ 
                    sort_by: ["popularity.desc"],
                    ...(mediaType === "tv" ? { with_status: [] } : {})
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setPage(1)}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {content.map((item) => (
              <MovieCard
                key={`${item.id}-${item.title || item.name}`}
                movie={item}
                mediaType={mediaType}
              />
            ))}
            
            {loading && page === 1 && Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={`skeleton-${i}`} 
                className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse"
              />
            ))}
          </div>
          
          {content.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-white/70">No content found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => handleFilterChange({ 
                  sort_by: ["popularity.desc"],
                  ...(mediaType === "tv" ? { with_status: [] } : {})
                })}
              >
                Clear Filters
              </Button>
            </div>
          )}
          
          {page < totalPages && content.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={loadMore}
                disabled={loading}
                className="min-w-[200px]"
              >
                {loading && page > 1 ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}