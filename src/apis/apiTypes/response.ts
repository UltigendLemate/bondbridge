// Base API response interface
export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  groupId?: string;
  chatRoom?: {
    _id: string;
    chatRoomId: string;
    participants: Array<{
      userId: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      name: string;
      profilePic: string;
    }>;
    roomType: string;
    groupName: string;
    profileUrl: string | null;
    admin: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Random text suggestions for chat
export interface RandomTextResponse {
  success: boolean;
  message?: string;
  topic: string;
}

// OTP response interfaces
export type SendOTPResponse = ApiResponse<{
  message: string;
  expiresIn: number;
}>;

export type VerifyOTPResponse = {
  verified: boolean;
  token: string;
  message: string;
  userDetails: {
    _id: string;
    phoneNumber: string;
    countryCode: string;
  };
};

// Login response interface
export type LoginResponse = {
  token: string;
  socketToken: string;
  message: string;
  userDetails: {
    statusCode: number;
    _id: string;
    phoneNumber: string;
    countryCode: string;
    name?: string;
    email?: string;
    avatar?: string;
    profilePic?: string;
  };
};

// Password reset responses (for future use)
export type RequestPasswordResetResponse = ApiResponse<{
  message: string;
  expiresIn: number;
}>;

export type ResetPasswordResponse = ApiResponse<{
  message: string;
}>;

export type SetPasswordResponse = {
  success: boolean;
  message: string;
};

export interface AvatarItem {
  url: string;
  type: string;
}

export interface AvatarUrls {
  male: AvatarItem[];
  female: AvatarItem[];
}

export type CreateProfileResponse = ApiResponse<{
  user: {
    statusCode: number;
    userId: string;
    _id: string;
    name: string;
    email: string;
    avatar: string;
    interests: string[];
  };
}>;

export type FetchAvatarsResponse = {
  success: boolean;
  message?: string;
  URLS: {
    male: AvatarItem[];
    female: AvatarItem[];
  };
};

export interface CommentData {
  commentId: string;
  postId: string;
  parentComment: string | null;
  comment: string;
  createdAt: string;
  agoTime: string;
  user: {
    userId: string;
    name: string;
    profilePic: string;
  };
  likes: number;
  hasReplies: boolean;
  replies?: CommentData[];
  reaction?: {
    hasReacted: boolean;
    reactionType: string | null;
  };
}

export interface PostData {
  user: string;
  avatar: string;
  caption: string;
  image: string;
  likes: number;
  comments: number;
  datePosted: string;
}

export interface ProfilePostData {
  id: string;
  author: {
    name: string;
    profilePic: string;
  };
  content: string;
  createdAt: number;
  imageSrc: string;
  stats: {
    commentCount: number;
    hasReacted: boolean;
    reactionCount: number;
    reactionType: string | null;
  };
}

export interface FetchCommentsResponse {
  hasMoreComments: boolean;
  success: boolean;
  message?: string;
  comments: CommentData[];
  post?: PostData;
}

export interface PostCommentResponse {
  success: boolean;
  message?: string;
  comment?: object;
}

export interface HomePostData {
  _id: string;
  author: string;
  whoCanComment: number;
  privacy: number;
  content_type: string | null;
  taggedUsers: string[] | null;
  hideFrom: string[] | null;
  status: number;
  createdAt: number;
  data: {
    content: string;
    media: Array<{
      url: string;
      type: string;
    }>;
  };
  feedId: string;
  weekIndex: string;
  userId: string;
  ago_time: string;
  commentCount: number;
  reactionCount: number;
  reaction: {
    hasReacted: boolean;
    reactionType: string | null;
  };
  name: string;
  profilePic: string;
  isLiked?: boolean;
}

export interface StoryData {
  userId: string;
  name: string;
  profilePic: string;
  isLive: boolean;
  hasStory: boolean;
  latestStoryTime: number;
  stories: Array<{
    _id: string;
    author: string;
    privacy: number;
    contentType: string;
    taggedUsers: string[] | null;
    hideFrom: string[];
    createdAt: number;
    url: string;
    status: number;
    ago_time: string;
    seen: number;
  }>;
  channelName: string | null;
}

export interface HomepageResponse {
  success: boolean;
  postsData: {
    success: boolean;
    posts: HomePostData[];
    hasMore: boolean;
    message: string;
  };
  storiesData: {
    success: boolean;
    stories: StoryData[];
    message: string;
  };
}

export interface FriendRequest {
  id: number;
  userId: number;
  name: string;
  avatar: string;
  bio: string;
  createdAt: string;
}

export interface AcceptFriendRequestResponse {
  success: boolean;
  message?: string;
}

export interface RejectFriendRequestResponse {
  success: boolean;
  message?: string;
}

export interface FetchFriendRequestsResponse {
  success: boolean;
  message?: string;
  data: {
    requests: FriendRequest[];
    hasMore: boolean;
    totalCount: number;
  };
}

export interface SendFriendRequestResponse {
  success: boolean;
  message?: string;
}

export interface Person {
  id: string;
  name: string;
  bio: string;
  avatar: string;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  users: Person[];
}

export interface RewriteWithBondChatResponse {
  original: string;
  rewritten: string;
}

export interface Notification {
  id: number;
  title: string;
  description: string;
  avatar: string;
  timestamp: string;
  seen: boolean;
}

export interface FollowRequest {
  _id: string;
  mobileNumber: string;
  countryCode: string;
  nickName: string;
  statusCode: number;
  privacyLevel: number;
  avatar: string;
  email: string;
  entityType: string;
  interests: string[];
  name: string;
  profilePic: string;
}

// interface ChatParticipant {
//   userId: string;
//   status: string;
//   createdAt: string;
//   updatedAt: string;
//   name: string;
//   profilePic: string;
// }

// interface BaseChatRoom {
//   _id: string;
//   chatRoomId: string;
//   participants: ChatParticipant[];
//   roomType: "dm" | "group" | "community";
//   createdAt: string;
//   updatedAt: string;
//   isPart: boolean;
//   unseenCount: number;
//   lastMessage?:
//     | {
//         text: string;
//       }
//     | string;
// }

export interface ChatParticipantInfo {
  userId: string;
  name: string;
  profilePic: string;
}

export interface Message {
  _id: string;
  content: string;
  senderId: string;
  timestamp: number;
  senderName?: string;
  senderAvatar?: string;
}

export interface DMChatRoom {
  chatRoomId: string;
  roomType: "dm";
  participants: ChatParticipantInfo[];
  lastMessage?: Message;
  unseenCount: number;
  bio?: string;
}

export interface GroupChatRoom {
  chatRoomId: string;
  roomType: "group";
  participants: ChatParticipantInfo[];
  lastMessage?: Message;
  unseenCount: number;
  admin: string;
  bio?: string;
  groupName?: string;
  profileUrl?: string | null;
}

export interface CommunityChatRoom {
  chatRoomId: string;
  roomType: "community";
  participants: ChatParticipantInfo[];
  lastMessage?: Message;
  unseenCount: number;
  admin: string;
  bio?: string;
  groupName?: string;
  profileUrl?: string | null;
}

export type ChatRoom = DMChatRoom | GroupChatRoom | CommunityChatRoom;

export interface ChatRoomsResponse {
  message: string;
  chatRooms: ChatRoom[];
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  notifications: Notification[];
}

export interface FollowRequestsResponse {
  success: boolean;
  message: string;
  result: FollowRequest[];
}

export interface StoryItem {
  id: string;
  content: string;
  type: string;
  theme: string;
  privacy: number;
  createdAt: string;
}

export type UploadStoryResponse = {
  stories: StoryItem[];
};
export interface ChatMessage {
  _id: string;
  content: string;
  senderId: string;
  createdAt: string;
  updatedAt: string;
  senderName?: string;
  senderAvatar?: string;
  media?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  message: string;
  messages: ChatMessage[];
  totalPages: number;
  currentPage: number;
}

export interface StartMessageResponse {
  message: string;
  chatRoom: {
    _id: string;
    chatRoomId: string;
    participants: {
      userId: string;
      profilePic: string;
      name: string;
    }[];
    roomType: "dm" | "group" | "community";
    profileUrl: string | null;
    admin: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface FollowingUser {
  _id: string;
  name: string;
  avatar: string;
  bio?: string;
  email: string;
  interests: string[];
}

export interface FollowingsResponse {
  result: FollowingUser[];
  message: string;
}

// Add missing response types for homepage API
export interface FetchPostsResponse {
  success: boolean;
  message: string;
  posts: HomePostData[];
  hasMore: boolean;
}

export interface FetchStoriesResponse {
  success: boolean;
  message: string;
  stories: StoryData[];
}

export interface FetchHomepageDataResponse {
  success: boolean;
  message?: string;
  postsData: FetchPostsResponse;
  storiesData: FetchStoriesResponse;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    interests: string[];
    privacyLevel: number;
    bio?: string;
  };
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  post?: {
    _id: string;
    feedId: string;
    author: string;
    content: string;
    media?: Array<{
      url: string;
      type: string;
    }>;
    createdAt: string;
  };
}

export interface ReactionResponse {
  success: boolean;
  message?: string;
  reactionCount?: number;
}

export interface ReactionUser {
  userId: string;
  name: string;
  profilePic: string;
}

export interface Reaction {
  reactionType: string;
  count: number;
  users: ReactionUser[];
}

export interface GetAllReactionsResponse {
  message: string;
  reactions: Reaction[];
}

export interface PostDetailsData {
  _id: string;
  author: string;
  whoCanComment: number;
  privacy: number;
  content_type: string | null;
  taggedUsers: string[] | null;
  hideFrom: string[] | null;
  status: number;
  createdAt: number;
  data: {
    content: string;
    media: Array<{
      url: string;
      type: string;
    }>;
  };
  feedId: string;
  weekIndex: string;
  authorDetails: {
    userId: string;
    profilePic: string;
    name: string;
  };
  commentCount: number;
  reactionCount: number;
  agoTime: string;
  reaction?: {
    hasReacted: boolean;
    reactionType: string | null;
  };
}

export interface GetPostDetailsResponse {
  success: boolean;
  message: string;
  post: PostDetailsData;
}
