import { Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import ThreeDotsMenu from "@/components/global/ThreeDotsMenu";
import { useState } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export interface MediaItem {
    url: string;
    type: string;
}

export interface PostProps {
    user: string;
    userId: string;
    avatar: string;
    caption: string;
    image?: string; // Made optional since we now support media array
    media?: MediaItem[]; // New property for multiple media items
    likes: number;
    comments: number;
    datePosted: string;
    isOwner?: boolean;
    onCommentClick?: () => void;
    onLikeClick?: () => void;
}

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
    onLikeClick 
}: PostProps) {
    const navigate = useNavigate();
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);

    const handleLikeClick = () => {
        if (!isLiked) {
            setLikes(prev => prev + 1);
            setIsLiked(true);
            onLikeClick?.();
        } else {
            setLikes(prev => prev - 1);
            setIsLiked(false);
            onLikeClick?.();
        }
    };

    // Determine if we should show a carousel or a single image
    const hasMultipleMedia = media && media.length > 1;
    const hasSingleMedia = (media && media.length === 1) || image;

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
                <ThreeDotsMenu
                    showDelete={isOwner}
                    onShare={() => console.log('Share clicked')}
                    onReport={() => console.log('Report clicked')}
                    onDelete={() => console.log('Delete clicked')}
                />
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
                                            <img
                                                src={item.url}
                                                alt={`Post media ${index + 1}`}
                                                className="w-full max-h-[500px] object-contain bg-muted"
                                            />
                                        )}
                                        {item.type === "video" && (
                                            <video
                                                src={item.url}
                                                controls
                                                className="w-full max-h-[500px] object-contain bg-muted"
                                            />
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
                        <img
                            src={media ? media[0].url : image}
                            alt="Post"
                            className="w-full max-h-[500px] object-contain bg-muted"
                        />
                    </div>
                )}
                
                <div className="flex items-center justify-between mt-4 text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <button 
                            className={`flex items-center gap-1 ${isLiked ? 'text-destructive' : 'hover:text-destructive'}`}
                            onClick={handleLikeClick}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> {likes}
                        </button>
                        <button
                            className="flex items-center gap-1 hover:text-primary"
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