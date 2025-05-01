import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Trash2, Image, Smile, Video, Mic, ArrowLeft, ChevronDown } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import {
  createPost,
  rewriteWithBondChat,
} from "../apis/commonApiCalls/createPostApi";
import { useApiCall } from "../apis/globalCatchError";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { useAppSelector } from "../store";
import { useState, useEffect, useRef } from "react";
import {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  registerRecognitionInstance,
  unregisterRecognitionInstance,
} from "../types/speech-recognition";
// Define character limit constant
const CHARACTER_LIMIT = 150;
import { CreatePostRequest } from "@/apis/apiTypes/request";
import { MediaCropModal, CroppedFile } from "@/components/MediaCropModal";
import VideoObserver from "@/components/common/VideoObserver";
// Import Dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostData extends Partial<CreatePostRequest> {
  content: string;
  postId?: string;
  communityId?: string;
  isAnonymous?: boolean;
}

interface CreatePostProps {
  onSubmit?: (content: string, media?: File[]) => void;
  uploadMedia?: boolean;
  submitButtonText?: string;
  submitHandler?: (data: PostData) => void;
  initialContent?: string;
  initialMediaFiles?: CroppedFile[];
  postId?: string;
  onCancel?: () => void;
  readOnlyMedia?: boolean;
  communityPost?: boolean;
}

// Add a helper type that extends CroppedFile to include previewUrl explicitly
interface MediaFileWithUrl extends CroppedFile {
  previewUrl?: string;
}

const VideoPreview: React.FC<{ videoFile: File | string }> = ({ videoFile }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const [videoId, setVideoId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    // Check if videoFile is a string (URL) or a File object
    const objectUrl = typeof videoFile === 'string' 
      ? videoFile 
      : URL.createObjectURL(videoFile);
    
    videoUrlRef.current = objectUrl;

    // Generate a unique ID for this video
    setVideoId(`preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    const video = videoRef.current;
    if (!video) return;

    // Set the video source to the URL
    video.src = objectUrl;
    video.muted = isMuted;

    // Track loading state
    const handleLoadedData = () => {
      setIsLoading(false);
    };

    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      // Only revoke the object URL if we created it (i.e., videoFile is a File object)
      if (typeof videoFile !== 'string' && videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [videoFile, isMuted]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div 
      className="w-full h-full relative flex items-center justify-center" 
      data-post-id={videoId}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Add VideoObserver to handle auto-play/pause functionality */}
      {videoId && videoUrlRef.current && !isLoading && (
        <VideoObserver 
          feedId={videoId} 
          media={[{ type: "video", url: videoUrlRef.current }]}
        />
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        muted={isMuted}
        autoPlay
        loop
      />
      
      <button 
        className={`absolute bottom-4 right-4 p-2 bg-background/70 rounded-full hover:bg-background transition-colors cursor-pointer ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={toggleMute}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </div>
  );
};

const CreatePost = ({
  onSubmit,
  uploadMedia = true,
  submitButtonText = "Post",
  submitHandler,
  initialContent = "",
  initialMediaFiles = [],
  postId,
  onCancel,
  communityPost = false,
  readOnlyMedia = false,
}: CreatePostProps) => {
  const navigate = useNavigate();
  const { communityId } = useParams<{ communityId: string }>();
  const [content, setContent] = useState(initialContent);
  const [mediaFiles, setMediaFiles] = useState<CroppedFile[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );
  const recognitionActiveRef = useRef(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Media cropping state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [currentMediaFile, setCurrentMediaFile] = useState<File | null>(null);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // State for anonymous posting toggle (only if communityPost is true)
  const [postAs, setPostAs] = useState<"user" | "anonymous">("user");

  // Track if there are unsaved changes
  const hasUnsavedChanges =
    content !== initialContent ||
    mediaFiles.length > 0 ||
    documentFiles.length > 0;

  // Ref to track if navigation is due to successful submission
  const isNavigatingAfterSubmitRef = useRef(false);

  // Add beforeunload event listener for browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check both unsaved changes and the navigation flag
      if (hasUnsavedChanges && !isNavigatingAfterSubmitRef.current) {
        // Standard way to show confirmation dialog
        e.preventDefault();
        // This message will be shown in some browsers
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    // Register the listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Clean up
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // Only depends on hasUnsavedChanges, ref changes don't need to re-run this
  }, [hasUnsavedChanges]);

  // Override window history navigation methods
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Save original history methods
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history
    );

    // Override pushState with proper types
    window.history.pushState = function (
      state: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      // Check both unsaved changes and the navigation flag before prompting
      if (
        hasUnsavedChanges &&
        !isNavigatingAfterSubmitRef.current &&
        !window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        // User cancelled navigation
        return;
      }
      // User confirmed navigation or navigation is due to submit
      return originalPushState(state, unused, url);
    };

    // Override replaceState with proper types
    window.history.replaceState = function (
      state: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      // Check both unsaved changes and the navigation flag before prompting
      if (
        hasUnsavedChanges &&
        !isNavigatingAfterSubmitRef.current &&
        !window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        // User cancelled navigation
        return;
      }
      // User confirmed navigation or navigation is due to submit
      return originalReplaceState(state, unused, url);
    };

    // Handle popstate (back/forward browser buttons)
    const handlePopState = (e: PopStateEvent) => {
      // Check both unsaved changes and the navigation flag
      if (hasUnsavedChanges && !isNavigatingAfterSubmitRef.current) {
        if (
          !window.confirm(
            "You have unsaved changes. Are you sure you want to leave?"
          )
        ) {
          // Prevent the navigation by pushing the current state back
          window.history.pushState(null, "", window.location.href);
          // Stop further handling
          e.stopImmediatePropagation();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup function to restore original methods
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
    // Only depends on hasUnsavedChanges, ref changes don't need to re-run this
  }, [hasUnsavedChanges]);

  // Get the current user's avatar from Redux store
  const { avatar,  profilePic, username } = useAppSelector(
    (state) => state.currentUser
  );

  // Use the API call hook for the createPost function
  const [executeCreatePost, isCreatingPost] = useApiCall(createPost);
  // Use the API call hook for the rewriteWithBondChat function
  const [executeRewriteWithBondChat, isRewritingWithBondChat] =
    useApiCall(rewriteWithBondChat);

  // Initialize media files and previews from props if they exist
  useEffect(() => {
    if (initialMediaFiles.length > 0) {
      console.log('Received initialMediaFiles:', initialMediaFiles);
      setMediaFiles(initialMediaFiles);
      
      // Create previews for the initial media files
      const previews = initialMediaFiles.map(file => {
        console.log('Creating preview for file:', file);
        if (file.type.startsWith('video/')) {
          console.log('Video file detected, using "video" as preview');
          return 'video';
        }
        // Only use previewUrl for initial media files, as they're not real File objects
        console.log('Using previewUrl:', (file as MediaFileWithUrl).previewUrl);
        return (file as MediaFileWithUrl).previewUrl || '';
      });
      
      console.log('Created previews:', previews);
      setMediaPreviews(previews);
    }
  }, [initialMediaFiles]);

  // Update content when initialContent changes (for edit mode)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const [rewriteError, setRewriteError] = useState<string>("");

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadMedia) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return; // No files selected

    setIsUploading(true); // Show loading state

    try {
      // Check for video files exceeding 10MB limit
      const invalidFiles = files.filter(
        (file) => file.type.startsWith("video/") && file.size > 25 * 1024 * 1024
      );

      if (invalidFiles.length > 0) {
        toast.error("Videos must be less than 25MB in size");
        setIsUploading(false);
        return;
      }

      // Check for image files exceeding 10MB limit
      const invalidImageFiles = files.filter(
        (file) => file.type.startsWith("image/") && file.size > 25 * 1024 * 1024
      );

      if (invalidImageFiles.length > 0) {
        toast.error("Images must be less than 25MB in size");
        setIsUploading(false);
        return;
      }

      // Validate file types
      const validFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/")
      );

      if (validFiles.length === 0) {
        toast.error("Please select valid image or video files");
        setIsUploading(false);
        return;
      }

      // Maximum of 4 media files total
      const remainingSlots = 4 - mediaFiles.length;
      if (remainingSlots <= 0) {
        toast.error("Maximum of 4 media files allowed");
        setIsUploading(false);
        return;
      }

      // Process up to the remaining slots
      const filesToProcess = validFiles.slice(0, remainingSlots);

      // Separate videos and images
      const videoFiles = filesToProcess.filter((file) =>
        file.type.startsWith("video/")
      );
      const imageFiles = filesToProcess.filter((file) =>
        file.type.startsWith("image/")
      );

      // Process videos immediately with better error handling
      if (videoFiles.length > 0) {
        Promise.all(
          videoFiles.map((file) => {
            return new Promise<void>((resolve, reject) => {
              try {
                // Verify the video is valid
                const video = document.createElement("video");
                const objectUrl = URL.createObjectURL(file);

                // Set the video source to the object URL
                video.src = objectUrl;

                // Set error handler
                video.onerror = () => {
                  clearTimeout(timeout);
                  URL.revokeObjectURL(objectUrl);
                  reject(new Error(`Unable to load video: ${file.name}`));
                };

                // Create a handler for metadata loaded
                video.onloadedmetadata = () => {
                  clearTimeout(timeout);
                  // Valid video, add it to our files
                  const videoFile = file as CroppedFile;
                  setMediaFiles((prev) => [...prev, videoFile]);
                  setMediaPreviews((prev) => [...prev, "video"]);
                  URL.revokeObjectURL(objectUrl);
                  resolve();
                };

                // Set timeout in case video loading hangs
                const timeout = setTimeout(() => {
                  URL.revokeObjectURL(objectUrl);
                  reject(new Error(`Timeout loading video: ${file.name}`));
                }, 5000);
              } catch (err) {
                console.error("Error processing video:", err);
                reject(err);
              }
            });
          })
        )
          .catch((err) => {
            console.error("Error processing videos:", err);
            toast.error("Error processing one or more videos");
          })
          .finally(() => {
            if (imageFiles.length === 0) {
              setIsUploading(false); // Only set to false if no images to process
            }
          });
      }

      // Queue images for cropping
      if (imageFiles.length > 0) {
        // Set the first image for immediate cropping
        setCurrentMediaFile(imageFiles[0]);
        setIsCropModalOpen(true);

        // Queue the rest for later
        if (imageFiles.length > 1) {
          setPendingImageFiles(imageFiles.slice(1));
        }
      } else if (videoFiles.length === 0) {
        // No files were processed
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Error in file upload:", err);
      toast.error("An error occurred while processing your files");
      setIsUploading(false);
    }

    // Reset the file input
    e.target.value = "";
  };

  // Update handleCropComplete to manage loading state
  const handleCropComplete = (croppedFile: CroppedFile) => {
    console.log("handleCropComplete called with:", croppedFile);

    // Add the cropped file to our array of media files
    setMediaFiles((prev) => [...prev, croppedFile]);

    // Create preview for the cropped file
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Preview generated:", reader.result);
      setMediaPreviews((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(croppedFile);

    // Check if we have more images to process
    if (pendingImageFiles.length > 0) {
      // Get the next image and process it
      const nextImage = pendingImageFiles[0];
      const remainingImages = pendingImageFiles.slice(1);

      setCurrentMediaFile(nextImage);
      setPendingImageFiles(remainingImages);
      // Crop modal stays open
    } else {
      // No more images to process, close the modal
      setCurrentMediaFile(null);
      setIsCropModalOpen(false);
      setIsUploading(false); // End loading state
    }
  };

  // Update onClose handler to reset loading state
  const handleCropModalClose = () => {
    setIsCropModalOpen(false);
    setCurrentMediaFile(null);
    // Clear any pending images if the user cancels cropping
    setPendingImageFiles([]);
    setIsUploading(false);
  };

  // Handle reordering media files
  const handleReorderMedia = (startIndex: number, endIndex: number) => {
    // Don't do anything if the indices are the same
    if (startIndex === endIndex) return;

    // Create new arrays with the reordered items
    const newMediaFiles = [...mediaFiles];
    const newMediaPreviews = [...mediaPreviews];

    // Remove items from their original position
    const [removedFile] = newMediaFiles.splice(startIndex, 1);
    const [removedPreview] = newMediaPreviews.splice(startIndex, 1);

    // Insert items at their new position
    newMediaFiles.splice(endIndex, 0, removedFile);
    newMediaPreviews.splice(endIndex, 0, removedPreview);

    // Update state
    setMediaFiles(newMediaFiles);
    setMediaPreviews(newMediaPreviews);

    // Update active preview if needed
    if (activePreviewIndex === startIndex) {
      setActivePreviewIndex(endIndex);
    } else if (
      activePreviewIndex > startIndex &&
      activePreviewIndex <= endIndex
    ) {
      setActivePreviewIndex(activePreviewIndex - 1);
    } else if (
      activePreviewIndex < startIndex &&
      activePreviewIndex >= endIndex
    ) {
      setActivePreviewIndex(activePreviewIndex + 1);
    }
  };

  // When removing media, we need to update the active preview
  const handleRemoveMedia = (index: number) => {
    // If media is read-only, don't allow removal
    if (readOnlyMedia) return;
    
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));

    // Update active preview index after removal
    if (index === activePreviewIndex) {
      // If the active preview is removed, fall back to the previous item or 0
      setActivePreviewIndex(Math.max(0, activePreviewIndex - 1));
    } else if (index < activePreviewIndex) {
      // If an item before the active preview is removed, decrement the index
      setActivePreviewIndex(activePreviewIndex - 1);
    }
  };

  // Draggable Thumbnail Component
  const MediaThumbnail = ({
    index,
    file,
    preview,
    isActive,
    onDragStart,
    onDragOver,
    onDrop,
  }: {
    index: number;
    file: CroppedFile;
    preview: string;
    isActive: boolean;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
  }) => {
    const thumbnailId = `thumbnail-${index}`;
    
    return (
      <div
        className={`h-16 w-16 rounded-md overflow-hidden cursor-pointer relative transition-all ${
          isActive ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
        }`}
        onClick={() => setActivePreviewIndex(index)}
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        data-post-id={thumbnailId}
      >
        {file.type.startsWith("video/") ? (
          <div className="w-full h-full relative bg-black">
            {/* Just show the video icon for thumbnails - no need for VideoObserver here */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="h-5 w-5 text-white/70" />
            </div>
          </div>
        ) : (
          <img
            src={preview}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  };

  const handleRewriteWithBondChat = async () => {
    // Clear any previous error
    setRewriteError("");
    
    // Only proceed if there's content to rewrite
    if (!content.trim()) {
      setRewriteError("Please add some text to rewrite");
      return;
    }

    // Execute the API call with error handling
    const { data, success } = await executeRewriteWithBondChat(content);

    if (success && data) {
      // Update the content with the rewritten text
      setContent(data.rewritten);
    }
  };

  // Initialize speech recognition on component mount
  useEffect(() => {
    // Get the correct Speech Recognition API based on browser
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.error("Speech recognition not supported by this browser");
      return;
    }

    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      setIsListening(true);
      registerRecognitionInstance(recognitionInstance);
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setContent(transcript);
    };

    recognitionInstance.onend = () => {
      // Recognition has ended, update our active flag
      recognitionActiveRef.current = false;
      unregisterRecognitionInstance(recognitionInstance);
      if (isListening) {
        // Try to restart the recognition if it ended automatically and we're still in listening mode
        setTimeout(() => {
          if (
            isListening &&
            !recognitionActiveRef.current &&
            recognitionInstance
          ) {
            try {
              recognitionInstance.start();
              registerRecognitionInstance(recognitionInstance);
              recognitionActiveRef.current = true;
            } catch (error) {
              console.error("Error restarting speech recognition:", error);
              setIsListening(false);
            }
          }
        }, 100);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      recognitionActiveRef.current = false;
      setIsListening(false);
      unregisterRecognitionInstance(recognitionInstance);
    };

    setRecognition(recognitionInstance);

    // Cleanup function
    return () => {
      if (recognitionInstance && recognitionActiveRef.current) {
        try {
          recognitionInstance.stop();
          unregisterRecognitionInstance(recognitionInstance);
          recognitionActiveRef.current = false;
          setIsListening(false);
        } catch (error) {
          console.error("Error stopping speech recognition on unmount:", error);
        }
      }
    };
  }, []); // Empty dependency array to initialize once

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!recognition) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        recognition.stop();
        unregisterRecognitionInstance(recognition);
        recognitionActiveRef.current = false;
        setIsListening(false);
        // toast.info('Speech recognition stopped');
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    } else {
      // Start listening
      try {
        recognition.start();
        registerRecognitionInstance(recognition);
        recognitionActiveRef.current = true;
        setIsListening(true);
        // toast.success('Listening... speak now');
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        // toast.error('Failed to start speech recognition');
      }
    }
  };

  const handleSubmit = async () => {
    // Check character count instead of word count
    if (content.length > CHARACTER_LIMIT) {
      toast.error(`Your post exceeds the ${CHARACTER_LIMIT} character limit.`);
      return;
    }

    if (
      content.trim() ||
      (uploadMedia && (mediaFiles.length > 0 || documentFiles.length > 0))
    ) {
      setIsSubmitting(true);

      // Prepare the post data
      let postData: PostData = {
        content: content.trim(),
      };

      // Add media if enabled
      if (uploadMedia) {
        postData = {
          ...postData,
          whoCanComment: 1, // Default value
          privacy: 1, // Default value
          image: mediaFiles as unknown as File[],
          document: documentFiles,
        };
      }

      // Add community-specific fields if applicable
      if (communityPost) {
        postData.communityId = communityId;
        postData.isAnonymous = postAs === "anonymous";
      }

      // If editing a post, add postId
      if (postId) {
        postData.postId = postId;
      }

      let success = false;
      try {
        if (submitHandler) {
          // Use custom submit handler if provided
          await submitHandler(postData);
          success = true;
        } else {
          // Prepare data for the default API call
          const apiPostData: CreatePostRequest = {
            content: postData.content,
            whoCanComment: postData.whoCanComment ?? 1,
            privacy: postData.privacy ?? 1,
            image: postData.image,
            document: postData.document,
            // Add community fields for API call if needed (ensure API supports these)
            ...(communityPost && {
              isCommunityPost: true,
              communityId: postData.communityId,
              isAnonymous: postData.isAnonymous,
            })
          };

          // Use default API call
          const result = await executeCreatePost(apiPostData);
          success = result.success;

          if (success && result.data) {
            toast.success(
              postId
                ? "Post updated successfully!"
                : "Post created successfully!"
            );
            setContent("");
            setMediaFiles([]);
            setMediaPreviews([]);
            setDocumentFiles([]);
            onSubmit?.(content, [...mediaFiles, ...documentFiles]);
          }
        }

        if (success) {
          isNavigatingAfterSubmitRef.current = true;
          // Navigate appropriately (e.g., back to community page or home)
          if (communityPost && communityId) {
             navigate(`/community/${communityId}`);
          } else {
             navigate("/");
          }
        }
      } catch (error) {
        console.error("Submission failed:", error);
        success = false;
      } finally {
        if (!success) {
          setIsSubmitting(false);
        }
        if (!success) {
          isNavigatingAfterSubmitRef.current = false;
        }
      }
    } else {
      toast.error("Please add some content to your post");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPicker &&
        emojiPickerRef.current &&
        emojiButtonRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    // Use mousedown instead of click to handle the event before the emoji picker's click event
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to discard them?"
        )
      ) {
        if (onCancel) {
          onCancel();
        } else {
          // Set the flag before navigating away on cancel confirmation
          isNavigatingAfterSubmitRef.current = true; // Treat cancel confirm like submit
          navigate("/");
        }
      }
    } else {
      if (onCancel) {
        onCancel();
      } else {
        // No changes, safe to navigate
        isNavigatingAfterSubmitRef.current = true; // Prevent potential race condition? (Maybe overkill)
        navigate("/");
      }
    }
  };

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--foreground)] p-0 mr-2 cursor-pointer"
          onClick={() => communityPost && communityId ? navigate(`/community/${communityId}`) : navigate("/")}
        >
          <ArrowLeft size={20} />
        </Button>
      </div>
      
      <div className="flex items-start gap-3 pb-4">
        {/* Conditional Avatar/Dropdown */}
        {communityPost ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer group">
                <Avatar className="h-10 w-10">
                  {postAs === 'user' ? (
                    <AvatarImage src={profilePic || avatar} alt={username || "Profile"} />
                  ) : (
                    <AvatarImage src="/profile/anonymous.png" alt="Anonymous" />
                  )}
                   <AvatarFallback>
                    {postAs === 'user' ? (username ? username[0].toUpperCase() : "U") : "A"}
                   </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium group-hover:text-muted-foreground">{postAs === 'user' ? (username || "User") : "Anonymous"}</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setPostAs('user')} className="cursor-pointer">
                <Avatar className="h-6 w-6 mr-2">
                   <AvatarImage src={profilePic || avatar} alt={username || "Profile"} />
                   <AvatarFallback>
                    {username ? username[0].toUpperCase() : "U"}
                   </AvatarFallback>
                </Avatar>
                Post as {username || "Yourself"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPostAs('anonymous')} className="cursor-pointer">
                 <Avatar className="h-6 w-6 mr-2">
                   <AvatarImage src="/profile/anonymous.png" alt="Anonymous" />
                   <AvatarFallback>A</AvatarFallback>
                 </Avatar>
                 Post Anonymously
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Original Static Avatar for non-community posts
          <Avatar className="h-10 w-10">
            <AvatarImage src={profilePic || avatar} alt={username || "Profile"} />
            <AvatarFallback>
              {username ? username[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--muted-foreground)] border cursor-pointer border-primary"
            onClick={handleCancel}
            disabled={isSubmitting || isCreatingPost}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-primary px-10 hover:bg-primary/90 text-primary-foreground cursor-pointer"
            onClick={handleSubmit}
            disabled={isSubmitting || isCreatingPost}
          >
            {isSubmitting || isCreatingPost
              ? "Processing..."
              : submitButtonText}
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={toggleSpeechRecognition}
              type="button"
              className={`hover:opacity-75 transition-opacity cursor-pointer ${
                isListening
                  ? "text-[var(--primary)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              <Mic size={20} className={isListening ? "animate-pulse" : ""} />
            </button>
          </div>
          {uploadMedia && !readOnlyMedia && (
            <>
              <label className="cursor-pointer hover:opacity-75 transition-opacity relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaUpload}
                  disabled={isUploading}
                />
                <Image
                  size={20}
                  className={`text-[var(--foreground)] ${
                    isUploading ? "opacity-50" : ""
                  }`}
                />
              </label>
              <label className="cursor-pointer hover:opacity-75 transition-opacity relative">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaUpload}
                  disabled={isUploading}
                />
                <Video
                  size={20}
                  className={`text-[var(--foreground)] ${
                    isUploading ? "opacity-50" : ""
                  }`}
                />
                {isUploading && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </label>
            </>
          )}

          <div className="relative">
            <button
              ref={emojiButtonRef}
              onClick={() => setShowPicker(!showPicker)}
              type="button"
              className="hover:opacity-75 transition-opacity cursor-pointer"
            >
              <Smile size={20} className="text-[var(--foreground)]" />
            </button>
            {showPicker && (
              <div ref={emojiPickerRef} className="absolute z-50">
                <EmojiPicker
                  onEmojiClick={(emojiObject) => {
                    setContent(
                      (prevContent) => prevContent + emojiObject.emoji
                    );
                    setShowPicker(false);
                  }}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs flex items-center gap-1 cursor-pointer border-2 border-primary"
            onClick={handleRewriteWithBondChat}
            disabled={isRewritingWithBondChat}
          >
            {isRewritingWithBondChat ? (
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                <span className="text-[var(--foreground)] border-primary">
                  Rewriting...
                </span>
              </div>
            ) : (
              <>
                <img src="/bondchat.svg" alt="BondChat" className="w-4 h-4" />
                <div className="text-[var(--foreground)]">
                  Re-write with{" "}
                  <span className="grad font-bold">BondChat </span>
                </div>
              </>
            )}
          </Button>
          {rewriteError && (
            <p className="text-foreground font-bold text-xs mt-1">{rewriteError}</p>
          )}
        </div>
      </div>

      <Separator className="my-3 bg-[var(--border)]" />

      <div className="flex-1">
        {isRewritingWithBondChat ? (
          <div className="w-full animate-pulse pb-2">
            <div className="h-6 bg-[var(--secondary)] rounded mb-2 w-3/4"></div>
            <div className="h-6 bg-[var(--secondary)] rounded mb-2 w-5/6"></div>
            <div className="h-6 bg-[var(--secondary)] rounded w-2/3"></div>
          </div>
        ) : (
          <>
            <TextareaAutosize
              placeholder="What's on your mind..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
              className="w-full bg-transparent outline-none resize-none text-sm h-auto"
              maxRows={20}
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  content.length > CHARACTER_LIMIT
                    ? "text-destructive-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {content.length}/{CHARACTER_LIMIT} characters
              </span>
            </div>
          </>
        )}

        {mediaPreviews.length > 0 && (
          <div className="relative mt-2 space-y-3">
            {/* Thumbnails/Carousel */}
            {mediaPreviews.length > 1 && (
              <div className="flex gap-2 items-center overflow-x-auto pb-2 no-scrollbar p-2">
                {mediaFiles.map((file, index) => (
                  <MediaThumbnail
                    key={index}
                    index={index}
                    file={file}
                    preview={mediaPreviews[index]}
                    isActive={index === activePreviewIndex}
                    onDragStart={(e, idx) => {
                      if (readOnlyMedia) {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.setData("text/plain", idx.toString());
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      if (readOnlyMedia) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e, toIndex) => {
                      if (readOnlyMedia) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      const fromIndex = parseInt(
                        e.dataTransfer.getData("text/plain"),
                        10
                      );
                      handleReorderMedia(fromIndex, toIndex);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Main Preview */}
            <div className="relative w-full rounded-lg overflow-hidden bg-muted">
              <div className="relative">
                {mediaFiles[activePreviewIndex]?.type.startsWith("video/") ? (
                  <div className="relative w-full h-full">
                    <VideoPreview 
                      videoFile={
                        // Check if we have a previewUrl first (for existing media)
                        (mediaFiles[activePreviewIndex] as MediaFileWithUrl).previewUrl || 
                        // Otherwise use the file object directly (for new uploads)
                        mediaFiles[activePreviewIndex]
                      } 
                    />
                  </div>
                ) : (
                  <img
                    // Use previewUrl for existing media images
                    src={(mediaFiles[activePreviewIndex] as MediaFileWithUrl).previewUrl || mediaPreviews[activePreviewIndex]}
                    alt="Active Preview"
                    className="w-full h-full object-contain"
                  />
                )}
                {!readOnlyMedia && (
                  <button
                    onClick={() => handleRemoveMedia(activePreviewIndex)}
                    className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full hover:bg-black/90 transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {documentFiles.length > 0 && (
          <div className="mt-2 space-y-2">
            {documentFiles.map((file, index) => (
              <div
                key={index}
                className="p-2 bg-[var(--secondary)] rounded-md flex justify-between items-center"
              >
                <span className="text-sm text-[var(--muted-foreground)]">
                  {file.name}
                </span>
                <button
                  onClick={() =>
                    setDocumentFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="p-1 hover:bg-[var(--secondary-hover)] rounded-full"
                >
                  <Trash2
                    size={16}
                    className="text-[var(--muted-foreground)]"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Crop Modal */}
      <MediaCropModal
        open={isCropModalOpen}
        onClose={handleCropModalClose}
        media={currentMediaFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default CreatePost;
