import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schemas
const profileCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(25, "Name must be 25 characters or less"),
  avatar: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const profileUpdateSchema = z.object({
  id: z.string().min(1, "Profile ID is required"),
  name: z.string().min(1, "Name is required").max(25, "Name must be 25 characters or less").optional(),
  avatar: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const profileDeleteSchema = z.object({
  id: z.string().min(1, "Profile ID is required"),
});

// Helper function to format profile for response
const formatProfile = (profile: any) => ({
  ...profile,
  createdAt: new Date(profile.createdAt).getTime(),
  updatedAt: new Date(profile.updatedAt).getTime()
});

/**
 * GET /api/profiles
 * Get all profiles for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));
    
    return NextResponse.json(userProfiles.map(formatProfile));
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Create a new profile for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }
    
    const { name, avatar, isActive } = validationResult.data;
    const id = generateId();
    const now = new Date();
    
    // Check if user has reached the maximum number of profiles (5)
    const existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));
    
    if (existingProfiles.length >= 5) {
      return NextResponse.json(
        { error: "Maximum number of profiles (5) reached" },
        { status: 400 }
      );
    }
    
    // If this is the first profile or isActive is true, deactivate all other profiles
    if (isActive || existingProfiles.length === 0) {
      await db
        .update(profiles)
        .set({ 
          isActive: false,
          updatedAt: now
        })
        .where(and(
          eq(profiles.userId, session.user.id),
          eq(profiles.isActive, true)
        ));
    }
    
    const shouldBeActive = isActive || existingProfiles.length === 0;
    
    // Insert the new profile
    await db
      .insert(profiles)
      .values({
        id,
        userId: session.user.id,
        name,
        avatar: avatar || null,
        isActive: shouldBeActive,
        createdAt: now,
        updatedAt: now
      });
    
    // Return the newly created profile
    const newProfile = {
      id,
      userId: session.user.id,
      name,
      avatar: avatar || null,
      isActive: shouldBeActive,
      createdAt: now.getTime(),
      updatedAt: now.getTime()
    };
    
    return NextResponse.json(newProfile);
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profiles
 * Update an existing profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }
    
    const { id, ...update } = validationResult.data;
    const now = new Date();
    
    // Verify the profile exists and belongs to the user
    const profileExists = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(
        eq(profiles.id, id),
        eq(profiles.userId, session.user.id)
      ));
    
    if (profileExists.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // If setting this profile as active, deactivate all other profiles
    if (update.isActive) {
      await db
        .update(profiles)
        .set({ 
          isActive: false,
          updatedAt: now
        })
        .where(and(
          eq(profiles.userId, session.user.id),
          eq(profiles.isActive, true),
          not(eq(profiles.id, id))
        ));
    }
    
    // Update the profile
    await db
      .update(profiles)
      .set({
        ...update,
        updatedAt: now
      })
      .where(and(
        eq(profiles.id, id),
        eq(profiles.userId, session.user.id)
      ));
    
    // Get the updated profile
    const updatedProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id));
    
    if (updatedProfile.length === 0) {
      return NextResponse.json({ error: "Profile not found after update" }, { status: 404 });
    }
    
    return NextResponse.json(formatProfile(updatedProfile[0]));
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles
 * Delete a profile
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileDeleteSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }
    
    const { id } = validationResult.data;
    
    // Check if this is the last profile
    const userProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));
    
    if (userProfiles.length === 1 && userProfiles[0].id === id) {
      return NextResponse.json(
        { error: "Cannot delete the last profile" },
        { status: 400 }
      );
    }
    
    // Check if the profile exists and belongs to the user
    const profileToDelete = userProfiles.find(p => p.id === id);
    if (!profileToDelete) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // Delete the profile
    await db
      .delete(profiles)
      .where(and(
        eq(profiles.id, id),
        eq(profiles.userId, session.user.id)
      ));
    
    // If we deleted the active profile, set another one as active
    if (profileToDelete.isActive && userProfiles.length > 1) {
      const otherProfile = userProfiles.find(p => p.id !== id);
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
    
    return NextResponse.json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}