# Guest Data Migration System

This document explains the guest-to-authenticated user data migration system implemented for the Friends streaming application.

## Overview

The migration system allows guest users' data (watchlist and continue watching items) to be automatically transferred to their account when they sign up or sign in. This ensures a seamless user experience where users don't lose their viewing history and saved content when they create an account.

## Components

### 1. Core Migration Logic (`lib/guest-migration.ts`)

**Server Actions:**
- `migrateGuestDataToUser()` - Performs the actual migration of guest data to user's database profile
- `checkUserDataConflicts()` - Checks for existing data conflicts before migration

**Key Features:**
- Creates a default profile if user doesn't have one
- Handles conflicts by preserving existing data and only adding new items
- Updates existing continue watching items if guest data is more recent
- Provides detailed migration results with counts and error reporting

### 2. Migration Utilities (`lib/migration-utils.ts`)

**Pure Functions:**
- `getMigrationStats()` - Calculates migration statistics for display to users

### 3. Client-Side Hooks

**`hooks/use-guest-migration.ts`:**
- `checkGuestData()` - Checks if guest has data available for migration
- `migrateGuestData()` - Triggers the migration process
- `autoMigrateOnSignIn()` - Automatically migrates data when user signs in
- `checkMigrationConflicts()` - Checks for conflicts before migration

**`hooks/use-guest-detection.ts`:**
- Detects when a user signs in and has guest data
- Automatically triggers migration process
- Manages migration state and prevents duplicate migrations

### 4. API Routes (`app/api/migrate-guest-data/route.ts`)

**Endpoints:**
- `POST /api/migrate-guest-data` - Performs migration or checks conflicts
- `GET /api/migrate-guest-data` - Gets migration statistics and conflict information

### 5. UI Components

**`components/ui/migration-notification.tsx`:**
- Displays migration prompt to users
- Shows migration progress and results
- Allows users to dismiss or postpone migration

**`components/ui/migration-provider.tsx`:**
- Provides migration notifications at the app level
- Integrates with the main layout

## Data Flow

1. **Guest User Activity**: Guest users browse, add items to watchlist, and watch content. Data is stored in localStorage.

2. **User Authentication**: When a guest user signs up or signs in:
   - `useGuestDetection` hook detects the authentication state change
   - Checks if guest data exists in localStorage
   - Triggers automatic migration if data is found

3. **Migration Process**:
   - Guest data is extracted from localStorage using `getGuestDataForMigration()`
   - Data is sent to the migration API endpoint
   - Server-side migration logic processes the data:
     - Creates user profile if needed
     - Checks for existing data conflicts
     - Migrates watchlist items (avoiding duplicates)
     - Migrates continue watching items (updating if guest data is newer)
   - Returns migration results to the client

4. **User Notification**: 
   - Migration notification appears showing results
   - Guest data is cleared from localStorage after successful migration
   - User can continue using the app with their migrated data

## Migration Rules

### Watchlist Migration
- Items are only added if they don't already exist in the user's watchlist
- Duplicates are detected by `mediaId` and `mediaType`

### Continue Watching Migration
- Items are added if they don't exist
- If an item exists, it's updated only if the guest data is more recent
- For TV shows, season and episode numbers are also considered for uniqueness

### Profile Management
- If user has no profiles, a "Main Profile" is created automatically
- Migration always uses the user's active profile
- Falls back to legacy tables if no profile system is in use

## Error Handling

- Database errors are caught and logged
- Partial migrations are supported (some items may fail while others succeed)
- Detailed error reporting helps with debugging
- User-friendly error messages are displayed in the UI

## Testing

The system includes test utilities:
- `scripts/test-migration.ts` - Tests migration utility functions
- Unit tests for pure functions like `getMigrationStats()`

## Configuration

The migration system is automatically enabled and requires no configuration. It integrates with:
- Better Auth for authentication
- Drizzle ORM for database operations
- Zustand for state management
- Sonner for toast notifications

## Usage Examples

### Automatic Migration (Default Behavior)
```typescript
// This happens automatically when user signs in
const { autoMigrateOnSignIn } = useGuestMigration();
// Called by useGuestDetection hook
```

### Manual Migration
```typescript
const { migrateGuestData, checkGuestData } = useGuestMigration();

// Check if user has guest data
const { hasData, watchlistCount, continueWatchingCount } = checkGuestData();

// Manually trigger migration
if (hasData) {
  const result = await migrateGuestData({
    showToast: true,
    clearGuestDataAfterMigration: true
  });
}
```

### Check Migration Conflicts
```typescript
const { checkMigrationConflicts } = useGuestMigration();

const conflicts = await checkMigrationConflicts();
if (conflicts.hasWatchlistConflicts) {
  // Handle conflicts
}
```

## Security Considerations

- Migration only works for authenticated users
- Guest data is validated before migration
- Database operations use proper authentication checks
- Guest data is cleared after successful migration to prevent data leakage

## Performance Considerations

- Migration is performed asynchronously
- Large datasets are handled efficiently with proper database indexing
- Migration state is managed to prevent duplicate operations
- UI remains responsive during migration process