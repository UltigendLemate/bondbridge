import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { useApiCall } from "@/apis/globalCatchError";
import { searchPeople, Person } from "@/apis/commonApiCalls/searchApi";
import { fetchFollowings } from "@/apis/commonApiCalls/activityApi";

interface UserSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: Person) => void;
  triggerButton: React.ReactNode;
  title: string;
  description: string;
  actionIcon: React.ReactNode;
  actionLabel?: string;
}

const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  isOpen,
  onOpenChange,
  onSelectUser,
  triggerButton,
  title,
  description,
  actionIcon,
  actionLabel,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [followings, setFollowings] = useState<Person[]>([]);
  const [executeSearch, isSearching] = useApiCall(searchPeople);
  const [executeFetchFollowings, isLoadingFollowings] =
    useApiCall(fetchFollowings);
  const [processingUsers, setProcessingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowings = async () => {
      const result = await executeFetchFollowings();
      if (result.success && result.data?.users) {
        const currentUserId = localStorage.getItem("userId") || "";
        const filteredFollowings = result.data.users.filter(
          (user) => user.id !== currentUserId
        );
        setFollowings(filteredFollowings);
      }
    };

    if (isOpen) {
      loadFollowings();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      const result = await executeSearch(searchQuery);
      if (result.success && result.data?.users) {
        const currentUserId = localStorage.getItem("userId") || "";
        const filteredResults = result.data.users.filter(
          (user) => user.id !== currentUserId
        );
        setSearchResults(filteredResults);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleUserAction = async (user: Person, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Set the user as processing
    setProcessingUsers(prev => ({ ...prev, [user.id]: true }));
    
    // Call the parent component's onSelectUser callback
    onSelectUser(user);
    
    // Reset processing state
    setProcessingUsers(prev => ({ ...prev, [user.id]: false }));
  };

  const displayUsers = searchQuery.trim() ? searchResults : followings;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-60 overflow-y-auto mt-2">
          {isSearching || isLoadingFollowings ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : displayUsers.length > 0 ? (
            displayUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => handleUserAction(user)}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium">{user.name}</span>
                    {user.bio && (
                      <p className="text-xs text-muted-foreground">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleUserAction(user, e)}
                  disabled={processingUsers[user.id]}
                >
                  {processingUsers[user.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    actionIcon
                  )}
                  {actionLabel && <span className="ml-2">{actionLabel}</span>}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {searchQuery ? "No users found" : "Type to search for users"}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearchDialog;
