import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadAndScanProps {
    onFileSelect: (file: File) => void;
    isParsing: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];

export default function UploadAndScan({ onFileSelect, isParsing }: UploadAndScanProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    // Validate single file
    const isValidFile = (file: File): boolean => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            toast.error(`${file.name}: Invalid file type. Allowed: JPG, PNG, PDF, DOC/DOCX`);
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name}: File too large. Max 50MB`);
            return false;
        }
        return true;
    };

    const traverseFileTree = (item: any, path = ""): Promise<File[]> => {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file: File) => resolve([file]));
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                dirReader.readEntries(async (entries: any[]) => {
                    const promises = entries.map((entry) => traverseFileTree(entry, path + item.name + "/"));
                    const results = await Promise.all(promises);
                    resolve(results.flat());
                });
            } else {
                resolve([]);
            }
        });
    };

    const processFiles = async (files: File[] | FileList | null) => {
        if (!files) return;

        const fileList = Array.isArray(files) ? files : Array.from(files);

        if (fileList.length === 0) return;

        fileList.forEach(file => {
            if (isValidFile(file)) {
                console.log("Processing file:", file.name);
                onFileSelect(file);
            }
        });
    };

    // --- Handlers for the INPUT (Transparent Overlay) ---
    // The input covers the entire div, so THESE are the events that fire.
    // We use them to toggle the visual state of the parent div.

    const handleInputDragEnter = (e: DragEvent<HTMLInputElement>) => {
        setIsDragActive(true);
    };

    const handleInputDragLeave = (e: DragEvent<HTMLInputElement>) => {
        setIsDragActive(false);
    };

    const handleInputDrop = (e: DragEvent<HTMLInputElement>) => {
        setIsDragActive(false);
        // "onChange" will handle the actual file selection for the input
        // BUT if the user dropped a folder or use non-standard drop, we might need manual handling?
        // Standard input type=file handles drops fine usually.
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log("Input change detected:", files);
        processFiles(files);
        // Reset to allow same file selection again
        e.target.value = "";
    };

    return (
        <div
            className={cn(
                "relative border-2 border-dashed rounded-xl p-6 transition-all group outline-none",
                isParsing
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50",
                isDragActive && "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
            )}
            style={{ minHeight: "80px" }}
        >
            {/* 
         TRANSPARENT INPUT OVERLAY 
         This absolutely positioned input covers the entire component.
         The user clicks or drops ON THIS INPUT, not the div.
         This guarantees native browser behavior for file selection.
      */}
            <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleInputChange}
                onDragEnter={handleInputDragEnter}
                onDragLeave={handleInputDragLeave}
                onDrop={handleInputDrop}
                disabled={isParsing}
                className={cn(
                    "absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer",
                    isParsing ? "cursor-wait" : "cursor-pointer"
                )}
                title=""
            />

            {/* VISUAL CONTENT (Pointer events ignored so input gets them) */}
            <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                        isParsing ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-blue-500"
                    )}>
                        {isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-semibold text-gray-900">Upload & AI Scan</h4>
                        <p className="text-xs text-slate-500">
                            {isParsing
                                ? "Scanning document..."
                                : isDragActive
                                    ? "Drop file to upload..."
                                    : "Auto-fill details from invoice or picture"}
                        </p>
                    </div>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded bg-white border border-gray-200 flex-shrink-0">
                    AI Recommended
                </span>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center pointer-events-none">
                JPG, PNG, PDF, DOC, DOCX • Drag or click to upload
            </p>
        </div>
    );
}
