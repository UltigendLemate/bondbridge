import React, { useEffect, useState } from "react";
import Profile from "@/components/Profile";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { fetchUserProfile } from "@/apis/commonApiCalls/profileApi";
import type { UserProfileData } from "@/apis/apiTypes/profileTypes";
import { useApiCall } from "@/apis/globalCatchError";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [executeProfileFetch, isLoading] = useApiCall(fetchUserProfile);
  
  // Get currentUserId from Redux store instead of localStorage
  const currentUserId = useSelector((state: RootState) => state.currentUser.userId);

  useEffect(() => {
    console.log("userId", userId);
    console.log("userData", userData);
  }, [userId, userData]);

  useEffect(() => {
    const loadUserData = async () => {
      console.log("userId", userId);
      if (!userId) return;
      
      // Use currentUserId from Redux instead of localStorage
      console.log("fetching user data");
      const result = await executeProfileFetch(userId, currentUserId);
      console.log("result", result);
      if (result.success && result.data) {
        setUserData(result.data.data);
      }
    };

    loadUserData();
  }, [userId,currentUserId]); // Added currentUserId to dependency list

  if (isLoading) {
    return (
      <div className="h-[80vh] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userData || !userId) {
    return (
      <div className="h-[80vh] w-full flex items-center justify-center text-muted-foreground">
        User not found
      </div>
    );
  }

  return (
    <>
      <Profile
        userId={userId}
        username={userData.username}
        email={userData.email}
        bio={userData.bio}
        followers={userData.followers}
        following={userData.following}
        avatarSrc={userData.avatarSrc}
        isCurrentUser={userData.isCurrentUser}
        isFollowing={userData.isFollowing}
        isFollower={userData.isFollower}
        requestSent={userData.requestSent}
        compatibility={userData.compatibility}
      />
    </>
  );
};

export default ProfilePage;