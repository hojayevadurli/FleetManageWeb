import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, X, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AssignmentMediaUploadProps {
    onFilesSelected: (files: File[]) => void;
    selectedFiles: File[];
    onRemoveFile: (index: number) => void;
    label?: string;
}

export function AssignmentMediaUpload({
    onFilesSelected,
    selectedFiles,
    onRemoveFile,
    label = "Attach Photos/Videos"
}: AssignmentMediaUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            onFilesSelected([...selectedFiles, ...newFiles]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            onFilesSelected([...selectedFiles, ...newFiles]);
        }
    };

    const getFilePreview = (file: File) => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return null;
    };

    const isVideo = (file: File) => file.type.startsWith('video/');
    const isImage = (file: File) => file.type.startsWith('image/');

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium">{label}</label>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                        <Camera className="h-8 w-8 text-gray-400" />
                        <Video className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-sm text-gray-600">
                        Drag and drop files here, or
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse Files
                    </Button>
                    <div className="text-xs text-gray-500 mt-1">
                        Supports: JPG, PNG, HEIC, MP4, MOV
                    </div>
                </div>
            </div>

            {/* Preview Selected Files */}
            {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedFiles.map((file, index) => (
                        <Card key={index} className="relative p-2">
                            <button
                                type="button"
                                onClick={() => onRemoveFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                            >
                                <X className="h-3 w-3" />
                            </button>

                            {isImage(file) && (
                                <img
                                    src={getFilePreview(file) || ''}
                                    alt={file.name}
                                    className="w-full h-24 object-cover rounded"
                                />
                            )}

                            {isVideo(file) && (
                                <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                                    <Video className="h-8 w-8 text-gray-400" />
                                </div>
                            )}

                            <div className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                                {file.name}
                            </div>
                            <div className="text-xs text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
