import { ProfilePostData, CommentData } from './response';

// Community Member Types
export interface MemberDetail {
  _id: string;
  name: string;
  profilePic: string;
  avatar: string;
}

export interface ExtendedMember extends MemberDetail {
  nickName?: string;
  email?: string;
  interests?: string[];
}

// Media types
export interface Media {
  url: string;
  type: string; // "image" | "video"
}

// Define ReactionUserDetail based on the new JSON structure
export interface ReactionUserDetail {
  userId: string;
  reactionType: string;
  userDetails: UserDetails; // Reuse the UserDetails interface
}

export type ReactionResponse = { success: boolean; reactionDetails: ReactionDetails, 
  reaction: {hasReacted: boolean, reactionType: string} }

// Reaction types
export interface ReactionDetails {
  total: number;
  reactions: ReactionUserDetail[]; // Array of specific reactions with user details
  types: { // Added back: Counts of each reaction type
    like?: number;
    love?: number;
    haha?: number;
    lulu?: number;
    [key: string]: number | undefined; // Allow other reaction types
  };
}

export interface Reaction {
  hasReacted: boolean;
  reactionType: string | null;
}

// Define UserDetails based on the provided JSON structure
export interface UserDetails {
  _id: string;
  name: string;
  profilePic: string;
  avatar: string;
  status: string; // e.g., "active", "offline"
}

// Community Response Types
export interface CommunityResponse {
  _id: string;
  name: string;
  profilePicture?: string;
  backgroundImage?: string;
  description?: string;
  bio?: string;
  interest?: string;
  createdAt: string | number;
  memberCount: number;
  postCount?: number;
  posts?: string[];
  members?: string[];
  memberDetails?: MemberDetail[];
}

// Community Join Request
export interface CommunityJoinRequest {
  communityIds: string[] | string;
  userId: string;
  action: 'join' | 'remove';
}

// Community Post types
export interface CommunityPostData {
  id: string;
  author: {
    id: string;
    name: string;
    profilePic: string;
  };
  content: string;
  createdAt: number;
  ago_time?: string;
  media: Media[];
  stats: {
    commentCount: number;
    hasReacted: boolean;
    reactionCount: number;
    reactionType: string | null;
  };
  reactionDetails: ReactionDetails;
  isCommunity: boolean;
  isAnonymous: boolean;
  isAdmin: boolean;
  communityId: string;
}

// Update CommunityPostResponse to use the refined ReactionDetails
export interface CommunityPostResponse {
  _id: string;
  author: string;
  communityId: string;
  whoCanComment: number;
  privacy: number;
  content_type: string | null;
  taggedUsers: string[] | null;
  privateTo: string[];
  hideFrom: string[];
  status: number;
  createdAt: number;
  data: {
    content: string;
    media: Media[] | null;
  };
  feedId: string | null;
  weekIndex: string | null;
  userId: string | null;
  ago_time: string;
  isCommunity: boolean;
  isAnonymous: boolean;
  isAdmin?: boolean;
  commentCount: number;
  reactionCount: number;
  reactionDetails: ReactionDetails;
  reaction: Reaction;
  name: string;
  profilePic: string;
  comments?: CommentDetailsData[];
  userDetails?: UserDetails;
}

// Interface for community posts API response
export interface CommunityPostsResponse {
  success: boolean;
  posts: CommunityPostResponse[];
  count: number;
}

// API Request Interfaces
export interface FetchCommunitiesRequest {
  page?: number;
  limit?: number;
}

export interface FetchCommunityPostsRequest {
  communityId: string;
  page?: number;
  limit?: number;
}

// API Response Interfaces
export interface CommunitiesResponse {
  success: boolean;
  message: string;
  communities: CommunityResponse[];
}

export interface CommunityDetailResponse {
  success: boolean;
  message?: string;
  community: CommunityResponse;
}

// Comment related types
export interface CommentRequest {
  feedId: string;
  comment: string;
}

export interface FetchCommentsRequest {
  feedId: string;
  page: number;
  limit: number;
}

// ReactionUser for detailed reaction info
export interface ReactionUser {
  userId: string;
  name: string;
  profilePic: string;
}

// Update TransformedCommunityPost to use the refined ReactionDetails
export interface TransformedCommunityPost {
  id: string;
  author: {
    id: string;
    name: string;
    profilePic: string;
  };
  ago_time?: string;
  content: string;
  createdAt: number;
  media: Media[];
  stats: {
    commentCount: number;
    hasReacted: boolean;
    reactionCount: number;
    reactionType: string | null;
  };
  reactionDetails: ReactionDetails;
  communityId: string;
  isAnonymous?: boolean;
  isAdmin?: boolean;
}

// Re-export ProfilePostData as CommunityPostDetail for semantic clarity
export type CommunityPostDetail = ProfilePostData;

// Extended comment data interfaces for community posts
export interface CommentDetailsData {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author: string;
  userDetails?: {
    name?: string;
    profilePic?: string;
    avatar?: string;
  };
  likes?: number;
  replies?: CommentDetailsData[];
}

export interface PostDetailsData {
  _id?: string;
  feedId?: string;
  comments?: CommentDetailsData[];
}

// Define an extended CommentData interface that includes additional fields
export interface ExtendedCommentData extends Omit<CommentData, 'agoTime'> {
  _id: string;
  content?: string;
  likeCount?: number;
  isLiked?: boolean;
  updatedAt?: string;
  agoTime?: string;
  user: {
    userId: string;
    name: string;
    profilePic: string;
    _id?: string;
  };
}
