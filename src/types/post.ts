export interface MediaItem {
    url: string;
    type: string;
}

export interface ReactionDetails {
    total: number;
    types: {
        like?: number;
        love?: number;
        haha?: number;
        lulu?: number;
        [key: string]: number | undefined;
    };
}

export interface PostProps {
    user: string;
    userId: string;
    avatar: string;
    caption: string;
    image?: string; // Made optional since we now support media array
    media?: MediaItem[]; // New property for multiple media items
    comments: number;
    datePosted: number;
    agoTimeString?: string;
    isOwner?: boolean;
    communityId?: string;
    isCommunity?: boolean;
    isAnonymous?: boolean;
    isCommunityAdmin?: boolean;
    onCommentClick?: () => void;
    onLikeClick?: () => void;
    feedId: string;
    onDelete?: (postId: string) => void; // Callback when post is deleted
    initialReaction?: {
        hasReacted: boolean;
        reactionType: string | null;
    };
    initialReactionCount?: number;
    initialReactionDetails?: {
        total: number;
        types: {
            like?: number;
            love?: number;
            haha?: number;
            lulu?: number;
            [key: string]: number | undefined;
        };
    };
}