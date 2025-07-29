"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ServerSelector } from "@/components/ui/server-selector";
import { getEmbedUrl } from "@/lib/server-utils";
import { cn } from "@/lib/utils";
import { tmdbClient } from "@/lib/tmdb-client";
import { Episode, Season } from "@/lib/tmdb-client";
import { useAuth } from "@/hooks/use-auth";
import { addToGuestWatchHistory } from "@/lib/guest-watch-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrientation } from "@/hooks/use-orientation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlayerProps {
  mediaType: string;
  id: string;
  title: string;
  posterPath?: string | null;
  seasonNumber?: string;
  episodeNumber?: string;
}

export function Player({
  mediaType,
  id,
  title,
  posterPath,
  seasonNumber: initialSeasonNumber,
  episodeNumber: initialEpisodeNumber,
}: PlayerProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const orientation = useOrientation();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<{ [key: number]: Episode[] }>({});
  const [selectedSeason, setSelectedSeason] = useState(
    initialSeasonNumber ? parseInt(initialSeasonNumber) : 1
  );
  const [selectedEpisode, setSelectedEpisode] = useState(
    initialEpisodeNumber ? parseInt(initialEpisodeNumber) : 1
  );
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAddedItemRef = useRef<string | null>(null);

  // Add current item to continue watching (with throttling to prevent duplicates)
  const addToContinueWatching = useCallback(
    async (forceUpdate = false) => {
      // Create a unique key for the current item
      const currentItemKey =
        mediaType === "tv"
          ? `${id}-${mediaType}-${selectedSeason}-${selectedEpisode}`
          : `${id}-${mediaType}`;

      // Skip if this exact item was just added (unless forced)
      if (!forceUpdate && lastAddedItemRef.current === currentItemKey) {
        console.log(
          "Skipping duplicate addition to continue watching:",
          currentItemKey
        );
        return;
      }

      try {
        if (isAuthenticated) {
          // Authenticated user: use API
          const response = await fetch("/api/continue-watching", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mediaId: parseInt(id),
              mediaType,
              title,
              posterPath,
              seasonNumber: mediaType === "tv" ? selectedSeason : undefined,
              episodeNumber: mediaType === "tv" ? selectedEpisode : undefined,
              serverId: 0, // Default to VidSrc server
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add to continue watching");
          }
        } else {
          // Guest user: use localStorage
          addToGuestWatchHistory(
            parseInt(id),
            mediaType,
            title,
            posterPath,
            mediaType === "tv" ? selectedSeason : undefined,
            mediaType === "tv" ? selectedEpisode : undefined,
            0 // Default to VidSrc server
          );
        }

        // Update the last added item reference
        lastAddedItemRef.current = currentItemKey;
        console.log("Added to continue watching:", currentItemKey);
      } catch (error) {
        console.error("Error adding to continue watching:", error);
        // Don't show error toast to user as this is background functionality
      }
    },
    [
      isAuthenticated,
      id,
      mediaType,
      title,
      posterPath,
      selectedSeason,
      selectedEpisode,
    ]
  );

  // Get the embed URL from the selected server
  const getVideoUrl = () => {
    return getEmbedUrl(
      0, // VidSrc server (index 0 in servers array)
      mediaType,
      id,
      selectedSeason.toString(),
      selectedEpisode.toString()
    );
  };

  const loadEpisodes = useCallback(
    async (showId: number, seasonNumber: number) => {
      try {
        const data = await tmdbClient.getTVShowSeason(showId, seasonNumber);
        setEpisodes((prev) => ({
          ...prev,
          [seasonNumber]: data.episodes,
        }));
      } catch (error) {
        console.error("Error loading episodes:", error);
      }
    },
    []
  );

  // Load seasons and episodes for TV shows
  const loadSeasons = useCallback(async () => {
    if (mediaType !== "tv") return;

    try {
      const details = await tmdbClient.getTVShowDetails(parseInt(id));
      if (details.seasons && details.seasons.length > 0) {
        // Convert the seasons from MovieDetails to Season type by adding empty episodes array
        const filteredSeasons = details.seasons
          .filter((s) => s.season_number > 0)
          .map((s) => ({
            ...s,
            episodes: [], // Add empty episodes array to match Season type
          })) as Season[];

        setSeasons(filteredSeasons);

        // Load episodes for the selected season
        await loadEpisodes(parseInt(id), selectedSeason);
      }
    } catch (error) {
      console.error("Error loading seasons:", error);
    }
  }, [mediaType, id, selectedSeason, loadEpisodes]);

  // Handle season change
  const handleSeasonChange = async (value: string) => {
    const season = parseInt(value);
    setSelectedSeason(season);
    setSelectedEpisode(1);

    if (!episodes[season]) {
      await loadEpisodes(parseInt(id), season);
    }

    // Update URL
    router.push(`/watch/${mediaType}/${id}/${season}/1`);
    toast.success(`Playing S${season} E1`);

    // Add to continue watching with new episode (force update for navigation)
    setTimeout(() => addToContinueWatching(true), 500);
  };

  // Handle episode change
  const handleEpisodeChange = async (value: string) => {
    const episode = parseInt(value);
    setSelectedEpisode(episode);

    // Update URL
    router.push(`/watch/${mediaType}/${id}/${selectedSeason}/${episode}`);
    toast.success(`Playing S${selectedSeason} E${episode}`);

    // Add to continue watching with new episode (force update for navigation)
    setTimeout(() => addToContinueWatching(true), 500);
  };

  // Handle navigation to previous episode
  const handlePreviousEpisode = async () => {
    if (mediaType !== "tv") return;

    if (selectedEpisode > 1) {
      // Go to previous episode in same season
      setSelectedEpisode(selectedEpisode - 1);
      router.push(
        `/watch/${mediaType}/${id}/${selectedSeason}/${selectedEpisode - 1}`
      );
      toast.success(`Playing S${selectedSeason} E${selectedEpisode - 1}`);
      setTimeout(() => addToContinueWatching(true), 500);
    } else if (selectedSeason > 1) {
      // Go to last episode of previous season
      const prevSeason = selectedSeason - 1;
      const lastEpisode = episodes[prevSeason]?.length || 1;
      setSelectedSeason(prevSeason);
      setSelectedEpisode(lastEpisode);
      router.push(`/watch/${mediaType}/${id}/${prevSeason}/${lastEpisode}`);
      toast.success(`Playing S${prevSeason} E${lastEpisode}`);
      setTimeout(() => addToContinueWatching(true), 500);
    } else {
      toast.info("This is the first episode");
    }
  };

  // Handle navigation to next episode
  const handleNextEpisode = async () => {
    if (mediaType !== "tv") return;

    const currentSeasonEpisodes = episodes[selectedSeason];
    if (
      currentSeasonEpisodes &&
      selectedEpisode < currentSeasonEpisodes.length
    ) {
      // Go to next episode in same season
      setSelectedEpisode(selectedEpisode + 1);
      router.push(
        `/watch/${mediaType}/${id}/${selectedSeason}/${selectedEpisode + 1}`
      );
      toast.success(`Playing S${selectedSeason} E${selectedEpisode + 1}`);
      setTimeout(() => addToContinueWatching(true), 500);
    } else if (seasons.length > selectedSeason) {
      // Go to first episode of next season
      const nextSeason = selectedSeason + 1;
      setSelectedSeason(nextSeason);
      setSelectedEpisode(1);
      router.push(`/watch/${mediaType}/${id}/${nextSeason}/1`);
      toast.success(`Playing S${nextSeason} E1`);
      setTimeout(() => addToContinueWatching(true), 500);
    } else {
      toast.info("This is the last episode");
    }
  };

  // Show/hide controls
  const showControls = () => {
    setControlsVisible(true);

    // Clear existing timer
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    // Set new timer to hide controls after 3 seconds
    controlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  // Load seasons and episodes on mount
  useEffect(() => {
    loadSeasons();

    // Add to continue watching when player loads (with a delay to ensure proper initialization)
    const addTimer = setTimeout(() => {
      addToContinueWatching();
    }, 1000);

    // Simulate video loading
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(addTimer);
      clearTimeout(loadingTimer);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [loadSeasons, addToContinueWatching]);

  // Update selected season and episode when URL params change
  useEffect(() => {
    if (initialSeasonNumber) {
      setSelectedSeason(parseInt(initialSeasonNumber));
    }
    if (initialEpisodeNumber) {
      setSelectedEpisode(parseInt(initialEpisodeNumber));
    }

    // Add to continue watching when URL params change (direct navigation)
    // Use a delay to prevent rapid-fire additions during navigation
    if (initialSeasonNumber || initialEpisodeNumber) {
      const addTimer = setTimeout(() => {
        addToContinueWatching(true); // Force update for navigation
      }, 500);

      return () => clearTimeout(addTimer);
    }
  }, [initialSeasonNumber, initialEpisodeNumber, addToContinueWatching]);

  // Load episodes when selected season changes
  useEffect(() => {
    if (mediaType === "tv" && !episodes[selectedSeason]) {
      loadEpisodes(parseInt(id), selectedSeason);
    }
  }, [selectedSeason, episodes, mediaType, id,loadEpisodes]);

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full flex flex-col space-y-4 p-2 md:p-4 h-screen bg-friends-black"
      onMouseMove={showControls}
      onTouchStart={showControls}
      onTouchMove={showControls}
    >
      {/* Controls overlay */}
      <div
        className={`absolute top-6 md:top-16 left-0 w-full z-10 flex justify-between items-center p-2 md:p-4 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => router.push(`/details/${mediaType}/${id}`)}
          className="flex cursor-pointer items-center space-x-2 text-white bg-black/40 hover:bg-black/60 focus:bg-black/80 active:bg-black/80 rounded-full p-3 md:p-2.5 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Back to details"
          tabIndex={0}
        >
          <ArrowLeft size={24} className="md:w-5 md:h-5" />
        </button>

        <div className="hidden md:block">
          <ServerSelector
            mediaId={parseInt(id)}
            mediaType={mediaType}
            seasonNumber={mediaType === "tv" ? selectedSeason : undefined}
            episodeNumber={mediaType === "tv" ? selectedEpisode : undefined}
          />
        </div>
      </div>

      {/* Video player */}
      <div
        className={cn(
          "w-full rounded-md overflow-hidden flex items-center justify-center",
          isMobile && orientation === "landscape"
            ? "mt-8 h-[85vh]"
            : isMobile
            ? "mt-16 h-[50vh]"
            : "mt-12 h-[90vh]"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <iframe
            src={getVideoUrl()}
            className="w-full h-full border-0"
            allowFullScreen
            loading="eager"
            title="Video Player"
          ></iframe>
        )}
      </div>

      {/* Episode Navigation Controls */}
      {mediaType === "tv" && (
        <div
          className={cn(
            "flex flex-col gap-4 z-10 transition-opacity duration-300",
            isMobile && orientation === "landscape" ? "hidden" : ""
          )}
        >
          {/* Mobile Server Selector */}
          <div className="md:hidden">
            <ServerSelector
              mediaId={parseInt(id)}
              mediaType={mediaType}
              seasonNumber={mediaType === "tv" ? selectedSeason : undefined}
              episodeNumber={mediaType === "tv" ? selectedEpisode : undefined}
            />
          </div>

          {/* Season and Episode Selectors */}
          <div
            className={cn(
              "flex gap-3 md:gap-2 items-stretch md:items-center",
              isMobile && orientation === "portrait" ? "flex-col" : "flex-row"
            )}
          >
            {/* Season Selector */}
            <Select
              value={selectedSeason.toString()}
              onValueChange={handleSeasonChange}
            >
              <SelectTrigger className="bg-black/40 text-white border-none hover:bg-black/60 active:bg-black/80 h-12 md:h-10 text-base md:text-sm touch-manipulation">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-gray-700">
                {seasons.map((season) => (
                  <SelectItem
                    key={season.season_number}
                    value={String(season.season_number)}
                    className="hover:bg-gray-800 focus:bg-gray-800 focus:text-white py-3 md:py-2 text-base md:text-sm touch-manipulation"
                  >
                    Season {season.season_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Episode Selector */}
            <Select
              value={selectedEpisode.toString()}
              onValueChange={handleEpisodeChange}
            >
              <SelectTrigger className="bg-black/40 text-white border-none hover:bg-black/60 active:bg-black/80 h-12 md:h-10 text-base md:text-sm touch-manipulation">
                <SelectValue placeholder="Episode" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-gray-700">
                {episodes[selectedSeason]?.map((episode) => (
                  <SelectItem
                    key={episode.episode_number}
                    value={String(episode.episode_number)}
                    className="hover:bg-gray-800 focus:bg-gray-800 focus:text-white py-3 md:py-2 text-base md:text-sm touch-manipulation"
                  >
                    {episode.episode_number} {episode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Navigation Buttons */}
          <div
            className={cn(
              "flex gap-3 md:gap-4",
              isMobile && orientation === "portrait" ? "flex-col" : "flex-row"
            )}
          >
            <Button
              variant="outline"
              size="lg"
              className="bg-black/40 text-white border-none hover:bg-black/60 active:bg-black/80 h-12 md:h-10 text-base md:text-sm touch-manipulation"
              onClick={handlePreviousEpisode}
            >
              <ArrowLeftCircle className="mr-2 w-5 h-5 md:w-4 md:h-4" />
              Previous Episode
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-black/40 text-white border-none hover:bg-black/60 active:bg-black/80 h-12 md:h-10 text-base md:text-sm touch-manipulation"
              onClick={handleNextEpisode}
            >
              Next Episode
              <ArrowRightCircle className="ml-2 w-5 h-5 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
