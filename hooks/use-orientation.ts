import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window !== 'undefined') {
        const isLandscape = window.innerWidth > window.innerHeight;
        setOrientation(isLandscape ? 'landscape' : 'portrait');
      }
    };

    // Set initial orientation
    updateOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

export function useIsLandscape(): boolean {
  const orientation = useOrientation();
  return orientation === 'landscape';
}

export function useIsPortrait(): boolean {
  const orientation = useOrientation();
  return orientation === 'portrait';
}