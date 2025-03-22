export interface UserProfileData {
  username: string;
  email: string;
  bio?: string;
  nickName?: string;
  followers: number;
  following: number;
  avatarSrc: string;
  interests: string[];
  isCurrentUser?: boolean;
  privacyLevel?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  requestSent?: boolean;
  compatibility?: number;
}

export interface PostData {
  _id: string;
  data: {
    media: Array<{ url: string }>;
    content: string;
  };
  createdAt: string;
  name: string;
  profilePic: string;
  commentCount: number;
  reactionCount: number;
  reaction: {
    hasReacted: boolean;
    reactionType: string;
  };
}

export interface UserPostsResponse {
  posts: Array<{
    id: number;
    imageSrc: string;
    content: string;
    createdAt: string;
    author: {
      name: string;
      profilePic: string;
    };
    stats: {
      commentCount: number;
      reactionCount: number;
      hasReacted: boolean;
      reactionType: string;
    };
  }>;
}

export interface FetchUserProfileResponse {
  success: boolean;
  data: UserProfileData;
}

export interface UpdateProfileRequest {
  userId: string;
  username?: string;
  email?: string;
  bio?: string;
  avatarSrc?: string;
}

export interface FollowingFollowerUser {
  _id: string;
  name: string;
  nickName: string;
  email: string;
  avatar: string;
  profilePic: string;
  interests: string[];
}

export interface FollowingFollowersResponse {
  success: boolean;
  data: FollowingFollowerUser[];
}
