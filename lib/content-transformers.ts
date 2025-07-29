import { Movie } from './tmdb-client';
import { WatchlistItem, ContinueWatchingItem } from '../store/useContentStore';
import { WatchlistItem as DbWatchlistItem, WatchHistoryItem as DbWatchHistoryItem } from './content-utils';

// Transform TMDB movie/TV show to watchlist item
export function transformToWatchlistItem(item: Movie): WatchlistItem {
  return {
    id: item.id,
    mediaType: item.media_type || (item.title ? 'movie' : 'tv'),
    title: item.title || item.name || 'Unknown',
    posterPath: item.poster_path,
    addedAt: Date.now(),
  };
}

// Transform TMDB movie/TV show to continue watching item
export function transformToContinueWatchingItem(
  item: Movie,
  seasonNumber?: number,
  episodeNumber?: number,
  serverId?: number
): ContinueWatchingItem {
  return {
    id: item.id,
    mediaType: item.media_type || (item.title ? 'movie' : 'tv'),
    title: item.title || item.name || 'Unknown',
    posterPath: item.poster_path,
    seasonNumber,
    episodeNumber,
    serverId,
    lastWatchedAt: Date.now(),
  };
}

// Transform database watchlist item to store watchlist item
export function transformDbWatchlistToStoreItem(item: DbWatchlistItem): WatchlistItem {
  return {
    id: item.mediaId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    addedAt: new Date(item.addedAt).getTime(),
  };
}

// Transform database watch history item to store continue watching item
export function transformDbWatchHistoryToStoreItem(item: DbWatchHistoryItem): ContinueWatchingItem {
  return {
    id: item.mediaId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    seasonNumber: item.seasonNumber || undefined,
    episodeNumber: item.episodeNumber || undefined,
    serverId: item.serverId || undefined,
    lastWatchedAt: new Date(item.lastWatchedAt).getTime(),
  };
}

// Group movies/TV shows by genre
export function groupByGenre(items: Movie[]): Record<string, Movie[]> {
  const genreMap: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
  };

  const result: Record<string, Movie[]> = {};

  items.forEach((item) => {
    if (!item.genre_ids || item.genre_ids.length === 0) {
      if (!result['Uncategorized']) {
        result['Uncategorized'] = [];
      }
      result['Uncategorized'].push(item);
      return;
    }

    const mainGenreId = item.genre_ids[0];
    const genreName = genreMap[mainGenreId] || 'Uncategorized';

    if (!result[genreName]) {
      result[genreName] = [];
    }

    result[genreName].push(item);
  });

  return result;
}

// Filter and sort movies/TV shows
export function filterAndSortContent(
  items: Movie[],
  filters: {
    genre?: number;
    year?: number;
    rating?: number;
  } = {},
  sortBy: 'popularity' | 'rating' | 'release_date' = 'popularity'
): Movie[] {
  let filtered = [...items];

  // Apply filters
  if (filters.genre) {
    filtered = filtered.filter((item) => item.genre_ids?.includes(filters.genre!));
  }

  if (filters.year) {
    filtered = filtered.filter((item) => {
      const date = item.release_date || item.first_air_date;
      if (!date) return false;
      return new Date(date).getFullYear() === filters.year;
    });
  }

  if (filters.rating) {
    filtered = filtered.filter((item) => item.vote_average >= filters.rating!);
  }

  // Apply sorting
  switch (sortBy) {
    case 'rating':
      filtered.sort((a, b) => b.vote_average - a.vote_average);
      break;
    case 'release_date':
      filtered.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || '';
        const dateB = b.release_date || b.first_air_date || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      break;
    case 'popularity':
    default:
      // Assuming items are already sorted by popularity from the API
      break;
  }

  return filtered;
}

// Get random featured content for hero banner
export function getRandomFeaturedContent(items: Movie[], count: number = 1): Movie[] {
  if (!items || items.length === 0) return [];
  
  // Filter items with backdrop images
  const withBackdrops = items.filter((item) => item.backdrop_path);
  
  if (withBackdrops.length === 0) return [];
  
  // Shuffle and take the requested count
  const shuffled = [...withBackdrops].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}