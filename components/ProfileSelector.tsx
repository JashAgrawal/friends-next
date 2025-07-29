"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Loader2, Plus, Trash, User, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserStore } from "@/store";
import { getOrCreateGuestProfile, saveGuestProfile } from "@/lib/localStorage-utils";
import { toast } from "sonner";
import Image from "next/image";

// Avatar options for profile creation/editing
const AVATAR_OPTIONS = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
  "/avatars/avatar-5.png",
  "/avatars/avatar-6.png",
  "/avatars/avatar-7.png",
  "/avatars/avatar-8.png",
];

export interface UserProfile {
  id: string;
  userId?: string; // Optional for guest profiles
  name: string;
  avatar?: string | null;
  isActive?: boolean;
  createdAt?: Date | number;
  updatedAt?: Date | number;
}

interface ProfileSelectorProps {
  onProfileSelected?: () => void;
  maxProfiles?: number;
  showManageButton?: boolean;
  redirectAfterSelection?: boolean;
}

const ProfileSelector = ({
  onProfileSelected,
  maxProfiles = 5,
  showManageButton = true,
  redirectAfterSelection = true,
}: ProfileSelectorProps) => {
  const { isAuthenticated } = useAuth();
  const { setCurrentProfile, setProfiles: setStoreProfiles } = useUserStore();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch profiles from API or localStorage
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const res = await fetch("/api/profiles");
        if (res.ok) {
          const data = await res.json();
          setProfiles(data);
          setStoreProfiles(data);
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to fetch profiles");
        }
      } else {
        // For guest users, get profile from localStorage
        const guestProfile = getOrCreateGuestProfile();
        setProfiles([{
          id: guestProfile.id,
          name: guestProfile.name,
          avatar: guestProfile.avatar,
          isActive: true
        }]);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleOpenModal = (profile?: UserProfile) => {
    if (profile) {
      // Edit mode
      setSelectedProfile(profile);
      setProfileName(profile.name);
      setSelectedAvatar(profile.avatar || null);
      setIsEditMode(true);
    } else {
      // Create mode
      setSelectedProfile(null);
      setProfileName("");
      setSelectedAvatar(null);
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
    setProfileName("");
    setSelectedAvatar(null);
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Profile name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      if (isAuthenticated) {
        // Handle authenticated user profiles via API
        const endpoint = "/api/profiles";
        const method = isEditMode ? "PATCH" : "POST";
        const body: any = {
          name: profileName,
          avatar: selectedAvatar
        };

        if (isEditMode && selectedProfile) {
          body.id = selectedProfile.id;
        }

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          toast.success(isEditMode ? "Profile updated" : "Profile created");
          handleCloseModal();
          fetchProfiles();
        } else {
          const error = await res.json();
          toast.error(error.error || `Failed to ${isEditMode ? "update" : "create"} profile`);
        }
      } else {
        // Handle guest profile via localStorage
        const guestProfile = getOrCreateGuestProfile();
        guestProfile.name = profileName;
        guestProfile.avatar = selectedAvatar || undefined;
        saveGuestProfile(guestProfile);
        
        toast.success(isEditMode ? "Profile updated" : "Profile created");
        handleCloseModal();
        fetchProfiles();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} profile`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profile: UserProfile) => {
    if (!isAuthenticated && profiles.length <= 1) {
      toast.error("Cannot delete the only guest profile");
      return;
    }

    setIsDeleting(true);
    try {
      if (isAuthenticated) {
        const res = await fetch("/api/profiles", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: profile.id }),
        });

        if (res.ok) {
          toast.success("Profile deleted");
          fetchProfiles();
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to delete profile");
        }
      } else {
        // For guest users, we don't actually delete but just reset the name
        const guestProfile = getOrCreateGuestProfile();
        guestProfile.name = "Guest";
        guestProfile.avatar = undefined;
        saveGuestProfile(guestProfile);
        
        toast.success("Profile reset to default");
        fetchProfiles();
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectProfile = async (profile: UserProfile) => {
    if (isManageMode) return;
    
    setLoading(true);
    try {
      if (isAuthenticated) {
        const res = await fetch("/api/profiles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: profile.id, isActive: true }),
        });

        if (res.ok) {
          const updatedProfile = await res.json();
          setCurrentProfile(updatedProfile);
          
          if (onProfileSelected) {
            onProfileSelected();
          } else if (redirectAfterSelection) {
            window.location.href = "/";
          }
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to select profile");
        }
      } else {
        // For guest users, just update the current profile in store
        setCurrentProfile({
          id: profile.id,
          userId: 'guest',
          name: profile.name,
          avatar: profile.avatar || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        if (onProfileSelected) {
          onProfileSelected();
        } else if (redirectAfterSelection) {
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Error selecting profile:", error);
      toast.error("Failed to select profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">
        {isManageMode ? "Manage Profiles" : "Who's watching?"}
      </h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
        {profiles.map((profile) => (
          <div key={profile.id} className="relative flex flex-col items-center group">
            <button
              onClick={() => isManageMode ? handleOpenModal(profile) : handleSelectProfile(profile)}
              className={`w-28 h-28 rounded-md overflow-hidden transition-all duration-200 mb-3 flex items-center justify-center
                ${isManageMode ? 'border-4 border-gray-600 opacity-75' : 'hover:border-2 hover:border-white'}`}
              aria-label={isManageMode ? `Edit ${profile.name}` : `Select ${profile.name}`}
              disabled={loading}
            >
              <Avatar className="w-full h-full rounded-none">
                {profile.avatar ? (
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                ) : (
                  <AvatarFallback className="text-4xl bg-gray-700 w-full h-full rounded-none">
                    {profile.name[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {isManageMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <Edit size={24} className="text-white" />
                </div>
              )}
            </button>
            
            <span className="text-gray-300 group-hover:text-white text-lg">
              {profile.name}
            </span>
            
            {isManageMode && (
              <button
                onClick={() => handleDeleteProfile(profile)}
                className="mt-2 flex items-center text-sm text-red-500 hover:text-red-400"
                disabled={isDeleting || (!isAuthenticated && profiles.length <= 1)}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin mr-1" /> : <Trash size={16} className="mr-1" />}
                Delete
              </button>
            )}
          </div>
        ))}
        
        {isAuthenticated && profiles.length < maxProfiles && (
          <div className="flex flex-col items-center">
            <button
              className={`w-28 h-28 bg-gray-800 rounded-md flex items-center justify-center border-2 border-gray-600 border-dashed hover:border-gray-400 transition-all duration-200 mb-3
                ${isManageMode ? 'opacity-75' : ''}`}
              onClick={() => handleOpenModal()}
              disabled={loading}
              aria-label="Add profile"
            >
              <Plus size={40} className="text-gray-400" />
            </button>
            <span className="text-gray-400">Add Profile</span>
          </div>
        )}
      </div>
      
      {showManageButton && profiles.length > 0 && (
        <Button
          variant={isManageMode ? "default" : "outline"}
          onClick={toggleManageMode}
          className="min-w-[150px]"
          disabled={loading}
        >
          {isManageMode ? "Done" : "Manage Profiles"}
        </Button>
      )}
      
      {/* Profile Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 text-white rounded-lg p-8 max-w-md w-full shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={handleCloseModal}
              aria-label="Close"
              disabled={loading}
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">
              {isEditMode ? "Edit Profile" : "Create Profile"}
            </h2>
            
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                {selectedAvatar ? (
                  <AvatarImage src={selectedAvatar} alt="Selected avatar" />
                ) : (
                  <AvatarFallback className="text-4xl bg-gray-700">
                    {profileName ? profileName[0].toUpperCase() : <User />}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <Input
                placeholder="Profile Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-gray-800 border-gray-700 mb-6"
                maxLength={25}
                disabled={loading}
              />
              
              <div className="w-full">
                <h3 className="text-lg mb-3">Choose an avatar:</h3>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-16 h-16 rounded-md overflow-hidden transition-all duration-200
                        ${selectedAvatar === avatar ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                      disabled={loading}
                    >
                      <Image src={avatar} alt="Avatar option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedAvatar(null)}
                    className={`w-16 h-16 rounded-md overflow-hidden bg-gray-700 flex items-center justify-center
                      ${selectedAvatar === null ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                    disabled={loading}
                  >
                    <User size={32} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSaveProfile}
                className="flex-1"
                disabled={loading || !profileName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditMode ? "Update Profile" : "Create Profile"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && !isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 size={48} className="animate-spin text-red-600" />
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;