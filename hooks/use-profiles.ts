"use client";

import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useUserStore } from '@/store';
import { toast } from 'sonner';
import { Profile } from '@/store/useUserStore';
import { getOrCreateGuestProfile, saveGuestProfile } from '@/lib/localStorage-utils';

interface ProfileData {
  name: string;
  avatar?: string | null;
}

export function useProfiles() {
  const { isAuthenticated } = useAuth();
  const { currentProfile, setCurrentProfile, profiles, setProfiles } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all profiles
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const res = await fetch('/api/profiles');
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch profiles');
        }
        
        const profilesData = await res.json();
        setProfiles(profilesData);
        return profilesData;
      } else {
        // For guest users, get profile from localStorage
        const guestProfile = getOrCreateGuestProfile();
        const profile = {
          id: guestProfile.id,
          userId: 'guest',
          name: guestProfile.name,
          avatar: guestProfile.avatar || undefined,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setProfiles([profile]);
        return [profile];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profiles';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, setProfiles]);

  // Create a new profile
  const createProfile = useCallback(async (profileData: ProfileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create profile');
        }
        
        const newProfile = await res.json();
        await fetchProfiles();
        toast.success('Profile created successfully');
        return newProfile;
      } else {
        // For guest users, update the existing profile
        const guestProfile = getOrCreateGuestProfile();
        guestProfile.name = profileData.name;
        guestProfile.avatar = profileData.avatar || undefined;
        saveGuestProfile(guestProfile);
        
        const profile = {
          id: guestProfile.id,
          userId: 'guest',
          name: guestProfile.name,
          avatar: guestProfile.avatar,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setProfiles([profile]);
        toast.success('Profile updated successfully');
        return profile;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchProfiles, setProfiles]);

  // Update an existing profile
  const updateProfile = useCallback(async (profileId: string, profileData: Partial<ProfileData>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const res = await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: profileId, ...profileData }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update profile');
        }
        
        const updatedProfile = await res.json();
        await fetchProfiles();
        
        // Update current profile if it's the one being updated
        if (currentProfile && currentProfile.id === profileId) {
          setCurrentProfile(updatedProfile);
        }
        
        toast.success('Profile updated successfully');
        return updatedProfile;
      } else {
        // For guest users, update the existing profile
        const guestProfile = getOrCreateGuestProfile();
        
        if (profileData.name) {
          guestProfile.name = profileData.name;
        }
        
        if (profileData.avatar !== undefined) {
          guestProfile.avatar = profileData.avatar || undefined;
        }
        
        saveGuestProfile(guestProfile);
        
        const profile = {
          id: guestProfile.id,
          userId: 'guest',
          name: guestProfile.name,
          avatar: guestProfile.avatar || undefined,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setProfiles([profile]);
        setCurrentProfile(profile);
        toast.success('Profile updated successfully');
        return profile;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchProfiles, currentProfile, setCurrentProfile, setProfiles]);

  // Delete a profile
  const deleteProfile = useCallback(async (profileId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const res = await fetch('/api/profiles', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: profileId }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to delete profile');
        }
        
        await fetchProfiles();
        
        // If we deleted the current profile, set current profile to null
        if (currentProfile && currentProfile.id === profileId) {
          setCurrentProfile(null);
        }
        
        toast.success('Profile deleted successfully');
        return true;
      } else {
        // For guest users, reset the profile to default
        const guestProfile = getOrCreateGuestProfile();
        guestProfile.name = 'Guest';
        guestProfile.avatar = undefined;
        saveGuestProfile(guestProfile);
        
        const profile = {
          id: guestProfile.id,
          userId: 'guest',
          name: guestProfile.name,
          avatar: undefined,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setProfiles([profile]);
        setCurrentProfile(profile);
        toast.success('Profile reset to default');
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchProfiles, currentProfile, setCurrentProfile, setProfiles]);

  // Set a profile as active
  const setActiveProfile = useCallback(async (profile: Profile) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const res = await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: profile.id, isActive: true }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to set active profile');
        }
        
        const updatedProfile = await res.json();
        setCurrentProfile(updatedProfile);
        return updatedProfile;
      } else {
        // For guest users, just update the current profile in store
        setCurrentProfile(profile);
        return profile;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set active profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, setCurrentProfile]);

  return {
    profiles,
    currentProfile,
    isLoading,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  };
}