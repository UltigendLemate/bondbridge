export const TYPING_TIME = 2000;

// Word limits
export const WORD_LIMIT = 150;

export interface Community {
  id: string;
  name: string;
  members: number;
  pfp: string;
  description?: string;
  backgroundImage?: string;
  bio?: string;
}

export const INITIAL_PROFILE_STATE = {
  name: "",
  email: "",
  dateOfBirth: "",
  password: "",
  skillSelected: [] as string[],
  image: null as File | null,
  avatar: null as string | null,
  communitiesSelected: [] as Community[],
} as const; 

export const GET_AUTH_HEADERS = () => ({
  token: localStorage.getItem("token") || "",
  userId: localStorage.getItem("userId") || "",
  deviceId: localStorage.getItem("deviceId") || "",
  "ngrok-skip-browser-warning": "1",
});

export const AVAILABLE_INTERESTS = [
  "Memes",
  "Food & Culinary",
  "Pop Culture",
  "Gaming",
  "Health",
  "Outdoor Adventures",
  "Music",
  "Movies",
  "TV Shows",
  "Pets",
  "Fitness",
  "Travel",
  "Photography",
  "Technology",
  "DIY",
  "Fashion",
  "Literature",
  "Comedy",
  "Social Activism",
  "Social Media",
  "Craft Mixology",
  "Podcasts",
  "Cultural Arts",
  "History",
  "Science",
  "Auto Enthusiasts",
  "Meditation",
  "Virtual Reality",
  "Dance",
  "Board Games",
  "Wellness",
  "Trivia",
  "Content Creation",
  "Graphic Arts",
  "Anime",
  "Sports",
  "Stand-Up",
  "Crafts",
  "Exploration",
  "Concerts",
  "Musicians",
  "Animal Lovers",
  "Visual Arts",
  "Animation",
  "Style",
  "Basketball",
  "Football",
  "Hockey",
  "Boxing",
  "MMA",
  "Wrestling",
  "Baseball",
  "Golf",
  "Tennis",
  "Track & Field",
  "Gadgets",
  "Mathematics",
  "Physics",
  "Outer Space",
  "Religious",
  "Culture",
];