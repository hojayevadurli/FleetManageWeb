import { DocumentAttachment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Camera, Video, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AssignmentAttachmentViewerProps {
    startAttachments?: DocumentAttachment[];
    endAttachments?: DocumentAttachment[];
}

export function AssignmentAttachmentViewer({ startAttachments, endAttachments }: AssignmentAttachmentViewerProps) {
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const hasStartAttachments = startAttachments && startAttachments.length > 0;
    const hasEndAttachments = endAttachments && endAttachments.length > 0;

    if (!hasStartAttachments && !hasEndAttachments) {
        return null;
    }

    const isImage = (fileType: string) => fileType.startsWith('image/');
    const isVideo = (fileType: string) => fileType.startsWith('video/');

    const renderAttachment = (attachment: DocumentAttachment) => {
        const isImg = isImage(attachment.fileType);
        const isVid = isVideo(attachment.fileType);

        return (
            <Card
                key={attachment.id}
                className="relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => isImg && setLightboxUrl(attachment.fileUrl)}
            >
                {isImg && (
                    <img
                        src={attachment.fileUrl}
                        alt="Assignment photo"
                        className="w-full h-20 object-cover"
                    />
                )}

                {isVid && (
                    <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                        <Video className="h-6 w-6 text-gray-400" />
                    </div>
                )}

                {/* External link icon for videos */}
                {isVid && (
                    <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="h-3 w-3 text-gray-600" />
                    </a>
                )}
            </Card>
        );
    };

    return (
        <div className="space-y-3 mt-3">
            {/* Start Photos */}
            {hasStartAttachments && (
                <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Camera className="h-3 w-3" />
                        <span>Start Condition ({startAttachments.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {startAttachments.map(renderAttachment)}
                    </div>
                </div>
            )}

            {/* End Photos */}
            {hasEndAttachments && (
                <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Camera className="h-3 w-3" />
                        <span>End Condition ({endAttachments.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {endAttachments.map(renderAttachment)}
                    </div>
                </div>
            )}

            {/* Lightbox for full-screen image viewing */}
            <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
                <DialogContent className="max-w-4xl">
                    {lightboxUrl && (
                        <img
                            src={lightboxUrl}
                            alt="Full size"
                            className="w-full h-auto"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
