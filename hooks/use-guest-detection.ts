"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGuestMigration } from "@/hooks/use-guest-migration";

export function useGuestDetection() {
  const { isAuthenticated, user } = useAuth();
  const { checkGuestData, autoMigrateOnSignIn } = useGuestMigration();
  const [hasGuestData, setHasGuestData] = useState(false);
  const [migrationTriggered, setMigrationTriggered] = useState(false);
  const [isCheckingGuestData, setIsCheckingGuestData] = useState(true);

  // Check for guest data on component mount
  useEffect(() => {
    const checkForGuestData = () => {
      try {
        const { hasData } = checkGuestData();
        setHasGuestData(hasData);
      } catch (error) {
        console.error("Error checking guest data:", error);
        setHasGuestData(false);
      } finally {
        setIsCheckingGuestData(false);
      }
    };

    checkForGuestData();
  }, [checkGuestData]);

  // Auto-migrate when user signs in and has guest data
  useEffect(() => {
    const handleAutoMigration = async () => {
      // Only trigger migration if:
      // 1. User is authenticated
      // 2. Has guest data
      // 3. Migration hasn't been triggered yet
      // 4. We're done checking for guest data
      if (isAuthenticated && hasGuestData && !migrationTriggered && !isCheckingGuestData) {
        setMigrationTriggered(true);
        
        try {
          await autoMigrateOnSignIn();
          // After successful migration, guest data should be cleared
          setHasGuestData(false);
        } catch (error) {
          console.error("Auto-migration failed:", error);
          // Reset migration triggered state so user can try again
          setMigrationTriggered(false);
        }
      }
    };

    handleAutoMigration();
  }, [isAuthenticated, hasGuestData, migrationTriggered, isCheckingGuestData, autoMigrateOnSignIn]);

  // Reset migration state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setMigrationTriggered(false);
    }
  }, [isAuthenticated]);

  return {
    hasGuestData,
    migrationTriggered,
    isCheckingGuestData,
    shouldShowMigrationPrompt: isAuthenticated && hasGuestData && !migrationTriggered
  };
}