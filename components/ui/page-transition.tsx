"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsVisible(true);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )}
    >
      {children}
    </div>
  );
}

// Simpler fade transition for components
export function FadeTransition({ 
  children, 
  className = "",
  delay = 0
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-opacity duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

// Slide transition for modals and sheets
export function SlideTransition({ 
  children, 
  direction = "up",
  className = "",
  isVisible = true
}: { 
  children: React.ReactNode; 
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  isVisible?: boolean;
}) {
  const getTransformClasses = () => {
    if (!isVisible) {
      switch (direction) {
        case "up": return "translate-y-full";
        case "down": return "-translate-y-full";
        case "left": return "translate-x-full";
        case "right": return "-translate-x-full";
        default: return "translate-y-full";
      }
    }
    return "translate-x-0 translate-y-0";
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        getTransformClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}

// Stagger animation for lists
export function StaggeredList({ 
  children, 
  className = "",
  staggerDelay = 50
}: { 
  children: React.ReactNode[]; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeTransition key={index} delay={index * staggerDelay}>
          {child}
        </FadeTransition>
      ))}
    </div>
  );
}