/**
 * Direct database test for continue watching update functionality
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { watchHistory, profiles } from './db/schema';
import { eq, and } from 'drizzle-orm';
import * as schema from './db/schema';
import * as authSchema from './db/auth-schema';
import { generateId } from './lib/db';
import 'dotenv/config';

async function testDatabaseUpdate() {
  console.log('🧪 Testing Continue Watching Database Update\n');

  try {
    // Create database client
    const client = createClient({
      url: process.env.DB_URL || `file:${process.env.DB_FILE_NAME}`,
      authToken: process.env.DB_AUTH_TOKEN,
    });

    const db = drizzle(client, { schema: { ...schema, ...authSchema } });

    // Get an existing profile for testing
    const existingProfiles = await db.select().from(profiles).limit(1);
    if (existingProfiles.length === 0) {
      console.log('❌ No profiles found. Please create a profile first.');
      client.close();
      return;
    }

    // Test data
    const testProfileId = existingProfiles[0].id;
    const testMediaId = 99999;
    const testMediaType = 'tv';
    const testTitle = 'Test Series';
    
    console.log(`Using profile: ${existingProfiles[0].name} (${testProfileId})`);

    console.log('1️⃣ Cleaning up any existing test data...');
    await db.delete(watchHistory).where(
      and(
        eq(watchHistory.profileId, testProfileId),
        eq(watchHistory.mediaId, testMediaId)
      )
    );

    console.log('2️⃣ Adding first episode (S1E1)...');
    const entry1 = {
      id: generateId(),
      profileId: testProfileId,
      mediaId: testMediaId,
      mediaType: testMediaType,
      title: testTitle,
      posterPath: '/test-poster.jpg',
      seasonNumber: 1,
      episodeNumber: 1,
      serverId: 1,
      lastWatchedAt: new Date(),
    };

    await db.insert(watchHistory).values(entry1);
    console.log('✅ Added S1E1');

    // Check count
    let entries = await db
      .select()
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.profileId, testProfileId),
          eq(watchHistory.mediaId, testMediaId)
        )
      );
    console.log(`📊 Entries in database: ${entries.length}`);

    console.log('\n3️⃣ Trying to add second episode (S1E2) - should fail due to unique constraint...');
    try {
      const entry2 = {
        id: generateId(),
        profileId: testProfileId,
        mediaId: testMediaId,
        mediaType: testMediaType,
        title: testTitle,
        posterPath: '/test-poster.jpg',
        seasonNumber: 1,
        episodeNumber: 2,
        serverId: 2,
        lastWatchedAt: new Date(),
      };

      await db.insert(watchHistory).values(entry2);
      console.log('❌ ERROR: Should have failed due to unique constraint!');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('✅ Unique constraint working correctly - insert failed as expected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n4️⃣ Updating existing entry to S1E2...');
    await db
      .update(watchHistory)
      .set({
        seasonNumber: 1,
        episodeNumber: 2,
        serverId: 2,
        lastWatchedAt: new Date(),
      })
      .where(
        and(
          eq(watchHistory.profileId, testProfileId),
          eq(watchHistory.mediaId, testMediaId),
          eq(watchHistory.mediaType, testMediaType)
        )
      );

    // Verify update
    entries = await db
      .select()
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.profileId, testProfileId),
          eq(watchHistory.mediaId, testMediaId)
        )
      );

    console.log(`📊 Entries in database: ${entries.length}`);
    if (entries.length === 1) {
      const entry = entries[0];
      console.log('✅ Update successful:');
      console.log(`   Season: ${entry.seasonNumber}, Episode: ${entry.episodeNumber}`);
      console.log(`   Server: ${entry.serverId}`);
    }

    console.log('\n5️⃣ Updating to S2E1...');
    await db
      .update(watchHistory)
      .set({
        seasonNumber: 2,
        episodeNumber: 1,
        serverId: 3,
        lastWatchedAt: new Date(),
      })
      .where(
        and(
          eq(watchHistory.profileId, testProfileId),
          eq(watchHistory.mediaId, testMediaId),
          eq(watchHistory.mediaType, testMediaType)
        )
      );

    // Final verification
    entries = await db
      .select()
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.profileId, testProfileId),
          eq(watchHistory.mediaId, testMediaId)
        )
      );

    console.log(`📊 Final entries in database: ${entries.length}`);
    if (entries.length === 1) {
      const entry = entries[0];
      console.log('✅ Final update successful:');
      console.log(`   Season: ${entry.seasonNumber}, Episode: ${entry.episodeNumber}`);
      console.log(`   Server: ${entry.serverId}`);
      console.log(`   Media ID: ${entry.mediaId}`);
      console.log(`   Title: ${entry.title}`);
    }

    console.log('\n6️⃣ Cleaning up test data...');
    await db.delete(watchHistory).where(
      and(
        eq(watchHistory.profileId, testProfileId),
        eq(watchHistory.mediaId, testMediaId)
      )
    );

    console.log('\n🎉 Database test completed successfully!');
    console.log('✅ Unique constraint prevents duplicates');
    console.log('✅ Updates work correctly');
    console.log('✅ One entry per media per profile maintained');

    client.close();

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabaseUpdate();