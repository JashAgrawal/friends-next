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
    // Create a default profile for the user if none exists
    const defaultProfileId = generateId();
    const now = new Date();
    
    await db.insert(profiles).values({
      id: defaultProfileId,
      userId: session.user.id,
      name: session.user.name || 'Default Profile',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Use the newly created profile
    const profileId = defaultProfileId;

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

  // Validate that we have a proper mediaId for new watch history entries
  if (!mediaId || mediaId === 0) {
    return NextResponse.json(
      { error: "mediaId is required and must be a valid TMDB ID" },
      { status: 400 }
    );
  }

  // Get active profile
  let activeProfile = await db
    .select()
    .from(profiles)
    .where(
      and(eq(profiles.userId, session.user.id), eq(profiles.isActive, true))
    );

  // Create a default profile if none exists
  if (activeProfile.length === 0) {
    const defaultProfileId = generateId();
    const now = new Date();
    
    await db.insert(profiles).values({
      id: defaultProfileId,
      userId: session.user.id,
      name: session.user.name || 'Default Profile',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Update activeProfile to include the newly created profile
    activeProfile = [{
      id: defaultProfileId,
      userId: session.user.id,
      name: session.user.name || 'Default Profile',
      avatar: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }];
  }

  const profileId = activeProfile[0].id;
  const timestamp = Math.floor(Date.now() / 1000);

  // Check if an entry already exists for this media
  const conditions = [
    eq(watchHistory.profileId, profileId),
    eq(watchHistory.mediaId, mediaId),
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
      mediaId,
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
    let activeProfile = await db
      .select()
      .from(profiles)
      .where(
        and(eq(profiles.userId, session.user.id), eq(profiles.isActive, true))
      );

    // Create a default profile if none exists
    if (activeProfile.length === 0) {
      const defaultProfileId = generateId();
      const now = new Date();
      
      await db.insert(profiles).values({
        id: defaultProfileId,
        userId: session.user.id,
        name: session.user.name || 'Default Profile',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // Update activeProfile to include the newly created profile
      activeProfile = [{
        id: defaultProfileId,
        userId: session.user.id,
        name: session.user.name || 'Default Profile',
        avatar: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }];
    }

    const profileId = activeProfile[0].id;

    // Delete by mediaId and mediaType only (remove all entries for this media)
    const conditions = [
      eq(watchHistory.profileId, profileId),
      eq(watchHistory.mediaId, mediaId),
      eq(watchHistory.mediaType, mediaType),
    ];

    await db.delete(watchHistory).where(and(...conditions));
  }

  return NextResponse.json({ success: true });
}
