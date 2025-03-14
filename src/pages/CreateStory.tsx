import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Type, Image, Video, Palette, Smile, ChevronLeft, ChevronRight } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { uploadStory } from '../apis/commonApiCalls/storyApi';
import { useApiCall } from '../apis/globalCatchError';
import { Story } from '../apis/apiTypes/request';

const CreateStory = () => {
  const [stories, setStories] = useState<Story[]>([{ 
    type: 'text', 
    content: '', 
    theme: 'bg-primary',
    privacy: 1 
  }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const [executeUploadStory, isUploading] = useApiCall(uploadStory);

  const handleTextChange = (newText: string) => {
    setStories(prev => prev.map((story, idx) => 
      idx === currentPage ? { ...story, content: newText } : story
    ));
  };

  const handleThemeChange = (color: string) => {
    setStories(prev => prev.map((story, idx) => 
      idx === currentPage ? { ...story, theme: color } : story
    ));
  };

  const handleAddPage = () => {
    if (stories.length < 10) {
      const currentTheme = stories[currentPage].theme;
      setStories(prev => [...prev, { type: 'text', content: '', theme: currentTheme, privacy: 1 }]);
      setCurrentPage(stories.length);
    }
  };

  const handleDeletePage = () => {
    if (stories.length > 1) {
      setStories(prev => prev.filter((_, idx) => idx !== currentPage));
      if (currentPage === stories.length - 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Use these values from stories state
  const currentStory = stories[currentPage];
  const currentTheme = currentStory.theme;
  const currentContentText = typeof currentStory.content === 'string' ? currentStory.content : '';
  const currentPreviewUrl = currentStory.previewUrl || '';

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const newStories = [...stories];
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          newStories[currentPage] = {
            type,
            content: file,
            theme: currentTheme,
            privacy: 1,
            previewUrl: reader.result as string
          };
          setStories(newStories);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const navigate = useNavigate();
  const handleCancel = () => {
    navigate('/');
  };

  const handleCreateStory = async () => {
    // Validate stories
    const emptyStory = stories.find(story => {
      if (typeof story.content === 'string') {
        return !story.content.trim();
      }
      if (story.content instanceof File || story.content instanceof Blob) {
        return story.content.size === 0;
      }
      return false;
    });
    
    if (emptyStory) {
      return;
    }
    
    // Ensure all stories have a privacy value
    const storiesWithPrivacy = stories.map(story => ({
      ...story,
      privacy: story.privacy || 1 // Default to 1 if privacy is undefined
    }));
    
    // Call the API using the useApiCall hook
    const result = await executeUploadStory(storiesWithPrivacy);
    
    if (result.success && result.data) {
      navigate('/');
    }
  };

  return (
    <div className="relative h-full bg-background text-foreground">
      {/* Top Controls */}
      <div className="flex items-center justify-between p-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/activity/cat.png" alt="Profile" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            onClick={handleCreateStory}
            disabled={isUploading}
          >
            {isUploading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      <div className="h-px bg-border" /> {/* Separator */}

      <div className="flex h-[calc(100vh-145px)]">
        {/* Left Sidebar Tools */}
        <div className="w-16 flex flex-col gap-8 p-4 pt-16">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground h-auto p-2"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
              }}
            >
              <Type className="w-5 h-5" />
            </Button>
            <span className="text-xs">Text</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleMediaUpload(e, 'photo')}
              />
              <Image className="w-5 h-5 text-foreground" />
            </label>
            <span className="text-xs">Photo</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleMediaUpload(e, 'video')}
              />
              <Video className="w-5 h-5 text-foreground" />
            </label>
            <span className="text-xs">Video</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground h-auto p-2"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
              }}
            >
              <Palette className="w-5 h-5" />
            </Button>
            <span className="text-xs">Theme</span>
            <input
              type="color"
              id="color-picker"
              className="hidden"
              onChange={(e) => {
                handleThemeChange(e.target.value);
                setShowColorPicker(false);
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground h-auto p-2"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <span className="text-xs">Emoji</span>
            {showEmojiPicker && (
              <div className="absolute left-20 top-1/2 -translate-y-1/2 z-96">
                <EmojiPicker
                  onEmojiClick={(emojiObject) => {
                    handleTextChange(currentContentText + emojiObject.emoji);
                    setShowEmojiPicker(false);
                  }}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
        </div>

        {/* Story Content Area */}
        <div className="flex-1 p-4 relative z-50">
          <div
            className={`max-w-xs mx-auto rounded-lg h-full relative`}
            style={{ backgroundColor: currentTheme.startsWith('bg-') ? '' : currentTheme }}
          >
            {currentTheme.startsWith('bg-') && <div className={`absolute inset-0 ${currentTheme} rounded-lg`}></div>}

            {/* Delete and Add Page Buttons */}
            {stories.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-12 left-4 rounded-full bg-accent/10 hover:bg-accent/20 z-20"
                onClick={handleDeletePage}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}

            {stories.length < 10 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-12 right-4 rounded-full bg-accent/10 hover:bg-accent/20 z-20"
                onClick={handleAddPage}
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}



            {/* Progress Indicators */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="h-1 flex-1 rounded-full overflow-hidden bg-muted/30"
                >
                  <div
                    className={`h-full bg-foreground  ${index === currentPage ? 'w-full' : 'w-0'
                      }`}
                  />
                </div>
              ))}
            </div>

            {/* Story Content */}
            <div className="h-full w-full flex items-center justify-center relative z-10">
              {currentStory.type === 'text' && (
                <div className="w-full px-4">
                  <textarea
                    value={currentContentText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="What's on your mind..."
                    className="w-full bg-transparent resize-none outline-none text-foreground text-center"
                    rows={3}
                    autoFocus
                  />
                </div>
              )}
              {currentStory.type === 'photo' && (
                <img
                  src={currentPreviewUrl}
                  alt="Story"
                  className="w-full h-full p-4 object-contain"
                />
              )}
              {currentStory.type === 'video' && (
                <video
                  src={currentPreviewUrl}
                  className="w-full h-full p-4 object-contain"
                />
              )}

              {/* Show color picker only for text type */}
              {showColorPicker && currentStory.type === 'text' && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-background/50 rounded-full animate-in fade-in duration-200">
                  {['bg-primary', 'bg-accent', 'bg-secondary', 'bg-destructive', 'bg-muted'].map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${color} ${currentTheme === color ? 'ring-2 ring-foreground' : ''}`}
                      onClick={() => {
                        handleThemeChange(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                  <button
                    className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center"
                    onClick={() => {
                      const colorPicker = document.getElementById('color-picker');
                      if (colorPicker) colorPicker.click();
                    }}
                  >
                    <Palette className="w-4 h-4 text-background" />
                  </button>
                </div>
              )}
               {/* Navigation Arrows */}
          {currentPage > 0 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="absolute left-0 top-1/2  -translate-y-1/2 -translate-x-[calc(100%+10px)] bg-accent/60 p-2 rounded-full z-20 hover:bg-accent/20"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
          )}

          {currentPage < stories.length - 1 && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+10px)] bg-accent/60 p-2 rounded-full z-20 hover:bg-accent/20"
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          )}
            </div>
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default CreateStory;