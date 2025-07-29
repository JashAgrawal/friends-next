"use client";

import { useKeyboardNavigation, useFocusManagement, useSkipLinks } from "@/hooks/use-keyboard-navigation";

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
}

export function KeyboardNavigationProvider({ children }: KeyboardNavigationProviderProps) {
  useKeyboardNavigation();
  useFocusManagement();
  useSkipLinks();

  return <>{children}</>;
}