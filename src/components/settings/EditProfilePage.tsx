import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setSettingsActive } from '@/store/settingsSlice';
import { updateCurrentUser, updateInterests } from '@/store/currentUserSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, Upload, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { useApiCall } from '@/apis/globalCatchError';
import { updateUserProfile, deleteProfilePicture } from '@/apis/commonApiCalls/profileApi';
import { fetchAvatars } from '@/apis/commonApiCalls/createProfileApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVAILABLE_INTERESTS } from '@/lib/constants';
import { Textarea } from "@/components/ui/textarea";
import { TruncatedList } from '@/components/ui/TruncatedList';
import EmojiPicker from 'emoji-picker-react';
import { rewriteWithBondChat } from '@/apis/commonApiCalls/createPostApi';

// Character limit for bio
const CHARACTER_LIMIT = 150;

interface AvatarData {
  url: string;
  type: string;
}

const EditProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { username, email, mobileNumber, countryCode, avatar, profilePic, interests, privacyLevel, bio } = useAppSelector(
    (state) => state.currentUser
  );

  const [formData, setFormData] = useState({
    username,
    email,
    interests,
    bio: bio || '',
  });

  useEffect(() => {
    setFormData({
      username,
      email,
      interests,
      bio: bio || '',
    });

    // Update custom profile picture preview if needed
    setCustomProfilePicPreview(profilePic && profilePic !== avatar ? profilePic : null);
    setActiveProfileTab(profilePic && profilePic !== avatar ? "custom" : "avatar");
    
  }, [username, email, interests, bio, profilePic, avatar]);

  const [selectedAvatar, setSelectedAvatar] = useState(avatar);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(interests);
  const [customProfilePic, setCustomProfilePic] = useState<File | null>(null);
  const [customProfilePicPreview, setCustomProfilePicPreview] = useState<string | null>(
    profilePic && profilePic !== avatar ? profilePic : null
  );
  const [activeProfileTab, setActiveProfileTab] = useState<string>(
    profilePic && profilePic !== avatar ? "custom" : "avatar"
  );
  const [shouldDeleteProfilePic, setShouldDeleteProfilePic] = useState(false);
  
  const [maleAvatars, setMaleAvatars] = useState<AvatarData[]>([]);
  const [femaleAvatars, setFemaleAvatars] = useState<AvatarData[]>([]);
  
  // Use the useApiCall hook for both API calls
  const [executeUpdateProfile, isUpdatingProfile] = useApiCall(updateUserProfile);
  const [executeFetchAvatars, isLoadingAvatars] = useApiCall(fetchAvatars);
  const [executeDeleteProfilePic] = useApiCall(deleteProfilePicture);
  const [executeRewriteWithBondChat, isRewritingWithBondChat] = useApiCall(rewriteWithBondChat);

  const [activeTab, setActiveTab] = useState<string>("female");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [rewriteError, setRewriteError] = useState<string>("");

  // Add useEffect to fetch avatars
  useEffect(() => {
    const getAvatars = async () => {
      const result = await executeFetchAvatars();
      
      if (result.success && result.data) {
        const { male, female } = result.data;
        
        if (male && male.length > 0) {
          setMaleAvatars(male);
        }
        
        if (female && female.length > 0) {
          setFemaleAvatars(female);
        }
        
        // Determine which tab should be active based on current avatar
        if (avatar) {
          const isMaleAvatar = male.some((item: AvatarData) => item.url === avatar);
          const isFemaleAvatar = female.some((item: AvatarData) => item.url === avatar);
          
          if (isMaleAvatar) {
            setActiveTab("male");
          } else if (isFemaleAvatar) {
            setActiveTab("female");
          }
          // If avatar doesn't match any in the lists, keep default tab
        }
      }
    };
    
    getAvatars();
    
    // Ensure user has at least 3 interests when component mounts
    if (selectedInterests.length < 3) {
      // Add random interests from available interests until we have at least 3
      const interestsToAdd = [...selectedInterests];
      const availableToAdd = AVAILABLE_INTERESTS.filter(
        interest => !interestsToAdd.includes(interest)
      );
      
      while (interestsToAdd.length < 3 && availableToAdd.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableToAdd.length);
        interestsToAdd.push(availableToAdd[randomIndex]);
        availableToAdd.splice(randomIndex, 1);
      }
      
      setSelectedInterests(interestsToAdd);
    }
  }, []);
  
  // Add useEffect to handle clicks outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        emojiButtonRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Capitalize first letter of username
    if (name === 'username' && value.length > 0) {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData({
        ...formData,
        [name]: capitalizedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleAddInterest = (interest: string) => {
    if (!selectedInterests.includes(interest) && interest.trim() !== "") {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    // Prevent removing if it would result in less than 3 interests
    if (selectedInterests.length <= 3) {
      toast.error('You must have at least 3 interests');
      return;
    }
    const newInterests = selectedInterests.filter((i) => i !== interest);
    setSelectedInterests(newInterests);
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setCustomProfilePic(file);
      setActiveProfileTab("custom");
    }
  };

  const handleDeleteProfilePic = () => {
    if (activeProfileTab === "custom") {
      // Clear custom profile pic
      setCustomProfilePic(null);
      setCustomProfilePicPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Set the flag to delete the profile picture when saving
      setShouldDeleteProfilePic(true);
      toast.success('Profile picture will be deleted when you save changes');
    }
  };

  // Function to handle emoji selection
  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    setFormData({
      ...formData,
      bio: formData.bio + emojiData.emoji,
    });
    setShowEmojiPicker(false);
  };

  // Function to handle rewriting bio with BondChat
  const handleRewriteWithBondChat = async () => {
    // Clear any previous error
    setRewriteError("");
    
    // Only proceed if there's content to rewrite
    if (!formData.bio.trim()) {
      setRewriteError("Please add some text to rewrite");
      return;
    }

    // Execute the API call with error handling
    const { data, success } = await executeRewriteWithBondChat(formData.bio);

    if (success && data) {
      // Update the content with the rewritten text
      setFormData({
        ...formData,
        bio: data.rewritten
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least 3 interests are selected
    if (selectedInterests.length < 3) {
      toast.error('Please select at least 3 interests');
      return;
    }
    
    // Check bio character count
    const bioCharacterCount = formData.bio.length;
    if (bioCharacterCount > CHARACTER_LIMIT) {
      toast.error(`Bio cannot exceed ${CHARACTER_LIMIT} characters`);
      return;
    }

    // If shouldDeleteProfilePic is true, call the delete profile picture API
    if (shouldDeleteProfilePic) {
      const deleteResult = await executeDeleteProfilePic();
      if (deleteResult.success) {
        // Update Redux store immediately
        dispatch(updateCurrentUser({ profilePic: "" }));
        toast.success('Profile picture deleted successfully');
      } else {
        toast.error('Failed to delete profile picture');
        return;
      }
    }
    
    // Prepare the request data
    const profileData: {
      name: string;
      interests: string[];
      privacyLevel: number;
      bio: string;
      avatar?: string;
      image?: File;
    } = {
      name: formData.username,
      interests: selectedInterests,
      privacyLevel: privacyLevel ?? 0,
      bio: formData.bio
    };

    // Add either the avatar or custom profile pic based on active tab
    if (activeProfileTab === "avatar") {
      profileData.avatar = selectedAvatar;
    } else {
      if (customProfilePic) {
        profileData.image = customProfilePic;
      }
    }
    
    const { data, success } = await executeUpdateProfile(profileData);

    console.log("data: ", data);

    if (success && data) {
      // Update Redux store with appropriate profile picture data
      const updatedUserData: {
        username: string;
        bio: string;
        profilePic?: string;
        avatar?: string;
      } = {
        username: formData.username,
        bio: formData.bio,
      };

      if(data.user && data.user.profilePic) {
        updatedUserData.profilePic = data.user.profilePic;
      }

      // If we're using a custom profile pic, the backend will return the URL
      if (activeProfileTab === "custom" && data.user?.profilePic && !shouldDeleteProfilePic && data.user.privacyLevel == 0) {
        updatedUserData.profilePic = data.user.profilePic;
      } else if (activeProfileTab === "avatar") {
        updatedUserData.avatar = selectedAvatar;
      }
      
      dispatch(updateCurrentUser(updatedUserData));
      dispatch(updateInterests(selectedInterests));
      toast.success('Profile updated successfully');
      
      // Reset the delete flag after successful update
      if (shouldDeleteProfilePic) {
        setShouldDeleteProfilePic(false);
      }
    }
  };

  const availableInterestsFiltered = AVAILABLE_INTERESTS.filter(
    (interest) => !selectedInterests.includes(interest)
  );

  const handleCloseSettings = () => {
    dispatch(setSettingsActive(false));
  };
  
  const renderAvatarGrid = (avatars: AvatarData[], type: string) => {
    return (
      <div className="grid grid-cols-5 gap-4 p-1">
        {avatars.map((avatarItem, index) => {
          const avatarUrl = avatarItem.url;
          
          return (
            <div 
              key={`${type}-${index}`}
              className={`relative cursor-pointer rounded-lg border-2 w-full h-full aspect-square ${
                selectedAvatar === avatarUrl && activeProfileTab === "avatar"
                  ? 'border-primary bg-muted' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => {
                handleAvatarSelect(avatarUrl);
                setActiveProfileTab("avatar");
              }}
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={avatarUrl} alt={`${type} Avatar ${index + 1}`} />
              </Avatar>
              {selectedAvatar === avatarUrl && activeProfileTab === "avatar" && (
                <div className="absolute -top-2 -right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">
        <ArrowLeft
          className="h-4 w-4 mr-2 inline cursor-pointer"
          onClick={handleCloseSettings}
        />
        Edit Profile
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Selection */}
        <div className="space-y-4">
          <Label>Profile Picture</Label>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              {activeProfileTab === "custom" && customProfilePicPreview ? (
                <AvatarImage src={customProfilePicPreview} alt="Profile" />
              ) : (
                <AvatarImage src={selectedAvatar} alt="Profile" />
              )}
              <AvatarFallback>
                {username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">
                Choose an avatar or upload your own profile picture
              </p>
            </div>
          </div>

          {/* Profile Picture Type Tabs */}
          <Tabs value={activeProfileTab} onValueChange={setActiveProfileTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent *:rounded-none *:border-transparent *:data-[state=active]:text-foreground">
              <TabsTrigger value="avatar" className="group cursor-pointer">
                <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
                  Avatar
                </span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="group cursor-pointer">
                <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
                  Custom Photo
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="avatar" className="space-y-4 mt-4">
              {isLoadingAvatars ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="female" className="cursor-pointer">Female</TabsTrigger>
                    <TabsTrigger value="male" className="cursor-pointer">Male</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 max-h-[40vh] overflow-y-auto p-1">
                    <TabsContent value="female" className="space-y-4">
                      {femaleAvatars.length > 0 ? (
                        renderAvatarGrid(femaleAvatars, "female")
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No female avatars available</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="male" className="space-y-4">
                      {maleAvatars.length > 0 ? (
                        renderAvatarGrid(maleAvatars, "male")
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No male avatars available</p>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              )}
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 border-border">
                {customProfilePicPreview ? (
                  <div className="relative">
                    <div 
                      className="relative w-36 h-36 rounded-full cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img 
                        src={customProfilePicPreview} 
                        alt="Custom profile" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                      {/* Hover overlay with upload icon */}
                      <div className="absolute inset-0 bg-background/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-8 w-8 text-foreground" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteProfilePic}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-destructive hover:bg-destructive-foreground cursor-pointer rounded-full flex items-center justify-center text-white"
                      title="Delete custom photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop or click to upload
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select Photo
                    </Button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={privacyLevel == 1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={mobileNumber ? `+${countryCode} ${mobileNumber}` : ''}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <div className="relative">
              {isRewritingWithBondChat ? (
                <div className="min-h-[100px] border rounded-md px-3 py-2 relative bg-background">
                  <div className="w-full animate-pulse pb-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-4 bg-muted opacity-40 rounded mb-2 w-3/4 mx-auto"></div>
                    <div className="h-4 bg-muted opacity-40 rounded mb-2 w-5/6 mx-auto"></div>
                    <div className="h-4 bg-muted opacity-40 rounded w-2/3 mx-auto"></div>
                  </div>
                </div>
              ) : (
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px] pb-12"
                />
              )}
              <div className="absolute right-2 bottom-2 flex gap-2 z-10 bg-background p-1 rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1 cursor-pointer border-2 border-primary bg-background"
                  onClick={handleRewriteWithBondChat}
                  disabled={isRewritingWithBondChat}
                >
                  {isRewritingWithBondChat ? (
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                      <span className="text-foreground border-primary">
                        Rewriting...
                      </span>
                    </div>
                  ) : (
                    <>
                      <img src="/bondchat.svg" alt="BondChat" className="w-4 h-4" />
                      <div className="text-foreground">
                        Re-write with{" "}
                        <span className="grad font-bold">BondChat </span>
                      </div>
                    </>
                  )}
                </Button>
                <Button
                  ref={emojiButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </div>
              {rewriteError && (
                <p className="text-destructive font-bold text-xs mt-1">{rewriteError}</p>
              )}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute right-0 bottom-14 z-50"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <span className={`text-xs ${formData.bio.length > CHARACTER_LIMIT ? 'text-destructive' : 'text-muted-foreground'}`}>
                {formData.bio.length}/{CHARACTER_LIMIT} characters
              </span>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <Label>Interests</Label>

          <TruncatedList
            items={selectedInterests}
            limit={10}
            className="mb-4"
            itemsContainerClassName="flex flex-wrap gap-2 overflow-y-auto"
            emptyMessage="No interests selected yet"
            buttonClassName="text-foreground text-xs mt-2 cursor-pointer hover:underline"
            renderItem={(interest, index) => (
              <Badge key={`interest-${index}`} variant="secondary" className="flex items-center gap-1">
                {interest}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveInterest(interest);
                  }}
                  className="ml-1 focus:outline-none"
                >
                  <X className="h-3 w-3 cursor-pointer" />
                </button>
              </Badge>
            )}
          />

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Suggested interests:
            </p>  
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[20vh]">
              {availableInterestsFiltered.map((interest) => (
                <Badge 
                  key={`suggested-interest-${interest}`} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => handleAddInterest(interest)}
                >
                  + {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isUpdatingProfile} className="cursor-pointer">
          {isUpdatingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default EditProfilePage;