import { ChatItem } from "@/store/chatSlice";
import { useAppDispatch } from "../../store";
import { setActiveChat } from "../../store/chatSlice";

interface GroupListProps {
  groups: ChatItem[];
  isLoading: boolean;
  onSelectGroup: (group: ChatItem) => void;
}

const GroupList = ({ groups, isLoading, onSelectGroup }: GroupListProps) => {
  const dispatch = useAppDispatch();

  const handleGroupSelect = (group: ChatItem) => {
    dispatch(setActiveChat(group));
    onSelectGroup(group);
    console.log("Group selected:", group);
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading groups...</div>;
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer"
          onClick={() => handleGroupSelect(group)}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
              <img
                src={group.avatar || "/profile/user.png"}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium">{group.name}</h3>
              <p className="text-sm text-muted-foreground">
                {group.lastMessage}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {group.timestamp}
          </span>
        </div>
      ))}
    </div>
  );
};

export default GroupList;
