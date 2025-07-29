// TMDB API Types
export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: string;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  created_by?: { name: string }[];
  production_companies: { name: string }[];
  videos: {
    results: {
      key: string;
      site: string;
      type: string;
    }[];
  };
  credits: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      profile_path: string | null;
    }[];
  };
  similar: {
    results: Movie[];
  };
  recommendations: {
    results: Movie[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    overview: string;
    air_date: string;
  }[];
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episodes: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  runtime: number;
}

export interface SearchResults {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface GenreList {
  genres: { id: number; name: string }[];
}

// TMDB API Client
class TMDBClient {
  private baseUrl = 'https://api.themoviedb.org/3';
  private apiKey: string;
  private language: string;
  private region: string;
  
  constructor(apiKey: string = process.env.NEXT_PUBLIC_TMDB_API_KEY || '', language: string = 'en-US', region: string = 'US') {
    this.apiKey = apiKey;
    this.language = language;
    this.region = region;
  }
  
  private async fetchFromAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // In client components, use the API route instead of direct TMDB API calls
    if (typeof window !== 'undefined') {
      const url = `${this.baseUrl}${endpoint}?language=${this.language}&region=${this.region}${Object.entries(params).map(([key, value]) => `&${key}=${value}`).join('')}`;
      
      const response = await fetch('/api/tmdb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return response.json() as Promise<T>;
    }
    
    // In server components, call TMDB API directly
    const url = `${this.baseUrl}${endpoint}?language=${this.language}&region=${this.region}${Object.entries(params).map(([key, value]) => `&${key}=${value}`).join('')}&api_key=${process.env.TMDB_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  // Movies
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>(`/trending/movie/${timeWindow}`, { page: page.toString() });
  }
  
  async getPopularMovies(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/movie/popular', { page: page.toString() });
  }
  
  async getTopRatedMovies(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/movie/top_rated', { page: page.toString() });
  }
  
  async getNowPlayingMovies(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/movie/now_playing', { page: page.toString() });
  }
  
  async getUpcomingMovies(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/movie/upcoming', { page: page.toString() });
  }
  
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.fetchFromAPI<MovieDetails>(`/movie/${movieId}`, { append_to_response: 'videos,credits,similar,recommendations' });
  }
  
  // TV Shows
  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>(`/trending/tv/${timeWindow}`, { page: page.toString() });
  }
  
  async getPopularTVShows(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/tv/popular', { page: page.toString() });
  }
  
  async getTopRatedTVShows(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/tv/top_rated', { page: page.toString() });
  }
  
  async getOnTheAirTVShows(page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/tv/on_the_air', { page: page.toString() });
  }
  
  async getTVShowDetails(tvId: number): Promise<MovieDetails> {
    return this.fetchFromAPI<MovieDetails>(`/tv/${tvId}`, { append_to_response: 'videos,credits,similar,recommendations' });
  }
  
  async getTVShowSeason(tvId: number, seasonNumber: number): Promise<Season> {
    return this.fetchFromAPI<Season>(`/tv/${tvId}/season/${seasonNumber}`);
  }
  
  // Search
  async searchMulti(query: string, page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/search/multi', { query: encodeURIComponent(query), page: page.toString() });
  }
  
  async searchMovies(query: string, page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/search/movie', { query: encodeURIComponent(query), page: page.toString() });
  }
  
  async searchTVShows(query: string, page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/search/tv', { query: encodeURIComponent(query), page: page.toString() });
  }
  
  // Genres
  async getMovieGenres(): Promise<GenreList> {
    return this.fetchFromAPI<GenreList>('/genre/movie/list');
  }
  
  async getTVGenres(): Promise<GenreList> {
    return this.fetchFromAPI<GenreList>('/genre/tv/list');
  }
  
  // Discover
  async discoverMovies(params: Record<string, string> = {}, page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/discover/movie', { ...params, page: page.toString() });
  }
  
  async discoverTVShows(params: Record<string, string> = {}, page: number = 1): Promise<SearchResults> {
    return this.fetchFromAPI<SearchResults>('/discover/tv', { ...params, page: page.toString() });
  }
}

// Create a singleton instance
export const tmdbClient = new TMDBClient();

// Helper functions for data transformation
export function getImageUrl(path: string | null, size: string = 'original'): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatReleaseDate(date: string | undefined): string {
  if (!date) return 'Unknown';
  return new Date(date).getFullYear().toString();
}

export function formatRuntime(minutes: number | undefined): string {
  if (!minutes) return 'Unknown';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function getTrailerKey(videos: MovieDetails['videos']): string | null {
  if (!videos || !videos.results || videos.results.length === 0) return null;
  
  // Try to find a YouTube trailer
  const trailer = videos.results.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer'
  );
  
  // If no trailer, try to find a YouTube teaser
  if (!trailer) {
    const teaser = videos.results.find(
      (video) => video.site === 'YouTube' && video.type === 'Teaser'
    );
    if (teaser) return teaser.key;
  }
  
  // If no trailer or teaser, return the first YouTube video
  const youtubeVideo = videos.results.find((video) => video.site === 'YouTube');
  if (youtubeVideo) return youtubeVideo.key;
  
  return null;
}

export function getDirector(credits: MovieDetails['credits']): string | null {
  if (!credits || !credits.crew || credits.crew.length === 0) return null;
  
  const director = credits.crew.find((person) => person.job === 'Director');
  return director ? director.name : null;
}

export function getMainCast(credits: MovieDetails['credits'], limit: number = 5): string[] {
  if (!credits || !credits.cast || credits.cast.length === 0) return [];
  
  return credits.cast.slice(0, limit).map((person) => person.name);
}

export function getGenreNames(genres: { id: number; name: string }[]): string[] {
  if (!genres || genres.length === 0) return [];
  
  return genres.map((genre) => genre.name);
}