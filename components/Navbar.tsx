"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, Menu, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchBar } from "@/components/ui/search-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

// Keyboard shortcut component that handles client-side rendering
function KeyboardShortcut() {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(navigator?.userAgent?.indexOf("Mac") !== -1);
  }, []);

  return (
    <span className="hidden md:flex items-center text-xs text-gray-400 border border-gray-700 rounded px-1.5 py-0.5">
      <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>
      <span className="mx-0.5">+</span>
      <span>K</span>
    </span>
  );
}

export interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const { isAuthenticated, user, signOut, isLoading } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add keyboard shortcut for search (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      } else if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-8 py-3 md:py-4",
        isScrolled
          ? "bg-black/90 backdrop-blur-sm"
          : "bg-gradient-to-b from-black/80 to-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center space-x-4 md:space-x-6",
            isMobile && showSearch ? "hidden" : ""
          )}
        >
          <Link 
            href="/" 
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-md px-2 py-1 transition-all"
            tabIndex={0}
          >
            <p className="font-black text-red-500 text-2xl md:text-3xl lg:text-4xl">FRIENDS</p>
          </Link>

          {!isMobile ? (
            <div className="flex space-x-6 lg:space-x-8">
              <Link
                href="/tv-shows"
                className="text-lg lg:text-xl text-white hover:text-gray-300 focus:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-md px-2 py-1"
                tabIndex={0}
              >
                TV Shows
              </Link>

              <Link
                href="/movies"
                className="text-lg lg:text-xl text-white hover:text-gray-300 focus:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-md px-2 py-1"
                tabIndex={0}
              >
                Movies
              </Link>
              <Link
                href="/explore"
                className="text-lg lg:text-xl text-white hover:text-gray-300 focus:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-md px-2 py-1"
                tabIndex={0}
              >
                Explore
              </Link>
              <Link
                href="/my-list"
                className="text-lg lg:text-xl text-white hover:text-gray-300 focus:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black rounded-md px-2 py-1"
                tabIndex={0}
              >
                My List
              </Link>
            </div>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
                >
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-gray-900 text-white border-gray-800 w-[280px] sm:w-[350px]"
              >
                <div className="flex flex-col space-y-6 mt-8">
                  <Link
                    href="/tv-shows"
                    className="text-xl font-medium hover:text-gray-300 transition-colors py-3 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 touch-manipulation"
                  >
                    TV Shows
                  </Link>
                  <Link
                    href="/movies"
                    className="text-xl font-medium hover:text-gray-300 transition-colors py-3 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 touch-manipulation"
                  >
                    Movies
                  </Link>
                  <Link
                    href="/explore"
                    className="text-xl font-medium hover:text-gray-300 transition-colors py-3 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 touch-manipulation"
                  >
                    Explore
                  </Link>
                  <Link
                    href="/my-list"
                    className="text-xl font-medium hover:text-gray-300 transition-colors py-3 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 touch-manipulation"
                  >
                    My List
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div
          className={cn(
            "flex items-center space-x-4",
            isMobile && showSearch ? "w-full" : ""
          )}
        >
          {showSearch ? (
            <div className="w-full animate-in fade-in slide-in-from-top-4 duration-300">
              <SearchBar
                onClose={() => setShowSearch(false)}
                autoFocus={true}
                mobile={isMobile}
              />
            </div>
          ) : (
            <button
              onClick={toggleSearch}
              className={cn(
                "flex items-center gap-2 text-white hover:text-gray-300 transition-colors touch-manipulation",
                isMobile ? "p-2 rounded-lg hover:bg-white/10 active:bg-white/20" : ""
              )}
              aria-label="Search"
            >
              <Search size={isMobile ? 22 : 20} />
              {!isMobile && <KeyboardShortcut />}
            </button>
          )}

          {!showSearch && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative">
                  <Avatar className={cn(
                    "cursor-pointer transition-transform touch-manipulation",
                    isMobile ? "w-9 h-9 hover:scale-105 active:scale-95" : "w-8 h-8"
                  )}>
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600">
                      <User size={isMobile ? 20 : 18} className="text-white" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={cn(
                  "bg-gray-900 border-gray-700 text-white",
                  isMobile ? "w-64 mr-2" : "w-56"
                )}
              >
                {isAuthenticated ? (
                  <>
                    {user?.name && (
                      <>
                        <div className="px-2 py-1.5 text-sm text-gray-300">
                          Signed in as
                        </div>
                        <div className="px-2 py-1.5 text-sm font-medium truncate">
                          {user.name}
                        </div>
                        <DropdownMenuSeparator className="bg-gray-700" />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isLoading}
                      className={cn(
                        "text-red-400 hover:text-red-300 hover:bg-red-900/20 focus:text-red-300 focus:bg-red-900/20 touch-manipulation",
                        isMobile ? "py-3 text-base" : ""
                      )}
                    >
                      <LogOut className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
                      {isLoading ? "Signing out..." : "Sign out"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={handleSignIn}
                    className={cn(
                      "text-green-400 hover:text-green-300 hover:bg-green-900/20 focus:text-green-300 focus:bg-green-900/20 touch-manipulation",
                      isMobile ? "py-3 text-base" : ""
                    )}
                  >
                    <LogIn className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
                    Sign in
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
