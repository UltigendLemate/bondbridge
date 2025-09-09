import apiClient, { formDataApiClient } from '@/apis/apiClient';
import { CreateProfileRequest } from '@/apis/apiTypes/request';
import { CreateProfileResponse, FetchAvatarsResponse } from '@/apis/apiTypes/response';
import { AvatarUrls } from '@/apis/apiTypes/response';

// Function to submit the complete profile
export const submitProfile = async (profileData: CreateProfileRequest): Promise<CreateProfileResponse> => {
  const { 
    name, 
    phoneNumber,
    countryCode,
    dateOfBirth, 
    password, 
    skillSelected, 
    avatar,
    image,
    referralCode,
    // communities
    generateToken
  } = profileData;
  
  // Validate required fields
  if (!name || !phoneNumber || !countryCode || !dateOfBirth || !password) {
    throw new Error('Please fill in all required fields');
  }
  
  const formData = new FormData();
  
  formData.append('name', name);
  formData.append('mobileNumber', phoneNumber);
  formData.append('countryCode', countryCode);
  formData.append('referralCode', referralCode || "");
  formData.append('privacyLevel', "0");

  // commented out as not being uploaded currently
  formData.append('dob', dateOfBirth);

  if (skillSelected && skillSelected.length > 0) {
    formData.append('interests', JSON.stringify(skillSelected));
  }
  
  // commented out as not being uploaded currently
  if (image) {
    formData.append('profilePic', image);
  }

  if (avatar) {
    formData.append('avatar', avatar);
  }
  
  // Construct the URL with generateToken as a query parameter if it exists
  let url = '/edit-profile';
  if (generateToken !== undefined) {
    url += `?generateToken=${generateToken}`;
  }

  // commented out as not being uploaded currently
  // if (communities && communities.length > 0) {
  //   formData.append('communities', JSON.stringify(communities));
  // }

  const response = await formDataApiClient.put<CreateProfileResponse>(
    url, // Use the constructed URL
    formData
  );
  
  if (response.status === 200) {
    console.log("Profile creation successful:", response.data);
    
    // Save apiToken and socketToken to localStorage if they exist
    if (response.data.apiToken) {
      console.log("Saving apiToken to localStorage:", response.data.apiToken);
      localStorage.setItem('token', response.data.apiToken);
    }
    if (response.data.socketToken) {
      console.log("Saving socketToken to localStorage:", response.data.socketToken);
      localStorage.setItem('socketToken', response.data.socketToken);
    }

    if (response.data.deviceId) {
      console.log("Saving deviceId to localStorage:", response.data.deviceId);
      localStorage.setItem('deviceId', response.data.deviceId);
    }
    
    return response.data;
  } else {
    throw new Error(response.data.message || 'Failed to create profile');
  }
};

// Function to fetch avatars
export const fetchAvatars = async (): Promise<AvatarUrls> => {
  const response = await apiClient.get<FetchAvatarsResponse>(
    `/get-avatars`
  );
  
  if (response.data && response.data.success) {
    return {
      male: response.data?.URLS.male || [],
      female: response.data?.URLS.female || []
    };
  } else {
    throw new Error(response.data.message || 'Failed to fetch avatars');
  }
};