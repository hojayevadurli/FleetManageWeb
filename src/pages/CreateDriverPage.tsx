import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverForm } from "@/components/drivers/DriverForm";
import { LicensePreview } from "@/components/drivers/LicensePreview";

export default function CreateDriverPage() {
    const navigate = useNavigate();
    // Lifting state for preview if needed, or just let Form handle it?
    // User wants LicensePreview on the right.
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/app/drivers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
                    <p className="text-gray-500 text-sm">Create a new driver profile or add a candidate.</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN - FORM */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <DriverForm
                        mode="create"
                        onCancel={() => navigate("/app/drivers")}
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
                    />
                </div>
            </div>
        </div>
    );
}
