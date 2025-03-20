import React, { useRef, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import {
  Message,
  addMessage,
  setIsTyping,
  setLoadingMessages,
  setMessages,
} from "@/store/chatSlice";
import { useApiCall } from "@/apis/globalCatchError";
import { getMessages } from "@/apis/commonApiCalls/chatApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { useState } from "react";
import ThreeDotsMenu, { 
  BlockMenuItem,
  ReportMenuItem,
  EditGroupMenuItem 
} from "@/components/global/ThreeDotsMenu";
import { toast } from "sonner";
import { blockUser as blockUserApi } from "@/apis/commonApiCalls/activityApi";
import { Link, useNavigate } from "react-router-dom";
import { EditGroupModal } from "./EditGroupModal";

// Define types for socket responses
interface MessageResponse {
  _id?: string;
  content: string;
  senderId: string;
  timestamp?: number;
  chatId?: string;
  senderName?: string;
  senderAvatar?: string;
}

interface TypingResponse {
  chatId: string;
  senderId: string;
}

interface SendMessageResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    content: string;
    timestamp: number;
  };
}

interface ChatInterfaceProps {
  chatId: string;
  name: string;
  avatar: string;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatId,
  name,
  avatar,
  onClose,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const userId = localStorage.getItem("userId") || "";
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [executeGetMessages] = useApiCall(getMessages);
  const navigate = useNavigate();
  const [executeBlockUser] = useApiCall(blockUserApi);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);

  const dispatch = useAppDispatch();
  const {
    messages,
    isLoadingMessages,
    isTyping,
    activeChat: chat,
  } = useAppSelector((state) => state.chat);

  // Find current user's info from participants
  const currentUserInfo = chat?.participants.find((p) => p.userId === userId);
  const userName = currentUserInfo?.name || "You";
  const userAvatar = currentUserInfo?.profilePic || "";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth",block: "end"});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessageHistory = async () => {
      if (!chatId) {
        console.error("Invalid chat ID:", chatId);
        return;
      }

      dispatch(setLoadingMessages(true));

      console.log("chatId", chatId);
      const result = await executeGetMessages({
        roomId: chatId,
        page: 1,
        limit: 50,
      });

      if (result.success && result.data) {
        const messageHistory = result.data.messages
          .map((msg) => {
            // Find sender info from participants
            const sender = chat?.participants.find(
              (p) => p.userId === msg.senderId
            );
            return {
              id: msg._id,
              text: msg.content,
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              senderId: msg.senderId,
              isUser: msg.senderId === userId,
              senderName:
                msg.senderId === userId ? userName : sender?.name || "Unknown",
              senderAvatar:
                msg.senderId === userId ? userAvatar : sender?.profilePic || "",
            };
          })
          .reverse(); // Reverse the order of messages
        dispatch(setMessages(messageHistory));
      }
      dispatch(setLoadingMessages(false));
    };

    // Clear messages when changing chats
    dispatch(setMessages([]));

    console.log("Socket", socket);

    if (socket && chatId) {
      // Join the chat room
      console.log("Join emitted");
      socket.emit("join", chatId);
      fetchMessageHistory();

      // Set up socket event listeners
      const handleReceiveMessage = (data: MessageResponse) => {
        console.log("Received message:", data);
        // Find sender info from participants
        if (data.senderId === userId) {
          return;
        }
        const sender = chat?.participants.find(
          (p) => p.userId === data.senderId
        );

        const newMsg: Message = {
          id: data._id || `temp-${Date.now()}`,
          text: data.content,
          timestamp: new Date(
            data.timestamp ? data.timestamp * 1000 : Date.now()
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isUser: data.senderId === userId,
          senderName:
            data.senderId === userId
              ? userName
              : sender?.name || data.senderName || "Unknown",
          senderAvatar:
            data.senderId === userId
              ? userAvatar
              : sender?.profilePic || data.senderAvatar || "",
        };
        dispatch(addMessage(newMsg));
      };

      const handleTypingEvent = (data: TypingResponse) => {
        if (data.chatId === chatId && data.senderId !== userId) {
          dispatch(setIsTyping(true));
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            dispatch(setIsTyping(false));
          }, 2000);
        }
      };

      // Add event listeners
      socket.on("receiveMessage", handleReceiveMessage);
      socket.on("typing", handleTypingEvent);

      socket.on("success", (data) => {
        console.log("Message sent successfully", data);
      });

      // Clean up function
      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
        socket.off("typing", handleTypingEvent);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        // Leave the room when component unmounts or chat changes
        socket.emit("leave", chatId);
      };
    }
  }, [socket, chatId, userId, chat]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket && chatId) {
      // Create message data
      const messageData = {
        senderId: userId,
        content: newMessage,
        entityId: chatId,
        media: null,
        entity: "chat",
        isBot: false,
        senderName: userName,
        senderAvatar: userAvatar,
      };

      // Add message to local state immediately for better UX
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isUser: true,
        senderName: userName,
        senderAvatar: userAvatar,
      };
      dispatch(addMessage(tempMessage));

      // Send message through socket
      socket.emit(
        "sendMessage",
        messageData,
        (response: SendMessageResponse) => {
          console.log("Message sent response:", response);
          // If there's an error, we could handle it here
        }
      );

      // Clear input
      setNewMessage("");
    }
  };

  const handleTyping = () => {
    if (socket && chatId) {
      socket.emit("typing", { chatId: chatId, senderId: userId });
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleProfileClick = () => {
    if (chat?.type === "dm") {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(p => p.userId !== userId);
      if (otherParticipant) {
        navigate(`/profile/${otherParticipant.userId}`);
      }
    }
  };

  const handleBlock = async () => {
    if (chat?.type === "dm") {
      const otherParticipant = chat.participants.find(p => p.userId !== userId);
      if (otherParticipant) {
        await executeBlockUser(otherParticipant.userId);
        toast.success(`${otherParticipant.name} has been blocked`);
        onClose(); 
      }
    }
  };

  const handleEditGroup = () => {
    setIsEditGroupModalOpen(true);
  };

  const handleGroupUpdated = () => {
    // Refresh chat data or update local state as needed
    // This will be called after successful group update
  };

  // Prepare menu items based on chat type
  const menuItems = [];
  
  if (chat?.type === "dm") {
    // For DM chats -> block
    menuItems.push({
      ...BlockMenuItem,
      onClick: handleBlock
    });
  } else if (chat?.type === "group") {
    // For group chats -> report, edit group
    menuItems.push({
      ...ReportMenuItem,
      onClick: () => console.log('Report clicked')
    });
    menuItems.push({
      ...EditGroupMenuItem,
      onClick: handleEditGroup
    });
  }

  if (!chat) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>No chat selected</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = message.timestamp.split(",")[0];
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  // Find the typing user
  const typingUser = isTyping
    ? chat.participants.find((p) => p.userId !== userId)
    : null;

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="p-1 cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleProfileClick}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{name}</h3>
              <p className="text-xs text-muted-foreground">
                {chat.type === "dm"
                  ? "online"
                  : `${chat.type} · ${chat.participants.length} members`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThreeDotsMenu items={menuItems} />
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Check if this is the first message from this user or if the previous message was from a different sender
            const isPreviousDifferentSender =
              index === 0 ||
              messages[index - 1].senderName !== message.senderName;

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Only show avatar for group chats and for the first message in a sequence from each sender */}
                {chat.type === "group" && isPreviousDifferentSender && (
                  <Link to={`/profile/${message.isUser ? userId : message.senderId}`}>
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarImage
                      src={message.senderAvatar || ""}
                      alt={message.senderName || "Unknown"}
                    />
                    <AvatarFallback>
                      {(message.senderName || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  </Link>
                )}
                {/* Add a spacer when we don't show the avatar to keep alignment */}
                {(chat.type !== "dm" && !isPreviousDifferentSender) && <div className="w-7" />}
                <div
                  className={`max-w-[70%] p-3 rounded-lg break-words ${
                    message.isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none"
                  }`}
                >
                  {/* Show sender name only for group chats and first message from each sender */}
                  {chat.type === "group" &&
                    !message.isUser &&
                    isPreviousDifferentSender && (
                      <p className="text-xs font-medium mb-1">
                        {message.senderName || "Unknown"}
                      </p>
                    )}
                  <p>{message.text}</p>
                  <span className="text-xs opacity-70 block text-right mt-1">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex items-start gap-2">
            <Avatar className="h-6 w-6 mt-1">
              <AvatarImage
                src={typingUser?.profilePic || avatar}
                alt={typingUser?.name || name}
              />
              <AvatarFallback>{(typingUser?.name || name)[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-muted p-2 rounded-md text-sm rounded-tl-none">
              <span>typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t border-border flex items-center gap-2 py-6">
        <Input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type Your Message Here..."
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="bg-primary text-primary-foreground rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </Button>
      </div>

      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        groupName={name}
        bio={chat?.bio || ""}
        profileUrl={avatar}
        groupId={chatId}
        onGroupUpdated={handleGroupUpdated}
      />
    </div>
  );
};

export default ChatInterface;