import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { setActiveChat, ChatItem, markChatAsRead } from "@/store/chatSlice";
import { useAppDispatch } from "../../store";
import { markMessageAsSeen } from "@/apis/commonApiCalls/chatApi";
import { useCallback } from "react";

interface ChatListProps {
  chats: ChatItem[];
  isLoading: boolean;
  onSelectChat: (chat: ChatItem) => void;
}

const ChatList = ({ chats, isLoading, onSelectChat }: ChatListProps) => {
  const dispatch = useAppDispatch();

  const handleChatSelect = useCallback(async (chat: ChatItem) => {
    dispatch(setActiveChat(chat));
    onSelectChat(chat);

    // If the chat has unread messages, mark them as seen
    if (chat.unread) {
      try {
        // Call the API to mark the message as seen
        await markMessageAsSeen({
          entityId: chat.id,
          reactionType: "seen"
        });
        
        // Update the Redux store to reflect the chat as read
        dispatch(markChatAsRead(chat.id));
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    }
  }, [dispatch, onSelectChat]);

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading chats...</div>;
  }

  return (
    <div className="space-y-1">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer"
          onClick={() => handleChatSelect(chat)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={chat.avatar} alt={chat.name} />
              <AvatarFallback>{chat.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={cn("font-medium", chat.unread && "font-semibold")}
                >
                  {chat.name}
                </h3>
                {chat.unread && (
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {chat.lastMessage}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {chat.timestamp}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
