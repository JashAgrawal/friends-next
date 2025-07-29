/**
 * Utility functions for working with localStorage
 */

const RECENT_SEARCHES_KEY = 'friends-recent-searches';
const MAX_RECENT_SEARCHES = 5;
const GUEST_PROFILE_KEY = 'friends-guest-profile';

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
}

/**
 * Add a search query to recent searches
 */
export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  
  try {
    const searches = getRecentSearches();
    
    // Remove the query if it already exists (to move it to the front)
    const filteredSearches = searches.filter(
      (search) => search.toLowerCase() !== query.toLowerCase()
    );
    
    // Add the new query to the beginning
    const newSearches = [query, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  } catch (error) {
    console.error('Error adding recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}

/**
 * Remove a specific search query from recent searches
 */
export function removeRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const searches = getRecentSearches();
    const newSearches = searches.filter(
      (search) => search.toLowerCase() !== query.toLowerCase()
    );
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  } catch (error) {
    console.error('Error removing recent search:', error);
  }
}

/**
 * Guest profile type definition
 */
export interface GuestProfile {
  id: string;
  name: string;
  avatar?: string | null;
  watchlist?: number[];
  continueWatching?: {
    id: number;
    mediaType: string;
    title?: string;
    posterPath?: string | null;
    seasonNumber?: number | null;
    episodeNumber?: number | null;
    serverId?: number | null;
    timestamp: number;
  }[];
}

/**
 * Generate a random ID for guest profiles
 */
function generateGuestId(): string {
  return 'guest-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Get or create a guest profile
 */
export function getOrCreateGuestProfile(): GuestProfile {
  if (typeof window === 'undefined') {
    // Return a default profile when running on the server
    return {
      id: generateGuestId(),
      name: 'Guest',
      watchlist: [],
      continueWatching: []
    };
  }
  
  try {
    const profile = localStorage.getItem(GUEST_PROFILE_KEY);
    
    if (profile) {
      return JSON.parse(profile);
    }
    
    // Create a new guest profile
    const newProfile: GuestProfile = {
      id: generateGuestId(),
      name: 'Guest',
      watchlist: [],
      continueWatching: []
    };
    
    saveGuestProfile(newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error getting guest profile:', error);
    
    // Return a default profile on error
    return {
      id: generateGuestId(),
      name: 'Guest',
      watchlist: [],
      continueWatching: []
    };
  }
}

/**
 * Save guest profile to localStorage
 */
export function saveGuestProfile(profile: GuestProfile): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving guest profile:', error);
  }
}

/**
 * Clear guest profile from localStorage
 */
export function clearGuestProfile(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(GUEST_PROFILE_KEY);
  } catch (error) {
    console.error('Error clearing guest profile:', error);
  }
}

/**
 * Get continue watching items from localStorage
 */
export function getContinueWatchingFromStorage(): any[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const profile = getOrCreateGuestProfile();
    return profile.continueWatching || [];
  } catch (error) {
    console.error('Error getting continue watching items:', error);
    return [];
  }
}

/**
 * Remove an item from continue watching in localStorage
 */
export function removeFromContinueWatchingStorage(id: number, mediaType: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const profile = getOrCreateGuestProfile();
    
    if (profile.continueWatching) {
      profile.continueWatching = profile.continueWatching.filter((item: any) => {
        return !(item.id === id && item.mediaType === mediaType);
      });
      
      saveGuestProfile(profile);
    }
  } catch (error) {
    console.error('Error removing from continue watching:', error);
  }
}

/**
 * Get watchlist items from localStorage
 */
export function getWatchlistFromStorage(): any[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const profile = getOrCreateGuestProfile();
    return profile.watchlist || [];
  } catch (error) {
    console.error('Error getting watchlist items:', error);
    return [];
  }
}

/**
 * Remove an item from watchlist in localStorage
 */
export function removeFromWatchlistStorage(id: number, mediaType: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const profile = getOrCreateGuestProfile();
    
    if (profile.watchlist) {
      profile.watchlist = profile.watchlist.filter((item: any) => {
        return !(item.id === id && item.mediaType === mediaType);
      });
      
      saveGuestProfile(profile);
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
  }
}

/**
 * Get guest data for migration to authenticated user
 */
export function getGuestDataForMigration() {
  if (typeof window === 'undefined') return { watchlist: [], continueWatching: [] };
  
  try {
    const profile = getOrCreateGuestProfile();
    
    // Transform watchlist items to match WatchlistItem type
    const watchlist = (profile.watchlist || []).map((item: any) => ({
      id: item.id,
      mediaType: item.mediaType,
      title: item.title || 'Unknown Title',
      posterPath: item.posterPath || null,
      addedAt: item.timestamp || Date.now()
    }));
    
    // Transform continue watching items to match ContinueWatchingItem type
    const continueWatching = (profile.continueWatching || []).map((item: any) => ({
      id: item.id,
      mediaType: item.mediaType,
      title: item.title || 'Unknown Title',
      posterPath: item.posterPath || null,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      serverId: item.serverId,
      lastWatchedAt: item.timestamp || Date.now()
    }));
    
    return { watchlist, continueWatching };
  } catch (error) {
    console.error('Error getting guest data for migration:', error);
    return { watchlist: [], continueWatching: [] };
  }
}

/**
 * Clear all guest data (watchlist, continue watching, etc.)
 */
export function clearGuestData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const profile = getOrCreateGuestProfile();
    profile.watchlist = [];
    profile.continueWatching = [];
    saveGuestProfile(profile);
  } catch (error) {
    console.error('Error clearing guest data:', error);
  }
}

/**
 * Check if guest has any data that can be migrated
 */
export function hasGuestDataToMigrate(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const { watchlist, continueWatching } = getGuestDataForMigration();
    return (watchlist && watchlist.length > 0) || (continueWatching && continueWatching.length > 0);
  } catch (error) {
    console.error('Error checking guest data for migration:', error);
    return false;
  }
}

/**
 * Get migration statistics
 */
export function getGuestMigrationStats() {
  if (typeof window === 'undefined') return { watchlistCount: 0, continueWatchingCount: 0, totalCount: 0 };
  
  try {
    const { watchlist, continueWatching } = getGuestDataForMigration();
    const watchlistCount = watchlist?.length || 0;
    const continueWatchingCount = continueWatching?.length || 0;
    
    return {
      watchlistCount,
      continueWatchingCount,
      totalCount: watchlistCount + continueWatchingCount
    };
  } catch (error) {
    console.error('Error getting guest migration stats:', error);
    return { watchlistCount: 0, continueWatchingCount: 0, totalCount: 0 };
  }
}