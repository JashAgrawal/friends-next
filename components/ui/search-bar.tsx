"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Search, X, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { debounce } from "@/lib/debounce";
import { tmdbClient, getImageUrl, Movie } from "@/lib/tmdb-client";
import { cn } from "@/lib/utils";
import { getRecentSearches, addRecentSearch, removeRecentSearch } from "@/lib/localStorage-utils";

interface SearchBarProps {
  onClose?: () => void;
  className?: string;
  autoFocus?: boolean;
  mobile?: boolean;
}

export function SearchBar({ onClose, className, autoFocus = false, mobile = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const router = useRouter();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const results = await tmdbClient.searchMulti(query, 1);
        // Filter out results without images and limit to 5
        const filteredResults = results.results
          .filter((item) => item.backdrop_path || item.poster_path)
          .slice(0, 5);
        setSuggestions(filteredResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call to prevent too many requests
    const debouncedFetch = debounce(fetchSuggestions, 300);
    debouncedFetch();

    // Reset selected index when query changes
    setSelectedIndex(-1);
  }, [query]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Save to recent searches
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
      
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose?.();
    }
  };

  const handleSuggestionClick = (suggestion: Movie) => {
    const mediaType =
      suggestion.media_type || (suggestion.first_air_date ? "tv" : "movie");
    router.push(`/details/${mediaType}/${suggestion.id}`);
    onClose?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // If no suggestions are shown, don't handle keyboard navigation
    if (!showSuggestions || suggestions.length === 0) return;

    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }
    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
    // Enter
    else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected) {
        handleSuggestionClick(selected);
      }
    }
    // Escape
    else if (e.key === "Escape") {
      setShowSuggestions(false);
      if (onClose) onClose();
    }
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className={cn(
        "w-full flex items-center", 
        mobile ? "px-4" : "",
        className
      )}
    >
      <div className="relative w-full">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) {
              setShowSuggestions(true);
            } else if (recentSearches.length > 0) {
              setShowRecent(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-black/90 border border-gray-700 text-white pl-10 pr-10 rounded-md focus:outline-none focus:ring-1 focus:ring-red-600 w-full touch-manipulation",
            mobile ? "text-base py-3 h-12" : "md:w-64 text-sm py-2"
          )}
          placeholder="Titles, people, genres"
          autoFocus={autoFocus}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white active:text-gray-200 transition-colors touch-manipulation",
              mobile ? "p-2" : ""
            )}
          >
            <X size={mobile ? 20 : 16} />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              "absolute z-50 mt-1 w-full bg-black/95 border border-gray-700 rounded-md shadow-lg overflow-hidden",
              mobile ? "max-h-[70vh] overflow-y-auto" : ""
            )}
          >
            <ul className="py-1">
              {suggestions.map((suggestion, index) => {
                const title = suggestion.title || suggestion.name || "Unknown";
                const mediaType =
                  suggestion.media_type ||
                  (suggestion.first_air_date ? "tv" : "movie");
                const year =
                  suggestion.release_date?.substring(0, 4) ||
                  suggestion.first_air_date?.substring(0, 4);
                const posterPath = getImageUrl(suggestion.poster_path, "w92");

                return (
                  <li
                    key={suggestion.id}
                    className={cn(
                      "cursor-pointer flex items-center hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation",
                      mobile ? "px-4 py-4" : "px-3 py-2",
                      selectedIndex === index ? "bg-gray-800" : ""
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {posterPath && (
                      <div className={cn(
                        "relative mr-3 flex-shrink-0",
                        mobile ? "w-10 h-15" : "w-8 h-12"
                      )}>
                        <Image
                          src={posterPath}
                          alt={title}
                          fill
                          sizes={mobile ? "40px" : "32px"}
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div>
                      <div className={cn(
                        "text-white font-medium",
                        mobile ? "text-base" : "text-sm"
                      )}>{title}</div>
                      <div className={cn(
                        "text-gray-400",
                        mobile ? "text-sm" : "text-xs"
                      )}>
                        {year ? `${year} • ` : ""}
                        {mediaType === "movie" ? "Movie" : "TV Show"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {/* Recent searches dropdown */}
        {showRecent && !query && recentSearches.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              "absolute z-50 mt-1 w-full bg-black/95 border border-gray-700 rounded-md shadow-lg overflow-hidden",
              mobile ? "max-h-[70vh] overflow-y-auto" : ""
            )}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className="text-sm text-gray-400">Recent Searches</span>
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => {
                  removeRecentSearch(recentSearches[0]); // Just to trigger a re-render
                  setRecentSearches([]);
                  setShowRecent(false);
                }}
              >
                Clear All
              </button>
            </div>
            <ul className="py-1">
              {recentSearches.map((search, index) => (
                <li
                  key={index}
                  className={cn(
                    "cursor-pointer flex items-center justify-between hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation",
                    mobile ? "px-4 py-4" : "px-3 py-2"
                  )}
                  onClick={() => {
                    setQuery(search);
                    setShowRecent(false);
                    handleSearch({ preventDefault: () => {} } as React.FormEvent);
                  }}
                >
                  <div className="flex items-center">
                    <Clock size={mobile ? 18 : 16} className="text-gray-400 mr-2" />
                    <span className={cn(
                      "text-white",
                      mobile ? "text-base" : "text-sm"
                    )}>{search}</span>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "text-gray-400 hover:text-white active:text-gray-200 transition-colors touch-manipulation",
                      mobile ? "p-2" : ""
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(search);
                      setRecentSearches(getRecentSearches());
                      if (recentSearches.length <= 1) {
                        setShowRecent(false);
                      }
                    }}
                  >
                    <X size={mobile ? 16 : 14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading indicator */}
        {loading && query && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "text-gray-400 hover:text-white active:text-gray-200 transition-colors touch-manipulation",
            mobile ? "ml-3 p-2" : "ml-2"
          )}
          aria-label="Close search"
        >
          <X size={mobile ? 24 : 20} />
        </button>
      )}
    </form>
  );
}

export default SearchBar;