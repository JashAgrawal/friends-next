import { Metadata } from "next";
import { Suspense } from "react";
import { DetailsPageClient } from "./details-client";
import { tmdbClient } from "@/lib/tmdb-client";
import { generateDetailsMetadata, generateContentStructuredData, generateBreadcrumbStructuredData } from "@/lib/seo-utils";

interface DetailsPageProps {
  params: Promise<{ mediaType: string; id: string }>;
}

export async function generateMetadata({ params }: DetailsPageProps): Promise<Metadata> {
  try {
    const { mediaType, id } = await params;
    const mediaId = parseInt(id);
    
    let details;
    if (mediaType === "movie") {
      details = await tmdbClient.getMovieDetails(mediaId);
    } else {
      details = await tmdbClient.getTVShowDetails(mediaId);
    }
    
    return generateDetailsMetadata(details, mediaType);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Content Details",
      description: "Watch movies and TV shows on Friends streaming platform.",
    };
  }
}
export default async function DetailsPage({ params }: DetailsPageProps) {
  try {
    const { mediaType, id } = await params;
    const mediaId = parseInt(id);
    
    // Fetch content details for structured data
    let details;
    if (mediaType === "movie") {
      details = await tmdbClient.getMovieDetails(mediaId);
    } else {
      details = await tmdbClient.getTVShowDetails(mediaId);
    }
    
    // Generate structured data
    const contentStructuredData = generateContentStructuredData(details, mediaType);
    const breadcrumbData = generateBreadcrumbStructuredData([
      { name: "Home", url: "/" },
      { name: mediaType === "movie" ? "Movies" : "TV Shows", url: `/${mediaType === "movie" ? "movies" : "tv-shows"}` },
      { name: details.title || details.name || "Details", url: `/details/${mediaType}/${id}` },
    ]);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(contentStructuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbData),
          }}
        />
        <Suspense fallback={
          <div className="min-h-screen bg-black">
            <div className="w-full h-[70vh] animate-pulse bg-gray-800"></div>
            <div className="px-6 md:px-16 mt-8 space-y-6">
              <div className="h-10 w-1/3 animate-pulse bg-gray-800 rounded"></div>
              <div className="h-24 animate-pulse bg-gray-800 rounded"></div>
            </div>
          </div>
        }>
          <DetailsPageClient mediaType={mediaType} id={id} />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error("Error in DetailsPage:", error);
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
        <p className="mb-6">
          The content you&apos;re looking for doesn&apos;t exist or is unavailable.
        </p>
      </div>
    );
  }
}
