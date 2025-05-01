import { useNavigate } from "react-router-dom";
import { TransformedCommunityPost } from "@/apis/apiTypes/communitiesTypes";
import { Post } from "@/components/Post";
import { useEffect, useState } from "react";

interface CommunityQuotesProps {
  posts: TransformedCommunityPost[];
  communityId: string;
  showMediaPosts: boolean;
}

const CommunityQuotes: React.FC<CommunityQuotesProps> = ({ 
  posts,
  communityId,
  showMediaPosts
}) => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId') || '';
  const [localPosts, setLocalPosts] = useState<TransformedCommunityPost[]>([]);

  useEffect(() => {
    const filtered = showMediaPosts
      ? posts
      : posts.filter(post => {
          const media = post?.media || [];
          return media.length === 0;
        });
    
    const sorted = [...filtered].sort((a, b) => {
      const timestampA = a.createdAt || 0;
      const timestampB = b.createdAt || 0;
      return timestampB - timestampA;
    });

    setLocalPosts(sorted);

  }, [posts, showMediaPosts]);
  

  //we will change this to delete the post from the database
  const handlePostDeleted = (deletedPostId: string) => {
    console.log("deletedPostId:",deletedPostId)
    setLocalPosts(prevPosts => prevPosts.filter(p => p.id.toString() !== deletedPostId));
  };

  if (localPosts.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 text-muted-foreground">
        {showMediaPosts ? "No Posts Yet" : "No Quotes"}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {localPosts.map((post) => {
        const postIdStr = post.id.toString();
        const authorId = post.author?.id || "";
        const isOwner = authorId === currentUserId;

        const handleCommentNavigation = () => {
            navigate(`/community/${communityId}/${postIdStr}`, { 
                state: { post }
            });
        };

        const postProps = {
            user: post.author?.name || "",
            userId: authorId,
            avatar: post.author?.profilePic || "",
            caption: post.content || "",
            media: post.media || [],
            comments: post.stats?.commentCount || 0,
            datePosted: post.createdAt || 0,
            agoTimeString: post.ago_time || "",
            isOwner: isOwner,
            feedId: postIdStr,
            onDelete: handlePostDeleted,
            isCommunity: true,
            isAnonymous: post.isAnonymous || false,
            isCommunityAdmin: post.isAdmin || false,
            communityId: communityId,
            initialReaction: {
                hasReacted: post.stats?.hasReacted || false,
                reactionType: post.stats?.reactionType || null
            },
            initialReactionCount: post.stats?.reactionCount || 0,
            initialReactionDetails: post.reactionDetails || { total: 0, types: { like: 0, love: 0, haha: 0, lulu: 0 } },
            onCommentClick: handleCommentNavigation,
        };

        return (
          <Post key={postIdStr} {...postProps} />
        );
      })}
    </div>
  );
};

export default CommunityQuotes; 