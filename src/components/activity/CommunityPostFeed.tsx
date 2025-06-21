import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchCommunities, fetchCommunityById, fetchCommunityPosts } from "@/apis/commonApiCalls/communitiesApi";
import { useApiCall } from "@/apis/globalCatchError";
import { CommunityResponse } from "@/apis/apiTypes/communitiesTypes";
import { ChatItem } from "@/store/chatSlice";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { TransformedCommunityPost } from "@/apis/apiTypes/communitiesTypes";
import { getRelativeTime } from "@/lib/utils";
import { TruncatedText } from "../ui/TruncatedText";

interface CommunityPostFeedProps {
  activeCommunityChatItem: ChatItem | null;
  onBack?: () => void;
}

const CommunityPostFeed: React.FC<CommunityPostFeedProps> = ({
  activeCommunityChatItem,
  onBack,
}) => {
  const [community, setCommunity] = useState<CommunityResponse | null>(null);
  const [posts, setPosts] = useState<TransformedCommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the useApiCall hook for all API calls
  const [executeFetchCommunities] = useApiCall(fetchCommunities);
  const [executeFetchCommunityById] = useApiCall(fetchCommunityById);
  const [executeFetchCommunityPosts] = useApiCall(fetchCommunityPosts);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadCommunityAndPosts = async () => {
      if (!activeCommunityChatItem) return;

      setLoading(true);
      try {
        // First, fetch the community details
        const communityResult = await executeFetchCommunityById(activeCommunityChatItem.id);
        
        if (communityResult.success && communityResult.data) {
          setCommunity(communityResult.data);
          
          // Then fetch the community posts
          const postsResult = await executeFetchCommunityPosts(activeCommunityChatItem.id);
          
          if (postsResult.success && postsResult.data) {
            // Sort posts by creation time (newest first)
            const sortedPosts = postsResult.data.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            
            setPosts(sortedPosts);
          } else {
            setPosts([]);
          }
        } else {
          // Fallback to fetch communities and find the matching one
          const communitiesResult = await executeFetchCommunities();
          if (communitiesResult.success && communitiesResult.data) {
            const foundCommunity = communitiesResult.data.find(
              (c) => c._id === activeCommunityChatItem.id
            );

            if (foundCommunity) {
              setCommunity(foundCommunity);
              
              // After finding the community, fetch its posts
              const postsResult = await executeFetchCommunityPosts(foundCommunity._id);
              
              if (postsResult.success && postsResult.data) {
                // Sort posts by creation time (newest first)
                const sortedPosts = postsResult.data.sort((a, b) => {
                  const dateA = new Date(a.createdAt).getTime();
                  const dateB = new Date(b.createdAt).getTime();
                  return dateB - dateA;
                });
                
                setPosts(sortedPosts);
              } else {
                setPosts([]);
              }
            } else {
              setError("Community not found");
            }
          } else {
            setError("Failed to load community data");
          }
        }
      } catch (err) {
        console.error("Error loading community:", err);
        setError("An error occurred while loading community data");
      } finally {
        setLoading(false);
      }
    };

    loadCommunityAndPosts();
  }, [activeCommunityChatItem]);

  // Format date display using getRelativeTime
  const formatPostDate = (timestamp: number) => {
    return getRelativeTime(new Date(timestamp).toISOString());
  };

  const handleNavigateToCommunityProfile = () => {
    if (community) {
      navigate(`/community/${community._id}`);
    }
  };

  if (!activeCommunityChatItem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a community to view posts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading Community Posts...</p>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Error: {error || "Community not found"}</p>
        <Button onClick={onBack} variant="ghost" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Community Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="mr-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar
            className="h-10 w-10 cursor-pointer"
            onClick={handleNavigateToCommunityProfile}
          >
            <AvatarImage
              src={community.profilePicture || "/placeholder.png"}
              alt={community.name}
            />
            <AvatarFallback>{community.name[0]}</AvatarFallback>
          </Avatar>
          <div
            className="cursor-pointer"
            onClick={handleNavigateToCommunityProfile}
          >
            <h3 className="font-semibold group-hover:text-primary group-hover:underline flex items-center">
              {community.name}
              <ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-70" />
            </h3>
            <p className="text-xs text-muted-foreground">
              {community.memberCount} Members
            </p>
          </div>
        </div>
      </div>

      {/* Post Feed */}
      <div className="flex-1 overflow-y-auto max-h-[79vh] pb-6">
        <div className="p-4">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No Posts in this Community Yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg overflow-hidden border bg-background"
                >
                  {/* Post Header */}
                  <Link to={`/community/${community._id}/${post.id}`}>
                  <div className="p-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={post.author.profilePic}
                        alt={post.author.name}
                      />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-sm">
                        {post.author.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatPostDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  </Link> 
                  {/* Post Content */}
                  <div className="px-3 pb-2">
                    <TruncatedText className="text-sm mb-3" text={post.content} limit={300} showToggle={true} align="left"/>

                    {post.media && post.media.length > 0 && (
                      <div className="rounded-md overflow-hidden mb-3">
                        <img
                          src={post.media[0].url}
                          alt="Post"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>{post.reactionDetails?.total} Reactions</span>
                      <span>{post.stats.commentCount} Comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPostFeed;
