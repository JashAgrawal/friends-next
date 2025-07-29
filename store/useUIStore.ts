import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isNavbarVisible: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  currentTheme: 'dark' | 'light' | 'system';
  setNavbarVisibility: (visible: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNavbarVisible: true,
      isSearchOpen: false,
      isMobileMenuOpen: false,
      currentTheme: 'dark',
      
      setNavbarVisibility: (visible) => set({ 
        isNavbarVisible: visible 
      }),
      
      toggleSearch: () => set((state) => ({ 
        isSearchOpen: !state.isSearchOpen,
        // Close mobile menu if search is opening
        isMobileMenuOpen: state.isSearchOpen ? state.isMobileMenuOpen : false
      })),
      
      setSearchOpen: (isOpen) => set({ 
        isSearchOpen: isOpen 
      }),
      
      toggleMobileMenu: () => set((state) => ({ 
        isMobileMenuOpen: !state.isMobileMenuOpen,
        // Close search if mobile menu is opening
        isSearchOpen: state.isMobileMenuOpen ? state.isSearchOpen : false
      })),
      
      setMobileMenuOpen: (isOpen) => set({ 
        isMobileMenuOpen: isOpen 
      }),
      
      setTheme: (theme) => set({ 
        currentTheme: theme 
      }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
      }),
    }
  )
);