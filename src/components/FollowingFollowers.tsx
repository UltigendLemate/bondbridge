import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchFollowingList, fetchFollowersList, unfollowUser, removeFollower } from "@/apis/commonApiCalls/profileApi";
import { FollowingFollowerUser } from "@/apis/apiTypes/profileTypes";
import { useApiCall } from "@/apis/globalCatchError";
import { Loader2, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { TruncatedText } from "@/components/ui/TruncatedText";

interface FollowingFollowersProps {
  sidebar?: boolean;
}

const FollowingFollowers = ({ sidebar = false }: FollowingFollowersProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "following";
  
  const [following, setFollowing] = useState<FollowingFollowerUser[]>([]);
  const [followers, setFollowers] = useState<FollowingFollowerUser[]>([]);
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(null);
  const [removingFollowerId, setRemovingFollowerId] = useState<string | null>(null);
  
  const [executeFetchFollowing, isLoadingFollowing] = useApiCall(fetchFollowingList);
  const [executeFetchFollowers, isLoadingFollowers] = useApiCall(fetchFollowersList);
  const [executeUnfollow] = useApiCall(unfollowUser);
  const [executeRemoveFollower] = useApiCall(removeFollower);

  useEffect(() => {
    const loadData = async () => {
      const [followingResult, followersResult] = await Promise.all([
        executeFetchFollowing(),
        executeFetchFollowers()
      ]);

      if (followingResult.success && followingResult.data) {
        setFollowing(followingResult.data.data || []);
      }
      if (followersResult.success && followersResult.data) {
        setFollowers(followersResult.data.data || []);
      }
    };

    loadData();
  }, []);

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleUnfollow = async (userId: string) => {
    setUnfollowingUserId(userId);
    const result = await executeUnfollow(userId);
    if (result.success) {
      // Remove the unfollowed user from the following list
      setFollowing(following.filter(user => user._id !== userId));
      toast.success("Successfully unfollowed user");
    }
    setUnfollowingUserId(null);
  };

  const handleRemoveFollower = async (userId: string) => {
    setRemovingFollowerId(userId);
    const result = await executeRemoveFollower(userId);
    if (result.success) {
      // Remove the user from the followers list
      setFollowers(followers.filter(user => user._id !== userId));
      toast.success("Successfully removed follower");
    }
    setRemovingFollowerId(null);
  };

  const renderLoading = () => (
    <div className={cn(
      "flex justify-center items-center",
      sidebar ? "min-h-[100px]" : "min-h-[200px]"
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sidebar ? "h-5 w-5" : "h-8 w-8"
      )} />
    </div>
  );

  const renderEmptyState = () => (
    <div className={cn(
      "text-center text-muted-foreground",
      sidebar ? "py-3" : "py-8"
    )}>
      No Users Found
    </div>
  );

  const FollowingList = ({ users, isLoading }: { users: FollowingFollowerUser[], isLoading: boolean }) => {
    if (isLoading) {
      return renderLoading();
    }

    if (!Array.isArray(users) || users.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-2">
        {users.map((user) => (
          <Card
            key={user._id}
            className={cn(
              "transition-all duration-200 hover:shadow-md",
              "border border-border/50 hover:border-border",
              sidebar && "shadow-none"
            )}
          >
            <div className={cn(
              "flex items-center",
              sidebar ? "p-2" : "p-4"
            )}>
              <div 
                className="flex items-center gap-2 flex-1 cursor-pointer overflow-hidden pr-2" 
                onClick={() => handleUserClick(user._id)}
              >
                <Avatar className={cn(
                  "border-2 border-border/50 flex-shrink-0",
                  sidebar ? "h-8 w-8" : "h-12 w-12"
                )}>
                  <AvatarImage src={user.profilePic || user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/5 text-primary font-medium">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col w-full overflow-hidden">
                  <span className="font-medium text-foreground truncate w-full">
                    {user.name}
                  </span>
                  {!sidebar && (
                    <TruncatedText 
                      text={user.bio} 
                      limit={50}
                      className="text-sm text-muted-foreground" 
                      buttonClassName="text-primary ml-1 cursor-pointer hover:underline"
                      showToggle={false}
                    />
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size={sidebar ? "sm" : "sm"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnfollow(user._id);
                }}
                disabled={unfollowingUserId === user._id}
                className={cn(
                  "justify-center cursor-pointer",
                  sidebar ? "min-w-[60px] py-1 px-2 h-7" : "min-w-[80px]"
                )}
              >
                {unfollowingUserId === user._id ? (
                  <><Loader2 className="h-3 w-3 animate-spin mr-1" /> {sidebar ? 'Un...' : 'Unfollowing'}</>
                ) : (
                  'Unfollow'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const FollowersList = ({ users, isLoading }: { users: FollowingFollowerUser[], isLoading: boolean }) => {
    if (isLoading) {
      return renderLoading();
    }

    if (!Array.isArray(users) || users.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-2">
        {users.map((user) => (
          <Card
            key={user._id}
            className={cn(
              "transition-all duration-200 hover:shadow-md",
              "border border-border/50 hover:border-border",
              sidebar && "shadow-none"
            )}
          >
            <div className={cn(
              "flex items-center",
              sidebar ? "p-2" : "p-4"
            )}>
              <div 
                className="flex items-center gap-2 flex-1 cursor-pointer overflow-hidden pr-2" 
                onClick={() => handleUserClick(user._id)}
              >
                <Avatar className={cn(
                  "border-2 border-border/50 flex-shrink-0",
                  sidebar ? "h-8 w-8" : "h-12 w-12"
                )}>
                  <AvatarImage src={user.profilePic || user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/5 text-primary font-medium">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col w-full overflow-hidden">
                  <span className="font-medium text-foreground truncate w-full">
                    {user.name}
                  </span>
                  {!sidebar && (
                    <TruncatedText 
                      text={user.bio} 
                      limit={50}
                      className="text-sm text-muted-foreground" 
                      buttonClassName="text-primary text-xs ml-1 cursor-pointer hover:underline"
                      showToggle={false}
                    />
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size={sidebar ? "sm" : "sm"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFollower(user._id);
                }}
                disabled={removingFollowerId === user._id}
                className={cn(
                  "justify-center cursor-pointer",
                  sidebar ? "min-w-[60px] py-1 px-2 h-7" : "min-w-[80px]"
                )}
              >
                {removingFollowerId === user._id ? (
                  <><Loader2 className="h-3 w-3 animate-spin mr-1" /> {sidebar ? 'Rem...' : 'Removing'}</>
                ) : (
                  'Remove'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={cn(
      sidebar ? "mx-auto" : "container max-w-2xl mx-auto py-4 px-4"
    )}>
      {!sidebar && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className={cn(
          "grid w-full grid-cols-2",
          sidebar ? "mb-3" : "mb-6"
        )}>
          <TabsTrigger value="following" className="cursor-pointer">Following</TabsTrigger>
          <TabsTrigger value="followers" className="cursor-pointer">Followers</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="following" className="mt-0">
            <motion.div
              key="following"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <FollowingList users={following} isLoading={isLoadingFollowing} />
            </motion.div>
          </TabsContent>

          <TabsContent value="followers" className="mt-0">
            <motion.div
              key="followers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FollowersList users={followers} isLoading={isLoadingFollowers} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default FollowingFollowers; 