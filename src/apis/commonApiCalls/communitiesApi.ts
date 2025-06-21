import { adminApiClient } from '../apiClient';
import { 
  CommunitiesResponse, 
  CommunityResponse, 
  CommunityJoinRequest,
  CommunityPostResponse,
  CommunityPostsResponse,
  FetchCommunitiesRequest,
  FetchCommunityPostsRequest,
  TransformedCommunityPost,
  ReactionResponse,
  PaginatedCommunityPostsApiResponse
} from '../apiTypes/communitiesTypes';

/**
 * Helper function to transform a community post to a standardized format
 * @param post The raw community post from the API
 * @param communityId The community ID this post belongs to
 * @returns Transformed post with consistent structure for UI components
 */
export const transformCommunityPost = (
  post: CommunityPostResponse,
  communityId: string
): TransformedCommunityPost => {
  return {
    id: post._id,
    author: {
      id: post.userId || '',
      name: post.name || '',
      profilePic: post.profilePic || '',
    },
    content: post.data.content,
    createdAt: post.createdAt,
    media: post.data.media || [],
    stats: {
      commentCount: post.commentCount || 0,
      hasReacted: post.reaction?.hasReacted || false,
      reactionCount: post.reactionCount || 0,
      reactionType: post.reaction?.reactionType || null,
    },
    reactionDetails: {
      total: post.reactionDetails?.total || 0,
      reactions: post.reactionDetails?.reactions || [],
      types: post.reactionDetails?.types || {
        like: 0,
        love: 0,
        haha: 0,
        lulu: 0
      }
    },
    communityId: communityId,
    isAnonymous: post.isAnonymous,
    isAdmin: post.isAdmin,
  };
};

/**
 * Function to fetch all communities
 * @returns Promise with community response array
 */
export const fetchCommunities = async (params?: FetchCommunitiesRequest): Promise<CommunityResponse[]> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const url = `/communityDetailsWithoutPostAndMembersData${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await adminApiClient.get<CommunitiesResponse>(url);
  return response.data.communities;
};

/**
 * Function to join or leave a community or multiple communities
 * @param params Join community request params
 * @returns Promise with success and message
 */
export const joinCommunity = async (params: CommunityJoinRequest): Promise<{ success: boolean; message?: string }> => {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const response = await adminApiClient.post(
    '/users/joincommunity',
    {
      communityIds: params.communityIds,
      userId: userId,
      action: params.action
    }
  );
  
  return {
    success: response.status === 200,
    message: response.data.message
  };
};

/**
 * Function to join multiple communities at once
 * @param communityIds Array of community IDs to join
 * @returns Promise with success and message
 */
export const joinMultipleCommunities = async (communityIds: string[]): Promise<{ success: boolean; message?: string }> => {
  const userId = localStorage.getItem('userId');
  if(!userId) {
    throw new Error('User not authenticated');
  }
  return joinCommunity({
    communityIds: communityIds,
    userId,
    action: 'join'
  });
};

/**
 * Function to fetch a specific community by ID
 * @param communityId Community ID
 * @returns Promise with community response
 */
export const fetchCommunityById = async (communityId: string): Promise<CommunityResponse> => {
  const response = await adminApiClient.get<CommunityResponse>(
    `/communities/${communityId}/communityDetailsWithoutPostAndMembersData`
  );
  return response.data;
};

/**
 * Function to fetch all posts of a community by community ID
 * @param communityId Community ID
 * @param params Optional parameters (page, limit)
 * @returns Promise with transformed community posts array
 */
export const fetchCommunityPosts = async (
  communityId: string, 
  params?: Omit<FetchCommunityPostsRequest, 'communityId'>
): Promise<TransformedCommunityPost[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const url = `/communities/${communityId}/post${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await adminApiClient.get<CommunityPostsResponse>(url);
    
    if (!response.data.success) {
      console.warn('API reported failure to fetch community posts');
      return [];
    }
    // Transform posts to consistent format
    return (response.data.posts || []).map(post => transformCommunityPost(post, communityId));
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }
};

/**
 * Function to fetch details of a specific post by post ID
 * @param postId Post ID
 * @returns Promise with post details data
 */
export const fetchPostDetails = async (postId: string): Promise<CommunityPostResponse> => {
  const response = await adminApiClient.get<{ success: boolean; post: CommunityPostResponse }>(
    `/posts/${postId}`
  );
  
  if (!response.data.success) {
    throw new Error('Failed to fetch post details');
  }
  
  return response.data.post;
};

/**
 * Interface for like post request parameters
 */
interface LikePostRequest {
  postId: string;
  reactionType: 'like' | 'love' | 'haha' | 'lulu';
}

/**
 * Function to like/react to a community post
 * @param communityId Community ID
 * @param params Request parameters (postId and reactionType)
 * @returns Promise with like post response
 */
export const reactOnPost = async (
  communityId: string,
  params: LikePostRequest
): Promise<ReactionResponse> => {
  const url = `/communities/${communityId}/post/like`;
  console.log("url:",url, "params:",params)
  const response = await adminApiClient.post<ReactionResponse>(url, {
    postId: params.postId,
    reactionType: params.reactionType
  });
  
  if (!response.data.success) {
    throw new Error('Failed to react post');
  }
  return response.data;
};

/**
 * Interface for comment on post request parameters
 */
interface CommentOnPostRequest {
  postId: string;
  content: string;
  isAnonymous?: boolean;
}

/**
 * Function to comment on a community post
 * @param communityId Community ID
 * @param params Request parameters (postId and content)
 * @returns Promise with comment on post response
 */
export const commentOnPost = async (
  communityId: string,
  params: CommentOnPostRequest
): Promise<CommunityPostResponse> => {
  
  const url = `/communities/${communityId}/post/comment`;
  const response = await adminApiClient.post<{ success: boolean; post: CommunityPostResponse }>(url, {
    postId: params.postId,
    content: params.content,
    isAnonymous: params.isAnonymous
  });
  
  if (!response.data.success) {
    throw new Error('Failed to comment on post');
  }
  return response.data.post;
};

/**
 * Interface for delete comment request parameters
 */
interface DeleteCommentRequest {
  postId: string;
  commentId: string;
}

/**
 * Function to delete a comment on a community post
 * @param communityId Community ID
 * @param params Request parameters (postId and commentId)
 * @returns Promise with delete comment response
 */
export const deleteComment = async (
  communityId: string,
  params: DeleteCommentRequest
): Promise<{ success: boolean; message: string }> => {
  const url = `/communities/${communityId}/post/comment?postId=${params.postId}&commentId=${params.commentId}`;
  const response = await adminApiClient.delete<{ success: boolean; message: string }>(url);
  
  if (!response.data.success) {
    throw new Error('Failed to delete comment');
  }
  return response.data;
};


/**
 * Function to delete a post from a community
 * @param communityId Community ID
 * @param postId Post ID
 * @returns Promise with delete post response
 */
export const deletePost = async (communityId: string, postId: string): Promise<{ success: boolean; message: string }> => {
  const url = `/communities/${communityId}/post?postId=${postId}`;
  const response = await adminApiClient.delete<{ success: boolean; message: string }>(url);
  
  return response.data;
};

/**
 * Function to edit the content of a community post
 * @param communityId Community ID
 * @param postId Post ID
 * @param content New content for the post
 * @returns Promise with the edit post response
 */
export const editCommunityPost = async (
  communityId: string, 
  postId: string,
  content: string
): Promise<{ success: boolean; message?: string }> => {
  const url = `/communities/${communityId}/post`;
  const response = await adminApiClient.put<{ success: boolean; message?: string }>(url, {
    content: content,
    postId: postId
  });
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to edit community post');
  }
  return response.data;
};

/**
 * Interface for fetch community members request parameters
 */
interface FetchCommunityMembersRequest {
  communityId: string;
  page: number;
  limit: number;
}

/**
 * Interface for a community member
 */
export interface CommunityMember {
  _id: string;
  name: string;
  profilePic: string;
  avatar: string;
  isFriend?: boolean;
  isRequestSent?: boolean;
  isRequestReceived?: boolean;
}

/**
 * Interface for the fetch community members API response
 */
interface FetchCommunityMembersApiResponse {
  memberDetails: CommunityMember[];
  pagination: {
    hasNextPage: boolean;
  };
}

/**
 * Function to fetch members of a community with pagination
 * @param params Request parameters (communityId, page, limit)
 * @returns Promise with community members and pagination info
 */
export const fetchCommunityMembers = async (
  params: FetchCommunityMembersRequest
): Promise<{ members: CommunityMember[]; hasMore: boolean }> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const url = `/communities/${params.communityId}/membersOfCommunity?${queryParams.toString()}`;
    const response = await adminApiClient.get<FetchCommunityMembersApiResponse>(url);
    
    const responseData = response.data;
    
    return {
      members: responseData.memberDetails || [],
      hasMore: responseData.pagination?.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching community members:', error);
    return { members: [], hasMore: false };
  }
};

/**
 * Function to fetch all posts of a community with pagination (for News Feed).
 * @param communityId Community ID
 * @param params Pagination parameters (page, limit)
 * @returns Promise with community posts and pagination info
 */
export const fetchCommunityFeed = async (
  communityId: string,
  params: { page: number; limit: number }
): Promise<{ posts: TransformedCommunityPost[]; hasMore: boolean }> => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    
    const url = `/communities/${communityId}/postWithPagination?${queryParams.toString()}`;
    const response = await adminApiClient.get<PaginatedCommunityPostsApiResponse>(url);
    
    const responseData = response.data;
    
    return {
      posts: (responseData.posts || []).map(post => transformCommunityPost(post, communityId)),
      hasMore: responseData.pagination?.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching community feed:', error);
    return { posts: [], hasMore: false };
  }
};

/**
 * Function to fetch posts with media of a community with pagination (for Recent tab).
 * @param communityId Community ID
 * @param params Pagination parameters (page, limit)
 * @returns Promise with community posts and pagination info
 */
export const fetchCommunityMediaPosts = async (
  communityId: string,
  params: { page: number; limit: number }
): Promise<{ posts: TransformedCommunityPost[]; hasMore: boolean }> => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    const url = `/communities/${communityId}/postWithPaginationWithMedia?${queryParams.toString()}`;
    const response = await adminApiClient.get<PaginatedCommunityPostsApiResponse>(url);
    
    const responseData = response.data;
    
    return {
      posts: (responseData.posts || []).map(post => transformCommunityPost(post, communityId)),
      hasMore: responseData.pagination?.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching community media posts:', error);
    return { posts: [], hasMore: false };
  }
};

/**
 * Function to fetch posts without media of a community with pagination (for Comments tab).
 * @param communityId Community ID
 * @param params Pagination parameters (page, limit)
 * @returns Promise with community posts and pagination info
 */
export const fetchCommunityQuotePosts = async (
  communityId: string,
  params: { page: number; limit: number }
): Promise<{ posts: TransformedCommunityPost[]; hasMore: boolean }> => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    const url = `/communities/${communityId}/postWithPaginationWithoutMedia?${queryParams.toString()}`;
    const response = await adminApiClient.get<PaginatedCommunityPostsApiResponse>(url);
    
    const responseData = response.data;
    
    return {
      posts: (responseData.posts || []).map(post => transformCommunityPost(post, communityId)),
      hasMore: responseData.pagination?.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching community quote posts:', error);
    return { posts: [], hasMore: false };
  }
};
