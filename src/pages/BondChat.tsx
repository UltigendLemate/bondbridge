import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { ArrowLeft, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSocket } from "@/context/SocketContext";
import { useApiCall } from "@/apis/globalCatchError";
import { getMessages } from "@/apis/commonApiCalls/chatApi";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Extend the Message type to support complex content
interface ExtendedMessage extends Omit<Message, "text"> {
  text: string | MessageContent;
}

interface UserRecommendation {
  _id: string;
  name: string;
  nickName: string;
  profilePic: string;
  interests: string[];
  matchingInterestsCount: number;
  hasMessageInterest: boolean;
}

interface MessageContent {
  message: string;
  users?: UserRecommendation[];
}

interface MessageResponse {
  _id?: string;
  content: string | MessageContent;
  senderId: string;
  timestamp?: number;
  chatId?: string;
  senderName?: string;
  senderAvatar?: string;
  isBot?: boolean;
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

// Custom component for user recommendation cards
const UserCard = ({ user }: { user: UserRecommendation }) => {
  // Display up to 3 interests with a "+n more" indicator if needed
  const displayedInterests = user.interests.slice(0, 3);
  const remainingCount = Math.max(0, user.interests.length - 3);

  return (
    <Link to={`/profile/${user._id}`} className="block">
      <div className="flex items-start border-2 border-primary/25 gap-3 p-4 bg-muted/50 rounded-lg mb-2 hover:bg-muted transition-colors">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.profilePic} alt={user.name} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <span className="font-medium">{user.name}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {displayedInterests.map((interest, index) => (
                <Badge variant="outline" className="text-xs border-primary">
                  {interest}
                </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs border-primary">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Custom component for rendering bot messages with potential user recommendations
const BotMessage = ({ message }: { message: ExtendedMessage }) => {
  // Check if the message has content that includes user recommendations
  const hasUserRecommendations =
    typeof message.text === "object" &&
    "users" in message.text &&
    Array.isArray(message.text.users);

  // Extract the message text and user recommendations if available
  const messageText = hasUserRecommendations
    ? (message.text as MessageContent).message
    : typeof message.text === "string"
    ? message.text
    : "";

  const users = hasUserRecommendations
    ? (message.text as MessageContent).users || []
    : [];

  return (
    <div className="flex items-start gap-2 mb-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/bondchat.svg" alt="Bond Chat" />
        <AvatarFallback>BC</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted p-3 rounded-lg text-foreground rounded-tl-none">
          <p>{messageText}</p>
          <span className="text-xs opacity-70 block text-right mt-1">
            {message.timestamp}
          </span>
        </div>

        {users.length > 0 && (
          <div className="mt-2">
            {users.map((user, index) => (
              <UserCard key={index} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Custom component for user messages
const UserMessage = ({ message }: { message: ExtendedMessage }) => {
  return (
    <div className="flex items-start gap-2 mb-4 flex-row-reverse">
      <div className="bg-primary p-3 rounded-lg text-primary-foreground rounded-tr-none max-w-[70%]">
        <p>{typeof message.text === "string" ? message.text : ""}</p>
        <span className="text-xs opacity-70 block text-right mt-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};

export default function BondChat() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions] = useState([
    "This is the for fast reply",
    "This is the suggestion for fast reply",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();
  const [executeGetMessages] = useApiCall(getMessages);
  const userId = localStorage.getItem("userId") || "";
  const roomId = userId; // Using userId as the roomId for BondChat

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    // Join the room
    console.log("Joining BondChat room:", roomId);
    socket.emit("join", roomId);

    // Fetch message history
    const fetchMessageHistory = async () => {
      setIsLoading(true);
      try {
        const result = await executeGetMessages({
          roomId,
          page: 1,
          limit: 50,
        });

        if (result.success && result.data) {
          const messageHistory = result.data.messages
            .map((msg) => {
              // Try to parse content if it's a string that might be JSON
              let parsedContent: string | MessageContent = msg.content;
              if (typeof msg.content === "string") {
                try {
                  const possibleJson = JSON.parse(msg.content);
                  if (possibleJson && typeof possibleJson === "object") {
                    parsedContent = possibleJson as MessageContent;
                  }
                } catch {
                  // Not JSON, keep as string
                }
              }

              return {
                id: parseInt(msg._id) || Date.now(),
                text: parsedContent,
                timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isUser: msg.senderId === userId,
                avatar:
                  msg.senderId === userId
                    ? "/profile/user.png"
                    : "/bondchat.svg",
                username: msg.senderId === userId ? "You" : "Bond Chat",
              };
            })
            .reverse(); // Reverse to show newest at the bottom
          setMessages(messageHistory);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load message history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessageHistory();

    // Set up socket event listeners
    const handleReceiveMessage = (data: MessageResponse) => {
      console.log("Received message:", data);
      // Skip if it's our own message (we'll add it optimistically)
      if (data.senderId === userId) return;

      // Handle different content types
      let messageContent: string | MessageContent =
        typeof data.content === "string" ? data.content : data.content;

      // If content is a string but might be JSON, try to parse it
      if (typeof data.content === "string") {
        try {
          const possibleJson = JSON.parse(data.content);
          if (possibleJson && typeof possibleJson === "object") {
            messageContent = possibleJson as MessageContent;
          }
        } catch {
          // Not JSON, keep as string
        }
      }

      const newMsg: ExtendedMessage = {
        id: data._id ? parseInt(data._id) : Date.now(),
        text: messageContent,
        timestamp: new Date(
          data.timestamp ? data.timestamp * 1000 : Date.now()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isUser: false,
        avatar: "/bondchat.svg",
        username: "Bond Chat",
      };
      setMessages((prev) => [...prev, newMsg]);
    };

    // Add event listeners
    socket.on("receiveMessage", handleReceiveMessage);

    // Clean up function
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      // Leave the room when component unmounts
      socket.emit("leave", roomId);
    };
  }, [socket, isConnected, userId]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !socket || !isConnected) return;

    // Create message data
    const messageData = {
      senderId: userId,
      content: text,
      entityId: roomId,
      media: null,
      entity: "chat",
      isBot: true, // Set isBot flag to true
      senderName: "You",
      senderAvatar: "/profile/user.png",
    };

    // Add message to local state immediately for better UX
    const tempMessage: ExtendedMessage = {
      id: Date.now(),
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isUser: true,
      avatar: "/profile/user.png",
      username: "You",
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Send message through socket
    socket.emit("sendMessage", messageData, (response: SendMessageResponse) => {
      console.log("Message sent response:", response);
      if (!response.success) {
        toast.error("Failed to send message");
      }
    });
  };

  return (
    <div className="flex flex-col bg-background relative h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src="/bondchat.svg" alt="Bond Chat" className="w-8 h-8" />
          <span className="font-medium grad">BondChat</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            Basic
          </span>
        </div>
        <div className="ml-auto gap-2 flex items-center">
          <Button size="sm" variant="default" className="rounded-full">
            New +
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-muted-foreground"
          >
            <History />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden h-full relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center h-full p-4 mb-20 font-bold capitalize text-6xl space-y-3">
            <h3 className="">Hey, </h3>
            <h3 className="">
              I'm <span className="grad">BondChat</span>
            </h3>
            <p className="text-muted-foreground font-normal text-xl">
              Your Favourite GPT At Work
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 mb-20 ">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p>Loading messages...</p>
              </div>
            ) : (
              messages.map((message) =>
                message.isUser ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <BotMessage key={message.id} message={message} />
                )
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick Suggestions */}
        <div className="px-4 relative -top-[75px]">
          {messages.length == 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              Quick suggestion
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="bg-muted text-muted-foreground px-3 py-2 rounded-full text-xs"
                onClick={() => handleSendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type Your Message Here..."
          />
        </div>
      </div>
    </div>
  );
}
