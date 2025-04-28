import { useNavigate } from "react-router-dom";

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
    <li
      className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-lg"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <img
          src={avatarSrc}
          alt={`${username}'s avatar`}
          className="w-8 h-8 rounded-full object-cover"
        />
        <p className="text-sidebar-foreground truncate">{username}</p>
      </div>
      <svg
        className="h-5 w-5 text-sidebar-foreground/40"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </li>
  );
};

export default SidebarAvatar;
