import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";
import { watchlist, watchHistory, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface GuestWatchlistItem {
  id: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  addedAt: number;
}

interface GuestContinueWatchingItem {
  id: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  serverId?: number | null;
  lastWatchedAt: number;
}

interface GuestData {
  watchlist: GuestWatchlistItem[];
  continueWatching: GuestContinueWatchingItem[];
}

interface MigrationConflicts {
  hasWatchlistConflicts: boolean;
  hasContinueWatchingConflicts: boolean;
  conflictingWatchlistItems: number[];
  conflictingContinueWatchingItems: number[];
}

interface MigrationStats {
  totalWatchlistItems: number;
  totalContinueWatchingItems: number;
  hasDataToMigrate: boolean;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { guestData, checkConflictsOnly = false }: { 
      guestData: GuestData; 
      checkConflictsOnly?: boolean; 
    } = body;

    // Get active profile
    const activeProfile = await db
      .select()
      .from(profiles)
      .where(and(
        eq(profiles.userId, session.user.id),
        eq(profiles.isActive, true)
      ));

    if (activeProfile.length === 0) {
      return NextResponse.json({ 
        error: "No active profile found. Please create a profile first." 
      }, { status: 400 });
    }

    const profileId = activeProfile[0].id;

    // Prepare stats
    const stats: MigrationStats = {
      totalWatchlistItems: guestData.watchlist?.length || 0,
      totalContinueWatchingItems: guestData.continueWatching?.length || 0,
      hasDataToMigrate: (guestData.watchlist?.length || 0) > 0 || (guestData.continueWatching?.length || 0) > 0
    };

    // Check for conflicts
    const conflicts: MigrationConflicts = {
      hasWatchlistConflicts: false,
      hasContinueWatchingConflicts: false,
      conflictingWatchlistItems: [],
      conflictingContinueWatchingItems: []
    };

    // Check watchlist conflicts
    if (guestData.watchlist && guestData.watchlist.length > 0) {
      const existingWatchlistItems = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.profileId, profileId));

      const existingMediaIds = new Set(
        existingWatchlistItems.map(item => `${item.mediaId}-${item.mediaType}`)
      );

      conflicts.conflictingWatchlistItems = guestData.watchlist
        .filter(item => existingMediaIds.has(`${item.id}-${item.mediaType}`))
        .map(item => item.id);

      conflicts.hasWatchlistConflicts = conflicts.conflictingWatchlistItems.length > 0;
    }

    // Check continue watching conflicts
    if (guestData.continueWatching && guestData.continueWatching.length > 0) {
      const existingWatchHistoryItems = await db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.profileId, profileId));

      const existingWatchHistoryKeys = new Set(
        existingWatchHistoryItems.map(item => 
          `${item.mediaId}-${item.mediaType}-${item.seasonNumber || 'null'}-${item.episodeNumber || 'null'}`
        )
      );

      conflicts.conflictingContinueWatchingItems = guestData.continueWatching
        .filter(item => existingWatchHistoryKeys.has(
          `${item.id}-${item.mediaType}-${item.seasonNumber || 'null'}-${item.episodeNumber || 'null'}`
        ))
        .map(item => item.id);

      conflicts.hasContinueWatchingConflicts = conflicts.conflictingContinueWatchingItems.length > 0;
    }

    // If only checking conflicts, return early
    if (checkConflictsOnly) {
      return NextResponse.json({
        success: true,
        stats,
        conflicts,
        message: "Conflict check completed"
      });
    }

    // Perform actual migration
    let migratedWatchlistCount = 0;
    let migratedContinueWatchingCount = 0;
    const errors: string[] = [];

    // Migrate watchlist items
    if (guestData.watchlist && guestData.watchlist.length > 0) {
      for (const item of guestData.watchlist) {
        try {
          // Skip if item already exists (conflict)
          if (conflicts.conflictingWatchlistItems.includes(item.id)) {
            continue;
          }

          const watchlistId = generateId();
          await db.insert(watchlist).values({
            id: watchlistId,
            profileId,
            mediaId: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterPath,
            addedAt: new Date(item.addedAt)
          });

          migratedWatchlistCount++;
        } catch (error) {
          console.error(`Failed to migrate watchlist item ${item.id}:`, error);
          errors.push(`Failed to migrate watchlist item: ${item.title}`);
        }
      }
    }

    // Migrate continue watching items
    if (guestData.continueWatching && guestData.continueWatching.length > 0) {
      for (const item of guestData.continueWatching) {
        try {
          // Skip if item already exists (conflict)
          if (conflicts.conflictingContinueWatchingItems.includes(item.id)) {
            continue;
          }

          const watchHistoryId = generateId();
          await db.insert(watchHistory).values({
            id: watchHistoryId,
            profileId,
            mediaId: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterPath,
            seasonNumber: item.seasonNumber,
            episodeNumber: item.episodeNumber,
            serverId: item.serverId,
            lastWatchedAt: new Date(item.lastWatchedAt)
          });

          migratedContinueWatchingCount++;
        } catch (error) {
          console.error(`Failed to migrate continue watching item ${item.id}:`, error);
          errors.push(`Failed to migrate continue watching item: ${item.title}`);
        }
      }
    }

    const totalMigrated = migratedWatchlistCount + migratedContinueWatchingCount;
    const success = errors.length === 0 || totalMigrated > 0;

    return NextResponse.json({
      success,
      message: success 
        ? `Successfully migrated ${totalMigrated} items`
        : "Migration failed",
      stats,
      conflicts,
      migratedWatchlistCount,
      migratedContinueWatchingCount,
      profileId,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error during migration",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}