import { Post } from "@/components/Post";
import { Story } from "@/components/Story";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchHomepageData } from "@/apis/commonApiCalls/homepageApi";
import {
  HomepageResponse,
  HomePostData,
  StoryData,
} from "@/apis/apiTypes/response";
import { useApiCall } from "@/apis/globalCatchError";
import { PostSkeleton } from "@/components/skeletons/PostSkeleton";
import { StoryRowSkeleton } from "@/components/skeletons/StorySkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RefreshCw, ImageIcon, AlertCircle, Plus, Loader2 } from "lucide-react";
import { getSelfStories } from "@/apis/commonApiCalls/storyApi";
import { useAppSelector } from "@/store";
import { fetchUserProfile } from "@/apis/commonApiCalls/profileApi";
import { useAppDispatch } from "@/store";
import { updateCurrentUser } from "@/store/currentUserSlice";

export default function HomePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<HomePostData[]>([]);
  const [stories, setStories] = useState<StoryData[]>([]);
  const [selfStories, setSelfStories] = useState<StoryData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [preloadedMedia, setPreloadedMedia] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const preloadContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const currentUser = useAppSelector((state) => state.currentUser);
  const dispatch = useAppDispatch();

  // Use our custom hook for API calls
  const [executeFetchHomepageData] = useApiCall(fetchHomepageData);
  const [executeGetSelfStories, isLoadingSelfStories] =
    useApiCall(getSelfStories);
  const [executeProfileFetch] = useApiCall(fetchUserProfile);

  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);
  }, []);

  // Load complete user profile data if needed
  useEffect(() => {
    const fetchCompleteUserProfile = async () => {
      // Only fetch if we have userId but missing user data
      if (
        currentUserId &&
        (!currentUser.interests?.length ||
          !currentUser.profilePic ||
          !currentUser.bio)
      ) {
        const result = await executeProfileFetch(currentUserId, currentUserId);

        if (result.success && result.data) {
          // Update Redux store with complete user data
          dispatch(
            updateCurrentUser({
              username: result.data.data.username,
              nickname: result.data.data.nickName,
              email: result.data.data.email,
              mobileNumber: result.data.data.mobileNumber,
              countryCode: result.data.data.countryCode,
              avatar: result.data.data.avatarSrc,
              profilePic: result.data.data.profilePic,
              bio: result.data.data.bio,
              interests: result.data.data.interests,
              privacyLevel: result.data.data.privacyLevel,
              userId: result.data.data.userId,
            })
          );
        }
      }
    };

    fetchCompleteUserProfile();
  }, [currentUserId]);

  // Load initial data
  useEffect(() => {
    const loadHomepageData = async () => {
      // Fetch self stories first
      const selfStoriesResult = await executeGetSelfStories();
      if (selfStoriesResult.success && selfStoriesResult.data) {
        setSelfStories(selfStoriesResult.data);
      }

      // Then fetch homepage data
      const result = await executeFetchHomepageData(1);

      if (result.success && result.data) {
        const { postsData, storiesData } = result.data as HomepageResponse;

        setPosts(postsData.posts);

        // Sort stories to show users with unseen stories first
        const sortedStories = [...storiesData.stories].sort((a, b) => {
          // Check if user A has any unseen stories
          const aHasUnseenStories = a.stories.some((story) => story.seen === 0);
          // Check if user B has any unseen stories
          const bHasUnseenStories = b.stories.some((story) => story.seen === 0);

          if (aHasUnseenStories && !bHasUnseenStories) {
            return -1; // A comes first
          } else if (!aHasUnseenStories && bHasUnseenStories) {
            return 1; // B comes first
          } else {
            // If both have the same seen status, sort by latest story time
            return b.latestStoryTime - a.latestStoryTime;
          }
        });

        setStories(sortedStories);
        setHasMore(postsData.hasMore || false);
      } else {
        setError(result.data?.message || "Failed to load homepage data");
      }

      // Set loading to false after data is fetched
      setIsLoading(false);
    };

    loadHomepageData();
  }, []);

  // Load more posts when page changes
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || isLoading || isFetchingMore) return;
    
    setIsFetchingMore(true);
    
    try {
      const result = await executeFetchHomepageData(page);
      
      if (result.success && result.data) {
        const { postsData } = result.data as HomepageResponse;
        
        // Append new posts to existing posts
        setPosts(prevPosts => [...prevPosts, ...postsData.posts]);
        setHasMore(postsData.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, hasMore, isLoading, isFetchingMore]);

  // Set up IntersectionObserver for infinite scrolling
  useEffect(() => {
    // Clean up previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    // Only set up observer if we have more content to load and we're not already loading
    if (!hasMore || isLoading || isFetchingMore || !loadMoreRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading && !isFetchingMore) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isFetchingMore]);

  // Trigger loadMorePosts when page changes
  useEffect(() => {
    if (page > 1) {
      loadMorePosts();
    }
  }, [page]);

  // Preload all story media (images and videos)
  useEffect(() => {
    // Skip if still loading
    if (isLoading || isLoadingSelfStories) return;

    // Collect all media URLs that need to be preloaded
    const mediaUrls: { url: string; type: "image" | "video" }[] = [];

    // Add self stories to preload list
    if (selfStories && selfStories.stories) {
      selfStories.stories.forEach((story) => {
        if (story.url && !preloadedMedia.has(story.url)) {
          mediaUrls.push({
            url: story.url,
            type: story.contentType === "video" ? "video" : "image",
          });
        }
      });
    }

    // Add other users' stories to preload list
    stories.forEach((user) => {
      if (user.stories) {
        user.stories.forEach((story) => {
          if (story.url && !preloadedMedia.has(story.url)) {
            mediaUrls.push({
              url: story.url,
              type: story.contentType === "video" ? "video" : "image",
            });
          }
        });
      }
    });

    // If no new media to preload, return early
    if (mediaUrls.length === 0) return;

    // Create a div to hold preloaded media if it doesn't exist
    if (!preloadContainerRef.current) {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.width = "0";
      container.style.height = "0";
      container.style.overflow = "hidden";
      container.style.visibility = "hidden";
      document.body.appendChild(container);
      preloadContainerRef.current = container;
    }

    // Preload all media
    const newPreloadedUrls = new Set(preloadedMedia);

    mediaUrls.forEach(({ url, type }) => {
      if (type === "image") {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          console.log(`Preloaded image: ${url}`);
          newPreloadedUrls.add(url);
        };
        if (preloadContainerRef.current) {
          preloadContainerRef.current.appendChild(img);
        }
      } else {
        // Preload video by creating a video element and loading metadata
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = url;
        video.muted = true;
        video.onloadedmetadata = () => {
          console.log(`Preloaded video metadata: ${url}`);
          newPreloadedUrls.add(url);
          // Load a small portion of the video to speed up playback start
          video.currentTime = 0;
        };
        // This will trigger actual data loading
        video.load();
        if (preloadContainerRef.current) {
          preloadContainerRef.current.appendChild(video);
        }
      }
    });

    // Update the preloaded media set
    setPreloadedMedia(newPreloadedUrls);

    // Clean up function to remove the preload container
    return () => {
      if (
        preloadContainerRef.current &&
        preloadContainerRef.current.parentNode
      ) {
        preloadContainerRef.current.parentNode.removeChild(
          preloadContainerRef.current
        );
      }
    };
  }, [stories, selfStories, isLoading, isLoadingSelfStories]);

  // Log currentUser changes
  useEffect(() => {
    console.log("currentUser: ", currentUser);
  }, [currentUser]);

  const handleLikeClick = (postId: string) => {
    // Update the posts array with the latest reaction data
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id === postId || post.feedId === postId) {
          return post;
        }
        return post;
      })
    );
  };

  const handleCommentClick = (postId: string, post: HomePostData) => {
    if (post.isCommunity) {
      navigate(`/community/${post.author}/${postId}`, { state: { post } });
    } else {
      navigate(`/post/${postId}`, { state: { post } });
    }
  };

  // Process post data to handle both regular and community posts
  const processPostData = (post: HomePostData) => {
    // if (post.isCommunity) {
    //   // For community posts, adapt the data structure to match what Post component expects
    //   return {
    //     ...post,
    //     data: {
    //       content: post.content || "",
    //       media: post.mediaUrls
    //         ? post.mediaUrls.map((url) => ({
    //             url,
    //             type: url.toLowerCase().endsWith(".mp4") ? "video" : "image",
    //           }))
    //         : null,
    //     },
    //   };
    // }
    return post;
  };
  const handlePostDelete = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.feedId !== postId));
  };

  // Render error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load feed"
          description={error}
          actionLabel="Try Again"
          actionIcon={RefreshCw}
          onAction={() => window.location.reload()}
          className="my-8"
        />
      </div>
    );
  }

  // Prepare stories for display - format self story only once
  const formattedSelfStory = selfStories
    ? {
        user: "Your Story",
        userId: currentUserId || "",
        avatar: currentUser.avatar || "/profile/avatars/1.png",
        hasStory: selfStories.stories && selfStories.stories.length > 0,
        stories: selfStories.stories || [],
        latestStoryTime: selfStories.latestStoryTime || Date.now(),
        name: "Your Story",
        profilePic: currentUser.profilePic || "/profile/avatars/1.png",
      }
    : null;

  // Format all stories for the StoryPage component
  const allFormattedStories = [
    ...(formattedSelfStory ? [formattedSelfStory] : []),
    ...stories.map((story) => ({
      user: story.name,
      userId: story.userId,
      avatar: story.profilePic,
      hasStory: story.hasStory,
      stories: story.stories,
      latestStoryTime: story.latestStoryTime,
      name: story.name,
      profilePic: story.profilePic,
    })),
  ].filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto bg-background">
      {/* Stories Section */}
      {isLoading || isLoadingSelfStories ? (
        <StoryRowSkeleton />
      ) : (
        <div className="mb-2 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {/* Self Story */}
            <div className="relative">
              {formattedSelfStory &&
              formattedSelfStory.stories &&
              formattedSelfStory.stories.length > 0 ? (
                <div className="flex flex-col items-center space-y-1 mx-2 my-1">
                  <div className="relative w-16 h-16 rounded-full ring-2 ring-blue-500">
                    <img
                      src={formattedSelfStory.profilePic || currentUser.profilePic || "/profile/avatars/1.png"}
                      alt="Your Story"
                      className="w-full h-full rounded-full object-cover p-[2px] bg-background cursor-pointer"
                      onClick={() => navigate(`/story/${formattedSelfStory.userId}`, { 
                        state: { 
                          currentStory: {
                            user: formattedSelfStory.user,
                            userId: formattedSelfStory.userId,
                            avatar: formattedSelfStory.avatar,
                            profilePic: formattedSelfStory.profilePic,
                            hasStory: formattedSelfStory.hasStory,
                            stories: formattedSelfStory.stories,
                            latestStoryTime: formattedSelfStory.latestStoryTime
                          },
                          allStories: allFormattedStories,
                          initialUserIndex: 0,
                          preloaded: true
                        }
                      })}
                    />
                    <button
                      onClick={() => navigate("/create-story")}
                      className="absolute cursor-pointer -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors duration-200 border-2 border-background"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Your Story
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1 mx-2 my-1">
                  <div className="relative w-16 h-16 rounded-full border-1 border-border">
                    <img
                      src={currentUser.profilePic || "/profile/avatars/1.png"}
                      alt="Your Story"
                      className="w-full h-full rounded-full object-cover p-[2px] bg-background"
                    />
                    <button
                      onClick={() => navigate("/create-story")}
                      className="absolute cursor-pointer -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors duration-200 border-2 border-background"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Your Story
                  </span>
                </div>
              )}
            </div>
            {/* Other Stories */}
            {stories
              .filter(story => story.stories && story.stories.length > 0)
              .map((story, index) => (
                <Story
                  key={`story-${story.userId || index}`}
                  user={story.name}
                  userId={story.userId}
                  avatar={story.profilePic}
                  hasStory={story.hasStory}
                  stories={story.stories}
                  latestStoryTime={story.latestStoryTime}
                  allStories={allFormattedStories}
                  storyIndex={index + 1}
                />
              ))}
          </div>
        </div>
      )}

      {/* Posts Section */}
      {isLoading && page === 1 ? (
        <div className="py-4">
          <PostSkeleton />
        </div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((post, index) => {
            const processedPost = processPostData(post);
            return (
              <div key={`post-${post._id || index}`}>
                <Post
                  user={post.name}
                  avatar={post.profilePic}
                  userId={post.isCommunity ? post.communityId || "" : post.userId}
                  caption={processedPost.data.content}
                  isCommunity={post.isCommunity}
                  communityId={post.author}
                  media={processedPost.data.media || []}
                  image={
                    processedPost.data.media &&
                    processedPost.data.media.length > 0
                      ? processedPost.data.media[0].url
                      : undefined
                  }
                  comments={post.commentCount}
                  datePosted={post.createdAt}
                  agoTimeString={post.ago_time}
                  isOwner={currentUserId === post.userId}
                  onCommentClick={() =>
                    handleCommentClick(post.feedId, processedPost)
                  }
                  onLikeClick={() => handleLikeClick(post._id)}
                  feedId={post.feedId}
                  onDelete={handlePostDelete}
                  initialReaction={post.reaction || { hasReacted: false, reactionType: null }}
                  initialReactionCount={post.reactionCount || 0}
                  initialReactionDetails={post.reactionDetails || { 
                    total: post.reactionCount || 0,
                    types: { like: 0, love: 0, haha: 0, lulu: 0 }
                  }}
                />
              </div>
            );
          })}
          
          {/* Load more indicator */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading More Posts...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No Posts Yet"
          description="There are no posts in your feed right now. Follow more people to see their posts here."
          className="my-8"
        />
      )}

      {/* End of content message */}
      {!hasMore && posts.length > 0 && !isLoading && !isFetchingMore && (
        <div className="text-center py-6 mb-4 text-muted-foreground border-t border-border">
          <p className="text-base font-medium">You're all Caught Up</p>
          <p className="text-sm">No more Posts to Load</p>
        </div>
      )}
    </div>
  );
}
