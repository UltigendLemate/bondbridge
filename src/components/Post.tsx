import { Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import ThreeDotsMenu, { 
    ShareMenuItem, 
    ReportMenuItem, 
    DeleteMenuItem 
} from "@/components/global/ThreeDotsMenu";
import { useState, useEffect, useCallback } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useApiCall } from "@/apis/globalCatchError";
import { 
    addReaction, 
    deleteReaction, 
    getAllReactions,
} from "@/apis/commonApiCalls/reactionApi";
import { deletePost } from "@/apis/commonApiCalls/createPostApi";
import { toast } from "sonner";
import { PostProps } from "@/types/post";

export function Post({ 
    user, 
    userId, 
    avatar, 
    caption, 
    image, 
    media, 
    likes: initialLikes, 
    comments, 
    datePosted, 
    isOwner = false, 
    onCommentClick, 
    onLikeClick,
    feedId,
    isLiked: initialIsLiked = false
}: PostProps) {
    const navigate = useNavigate();
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isLoadingReactions, setIsLoadingReactions] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });

    const [executeAddReaction] = useApiCall(addReaction);
    const [executeDeleteReaction] = useApiCall(deleteReaction);
    const [executeGetAllReactions] = useApiCall(getAllReactions);
    const [executeDeletePost] = useApiCall(deletePost);

    useEffect(() => {
        if (feedId) {
            fetchReactions();
        }
    }, [feedId]);

    const fetchReactions = async () => {
        if (!feedId || isLoadingReactions) return;
        
        setIsLoadingReactions(true);
        try {
            const result = await executeGetAllReactions(feedId, 'feed');
            
            if (result.success && result.data) {
                const likeReaction = result.data.reactions.find(r => r.reactionType === 'like');
                
                if (likeReaction) {
                    // Get current user ID from localStorage or auth context
                    const currentUserId = localStorage.getItem('userId'); // Adjust based on your auth implementation
                    
                    // Check if current user has liked the post
                    const userHasLiked = likeReaction.users.some(u => u.userId === currentUserId);
                    setIsLiked(userHasLiked);
                    
                    // Update likes count
                    setLikes(likeReaction.count);
                }
            }
        } catch (error) {
            console.error('Failed to fetch reactions:', error);
        } finally {
            setIsLoadingReactions(false);
        }
    };

    const handleLikeClick = async () => {
        if (isLikeLoading || !feedId) return;

        setIsLikeLoading(true);
        try {
            const reactionData = {
                entityId: feedId,
                entityType: 'feed',
                reactionType: 'like'
            };

            let result;
            if (isLiked) {
                result = await executeDeleteReaction(reactionData);
            } else {
                result = await executeAddReaction(reactionData);
            }

            if (result.success && result.data) {
                setIsLiked(!isLiked);
                setLikes(prev => isLiked ? prev - 1 : prev + 1);
                onLikeClick?.();
            } else {
                toast.error("Failed to update like status");
            }
        } catch (error) {
            toast.error("Failed to update like status");
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleDoubleClick = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent any default double-click behavior
        
        // Set the heart position to the mouse coordinates
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + 20;
        const y = e.clientY - rect.top + 20;
        
        // Reset animation state before showing new heart
        setShowHeartAnimation(false);
        // Use requestAnimationFrame to ensure the state is reset before showing new animation
        requestAnimationFrame(() => {
            setHeartPosition({ x, y });
            setShowHeartAnimation(true);
        });

        // Hide the heart after animation and then trigger like
        setTimeout(async () => {
            setShowHeartAnimation(false);
            // Only trigger like if not already liked
            if (!isLiked) {
                await handleLikeClick();
            }
        }, 700);
    }, [isLiked, handleLikeClick]);

    // Determine if we should show a carousel or a single image
    const hasMultipleMedia = media && media.length > 1;
    const hasSingleMedia = (media && media.length === 1) || image;

    const MediaWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="relative" onDoubleClick={handleDoubleClick}>
            {children}
            {showHeartAnimation && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: `${heartPosition.x}px`,
                        top: `${heartPosition.y}px`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <Heart
                        className="text-red-500 fill-red-500 animate-heart-burst"
                        size={64}
                    />
                </div>
            )}
        </div>
    );

    const handleDeletePost = async () => {
        if (!feedId) return;
        const result = await executeDeletePost(feedId);
        
        if (result.success) {
            toast.success("Post deleted successfully");
            // You might want to add a callback prop to handle post deletion
            // For now, we'll just refresh the page
            window.location.reload();
        }
    };

    // Prepare menu items based on post ownership
    const menuItems = [
        {
            ...ShareMenuItem,
            onClick: () => console.log('Share clicked')
        }
    ];

    // Add different items based on whether it's the user's own post
    if (isOwner) {
        // my post -> share, delete
        menuItems.push({
            ...DeleteMenuItem,
            onClick: handleDeletePost
        });
    } else {
        // other post -> share, report
        menuItems.push({
            ...ReportMenuItem,
            onClick: () => console.log('Report clicked')
        });
    }

    return (
        <Card className="rounded-none border-x-0 border-t-0 shadow-none mb-4">
            <div className="flex items-center justify-between p-4">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${userId}`)}
                >
                    <Avatar>
                        <AvatarImage src={avatar} alt={user} />
                        <AvatarFallback>{user?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user}</p>
                    </div>
                </div>
                <ThreeDotsMenu items={menuItems} />
            </div>
            <CardContent className="p-4 pt-0">
                <p className="text-card-foreground">{caption}</p>
                
                {/* Carousel for multiple media items */}
                {hasMultipleMedia && (
                    <div className="mt-4 rounded-lg overflow-hidden">
                        <Carousel className="w-full">
                            <CarouselContent>
                                {media!.map((item, index) => (
                                    <CarouselItem key={`${userId}-media-${index}`}>
                                        {item.type === "image" && (
                                            <MediaWrapper>
                                                <img
                                                    src={item.url}
                                                    alt={`Post media ${index + 1}`}
                                                    className="w-full max-h-[500px] object-contain bg-muted"
                                                />
                                            </MediaWrapper>
                                        )}
                                        {item.type === "video" && (
                                            <MediaWrapper>
                                                <video
                                                    src={item.url}
                                                    controls
                                                    className="w-full max-h-[500px] object-contain bg-muted"
                                                />
                                            </MediaWrapper>
                                        )}
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2 bg-background/80" />
                            <CarouselNext className="right-2 bg-background/80" />
                        </Carousel>
                    </div>
                )}
                
                {/* Single media item (backward compatibility) */}
                {!hasMultipleMedia && hasSingleMedia && (
                    <div className="mt-4 rounded-lg overflow-hidden">
                        <MediaWrapper>
                            <img
                                src={media ? media[0].url : image}
                                alt="Post"
                                className="w-full max-h-[500px] object-contain bg-muted"
                            />
                        </MediaWrapper>
                    </div>
                )}
                
                <div className="flex items-center justify-between mt-4 text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <button 
                            className={`flex items-center gap-1 cursor-pointer ${isLiked ? 'text-destructive' : 'hover:text-destructive'} ${isLikeLoading || isLoadingReactions ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleLikeClick}
                            disabled={isLikeLoading || isLoadingReactions}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> {likes}
                        </button>
                        <button
                            className="flex items-center gap-1 hover:text-primary cursor-pointer"
                            onClick={onCommentClick}
                        >
                            <MessageCircle className="w-5 h-5" /> {comments}
                        </button>
                    </div>
                    <div className="text-sm text-muted-foreground">{datePosted}</div>
                </div>
            </CardContent>
        </Card>
    );
}