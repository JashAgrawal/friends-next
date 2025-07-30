import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import 'dotenv/config';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create database client
    const client = createClient({
      url: process.env.DB_URL || `file:${process.env.DB_FILE_NAME}`,
      authToken: process.env.DB_AUTH_TOKEN,
    });

    // Create drizzle instance
    const db = drizzle(client);

    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migrations completed successfully!');
    
    // Close the client
    client.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();