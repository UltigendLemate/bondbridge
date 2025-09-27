import apiClient from "@/apis/apiClient";
import {
  SendOTPRequest,
  SendOTPEmailRequest,
  VerifyOTPEmailRequest,
  LoginRequest,
  LoginEmailRequest,
  SetPasswordRequest,
  VerifyOTPRequest,
} from "../apiTypes/request";
import {
  LoginResponse,
  SendOTPResponse,
  SetPasswordResponse,
  VerifyOTPResponse,
} from "../apiTypes/response";

// Define proper types for request bodies
// (Original) Type used by active OTP implementation – kept commented while OTP disabled.
// type SendOTPRequestBody = {
//   phoneNumber: string;
//   countryCode: string;
//   forgot?: string;
// };

type SendOTPEmailRequestBody = {
  email: string;
  forgot?: string;
};

type VerifyOTPRequestBody = {
  phoneNumber: string;
  countryCode: string;
  otp: string;
  forgot?: string;
};

type VerifyOTPEmailRequestBody = {
  email: string;
  otp: string;
  forgot?: string;
};

// Function to send OTP for signup or forgot password

export const sendOTP = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _phoneData: SendOTPRequest
): Promise<SendOTPResponse> => {
  // TEMPORARY SHUTDOWN: OTP sending disabled
  // To re-enable, restore the original implementation below.
  // --- BEGIN DISABLED ORIGINAL IMPLEMENTATION ---
  /*
  const { phoneNumber, countryCode, forgot } = phoneData;
  if (!phoneNumber || !countryCode) {
    throw new Error('Phone number and country code are required');
  }
  const requestBody: SendOTPRequestBody = { phoneNumber, countryCode };
  if (forgot) { requestBody.forgot = forgot; }
  const response = await apiClient.post<SendOTPResponse>(`/send-otp`, requestBody);
  if (response.status === 200) { return response.data; }
  else { throw new Error((response as any).response?.data.message || 'Failed to send OTP'); }
  */
  console.warn("[SECURITY] sendOTP blocked: feature temporarily disabled.");
  // We throw an error so calling code (useApiCall wrapper) treats it as a failed attempt
  throw new Error("Signups temporarily disabled. Please try again later.");
};

// Function to verify OTP
export const verifyOTP = async (
  otpData: VerifyOTPRequest
): Promise<VerifyOTPResponse> => {
  const { phoneNumber, countryCode, otp, forgot } = otpData;

  // Validate required fields
  if (!phoneNumber || !countryCode || !otp) {
    throw new Error("Phone number, country code, and OTP are required");
  }

  // Include forgot parameter if provided
  const requestBody: VerifyOTPRequestBody = { phoneNumber, countryCode, otp };
  if (forgot) {
    requestBody.forgot = forgot;
  }

  const response = await apiClient.post<VerifyOTPResponse>(
    `/verify-otp`,
    requestBody
  );

  if (response.status === 200) {
    // Store token and userId in localStorage
    if (response.data.token && response.data.userDetails?._id) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userDetails._id);
      localStorage.setItem("deviceId", response.data.deviceId);
    }

    return response.data;
  } else {
    throw new Error(response.data.message || "Failed to verify OTP");
  }
};

// Function to send OTP for email signup or forgot password
export const sendOTPEmail = async (emailData: SendOTPEmailRequest): Promise<SendOTPResponse> => {
  const { email, forgot } = emailData;
  
  // Validate required fields
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Include forgot parameter if provided
  const requestBody: SendOTPEmailRequestBody = { email };
  if (forgot) {
    requestBody.forgot = forgot;
  }
  
  const response = await apiClient.post<SendOTPResponse>(`/send-email-otp`, requestBody);

  if (response.status === 200) {
    return response.data;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((response as any).response?.data.message || 'Failed to send OTP');
  }
};

// Function to verify email OTP
export const verifyOTPEmail = async (otpData: VerifyOTPEmailRequest): Promise<VerifyOTPResponse> => {
  const { email, otp, forgot } = otpData;
  
  // Validate required fields
  if (!email || !otp) {
    throw new Error('Email and OTP are required');
  }
  
  // Include forgot parameter if provided
  const requestBody: VerifyOTPEmailRequestBody = { email, otp };
  if (forgot) {
    requestBody.forgot = forgot;
  }
  
  const response = await apiClient.post<VerifyOTPResponse>(`/verify-email-otp`, requestBody);
  
  if (response.status === 200) {
    
    // Store token and userId in localStorage
    if (response.data.token && response.data.userDetails?._id) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userDetails._id);
      localStorage.setItem('deviceId', response.data.deviceId);
    }
    
    return response.data;
  } else {
    throw new Error(response.data.message || 'Failed to verify OTP');
  }
};

// Function to login with phone and password
export const loginUser = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  const { phoneNumber, countryCode, password } = loginData;

  // Validate required fields
  if (!phoneNumber || !countryCode || !password) {
    throw new Error("Phone number, country code, and password are required");
  }

  const response = await apiClient.post<LoginResponse>(`/login`, {
    phoneNumber,
    countryCode,
    password,
  });

  if (response.status === 200) {
    if (
      response.data.token &&
      response.data.userDetails?._id &&
      response.data.userDetails.statusCode != 0
    ) {
      localStorage.setItem("socketToken", response.data.socketToken);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userDetails._id);
      localStorage.setItem("deviceId", response.data.deviceId);
    }

    return response.data;
  } else {
    throw new Error(response.data.message || "Failed to login");
  }
};

// Function to login with email and password
export const loginUserWithEmail = async (loginData: LoginEmailRequest): Promise<LoginResponse> => {
  const { email, password } = loginData;
  
  // Validate required fields
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  const response = await apiClient.post<LoginResponse>(`/login-email`, {
    email,
    password
  });
  
  if (response.status === 200) {
    
    if (response.data.token && response.data.userDetails?._id && response.data.userDetails.statusCode != 0) {
      localStorage.setItem('socketToken', response.data.socketToken)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userDetails._id);
      localStorage.setItem('deviceId', response.data.deviceId);
    }
    
    return response.data;
  } else {
    throw new Error(response.data.message || 'Failed to login');
  }
};

// Function to set user password
export const setPassword = async (
  data: SetPasswordRequest
): Promise<SetPasswordResponse> => {
  const { password } = data;

  // Validate required fields
  if (!password) {
    throw new Error("Password is required");
  }

  const response = await apiClient.put<SetPasswordResponse>(`/set-password`, {
    password,
  });

  if (response.status === 200) {
    console.log("Password set successfully:", response.data);

    // Check if response has token and userDetails properties (might be present but not in type)
    interface ExtendedPasswordResponse extends SetPasswordResponse {
      token?: string;
      userDetails?: { _id: string };
      socketToken?: string;
      deviceId?: string;
    }
    const extendedResponse = response.data as ExtendedPasswordResponse;
    if (extendedResponse.token && extendedResponse.userDetails?._id) {
      localStorage.setItem("token", extendedResponse.token);
      localStorage.setItem("userId", extendedResponse.userDetails._id);

      // Set socketToken if available
      if (extendedResponse.socketToken) {
        localStorage.setItem("socketToken", extendedResponse.socketToken);
      }

      if (extendedResponse.deviceId) {
        localStorage.setItem("deviceId", extendedResponse.deviceId);
      }
    }

    return response.data;
  } else {
    throw new Error(response.data.message || "Failed to set password");
  }
};

// Function to reset password
export const resetPassword = async (resetData: {
  phoneNumber: string;
  countryCode: string;
  oldPassword: string;
  password: string;
}) => {
  const { phoneNumber, countryCode, oldPassword, password } = resetData;

  // Validate required fields
  if (!phoneNumber || !countryCode || !oldPassword || !password) {
    throw new Error("All fields are required");
  }

  const response = await apiClient.post(`/reset-password`, {
    phoneNumber,
    countryCode,
    oldPassword,
    password,
  });

  return response.data;
};

// Function to reset password with email
export const resetPasswordEmail = async (resetData: { email: string; oldPassword: string; password: string }) => {
  const { email, oldPassword, password } = resetData;
  
  // Validate required fields
  if (!email || !oldPassword || !password) {
    throw new Error('Email, current password, and new password are required');
  }
  
  const response = await apiClient.post(`/reset-password-email`, {
    email,
    oldPassword,
    password
  });
  
  return response.data;
};

// Function to execute forgot password
export const forgotPassword = async (forgotData: {
  phoneNumber: string;
  countryCode: string;
  password: string;
}): Promise<{ message: string; success: boolean }> => {
  const { phoneNumber, countryCode, password } = forgotData;

  // Validate required fields
  if (!phoneNumber || !countryCode || !password) {
    throw new Error(
      "Phone number, country code, and new password are required"
    );
  }

  // Create FormData
  const formData = new FormData();
  formData.append("phoneNumber", phoneNumber);
  formData.append("countryCode", countryCode);
  formData.append("password", password);

  const response = await apiClient.post("/forgot-password", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      // 'Authorization': `Basic OG==`
    },
  });

  if (response.status === 200) {
    console.log("Password reset successfully:", response.data);
    return response.data;
  } else {
    throw new Error(response.data.message || "Failed to reset password");
  }
};

// Function to execute forgot password with email
export const forgotPasswordEmail = async (forgotData: { 
  email: string; 
  password: string 
}): Promise<{ message: string; success: boolean }> => {
  const { email, password } = forgotData;
  
  // Validate required fields
  if (!email || !password) {
    throw new Error('Email and new password are required');
  }
  
  const response = await apiClient.post('/forgot-password-email', {
    email,
    password
  });
  
  if (response.status === 200) {
    console.log("Password reset successfully:", response.data);
    return response.data;
  } else {
    throw new Error(response.data.message || 'Failed to reset password');
  }
};

// Function to delete user account
export const deleteAccount = async (
  password: string
): Promise<{ message: string; success: boolean }> => {
  // Validate required field
  if (!password) {
    throw new Error("Password is required");
  }

  const response = await apiClient.post("/deleteAccount", { password });

  if (response.status === 200) {
    console.log("Account deleted successfully:", response.data);
    return response.data;
  } else {
    throw new Error(response.data.message || "Failed to delete account");
  }
};
