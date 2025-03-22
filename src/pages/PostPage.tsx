import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Comment } from "@/components/Comment";
import { Post } from "@/components/Post";
import { Input } from "@/components/ui/input";
import avatarImage from "/profile/user.png";
import { fetchComments, postComment } from "@/apis/commonApiCalls/commentsApi";
import { getPostDetails } from "@/apis/commonApiCalls/homepageApi";
import { useApiCall } from "@/apis/globalCatchError";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { CommentData, HomePostData, ProfilePostData } from "@/apis/apiTypes/response";
import { toast } from "react-hot-toast";
import { useAppSelector } from "@/store";

export default function CommentsPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  // Access post directly from state
  const locationState = location.state || {};
  const locationPost = locationState.post;
  
  // Convert ProfilePostData to a format compatible with HomePostData if needed
  const [post, setPost] = useState<HomePostData>(() => {
    if (!locationPost) {
      // If no post was provided in state, create a minimal object
      // (Will be populated from API once post details are fetched)
      return {
        _id: postId?.split(':')[0] || '',
        name: '',
        profilePic: '',
        userId: '',
        data: {
          content: '',
          media: []
        },
        commentCount: 0,
        reactionCount: 0,
        reaction: {
          hasReacted: false,
          reactionType: null
        },
        ago_time: '',
        feedId: postId || '',
        author: '',
        whoCanComment: 0,
        privacy: 0,
        content_type: null,
        taggedUsers: null,
        hideFrom: null,
        status: 0,
        createdAt: 0,
        weekIndex: '',
      };
    } else if ('_id' in locationPost) {
      // Already HomePostData
      return locationPost as HomePostData;
    } else {
      // Convert ProfilePostData to compatible format
      const profilePost = locationPost as ProfilePostData;
      return {
        _id: profilePost.id,
        name: profilePost.author.name,
        profilePic: profilePost.author.profilePic,
        userId: profilePost.id.split(':')[0], // Extract userId from id if possible
        data: {
          content: profilePost.content,
          media: [{ url: profilePost.imageSrc, type: 'image' }]
        },
        commentCount: profilePost.stats.commentCount,
        reactionCount: profilePost.stats.reactionCount,
        reaction: {
          hasReacted: profilePost.stats.hasReacted,
          reactionType: profilePost.stats.reactionType
        },
        ago_time: new Date(profilePost.createdAt * 1000).toLocaleDateString(),
        feedId: postId || '',
        author: '',
        whoCanComment: 0,
        privacy: 0,
        content_type: null,
        taggedUsers: null,
        hideFrom: null,
        status: 0,
        createdAt: profilePost.createdAt,
        weekIndex: '',
      };
    }
  });
  
  const [newComment, setNewComment] = useState("");
  const [commentsData, setCommentsData] = useState<CommentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [, setPendingComment] = useState<string | null>(null);
  
  // Get current user from Redux store
  const currentUser = useAppSelector(state => state.currentUser);
  
  // Use our custom hook for API calls
  const [executeFetchComments, isLoading] = useApiCall(fetchComments);
  const [executePostComment, isPosting] = useApiCall(postComment);
  const [executeGetPostDetails, isLoadingPost] = useApiCall(getPostDetails);
  
  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setCurrentUserId(userId);
  }, []);

  // Fetch post details if not provided in state
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId || locationPost) return; // Skip if postId is missing or post is already available
      
      const result = await executeGetPostDetails({ feedId: postId });
      console.log("result", result);
      
      if (result.success && result.data) {
        const apiPostData = result.data.post;
        // Map the API response to our expected HomePostData format
        const mappedPost: HomePostData = {
          _id: apiPostData._id,
          name: apiPostData.authorDetails.name,
          profilePic: apiPostData.authorDetails.profilePic,
          userId: apiPostData.authorDetails.userId,
          data: apiPostData.data,
          commentCount: apiPostData.commentCount,
          reactionCount: apiPostData.reactionCount,
          reaction: apiPostData.reaction || {
            hasReacted: false,
            reactionType: null
          },
          ago_time: apiPostData.agoTime,
          feedId: apiPostData.feedId,
          author: apiPostData.author,
          whoCanComment: apiPostData.whoCanComment,
          privacy: apiPostData.privacy,
          content_type: apiPostData.content_type,
          taggedUsers: apiPostData.taggedUsers,
          hideFrom: apiPostData.hideFrom,
          status: apiPostData.status,
          createdAt: apiPostData.createdAt,
          weekIndex: apiPostData.weekIndex,
        };
        setPost(mappedPost);
        console.log("mappedPost", mappedPost);
      } else {
        setError("Failed to load post details. Please try again.");
      }
    };
    
    fetchPostDetails();
  }, [postId, locationPost]);
  
  // Helper function to sort comments by creation time (newest first)
  const sortCommentsByTime = (comments: CommentData[]): CommentData[] => {
    return [...comments].sort((a, b) => {
      // Try to parse the dates from createdAt
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      // Sort in descending order (newest first)
      return dateB - dateA;
    });
  };
  
  // Load initial data
  useEffect(() => {
    const loadCommentsData = async () => {
      if (!postId) {
        setError("No post ID provided");
        return;
      }
      
      const result = await executeFetchComments({ 
        feedId: postId, 
        page: 1, 
        limit: 10 
      });
      
      if (result.success && result.data) {
        // Map the API response to our expected format
        if (result.data.comments) {
          // Sort comments by time (newest first)
          const sortedComments = sortCommentsByTime(result.data.comments);
          setCommentsData(sortedComments);
        } else {
          setCommentsData([]);
        }
        
        setHasMore(result.data.hasMoreComments || false);
      } else {
        setError(result.data?.message || 'Failed to load comments');
      }
    };
    
    loadCommentsData();
  }, [postId]);

  // Function to load more comments
  const loadMoreComments = async () => {
    if (isLoading || !hasMore || !postId) return;
    
    const nextPage = page + 1;
    const result = await executeFetchComments({ 
      feedId: postId, 
      page: nextPage, 
      limit: 10 
    });
    
    if (result.success && result.data) {
      const data = result.data;
      if (data.comments) {
        // Sort and merge with existing comments
        const newComments = sortCommentsByTime([...commentsData, ...data.comments]);
        setCommentsData(newComments);
      }
      setHasMore(data.hasMoreComments || false);
      setPage(nextPage);
    }
  };

  // Use infinite scroll hook
  const lastCommentRef = useInfiniteScroll({
    isLoading,
    hasMore,
    onLoadMore: loadMoreComments
  });
  
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !postId || isPosting) return;
    
    // Store the comment text in case we need to restore it
    const commentText = newComment.trim();
    setPendingComment(commentText);
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId') || '';
    
    // Create a temporary comment with a unique ID
    const tempCommentId = `temp-${Date.now()}`;
    const tempComment: CommentData = {
      commentId: tempCommentId,
      postId: postId,
      parentComment: null,
      comment: commentText,
      createdAt: new Date().toISOString(),
      agoTime: "Just now",
      user: {
        userId: userId,
        name: currentUser.username || currentUser.nickname,
        profilePic: currentUser.avatar || avatarImage,
      },
      likes: 0,
      hasReplies: false
    };
    
    // Optimistically add the comment to the UI (at the top since it's newest)
    setCommentsData(prevComments => [tempComment, ...prevComments]);
    setPost(prevPost => ({
      ...prevPost,
      commentCount: prevPost.commentCount + 1
    }));
    
    // Clear the input field
    setNewComment("");
    
    // Send the API request
    const result = await executePostComment({
      postId,
      comment: commentText
    });
    
    if (!result.success) {
      // API call failed, revert the optimistic update
      setCommentsData(prevComments => 
        prevComments.filter(comment => comment.commentId !== tempCommentId)
      );
      setPost(prevPost => ({
        ...prevPost,
        commentCount: prevPost.commentCount - 1
      }));
      
      // Restore the comment text to the input field
      setNewComment(commentText);
      setPendingComment(null);
      
      // Show error toast
      toast.error("Failed to post comment. Please try again.");
    } else {
      // API call succeeded, update the temporary comment with the real data if available
      if (result.data) {
        // Extract the insertedId from the response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const commentData = result.data.comment as any;
        const insertedId = commentData?.insertedId;
        
        if (insertedId) {
          // Replace the temporary comment with the real one using the insertedId from the API
          setCommentsData(prevComments => 
            prevComments.map(comment => 
              comment.commentId === tempCommentId 
                ? {
                    ...comment,
                    commentId: insertedId, // Use the actual insertedId from the API
                  }
                : comment
            )
          );
        } else {
          // If for some reason insertedId is not available, use a fallback ID
          const permanentId = `comment-${Date.now()}`;
          
          // Important: Replace the temp ID with a permanent one to remove the "sending" indicator
          setCommentsData(prevComments => 
            prevComments.map(comment => 
              comment.commentId === tempCommentId 
                ? {
                    ...comment,
                    commentId: permanentId, // Fallback ID
                  }
                : comment
            )
          );
          
          console.warn('Comment was added but no insertedId was returned from the API');
        }
      } else {
        // If the API doesn't return any data, just remove the temporary flag
        const permanentId = `comment-${Date.now()}`;
        
        // Important: Replace the temp ID with a permanent one to remove the "sending" indicator
        setCommentsData(prevComments => 
          prevComments.map(comment => 
            comment.commentId === tempCommentId 
              ? {
                  ...comment,
                  commentId: permanentId, // This ensures the "sending" indicator is removed
                }
              : comment
          )
        );
      }
      setPendingComment(null);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };
  
  return (
    <div className="relative max-w-2xl mx-auto bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky -top-10 z-10 bg-background p-4 pt-2 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="mr-2 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Comments</h1>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Post Summary and Comment Input */}
        <div className="flex-none">
          {isLoadingPost ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : post && (
            <Post 
              user={post.name}
              userId={post.userId}
              avatar={post.profilePic}
              caption={post.data.content}
              image={post.data.media[0]?.url}
              likes={post.reactionCount}
              comments={post.commentCount}
              datePosted={post.ago_time}
              feedId={post.feedId}
              isOwner={currentUserId === post.userId}
              onCommentClick={() => {}}
              onLikeClick={() => {}}
            />
          )}

          {/* Comment Input */}
          <div className="p-4 border-b flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar || avatarImage} alt="Your avatar" />
              <AvatarFallback>{currentUser.nickname?.charAt(0) || currentUser.username?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Input
                placeholder="Add Your Comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-12 rounded-full bg-muted"
                disabled={isPosting}
              />
              <Button 
                size="icon" 
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isPosting}
              >
                {isPosting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && commentsData.length === 0 ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              {error}. <Button variant="link" onClick={() => window.location.reload()}>Try again</Button>
            </div>
          ) : commentsData.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            commentsData.map((comment, index) => (
              <div
                key={`${comment.commentId}-${index}`}
                ref={index === commentsData.length - 1 ? lastCommentRef : undefined}
              >
                <Comment 
                  comment={{
                    ...comment,
                    likes: 0,
                    hasReplies: false
                  }}
                  postId={postId}
                  currentUserId={localStorage.getItem('userId') || undefined}
                  postAuthorId={post.userId}
                  onCommentDeleted={(commentId) => {
                    setCommentsData(prev => prev.filter(c => c.commentId !== commentId));
                    setPost(prevPost => ({
                      ...prevPost,
                      commentCount: prevPost.commentCount - 1
                    }));
                  }}
                  isPending={comment.commentId.startsWith('temp-')}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}