// Re-export utility functions
export * from './utils';
export * from './localStorage-utils';
export * from './tmdb-client';
export * from './content-transformers';
export * from './content-utils';
export * from './auth';
export {
  dbProfileToStoreProfile,
  guestProfileToStoreProfile,
  getUserProfiles,
  getActiveProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  setActiveProfile,
  updateGuestProfile,
  migrateGuestProfile
} from './profile-utils';
export type { ProfileData, ProfileResponse } from './profile-utils';
export * from './db';

// Common types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}