import {
  FetchUserProfileResponse,
  UserPostsResponse,
} from "../apiTypes/profileTypes";
import { UpdateProfileResponse } from "../apiTypes/response";
import apiClient, { formDataApiClient } from "../apiClient";
import { UpdateProfileRequest } from "../apiTypes/request";
import { PostData } from "../apiTypes/profileTypes";
import { FollowingFollowersResponse } from "../apiTypes/profileTypes";
import { FollowingFollowerUser } from "../apiTypes/profileTypes";

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
      profilePic: userData.profilePic || userData.avatar || "/profile/user.png",
      bio: userData.bio || "",
      interests: userData.interests || [],
      isCurrentUser,
      privacyLevel: userData.privacyLevel || 0,
      isFollowing: userData.isFollowing || false,
      isFollower: userData.isFollower || false,
      requestSent: userData.requestSent || false,
      compatibility: userData.compatibility || 0,
      communities: userData.communities || [],
      public: userData.public || 0,
      isBlocked: userData.isBlocked,
      referralCode: userData.referralCode || "",
      referralCount: userData.referralData?.referralCount || 0,
      userId: userData._id,
      statusCode: userData.statusCode || 0,
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
    media: post.data.media || [],
    content: post.data.content,
    createdAt: post.createdAt,
    author: {
      name: post.name,
      profilePic: post.profilePic,
    },
    reactionDetails: {
      total: post.reactionCount,
      types: {
        like: post.reactionDetails.types.like,
        love: post.reactionDetails.types.love,
        haha: post.reactionDetails.types.haha,
        lulu: post.reactionDetails.types.lulu,
      },
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
  if (profileData.name && profileData.privacyLevel == 0) {
    formDataObj.append("name", profileData.name);
  }
  if (profileData.email) {
    formDataObj.append("email", profileData.email);
  }
  if (profileData.interests) {
    formDataObj.append("interests", JSON.stringify(profileData.interests));
  }
  if (profileData.public !== undefined) {
    formDataObj.append("public", profileData.public.toString());
  }
  if (profileData.privacyLevel !== undefined) {
    formDataObj.append("privacyLevel", profileData.privacyLevel.toString());
  }

  // Append bio if it exists
  if (profileData.bio !== undefined) {
    formDataObj.append("bio", profileData.bio);
  }

  // Handle avatar - could be a string URL or a File
  if (profileData.avatar) {
    if (typeof profileData.avatar === "string") {
      // For pre-defined avatars, just send the path
      formDataObj.append("avatar", profileData.avatar);
    } else if (profileData.avatar instanceof File) {
      // For file uploads
      formDataObj.append("avatar", profileData.avatar);
    }
  }

  // Handle image if provided
  if (profileData.image instanceof File) {
    formDataObj.append("image", profileData.image);
  }
  

  // Make the API call
  const response = await formDataApiClient.put("/edit-profile", formDataObj);

  // Save apiToken to localStorage if it exists in the response
  if (response.data.apiToken) {
    localStorage.setItem('token', response.data.apiToken);
  }

  return {
    success: response.status === 200,
    message: response.data.message || "Profile updated successfully",
    user: response.data.userDetails,
  };
};

export const fetchFollowingList =
  async (): Promise<FollowingFollowersResponse> => {
    const response = await apiClient.get("/followings");

    return {
      success: true,
      data: response.data.result.map((user: FollowingFollowerUser) => ({
        _id: user._id,
        name: user.name,
        bio: user.bio,
        email: user.email,
        avatar: user.avatar || user.profilePic,
        profilePic: user.profilePic || user.avatar,
        interests: user.interests || [],
      })),
    };
  };

export const fetchFollowersList =
  async (): Promise<FollowingFollowersResponse> => {
    const response = await apiClient.get("/followers");

    return {
      success: true,
      data: response.data.result.map((user: FollowingFollowerUser) => ({
        _id: user._id,
        name: user.name,
        bio: user.bio,
        email: user.email,
        avatar: user.avatar || user.profilePic,
        profilePic: user.profilePic || user.avatar,
        interests: user.interests || [],
      })),
    };
  };

export const fetchProfileById = async (
  userId: string
): Promise<FollowingFollowerUser> => {
  const response = await apiClient.get("/showProfile", {
    params: {
      other: userId,
    },
  });

  const userData = response.data.result[0];

  return {
    _id: userData._id,
    name: userData.name,
    bio: userData.bio || "",
    email: "", // We don't need to expose email
    avatar: userData.avatar || userData.profilePic || "/profile/user.png",
    profilePic: userData.profilePic || userData.avatar || "/profile/user.png",
    interests: userData.interests || [],
    isBlocked: userData.isBlocked || false,
  };
};

// Unfollow a user
export const unfollowUser = async (otherId: string): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('otherId', otherId);
  
  const response = await apiClient.post('/unfollow', formData);
  
  if (response.status === 200) {
    return {
      success: true,
      message: response.data.message || 'Successfully unfollowed user',
    };
  } else {
    throw new Error(response.data.message || 'Failed to unfollow user');
  }
};

// Remove a follower
export const removeFollower = async (otherId: string): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('otherId', otherId);
  
  const response = await apiClient.post('/follower/remove', formData);
  
  if (response.status === 200) {
    return {
      success: true,
      message: response.data.message || 'Successfully removed follower',
    };
  } else {
    throw new Error(response.data.message || 'Failed to remove follower');
  }
};

// Delete user's profile picture
export const deleteProfilePicture = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete('/profile-picture');
  
  if (response.status === 200) {
    return {
      success: true,
      message: response.data.message || 'Successfully deleted profile picture',
    };
  } else {
    throw new Error(response.data.message || 'Failed to delete profile picture');
  }
};
