import { useState, useCallback, memo, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Reply, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import ThreeDotsMenu, { 
  DeleteMenuItem, 
  ReportMenuItem 
} from "@/components/global/ThreeDotsMenu";
import toast from 'react-hot-toast';
import { useApiCall } from "@/apis/globalCatchError";
import { CommentData } from "../apis/apiTypes/response";
import { CommentProps } from "../types/home";
import { deleteComment } from "@/apis/commonApiCalls/commentsApi";
import { Link } from "react-router-dom";
import { addReaction, deleteReaction, getAllReactions } from "@/apis/commonApiCalls/reactionApi";

// Memoized reply component to prevent unnecessary re-renders
const ReplyComment = memo(({ comment, postId, currentUserId, postAuthorId, onCommentDeleted, isPending }: 
  { comment: CommentData & { likes?: number; hasReplies?: boolean; reaction?: { hasReacted: boolean; reactionType: string | null } }; postId?: string; currentUserId?: string; postAuthorId?: string; onCommentDeleted?: (commentId: string) => void; isPending?: boolean }) => (
  <Comment 
    comment={comment} 
    isReply={true} 
    postId={postId} 
    currentUserId={currentUserId}
    postAuthorId={postAuthorId}
    onCommentDeleted={onCommentDeleted}
    isPending={isPending}
  />
));
ReplyComment.displayName = 'ReplyComment';

export function Comment({ comment, isReply = false, postId, currentUserId, postAuthorId, onCommentDeleted, isPending = false }: CommentProps) {
  // Check if the comment is pending based on its ID (starts with 'temp-')
  const isCommentPending = isPending || comment.commentId.startsWith('temp-');
  
  const [showReplies, setShowReplies] = useState(false);
  const [liked, setLiked] = useState(comment.reaction?.hasReacted || false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<CommentData[]>([]);
  
  // Check if current user is the comment owner
  const isCommentOwner = (currentUserId && comment.user.userId === currentUserId);
  
  // Check if current user is the post owner
  const isPostOwner = (currentUserId && postAuthorId && currentUserId === postAuthorId);
  
  // Show delete option if user is either comment owner or post owner
  // const canDelete = isCommentOwner || isPostOwner;
  
  // Use the useApiCall hook for API calls
  const [executeDeleteComment] = useApiCall(deleteComment);
  const [executeAddReaction, isAddingReaction] = useApiCall(addReaction);
  const [executeDeleteReaction, isDeletingReaction] = useApiCall(deleteReaction);
  const [executeGetAllReactions, isLoadingReactions] = useApiCall(getAllReactions);

  // Default likes to 0 if not provided
  const likes = comment.likes || 0;
  
  // Initialize like count from props
  const [likeCount, setLikeCount] = useState(likes);
  
  // Check if the current user has already reacted to this comment
  useEffect(() => {
    const checkUserReaction = async () => {
      if (isCommentPending || !currentUserId || !comment.commentId) return;
      
      try {
        const result = await executeGetAllReactions(comment.commentId, 'comment');
        
        if (result.success && result.data) {
          // Find like reactions
          const likeReaction = result.data.reactions.find((r: { reactionType: string }) => r.reactionType === 'like');
          
          if (likeReaction) {
            // Update like count from the API response
            setLikeCount(likeReaction.count);
            
            // Check if current user has reacted
            const hasUserReacted = likeReaction.users.some((user: { userId: string }) => user.userId === currentUserId);
            setLiked(hasUserReacted);
          }
        }
      } catch (error) {
        console.error('Error checking reactions:', error);
      }
    };
    
    // Only check reactions if we don't already know the reaction state
    if (comment.reaction === undefined && !isCommentPending) {
      checkUserReaction();
    } else {
      // Use the reaction data from the comment if available
      setLiked(comment.reaction?.hasReacted || false);
    }
  }, [comment.commentId, comment.reaction, currentUserId, isCommentPending]);
  
  // Update liked state and like count when comment props change
  useEffect(() => {
    if (comment.reaction !== undefined) {
      setLiked(comment.reaction.hasReacted || false);
    }
    setLikeCount(comment.likes || 0);
  }, [comment.reaction?.hasReacted, comment.likes]);

  // Memoize handlers to prevent recreation on each render
  const toggleReplies = useCallback(() => setShowReplies(prev => !prev), []);
  
  // Handle like/unlike functionality
  const toggleLiked = useCallback(async () => {
    if (isCommentPending || !currentUserId || isAddingReaction || isDeletingReaction) return;
    
    // Optimistic update
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      // Prepare request data
      const reactionData = {
        entityId: comment.commentId,
        entityType: 'comment',
        reactionType: 'like'
      };
      
      // Call the appropriate API based on the new liked state
      const result = newLikedState 
        ? await executeAddReaction(reactionData)
        : await executeDeleteReaction(reactionData);
      
      if (!result.success) {
        // Revert optimistic update if API call fails
        setLiked(!newLikedState);
        setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        toast.error(`Failed to ${newLikedState ? 'like' : 'unlike'} comment`);
      }
    } catch (error) {
      // Revert optimistic update if there's an error
      setLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
      toast.error(`Error: ${newLikedState ? 'Liking' : 'Unliking'} comment failed`);
    }
  }, [liked, comment.commentId, currentUserId, executeAddReaction, executeDeleteReaction, isAddingReaction, isDeletingReaction, isCommentPending]);
  
  // Format like count for display
  const formattedLikeCount = likeCount >= 1000
    ? `${(likeCount / 1000).toFixed(1)}k`
    : likeCount.toString();

  const toggleReplyInput = useCallback(() => setShowReplyInput(prev => !prev), []);

  const handleReplyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
  }, []);

  const handleAddReply = useCallback(() => {
    if (replyText.trim()) {
      const newReply: CommentData = {
        commentId: `temp-${Date.now()}`,
        postId: postId || "",
        parentComment: comment.commentId,
        comment: replyText,
        createdAt: new Date().toISOString(),
        agoTime: "Just now",
        user: {
          userId: currentUserId || "anonymous",
          name: "Anonymous one",
          profilePic: "/path/to/avatar.jpg"
        },
        likes: 0,
        hasReplies: false,
        reaction: {
          hasReacted: false,
          reactionType: null
        }
      };

      // Optimistically add the reply
      setReplies(prev => [...prev, newReply]);
      setReplyText("");
      setShowReplyInput(false);
      setShowReplies(true);
      
      // TODO: Implement API call to post reply
      // If API call fails, you could remove the optimistically added reply
      // and show an error message
    }
  }, [replyText, postId, comment.commentId, currentUserId]);

  const handleDeleteComment = useCallback(async () => {
    // For temporary comments (optimistically added), just remove them without API call
    if (isCommentPending) {
      if (onCommentDeleted) {
        onCommentDeleted(comment.commentId);
      }
      return;
    }
    
    if (!postId) {
      toast.error("Cannot delete comment: missing post ID");
      return;
    }

    const { success } = await executeDeleteComment(comment.commentId, postId);
    
    if (success) {
      // Notify parent component about deletion
      if (onCommentDeleted) {
        onCommentDeleted(comment.commentId);
      }
    }
  }, [comment.commentId, postId, onCommentDeleted, executeDeleteComment, isCommentPending]);

  // Early return for empty content
  if (!comment.comment) return null;

  // Prepare menu items based on user roles
  const menuItems = [];
  
  // For self comments -> delete
  if (isCommentOwner) {
    menuItems.push({
      ...DeleteMenuItem,
      onClick: handleDeleteComment
    });
  } 
  // For other comments in my post -> delete, report
  else if (isPostOwner) {
    menuItems.push({
      ...DeleteMenuItem,
      onClick: handleDeleteComment
    });
    menuItems.push({
      ...ReportMenuItem,
      onClick: () => console.log('Report clicked')
    });
  } 
  // For other comments in others' post -> report
  else {
    menuItems.push({
      ...ReportMenuItem,
      onClick: () => console.log('Report clicked')
    });
  }

  return (
    <div className={`p-4 ${isReply ? "pl-12" : ""} ${isCommentPending ? "opacity-70" : ""}`}>
      <div className="flex gap-2">
        <Link to={`/profile/${comment.user.userId}`}>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={comment.user.profilePic} alt={comment.user.name} />
            <AvatarFallback>{comment.user.name[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  to={`/profile/${comment.user.userId}`}
                  className="font-medium text-sm cursor-pointer"
                >
                  {comment.user.name}
                </Link>
                <span className="text-xs text-muted-foreground">{comment.agoTime}</span>
                {isCommentPending && (
                  <span className="text-xs text-muted-foreground italic">Sending...</span>
                )}
              </div>
              <p className="text-sm mt-1">{comment.comment}</p>

              {comment.comment.length > 100 && (
                <button className="text-primary text-xs mt-1">Read more</button>
              )}

              <div className="flex items-center gap-4 mt-2">
                {(replies.length > 0 || comment.hasReplies) && (
                  <button
                    className="text-xs text-muted-foreground"
                    onClick={toggleReplies}
                  >
                    {showReplies ? "Hide Replies" : `${replies.length || '0'} Replies`}
                  </button>
                )}
              </div>
            </div>

            <ThreeDotsMenu items={menuItems} />
          </div>

          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground cursor-pointer"
              onClick={toggleLiked}
              disabled={isAddingReaction || isDeletingReaction || isCommentPending || !currentUserId || isLoadingReactions}
            >
              {isAddingReaction || isDeletingReaction || isLoadingReactions ? (
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Heart className={`h-4 w-4 mr-1 ${liked ? "text-destructive fill-destructive" : ""}`} />
              )}
              {formattedLikeCount}
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground cursor-pointer"
                onClick={toggleReplies}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {replies.length || 0}
              </Button>
            )}

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground cursor-pointer"
                onClick={toggleReplyInput}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {showReplyInput && (
            <div className="mt-2 relative">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={handleReplyChange}
                className="rounded-full bg-muted pr-12"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
                disabled={!replyText.trim()}
                onClick={handleAddReply}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Optimized replies rendering with memoized component */}
          {showReplies && replies.length > 0 && (
            <div className="mt-2">
              {replies.map(reply => (
                <ReplyComment 
                  key={reply.commentId} 
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  postAuthorId={postAuthorId}
                  onCommentDeleted={(replyId) => {
                    setReplies(prev => prev.filter(r => r.commentId !== replyId));
                  }}
                  isPending={reply.commentId.startsWith('temp-')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export a memoized version of the component
export default memo(Comment);