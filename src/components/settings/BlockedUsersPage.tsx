import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setSettingsActive } from "@/store/settingsSlice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserX, UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import UserSearchDialog from "@/components/common/UserSearchDialog";
import { Person } from "@/apis/commonApiCalls/searchApi";
import { 
  unblockUser as unblockUserApi, 
  blockUser as blockUserApi,
  getBlockedUsers,
  BlockedUser
} from "@/apis/commonApiCalls/activityApi";
import { useApiCall } from "@/apis/globalCatchError";
import { toast } from "sonner";

const BlockedUsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState<string | null>(null);
  
  const [executeUnblockUser] = useApiCall(unblockUserApi);
  const [executeBlockUser] = useApiCall(blockUserApi);
  const [executeGetBlockedUsers] = useApiCall(getBlockedUsers);

  // Fetch blocked users from API
  const fetchBlockedUsers = async () => {
    setIsLoading(true);
    const result = await executeGetBlockedUsers();
    console.log("Blocked users from API:", result);
    if (result.success && result.data) {
      setBlockedUsers(result.data.blockedUsers);
    }
    setIsLoading(false);
  };

  // Fetch blocked users on component mount
  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (userId: string) => {
    console.log("Unblocking user:", userId);
    setUnblockingUser(userId);
    
    // Call the API to unblock the user
    const result = await executeUnblockUser(userId);
    console.log("Unblock API result:", result);
    
    if (result.success) {
      // Update local state by filtering out the unblocked user
      setBlockedUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
      toast.success("User unblocked successfully");
    } else {
      toast.error("Failed to unblock user");
    }
    
    setUnblockingUser(null);
  };

  const handleBlock = async (user: Person) => {
    console.log("Attempting to block user:", user);
    
    // Call the API to block the user
    const result = await executeBlockUser(user.id);
    console.log("Block API result:", result);
    
    if (result.success) {
      // Refresh the list of blocked users after blocking
      fetchBlockedUsers();
      toast.success(`${user.name} has been blocked successfully`);
    } else {
      toast.error(`Failed to block ${user.name}`);
    }
    
    setDialogOpen(false);
  };

  // Check if a user is already blocked
  const isUserBlocked = (userId: string) => {
    return blockedUsers.some(user => user.userId === userId);
  };
  
  // Handle user selection in dialog
  const handleUserSelection = async (user: Person) => {
    if (isUserBlocked(user.id)) {
      await handleUnblock(user.id);
    } else {
      await handleBlock(user);
    }
  };

  const handleCloseSettings = () => {
    dispatch(setSettingsActive(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium cursor-pointer">
          <ArrowLeft
            className="h-4 w-4 mr-2 inline"
            onClick={handleCloseSettings}
          />
          Blocked Users
        </h3>

        <UserSearchDialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          onSelectUser={handleUserSelection}
          triggerButton={
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Block User
            </Button>
          }
          title="Block a User"
          description="Search for a user to block. Blocked users won't be able to message you or see your content."
          actionIcon={<UserX className="h-4 w-4" />}
          actionLabel="Block"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : blockedUsers.length > 0 ? (
        <div className="space-y-2">
          {blockedUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 border border-border rounded-md"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profilePic} alt={user.name} />
                  <AvatarFallback>
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnblock(user.userId)}
                disabled={unblockingUser === user.userId}
              >
                {unblockingUser === user.userId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Unblock
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-border rounded-md">
          <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            You haven't blocked any users yet
          </p>
        </div>
      )}
    </div>
  );
};

export default BlockedUsersPage;
