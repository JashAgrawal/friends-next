# Continue Watching Update Implementation

## Problem
Previously, when a user watched different episodes of the same series, the system would create multiple entries in the continue watching list instead of updating the existing entry. For example:
- User watches Series X S1E2 → Creates entry for S1E2
- User watches Series X S1E3 → Creates another entry for S1E3
- Result: Two entries for the same series

## Solution
Modified the continue watching API to ensure **one entry per media per user/profile**:

### Key Changes

#### 1. Database Schema Update
- Added unique constraint on `(profile_id, media_id, media_type)` in `watch_history` table
- This prevents duplicate entries at the database level

#### 2. API Logic Update (`/app/api/continue-watching/route.ts`)
**Before:**
- Checked for exact episode match (same season AND episode)
- Created new entries for different episodes of same series

**After:**
- Checks for same `mediaId` and `mediaType` only (regardless of episode)
- Updates existing entry with new episode/season information
- Maintains single entry per series per user

#### 3. Update Behavior
When user watches a different episode:
```javascript
// Example: User has S1E2 in continue watching
// User watches S1E3 of same series
// Result: Updates existing entry from S1E2 → S1E3
{
  mediaId: 12345,
  title: "Series Name",
  seasonNumber: 1,    // Updated
  episodeNumber: 3,   // Updated  
  serverId: 2,        // Updated if different
  lastWatchedAt: "new timestamp"
}
```

### Implementation Details

#### Modern Table (`watch_history`)
```sql
-- Unique constraint ensures one entry per media per profile
CREATE UNIQUE INDEX `watch_history_profile_id_media_id_media_type_unique` 
ON `watch_history` (`profile_id`,`media_id`,`media_type`);
```

#### Legacy Table (`continue_watching_legacy`)
- Uses title matching since no `mediaId` available
- Same update logic applied for backward compatibility

#### API Endpoints Updated
- **POST `/api/continue-watching`**: Now updates existing entries
- **DELETE `/api/continue-watching`**: Removes by `mediaId` + `mediaType`

### Migration & Cleanup
1. **Migration**: Added unique constraint via Drizzle migration
2. **Cleanup Script**: Removes any existing duplicates before constraint
3. **Backward Compatibility**: Legacy table support maintained

### Testing
Created test script (`test-continue-watching-update.js`) to verify:
1. Adding first episode creates entry
2. Adding second episode updates same entry (doesn't create new)
3. Final result: Only one entry per series

### Benefits
- ✅ Clean continue watching list (no duplicates)
- ✅ Always shows latest episode watched
- ✅ Better user experience
- ✅ Database integrity maintained
- ✅ Backward compatibility preserved

### Usage Example
```javascript
// User watches Episode 1
POST /api/continue-watching {
  mediaId: 12345,
  mediaType: "tv",
  seasonNumber: 1,
  episodeNumber: 1
}
// Creates new entry

// User watches Episode 2 of same series
POST /api/continue-watching {
  mediaId: 12345,  // Same mediaId
  mediaType: "tv", // Same mediaType
  seasonNumber: 1,
  episodeNumber: 2  // Different episode
}
// Updates existing entry (no new entry created)
```

This ensures each user has exactly one continue watching entry per series/movie, always reflecting their most recent viewing progress.