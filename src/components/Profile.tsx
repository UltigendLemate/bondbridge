import { useNavigate, Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Settings, Loader2, Pencil, Plus, Lock, UserX } from "lucide-react";
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
  fetchUserProfile,
  unfollowUser,
} from "@/apis/commonApiCalls/profileApi";
import { sendFriendRequest } from "@/apis/commonApiCalls/friendRequestApi";
import type { UserPostsResponse } from "@/apis/apiTypes/profileTypes";
import { useApiCall } from "@/apis/globalCatchError";
import { toast } from "sonner";
import { startMessage } from "@/apis/commonApiCalls/chatApi";
import { fetchChatRooms, blockUser as blockUserApi, unblockUser } from "@/apis/commonApiCalls/activityApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { ChatRoom } from "@/apis/apiTypes/response";
import {
  ChatItem,
  setActiveChat,
  transformAndSetChats,
} from "@/store/chatSlice";
import { setPrivacyLevel, updateCurrentUser } from "@/store/currentUserSlice";
import AllCommunities from "@/components/AllCommunities";
import { fetchCommunities } from "@/apis/commonApiCalls/communitiesApi";
import { CommunityResponse } from "@/apis/apiTypes/communitiesTypes";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { TruncatedList } from "@/components/ui/TruncatedList";
import { getStoryForUser } from "@/apis/commonApiCalls/storyApi";
import type { StoryData } from "@/apis/apiTypes/response";
import ThoughtsList from "@/components/ThoughtsList";

interface ProfileProps {
  userId: string;
  username: string;
  bio?: string;
  followers: number;
  following: number;
  avatarSrc: string;
  profilePic?: string;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  isFollower?: boolean;
  requestSent?: boolean;
  compatibility?: number;
  communities?: string[];
  interests?: string[];
  public?: number;
  isBlocked?: boolean;
}

const Profile: React.FC<ProfileProps> = ({
  userId,
  username,
  bio = "",
  followers,
  following,
  avatarSrc,
  profilePic,
  isCurrentUser: propsIsCurrentUser = false,
  isFollowing = false,
  isFollower = false,
  requestSent = false,
  compatibility = 0,
  communities: userCommunityIds = [],
  interests = [],
  public: isPublic = 1,
  isBlocked = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [posts, setPosts] = useState<UserPostsResponse["posts"]>([]);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [isUnfollowingUser, setIsUnfollowingUser] = useState(false);
  const [userStories, setUserStories] = useState<StoryData | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [localRequestSent, setLocalRequestSent] = useState(requestSent);
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [executePostsFetch, isLoadingPosts] = useApiCall(fetchUserPosts);
  const [executeSendFriendRequest, isSendingFriendRequest] =
    useApiCall(sendFriendRequest);
  const [executeUnfollowUser] = useApiCall(unfollowUser);
  const [executeStartMessage] = useApiCall(startMessage);
  const [executeFetchChats] = useApiCall(fetchChatRooms);
  const [executeUpdateProfile] = useApiCall(updateUserProfile);
  const [executeBlockUser] = useApiCall(blockUserApi);
  const [userCommunities, setUserCommunities] = useState<CommunityResponse[]>([]);
  const [executeFetchCommunities, isLoadingCommunities] = useApiCall(fetchCommunities);
  const [executeGetStoryForUser] = useApiCall(getStoryForUser);
  const [executeUnblockUser] = useApiCall(unblockUser);
  const [isUnblockingUser, setIsUnblockingUser] = useState(false);
  const [localIsBlocked, setLocalIsBlocked] = useState(isBlocked);
  // const [postDisplayType, setPostDisplayType] = useState<'images' | 'text'>('images');

  // Get user data from Redux store
  const { privacyLevel, nickname, username: reduxUsername, profilePic: reduxProfilePic, avatar: reduxAvatar, bio: reduxBio } = useAppSelector(
    (state) => state.currentUser
  );
  // Check if current user by comparing with userId in localStorage
  const localStorageUserId = localStorage.getItem("userId");
  const isCurrentUser = userId === localStorageUserId || propsIsCurrentUser;

  useEffect(() => {
    const loadPosts = async () => {
      if (isPublic === 1 || isFollowing || isCurrentUser) {
        const result = await executePostsFetch(userId, isCurrentUser);
        if (result.success && result.data) {
          setPosts(result.data.posts);
        }
      }
    };
    loadPosts();
  }, [userId, isPublic, isFollowing, isCurrentUser]);

  // Add new useEffect for loading communities
  useEffect(() => {
    const loadCommunities = async () => {
      if (!userCommunityIds || userCommunityIds.length === 0) {
        setUserCommunities([]);
        return;
      }
      
      const result = await executeFetchCommunities();

      if (result.success && result.data) {
        // Filter communities where the user is a member
        const filteredCommunities = result.data.filter(community => 
          userCommunityIds.includes(community._id)
        ); 
        
        // Use the original community response objects directly
        setUserCommunities(filteredCommunities);
      }
    };
    
    loadCommunities();
  }, [userId]);

  useEffect(() => {
    const loadStories = async () => {
      setIsLoadingStories(true);
      const result = await executeGetStoryForUser(userId);
      if (result.success && result.data && result.data.stories && result.data.stories.length > 0) {
        setUserStories(result.data.stories[0]);
      }
      setIsLoadingStories(false);
    };

    loadStories();
  }, [userId]);

  // Check if user has any unseen stories
  const hasUnseenStories = userStories?.stories?.some(story => story.seen === 0);

  useEffect(() => {
    setLocalRequestSent(requestSent);
  }, [requestSent]);

  useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  useEffect(() => {
    setLocalIsBlocked(isBlocked);
  }, [isBlocked]);

  const handleSendFriendRequest = async () => {
    try {
      const result = await executeSendFriendRequest({ userId: userId });
      if (result.success && result.data) {
        setLocalRequestSent(true);
        // toast.success("Friend request sent successfully!");
      } else {
        // toast.error(result.data?.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      // toast.error("An error occurred while sending friend request");
    }
  };

  const handleUnfollow = async () => {
    if (!userId) return;
    
    setIsUnfollowingUser(true);
    const result = await executeUnfollowUser(userId);
    if (result.success) {
      setLocalIsFollowing(false);
      toast.success("Successfully unfollowed user");
    } else {
      toast.error("Failed to unfollow user");
    }
    setIsUnfollowingUser(false);
  };

  const handleAnonymousToggle = async (checked: boolean) => {
    if (!isCurrentUser) return;

    const newPrivacyLevel = checked ? 1 : 0;

    // Optimistically update the UI
    dispatch(setPrivacyLevel(newPrivacyLevel));

    // Prepare the request data
    const profileData = {
      privacyLevel: newPrivacyLevel,
    };

    // Execute the API call
    const { success } = await executeUpdateProfile(profileData);

    if (!success) {
      // If the request fails, revert the change
      dispatch(setPrivacyLevel(privacyLevel));
      // toast.error("Failed to update anonymous mode");
    } else {
      // After successful update, refresh user data to ensure consistent display
      const currentUserId = localStorage.getItem("userId") || "";
      if (currentUserId) {
        const result = await fetchUserProfile(currentUserId, currentUserId);
        if (result.success && result.data) {
          // Update Redux store with fresh user data
          dispatch(
            updateCurrentUser({
              username: result.data.username,
              nickname: result.data.nickName,
              email: result.data.email,
              mobileNumber: result.data.mobileNumber,
              countryCode: result.data.countryCode,
              profilePic: result.data.profilePic,
              avatar: result.data.avatarSrc,
              privacyLevel: result.data.privacyLevel,
              bio: result.data.bio,
              userId: result.data.userId,
              interests: result.data.interests,
            })
          );
        }
      }
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
                avatar: profilePic || avatarSrc,
                lastMessage: "No Messages Yet",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                updatedAt: new Date().toISOString(),
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

  const handleUnblockUser = async () => {
    if (!userId) return;
    
    setIsUnblockingUser(true);
    const result = await executeUnblockUser(userId);
    if (result && result.success) {
      // Refresh the profile after unblocking
      const currentUserId = localStorage.getItem("userId") || "";
      if (currentUserId) {
        const profileResult = await fetchUserProfile(userId, currentUserId);
        if (profileResult.success) {
          // Update local state instead of reloading the page
          setLocalIsBlocked(false);
          
          // After unblocking, load all user data in parallel
          Promise.all([
            // Load posts
            executePostsFetch(userId, isCurrentUser),
            // Load user stories
            executeGetStoryForUser(userId),
            // Load communities (if user has communities)
            userCommunityIds && userCommunityIds.length > 0 ? executeFetchCommunities() : Promise.resolve({ success: true, data: [] })
          ]).then(([postsResult, storiesResult, communitiesResult]) => {
            // Update posts
            if (postsResult.success && postsResult.data) {
              setPosts(postsResult.data.posts);
            }
            
            // Update stories
            if (storiesResult.success && storiesResult.data && storiesResult.data.stories && storiesResult.data.stories.length > 0) {
              setUserStories(storiesResult.data.stories[0]);
            }
            
            // Update communities
            if (communitiesResult.success && communitiesResult.data && userCommunityIds && userCommunityIds.length > 0) {
              const filteredCommunities = communitiesResult.data.filter(community => 
                userCommunityIds.includes(community._id)
              );
              setUserCommunities(filteredCommunities);
            }
          });
          
          toast.success("User unblocked successfully");
        } else {
          toast.error("Failed to refresh profile data");
        }
      }
    } else {
      toast.error(result?.data?.message || "Failed to unblock user");
    }
    setIsUnblockingUser(false);
  };

  // Prepare menu items for other profile -> block, share, report
  const menuItems = [
    // Only show block option if user is not already blocked
    ...(localIsBlocked ? [] : [{
      ...BlockMenuItem,
      onClick: handleBlockUser
    }]),
    {
      ...ShareMenuItem,
      onClick: () => console.log('Share clicked')
    },
    {
      ...ReportMenuItem,
      onClick: () => console.log('Report clicked')
    }
  ];

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event propagation to prevent triggering parent click handler
    if (isCurrentUser) {
      // Navigate to settings with query parameter for profile tab
      navigate('/settings?tab=profile');
    }
  };

  const handleStoryClick = () => {
    if (userStories) {
      navigate(`/story/${userId}`, {
        state: {
          currentStory: {
            user: userStories.name,
            userId: userStories.userId,
            avatar: userStories.profilePic,
            hasStory: userStories.hasStory,
            stories: userStories.stories,
            latestStoryTime: userStories.latestStoryTime
          },
          allStories: [userStories],
          initialUserIndex: 0
        }
      });
    } else if (isCurrentUser) {
      navigate('/create-story');
    }
  };

  // Function to handle adding a new story
  const handleAddStory = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    navigate('/create-story');
  };

  // Function to render account privacy message
  const renderPrivacyMessage = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">This Account is Private</h3>
        <p className="text-muted-foreground max-w-md">
          Follow this account to see their posts and activities.
        </p>
      </div>
    );
  };

  // Function to render blocked message
  const renderBlockedMessage = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
        <UserX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">This Account is Blocked</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          You've blocked this account. Unblock to see their content.
        </p>
      </div>
    );
  };

  // Check if content should be visible based on privacy settings
  const isContentVisible = (isPublic === 1 || isFollowing || isCurrentUser) && !localIsBlocked;

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
          className={`relative w-24 h-24 ${userStories?.hasStory && !localIsBlocked ? 'cursor-pointer' : ''}`}
          onClick={userStories?.hasStory && !localIsBlocked ? handleStoryClick : undefined}
        >
          {/* Story ring */}
          {userStories?.hasStory && !localIsBlocked && (
            <div className="absolute -inset-1 flex items-center justify-center z-10">
              <svg viewBox="0 0 110 110" className="absolute">
                <circle 
                  cx="55" 
                  cy="55" 
                  r="52" 
                  fill="none" 
                  stroke={hasUnseenStories ? "var(--primary)" : "var(--muted)"} 
                  strokeWidth="4"
                />
              </svg>
            </div>
          )}
          
          {/* Compatibility ring - keep at z-20 to appear above story ring */}
          {!isCurrentUser && compatibility >= 0 && !localIsBlocked && (
            <div className="absolute -inset-1 flex items-center justify-center z-20">
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
            src={isCurrentUser 
              ? (reduxProfilePic || reduxAvatar || "avatar.png")
              : (profilePic || avatarSrc || "avatar.png")
            }
            alt={isCurrentUser ? (privacyLevel == 1 ? nickname : reduxUsername) : username}
            className="w-full h-full object-cover rounded-full absolute z-10 border-1 border-primary/20"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
          
          {/* Edit icon for profile picture - only show for current user */}
          {isCurrentUser && (
            <div className="absolute bottom-0 right-0 z-30 cursor-pointer" onClick={handleEditClick}>
              <div className="bg-primary rounded-full p-1.5 shadow-md">
                <Pencil className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}

          {/* Add story button - only show for current user when they have no stories and stories are done loading */}
          {isCurrentUser && !isLoadingStories && !userStories?.hasStory && (
            <div className="absolute -inset-1 flex items-center justify-center z-20">              
              {/* Add story button */}
              <div 
                className="absolute top-0 right-0 bg-primary rounded-full p-1.5 shadow-md z-30 cursor-pointer"
                onClick={handleAddStory}
              >
                <Plus className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}

        </div>
        <h1 className="text-xl font-semibold">
        {isCurrentUser
            ? privacyLevel == 1
              ? nickname
              : reduxUsername || username
            : username}
        </h1>
        {/* Only show bio if not blocked */}
        {!localIsBlocked && (
          <TruncatedText 
            text={isCurrentUser ? reduxBio || bio : bio} 
            limit={100}
            placeholderText={isCurrentUser ? "Add a bio in your profile settings" : "No bio available"}
            className="text-foreground text-sm text-center mx-auto"
          />
        )}

        {/* Interests section - only show if not blocked */}
        {interests && interests.length > 0 && !localIsBlocked && (
          <TruncatedList
            items={interests}
            limit={5}
            className="mt-2 w-full"
            itemsContainerClassName="flex flex-wrap justify-center gap-2 max-w-[80%] mx-auto"
            renderItem={(interest, index) => (
              <span 
                key={index} 
                className="bg-muted font-semibold text-foreground border border-primary text-xs px-2 py-1 rounded-full"
              >
                {interest}
              </span>
            )}
          />
        )}

        <div className="flex gap-8 py-3 mt-4">
          {isCurrentUser ? (
            <>
              <Link 
                to="/following-followers?tab=followers" 
                className="text-center cursor-pointer hover:text-muted-foreground transition-colors"
              >
                <div className="font-semibold">{followers.toLocaleString()}</div>
                <div className="text-sm text-foreground">Followers</div>
              </Link>
              <Link 
                to="/following-followers?tab=following" 
                className="text-center cursor-pointer hover:text-muted-foreground transition-colors"
              >
                <div className="font-semibold">{following.toLocaleString()}</div>
                <div className="text-sm text-foreground">Following</div>
              </Link>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="font-semibold">{localIsBlocked ? "0" : followers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{localIsBlocked ? "0" : following.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
            </>
          )}
          {isCurrentUser && (
            <Link to="/settings" className="p-2 rounded-full border h-fit">
              <Settings size={20} />
            </Link>
          )}
        </div>

        {!isCurrentUser && !localIsBlocked && (
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
              onClick={localIsFollowing ? handleUnfollow : handleSendFriendRequest}
              disabled={isSendingFriendRequest || isUnfollowingUser || (!localIsFollowing && localRequestSent)}
              variant={localIsFollowing ? "outline" : "default"}
            >
              {isSendingFriendRequest || isUnfollowingUser ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {localIsFollowing 
                ? "Unfollow" 
                : localRequestSent 
                  ? "Request Sent" 
                  : isFollower 
                    ? "Follow Back" 
                    : "Follow"}
            </Button>
          </div>
        )}

        {!isCurrentUser && localIsBlocked && (
          <div className="flex gap-2 w-full max-w-[200px] mt-2">
            <Button 
              onClick={handleUnblockUser} 
              disabled={isUnblockingUser}
              variant="outline"
              className="w-full cursor-pointer"
            >
              {isUnblockingUser ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Unblocking...</span>
                </div>
              ) : (
                "Unblock User"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Conditionally render tabs, privacy message, or blocked message */}
      {localIsBlocked ? (
        renderBlockedMessage()
      ) : isContentVisible ? (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList
            className="grid w-full grid-cols-3 bg-transparent *:rounded-none *:border-transparent 
          *:data-[state=active]:text-foreground"
          >
            <TabsTrigger value="posts" className="group cursor-pointer">
              <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
                Posts ({posts.filter(post => post.media.length > 0).length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="thoughts" className="group cursor-pointer">
              <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
                Quotes ({posts.filter(post => post.media.length === 0).length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="community" className="group cursor-pointer">
              <span className="group-data-[state=active]:border-b-2 px-4 group-data-[state=active]:border-primary pb-2">
                Community ({userCommunities.length})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="p-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <AllPosts 
                posts={posts} 
                userId={userId} 
              />
            )}
          </TabsContent>

          <TabsContent value="thoughts" className="p-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ThoughtsList 
                posts={posts} 
                userId={userId}
              />
            )}
          </TabsContent>

          <TabsContent value="community" className="p-4">
            <AllCommunities communities={userCommunities} isLoadingCommunities={isLoadingCommunities} />
          </TabsContent>
        </Tabs>
      ) : (
        renderPrivacyMessage()
      )}
    </div>
  );
};

export default Profile;
