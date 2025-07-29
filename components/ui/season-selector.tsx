"use client";

import * as React from "react";
import Image from "next/image";
import { Play, Calendar, Clock } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { tmdbClient, Season, getImageUrl } from "@/lib/tmdb-client";
import { cn } from "@/lib/utils";

interface SeasonSelectorProps {
  tvId: number;
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    overview: string;
    air_date: string;
  }[];
  onEpisodeSelect: (seasonNumber: number, episodeNumber: number) => void;
}

export function SeasonSelector({ tvId, seasons = [], onEpisodeSelect }: SeasonSelectorProps) {
  const [selectedSeason, setSelectedSeason] = React.useState<number | null>(null);
  const [seasonDetails, setSeasonDetails] = React.useState<Season | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch season details when a season is selected
  React.useEffect(() => {
    async function fetchSeasonDetails() {
      if (selectedSeason === null) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await tmdbClient.getTVShowSeason(tvId, selectedSeason);
        setSeasonDetails(data);
      } catch (err) {
        console.error("Error fetching season details:", err);
        setError("Failed to load season details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSeasonDetails();
  }, [tvId, selectedSeason]);

  // Handle season selection
  const handleSeasonSelect = (seasonNumber: number) => {
    if (selectedSeason === seasonNumber) {
      setSelectedSeason(null);
    } else {
      setSelectedSeason(seasonNumber);
    }
  };

  // Handle episode selection
  const handleEpisodeSelect = (episodeNumber: number) => {
    if (selectedSeason !== null) {
      onEpisodeSelect(selectedSeason, episodeNumber);
    }
  };

  // Format air date
  const formatAirDate = (date: string | undefined) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format runtime
  const formatRuntime = (minutes: number | undefined) => {
    if (!minutes) return "Unknown";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-3">Seasons & Episodes</h3>
      
      {seasons.length === 0 ? (
        <p className="text-sm text-gray-400">No seasons information available.</p>
      ) : (
        <div className="space-y-2">
          {/* Season Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => handleSeasonSelect(season.season_number)}
                className={cn(
                  "flex items-center p-2 rounded-md border transition-all",
                  selectedSeason === season.season_number
                    ? "border-white bg-gray-800"
                    : "border-gray-700 hover:border-gray-500"
                )}
              >
                <div className="relative w-12 h-16 mr-2 flex-shrink-0">
                  {season.poster_path ? (
                    <Image
                      src={getImageUrl(season.poster_path, "w92") || ""}
                      alt={season.name}
                      fill
                      className="object-cover rounded-sm"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-sm">
                      <span className="text-xs text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{season.name}</p>
                  <p className="text-xs text-gray-400">
                    {season.episode_count} episodes
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Episode List */}
          {selectedSeason !== null && (
            <div className="mt-4">
              <Separator className="my-3 bg-gray-800" />
              
              <h4 className="text-md font-medium mb-2">
                {seasons.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
              </h4>
              
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-md" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : seasonDetails && seasonDetails.episodes ? (
                <div className="space-y-2">
                  {seasonDetails.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="border border-gray-700 rounded-md overflow-hidden"
                    >
                      <Accordion type="single" collapsible>
                        <AccordionItem value={`episode-${episode.episode_number}`} className="border-0">
                          <AccordionTrigger className="px-3 py-2 hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <span className="text-sm font-medium mr-2">
                                  {episode.episode_number}.
                                </span>
                                <span className="text-sm truncate">
                                  {episode.name}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-400 space-x-2">
                                <span className="flex items-center">
                                  <Clock size={12} className="mr-1" />
                                  {formatRuntime(episode.runtime)}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <div className="flex">
                              {episode.still_path && (
                                <div className="relative w-32 h-18 mr-3 flex-shrink-0">
                                  <Image
                                    src={getImageUrl(episode.still_path, "w300") || ""}
                                    alt={episode.name}
                                    fill
                                    className="object-cover rounded-sm"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-1">
                                  <Calendar size={12} className="inline mr-1" />
                                  {formatAirDate(episode.air_date)}
                                </p>
                                <p className="text-sm text-gray-300 mb-2">
                                  {episode.overview || "No description available."}
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => handleEpisodeSelect(episode.episode_number)}
                                  className="mt-1"
                                >
                                  <Play size={14} /> Play Episode
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No episode information available.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}