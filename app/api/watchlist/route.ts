import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";
import { watchlist, legacyWatchlist, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Get active profile
  const activeProfile = await db
    .select()
    .from(profiles)
    .where(and(
      eq(profiles.userId, session.user.id),
      eq(profiles.isActive, true)
    ));
  
  if (activeProfile.length === 0) {
    // Fallback to legacy table if no active profile
    const legacyItems = await db
      .select()
      .from(legacyWatchlist)
      .where(eq(legacyWatchlist.userId, session.user.id));
    
    return NextResponse.json(legacyItems);
  }
  
  const profileId = activeProfile[0].id;
  
  // Get items from new schema
  const items = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.profileId, profileId));
  
  return NextResponse.json(items.map(item => ({
    ...item,
    addedAt: new Date(item.addedAt).getTime()
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  const { mediaId, mediaType, title, posterPath } = body;
  const addedAt = Math.floor(Date.now() / 1000);
  
  // Get active profile
  const activeProfile = await db
    .select()
    .from(profiles)
    .where(and(
      eq(profiles.userId, session.user.id),
      eq(profiles.isActive, true)
    ));
  
  if (activeProfile.length === 0) {
    // Fallback to legacy table if no active profile
    const [item] = await db
      .insert(legacyWatchlist)
      .values({
        userId: session.user.id,
        mediaType,
        title,
        posterPath,
        addedAt,
      })
      .returning();
    
    return NextResponse.json(item);
  }
  
  const profileId = activeProfile[0].id;
  const id = generateId();
  
  const newItem = {
    id,
    profileId,
    mediaId: mediaId || 0,
    mediaType,
    title,
    posterPath: posterPath || null,
    addedAt,
  };
  
  await db
    .insert(watchlist)
    .values({
      id: newItem.id,
      profileId: newItem.profileId,
      mediaId: newItem.mediaId,
      mediaType: newItem.mediaType,
      title: newItem.title,
      posterPath: newItem.posterPath,
      addedAt: new Date(addedAt * 1000)
    });
  
  return NextResponse.json({
    ...newItem,
    addedAt: new Date(addedAt * 1000).getTime()
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await req.json();
  
  // Try to delete from new schema first
  await db
    .delete(watchlist)
    .where(eq(watchlist.id, id));
  
  // Also try to delete from legacy schema (if it's a numeric ID)
  if (!isNaN(Number(id))) {
    await db
      .delete(legacyWatchlist)
      .where(eq(legacyWatchlist.id, Number(id)));
  }
  
  return NextResponse.json({ success: true });
} 