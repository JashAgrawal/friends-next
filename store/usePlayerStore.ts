"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  selectedServer: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setSelectedServer: (server: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      selectedServer: 0,
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume }),
      setSelectedServer: (selectedServer) => set({ selectedServer }),
      reset: () => set({ isPlaying: false, currentTime: 0, duration: 0 }),
    }),
    {
      name: "friends-player-storage",
      partialize: (state) => ({ selectedServer: state.selectedServer, volume: state.volume }),
    }
  )
);