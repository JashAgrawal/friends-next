import { Suspense } from "react";
import { Metadata } from "next";
import { ExplorePageClient } from "./explore-client";
import { generateExploreMetadata, generateBreadcrumbStructuredData } from "@/lib/seo-utils";

interface ExplorePageProps {
  searchParams: Promise<{ 
    mediaType?: string; 
    genre?: string; 
    sort_by?: string; 
    with_status?: string; 
  }>;
}

export async function generateMetadata({ searchParams }: ExplorePageProps): Promise<Metadata> {
  const params = await searchParams;
  return generateExploreMetadata(params.mediaType, params.genre);
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const mediaType = params.mediaType || "movie";
  const genre = params.genre || "popular";
  const sortBy = params.sort_by || "popularity.desc";
  const status = params.with_status || "";
  
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Explore", url: "/explore" },
    ...(genre !== "popular" ? [{ 
      name: `${mediaType === "movie" ? "Movies" : "TV Shows"} - ${genre}`, 
      url: `/explore?mediaType=${mediaType}&genre=${genre}` 
    }] : []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <Suspense fallback={<div className="container mx-auto px-4 pt-24 pb-12">Loading...</div>}>
        <ExplorePageClient
          initialMediaType={mediaType}
          initialGenre={genre}
          initialSortBy={sortBy}
          initialStatus={status}
        />
      </Suspense>
    </>
  );
}