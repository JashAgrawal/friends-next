"use client";

import { getOrCreateGuestProfile, saveGuestProfile } from "./localStorage-utils";

export interface GuestWatchHistoryItem {
  id: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  serverId?: number | null;
  timestamp: number;
}

/**
 * Get watch history for guest users
 */
export function getGuestWatchHistory(): GuestWatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const profile = getOrCreateGuestProfile();
    if (!profile.continueWatching) return [];
    
    // Ensure all items have the required properties for GuestWatchHistoryItem
    return profile.continueWatching.map(item => ({
      id: item.id,
      mediaType: item.mediaType,
      title: item.title || 'Unknown',
      posterPath: item.posterPath || null,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      serverId: item.serverId,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Error getting guest watch history:', error);
    return [];
  }
}

/**
 * Add to watch history for guest users
 */
export function addToGuestWatchHistory(
  mediaId: number,
  mediaType: string,
  title: string,
  posterPath?: string | null,
  seasonNumber?: number | null,
  episodeNumber?: number | null,
  serverId?: number | null
): GuestWatchHistoryItem {
  if (typeof window === 'undefined') {
    return {
      id: mediaId,
      mediaType,
      title,
      posterPath: posterPath || null,
      seasonNumber,
      episodeNumber,
      serverId,
      timestamp: Date.now()
    };
  }
  
  try {
    const profile = getOrCreateGuestProfile();
    
    if (!profile.continueWatching) {
      profile.continueWatching = [];
    }
    
    // Find existing item
    const itemIndex = profile.continueWatching.findIndex(
      (item: any) => 
        item.id === mediaId && 
        item.mediaType === mediaType &&
        (mediaType !== "tv" || 
          (item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber))
    );
    
    const timestamp = Date.now();
    
    if (itemIndex !== -1) {
      // Update existing item
      profile.continueWatching[itemIndex] = {
        ...profile.continueWatching[itemIndex],
        timestamp,
        serverId: serverId !== undefined ? serverId : profile.continueWatching[itemIndex].serverId
      };
      
      // Move to the top of the list
      const item = profile.continueWatching.splice(itemIndex, 1)[0];
      profile.continueWatching.unshift(item);
    } else {
      // Add new item
      const newItem: GuestWatchHistoryItem = {
        id: mediaId,
        mediaType,
        title,
        posterPath: posterPath || null,
        seasonNumber,
        episodeNumber,
        serverId,
        timestamp
      };
      
      profile.continueWatching.unshift(newItem);
      
      // Keep only the last 15 items
      if (profile.continueWatching.length > 15) {
        profile.continueWatching = profile.continueWatching.slice(0, 15);
      }
    }
    
    saveGuestProfile(profile);
    
    // Dispatch custom event to notify components of the update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('guestWatchHistoryUpdated'));
    }
    
    // Ensure the returned item has all required properties
    const item = profile.continueWatching[0];
    return {
      id: item.id,
      mediaType: item.mediaType,
      title: item.title || 'Unknown',
      posterPath: item.posterPath || null,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      serverId: item.serverId,
      timestamp: item.timestamp
    };
  } catch (error) {
    console.error('Error updating guest watch progress:', error);
    
    return {
      id: mediaId,
      mediaType,
      title,
      posterPath: posterPath || null,
      seasonNumber,
      episodeNumber,
      serverId,
      timestamp: Date.now()
    };
  }
}

/**
 * Get watch history item for a specific item
 */
export function getGuestWatchHistoryItem(
  mediaId: number,
  mediaType: string,
  seasonNumber?: number | null,
  episodeNumber?: number | null
): GuestWatchHistoryItem | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const profile = getOrCreateGuestProfile();
    
    if (!profile.continueWatching) {
      return null;
    }
    
    const item = profile.continueWatching.find(
      (item: any) => 
        item.id === mediaId && 
        item.mediaType === mediaType &&
        (mediaType !== "tv" || 
          (item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber))
    );
    
    if (!item) return null;
    
    // Ensure the returned item has all required properties
    return {
      id: item.id,
      mediaType: item.mediaType,
      title: item.title || 'Unknown',
      posterPath: item.posterPath || null,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      serverId: item.serverId,
      timestamp: item.timestamp
    };
  } catch (error) {
    console.error('Error getting guest watch history item:', error);
    return null;
  }
}

/**
 * Remove an item from watch history
 */
export function removeFromGuestWatchHistory(
  mediaId: number,
  mediaType: string,
  seasonNumber?: number | null,
  episodeNumber?: number | null
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const profile = getOrCreateGuestProfile();
    
    if (!profile.continueWatching) {
      return;
    }
    
    profile.continueWatching = profile.continueWatching.filter(
      (item: any) => 
        !(item.id === mediaId && 
          item.mediaType === mediaType &&
          (mediaType !== "tv" || 
            (item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber)))
    );
    
    saveGuestProfile(profile);
    
    // Dispatch custom event to notify components of the update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('guestWatchHistoryUpdated'));
    }
  } catch (error) {
    console.error('Error removing from guest watch history:', error);
  }
}

/**
 * Update server preference for an item
 */
export function updateGuestServerPreference(
  mediaId: number,
  mediaType: string,
  serverId: number,
  seasonNumber?: number | null,
  episodeNumber?: number | null
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const profile = getOrCreateGuestProfile();
    
    if (!profile.continueWatching) {
      return;
    }
    
    const itemIndex = profile.continueWatching.findIndex(
      (item: any) => 
        item.id === mediaId && 
        item.mediaType === mediaType &&
        (mediaType !== "tv" || 
          (item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber))
    );
    
    if (itemIndex !== -1) {
      profile.continueWatching[itemIndex].serverId = serverId;
      profile.continueWatching[itemIndex].timestamp = Date.now();
      saveGuestProfile(profile);
      
      // Dispatch custom event to notify components of the update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('guestWatchHistoryUpdated'));
      }
    }
  } catch (error) {
    console.error('Error updating guest server preference:', error);
  }
}

