import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../db/schema';
import * as authSchema from '../db/auth-schema';

// This ensures the database client is only created on the server side
const createDb = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Database client cannot be used on the client side');
  }
  
  // Initialize the database client
  const client = createClient({
    url: process.env.DB_URL || `file:${process.env.DB_FILE_NAME}`,
    authToken: process.env.DB_AUTH_TOKEN,
  });

  // Create a drizzle instance with the schema
  return drizzle(client, { schema: { ...schema, ...authSchema } });
};

// Export the database instance with a server-only check
export const db = createDb();

// Helper function to generate a UUID - safe to use on client or server
export function generateId() {
  return crypto.randomUUID();
}