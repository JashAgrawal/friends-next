import { Player } from "@/components/ui/player";
import { tmdbClient } from "@/lib/tmdb-client";
import { Metadata } from "next";

interface WatchPageProps {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { mediaType, id } = await params;
  
  try {
    const details = mediaType === "movie" 
      ? await tmdbClient.getMovieDetails(parseInt(id))
      : await tmdbClient.getTVShowDetails(parseInt(id));
    
    const title = details.title || details.name || "Watch";
    
    return {
      title: `Watch ${title} | Friends`,
      description: `Watch ${title} on Friends streaming platform`,
    };
  } catch (error) {
    return {
      title: "Watch | Friends",
      description: "Watch movies and TV shows on Friends streaming platform",
    };
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { mediaType, id } = await params;
  
  try {
    const details = mediaType === "movie" 
      ? await tmdbClient.getMovieDetails(parseInt(id))
      : await tmdbClient.getTVShowDetails(parseInt(id));
    
    const title = details.title || details.name || "Unknown";
    
    return (
      <Player
        mediaType={mediaType}
        id={id}
        title={title}
        posterPath={details.poster_path}
      />
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-friends-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p>Sorry, we couldn&apos;t find the content you&apos;re looking for.</p>
        </div>
      </div>
    );
  }
}