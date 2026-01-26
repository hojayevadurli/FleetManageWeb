import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, X, FileText, CheckCircle2, AlertCircle, Sparkles, Eye } from 'lucide-react';
import { EquipmentDocRole } from '@/lib/types';
import { parseDocumentWithAI } from '@/lib/gemini';
import { equipmentApi } from '@/lib/equipmentApi';
import { toast } from 'sonner';

interface DocumentUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    equipmentId: string;
    assetType?: string; // "truck" | "trailer"
    onUploadComplete: () => void;
}

interface FileUploadState {
    id: string;
    file: File;
    status: 'pending' | 'scanning' | 'ready' | 'uploading' | 'complete' | 'error';
    role: EquipmentDocRole;
    issueDate?: string;
    expirationDate?: string;
    notes: string;
    error?: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
    open,
    onOpenChange,
    equipmentId,
    assetType,
    onUploadComplete
}) => {
    const [files, setFiles] = useState<FileUploadState[]>([]);
    const [isGlobalUploading, setIsGlobalUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        // Limiting to the first file selected since we removed 'multiple'
        const file = e.target.files[0];

        const newFiles: FileUploadState[] = [{
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'pending',
            role: EquipmentDocRole.Other,
            notes: '',
        }];

        // Replace existing files with the new one
        setFiles(newFiles);

        // Trigger scan for new file
        newFiles.forEach(fileState => scanFile(fileState));

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const scanFile = async (fileState: FileUploadState) => {
        updateFileStatus(fileState.id, 'scanning');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(fileState.file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const aiResult = await parseDocumentWithAI(base64, fileState.file.type);

                if (aiResult) {
                    // Map string docType to Enum
                    let role = EquipmentDocRole.Other;
                    const typeLower = aiResult.docType?.toLowerCase() || '';
                    if (typeLower.includes('registration')) role = EquipmentDocRole.Registration;
                    else if (typeLower.includes('title')) role = EquipmentDocRole.Title;
                    else if (typeLower.includes('insurance')) role = EquipmentDocRole.Insurance;
                    else if (typeLower.includes('warranty')) role = EquipmentDocRole.Warranty;
                    else if (typeLower.includes('lease')) role = EquipmentDocRole.Lease;
                    else if (typeLower.includes('dot')) role = EquipmentDocRole.DOTInspection;
                    else if (typeLower.includes('general')) role = EquipmentDocRole.General;

                    setFiles(prev => prev.map(f => {
                        if (f.id !== fileState.id) return f;
                        return {
                            ...f,
                            status: 'ready',
                            role,
                            issueDate: aiResult.issueDate,
                            expirationDate: aiResult.expirationDate,
                            notes: aiResult.notes || ''
                        };
                    }));
                } else {
                    updateFileStatus(fileState.id, 'ready'); // Ready but manual entry needed
                }
            };
        } catch (err) {
            console.error("Scan failed", err);
            updateFileStatus(fileState.id, 'ready');
        }
    };

    const updateFileStatus = (id: string, status: FileUploadState['status'], error?: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status, error } : f));
    };

    const updateFileMetadata = (id: string, updates: Partial<FileUploadState>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handlePreview = (file: File) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    };

    const handleUploadAll = async () => {
        setIsGlobalUploading(true);
        let successCount = 0;
        let hasError = false;

        for (const fileState of files) {
            // Skip already completed files
            if (fileState.status === 'complete') continue;

            updateFileStatus(fileState.id, 'uploading');
            try {
                const formData = new FormData();
                formData.append('file', fileState.file);
                formData.append('docRole', fileState.role.toString());
                if (fileState.issueDate) formData.append('startDate', fileState.issueDate);
                if (fileState.expirationDate) formData.append('expirationDate', fileState.expirationDate);
                formData.append('notes', fileState.notes);
                if (assetType) formData.append('assetType', assetType);

                await equipmentApi.uploadDocument(equipmentId, formData);
                updateFileStatus(fileState.id, 'complete');
                successCount++;
            } catch (err) {
                console.error("Upload failed", err);
                updateFileStatus(fileState.id, 'error', "Upload failed");
                hasError = true;
            }
        }

        setIsGlobalUploading(false);
        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} documents`);
            onUploadComplete();

            // Close if we had no errors in this batch, or if all items are now effectively complete
            // Since we know we just processed everything that wasn't complete,
            // 'hasError' being false means everything we touched succeeded.
            // If there were existing errors we didn't touch, they would block closing?
            // Actually, if hasError is false, it means every file we attempted in this loop succeeded.
            // And since we attempt all non-complete files, this implies all files are now complete (assuming no error files from before were skipped).
            // But wait, if fileState.status was 'error' before, it is !== 'complete', so we retried it.
            // So logic holds: if !hasError, all files are complete.
            if (!hasError) {
                setTimeout(() => {
                    setFiles([]);
                    onOpenChange(false);
                }, 500);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>
                        Upload vehicle documents. AI will scan them to extract details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileSelect}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900">Click to upload document</h3>
                            <p className="text-sm text-slate-500">PDF, JPG, PNG supported</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {files.map(file => (
                            <div key={file.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                    <button
                                        onClick={() => handlePreview(file.file)}
                                        className="text-slate-400 hover:text-blue-600 p-1"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-500 p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handlePreview(file.file)}>
                                        {file.status === 'scanning' ? (
                                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                        ) : file.status === 'complete' ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        ) : file.status === 'error' ? (
                                            <AlertCircle className="w-6 h-6 text-red-500" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4
                                            className="font-bold text-slate-900 truncate pr-6 cursor-pointer hover:text-blue-600 transition-colors decoration-blue-200 hover:underline underline-offset-4"
                                            onClick={() => handlePreview(file.file)}
                                            title="Click to preview document"
                                        >
                                            {file.file.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 font-medium">{(file.file.size / 1024).toFixed(0)} KB</span>
                                            {file.status === 'scanning' && (
                                                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> AI Scanning...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-slate-400">Document Type</Label>
                                        <Select
                                            value={file.role.toString()}
                                            onValueChange={(val) => updateFileMetadata(file.id, { role: Number(val) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={EquipmentDocRole.Registration.toString()}>Registration</SelectItem>
                                                <SelectItem value={EquipmentDocRole.Title.toString()}>Title</SelectItem>
                                                <SelectItem value={EquipmentDocRole.Insurance.toString()}>Insurance</SelectItem>
                                                <SelectItem value={EquipmentDocRole.DOTInspection.toString()}>DOT Inspection</SelectItem>
                                                <SelectItem value={EquipmentDocRole.Warranty.toString()}>Warranty</SelectItem>
                                                <SelectItem value={EquipmentDocRole.Lease.toString()}>Lease</SelectItem>
                                                <SelectItem value={EquipmentDocRole.Other.toString()}>Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-slate-400">Notes / Details</Label>
                                        <Input
                                            value={file.notes}
                                            onChange={(e) => updateFileMetadata(file.id, { notes: e.target.value })}
                                            placeholder="Policy #, etc."
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-slate-400">Issue Date</Label>
                                        <Input
                                            type="date"
                                            value={file.issueDate || ''}
                                            onChange={(e) => updateFileMetadata(file.id, { issueDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-slate-400">Expiration Date</Label>
                                        <Input
                                            type="date"
                                            value={file.expirationDate || ''}
                                            onChange={(e) => updateFileMetadata(file.id, { expirationDate: e.target.value })}
                                            className={file.role === EquipmentDocRole.Registration || file.role === EquipmentDocRole.Insurance ? "border-amber-200 bg-amber-50" : ""}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleUploadAll}
                        disabled={files.length === 0 || isGlobalUploading || files.some(f => f.status === 'scanning')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isGlobalUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                            </>
                        ) : (
                            `Upload ${files.filter(f => f.status !== 'complete').length} Files`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentUploadModal;
