import { Player } from "@/components/ui/player";
import { tmdbClient } from "@/lib/tmdb-client";
import { Metadata } from "next";

interface WatchPageProps {
  params: Promise<{
    mediaType: string;
    id: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { mediaType, id, seasonNumber, episodeNumber } = await params;
  
  if (mediaType !== "tv") {
    return {
      title: "Watch | Friends",
      description: "Watch movies and TV shows on Friends streaming platform",
    };
  }
  
  try {
    const details = await tmdbClient.getTVShowDetails(parseInt(id));
    const title = details.name || "Unknown";
    
    return {
      title: `Watch ${title} S${seasonNumber}E${episodeNumber} | Friends`,
      description: `Watch ${title} Season ${seasonNumber} Episode ${episodeNumber} on Friends streaming platform`,
    };
  } catch (e) {
    return {
      title: "Watch | Friends",
      description: "Watch movies and TV shows on Friends streaming platform",
    };
  }
}

export default async function WatchPageWithEpisode({ params }: WatchPageProps) {
  const { mediaType, id, seasonNumber, episodeNumber } = await params;
  
  if (mediaType !== "tv") {
    return (
      <div className="flex items-center justify-center h-screen bg-friends-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Content Type</h1>
          <p>This URL format is only valid for TV shows.</p>
        </div>
      </div>
    );
  }
  
  try {
    const details = await tmdbClient.getTVShowDetails(parseInt(id));
    const title = details.name || "Unknown";
    
    return (
      <Player
        mediaType={mediaType}
        id={id}
        title={title}
        posterPath={details.poster_path}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
      />
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-friends-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p>Sorry, we couldn&apos;t find the episode you&apos;re looking for.</p>
        </div>
      </div>
    );
  }
}