import { useState } from "react";
import { ArrowRight, Heart } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Comment } from "@/components/Comment";
import { Input } from "@/components/ui/input";
import ThreeDotsMenu, { 
  ShareMenuItem, 
  ReportMenuItem 
} from "@/components/global/ThreeDotsMenu";
import { CommentsProps } from "@/types/home";

export function Comments({
  postAuthor,
  postAvatar,
  postCaption,
  postLikes,
  postComments,
  postDate,
  comments,
  postAuthorId
}: CommentsProps) {
  const [newComment, setNewMessage] = useState("");

  // Prepare menu items for other post -> share, report
  const menuItems = [
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
    <div className="flex-1 flex flex-col ">
      {/* Post Summary */}
      <div className="flex-none ">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={postAvatar} alt={postAuthor} />
                <AvatarFallback>{postAuthor[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{postAuthor}</span>
            </div>
            <ThreeDotsMenu items={menuItems} />
          </div>
          <p className="text-sm mb-3">{postCaption}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{postLikes}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{postComments}</span>
              </div>
            </div>
            <span>{postDate}</span>
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-b flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={postAvatar} alt="Your avatar" />
            <AvatarFallback>YA</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input
              placeholder="Add Your Comment"
              value={newComment}
              onChange={(e) => setNewMessage(e.target.value)}
              className="pr-12 rounded-full bg-muted"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
              disabled={!newComment.trim()}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.map((comment) => (
          <Comment
            key={comment.commentId}
            comment={comment}
            currentUserId={localStorage.getItem('userId') || undefined}
            postAuthorId={postAuthorId}
            onCommentDeleted={(commentId) => {
              // This is just a UI component, so we don't handle actual deletion here
              console.log('Comment deleted:', commentId);
            }}
          />
        ))}
      </div>
    </div>
  );
} 