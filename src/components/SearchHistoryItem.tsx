import { SearchHistoryUser } from "@/apis/apiTypes/searchHistory";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { removeFromSearchHistory } from "@/apis/commonApiCalls/searchHistoryApi";
import { useApiCall } from "@/apis/globalCatchError";
import { toast } from "sonner";

interface SearchHistoryItemProps {
  user: SearchHistoryUser;
  onRemove: () => void;
  onRevert: () => void;
}

export const SearchHistoryItem = ({ user, onRemove, onRevert }: SearchHistoryItemProps) => {
  const navigate = useNavigate();
  const [executeRemoveFromHistory] = useApiCall(removeFromSearchHistory);

  const handleProfileClick = () => {
    navigate(`/profile/${user.userId}`);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistically remove the item
    onRemove();
    
    const { success } = await executeRemoveFromHistory(user.userId);
    if (!success) {
      // Revert the optimistic update if the API call fails
      onRevert();
      toast.error("Failed to remove from search history");
    }
  };

  return (
    <div
      className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer"
      onClick={handleProfileClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profilePic} alt={user.name} className="h-8 w-8 rounded-full"/>
          <AvatarFallback className="bg-primary/5 text-primary font-medium">
            {user.name[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">{user.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-pointer border-1 border-destructive hover:border-foreground hover:bg-foreground/10"
        onClick={handleRemove}
      >
        <X className="h-4 w-4 text-foreground" />
      </Button>
    </div>
  );
}; 