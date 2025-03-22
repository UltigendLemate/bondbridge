import React, { useRef, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "@/components/ui/label";

interface GroupInfo {
  name: string;
  description: string;
  image?: string | null;
}

interface GroupInfoTabProps {
  groupInfo: GroupInfo;
  onChange: (info: GroupInfo) => void;
}

const GroupInfoTab: React.FC<GroupInfoTabProps> = ({ groupInfo, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create a preview URL for the selected image
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert the file to base64 for storage as string
    const reader = new FileReader();
    reader.onloadend = () => {
      // Store the base64 string in the image property
      onChange({ ...groupInfo, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="photo" className="text-center block">
          Group Photo
        </Label>
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Group image" 
                className="h-full w-full object-cover"
              />
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="group-image-upload"
            />
            <button 
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              onClick={handleButtonClick}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="groupName" className="text-sm font-medium">
          Group Name
        </label>
        <Input
          id="groupName"
          placeholder="Enter group name"
          value={groupInfo.name}
          onChange={(e) => onChange({ ...groupInfo, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Describe your group..."
          value={groupInfo.description}
          onChange={(e) =>
            onChange({ ...groupInfo, description: e.target.value })
          }
          rows={4}
        />
      </div>
    </div>
  );
};

export default GroupInfoTab;