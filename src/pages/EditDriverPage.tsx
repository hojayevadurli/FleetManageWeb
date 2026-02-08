import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverForm } from "@/components/drivers/DriverForm";
import { LicensePreview } from "@/components/drivers/LicensePreview";
import { driversApi } from "@/lib/driversApi";
import { Driver } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function EditDriverPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);

    // New uploads
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);

    // Existing doc URLs (in a real app, you'd fetch documents separately or include in driver payload)
    // For MOCK, I'll simulate by fetching documents or just using placeholders if driver has data.
    // The MOCK_DOCUMENTS array in driversApi has fileUrls.
    const [existingDocs, setExistingDocs] = useState<{ front?: string, back?: string }>({});

    useEffect(() => {
        if (!id) return;
        const fetchDriver = async () => {
            try {
                const data = await driversApi.getDriverById(id);
                if (!data) {
                    toast({ title: "Error", description: "Driver not found", variant: "destructive" });
                    navigate("/app/drivers");
                    return;
                }
                setDriver(data);

                // Fetch docs to populate preview
                const docs = await driversApi.getDriverDocuments(id);
                // Simple logic to find front/back based on type or filename
                const front = docs.find(d => d.docType === 'CDL' || d.fileName.toLowerCase().includes('front'));
                const back = docs.find(d => d.fileName.toLowerCase().includes('back'));

                setExistingDocs({
                    front: front?.fileUrl,
                    back: back?.fileUrl
                });

            } catch (error) {
                console.error("Failed to fetch driver", error);
                toast({ title: "Error", description: "Could not load driver details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchDriver();
    }, [id, navigate, toast]);

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
                        existingFrontUrl={existingDocs.front}
                        existingBackUrl={existingDocs.back}
                    />
                </div>
            </div>
        </div>
    );
}
