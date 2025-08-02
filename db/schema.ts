import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

// Import user table from auth-schema for FK reference
import { user } from "./auth-schema";

// Profiles table (for multi-profile support)
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatar: text("avatar"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Watchlist table
export const watchlist = sqliteTable("watchlist", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  mediaId: integer("media_id").notNull(),
  mediaType: text("media_type").notNull(), // "movie" or "tv"
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
});

// Watch History table (previously Continue Watching)
export const watchHistory = sqliteTable("watch_history", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  mediaId: integer("media_id").notNull(),
  mediaType: text("media_type").notNull(), // "movie" or "tv"
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  seasonNumber: integer("season_number"),
  episodeNumber: integer("episode_number"),
  serverId: integer("server_id"),
  lastWatchedAt: integer("last_watched_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  // Unique constraint to ensure one entry per media per profile per episode (for TV shows)
  uniqueMediaPerProfile: unique().on(table.profileId, table.mediaId, table.mediaType, table.seasonNumber, table.episodeNumber),
}));

// For backward compatibility, create a view for continue_watching
export const continueWatching = watchHistory;

// For backward compatibility with existing API routes
export const legacyWatchlist = sqliteTable("watchlist_legacy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  addedAt: integer("added_at").notNull(),
});

export const legacyContinueWatching = sqliteTable("continue_watching_legacy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  lastWatchedAt: integer("last_watched_at").notNull(),
  progress: integer("progress").notNull(),
  seasonNumber: integer("season_number"),
  episodeNumber: integer("episode_number"),
  serverId: integer("server_id"),
});
