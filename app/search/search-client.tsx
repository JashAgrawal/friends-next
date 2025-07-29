"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tmdbClient, Movie } from "@/lib/tmdb-client";
import { MovieCard } from "@/components/ui/movie-card";
import { SearchBar } from "@/components/ui/search-bar";

interface SearchPageClientProps {
  initialQuery: string;
}

export function SearchPageClient({ initialQuery }: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{
    all: Movie[];
    movies: Movie[];
    tvShows: Movie[];
  }>({
    all: [],
    movies: [],
    tvShows: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await tmdbClient.searchMulti(query);
        
        // Filter results by media type
        const movies = data.results.filter(
          (item) => item.media_type === "movie" || (!item.media_type && item.release_date)
        );
        
        const tvShows = data.results.filter(
          (item) => item.media_type === "tv" || (!item.media_type && item.first_air_date)
        );

        setResults({
          all: data.results,
          movies,
          tvShows,
        });
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // Update query when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams, query]);

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">
          {query ? `Search Results for "${query}"` : "Search"}
        </h1>
        <SearchBar className="max-w-xl" />
      </div>

      {query && (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({results.all.length})
            </TabsTrigger>
            <TabsTrigger value="movies">
              Movies ({results.movies.length})
            </TabsTrigger>
            <TabsTrigger value="tvShows">
              TV Shows ({results.tvShows.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <ResultsGrid results={results.all} loading={loading} query={query} />
          </TabsContent>
          
          <TabsContent value="movies" className="mt-0">
            <ResultsGrid results={results.movies} loading={loading} query={query} />
          </TabsContent>
          
          <TabsContent value="tvShows" className="mt-0">
            <ResultsGrid results={results.tvShows} loading={loading} query={query} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface ResultsGridProps {
  results: Movie[];
  loading: boolean;
  query: string;
}

function ResultsGrid({ results, loading, query }: ResultsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-gray-800 rounded-md aspect-[2/3] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No results found</h3>
        <p className="text-gray-400">
          We couldn&apos;t find any matches for &quot;{query}&quot;
        </p>
        <p className="text-gray-400 mt-2">
          Try adjusting your search or filter to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {results.map((item) => (
        <MovieCard
          key={item.id}
          movie={item}
          mediaType={item.media_type || (item.first_air_date ? "tv" : "movie")}
        />
      ))}
    </div>
  );
}