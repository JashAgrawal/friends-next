// Performance monitoring utilities

// Types for better type safety
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === "undefined") return;

  // Track Core Web Vitals
  import("web-vitals")
    .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS((metric) => {
        console.log("CLS:", metric);
      });
      onINP((metric) => {
        console.log("INP:", metric);
      });
      onFCP((metric) => {
        console.log("FCP:", metric);
      });
      onLCP((metric) => {
        console.log("LCP:", metric);
      });
      onTTFB((metric) => {
        console.log("TTFB:", metric);
      });
    })
    .catch(() => {
      // Fallback if web-vitals is not available
      console.log(
        "Web Vitals tracking not available - install with: npm install web-vitals"
      );
    });
}

// Image loading optimization
export function optimizeImageLoading() {
  if (typeof window === "undefined") return;

  // Preload critical images
  const preloadImage = (src: string) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  };

  // Preload hero images and critical content
  const criticalImages = ["/og-image.jpg", "/placeholder.svg"];

  criticalImages.forEach(preloadImage);
}

// Resource hints for better performance
export function addResourceHints() {
  if (typeof window === "undefined") return;

  const addDNSPrefetch = (domain: string) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = domain;
    document.head.appendChild(link);
  };

  const addPreconnect = (domain: string) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = domain;
    document.head.appendChild(link);
  };

  // Add DNS prefetch and preconnect for external domains
  addDNSPrefetch("//image.tmdb.org");
  addDNSPrefetch("//fonts.googleapis.com");
  addDNSPrefetch("//fonts.gstatic.com");

  addPreconnect("https://image.tmdb.org");
  addPreconnect("https://fonts.googleapis.com");
  addPreconnect("https://fonts.gstatic.com");
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memory usage monitoring
export function monitorMemoryUsage(): MemoryInfo | undefined {
  if (typeof window === "undefined" || !("performance" in window)) return;

  const memory = performance.memory;
  if (!memory) return;

  const memoryInfo: MemoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };

  console.log("Memory Usage:", memoryInfo);
  return memoryInfo;
}

// Performance timing
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  if (typeof window === "undefined") return fn();

  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.then((value) => {
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
      return value;
    });
  } else {
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== "development") return;

  // This would typically be used with webpack-bundle-analyzer
  console.log("Bundle analysis would run here in development");
}

// Critical resource loading
export function loadCriticalResources() {
  if (typeof window === "undefined") return;

  // Preload critical CSS
  const preloadCSS = (href: string) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;
    document.head.appendChild(link);
  };

  // Preload critical JavaScript
  const preloadJS = (href: string) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = href;
    document.head.appendChild(link);
  };

  // Example usage of preload functions (can be customized as needed)
  // preloadCSS('/critical.css');
  // preloadJS('/critical.js');

  // Add critical resource hints
  addResourceHints();
  optimizeImageLoading();
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// Initialize all performance optimizations
export function initializePerformanceOptimizations() {
  if (typeof window === "undefined") return;

  // Load critical resources
  loadCriticalResources();

  // Track web vitals
  trackWebVitals();

  // Register service worker
  registerServiceWorker();

  // Monitor memory usage periodically
  setInterval(monitorMemoryUsage, 30000); // Every 30 seconds
}
