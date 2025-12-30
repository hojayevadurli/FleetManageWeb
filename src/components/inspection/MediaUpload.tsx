
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Video } from "lucide-react";

interface MediaUploadProps {
  photos: FileList | null;
  videos: FileList | null;
  onPhotosChange: (files: FileList | null) => void;
  onVideosChange: (files: FileList | null) => void;
}

const MediaUpload = ({ photos, videos, onPhotosChange, onVideosChange }: MediaUploadProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="photos" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          General Photos
        </Label>
        <Input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onPhotosChange(e.target.files)}
          className="cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="videos" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          General Videos
        </Label>
        <Input
          id="videos"
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => onVideosChange(e.target.files)}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};

export default MediaUpload;
