export interface UserProfileData {
  username: string;
  email: string;
  mobileNumber?: string;
  countryCode?: string;
  bio?: string;
  nickName?: string;
  followers: number;
  following: number;
  avatarSrc: string;
  profilePic?: string;
  interests: string[];
  isCurrentUser?: boolean;
  privacyLevel?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  requestSent?: boolean;
  compatibility?: number;
  communities?: string[];
  public?: number;
  isBlocked: boolean;
  referralCode?: string;
  referralCount?: number;
  userId?: string;
  statusCode?: number;
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
  reactionDetails: {
    total: number;
    types: {
      like: number;
      love: number;
      haha: number;
      lulu: number;
    };
  };
}

export interface UserPostsResponse {
  posts: Array<{
    id: number;
    media: Array<{
      url: string;
      type: string;
    }>;
    content: string;
    createdAt: string;
    author: {
      name: string;
      profilePic: string;
    };
    reactionDetails: {
      total: number;
      types: {
        like: number;
        love: number;
        haha: number;
        lulu: number;
      };
    };
    stats: {
      commentCount: number;
      reactionCount: number;
      hasReacted: boolean;
      reactionType: string;
    };
  }>;
  communities?: string[];
}

export interface FetchUserProfileResponse {
  success: boolean;
  data: UserProfileData;
}

export interface UpdateProfileRequest {
  userId?: string;
  username?: string;
  email?: string;
  bio?: string;
  avatarSrc?: string;
  interests?: string[];
  privacyLevel?: number;
  name?: string;
  public?: number;
  avatar?: string | File;
  image?: File;
}

export interface FollowingFollowerUser {
  _id: string;
  name: string;
  bio: string;
  email: string;
  avatar: string;
  profilePic: string;
  interests: string[];
  isBlocked?: boolean;
}

export interface FollowingFollowersResponse {
  success: boolean;
  data: FollowingFollowerUser[];
}
