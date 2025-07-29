import { db, generateId } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateGuestProfile, saveGuestProfile, GuestProfile } from "./localStorage-utils";
import { Profile } from "@/store/useUserStore";

// Types
export interface ProfileData {
  id?: string;
  name: string;
  avatar?: string | null;
  isActive?: boolean;
}

export interface ProfileResponse {
  success: boolean;
  data?: Profile | Profile[];
  error?: string;
}

/**
 * Convert database profile to store profile
 */
export function dbProfileToStoreProfile(dbProfile: any): Profile {
  return {
    id: dbProfile.id,
    userId: dbProfile.userId,
    name: dbProfile.name,
    avatar: dbProfile.avatar || undefined,
    createdAt: dbProfile.createdAt instanceof Date 
      ? dbProfile.createdAt 
      : new Date(dbProfile.createdAt),
    updatedAt: dbProfile.updatedAt instanceof Date 
      ? dbProfile.updatedAt 
      : new Date(dbProfile.updatedAt),
  };
}

/**
 * Convert guest profile to store profile
 */
export function guestProfileToStoreProfile(guestProfile: GuestProfile): Profile {
  return {
    id: guestProfile.id,
    userId: 'guest',
    name: guestProfile.name,
    avatar: guestProfile.avatar || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get all profiles for a user
 */
export async function getUserProfiles(userId: string): Promise<Profile[]> {
  const userProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  
  return userProfiles.map(dbProfileToStoreProfile);
}

/**
 * Get active profile for a user
 */
export async function getActiveProfile(userId: string): Promise<Profile | null> {
  const activeProfile = await db
    .select()
    .from(profiles)
    .where(and(
      eq(profiles.userId, userId),
      eq(profiles.isActive, true)
    ));
  
  if (activeProfile.length === 0) {
    return null;
  }
  
  return dbProfileToStoreProfile(activeProfile[0]);
}

/**
 * Create a profile for a user
 */
export async function createProfile(userId: string, profileData: ProfileData): Promise<Profile> {
  const id = profileData.id || generateId();
  const now = new Date();
  
  // Check if user has reached the maximum number of profiles (5)
  const existingProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  
  if (existingProfiles.length >= 5) {
    throw new Error("Maximum number of profiles (5) reached");
  }
  
  // If this is the first profile or isActive is true, deactivate all other profiles
  if (profileData.isActive || existingProfiles.length === 0) {
    await db
      .update(profiles)
      .set({ 
        isActive: false,
        updatedAt: now
      })
      .where(and(
        eq(profiles.userId, userId),
        eq(profiles.isActive, true)
      ));
  }
  
  const shouldBeActive = profileData.isActive || existingProfiles.length === 0;
  
  // Insert the new profile
  await db
    .insert(profiles)
    .values({
      id,
      userId,
      name: profileData.name,
      avatar: profileData.avatar || null,
      isActive: shouldBeActive,
      createdAt: now,
      updatedAt: now
    });
  
  // Return the newly created profile
  return {
    id,
    userId,
    name: profileData.name,
    avatar: profileData.avatar || undefined,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Update a profile
 */
export async function updateProfile(userId: string, profileId: string, profileData: Partial<ProfileData>): Promise<Profile> {
  const now = new Date();
  
  // If setting this profile as active, deactivate all other profiles
  if (profileData.isActive) {
    await db
      .update(profiles)
      .set({ 
        isActive: false,
        updatedAt: now
      })
      .where(and(
        eq(profiles.userId, userId),
        eq(profiles.isActive, true)
      ));
  }
  
  // Update the profile
  await db
    .update(profiles)
    .set({
      ...profileData,
      updatedAt: now
    })
    .where(and(
      eq(profiles.id, profileId),
      eq(profiles.userId, userId)
    ));
  
  // Get the updated profile
  const updatedProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId));
  
  if (updatedProfile.length === 0) {
    throw new Error("Profile not found after update");
  }
  
  return dbProfileToStoreProfile(updatedProfile[0]);
}

/**
 * Delete a profile
 */
export async function deleteProfile(userId: string, profileId: string): Promise<boolean> {
  // Check if this is the last profile
  const userProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  
  if (userProfiles.length === 1 && userProfiles[0].id === profileId) {
    throw new Error("Cannot delete the last profile");
  }
  
  // Check if the profile exists and belongs to the user
  const profileToDelete = userProfiles.find(p => p.id === profileId);
  if (!profileToDelete) {
    throw new Error("Profile not found");
  }
  
  // Delete the profile
  await db
    .delete(profiles)
    .where(and(
      eq(profiles.id, profileId),
      eq(profiles.userId, userId)
    ));
  
  // If we deleted the active profile, set another one as active
  if (profileToDelete.isActive && userProfiles.length > 1) {
    const otherProfile = userProfiles.find(p => p.id !== profileId);
    if (otherProfile) {
      await db
        .update(profiles)
        .set({ 
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, otherProfile.id));
    }
  }
  
  return true;
}

/**
 * Set a profile as active
 */
export async function setActiveProfile(userId: string, profileId: string): Promise<Profile> {
  const now = new Date();
  
  // Deactivate all profiles
  await db
    .update(profiles)
    .set({ 
      isActive: false,
      updatedAt: now
    })
    .where(eq(profiles.userId, userId));
  
  // Activate the selected profile
  await db
    .update(profiles)
    .set({ 
      isActive: true,
      updatedAt: now
    })
    .where(and(
      eq(profiles.id, profileId),
      eq(profiles.userId, userId)
    ));
  
  // Get the updated profile
  const updatedProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId));
  
  if (updatedProfile.length === 0) {
    throw new Error("Profile not found after update");
  }
  
  return dbProfileToStoreProfile(updatedProfile[0]);
}

/**
 * Get or create a guest profile
 */
export function getGuestProfile(): Profile {
  const guestProfile = getOrCreateGuestProfile();
  return guestProfileToStoreProfile(guestProfile);
}

/**
 * Update a guest profile
 */
export function updateGuestProfile(profileData: Partial<ProfileData>): Profile {
  const guestProfile = getOrCreateGuestProfile();
  
  if (profileData.name) {
    guestProfile.name = profileData.name;
  }
  
  if (profileData.avatar !== undefined) {
    guestProfile.avatar = profileData.avatar || undefined;
  }
  
  saveGuestProfile(guestProfile);
  return guestProfileToStoreProfile(guestProfile);
}

/**
 * Migrate guest profile to authenticated user
 */
export async function migrateGuestProfile(userId: string): Promise<Profile> {
  const guestProfile = getOrCreateGuestProfile();
  
  // Create a new profile for the authenticated user
  const newProfile = await createProfile(userId, {
    name: guestProfile.name,
    avatar: guestProfile.avatar,
    isActive: true
  });
  
  return newProfile;
}