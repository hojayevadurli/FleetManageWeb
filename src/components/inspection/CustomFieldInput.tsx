
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Video, Trash2 } from "lucide-react";

interface CustomField {
  label: string;
  value: string;
  photos: FileList | null;
  videos: FileList | null;
}

interface CustomFieldInputProps {
  field: CustomField;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const CustomFieldInput = ({ field, index, onUpdate, onRemove, canRemove }: CustomFieldInputProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Field {index + 1}</Label>
        {canRemove && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`label-${index}`}>Field Label</Label>
          <Input
            id={`label-${index}`}
            placeholder="Enter field label"
            value={field.label}
            onChange={(e) => onUpdate(index, 'label', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`value-${index}`}>Value</Label>
          <Input
            id={`value-${index}`}
            placeholder="Enter value"
            value={field.value}
            onChange={(e) => onUpdate(index, 'value', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`photos-${index}`} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Photos
          </Label>
          <Input
            id={`photos-${index}`}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onUpdate(index, 'photos', e.target.files)}
            className="cursor-pointer"
          />
        </div>
        <div>
          <Label htmlFor={`videos-${index}`} className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos
          </Label>
          <Input
            id={`videos-${index}`}
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => onUpdate(index, 'videos', e.target.files)}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomFieldInput;
