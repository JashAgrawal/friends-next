"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useContentStore, WatchlistItem } from "@/store/useContentStore";
import { useUserStore } from "@/store/useUserStore";
import { getWatchlistFromStorage } from "@/lib/localStorage-utils";
import { toast } from "sonner";

interface MyListProps {
  isPage?: boolean;
  className?: string;
}

const MyList = ({ isPage = false, className = "" }: MyListProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { currentProfile } = useUserStore();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const { watchlist, removeFromWatchlist } = useContentStore();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch items based on auth state
  useEffect(() => {
    const fetchWatchlist = async () => {
      setIsLoading(true);
      
      try {
        if (isAuthenticated && currentProfile) {
          // Authenticated: fetch from API
          const response = await fetch("/api/watchlist");
          if (!response.ok) {
            throw new Error("Failed to fetch watchlist data");
          }
          const data = await response.json();
          setItems(data);
        } else {
          // Guest: use Zustand store which is synced with localStorage
          setItems(watchlist);
        }
      } catch (error) {
        console.error("Error fetching watchlist:", error);
        // Fallback to localStorage in case of API error
        setItems(getWatchlistFromStorage());
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [isAuthenticated, currentProfile, watchlist]);

  const handleRemove = async (e: React.MouseEvent, item: WatchlistItem) => {
    e.stopPropagation();
    
    try {
      if (isAuthenticated && currentProfile) {
        // Authenticated: remove via API using the database ID
        const response = await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to remove item");
        }
        
        // Refresh list
        const updatedData = await fetch("/api/watchlist").then(res => res.json());
        setItems(updatedData);
      } else {
        // Guest: remove from Zustand store (which syncs with localStorage)
        removeFromWatchlist(item.id, item.mediaType);
      }
      
      toast.success("Removed from My List");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleItemClick = (item: WatchlistItem) => {
    router.push(`/details/${item.mediaType || "movie"}/${item.id}`);
  };

  if (isLoading) {
    return (
      <div className={`px-4 md:px-8 mb-8 ${className}`}>
        {!isPage && <h2 className="text-xl md:text-2xl font-semibold mb-4 text-white">My List</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative aspect-[2/3] bg-gray-800 animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return isPage ? (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Your list is empty</h3>
        <p className="text-gray-400 mb-6 max-w-md">
          Start building your watchlist by adding movies and TV shows you want to watch later.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-200 transition-colors"
        >
          Browse Content
        </button>
      </div>
    ) : null;
  }

  return (
    <div className={`px-4 md:px-8 mb-8 ${className}`}>
      {!isPage && <h2 className="text-xl md:text-2xl font-semibold mb-4 text-white">My List</h2>}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {items.map((item) => (
          <div 
            key={`${item.mediaType}-${item.id}`}
            className="relative group cursor-pointer"
            onClick={() => handleItemClick(item)}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
              <div className="relative w-full h-full">
                <Image
                  src={item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : "/placeholder.svg"}
                  alt={item.title || "Movie poster"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  className="object-cover"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 p-2 w-full">
                  <p className="text-white text-sm truncate">{item.title}</p>
                </div>
              </div>
            </div>
            
            <button
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleRemove(e, item)}
              aria-label="Remove from My List"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyList;