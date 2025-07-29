"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Play,
  Plus,
  Star,
  Clock,
  Calendar,
  Film,
  Tv,
  User,
  Check,
  Video,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  tmdbClient,
  MovieDetails,
  Episode,
  getImageUrl,
  formatRuntime,
  formatReleaseDate,
  getTrailerKey,
} from "@/lib/tmdb-client";
import { useContentStore, ContinueWatchingItem } from "@/store/useContentStore";
import { toast } from "sonner";

interface DetailsPageClientProps {
  mediaType: string;
  id: string;
}

export function DetailsPageClient({ mediaType, id }: DetailsPageClientProps) {
  const mediaId = parseInt(id);
  const router = useRouter();

  const [isAlreadyWatching, setIsAlreadyWatching] = useState(false);
  const [currentWatchStatus, setCurrentWatchStatus] =
    useState<ContinueWatchingItem | null>(null);
  const [isAlreadyInList, setIsAlreadyInList] = useState(false);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [seasons, setSeasons] = useState<MovieDetails["seasons"]>([]);
  const [episodes, setEpisodes] = useState<{ [key: number]: Episode[] }>({});
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const { addToWatchlist, removeFromWatchlist, watchlist, continueWatching } =
    useContentStore();

  // Fetch details when component mounts
  useEffect(() => {
    const fetchDetails = async () => {
      if (!mediaType || !id) return;

      try {
        setLoading(true);

        let data: MovieDetails;
        if (mediaType === "movie") {
          data = await tmdbClient.getMovieDetails(mediaId);
        } else {
          data = await tmdbClient.getTVShowDetails(mediaId);
        }

        // Check if content is in watchlist
        const isInList = watchlist.some(
          (item) => item.id === mediaId && item.mediaType === mediaType
        );
        setIsAlreadyInList(isInList);

        // Check if user is already watching this content
        const watchingItem = continueWatching.find(
          (item) => item.id === mediaId && item.mediaType === mediaType
        );
        setIsAlreadyWatching(!!watchingItem);
        setCurrentWatchStatus(watchingItem || null);

        setDetails(data);

        // Load seasons and episodes for TV shows
        if (mediaType === "tv" && data.seasons && data.seasons.length > 0) {
          const filteredSeasons = data.seasons.filter(
            (s) => s.season_number > 0
          );
          setSeasons(filteredSeasons);

          if (filteredSeasons.length > 0) {
            const initialSeason =
              watchingItem?.seasonNumber || filteredSeasons[0].season_number;
            setSelectedSeason(initialSeason);
            await loadEpisodes(mediaId, initialSeason);
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        toast("Failed to load content details", {
          description: "Please try again later",
          action: {
            label: "Retry",
            onClick: () => fetchDetails(),
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [mediaType, id, mediaId, watchlist, continueWatching]);

  // Load episodes for a specific season
  const loadEpisodes = async (showId: number, seasonNumber: number) => {
    try {
      const data = await tmdbClient.getTVShowSeason(showId, seasonNumber);
      setEpisodes((prev) => ({
        ...prev,
        [seasonNumber]: data.episodes,
      }));
    } catch (error) {
      console.error("Error fetching episodes:", error);
    }
  };

  // Handle season change
  const handleSeasonChange = async (seasonNumber: string) => {
    const seasonNum = Number(seasonNumber);
    setSelectedSeason(seasonNum);

    if (!episodes[seasonNum]) {
      await loadEpisodes(mediaId, seasonNum);
    }
  };

  // Handle play button click
  const handlePlay = () => {
    if (mediaType === "movie") {
      router.push(`/watch/${mediaType}/${mediaId}`);
    } else {
      const seasonNum = currentWatchStatus?.seasonNumber || selectedSeason || 1;
      const episodeNum = currentWatchStatus?.episodeNumber || 1;
      router.push(
        `/watch/${mediaType}/${mediaId}?season=${seasonNum}&episode=${episodeNum}`
      );
    }
  };

  // Handle episode play button click
  const handleEpisodePlay = (seasonNumber: number, episodeNumber: number) => {
    router.push(
      `/watch/${mediaType}/${mediaId}?season=${seasonNumber}&episode=${episodeNumber}`
    );
  };

  // Handle watchlist toggle
  const handleWatchlistToggle = () => {
    if (!details) return;

    if (isAlreadyInList) {
      removeFromWatchlist(mediaId, mediaType);
      setIsAlreadyInList(false);
      toast("Removed from My List", {
        description: `${
          details.title || details.name
        } has been removed from your list`,
      });
    } else {
      addToWatchlist({
        id: mediaId,
        mediaType: mediaType,
        title: details.title || details.name || "",
        posterPath: details.poster_path || "",
        addedAt: Date.now(),
      });
      setIsAlreadyInList(true);
      toast("Added to My List", {
        description: `${
          details.title || details.name
        } has been added to your list`,
      });
    }
  };

  // Get trailer URL
  const trailerKey = details ? getTrailerKey(details.videos) : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="w-full h-[70vh] animate-pulse bg-gray-800"></div>
        <div className="px-6 md:px-16 mt-8 space-y-6">
          <div className="h-10 w-1/3 animate-pulse bg-gray-800 rounded"></div>
          <div className="h-24 animate-pulse bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (!details) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
        <p className="mb-6">
          The content you&apos;re looking for doesn&apos;t exist or is unavailable.
        </p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="relative">
        {/* Banner Image */}
        <div className="relative h-[70vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            {details.backdrop_path ? (
              <Image
                src={getImageUrl(details.backdrop_path, "original") || ""}
                alt={details.title || details.name || ""}
                fill
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-900"></div>
            )}
            <div className="absolute inset-0 details-gradient"></div>
            <div className="absolute top-0 h-32 w-full bg-gradient-to-b from-black to-transparent"></div>
          </div>

          <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full md:w-3/4 z-10 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold animate-fade-in">
              {details.title || details.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm animate-fade-in opacity-90">
              <div className="flex items-center">
                <Star size={16} className="text-yellow-400 mr-1" />
                <span>{details.vote_average?.toFixed(1) || "N/A"}/10</span>
              </div>

              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>
                  {formatReleaseDate(
                    details.release_date || details.first_air_date
                  )}
                </span>
              </div>

              {mediaType === "movie" && details.runtime && (
                <div className="flex items-center">
                  <Clock size={16} className="mr-1" />
                  <span>{formatRuntime(details.runtime)}</span>
                </div>
              )}

              {mediaType === "tv" && details.number_of_seasons && (
                <div className="flex items-center">
                  <Tv size={16} className="mr-1" />
                  <span>
                    {details.number_of_seasons}{" "}
                    {details.number_of_seasons === 1 ? "Season" : "Seasons"}
                  </span>
                </div>
              )}

              <Badge variant="outline" className="border-white/30">
                {mediaType === "tv" ? "Series" : "Movie"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 animate-fade-in">
              <Button
                onClick={handlePlay}
                className="bg-white text-black hover:bg-white/90 px-8"
                size="lg"
              >
                <Play size={18} className="mr-2" />
                <span>
                  {isAlreadyWatching
                    ? `Continue ${
                        currentWatchStatus?.mediaType === "tv"
                          ? `S${currentWatchStatus.seasonNumber || 1} E${
                              currentWatchStatus.episodeNumber || 1
                            }`
                          : ""
                      }`
                    : "Play"}
                </span>
              </Button>

              <Button
                onClick={handleWatchlistToggle}
                variant="outline"
                className="border-gray-600"
                size="lg"
              >
                {isAlreadyInList ? (
                  <>
                    <Check size={18} className="mr-2" />
                    <span>In My List</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} className="mr-2" />
                    <span>Add to List</span>
                  </>
                )}
              </Button>

              {trailerKey && (
                <Button
                  variant="outline"
                  className="border-gray-600"
                  size="lg"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${trailerKey}`,
                      "_blank"
                    )
                  }
                >
                  <Video size={18} className="mr-2" />
                  <span>Trailer</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="px-6 md:px-16 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <p className="text-white/90 text-base">
                {details.overview || "No overview available."}
              </p>

              {details.genres && details.genres.length > 0 && (
                <div>
                  <h3 className="text-white/70 mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {details.genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="outline"
                        className="px-3 py-1 bg-gray-800 border-none rounded-full"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {details.created_by && details.created_by.length > 0 && (
                <div>
                  <h3 className="text-white/70 mb-1">Created By</h3>
                  <p>
                    {details.created_by
                      .map((creator) => creator.name)
                      .join(", ")}
                  </p>
                </div>
              )}

              {details.production_companies &&
                details.production_companies.length > 0 && (
                  <div>
                    <h3 className="text-white/70 mb-1">Production</h3>
                    <p>
                      {details.production_companies
                        .slice(0, 2)
                        .map((company) => company.name)
                        .join(", ")}
                    </p>
                  </div>
                )}

              {mediaType === "movie" && (
                <div className="flex items-center space-x-2">
                  <Film size={16} className="text-red-500" />
                  <span>Movie</span>
                </div>
              )}

              {mediaType === "tv" && (
                <div className="flex items-center space-x-2">
                  <Tv size={16} className="text-red-500" />
                  <span>TV Series</span>
                </div>
              )}
            </div>
          </div>

          {/* Cast Section */}
          {details.credits &&
            details.credits.cast &&
            details.credits.cast.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Cast</h2>
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                  {details.credits.cast.slice(0, 10).map((person) => (
                    <div key={person.id} className="flex-shrink-0 w-28">
                      <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-800 mb-2">
                        {person.profile_path ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={
                                getImageUrl(person.profile_path, "w185") || ""
                              }
                              alt={person.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <User size={32} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-center truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-gray-400 text-center truncate">
                        {person.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Episodes Section for TV */}
          {mediaType === "tv" && seasons && seasons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Episodes</h2>
                <div>
                  <Select
                    value={selectedSeason.toString()}
                    onValueChange={handleSeasonChange}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Season">
                        Season {selectedSeason}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {seasons.map((season) => (
                        <SelectItem
                          key={season.id}
                          value={season.season_number.toString()}
                          className="text-white hover:bg-gray-700"
                        >
                          Season {season.season_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                {episodes[selectedSeason] ? (
                  episodes[selectedSeason].map((episode) => (
                    <div
                      key={episode.id}
                      className="bg-gray-900/50 rounded-md overflow-hidden border border-gray-800"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-64 h-40 relative">
                          {episode.still_path ? (
                            <Image
                              src={
                                getImageUrl(episode.still_path, "w500") || ""
                              }
                              alt={episode.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <Film size={32} className="text-gray-600" />
                            </div>
                          )}
                          <button
                            onClick={() =>
                              handleEpisodePlay(
                                selectedSeason,
                                episode.episode_number
                              )
                            }
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                              <Play size={20} className="text-black ml-1" />
                            </div>
                          </button>
                        </div>

                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {episode.episode_number}. {episode.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                <span>{episode.runtime} min</span>
                                <span>
                                  {new Date(
                                    episode.air_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() =>
                                handleEpisodePlay(
                                  selectedSeason,
                                  episode.episode_number
                                )
                              }
                              size="sm"
                              className="hidden md:flex"
                            >
                              Play
                            </Button>
                          </div>
                          <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                            {episode.overview || "No description available."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similar Content Section */}
          {details.similar &&
            details.similar.results &&
            details.similar.results.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">More Like This</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {details.similar.results.slice(0, 10).map((movie) => (
                    <div
                      key={movie.id}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() =>
                        router.push(`/details/${mediaType}/${movie.id}`)
                      }
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-md bg-gray-800 relative">
                        {movie.poster_path ? (
                          <Image
                            src={getImageUrl(movie.poster_path, "w342") || ""}
                            alt={movie.title || movie.name || ""}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Film size={32} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-medium truncate">
                        {movie.title || movie.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Recommendations Section */}
          {details.recommendations &&
            details.recommendations.results &&
            details.recommendations.results.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Recommended For You</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {details.recommendations.results.slice(0, 10).map((movie) => (
                    <div
                      key={movie.id}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() =>
                        router.push(
                          `/details/${movie.media_type || mediaType}/${
                            movie.id
                          }`
                        )
                      }
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-md bg-gray-800 relative">
                        {movie.poster_path ? (
                          <Image
                            src={getImageUrl(movie.poster_path, "w342") || ""}
                            alt={movie.title || movie.name || ""}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Film size={32} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-medium truncate">
                        {movie.title || movie.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}