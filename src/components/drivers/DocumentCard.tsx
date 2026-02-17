import { OperatorDocumentDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
    doc: OperatorDocumentDto;
    onView: (doc: OperatorDocumentDto) => void;
    onDelete: (doc: OperatorDocumentDto) => void;
}

export function DocumentCard({ doc, onView, onDelete }: DocumentCardProps) {
    const isExpired = doc.status === 'Expired';
    const isExpiring = doc.status === 'Expiring';
    const isValid = doc.status === 'Valid';

    const getDisplayName = () => {
        // AI result might be "unknown" or empty
        if (doc.docKind && doc.docKind.toLowerCase() !== "unknown") {
            return doc.docKind;
        }
        // Fallback to role with spaces (e.g. MedicalCard -> Medical Card)
        if (doc.role) {
            return doc.role.replace(/([A-Z])/g, ' $1').trim();
        }
        return "Document";
    };

    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-900">{getDisplayName()}</h3>
                    {/* @ts-ignore - notes property might be missing in DTO details but present in object */}
                    {doc.notes && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Note
                        </span>
                    )}
                </div>
                <Badge variant="outline" className={cn(
                    "text-[10px] px-2 py-0.5 border",
                    isValid && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    isExpiring && "bg-amber-50 text-amber-700 border-amber-200",
                    isExpired && "bg-red-50 text-red-700 border-red-200",
                    !doc.status && "bg-gray-50 text-gray-600 border-gray-200"
                )}>
                    {doc.status || "Unknown"}
                </Badge>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700 w-24">Expiration Date:</span>
                    <span className={cn(
                        doc.expirationDate && isExpired ? "text-red-600 font-medium" : "",
                        doc.expirationDate && isExpiring ? "text-amber-600 font-medium" : ""
                    )}>
                        {doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString() : "No Expiry"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700 w-24">Uploaded:</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="pt-3 mt-auto flex items-center justify-between border-t gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-400 truncate max-w-[120px]" title={doc.fileUrl.split('/').pop()}>
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{doc.fileUrl.split('/').pop()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(doc); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onView(doc)}>
                        <Eye className="h-3 w-3 mr-1.5" />
                        View File
                    </Button>
                </div>
            </div>
        </div>
    );
}
