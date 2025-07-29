import { useEffect, useState } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'large';

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>('mobile');

  useEffect(() => {
    const updateScreenSize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 768) {
          setScreenSize('mobile');
        } else if (width < 1024) {
          setScreenSize('tablet');
        } else if (width < 1440) {
          setScreenSize('desktop');
        } else {
          setScreenSize('large');
        }
      }
    };

    // Set initial screen size
    updateScreenSize();

    // Listen for resize events
    window.addEventListener('resize', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  return screenSize;
}

export function useIsTablet(): boolean {
  const screenSize = useScreenSize();
  return screenSize === 'tablet';
}

export function useIsDesktop(): boolean {
  const screenSize = useScreenSize();
  return screenSize === 'desktop' || screenSize === 'large';
}

export function useIsLargeScreen(): boolean {
  const screenSize = useScreenSize();
  return screenSize === 'large';
}

// Grid utilities for responsive layouts
export const getGridColumns = (screenSize: ScreenSize, contentType: 'movies' | 'cards' | 'list' = 'movies') => {
  const configs = {
    movies: {
      mobile: 'grid-cols-2',
      tablet: 'grid-cols-3 md:grid-cols-4',
      desktop: 'grid-cols-4 lg:grid-cols-5',
      large: 'grid-cols-5 xl:grid-cols-6'
    },
    cards: {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-2',
      desktop: 'grid-cols-3',
      large: 'grid-cols-4'
    },
    list: {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-1',
      desktop: 'grid-cols-2',
      large: 'grid-cols-3'
    }
  };

  return configs[contentType][screenSize];
};

// Spacing utilities for responsive layouts
export const getResponsiveSpacing = (screenSize: ScreenSize) => {
  const spacing = {
    mobile: {
      padding: 'p-4',
      margin: 'm-4',
      gap: 'gap-4'
    },
    tablet: {
      padding: 'p-6',
      margin: 'm-6',
      gap: 'gap-6'
    },
    desktop: {
      padding: 'p-8',
      margin: 'm-8',
      gap: 'gap-8'
    },
    large: {
      padding: 'p-12',
      margin: 'm-12',
      gap: 'gap-12'
    }
  };

  return spacing[screenSize];
};

// Typography utilities for responsive text
export const getResponsiveText = (screenSize: ScreenSize, variant: 'heading' | 'subheading' | 'body' | 'caption' = 'body') => {
  const typography = {
    heading: {
      mobile: 'text-2xl font-bold',
      tablet: 'text-3xl font-bold',
      desktop: 'text-4xl font-bold',
      large: 'text-5xl font-bold'
    },
    subheading: {
      mobile: 'text-lg font-semibold',
      tablet: 'text-xl font-semibold',
      desktop: 'text-2xl font-semibold',
      large: 'text-3xl font-semibold'
    },
    body: {
      mobile: 'text-sm',
      tablet: 'text-base',
      desktop: 'text-lg',
      large: 'text-xl'
    },
    caption: {
      mobile: 'text-xs',
      tablet: 'text-sm',
      desktop: 'text-base',
      large: 'text-lg'
    }
  };

  return typography[variant][screenSize];
};