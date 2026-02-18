import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/Api";
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi } from "@/lib/documentsApi";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { DocumentRole } from "@/lib/types";

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
    uploadDisabled?: boolean;
    uploadDisabledReason?: string;
    uploadedFiles?: Array<{ name: string; url: string }>;
    onUploadSuccess?: (file: File, url: string) => void;
  }
  | {
    files: File[];
    onFilesChange: (files: File[]) => void;

    /** Create dialog (id not known yet) */
    workOrderId?: undefined;
    ensureWorkOrderId: () => Promise<string>;

    onUploaded?: (workOrderId: string) => void;
    onUploadingChange?: (uploading: boolean) => void;
    uploadDisabled?: boolean;
    uploadDisabledReason?: string;
    uploadedFiles?: Array<{ name: string; url: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUploadSuccess?: (file: File, document: any) => void;
  };

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const isVideoFile = (file: File) => file.type.startsWith("video/");
const isImageFile = (file: File) => file.type.startsWith("image/");
const isPdfFile = (file: File) => file.type === "application/pdf";

export default function FileUpload(props: FileUploadProps) {
  const { files, onFilesChange, onUploaded, onUploadingChange, onUploadSuccess } = props;

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
    let successCount = 0;
    const errors: string[] = [];

    try {
      const id = await resolveWorkOrderId();

      // ✅ Hard guard: NEVER hit /undefined
      if (!id || String(id).trim() === "") {
        toast.error("Work order id is missing. Draft creation failed.");
        return;
      }

      // Process files one by one (or in parallel) to follow the 3-step flow
      for (const file of files) {
        try {
          // 1. Upload
          const url = await uploadsApi.uploadDocument(file);

          // 2. Create Document Entity
          const doc = await documentsApi.create({
            fileUrl: url,
            fileType: file.type,
            docKind: 'work_order', // Default kind
            vendorNameRaw: null
          });

          // 3. Link to WorkOrder
          await workOrdersApi.attachDocument(id, {
            documentId: doc.id,
            role: DocumentRole.WorkOrder, // Default role
            startDate: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
            notes: file.name
          });

          onUploadSuccess?.(file, doc);

          successCount++;
        } catch (err: any) {
          console.error(`Failed to upload/attach ${file.name}:`, err);
          errors.push(`${file.name}: ${err.message || "Unknown error"}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} attachments`);
        onFilesChange([]); // Clear successfully uploaded
        onUploaded?.(id);
      }

      if (errors.length > 0) {
        toast.error(`Failed to upload ${errors.length} files`);
        console.error("Upload errors:", errors);
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Critical upload error");
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

            <div className="flex items-center gap-2 flex-wrap">
              {props.uploadDisabled && props.uploadDisabledReason && (
                <div className="w-full flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-semibold mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {props.uploadDisabledReason}
                </div>
              )}
              <Button
                size="sm"
                onClick={uploadFiles}
                disabled={uploading || props.uploadDisabled}
              >
                {uploading ? "Uploading…" : "Upload Files"}
              </Button>
            </div>
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

      {props.uploadedFiles && props.uploadedFiles.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <Label className="text-sm text-emerald-600 font-bold mb-2 block">Saved Attachments ({props.uploadedFiles.length})</Label>
          <div className="grid grid-cols-2 gap-2">
            {props.uploadedFiles.map((f, i) => (
              <div key={i} className="bg-emerald-50 border border-emerald-100 rounded p-2 flex items-center gap-2">
                <span className="text-emerald-500">
                  {f.name.endsWith('.pdf') ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                </span>
                <a href={f.url} target="_blank" rel="noreferrer" className="truncate flex-1 text-sm text-emerald-700 hover:underline">
                  {f.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
