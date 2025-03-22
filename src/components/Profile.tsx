import { useNavigate, Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreeDotsMenu, { 
  BlockMenuItem, 
  ShareMenuItem, 
  ReportMenuItem 
} from "@/components/global/ThreeDotsMenu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AllPosts from "@/components/AllPosts";
import { useEffect, useState } from "react";
import {
  fetchUserPosts,
  updateUserProfile,
} from "@/apis/commonApiCalls/profileApi";
import { sendFriendRequest } from "@/apis/commonApiCalls/friendRequestApi";
import type { UserPostsResponse } from "@/apis/apiTypes/profileTypes";
import { useApiCall } from "@/apis/globalCatchError";
import { toast } from "sonner";
import { startMessage } from "@/apis/commonApiCalls/chatApi";
import { fetchChatRooms, blockUser as blockUserApi } from "@/apis/commonApiCalls/activityApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { ChatRoom } from "@/apis/apiTypes/response";
import {
  ChatItem,
  setActiveChat,
  transformAndSetChats,
} from "@/store/chatSlice";
import { setPrivacyLevel, updateCurrentUser } from "@/store/currentUserSlice";
// import { getStoryForUser } from "@/apis/commonApiCalls/storyApi";
// import type { StoryData } from "@/apis/apiTypes/response";

interface ProfileProps {
  userId: string;
  username: string;
  email: string;
  bio?: string;
  followers: number;
  following: number;
  avatarSrc: string;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  isFollower?: boolean;
  requestSent?: boolean;
  compatibility?: number;
}

const Profile: React.FC<ProfileProps> = ({
  userId,
  username,
  email,
  bio = "",
  followers,
  following,
  avatarSrc,
  isCurrentUser: propsIsCurrentUser = false,
  isFollowing = false,
  isFollower = false,
  requestSent = false,
  compatibility = 0,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [posts, setPosts] = useState<UserPostsResponse["posts"]>([]);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  // const [userStories, setUserStories] = useState<StoryData | null>(null);
  const [localRequestSent, setLocalRequestSent] = useState(requestSent);
  const [executePostsFetch, isLoadingPosts] = useApiCall(fetchUserPosts);
  const [executeSendFriendRequest, isSendingFriendRequest] =
    useApiCall(sendFriendRequest);
  const [executeStartMessage] = useApiCall(startMessage);
  const [executeFetchChats] = useApiCall(fetchChatRooms);
  const [executeUpdateProfile] = useApiCall(updateUserProfile);
  const [executeBlockUser] = useApiCall(blockUserApi);
  // const [executeGetStoryForUser] = useApiCall(getStoryForUser);

  // Get user data from Redux store
  const { privacyLevel, interests, nickname } = useAppSelector(
    (state) => state.currentUser
  );
  
  // Check if current user by comparing with userId in localStorage
  const localStorageUserId = localStorage.getItem("userId");
  const isCurrentUser = userId === localStorageUserId || propsIsCurrentUser;

  useEffect(() => {
    const loadPosts = async () => {
      const result = await executePostsFetch(userId, isCurrentUser);
      if (result.success && result.data) {
        setPosts(result.data.posts);
        console.log("posts", result.data.posts);
      }
    };

    loadPosts();
  }, [userId]);

  // useEffect(() => {
  //   const loadStories = async () => {
  //     const result = await executeGetStoryForUser(userId);
  //     if (result.success && result.data && result.data.stories && result.data.stories.length > 0) {
  //       setUserStories(result.data.stories[0]);
  //     }
  //   };

  //   loadStories();
  // }, [userId]);

  // const handleStoryClick = () => {
  //   if (!userStories) return;

  //   navigate(`/story/${userId}`, {
  //     state: {
  //       currentStory: {
  //         user: userStories.name,
  //         userId: userStories.userId,
  //         avatar: userStories.profilePic,
  //         isLive: userStories.isLive,
  //         hasStory: userStories.hasStory,
  //         stories: userStories.stories,
  //         latestStoryTime: userStories.latestStoryTime
  //       },
  //       allStories: [userStories],
  //       initialUserIndex: 0
  //     }
  //   });
  // };
  useEffect(() => {
    setLocalRequestSent(requestSent);
  }, [requestSent]);

  const handleSendFriendRequest = async () => {
    try {
      console.log("aksh user id", userId);
      const result = await executeSendFriendRequest({ userId: userId });
      if (result.success && result.data) {
        setLocalRequestSent(true);
        toast.success("Friend request sent successfully!");
      } else {
        toast.error(result.data?.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("An error occurred while sending friend request");
    }
  };

  const handleAnonymousToggle = async (checked: boolean) => {
    if (!isCurrentUser) return;

    const newPrivacyLevel = checked ? 1 : 0;

    // Optimistically update the UI
    dispatch(setPrivacyLevel(newPrivacyLevel));

    // Prepare the request data
    const profileData = {
      name: username,
      email,
      bio,
      interests: interests,
      privacyLevel: newPrivacyLevel,
      avatar: avatarSrc,
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

  const handleStartConversation = async () => {
    try {
      setIsMessageLoading(true);
      const result = await executeStartMessage({ userId2: userId });
      if (result.success && result.data) {
        // Refresh the chat list to include the new conversation
        const refreshResult = await executeFetchChats();
        if (refreshResult.success && refreshResult.data) {
          const currentUserId = localStorage.getItem("userId") || "";
          dispatch(
            transformAndSetChats({
              chatRooms: refreshResult.data.chatRooms || [],
              currentUserId,
            })
          );

          // Find the newly created chat and set it as active
          const newChatRoomId = result.data.chatRoom?.chatRoomId;
          if (newChatRoomId && refreshResult.data.chatRooms) {
            const newChat = refreshResult.data.chatRooms.find(
              (chat: ChatRoom) => chat.chatRoomId === newChatRoomId
            );

            if (newChat) {
              // Create a ChatItem directly from the API response
              const chatItem: ChatItem = {
                id: newChatRoomId,
                name: username,
                avatar: avatarSrc,
                lastMessage: "No messages yet",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                unread: false,
                type: "dm",
                participants: newChat.participants.map((p) => ({
                  userId: p.userId,
                  name: p.name,
                  profilePic: p.profilePic,
                })),
              };

              dispatch(setActiveChat(chatItem));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleBlockUser = async () => {
    await executeBlockUser(userId);   
    toast.success(`${username} has been blocked`);
    navigate('/');
    dispatch(setActiveChat(null));
  };

  // Prepare menu items for other profile -> block, share, report
  const menuItems = [
    {
      ...BlockMenuItem,
      onClick: handleBlockUser
    },
    {
      ...ShareMenuItem,
      onClick: () => console.log('Share clicked')
    },
    {
      ...ReportMenuItem,
      onClick: () => console.log('Report clicked')
    }
  ];

  return (
    <div className="mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-0">
        <button onClick={() => navigate(-1)} className="p-1 cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        {isCurrentUser ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">Go Anonymous</span>
            <Switch
              checked={privacyLevel == 1}
              onCheckedChange={handleAnonymousToggle}
            />
          </div>
        ) : (
          <ThreeDotsMenu items={menuItems} />
        )}
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center pb-4 space-y-1">
        <div 
          className="relative w-24 h-24 cursor-pointer"
        >
          {!isCurrentUser && compatibility >= 0 && (
            <div className="absolute -inset-1 flex items-center justify-center z-20">
              {/* SVG for the ring */}
              <svg viewBox="0 0 110 110" className="absolute">
                <circle 
                  cx="55" 
                  cy="55" 
                  r="52" 
                  fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="4"
                />
              </svg>
              {/* Compatibility percentage badge */}
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full shadow-sm">
                <div 
                  className="text-xs font-medium rounded-full w-8 h-8 flex items-center justify-center text-white bg-primary"
                >
                  {compatibility}%
                </div>
              </div>
            </div>
          )}
          <img
            src={avatarSrc || "avatar.png"}
            alt={username}
            className="w-full h-full object-cover rounded-full absolute z-10"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <h1 className="text-xl font-semibold">
          {isCurrentUser
            ? privacyLevel == 1
              ? nickname
              : username
            : username}
        </h1>
        <p className="text-muted-foreground text-sm max-w-[80%] text-center mx-auto">
          {bio && bio.trim() !== "" 
            ? bio 
            : isCurrentUser 
              ? "Add a bio in your profile settings" 
              : "No bio available"}
        </p>

        <div className="flex gap-8 py-3 mt-4">
          {isCurrentUser ? (
            <>
              <Link 
                to="/following-followers?tab=followers" 
                className="text-center cursor-pointer hover:text-primary transition-colors"
              >
                <div className="font-semibold">{followers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">followers</div>
              </Link>
              <Link 
                to="/following-followers?tab=following" 
                className="text-center cursor-pointer hover:text-primary transition-colors"
              >
                <div className="font-semibold">{following.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">following</div>
              </Link>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="font-semibold">{followers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{following.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">following</div>
              </div>
            </>
          )}
          {isCurrentUser && (
            <Link to="/settings" className="p-2 rounded-full border h-fit">
              <Settings size={20} />
            </Link>
          )}
        </div>

        {!isCurrentUser && (
          <div className="flex gap-2 w-full max-w-[200px]">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={handleStartConversation}
              disabled={isMessageLoading}
            >
              {isMessageLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Opening...</span>
                </div>
              ) : (
                "Message"
              )}
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              onClick={handleSendFriendRequest}
              disabled={isSendingFriendRequest || isFollowing || localRequestSent}
            >
              {isSendingFriendRequest ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isFollowing 
                ? "Following" 
                : localRequestSent 
                  ? "Request Sent" 
                  : isFollower 
                    ? "Follow Back" 
                    : "Follow"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList
          className="grid w-full grid-cols-2 bg-transparent *:rounded-none *:border-transparent 
        *:data-[state=active]:text-primary"
        >
          <TabsTrigger value="posts" className="group cursor-pointer">
            <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
              Posts
            </span>
          </TabsTrigger>
          <TabsTrigger value="community" className="group cursor-pointer">
            <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
              Community
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="p-4">
          {isLoadingPosts ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AllPosts posts={posts} />
          )}
        </TabsContent>

        <TabsContent value="community" className="p-4">
          {/* Community content will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
