import { CommentData } from '../apis/apiTypes/response';

export interface CommentsProps {
  postAuthor: string;
  postAvatar: string;
  postCaption: string;
  postLikes: number;
  postComments: number;
  postDate: string;
  comments: CommentData[];
  postAuthorId?: string; // Add post author ID
}

export interface CommentProps {
  comment: CommentData & {
    likes?: number;
    hasReplies?: boolean;
    reaction?: {
      hasReacted: boolean;
      reactionType: string | null;
    };
  };
  isReply?: boolean;
  postId?: string;
  currentUserId?: string; // Add current user ID to check ownership
  postAuthorId?: string; // Add post author ID to check if current user is post owner
  onCommentDeleted?: (commentId: string) => void; // Callback for parent components
  isPending?: boolean; // Indicates if the comment is being processed
}