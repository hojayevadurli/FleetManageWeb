import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, ZoomIn, ZoomOut, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LicensePreviewProps {
    frontFile: File | null;
    backFile: File | null;
    existingFrontUrl?: string | null;
    existingBackUrl?: string | null;
    onRemove?: (side: 'front' | 'back') => void;
    className?: string;
}

export function LicensePreview({ frontFile, backFile, existingFrontUrl, existingBackUrl, onRemove, className }: LicensePreviewProps) {
    const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
    const [zoom, setZoom] = useState(1);

    // Auto-switch to back if front is missing or user just uploaded back
    useEffect(() => {
        if (!frontFile && !existingFrontUrl && (backFile || existingBackUrl)) {
            setActiveTab('back');
        } else if ((frontFile || existingFrontUrl) && (!backFile && !existingBackUrl)) {
            setActiveTab('front');
        }
    }, [frontFile, backFile, existingFrontUrl, existingBackUrl]);

    // Priority: New File > Existing URL
    const activeFile = activeTab === 'front' ? frontFile : backFile;
    const activeUrl = activeTab === 'front' ? existingFrontUrl : existingBackUrl;

    // Determine source
    const isPdf = activeFile?.type === "application/pdf" || activeUrl?.toLowerCase().endsWith('.pdf');
    const previewUrl = activeFile
        ? (!isPdf ? URL.createObjectURL(activeFile) : null)
        : activeUrl;

    return (
        <Card className={cn("flex flex-col h-fit sticky top-6 shadow-lg border-blue-100/50", className)}>
            <CardHeader className="bg-gray-50/50 border-b pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Document Preview
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        {onRemove && (activeFile || activeUrl) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => onRemove(activeTab)}
                                title={`Remove ${activeTab} license`}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-700"
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                            disabled={!previewUrl}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-700"
                            onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
                            disabled={!previewUrl}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('front')}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors relative",
                        activeTab === 'front'
                            ? "text-blue-600 bg-white"
                            : "text-gray-500 bg-gray-50/50 hover:bg-gray-50"
                    )}
                >
                    Front View
                    {(frontFile || existingFrontUrl) && <Check className="h-3 w-3 text-emerald-500 absolute top-3 right-3" />}
                </button>
                <button
                    onClick={() => setActiveTab('back')}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors relative",
                        activeTab === 'back'
                            ? "text-blue-600 bg-white"
                            : "text-gray-500 bg-gray-50/50 hover:bg-gray-50",
                        (!backFile && !existingBackUrl) && "opacity-70"
                    )}
                >
                    Back View
                    {(backFile || existingBackUrl) && <Check className="h-3 w-3 text-emerald-500 absolute top-3 right-3" />}
                </button>
            </div>

            <CardContent className="p-0 min-h-[400px] max-h-[calc(100vh-300px)] overflow-auto bg-slate-50 relative flex items-center justify-center">
                {(activeFile || activeUrl) ? (
                    isPdf ? (
                        <div className="text-center p-8">
                            <div className="bg-red-50 p-4 rounded-full w-fit mx-auto mb-3">
                                <FileText className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="font-medium text-gray-900">{activeFile ? activeFile.name : "Attached PDF Document"}</h3>
                            <p className="text-sm text-gray-500 mt-1">PDF Preview Not Supported</p>
                            <p className="text-xs text-gray-400 mt-4 max-w-[200px] mx-auto">
                                Please refer to the original file or download to view.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="p-4 transition-transform origin-center"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <img
                                src={previewUrl!}
                                alt="License Preview"
                                className="max-w-full rounded shadow-sm border border-gray-200"
                            />
                        </div>
                    )
                ) : (
                    <div className="text-center text-gray-400 p-8">
                        <div className="bg-white p-4 rounded-full w-fit mx-auto mb-3 shadow-sm border border-gray-100">
                            <ImageIcon className="h-8 w-8 opacity-30" />
                        </div>
                        <p className="text-sm font-medium">No Preview Available</p>
                        <p className="text-xs mt-1 max-w-[180px] mx-auto opacity-70">
                            Select the standard front or back view to verify details.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
