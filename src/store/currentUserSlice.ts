import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CurrentUserState {
  username: string;
  nickname: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  avatar: string;
  profilePic?: string;
  bio?: string;
  interests: string[];
  privacyLevel: number;
  token: string;
  userId: string;
  public: number;
  referralCode: string;
  referralCount: number;
  followers: number;
  following: number;
  isBlocked: boolean;
  avatarSrc: string;
  statusCode: number;
}

const initialState: CurrentUserState = {
  username: "",
  nickname: "",
  email: "",
  mobileNumber: "",
  countryCode: "",
  avatar: "",
  profilePic: "",
  bio: "",
  interests: [],
  privacyLevel: 0,
  token: "",
  userId: "",
  public: 0,
  referralCode: "",
  referralCount: 0,
  followers: 0,
  following: 0,
  isBlocked: false,
  avatarSrc: "",
  statusCode: 0,
};

const currentUserSlice = createSlice({
  name: "currentUser",
  initialState,
  reducers: {
    updateCurrentUser: (
      state,
      action: PayloadAction<Partial<CurrentUserState>>
    ) => {
      Object.assign(state, action.payload);
    },
    setPrivacyLevel: (state, action: PayloadAction<number>) => {
      state.privacyLevel = action.payload;
    },
    updateInterests: (state, action: PayloadAction<string[]>) => {
      state.interests = action.payload;
    },
    resetUser: () => initialState,
  },
});

export const {
  updateCurrentUser,
  setPrivacyLevel,
  updateInterests,
  resetUser,
} = currentUserSlice.actions;

export default currentUserSlice.reducer;
