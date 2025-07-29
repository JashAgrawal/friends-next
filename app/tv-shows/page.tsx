import { Suspense } from "react";
import { tmdbClient } from "@/lib/tmdb-client";
import Hero from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { generateTVShowsMetadata, generateBreadcrumbStructuredData } from "@/lib/seo-utils";

export const metadata = generateTVShowsMetadata();

// TV Show categories
const tvShowCategories = [
  {
    id: "trending-tv",
    title: "Trending TV Shows",
    fetchFn: () => tmdbClient.getTrendingTVShows(),
  },
  {
    id: "popular-tv",
    title: "Popular TV Shows",
    fetchFn: () => tmdbClient.getPopularTVShows(),
  },
  {
    id: "top-rated-tv",
    title: "Top Rated TV Shows",
    fetchFn: () => tmdbClient.getTopRatedTVShows(),
  },
  {
    id: "on-the-air-tv",
    title: "Currently Airing",
    fetchFn: () => tmdbClient.getOnTheAirTVShows(),
  },
];

// Genre-based categories
const genreCategories = [
  {
    id: "action-adventure-tv",
    title: "Action & Adventure",
    fetchFn: () => tmdbClient.discoverTVShows({ with_genres: "10759" }),
  },
  {
    id: "animation-tv",
    title: "Animation",
    fetchFn: () => tmdbClient.discoverTVShows({ with_genres: "16" }),
  },
  {
    id: "comedy-tv",
    title: "Comedy",
    fetchFn: () => tmdbClient.discoverTVShows({ with_genres: "35" }),
  },
  {
    id: "crime-tv",
    title: "Crime",
    fetchFn: () => tmdbClient.discoverTVShows({ with_genres: "80" }),
  },
  {
    id: "drama-tv",
    title: "Drama",
    fetchFn: () => tmdbClient.discoverTVShows({ with_genres: "18" }),
  },
  {
    id: "sci-fi-fantasy-tv",
    title: "Sci-Fi & Fantasy",
    fetchFn: () => tmdbClient.discoverTVShows({ with_genres: "10765" }),
  },
];

async function FeaturedTVShows() {
  // Fetch featured TV shows for hero section
  const featuredData = await tmdbClient.getPopularTVShows();
  const featuredShows = featuredData.results
    .filter((show) => show.backdrop_path !== null)
    .slice(0, 5);

  return <Hero movies={featuredShows} />;
}

async function ContentRow({ category }: { category: typeof tvShowCategories[0] }) {
  try {
    const data = await category.fetchFn();
    return (
      <MovieRow
        title={category.title}
        movies={data.results}
        seeMoreHref={`/tv-shows/explore?genre=${category.id}`}
      />
    );
  } catch (error) {
    console.error(`Error loading ${category.title}:`, error);
    return null;
  }
}

export default function TVShowsPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "TV Shows", url: "/tv-shows" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <Suspense fallback={<div className="h-[70vh] md:h-[90vh] bg-gray-900 animate-pulse" />}>
          <FeaturedTVShows />
        </Suspense>

        {/* Filter Bar */}
        {/* <TVShowsFilter /> */}

        <div className="pb-20">
          {/* TV Show Categories */}
          {tvShowCategories.map((category) => (
            <Suspense 
              key={category.id} 
              fallback={
                <MovieRow 
                  title={category.title} 
                  isLoading={true} 
                />
              }
            >
              <ContentRow category={category} />
            </Suspense>
          ))}
          
          {/* Genre Categories */}
          {genreCategories.map((category) => (
            <Suspense 
              key={category.id} 
              fallback={
                <MovieRow 
                  title={category.title} 
                  isLoading={true} 
                />
              }
            >
              <ContentRow category={category} />
            </Suspense>
          ))}
        </div>
      </main>
    </>
  );
}