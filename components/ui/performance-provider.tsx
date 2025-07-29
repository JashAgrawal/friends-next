"use client";

import { useEffect } from "react";
import { initializePerformanceOptimizations } from "@/lib/performance-utils";

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance optimizations on client side
    initializePerformanceOptimizations();
  }, []);

  return <>{children}</>;
}