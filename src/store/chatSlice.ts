import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatRoom } from "@/apis/apiTypes/response";

export interface ChatParticipantInfo {
  userId: string;
  name: string;
  profilePic: string;
}

export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type: "dm" | "group" | "community";
  bio?: string;
  admin?: string;
  participants: {
    userId: string;
    name: string;
    profilePic: string;
  }[];
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
  senderName?: string;
  senderAvatar?: string;
  senderId?: string;
}

// export interface GroupItem {
//   id: string;
//   name: string;
//   image: string | null;
//   members: number;
//   lastActive: string;
// }

interface ChatState {
  activeChat: ChatItem | null;
  chats: ChatItem[];
  filteredChats: {
    dms: ChatItem[];
    groups: ChatItem[];
    communities: ChatItem[];
  };
  messages: Message[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  isTyping: boolean;
}

const initialState: ChatState = {
  activeChat: null,
  chats: [],
  filteredChats: {
    dms: [],
    groups: [],
    communities: [],
  },
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
  isTyping: false,
  //   {
  //   id: 1,
  //   name: 'Michel Smithwick',
  //   avatar: '/profile/user.png',
  //   lastMessage: 'Hey, Nice to connect with you!',
  //   timestamp: '2h',
  //   unread: true
  // }
};

// Define a type for the possible lastMessage formats
interface LastMessageWithText {
  text: string;
}

interface LastMessageWithContent {
  content: string;
  messageId?: string;
  timestamp?: number;
}

type LastMessageType = string | LastMessageWithText | LastMessageWithContent;

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<ChatItem | null>) => {
      state.activeChat = action.payload;
    },
    setChats: (state, action: PayloadAction<ChatItem[]>) => {
      state.chats = action.payload;
      // Update filtered chats
      state.filteredChats = {
        dms: action.payload.filter((chat) => chat.type === "dm"),
        groups: action.payload.filter((chat) => chat.type === "group"),
        communities: action.payload.filter((chat) => chat.type === "community"),
      };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    // Transform chat rooms from API to ChatItem format
    transformAndSetChats: (
      state,
      action: PayloadAction<{ chatRooms: ChatRoom[]; currentUserId: string }>
    ) => {
      const { chatRooms, currentUserId } = action.payload;

      const transformedChats: ChatItem[] = chatRooms.map(
        (chatRoom: ChatRoom) => {
          // Map participants to our format
          const participants: ChatParticipantInfo[] = chatRoom.participants.map(
            (participant) => ({
              userId: participant.userId,
              name: participant.name,
              profilePic: participant.profilePic,
            })
          );

          // Extract last message text from different possible formats
          let lastMessageText = "No messages yet";
          const lastMessage = chatRoom.lastMessage as LastMessageType;

          if (typeof lastMessage === "string") {
            lastMessageText = lastMessage;
          } else if (lastMessage) {
            // Handle different possible formats of lastMessage
            if ("text" in lastMessage) {
              lastMessageText = lastMessage.text;
            } else if ("content" in lastMessage) {
              lastMessageText = lastMessage.content;
            }
          }

          if (chatRoom.roomType === "dm") {
            const otherParticipant =
              chatRoom.participants.find(
                (participant) => participant.userId !== currentUserId
              ) || chatRoom.participants[0];

            return {
              id: chatRoom.chatRoomId,
              name: otherParticipant?.name || "Unknown",
              avatar: otherParticipant?.profilePic || "",
              lastMessage: lastMessageText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              unread: chatRoom.unseenCount > 0,
              type: "dm" as const,
              bio: chatRoom.bio,
              participants,
            };
          } else {
            return {
              id: chatRoom.chatRoomId,
              name: chatRoom.groupName || "Group Chat",
              avatar: chatRoom.profileUrl || "",
              lastMessage: lastMessageText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              unread: chatRoom.unseenCount > 0,
              type: chatRoom.roomType,
              bio: chatRoom.bio,
              admin: chatRoom.admin,
              participants,
            };
          }
        }
      );

      state.chats = transformedChats;
      state.filteredChats = {
        dms: transformedChats.filter((chat) => chat.type === "dm"),
        groups: transformedChats.filter((chat) => chat.type === "group"),
        communities: transformedChats.filter(
          (chat) => chat.type === "community"
        ),
      };
    },
  },
});

export const {
  setActiveChat,
  setChats,
  setLoading,
  setLoadingMessages,
  setMessages,
  addMessage,
  setIsTyping,
  transformAndSetChats,
} = chatSlice.actions;

export default chatSlice.reducer;
