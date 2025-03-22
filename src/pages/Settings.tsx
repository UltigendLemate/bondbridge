import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setActivePage,
  setSettingsActive,
  SettingPage,
} from "@/store/settingsSlice";
import { updateCurrentUser, setPrivacyLevel } from "@/store/currentUserSlice";
import {
  fetchUserProfile,
  updateUserProfile,
} from "@/apis/commonApiCalls/profileApi";
import { Loader2 } from "lucide-react";
import { useApiCall } from "@/apis/globalCatchError";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();
  const [executeUpdateProfile] = useApiCall(updateUserProfile);
  const navigate = useNavigate();

  // Get user data from Redux store
  const { username, nickname, email, avatar, privacyLevel, interests } =
    useAppSelector((state) => state.currentUser);

  const handleSettingsClick = (page: SettingPage) => {
    dispatch(setSettingsActive(true));
    dispatch(setActivePage(page));
  };

  const handleAnonymousToggle = async (checked: boolean) => {
    const newPrivacyLevel = checked ? 1 : 0;

    // Optimistically update the UI
    dispatch(setPrivacyLevel(newPrivacyLevel));

    // Prepare the request data
    const profileData = {
      name: username,
      email,
      interests: interests,
      privacyLevel: newPrivacyLevel,
      avatar,
    };

    // Execute the API call
    const { success } = await executeUpdateProfile(profileData);

    if (!success) {
      // If the request fails, revert the change
      dispatch(setPrivacyLevel(privacyLevel));
      toast.error("Failed to update anonymous mode");
    } else {
      dispatch(
        updateCurrentUser({
          username: nickname,
        })
      );
    }
  };

  useEffect(() => {
    // Fetch current user data and update Redux store
    const loadCurrentUser = async () => {
      setIsLoading(true);
      try {
        const currentUserId = localStorage.getItem("userId") || "";
        if (currentUserId) {
          const result = await fetchUserProfile(currentUserId, currentUserId);
          if (result.success && result.data) {
            // Update Redux store with actual user data
            dispatch(
              updateCurrentUser({
                username: result.data.username,
                nickname: result.data.nickName,
                email: result.data.email,
                avatar: result.data.avatarSrc,
                privacyLevel: result.data.privacyLevel,
                bio: result.data.bio,
                interests: result.data.interests,
              })
            );
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();

    // Deactivate settings sidebar when component unmounts
    return () => {
      dispatch(setSettingsActive(false));
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center p-4 ">
        <div onClick={() => navigate(-1)} className="mr-4 cursor-pointer">
          <ArrowLeft className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold flex-1">Settings</h1>
        <div className="flex items-center gap-2">
          <span>Go Anonymous</span>
          <Switch
            checked={privacyLevel == 1}
            onCheckedChange={handleAnonymousToggle}
          />
        </div>
      </div>

      {/* Profile Section */}
      {isLoading ? (
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-4 flex items-center gap-4 ">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar || "/profile/user.png"} alt="Profile" />
            <AvatarFallback>{username?.substring(0, 2) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">
              {privacyLevel == 1 ? nickname : username}
            </h2>
            <p className="text-muted-foreground">
              {email || "No email available"}
            </p>
          </div>
        </div>
      )}

      {/* Settings Options */}
      <div className="flex-1">
        <button
          className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer"
          onClick={() => handleSettingsClick("profile")}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span>Profile</span>
        </button>

        <button
          className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer"
          onClick={() => handleSettingsClick("blocked")}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          </div>
          <span>Blocked</span>
        </button>

        <button
          className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer"
          onClick={() => handleSettingsClick("voice")}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
          <span>Voice Settings</span>
        </button>

        <button
          className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer"
          onClick={() => handleSettingsClick("account")}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <span>Account</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
