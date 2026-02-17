import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, X, FileText, Loader2, CheckCircle2, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentRole, OperatorDocumentDto } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi } from "@/lib/documentsApi";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DocumentUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driverId: string;
    role: DocumentRole;
    title: string;
    onUploadSuccess: () => void;
    existingDocuments?: OperatorDocumentDto[];
}

export function DocumentUploadModal({
    open,
    onOpenChange,
    driverId,
    role,
    title,
    onUploadSuccess,
    existingDocuments = []
}: DocumentUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
    const [comments, setComments] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial State for existing documents comes from props but we might want to fetch fresh?
    // The parent passes them, so we just filter by role if needed, or assume parent passed relevant ones.
    // Actually parent passes ALL documents usually, we should filter here or expects parent to filter?
    // Let's filter here to be safe if parent passes all.
    const relevantDocs = existingDocuments
        .filter(d => d.role === role)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Most recent doc validation (populate fields if we want to "Edit" the current one?
    // The requirement says "popup bar... to update, add, and delete".
    // "Update" often means uploading a new version or changing dates.
    // Let's default to "Add New" mode, but show existing.

    useEffect(() => {
        if (!open) {
            // Reset form on close
            setFile(null);
            setStartDate(undefined);
            setExpirationDate(undefined);
            setComments("");
            setIsUploading(false);
        } else {
            // If there is an active document, maybe pre-fill dates?
            const active = relevantDocs.find(d => !d.status || d.status !== 'Expired');
            if (active) {
                if (active.startDate) setStartDate(new Date(active.startDate));
                if (active.expirationDate) setExpirationDate(new Date(active.expirationDate));
                // Don't pre-fill comments as that might be for the NEW file
            }
        }
    }, [open, role]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDelete = async (docId: string) => {
        if (confirm("Are you sure you want to delete this document?")) {
            try {
                // We detach from operator
                await operatorsApi.detachDocument(driverId, docId);
                toast.success("Document removed");
                onUploadSuccess(); // Refresh parent
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete document");
            }
        }
    };

    const handleSave = async () => {
        // Validation
        // If updating dates only (no file), we need to know WHICH document to update.
        // The UI design implies "Add New" mostly.
        // If the user wants to update dates of existing, they might expect to edit it inline or select it.
        // For now, let's assume this modal is primarily for UPLOADING or adding a record.
        // If file is missing, we can't create a new document easily without content.

        // However, user might want to just set dates for "No File" state?
        // But backend `AddOperatorAttachmentDto` requires `documentId`.
        // So we MUST have a document.

        if (!file && relevantDocs.length === 0) {
            toast.error("Please select a file to upload.");
            return;
        }

        // If no file but we have docs, maybe they want to update the latest doc?
        // That's ambiguous. Let's force file upload for "New/Update" action for now, 
        // OR supports "Update Latest" if no file selected?
        // Let's stick to File Upload mandatory for "Save" action to keep it simple and robust.

        if (!file) {
            // Check if we are just updating metadata of the LATEST document?
            // Let's allow it if there is a relevant doc.
            if (relevantDocs.length > 0) {
                const latest = relevantDocs[0];
                // Current API `attachDocument` ADDS a new link. It doesn't update the document entity itself directly?
                // Wait, `documentsApi` has `updateExtracted`.
                // But `operatorsApi` doesn't expose "Update Attachment Metadata".
                // So we will trigger "Upload required" for now.
                toast.error("Please upload a file to add a new record.");
                return;
            } else {
                toast.error("Please upload a file.");
                return;
            }
        }

        try {
            setIsUploading(true);

            // 1. Upload File
            const fileUrl = await uploadsApi.uploadDocument(file);

            // 2. Create Document Entity
            // Map role to docKind for AI if possible, generic fallback
            const docKind =
                role === DocumentRole.OperatorLicense ? "license" :
                    role === DocumentRole.MedicalCard ? "medical_card" :
                        "document";

            const doc = await documentsApi.create({
                fileUrl,
                fileType: file.type,
                docKind: docKind as any,
                title: `${title} - ${format(new Date(), "MM/dd/yyyy")}`,
                driverId: driverId
            });

            // 3. Attach to Operator
            await operatorsApi.attachDocument(driverId, {
                documentId: doc.id,
                role: role,
                startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
                expirationDate: expirationDate ? format(expirationDate, "yyyy-MM-dd") : undefined,
                isActive: true,
                notes: comments
            });

            toast.success("Document saved successfully");
            onUploadSuccess();
            onOpenChange(false);

        } catch (error) {
            console.error(error);
            toast.error("Failed to save document");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Upload Area */}
                    <div
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
                            file ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <>
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                                <p className="text-sm font-medium text-emerald-700">{file.name}</p>
                                <p className="text-xs text-emerald-600/70 mt-1">Click to change</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400 mt-1">JPEG, JPG, PNG, PDF</p>
                            </>
                        )}
                    </div>

                    {/* Metadata Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Last Collected On <span className="text-red-500">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "MM/dd/yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Expiration Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !expirationDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {expirationDate ? format(expirationDate, "MM/dd/yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={expirationDate} onSelect={setExpirationDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comments</Label>
                        <Textarea
                            placeholder="Add notes..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save
                        </Button>
                    </div>

                    {/* Existing Files List */}
                    {relevantDocs.length > 0 && (
                        <div className="space-y-3 pt-4 border-t">
                            {relevantDocs.map(doc => (
                                <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                                    <FileText className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline truncate block">
                                            {doc.fileUrl.split('/').pop() || "Document"}
                                        </a>
                                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                            <div>
                                                <span className="font-semibold text-gray-700">Last Collected On</span><br />
                                                {doc.startDate ? format(new Date(doc.startDate), "MM/dd/yyyy") : "N/A"}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Comments</span><br />
                                                {/* We don't have notes on OperatorDocumentDto usually, let's allow N/A */}
                                                N/A
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(doc.id)}>
                                                <Trash2 className="h-3 w-3 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
