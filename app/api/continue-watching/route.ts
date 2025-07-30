import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";
import { legacyContinueWatching, profiles, watchHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get active profile
  const activeProfile = await db
    .select()
    .from(profiles)
    .where(
      and(eq(profiles.userId, session.user.id), eq(profiles.isActive, true))
    );

  if (activeProfile.length === 0) {
    // Fallback to legacy table if no active profile
    const legacyItems = await db
      .select()
      .from(legacyContinueWatching)
      .where(eq(legacyContinueWatching.userId, session.user.id))
      .orderBy(desc(legacyContinueWatching.lastWatchedAt));

    // Note: Legacy items don't have mediaId, so navigation might not work correctly
    // Users should re-add items to continue watching to get proper TMDB mediaId
    return NextResponse.json(legacyItems.map(item => ({
      ...item,
      // Add a flag to indicate this is legacy data
      isLegacy: true,
      lastWatchedAt: new Date(item.lastWatchedAt * 1000).getTime(),
    })));
  }

  const profileId = activeProfile[0].id;

  // Get all items from watch history (no progress filtering)
  const items = await db
    .select()
    .from(watchHistory)
    .where(eq(watchHistory.profileId, profileId))
    .orderBy(desc(watchHistory.lastWatchedAt));

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      lastWatchedAt: new Date(item.lastWatchedAt).getTime(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    mediaId,
    mediaType,
    title,
    posterPath,
    seasonNumber,
    episodeNumber,
    serverId,
  } = body;

  // Get active profile
  const activeProfile = await db
    .select()
    .from(profiles)
    .where(
      and(eq(profiles.userId, session.user.id), eq(profiles.isActive, true))
    );

  if (activeProfile.length === 0) {
    // Fallback to legacy table if no active profile
    // For legacy table, we need to use title matching since there's no mediaId
    // For TV shows, we'll check for same title and media type (not specific episode)
    const conditions = [
      eq(legacyContinueWatching.userId, session.user.id),
      eq(legacyContinueWatching.mediaType, mediaType),
      eq(legacyContinueWatching.title, title),
    ];

    const existingLegacyItems = await db
      .select()
      .from(legacyContinueWatching)
      .where(and(...conditions));

    const timestamp = Math.floor(Date.now() / 1000);

    if (existingLegacyItems.length > 0) {
      // Update existing entry with new episode/season info
      const existingItem = existingLegacyItems[0];
      
      const updatedLegacyData = {
        posterPath: posterPath || existingItem.posterPath,
        seasonNumber: seasonNumber || existingItem.seasonNumber,
        episodeNumber: episodeNumber || existingItem.episodeNumber,
        serverId: serverId || existingItem.serverId,
        lastWatchedAt: timestamp,
      };

      await db
        .update(legacyContinueWatching)
        .set(updatedLegacyData)
        .where(eq(legacyContinueWatching.id, existingItem.id));

      return NextResponse.json({
        ...existingItem,
        ...updatedLegacyData,
        lastWatchedAt: new Date(timestamp * 1000).getTime(),
      });
    } else {
      // Insert new entry (for movies, always create new; for TV shows, create if different episode)
      const [item] = await db
        .insert(legacyContinueWatching)
        .values({
          userId: session.user.id,
          mediaType,
          title,
          posterPath: posterPath || null,
          lastWatchedAt: timestamp,
          progress: 0, // Keep for legacy compatibility
          seasonNumber: seasonNumber || null,
          episodeNumber: episodeNumber || null,
          serverId: serverId || null,
        })
        .returning();

      // Keep only the last 15 items per user to prevent unlimited growth
      const allLegacyItems = await db
        .select()
        .from(legacyContinueWatching)
        .where(eq(legacyContinueWatching.userId, session.user.id))
        .orderBy(desc(legacyContinueWatching.lastWatchedAt));

      if (allLegacyItems.length > 15) {
        const itemsToDelete = allLegacyItems.slice(15);
        for (const legacyItem of itemsToDelete) {
          await db.delete(legacyContinueWatching).where(eq(legacyContinueWatching.id, legacyItem.id));
        }
      }

      return NextResponse.json({
        ...item,
        lastWatchedAt: new Date(timestamp * 1000).getTime(),
      });
    }
  }

  const profileId = activeProfile[0].id;
  const timestamp = Math.floor(Date.now() / 1000);

  // Check if an entry already exists for this media
  const conditions = [
    eq(watchHistory.profileId, profileId),
    eq(watchHistory.mediaId, mediaId || 0),
    eq(watchHistory.mediaType, mediaType),
  ];

  const existingItems = await db
    .select()
    .from(watchHistory)
    .where(and(...conditions));

  if (existingItems.length > 0) {
    // Update existing entry with new episode/season info and server
    const existingItem = existingItems[0];

    const updatedData = {
      title, // Update title in case it changed
      posterPath: posterPath || existingItem.posterPath,
      seasonNumber: seasonNumber || existingItem.seasonNumber,
      episodeNumber: episodeNumber || existingItem.episodeNumber,
      serverId: serverId || existingItem.serverId,
      lastWatchedAt: new Date(timestamp * 1000),
    };

    await db
      .update(watchHistory)
      .set(updatedData)
      .where(eq(watchHistory.id, existingItem.id));

    return NextResponse.json({
      ...existingItem,
      ...updatedData,
      lastWatchedAt: new Date(timestamp * 1000).getTime(),
    });
  } else {
    // Create new entry (for movies, always create new; for TV shows, create if different episode)
    const id = generateId();

    const newItem = {
      id,
      profileId,
      mediaId: mediaId || 0,
      mediaType,
      title,
      posterPath: posterPath || null,
      seasonNumber: seasonNumber || null,
      episodeNumber: episodeNumber || null,
      serverId: serverId || null,
      lastWatchedAt: new Date(timestamp * 1000),
    };

    await db.insert(watchHistory).values(newItem);

    // Keep only the last 15 items per profile to prevent unlimited growth
    const allItems = await db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.profileId, profileId))
      .orderBy(desc(watchHistory.lastWatchedAt));

    if (allItems.length > 15) {
      const itemsToDelete = allItems.slice(15);
      for (const item of itemsToDelete) {
        await db.delete(watchHistory).where(eq(watchHistory.id, item.id));
      }
    }

    return NextResponse.json({
      ...newItem,
      lastWatchedAt: new Date(timestamp * 1000).getTime(),
    });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, mediaId, mediaType, seasonNumber, episodeNumber } = body;

  if (id) {
    // Delete by ID
    await db.delete(watchHistory).where(eq(watchHistory.id, id));

    // Also try to delete from legacy schema (if it's a numeric ID)
    if (!isNaN(Number(id))) {
      await db
        .delete(legacyContinueWatching)
        .where(eq(legacyContinueWatching.id, Number(id)));
    }
  } else if (mediaId && mediaType) {
    // Delete by media details
    // Get active profile
    const activeProfile = await db
      .select()
      .from(profiles)
      .where(
        and(eq(profiles.userId, session.user.id), eq(profiles.isActive, true))
      );

    if (activeProfile.length > 0) {
      const profileId = activeProfile[0].id;

      // Delete by mediaId and mediaType only (remove all entries for this media)
      const conditions = [
        eq(watchHistory.profileId, profileId),
        eq(watchHistory.mediaId, mediaId),
        eq(watchHistory.mediaType, mediaType),
      ];

      await db.delete(watchHistory).where(and(...conditions));
    } else {
      // Fallback to legacy table - delete by mediaType only since legacy doesn't have mediaId
      // We'll need to use title matching for legacy entries
      const conditions = [
        eq(legacyContinueWatching.userId, session.user.id),
        eq(legacyContinueWatching.mediaType, mediaType),
      ];

      await db.delete(legacyContinueWatching).where(and(...conditions));
    }
  }

  return NextResponse.json({ success: true });
}
