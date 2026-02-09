import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, ZoomIn, ZoomOut, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
    fileUrl?: string; // URL of the existing file
    file?: File;      // New file object (for uploads)
    fileName?: string;
    fileType?: string; // MIME type or logical type
    className?: string;
}

export function DocumentPreview({ fileUrl, file, fileName, fileType, className }: DocumentPreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (fileUrl) {
            setPreviewUrl(fileUrl);
        }
    }, [file, fileUrl]);

    // Check if it's a mock document
    const isMock = previewUrl === "#";
    const isPdf = !isMock && (fileType?.toLowerCase().includes("pdf") || fileName?.toLowerCase().endsWith(".pdf") || fileUrl?.toLowerCase().endsWith(".pdf"));
    const isImage = !isMock && (fileType?.toLowerCase().startsWith("image") || fileName?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) || fileUrl?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/));

    if (!previewUrl) {
        return (
            <Card className={cn("h-full flex items-center justify-center bg-gray-50 border-dashed border-gray-200 shadow-none", className)}>
                <div className="text-center text-gray-400">
                    <div className="bg-white p-4 rounded-full w-fit mx-auto mb-3 shadow-sm border border-gray-100">
                        <FileText className="h-8 w-8 opacity-30" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No Document Selected</p>
                    <p className="text-xs mt-1 text-gray-500">Select a document from the list to preview.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("flex flex-col h-full shadow-none border-l border-gray-200 rounded-none", className)}>
            <div className="bg-white border-b py-2 px-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0">
                        {isPdf || isMock ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium truncate text-gray-900" title={fileName}>
                        {fileName || "Document Preview"}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {(isImage || isMock) && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                                disabled={isMock}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-gray-500 w-8 text-center select-none">{Math.round(zoom * 100)}%</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                disabled={isMock}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-gray-200 mx-2" />
                        </>
                    )}
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => !isMock && window.open(previewUrl, '_blank')} disabled={isMock}>
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download</span>
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50/50 flex items-center justify-center relative p-8">
                {isMock ? (
                    <div className="text-center max-w-sm mx-auto">
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 aspect-[3/4] flex flex-col items-center justify-center mb-4 mx-auto w-64">
                            <FileText className="h-16 w-16 text-gray-200 mb-4" />
                            <p className="text-gray-400 font-medium">Mock Document Preview</p>
                            <p className="text-xs text-gray-300 mt-2 text-center">This is a placeholder for the demo environment.</p>
                        </div>
                        <p className="text-sm text-gray-500">Upload a real file to see the live preview.</p>
                    </div>
                ) : isPdf ? (
                    <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full rounded shadow-sm bg-white"
                        title="PDF Preview"
                    />
                ) : isImage ? (
                    <div
                        className="transition-transform origin-center shadow-lg rounded-sm overflow-hidden"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <img
                            src={previewUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain bg-white"
                        />
                    </div>
                ) : (
                    <div className="text-center p-8">
                        <div className="bg-amber-50 p-4 rounded-full w-fit mx-auto mb-3">
                            <AlertCircle className="h-8 w-8 text-amber-500" />
                        </div>
                        <h3 className="font-medium text-gray-900">Preview Not Available</h3>
                        <p className="text-sm text-gray-500 mt-1">This file type ({fileType}) cannot be previewed directly.</p>
                        <Button className="mt-4" variant="default" onClick={() => window.open(previewUrl, '_blank')}>
                            Download to View
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
