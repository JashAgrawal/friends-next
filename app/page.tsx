import { Suspense } from "react";
import { tmdbClient } from "@/lib/tmdb-client";
import { generateHomeMetadata } from "@/lib/seo-utils";
import { 
  LazyHero, 
  LazyMovieRow, 
  LazyContinueWatching, 
  LazyMyList
} from "@/lib/dynamic-imports";
import { HeroSkeleton, MovieRowSkeleton } from "@/components/ui/loading-skeleton";
import { PreloadComponents } from "@/components/PreloadComponents";

export const metadata = generateHomeMetadata();

// Categories for content rows
const categories = [
  {
    id: "trending-movies",
    title: "Trending Movies",
    fetchFn: () => tmdbClient.getTrendingMovies(),
  },
  {
    id: "popular-movies",
    title: "Popular Movies",
    fetchFn: () => tmdbClient.getPopularMovies(),
  },
  {
    id: "top-rated-movies",
    title: "Top Rated Movies",
    fetchFn: () => tmdbClient.getTopRatedMovies(),
  },
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
];

async function FeaturedContent() {
  // Fetch featured content for hero section
  const featuredData = await tmdbClient.getPopularMovies();
  const featuredMovies = featuredData.results.filter(
    (movie) => movie.backdrop_path !== null
  ).slice(0, 5);

  return <LazyHero movies={featuredMovies} />;
}

async function ContentRow({ category }: { category: typeof categories[0] }) {
  try {
    const data = await category.fetchFn();
    return (
      <LazyMovieRow
        title={category.title}
        movies={data.results}
        seeMoreHref={`/${category.id.includes("movie") ? "movies/explore" : "tv-shows/explore"}`}
      />
    );
  } catch (error) {
    console.error(`Error loading ${category.title}:`, error);
    return null;
  }
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Preload critical components on client side */}
      <PreloadComponents />
      
      {/* Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <FeaturedContent />
      </Suspense>

      <div className="pb-20">
        {/* Continue Watching Section */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyContinueWatching />
        </Suspense>
        
        {/* My List Section */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMyList />
        </Suspense>
        
        {/* Content Rows */}
        {categories.map((category) => (
          <Suspense 
            key={category.id} 
            fallback={<MovieRowSkeleton />}
          >
            <ContentRow category={category} />
          </Suspense>
        ))}
      </div>
    </main>
  );
}