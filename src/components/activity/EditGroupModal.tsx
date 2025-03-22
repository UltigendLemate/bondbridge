import { useState, useRef, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiCall } from "@/apis/globalCatchError";
import { editGroup } from "@/apis/commonApiCalls/activityApi";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  bio: string;
  image: string;
  groupId: string;
  onGroupUpdated: () => void;
}

export function EditGroupModal({
  isOpen,
  onClose,
  groupName,
  bio,
  image,
  groupId,
  onGroupUpdated,
}: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    groupName,
    bio,
    image,
  });
  const [previewUrl, setPreviewUrl] = useState<string>(image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [executeEditGroup] = useApiCall(editGroup);

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Generate preview
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        
        // Convert file to base64 using FileReader directly
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, image: reader.result as string });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process the image");
      }
    }
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await executeEditGroup({
        groupId,
        bio: formData.bio,
        image: formData.image,
        groupName: formData.groupName,
      });
      
      if (result.success) {
        toast.success("Group updated successfully");
        onGroupUpdated();
        onClose();
      } else {
        toast.error(result.data?.message || "Failed to update group");
      }
    } catch (error) {
      toast.error("An error occurred while updating the group");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl} alt={formData.groupName} />
                <AvatarFallback className="bg-primary-foreground">
                  {formData.groupName?.[0] || "G"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={formData.groupName}
              onChange={(e) =>
                setFormData({ ...formData, groupName: e.target.value })
              }
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Enter group bio"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 