import { useState, useEffect, useMemo } from "react";
import { OperatorDto, OperatorDocumentDto, DocumentRole } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { documentsApi, CreateDocumentDto, DocKind } from "@/lib/documentsApi";
import { uploadsApi } from "@/lib/uploadsApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Search, Filter, AlertCircle, Upload } from "lucide-react";
import { DocumentCard } from "../DocumentCard";
import { DocumentPreview } from "../DocumentPreview";
import { useToast } from "@/hooks/use-toast";

interface DocumentsTabProps {
    driver: OperatorDto;
}

export function DocumentsTab({ driver }: DocumentsTabProps) {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<OperatorDocumentDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [searchTerm, setSearchTerm] = useState("");

    // Preview State
    const [previewDoc, setPreviewDoc] = useState<OperatorDocumentDto | null>(null);

    // Upload State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState("");
    const [uploadExpiry, setUploadExpiry] = useState("");
    const [uploadNotes, setUploadNotes] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (driver.documents) {
            setDocuments(driver.documents);
        }
        setLoading(false);
    }, [driver]);

    // Grouping Logic
    const groupedDocs = useMemo(() => {
        const groups = {
            Mandatory: [] as OperatorDocumentDto[],
            Agreements: [] as OperatorDocumentDto[],
            Background: [] as OperatorDocumentDto[],
            Training: [] as OperatorDocumentDto[],
            Other: [] as OperatorDocumentDto[],
        };

        const filtered = documents.filter(doc => {
            const fileName = doc.fileUrl ? doc.fileUrl.split('/').pop() || '' : '';
            return fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.docKind || '').toLowerCase().includes(searchTerm.toLowerCase());
        });

        filtered.forEach(doc => {
            // Normalize role or docKind
            const kind = (doc.role || doc.docKind || "").toLowerCase();

            if (kind.includes("license") || kind.includes("medical") || kind.includes("cdl")) {
                groups.Mandatory.push(doc);
            } else if (kind.includes("contract") || kind.includes("agreement") || kind.includes("policy")) {
                groups.Agreements.push(doc);
            } else if (kind.includes("mvr") || kind.includes("drug") || kind.includes("background") || kind.includes("clearinghouse")) {
                groups.Background.push(doc);
            } else if (kind.includes("training") || kind.includes("test") || kind.includes("cert")) {
                groups.Training.push(doc);
            } else {
                groups.Other.push(doc);
            }
        });

        return groups;
    }, [documents, searchTerm]);

    const handleUpload = async () => {
        if (!uploadFile || !uploadType) return;

        setIsUploading(true);
        try {
            // 1. Upload File
            const fileUrl = await uploadsApi.uploadDocument(uploadFile);

            // 2. Create Document Entity
            // Map generic type to DocKind for backend classification
            let docKind: DocKind = "unknown";
            const lowerType = uploadType.toLowerCase();
            if (lowerType.includes("license") || lowerType.includes("cdl")) docKind = "license";
            else if (lowerType.includes("invoice")) docKind = "invoice";
            else if (lowerType.includes("receipt")) docKind = "receipt";
            else if (lowerType.includes("work")) docKind = "work_order";

            const createDocDto: CreateDocumentDto = {
                fileUrl,
                fileType: uploadFile.type,
                docKind: docKind,
                title: uploadType,
                // We don't link driverId here, we use attachDocument below for explicit link with Role
            };

            const newDoc = await documentsApi.create(createDocDto);

            // 3. Attach to Operator
            const role = mapTypeToRole(uploadType);
            const attachedDoc = await operatorsApi.attachDocument(driver.id, {
                documentId: newDoc.id,
                role: role,
                expirationDate: uploadExpiry || undefined,
                isActive: true,
                notes: uploadNotes
            });

            // 4. Update UI
            setDocuments(prev => [...prev, attachedDoc]);
            setIsUploadOpen(false);
            setUploadFile(null);
            setUploadType("");
            setUploadExpiry("");
            setUploadNotes("");
            toast({ title: "Success", description: "Document uploaded and attached successfully." });

        } catch (error) {
            console.error("Upload failed", error);
            toast({ title: "Error", description: "Failed to upload document. Please try again.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const mapTypeToRole = (type: string): DocumentRole => {
        switch (type) {
            case "CDL": return DocumentRole.OperatorLicense;
            case "Medical Card": return DocumentRole.MedicalCard;
            case "MVR": return DocumentRole.MVR;
            case "Drug Test Result": return DocumentRole.DrugTestResult;
            case "Training Certificate": return DocumentRole.TrainingCertificate;
            case "Road Test": return DocumentRole.RoadTest;
            case "Social Security Card": return DocumentRole.SocialSecurityCard;
            case "Application": return DocumentRole.Application;
            case "Contract": return DocumentRole.Contract;
            default: return DocumentRole.Other;
        }
    };

    const handleDelete = async (doc: OperatorDocumentDto) => {
        if (confirm("Are you sure you want to remove this document?")) {
            try {
                await operatorsApi.detachDocument(driver.id, doc.id);
                setDocuments(prev => prev.filter(d => d.id !== doc.id));
                toast({ title: "Success", description: "Document removed." });
            } catch (error) {
                console.error("Failed to delete document", error);
                toast({ title: "Error", description: "Could not remove document.", variant: "destructive" });
            }
        }
    };

    const COMMON_DOC_TYPES = [
        "CDL", "Medical Card", "MVR", "Drug Test Result", "Training Certificate",
        "Road Test", "Social Security Card", "Application", "Contract", "Other"
    ];

    if (loading) return <div className="p-8 text-center text-gray-500">Loading documents...</div>;

    return (
        <div className="space-y-8">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search documents..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto gap-2">
                    <Plus className="h-4 w-4" /> Upload Document
                </Button>
            </div>

            {/* Document Groups */}
            <div className="space-y-8">
                {/* Mandatory */}
                <section>
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Mandatory</h3>
                        <span className="text-red-500 text-sm font-medium">* Required for compliance</span>
                    </div>
                    {groupedDocs.Mandatory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedDocs.Mandatory.map(doc => (
                                <DocumentCard key={doc.id} doc={doc} onView={(d) => setPreviewDoc(d)} onDelete={handleDelete} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded border border-dashed text-center">
                            No mandatory documents found.
                        </div>
                    )}
                </section>

                {/* Agreements */}
                {groupedDocs.Agreements.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Agreements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedDocs.Agreements.map(doc => (
                                <DocumentCard key={doc.id} doc={doc} onView={(d) => setPreviewDoc(d)} onDelete={handleDelete} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Background Screenings */}
                {groupedDocs.Background.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Background Screenings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedDocs.Background.map(doc => (
                                <DocumentCard key={doc.id} doc={doc} onView={(d) => setPreviewDoc(d)} onDelete={handleDelete} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Training */}
                {groupedDocs.Training.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Training & Certifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedDocs.Training.map(doc => (
                                <DocumentCard key={doc.id} doc={doc} onView={(d) => setPreviewDoc(d)} onDelete={handleDelete} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Other */}
                {groupedDocs.Other.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Other Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedDocs.Other.map(doc => (
                                <DocumentCard key={doc.id} doc={doc} onView={(d) => setPreviewDoc(d)} onDelete={handleDelete} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Document Preview Modal */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b shrink-0">
                        <DialogTitle>{previewDoc?.docKind || "Document Preview"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden bg-gray-100 p-4 relative">
                        {previewDoc && (
                            <DocumentPreview
                                fileUrl={previewDoc.fileUrl}
                                fileName={previewDoc.fileUrl?.split('/').pop() || 'Document'}
                                fileType={previewDoc.fileType || (previewDoc.fileUrl?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')}
                                className="h-full w-full rounded-md shadow-sm bg-white"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Upload Modal (Reused) */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Document File <span className="text-red-500">*</span></label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                />
                                {uploadFile ? (
                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                        <FileText className="h-5 w-5" />
                                        <span className="font-medium">{uploadFile.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Click to select or drag file here</p>
                                        <p className="text-xs opacity-70 mt-1">PDF, PNG, JPG (Max 10MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select value={uploadType} onValueChange={setUploadType}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        {COMMON_DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expiration</label>
                                <Input type="date" value={uploadExpiry} onChange={(e) => setUploadExpiry(e.target.value)} />
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleUpload} disabled={!uploadFile}>
                            Upload
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
