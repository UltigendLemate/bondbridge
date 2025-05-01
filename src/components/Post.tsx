import { MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import ThreeDotsMenu, {
    ReportMenuItem,
    DeleteMenuItem,
    EditPostMenuItem
} from "@/components/global/ThreeDotsMenu";
import { useState, useEffect } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useApiCall } from "@/apis/globalCatchError";
import { deletePost } from "@/apis/commonApiCalls/createPostApi";
import { deletePost as deleteCommunityPost } from "@/apis/commonApiCalls/communitiesApi";
import { toast } from "sonner";
import { PostProps } from "@/types/post";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SharePostPage from "./SharePostPage";
import { ReportModal } from './ReportModal';
import ReactionComponent from "./global/ReactionComponent";
import VideoObserver from "./common/VideoObserver";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { getRelativeTime } from "@/lib/utils";

export function Post({
    user,
    userId,
    avatar,
    caption,
    media = [],
    comments,
    datePosted,
    agoTimeString = "",
    isOwner = false,
    onCommentClick,
    onLikeClick,
    feedId,
    onDelete,
    isCommunity=false,
    isAnonymous=false,
    isCommunityAdmin=false,
    communityId,
    initialReaction = { hasReacted: false, reactionType: null },
    initialReactionCount = 0,
    initialReactionDetails = { total: 0, types: { like: 0, love: 0, haha: 0, lulu: 0 } }
}: PostProps) {
    const navigate = useNavigate();
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const videoRefs = useRef<Record<number, HTMLVideoElement>>({});
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const currentUserId = localStorage.getItem('userId') || '';
    const timestamp = datePosted ? datePosted : 0;
    const timeAgo = getRelativeTime(new Date(timestamp).toISOString());
    // Use state to track reactions but initialize from props
    const [reactionCount, setReactionCount] = useState(initialReactionCount);
    const [reactionDetails, setReactionDetails] = useState(initialReactionDetails);
    const [reaction, setReaction] = useState(initialReaction);

    // Update state if props change
    useEffect(() => {
        setReactionCount(initialReactionCount);
        setReactionDetails(initialReactionDetails);
        setReaction(initialReaction);
    }, [initialReactionCount, initialReactionDetails, initialReaction]);

    const handleReportClick = () => {
        setIsReportModalOpen(true);
    };

    const [executeDeletePost] = useApiCall(deletePost);
    const [executeDeleteCommunityPost] = useApiCall(deleteCommunityPost);

    // Determine if we should show a carousel or a single image
    const hasMultipleMedia = media && media.length > 1;
    const hasSingleMedia = (media && media.length === 1);

    const confirmDeletePost = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePost = async () => {
        if (!feedId) return;
        setIsDeleteDialogOpen(false);
        let result;
        if (isCommunity) {
            result = await executeDeleteCommunityPost(communityId ?? "", feedId);
        }
        else {
            result = await executeDeletePost(feedId);
        }

        if (result.success) {
            toast.success("Post deleted successfully");
            if (window.location.pathname === `/post/${feedId}`) {
                navigate(-1);
            }
            else if (onDelete) {
                onDelete(feedId);
            }
        }
    };

    const handleEditPost = () => {
        navigate(`/edit-post/${feedId}`, {
            state: {
                caption,
                postId: feedId,
                media
            }
        });
    };

    // Handle reaction changes
    const handleReactionChange = (hasReacted: boolean, reactionType: string | null) => {
        // Update local state optimistically for better UI experience
        setReaction({
            hasReacted,
            reactionType
        });
        
        // Update reaction count optimistically
        // If adding a reaction and previously had none
        if (hasReacted && !reaction.hasReacted) {
            setReactionCount((prev: number) => prev + 1);
        } 
        // If removing a reaction
        else if (!hasReacted && reaction.hasReacted) {
            setReactionCount((prev: number) => Math.max(0, prev - 1));
        }
        // If changing reaction type, count stays the same
        
        // Notify parent component about the change (if needed)
        if (onLikeClick) {
            onLikeClick();
        }
    };

    const menuItems = [];

    if (isOwner) {
        menuItems.push(
            {
                ...EditPostMenuItem,
                onClick: handleEditPost
            },
            {
                ...DeleteMenuItem,
                onClick: confirmDeletePost
            }
        );
    } else {
        menuItems.push({
            ...ReportMenuItem,
            onClick: handleReportClick
        });
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
        
        // Update all video elements for this post
        Object.values(videoRefs.current).forEach(videoEl => {
            if (videoEl) {
                videoEl.muted = !isMuted;
            }
        });
    };

    // Handle profile navigation
    const handleProfileClick = () => {
        if (isCommunity && communityId) {
            navigate(`/community/${communityId}`);
        } else {
            navigate(`/profile/${userId}`);
        }
    };

    return (
        <>
            <Card className="rounded-none border-x-0 border-t-0 shadow-none mb-4 " data-post-id={feedId}>
                {/* Video observer component to handle autoplay/pause based on visibility */}
                {feedId && <VideoObserver feedId={feedId} media={media} />}
                
                <div className="flex items-center justify-between p-4 pb-2">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={handleProfileClick}
                    >
                        <Avatar>
                            <AvatarImage src={isAnonymous ? "/profile/anonymous.png" : avatar} alt={isAnonymous ? "Anonymous" : user} />
                            <AvatarFallback>{isAnonymous ? "A" : user?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold flex items-center gap-2">
                                {isAnonymous ? "Anonymous" : user}
                                {isCommunityAdmin && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#4f9dc7]">
                                        <path d="M9 12l2 2 4-4"></path>
                                        <circle cx="12" cy="12" r="10"></circle>
                                    </svg>
                                )}
                            </p>
                        </div>
                    </div>
                    <ThreeDotsMenu items={menuItems} />
                </div>
                <CardContent className="p-4 pt-0">
                    <TruncatedText 
                        text={caption} 
                        limit={400} 
                        showToggle={true} 
                        className="text-card-foreground w-full mt-0" 
                        buttonClassName="text-foreground text-xs mt-1 cursor-pointer hover:underline font-bold"
                        align="left"
                    />

                    {hasMultipleMedia && media && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {media.map((item, index) => (
                                        <CarouselItem key={`${userId}-media-${index}`}>
                                            {item.type === "image" && (
                                                <div className="max-h-[100vh] relative bg-background flex items-end justify-center">
                                                    <img
                                                        src={item.url}
                                                        alt={`Post media ${index + 1}`}
                                                        className="max-h-[100vh] w-full object-contain"
                                                    />
                                                </div>
                                            )}
                                            {item.type === "video" && (
                                                <div 
                                                    className="max-h-[100vh] relative bg-background flex items-center justify-center"
                                                    onMouseEnter={() => setShowControls(true)}
                                                    onMouseLeave={() => setShowControls(false)}
                                                >
                                                    <video
                                                        ref={el => {
                                                            if (el) videoRefs.current[index] = el;
                                                        }}
                                                        src={item.url}
                                                        className="max-h-[100vh] w-full object-contain"
                                                        autoPlay
                                                        loop
                                                        muted={isMuted}
                                                        playsInline
                                                    />
                                                    <button 
                                                        className={`absolute bottom-4 right-4 p-2 bg-background/70 rounded-full hover:bg-background transition-colors cursor-pointer ${showControls ? 'opacity-100' : 'opacity-0'}`}
                                                        onClick={toggleMute}
                                                    >
                                                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            )}
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2 bg-background/80" />
                                <CarouselNext className="right-2 bg-background/80" />
                            </Carousel>
                        </div>
                    )}
                    
                    {!hasMultipleMedia && hasSingleMedia && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                            {media && media.length > 0 && media[0].type === "image" && (
                                <div className="max-h-[100vh] relative bg-background flex items-center justify-center">
                                    <img
                                        src={media[0].url}
                                        alt="Post"
                                        className="max-h-[100vh] w-full object-contain"
                                    />
                                </div>
                            )}
                            {media && media.length > 0 && media[0].type === "video" && (
                                <div 
                                    className="max-h-[100vh] relative bg-background flex items-center justify-center"
                                    onMouseEnter={() => setShowControls(true)}
                                    onMouseLeave={() => setShowControls(false)}
                                >
                                    <video
                                        ref={el => {
                                            if (el) videoRefs.current[0] = el;
                                        }}
                                        src={media[0].url}
                                        className="max-h-[100vh] w-full object-contain"
                                        autoPlay
                                        loop
                                        muted={isMuted}
                                        playsInline
                                    />
                                    <button 
                                        className={`absolute bottom-4 right-4 p-2 bg-background/70 rounded-full hover:bg-background transition-colors cursor-pointer ${showControls ? 'opacity-100' : 'opacity-0'}`}
                                        onClick={toggleMute}
                                    >
                                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4 text-muted-foreground">
                        <div className="flex items-center gap-3">
                            {feedId && (
                                <ReactionComponent 
                                    entityId={feedId}
                                    entityType="feed"
                                    initialReaction={reaction}
                                    initialTotalCount={reactionCount}
                                    initialReactionCounts={reactionDetails.types}
                                    onReactionChange={handleReactionChange}
                                    isCommunity={isCommunity}
                                    communityId={communityId}
                                />
                            )}

                            <button
                                className="flex items-center gap-1 hover:text-primary cursor-pointer"
                                onClick={onCommentClick}
                            >
                                <MessageCircle className="w-5 h-5" /> {comments}
                            </button>
                            <button
                                className="flex items-center gap-1 hover:text-primary cursor-pointer"
                                onClick={() => setIsShareDialogOpen(true)}
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                         {agoTimeString || timeAgo}
                        </div>
                    </div>
                </CardContent>

                {feedId && (
                    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                        <DialogContent className="sm:max-w-md h-[80vh]">
                            <SharePostPage
                                postData={{
                                    _id: feedId,
                                    author: userId,
                                    data: {
                                        content: caption,
                                        media: media && media.length > 0
                                            ? media
                                            : []
                                    },
                                    isCommunity,
                                    communityId,
                                    feedId: feedId,
                                    name: user
                                }}
                                onClose={() => setIsShareDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </Card>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                postId={feedId}
                reporterId={currentUserId}
            />

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-between sm:justify-between gap-2 mt-4">
                        <Button variant="outline" className="cursor-pointer" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={handleDeletePost}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}