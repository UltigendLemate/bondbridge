import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import SidebarAvatar from "./profile/SidebarAvatar";
import Navbar from "./Navbar";
import { useAppDispatch, useAppSelector } from "@/store";
import ChatInterface from "./activity/ChatInterface";
import { setActiveChat } from "@/store/chatSlice";
import { Link } from "react-router-dom";
import { fetchUserProfile } from "@/apis/commonApiCalls/profileApi";
import { getSuggestedUsers } from "@/apis/commonApiCalls/homepageApi";
import { SuggestedUser } from "@/apis/apiTypes/response";
import SettingLayout from "./settings/SettingLayout";
import LeftSidebar from "./auth/LeftSidebar";
import { updateCurrentUser } from "@/store/currentUserSlice";
import { SidebarProfileSkeleton, SidebarPeopleSkeleton } from "./skeletons/SidebarProfileSkeleton";
import { Toaster } from "./ui/sonner";
import { useApiCall } from "@/apis/globalCatchError";
import CommunityFeed from "./activity/CommunityFeed";
import { TruncatedText } from "./ui/TruncatedText";
import MobileAppDownload from "./MobileAppDownload";
import FollowingFollowers from "./FollowingFollowers";

interface LayoutProps {
  children: React.ReactNode;
  showSidebars?: boolean; // Flag to control sidebar visibility
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebars = false,
  className,
}) => {
  const dispatch = useAppDispatch();
  const activeChat = useAppSelector((state) => state.chat.activeChat);
  const currentUserId = localStorage.getItem("userId") || "";
  const currentUser = useAppSelector((state) => state.currentUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [fetchSuggestedUsers, isLoadingSuggested] = useApiCall(getSuggestedUsers);

  // Mobile detection - check for cookie to override
  const [useWebVersion, setUseWebVersion] = useState(false);
  
  useEffect(() => {
    // Check for cookie that allows mobile users to use the web version
    const hasWebVersionCookie = document.cookie.split(';').some(item => item.trim().startsWith('useWebVersion='));
    setUseWebVersion(hasWebVersionCookie);
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      setIsLoadingProfile(true);
      const result = await fetchUserProfile(currentUserId, currentUserId);
      if (result.success) {
        dispatch(
          updateCurrentUser({
            profilePic: result.data.profilePic,
            username: result.data.username,
            nickname: result.data.nickName,
            email: result.data.email,
            avatar: result.data.avatarSrc,
            bio: result.data.bio,
            privacyLevel: result.data.privacyLevel,
          })
        );
      }
      setIsLoadingProfile(false);
    };
    const location = window.location.pathname;
    const isAuthRoute = location === '/login' || location === '/signup';
    
    if (!isAuthRoute) {
      if (!currentUser.username) {
        loadCurrentUser();
      } else {
        setIsLoadingProfile(false);
      }
    } else {
      setIsLoadingProfile(false);
    }
  }, [currentUserId, dispatch,currentUser.username]);

  useEffect(() => {
    const loadSuggestedUsers = async () => {
      const result = await fetchSuggestedUsers();
      if (result.success && result.data && result.data.users) {
        setSuggestedUsers(result.data.users);
      }
    };

    const location = window.location.pathname;
    const isAuthRoute = location === '/login' || location === '/signup';

    if (!isAuthRoute) {
      loadSuggestedUsers();
    }
  }, [currentUserId]);

  const isSettingsActive = useAppSelector(
    (state) => state.settings.isSettingsActive
  );

  // Convert suggested users to format needed for sidebar
  const sidebarUsers = suggestedUsers
    .filter(user => user._id !== currentUserId)
    .map(user => ({
      id: user._id,
      username: user.name,
      avatarSrc: user.profilePic || user.avatar,
    }));

  const handleCloseChat = () => {
    dispatch(setActiveChat(null));
  };

  return (
    <>
    {!useWebVersion && (
      <div className="md:hidden">
        <MobileAppDownload />
      </div>
    )}
    <div className={`flex-col overflow-hidden h-screen w-screen overflow-x-hidden ${!useWebVersion ? 'hidden md:flex' : 'flex'}`}>
      <Toaster/>
      {/* Navbar */}
      <Navbar />

      {showSidebars ? (
        <div className="grid lg:grid-cols-12 w-full">
          {/* Left Sidebar */}
          <LeftSidebar />
          <div className="flex col-span-10">
            {/* Main Content */}
            <div
              className={`border-r w-full border-border p-10 overflow-y-auto app-scrollbar bg-background h-[calc(100vh-64px)] ${className}`}
            >
              {children}
            </div>

            {/* Right Sidebar */}
            {isSettingsActive ? (
              <div className="min-w-2/5 max-w-2/5">
                <SettingLayout />
              </div>
            ) : activeChat ? (
              <div className="min-w-2/5 max-w-2/5">
                {activeChat.type === "community" ? (
                  <CommunityFeed onBack={() => dispatch(setActiveChat(null))} />
                ) : (
                  <ChatInterface
                    chatId={activeChat.id}
                    name={activeChat.name}
                    avatar={activeChat.avatar}
                    onClose={handleCloseChat}
                  />
                )}
              </div>
            ) : (
              <div className="p-5 w-1/2 px-12 space-y-6 *:rounded-xl overflow-y-auto h-[calc(100vh-64px)] app-scrollbar">
                {isLoadingProfile ? (
                  // Show skeleton loaders when loading
                  <>
                    <SidebarProfileSkeleton />
                    <SidebarPeopleSkeleton />
                  </>
                ) : (
                  // Show actual content when loaded
                  <>
                    <div className="p-4 border-2 border-sidebar-border">
                      <div className="flex flex-col items-center">
                        <Link to={`/profile/${currentUserId}`}>
                          <img
                            src={currentUser?.profilePic || currentUser?.avatar}
                            alt="Profile"
                            className="w-20 h-20 rounded-full mb-2 border-2 border-sidebar-border object-cover"
                          />
                        </Link>
                        <h3 className="font-semibold text-xl text-sidebar-foreground truncate max-w-full">
                          {currentUser?.username || "Loading..."}
                        </h3>
                        <TruncatedText 
                          text={currentUser?.bio} 
                          limit={40}
                          className="text-sidebar-foreground/60 text-center break-words w-full overflow-hidden"
                          showToggle={false}
                        />
                        <Link to={`/profile/${currentUserId}`}>
                          <Button
                            variant={"outline"}
                            className="mt-2 cursor-pointer text-sidebar-primary text-sm font-medium border-primary w-full"
                          >
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="p-4 border-2 border-sidebar-border max-h-[38vh] overflow-y-auto app-scrollbar">
                      <div>
                        <FollowingFollowers sidebar={true} />
                      </div>
                    </div>

                    <div className="p-6 border-2 overflow-y-auto max-h-[52vh] app-scrollbar">
                      <h3 className="font-semibold  mb-4 text-sidebar-foreground text-center">
                        Suggested Friends
                      </h3>
                      {isLoadingSuggested ? (
                        <SidebarPeopleSkeleton />
                      ) : sidebarUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-justify">
                          <p className="text-sidebar-foreground/70 mb-3">No suggested people found</p>
                          <p className="text-sidebar-foreground/60 text-sm">
                            Add interests to your profile to view suggested people in the settings page
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {sidebarUsers.map((user) => (
                            <SidebarAvatar
                              key={user.id}
                              id={user.id}
                              username={user.username}
                              avatarSrc={user.avatarSrc}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Main content without sidebars */
        <main className="flex-grow">{children}</main>
      )}
    </div>
    </>
  );
};

export default Layout;
