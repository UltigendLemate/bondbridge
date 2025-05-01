import { useNavigate } from "react-router-dom";
import {  TransformedCommunityPost } from "../apis/apiTypes/communitiesTypes";
import { POST_IMAGE } from "../constants/posts";
import VideoThumbnail from "./common/VideoThumbnail";

// Default image to use when a post doesn't have an image
const DEFAULT_POST_IMAGE = POST_IMAGE;

interface CommunityPostsProps {
  posts: TransformedCommunityPost[];
  communityId: string;
}

const CommunityPosts: React.FC<CommunityPostsProps> = ({ posts, communityId }) => {
  const navigate = useNavigate();
  
  // Filter posts to only include those with media
  const postsWithMedia = posts.filter(post => {
    return post.media && post.media.length > 0;
  });

  // Sort the posts by date (newest first)
  const sortedPosts = [...postsWithMedia].sort((a, b) => {
    // Get timestamps for both posts
    const aTimestamp = a.createdAt || 0;
    const bTimestamp = b.createdAt || 0;
    
    // Sort in descending order (newest first)
    return bTimestamp - aTimestamp;
  });

  if (sortedPosts.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 text-muted-foreground">
        No Posts
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {sortedPosts.map((post) => {
        const postId = post.id;
        const media = post.media || [];
        const firstMedia = media[0];

        return (
          <div
            key={postId.toString()}
            className="aspect-square border overflow-hidden rounded-3xl m-1 cursor-pointer relative group"
            onClick={() => {
              navigate(`/community/${communityId}/${postId}`, { 
                state: { 
                  post: {
                    ...post,
                    communityId: communityId
                  } 
                } 
              });
            }}
            data-post-id={postId.toString()} // Add data attribute for custom event handling
          >
            {firstMedia?.type === "image" ? (
              <img
                src={firstMedia.url || DEFAULT_POST_IMAGE}
                alt={`Post ${postId}`}
                className="w-full h-full object-cover"
              />
            ) : firstMedia?.type === "video" ? (
              <VideoThumbnail videoUrl={firstMedia.url} />
            ) : (
              <img
                src={DEFAULT_POST_IMAGE}
                alt={`Post ${postId}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CommunityPosts; 