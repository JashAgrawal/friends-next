"use client";

import { useState, useCallback } from "react";
import { getGuestDataForMigration, clearGuestData } from "@/lib/localStorage-utils";
import { toast } from "sonner";

export interface MigrationStats {
  totalWatchlistItems: number;
  totalContinueWatchingItems: number;
  hasDataToMigrate: boolean;
}

export interface MigrationConflicts {
  hasWatchlistConflicts: boolean;
  hasContinueWatchingConflicts: boolean;
  conflictingWatchlistItems: number[];
  conflictingContinueWatchingItems: number[];
}

export interface MigrationResult {
  success: boolean;
  message?: string;
  stats: MigrationStats;
  conflicts: MigrationConflicts;
  migratedWatchlistCount: number;
  migratedContinueWatchingCount: number;
  profileId?: string;
  errors?: string[];
}

export function useGuestMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if there's guest data available for migration
   */
  const checkGuestData = useCallback(() => {
    const guestData = getGuestDataForMigration();
    const hasData = (guestData.watchlist && guestData.watchlist.length > 0) || 
                   (guestData.continueWatching && guestData.continueWatching.length > 0);
    
    return {
      hasData,
      watchlistCount: guestData.watchlist?.length || 0,
      continueWatchingCount: guestData.continueWatching?.length || 0,
      guestData
    };
  }, []);

  /**
   * Check for migration conflicts without performing migration
   */
  const checkMigrationConflicts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { guestData } = checkGuestData();
      
      const response = await fetch('/api/migrate-guest-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestData,
          checkConflictsOnly: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check migration conflicts');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check migration conflicts';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkGuestData]);

  /**
   * Perform the guest data migration
   */
  const migrateGuestData = useCallback(async (options?: {
    showToast?: boolean;
    clearGuestDataAfterMigration?: boolean;
  }) => {
    const { showToast = true, clearGuestDataAfterMigration = true } = options || {};
    
    setIsLoading(true);
    setError(null);

    try {
      const { guestData, hasData } = checkGuestData();
      
      if (!hasData) {
        const result: MigrationResult = {
          success: true,
          message: "No guest data to migrate",
          stats: {
            totalWatchlistItems: 0,
            totalContinueWatchingItems: 0,
            hasDataToMigrate: false
          },
          conflicts: {
            hasWatchlistConflicts: false,
            hasContinueWatchingConflicts: false,
            conflictingWatchlistItems: [],
            conflictingContinueWatchingItems: []
          },
          migratedWatchlistCount: 0,
          migratedContinueWatchingCount: 0
        };
        
        setMigrationResult(result);
        return result;
      }

      const response = await fetch('/api/migrate-guest-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestData,
          checkConflictsOnly: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Migration failed');
      }

      const result: MigrationResult = await response.json();
      setMigrationResult(result);

      if (result.success) {
        if (showToast) {
          const totalMigrated = result.migratedWatchlistCount + result.migratedContinueWatchingCount;
          if (totalMigrated > 0) {
            toast.success(
              `Successfully migrated ${totalMigrated} items to your account!`,
              {
                description: `${result.migratedWatchlistCount} watchlist items and ${result.migratedContinueWatchingCount} continue watching items`
              }
            );
          } else {
            toast.info("All your data was already in your account");
          }
        }

        // Clear guest data after successful migration
        if (clearGuestDataAfterMigration) {
          clearGuestData();
        }
      } else {
        if (showToast) {
          toast.error("Migration failed", {
            description: result.errors?.join(", ") || "Unknown error occurred"
          });
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      setError(errorMessage);
      
      if (showToast) {
        toast.error("Migration failed", {
          description: errorMessage
        });
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkGuestData]);

  /**
   * Automatically migrate guest data on sign-in
   */
  const autoMigrateOnSignIn = useCallback(async () => {
    const { hasData } = checkGuestData();
    
    if (!hasData) {
      return null;
    }

    try {
      const result = await migrateGuestData({
        showToast: true,
        clearGuestDataAfterMigration: true
      });
      
      return result;
    } catch (error) {
      console.error("Auto-migration failed:", error);
      return null;
    }
  }, [checkGuestData, migrateGuestData]);

  /**
   * Reset migration state
   */
  const resetMigration = useCallback(() => {
    setMigrationResult(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    migrationResult,
    error,

    // Actions
    checkGuestData,
    checkMigrationConflicts,
    migrateGuestData,
    autoMigrateOnSignIn,
    resetMigration
  };
}