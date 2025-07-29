import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserState {
  isAuthenticated: boolean;
  user: User | null;
  currentProfile: Profile | null;
  profiles: Profile[];
  setUser: (user: User | null) => void;
  setCurrentProfile: (profile: Profile | null) => void;
  setProfiles: (profiles: Profile[]) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      currentProfile: null,
      profiles: [],
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setCurrentProfile: (profile) => set({ 
        currentProfile: profile 
      }),
      
      setProfiles: (profiles) => set({ 
        profiles 
      }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        user: null, 
        currentProfile: null, 
        profiles: [] 
      }),
    }),
    {
      name: 'user-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentProfile: state.currentProfile,
      }),
    }
  )
);