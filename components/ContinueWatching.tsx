"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ContinueWatchingItem } from "@/store/useContentStore";
import { useUserStore } from "@/store/useUserStore";
import {
  getGuestWatchHistory,
  removeFromGuestWatchHistory,
  GuestWatchHistoryItem,
} from "@/lib/guest-watch-utils";
import { toast } from "sonner";

interface ContinueWatchingProps {
  className?: string;
}

const ContinueWatching = ({ className = "" }: ContinueWatchingProps) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { currentProfile } = useUserStore();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch items based on auth state
  useEffect(() => {
    const fetchContinueWatching = async () => {
      setIsLoading(true);
      console.log("Auth state:", { isAuthenticated, user, currentProfile });
      console.log("Will make API call:", isAuthenticated && user);

      try {
        if (isAuthenticated && user) {
          // Authenticated: fetch from API
          console.log("Fetching continue watching from API...");
          const response = await fetch("/api/continue-watching");
          if (!response.ok) {
            console.error(
              "API response not ok:",
              response.status,
              response.statusText
            );
            throw new Error("Failed to fetch continue watching data");
          }
          const data = await response.json();
          console.log("API response data:", data);

          // Convert API response to ContinueWatchingItem format
          const convertedItems: ContinueWatchingItem[] = data.map(
            (item: any) => {
              // For new items from watch_history table, use mediaId (TMDB ID)
              // For legacy items from continue_watching_legacy table, mediaId might not exist
              // In that case, we fall back to the database id, but this won't work for navigation
              const tmdbId = item.mediaId || item.id;
              
              // Log warning for legacy items without mediaId
              if (!item.mediaId && item.id) {
                console.warn(`Legacy continue watching item without mediaId: ${item.title} (DB ID: ${item.id})`);
              }
              
              // If this is a legacy item, warn user that navigation might not work
              if (item.isLegacy) {
                console.warn(`Legacy continue watching item detected: ${item.title}. Navigation may not work correctly. Please re-watch to update.`);
              }
              
              return {
                id: tmdbId,
                mediaType: item.mediaType,
                title: item.title,
                posterPath: item.posterPath,
                seasonNumber: item.seasonNumber ?? undefined,
                episodeNumber: item.episodeNumber ?? undefined,
                serverId: item.serverId ?? undefined,
                lastWatchedAt: item.lastWatchedAt,
                isLegacy: item.isLegacy || false,
              };
            }
          );

          // Deduplicate items based on mediaId, mediaType, season, and episode
          const deduplicatedItems = convertedItems.reduce((acc: ContinueWatchingItem[], current) => {
            const existingIndex = acc.findIndex(item => 
              item.id === current.id && 
              item.mediaType === current.mediaType &&
              item.seasonNumber === current.seasonNumber &&
              item.episodeNumber === current.episodeNumber
            );
            
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              // Keep the item with the most recent lastWatchedAt
              if (current.lastWatchedAt > acc[existingIndex].lastWatchedAt) {
                acc[existingIndex] = current;
              }
            }
            return acc;
          }, []);

          console.log("Raw API data:", data);
          console.log("Converted items:", convertedItems);
          console.log("Deduplicated items:", deduplicatedItems);
          
          if (convertedItems.length !== deduplicatedItems.length) {
            console.warn(`Removed ${convertedItems.length - deduplicatedItems.length} duplicate items`);
          }
          
          setItems(deduplicatedItems);
        } else {
          // Guest: use guest watch utilities
          const guestItems = getGuestWatchHistory();
          // Convert GuestWatchHistoryItem to ContinueWatchingItem format
          const convertedItems: ContinueWatchingItem[] = guestItems.map(
            (item: GuestWatchHistoryItem) => ({
              id: item.id,
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath,
              seasonNumber: item.seasonNumber ?? undefined,
              episodeNumber: item.episodeNumber ?? undefined,
              serverId: item.serverId ?? undefined,
              lastWatchedAt: item.timestamp,
            })
          );
          setItems(convertedItems);
        }
      } catch (error) {
        console.error("Error fetching continue watching:", error);
        // Fallback to guest utilities for guest users
        if (!isAuthenticated) {
          const guestItems = getGuestWatchHistory();
          const convertedItems: ContinueWatchingItem[] = guestItems.map(
            (item: GuestWatchHistoryItem) => ({
              id: item.id,
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath,
              seasonNumber: item.seasonNumber ?? undefined,
              episodeNumber: item.episodeNumber ?? undefined,
              serverId: item.serverId ?? undefined,
              lastWatchedAt: item.timestamp,
            })
          );
          setItems(convertedItems);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContinueWatching();
  }, [isAuthenticated, user,currentProfile]);

  // Listen for localStorage changes to refresh guest continue watching
  useEffect(() => {
    if (!isAuthenticated) {
      const handleStorageChange = () => {
        const guestItems = getGuestWatchHistory();
        const convertedItems: ContinueWatchingItem[] = guestItems.map(
          (item: GuestWatchHistoryItem) => ({
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterPath,
            seasonNumber: item.seasonNumber ?? undefined,
            episodeNumber: item.episodeNumber ?? undefined,
            serverId: item.serverId ?? undefined,
            lastWatchedAt: item.timestamp,
          })
        );
        setItems(convertedItems);
      };

      // Listen for storage events (changes from other tabs)
      window.addEventListener("storage", handleStorageChange);

      // Also listen for custom events (changes from same tab)
      window.addEventListener("guestWatchHistoryUpdated", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(
          "guestWatchHistoryUpdated",
          handleStorageChange
        );
      };
    }
  }, [isAuthenticated]);

  // useEffect(()=>{
  //   console.log(items)
  // },[items])

  const handleRemove = async (
    e: React.MouseEvent,
    id: number,
    mediaType: string,
    seasonNumber?: number,
    episodeNumber?: number
  ) => {
    e.stopPropagation();

    try {
      if (isAuthenticated && user) {
        // Authenticated: remove via API
        const response = await fetch("/api/continue-watching", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: id,
            mediaType,
            seasonNumber,
            episodeNumber,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove item");
        }

        // Refresh list
        const updatedResponse = await fetch("/api/continue-watching");
        const updatedData = await updatedResponse.json();

        // Convert API response to ContinueWatchingItem format
        const convertedItems: ContinueWatchingItem[] = updatedData.map(
          (item: any) => {
            const tmdbId = item.mediaId || item.id;
            
            if (!item.mediaId && item.id) {
              console.warn(`Legacy continue watching item without mediaId: ${item.title} (DB ID: ${item.id})`);
            }
            
            return {
              id: tmdbId,
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath,
              seasonNumber: item.seasonNumber ?? undefined,
              episodeNumber: item.episodeNumber ?? undefined,
              serverId: item.serverId ?? undefined,
              lastWatchedAt: item.lastWatchedAt,
              isLegacy: item.isLegacy || false,
            };
          }
        );

        // Deduplicate items based on mediaId, mediaType, season, and episode
        const deduplicatedItems = convertedItems.reduce((acc: ContinueWatchingItem[], current) => {
          const existingIndex = acc.findIndex(item => 
            item.id === current.id && 
            item.mediaType === current.mediaType &&
            item.seasonNumber === current.seasonNumber &&
            item.episodeNumber === current.episodeNumber
          );
          
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the item with the most recent lastWatchedAt
            if (current.lastWatchedAt > acc[existingIndex].lastWatchedAt) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);

        setItems(deduplicatedItems);
      } else {
        // Guest: remove from guest watch history
        removeFromGuestWatchHistory(id, mediaType, seasonNumber, episodeNumber);

        // Update local state
        const guestItems = getGuestWatchHistory();
        const convertedItems: ContinueWatchingItem[] = guestItems.map(
          (item: GuestWatchHistoryItem) => ({
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterPath,
            seasonNumber: item.seasonNumber ?? undefined,
            episodeNumber: item.episodeNumber ?? undefined,
            serverId: item.serverId ?? undefined,
            lastWatchedAt: item.timestamp,
          })
        );
        setItems(convertedItems);
      }

      toast.success("Removed from continue watching");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleItemClick = (item: ContinueWatchingItem & { isLegacy?: boolean }) => {
    // Check if this is a legacy item without proper mediaId
    if (item.isLegacy) {
      // Legacy items won't work for navigation
      toast.error("This item needs to be re-added to continue watching. Please find and play it again to update.");
      return;
    }
    
    // Check if we have a valid ID for navigation
    if (!item.id || item.id === 0) {
      toast.error("Unable to navigate to this item. Please try playing it again.");
      return;
    }
    
    if (item.mediaType === "tv" && item.seasonNumber && item.episodeNumber) {
      router.push(
        `/watch/${item.mediaType}/${item.id}/${item.seasonNumber}/${item.episodeNumber}`
      );
    } else {
      router.push(`/watch/${item.mediaType}/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`px-4 md:px-8 mb-8 mt-8 ${className}`}>
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-white">
          Continue Watching
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="relative aspect-[2/3] bg-gray-800 animate-pulse rounded-md"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={`px-4 md:px-8 mb-8 mt-8 ${className}`}>
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-white">
        Continue Watching
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {items.map((item) => {
          // Create a unique key that includes season/episode for TV shows
          const uniqueKey = item.mediaType === 'tv' && item.seasonNumber && item.episodeNumber
            ? `${item.mediaType}-${item.id}-s${item.seasonNumber}e${item.episodeNumber}`
            : `${item.mediaType}-${item.id}`;
          
          return (
            <div
              key={uniqueKey}
              className="relative group cursor-pointer select-none"
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item);
                }
              }}
            >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
              <div className="relative w-full h-full">
                <Image
                  src={
                    item.posterPath
                      ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
                      : "/placeholder.svg"
                  }
                  alt={item.title || "Movie poster"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  className="object-cover pointer-events-none"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 p-2 w-full">
                  <p className="text-white text-sm truncate">
                    {item.title || "Unknown Title"}
                    
                  </p>
                  {item.mediaType === "tv" &&
                    item.seasonNumber &&
                    item.episodeNumber && (
                      <p className="text-gray-300 text-xs">
                        S{item.seasonNumber}:E{item.episodeNumber}
                      </p>
                    )}
                  {item.serverId !== undefined && (
                    <p className="text-gray-400 text-xs">
                      Server {item.serverId + 1}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) =>
                handleRemove(
                  e,
                  item.id,
                  item.mediaType,
                  item.seasonNumber,
                  item.episodeNumber
                )
              }
              aria-label="Remove from continue watching"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatching;
