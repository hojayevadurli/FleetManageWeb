import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/Api";

/**
 * ✅ Enforce correct usage:
 * - Edit mode: must provide workOrderId
 * - Create mode: must provide ensureWorkOrderId (draft creator)
 */
type FileUploadProps =
  | {
      files: File[];
      onFilesChange: (files: File[]) => void;

      /** Edit dialog */
      workOrderId: string;
      ensureWorkOrderId?: never;

      onUploaded?: (workOrderId: string) => void;
      onUploadingChange?: (uploading: boolean) => void;
    }
  | {
      files: File[];
      onFilesChange: (files: File[]) => void;

      /** Create dialog (id not known yet) */
      workOrderId?: undefined;
      ensureWorkOrderId: () => Promise<string>;

      onUploaded?: (workOrderId: string) => void;
      onUploadingChange?: (uploading: boolean) => void;
    };

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const isVideoFile = (file: File) => file.type.startsWith("video/");
const isImageFile = (file: File) => file.type.startsWith("image/");
const isPdfFile = (file: File) => file.type === "application/pdf";

export default function FileUpload(props: FileUploadProps) {
  const { files, onFilesChange, onUploaded, onUploadingChange } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;

    const valid = selected.filter((file) => {
      const okType = isImageFile(file) || isVideoFile(file) || isPdfFile(file);
      if (!okType) {
        toast.error(`${file.name} is not an image, video, or PDF`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    const existingKeys = new Set(files.map((f) => `${f.name}|${f.size}|${f.lastModified}`));
    const deduped = valid.filter((f) => !existingKeys.has(`${f.name}|${f.size}|${f.lastModified}`));

    onFilesChange([...files, ...deduped]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const resolveWorkOrderId = async () => {
    // Edit mode
    if ("workOrderId" in props && props.workOrderId) return props.workOrderId;

    // Create mode
    if ("ensureWorkOrderId" in props && props.ensureWorkOrderId) {
      const id = await props.ensureWorkOrderId();
      return id;
    }

    return "";
  };

  const uploadFiles = async () => {
    if (!files.length) {
      toast.info("No files selected");
      return;
    }

    setUploading(true);
    try {
      const id = await resolveWorkOrderId();

      // ✅ Hard guard: NEVER hit /undefined
      if (!id || String(id).trim() === "") {
        toast.error("Work order id is missing. Draft creation failed.");
        return;
      }

      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      // ✅ Ensure your axios instance baseURL includes `/api`
      // Example final URL: https://localhost:7297/api/workorders/{id}/attachments
      await api.post(`/workorders/${id}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      onFilesChange([]);
      toast.success("Attachments uploaded");
      onUploaded?.(id);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Upload failed";
      toast.error(String(msg));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Attachments (Images / Videos / PDF)</Label>

        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full mt-2"
        >
          <Upload className="h-4 w-4 mr-2" />
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm">Selected ({files.length})</Label>

            <Button size="sm" onClick={uploadFiles} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload Files"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="border rounded p-2 flex items-center gap-2"
              >
                {isVideoFile(file) ? (
                  <Video className="h-4 w-4" />
                ) : isPdfFile(file) ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}

                <span className="truncate flex-1 text-sm">{file.name}</span>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(i)}
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
