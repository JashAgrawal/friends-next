"use client";
import { servers } from "@/lib/server-utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAuth } from "@/hooks/use-auth";
import { getOrCreateGuestProfile, saveGuestProfile } from "@/lib/localStorage-utils";

interface ServerSelectorProps {
  mediaId: number;
  mediaType: string;
  seasonNumber?: number;
  episodeNumber?: number;
  className?: string;
}

export function ServerSelector({
  mediaId,
  mediaType,
  seasonNumber,
  episodeNumber,
  className = "",
}: ServerSelectorProps) {
  const { selectedServer, setSelectedServer } = usePlayerStore();
  const { session, user } = useAuth();
  
  // Handle server change
  const handleServerChange = async (value: string) => {
    const serverId = parseInt(value);
    setSelectedServer(serverId);
    
    // Update server preference in database or localStorage
    if (session?.user && user) {
      try {
        // For authenticated users, update in database
        const response = await fetch("/api/continue-watching", {
          method: "GET",
        });
        const currentItems = await response.json();
        
        // Ensure currentItems is an array
        const itemsArray = Array.isArray(currentItems) ? currentItems : [];
        
        const item = itemsArray.find(
          (item: any) => 
            item.mediaId === mediaId && 
            item.mediaType === mediaType &&
            (seasonNumber === undefined || item.seasonNumber === seasonNumber) &&
            (episodeNumber === undefined || item.episodeNumber === episodeNumber)
        );
        
        if (item) {
          await fetch("/api/continue-watching", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mediaId: item.id, // Use the TMDB ID from the item
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath,
              seasonNumber: item.seasonNumber,
              episodeNumber: item.episodeNumber,
              serverId,
            }),
          });
        } else {
          // If no existing item, create a new one with the selected server
          await fetch("/api/continue-watching", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mediaId,
              mediaType,
              seasonNumber,
              episodeNumber,
              serverId,
            }),
          });
        }
      } catch (error) {
        console.error("Error updating server preference:", error);
        toast.error("Failed to update server preference");
        return;
      }
    } else {
      // For guest users, update in localStorage
      try {
        const guestProfile = getOrCreateGuestProfile();
        
        if (!guestProfile.continueWatching) {
          guestProfile.continueWatching = [];
        }
        
        // Ensure continueWatching is an array
        const continueWatchingArray = Array.isArray(guestProfile.continueWatching) 
          ? guestProfile.continueWatching 
          : [];
        
        const itemIndex = continueWatchingArray.findIndex(
          (item: any) => 
            item.id === mediaId && 
            item.mediaType === mediaType &&
            (seasonNumber === undefined || item.seasonNumber === seasonNumber) &&
            (episodeNumber === undefined || item.episodeNumber === episodeNumber)
        );
        
        if (itemIndex !== -1) {
          continueWatchingArray[itemIndex].serverId = serverId;
          guestProfile.continueWatching = continueWatchingArray;
          saveGuestProfile(guestProfile);
        } else {
          // If no existing item, create a new one with the selected server
          const newItem = {
            id: mediaId,
            mediaType,
            seasonNumber,
            episodeNumber,
            serverId,
            timestamp: Date.now(),
          };
          continueWatchingArray.push(newItem);
          guestProfile.continueWatching = continueWatchingArray;
          saveGuestProfile(guestProfile);
        }
      } catch (error) {
        console.error("Error updating server preference in localStorage:", error);
        toast.error("Failed to update server preference");
        return;
      }
    }
    
    toast.success(`Switched to ${servers[serverId].name}`);
  };
  
  return (
    <div className={className}>
      <Select
        value={selectedServer.toString()}
        onValueChange={handleServerChange}
      >
        <SelectTrigger className="bg-black/40 text-white border-none hover:bg-black/60 w-full md:w-48">
          <SelectValue placeholder={servers[selectedServer].name} />
        </SelectTrigger>
        <SelectContent className="bg-black/90 text-white border-gray-700">
          {servers.map((server, index) => (
            <SelectItem
              key={index}
              value={index.toString()}
              className="hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
            >
              {server.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}