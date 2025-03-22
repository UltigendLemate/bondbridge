import {
  FetchUserProfileResponse,
  UserPostsResponse,
} from "../apiTypes/profileTypes";
import { UpdateProfileResponse } from "../apiTypes/response";
import apiClient, { formDataApiClient } from "../apiClient";
import { UpdateProfileRequest } from "../apiTypes/request";
import { PostData } from "../apiTypes/profileTypes";
import { FollowingFollowersResponse } from "../apiTypes/profileTypes";

export const fetchUserProfile = async (
  userId: string,
  currentUserId: string
): Promise<FetchUserProfileResponse> => {
  const response = await apiClient.get("/showProfile", {
    params: {
      other: userId,
    },
  });

  const userData = response.data.result[0];
  const isCurrentUser = currentUserId === userId;

  return {
    success: true,
    data: {
      username: userData.name,
      nickName: userData.nickName,
      email: isCurrentUser ? userData.email : "",
      followers: userData.followers || 0,
      following: userData.followings || 0,
      avatarSrc: userData.avatar || userData.profilePic || "/profile/user.png",
      bio: userData.bio || "",
      interests: userData.interests || [],
      isCurrentUser,
      privacyLevel: userData.privacyLevel || 0,
      isFollowing: userData.isFollowing || false,
      isFollower: userData.isFollower || false,
      requestSent: userData.requestSent || false,
      compatibility: userData.compatibility || 0,
    },
  };
};

export const fetchUserPosts = async (
  userId: string,
  isCurrentUser: boolean
): Promise<UserPostsResponse> => {
  const params = isCurrentUser ? {} : { userId: userId };
  const response = await apiClient.get("/get-posts", { params });

  const posts = response.data.posts.map((post: PostData) => ({
    id: post._id,
    imageSrc: post.data.media[0]?.url || "",
    content: post.data.content,
    createdAt: post.createdAt,
    author: {
      name: post.name,
      profilePic: post.profilePic,
    },
    stats: {
      commentCount: post.commentCount,
      reactionCount: post.reactionCount,
      hasReacted: post.reaction.hasReacted,
      reactionType: post.reaction.reactionType,
    },
  }));

  return {
    posts,
  };
};

export const updateUserProfile = async (
  profileData: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  // Create FormData object
  const formDataObj = new FormData();

  // Append form data
  formDataObj.append("name", profileData.name);
  formDataObj.append("email", profileData.email);
  formDataObj.append("interests", JSON.stringify(profileData.interests));
  formDataObj.append("privacyLevel", profileData.privacyLevel.toString());
  
  // Append bio if it exists
  if (profileData.bio !== undefined) {
    formDataObj.append("bio", profileData.bio);
  }

  // Handle avatar - could be a string URL or a File
  if (profileData.avatar) {
    if (typeof profileData.avatar === 'string') {
      // For pre-defined avatars, just send the path
      formDataObj.append("avatar", profileData.avatar);
    } else if (profileData.avatar instanceof File) {
      // For file uploads
      formDataObj.append("avatar", profileData.avatar);
    }
  }

  // Make the API call
  const response = await formDataApiClient.put("/edit-profile", formDataObj);

  return {
    success: response.status === 200,
    message: response.data.message || "Profile updated successfully",
    user: response.data.userDetails,
  };
};

export const fetchFollowingList = async (): Promise<FollowingFollowersResponse> => {
  const response = await apiClient.get("/followings");
  
  return {
    success: true,
    data: response.data.result.map((user: any) => ({
      _id: user._id,
      name: user.name,
      nickName: user.nickName,
      email: user.email,
      avatar: user.avatar || user.profilePic,
      profilePic: user.profilePic || user.avatar,
      interests: user.interests || []
    }))
  };
};

export const fetchFollowersList = async (): Promise<FollowingFollowersResponse> => {
  const response = await apiClient.get("/followers");
  
  return {
    success: true,
    data: response.data.result.map((user: any) => ({
      _id: user._id,
      name: user.name,
      nickName: user.nickName,
      email: user.email,
      avatar: user.avatar || user.profilePic,
      profilePic: user.profilePic || user.avatar,
      interests: user.interests || []
    }))
  };
};
