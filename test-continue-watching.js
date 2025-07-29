// Simple test to add a continue watching item with proper mediaId
const sqlite3 = require('better-sqlite3');
const db = sqlite3('local.db');

// First, let's check if we have any profiles
const profiles = db.prepare('SELECT * FROM profiles').all();
console.log('Profiles:', profiles);

if (profiles.length === 0) {
  console.log('No profiles found. You need to create a profile first.');
  process.exit(1);
}

const profileId = profiles[0].id;

// Add a test continue watching item with proper TMDB mediaId
const insertStmt = db.prepare(`
  INSERT INTO watch_history (id, profile_id, media_id, media_type, title, poster_path, last_watched_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const testItem = {
  id: crypto.randomUUID(),
  profileId: profileId,
  mediaId: 550, // Fight Club TMDB ID
  mediaType: 'movie',
  title: 'Fight Club',
  posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  lastWatchedAt: new Date().getTime()
};

try {
  insertStmt.run(
    testItem.id,
    testItem.profileId,
    testItem.mediaId,
    testItem.mediaType,
    testItem.title,
    testItem.posterPath,
    testItem.lastWatchedAt
  );
  
  console.log('Test continue watching item added successfully!');
  console.log('Item details:', testItem);
  
  // Verify it was added
  const items = db.prepare('SELECT * FROM watch_history WHERE profile_id = ?').all(profileId);
  console.log('All continue watching items:', items);
  
} catch (error) {
  console.error('Error adding test item:', error);
}

db.close();