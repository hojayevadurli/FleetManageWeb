import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverForm } from "@/components/drivers/DriverForm";
import { LicensePreview } from "@/components/drivers/LicensePreview";
import { operatorsApi } from "@/lib/operatorsApi";
import { OperatorDto, OperatorDocumentDto } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function EditDriverPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [driver, setDriver] = useState<OperatorDto | null>(null);
    const [loading, setLoading] = useState(true);

    // New uploads
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);

    // Existing doc URLs from backend
    const [existingDocs, setExistingDocs] = useState<{ front?: OperatorDocumentDto, back?: OperatorDocumentDto }>({});

    useEffect(() => {
        if (!id) return;
        const fetchDriver = async () => {
            try {
                const data = await operatorsApi.getById(id);
                if (!data) {
                    toast({ title: "Error", description: "Driver not found", variant: "destructive" });
                    navigate("/app/drivers");
                    return;
                }
                setDriver(data);

                // Fetch attachments separately since documents is not included in getById
                try {
                    const attachments = await operatorsApi.getAttachments(id);
                    console.log("Fetched attachments:", attachments);

                    if (attachments && attachments.length > 0) {
                        // Improved matching: check docKind and title
                        const front = attachments.find(d =>
                            d.docKind === 'license' && (
                                d.title?.toLowerCase().includes('front') ||
                                d.title?.toLowerCase().includes('driver license (front)')
                            )
                        ) || attachments.find(d => d.fileUrl?.toLowerCase().includes('front'));

                        const back = attachments.find(d =>
                            d.docKind === 'license' && (
                                d.title?.toLowerCase().includes('back') ||
                                d.title?.toLowerCase().includes('driver license (back)')
                            )
                        ) || attachments.find(d => d.fileUrl?.toLowerCase().includes('back'));

                        console.log("Matched front doc:", front);
                        console.log("Matched back doc:", back);

                        setExistingDocs({
                            front: front,
                            back: back
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch attachments", err);
                }

            } catch (error) {
                console.error("Failed to fetch driver", error);
                toast({ title: "Error", description: "Could not load driver details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchDriver();
    }, [id, navigate, toast]);

    const handleRemoveDocument = async (side: 'front' | 'back') => {
        // If it's a new file, just clear it
        if (side === 'front' && licenseFront) {
            setLicenseFront(null);
            toast({ title: "Removed", description: "Front license file removed." });
            return;
        }
        if (side === 'back' && licenseBack) {
            setLicenseBack(null);
            toast({ title: "Removed", description: "Back license file removed." });
            return;
        }

        // If it's an existing document, detach it
        const doc = side === 'front' ? existingDocs.front : existingDocs.back;
        if (doc && driver) {
            try {
                await operatorsApi.detachDocument(driver.id, doc.id);
                toast({ title: "Success", description: `${side === 'front' ? 'Front' : 'Back'} license detached successfully.` });

                // Update local state
                setExistingDocs(prev => ({
                    ...prev,
                    [side]: undefined
                }));
            } catch (error) {
                console.error("Failed to detach document", error);
                toast({ title: "Error", description: "Could not remove document.", variant: "destructive" });
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!driver) return null;

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to={`/app/drivers/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Driver: {driver.firstName} {driver.lastName}</h1>
                    <p className="text-gray-500 text-sm">Update driver profile and compliance information.</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN - FORM */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <DriverForm
                        mode="edit"
                        initialData={driver}
                        onCancel={() => navigate(`/app/drivers/${id}`)}
                        onLicenseUpload={(f, b) => {
                            setLicenseFront(f);
                            setLicenseBack(b);
                        }}
                    />
                </div>

                {/* RIGHT COLUMN - PREVIEW */}
                <div className="hidden lg:block col-span-5 sticky top-6">
                    <LicensePreview
                        frontFile={licenseFront}
                        backFile={licenseBack}
                        existingFrontUrl={existingDocs.front?.fileUrl}
                        existingBackUrl={existingDocs.back?.fileUrl}
                        onRemove={handleRemoveDocument}
                    />
                </div>
            </div>
        </div>
    );
}
