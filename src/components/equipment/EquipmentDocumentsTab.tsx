import React, { useState } from 'react';
import { Equipment, EquipmentDocRole, EquipmentDocument } from '@/lib/types';
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
import { toast } from 'sonner';
import DocumentUploadModal from './DocumentUploadModal';

interface EquipmentDocumentsTabProps {
    equipment: Equipment;
    onRefresh: () => void;
}

const EquipmentDocumentsTab: React.FC<EquipmentDocumentsTabProps> = ({ equipment, onRefresh }) => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const documents = equipment.documents || [];

    // Group documents by role
    const groupedDocs = documents.reduce((acc, doc) => {
        const role = doc.docRole;
        if (!acc[role]) acc[role] = [];
        acc[role].push(doc);
        return acc;
    }, {} as Record<number, EquipmentDocument[]>);

    // Defined roles order for display
    const displayRoles = [
        EquipmentDocRole.Registration,
        EquipmentDocRole.Insurance,
        EquipmentDocRole.Title,
        EquipmentDocRole.DOTInspection,
        EquipmentDocRole.Warranty,
        EquipmentDocRole.Lease,
        EquipmentDocRole.General,
        EquipmentDocRole.Other
    ];

    const getRoleName = (role: EquipmentDocRole) => {
        switch (role) {
            case EquipmentDocRole.Registration: return 'Registration';
            case EquipmentDocRole.Title: return 'Title';
            case EquipmentDocRole.Insurance: return 'Insurance';
            case EquipmentDocRole.Warranty: return 'Warranty';
            case EquipmentDocRole.Lease: return 'Lease';
            case EquipmentDocRole.DOTInspection: return 'DOT Inspection';
            case EquipmentDocRole.General: return 'General';
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
            await equipmentApi.deleteDocument(equipment.id, docId);
            toast.success("Document deleted");
            onRefresh();
        } catch (err) {
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

            {documents.length === 0 ? (
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {roleDocs.map(doc => {
                                            const expStatus = getExpirationStatus(doc.expirationDate);
                                            return (
                                                <div key={doc.id} className="group relative bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-blue-100 transition-all">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleView(doc.fileUrl)}>
                                                                    <Eye className="w-4 h-4 mr-2" /> View
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleView(doc.fileUrl)}>
                                                                    <Download className="w-4 h-4 mr-2" /> Download
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => handleDelete(doc.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="space-y-1 mb-3">
                                                        <p
                                                            className="font-bold text-slate-900 truncate cursor-pointer hover:text-blue-600 hover:underline decoration-blue-200 underline-offset-4"
                                                            title={doc.fileUrl.split('/').pop()}
                                                            onClick={() => handleView(doc.fileUrl)}
                                                        >
                                                            {doc.fileUrl.split('/').pop() || 'Document'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">Uploaded {new Date(doc.addedAt).toLocaleDateString()}</p>
                                                    </div>

                                                    {doc.expirationDate && (
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide w-fit border ${expStatus.color}`}>
                                                            {expStatus.status === 'expired' ? <AlertTriangle className="w-3 h-3" /> :
                                                                expStatus.status === 'warning' ? <Clock className="w-3 h-3" /> :
                                                                    <CheckCircle2 className="w-3 h-3" />}
                                                            {expStatus.label}
                                                        </div>
                                                    )}

                                                    {doc.vendorNameRaw && (
                                                        <div className="mt-2 text-xs text-slate-500 italic truncate">
                                                            Note: {doc.vendorNameRaw}
                                                        </div>
                                                    )}
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
                onUploadComplete={() => {
                    onRefresh();
                }}
            />
        </div>
    );
};

export default EquipmentDocumentsTab;
