import React, { useState, useEffect, useCallback } from 'react';
import { Equipment, DocumentRole, EquipmentDocument } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Download, Trash2, Eye, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { equipmentApi } from '@/lib/equipmentApi';
import { documentsApi, DocumentDto } from '@/lib/documentsApi';
import { toast } from 'sonner';
import DocumentUploadModal from './DocumentUploadModal';

interface EquipmentDocumentsTabProps {
    equipment: Equipment;
    onRefresh: () => void;
}

const EquipmentDocumentsTab: React.FC<EquipmentDocumentsTabProps> = ({ equipment, onRefresh }) => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [docs, setDocs] = useState<EquipmentDocument[]>(equipment.documents || []);
    const [loading, setLoading] = useState(false);

    // Map string docKind to Enum role
    const mapKindToRole = (kind: string): DocumentRole | null => {
        const k = kind?.toLowerCase();
        if (!k) return null;

        // Exact matches or known keywords
        if (k === 'registration' || k.includes('registration')) return DocumentRole.Registration;
        if (k === 'title' || k.includes('title')) return DocumentRole.Title;
        if (k === 'insurance' || k.includes('insurance')) return DocumentRole.Insurance;
        if (k === 'warranty' || k.includes('warranty')) return DocumentRole.Warranty;
        if (k === 'lease' || k.includes('lease')) return DocumentRole.Lease;
        if (k === 'inspection' || k === 'dotinspection' || k.includes('dot') || k.includes('inspection')) return DocumentRole.DOTInspection;
        if (k === 'scale_ticket' || k.includes('scale')) return DocumentRole.ScaleTicket;
        if (k === 'general' || k.includes('general')) return DocumentRole.General;
        if (k === 'other') return DocumentRole.Other;

        // Handle stringified enum values (new values 10-16)
        if (k === '10') return DocumentRole.Insurance;
        if (k === '11') return DocumentRole.Registration;
        if (k === '12') return DocumentRole.Title;
        if (k === '13') return DocumentRole.Warranty;
        if (k === '14') return DocumentRole.Lease;
        if (k === '15') return DocumentRole.DOTInspection;
        if (k === '16') return DocumentRole.ScaleTicket;

        // Legacy enum values (1-7) for backward compatibility
        if (k === '0') return DocumentRole.General;
        if (k === '1') return DocumentRole.Registration;
        if (k === '2') return DocumentRole.Title;
        if (k === '3') return DocumentRole.Insurance;
        if (k === '4') return DocumentRole.Warranty;
        if (k === '5') return DocumentRole.Lease;
        if (k === '6') return DocumentRole.Other;
        if (k === '7') return DocumentRole.DOTInspection;

        return null;
    };

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch the full equipment details to get the authoritative list of documents
            const eq = await equipmentApi.get(equipment.id);

            if (eq && eq.documents) {
                const mapped: EquipmentDocument[] = eq.documents.reduce((acc, d) => {
                    // Handle docRole if it comes as a string or number. 
                    // We try to use the direct docRole if it matches the enum, otherwise try to map from string.
                    let role: DocumentRole | null = null;

                    if (typeof d.docRole === 'number') {
                        role = d.docRole as DocumentRole;
                    } else if (typeof d.docRole === 'string') {
                        // Attempt to parse string/enum name
                        role = mapKindToRole(d.docRole);
                    } else if ((d as any).docKind) {
                        // Fallback to docKind if docRole is missing (legacy DTO support)
                        role = mapKindToRole((d as any).docKind);
                    }

                    if (role !== null) {
                        acc.push({
                            ...d,
                            docRole: role,
                            // Ensure dates are stringified if they aren't already
                            startDate: d.startDate,
                            expirationDate: d.expirationDate,
                            vendorNameRaw: d.vendorNameRaw
                        });
                    }
                    return acc;
                }, [] as EquipmentDocument[]);

                setDocs(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch documents", err);
        } finally {
            setLoading(false);
        }
    }, [equipment.id]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Group documents by role
    const groupedDocs = docs.reduce((acc, doc) => {
        const role = doc.docRole;
        if (!acc[role]) acc[role] = [];
        acc[role].push(doc);
        return acc;
    }, {} as Record<number, EquipmentDocument[]>);

    // Defined roles order for display
    const displayRoles = [
        DocumentRole.Registration,
        DocumentRole.Insurance,
        DocumentRole.Title,
        DocumentRole.DOTInspection,
        DocumentRole.Warranty,
        DocumentRole.Lease,
        DocumentRole.ScaleTicket,
        DocumentRole.General,
        DocumentRole.Other
    ];

    const getRoleName = (role: DocumentRole) => {
        switch (role) {
            case DocumentRole.Registration: return 'Registration';
            case DocumentRole.Title: return 'Title';
            case DocumentRole.Insurance: return 'Insurance';
            case DocumentRole.Warranty: return 'Warranty';
            case DocumentRole.Lease: return 'Lease';
            case DocumentRole.DOTInspection: return 'DOT Inspection';
            case DocumentRole.ScaleTicket: return 'Scale Ticket';
            case DocumentRole.General: return 'General';
            default: return 'Other';
        }
    };

    const getExpirationStatus = (dateStr?: string) => {
        if (!dateStr) return { status: 'none', label: '', color: 'bg-slate-100 text-slate-500' };

        const date = parseISO(dateStr);
        const days = differenceInDays(date, new Date());

        if (days < 0) return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' };
        if (days <= 30) return { status: 'warning', label: `Exp in ${days}d`, color: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { status: 'valid', label: 'Valid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    };

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        setDeletingId(docId);
        try {
            await documentsApi.delete(docId);
            toast.success("Document deleted");
            fetchDocuments();
            onRefresh();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to delete document");
        } finally {
            setDeletingId(null);
        }
    };

    const handleView = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Equipment Documents</h3>
                    <p className="text-sm text-slate-500">Manage registration, insurance, and other files.</p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Upload Document
                </Button>
            </div>

            {loading && docs.length === 0 ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading documents...</p>
                </div>
            ) : docs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="font-bold text-slate-900">No documents yet</h4>
                    <p className="text-sm text-slate-500 mb-6">Upload registration, insurance, or general files.</p>
                    <Button variant="outline" onClick={() => setIsUploadOpen(true)}>Upload Now</Button>
                </div>
            ) : (
                <Accordion type="multiple" defaultValue={displayRoles.map(String)} className="space-y-4">
                    {displayRoles.map(role => {
                        const roleDocs = groupedDocs[role];
                        if (!roleDocs || roleDocs.length === 0) return null;

                        return (
                            <AccordionItem key={role} value={String(role)} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                                <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <FileText className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="font-black text-slate-800 text-lg">{getRoleName(role)}</span>
                                        <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-500">{roleDocs.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {roleDocs.map(doc => {
                                            // Helper to format date for display or return placeholder
                                            const formatDateDisplay = (dateStr?: string) => {
                                                if (!dateStr) return '-';
                                                try {
                                                    return format(parseISO(dateStr), 'MM/dd/yyyy');
                                                } catch (e) {
                                                    return dateStr;
                                                }
                                            };

                                            const expStatus = getExpirationStatus(doc.expirationDate);

                                            return (
                                                <div key={doc.documentId} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                                                    {/* Header: Icon, Name, Actions */}
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <div className="flex items-center justify-between">
                                                                <h4
                                                                    className="font-bold text-slate-900 text-sm truncate pr-2 cursor-pointer hover:text-blue-600 hover:underline decoration-blue-200 underline-offset-4"
                                                                    onClick={() => handleView(doc.fileUrl)}
                                                                >
                                                                    {doc.fileUrl.split('/').pop() || 'Document'}
                                                                </h4>
                                                                <div className="flex items-center">
                                                                    <button onClick={() => handleView(doc.fileUrl)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-slate-400">
                                                                                <MoreVertical className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => handleView(doc.fileUrl)}>
                                                                                <Download className="w-4 h-4 mr-2" /> Download
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-red-600 focus:text-red-600"
                                                                                onClick={() => handleDelete(doc.documentId)}
                                                                            >
                                                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Uploaded {new Date(doc.addedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Fields Grid */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* Document Type */}
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 block">Document Type</label>
                                                            <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700">
                                                                {getRoleName(doc.docRole)}
                                                            </div>
                                                        </div>

                                                        {/* Notes / Details */}
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 block">Notes / Details</label>
                                                            <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 truncate" title={doc.vendorNameRaw || ''}>
                                                                {doc.vendorNameRaw || '-'}
                                                            </div>
                                                        </div>

                                                        {/* Issue Date */}
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 block">Issue Date</label>
                                                            <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 flex items-center justify-between">
                                                                {formatDateDisplay(doc.startDate)}
                                                                {doc.startDate && <Clock className="w-3 h-3 text-slate-400" />}
                                                            </div>
                                                        </div>

                                                        {/* Expiration Date */}
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 block">Expiration Date</label>
                                                            <div className={`border rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between ${expStatus.status === 'valid' ? 'bg-slate-50 border-slate-200 text-slate-700' :
                                                                expStatus.status === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                                    expStatus.status === 'expired' ? 'bg-red-50 border-red-200 text-red-700' :
                                                                        'bg-slate-50 border-slate-200 text-slate-700'
                                                                }`}>
                                                                <span>{formatDateDisplay(doc.expirationDate)}</span>
                                                                {doc.expirationDate && (
                                                                    expStatus.status === 'valid' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> :
                                                                        expStatus.status === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-500" /> :
                                                                            <AlertTriangle className="w-3 h-3 text-red-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            <DocumentUploadModal
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                equipmentId={equipment.id}
                assetType={equipment.type === 'Trailer' ? 'trailer' : 'truck'}
                onUploadComplete={() => {
                    fetchDocuments();
                    onRefresh();
                }}
            />
        </div>
    );
};

export default EquipmentDocumentsTab;
