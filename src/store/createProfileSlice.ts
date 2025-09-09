import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { INITIAL_PROFILE_STATE, AVAILABLE_INTERESTS } from "@/lib/constants";

interface Community {
  id: string;
  name: string;
  members: number;
  pfp: string;
  description?: string;
  backgroundImage?: string;
  bio?: string;
}

export const createProfile = createSlice({
  name: "createProfile",
  initialState: {
    ...INITIAL_PROFILE_STATE,
    referralCode: "",
    skillsAvailable: [...AVAILABLE_INTERESTS],
    skillSelected: [...INITIAL_PROFILE_STATE.skillSelected],
    communitiesSelected: [...INITIAL_PROFILE_STATE.communitiesSelected],
    communitiesAvailable: [] as Community[],
  },
  reducers: {
    setName: (state, action) => {
      state.name = action.payload;
    },
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    setCountryCode: (state, action) => {
      state.countryCode = action.payload;
    },
    setDateOfBirth: (state, action) => {
      state.dateOfBirth = action.payload;
    },
    setPassword: (state, action) => {
      state.password = action.payload;
    },
    setReferralCode: (state, action: PayloadAction<string>) => {
      state.referralCode = action.payload;
    },
    addSkill: (state, action) => {
      const skill = action.payload;
      state.skillSelected.push(skill);
      state.skillsAvailable = state.skillsAvailable.filter((s) => s !== skill);
    },
    removeSkill: (state, action) => {
      const skill = action.payload;
      state.skillsAvailable.push(skill);
      state.skillSelected = state.skillSelected.filter((s) => s !== skill);
    },
    setAvatar: (state, action) => {
      state.avatar = action.payload;
    },
    setImage: (state, action) => {
      state.image = action.payload;
    },
    setCommunitiesSelected: (state, action) => {
      state.communitiesSelected = action.payload;
    },
    addCommunity: (state, action) => {
      const community = action.payload;
      if (!state.communitiesSelected.some((c) => c.id === community.id)) {
        state.communitiesSelected.push(community);
      }
    },
    removeCommunity: (state, action) => {
      const communityId = action.payload.id;
      state.communitiesSelected = state.communitiesSelected.filter(
        (c) => c.id !== communityId
      );
    },
    setCommunities: (state, action: PayloadAction<Community[]>) => {
      state.communitiesAvailable = action.payload;
    },
    setAllCommunities: (state, action: PayloadAction<typeof INITIAL_PROFILE_STATE.communitiesSelected>) => {
      state.communitiesSelected = action.payload;
    },
  },
});

export const {
  setName,
  setPhoneNumber,
  setCountryCode,
  setDateOfBirth,
  setPassword,
  setReferralCode,
  addSkill,
  removeSkill,
  setAvatar,
  setImage,
  setCommunitiesSelected,
  addCommunity,
  removeCommunity,
  setCommunities,
  setAllCommunities,
} = createProfile.actions;

export default createProfile.reducer;
