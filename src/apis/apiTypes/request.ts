// At the top of the file, import the VideoFileWithThumbnail type
import { VideoFileWithThumbnail } from '../../components/MediaCropModal';

// Base phone type used in multiple requests
export interface BasePhoneRequest {
  phoneNumber: string;
  countryCode: string;
}

// OTP request type
export type SendOTPRequest = BasePhoneRequest & {
  forgot?: string;
};

// OTP verification request type
export interface VerifyOTPRequest extends BasePhoneRequest {
  otp: string;
  forgot?: string;
}

export interface RewriteWithBondChatRequest {
  caption: string;
}

// Login request type
export interface LoginRequest extends BasePhoneRequest {
  password: string;
}

// Password reset request types (for future use)
export type RequestPasswordResetRequest = BasePhoneRequest;

export interface ResetPasswordRequest extends VerifyOTPRequest {
  newPassword: string;
}

// Profile related types
export interface Community {
  id: number;
  name: string;
  members: number;
  pfp: string;
}

export interface CreateProfileRequest {
  userId?: string;
  name: string;
  email: string;
  dateOfBirth: string;
  password: string;
  skillSelected: string[];
  image?: File;
  avatar?: string;
  communitiesSelected?: Community[];
  generateToken?: string;
}

export interface FetchAvatarsRequest {
  userId?: string;
} 

export interface FetchCommentsRequest {
  feedId: string;
  page: number;
  limit: number;
}

export interface PostCommentRequest {
  postId: string;
  comment: string;
}

export interface AcceptFriendRequestRequest {
  otherId: number;
}

export interface RejectFriendRequestRequest {
  otherId: number;
}

export interface FetchFriendRequestsRequest {
  page?: number;
  limit?: number;
}

export interface SetPasswordRequest {
  userId?: string;
  password: string;
  token?: string;
}

export interface SearchRequest {
  searchString: string;
}

export interface NotificationsRequest {
  page?: number;
  limit?: number;
}

export interface SendFriendRequestRequest {
  userId: string;
}
export interface FollowRequestsRequest {
  page: number;
  limit: number;
}

export interface FriendRequestActionRequest {
  otherId: string;
}

export interface GetMessagesRequest {
  roomId: string;
  page: number;
  limit: number;
}

export interface SendMessageRequest {
  senderId: string;
  content: string;
  entityId: string;
  media: null;
  entity: "chat";
  isBot: boolean;
}

export interface CreateGroupRequest {
  groupName: string;
  participants: string[];
}

export interface EditGroupRequest {
  groupId: string;
  bio: string;
  image?: File | null;
  groupName?: string;
}

export interface StoryData {
  type: 'text' | 'photo' | 'video';
  content: string | File | Blob;
  theme: {
    bgColor: string;
    textColor: string;
  };
  privacy: number;
  thumbnail?: File;
}

export interface Story {
  type: 'text' | 'photo' | 'video';
  content: string | File | Blob;
  theme: {
    bgColor: string;
    textColor: string;
  };
  privacy?: number;
  previewUrl?: string;
}

export interface StoryRequest {
  contentType: 'text' | 'image' | 'video';
  privacy: number;
  theme: string;
  text?: string;      
  image?: File;       
  video?: File;
  repliesEnabled?: number;
  taggedUsers?: string[];
  privateTo?: string[];
  hideFrom?: string[];
}
export interface StartMessageRequest {
  userId2: string;
}

// Profile update request type
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  interests?: string[];
  privacyLevel?: number;
  avatar?: string | File;
  image?: File;
  bio?: string;
  public?: number;
}

// Post creation request type
export interface CreatePostRequest {
  content: string;
  whoCanComment: number;
  privacy: number;
  image?: (File | VideoFileWithThumbnail)[];
  document?: File[];
  isCommunityPost?: boolean;
  communityId?: string;
  isAnonymous?: boolean;
}

export interface ReactionRequest {
  entityId: string;
  entityType: string;
  reactionType: string;
}

export interface GetPostDetailsRequest {
  feedId: string;
}

export interface FetchCommunitiesRequest {
  page?: number;
  limit?: number;
}
