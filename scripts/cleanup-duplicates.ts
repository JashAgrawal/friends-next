import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { watchHistory, legacyContinueWatching } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import * as authSchema from '../db/auth-schema';
import 'dotenv/config';

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate continue watching entries...');
  
  try {
    // Create database client
    const client = createClient({
      url: process.env.DB_URL || `file:${process.env.DB_FILE_NAME}`,
      authToken: process.env.DB_AUTH_TOKEN,
    });

    // Create drizzle instance
    const db = drizzle(client, { schema: { ...schema, ...authSchema } });
    // Clean up modern watch_history table
    console.log('📋 Checking watch_history table...');
    
    // Get all entries grouped by profile_id, media_id, media_type
    const allEntries = await db
      .select()
      .from(watchHistory)
      .orderBy(desc(watchHistory.lastWatchedAt));

    // Group entries by unique key (profile_id + media_id + media_type)
    const groupedEntries = new Map<string, typeof allEntries>();
    
    for (const entry of allEntries) {
      const key = `${entry.profileId}-${entry.mediaId}-${entry.mediaType}`;
      if (!groupedEntries.has(key)) {
        groupedEntries.set(key, []);
      }
      groupedEntries.get(key)!.push(entry);
    }

    let duplicatesRemoved = 0;
    
    // For each group, keep only the most recent entry
    for (const [key, entries] of groupedEntries) {
      if (entries.length > 1) {
        console.log(`🔍 Found ${entries.length} duplicates for ${key}`);
        
        // Sort by lastWatchedAt descending (most recent first)
        entries.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
        
        // Keep the first (most recent) entry, delete the rest
        const toKeep = entries[0];
        const toDelete = entries.slice(1);
        
        console.log(`📌 Keeping entry: ${toKeep.title} (${toKeep.seasonNumber ? `S${toKeep.seasonNumber}E${toKeep.episodeNumber}` : 'Movie'}) - ${new Date(toKeep.lastWatchedAt).toISOString()}`);
        
        for (const entry of toDelete) {
          console.log(`🗑️  Deleting: ${entry.title} (${entry.seasonNumber ? `S${entry.seasonNumber}E${entry.episodeNumber}` : 'Movie'}) - ${new Date(entry.lastWatchedAt).toISOString()}`);
          await db.delete(watchHistory).where(eq(watchHistory.id, entry.id));
          duplicatesRemoved++;
        }
      }
    }

    // Clean up legacy continue_watching table
    console.log('\n📋 Checking legacy continue_watching table...');
    
    const legacyEntries = await db
      .select()
      .from(legacyContinueWatching)
      .orderBy(desc(legacyContinueWatching.lastWatchedAt));

    // Group legacy entries by user_id + media_type + title (since no mediaId)
    const groupedLegacyEntries = new Map<string, typeof legacyEntries>();
    
    for (const entry of legacyEntries) {
      const key = `${entry.userId}-${entry.mediaType}-${entry.title}`;
      if (!groupedLegacyEntries.has(key)) {
        groupedLegacyEntries.set(key, []);
      }
      groupedLegacyEntries.get(key)!.push(entry);
    }

    let legacyDuplicatesRemoved = 0;
    
    // For each group, keep only the most recent entry
    for (const [key, entries] of groupedLegacyEntries) {
      if (entries.length > 1) {
        console.log(`🔍 Found ${entries.length} legacy duplicates for ${key}`);
        
        // Sort by lastWatchedAt descending (most recent first)
        entries.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
        
        // Keep the first (most recent) entry, delete the rest
        const toKeep = entries[0];
        const toDelete = entries.slice(1);
        
        console.log(`📌 Keeping legacy entry: ${toKeep.title} (${toKeep.seasonNumber ? `S${toKeep.seasonNumber}E${toKeep.episodeNumber}` : 'Movie'}) - ${new Date(toKeep.lastWatchedAt * 1000).toISOString()}`);
        
        for (const entry of toDelete) {
          console.log(`🗑️  Deleting legacy: ${entry.title} (${entry.seasonNumber ? `S${entry.seasonNumber}E${entry.episodeNumber}` : 'Movie'}) - ${new Date(entry.lastWatchedAt * 1000).toISOString()}`);
          await db.delete(legacyContinueWatching).where(eq(legacyContinueWatching.id, entry.id));
          legacyDuplicatesRemoved++;
        }
      }
    }

    console.log(`\n✅ Cleanup completed!`);
    console.log(`📊 Removed ${duplicatesRemoved} duplicate entries from watch_history`);
    console.log(`📊 Removed ${legacyDuplicatesRemoved} duplicate entries from legacy continue_watching`);
    
    if (duplicatesRemoved === 0 && legacyDuplicatesRemoved === 0) {
      console.log('🎉 No duplicates found - database is clean!');
    }
    
    // Close the client
    client.close();
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDuplicates();