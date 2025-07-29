"use server"
import { db, generateId } from './db';
import { watchlist, watchHistory } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface WatchlistItem {
id: string;
  profileId: string;
  mediaId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  addedAt: Date;
}

export interface WatchHistoryItem {
  id: string;
  profileId: string;
  mediaId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  serverId: number | null;
  lastWatchedAt: Date;
}

// Watchlist functions
export async function getWatchlist(profileId: string): Promise<WatchlistItem[]> {
  const results = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.profileId, profileId))
    .orderBy(desc(watchlist.addedAt));
    
  return results.map(item => ({
    ...item,
    addedAt: new Date(item.addedAt)
  }));
}

export async function addToWatchlist(
  profileId: string,
  mediaId: number,
  mediaType: string,
  title: string,
  posterPath?: string
): Promise<WatchlistItem> {
  // Check if item already exists in watchlist
  const existing = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.profileId, profileId),
        eq(watchlist.mediaId, mediaId),
        eq(watchlist.mediaType, mediaType)
      )
    );

  if (existing.length > 0) {
    return {
      ...existing[0],
      addedAt: new Date(existing[0].addedAt)
    };
  }

  const id = generateId();
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);
  
  const newItem = {
    id,
    profileId,
    mediaId,
    mediaType,
    title,
    posterPath: posterPath || null,
    addedAt: new Date(timestamp * 1000),
  };
  
  await db.insert(watchlist).values({
    id: newItem.id,
    profileId: newItem.profileId,
    mediaId: newItem.mediaId,
    mediaType: newItem.mediaType,
    title: newItem.title,
    posterPath: newItem.posterPath,
    addedAt: new Date(timestamp * 1000),
  });
  
  return {
    ...newItem,
    addedAt: now
  };
}

export async function removeFromWatchlist(profileId: string, mediaId: number, mediaType: string): Promise<void> {
  await db
    .delete(watchlist)
    .where(
      and(
        eq(watchlist.profileId, profileId),
        eq(watchlist.mediaId, mediaId),
        eq(watchlist.mediaType, mediaType)
      )
    );
}

export async function isInWatchlist(profileId: string, mediaId: number, mediaType: string): Promise<boolean> {
  const result = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.profileId, profileId),
        eq(watchlist.mediaId, mediaId),
        eq(watchlist.mediaType, mediaType)
      )
    );
  
  return result.length > 0;
}

// Watch History functions
export async function getContinueWatching(profileId: string): Promise<WatchHistoryItem[]> {
  const results = await db
    .select()
    .from(watchHistory)
    .where(eq(watchHistory.profileId, profileId))
    .orderBy(desc(watchHistory.lastWatchedAt));
    
  return results.map(item => ({
    ...item,
    lastWatchedAt: new Date(item.lastWatchedAt)
  }));
}

export async function addToWatchHistory(
  profileId: string,
  mediaId: number,
  mediaType: string,
  title: string,
  posterPath?: string,
  seasonNumber?: number,
  episodeNumber?: number,
  serverId?: number
): Promise<WatchHistoryItem> {
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);
  
  // Check if item already exists in watch history
  const existing = await db
    .select()
    .from(watchHistory)
    .where(
      and(
        eq(watchHistory.profileId, profileId),
        eq(watchHistory.mediaId, mediaId),
        eq(watchHistory.mediaType, mediaType),
        seasonNumber !== undefined ? eq(watchHistory.seasonNumber, seasonNumber) : undefined,
        episodeNumber !== undefined ? eq(watchHistory.episodeNumber, episodeNumber) : undefined
      )
    );

  if (existing.length > 0) {
    const updatedItem = {
      lastWatchedAt: new Date(timestamp * 1000),
      serverId: serverId !== undefined ? serverId : existing[0].serverId,
    };
    
    await db
      .update(watchHistory)
      .set({
        lastWatchedAt: new Date(timestamp * 1000),
        serverId: updatedItem.serverId
      })
      .where(eq(watchHistory.id, existing[0].id));
    
    return {
      ...existing[0],
      ...updatedItem,
      lastWatchedAt: now
    };
  }

  const id = generateId();
  
  const newItem = {
    id,
    profileId,
    mediaId,
    mediaType,
    title,
    posterPath: posterPath || null,
    seasonNumber: seasonNumber || null,
    episodeNumber: episodeNumber || null,
    serverId: serverId || null,
    lastWatchedAt: new Date(timestamp * 1000),
  };
  
  await db.insert(watchHistory).values({
    id: newItem.id,
    profileId: newItem.profileId,
    mediaId: newItem.mediaId,
    mediaType: newItem.mediaType,
    title: newItem.title,
    posterPath: newItem.posterPath,
    seasonNumber: newItem.seasonNumber,
    episodeNumber: newItem.episodeNumber,
    serverId: newItem.serverId,
    lastWatchedAt: new Date(timestamp * 1000),
  });
  
  return {
    ...newItem,
    lastWatchedAt: now
  };
}

export async function removeFromWatchHistory(
  profileId: string, 
  mediaId: number, 
  mediaType: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<void> {
  await db
    .delete(watchHistory)
    .where(
      and(
        eq(watchHistory.profileId, profileId),
        eq(watchHistory.mediaId, mediaId),
        eq(watchHistory.mediaType, mediaType),
        seasonNumber !== undefined ? eq(watchHistory.seasonNumber, seasonNumber) : undefined,
        episodeNumber !== undefined ? eq(watchHistory.episodeNumber, episodeNumber) : undefined
      )
    );
}

export async function getWatchHistoryItem(
  profileId: string,
  mediaId: number,
  mediaType: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<WatchHistoryItem | null> {
  const result = await db
    .select()
    .from(watchHistory)
    .where(
      and(
        eq(watchHistory.profileId, profileId),
        eq(watchHistory.mediaId, mediaId),
        eq(watchHistory.mediaType, mediaType),
        seasonNumber !== undefined ? eq(watchHistory.seasonNumber, seasonNumber) : undefined,
        episodeNumber !== undefined ? eq(watchHistory.episodeNumber, episodeNumber) : undefined
      )
    );
  
  if (result.length === 0) return null;
  
  return {
    ...result[0],
    lastWatchedAt: new Date(result[0].lastWatchedAt)
  };
}