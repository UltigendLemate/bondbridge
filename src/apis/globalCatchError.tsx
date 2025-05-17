import { useState } from 'react';
import axios, { AxiosError } from 'axios';
// import { toast } from "sonner";

// Define error types
export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};

// Global state for error handling
let globalErrorHandler: ((error: ApiError) => void) | null = null;

// Function to set the global error handler
export const setGlobalErrorHandler = (handler: (error: ApiError) => void) => {
  globalErrorHandler = handler;
};

// Function to handle errors globally
export const handleApiError = (error: unknown): ApiError => {
  let apiError: ApiError;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;
    apiError = {
      message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      code: axiosError.code
    };
  } else if (error instanceof Error) {
    apiError = {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  } else {
    apiError = {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR'
    };
  }

  // if(apiError?.message && apiError.message === "Unauthorized") {
  //   localStorage.clear();
  //   window.location.href = "/login";
  // }

  // Add console log to debug
  console.log('Showing error toast:', apiError);

  // Show toast notification with a unique ID and custom styling
  // toast.error(apiError.message, {
  //   id: `error-${Date.now()}`,
  //   description: apiError.code || "Error occurred",
  //   duration: 5000,
  // });

  // Call the global error handler if it exists
  if (globalErrorHandler) {
    globalErrorHandler(apiError);
  }
  
  return apiError;
};

// Custom hook for API calls with global error handling
export const useApiCall = <T, Args extends unknown[]>(
  apiFunction: (...args: Args) => Promise<T>
): [
  (...args: Args) => Promise<{ data: T | null; success: boolean; status?: number; message?: string }>,
  boolean
] => {
  const [isLoading, setIsLoading] = useState(false);

  const execute = async (...args: Args) => {
    setIsLoading(true);
    try {
      const result = await apiFunction(...args);
      // console.log('result', result);
      return { data: result, success: true };
    } catch (error: unknown) {
      handleApiError(error);
      const errorWithStatus = error as { status?: number, message?: string };
      return { data: null, success: false, status: errorWithStatus.status, message: errorWithStatus.message };
    } finally {
      setIsLoading(false);
    }
  };
  return [execute, isLoading];
};