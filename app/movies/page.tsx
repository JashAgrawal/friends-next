import { Suspense } from "react";
import { tmdbClient } from "@/lib/tmdb-client";
import Hero from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { generateMoviesMetadata, generateBreadcrumbStructuredData } from "@/lib/seo-utils";

export const metadata = generateMoviesMetadata();

// Movie categories
const movieCategories = [
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
    id: "now-playing-movies",
    title: "Now Playing",
    fetchFn: () => tmdbClient.getNowPlayingMovies(),
  },
  {
    id: "upcoming-movies",
    title: "Upcoming Movies",
    fetchFn: () => tmdbClient.getUpcomingMovies(),
  },
];

// Genre-based categories
const genreCategories = [
  {
    id: "action-movies",
    title: "Action Movies",
    fetchFn: () => tmdbClient.discoverMovies({ with_genres: "28" }),
  },
  {
    id: "comedy-movies",
    title: "Comedy Movies",
    fetchFn: () => tmdbClient.discoverMovies({ with_genres: "35" }),
  },
  {
    id: "drama-movies",
    title: "Drama Movies",
    fetchFn: () => tmdbClient.discoverMovies({ with_genres: "18" }),
  },
  {
    id: "horror-movies",
    title: "Horror Movies",
    fetchFn: () => tmdbClient.discoverMovies({ with_genres: "27" }),
  },
  {
    id: "romance-movies",
    title: "Romance Movies",
    fetchFn: () => tmdbClient.discoverMovies({ with_genres: "10749" }),
  },
];

async function FeaturedMovies() {
  // Fetch featured movies for hero section
  const featuredData = await tmdbClient.getTopRatedMovies();
  const featuredMovies = featuredData.results
    .filter((movie) => movie.backdrop_path !== null)
    .slice(0, 5);

  return <Hero movies={featuredMovies} />;
}

async function ContentRow({
  category,
}: {
  category: (typeof movieCategories)[0];
}) {
  try {
    const data = await category.fetchFn();
    return (
      <MovieRow
        title={category.title}
        movies={data.results}
        seeMoreHref={`/movies/explore?genre=${category.id}`}
      />
    );
  } catch (error) {
    console.error(`Error loading ${category.title}:`, error);
    return null;
  }
}

// Server component for the page
export default function MoviesPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Movies", url: "/movies" },
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
        <Suspense
          fallback={
            <div className="h-[70vh] md:h-[90vh] bg-gray-900 animate-pulse" />
          }
        >
          <FeaturedMovies />
        </Suspense>

        {/* Filter Bar */}
        {/* <MoviesFilter /> */}

        <div className="pb-20">
          {/* Movie Categories */}
          {movieCategories.map((category) => (
            <Suspense
              key={category.id}
              fallback={<MovieRow title={category.title} isLoading={true} />}
            >
              <ContentRow category={category} />
            </Suspense>
          ))}

          {/* Genre Categories */}
          {genreCategories.map((category) => (
            <Suspense
              key={category.id}
              fallback={<MovieRow title={category.title} isLoading={true} />}
            >
              <ContentRow category={category} />
            </Suspense>
          ))}
        </div>
      </main>
    </>
  );
}
