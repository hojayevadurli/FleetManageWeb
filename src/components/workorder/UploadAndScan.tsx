import { DragEvent, ChangeEvent, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadAndScanProps {
    onFileSelect: (file: File) => void;
    isParsing: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"];

export default function UploadAndScan({
    onFileSelect,
    isParsing,
}: UploadAndScanProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    const isValidFile = (file: File): boolean => {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            toast.error(`${file.name}: Invalid file type. Allowed: JPG, PNG, WEBP, PDF`);
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name}: File too large. Max 50MB`);
            return false;
        }

        return true;
    };

    const processFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];

        if (!isValidFile(file)) return;

        console.log("Processing invoice file:", file.name);
        onFileSelect(file);
    };

    const handleInputDragEnter = () => {
        if (!isParsing) setIsDragActive(true);
    };

    const handleInputDragLeave = () => {
        setIsDragActive(false);
    };

    const handleInputDrop = () => {
        setIsDragActive(false);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);

        // Allow selecting the same file again
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
            <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                onChange={handleInputChange}
                onDragEnter={handleInputDragEnter}
                onDragLeave={handleInputDragLeave}
                onDrop={handleInputDrop}
                disabled={isParsing}
                className={cn(
                    "absolute inset-0 w-full h-full opacity-0 z-10",
                    isParsing ? "cursor-wait" : "cursor-pointer"
                )}
                title=""
            />

            <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                            isParsing
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-blue-500"
                        )}
                    >
                        {isParsing ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6" />
                        )}
                    </div>

                    <div className="text-left">
                        <h4 className="text-sm font-semibold text-gray-900">
                            Upload & AI Scan
                        </h4>
                        <p className="text-xs text-slate-500">
                            {isParsing
                                ? "Scanning invoice..."
                                : isDragActive
                                    ? "Drop invoice to upload..."
                                    : "Auto-fill details from invoice or picture"}
                        </p>
                    </div>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded bg-white border border-gray-200 flex-shrink-0">
                    AI Recommended
                </span>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center pointer-events-none">
                JPG, PNG, WEBP, PDF • Drag or click to upload
            </p>
        </div>
    );
}