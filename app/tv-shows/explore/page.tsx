"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { tmdbClient, Movie } from "@/lib/tmdb-client";
import { MovieCard } from "@/components/ui/movie-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import { FilterBar, FilterCategory } from "@/components/ui/filter-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Genre mapping
const genreMapping: Record<string, { title: string; id: string }> = {
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

// Filter categories for TV shows
const filterCategories: FilterCategory[] = [
  {
    id: "year",
    name: "Year",
    options: [
      { id: "2025", name: "2025" },
      { id: "2024", name: "2024" },
      { id: "2023", name: "2023" },
      { id: "2022", name: "2022" },
      { id: "2021", name: "2021" },
      { id: "2020", name: "2020" },
      { id: "2010s", name: "2010s" },
      { id: "2000s", name: "2000s" },
      { id: "1990s", name: "1990s" },
    ],
  },
  {
    id: "sort_by",
    name: "Sort By",
    options: [
      { id: "popularity.desc", name: "Popularity" },
      { id: "vote_average.desc", name: "Rating" },
      { id: "first_air_date.desc", name: "Release Date" },
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

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shows, setShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Extract filters from URL
  const genre = searchParams.get("genre") || "popular";
  const year = searchParams.get("year") || "";
  const sortBy = searchParams.get("sort_by") || "popularity.desc";
  const status = searchParams.get("with_status") || "";

  const genreInfo = genreMapping[genre] || { title: "Explore TV Shows", id: "" };
  
  // Create active filters object for the FilterBar component
  const activeFilters: Record<string, string[]> = {
    year: year ? [year] : [],
    sort_by: [sortBy],
    with_status: status ? [status] : [],
  };

  // Set document title for SEO (client-side)
  useEffect(() => {
    const pageTitle = `${genreInfo.title} | Friends Streaming`;
    document.title = pageTitle;
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        `Watch ${genreInfo.title} on Friends - your favorite streaming platform. Browse our collection of ${genreInfo.title.toLowerCase()}.`
      );
    }
  }, [genreInfo.title]);

  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data;
        const queryParams: Record<string, string> = {};
        
        // Add year filter if present
        if (year) {
          if (year.endsWith("s")) {
            // Handle decade filters (e.g., "2010s")
            const decade = year.slice(0, 4);
            queryParams.first_air_date_gte = `${decade}-01-01`;
            queryParams.first_air_date_lte = `${parseInt(decade) + 9}-12-31`;
          } else {
            // Handle specific year
            queryParams.first_air_date_year = year;
          }
        }
        
        // Add sort parameter
        queryParams.sort_by = sortBy;
        
        // Add status filter if present
        if (status) {
          queryParams.with_status = status;
        }
        
        // Fetch based on category type
        if (genre === "trending") {
          data = await tmdbClient.getTrendingTVShows("week", page);
        } else if (genre === "popular") {
          data = await tmdbClient.getPopularTVShows(page);
        } else if (genre === "top-rated") {
          data = await tmdbClient.getTopRatedTVShows(page);
        } else if (genre === "on-the-air") {
          data = await tmdbClient.getOnTheAirTVShows(page);
        } else if (genreInfo.id) {
          // Genre-based discovery with filters
          queryParams.with_genres = genreInfo.id;
          data = await tmdbClient.discoverTVShows(queryParams, page);
        } else {
          // Fallback to popular TV shows with filters
          data = await tmdbClient.discoverTVShows(queryParams, page);
        }
        
        setShows(prev => page === 1 ? data.results : [...prev, ...data.results]);
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages); // TMDB API limits to 500 pages
      } catch (err) {
        console.error("Error fetching TV shows:", err);
        setError("Failed to load TV shows. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchShows();
  }, [genre, page, genreInfo.id, year, sortBy, status]);

  const loadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (filters: Record<string, string[]>) => {
    // Update URL with filters
    const params = new URLSearchParams(searchParams.toString());
    
    // Keep the genre parameter
    params.set("genre", genre);
    
    // Add year filter if present
    if (filters.year && filters.year.length > 0) {
      params.set("year", filters.year[0]);
    } else {
      params.delete("year");
    }
    
    // Add sort filter
    if (filters.sort_by && filters.sort_by.length > 0) {
      params.set("sort_by", filters.sort_by[0]);
    } else {
      params.set("sort_by", "popularity.desc");
    }
    
    // Add status filter if present
    if (filters.with_status && filters.with_status.length > 0) {
      params.set("with_status", filters.with_status[0]);
    } else {
      params.delete("with_status");
    }
    
    // Reset to page 1 when filters change
    setPage(1);
    
    // Update URL
    const queryString = params.toString();
    const url = `/tv-shows/explore${queryString ? `?${queryString}` : ''}`;
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
    const url = `/tv-shows/explore${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{genreInfo.title}</h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Change Genre
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-gray-900 border-white/10 max-h-[70vh] overflow-y-auto">
                <DropdownMenuRadioGroup value={genre} onValueChange={handleGenreChange}>
                  <h3 className="px-2 py-1.5 text-sm font-semibold text-white/70">Featured</h3>
                  <DropdownMenuRadioItem value="trending" className="text-white">Trending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="popular" className="text-white">Popular</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="top-rated" className="text-white">Top Rated</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="on-the-air" className="text-white">Currently Airing</DropdownMenuRadioItem>
                  
                  <Separator className="my-1 bg-white/10" />
                  <h3 className="px-2 py-1.5 text-sm font-semibold text-white/70">Genres</h3>
                  
                  {Object.entries(genreMapping)
                    .filter(([key]) => !isNaN(Number(key)))
                    .map(([key, value]) => (
                      <DropdownMenuRadioItem key={key} value={key} className="text-white">
                        {value.title}
                      </DropdownMenuRadioItem>
                    ))
                  }
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Separator className="my-4 bg-white/10" />
      </div>

      {/* Filters */}
      <FilterBar 
        categories={filterCategories} 
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />

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
            {shows.map((show) => (
              <MovieCard
                key={`${show.id}-${show.name || show.title}`}
                movie={show}
                mediaType="tv"
              />
            ))}
            
            {loading && page === 1 && Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={`skeleton-${i}`} 
                className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse"
              />
            ))}
          </div>
          
          {shows.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-white/70">No TV shows found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => handleFilterChange({ year: [], sort_by: ["popularity.desc"], with_status: [] })}
              >
                Clear Filters
              </Button>
            </div>
          )}
          
          {page < totalPages && shows.length > 0 && (
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