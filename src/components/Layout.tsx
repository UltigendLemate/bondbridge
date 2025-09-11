import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import SidebarAvatar from "./profile/SidebarAvatar";
import Navbar from "./Navbar";
import { useAppDispatch, useAppSelector } from "@/store";
import ChatInterface from "./activity/ChatInterface";
import { setActiveChat } from "@/store/chatSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import LogoLoader from "./LogoLoader";

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
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const activeChat = useAppSelector((state) => state.chat.activeChat);
  const currentUserId = localStorage.getItem("userId") || "";
  const currentUser = useAppSelector((state) => state.currentUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [fetchSuggestedUsers, isLoadingSuggested] = useApiCall(getSuggestedUsers);
  const location = useLocation();

  const isUserReady = useMemo(() => {
    console.log("currentUser", currentUser);
    return !!currentUser.email;
  }, [currentUser]);

  // Define paths accessible on mobile without the app download prompt
  const publicMobilePaths = ['/login', '/signup', '/setup-profile', '/privacy', '/terms', '/forgot-password'];
  const authNotAllowedPaths = ['/login', '/signup', '/setup-profile', '/forgot-password'];
  const currentPath = location.pathname;
  const isPublicPath = publicMobilePaths.includes(currentPath);
  const isAuthPath = !isPublicPath;
  const isAuthNotAllowedPath = authNotAllowedPaths.includes(currentPath);

  // if localstorage has token and redux does not have current user, then fetch user, otherwise dont.
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
            mobileNumber: result.data.mobileNumber,
            countryCode: result.data.countryCode,
            avatar: result.data.avatarSrc,
            bio: result.data.bio,
            privacyLevel: result.data.privacyLevel,
            userId: result.data.userId,
            followers: result.data.followers,
            following: result.data.following,
            isBlocked: result.data.isBlocked,
            avatarSrc: result.data.avatarSrc,
            statusCode: result.data.statusCode || 0,

          })
        );
      }
      setIsLoadingProfile(false);
    };
    if (isLoggedIn &&!currentUser.userId) {
      loadCurrentUser();
    } else {
      setIsLoadingProfile(false);
    }

  }, [currentUserId, dispatch, currentUser, isLoggedIn]);


  useEffect(() => {
    if (isAuthPath && !isUserReady && !isLoadingProfile) {
      console.log("navigating to setup profile because user is not ready and on auth path");
      navigate("/setup-profile");
    }
  }, [isUserReady, isLoadingProfile]);

  useEffect(() => {
    const loadSuggestedUsers = async () => {
      const result = await fetchSuggestedUsers();
      if (result.success && result.data && result.data.users) {
        setSuggestedUsers(result.data.users);
      }
    };

    const location = window.location.pathname;
    const isAuthRoute = publicMobilePaths.includes(location);

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


  useEffect(() => {
    if (isLoadingProfile) {
      return;
    }
    if (isLoggedIn && isAuthNotAllowedPath) {
      if (!isUserReady) {
        return;
      }
      // Allow access to setup-profile for users who haven't completed profile setup (statusCode 0)
      else if (currentPath === "/setup-profile" && currentUser.statusCode === 0) {
        return;
      }
      else {
        console.log("navigating to home because user is logged in and on auth not allowed path");
        navigate("/");
      }
    }
    if (!isLoggedIn && !isPublicPath) {
      console.log("navigating to login because user is not logged in and not on public mobile path");
      navigate("/login");
    }
    if (!isLoggedIn && currentPath == "/setup-profile") {
      console.log("navigating to login because user is not logged in and on setup profile");
      navigate("/login");
    }
  }, [isLoggedIn, isLoadingProfile, currentPath, isUserReady, currentUser.statusCode]);

  // if (!isLoggedIn && !isPublicPath) {
  //   navigate("/login");
  // }

  return (
    <>
      {!isPublicPath && (
        <div className="md:hidden">
          <MobileAppDownload />
        </div>
      )}
      {isLoadingProfile ? (
        <div className="flex-1 flex items-center justify-center h-screen w-screen">
          <LogoLoader size="lg" opacity={0.8} />
        </div>
      ) : (
        <div className={`flex-col overflow-hidden  w-screen overflow-x-hidden ${!isPublicPath ? 'hidden md:flex h-screen' : 'flex'}`}>
          <Toaster />
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

                        <div className="border-2 border-sidebar-border">
                          <div className="max-h-[45vh] p-4 overflow-y-auto app-scrollbar">
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
                            <ul className="space-y-1">
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
      )}
    </>
  );
};

export default Layout;
