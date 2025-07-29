'use client'

import { useEffect } from 'react';
import { preloadCriticalComponents } from '@/lib/dynamic-imports';

export function PreloadComponents() {
  useEffect(() => {
    preloadCriticalComponents();
  }, []);

  return null; // This component doesn't render anything
}