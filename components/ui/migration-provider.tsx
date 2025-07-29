"use client";

import { useEffect, useState } from "react";
import { useGuestDetection } from "@/hooks/use-guest-detection";
import { MigrationNotification } from "@/components/ui/migration-notification";

export function MigrationProvider() {
  const { shouldShowMigrationPrompt } = useGuestDetection();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Small delay to ensure the page has loaded and user can see the notification
    if (shouldShowMigrationPrompt) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setShowNotification(false);
    }
  }, [shouldShowMigrationPrompt]);

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <MigrationNotification
        onClose={() => setShowNotification(false)}
        autoShow={true}
      />
    </div>
  );
}

export default MigrationProvider;