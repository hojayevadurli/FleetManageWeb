import { useState, useEffect } from "react";
import { Driver, DriverDocument } from "@/lib/types";
import { driversApi } from "@/lib/driversApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, AlertCircle, Upload, CheckCircle } from "lucide-react";

interface DocumentsTabProps {
    driver: Driver;
}

export function DocumentsTab({ driver }: DocumentsTabProps) {
    const [documents, setDocuments] = useState<DriverDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDocs = async () => {
            try {
                const docs = await driversApi.getDriverDocuments(driver.id);
                setDocuments(docs);
            } catch (err) {
                console.error("Failed to load documents", err);
            } finally {
                setLoading(false);
            }
        };
        loadDocs();
    }, [driver.id]);

    if (loading) return <div className="p-4 text-center">Loading documents...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Driver Documents</h3>
                <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                </Button>
            </div>

            {documents.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No documents found for this driver.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map(doc => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <Badge variant={
                                        doc.status === 'Valid' ? 'secondary' :
                                            doc.status === 'Expired' ? 'destructive' : 'outline'
                                    } className={doc.status === 'Valid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                        {doc.status}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-3 text-base">{doc.docType}</CardTitle>
                                <CardDescription className="line-clamp-1">{doc.fileName}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Expires</span>
                                        <span className={doc.daysUntilExpiration && doc.daysUntilExpiration < 30 ? 'text-amber-600 font-bold' : 'font-medium'}>
                                            {doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    {doc.daysUntilExpiration && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {doc.daysUntilExpiration < 0 ? (
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Expired {Math.abs(doc.daysUntilExpiration)} days ago
                                                </span>
                                            ) : (
                                                <span className={doc.daysUntilExpiration < 30 ? 'text-amber-600' : 'text-emerald-600'}>
                                                    {doc.daysUntilExpiration} days remaining
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
