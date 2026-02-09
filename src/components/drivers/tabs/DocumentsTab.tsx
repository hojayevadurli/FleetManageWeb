import { useState, useEffect, useMemo } from "react";
import { OperatorDto, OperatorDocumentDto } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, Download, AlertCircle, Upload, Search, Filter, Plus, Calendar, MoreVertical, RefreshCw, Trash2, Eye } from "lucide-react";
import { DocumentPreview } from "../DocumentPreview";
import { useToast } from "@/hooks/use-toast";

interface DocumentsTabProps {
    driver: OperatorDto;
}

export function DocumentsTab({ driver }: DocumentsTabProps) {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<OperatorDocumentDto[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedDoc, setSelectedDoc] = useState<OperatorDocumentDto | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Upload State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState("");
    const [uploadExpiry, setUploadExpiry] = useState("");
    const [uploadNotes, setUploadNotes] = useState("");

    useEffect(() => {
        if (driver.documents) {
            setDocuments(driver.documents);
            if (driver.documents.length > 0) setSelectedDoc(driver.documents[0]);
        }
        setLoading(false);
    }, [driver]);

    // Filtering Logic
    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const fileName = doc.fileUrl ? doc.fileUrl.split('/').pop() || 'Document' : 'Document';
            const matchesSearch = fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.docKind || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === "all" || doc.docKind === typeFilter;
            // Status logic if doc.status is string
            const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [documents, searchTerm, typeFilter, statusFilter]);

    // Unique Doc Types for Dropdown
    const docTypes = useMemo(() => {
        const types = new Set(documents.map(d => d.docKind).filter(Boolean));
        return Array.from(types).sort();
    }, [documents]);

    const handleUpload = async () => {
        toast({ title: "Not Supported", description: "Document upload requires backend update for attachment creation.", variant: "destructive" });
        setIsUploadOpen(false);
    };

    const handleDelete = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to remove this document?")) {
            try {
                await operatorsApi.detachDocument(driver.id, docId);
                setDocuments(prev => prev.filter(d => d.id !== docId));
                if (selectedDoc?.id === docId) setSelectedDoc(null);
                toast({ title: "Success", description: "Document removed." });
            } catch (error) {
                console.error("Failed to delete document", error);
                toast({ title: "Error", description: "Could not remove document.", variant: "destructive" });
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading documents...</div>;

    const COMMON_DOC_TYPES = [
        "CDL", "Medical Card", "MVR", "Drug Test Result", "Training Certificate",
        "Road Test", "Social Security Card", "Application", "Other"
    ];

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search documents..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <span>{typeFilter === "all" ? "All Types" : typeFilter}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {docTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] bg-white">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                                <span>{statusFilter === "all" ? "All Status" : statusFilter}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Valid">Valid</SelectItem>
                            <SelectItem value="Expiring">Expiring</SelectItem>
                            <SelectItem value="Expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button className="gap-2 shrink-0" onClick={() => setIsUploadOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Upload Document
                </Button>
            </div>

            {/* Upload Dialog Overlay */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle>Upload Document</CardTitle>
                            <CardDescription>Attach a new document to {driver.firstName}'s profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    <label className="text-sm font-medium">Document Type <span className="text-red-500">*</span></label>
                                    <Select value={uploadType} onValueChange={setUploadType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMON_DOC_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Expiration Date</label>
                                    <Input
                                        type="date"
                                        value={uploadExpiry}
                                        onChange={(e) => setUploadExpiry(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes (Optional)</label>
                                <Input
                                    placeholder="Add any relevant details..."
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
                                <Button onClick={handleUpload} disabled={!uploadFile || !uploadType || isUploading}>
                                    {isUploading ? "Uploading..." : "Save Document"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-300px)] min-h-[600px]">
                {/* Left Panel: Document List */}
                <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
                    {filteredDocs.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                            <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
                            <p>No documents found</p>
                        </div>
                    ) : (
                        filteredDocs.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={`
                                    group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all relative
                                    ${selectedDoc?.id === doc.id
                                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className={`mt-1 h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${selectedDoc?.id === doc.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`text-sm font-semibold truncate ${selectedDoc?.id === doc.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                            {doc.docType}
                                        </h4>
                                        <Badge variant="outline" className={`
                                            text-[10px] px-1.5 h-5
                                            ${doc.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                doc.status === 'Expiring' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-red-50 text-red-700 border-red-200'}
                                        `}>
                                            {doc.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-2">{doc.fileName}</p>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            <span>{doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString() : 'No Expiry'}</span>
                                        </div>
                                        {doc.daysUntilExpiration && (
                                            <span className={doc.daysUntilExpiration < 30 ? 'text-amber-600 font-medium' : ''}>
                                                {doc.daysUntilExpiration} days left
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Menu */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Replace logic */ }}>
                                                <RefreshCw className="mr-2 h-4 w-4" /> Replace
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl, '_blank'); }}>
                                                <Download className="mr-2 h-4 w-4" /> Download
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(doc.id, e)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Panel: Preview */}
                <div className="lg:col-span-7 h-full flex flex-col">
                    {selectedDoc ? (
                        <DocumentPreview
                            fileUrl={selectedDoc.fileUrl}
                            fileName={selectedDoc.fileName}
                            fileType={selectedDoc.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'}
                            className="h-full border border-gray-200 rounded-lg overflow-hidden"
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <div className="text-center text-gray-400">
                                <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Select a document to view preview</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
