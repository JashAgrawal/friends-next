import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "row" | "hero" | "text" | "circle";
  count?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = "card", 
  count = 1 
}: LoadingSkeletonProps) {
  const getSkeletonClasses = () => {
    switch (variant) {
      case "card":
        return "aspect-[2/3] bg-gray-800 rounded-md animate-pulse";
      case "row":
        return "h-4 bg-gray-800 rounded animate-pulse";
      case "hero":
        return "h-[70vh] md:h-[90vh] bg-gray-900 animate-pulse";
      case "text":
        return "h-4 bg-gray-800 rounded animate-pulse";
      case "circle":
        return "w-28 h-28 bg-gray-800 rounded-full animate-pulse";
      default:
        return "bg-gray-800 animate-pulse";
    }
  };

  if (count === 1) {
    return <div className={cn(getSkeletonClasses(), className)} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(getSkeletonClasses(), className)} />
      ))}
    </>
  );
}

// Specific loading components for common use cases
export function MovieCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <LoadingSkeleton variant="card" count={count} />
    </div>
  );
}

export function MovieRowSkeleton() {
  return (
    <div className="px-4 md:px-8 mb-8">
      <LoadingSkeleton variant="text" className="w-48 mb-4" />
      <div className="flex space-x-4 overflow-hidden">
        <LoadingSkeleton variant="card" count={6} className="flex-shrink-0 w-48" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
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
  );
}

export function CastSkeleton() {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-28 space-y-2">
          <LoadingSkeleton variant="circle" />
          <LoadingSkeleton variant="text" className="w-full h-3" />
          <LoadingSkeleton variant="text" className="w-3/4 h-3" />
        </div>
      ))}
    </div>
  );
}