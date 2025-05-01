import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Comment } from "@/components/Comment";
import { Post } from "@/components/Post";
import { Input } from "@/components/ui/input";
import { fetchPostDetails, commentOnPost } from "@/apis/commonApiCalls/communitiesApi";
import { useApiCall } from "@/apis/globalCatchError";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  HomePostData,
} from "@/apis/apiTypes/response";
import { toast } from "sonner";
import { useAppSelector } from "@/store";
import LogoLoader from "@/components/LogoLoader";
import { 
  CommunityPostResponse, 
  ExtendedCommentData,
  CommentDetailsData,
  PostDetailsData
} from "@/apis/apiTypes/communitiesTypes";
import { getRelativeTime } from "@/lib/utils";

export default function CommunityPostPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  // Access post directly from state
  const locationState = location.state || {};
  const locationPost = locationState.post;

  // Community post data state
  const [post, setPost] = useState<HomePostData>(() => {
    if (!locationPost) {
      // If no post was provided in state, create a minimal object
      // (Will be populated from API once post details are fetched)
      return {
        _id: postId?.split(":")[0] || "",
        name: "",
        profilePic: "",
        userId: "",
        data: {
          content: "",
          media: [],
        },
        commentCount: 0,
        reactionCount: 0,
        reaction: {
          hasReacted: false,
          reactionType: null,
        },
        reactionDetails: {
          total: 0,
          types: {
            like: 0,
            love: 0,
            haha: 0,
            lulu: 0
          }
        },
        ago_time: "",
        feedId: postId || "",
        author: "",
        whoCanComment: 0,
        privacy: 0,
        content_type: null,
        taggedUsers: null,
        hideFrom: null,
        status: 0,
        createdAt: 0,
        weekIndex: "",
        isCommunity: true,
      };
    } else {
      // Convert TransformedPost to compatible format
      return {
        _id: locationPost.id || "",
        name: locationPost.author?.name || "",
        profilePic: locationPost.author?.profilePic || "",
        userId: locationPost.communityId || "",
        data: {
          content: locationPost.content || "",
          media: locationPost.media || [],
        },
        commentCount: locationPost.stats?.commentCount || 0,
        reactionCount: locationPost.stats?.reactionCount || 0,
        reaction: {
          hasReacted: locationPost.stats?.hasReacted || false,
          reactionType: locationPost.stats?.reactionType || null,
        },
        reactionDetails: locationPost.reactionDetails || {
          total: 0,
          types: {
            like: 0,
            love: 0,
            haha: 0,
            lulu: 0
          }
        },
        ago_time: new Date(locationPost.createdAt).toLocaleDateString(),
        feedId: postId || "",
        author: "",
        whoCanComment: 0,
        privacy: 0,
        content_type: null,
        taggedUsers: null,
        hideFrom: null,
        status: 0,
        createdAt: locationPost.createdAt || 0,
        weekIndex: "",
        isCommunity: true,
        communityId: locationPost.communityId
      };
    }
  });

  const [newComment, setNewComment] = useState("");
  const [commentsData, setCommentsData] = useState<ExtendedCommentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Get current user from Redux store
  const currentUser = useAppSelector((state) => state.currentUser);

  // Use our custom hook for API calls
  const [executeGetPostDetails, isLoadingPost] = useApiCall(fetchPostDetails);
  const [executePostComment, isPosting] = useApiCall(commentOnPost);

  // Combined loading state for the entire page
  const pageLoading = isLoadingPost && !initialDataLoaded;

  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);
  }, []);

  // Fetch post details if not provided in state
  useEffect(() => {
    const fetchCommunityPostDetails = async () => {
      if (!postId) return; // Skip if postId is missing
      
      // If we already have complete post data from location state, use that
      if (locationPost && locationPost.content && locationPost.media) return;

      const result = await executeGetPostDetails(postId.split(":")[0]);

      if (result.success && result.data) {
        const apiPostData = result.data as unknown as CommunityPostResponse;
        
        // Map the API response to our expected HomePostData format
        const mappedPost: HomePostData = {
          _id: apiPostData._id,
          name: apiPostData.name,
          profilePic: apiPostData.profilePic,
          userId: apiPostData.author, // Community ID
          data: apiPostData.data,
          commentCount: apiPostData.commentCount || 0,
          reactionCount: apiPostData.reactionCount || 0,
          reaction: apiPostData.reaction || {
            hasReacted: false,
            reactionType: null,
          },
          reactionDetails: {
            total: apiPostData.reactionCount || 0,
            types: {
              like: 0,
              love: 0,
              haha: 0,
              lulu: 0
            }
          },
          ago_time: getRelativeTime(new Date(apiPostData.createdAt).toISOString()),
          feedId: apiPostData.feedId || postId,
          author: apiPostData.author,
          whoCanComment: apiPostData.whoCanComment,
          privacy: apiPostData.privacy,
          content_type: apiPostData.content_type,
          taggedUsers: apiPostData.taggedUsers,
          hideFrom: apiPostData.hideFrom || [],
          status: apiPostData.status,
          createdAt: apiPostData.createdAt,
          weekIndex: apiPostData.weekIndex || "",
          isCommunity: true,
          communityId: apiPostData.author // Store community ID
        };
        
        setPost(mappedPost);
      } else {
        setError("Failed to load post details. Please try again.");
      }
    };

    fetchCommunityPostDetails();
  }, [postId, locationPost]);

  // Helper function to sort comments by creation time (newest first)
  const sortCommentsByTime = (comments: ExtendedCommentData[]): ExtendedCommentData[] => {
    return [...comments].sort((a, b) => {
      // Try to parse the dates from createdAt
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      // Sort in descending order (newest first)
      return dateB - dateA;
    });
  };

  // Format comments from post details
  const extractCommentsFromPostDetails = (postDetails: PostDetailsData): ExtendedCommentData[] => {
    if (!postDetails || !postDetails.comments || !Array.isArray(postDetails.comments)) {
      return [];
    }
    
    return postDetails.comments.map((comment: CommentDetailsData): ExtendedCommentData => {
      // Map the comment fields from PostDetailsData structure to ExtendedCommentData
      return {
        _id: comment._id,
        commentId: comment._id,
        postId: postDetails._id || postDetails.feedId || "",
        parentComment: null,
        comment: comment.content,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        agoTime: getRelativeTime(comment.createdAt),
        user: {
          userId: comment.author,
          _id: comment.author,
          name: comment.userDetails?.name || "Unknown User",
          profilePic: comment.userDetails?.profilePic || comment.userDetails?.avatar || ""
        },
        likes: comment.likes || 0,
        likeCount: comment.likes || 0,
        hasReplies: Boolean(comment.replies && comment.replies.length > 0),
        isLiked: false, // We don't have this info from the API response
        reaction: {
          hasReacted: false, // We don't have this info
          reactionType: null
        }
      };
    });
  };

  // Fetch post details and comments
  const fetchPostDetailsAndComments = async (forceRefresh = false) => {
    if (!postId) {
      setError("No post ID provided");
      return;
    }
    try {
      const cleanPostId = postId.split(":")[0];
      const result = await executeGetPostDetails(cleanPostId);

      if (result.success && result.data) {
        // Update post data if we didn't get it from location state
        if (!locationPost || forceRefresh) {
          const apiPostData = result.data as unknown as CommunityPostResponse;
          
          // Map the API response to our expected HomePostData format
          const mappedPost: HomePostData = {
            _id: apiPostData._id,
            name: apiPostData.name,
            profilePic: apiPostData.profilePic,
            userId: apiPostData.author, // Community ID
            data: apiPostData.data,
            commentCount: apiPostData.commentCount || 0,
            reactionCount: apiPostData.reactionCount || 0,
            reaction: apiPostData.reaction || {
              hasReacted: false,
              reactionType: null,
            },
            reactionDetails: {
              total: apiPostData.reactionCount || 0,
              types: {
                like: 0,
                love: 0,
                haha: 0,
                lulu: 0
              }
            },
            ago_time: forceRefresh && post.ago_time ? post.ago_time : getRelativeTime(new Date(apiPostData.createdAt).toISOString()),
            feedId: apiPostData.feedId || postId,
            author: apiPostData.author,
            whoCanComment: apiPostData.whoCanComment,
            privacy: apiPostData.privacy,
            content_type: apiPostData.content_type,
            taggedUsers: apiPostData.taggedUsers,
            hideFrom: apiPostData.hideFrom || [],
            status: apiPostData.status,
            createdAt: apiPostData.createdAt,
            weekIndex: apiPostData.weekIndex || "",
            isCommunity: true,
            communityId: apiPostData.author // Store community ID
          };
          
          setPost(mappedPost);
        }

        // Extract comments from post details
        const comments = extractCommentsFromPostDetails(result.data);
        const sortedComments = sortCommentsByTime(comments);
        setCommentsData(sortedComments);
        setHasMore(false); // Since we get all comments at once with post details
        setError(null);
      } else {
        setError("Failed to load post details. Please try again.");
        setCommentsData([]);
      }
    } catch (error) {
      console.log(error);
      setError("An error occurred while fetching post details.");
      setCommentsData([]);
    }

    // Mark initial data as loaded
    setInitialDataLoaded(true);
  };

  // Load post details and comments on mount
  useEffect(() => {
    fetchPostDetailsAndComments();
  }, [postId]);

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !postId || isPosting) return;

    // Check if we have the communityId from the post
    if (!post.communityId) {
      toast.error("Cannot identify community for this post");
      return;
    }

    // Optimistically update the UI with the new comment
    const optimisticComment: ExtendedCommentData = {
      _id: `temp-${Date.now()}`,
      user: {
        userId: currentUserId || "",
        name: currentUser.username || "You",
        profilePic: currentUser.avatar || "",
      },
      content: newComment,
      comment: newComment,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      commentId: `temp-${Date.now()}`,
      postId: post._id,
      parentComment: null,
      agoTime: "Just now",
      likes: 0,
      hasReplies: false
    };

    // Add the new comment to the beginning of the list (newest first)
    setCommentsData(prevComments => [optimisticComment, ...prevComments]);
    setNewComment(""); // Clear the input field

    try {
      // Make the API call to post the comment
      const result = await executePostComment(
        post.communityId,
        {
          postId: post._id,
          content: newComment
        }
      );

      if (!result.success) {
        // If the API call fails, remove the optimistic comment
        setCommentsData(prevComments =>
          prevComments.filter(comment => comment._id !== optimisticComment._id)
        );
        toast.error("Failed to post comment. Please try again.");
        // Restore the comment text
        setNewComment(newComment);
      } else {
        // Update the comment count on the post
        setPost(prevPost => ({
          ...prevPost,
          commentCount: (prevPost.commentCount || 0) + 1,
        }));

        // Refresh post details to get the latest comments
        fetchPostDetailsAndComments(true);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to post comment. Please try again.");
      
      // Remove the optimistic comment
      setCommentsData(prevComments =>
        prevComments.filter(comment => comment._id !== optimisticComment._id)
      );
      
      // Restore the comment text
      setNewComment(newComment);
    }
  };

  // Handle key press in the comment input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  // Handle post deletion
  const handlePostDelete = () => {
    toast.success("Post deleted successfully");
    navigate(-1);
  };

  // Infinite scroll hook
  const loadMoreTriggerRef = useInfiniteScroll({
    onLoadMore: () => {}, // No-op since we load all comments at once
    hasMore: false,
    isLoading: false
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center border-b">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Community Post</h1>
      </div>

      {pageLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LogoLoader size="lg" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Post Summary and Comment Input */}
          <div className="flex-none">
            {post && (
              <Post
                user={post.name}
                userId={post.userId}
                avatar={post.profilePic}
                caption={post.data.content}
                media={post.data.media || []}
                initialReactionCount={post.reactionDetails.total}
                comments={post.commentCount}
                datePosted={post.createdAt}
                feedId={post.feedId}
                isOwner={currentUserId === post.userId}
                onCommentClick={() => {}}
                onLikeClick={() => {}}
                initialReaction={post.reaction}
                initialReactionDetails={post.reactionDetails}
                isCommunity={true}
                communityId={post.communityId}
                onDelete={handlePostDelete}
              />
            )}

            {/* Comment Input */}
            <div className="p-4 border-t border-b flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage
                  src={currentUser.profilePic || currentUser.avatar}
                  alt="Your avatar"
                />
                <AvatarFallback>
                  {currentUser.username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPosting}
                className="flex-1 bg-muted"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isPosting}
                className="ml-2"
              >
                Post
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="overflow-y-auto flex-1">
            {commentsData.length === 0 && !isLoadingPost ? (
              <div className="text-center text-muted-foreground my-8">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <>
                {commentsData.map((comment) => (
                  <Comment
                    key={comment._id}
                    comment={{
                      commentId: comment._id,
                      postId: postId || "",
                      comment: comment.content || comment.comment || "",
                      createdAt: comment.createdAt,
                      agoTime: comment.agoTime || getRelativeTime(comment.createdAt),
                      user: {
                        userId: comment.user.userId,
                        name: comment.user.name,
                        profilePic: comment.user.profilePic
                      },
                      likes: comment.likes || 0,
                      hasReplies: comment.hasReplies || false,
                      parentComment: comment.parentComment || null,
                      reaction: comment.reaction || {
                        hasReacted: comment.isLiked || false,
                        reactionType: comment.isLiked ? 'like' : null
                      }
                    }}
                    currentUserId={currentUserId || ""}
                    postId={postId}
                    isCommunity
                    communityId={post.communityId}
                    onCommentDeleted={(commentId) => {
                      // Remove the deleted comment from state
                      setCommentsData(prevComments => 
                        prevComments.filter(c => c._id !== commentId)
                      );
                      
                      // Update comment count on the post
                      setPost(prevPost => ({
                        ...prevPost,
                        commentCount: Math.max(0, (prevPost.commentCount || 0) - 1),
                      }));
                    }}
                  />
                ))}

                {/* Load more trigger */}
                {hasMore && (
                  <div
                    ref={loadMoreTriggerRef}
                    className="h-10 flex justify-center items-center my-4"
                  >
                    {isLoadingPost && (
                      <div className="text-sm text-muted-foreground">
                        Loading more comments...
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 