import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setSettingsActive } from '@/store/settingsSlice';
import { updateCurrentUser, updateInterests } from '@/store/currentUserSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useApiCall } from '@/apis/globalCatchError';
import { updateUserProfile } from '@/apis/commonApiCalls/profileApi';
import { fetchAvatars } from '@/apis/commonApiCalls/createProfileApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVAILABLE_INTERESTS } from '@/lib/constants';
import { Textarea } from "@/components/ui/textarea";

interface AvatarData {
  url: string;
  type: string;
}

const EditProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { username, email, avatar, interests, privacyLevel, bio } = useAppSelector(
    (state) => state.currentUser
  );

  const [formData, setFormData] = useState({
    username,
    email,
    interests,
    bio: bio || '',
  });

  const [selectedAvatar, setSelectedAvatar] = useState(avatar);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(interests);
  
  const [maleAvatars, setMaleAvatars] = useState<AvatarData[]>([]);
  const [femaleAvatars, setFemaleAvatars] = useState<AvatarData[]>([]);
  
  // Use the useApiCall hook for both API calls
  const [executeUpdateProfile, isUpdatingProfile] = useApiCall(updateUserProfile);
  const [executeFetchAvatars, isLoadingAvatars] = useApiCall(fetchAvatars);

  const [activeTab, setActiveTab] = useState<string>("female");

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
  }, []);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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
    const newInterests = selectedInterests.filter((i) => i !== interest);
    setSelectedInterests(newInterests);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure we have a valid avatar URL before sending
    if (!selectedAvatar) {
      console.warn('No avatar selected, using default avatar');
    }
    
    // Prepare the request data
    const profileData = {
      name: formData.username,
      email: formData.email,
      interests: selectedInterests,
      privacyLevel: privacyLevel ?? 0,
      avatar: selectedAvatar,
      bio: formData.bio
    };
    
    const { data, success } = await executeUpdateProfile(profileData);

    if (success && data) {
      console.log('✅ API call successful, data:', data);
      // Update Redux store
      dispatch(
        updateCurrentUser({
          username: formData.username,
          email: formData.email,
          avatar: selectedAvatar,
          bio: formData.bio
        })
      );
      dispatch(updateInterests(selectedInterests));
      toast.success('Profile updated successfully');
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
                selectedAvatar === avatarUrl 
                  ? 'border-primary bg-muted' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => handleAvatarSelect(avatarUrl)}
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={avatarUrl} alt={`${type} Avatar ${index + 1}`} />
              </Avatar>
              {selectedAvatar === avatarUrl && (
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
          className="h-4 w-4 mr-2 inline"
          onClick={handleCloseSettings}
        />
        Edit Profile
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Selection */}
        <div className="space-y-4">
          <Label>Profile Picture</Label>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={selectedAvatar} alt="Profile" />
              <AvatarFallback>
                {username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">
                Choose an Avatar that represents you
              </p>
            </div>
          </div>
          
          {isLoadingAvatars ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 ">
                <TabsTrigger value="female" className="cursor-pointer">Female</TabsTrigger>
                <TabsTrigger value="male" className="cursor-pointer">Male</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 max-h-[50vh] overflow-y-auto p-1">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <Label>Interests</Label>

          <div className="flex flex-wrap gap-2 mb-4 overflow-y-auto max-h-[20vh]">
            {selectedInterests.map((interest, index) => (
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
            ))}
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Suggested interests:
            </p>  
            <div className="flex flex-wrap gap-2 overflow-y-auto h-[20vh]">
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