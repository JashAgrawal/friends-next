// Create a test profile for the existing user
const sqlite3 = require('better-sqlite3');
const { randomUUID } = require('crypto');
const db = sqlite3('local.db');

// Get the first user
const users = db.prepare('SELECT * FROM user LIMIT 1').all();
if (users.length === 0) {
  console.log('No users found.');
  process.exit(1);
}

const user = users[0];
console.log('Found user:', user.name, user.email);

// Check if profile already exists
const existingProfiles = db.prepare('SELECT * FROM profiles WHERE user_id = ?').all(user.id);
if (existingProfiles.length > 0) {
  console.log('Profile already exists:', existingProfiles[0]);
  
  // Make sure it's active
  db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(existingProfiles[0].id);
  console.log('Profile set as active');
  
  process.exit(0);
}

// Create a new profile
const profileId = randomUUID();
const now = new Date();

const insertStmt = db.prepare(`
  INSERT INTO profiles (id, user_id, name, avatar, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

try {
  insertStmt.run(
    profileId,
    user.id,
    user.name || 'Default Profile',
    user.image,
    1, // is_active
    now.getTime(),
    now.getTime()
  );
  
  console.log('Profile created successfully!');
  console.log('Profile ID:', profileId);
  
} catch (error) {
  console.error('Error creating profile:', error);
}

db.close();