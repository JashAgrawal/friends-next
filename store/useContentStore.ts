import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  id: number;
  mediaType: string; // "movie" or "tv"
  title: string;
  posterPath: string | null;
  addedAt: number; // timestamp
}

export interface ContinueWatchingItem {
  id: number;
  mediaType: string; // "movie" or "tv"
  title: string;
  posterPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  serverId?: number;
  lastWatchedAt: number; // timestamp
  isLegacy?: boolean; // Flag for legacy items without proper TMDB mediaId
}

interface ContentState {
  watchlist: WatchlistItem[];
  continueWatching: ContinueWatchingItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (id: number, mediaType: string) => void;
  updateContinueWatching: (item: ContinueWatchingItem) => void;
  removeFromContinueWatching: (id: number, mediaType: string) => void;
  clearWatchlist: () => void;
  clearContinueWatching: () => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      watchlist: [],
      continueWatching: [],
      
      addToWatchlist: (item) => set((state) => {
        // Check if item already exists in watchlist
        const exists = state.watchlist.some(
          (i) => i.id === item.id && i.mediaType === item.mediaType
        );
        
        if (exists) {
          return state; // Don't add duplicates
        }
        
        return {
          watchlist: [...state.watchlist, item],
        };
      }),
      
      removeFromWatchlist: (id, mediaType) => set((state) => ({
        watchlist: state.watchlist.filter(
          (item) => !(item.id === id && item.mediaType === mediaType)
        ),
      })),
      
      updateContinueWatching: (item) => set((state) => {
        // Remove existing item if it exists
        const filteredItems = state.continueWatching.filter(
          (i) => !(i.id === item.id && i.mediaType === item.mediaType)
        );
        
        // Add the updated item
        return {
          continueWatching: [item, ...filteredItems].slice(0, 20), // Limit to 20 items
        };
      }),
      
      removeFromContinueWatching: (id, mediaType) => set((state) => ({
        continueWatching: state.continueWatching.filter(
          (item) => !(item.id === id && item.mediaType === mediaType)
        ),
      })),
      
      clearWatchlist: () => set({ watchlist: [] }),
      
      clearContinueWatching: () => set({ continueWatching: [] }),
    }),
    {
      name: 'content-storage',
    }
  )
);