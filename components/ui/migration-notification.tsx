"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGuestMigration } from "@/hooks/use-guest-migration";
import { useGuestDetection } from "@/hooks/use-guest-detection";
import { CheckCircle, AlertCircle, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface MigrationNotificationProps {
  onClose?: () => void;
  autoShow?: boolean;
  className?: string;
}

export function MigrationNotification({ 
  onClose, 
  autoShow = true,
  className = ""
}: MigrationNotificationProps) {
  const { shouldShowMigrationPrompt, hasGuestData } = useGuestDetection();
  const { 
    isLoading, 
    migrationResult, 
    error, 
    checkGuestData, 
    migrateGuestData, 
    resetMigration 
  } = useGuestMigration();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [guestDataStats, setGuestDataStats] = useState<{
    watchlistCount: number;
    continueWatchingCount: number;
  } | null>(null);

  // Show notification when conditions are met
  useEffect(() => {
    if (autoShow && shouldShowMigrationPrompt && !isDismissed) {
      setIsVisible(true);
      
      // Get guest data statistics
      const { watchlistCount, continueWatchingCount } = checkGuestData();
      setGuestDataStats({ watchlistCount, continueWatchingCount });
    } else {
      setIsVisible(false);
    }
  }, [shouldShowMigrationPrompt, isDismissed, autoShow, checkGuestData]);

  // Handle successful migration
  useEffect(() => {
    if (migrationResult?.success) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migrationResult]);

  const handleMigrate = async () => {
    try {
      await migrateGuestData({
        showToast: false, // We'll handle the toast ourselves
        clearGuestDataAfterMigration: true
      });
    } catch {
      // Error is already handled in the hook
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsDismissed(true);
    resetMigration();
    onClose?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    toast.info("You can migrate your data later from your profile settings");
    onClose?.();
  };

  if (!isVisible || !hasGuestData) {
    return null;
  }

  const totalItems = (guestDataStats?.watchlistCount || 0) + (guestDataStats?.continueWatchingCount || 0);

  return (
    <Card className={`w-full max-w-md mx-auto border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Migrate Your Data
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          We found {totalItems} items from your guest session that can be added to your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Data Summary */}
        <div className="flex gap-2">
          {guestDataStats?.watchlistCount ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {guestDataStats.watchlistCount} Watchlist items
            </Badge>
          ) : null}
          {guestDataStats?.continueWatchingCount ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {guestDataStats.continueWatchingCount} Continue watching items
            </Badge>
          ) : null}
        </div>

        {/* Migration Status */}
        {migrationResult && (
          <div className="space-y-2">
            {migrationResult.success ? (
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Successfully migrated {migrationResult.migratedWatchlistCount + migrationResult.migratedContinueWatchingCount} items!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Migration failed</span>
              </div>
            )}
            
            {migrationResult.errors && migrationResult.errors.length > 0 && (
              <div className="text-xs text-red-600 dark:text-red-400">
                {migrationResult.errors.join(", ")}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        {!migrationResult?.success && (
          <div className="flex gap-2">
            <Button
              onClick={handleMigrate}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Migrate Data
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={isLoading}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              Later
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MigrationNotification;