"use client";

import dynamic from "next/dynamic";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

// Lazy load heavy components with loading states
export const LazyMovieRow = dynamic(
  () =>
    import("@/components/MovieRow").then((mod) => ({ default: mod.MovieRow })),
  {
    loading: () => (
      <div className="space-y-4 my-6 md:my-8">
        <div className="flex items-center justify-between px-6">
          <LoadingSkeleton variant="text" className="w-48 h-6" />
        </div>
        <div className="flex space-x-4 pl-6 overflow-x-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              className="flex-shrink-0 h-48 w-32 md:h-60 md:w-40"
            />
          ))}
        </div>
      </div>
    ),
    ssr: true,
  }
);

export const LazyHero = dynamic(() => import("@/components/Hero"), {
  loading: () => (
    <div className="relative">
      <LoadingSkeleton variant="hero" />
      <div className="absolute bottom-0 left-0 p-6 md:p-16 space-y-4">
        <LoadingSkeleton variant="text" className="w-96 h-12" />
        <LoadingSkeleton variant="text" className="w-64 h-4" />
        <div className="flex space-x-4">
          <LoadingSkeleton className="w-32 h-12 rounded" />
          <LoadingSkeleton className="w-32 h-12 rounded" />
        </div>
      </div>
    </div>
  ),
  ssr: true,
});

export const LazyContinueWatching = dynamic(
  () => import("@/components/ContinueWatching"),
  {
    loading: () => (
      <div className="space-y-4 my-6 md:my-8">
        <div className="flex items-center justify-between px-6">
          <LoadingSkeleton variant="text" className="w-48 h-6" />
        </div>
        <div className="flex space-x-4 pl-6 overflow-x-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              className="flex-shrink-0 h-48 w-32 md:h-60 md:w-40"
            />
          ))}
        </div>
      </div>
    ),
    ssr: false, // This component depends on client-side state
  }
);

export const LazyMyList = dynamic(() => import("@/components/MyList"), {
  loading: () => (
    <div className="space-y-4 my-6 md:my-8">
      <div className="flex items-center justify-between px-6">
        <LoadingSkeleton variant="text" className="w-48 h-6" />
      </div>
      <div className="flex space-x-4 pl-6 overflow-x-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            className="flex-shrink-0 h-48 w-32 md:h-60 md:w-40"
          />
        ))}
      </div>
    </div>
  ),
  ssr: false, // This component depends on client-side state
});

export const LazySearchBar = dynamic(
  () => import("@/components/ui/search-bar"),
  {
    loading: () => (
      <LoadingSkeleton className="w-full max-w-xl h-10 rounded-md" />
    ),
    ssr: false,
  }
);

export const LazyFilterBar = dynamic(
  () =>
    import("@/components/ui/filter-bar").then((mod) => ({
      default: mod.FilterBar,
    })),
  {
    loading: () => (
      <div className="flex space-x-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingSkeleton key={i} className="w-32 h-10 rounded-md" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

// Lazy load player components (heavy video-related components)
export const LazyPlayer = dynamic(
  () =>
    import("@/components/ui/player").then((mod) => ({ default: mod.Player })),
  {
    loading: () => (
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export const LazyServerSelector = dynamic(
  () =>
    import("@/components/ui/server-selector").then((mod) => ({
      default: mod.ServerSelector,
    })),
  {
    loading: () => <LoadingSkeleton className="w-48 h-10 rounded-md" />,
    ssr: false,
  }
);

// Lazy load authentication components
export const LazyAuthSignIn = dynamic(
  () =>
    import("@/components/ui/auth-signin").then((mod) => ({
      default: mod.AuthSignIn,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <LoadingSkeleton className="w-full h-10 rounded-md" />
        <LoadingSkeleton className="w-full h-10 rounded-md" />
        <LoadingSkeleton className="w-full h-12 rounded-md" />
      </div>
    ),
    ssr: false,
  }
);

export const LazyAuthSignUp = dynamic(
  () =>
    import("@/components/ui/auth-signup").then((mod) => ({
      default: mod.AuthSignUp,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <LoadingSkeleton className="w-full h-10 rounded-md" />
        <LoadingSkeleton className="w-full h-10 rounded-md" />
        <LoadingSkeleton className="w-full h-10 rounded-md" />
        <LoadingSkeleton className="w-full h-12 rounded-md" />
      </div>
    ),
    ssr: false,
  }
);

// Lazy load profile components
export const LazyProfileSelector = dynamic(
  () => import("@/components/ProfileSelector"),
  {
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <LoadingSkeleton variant="circle" className="w-24 h-24 mx-auto" />
            <LoadingSkeleton variant="text" className="w-16 h-4 mx-auto" />
          </div>
        ))}
      </div>
    ),
    ssr: false,
  }
);

// Utility function to preload components
export const preloadComponent = (componentImport: () => Promise<any>) => {
  if (typeof window !== "undefined") {
    // Only preload on client side
    componentImport();
  }
};

// Preload critical components on page load
export const preloadCriticalComponents = () => {
  if (typeof window !== "undefined") {
    // Preload components that are likely to be used soon
    setTimeout(() => {
      preloadComponent(() => import("@/components/ui/search-bar"));
      preloadComponent(() => import("@/components/ContinueWatching"));
      preloadComponent(() => import("@/components/MyList"));
      preloadComponent(() => import("@/components/ui/player"));
    }, 1000);
  }
};
