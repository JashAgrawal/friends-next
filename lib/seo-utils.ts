import { Metadata } from "next";
import {  MovieDetails } from "./tmdb-client";

// Base site configuration
const SITE_CONFIG = {
  name: "Friends",
  description: "Watch your favorite movies and TV shows on Friends - your ultimate streaming platform",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://friends-streaming.com",
  ogImage: "/og-image.jpg",
  twitterHandle: "@friends_stream",
};

// Generate base metadata for the site
export function generateBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: {
      default: `${SITE_CONFIG.name} - Watch Movies and TV Shows`,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: SITE_CONFIG.description,
    keywords: [
      "streaming",
      "movies",
      "tv shows",
      "watch online",
      "entertainment",
      "cinema",
      "series",
      "films",
    ],
    authors: [{ name: "Friends Team" }],
    creator: "Friends Team",
    publisher: "Friends",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      title: `${SITE_CONFIG.name} - Watch Movies and TV Shows`,
      description: SITE_CONFIG.description,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.name} - Streaming Platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: `${SITE_CONFIG.name} - Watch Movies and TV Shows`,
      description: SITE_CONFIG.description,
      images: [SITE_CONFIG.ogImage],
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    alternates: {
      canonical: SITE_CONFIG.url,
    },
  };
}

// Generate metadata for home page
export function generateHomeMetadata(): Metadata {
  return {
    title: "Home",
    description: "Discover trending movies and TV shows. Watch your favorites and explore new content on Friends streaming platform.",
    openGraph: {
      title: `${SITE_CONFIG.name} - Home`,
      description: "Discover trending movies and TV shows. Watch your favorites and explore new content.",
      url: SITE_CONFIG.url,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: "Friends Home - Discover Movies and TV Shows",
        },
      ],
    },
    twitter: {
      title: `${SITE_CONFIG.name} - Home`,
      description: "Discover trending movies and TV shows. Watch your favorites and explore new content.",
    },
    alternates: {
      canonical: SITE_CONFIG.url,
    },
  };
}

// Generate metadata for movies page
export function generateMoviesMetadata(): Metadata {
  return {
    title: "Movies | Browse Our Collection",
    description: "Browse and watch the latest and greatest movies on Friends. Action, comedy, drama, horror, and more genres available.",
    keywords: [
      "movies",
      "streaming movies",
      "watch movies online",
      "action movies",
      "comedy movies",
      "drama movies",
      "horror movies",
      "romance movies",
      "sci-fi movies",
    ],
    openGraph: {
      title: `${SITE_CONFIG.name} - Movies | Browse Our Collection`,
      description: "Browse and watch the latest and greatest movies on Friends streaming platform.",
      url: `${SITE_CONFIG.url}/movies`,
      images: [
        {
          url: "/og-movies.jpg",
          width: 1200,
          height: 630,
          alt: "Friends Movies Collection",
        },
      ],
    },
    twitter: {
      title: `${SITE_CONFIG.name} - Movies | Browse Our Collection`,
      description: "Browse and watch the latest and greatest movies on Friends streaming platform.",
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/movies`,
    },
  };
}

// Generate metadata for TV shows page
export function generateTVShowsMetadata(): Metadata {
  return {
    title: "TV Shows | Browse Our Collection",
    description: "Browse and watch the latest and greatest TV shows on Friends. Drama, comedy, sci-fi, fantasy, and more genres available.",
    keywords: [
      "tv shows",
      "streaming tv shows",
      "watch tv shows online",
      "drama shows",
      "comedy shows",
      "sci-fi shows",
      "fantasy shows",
      "crime shows",
      "reality shows",
    ],
    openGraph: {
      title: `${SITE_CONFIG.name} - TV Shows | Browse Our Collection`,
      description: "Browse and watch the latest and greatest TV shows on Friends streaming platform.",
      url: `${SITE_CONFIG.url}/tv-shows`,
      images: [
        {
          url: "/og-tv-shows.jpg",
          width: 1200,
          height: 630,
          alt: "Friends TV Shows Collection",
        },
      ],
    },
    twitter: {
      title: `${SITE_CONFIG.name} - TV Shows | Browse Our Collection`,
      description: "Browse and watch the latest and greatest TV shows on Friends streaming platform.",
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/tv-shows`,
    },
  };
}

// Generate metadata for explore page
export function generateExploreMetadata(
  mediaType?: string,
  genre?: string
): Metadata {
  const isMovies = mediaType === "movie";
  const contentType = isMovies ? "Movies" : "TV Shows";
  const baseTitle = `Explore ${contentType}`;
  
  let title = baseTitle;
  let description = `Explore and discover ${contentType.toLowerCase()} by genre, popularity, and ratings on Friends streaming platform.`;
  
  // Customize based on genre
  if (genre) {
    const genreNames: Record<string, string> = {
      trending: "Trending",
      popular: "Popular",
      "top-rated": "Top Rated",
      "now-playing": "Now Playing",
      upcoming: "Upcoming",
      "on-the-air": "Currently Airing",
      "28": "Action",
      "35": "Comedy",
      "18": "Drama",
      "27": "Horror",
      "10749": "Romance",
      "878": "Science Fiction",
      "53": "Thriller",
      "16": "Animation",
      "80": "Crime",
      "99": "Documentary",
      "10751": "Family",
      "14": "Fantasy",
      "36": "History",
      "10402": "Music",
      "9648": "Mystery",
      "10752": "War",
      "37": "Western",
      "10759": "Action & Adventure",
      "10762": "Kids",
      "10763": "News",
      "10764": "Reality",
      "10765": "Sci-Fi & Fantasy",
      "10766": "Soap",
      "10767": "Talk",
      "10768": "War & Politics",
    };
    
    const genreName = genreNames[genre];
    if (genreName) {
      title = `${genreName} ${contentType}`;
      description = `Discover ${genreName.toLowerCase()} ${contentType.toLowerCase()} on Friends. Browse our curated collection of ${genreName.toLowerCase()} content.`;
    }
  }

  return {
    title,
    description,
    keywords: [
      "explore",
      mediaType === "movie" ? "movies" : "tv shows",
      "genres",
      "discover",
      "browse",
      "streaming",
      "watch online",
    ],
    openGraph: {
      title: `${SITE_CONFIG.name} - ${title}`,
      description,
      url: `${SITE_CONFIG.url}/explore${mediaType ? `?mediaType=${mediaType}` : ""}${genre ? `&genre=${genre}` : ""}`,
      images: [
        {
          url: isMovies ? "/og-movies.jpg" : "/og-tv-shows.jpg",
          width: 1200,
          height: 630,
          alt: `Friends ${title}`,
        },
      ],
    },
    twitter: {
      title: `${SITE_CONFIG.name} - ${title}`,
      description,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/explore${mediaType ? `?mediaType=${mediaType}` : ""}${genre ? `&genre=${genre}` : ""}`,
    },
  };
}

// Generate metadata for search page
export function generateSearchMetadata(query?: string): Metadata {
  const title = query ? `Search results for "${query}"` : "Search";
  const description = query 
    ? `Search results for "${query}" on Friends. Find movies and TV shows matching your query.`
    : "Search for movies and TV shows on Friends streaming platform.";

  return {
    title,
    description,
    robots: {
      index: query ? false : true, // Don't index search result pages
      follow: true,
    },
    openGraph: {
      title: `${SITE_CONFIG.name} - ${title}`,
      description,
      url: `${SITE_CONFIG.url}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    },
    twitter: {
      title: `${SITE_CONFIG.name} - ${title}`,
      description,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/search`,
    },
  };
}

// Generate metadata for content details page
export function generateDetailsMetadata(
  content: MovieDetails,
  mediaType: string
): Metadata {
  const title = content.title || content.name || "Content Details";
  const description = content.overview 
    ? `${content.overview.substring(0, 155)}...`
    : `Watch ${title} on Friends streaming platform.`;
  
  const releaseYear = content.release_date 
    ? new Date(content.release_date).getFullYear()
    : content.first_air_date 
    ? new Date(content.first_air_date).getFullYear()
    : "";
  
  const fullTitle = releaseYear ? `${title} (${releaseYear})` : title;
  
  const genres = content.genres?.map(g => g.name).join(", ") || "";
  const keywords = [
    title.toLowerCase(),
    mediaType === "movie" ? "movie" : "tv show",
    "watch online",
    "streaming",
    ...genres.split(", ").map(g => g.toLowerCase()),
  ].filter(Boolean);

  const imageUrl = content.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`
    : content.poster_path
    ? `https://image.tmdb.org/t/p/w780${content.poster_path}`
    : SITE_CONFIG.ogImage;

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: `${fullTitle} | ${SITE_CONFIG.name}`,
      description,
      url: `${SITE_CONFIG.url}/details/${mediaType}/${content.id}`,
      type: "video.movie",
      images: [
        {
          url: imageUrl,
          width: 1280,
          height: 720,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} | ${SITE_CONFIG.name}`,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/details/${mediaType}/${content.id}`,
    },
  };
}

// Generate metadata for watch page
export function generateWatchMetadata(
  content: MovieDetails,
  mediaType: string,
  seasonNumber?: number,
  episodeNumber?: number
): Metadata {
  const title = content.title || content.name || "Watch";
  let fullTitle = title;
  
  if (mediaType === "tv" && seasonNumber && episodeNumber) {
    fullTitle = `${title} - S${seasonNumber}E${episodeNumber}`;
  }
  
  const description = `Watch ${fullTitle} on Friends streaming platform. ${content.overview ? content.overview.substring(0, 100) + "..." : ""}`;

  return {
    title: `Watch ${fullTitle}`,
    description,
    robots: {
      index: false, // Don't index watch pages
      follow: false,
    },
    openGraph: {
      title: `Watch ${fullTitle} | ${SITE_CONFIG.name}`,
      description,
      url: `${SITE_CONFIG.url}/watch/${mediaType}/${content.id}${seasonNumber && episodeNumber ? `/${seasonNumber}/${episodeNumber}` : ""}`,
      type: "video.movie",
    },
    twitter: {
      title: `Watch ${fullTitle} | ${SITE_CONFIG.name}`,
      description,
    },
  };
}

// Generate metadata for My List page
export function generateMyListMetadata(): Metadata {
  return {
    title: "My List",
    description: "Your personal watchlist of movies and TV shows saved to watch later on Friends streaming platform.",
    openGraph: {
      title: `My List | ${SITE_CONFIG.name}`,
      description: "Your personal watchlist of movies and TV shows saved to watch later.",
      url: `${SITE_CONFIG.url}/my-list`,
    },
    twitter: {
      title: `My List | ${SITE_CONFIG.name}`,
      description: "Your personal watchlist of movies and TV shows saved to watch later.",
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/my-list`,
    },
  };
}

// Generate structured data (JSON-LD) for content
export function generateContentStructuredData(
  content: MovieDetails,
  mediaType: string
) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": mediaType === "movie" ? "Movie" : "TVSeries",
    name: content.title || content.name,
    description: content.overview,
    image: content.poster_path 
      ? `https://image.tmdb.org/t/p/w780${content.poster_path}`
      : undefined,
    datePublished: content.release_date || content.first_air_date,
    genre: content.genres?.map(g => g.name),
    aggregateRating: content.vote_average ? {
      "@type": "AggregateRating",
      ratingValue: content.vote_average,
      ratingCount: 10,
      bestRating: 10,
      worstRating: 0,
    } : undefined,
    productionCompany: content.production_companies?.map(company => ({
      "@type": "Organization",
      name: company.name,
    })),
  };

  if (mediaType === "movie") {
    return {
      ...baseData,
      duration: content.runtime ? `PT${content.runtime}M` : undefined,
    };
  } else {
    return {
      ...baseData,
      numberOfSeasons: content.number_of_seasons,
      numberOfEpisodes: content.number_of_episodes,
    };
  }
}

// Generate structured data for website
export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}