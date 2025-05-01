import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SidebarAvatarProps {
  id: string;
  username: string;
  avatarSrc: string;
}

const SidebarAvatar: React.FC<SidebarAvatarProps> = ({
  id,
  username,
  avatarSrc,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${id}`);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        "border border-border/50 hover:border-border",
        "shadow-none",
        "p-2"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <Avatar className={cn(
          "border-2 border-border/50",
          "h-8 w-8"
        )}>
          <AvatarImage src={avatarSrc} alt={username} />
          <AvatarFallback className="bg-primary/5 text-primary font-medium">
            {username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 justify-between items-center w-full">
           <p className="text-sm font-medium text-foreground truncate">{username}</p>
           <svg
        className="h-5 w-5 text-sidebar-foreground/40"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
        </div>
      </div>
    </Card>
  );
};

export default SidebarAvatar;
